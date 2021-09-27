// import readXlsxFile from 'read-excel-file';
const price_input = document.getElementById('upload_price') as HTMLInputElement;
// const loader = document.querySelector("#loader");
// const error_message = document.querySelector(".error_message");

function parseExcelPrice(file) {
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
                    let update = parseRowPrice(XL_row_object[i]);
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
            fetch("/admin/update_price", {
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


function parseRowPrice(row) {
    //check all column names exist and have vlaue, 
    let must_have = ["OE No.", "Price"];
    for (let i = 0; i < must_have.length; i++) {
        if (!row[must_have[i]]) {
            throw "no value found for " + must_have[i];
        } else {
            row[must_have[i]] = row[must_have[i]].toString().trim();
        }
    };

    let { "OE No.": oe_number, "Price": price,} = row;
    // check stock is number
    try{
        price = Math.round(parseFloat(price)*100)
    } catch {
        throw "price is not a number"
    }

    let update = { oe_number, price};
    return update;
}


price_input.addEventListener('change', function () {
    loader.style.display = "block";
    parseExcelPrice(this.files[0]);
})