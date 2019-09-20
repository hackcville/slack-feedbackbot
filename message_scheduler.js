/* 
 * scheduler.js
 * Schedule Slack messages containing surveys to enrolled students
 * by Forrest Feaser
 * for HackCville, Inc.
 * 9/20/2019
 */

const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN;
const SLACK_SIGNING_SECRET = process.env.SLACK_SIGNING_SECRET;

const fs = require('fs');

const { WebClient } = require('@slack/web-api');
const web = new WebClient(SLACK_BOT_TOKEN);

const filename = process.argv[3]
const data = JSON.parse(fs.readFileSync(filename));

const message_date_str = data.message_date_str;
const message_date = new Date(message_date_str);
const message_date_epoch = message_date.getTime();

const slack_user_ids = data.slack_user_ids;

slack_user_ids.forEach(user_id => {

    const scheuled_bot_message = {
      token: SLACK_BOT_TOKEN,
      channel: user_id,
      post_at: message_date_epoch,
      link_names: true,
      as_user: true, 
      attachments: [
        {
          text: `Hey <@${user_id}>, Would you mind giving us some feedback?`,
          callback_id: 'feedback_form_open',
          attachment_type: 'default',
          actions: [
            {
              name: 'feedback_button',
              text: 'Begin Survey!',
              type: 'button',
              value: 'feedback'
            }
          ]
        }
      ]
    };

    (async () => {
      // https://api.slack.com/methods/chat.postMessage
      const res = await web.chat.postMessage(scheduled_bot_message)
        .catch(err => {
          console.log(err);
          console.log(res);
        });
    })();

  });
