/*
 * course_roster.js
 * Retrieves students enrolled in Fall 2019 Courses and their slack usernames and specific course section
 * by Camille Cooper
 * for HackCville, Inc.
 * 9/24/2019
 */

require("dotenv").config();

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID_FALL_INVOLVEMENT_ID;

var Airtable = require("airtable");
var base = new Airtable({ apipKey: AIRTABLE_API_KEY }).base(AIRTABLE_BASE_ID);

idk(base);

async function idk(base) {
  var course_info = await getCourses(base);
  var student_info = await getStudents(base);
  console.log(course_info);
  console.log(student_info);
}

// Promise.all([course_info, student_info])
//   .then(function(results) {
//     console.log(results);
//     console.log("all data has loaded");
//   })
//   .catch(function(err) {
//     console.log("one or more promises has failed: " + err);
//   });

async function getCourses(base) {
  var courses = [];
  await base("Courses")
    .select({
      fields: ["Courses", "Section", "Day", "Meeting Time"]
    })
    .eachPage(
      function page(records, fetchNextPage) {
        records.forEach(function(record) {
          let course_section =
            record.get("Courses") + " " + record.get("Section");
          let meeting_time =
            record.get("Day") + " " + record.get("Meeting Time");
          courses[course_section] = { time: meeting_time, students: [] };
        });
        fetchNextPage();
      },
      function done(err) {
        if (err) {
          console.error(err);
          return;
        } else {
          return courses;
        }
      }
    );
}

async function getStudents(base) {
  var students = {};
  await base("Fall 2019 Involvement")
    .select({
      fields: ["Name", "Slack", "Fall Course Involvement - Section"],
      filterByFormula:
        "AND(NOT({Fall Course Involvement - Section} = 'Dropped Fall 2019'),NOT({Fall Course Involvement - Section} = ''))"
    })
    .eachPage(
      function page(records, fetchNextPage) {
        records.forEach(function(record) {
          let course = record.get("Fall Course Involvement - Section");
          let slack = record.get("Slack");
          let student = record.get("Name");
          students[student] = { slack: slack, course: course };
        });
        fetchNextPage();
      },
      function done(err) {
        if (err) {
          console.error(err);
          return;
        }
        return students;
      }
    );
}
