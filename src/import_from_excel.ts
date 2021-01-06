require("dotenv").config();
//@ts-expect-error
const db = require("./db_helper");
const path = require("path");
const fs = require("fs");
const xlReader = require("read-excel-file/node");

async function upload_parts(path){
    let errors = [];
    let rows = await xlReader(path)
    {
        for(let i = 1; i< rows.length; i++){
            try{
                let part = rowToPart(rows[i]);
                if(part.errors === null){
                    let part_db = {
                        "make": null,
                        "oe_number": null,
                        "frey_number": null,
                        "price": null,
                        "description": null,
                        "brand": null,
                        "enabled": 1,
                        "in_stock": 1,
                        "image_url": null
                    };
                    let properties = ["make", "oe_number", "frey_number", "description", "brand"];
                    properties.forEach( property => {
                        part_db[property] = part[property].trim();
                    })
                    part_db.price = part.price;
                    part_db.image_url = part.make.toLowerCase() + '-' + part.oe_number.toString() + '.jpg';
                    db.addPart(part_db, part.apps, part.interchange);
                }
                else errors.push({index: i, msg: part.errors})
            }catch(err){
                console.log(err);
            }
        }
    }
    return errors;
}

function rowToPart(row){
    let res = {
        "oe_number": row[4].toString(),
        "frey_number": row[6].toString(),
        "price": Math.round(row[7]*100),
        "description": row[2],
        "brand": row[3],
        "errors": null,
        "make": null,
        "apps": [],
        "interchange": []
    };
    
    let first_space = row[9].indexOf(' ');
    res.make = row[9].substr(0, first_space).toLowerCase();
    if(res.make == 'mb') res.make = 'mercedes-benz';
    
    row[9] = row[9].substr(first_space+1);
    try{
        if(row[5]){
            let interchange = row[5].toString();
            interchange = interchange.split(' ');
            interchange.forEach( int => {
                int = int.substr(int.indexOf(' ')+1);
                int.trim()
                int.replace(/[-,]/g, '');
                if(/[^A-Za-z0-9]/.test(int)){
                    res.errors = "invalid interchange format"
                }
                res.interchange.push(int);
            })
        }
        row[9].split('/').forEach(application => {
            let modelName, begin_year, end_year, engineSizes = [];
            let yearString = application.substr(application.lastIndexOf(' ')+1);
            // console.log(yearString, application.lastIndexOf(' '));
            application = application.substr(0, application.lastIndexOf(' '));
            let app_years = yearString.split('-');
            if(app_years.length != 2){
                begin_year = end_year = parseInt(app_years[0]);
                if(isNaN(begin_year)) throw ('year not number');
            }
            else{
                begin_year = parseInt(app_years[0]);
                if(isNaN(begin_year)) throw('year not number');
                if(begin_year > 50) begin_year += 1900; else begin_year += 2000;
                
                end_year = parseInt(app_years[1]);
                if(isNaN(end_year) && app_years[1]!='NE') throw('year not number');
                else if(isNaN(end_year)) end_year = 21;
                if(end_year > 50) end_year += 1900; else end_year += 2000;
                
            }

            if(application[application.length -1] == 'L' || application[application.length -1] == 'l'){
                let engineSizeStr = application.substr(application.lastIndexOf(' ')+1);
                application = application.substr(0, application.lastIndexOf(' '));
                if(engineSizeStr.indexOf('-') != -1) throw("engine format wrong");
                engineSizes = engineSizeStr.split(',');
            }

            modelName = application.replace(/"/gi, '');
            modelName = modelName.trim();
            res.apps.push({
                model: modelName,
                begin_year: begin_year,
                end_year: end_year,
                engines: engineSizes
            });
        })
    } catch(err){
        res.errors = err;
    }
    return res;
}

module.exports ={
    upload_parts
}

// xlReader(path_to_excel).then(async (rows)=>{
//     let errors = [];
//     for(let i = 1; i < rows.length; i++){
//         console.log(i*100/rows.length);
//         try{
//             let part: PartDBEntry, apps = [];
//             part = {
//                 make: 'mercedes-benz',
//                 oe_number: rows[i][4].toString(),
//                 frey_number: rows[i][6].toString(),
//                 price: Math.round(rows[i][7]*100),
//                 image_url: null,
//                 enabled: 1,
//                 in_stock: 1,
//                 description: rows[i][2],
//                 brand: rows[i][3]
//             };
//             part.image_url = part.make + '-' + part.oe_number + '.jpg';
//             rows[i][9].split('/').forEach((application)=>{
//                 if(application.startsWith("BMW")) application = application.substr(3);
//                 if(application.startsWith("MB")) application = application.substr(2);
//                 if(application.startsWith("MERCEDES-BENZ")) application = application.substr(13);
//                 let modelName, begin_year, end_year, engineSizes = [];
//                 let yearString = application.substr(application.lastIndexOf(' ')+1);
//                 // console.log(yearString, application.lastIndexOf(' '));
//                 application = application.substr(0, application.lastIndexOf(' '));
//                 let app_years = yearString.split('-');
//                 if(app_years.length != 2){
//                     begin_year = end_year = parseInt(app_years[0]);
//                     if(isNaN(begin_year)) throw('year not number');
//                 }
//                 else{
//                     begin_year = parseInt(app_years[0]);
//                     if(isNaN(begin_year)) throw('year not number');
//                     if(begin_year > 50) begin_year += 1900; else begin_year += 2000;
                    
//                     end_year = parseInt(app_years[1]);
//                     if(isNaN(end_year) && app_years[1]!='NE') throw('year not number');
//                     else if(isNaN(end_year)) end_year = 21;
//                     if(end_year > 50) end_year += 1900; else end_year += 2000;
                    
//                 }

//                 if(application[application.length -1] == 'L' || application[application.length -1] == 'l'){
//                     let engineSizeStr = application.substr(application.lastIndexOf(' ')+1);
//                     application = application.substr(0, application.lastIndexOf(' '));
//                     if(engineSizeStr.indexOf('-') != -1) throw("engine format wrong");
//                     engineSizes = engineSizeStr.split(',');
//                 }

//                 modelName = application.replace(/"/gi, '');
//                 modelName = modelName.trim();
//                 apps.push({
//                     model: modelName,
//                     begin_year: begin_year,
//                     end_year: end_year,
//                     engines: engineSizes
//                 });
//             });
//             try{
//                 await db.addPart(part, apps);
//             }catch(err){
//                 //console.log(err);
//                 errors.push(i);
//             }
//         }catch(err){
//             console.log(err);
//             //console.log(rows[i]);
//             errors.push(i);
//         }
//     }
//     console.log(errors);
// })
