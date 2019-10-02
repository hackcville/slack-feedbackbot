/*
 * course_roster.js
 * Retrieves students enrolled in Fall 2019 Courses and their slack usernames and specific course section
 * by Camille Cooper
 * for HackCville, Inc.
 * 9/24/2019
 */

//I'd like the Airtable to have a defined start date and end date and a better formatted time
//Where to store survey data??
//How should we pass data between files?

require('dotenv').config();

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID_PROD = process.env.AIRTABLE_BASE_ID_PROD;

const Airtable = require('airtable');
const base = new Airtable({apipKey: AIRTABLE_API_KEY}).base(AIRTABLE_BASE_ID_PROD);

let courses = [];

(async () => {
  const res = await base('Courses')
    .select({
      fields: [
        'Course Title',
        'Slack ID',
        'Day',
        'Meeting Time'
      ]
    })
    .eachPage(records => {
      records.forEach(record => {
        const message_hour = record.get('Meeting Time').split('-')[1];
        const message_time = formatDate(record.get('Day'), message_hour);
        const entry = {
          course: record.get('Course Title'),
          students: record.get('Slack ID'),
          time: message_time
        };
        courses.push(entry);
      });
    })
    .catch(err => {
      console.log(err);
    });
})();

console.log(courses);
