const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID_LIVE;

var Airtable = require("airtable");
var base = new Airtable({ apiKey: AIRTABLE_API_KEY }).base(AIRTABLE_BASE_ID);
var apple = "UCQC2QMQX";
var id = "{Slack ID} = '" + apple + "'";
var student_info = "";
base("Students")
  .select({
    maxRecords: 1,
    view: "Master Data",
    filterByFormula: id
  })
  .eachPage((records, fetchNextPage) => {
    records.forEach(record => {
      const name = record.get("Name");
      student_info = name;
    });
    fetchNextPage();
  })
  .then(() => {
    base("Students")
      .select({
        maxRecords: 1,
        view: "Master Data",
        filterByFormula: "{Name} = '" + student_info + "'"
      })
      .eachPage(
        function page(records, fetchNextPage) {
          records.forEach(function(record) {
            console.log("Retrieved", record.get("Name"));
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
  });
