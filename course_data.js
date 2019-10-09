/*
 * course_roster.js
 * Retrieves students enrolled in Fall 2019 Courses and their slack usernames and specific course section
 * by Camille Cooper and Forrest Feaser
 * for HackCville, Inc.
 * 9/24/2019
 */

//Make column in Airtable: 'start_survey_date' 2019-XX-XXTXX:XX:XXZ
//Check for nulls

exports.getCourses = (callback) => {

  const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
  const AIRTABLE_BASE_ID_DEV = process.env.AIRTABLE_BASE_ID_DEV;
  const Airtable = require('airtable');
  const base = new Airtable({apipKey: AIRTABLE_API_KEY}).base(AIRTABLE_BASE_ID_DEV);

  const courses = [];
  base('Courses')
  .select({
    fields: [
      'Course Title',
      'Slack ID',
      'Start Survey Date'
    ]
  }).eachPage((records, fetchNextPage) => {
    records.forEach(record => {
      courses.push({
        course_name: record.get('Course Title'),
        student_slack_ids: record.get('Slack ID'),
        start_date: record.get('Start Survey Date')
      })
    })
    fetchNextPage();
  }).then(() => {
    callback(courses);
  }).catch(err => {
    console.log(err);
  });
}
