export function generateTimeConstraint(milliseconds) {
  const TWENTY_FOUR_HOURS_IN_MILLISECONDS = 24 * 60 * 60 * 1000;
  const timeFilter = milliseconds
    ? milliseconds
    : TWENTY_FOUR_HOURS_IN_MILLISECONDS;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const oldest = ((new Date() as any) - timeFilter) / 1000;
  return oldest;
}

export function sortMessages(messages) {
  const sortedMessages = messages.sort((a, b) => a.ts - b.ts);
  return sortedMessages;
}
