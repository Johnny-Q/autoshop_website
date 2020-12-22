import { debug } from "console";

require("dotenv").config();
const bodyparser = require("body-parser");
const express = require('express');
const app = express();
const { PORT, SESSION_SECRET, SESSION_STORE_SECRET } = process.env;
const db = require("./db_helper");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const nodemailer = require('nodemailer');
const session = require("express-session");
const SQLiteStore = require('connect-sqlite3')(session);
let session_store = new SQLiteStore;

const upload = multer({
    dest: path.join(__dirname, "./temp")
});

//to render pure html and css files
app.engine("html", require("ejs").renderFile);
app.use(express.static('build/public'));
app.set("views", "build/public/views");
app.set("view engine", "ejs");

//accept json data
app.use(bodyparser.json());
app.use(bodyparser.urlencoded({ extended: true }));
app.use(session({
    "secret": SESSION_SECRET,
    "cookie": {
        maxAge: 60 * 60 * 1000, //1 hour
        httpOnly: true,
    },
    // secure: true, //when we get SSL #brokemans
    "store": session_store,
    "resave": true,
    "saveUninitialized": true,
    "unset": "destroy"
}));

const HTMLpages = ["about", "test", "grid_test", "search_box", "search", "contact", "slideshow", "register", "login", "dashboard"];
HTMLpages.forEach(page => {
    app.get(`/${page}`, (req, res) => {
        let properties = { 'logged_in': '', 'user': '', 'user_id': '' };
        for (let [key, value] of Object.entries(properties)) {
            properties[key] = req.session[key];  
        }
        req.session.test = "test";
        res.render(page, properties);
    });
});

//serve web pages
app.get("/", (req, res) => {
    let properties = { 'logged_in': '', 'user': '', 'user_id': '' };
    for (let [key, value] of Object.entries(properties)) {
        properties[key] = req.session[key];  
    }
    // req.session.test = 'test saldfnxasidnxf';
    // console.log(req.session);
    res.render("home", properties);
});

//api routes
app.post('/register', async (req, res) => {
    const { user, pass, passconfirm } = req.body;
    let errmsgs = [];
    if (!user || !pass || !passconfirm) errmsgs.push({ msg: "Please fill out all fields" });
    if (pass != passconfirm) errmsgs.push({ msg: "Passwords do not match" });
    let additional_info = {};
    if (errmsgs.length == 0) {
        // no errors so far, try to register user in db
        let register = await db.register(user, pass, additional_info);
        register.forEach(msg => {
            errmsgs.push({ msg });
        })
    }
    if (errmsgs.length > 0) {
        console.log(errmsgs);
        //res.status(400).send(errmsgs);
        res.render('register', {
            errors: errmsgs,
            user: user
        })
    } else {
        res.send('ok');
    }
})

app.post('/login', async (req, res) => {
    const { user, pass } = req.body;
    let login = await db.login(user, pass);
    console.log(login);
    let errmsgs = [];
    login.errmsgs.forEach(msg => {
        errmsgs.push({ msg });
    })
    if (login.match) {
        req.session.user_id = login.user_id;
        req.session.user = user;
        req.session.logged_in = true;
        res.redirect('/dashboard');
    }
    else {
        res.render('login', {
            errors: errmsgs,
            user: user
        });
    }
})

app.post("/logout", (req, res) => {
    req.session = null;
    res.redirect('/');
});

app.post("/search_full", async (req, res) => {
    //get year from the request
    let { make, model, year, engine, offset, limit, oe_number } = req.body;

    year = parseInt(year);
    if (isNaN(year)) year = null;
    if (!model) model = null;
    if (!make) make = null;
    if (!engine) engine = null;
    if (model == 'Any') model = null;
    if (make == 'Any') make = null;
    if (year == 'Any') year = null;
    if (engine == 'Any') engine = null;

    // debugLog([make, model, year, engine]);
    let logged_in = req.session.logged_in || false;

    try {
        let parts = await db.paginatedSearch(make, model, year, engine, 0, 10, req.session.logged_in);
        // debugLog(parts);
        // res.render('search', { parts, logged_in });
        res.json(parts);
        // res.sendStatus(200);
    } catch (err) {
        console.log(err);
        res.sendStatus(500);
    }
});


