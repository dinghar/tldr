export function formatTranscript(messages, identities) {
  let transcriptString = "";

  for (let i = 0; i < messages.length; i++) {
    const userId = messages[i].user;
    const userName = identities.find(
      (identity) => identity.userId === userId
    ).name;
    const transcriptLine = `${userName}: ${messages[i].text}`;
    transcriptString += transcriptLine + "\n";
  }

  return transcriptString;
}
