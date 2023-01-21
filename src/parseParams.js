const { wordsToNumbers } = require("words-to-numbers");

function parseParams(params) {
  const cleanedString = stringToNum(params);
  const cleanedNumbers = cleanedString.match(/\d+\s?\w/g);
  if (!cleanedNumbers) {
    return null;
  }
  const milliseconds = cleanedNumbers.reduce((acc, cur, i) => {
    var multiplier = 1000;
    switch (cur.slice(-1)) {
      case "w":
        multiplier *= 7;
      case "d":
        multiplier *= 24;
      case "h":
        multiplier *= 60;
      case "m":
        multiplier *= 60;
      case "s":
        return (parseInt(cur) ? parseInt(cur) : 0) * multiplier + acc;
    }
    return acc;
  }, 0);
  return milliseconds;
}

function stringToNum(text) {
  const cleanedString = handleNonNumericInputs(text);
  return wordsToNumbers(cleanedString);
}

function handleNonNumericInputs(text) {
  const regex =
    /((?<=\W|^)(the\s(last)?|a|an)\s(?=(hour|minute|day|week)(?!\d)))/i;
  const cleanedString = text.replace(regex, "1 ");

  return cleanedString;
}

module.exports = { parseParams };
