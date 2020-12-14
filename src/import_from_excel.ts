require("dotenv").config();
//@ts-expect-error
const db = require("./db_helper");
//@ts-expect-error
const path = require("path");
//@ts-expect-error
const fs = require("fs");
const xlReader = require("read-excel-file/node");

let path_to_excel = path.join(__dirname, "./bmwparts.xlsx");

async function getSheets() {
    return await xlReader(path_to_excel, {getSheets: true});
}

xlReader(path_to_excel).then(async (rows)=>{
    let errors = [];
    for(let i = 4; i < 422; i++){
        console.log(i*100/rows.length);
        try{
            let part: PartDBEntry, apps = [];
            part = {
                make: 'bmw',
                oe_number: rows[i][4].toString(),
                frey_number: rows[i][6].toString(),
                price: Math.round(rows[i][7]*100),
                image_url: null,
                enabled: 1,
                in_stock: 1,
                description: rows[i][2],
                brand: rows[i][3]
            };
            part.image_url = part.make + '-' + part.oe_number + '.jpg';
            rows[i][9].split('/').forEach((application)=>{
                if(application.startsWith("BMW")) application = application.substr(3);
                if(application.startsWith("MB")) application = application.substr(2);
                if(application.startsWith("MERCEDES-BENZ")) application = application.substr(13);
                let modelName, begin_year, end_year, engineSizes = [];
                let yearString = application.substr(application.lastIndexOf(' ')+1);
                // console.log(yearString, application.lastIndexOf(' '));
                application = application.substr(0, application.lastIndexOf(' '));
                let app_years = yearString.split('-');
                if(app_years.length != 2){
                    begin_year = end_year = parseInt(app_years[0]);
                    if(isNaN(begin_year)) throw('year not number');
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
                apps.push({
                    model: modelName,
                    begin_year: begin_year,
                    end_year: end_year,
                    engines: engineSizes
                });
            });
            try{
                await db.addPart(part, apps);
            }catch(err){
                //console.log(err);
                errors.push(i);
            }
        }catch(err){
            console.log(err);
            //console.log(rows[i]);
            errors.push(i);
        }
    }
    console.log(errors);
})
