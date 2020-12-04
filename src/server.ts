export { };
require("dotenv").config();
const bodyparser = require("body-parser");
const express = require('express');
const app = express();
const { PORT } = process.env;
const db = require("./db_helper");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const upload = multer({
    dest: path.join(__dirname, "./temp")
});

//to render pure html and css files
app.engine("html", require("ejs").renderFile);
app.use(express.static('build/public'));
app.set("views", "build/public");

//accept json data
app.use(bodyparser.json());


//serve web pages
app.get("/", (req, res) => {
    res.render("index.html");
});

app.get("/test", (req, res) => {
    res.render("test.html");
});

app.get("/grid_test", (req, res) => {
    res.render("grid_test.html");
});

app.get("/about", (req, res) => {
    res.render("about.html");
});


//api routes
app.post("/search_full", async (req, res) => {
    //get year from the request
    let { make, model, year, engine } = req.body;
    year = parseInt(year);
    if (isNaN(year)) year = null;
    if (!model) model = null;
    if (!make) make = null;
    if (!engine) engine = null;

    debugLog([make, model, year, engine]);
    try {
        let parts = await db.getPartsEngine(make, model, year, engine);

        // debugLog(parts);
        res.json(parts);
        // res.sendStatus(200);
    } catch (err) {
        console.log(err);
        res.sendStatus(500);
    }
});

app.get('/init', async (req, res) => {
    try {
        let parts = await db.getModelNames();
        res.json(parts);
    } catch (err) {
        console.log(err);
        res.sendStatus(500);
    }
})

app.post("/search_id_number", async (req, res) => {
    let { id_number } = req.body;
    try {
        let parts = await db.getPartByOEorFrey(id_number);
        res.json(parts);
    } catch (err) {
        console.log(err);
        res.sendStatus(500);
    }
})

app.post("/add_part", upload.single("part_img"), async (req, res) => {
    // construct part db entry
    let part: PartDBEntry = null, applications: Array<Application> = null;
    try {
        let { make, oe_number, frey_number, price, description, enabled, in_stock } = req.body;
        part = { make, oe_number, frey_number, price, 
            'image_url': null, 
            'description': description?description:null,
            'enabled': enabled?enabled:1, 
            'in_stock': in_stock?in_stock:1 };
        console.log(part);
        return;
        const tempPath = req.file.path;
        const fileExtension = path.extname(req.file.originalname).toLowerCase();
        let image_url = "/img/" + part.make + part.oe_number + fileExtension
        debugLog(image_url);
        const targetPath = path.join(__dirname, "./public", image_url);
        if (fileExtension === ".png") {
            fs.rename(tempPath, targetPath, err => {
                if (err) {
                    return debugLog([err, res]);
                }
            });
            part.image_url = image_url;
        }
        // construct applications array
        applications = [];
        if (typeof req.body.model != 'string') {
            for (let i = 0; i < req.body.model.length; i++) {
                applications.push({
                    'model': req.body.model[i],
                    'begin_year': req.body.begin_year[i],
                    'end_year': req.body.end_year[i]
                });
            }
        } else {
            applications.push({
                'model': req.body.model,
                'begin_year': req.body.begin_year,
                'end_year': req.body.end_year
            });
        }
        debugLog([part, applications]);
    } catch (err) {
        debugLog(err);
        res.sendStatus(500);
    }
    
    try {
        let part_id = await db.addPart(part, applications);
        res.json(part_id);
    }
    catch (err) {
        console.log(err);
        res.sendStatus(500);
    }
})


app.post("/debug", upload.single("part_img"), async (req, res) => {

    debugLog(req.body);

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