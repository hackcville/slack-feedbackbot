/*
 * message_scheduler.js
 * Schedules Slack messages containing surveys to enrolled students
 * by Forrest Feaser
 * for HackCville, Inc.
 * 9/23/2019
 */

require("dotenv").config();

const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN;
const SLACK_SIGNING_SECRET = process.env.SLACK_SIGNING_SECRET;

const fs = require("fs");

const { WebClient } = require("@slack/web-api");
const web = new WebClient(SLACK_BOT_TOKEN);

const filename = process.argv[2]; // command line arg with message data file
const data = JSON.parse(fs.readFileSync(filename));

const message_date_str = data.message_date_str; // date string in ISO format
const message_date = new Date(message_date_str);
const message_date_epoch_secs = message_date.getTime() / 1000;

const slack_user_ids = data.slack_user_ids;

slack_user_ids.forEach(user_id => {
  // schedule message to each user in list

  const scheduled_bot_message = {
    // template for scheduled message
    token: SLACK_BOT_TOKEN,
    channel: user_id,
    post_at: message_date_epoch_secs,
    link_names: true,
    as_user: true,
    attachments: [
      {
        text: `Hey <@${user_id}>, Would you mind giving us some feedback?`,
        callback_id: "feedback_form_open",
        attachment_type: "default",
        actions: [
          {
            name: "feedback_button",
            text: "Begin Survey!",
            type: "button",
            value: "feedback"
          }
        ]
      }
    ]
  };

  (async () => {
    // https://api.slack.com/methods/chat.scheduleMessage
    const res = await web.chat
      .scheduleMessage(scheduled_bot_message)
      .then(() => {
        console.log(
          `Message scheduled for ${user_id} at ${message_date.toUTCString()}`
        );
      })
      .catch(err => {
        console.log(err);
      });
  })();
});
