# Feedbackbot
Feedbackbot is Node.js app that uses the Slack API to schedule and send surveys to students to improve the communication between students and their instructors and gather data to better the courses. 

#### Environment and configurations
This app uses Node.js, an Express server, the Slack Web API, and Airtable. To allow access to Slack and Airtable you must have API keys / user tokens. The slack app must be installed into your workspace, configured with a URL to recieve requests with actions/events, and allow the correct permissions for the bot to modify the workspace. 

#### For local development, use ngrok
Install ngrok and start a tunnel for a public URL  
`ngrok http $PORT`

#### Verify development URL 
Start the verification server and then set the route in Slack API console, i.e. https://xxxxxxx.ngrok.io/slack/events  
`./node_modules/.bin/slack-verify --secret $SIGNING_SECRET --path=/slack/events --port=$PORT`

#### Start the Express server for the app
`node index.js`

#### Schedule messages
`node message_scheduler.js`

#### References
* https://github.com/slackapi/node-slack-sdk  
* https://api.slack.com/methods   
* https://api.slack.com/dialogs  
* https://airtable.com/api  