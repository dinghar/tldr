export function sendSummaryPreview(client, userId, channelId, summaryText) {
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
}
