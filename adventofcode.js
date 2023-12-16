const axios = require("axios");
const _ = require("lodash");
const maxMessageLength = 2900;

const positionCounter = {
  1: 1,
  2: 1,
};

const columnDefinitions = [
  { prop: 'time', label: 'Time' },
  { prop: 'name', label: 'Name', maxWidth: 15 },
  // { prop: 'starIdx', label: '*' },
  { prop: 'position', label: ' 🏆', padder: _.padStart }
].map(c => ({ ...c, padder: (c.padder ?? _.padEnd), maxWidth: (c.maxWidth ?? 100)}))

const formatHeader = (cols) => {
  const legend = cols
    .map(c => _.padEnd(c.label, c.width))
    .join(' ');
  const separator = Array(legend.length).join('━');
  return [legend.trim(), separator].join('  \n');
}

const trimmedValue = (value, maxWidth) => {
  const origValue = String(value);
  if (origValue.length > maxWidth) {
    return origValue.substring(0, maxWidth - 1) + '…';
  }
  return origValue;
};

const formatLine = cols => entry => cols
  .map(c => c.padder(trimmedValue(entry[c.prop], c.maxWidth), c.width))
  .join(' ');

const longestProp = (list, prop) => _.max(list.map(item => item[prop]?.toString().length ?? 0));

const fetchNamesAndScores = (leaderBoardId, sessionCookie, year) =>
  new Promise((resolve, reject) => {
    if (!leaderBoardId) {
      reject("No leaderBoardId provided");
    }

    const url = `https://adventofcode.com/${year}/leaderboard/private/view/${leaderBoardId}.json`;
    axios({
      url,
      method: 'get',
      headers: {Cookie: `session=${sessionCookie}`}
    }).then(({ data }) => {
      const members = Object.values(data.members);
      const entries = members.map(m => ([m.name ?? m.id, m.local_score, m.global_score || '']));
      const sortedEntries = _.sortBy(entries, e => -e[1]);

      resolve({sortedEntries, leaderboard: data});
    });
  });

exports.fetchNamesAndScores = fetchNamesAndScores;

const dayLeaderboard = (leaderboard) => {
  const today = new Date();
  const day = today.getDate();
  const year = today.getFullYear();
  /* Credit to https://github.com/lindskogen/ for "magic script" */
  const rawData = Object.values(leaderboard.members)
    .filter((member) => member.completion_day_level[day] != null)
    .flatMap((member) =>
      Object.entries(member.completion_day_level[day]).map(([starIdx, star]) =>
        mapData(starIdx, star, member.name, day)
      )
    )
    .sort((left, right) => left.ts - right.ts)
    .map(mapPosition);

  const columns = columnDefinitions
    .map(c => ({ ...c, width: _.max([c.label.length, Math.min(longestProp(rawData, c.prop), c.maxWidth)]) }));
  const title = `Leaderboard ${year}: Day ${day} solve times`;
  const header = formatHeader(columns, day);

  const leaderboards =  rawData
    .map(formatLine(columns))
    .reduce((acc, line) => {
      const last = acc[acc.length - 1];
      const entry = '\n' + line;

      if ((last + entry).length > maxMessageLength) {
        acc.push(header + entry);
      } else {
        acc.splice(acc.length - 1, 1, last + entry);
      }

      return acc;
    }, [header])
    .map(message => '```' + message + '```');
  return {title, leaderboards};
}

exports.dayLeaderboard = dayLeaderboard;

const mapData = (starIdx, star, name, challengeDay) => {
  const date = new Date(+star.get_star_ts * 1000);
  const time = formattedTime(date, challengeDay);
  const ts = +star.get_star_ts;
  return {ts, time, starIdx, name};
};

const mapPosition = (data) => {
  const position = positionCounter[data.starIdx];
  positionCounter[data.starIdx] += 1;
  return {...data, position}
}

const formattedTime = (date, challengeDay) => {
  const hours = date.getHours() < 10 ? "0" + date.getHours() : date.getHours();
  const minutes = "0" + date.getMinutes();
  const seconds = "0" + date.getSeconds();
  const dateOffset = date.getDate() - challengeDay;
  let result = hours + ":" + minutes.substr(-2) + ":" + seconds.substr(-2);
  if (dateOffset > 0) {
    result += '+' + dateOffset;
  }
  return result;
};
