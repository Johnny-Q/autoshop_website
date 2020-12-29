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
const xlImport = require('./import_from_excel');
let session_store = new SQLiteStore;
let transporter = {
    sendMail: function(obj){console.log('sent mail')}
};
if(process.env.SEND_MAIL){
    transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });
}

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
const HTMLpages = ["about", "search_box", "search", "contact", "slideshow", "register", "login", "dashboard", "test", "partials/approve_account", "reset_password"];
HTMLpages.forEach(page => {
    app.get(`/${page}`, (req, res) => {
        let properties = { 'logged_in': null, 'user': null, 'user_id': null, 'admin': null};
        for (let [key, value] of Object.entries(properties)) {
            properties[key] = req.session[key];
        }
        if (page == "login" || page == "register" || page == "reset_password") {
            if (properties.logged_in) res.redirect('/');
            else res.render(page, properties);
        }
        else {
            res.render(page, properties);
        }

    });
});

const adminPages = ['', 'adduser', 'addpart', "account_requests"]
adminPages.forEach(page => {
    app.get(`/admin/${page}`, (req, res) => {
        let properties = { 'logged_in': null, 'user': null, 'user_id': null, 'admin': null };
        for (let [key, value] of Object.entries(properties)) {
            properties[key] = req.session[key];
        }
        if (!req.session.admin) res.redirect('/');
        else {
            if (page != '') page = '/' + page
            res.render(`admin${page}`, properties);
        }
    });
})

//serve web pages
app.get("/", (req, res) => {
    let properties = { 'logged_in': null, 'user': null, 'user_id': null, 'admin': null };
    for (let [key, value] of Object.entries(properties)) {
        properties[key] = req.session[key];
    }
    res.render("home", properties);
});

app.get('/email', async (req, res) => {
    let token = req.query.token;
    token = token || '';
    let verification = await db.verifyEmail(token);
    if (verification.errmsg) {
        res.render('message', {message: verification.errmsg, page_name: "Email Verification"});
    }
    else {
        res.render('message', {message: "Your email has been successfully verified!", page_name: "Email Verification"});
    }
});

app.get('/reset', async(req, res)=>{
    let properties = { 'logged_in': null, 'user': null, 'user_id': null, 'admin': null };
    for (let [key, value] of Object.entries(properties)) {
        properties[key] = req.session[key];
    }
    if(properties.logged_in) res.redirect('/')
    let token = req.query.token;
    token = token || '';
    res.render('reset', {...properties, token: token});
})

app.post('/reset', async (req, res) => {
    let properties = { 'logged_in': null, 'user': null, 'user_id': null , 'admin': null};
    for (let [key, value] of Object.entries(properties)) {
        properties[key] = req.session[key];
    }
    if(properties.logged_in) res.redirect('/')

    const {token, pass, passconfirm} = req.body;
    if(pass != passconfirm) {
        return res.render('reset', {
            ...properties,
            token: token,
            errors: [{msg: 'Passwords do not match!'}]
        })
    }
    if(token){
        let user = await db.queryPassToken(token);
        if(user){
            await db.changePass(user.email, pass);
        }
    }
    res.render('reset', {
        ...properties,
        token,
        errors: [{msg: 'Your password has been reset. You may log in now.'}]
    })
})

app.get('/change_password', (req, res) => {
    let properties = { 'logged_in': null, 'user': null, 'user_id': null, 'temp_pass': null, 'admin': null };
    for (let [key, value] of Object.entries(properties)) {
        properties[key] = req.session[key];
    }
    if(!properties.logged_in){
        return res.redirect('/');
    }
    properties.temp_pass = properties.temp_pass || 'none';
    let errmsg = [{ msg: "Please change your password" }];
    if (!properties.logged_in && !properties.temp_pass) res.redirect('/');
    else res.render("change_password", {
        ...properties,
        temp_pass: properties.temp_pass
    });
});

app.post('/reset_password', async (req, res) => {
    let properties = { 'logged_in': null, 'user': null, 'user_id': null, 'temp_pass': null, 'admin': null };
    for (let [key, value] of Object.entries(properties)) {
        properties[key] = req.session[key];
    }
    if (properties.logged_in) res.redirect('/');
    else {
        const { email } = req.body;
        console.log(email);
        let data = await db.resetPassword(email);
        res.render('reset_password', { ...properties, errors: [{ msg: data.msg }] });
        console.log(data);
        if (data.pass_token) {
            transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: email,
                subject: "Aceway Auto Password Reset",
                text: `Reset your Aceway Auto account password by following the link: ${process.env.DOMAIN}/reset?token=` + data.pass_token,
                html: `<a href=${process.env.DOMAIN}/reset?token=${data.pass_token}> Reset your password </a>`
            });
        }
    }
})

