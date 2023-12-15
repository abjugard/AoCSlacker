const {fetchNamesAndScores, dayLeaderboard} = require("./adventofcode.js");
const fs = require("fs");
const _ = require("lodash");
const {promisify} = require("util");
const request = require("request");

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

const SLACK_URL_TOKEN = process.env.SLACK_URL_TOKEN;
const LEADERBOARD_ID = process.env.LEADERBOARD_ID;
const SESSION_COOKIE = process.env.SESSION_COOKIE;
const YEAR = process.env.YEAR;

const columnDefinitions = [
  { prop: 'position', label: 'Pos', padder: _.padStart },
  { prop: 'change' },
  { prop: 'name', label: 'Name' },
  { prop: 'score', label: 'Score', padder: _.padStart },
  { prop: 'globalScore', label: '🌐', padder: _.padStart }
].map(c => ({ ...c, padder: (c.padder ?? _.padEnd)}));

const formatHeader = cols => {
  const legend = cols
    .map(c => _.padEnd(c.label, c.width))
    .join(' ');
  const separator = Array(legend.length).join('━');
  return [`Leaderboard ${YEAR}: Top 25`, legend, separator].join('\n');
}

const formatBody = (cols, list) => {
  return list
    .map(entry => cols
      .map(c => c.padder(entry[c.prop], c.width))
      .join(' ')
    ).join('\n');
}

const formatLeaderboard = list => {
  const columns = columnDefinitions
    .map(c => ({ ...c, width: _.max([c.label?.length ?? 0, longestProp(list, c.prop)]) }));
  const header = formatHeader(columns);
  const body = formatBody(columns, list);

  return ["```", header, body, "```"].join('\n');
}

const longestProp = (list, prop) => _.max(list.map(item => item[prop].toString().length));

fetchNamesAndScores(LEADERBOARD_ID, SESSION_COOKIE, YEAR).then(({sortedEntries: namesAndScores, leaderboard}) => {
  const totalList = namesAndScores.map(
    ([name, score, globalScore], index) => ({name, score, position: index + 1, globalScore})
  )

  const list = totalList.slice(0, 25);

  const leaderboardUrl = `https://adventofcode.com/${YEAR}/leaderboard/private/view/${LEADERBOARD_ID}`;

  const fileName = __dirname + `/${LEADERBOARD_ID}.json`;
  readFile(fileName, "utf8")
    .catch(() => "[]")
    .then(JSON.parse)
    .then(previousLeaderboard => {
      if (!_.isEqual(previousLeaderboard, list)) {
        updateLeaderboard(leaderboardUrl, list, previousLeaderboard, leaderboard, fileName);
      }
    });
});

const updateLeaderboard = (leaderboardUrl, list, previousLeaderboard, leaderboard, fileName) => {
  const comparedList = toComparedList(list, previousLeaderboard);

  const lb = formatLeaderboard(comparedList);

  const payloadTotalLeaderboard = {
    text: "Leaderboard",
    username: "Advent of Code - Total",
    icon_url: "https://adventofcode.com/favicon.png",
    attachments: [{text: `${leaderboardUrl}\n` + lb}]
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
        text: "Solve times",
        username: "Advent of Code - Daily",
        icon_url: "https://adventofcode.com/favicon.png",
        attachments: [{text}]
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
    return {...p, change: ''};
  });
}

