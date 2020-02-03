const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID_PROD;
const TABLE_NAME = "Spring 2020 Slackbot Feedback";

var Airtable = require("airtable");
var base = new Airtable({ apiKey: AIRTABLE_API_KEY }).base(AIRTABLE_BASE_ID);

var payload = {
  user: { id: "UETEHA6NN" },
  submission: {
    pace: 3,
    understanding: 3,
    enjoyment: 3,
    feedback: "testing 123"
  }
};

var student_name = "";
var student_course = "";
base("Spring 2020 Students")
  .select({
    maxRecords: 1,
    view: "Grid View - don't touch",
    filterByFormula: "{Slack ID}= '" + payload.user.id + "'"
  })
  .eachPage((records, fetchNextPage) => {
    records.forEach(record => {
      student_name = record.get("Full Name");
      student_course = record.get("Course + Section");
    });
    fetchNextPage();
  })
  .then(() => {
    //record the dialog response in Airtable
    console.log("student course is ", student_course[0]);
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
            Course: student_course[0]
          }
        }
      ],
      function(err, records) {
        if (err) {
          console.error(err);
          return;
        }
      }
    );
  });
