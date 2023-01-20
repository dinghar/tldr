const { wordsToNumbers } = require("words-to-numbers");

function parseParams(params) {
  const cleanedString = stringToNum(params);
  console.log(cleanedString);
  const milliseconds = cleanedString
    .match(/\d+\s?\w/g)
    .reduce((acc, cur, i) => {
      var multiplier = 1000;
      switch (cur.slice(-1)) {
        case "h":
          multiplier *= 60;
        case "m":
          multiplier *= 60;
        case "s":
          return (parseInt(cur) ? parseInt(cur) : 0) * multiplier + acc;
      }
      return acc;
    }, 0);
  console.log(milliseconds);
}

function stringToNum(text) {
  return wordsToNumbers(text);
}

module.exports = { parseParams };
