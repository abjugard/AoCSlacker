const { fetchNamesAndScores } = require("./adventofcode.js");
const fs = require("fs");
const _ = require("lodash");
const { promisify } = require("util");
const request = require("request");

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

var SLACK_URL_TOKEN = process.env.SLACK_URL_TOKEN;
var LEADERBOARD_ID = process.env.LEADERBOARD_ID;
var SESSION_COOKIE = process.env.SESSION_COOKIE;

const formatBody = list => "```" + list.map(item => `${_.padStart(item.position, 2)}: ${item.name} - ${item.score} - ${item.change}`).join("\n") + "```";

const fileName = __dirname + "/last.json";
console.log(fileName);

fetchNamesAndScores(LEADERBOARD_ID, SESSION_COOKIE).then(namesAndScores => {
  console.log(namesAndScores)

  const totalList = namesAndScores.map(
    ([name, score], index) => ({ name, score, position: index + 1 })
  )

  const list = totalList.slice(0, 25)

  const url = "https://adventofcode.com/2019/leaderboard/private/view/" + LEADERBOARD_ID;

  readFile(fileName, "utf8")
    .catch(() => "[]")
    .then(raw => JSON.parse(raw))
    .then(last => {
      if (!_.isEqual(last, list)) {

        const comparedList = toComparedList(list, last)

        const payload = {
          text: `${url}\n` + formatBody(comparedList),
          username: "Advent of Code",
          icon_url: "https://adventofcode.com/favicon.png"
        };

        const options = {
          url: SLACK_URL_TOKEN,
          body: JSON.stringify(payload)
        };

        console.log(options.body)
        writeFile(fileName, JSON.stringify(comparedList)).then(() => {
          request.post(options);
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
        return { ...p, change: '↑' };
      }
      else if (currPos > lastEntryOfPerson.position) {
        return { ...p, change: '↓' };
      }
    }
    return { ...p, change: '-' };
  });
}

