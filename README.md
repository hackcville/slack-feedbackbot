## To run the app
node index.js

## Run the ngrok server for local dev
ngrok http $PORT

## Verify in slack (set the route in slack api console, i.e. https://xxxxxxx.ngrok.io/slack/events)
./node_modules/.bin/slack-verify --secret $SIGNING_SECRET --path=/slack/events --port=$PORT

## Links:
https://api.slack.com/dialogs
https://api.slack.com/methods/chat.scheduleMessage
https://github.com/slackapi/node-slack-sdk
https://medium.com/slack-developer-blog/tutorial-developing-an-action-able-app-4d5455d585b6
https://api.slack.com/methods
