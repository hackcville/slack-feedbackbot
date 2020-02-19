/*
 * feedback_bump.js
 *
 * To be run one and two days after initial feedback form is sent out. Will see who hasn't fill out a feedback survey yet and slack them a reminder
 *
 * by Camille Cooper
 * for HackCville, Inc.
 *
 * February 2020
 */

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

//for staggering messages, but doesn't work with async
const sleep = milliseconds => {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
};

//not the best way to do this in practice but it's the only thing that works with async
const wait = milliseconds => {
  const now = new Date().getTime();
  while (new Date().getTime() < now + milliseconds) {}
};

const getWeekNumber = () => {
  const startDate = Date.UTC(2020, 0, 26);
  const today = Date.now();
  let weeksBetween = Math.floor((today - startDate) / 604800000); //604,800,000 is the number of milliseconds per week
  return weeksBetween + 1;
};

const getAttendedStudents = async () => {
  let attended_students = [];
  await base("Spring 2020 Students")
    .select({
      view: "Grid view - don't touch",
      fields: [
        "Full Name",
        "Slack ID",
        "Course + Section",
        "W" + getWeekNumber()
      ],
      filterByFormula:
        "AND(NOT({Course + Section} = ''), NOT({Slack ID} = ''), ({W" +
        getWeekNumber() +
        "} = 'Attended'))"
    })
    .eachPage((records, fetchNextPage) => {
      records.forEach(record => {
        const student_data = {
          name: record.get("Full Name"),
          student_id: record.getId(),
          slack_id: record.get("Slack ID"),
          course: record.get("Course + Section")
        };
        attended_students.push(student_data);
      });
      fetchNextPage();
    })
    .then(() => {
      console.log("attended done");
      function done(err) {
        if (err) {
          console.error(err);
          return;
        }
      }
      return attended_students;
    });
};

const getAlreadySubmitted = async () => {
  let completed_feedback_students = {};
  await base("Courses")
    .select({
      view: "All Courses",
      fields: ["Course Title", "W" + getWeekNumber() + " Feedback"]
    })
    .eachPage((records, fetchNextPage) => {
      records.forEach(record => {
        let course_id = record.getId();
        let already_submitted = record.get("W" + getWeekNumber() + " Feedback");
        completed_feedback_students[course_id] = already_submitted;
      });
      fetchNextPage();
    })
    .then(() => {
      console.log("submitted done");
      function done(err) {
        if (err) {
          console.error(err);
          return;
        }
      }
      return completed_feedback_students;
    });
};
/*
    .then(() => {
      courses.forEach(course => {
        const course_title = course.course_title;
        const slack_ids = course.student_slack_ids;
        const message_date = new Date(course.survey_date); //watch out for DST

        slack_ids.forEach(user_id => {
          const message_date_epoch_secs = message_date.getTime() / 1000;
          const datestring = message_date.toLocaleString(); //schedule date of current message so it doesn't get lost in async
          message_date.setSeconds(message_date.getSeconds() + 2); //increment the time when the next message is schedule for

          //scheduled message containing link to feedback form
          const scheduled_bot_message = {
            token: SLACK_BOT_TOKEN_HCCOMMUNITY,
            channel: user_id,
            post_at: message_date_epoch_secs,
            link_names: true,
            as_user: false, //make this true for message to appear in feedbackbot DM
            attachments: [
              {
                text: `Hi <@${user_id}>, I'm Andrew. I collect feedback from HC students so we can learn how to continue improving your course. Can you take 20 secs to let me know how ${course_title} went today?`,
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
            //https://api.slack.com/methods/chat.scheduleMessage
            await web.chat
              .scheduleMessage(scheduled_bot_message)
              .then(() => {
                console.log(
                  `Message scheduled for ${user_id} in ${course_title} at ${datestring}`
                );
                wait(1000); //wait 1 second between each message schedule to avoid rate limiting
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

*/

//create a main function to do all the methods
const bumpSurvey = async () => {
  let delinquents = [];
  console.log("1");
  let attended = getAttendedStudents();
  console.log(attended);
  console.log("2");
  let submitted = getAlreadySubmitted();
  console.log(submitted);
  console.log("3");

  await Promise.all([attended, submitted]).then(values => {
    console.log(values);
  });
  console.log("4");
};

//Where we do all the actual stuff

bumpSurvey();
