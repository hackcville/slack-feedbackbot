/* 
 * Slackbot to send surveys to students and collect feedback on courses
 * by Forrest Feaser
 * for HackCville, Inc.
 * 9/12/2019
 */

// TODO: add error catching
// TODO: schedule messaging
// TODO: process data from dialog (store in database)
// TODO: automate the configuration of scheduling and recipients of messages
// TODO: integrate with HackCville servers/website/Slack

require('dotenv').config();

const bot_token = process.env.SLACK_BOT_TOKEN;
const signing_secret = process.env.SLACK_SIGNING_SECRET;

const express = require('express');
const { WebClient } = require('@slack/web-api');
const { createEventAdapter } = require('@slack/events-api');
const { createMessageAdapter } = require('@slack/interactive-messages');

const slackEvents = createEventAdapter(signing_secret);
const slackInteractions = createMessageAdapter(signing_secret);
const web = new WebClient(bot_token);

const port = process.env.PORT || 3000;
const app = express();

app.use('/slack/events', slackEvents.requestListener());
app.use('/slack/actions', slackInteractions.requestListener());

app.listen(port, () => {
    console.log(`Listening for actions/events on port ${port}...`);
  });

// https://api.slack.com/events/app_mention
slackEvents.on('app_mention', (event) => {

    // Template for initialze message with button to survey
    bot_feedback_message = {
      token: bot_token,
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
        const res = await web.chat.postMessage(bot_feedback_message);
      })();

  });

slackInteractions.action({type: 'button'}, (payload) => {

    console.log(payload);

    // Template for feedback form dialog
    const feedback_dialog = {
      token: process.env.SLACK_BOT_TOKEN,
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
        const res = await web.dialog.open(feedback_dialog);
      })();

  });

slackInteractions.action({type: 'dialog_submission'}, (payload, respond) => {
    
    // Process the dialog reponse in payload.submission

    bot_response_message = {
      token: bot_token,
      channel: payload.channel.id, 
      text: `Thanks! <@${payload.user.id}>`, 
      link_names: true,
    };

    (async () => {
        // https://api.slack.com/methods/chat.postMessage
        const res = await web.chat.postMessage(bot_response_message)
      })();

  });
