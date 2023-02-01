import dotenv from "dotenv";
dotenv.config();
import { App, BlockAction, ButtonAction } from "@slack/bolt";
import axios from "axios";
import { sendSummary } from "./slack/chat";
import { cleanTipFromString } from "./utils/strings";
import { processTldrRequest } from "./summaryGenerator";

const isSocketMode = process.env.SOCKET_MODE === "true";
const config = isSocketMode
  ? {
      token: process.env.SLACK_BOT_TOKEN,
      signingSecret: process.env.SLACK_SIGNING_SECRET,
      appToken: process.env.SLACK_APP_TOKEN,
      socketMode: isSocketMode,
    }
  : {
      token: process.env.SLACK_BOT_TOKEN,
      signingSecret: process.env.SLACK_SIGNING_SECRET,
    };

const app = new App(config);

app.command("/tldr", async ({ command, ack, client }) => {
  try {
    await ack();
    processTldrRequest(command, client, command.user_id, command.channel_id);
  } catch (error) {
    console.error(error);
  }
});

app.action("send_summary_click", async ({ body, action, ack, say }) => {
  await ack();
  body = body as BlockAction;
  action = action as ButtonAction;
  axios.post(body.response_url, {
    delete_original: true,
  });
  const cleanedString = cleanTipFromString(action.value);
  sendSummary(say, cleanedString);
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
