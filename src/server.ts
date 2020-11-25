export{};
require("dotenv").config();
const bodyparser = require("body-parser");
const express = require('express');
const app = express();
const {PORT} = process.env;
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