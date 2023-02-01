export function sendSummaryPreview(client, userId, channelId, text) {
  client.chat.postEphemeral({
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: text,
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
            value: text,
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
}

export function sendSummary(say, text) {
  say({
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: text,
        },
      },
    ],
  });
}

export function sendInvalidTimeframeResponse(client, command) {
  sendBasicMessage(
    client,
    command,
    "Sorry, I didn't understand that timeframe. Please use a format like '1d' or '2 hours'"
  );
}

export function sendEmptyTimeframeResponse(client, command) {
  sendBasicMessage(
    client,
    command,
    "Please pass a timeframe, like '1d' or '2 hours'"
  );
}

export function sendEmptyMessagesResponse(client, command) {
  sendBasicMessage(
    client,
    command,
    "No messages found for the timeframe you entered."
  );
}

function sendBasicMessage(client, command, text: string) {
  client.chat.postEphemeral({
    channel: command.channel_id,
    user: command.user_id,
    text: text,
  });
}
