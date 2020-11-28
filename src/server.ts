export { };
require("dotenv").config();
const bodyparser = require("body-parser");
const express = require('express');
const app = express();
const { PORT } = process.env;
const db = require("./db_helper");

//to render pure html and css files
app.engine("html", require("ejs").renderFile);
app.use(express.static('build/public'));
app.set("views", "build/public");

//accept json data
app.use(bodyparser.json());

app.get("/", (req, res) => {
    res.render("test.html");
});

app.post("/year", async (req, res) => {
    //get year from the request
    let { start_year: begin_year, end_year } = req.body;
    begin_year = parseInt(begin_year);

    debugLog([begin_year]);
    try {
        let parts = await db.getParts(null, null, begin_year);

        debugLog(parts);
        res.json(parts);
        // res.sendStatus(200);
    } catch (err) {
        console.log(err);
        res.sendStatus(500);
    }
});

app.post("/debug", async (req, res) => {

})

app.post("/int", (req, res) => {
    let { part_name } = req.body;

    debugLog(part_name);
    res.sendStatus(200);
});



app.listen(PORT, () => {
    console.log("started on", PORT);
});

function debugLog(param) {
    if (process.env.ENVIRONMENT == "dev") {
        console.log(param);
    }
}