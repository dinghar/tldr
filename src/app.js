const { App } = require("@slack/bolt");
const { filterMessages, sortMessages } = require("./messageFilter");
const { formatTranscript } = require("./transcriptFormatter");
require("dotenv").config();

// Initializes your app with your bot token and signing secret
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: true,
  appToken: process.env.SLACK_APP_TOKEN,
});

app.message("tldr", async ({ message, client, logger }) => {
  console.log("-------------start--------------");
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
    console.log(transcript);
    console.log("-------------end--------------");
  });
});

(async () => {
  // Start your app
  await app.start(process.env.PORT || 3000);

  console.log("⚡️ Bolt app is running!");
})();
