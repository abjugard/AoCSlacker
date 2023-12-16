const {fetchNamesAndScores, dayLeaderboard} = require("./adventofcode.js");
const fs = require("fs");
const _ = require("lodash");
const {promisify} = require("util");
const axios = require("axios");

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

const SLACK_URL_TOKEN = process.env.SLACK_URL_TOKEN;
const LEADERBOARD_ID = process.env.LEADERBOARD_ID;
const SESSION_COOKIE = process.env.SESSION_COOKIE;
const YEAR = process.env.YEAR;
const DEBUG = (process.env.DEBUG ?? false) == '1';

const columnDefinitions = list => {
  const scoreLen = longestProp(list, 'score');
  const globalScoreLen = longestProp(list, 'globalScore');
  return [
    { prop: 'position', padder: _.padStart },
    { prop: 'change', empty: ' ' },
    { prop: 'name', label: 'Name', paddingOverride: scoreLen-5, maxWidth: 17-globalScoreLen },
    { prop: 'score', label: 'Score', width: scoreLen, padder: _.padStart },
    { prop: 'globalScore', label: ' 🌐', padder: _.padStart }
  ].map(c => ({ ...c, padder: (c.padder ?? _.padEnd), maxWidth: (c.maxWidth ?? 100)}));
}

const formatHeader = cols => {
  const legend = cols
    .map(c => _.padEnd(c.label, c.width + (c.paddingOverride ?? 0)))
    .join(' ');
  return {title: `Leaderboard ${YEAR}: Top 25`, legend};
}

const formatBody = (cols, list) => {
  const trimmedValue = (value, maxWidth) => {
    const origValue = String(value);
    if (origValue.length > maxWidth) {
      return origValue.substring(0, maxWidth - 1) + '…';
    }
    return origValue;
  };
  return list
    .map(entry => cols
      .map(c => c.padder(trimmedValue(entry[c.prop] || c.empty || '-', c.maxWidth), c.width))
      .join(' ')
    );
}

const formatLeaderboard = list => {
  const columns = columnDefinitions(list)
    .filter(c => longestProp(list, c.prop))
    .map(c => ({ ...c, width: _.max([(c.width || c.label?.length) ?? 1, Math.min(c.maxWidth, longestProp(list, c.prop))]) }));
  const { title, legend } = formatHeader(columns);
  const body = formatBody(columns, list);
  const separator = '━'.repeat(body[0].length);
  const leaderboard = "```" + [legend, separator, body.join(' \n')].join('\n') + "```";

  return { title, leaderboard };
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

  const total = formatLeaderboard(comparedList);

  const payloadTotalLeaderboard = {
    username: "Advent of Code",
    text: total.title + ' - ' + leaderboardUrl,
    icon_url: "https://adventofcode.com/favicon.png",
    attachments: [{text: total.leaderboard}]
  };

  const solves = dayLeaderboard(leaderboard);

  const solvePayloads = solves.leaderboards
    .map((text) => ({
      username: "Advent of Code",
      text: solves.title,
      icon_url: "https://adventofcode.com/favicon.png",
      attachments: [{text}]
    }));

  if (DEBUG) {
    console.log(total.title);
    console.log(total.leaderboard);

    console.log(solves.title);
    for (board of solves.leaderboards) {
      console.log(board);
    }
    writeFile(fileName, JSON.stringify(comparedList));
  } else {
    writeFile(fileName, JSON.stringify(comparedList))
      .then(() => {
        axios.post(SLACK_URL_TOKEN, payloadTotalLeaderboard).then(_ => {
          solvePayloads.forEach(payload => axios.post(SLACK_URL_TOKEN, payload))
        });
      });
  }
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

