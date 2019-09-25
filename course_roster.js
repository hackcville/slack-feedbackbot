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

var roster = {};
var courses = [];

base("Courses")
  .select({
    fields: ["Courses", "Section", "Day", "Meeting Time"]
  })
  .eachPage(function page(records, fetchNextPAge) {
    records.forEach(function(record) {
      let course_section = record.get("Courses") + " " + record.get("Section");
      let meeting_time = record.get("Day") + " " + record.get("Meeting Time");
      courses.push(course_section);
    });
  });

base("Fall 2019 Involvement")
  .select({
    fields: ["Name", "Slack", "Fall Course Involvement - Section"],
    filterByFormula:
      "AND(NOT({Fall Course Involvement - Section} = 'Dropped Fall 2019'),NOT({Fall Course Involvement - Section} = ''))",
    sort: [{ field: "Name", direction: "desc" }],
    view: "Grid view"
  })
  .eachPage(
    function page(records, fetchNextPage) {
      records.forEach(function(record) {
        let course = record.get("Fall Course Involvement - Section");
        let slack = record.get("Slack");
        let student = record.get("Name");
        // roster[course][student] = slack;
        console.log(roster);
      });
      fetchNextPage();
    },
    function done(err) {
      if (err) {
        console.error(err);
        return;
      }
    }
  );
