export function generateConstraintString(maxMessages, startDate) {
  return (
    `\n\n_**` +
    `This summary was generated using up to ${maxMessages} messages since ${startDate}. ` +
    "You can pass time constraints by saying things like `/tldr two hours` or `/tldr the last day`" +
    `**_`
  );
}

export function generateSummaryPreviewText(summary, constraintString) {
  return `Here's the tldr:\n*${summary}*` + constraintString;
}

export function cleanTipFromString(string) {
  return string.replace(new RegExp(/\n_\*\*.+\*\*_/), "");
}