app.get('/get_users', async (req, res) => {
    let properties = { 'logged_in': null, 'user': null, 'user_id': null, 'admin': null };
    for (let [key, value] of Object.entries(properties)) {
        properties[key] = req.session[key];
    }

    if (!properties.logged_in) return res.sendStatus(401);
    if (!properties.admin) return res.sendStatus(403);

    res.json(await db.getUnapprovedUsers());
})

app.post('/change_password', async (req, res) => {
    let properties = { 'logged_in': null, 'user': null, 'user_id': null, 'temp_pass': null, 'admin': null };
    for (let [key, value] of Object.entries(properties)) {
        properties[key] = req.session[key];
    }
    if (!properties.logged_in && !properties.temp_pass) res.redirect('/');
    else {
        const { prevpass, pass, passconfirm } = req.body;
        let errmsgs = [];
        // check if prevpass checks out
        let login = await db.login(properties.user, prevpass);
        if (login.match) {
            if (pass == passconfirm) {
                db.changePass(properties.user, pass);
            }
            else {
                errmsgs.push({ msg: "New passwords do not match" });
            }
        } else {
            errmsgs.push({ msg: "Wrong password" });
        }
        if (errmsgs.length > 0) {
            res.render('change_password', {
                errors: errmsgs,
                ...properties,
                temp_pass: properties.temp_pass || "none"
            })
        }
        else {
            req.session.logged_in = true;
            delete req.session.temp_pass;
            res.render('message', {logged_in: true, page_name: "Change Password", message: "Password has been changed"});
        }
    }
})

//api routes
app.post('/register', async (req, res) => {
    let properties = { 'logged_in': null, 'user': null, 'user_id': null, 'admin': null };
    for (let [key, value] of Object.entries(properties)) {
        properties[key] = req.session[key];
    }
    if (properties.logged_in) {
        res.redirect('/');
        return
    }
    let errmsgs = [];
    const {
        company,
        email,
        business,
        purchase,
        telephone,
        fax,
        address1,
        address2,
        city,
        province,
        postal,
        contact_first,
        contact_last,
        pass,
        passconfirm
    } = req.body;
    let phone = "", postalStrip = "";
    if (telephone) {
        phone = telephone.replace(/[^0-9]/g, "");
    }
    if (postal) postalStrip = postal.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
    if (anyFalse([
        company,
        email,
        business,
        purchase,
        telephone,
        address1,
        city,
        province,
        postal,
        contact_first,
        contact_last,
        pass,
        passconfirm])) errmsgs.push({ msg: "Please fill out all fields" });
    if (pass != passconfirm) errmsgs.push({ msg: "Passwords do not match" });
    if (!isValidEmail(email)) errmsgs.push({ msg: "Please enter a valid email address" })
    if (phone.length != 10) errmsgs.push({ msg: "Please enter a valid phone number" })
    if (!isValidPostal(postalStrip)) errmsgs.push({ msg: "Please enter a valid postal code" })
    if (!(purchase == '<$1000' || purchase == '$1000-$5000' || purchase == '$5000-$10000' || purchase == '>$10000')) {
        errmsgs.push({ msg: "Please fill out all fields" })
    }
    let additional_info = {
        company,
        business,
        purchase,
        telephone: phone,
        fax: fax ? fax : null,
        address1,
        address2: address2 ? address2 : null,
        city,
        province,
        postal: postalStrip,
        contact_first,
        contact_last,
        verified_email: 0,
        approved: 0
    };
    let register = null;
    if (errmsgs.length == 0) {
        // no errors so far, try to register user in db
        register = await db.register(email, pass, additional_info);
        register.errmsgs.forEach(msg => {
            errmsgs.push({ msg });
        })
    }
    if (errmsgs.length > 0) {
        //res.status(400).send(errmsgs);
        res.render('register', {
            errors: errmsgs,
            email,
            company,
            business,
            purchase,
            telephone: phone,
            fax,
            address1,
            address2,
            city,
            province,
            postal: postalStrip.toUpperCase(),
            contact_first,
            contact_last,
            ...properties
        })
    } else {
        // everything good, send verification email
        transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: "Verify Your Aceway Auto Account",
            text: `Verify your Aceway Auto account by following the link: ${process.env.DOMAIN}/email?token=` + register.email_token,
            html: `<a href=${process.env.DOMAIN}/email?token=${register.email_token}>Verify your email </a>`
        });
        transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: process.env.REGISTRATION,
            subject: "A User Has Created an Aceway Account",
            text: "Please login to your admin account on Aceway Auto to view the registration."
        })
        res.render('message', {page_name: "Register", message: "Thank you for registering! An email has been sent to your email to verify your email."})
    }
})

