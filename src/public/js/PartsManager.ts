/**
 * @description manages the table that actually displays the parts
 * 
 */
class PartsManager {
    table;
    feedback_div
    constructor(table, feedback_div) {
        this.table = table;
        this.feedback_div = feedback_div;
    }
    async searchAndRender(data) {
        try {
            // if (message_h1.classList.contains("error")) message_h1.classList.remove("error");
            //spawn the loader


            //perform api request
            let parts = await this.apiSearchFull(data);
            console.log(parts);
            if (parts.length) {
                //hide the loader after the request is done
                this.clearParts();
                parts.forEach(part => {
                    this.renderPart(part);
                });
                this.table.style.display = "table";
                this.feedback_div.style.display = "none";
                this.feedback_div.querySelector("h1").classList.remove("error");
            }

        } catch (err) {
            console.log(err);
            this.clearParts();
            //hide the results
            this.table.style.display = "none";
            this.feedback_div.style.display = "flex";

            //show an error message on screen
            let message_h1 = this.feedback_div.querySelector("h1");
            message_h1.classList.add("error");
            message_h1.innerText = "Please try again.";
        }
        this.hideLoader();
    }
    async apiSearchFull(data: Object) {
        this.showLoader();
        try {
            //make request to server
            let resp = await fetch("/search_full", {
                "method": "POST",
                "headers": {
                    "Content-Type": "application/json",
                },
                "body": JSON.stringify(data)
            });
            let json = await resp.json();

            return this.jsonToArr(json);
        } catch (err) {
            throw err;
        }
    }

    async apiOESearch(number) {
        this.showLoader();
        try {
            //make request to server
            let resp = await fetch("/search_id_number", {
                "method": "POST",
                "headers": {
                    "Content-Type": "application/json",
                },
                "body": JSON.stringify({
                    "id_number": number
                })
            });
            let json = await resp.json();

            return this.jsonToArr(json);
        } catch (err) {
            throw err;
        }
    }

    renderPart(part: Part) {
        // //add the elements
        // let img = document.createElement("img");
        // //render the right image
        // // img.src = `${part.image_url || "/image1.jpeg"}`;
        // img.src = '../img/parts/' + (part.image_url || "image1.jpeg");

        // let name = document.createElement("p");
        // name.innerText = part.frey_number;

        // let make = document.createElement("p");
        // make.innerText = part.make;

        // let oe_number = document.createElement("p");
        // oe_number.innerText = part.oe_number;

        // let price = document.createElement("p");
        // let price_text = part.price.toString(); //get the decimal format
        // price.innerText = `${price_text.substr(0, price_text.length - 2)}.${price_text.substr(2)}`;

        // let instock = document.createElement("div");
        // instock.classList.add("stock_status");
        // instock.innerHTML = Math.round(Math.random()) ? check : cross;

        // let line = document.createElement("div");
        // line.classList.add("seperator");

        // parts_grid.append(line, img, name, make, oe_number, price, instock);

        // part.image_url = "image1.jpeg";
        let tbody = this.table.querySelector("tbody");
        let row = tbody.insertRow();
        row.classList.add("part");
        //checkbox
        let checkbox_cell = row.insertCell(0);
        let checkout_input = document.createElement("input");
        checkout_input.type = "checkbox";
        // checkbox_cell.append(checkout_input);

        //image and type
        let type_td = row.insertCell(1);
        type_td.classList.add("type");
        let div = document.createElement("div");
        let img = document.createElement("img");
        img.src = `../img/parts/${part.image_url}`;
        let type = document.createElement("h3")
        type.innerText = part.description;
        div.append(img, type)
        type_td.append(div);

        //make
        //model
        //oenumber
        let keys = ["make", "oe_number"];
        for (let i = 0; i < keys.length; i++) {
            let temp = row.insertCell(i + 2);
            if (part[keys[i]]) {
                temp.innerText = part[keys[i]].toString().toUpperCase();
            }
        }

        //applicatoins
        let applications_td = row.insertCell(4);
        let view = document.createElement("button");
        view.innerText = "view";
        applications_td.append(view);

        //should cache the request, to prevent spam and stuff
        view.onclick = async ()=>{
            try{
                fetch("/get_apps", {
                    "method":"post",
                    "headers":{
                        "content-type":"application/json"
                    },
                    "body": JSON.stringify({
                        "oe_number": part.oe_number
                    })
                });
            }catch(err){
                console.log(err);
            }
        }


        //buttons
        let button_td = row.insertCell(5);
        let add_to_cart = document.createElement("button");
        add_to_cart.innerText = "Add";
        button_td.append(add_to_cart);//, view);



        //onclick spawn the modal
    }
    // getSearchData() {
    //     let data = {};
    //     let isValid = true;
    //     for (let [name, element] of Object.entries(search)) {
    //         let value = (element as HTMLInputElement).value;
    //         if (!value) {
    //             isValid = false;
    //             break;
    //         }
    //         else if (value == "any") {
    //             value = "";
    //         }
    //         data[name] = value;
    //     };
    //     if (!isValid) throw "not all search fields set";
    //     // data.year = data.year.toString().substr(2);
    //     // console.log(data.year);
    //     return data;
    // }
    clearParts() {
        this.table.querySelector("tbody").innerHTML = "";
        // parts_grid.innerHTML = `<p></p>
        // <p>Part</p>
        // <p>Manufacturer</p>
        // <p>OE Number</p>
        // <p>Price</p>
        // <p>Instock</p>`;
    }
    jsonToArr(json) {
        //convert json to array
        let temp_arr = [];
        for (let key of Object.keys(json)) {
            temp_arr.push(json[key]);
        }
        return temp_arr;
    }
    showLoader() {
        this.feedback_div.style.display = "block";
        this.table.style.display = "none";

        let loader_gif = this.feedback_div.querySelector("img");
        loader_gif.style.display = "inline-block";

        let message_h1 = this.feedback_div.querySelector("h1");
        message_h1.innerText = "";
    }
    hideLoader() {
        //hide the loader after the request is done
        let loader_gif = this.feedback_div.querySelector("img");
        loader_gif.style.display = "none";
    }
    showTable(){
        this.hideLoader();
        this.feedback_div.display= "none";
        this.table.style.display = "table";
    }
}