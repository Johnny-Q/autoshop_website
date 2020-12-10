let search_names = ["make", "year", "model", "engine"];
let search = {};
search_names.forEach(name => {
    search[name] = document.querySelector(`input[name=search_${name}]`);
});

let oe_input = document.querySelector("#search_oe");

let full_search_btn = document.querySelector("#full_search_btn") as HTMLElement;
let oe_search_btn = document.querySelector("#oe_search_btn") as HTMLElement;

let feedback_div = document.querySelector(".feedback") as HTMLElement;
let message_h1 = document.querySelector("#message") as HTMLElement;
let loader_gif = document.querySelector("#loader") as HTMLElement;

// let parts_table = document.querySelector("#parts_container") as HTMLTableElement;
let results_div = document.querySelector(".search_results") as HTMLElement;
let parts_grid = document.querySelector(".parts_grid");
let check = `<svg width="33" height="25" viewBox="0 0 33 25" fill="none" xmlns="http://www.w3.org/2000/svg"><line x1="1.06066" y1="13.9393" x2="8.56066" y2="21.4393" stroke="#00A825" stroke-width="3"/><line x1="31.0607" y1="1.06066" x2="8.56066" y2="23.5607" stroke="#00A825" stroke-width="3"/></svg>`
let cross = `<svg width="21" height="21" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg"><line x1="1.41102" y1="19.0282" x2="19.0887" y2="1.35054" stroke="#A50000" stroke-width="3"/><line x1="1.41125" y1="1.35053" x2="19.0889" y2="19.0282" stroke="#A50000" stroke-width="3"/></svg>`;

/**
 * @description makes and manages api response to render on page
 */
class PartsManager {
    constructor() {
        // full_search_btn.onclick = async () => {
        //     try {
        //         if (message_h1.classList.contains("error")) message_h1.classList.remove("error");
        //         //spawn the loader
        //         feedback_div.style.display = "block";
        //         loader_gif.style.display = "inline-block";
        //         message_h1.innerText = "";

        //         //perform api request
        //         let parts = await this.api_search_full(this.getSearchData());

        //         if (parts.length) {
        //             //hide the loader after the request is done
        //             this.clearParts();
        //             parts.forEach(part => {
        //                 this.renderPart(part);
        //             });
        //             //show the results div
        //             results_div.style.display = "flex";
        //             feedback_div.style.display = "none";
        //         } else {
        //             results_div.style.display = "none";
        //             message_h1.innerText = "No Results";
        //         }

        //     } catch (err) {
        //         this.clearParts();
        //         //hide the results
        //         results_div.style.display = "none";

        //         //show an error message on screen
        //         message_h1.classList.add("error");
        //         message_h1.innerText = "Please try again.";
        //     }
        //     //hide the loader after the request is done
        //     loader_gif.style = "display: none";
        // };

        oe_search_btn.onclick = async () => {
            if (!oe_input.value) return;
            try {
                if (message_h1.classList.contains("error")) message_h1.classList.remove("error");
                //spawn the loader
                feedback_div.style.display = "block";
                loader_gif.style.display = "inline-block";
                message_h1.innerText = "";

                //perform api request
                let parts = await this.oeSearch(oe_input.value);

                console.log(parts);
                if (parts.length) {
                    //hide the loader after the request is done
                    this.clearParts();
                    parts.forEach(part => {
                        this.renderPart(part);
                    });
                    //show the results div
                    results_div.style.display = "flex";
                    feedback_div.style.display = "none";
                } else {

                    //show feedback
                    results_div.style.display = "none";
                    message_h1.innerText = "No Results";
                }

            } catch (err) {
                this.clearParts();
                //hide the results
                results_div.style.display = "none";

                //show an error message on screen
                message_h1.classList.add("error");
                message_h1.innerText = "Please try again.";
            }
            //hide the loader after the request is done
            loader_gif.style = "display: none";
        };
    }
    async search() {
        try {
            if (message_h1.classList.contains("error")) message_h1.classList.remove("error");
            //spawn the loader
            feedback_div.style.display = "block";
            loader_gif.style.display = "inline-block";
            message_h1.innerText = "";

            //perform api request
            let parts = await this.api_search_full(this.getSearchData());

            if (parts.length) {
                //hide the loader after the request is done
                this.clearParts();
                parts.forEach(part => {
                    this.renderPart(part);
                });
                //show the results div
                results_div.style.display = "flex";
                feedback_div.style.display = "none";
            } else {
                results_div.style.display = "none";
                message_h1.innerText = "No Results";
            }

        } catch (err) {
            this.clearParts();
            //hide the results
            results_div.style.display = "none";

            //show an error message on screen
            message_h1.classList.add("error");
            message_h1.innerText = "Please try again.";
        }
        //hide the loader after the request is done
        loader_gif.style = "display: none";
    }
    async api_search_full(data: Object) {
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

    async oeSearch(number) {
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
        //add the elements
        let img = document.createElement("img");
        //render the right image
        // img.src = `${part.image_url || "/image1.jpeg"}`;
        img.src = '../img/parts/' + (part.image_url || "image1.jpeg");

        let name = document.createElement("p");
        name.innerText = part.frey_number;

        let make = document.createElement("p");
        make.innerText = part.make;

        let oe_number = document.createElement("p");
        oe_number.innerText = part.oe_number;

        let price = document.createElement("p");
        let price_text = part.price.toString(); //get the decimal format
        price.innerText = `${price_text.substr(0, price_text.length - 2)}.${price_text.substr(2)}`;

        let instock = document.createElement("div");
        instock.classList.add("stock_status");
        instock.innerHTML = Math.round(Math.random()) ? check : cross;

        let line = document.createElement("div");
        line.classList.add("seperator");

        parts_grid.append(line, img, name, make, oe_number, price, instock);

        // part.image_url = "image1.jpeg";
        // let row = parts_div.insertRow();
        // let keys = ["image_url", "make", "oe_number", "price", "in_stock"];
        // for(let i = 0;i < keys.length; i++){
        //     let temp = row.insertCell(i);
        //     if(keys[i] == "image_url"){
        //         temp.classList.add("img");
        //         temp.style = `background-image:url(..${part.image_url||"/img/image1.jpeg"});`;
        //         // let img = document.createElement("img");
        //         // img.src = `../img/${part[keys[i]]}`;
        //         // temp.append(img);
        //     }else{
        //         temp.innerText = part[keys[i]];
        //     }
        // }

        //onclick spawn the modal
    }
    getSearchData() {
        let data = {};
        let isValid = true;
        for (let [name, element] of Object.entries(search)) {
            let value = (element as HTMLInputElement).value;
            if (!value) {
                isValid = false;
                break;
            }
            else if (value == "any") {
                value = "";
            }
            data[name] = value;
        };
        if (!isValid) throw "not all search fields set";
        // data.year = data.year.toString().substr(2);
        // console.log(data.year);
        return data;
    }
    clearParts() {
        parts_grid.innerHTML = `<p></p>
        <p>Part</p>
        <p>Manufacturer</p>
        <p>OE Number</p>
        <p>Price</p>
        <p>Instock</p>`;
    }
    jsonToArr(json) {
        //convert json to array
        let temp_arr = [];
        for (let key of Object.keys(json)) {
            temp_arr.push(json[key]);
        }
        return temp_arr;
    }
}

let asdf = new PartsManager();