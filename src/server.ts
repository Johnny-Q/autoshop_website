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

app.get("/", (req, res)=>{
    res.render("index.html");
});

app.get("/test", (req, res) => {
    res.render("test.html");
});

app.post("/search_full", async (req, res) => {
    //get year from the request
    let { make, model, year } = req.body;
    year = parseInt(year);
    if(isNaN(year)) year = null;
    if(!model) model = null;
    if(!make) make = null;

    debugLog([make, model, year]);
    try {
        let parts = await db.getParts(make, model, year);

        debugLog(parts);
        res.json(parts);
        // res.sendStatus(200);
    } catch (err) {
        console.log(err);
        res.sendStatus(500);
    }
});

app.post("/search_id_number", async (req, res) => {
    let {id_number} = req.body;
    try{
        let parts = await db.getPartByOEorFrey(id_number);
        res.json(parts);
    } catch(err){
        console.log(err);
        res.sendStatus(500);
    }
})

app.post("/add_part", async (req, res) => {
    let {part, applications} = req.body as RequestBodyInterface;
    console.log(part, applications);
    try{
        let part_id = await db.addPart(part, applications);
        res.json(part_id);
    }
    catch(err){
        console.log(err);
        res.sendStatus(500);
    }
})


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