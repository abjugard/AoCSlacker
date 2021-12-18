const {fetchNamesAndScores, dayLeaderboard} = require("./adventofcode.js");
const fs = require("fs");
const _ = require("lodash");
const {promisify} = require("util");
const request = require("request");
const fileName = __dirname + "/last.json";

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

var SLACK_URL_TOKEN = process.env.SLACK_URL_TOKEN;
var LEADERBOARD_ID = process.env.LEADERBOARD_ID;
var SESSION_COOKIE = process.env.SESSION_COOKIE;
var YEAR = process.env.YEAR;

const formatBody = (list, namePadding, globalPadding) => `\`\`\`
Leaderboard ${YEAR}: Top 25
Pos   ${_.padEnd("Name", namePadding)} Score ${_.padEnd("🌐", globalPadding)}
------${ _.repeat("-", namePadding)  }-------${_.repeat("-", globalPadding) }
${list.map(item => `${_.padStart(item.position, 3)} ${item.change} ${_.padEnd(item.name, namePadding)} ${_.padStart(item.score, 5)} ${_.padStart(item.globalScore === 0 ? "-" : item.globalScore, globalPadding)}`).join("\n")}\`\`\``;

const longestProperty = (list, prop) => {
  return _.max(list.map(item => item[prop].toString().length));
}


fetchNamesAndScores(LEADERBOARD_ID, SESSION_COOKIE, YEAR).then(({sortedEntries: namesAndScores, leaderboard}) => {
  const totalList = namesAndScores.map(
    ([name, score, globalScore], index) => ({name, score, position: index + 1, globalScore})
  )

  const list = totalList.slice(0, 25);

  const leaderboardUrl = `https://adventofcode.com/${YEAR}/leaderboard/private/view/${LEADERBOARD_ID}`;

  readFile(fileName, "utf8")
    .catch(() => "[]")
    .then(JSON.parse)
    .then(previousLeaderboard => {
      if (!_.isEqual(previousLeaderboard, list)) {
        updateLeaderboard(leaderboardUrl, list, previousLeaderboard, leaderboard);
      }
    });
});

const updateLeaderboard = (leaderboardUrl, list, previousLeaderboard, leaderboard) => {
  const comparedList = toComparedList(list, previousLeaderboard)

  const payloadTotalLeaderboard = {
    text: `${leaderboardUrl}\n` + formatBody(comparedList, Math.max(longestProperty(comparedList, "name"), 4), Math.max(longestProperty(comparedList, "globalScore"), 2)),
    username: "Advent of Code - Total",
    icon_url: "https://adventofcode.com/favicon.png"
  };

  const optionsTotal = {
    url: SLACK_URL_TOKEN,
    body: JSON.stringify(payloadTotalLeaderboard)
  };

  const dailyMessages = dayLeaderboard(leaderboard);

  const dailyOptions = dailyMessages
    .map((text) => ({
      url: SLACK_URL_TOKEN,
      body: JSON.stringify({
        text,
        username: "Advent of Code - Daily",
        icon_url: "https://adventofcode.com/favicon.png"
      })
    }));

  writeFile(fileName, JSON.stringify(comparedList)).then(() => {
    request.post(optionsTotal, undefined, () => {
      dailyOptions.forEach(options => request.post(options));
    });
  });
}

toComparedList = (list, last) => {
  return list.map(p => {
    const currPos = p.position;
    const lastEntryOfPerson = last.find(item => item.name === p.name);
    if (lastEntryOfPerson) {
      if (currPos < lastEntryOfPerson.position) {
        return {...p, change: '↑'};
      } else if (currPos > lastEntryOfPerson.position) {
        return {...p, change: '↓'};
      }
    }
    return {...p, change: ' '};
  });
}

