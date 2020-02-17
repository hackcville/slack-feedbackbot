/*
 * mark_submitted.js
 *
 * Log in the Courses Table what students have filled out the feedback survey each week
 *
 * by Camille Cooper
 * for HackCville, Inc.
 *
 * February 2020
 */

require("dotenv").config();

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID_PROD = process.env.AIRTABLE_BASE_ID_PROD;

const Airtable = require("airtable");
const base = new Airtable({ apiKey: AIRTABLE_API_KEY }).base(
  AIRTABLE_BASE_ID_PROD
);

var feedback_records = [];

const organize_records = arr_of_records => {
  var reformatted = [];
  var course_list = [];
  arr_of_records.forEach(record => {
    let week_field = "W" + record.week_num + " Feedback";
    if (course_list.indexOf(record.course_id) == -1) {
      reformatted.push({
        id: record.course_id,
        fields: { [week_field]: [record.student_id] }
      });
      course_list.push(record.course_id);
    } else {
      reformatted.forEach(ele => {
        if (ele.id == record.course_id) {
          ele.fields[week_field]
            ? ele.fields[week_field].push(record.student_id)
            : (ele.fields[week_field] = [record.student_id]);
        }
      });
    }
  });
  return reformatted;
};

base("Spring 2020 Slackbot Feedback")
  .select({
    view: "Grid view",
    fields: ["Student Link", "Course Link", "Week", "Name"],
    filterByFormula:
      "AND(NOT({Course Link} = ''), NOT({SlackID} = ''), NOT({Name} = ''))"
  })
  .eachPage((records, fetchNextPage) => {
    records.forEach(record => {
      const feedback_record = {
        course_id: record.get("Course Link").toString(),
        student_id: record.get("Student Link").toString(),
        week_num: record.get("Week").toString()
      };
      feedback_records.push(feedback_record);
    });
    fetchNextPage();
  })
  .then(() => {
    give_this_to_airtable = organize_records(feedback_records);
    //Airtable only lets you update 10 records at a time, but there are 12 courses, so we have to update the records in two goes
    base("Courses").update(give_this_to_airtable.slice(0, 5), function(err) {
      if (err) {
        console.error(err);
        return;
      }
    });
    base("Courses").update(give_this_to_airtable.slice(6, 12), function(err) {
      if (err) {
        console.error(err);
        return;
      }
    });
  });
