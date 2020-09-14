require("dotenv").config();

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID_LIVE = process.env.AIRTABLE_BASE_ID_LIVE;
const TABLE_NAME = "Fall 2020 Slackbot Feedback";

var Airtable = require("airtable");
var base = new Airtable({ apiKey: AIRTABLE_API_KEY }).base(
  AIRTABLE_BASE_ID_LIVE
);

var payload = {
  user: { id: "UETEHA6NN" },
  submission: {
    pace: 3,
    understanding: 3,
    enjoyment: 3,
    feedback: "testing 123",
  },
};

var student_name = "";
var student_link = [];

base("Fall 2020 Students")
  .select({
    maxRecords: 1,
    view: "Grid view - don't touch",
    filterByFormula: "{Slack ID}= '" + payload.user.id + "'",
  })
  .eachPage((records, fetchNextPage) => {
    records.forEach((record) => {
      student_name = record.get("Full Name");
      student_link.push(record.id);
    });
    fetchNextPage();
  })
  .then(() => {
    //record the dialog response in Airtable
    base(TABLE_NAME).create(
      [
        {
          fields: {
            Name: student_name,
            SlackID: payload.user.id,
            "Pace Rating": Number(payload.submission.pace),
            "Understanding Rating": Number(payload.submission.understanding),
            "Enjoyment Rating": Number(payload.submission.enjoyment),
            Feedback: payload.submission.feedback,
            "Student Link": student_link,
            Week: getWeekNumber(),
          },
        },
      ],
      function (err) {
        if (err) {
          console.error(err);
          return;
        }
      }
    );
  });

getWeekNumber = () => {
  const startDate = Date.UTC(2020, 8, 13);
  const today = Date.now();
  let weeksBetween = Math.floor((today - startDate) / 604800000); //604,800,000 is the number of milliseconds per week
  return weeksBetween + 1;
};
