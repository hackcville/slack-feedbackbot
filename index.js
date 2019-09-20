/* 
 * index.js
 * Server to recieve events/actions from Slack and send surveys and record responses
 * by Forrest Feaser
 * for HackCville, Inc.
 * 9/12/2019
 */

require('dotenv').config();

const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN;
const SLACK_SIGNING_SECRET = process.env.SLACK_SIGNING_SECRET;
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

var Airtable = require('airtable');
var base = new Airtable({apiKey: AIRTABLE_API_KEY}).base(AIRTABLE_BASE_ID);

const table_name = 'Table 1';

const express = require('express');
const { WebClient } = require('@slack/web-api');
const { createEventAdapter } = require('@slack/events-api');
const { createMessageAdapter } = require('@slack/interactive-messages');

const slackEvents = createEventAdapter(SLACK_SIGNING_SECRET);
const slackInteractions = createMessageAdapter(SLACK_SIGNING_SECRET);
const web = new WebClient(SLACK_BOT_TOKEN);

const port = process.env.PORT || 3000;
const app = express();

app.use('/slack/events', slackEvents.requestListener());
app.use('/slack/actions', slackInteractions.requestListener());

app.listen(port, () => {
    console.log(`Listening for actions/events on port ${port}...`);
  });

// https://api.slack.com/events/app_mention
slackEvents.on('app_mention', (event) => {

    // Template to create message with button to survey
    const bot_feedback_message = {
      token: SLACK_BOT_TOKEN,
      channel: event.channel, 
      text: `Hey <@${event.user}>`, 
      link_names: true,
      attachments: [
        {
          text: 'Would you mind giving us some feedback?',
          callback_id: 'feedback_form_open',
          color: '#3149EC',
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
        const res = await web.chat.postMessage(bot_feedback_message)
          .catch(err => {
            console.log(err);
            console.log(res);
          });
      })();

  });

slackInteractions.action({type: 'button'}, (payload) => {

    // Template for feedback form dialog
    const feedback_dialog = {
      token: SLACK_BOT_TOKEN,
      trigger_id: payload.trigger_id,
      dialog: JSON.stringify({
        title: 'Feedback Form',
        callback_id: 'feedback_form_open',
        submit_label: 'Submit',
        elements: [
          {
            label: 'Name',
            type: 'text',
            name: 'name',
            placeholder: 'Enter your name...'
          }, 
          {
            label: 'Rate your experience',
            type: 'select',
            name: 'rating',
            placeholder: 'Rate your experience 1-5...',
            options: [
              { label: '1', value: 1 },
              { label: '2', value: 2 },
              { label: '3', value: 3 },
              { label: '4', value: 4 },
              { label: '5', value: 5 } 
            ]
          }, 
          {
            label: 'Feedback',
            type: 'textarea',
            name: 'feedback',
            hint: 'Tell us what you thought...'
          }
        ]
      })
    };

    (async () => {
        // https://api.slack.com/methods/dialog.open
        const res = await web.dialog.open(feedback_dialog)
          .catch(err => {
              console.log(err);
              console.log(res);
          });
      })();

  });

slackInteractions.action({type: 'dialog_submission'}, (payload, respond) => {

    console.log(payload);

    // Process the dialog reponse in payload.submission
    base(table_name).create([
      {
        fields: {
          'Name': payload.user.name, 
          'Slack Handle': payload.user.id,
          'Submission': payload.submission.feedback
        }
      }
    ], function(err) {
      if (err) {
        console.error(err);
      }
    });

    bot_response_message = {
      token: SLACK_BOT_TOKEN,
      channel: payload.channel.id, 
      text: `Thanks! <@${payload.user.id}>`, 
      link_names: true,
    };

    (async () => {
        // https://api.slack.com/methods/chat.postMessage
        const res = await web.chat.postMessage(bot_response_message)
          .catch(err => {
            console.log(err);
            console.log(res);
          });
      })();

  });
