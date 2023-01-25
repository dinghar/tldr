import { formatTranscript } from "./transcriptFormatter";
import { generateSummaryPreviewText } from "./utils/strings";
import { fetchAISummary } from "./openaiClient";
import { generateTimeConstraint, sortMessages } from "./slack/history";
import { parseParams } from "./utils/parse-params";
import { sendInvalidTimeframeResponse, sendSummaryPreview } from "./slack/chat";
import { formatDate } from "./utils/date-formatter";
import { generateConstraintString } from "./utils/strings";

export async function processTldrRequest(command, client, userId, channelId) {
  try {
    const timeframe = parseParams(command.text);
    if (timeframe === 0) {
      sendInvalidTimeframeResponse(client, command);
      return;
    }
    const oldest = generateTimeConstraint(timeframe);
    const maxMessages = 200;
    const startDate = formatDate(oldest * 1000);
    const constraintString = generateConstraintString(maxMessages, startDate);

    const history = await client.conversations.history({
      channel: channelId,
      oldest: oldest,
      limit: maxMessages,
    });

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

export function generateSummaryTranscript(
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
