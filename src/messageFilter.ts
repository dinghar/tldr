export function filterMessages(messages, hours = 3, messageCount = 50) {
  const TWENTY_FOUR_HOURS = hours * 60 * 60;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const now = (new Date() as any) / 1000;
  const recentMessages = messages.filter(
    (message) => message.ts > now - TWENTY_FOUR_HOURS
  );

  while (recentMessages.length > messageCount) {
    recentMessages.pop();
  }

  return recentMessages;
}

export function sortMessages(messages) {
  const sortedMessages = messages.sort((a, b) => a.ts - b.ts);
  return sortedMessages;
}
