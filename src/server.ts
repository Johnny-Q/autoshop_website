require("dotenv").config();
const bodyparser = require("body-parser");
const express = require("express");
const app = express();
const { PORT, SESSION_SECRET, SESSION_STORE_SECRET } = process.env;
const db = require("./db_helper");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const nodemailer = require("nodemailer");
const session = require("express-session");
const SQLiteStore = require("connect-sqlite3")(session);
const errorHandler = require('errorhandler')
let session_store = new SQLiteStore();

app.use(errorHandler({dumpExceptions: true, showStack: true}))

let transporter = {
    sendMail: function (obj) {
        console.log("sent mail");
    },
};
let registerEmail = {
    sendMail: function (obj) {
        console.log(obj);
    },
};

if (process.env.SEND_MAIL) {
    transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    registerEmail = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.REGISTRATION,
            pass: process.env.REGISTRATION_PASS,
        },
    });
} else {
    transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        auth: {
            user: process.env.mail_test,
            pass: process.env.mail_test_pass,
        },
    });
}

const upload = multer({
    dest: path.join(__dirname, "./temp"),
});

//to render pure html and css files
app.engine("html", require("ejs").renderFile);

app.use(express.static("build/public"));

app.set("views", "build/public/views");

app.set("view engine", "ejs");

//accept json data
app.use(bodyparser.json({ limit: "10mb" }));
app.use(bodyparser.urlencoded({ extended: true }));
app.use(
    session({
        secret: SESSION_SECRET,
        cookie: {
            maxAge: 7 * 24 * 60 * 60 * 1000, //1 hour -> extended to one week upon client request, no sensitive information can be accessed anyways, and all orders are human verified
            httpOnly: true,
        },
        // secure: true, //when we get SSL #brokemans
        store: session_store,
        resave: true,
        saveUninitialized: true,
        unset: "destroy",
    })
);

// error logging
process.on('unhandledRejection', (err, p) => {
    console.log(err, p);
})

function assertObject(obj, keys: string[]): boolean {
    if (typeof obj != "object") return false;
    for (let i = 0; i < keys.length; i++) {
        if (!obj[keys[i]]) return false;
    }
    return true;
}

interface UserSession {
    logged_in: boolean;
    user: string;
    user_id: string; //or number
    admin: boolean;
    cart: Object;
}

//default values for each unique visit
app.use("/", (req, res, next) => {
    let properties = {
        logged_in: false,
        user: null,
        user_id: null,
        admin: false,
        cart: {},
    };
    for (let [key, value] of Object.entries(properties)) {
        if (!req.session[key]) {
            //if the property doesn't exist, set it
            req.session[key] = value;
        }
    }
    next();
});

const HTMLpages = [
    "about",
    "search_box",
    "search",
    "contact",
    "slideshow",
    "register",
    "login",
    "dashboard",
    "test",
    "reset_password",
    "partials/search_box",
    "import_test",
    // "hi",
];
HTMLpages.forEach((page) => {
    app.get(`/${page}`, (req, res) => {
        let properties = {
            logged_in: false,
            user: null,
            user_id: null,
            admin: false,
            cart: {},
        };
        for (let [key, value] of Object.entries(properties)) {
            if (req.session[key]) {
                properties[key] = req.session[key];
            }
        }
        if (page == "login" || page == "register" || page == "reset_password") {
            if (properties.logged_in) res.redirect("/");
            else res.render(page, properties);
        } else {
            res.render(page, properties);
        }
    });
});

const categories = [
        ["ABS Sensors", "ABS Sensor"],
        ["Alternators", "Alternator"],
        ["Brake Sensors", "Brake Sensor"],
        [ "Brake Calipers", "Brake Caliper"],
        ["Camshaft Sensors", "Camshaft"],
        ["Crankshaft Sensors", "Crankshaft"],
        ["Starters", "Starter"]
    ]
app.get("/landing", (req, res) => {
    let properties = {
        logged_in: false,
        user: null,
        user_id: null,
        admin: false,
        cart: {},
    };
    for (let [key, value] of Object.entries(properties)) {
        if (req.session[key]) {
            properties[key] = req.session[key];
        }
    }
    res.render("landing", {...properties, categories})
})

app.get("/edit_info", async(req, res) => {
    if(!req.session.logged_in) return res.sendStatus(401)
    console.log(req.session.user_id)
    if(req.session.user_db){
        res.render('edit_user', {...req.session.user_db, logged_in: true})
    } else{
        res.sendStatus(500)
    }
    
})

