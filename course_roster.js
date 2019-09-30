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

console.log(getCourses(base));

async function getCourses(base) {
  var courses = [];
  await base("Courses")
    .select({
      fields: [
        "Course Title",
        "Enrolled Students",
        "Slack ID",
        "Day",
        "Meeting Time"
      ],
      filterByFormula: "NOT({Course Title} = '')"
    })
    .eachPage(
      function page(records, fetchNextPage) {
        records.forEach(function(record) {
          let message_hour = record.get("Meeting Time").split("-")[1];
          let message_time = formatDate(record.get("Day"), message_hour);
          let entry = {
            course: record.get("Course Title"),
            // student_names: record.get("Enrolled Students"), //airtable id for each student (i think)
            students: record.get("Slack ID"), //slack id for each enrolled student
            time: message_time //formatted correctly
          };
          courses.push(entry);
        });
        fetchNextPage();
      },
      function done(err) {
        if (err) {
          console.error(err);
          return;
        } else {
          console.log(courses);
          return courses;
        }
      }
    );
}

formatDate = (weekday, hour) => {
  switch (weekday) {
    case 0:
      // day = "Sunday";
      day = "2019-10-06T";
      break;
    case 1:
      // day = "Monday";
      day = "2019-10-07T";
      break;
    case 2:
      // day = "Tuesday";
      day = "2019-10-08T";
      break;
    case 3:
      // day = "Wednesday";
      day = "2019-10-09T";
      break;
    case 4:
      // day = "Thursday";
      day = "2019-10-10T";
      break;
    case 5:
      // day = "Friday";
      day = "2019-10-11T";
      break;
    case 6:
      // day = "Saturday";
      day = "2019-10-12T";
  }
  hourEdit = hour.split(":");
  if (hourEdit[0] != "12") {
    hourEdit[0] = Number(hourEdit[0]) + 12;
  }
  return day + hourEdit[0] + ":" + hourEdit[1].substring(0, 2) + ":00Z";
};

// async function getStudents(base) {
//   var students = {};
//   await base("Fall 2019 Involvement")
//     .select({
//       fields: ["Name", "Slack", "Fall Course Involvement - Section"],
//       filterByFormula:
//         "AND(NOT({Fall Course Involvement - Section} = 'Dropped Fall 2019'),NOT({Fall Course Involvement - Section} = ''))"
//     })
//     .eachPage(
//       function page(records, fetchNextPage) {
//         records.forEach(function(record) {
//           let course = record.get("Fall Course Involvement - Section");
//           let slack = record.get("Slack");
//           let student = record.get("Name");
//           students[student] = { slack: slack, course: course };
//         });
//         fetchNextPage();
//       },
//       function done(err) {
//         if (err) {
//           console.error(err);
//           return;
//         }
//         return students;
//       }
//     );
// }
