## To run the app
`node index.js`

## Run the ngrok server for local development
`ngrok http $PORT`

## Verify in slack (set the route in slack api console, i.e. https://xxxxxxx.ngrok.io/slack/events)
`./node_modules/.bin/slack-verify --secret $SIGNING_SECRET --path=/slack/events --port=$PORT`

## TODO
* add error catching  
* use blocks instead of attachments for messages
* schedule messaging  
* process data from dialog (store in database)  
* automate the configuration of scheduling and recipients of messages  
* integrate with HackCville servers/website/Slack  

## References:
* https://github.com/slackapi/node-slack-sdk  
* https://api.slack.com/methods   
* https://api.slack.com/dialogs  