app.post("/edit_info", async (req, res) => {
    let properties = {
        logged_in: null,
        user: null,
        user_id: null,
    };
    for (let [key, value] of Object.entries(properties)) {
        properties[key] = req.session[key];
    }
    if (!properties.logged_in) {
        return res.redirect("/");
    }
    let errmsgs = [];
    const {
        id,
        company,
        email,
        user,
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
    } = req.body;
    let phone = "",
        postalStrip = "";
    let username = user || "";
    if (telephone) {
        phone = telephone.replace(/[^0-9]/g, "");
    }
    postalStrip = postal.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
    if (
        anyFalse([
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
        ])
    )
        errmsgs.push({ msg: "Please fill out all fields" });
    if (!isValidEmail(email))
        errmsgs.push({ msg: "Please enter a valid email address" });
    if (phone.length != 10)
        errmsgs.push({ msg: "Please enter a valid phone number" });
    if (!isValidPostal(postalStrip))
        errmsgs.push({ msg: "Please enter a valid postal code" });
    if (username && username.indexOf("@") > 0)
        errmsgs.push({ msg: "Username cannot contain @ character" });
    if (
        !(
            purchase == "<$1000" ||
            purchase == "$1000-$5000" ||
            purchase == "$5000-$10000" ||
            purchase == ">$10000"
        )
    ) {
        errmsgs.push({ msg: "Please fill out all fields" });
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
    if (errmsgs.length == 0) {
        let edit = await db.editUser(id, email, username, additional_info);
        edit.errmsgs.forEach((msg) => {
            errmsgs.push({ msg });
        });
    }
    if (errmsgs.length > 0) {
        //res.status(400).send(errmsgs);
        res.render("edit_user", {
            errors: errmsgs,
            id,
            email,
            username,
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
            ...properties,
        });
    } else {
        errmsgs.push({ msg: "edit successful" });
        res.render("edit_user", {
            errors: errmsgs,
            id,
            email,
            username,
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
            ...properties,
        });
    }
});

app.get("/admin/edit_user", async (req, res) => {
    let properties = {
        logged_in: false,
        user: null,
        user_id: null,
        admin: false,
        cart: {},
    };
    for (let [key, value] of Object.entries(properties)) {
        if (req.session[key]) {
            properties[key] = req.session[key];
        }
    }
    if (!properties.logged_in) return res.sendStatus(401);
    if (!properties.admin) return res.sendStatus(403);

    let { id } = req.query;
    if (!id) {
        return res.sendStatus(404);
    }
    console.log(id);
    let user = await db.getUserById(id);
    if (Array.isArray(user)) {
        if (user.length == 0) {
            return res.render("message", {
                page_name: "Edit User",
                message:
                    "That user is not found. If you experience this error, please copy the current url and contact us.",
                ...properties,
            });
        } else {
            user = user[0];
        }
    }
    res.render("admin/edit_user", { ...user, ...properties });
});

app.get("/admin/delete_user", async (req, res) => {
    let properties = {
        logged_in: false,
        user: null,
        user_id: null,
        admin: false,
        cart: {},
    };
    for (let [key, value] of Object.entries(properties)) {
        if (req.session[key]) {
            properties[key] = req.session[key];
        }
    }
    if (!properties.logged_in) return res.sendStatus(401);
    if (!properties.admin) return res.sendStatus(403);
    let { id } = req.query;
    if (!id) return res.sendStatus(404);
    console.log(id);
    db.deleteUser(id);
    res.send("ok");
});

//serve web pages
app.get("/", (req, res) => {
    let properties = {
        logged_in: null,
        user: null,
        user_id: null,
        admin: null,
    };
    for (let [key, value] of Object.entries(properties)) {
        properties[key] = req.session[key];
    }
    res.render("home", properties);
});

app.get("/message", async (req, res) => {
    let { message } = req.query;
    res.render("message", { message: message, page_name: "Message" });
});

app.get("/email", async (req, res) => {
    let token = req.query.token;
    token = token || "";
    let verification = await db.verifyEmail(token);
    if (verification.errmsg) {
        res.render("message", {
            message: verification.errmsg,
            page_name: "Email Verification",
        });
    } else {
        res.render("message", {
            message: "Your email has been successfully verified!",
            page_name: "Email Verification",
        });
    }
});

app.get("/reset", async (req, res) => {
    let properties = {
        logged_in: null,
        user: null,
        user_id: null,
        admin: null,
    };
    for (let [key, value] of Object.entries(properties)) {
        properties[key] = req.session[key];
    }
    if (properties.logged_in) return res.redirect("/");
    let token = req.query.token;
    token = token || "";
    res.render("reset", { ...properties, token: token });
});

app.post("/reset", async (req, res) => {
    let properties = {
        logged_in: null,
        user: null,
        user_id: null,
        admin: null,
    };
    for (let [key, value] of Object.entries(properties)) {
        properties[key] = req.session[key];
    }
    if (properties.logged_in) res.redirect("/");

    const { token, pass, passconfirm } = req.body;
    if (pass != passconfirm) {
        return res.render("reset", {
            ...properties,
            token: token,
            errors: [{ msg: "Passwords do not match!" }],
        });
    }
    if (token) {
        let user = await db.queryPassToken(token);
        console.log(user);
        if (user) {
            await db.changePass(user.email, pass);
        }
    }
    res.render("message", {
        ...properties,
        page_name: "Change Password",
        message: "Your password has been reset. You may log in now.",
    });
});

app.get("/change_password", (req, res) => {
    let properties = {
        logged_in: null,
        user: null,
        user_id: null,
        temp_pass: null,
        admin: null,
    };
    for (let [key, value] of Object.entries(properties)) {
        properties[key] = req.session[key];
    }
    if (!properties.logged_in) {
        return res.redirect("/");
    }
    properties.temp_pass = properties.temp_pass || "none";
    let errmsg = [{ msg: "Please change your password" }];
    if (!properties.logged_in && !properties.temp_pass) res.redirect("/");
    else
        res.render("change_password", {
            ...properties,
            temp_pass: properties.temp_pass,
        });
});

app.post("/reset_password", async (req, res) => {
    let properties = {
        logged_in: null,
        user: null,
        user_id: null,
        temp_pass: null,
        admin: null,
    };
    for (let [key, value] of Object.entries(properties)) {
        properties[key] = req.session[key];
    }
    if (properties.logged_in) res.redirect("/");
    else {
        const { email } = req.body;
        console.log(email);
        let data = await db.resetPassword(email);
        console.log(data);
        if (data.success) {
            registerEmail.sendMail({
                from: process.env.REGISTRATION,
                to: email,
                subject: "Aceway Auto Password Reset",
                text:
                    `Reset your Aceway Auto account password by following the link: ${process.env.DOMAIN}/reset?token=` +
                    data.pass_token,
                html: `<a href=${process.env.DOMAIN}/reset?token=${data.pass_token}> Reset your password </a>`,
            });
            registerEmail.sendMail({
                from: process.env.REGISTRATION,
                to: process.env.REGISTRATION,
                subject: `Aceway Auto Password Reset for user ${email}`,
                html: `<a href=${process.env.DOMAIN}/reset?token=${data.pass_token}> Reset your password </a>`,
            });
            res.render("message", {
                ...properties,
                message: data.msg,
                page_name: "Reset Password",
            });
        } else {
            // display error message
            res.render("reset_password", {
                ...properties,
                errors: [{ msg: data.msg }],
            });
        }
    }
});

app.get("/get_users", async (req, res) => {
    let properties = {
        logged_in: null,
        user: null,
        user_id: null,
        admin: null,
    };
    for (let [key, value] of Object.entries(properties)) {
        properties[key] = req.session[key];
    }

    if (!properties.logged_in) return res.sendStatus(401);
    if (!properties.admin) return res.sendStatus(403);

    res.json(await db.getUnapprovedUsers());
});

app.get("/get_all_users", async (req, res) => {
    let properties = {
        logged_in: null,
        user: null,
        user_id: null,
        admin: null,
    };
    for (let [key, value] of Object.entries(properties)) {
        properties[key] = req.session[key];
    }
    if (!properties.logged_in) return res.sendStatus(401);
    if (!properties.admin) return res.sendStatus(403);
    try {
        res.json(await db.getUsers());
    } catch (err) {
        res.sendStatus(500);
        console.log(err);
    }
});

app.post("/change_password", async (req, res) => {
    let properties = {
        logged_in: null,
        user: null,
        user_id: null,
        temp_pass: null,
        admin: null,
    };
    for (let [key, value] of Object.entries(properties)) {
        properties[key] = req.session[key];
    }
    if (!properties.logged_in && !properties.temp_pass) res.redirect("/");
    else {
        const { prevpass, pass, passconfirm } = req.body;
        let errmsgs = [];
        // check if prevpass checks out
        let login = await db.login(properties.user, prevpass);
        if (login.match) {
            if (pass == passconfirm) {
                db.changePass(properties.user, pass);
            } else {
                errmsgs.push({ msg: "New passwords do not match" });
            }
        } else {
            errmsgs.push({ msg: "Wrong password" });
        }
        if (errmsgs.length > 0) {
            res.render("change_password", {
                errors: errmsgs,
                ...properties,
                temp_pass: properties.temp_pass || "none",
            });
        } else {
            req.session.logged_in = true;
            delete req.session.temp_pass;
            res.render("message", {
                logged_in: true,
                page_name: "Change Password",
                message: "Password has been changed",
            });
            registerEmail.sendMail({
                from: process.env.REGISTRATION,
                to: process.env.REGISTRATION,
                subject: `Aceway Auto Password Has Been Changed for user ${login.user.email}`,
                text: `Aceway Auto Password Has Been Changed for user ${login.user.email}`,
            });
            registerEmail.sendMail({
                from: process.env.REGISTRATION,
                to: login.user.email,
                subject: `Your Aceway Auto Password Has Been Changed`,
                text: `If you did not issue this request, or believe that this is an error, please contact us as soon as possible.`,
            });
        }
    }
});

//api routes
app.post("/register", async (req, res) => {
    let properties = {
        logged_in: null,
        user: null,
        user_id: null,
        admin: null,
    };
    for (let [key, value] of Object.entries(properties)) {
        properties[key] = req.session[key];
    }
    if (properties.logged_in) {
        res.redirect("/");
        return;
    }
    let errmsgs = [];
    const {
        company,
        email,
        user,
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
        passconfirm,
    } = req.body;
    let phone = "",
        postalStrip = "";
    let username = user || null;
    if (telephone) {
        phone = telephone.replace(/[^0-9]/g, "");
    }
    if (postal) postalStrip = postal.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
    if (
        anyFalse([
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
            passconfirm,
        ])
    )
        errmsgs.push({ msg: "Please fill out all fields" });
    if (pass != passconfirm) errmsgs.push({ msg: "Passwords do not match" });
    if (!isValidEmail(email))
        errmsgs.push({ msg: "Please enter a valid email address" });
    if (phone.length != 10)
        errmsgs.push({ msg: "Please enter a valid phone number" });
    if (username && username.indexOf("@") > 0)
        errmsgs.push({ msg: "Username cannot contain @ character" });
    if (!isValidPostal(postalStrip))
        errmsgs.push({ msg: "Please enter a valid postal code" });
    if (
        !(
            purchase == "<$1000" ||
            purchase == "$1000-$5000" ||
            purchase == "$5000-$10000" ||
            purchase == ">$10000"
        )
    ) {
        errmsgs.push({ msg: "Please fill out all fields" });
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
        approved: 0,
    };
    let register = null;
    if (errmsgs.length == 0) {
        console.log(username);
        // no errors so far, try to register user in db
        register = await db.register(email, username, pass, additional_info);
        register.errmsgs.forEach((msg) => {
            errmsgs.push({ msg });
        });
    }
    if (errmsgs.length > 0) {
        //res.status(400).send(errmsgs);
        res.render("register", {
            errors: errmsgs,
            email,
            username,
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
            ...properties,
        });
    } else {
        // everything good, send verification email
        registerEmail.sendMail({
            from: process.env.REGISTRATION,
            to: email,
            subject: "Verify Your Aceway Auto Account",
            text:
                `Verify your Aceway Auto account by following the link: ${process.env.DOMAIN}/email?token=` +
                register.email_token,
            html: `<a href="${process.env.DOMAIN}/email?token=${register.email_token}">Verify your email </a>`,
        });
        let emailcontent = `<p>Please login to your admin account on Aceway Auto to view the registration.</p> <a href = "${process.env.DOMAIN}/admin/account_requests"> View Registrations </a>`;
        // console.log(emailcontent)
        registerEmail.sendMail({
            from: process.env.REGISTRATION,
            to: process.env.REGISTRATION,
            subject: "A User Has Created an Aceway Account",
            html: emailcontent,
        });
        res.render("message", {
            page_name: "Register",
            message:
                "Thank you for registering! An email has been sent to your email to verify your email.",
        });
    }
});

app.post("/admin/edit_user", async (req, res) => {
    let properties = {
        logged_in: null,
        user: null,
        user_id: null,
        admin: null,
    };
    for (let [key, value] of Object.entries(properties)) {
        properties[key] = req.session[key];
    }
    if (!properties.logged_in || !properties.admin) {
        return res.redirect("/");
    }
    let errmsgs = [];
    const {
        id,
        company,
        email,
        user,
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
        discount
    } = req.body;
    let phone = "",
        postalStrip = "";
    let username = user || "";
    if (telephone) {
        phone = telephone.replace(/[^0-9]/g, "");
    }
    postalStrip = postal.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
    if (
        anyFalse([
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
            discount
        ])
    )
        errmsgs.push({ msg: "Please fill out all fields" });
    if (!isValidEmail(email))
        errmsgs.push({ msg: "Please enter a valid email address" });
    if (phone.length != 10)
        errmsgs.push({ msg: "Please enter a valid phone number" });
    if (!isValidPostal(postalStrip))
        errmsgs.push({ msg: "Please enter a valid postal code" });
    if (username && username.indexOf("@") > 0)
        errmsgs.push({ msg: "Username cannot contain @ character" });
    if (
        !(
            purchase == "<$1000" ||
            purchase == "$1000-$5000" ||
            purchase == "$5000-$10000" ||
            purchase == ">$10000"
        )
    ) {
        errmsgs.push({ msg: "Please fill out all fields" });
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
        discount
    };
    if (errmsgs.length == 0) {
        let edit = await db.editUser(id, email, username, additional_info);
        edit.errmsgs.forEach((msg) => {
            errmsgs.push({ msg });
        });
    }
    if (errmsgs.length > 0) {
        //res.status(400).send(errmsgs);
        res.render("admin/edit_user", {
            errors: errmsgs,
            id,
            email,
            username,
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
            discount,
            ...properties,
        });
    } else {
        errmsgs.push({ msg: "edit successful" });
        res.render("admin/edit_user", {
            errors: errmsgs,
            id,
            email,
            username,
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
            discount,
            ...properties,
        });
    }
});

app.post("/admin/adduser", async (req, res) => {
    let properties = {
        logged_in: null,
        user: null,
        user_id: null,
        admin: null,
    };
    for (let [key, value] of Object.entries(properties)) {
        properties[key] = req.session[key];
    }
    if (!properties.logged_in || !properties.admin) {
        res.redirect("/");
        return;
    }
    let errmsgs = [];
    const {
        company,
        email,
        user,
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
        discount
    } = req.body;
    let phone = "",
        postalStrip = "";
    let username = user || "";
    if (telephone) {
        phone = telephone.replace(/[^0-9]/g, "");
    }
    postalStrip = postal.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
    if (
        anyFalse([
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
            discount
        ])
    )
        errmsgs.push({ msg: "Please fill out all fields" });
    if (!isValidEmail(email))
        errmsgs.push({ msg: "Please enter a valid email address" });
    if (phone.length != 10)
        errmsgs.push({ msg: "Please enter a valid phone number" });
    if (!isValidPostal(postalStrip))
        errmsgs.push({ msg: "Please enter a valid postal code" });
    if (username && username.indexOf("@") > 0)
        errmsgs.push({ msg: "Username cannot contain @ character" });
    if (
        !(
            purchase == "<$1000" ||
            purchase == "$1000-$5000" ||
            purchase == "$5000-$10000" ||
            purchase == ">$10000"
        )
    ) {
        errmsgs.push({ msg: "Please fill out all fields" });
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
        discount
    };
    let password = "";
    if (errmsgs.length == 0) {
        //generate a temporary password string
        password = randString("12");
        let register = await db.register(
            email,
            username,
            password,
            additional_info
        );
        register.errmsgs.forEach((msg) => {
            errmsgs.push({ msg });
        });
    }
    if (errmsgs.length > 0) {
        //res.status(400).send(errmsgs);
        res.render("admin/adduser", {
            errors: errmsgs,
            email,
            username,
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
            discount,
            ...properties,
        });
    } else {
        console.log(process.env.DOMAIN);
        registerEmail.sendMail({
            from: process.env.REGISTRATION,
            to: email,
            subject: "Your Aceway Auto Account Has Been Created!",
            text:
                `You may log in using your email at: ${process.env.DOMAIN}/login` +
                "Your one-time password is " +
                password,
            html: `<a href="${process.env.DOMAIN}/login"> Log in to your Aceway Auto account </a> <p> Your one-time password is ${password} </p>`,
        });
        registerEmail.sendMail({
            from: process.env.REGISTRATION,
            to: process.env.REGISTRATION,
            subject: "An Account has been created for a user",
            text: `User email: ${email} One-time Password: ${password}`,
        });
        res.render("message", {
            page_name: "Add User",
            message: "User Password: " + password,
        });
    }
});

app.post("/login", async (req, res) => {
    const { user, pass } = req.body;
    let properties = {
        logged_in: null,
        user: null,
        user_id: null,
        admin: null,
    };
    for (let [key, value] of Object.entries(properties)) {
        properties[key] = req.session[key];
    }
    if (properties.logged_in) res.redirect("/");
    let login = await db.login(user, pass);
    console.log(login);
    let errmsgs = [];
    login.errmsgs.forEach((msg) => {
        errmsgs.push({ msg });
    });
    if (login.match && login.user.approved) {
        if (login.user.temp_pass == 1) {
            // prompt user to reset password
            req.session.user = user;
            req.session.user_id = login.user_id;
            req.session.logged_in = true;
            req.session.temp_pass = pass;
            res.redirect("/change_password");
        } else {
            req.session.user_db = login.user;
            req.session.user = user;
            req.session.logged_in = true;
            req.session.admin = login.user.is_admin;
            if (req.session.admin) {
                res.redirect("/dashboard");
            } else {
                res.redirect("/");
            }
        }
    } else if (login.match && !login.user.approved) {
        res.render("message", {
            page_name: "Login",
            message:
                "Your account is pending approval. If you have any questions, please contact us through our contact page.",
        });
    } else {
        res.render("login", {
            errors: errmsgs,
            user: user,
            ...properties,
        });
    }
});

app.post("/logout", (req, res) => {
    let properties = {
        logged_in: null,
        user: null,
        user_id: null,
        admin: null,
    };
    for (let [key, value] of Object.entries(properties)) {
        properties[key] = req.session[key];
    }
    req.session = null;
    res.render("message", {
        logged_in: false,
        page_name: "Logout",
        message: "You are now logged out.",
    });
});

app.use("/search", async (req, res, next) => {
    // console.log(req.query, req.body);
    for (let [key, value] of Object.entries(req.query)) {
        req.query[key] = makeNullIfAny(value);
    }
    for (let [key, value] of Object.entries(req.body)) {
        req.body[key] = makeNullIfAny(value);
    }
    // console.log(req.query, req.body);
    next();
});

app.post("/search/full", async (req, res) => {
    let admin = req.session.admin;
    admin = admin || false;
    //get year from the request
    let { make, model, year, engine, offset, limit, oe_number } = req.body;

    year = parseInt(year);
    if (isNaN(year)) year = null;

    // debugLog([make, model, year, engine]);
    let logged_in = req.session.logged_in || false;

    try {
        let parts = await db.paginatedSearch(
            make,
            model,
            year,
            engine,
            0,
            10000,
            req.session.logged_in
        );
        // debugLog(parts);
        // res.render('search', { parts, logged_in });
        res.json({ parts, admin });
        // res.sendStatus(200);
    } catch (err) {
        console.log(err);
        res.sendStatus(500);
    }
});

app.post("/search/category", async (req, res) => {
    let { category } = req.body;
    let { admin } = req.session;
    if (!category) category = "";
    try {
        let parts = await db.searchCategories(category, req.session.logged_in);
        res.json({ parts, admin });
        console.log(parts);
    } catch (err) {
        console.log(err);
        res.sendStatus(500);
    }
});

app.post("/search/id_number", async (req, res) => {
    let { id_number } = req.body;
    let { admin } = req.session;
    admin = admin || false;
    try {
        if (id_number) id_number = id_number.trim();
        let parts = await db.getPartByIdNumber(
            id_number,
            req.session.logged_in
        );
        res.json({ parts, admin });
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
        res.json(apps);
    } catch (err) {
        console.log(err);
        res.sendStatus(500);
        return;
    }
    // res.sendStatus(200);
});

app.use("/admin", async (req, res, next) => {
    let properties = {
        logged_in: null,
        user: null,
        user_id: null,
        admin: null,
    };
    for (let [key, value] of Object.entries(properties)) {
        properties[key] = req.session[key];
    }
    if (!properties.logged_in || !properties.admin) {
        res.redirect("/");
    } else {
        next();
    }
});
const adminPages = [
    "",
    "adduser",
    "addpart",
    "account_requests",
    "search_users",
    "debug"
];

adminPages.forEach((page) => {
    app.get(`/admin/${page}`, (req, res) => {
        let properties = {
            logged_in: null,
            user: null,
            user_id: null,
            admin: null,
        };
        for (let [key, value] of Object.entries(properties)) {
            properties[key] = req.session[key];
        }
        if (!req.session.admin) res.redirect("/");
        else {
            if (page != "") page = "/" + page;
            res.render(`admin${page}`, properties);
        }
    });
});

app.post('/admin/debug/execsql', async (req, res) => {
    if (!req.session.admin) return res.redirect('/');
    console.log(req.session)
    let {cmd} = req.body;
    let exec = process.env.EXECSQL;
    let execStatus = 'default';
    if(exec == '0'){
        // log who tried to exec command
        console.log("COMMAND EXECUTION ATTEMPT:", cmd, req.session.user_db.email);
        execStatus = "SQL Execution is disabled.";
    }
    else if(exec == '1'){
        // log command executions
        console.log("COMAND EXECUTION COMPLETION", cmd, req.session.user_db.email);
        execStatus = await db.execSql(cmd);
    }
    res.send(JSON.stringify(execStatus));
})

app.post('/admin/change_price', async (req, res) => {
    if (!req.session.admin) return res.redirect('/');
    
    let {percent} = req.body;

    
    try{
        percent = parseFloat(percent);
    } catch (e) {
        return res.send('An error occurred. Please take note of the following error message. ' + e)
    }

    if (isNaN(percent)) return res.send('The inputted number is not a percent!');
    console.log(percent)

    try{
        await db.updatePrice(percent);
    } catch (e) {
        return res.send('An error occurred. Please take note of the following error message. ' + e)
    }
    return res.send('All prices changed by ' + percent + '%')
})

app.post("/admin/revert_price", async (req, res) => {
    if(!req.session.admin) return res.redirect('/');

    let response = "default";
    try{
        await db.revertPrice();
        response = "Prices reverted to last set price";
    } catch(e){ response = e; }

    res.send(response);
})

app.delete("/admin/editpart", async (req, res) => {
    let {part_id} = req.query
    // console.log(part_id);
    await db.deletePart(part_id);
    return res.sendStatus(200)
})

app.get("/admin/editpart", async (req, res) => {
    let properties = {
        logged_in: null,
        user: null,
        user_id: null,
        admin: null,
    };
    for (let [key, value] of Object.entries(properties)) {
        properties[key] = req.session[key];
    }
    if (!properties.logged_in) return res.sendStatus(401);
    if (!properties.admin) return res.sendStatus(403);
    // expect req.query.part_id
    const { part_id } = req.query;
    if (!part_id) {
        return res.render("message", {
            ...properties,
            message:
                "Please edit a part by clicking the 'Edit Part' button from the search page!",
            page_name: "Edit Part",
        });
    }
    let part = await db.getPartByDbId(part_id);
    part.image_url = `${part.make}-${part.oe_number}`;
    const applications = await db.getApps(part_id);
    let apps = [];
    for (let i = 0; i < applications.length; i++) {
        const engines = await db.getEnginesByApp(applications[i].id);
        let engStr = engines[0] ? engines[0].engine.toUpperCase() : "";
        for (let j = 1; j < engines.length; j++) {
            engStr += "," + engines[j].engine.toUpperCase();
        }
        apps.push({
            ...applications[i],
            engine_string: engStr,
        });
    }
    const ints = await db.getInts(part_id);
    if (!part) {
        return res.render("message", {
            ...properties,
            message: "This part is not found!",
            page_name: "Edit Part",
        });
    }
    console.log(part)
    res.render("admin/editpart", {
        ...properties,
        part: part,
        apps: apps,
        ints: ints,
    });
});

app.post("/admin/addpart", async (req, res) => {
    debugLog("recieved request to upload parts");
    let properties = {
        logged_in: null,
        user: null,
        user_id: null,
        admin: null,
    };
    for (let [key, value] of Object.entries(properties)) {
        properties[key] = req.session[key];
    }
    if (!properties.logged_in) return res.sendStatus(401);
    if (!properties.admin) return res.sendStatus(403);
    try {
        let { parts, errors } = req.body;
        console.log(parts);
        let errmsgs = [];
        errors.forEach((error) => {
            errmsgs.push({
                msg: error.message + " on line " + error.line,
            });
        });
        res.render("admin/addpart", { ...properties, errors: errmsgs });
        for (let i = 0; i < parts.length; i++) {
            if (parts[i].interchange) {
                await db.addPart(
                    parts[i].part,
                    parts[i].applications,
                    parts[i].interchange
                );
            } else {
                await db.addPart(parts[i].part, parts[i].applications);
            }
        }
        debugLog("finished uploading");
    } catch (err) {
        console.log(err);
        res.sendStatus(500);
    }
});

app.post("/admin/editpart", upload.single("part_img"), async (req, res) => {
    // construct part db entry
    let part: PartDBEntry = null,
        applications: Array<Application> = null;
    let interchanges = null;
    try {
        let {
            make,
            oe_number,
            frey_number,
            price,
            description,
            enabled,
            in_stock,
            brand,
            engines,
        } = req.body;
        console.log(")(#*Q@)(%*)(#*)(@%*" + in_stock)
        if (!brand) brand = null;
        if (!engines) engines = "";
        if(Array.isArray(engines)){
            for(var i = 0; i < engines.length; i++){
                try{
                    engines[i] = engines[i].toLowerCase();
                }
                catch(e){
                    engines[i] = ""
                }
            }
        }
        else{
            try{ engines = engines.toLowerCase() }
            catch(e) { engines = "" }
        }
        make = make || make.toLowerCase();
        price = price.split(".");
        if (price.length > 1) {
            if (price[1].length == 1) price[1] += "0";
            else price[1] = price[1].substr(0, 2);
        } else {
            price.push("00");
        }
        price = parseInt(price.join(""));
        part = {
            make,
            oe_number,
            frey_number,
            price,
            brand,
            in_stock: in_stock ? in_stock : 0,
            description: description ? description : null,
            enabled: enabled ? enabled : 1,
        };
        if (req.file) {
            const tempPath = req.file.path;
            const fileExtension = path
                .extname(req.file.originalname)
                .toLowerCase();
            let image_url = part.make + "-" + part.oe_number + fileExtension;
            // debugLog(image_url);
            const targetPath = path.join(
                __dirname,
                "./public/img/parts",
                image_url
            );
            if (
                fileExtension === ".jpg" ||
                fileExtension === ".png" ||
                fileExtension === ".jpeg"
            ) {
                fs.rename(tempPath, targetPath, (err) => {
                    if (err) {
                        return debugLog([err, res]);
                    }
                });
            }
        }
        // construct applications array
        applications = [];
        if (typeof req.body.model != "string") {
            for (let i = 0; i < req.body.model.length; i++) {
                let eng_arr = engines[i];
                try {
                    eng_arr = eng_arr.split(",");
                } catch {
                    eng_arr = [];
                } finally {
                    applications.push({
                        model: req.body.model[i],
                        begin_year: req.body.begin_year[i],
                        end_year: req.body.end_year[i],
                        engines: eng_arr,
                    });
                }
            }
        } else {
            let eng_arr = engines;
            try {
                eng_arr = eng_arr.split(",");
            } catch {
                eng_arr = [];
            } finally {
                applications.push({
                    model: req.body.model,
                    begin_year: req.body.begin_year,
                    end_year: req.body.end_year,
                    engines: eng_arr,
                });
            }
        }

        // construct interchange numbers array
        interchanges = [];
        // check if int_number exists
        if (req.body.int_number) {
            //if there are multiple int_numbers then should be array
            if (Array.isArray(req.body.int_number)) {
                for (let i = 0; i < req.body.int_number.length; i++) {
                    interchanges.push(req.body.int_number[i]);
                }
            } else {
                // else only one int_number
                interchanges.push(req.body.int_number);
            }
        }
    } catch (err) {
        console.log(err);
        res.sendStatus(500);
    }

    try {
        console.log(part, applications, interchanges);
        let part_id = await db.addPart(part, applications, interchanges);
        res.redirect("/admin/editpart?part_id=" + part_id);
    } catch (err) {
        console.log(err);
        res.sendStatus(500);
    }
});

app.use("/names", async (req, res, next) => {
    for (let [key, value] of Object.entries(req.query)) {
        req.query[key] = makeNullIfAny(value);
    }
    for (let [key, value] of Object.entries(req.body)) {
        req.body[key] = makeNullIfAny(value);
    }
    next();
});

app.get("/names/makes", async (req, res) => {
    let makes = await db.getMakes();
    // debugLog(makes);
    res.json(makes);
});

app.get("/names/years", async (req, res) => {
    try {
        let { make } = req.query;
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
        let models = await db.getModels(make, year);
        // debugLog(models);
        res.json(models);
    } catch (err) {
        console.log(err);
        res.sendStatus(500);
    }
    // res.sendStatus(200);
});

app.get("/names/engine", async (req, res) => {
    let { make, year, model } = req.query;
    let engines = await db.getEngines(make, year, model);
    debugLog(engines);
    res.json(engines);
    // res.sendStatus(200);
});

app.get("/cart", async (req, res) => {
    let cart = [];
    // console.log("before", req.session.cart);
    req.session.cart = req.session.cart || {};
    // console.log("after", req.session.cart);

    // req.session.cart = [
    //     "4516":{
    //         id: 4516,
    //         make: "acura",
    //         oe_number: "57450tr3a01-a",
    //         description: "ABS Sensor",
    //         frey_number: "abs151",
    //         price: 1557,
    //         quantity: 1,
    //     },
    // ];

    for (let part of Object.values(req.session.cart)) {
        cart.push(part);
    }

    //sort products alphabetically
    cart.sort((a, b) => {
        if (a.description > b.description) {
            return 1;
        } else if (a.description == b.description) {
            return 0;
        } else {
            return -1;
        }
    });

    // get part info for cart
    res.render("cart", {
        cart: cart,
        logged_in: req.session.logged_in,
        // parts: parts
    });
});
//for cart updates on the cart page, multi or single part updates
app.post("/cart", async (req, res) => {
    try {
        let { updates } = req.body;
        req.session.cart = req.session.cart || {};
        let old_cart = {...(req.session.cart)};
        let cart_error = false
        updates.forEach((part) => {
            if (part.id && part.quantity) {
                if (part.quantity <= 0) {
                    delete req.session.cart[part.id];
                } else {
                    req.session.cart[part.id].quantity = part.quantity;
                }
            } else {
                cart_error = true;
            }
        });
        if(cart_error) return res.sendStatus(403);

        let stock_updates = {"updates": await validateCart(req.session.cart)};
        if(stock_updates.updates.length > 0){
            req.session.cart = old_cart // don't update the cart with new values
            return res.status(203).json(stock_updates);
        }

        res.sendStatus(200);

    } catch (err) {
        console.log(err);
        res.sendStatus(500);
    }
});

app.post("/admin/update_stock", async (req, res) => {
    let { updates } = req.body;
    await db.updateStock(updates);
    res.sendStatus(200);
});

app.post("/admin/update_price", async (req, res) => {
    let { updates } = req.body;
    await db.updatePriceBatch(updates);
    res.sendStatus(200);
});

//for add to cart, single part updates
app.post("/cart/part", async (req, res) => {
    try {
        let { part } = req.body;
        console.log(part);
        // debugLog(part);
        req.session.cart = req.session.cart || {};


        //check if the part is already in the cart
        if (
            !part?.id ||
            !part?.quantity ||
            !Number.isFinite(part.quantity) ||
            part.quantity <= 0
        ) {
            res.sendStatus(403);
            return;
        }
        let desired_quantity = part.quantity;

        //part already is in the cart
        if (req.session.cart[part.id]) {
            desired_quantity += req.session.cart[part.id].quantity;
        } else {
            //part is not in the cart
            // return_quantity = validateAddAmount(part.id, desired_quantity);
        }

        let return_quantity = await validateAddAmount(
            part.id,
            desired_quantity
        );

        // orignally had in cart, but stock disappeared due to an order, have to reset the amount
        // check if currently in cart > in stock, if so reduce in cart to in stock amount
        if (
            req.session.cart[part.id] &&
            return_quantity < req.session.cart[part.id].quantity
        ) {
            req.session.cart[part.id].quantity = return_quantity;
        }
        let response = {
            out_of_stock: false,
            in_cart: null,
            in_stock: null,
        };
        if (return_quantity != desired_quantity) {
            // not enough in stock, return with message
            response.out_of_stock = true;
            response.in_cart = req.session.cart[part.id]?.quantity ?? 0;
            response.in_stock = return_quantity;
        } else {
            req.session.cart[part.id] = part;
            req.session.cart[part.id].quantity = desired_quantity;
        }

        // console.log("@@@@@@@@@@@current cart", Object.req.session.cart);

        res.status(200).json(response);
    } catch (err) {
        console.log(err);
        res.sendStatus(500);
    }
});

app.delete("/cart/part", async (req, res) => {
    try {
        let { part } = req.body;
        req.session.cart = req.session.cart || {};
        if (req.session.cart[part.id]) {
            delete req.session.cart[part.id];
        }
        res.sendStatus(200);
    } catch (err) {
        console.log(err);
        res.sendStatus(500);
    }
});

//remove 1 or whole thing
app.delete("/cart", async (req, res) => {
    req.session.cart = {};
    console.log(req.session.cart);
    res.sendStatus(200);
});

app.post("/cart/place_order", async (req, res) => {
    if (!req.session.logged_in) return res.redirect("/");
    let { delivery, po_number, comments } = req.body;

    debugLog(req.body);
    if (delivery != "Delivery" && delivery != "Pickup") {
        delivery = "Did not pick";
    }

    if (po_number == "N/A" || !po_number) {
        return res.sendStatus(400);
    }
    console.log(po_number);

    // const validPayment = ['Credit', 'Cash', 'Cheque', 'LOC'];
    // if(validPayment.indexOf(payment) == -1) return res.send(400);
    
    // validate parts in cart
    let stock_updates = await validateCart(req.session.cart);
    if(stock_updates.length > 0){
        return res.status(403).send('invalid cart')
    }    

    const currentDate = new Date();
    // convert current date to America/Toronto time
    const localTime = currentDate.toLocaleString("en-CA", {
        timeZone: process.env.TIME_ZONE,
    });
    let parts = "";
    let total = 0;
    let num_parts = 0;
    for (let part of Object.values(req.session.cart)) {
        let subtotal = part.price * part.quantity; // / 100;
        let html = `
        <tr>
            <td>${part.oe_number.toUpperCase()}</td>
            <td>${part.description}</td>
            <td>${part.quantity}</td>
            <td>$${part.price / 100}</td>
            <td>$${subtotal / 100}</td>
        </tr>
        `;
        parts += html + "\n";
        total += subtotal;
        num_parts += parseInt(part.quantity);
    }
    let emailHTML = `
    <p style="margin-bottom: 20px"> <b> List of parts: </b> </p>
    <table style="width:100%; max-width: 700px;">
        <tr>
            <th style="text-align: left">OE #</th>
            <th style="text-align: left">Description</th>
            <th style="text-align: left">QTY</th>
            <th style="text-align: left">PPU</th>
            <th style="text-align: left">Amount</th>
        </tr>
        ${parts}
    </table>
    <div style="max-width: 700px">
        <p style="text-align:right; margin-right:30px"> <b>Sub-Total</b> $${roundTo2Decimals(
            total
        )} </p>
        <p style="text-align:right; margin-right:30px"> <b>HST (13%)</b> $${roundTo2Decimals(
            Math.round((total * 13) / 100)
        )} </p>
        <p style="text-align:right; margin-right:30px"> <b>Total</b> $${roundTo2Decimals(
            Math.round((total * 113) / 100)
        )}</p>
        <p style="text-align:right; margin-right:30px"> <b>Total Number of Parts</b> ${num_parts} </p>
    </div>
    
    <p> <b>PO Number: </b> ${po_number}</p>
    
    <p> <b> User contact information: </b> </p>
    <p> <b> First Name: </b> ${req.session.user_db.contact_first} </p>
    <p> <b> Last Name: </b> ${req.session.user_db.contact_last} </p>
    <p> <b> Company Name: </b> ${req.session.user_db.company} </p>
    <p> <b> Email: </b> ${req.session.user_db.email} </p>
    <p> <b> Telephone: </b> ${req.session.user_db.telephone} </p>
    <p> <b> Fax: </b> ${req.session.user_db.fax || "No Fax"} </p>
    <p> <b> Billing Information: </b> </p>
    <p> ${req.session.user_db.address1} </p>
    <p> ${req.session.user_db.address2} </p>
    <p> ${req.session.user_db.city.toUpperCase()} </p>
    <p> ${req.session.user_db.province.toUpperCase()} </p>
    <p> ${req.session.user_db.postal.toUpperCase()} </p>
    <p> <b> Order placed at: </b> ${localTime} </p>

    <p><b>Delivery Option: </b> ${delivery}</p>
    <p><b>Additional Comments: </b> ${comments}</p>
    `;
    transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: process.env.ORDER_DEST,
        subject: "An order has been placed",
        html: emailHTML,
    });
    console.log(req.session.user);
    transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: req.session.user,
        subject: "An order has been placed",
        html: emailHTML,
    });
    reduceStock(req.session.cart)
    req.session.cart = {};
    res.render("message", {
        page_name: "Cart",
        message:
            "Thank you for placing an order. An email will be sent to you to process your order.",
    });
});

