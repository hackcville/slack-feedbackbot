require("dotenv").config();

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID_PROD = process.env.AIRTABLE_BASE_ID_PROD;
const SLACK_BOT_TOKEN_HCCOMMUNITY = process.env.SLACK_BOT_TOKEN_HCCOMMUNITY;
const COURSES_TABLE_NAME = "Courses";

const { WebClient } = require("@slack/web-api");
const web = new WebClient(SLACK_BOT_TOKEN_HCCOMMUNITY);

const Airtable = require("airtable");
const base = new Airtable({ apiKey: AIRTABLE_API_KEY }).base(
  AIRTABLE_BASE_ID_PROD
);

const courses = [];

base(COURSES_TABLE_NAME)
  .select({
    fields: ["Course Title", "Slack ID", "Survey Datetime"],
    filterByFormula:
      "AND(NOT({Course Title} = ''), NOT({Slack ID} = ''), NOT({Survey Datetime} = ''))"
  })

  //retrieve the relevant data for each course
  .eachPage((records, fetchNextPage) => {
    records.forEach(record => {
      const course_data = {
        course_title: record.get("Course Title"),
        student_slack_ids: record.get("Slack ID"),
        survey_date: record.get("Survey Datetime")
      };
      courses.push(course_data);
    });
    fetchNextPage();
  })

  .then(() => {
    courses.forEach(course => {
      const course_title = course.course_title;
      const slack_ids = course.student_slack_ids;
      const message_date = new Date(course.survey_date); //watch out for DST

      slack_ids.forEach(user_id => {
        const message_date_epoch_secs = message_date.getTime() / 1000;
        const datestring = message_date.toLocaleString(); //schedule date of current message so it doesn't get lost in async
        message_date.setSeconds(message_date.getSeconds() + 2); //increment the time when the next message is schedule for
      });
    });
  });
