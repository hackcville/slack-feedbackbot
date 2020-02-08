require("dotenv").config();

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;

var Airtable = require('airtable');
var base = new Airtable({apiKey: AIRTABLE_API_KEY}).base('appG1EnlhIeoSYkPG');
var COURSES_FILEPATH = "../Courses.json"
var COURSE_AVG_FILEPATH = "../CourseAvg.json"

const getFile =(filepath) =>{
    var fs = require('fs');
    return JSON.parse(fs.readFileSync(filepath))
}

const saveFile = (filepath, file) =>{
    var fs = require('fs');
    fs.writeFileSync(filepath, file, function(err) {
        if (err) {
            console.log(err);
        }
    });
}

const getAvgRating = (records, courseID, ratingType)=>{
    let pace = 0
    let numOfStudents = 0
    for(var i = 0; i < records.length; i++){
        record = records[i]
        if (record.get("Course") == courseID){
            pace += record.get(ratingType)
            numOfStudents += 1
        }
    }
    return (pace/numOfStudents)
}

const getCourses = (records) =>{
    let Courses = []
    for(var i = 0; i < records.length; i++){
        record = records[i]
        Courses.push({"Course Title":record.get("Course Title"),"Course ID": record.id,"Instructor": record.get("Instructor"), "Instructor Email": record.get("Instructor Email")})
    }
    return Courses
}


 base('Courses').select({
    view: "All Courses"
}).eachPage(function page(records, fetchNextPage) {
    
    let Courses = getCourses(records)
    Courses = JSON.stringify(Courses, null, 2)
    var fs = require('fs');
    fs.writeFileSync(COURSES_FILEPATH, Courses, function(err) {
        if (err) {
            console.log(err);
        }
});
    fetchNextPage();

}, function done(err) {
    if (err) { console.error(err); return; }
});

base('Spring 2020 Slackbot Feedback').select({
    // fields: ["Field 10"],
    view: "Grid view",
}).eachPage(function page(records, fetchNextPage) {
    // console.log(records)
    let Courses = require(COURSES_FILEPATH)
    for(var i = 0; i < Courses.length; i++){
        let courseID = Courses[i]["Course ID"]
        for( var j = 0; j < records.length; j++){
            let paceAvg = getAvgRating(records, courseID, "Pace Rating")
            let understandAvg = getAvgRating(records, courseID, "Understanding Rating")
            Courses[i]["paceAvg"] = paceAvg
            Courses[i]["understandAvg"] = understandAvg
        }
    }
    // console.log(Courses)
    Courses = JSON.stringify(Courses, null, 2)
    var fs = require('fs');
    fs.writeFileSync(COURSE_AVG_FILEPATH, Courses, function(err) {
        if (err) {
            console.log(err);
        }
    });

    fetchNextPage();

})

var courseAvgs = require(COURSE_AVG_FILEPATH)
for(var i = 0; i < courseAvgs.length; i ++){
    //record the dialog response in Airtable
    var course = courseAvgs[i]
    base("Instructor Feedback Report Test").create(
        [
        {
            fields: {
            "Instructor Email":course["Instructor Email"],
            Instructor: course["Instructor"],
            Course: course["Course Title"],
            "Average Pace Rating": course["paceAvg"],
            "Average Understanding Rating": course["understandAvg"]
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
}
