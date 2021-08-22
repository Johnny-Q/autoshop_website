// import readXlsxFile from 'read-excel-file';
const stock_input = document.getElementById('upload_stock') as HTMLInputElement;
// const loader = document.querySelector("#loader");
// const error_message = document.querySelector(".error_message");

function parseExcelStock(file) {
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
            let updates = [];
            let errors = [];
            for (let i = 0; i < XL_row_object.length; i++) {
                try {
                    let update = parseRowStock(XL_row_object[i]);
                    console.log(update);
                    updates.push(update);
                }
                catch (err) {
                    errors.push({ "message": err, "line": "Excel line " + (i + 1) });
                }
            }
            console.log(errors);
            errors.forEach(error => {
                // console.log(error);
                error_message.innerText += JSON.stringify(error);
                error_message.innerText += "\n";
            });
            fetch("/admin/update_stock", {
                "method": "POST",
                "headers": {
                    "Content-Type": "application/json"
                },
                "body": JSON.stringify({ updates, errors })
            })
        });
    };

    reader.onerror = function (ex) {
        console.log(ex);
    };

    reader.readAsBinaryString(file);
};


function parseRowStock(row) {
    //check all column names exist and have vlaue, 
    let must_have = ["OE No.", "Stock"];
    for (let i = 0; i < must_have.length; i++) {
        if (!row[must_have[i]]) {
            throw "no value found for " + must_have[i];
        } else {
            row[must_have[i]] = row[must_have[i]].toString().trim();
        }
    };

    let { "OE No.": oe_number,"Make": make, "Stock": stock } = row;
    // check stock is number
    try{
        stock = parseInt(stock);
    } catch {
        throw "stock is not a number"
    }

    try{
        make = make.toLowerCase();
        if(make == 'mb') make = 'mercedes-benz'
    } catch{
        console.log('make not present but also not needed')
    }
    
    let update = { oe_number, stock, make };
    return update;
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


stock_input.addEventListener('change', function () {
    loader.style.display = "block";
    console.log("ree");
    parseExcelStock(this.files[0]);
})