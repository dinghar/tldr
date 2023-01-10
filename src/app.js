const { App } = require("@slack/bolt");
const { filterMessages, sortMessages } = require("./messageFilter");
const { formatTranscript } = require("./transcriptFormatter");
const { generateSummary } = require("./openaiClient");
require("dotenv").config();

// Initializes your app with your bot token and signing secret
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: true,
  appToken: process.env.SLACK_APP_TOKEN,
});

app.message("tldr", async ({ message, client, say }) => {
  const history = await client.conversations.history({
    channel: message.channel,
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
      client.chat.postEphemeral({
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `Here's the tldr: ${summary}`,
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
        text: "Here's the tldr",
        user: message.user,
        channel: message.channel,
      });
    });
  });
});

app.action("send_summary_click", async ({ body, ack, say, client }) => {
  await ack();
  console.log(body);
  console.log(body.container.message_ts);
  console.log(body.container.channel_id);
  client.chat.update({
    ts: body.container.message_ts,
    channel: body.container.channel_id,
    reply_broadcast: true,
  });
});

app.action(
  "cancel_summary_click",
  async ({ body, ack, say, payload, action, client }) => {}
);

(async () => {
  // Start your app
  await app.start(process.env.PORT || 3000);

  console.log("⚡️ Bolt app is running!");
})();