app.post("/user/approve", async (req, res) => {
    const { id, status, discount } = req.body;
    if (!req.session.logged_in) return res.send(401);
    if (!req.session.admin) return res.send(403);
    if (!id || !status || (status != 1 && status != -1)) return res.send(400);
    try {
        let user = await db.approveUser(id, status, discount);
        console.log(user);
        if (user.length > 0 && status == 1) {
            registerEmail.sendMail({
                from: process.env.REGISTRATION,
                to: user[0].email,
                subject: "Aceway Auto Account Approval",
                text:
                    "Your Aceway Auto account has been approved! You may now log in.",
                html: `<p>Your Aceway Auto account has been approved! You may now log in.</p> <a href=${process.env.DOMAIN}/login> Login </a>`,
            });
            registerEmail.sendMail({
                from: process.env.REGISTRATION,
                to: process.env.REGISTRATION,
                subject: "Aceway Auto Account Approval",
                text: `User ${user[0].email} has been approved`,
            });
        }
        res.sendStatus(200);
    } catch (err) {
        console.log(err);
        res.send(500);
    }
});

app.post("/int", (req, res) => {
    let { part_name } = req.body;

    debugLog(part_name);
    res.sendStatus(200);
});

app.get('/account/discount', async (req, res) => {
    console.log(req.session)
    // check if user is logged in
    if(!req.session.logged_in) return res.json({"discount": '0'})
    let user = await db.getUserById(req.session.user_db.id);
    console.log(user)
    req.session.user_db = user[0];
    res.json({"discount": req.session.user_db.discount});
})

