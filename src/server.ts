export{};
require("dotenv").config();
const bodyparser = require("body-parser");
const express = require('express');
const app = express();
const {PORT} = process.env;
const {DBtoCSV} = require("./db_helper");
const db = require('knex')({
    client: 'sqlite3',
    connection: {
        filename: process.env.DB_PATH
    },
    useNullAsDefault: true // so we can avoid sqlite specific bugs
});

(async()=>{
    console.log(await(db.select().table("test")));
    DBtoCSV();
})();

//to render pure html and css files
app.engine("html", require("ejs").renderFile);
app.use(express.static('build/public'));
app.set("views", "build/public");

//accept json data
app.use(bodyparser.json());

app.get("/", (req, res)=>{
    res.render("test.html");
});



app.listen(PORT, ()=>{
    console.log("started on", PORT);
});