export{};
let grid = document.querySelector(".grid");
let check = `<svg width="33" height="25" viewBox="0 0 33 25" fill="none" xmlns="http://www.w3.org/2000/svg"><line x1="1.06066" y1="13.9393" x2="8.56066" y2="21.4393" stroke="#00A825" stroke-width="3"/><line x1="31.0607" y1="1.06066" x2="8.56066" y2="23.5607" stroke="#00A825" stroke-width="3"/></svg>`
let cross = `<svg width="21" height="21" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg"><line x1="1.41102" y1="19.0282" x2="19.0887" y2="1.35054" stroke="#A50000" stroke-width="3"/><line x1="1.41125" y1="1.35053" x2="19.0889" y2="19.0282" stroke="#A50000" stroke-width="3"/></svg>`;
/**
 * @description makes and manages api response to render on page
 */
class gridTest {
    constructor() {

    }
    async run() {
        try {
            //spawn the loader
            //perform api request
            let parts = await this.search({});

            //hide the loader after the request is done

            parts.forEach(part => {
                this.renderPart(part);
            });
            //hide the loader after all the parts have been rendered
        } catch (err) {
            //show an error message on screen
            console.log(err);
        }
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
        let img = document.createElement("img");
        //render the right image
        img.src = "img/image1.jpeg";

        let name = document.createElement("p");
        name.innerText = part.frey_number;

        let make = document.createElement("p");
        make.innerText = part.make;

        let oe_number = document.createElement("p");
        oe_number.innerText = part.oe_number;

        let price = document.createElement("p");
        price.innerText = part.price.toString();

        let instock = document.createElement("div");
        instock.classList.add("stock_status");
        instock.innerHTML = Math.round(Math.random())?check:cross; 

        let line = document.createElement("div");
        line.classList.add("seperator");

        grid.append(line, img, name, make, oe_number, price, instock);
        // part.image_url = "image1.jpeg";
        // let row = parts_table.insertRow();
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
}
let asdf;
window.onload = () => {
    asdf = new gridTest();
}

