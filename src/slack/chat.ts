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
  client.chat.postEphemeral({
    channel: command.channel_id,
    user: command.user_id,
    text: "Sorry, I didn't understand that timeframe. Please use a format like '1d' or '2 hours'",
  });
}
