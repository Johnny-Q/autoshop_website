// import readXlsxFile from 'read-excel-file';
const input = document.getElementById('file_selector') as HTMLInputElement;
const loader = document.querySelector("#loader");
const error_message = document.querySelector(".error_message");

function parseExcel(file) {
    var reader = new FileReader();

    reader.onload = function (e) {
        var data = e.target.result;
        var workbook = XLSX.read(data, {
            type: 'binary'
        });
        loader.style.display = "none";
        workbook.SheetNames.forEach(function (sheetName) {
            // Here is your object
            var XL_row_object = XLSX.utils.sheet_to_row_object_array(workbook.Sheets[sheetName]);
            console.log(XL_row_object);
            // var json_object = JSON.stringify(XL_row_object);
            // console.log(json_object);
            let parts = [];
            let errors = [];
            for (let i = 0; i < XL_row_object.length; i++) {
                try {
                    let part = parseRow(XL_row_object[i])
                    console.log(part);
                    parts.push(part);
                }
                catch (err) {
                    errors.push({ "message": err, "line": XL_row_object[i]["Seq."] || "Excel line " + (i+1)});
                }
            }
            console.log(errors);
            errors.forEach(error => {
                // console.log(error);
                error_message.innerText += JSON.stringify(error);
                error_message.innerText += "\n";
            });
            fetch("/admin/addpart", {
                "method": "POST",
                "headers": {
                    "Content-Type": "application/json"
                },
                "body": JSON.stringify({ parts, errors })
            })
        });
    };

    reader.onerror = function (ex) {
        console.log(ex);
    };

    reader.readAsBinaryString(file);
};


function parseRow(row) {
    //check all column names exist and have vlaue, 
    let must_have = ["Application", /*"Brand", "Description",*/ "Frey No.", /*"Interch. No.",*/ "OE No.", "Unit Price"];
    for (let i = 0; i < must_have.length; i++) {
        if (!row[must_have[i]]) {
            throw "no value found for " + must_have[i];
        } else {
            row[must_have[i]] = row[must_have[i]].toString().trim();
        }
    };

    //set default values for the optional ones
    let optional = ["Brand", "Description", "Interch. No."];
    for (let i = 0; i < optional.length; i++) {
        if (!row[optional[i]]) {
            row[optional[i]] = "";
        } else {
            row[optional[i]] = row[optional[i]].toString().trim();
        }
    };

    let { Application, "Brand": brand, "Description": description, "Frey No.": frey_number, "Interch. No.": int_numbers, "OE No.": oe_number, "Unit Price": price } = row;
    let make;

    // price guaranteed is a not empty string at this point
    if (price) {
        price = price.replace(".", "");
        let test = parseInt(price);
        if (isNaN(test)) {
            throw "price not number";
        }
    }

    // sanitize unicode quotation marks
    Application = Application
        .replace(/[\u2018\u2019]/g, "'")
        .replace(/[\u201C\u201D]/g, '"');

    let applications = [];//create array to add applications to

    // split the application string using the '/' delimiter
    let temp = Application.split("/");

    for (let i = 0; i < temp.length; i++) {
        let application = temp[i];
        application = application.trim();
        
        // number of quotation marks must be even
        let count = (application.match(/"/g) || []).length;
        if (count%2==1) { //can't be any other %2 == 0
            throw "number of quotations wrong on " + application
        }

        if (i == 0) {
            // extract make from application
            if (application[0] == '"') { // multiple word makes
                let close = application.substr(1).indexOf('"'); //from substr 1 because we don't want to match the first quote
                if (close == -1) {
                    throw "no closing quote found for " + application;
                }
                make = application.substr(1, close); //"[ASLDKFJ ASDLFKJ]" captures between the quotes
                application = application.substr(close+2).trim();
            } else { //1 word makes
                let end = application.indexOf(" ");
                if(end == -1){
                    throw "no spaces in " + application;
                }
                make = application.substr(0, end).toLowerCase().trim();
                if (make == "mb") {
                    make = "mercedes-benz";
                }
                application = application.substr(end+1).trim();
            }
        }

        let split = []; //split into model_name, engine_string[optional], year_string

        //extract model
        if (application[0] == '"') { //spaced model names will start with a quote
            //find the closing quote
            const close = application.substr(1).indexOf('"'); //from substr 1 because we don't want to match the first quote
            if (close == -1) {
                throw "no closing quote found for " + application;
            }
            let model = application.substr(1, close); //"[ASLDKFJ ASDLFKJ]" captures between the quotes
            split.push(model); //push the model_name
            //model extracted

            let no_model = application.substr(close + 2).trim(); // /"asdflks ajdf"[ rest of data]/  captures inbetween [];

            split = split.concat(no_model.trim().split(" "));//everything else (engine and year)
        } else { //model does not contain quotes
            split = application.split(" ");
        }

        // trim all the split data for newlines and other blank spacing
        for (let i = 0; i < split.length; i++) {
            split[i] = split[i].trim()
        }

        let model_name, year_string, engine_string;
        if (split.length == 2) {
            [model_name, year_string] = split;
        } else if (split.length == 3) {
            [model_name, engine_string, year_string] = split;
        } else {
            throw "application bad format, split length not correct near " + split.join(" ");
        }

        let begin_year, end_year;
        // parse year_string
        year_string = year_string.toString();
        let app_years = year_string.split('-');
        // split the year string on '-' delimiter
        if (app_years.length == 1 || 2) {
            if (app_years.length == 1) { // if the length is 1 then there was only one number denoting a single year of operation
                begin_year = parseInt(app_years[0]);
                begin_year = standardizeYear(begin_year);
                end_year = begin_year;
            }

            else if (app_years.length == 2) {
                begin_year = parseInt(app_years[0]);
                end_year = parseInt(app_years[1]);
                begin_year = standardizeYear(begin_year);
                end_year = standardizeYear(end_year);
            }
        } else {
            throw "Year format wrong";
        }

        let engine_sizes = [];
        // parse engine string
        if (engine_string) {
            engine_sizes = engine_string.split(',');
            for (let i = 0; i < engine_sizes.length; i++) {
                engine_sizes[i] = engine_sizes[i].toLowerCase();
                if(engine_sizes[i][engine_sizes[i].length-1] != "l"){
                    throw "engine size does not end in L";
                }
            }
        }

        applications.push({
            model: model_name.toLowerCase(),
            begin_year: begin_year,
            end_year: end_year,
            engines: engine_sizes
        });
    });

    // parse interchangeable numbers into array
    if (int_numbers) {
        int_numbers = int_numbers.split(" ");
    }

    let part: Part = { brand, description, frey_number, oe_number, price, make, "enabled": true };
    return { part, applications, "interchange": int_numbers };
}

function standardizeYear(year: number): number {
    // if the begin_year is not a number, throw error
    if (isNaN(year)) throw ('year not number');

    // properly format year to 4 digit format
    if (year < 100) {
        if (year < 50) {
            year += 2000;
        } else {
            year += 1900;
        }
    }

    //check range
    if (year < 1950 || year > 2050) {
        throw "year not in range";
    }
    return year;
}


input.addEventListener('change', function () {
    loader.style.display = "block";
    // console.log('in here');
    // console.log(this.files[0]);
    // // readXlsxFile(this.files[0]).then((rows) => {
    // //     console.log("found", rows.length, "rows");
    // //     console.log(rows.length);
    // // })]
    console.log("ree");
    parseExcel(this.files[0]);
})