app.post('/adminadduser', async (req, res) => {
    let properties = { 'logged_in': null, 'user': null, 'user_id': null, 'admin': null };
    for (let [key, value] of Object.entries(properties)) {
        properties[key] = req.session[key];
    }
    if (!properties.logged_in || !properties.admin) {
        res.redirect('/');
        return
    }
    let errmsgs = [];
    const {
        company,
        email,
        business,
        purchase,
        telephone,
        fax,
        address1,
        address2,
        city,
        province,
        postal,
        contact_first,
        contact_last
    } = req.body;
    let phone, postalStrip;
    if (telephone) {
        phone = telephone.replace(/[^0-9]/g, "");
    }
    postalStrip = postal.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
    if (anyFalse([
        company,
        email,
        business,
        purchase,
        telephone,
        address1,
        city,
        province,
        postal,
        contact_first,
        contact_last])) errmsgs.push({ msg: "Please fill out all fields" });
    if (!isValidEmail(email)) errmsgs.push({ msg: "Please enter a valid email address" })
    if (phone.length != 10) errmsgs.push({ msg: "Please enter a valid phone number" })
    if (!isValidPostal(postalStrip)) errmsgs.push({ msg: "Please enter a valid postal code" })
    if (!(purchase == '<$1000' || purchase == '$1000-$5000' || purchase == '$5000-$10000' || purchase == '>$10000')) {
        errmsgs.push({ msg: "Please fill out all fields" })
    }
    let additional_info = {
        company,
        business,
        purchase,
        telephone: phone,
        fax: fax ? fax : null,
        address1,
        address2: address2 ? address2 : null,
        city,
        province,
        postal: postalStrip,
        contact_first,
        contact_last,
        verified_email: 0,
        approved: 1,
        temp_pass: 1,
    };
    let password = '';
    if (errmsgs.length == 0) {
        //generate a temporary password string
        password = randString("12");
        let register = await db.register(email, password, additional_info);
        register.errmsgs.forEach(msg => {
            errmsgs.push({ msg });
        })
    }
    if (errmsgs.length > 0) {
        //res.status(400).send(errmsgs);
        res.render('register', {
            errors: errmsgs,
            email,
            company,
            business,
            purchase,
            telephone: phone,
            fax,
            address1,
            address2,
            city,
            province,
            postal: postalStrip.toUpperCase(),
            contact_first,
            contact_last,
            ...properties
        })
    } else {
        res.render('message', {page_name: "Add User", message: "User Password: "+password });
    }
})

app.post('/login', async (req, res) => {
    const { user, pass } = req.body;
    let properties = { 'logged_in': null, 'user': null, 'user_id': null, 'admin': null };
    for (let [key, value] of Object.entries(properties)) {
        properties[key] = req.session[key];
    }
    if (properties.logged_in) res.redirect('/');
    let login = await db.login(user, pass);
    let errmsgs = [];
    login.errmsgs.forEach(msg => {
        errmsgs.push({ msg });
    })
    if (login.match && login.user.approved) {
        if (login.user.temp_pass == 1) {
            // prompt user to reset password
            req.session.user = user;
            req.session.user_id = login.user_id;
            req.session.temp_pass = pass;
            res.redirect('/change_password');
        }
        else {
            req.session.user_db = login.user;
            req.session.user = user;
            req.session.logged_in = true;
            req.session.admin = login.user.is_admin;
            if(req.session.admin){
                res.redirect('/dashboard');
            } else {
                res.redirect('/');
            }
        }
    }
    else if (login.match && !login.user.approved) {
        res.render('message', {page_name: "Login", message:'Your account is pending approval. If you have any questions, please contact us through our contact page.'})
    }
    else {
        res.render('login', {
            errors: errmsgs,
            user: user,
            ...properties
        });
    }
})

