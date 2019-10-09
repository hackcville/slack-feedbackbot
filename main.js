/*
 * main.js
 * combines message scheduling and course data modules
 * by Forrest Feaser
 * for HackCville, Inc.
 * 9/24/2019
 */

require('dotenv').config();

const courseData = require('./course_data.js');
const messageScheduler = require('./message_scheduler.js');

//code looks kinda sloppy?
//put date in prod airtable for start date
//date must be in UTC GMT
//how to avoid nulls in airtable?
//how to schedule scheduler and manage dates?
//put all in one file?
//where to store responses in airtable?
//dialogs don't expire (post ephemeral?)
//use im channel ids instead of user ids? (are those in slack channel data?)
//how to handle errors better?

//get course/student data from Airtable and schedule Slack messages
courseData.getCourses(messageScheduler.schedule_messsages)
