const { App } = require("@slack/bolt");
const { filterMessages, sortMessages } = require("./messageFilter");
const { formatTranscript } = require("./transcriptFormatter");
const { generateSummary } = require("./openaiClient");
const { default: axios } = require("axios");
require("dotenv").config();

// Initializes your app with your bot token and signing secret
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: true,
  appToken: process.env.SLACK_APP_TOKEN,
});

app.command("/tldr", async ({ command, ack, client }) => {
  try {
    await ack();
    generateTldr(client, command.user_id, command.channel_id);
  } catch (error) {
    console.error(error);
  }
});

async function generateTldr(client, userId, channelId) {
  const history = await client.conversations.history({
    channel: channelId,
  });

  const filteredMessages = filterMessages(history.messages, 1000);
  const sortedMessages = sortMessages(filteredMessages);

  const userIds = new Set();
  const identities = [];

  for (const message of sortedMessages) {
    userIds.add(message.user);
  }

  const promises = [];
  for (const userId of userIds) {
    const promise = new Promise((resolve) => {
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
      const summaryText = `Here's the tldr:\n${summary}`;
      client.chat.postEphemeral({
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: summaryText,
            },
          },
          {
            type: "actions",
            elements: [
              {
                type: "button",
                text: {
                  type: "plain_text",
                  text: "Send to channel",
                },
                value: summaryText,
                action_id: "send_summary_click",
              },
              {
                type: "button",
                text: {
                  type: "plain_text",
                  text: "Cancel",
                },
                action_id: "cancel_summary_click",
              },
            ],
          },
        ],
        text: "Here's the tldr...",
        user: userId,
        channel: channelId,
      });
    });
  });
}

app.action("send_summary_click", async ({ body, action, ack, say }) => {
  await ack();
  axios.post(body.response_url, {
    delete_original: true,
  });
  say(action.value);
});

app.action("cancel_summary_click", async ({ body, ack }) => {
  await ack();
  axios.post(body.response_url, {
    delete_original: true,
  });
});

(async () => {
  // Start your app
  await app.start(process.env.PORT || 3000);

  console.log("⚡️ Bolt app is running!");
})();