app.post("/logout", (req, res) => {
    let properties = { 'logged_in': null, 'user': null, 'user_id': null, 'admin': null };
    for (let [key, value] of Object.entries(properties)) {
        properties[key] = req.session[key];
    }
    req.session = null;
    res.render('message', {logged_in: false, page_name: "Logout", message: "You are now logged out."});
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
        let parts = await db.paginatedSearch(make, model, year, engine, 0, 10000, req.session.logged_in);
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
        let parts = await db.getPartByOEorFrey(id_number, req.session.logged_in);
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

app.post("/admin/addpart", upload.fields([{name: "parts", maxCount:1}, {name: "image", maxCount:1}]), async (req, res) => {
    try {
        let properties = { 'logged_in': null, 'user': null, 'user_id': null, 'admin': null };
        for (let [key, value] of Object.entries(properties)) {
            properties[key] = req.session[key];
        }
        if (!properties.logged_in || !properties.admin) { 
            res.redirect('/');
        }
        if (Object.keys(req.files).length === 0) res.render('admin/addpart', { ...properties, errors: [{ msg: "Please upload a file!" }] })
        else {
            console.log('1')
            const {fileType} = req.body;
            if(fileType != 'parts' && fileType != 'image') return res.sendStatus(400);
            const filePath = req.files[fileType][0].path;
            const fileExtension = path.extname(req.files[fileType][0].originalname).toLowerCase();
            console.log('2');
            if (fileType == 'parts' && fileExtension != '.xlsx') {
                res.render('admin/addpart', { ...properties, errors: [{ msg: "Please upload an Excel file!" }] })
            }
            if (fileType == 'image' && fileExtension != '.jpg'){
                res.render('admin/addpart', { ...properties, errors: [{ msg: "Please upload a jpg image!" }] })
            }
            else {
                if(fileType == 'parts'){
                    console.log('here');
                    let errs = await xlImport.upload_parts(filePath);
                    if (errs.length > 0) {
                        let errors = [];
                        errs.forEach(err => {
                            errors.push({
                                msg: "error on line " + err.index + ": " + err.msg
                            })
                        })
                        res.render('admin/addpart', { ...properties, errors })
                    }
                    else {
                        res.render('admin/addpart', {...properties, errors: [{msg: "Parts uploaded"}]})
                    }
                } else if (fileType == 'image'){
                    const targetPath = path.join(__dirname, "./public/img/parts", req.files[fileType][0].originalname);
                    console.log(filePath, targetPath);
                    if (fileExtension === ".jpg") {
                        fs.rename(filePath, targetPath, err => {
                            if (err) {
                                return debugLog([err, res]);
                            }
                        });
                    }
                    res.render('admin/addpart', {...properties, errors: [{msg: 'Image Added'}]})
                }
            }
        }

    } catch (err) {
        console.log(err);
        res.send(500);
    }
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

app.get("/cart", async (req, res) => {
    let cart = [];
    req.session.cart = req.session.cart || {};

    for (let part of Object.values(req.session.cart)) {
        cart.push(part);
    }

    // get part info for cart
    res.render('cart', {
        cart: cart,
        logged_in: req.session.logged_in,
        // parts: parts
    });
});
app.post("/cart", async (req, res) => {
    let { updates } = req.body;
    debugLog(updates);
    req.session.cart = req.session.cart || {};
    updates.forEach(part => {
        if (part.id && part.quantity) {
            req.session.cart[part.id].quantity = part.quantity;
        }
        if (part.quantity == 0) {
            delete req.session.cart[part.id];
        }
    });
    res.sendStatus(200);
});

app.post("/cart/part", async (req, res) => {
    let { part } = req.body;
    // debugLog(part);
    req.session.cart = req.session.cart || {};
    //check if the part is already in the cart
    if (!part.id) {
        res.sendStatus(403);
        return;
    }
    //part already is in the cart
    if (req.session.cart[part.id]) {
        req.session.cart[part.id].quantity += part.quantity;
    } else { //part is not in the cart
        req.session.cart[part.id] = part;
    }

    debugLog(req.session.cart);
    res.sendStatus(200);
});

app.delete("/cart/part", async (req, res) => {
    let { part } = req.body;
    req.session.cart = req.session.cart || {};
    if (req.session.cart[part.id]) {
        delete req.session.cart[part.id];
    }
    res.sendStatus(200);
});
//remove 1 or whole thing
app.delete("/cart", async (req, res) => {
    req.session.cart = {};
    console.log(req.session.cart);
    res.sendStatus(200);
});

app.post("/cart/place_order", async (req, res) => {
    if(!req.session.logged_in) return res.redirect('/');
    const {delivery, payment, po_number, comments} = req.body;
    debugLog(req.body);
    if(delivery != 'Delivery' && delivery != 'Pickup') return res.send(400);
    const validPayment = ['Credit', 'Cash', 'Cheque', 'LOC'];
    if(validPayment.indexOf(payment) == -1) return res.send(400);
    const currentDate = new Date();
    // convert current date to America/Toronto time
    const localTime = currentDate.toLocaleString('en-CA', {timeZone: process.env.TIME_ZONE});
    let parts = '';
    let total = 0;
    let num_parts = 0;
    for(let part of Object.values(req.session.cart)){
        let subtotal = part.price*part.quantity/100;
        let html = 
        `
        <tr>
            <td>${part.oe_number}</td>
            <td>${part.quantity}</td>
            <td>$${part.price/100}</td>
            <td>$${subtotal}</td>
        </tr>
        `
        parts += html + '\n';
        total += subtotal;
        num_parts += part.quantity;
    }
    let emailHTML = 
    `
    <p> <b> User contact information: </b> </p>
    <p> <b> First Name: </b> ${req.session.user_db.contact_first} </p>
    <p> <b> Last Name: </b> ${req.session.user_db.contact_last} </p>
    <p> <b> Company Name: </b> ${req.session.user_db.company} </p>
    <p> <b> Email: </b> ${req.session.user_db.email} </p>
    <p> <b> Telephone: </b> ${req.session.user_db.telephone} </p>
    <p> <b> Fax: </b> ${req.session.user_db.fax || 'No Fax'} </p>
    <p> <b> Billing Information: </b> </p>
    <p> ${req.session.user_db.address1} </p>
    <p> ${req.session.user_db.address2} </p>
    <p> ${req.session.user_db.city.toUpperCase()} </p>
    <p> ${req.session.user_db.province.toUpperCase()} </p>
    <p> ${req.session.user_db.postal.toUpperCase()} </p>
    <p> <b> Order placed at: </b> ${localTime} </p>

    <p style="margin-bottom: 20px"> <b> List of parts: </b> </p>

    <div style="max-width: 700px">
    <table style="width:100%">
        <tr>
            <th>Part OE Number</th>
            <th>Quantity Ordered</th>
            <th>Price per part</th>
            <th>Sub-Total</th>
        </tr>
        ${parts}
    </table>
    <p style="text-align:right; margin-right:30px"> <b>Sub-Total</b> $${total} </p>
    <p style="text-align:right; margin-right:30px"> <b>Total (13% HST)</b> $${Math.round(total/100*1.13)}.${total*1.13%100} </p>
    <p style="text-align:right; margin-right:30px"> <b>Total Number of Parts</b> ${num_parts} </p>
    </div>

    <p><b>Delivery Option: </b> ${delivery}</p>
    <p><b>Payment Method: </b> ${payment} </p>
    <p><b>PO Number: </b> ${po_number}</p>
    <p><b>Additional Comments: </b> ${comments}</p>
    `
    transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: process.env.ORDER_DEST,
        subject: "An order has been placed",
        html: emailHTML
    })
    res.sendStatus(200);
})

app.post("/debug", upload.single("part_img"), async (req, res) => {

    debugLog(req.body);
})

app.post("/user/approve", async (req, res)=>{
    const {id, status} = req.body;
    if(!req.session.logged_in) return res.send(401);
    if(!req.session.admin) return res.send(403);
    if(!id || !status || (status != 1 && status !=-1)) return res.send(400);
    try{
        let user = await db.approveUser(id, status);
        if(user.length > 0){
            transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: user[0].email,
                subject: "Aceway Auto Account Approval",
                text: "Your Aceway Auto account has been approved! You may now log in."
            })
        }
        res.sendStatus(200);
    } catch(err){
        console.log(err);
        res.send(500);
    }
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
function anyFalse(arr) {
    let anyFalse = false;
    arr.forEach(element => {
        if (!element) anyFalse = true;
    })
    return anyFalse;
}
function isValidEmail(email) {
    return /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/.test(email);
}
function isValidPostal(postal) {
    return (/[a-z]\d[a-z]\d[a-z]\d/.test(postal) && postal.length == 6);
}

function randString(length) {
    let result = '';
    const charset = "QWERTYUIOPASDFGHJKLZXCVBNMqwertyuiopasdfghjklzxcvbnm1234567890!@#$%^&*()";
    const set_length = charset.length;
    for (let i = 0; i < length; i++) {
        result += charset[Math.floor(Math.random() * set_length)];
    }
    return result;
}