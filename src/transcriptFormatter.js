function formatTranscript(messages, identities) {
  let transcriptString = "";

  for (let i = 0; i < messages.length; i++) {
    let userId = messages[i].user;
    let userName = identities.find(
      (identity) => identity.userId === userId
    ).name;
    const transcriptLine = `${userName}: ${messages[i].text}`;
    transcriptString += transcriptLine + "\n";
  }

  return transcriptString;
}

module.exports = { formatTranscript };
