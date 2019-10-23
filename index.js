/*
 * index.js
 * 
 * Express server on Heroku to recieve events/actions from Slack and respond
 * to feed back surveys and record responses in Airtable
 * 
 * by Forrest Feaser and Camille Cooper
 * for HackCville, Inc.
 * 
 * 10/23/2019
 */

require("dotenv").config();

const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN;
const SLACK_SIGNING_SECRET = process.env.SLACK_SIGNING_SECRET;
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID_LIVE;
const TABLE_NAME = "Fall 2019 Slackbot Feedback";

const Airtable = require("airtable");
const base = new Airtable({ apiKey: AIRTABLE_API_KEY }).base(AIRTABLE_BASE_ID);

const express = require("express");
const { WebClient } = require("@slack/web-api");
const { createEventAdapter } = require("@slack/events-api");
const { createMessageAdapter } = require("@slack/interactive-messages");
const axios = require("axios");
const qs = require("qs");
const path = require("path");
const router = express.Router();

const slackEvents = createEventAdapter(SLACK_SIGNING_SECRET);
const slackInteractions = createMessageAdapter(SLACK_SIGNING_SECRET);
const web = new WebClient(SLACK_BOT_TOKEN);

const port = process.env.PORT || 3000;
const app = express();

app.use("/slack/events", slackEvents.requestListener());
app.use("/slack/actions", slackInteractions.requestListener());

app.get("/", function(req, res) {
  res.send(
    "<a href='https://slack.com/oauth/authorize?client_id=740362425955.749609775569&scope=bot,commands,chat:write:bot,chat:write:user,im:read,groups:read,channels:read,channels:write,im:write,groups:write'><img alt='Add to Slack' height='40' width='139' src='https://platform.slack-edge.com/img/add_to_slack.png' srcset='https://platform.slack-edge.com/img/add_to_slack.png 1x, https://platform.slack-edge.com/img/add_to_slack@2x.png 2x'></a>"
  );
});

app.get("/slack/auth", function(req, res) {
  if (!req.query.code) {
    res.redirect("/?error=access_denied");
    return;
  }
  const authinfo = {
    client_id: process.env.SLACK_CLIENT_ID,
    client_secret: process.env.SLACK_CLIENT_SECRET,
    code: req.query.code
  };
  axios
    .post("https://slack.com/api/oauth.access", qs.stringify(authInfo))
    .then(result => {
      console.log(result.data);
      const { access_token, refresh_token, expires_in, error } = result.data;
      if (error) {
        res.sendStatus(401);
        console.log(error);
        return;
      }
      axios
        .post(
          `https://slack.com/api/team.info`,
          qs.stringify({ token: access_token })
        )
        .then(result => {
          if (!result.data.error) {
            res.redirect(`http://${result.data.team.domain}.slack.com`);
          }
        })
        .catch(err => {
          console.error(err);
        });
    })
    .catch(err => {
      console.error(err);
    });
});

app.listen(port, () => {
  console.log(`Listening for actions/events on port ${port}...`);
});

//https://api.slack.com/events/app_mention
slackEvents.on("app_mention", event => {

  //template for message with button to survey
 const bot_feedback_message = {
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

  //template for feedback survey
  const feedback_dialog = {
    token: SLACK_BOT_TOKEN,
    trigger_id: payload.trigger_id,
    dialog: JSON.stringify({
      title: "Feedback Form",
      callback_id: "feedback_form_open",
      submit_label: "Submit",
      elements: [
        {
          label: "What is your name?",
          type: "text",
          name: "name"
        },
        {
          label: "What course are you in?",
          type: "text",
          name: "course"
        },
        {
          label: "The pace of the material so far has been...",
          type: "select",
          name: "pace",
          placeholder: "1-5, 5 = Too fast, 1 = Too slow",
          options: [
            { label: "1", value: 1 },
            { label: "2", value: 2 },
            { label: "3", value: 3 },
            { label: "4", value: 4 },
            { label: "5", value: 5 }
          ]
        },
        {
          label: "My own understanding of the material is...",
          type: "select",
          name: "understanding",
          placeholder: "1-5, 5 = I could teach this, 1 = I'm totally lost",
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
          placeholder: "1-5, 5 = I’m loving it, 1 = I’m hating it",
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
    //https://api.slack.com/methods/dialog.open
    const res = await web.dialog.open(feedback_dialog)
      .catch(err => {
        console.log(err);
      });
  })();

});

slackInteractions.action({ type: "dialog_submission" }, payload => {

  //record the dialog response in Airtable
  base(TABLE_NAME).create(
    [
      {
        fields: {
          Name: payload.submission.name,
          SlackID: payload.user.id,
          "Pace Rating": Number(payload.submission.pace),
          "Understanding Rating": Number(payload.submission.understanding),
          "Enjoyment Rating": Number(payload.submission.enjoyment),
          Feedback: payload.submission.feedback,
          Course: payload.submission.course
        }
      }
    ],
    function(err) {
      if (err) {
        console.error(err);
      }
    }
  );

  //template for bot response to completed form
  const bot_response_message = {
    token: SLACK_BOT_TOKEN,
    channel: payload.channel.id,
    text: `Thanks! <@${payload.user.id}>`,
    link_names: true
  };

  (async () => {
    //https://api.slack.com/methods/chat.postMessage
    const res = await web.chat.postMessage(bot_response_message).catch(err => {
      console.log(err);
    });
  })();

});
