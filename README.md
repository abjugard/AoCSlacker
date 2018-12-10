# Endoslack

Notify slack channel with advent of code leaderboard

Crontab syntax to run every Monday at 12:00

```bash
# m h  dom mon dow   command
0 12 * * 1 SESSION_COOKIE='xyz' LEADERBOARD_ID='xxxxx' SLACK_URL_TOKEN='https://hooks.slack.com/services/xxx/xxx/xxx' /usr/bin/node /home/endoslack/app.js
```
