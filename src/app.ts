import { App, BlockAction, ButtonAction } from "@slack/bolt";
import { generateTimeConstraint, sortMessages } from "./messageFilter";
import { formatTranscript } from "./transcriptFormatter";
import { generateSummary } from "./openaiClient";
import { default as axios } from "axios";
import { parseParams } from "./parseParams";
import dotenv from "dotenv";
import { sendSummaryPreview } from "./responseGenerator";
dotenv.config();

// Initializes your app with your bot token and signing secret
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  appToken: process.env.SLACK_APP_TOKEN,
  socketMode: true,
});

app.command("/tldr", async ({ command, ack, client }) => {
  try {
    await ack();
    const timeframe = parseParams(command.text);
    if (timeframe === 0) {
      client.chat.postEphemeral({
        channel: command.channel_id,
        user: command.user_id,
        text: "Sorry, I didn't understand that timeframe. Please use a format like '1d' or '2 hours'",
      });
      return;
    }
    generateTldr(timeframe, client, command.user_id, command.channel_id);
  } catch (error) {
    console.error(error);
  }
});

async function generateTldr(timeframe, client, userId, channelId) {
  try {
    const oldest = generateTimeConstraint(timeframe);
    const maxMessages = 500;
    const history = await client.conversations.history({
      channel: channelId,
      oldest: oldest,
      limit: maxMessages,
    });

    const startDate = new Date(oldest * 1000).toLocaleDateString("en-us", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "numeric",
    });

    const constraintString =
      `\n\n**` +
      `This summary was generated using up to ${maxMessages} messages since ${startDate}. ` +
      "You can pass time constraints by saying things like `/tldr two hours` or `/tldr the last day`" +
      `**`;

    // TODO: Track constraints and communicate them to the user (maybe just in the ephemeral message?)

    const sortedMessages = sortMessages(history.messages);

    const userIds = new Set();
    const identities = [];

    for (const message of sortedMessages) {
      userIds.add(message.user);
    }

    const promises = [];
    for (const userId of userIds) {
      const promise = new Promise<void>((resolve) => {
        client.users.profile.get({ user: userId }).then((userObj) => {
          identities.push({ userId: userId, name: userObj.profile.real_name });
          resolve();
        });
      });
      promises.push(promise);
    }

    Promise.all(promises).then(() => {
      const transcript = formatTranscript(sortedMessages, identities);
      generateSummary(transcript).then((summary) => {
        const summaryText = `Here's the tldr:\n${summary}` + constraintString;
        sendSummaryPreview(client, userId, channelId, summaryText);
      });
    });
  } catch (err) {
    console.error(err);
  }
}

app.action("send_summary_click", async ({ body, action, ack, say }) => {
  await ack();
  body = body as BlockAction;
  action = action as ButtonAction;
  axios.post(body.response_url, {
    delete_original: true,
  });
  const cleanedString = action.value.replace(new RegExp(/\*\*.+\*\*/), "");
  say(cleanedString);
});

app.action("cancel_summary_click", async ({ body, ack }) => {
  await ack();
  body = body as BlockAction;
  axios.post(body.response_url, {
    delete_original: true,
  });
});

(async () => {
  // Start your app
  await app.start(process.env.PORT || 3000);

  console.log("⚡️ Bolt app is running!");
})();
