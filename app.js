const {fetchNamesAndScores, dayLeaderboard} = require("./adventofcode.js");
const fs = require("fs");
const _ = require("lodash");
const {promisify} = require("util");
const request = require("request");

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

var SLACK_URL_TOKEN = process.env.SLACK_URL_TOKEN;
var LEADERBOARD_ID = process.env.LEADERBOARD_ID;
var SESSION_COOKIE = process.env.SESSION_COOKIE;
var YEAR = process.env.YEAR;

const formatBody = (list, namePadding) => `\`\`\`
Leaderboard ${YEAR}: Top 25
Pos | ${_.padEnd("Name", namePadding)} | Score | Change
------------------------------------------
${list.map(item => `${_.padStart(item.position, 3)} | ${_.padEnd(item.name, namePadding)} | ${_.padStart(item.score, 5)} | ${item.change}`).join("\n")}\`\`\``;

const longestName = list => {
  return _.maxBy(list, item => item.name.length).name.length;
}

const fileName = __dirname + "/last.json";

fetchNamesAndScores(LEADERBOARD_ID, SESSION_COOKIE, YEAR).then(({sortedEntries: namesAndScores, leaderboard}) => {
  const totalList = namesAndScores.map(
    ([name, score], index) => ({name, score, position: index + 1})
  )

  const list = totalList.slice(0, 25);

  const leaderboardUrl = `https://adventofcode.com/${YEAR}/leaderboard/private/view/${LEADERBOARD_ID}`;

  readFile(fileName, "utf8")
    .catch(() => "[]")
    .then(raw => JSON.parse(raw))
    .then(last => {
      if (!_.isEqual(last, list)) {

        const comparedList = toComparedList(list, last)

        const payloadTotalLeaderboard = {
          text: `${leaderboardUrl}\n` + formatBody(comparedList, longestName(comparedList)),
          username: "Advent of Code - Total",
          icon_url: "https://adventofcode.com/favicon.png"
        };

        const optionsTotal = {
          url: SLACK_URL_TOKEN,
          body: JSON.stringify(payloadTotalLeaderboard)
        };

        const dailyMessages = dayLeaderboard(leaderboard);

        const dailyOptions = dailyMessages
          .map((message) => ({
            url: SLACK_URL_TOKEN,
            body: JSON.stringify({
              text: message,
              username: "Advent of Code - Daily",
              icon_url: "https://adventofcode.com/favicon.png"
            })
          }));

        writeFile(fileName, JSON.stringify(comparedList)).then(() => {
          request.post(optionsTotal, undefined, () => {
            dailyOptions.forEach(options => request.post(options));
          })
        });
      }
    });
});

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
    return {...p, change: '-'};
  });
}

