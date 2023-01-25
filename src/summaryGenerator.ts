import { formatTranscript } from "./transcriptFormatter";
import { generateSummaryPreviewText } from "./utils/strings";
import { fetchAISummary } from "./openaiClient";
import { fetchHistory } from "./slack/history";
import { parseParams } from "./utils/parse-params";
import { sendInvalidTimeframeResponse, sendSummaryPreview } from "./slack/chat";
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

    let oldest = generateTimeConstraint(timeframe);
    const maxMessages = 200;
    let retryCount = 7;
    let history;

    // TODO: This all does not currently work, need to debug

    /* 
      Fetch history, then check if the message array is empty. If so, and
      if no timeframe was passed, retry day by day up to one week.
     */
    do {
      history = await fetchHistory(client, channelId, oldest, maxMessages);
      oldest = (oldest - MILLISECONDS_PER_DAY) / 1000;
      retryCount--;
    } while (!timeframe && history.messages.count === 0 && retryCount);

    const startDate = formatDate(oldest * 1000);
    const constraintString = generateConstraintString(maxMessages, startDate);

    // TODO determine if this can be removed or worked around
    const sortedMessages = sortMessages(history.messages);
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
    if (messages.count === 0) {
      resolveWholeFn("No messages found for the timeframe you entered");
    }
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
