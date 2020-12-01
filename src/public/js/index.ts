
let search_names = ["make", "year", "model", "engine"];
let search = {};
search_names.forEach(name => {
    search[name] = document.querySelector(`#search_${name}`);
});

let full_search_btn = document.querySelector("#full_search_btn") as HTMLElement;
let oe_search_btn = document.querySelector("#oe_search_btn") as HTMLElement;

let results_div = document.querySelector(".search_results") as HTMLElement;
let loader_gif = document.querySelector("#loader") as HTMLElement;

let parts_table = document.querySelector("#parts_container");
/**
 * @description makes and manages api response to render on page
 */
class ResultsManager {
    constructor() {
        full_search_btn.onclick = async () => {
            //get the data from the search fields
            let data = {};

            for (let [name, element] of Object.entries(search)) {
                data[name] = (element as HTMLInputElement).value;
            };

            //show the results div
            results_div.style = "display: flex";

            try {
                //spawn the loader
                loader_gif.style = "display: block";
                //perform api request
                let parts = await this.search(this.getSearchData());

                //hide the loader after the request is done
                
                this.clearResults();
                parts.forEach(part => {
                    this.renderPart(part);
                });
                //hide the loader after all the parts have been rendered
                loader_gif.style = "display: none";
            } catch (err) {
                //show an error message on screen
                console.log(err);
            }
        };

        oe_search_btn.onclick = () => {

        };
    }
    async search(data: Object) {
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

            //convert json to array
            let temp_arr = [];
            for (let key of Object.keys(json)) {
                temp_arr.push(json[key]);
            }
            return temp_arr;
        } catch (err) {
            throw err;
        }
    }
    renderPart(part: Part) {
        //add the elements
        let td = document.createElement("tr");

        let img_td = document.createElement("td");
        let img = document.createElement("img");
        //render the right image
        img.src = "img/image1.jpeg"; 
        img_td.append(img);

        let name = document.createElement("td");
        name.innerText = part.frey_number;

        let make = document.createElement("td");
        make.innerText = part.make;

        let oe_number = document.createElement("td");
        oe_number.innerText = part.oe_number;

        let price = document.createElement("td");
        price.innerText = part.price.toString();

        td.append(img, name, make, oe_number, price);
        parts_table.append(td);
    }
    getSearchData() {
        let data = {};
        for (let [name, element] of Object.entries(search)) {
            data[name] = (element as HTMLInputElement).value;
        };
        return data;
    }
    clearResults() {
        parts_table.innerHTML =
        `<tr>
            <th></th>
            <th>Name</th>
            <th>Manufacturer</th>
            <th>OE Number</th>
            <th>Price</th>
            <th>Instock</th>
        </tr>`;
    }
}
window.onload = () => {
    let asdf = new ResultsManager();
    console.log(JSON.stringify(asdf));
}

console.log("reee");