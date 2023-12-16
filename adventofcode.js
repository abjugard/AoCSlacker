const request = require("request");
const _ = require("lodash");
const maxMessageLength = 2900;

const positionCounter = {
  1: 1,
  2: 1,
};

const columnDefinitions = [
  { prop: 'time', label: 'Time' },
  { prop: 'starIdx', label: '*' },
  { prop: 'position', label: '#' },
  { prop: 'name', label: 'Name', noPad: true}
]

const formatHeader = (cols) => {
  const legend = cols
    .map(c => _.padEnd(c.label, c.width))
    .join(' ┃ ');
  const separator = Array(legend.length + 1).join('━');
  return [legend.trim(), separator].join(' \n');
}

const formatLine = cols => entry => cols
  .map(c => c.noPad ? entry[c.prop] : _.padEnd(entry[c.prop], c.width))
  .join(' ┃ ');

const longestProp = (list, prop) => _.max(list.map(item => item[prop]?.toString().length ?? 0));

const fetchNamesAndScores = (leaderBoardId, sessionCookie, year) =>
  new Promise((resolve, reject) => {
    if (!leaderBoardId) {
      reject("No leaderBoardId provided");
    }

    const url = `https://adventofcode.com/${year}/leaderboard/private/view/${leaderBoardId}.json`;

    request({url, headers: {Cookie: `session=${sessionCookie}`}}, function (error, response, body) {
      if (error) {
        return reject(error);
      }

      const rawLeadboard = JSON.parse(body);

      const members = Object.values(rawLeadboard.members);
      const entries = members.map(m => ([m.name ?? m.id, m.local_score, m.global_score || '']));
      const sortedEntries = _.sortBy(entries, e => -e[1]);

      resolve({sortedEntries, leaderboard: rawLeadboard});
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
    .map(c => ({ ...c, width: _.max([c.label.length, longestProp(rawData, c.prop)]) }));
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
