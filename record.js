var payload = {
  user: { id: "UETEHA6NN" },
  submission: { pace: 3, understanding: 3, enjoyment: 3, feedback: "hello" }
};

var student_name = "";
var student_course = "";
base("Students")
  .select({
    maxRecords: 1,
    view: "Master Data",
    filterByFormula: "{Slack ID}= '" + payload.user.id + "'"
  })
  .eachPage((records, fetchNextPage) => {
    records.forEach(record => {
      student_name = record.get("Name");
      student_course = record.get("F19 Course Involvement (Section)");
    });
    fetchNextPage();
  })
  .then(() => {
    //record the dialog response in Airtable
    console.log(student_course[0]);
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
      function(err) {
        if (err) {
          console.error(err);
        }
      }
    );
  });