app.post("/search_id_number", async (req, res) => {
    let { id_number } = req.body;
    try {
        let parts = await db.getPartByOEorFrey(id_number);
        res.json(parts);
    } catch (err) {
        console.log(err);
        res.sendStatus(500);
    }
});

///applications?part_id=1
app.get("/applications", async (req, res) => {
    let { part_id } = req.query;
    try {
        let apps = await db.getApps(part_id);
        res.json(apps)
    }
    catch (err) {
        console.log(err);
        res.sendStatus(500);
        return;
    }
    // res.sendStatus(200);
})

app.post("/add_part", upload.single("part_img"), async (req, res) => {
    // construct part db entry
    let part: PartDBEntry = null, applications: Array<Application> = null;
    try {
        let { make, oe_number, frey_number, price, description, enabled, in_stock, brand } = req.body;
        if (!brand) brand = null;
        part = {
            make, oe_number, frey_number, price, brand,
            'image_url': null,
            'description': description ? description : null,
            'enabled': enabled ? enabled : 1,
            'in_stock': in_stock ? in_stock : 1
        };
        const tempPath = req.file.path;
        const fileExtension = path.extname(req.file.originalname).toLowerCase();
        let image_url = "/img/parts" + part.make + part.oe_number + fileExtension
        // debugLog(image_url);
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
                    'end_year': req.body.end_year[i],
                    'engines': []
                });
            }
        } else {
            applications.push({
                'model': req.body.model,
                'begin_year': req.body.begin_year,
                'end_year': req.body.end_year,
                'engines': []
            });
        }
        // debugLog([part, applications]);
    } catch (err) {
        console.log(err);
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

app.get('/init', async (req, res) => {
    try {
        let parts = await db.getModelNames();
        res.json(parts);
    } catch (err) {
        console.log(err);
        res.sendStatus(500);
    }
});
app.get("/names/makes", async (req, res) => {
    let makes = await db.getMakes();
    // debugLog(makes);
    res.json(makes);
})

app.get("/names/years", async (req, res) => {
    try {
        let { make } = req.query;
        make = makeNullIfAny(make);
        // debugLog(make);
        let years = await db.getYears(make);
        // debugLog(years);
        res.json(years);
    } catch (err) {
        debugLog(err);
        res.sendStatus(500);
    }
});
app.get("/names/models", async (req, res) => {
    try {
        let { make, year } = req.query;
        make = makeNullIfAny(make);
        year = makeNullIfAny(year);
        let models = await db.getModels(make, year);
        // debugLog(models);
        res.json(models);
    }
    catch (err) {
        console.log(err);
        res.sendStatus(500);
    }
    // res.sendStatus(200);
});

app.get("/names/engine", async (req, res) => {
    let { make, year, model } = req.query;
    make = makeNullIfAny(make);
    year = makeNullIfAny(year);
    model = makeNullIfAny(model);
    let engines = await db.getEngines(make, year, model);
    // debugLog(engines);
    res.json(engines);
    // res.sendStatus(200);
});

app.get("/cart/view", async (req, res) => {
    // get part info for cart
    let parts = [];
    res.render('cart', {
        cart: req.session.cart,
        parts: parts
    });
});

app.get("/cart", async (req, res) => {

});

app.post("/cart", async (req, res) => {
    let { items } = req.body;
    debugLog(items);
    if (!req.session.cart) {
        req.session.cart = [];
    }
    req.session.cart = req.session.cart.concat(items);
    res.sendStatus(200);
});

//remove 1 or whole thing
app.delete("/cart", async (req, res) => {

});

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
function makeNullIfAny(value) {
    return value == "Any" ? null : value;
}