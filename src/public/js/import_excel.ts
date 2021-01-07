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
            // var json_object = JSON.stringify(XL_row_object);
            let parts = [];
            let errors = [];
            for (let i = 0; i < XL_row_object.length; i++) {
                try {
                    parts.push(parseRow(XL_row_object[i]));
                }
                catch (err) {
                    errors.push({ "message": err, "line": XL_row_object[i]["Seq."] });
                }
            }
            errors.forEach(error=>{
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
    // let part, apps = [];
    let { Application, "Brand": brand, "Description": description, "Frey No.": frey_number, "Interch. No.": int_numbers, "OE No.": oe_number, "Unit Price": price } = row;
    Application = Application.trim();
    price = price * 100;
    if (int_numbers) {
        int_numbers = int_numbers.split(" ");
    }
    let make = Application.substr(0, Application.indexOf(" ")).toLowerCase();
    make = make.trim();
    if (make == "mb") {
        make = "mercedes-benz";
    }
    let applications = [];

    // delete the first word denoting make in application string
    Application = Application.substr(Application.indexOf(' ') + 1);

    // split the application string using the '/' delimiter
    Application.split('/').forEach(application => {
        application = application.trim();
        let begin_year, end_year, engine_sizes = [];

        let model_name, year_string, engine_string;

        let split = [];
        application = application
            .replace(/[\u2018\u2019]/g, "'")
            .replace(/[\u201C\u201D]/g, '"');
        // console.log(application);
        // console.log(application[0] == '"' );
        if (application[0] == '"') {
            //find the closing quote
            const close = application.substr(1).indexOf('"');
            let make = application.substr(1, close);
            split.push(make);

            let no_make = application.substr(close + 1);
            //want to make sure we ended at the closing quotes
            if (no_make[0] != '"') {
                throw "application bad format missing quotes " + no_make; //cut something off or added something to make
            }

            no_make = no_make.substr(1); //remove the quote
            split = split.concat(no_make.trim().split(" "));
        } else {
            split = application.split(" ");
        }


        if (split.length == 2) {
            [model_name, year_string] = split;
        } else if (split.length == 3) {
            [model_name, engine_string, year_string] = split;
        } else {
            throw "application bad format, split length not correct " + split;
        }

        // parse year_string
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
            throw ("Year format wrong");
        }

        // parse engine string
        if (engine_string) {
            engine_sizes = engine_string.split(',');
            for(let i = 0;i < engine_sizes.length; i++){
                engine_sizes[i] = engine_sizes[i].toLowerCase();
            }
        }
        model_name = model_name.trim();
        applications.push({
            model: model_name.toLowerCase(),
            begin_year: begin_year,
            end_year: end_year,
            engines: engine_sizes
        });
    });

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