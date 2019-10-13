/*
 * index.js
 * Server to recieve events/actions from Slack and send surveys and record responses
 * by Forrest Feaser
 * for HackCville, Inc.
 * 9/12/2019
 * survey question added and hooked up to Airtable by Camille Cooper
 * 10/2/2019
 */

//import necessary modules
require("dotenv").config();
var Airtable = require("airtable");
const express = require("express");
const request = require("request");
const { WebClient } = require("@slack/web-api");
const { createEventAdapter } = require("@slack/events-api");
const { createMessageAdapter } = require("@slack/interactive-messages");

//assign and import environmental variables
const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN;
const SLACK_SIGNING_SECRET = process.env.SLACK_SIGNING_SECRET;
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID_LIVE;

//instantiate express and define the port we want
const app = express();
const port = process.env.PORT || 3000;

//set up Slack stuff
const slackEvents = createEventAdapter(SLACK_SIGNING_SECRET);
const slackInteractions = createMessageAdapter(SLACK_SIGNING_SECRET);
const web = new WebClient(SLACK_BOT_TOKEN);
app.use("/slack/events", slackEvents.requestListener());
app.use("/slack/actions", slackInteractions.requestListener());

//start the server
app.listen(port, () => {
  console.log(`Listening for actions/events on port ${port}...`);
});

//set up Airtable stuff
var base = new Airtable({ apiKey: AIRTABLE_API_KEY }).base(AIRTABLE_BASE_ID);
const table_name = "Fall 2019 Slackbot Feedback";

// https://api.slack.com/events/app_mention
slackEvents.on("app_mention", event => {
  // bot responds to Slack mentions with survey

  const bot_feedback_message = {
    // template for message with button to survey
    token: SLACK_BOT_TOKEN,
    channel: event.channel,
    text: `Hey <@${event.user}>`,
    link_names: true,
    attachments: [
      {
        text: "Would you mind giving us some feedback?",
        callback_id: "feedback_form_open",
        color: "#3149EC",
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
    // https://api.slack.com/methods/chat.postMessage
    const res = await web.chat.postMessage(bot_feedback_message).catch(err => {
      console.log(err);
    });
  })();
});

slackInteractions.action({ type: "button" }, payload => {
  const feedback_dialog = {
    // template for dialog with feedback form
    token: SLACK_BOT_TOKEN,
    trigger_id: payload.trigger_id,
    dialog: JSON.stringify({
      title: "Feedback Form",
      callback_id: "feedback_form_open",
      submit_label: "Submit",
      elements: [
        {
          label: "Name",
          type: "text",
          name: "name",
          placeholder: "Enter your name..."
        },
        {
          label: "For me, the pace of the material so far has been:",
          type: "select",
          name: "pace",
          placeholder: "1-5, 5 is too fast, 1 is too slow",
          options: [
            { label: "1", value: 1 },
            { label: "2", value: 2 },
            { label: "3", value: 3 },
            { label: "4", value: 4 },
            { label: "5", value: 5 }
          ]
        },
        {
          label: "How would you rate your own understanding of the material?",
          type: "select",
          name: "understanding",
          placeholder:
            "5 is I could teach this to someone else, 1 is I have no idea what’s going on",
          options: [
            { label: "1", value: 1 },
            { label: "2", value: 2 },
            { label: "3", value: 3 },
            { label: "4", value: 4 },
            { label: "5", value: 5 }
          ]
        },
        {
          label: "How are you enjoying the course?",
          type: "select",
          name: "enjoyment",
          placeholder: "1 to 5, 5 is I’m loving it, 1 is I’m hating it",
          options: [
            { label: "1", value: 1 },
            { label: "2", value: 2 },
            { label: "3", value: 3 },
            { label: "4", value: 4 },
            { label: "5", value: 5 }
          ]
        },
        {
          label: "How can we improve your experience?",
          type: "textarea",
          name: "feedback",
          hint: "Tell us what you think..."
        }
      ]
    })
  };

  (async () => {
    // https://api.slack.com/methods/dialog.open
    const res = await web.dialog.open(feedback_dialog).catch(err => {
      console.log(err);
    });
  })();
});

slackInteractions.action({ type: "dialog_submission" }, (payload, respond) => {
  base(table_name).create(
    [
      // process the dialog response into Airtable
      {
        fields: {
          Name: payload.user.name,
          "Pace Rating": payload.submission.pace,
          "Understanding Rating": payload.submission.understanding,
          "Enjoyment Rating": payload.submission.enjoyment,
          Feedback: payload.submission.feedback
        }
      }
    ],
    function(err) {
      if (err) {
        console.error(err);
      }
    }
  );

  bot_response_message = {
    // template for bot response to completed form
    token: SLACK_BOT_TOKEN,
    channel: payload.channel.id,
    text: `Thanks! <@${payload.user.id}>`,
    link_names: true
  };

  (async () => {
    // https://api.slack.com/methods/chat.postMessage
    const res = await web.chat.postMessage(bot_response_message).catch(err => {
      console.log(err);
    });
  })();
});
