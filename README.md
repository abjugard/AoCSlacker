# AoC-Slacker

Notify slack channel with advent of code leaderboard

Crontab syntax to run every Monday at 12:00

```bash
# m h  dom mon dow   command
0 12 * * 1 SESSION_COOKIE='xyz' LEADERBOARD_ID='xxxxx' SLACK_URL_TOKEN='https://hooks.slack.com/services/xxx/xxx/xxx' YEAR='xxxx' /usr/bin/node /home/aoc-slacker/app.js
```

## Example output

### Total

```md
Leaderboard 2020: Top 25
Pos | Name | Score | Change
------------------------------------------
 1 | Person |  4730 | -
 2 | Person |  4683 | -
 3 | Person |  4624 | -
 4 | Person |  4518 | -
 5 | Person |  4258 | -
 6 | Person |  4218 | -
 7 | Person |  4201 | -
 8 | Person |  4144 | -
 9 | Person |  4010 | -
10 | Person |  3929 | -
11 | Person |  3911 | -
12 | Person |  3898 | -
13 | Person |  3651 | -
14 | Person |  3468 | -
15 | Person |  3400 | -
16 | Person |  3350 | -
17 | Person |  3335 | -
18 | Person |  3310 | -
19 | Person |  3238 | -
20 | Person |  2922 | -
21 | Person |  2798 | -
22 | Person |  2671 | -
23 | Person |  2664 | -
24 | Person |  2526 | -
25 | Person |  2214 | -
```
### Daily

```md
Leaderboard day 25: Solve Times
Time       | ★ | Pos | Name
------------------------------
06:17:13   | 1 |   1 | Person
06:17:17   | 2 |   1 | Person
06:22:08   | 1 |   2 | Person
06:22:53   | 2 |   2 | Person
07:56:28   | 1 |   3 | Person
07:57:48   | 2 |   3 | Person
08:06:00   | 1 |   4 | Person
08:06:06   | 2 |   4 | Person
08:36:20   | 1 |   5 | Person
08:37:01   | 2 |   5 | Person
10:12:17   | 1 |   6 | Person
10:25:00   | 1 |   7 | Person
10:25:10   | 2 |   6 | Person
11:23:21   | 2 |   7 | Person
11:57:18   | 1 |   8 | Person
13:02:41   | 1 |   9 | Person
13:03:28   | 2 |   8 | Person
14:55:15   | 1 |  10 | Person
14:56:03   | 2 |   9 | Person
21:26:57   | 1 |  11 | Person
21:31:05   | 2 |  10 | Person
12:31:41+3 | 1 |  12 | Person
12:32:19+3 | 2 |  11 | Person
11:19:29   | 1 |  13 | Person
11:20:31   | 2 |  12 | Person
15:56:23   | 1 |  14 | Person
```
