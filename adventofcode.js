const request = require("request");
const _ = require("lodash");

const fetchNamesAndScores = (leaderBoardId, sessionCookie) =>
  new Promise((resolve, reject) => {
    if (!leaderBoardId) {
      reject("No leaderBoardId provided");
    }

    const url = "https://adventofcode.com/2018/leaderboard/private/view/" + leaderBoardId + ".json";

    request({ url, headers: { Cookie: `session=${sessionCookie}` } }, function (error, response, body) {
      if (error) {
        return reject(error);
      }

      const json = JSON.parse(body)
      const memberMap = json.members;
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
      const maxScoreLength = _.maxBy(scores, s => new String(s).length).length;

      const paddedScores = scores.map(score =>
        _.padStart(score, maxScoreLength)
      );


      entries = _.zip(paddedNames, paddedScores)
      const sortedEntries = _.sortBy(entries, e => -e[1])

      resolve(sortedEntries);
    });
  });

exports.fetchNamesAndScores = fetchNamesAndScores;
