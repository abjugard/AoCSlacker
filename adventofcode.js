const request = require("request");
const _ = require("lodash");

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

      const rawLeadboard = JSON.parse(body)
      const memberMap = rawLeadboard.members;
      const members = Object.values(memberMap)
      const names = members.map(o => {
        if (o.name) {
          return o.name
        } else {
          return o.id
        }
      })
      const maxNameLength = _.maxBy(names, n => n.length);
      // Pad names so scores right align
      const paddedNames = names.map(name => _.padEnd(name, maxNameLength));
      const scores = members.map(m => m.local_score)
      const maxScoreLength = _.maxBy(scores, s => String(s).length).length;

      const paddedScores = scores.map(score =>
        _.padStart(score, maxScoreLength)
      );


      entries = _.zip(paddedNames, paddedScores)
      const sortedEntries = _.sortBy(entries, e => -e[1])

      resolve({sortedEntries, leaderboard: rawLeadboard});
    });
  });

exports.fetchNamesAndScores = fetchNamesAndScores;

const dayLeaderboard = (leaderboard) => {
  const positions = {
    1: 1,
    2: 1,
  };

  var day = new Date().getDate();
  /* Credit to https://github.com/lindskogen/ for "magic script" */
  const entries = Object.values(leaderboard.members)
    .filter((member) => member.completion_day_level[day] != null)
    .flatMap((member) =>
      Object.entries(member.completion_day_level[day]).map(([starIdx, star]) =>
        mapData(starIdx, star, member.name, day)
      )
    )
    .sort((left, right) => left.ts - right.ts)
    .map((data) => {
      const position = ("   " + positions[data.starIdx]).slice(-3);
      positions[data.starIdx] += 1;
      return formatEntry(data, position);
    });

  const header = [
    `Leaderboard day ${day}: Solve Times`,
    'Time       | ★ | Pos | Name',
    '-----------------------------------'
  ].join('\n');

  return entries
    .reduce((acc, raw_entry) => {
      const last = acc[acc.length - 1];
      const entry = '\n' + raw_entry;

      if ((last + entry).length > 2994) {
        acc.push(header + entry);
      } else {
        acc.splice(acc.length - 1, 1, last + entry);
      }

      return acc;
    }, [header])
    .map(message => '```' + message + '```');
}

const mapData = (starIdx, star, name, challengeDay) => {
  const date = new Date(+star.get_star_ts * 1000);
  const dateOffset = date.getDate() - challengeDay;
  const offsetString = dateOffset > 0 ? `+${dateOffset}` : "  ";
  const time = formattedTime(date) + offsetString;
  const ts = +star.get_star_ts;
  return {ts, time, starIdx, name};
};

const formattedTime = (date) => {
  const hours = date.getHours() < 10 ? "0" + date.getHours() : date.getHours();
  const minutes = "0" + date.getMinutes();
  const seconds = "0" + date.getSeconds();
  return hours + ":" + minutes.substr(-2) + ":" + seconds.substr(-2);
};

const formatEntry = ({time, starIdx, name}, position) =>
  `${time} | ${starIdx} | ${position} | ${name}`;

exports.dayLeaderboard = dayLeaderboard;