app.listen(PORT, () => {
    console.log("started on", PORT);
});

function debugLog(param) {
    if (process.env.ENVIRONMENT == "dev") {
        console.log(param);
    }
}
function makeNullIfAny(value) {
    return value.toLowerCase() == "any" ? null : value;
}
function anyFalse(arr) {
    let anyFalse = false;
    arr.forEach((element) => {
        if (!element) anyFalse = true;
    });
    return anyFalse;
}
function isValidEmail(email) {
    return /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/.test(
        email
    );
}
function isValidPostal(postal) {
    return /[a-z]\d[a-z]\d[a-z]\d/.test(postal) && postal.length == 6;
}

function randString(length) {
    let result = "";
    const charset =
        "QWERTYUIOPASDFGHJKLZXCVBNMqwertyuiopasdfghjklzxcvbnm1234567890!@#$%^&*()";
    const set_length = charset.length;
    for (let i = 0; i < length; i++) {
        result += charset[Math.floor(Math.random() * set_length)];
    }
    return result;
}

function roundTo2Decimals(cents: number): string {
    let price_string = cents.toString();
    let only_cents = price_string.substr(price_string.length - 2);
    let only_dollars = price_string.substr(0, price_string.length - 2);
    return `${only_dollars}.${only_cents}`;
}

async function validateAddAmount(part_id, amount) {
    console.log(part_id);
    let part_db = await db.getPartByDbId(part_id, true);
    // console.log(part_db);
    if (amount > part_db.in_stock) {
        return part_db.in_stock;
    }
    return amount;
}

async function validateCart(cart){

    let updates = []
    for(let [key, part] of Object.entries(cart)){
        // check part.quantity is number
        if(!isFinite(part.quantity)){
            delete cart[key];
            continue
        }
        let addAmount = await validateAddAmount(part.id, part.quantity ?? 0)
        // check if add amount checks out
        if(addAmount != part.quantity){
            // quantity greater than addAmount
            // log part id, max amount
            updates.push({part_id: part.id, in_stock: addAmount})
        }
    }
    return updates;
}

async function reduceStock(cart){
    for(let [key, part] of Object.entries(cart)){
        // check part.quantity is number
        if(!isFinite(part.quantity)){
            delete cart[key];
            continue
        }
        db.reduceStock(part.oe_number, part.quantity)
    }
}
