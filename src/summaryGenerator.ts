import { formatTranscript } from "./transcriptFormatter";
import { generateSummaryPreviewText } from "./utils/strings";
import { fetchAISummary } from "./openaiClient";
import { fetchHistory } from "./slack/history";
import { parseParams } from "./utils/parse-params";
import {
  sendEmptyMessagesResponse,
  sendEmptyTimeframeResponse,
  sendInvalidTimeframeResponse,
  sendSummaryPreview,
} from "./slack/chat";
import { formatDate } from "./utils/date-formatter";
import { generateConstraintString } from "./utils/strings";
import { MILLISECONDS_PER_DAY } from "./constants";

export async function processTldrRequest(command, client, userId, channelId) {
  try {
    const timeframe = parseParams(command.text);

    // Handle invalid params
    if (timeframe === 0) {
      sendInvalidTimeframeResponse(client, command);
      return;
    }

    // Handle lack of params
    if (!timeframe) {
      sendEmptyTimeframeResponse(client, command);
      return;
    }

    const oldest = generateTimeConstraint(timeframe);
    const maxMessages = 200;
    const history = await fetchHistory(client, channelId, oldest, maxMessages);

    const messages = history.messages;

    if (!messages || messages.length === 0) {
      sendEmptyMessagesResponse(client, command);
      return;
    }

    const startDate = formatDate(oldest * 1000);
    const constraintString = generateConstraintString(maxMessages, startDate);

    const sortedMessages = sortMessages(messages);
    const transcript = await generateSummaryTranscript(
      sortedMessages,
      client,
      constraintString
    );

    sendSummaryPreview(client, userId, channelId, transcript);
  } catch (err) {
    console.error(err);
  }
}

function generateSummaryTranscript(
  messages,
  client,
  constraintString
): Promise<string> {
  return new Promise((resolveWholeFn) => {
    const userIds = new Set();
    const identities = [];

    for (const message of messages) {
      userIds.add(message.user);
    }

    const promises = [];
    for (const userId of userIds) {
      const promise = new Promise<void>((resolveInnerFn) => {
        client.users.profile.get({ user: userId }).then((userObj) => {
          identities.push({
            userId: userId,
            name: userObj.profile.real_name,
          });
          resolveInnerFn();
        });
      });
      promises.push(promise);
    }

    Promise.all(promises).then(() => {
      const transcript = formatTranscript(messages, identities);
      fetchAISummary(transcript).then((summary) => {
        const summaryText = generateSummaryPreviewText(
          summary,
          constraintString
        );
        resolveWholeFn(summaryText);
      });
    });
  });
}

export function generateTimeConstraint(milliseconds) {
  const timeFilter = milliseconds ? milliseconds : MILLISECONDS_PER_DAY;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const oldest = ((new Date() as any) - timeFilter) / 1000;
  return oldest;
}

export function sortMessages(messages) {
  const sortedMessages = messages.sort((a, b) => a.ts - b.ts);
  return sortedMessages;
}
