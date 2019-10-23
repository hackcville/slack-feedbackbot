/*
 * message_scheduler.js
 * 
 * Retrieve course data from Airtable and schedule feedback surveys in Slack
 * 
 * by Forrest Feaser and Camille Cooper
 * for HackCville, Inc.
 * 
 * 10/23/2019
 */

require("dotenv").config();

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID_DEV = process.env.AIRTABLE_BASE_ID_DEV;
const TABLE_NAME = "Courses"
const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN;

const { WebClient } = require("@slack/web-api");
const web = new WebClient(SLACK_BOT_TOKEN);

const Airtable = require("airtable");
const base = new Airtable({ apiKey: AIRTABLE_API_KEY }).base(AIRTABLE_BASE_ID_DEV);

scheduleMessages = () => {

  const courses = [];

  base(TABLE_NAME)
    .select({
      fields: ["Course Title", "Slack ID", "Survey Datetime"], 
      filterByFormula: "AND(NOT({Course Title} = ''), NOT({Slack ID} = ''), NOT({Survey Datetime} = ''))"
    })

    //retrieve the relevant data for each course
    .eachPage((records, fetchNextPage) => {
      records.forEach(record => {
        const course_data = {
          course_title: record.get("Course Title"),
          student_slack_ids: record.get("Slack ID"),
          survey_date: record.get("Survey Datetime")
        }
        courses.push(course_data);
      });
      fetchNextPage();
    })

    .then(() => {
      courses.forEach(course => {

        const course_title = course.course_title;
        const slack_ids = course.student_slack_ids;
        const message_date = new Date(course.survey_date);
        const message_date_epoch_secs = message_date.getTime() / 1000;

        slack_ids.forEach(user_id => {

          //scheduled message containing link to feedback form
          const scheduled_bot_message = {
            token: SLACK_BOT_TOKEN,
            channel: user_id,
            post_at: message_date_epoch_secs,
            link_names: true,
            as_user: true,
            attachments: [
              {
                text: `Hey <@${user_id}>, would you mind giving us some feedback on ${course_title}?`,
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
            //https://api.slack.com/methods/chat.scheduleMessage
            const res = await web.chat.scheduleMessage(scheduled_bot_message)
              .then(() => {
                console.log(
                  `Message scheduled for ${user_id} at ${message_date.toLocaleString()}`
                );
              })
              .catch(err => {
                console.log(err);
              });
          })();

        });

      });
    })

    .catch(err => {
      console.log(err);
    });

};

//call to main function to schedule messages
scheduleMessages();
