export async function fetchHistory(client, channel, oldest, maxMessageCount) {
  const history = await client.conversations.history({
    channel: channel,
    oldest: oldest,
    limit: maxMessageCount,
  });
  return history;
}
