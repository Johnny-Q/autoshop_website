require("dotenv").config();
//@ts-expect-error
const db = require("./db_helper");
const path = require("path");
const fs = require("fs");
const xlReader = require("read-excel-file/node");

let path_to_excel = path.join(__dirname, "./parts.xlsx");

async function getSheets() {
    return await xlReader(path_to_excel, {getSheets: true});
}

xlReader(path_to_excel).then(async (rows)=>{
    let errors = [];
    for(let i = 4; i < 422; i++){
        try{
            let part: PartDBEntry, app = [];
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
                application = application.split(' ');
                if(application.length != 2){
                    switch(application[0]){
                        case 'BMW':
                            application = application.slice(1);
                            break;
                        case 'ALPINA':
                            application[1] = application[0] + ' ' + application[1];
                            application = application.slice(1);
                            break;
                        case 'MINI':
                            application[1] = application[0] + ' ' + application[1];
                            application = application.slice(1);
                            break;
                        case 'ACTIVEHYBRID':
                            application[1] = application[0] + ' ' + application[1];
                            application = application.slice(1);
                            break;
                        default:
                    }
                }
                if(application[1].includes('L')) application.splice(1,1);
                if(application.length != 2){
                    throw('application length wrong');
                }
                if(application.length==2 && application[0] != 'BMW'){
                    if(application[0].includes(',')) throw('format error');
                    let app_years = application[1].split('-'), begin, end;
                    if(app_years.length != 2){
                        begin = end = parseInt(app_years[0]);
                        if(isNaN(begin)) throw('year not number');
                    }
                    else{
                        begin = parseInt(app_years[0]);
                        if(isNaN(begin)) throw('year not number');
                        if(begin > 50) begin += 1900; else begin += 2000;
                        
                        end = parseInt(app_years[1]);
                        if(isNaN(end)) throw('year not number');
                        if(end > 50) end += 1900; else end += 2000;
                        
                    }
                    app.push({
                        'model': application[0].toLowerCase(),
                        'begin_year': begin,
                        'end_year': end
                    })
                } else{
                    throw('Application length wrong');
                }
            })
            try{
                await db.addPart(part, app);
            }catch(err){
                //console.log(err);
                errors.push(i+2);
            }
        }catch(err){
            console.log(err);
            //console.log(rows[i]);
            errors.push(i+2);
        }
    }
    console.log(errors);
})
