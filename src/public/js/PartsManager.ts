/**
 * @description manages the table that actually displays the parts
 * @param toast the toast to display when something gets added to the cart
 */
class PartsManager {
    table;
    feedback_div;
    last_popup;
    last_popup_button;
    toast;
    toast_hide_func;
    img_modal;
    admin;
    constructor(table, feedback_div, toast, img_modal) {
        this.table = table;
        this.feedback_div = feedback_div;
        this.toast = toast;
        this.img_modal = img_modal;
        this.img_modal.onclick = () => {
            this.img_modal.style.display = "none";
        }
    }

    async applyDiscount(parts){
        // grab account discount
        let resp = await fetch("/account/discount", {
            "method": "GET"
        })
        let discount = await resp.json();
        console.log(discount.discount)
        // apply part discount locally on shop display

        for(let i = 0; i < parts.length; i++){
            parts[i].price = Math.round(parts[i].price * (1 - discount.discount/100))
        }

        return parts
    }

    /**
     * 
     * @param data {make, year, model, engine}
     */
    async apiSearchFull(data: Object) {
        this.showLoader();
        try {
            let resp = await fetch("/search/full", {
                "method": "POST",
                "headers": {
                    "content-type": "application/json"
                },
                "body": JSON.stringify(data)
            });
            let json = await resp.json();
            this.admin = json.admin;
            
            
            
            return this.applyDiscount(json.parts);
        } catch (err) {
            throw err;
        }
    }

    async apiOESearch(number) {
        this.showLoader();
        try {
            //make request to server
            let resp = await fetch("/search/id_number", {
                "method": "POST",
                "headers": {
                    "Content-Type": "application/json",
                },
                "body": JSON.stringify({
                    "id_number": number
                })
            });
            let json = await resp.json();
            this.admin = json.admin;
            return this.applyDiscount(json.parts);
        } catch (err) {
            throw err;
        }
    }
    async apiCategorySearch(category) {
        this.showLoader();
        try {
            let resp = await fetch("/search/category", {
                "method": "POST",
                "headers": {
                    "content-type": "application/json"
                },
                "body": JSON.stringify({
                    category
                })
            });
            let json = await resp.json();
            this.admin = json.admin;
            return this.applyDiscount(json.parts);
        } catch (err) {
            throw err;
        }
    }

    renderPart(part: Part) {
        console.log(part);

        //create the row
        let tbody = this.table.querySelector("tbody");
        let row = tbody.insertRow();
        row.classList.add("part");

        //add image
        let image_td = row.insertCell();
        image_td.classList.add("img");
        image_td.style.postion = "relative";
        let img = document.createElement("img");
        img.src = `/img/parts/${part.make}-${part.oe_number}.png`;
        img.onerror = () => {
            img.src = `/img/parts/${part.make}-${part.oe_number}.jpg`;
            img.onerror = null;
        }
        let bigger_img = document.createElement("img");
        bigger_img.classList.add("big_img");
        bigger_img.style.display = "none";
        bigger_img.src = `/img/parts/${part.make}-${part.oe_number}.png`;
        bigger_img.onerror = () => {
            bigger_img.src = `/img/parts/${part.make}-${part.oe_number}.jpg`;
            bigger_img.onerror = null;
        }
        image_td.append(img, bigger_img);
        //on hover show a bigger image
        img.addEventListener("mouseenter", () => {
            bigger_img.style.display = "block";
        });

        img.addEventListener("mouseleave", () => {
            bigger_img.style.display = "none";
        });


        //add description
        let type_td = row.insertCell();
        let type = document.createElement("h3");
        type.innerText = part.description;
        type_td.append(type);

        //make
        //model
        //oenumber
        let keys = ["make", "oe_number", "frey_number"];
        for (let i = 0; i < keys.length; i++) {
            let temp = row.insertCell();
            if (part[keys[i]]) {
                temp.innerText = part[keys[i]].toString().toUpperCase();
            }
        }

        //applicatoins
        let applications_td = row.insertCell(2);
        applications_td.classList.add("application");
        let view = document.createElement("button");
        view.innerText = "View";
        applications_td.append(view);

        //should cache the request, to prevent spam and stuff
        view.onclick = async () => {
            if (this.last_popup_button == view) {
                this.last_popup.remove();
                this.last_popup_button.innerText = "View";
                this.last_popup_button = null;
            } else {
                //remove the old popup from the screen
                try {
                    this.last_popup.remove();
                    this.last_popup_button.innerText = "View";
                } catch (err) {

                }
                let resp = await fetch('/applications?part_id=' + part.id/*, {
                "method": "GET"//,
                // "headers": {
                //     "Content-Type": "application/json",
                // },
                // "body": JSON.stringify({part_id: id}})
            }*/);
                let data = await resp.json();
                // console.log(data);
                //spawn the popup
                let popup = document.createElement("table");
                popup.classList.add("application_popup");

                let col1 = document.createElement("col");
                col1.width = "70%";

                let col2 = document.createElement("col");
                col2.width = "30%";

                let popup_thead = document.createElement("thead");
                let popup_tbody = document.createElement("tbody");

                let row = popup_thead.insertRow();
                let model = row.insertCell();
                model.innerText = "Model";
                let year = row.insertCell();
                year.innerText = "Year Range";
                model.classList.add("model_col");
                year.classList.add("year_col");


                popup.append(col1, col2, popup_thead, popup_tbody);

                data.forEach(app => {
                    let row = popup_tbody.insertRow();
                    row.insertCell().innerText = app.model.toUpperCase();
                    row.insertCell().innerText = `${app.begin_year} - ${app.end_year}`;
                });

                applications_td.append(popup);
                this.last_popup = popup;
                this.last_popup_button = view;
                view.innerHTML = "Close";
            }
        };
        
        /*async ()=>{
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
        }*/


        //buttons
        if (part.price) {
            let price = row.insertCell();
            let cents = part.price % 100;
            if (cents < 10) cents = "0" + cents.toString();
            price.innerText = `$${parseInt(part.price / 100)}.${cents}`;

            let button_td = row.insertCell();
            button_td.classList.add("add_cart");

            let add_to_cart = document.createElement("button");
            add_to_cart.innerText = "Add";

            let quantity = document.createElement("input");
            quantity.type = "number";
            quantity.value = "1";
            quantity.min = "1";

            //make the request to add to cart
            add_to_cart.onclick = () => {
                part.quantity = parseInt(quantity.value);
                if (part.quantity) {
                    fetch("/cart/part", {
                        "method": "post",
                        "headers": {
                            "content-type": "application/json"
                        },
                        "body": JSON.stringify({ "part": part })
                    }).then(resp => {
                        if (resp.status == 200) {
                            console.log("here");
                            resp.json().then((json)=>{
                                console.log(json);
                                if(json.out_of_stock){
                                    if(json.in_stock == 0){
                                        alert("We are currently out of this part. Please check again later or contact us.");
                                    }else{
                                        let msg = `There are only ${json.in_stock} amount of parts left. `;
                                        if(json.in_cart){
                                            msg += `You currently have ${json.in_cart} in cart. `;
                                        }
                                        alert(msg += "Please adjust your quantity.");
                                    }
                                }else{
                                    if (this.toast_hide_func) {
                                        clearTimeout(this.toast_hide_func);
                                        this.toast.classList.remove("show");
                                    }
                                    this.toast.classList.add("show");
                                    this.toast_hide_func = setTimeout(() => {
                                        this.toast.classList.remove("show");
                                        this.toast_hide_func = null;
                                    }, 1000);
                                }                                
                            })
                        }
                    });
                }
            }

            button_td.append(quantity, add_to_cart);//, view);
        }

        if (this.admin) {
            let edit_button_td = row.insertCell();
            let edit_button = document.createElement("button");
            edit_button.innerText = "Edit";
            edit_button.onclick = () => {
                window.open(`/admin/editpart?part_id=${part.id}`);
            };
            edit_button_td.append(edit_button);
        }

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
    hideFeedback() {
        this.feedback_div.style.display = "none";
    }
    showTable() {
        this.hideLoader();
        this.feedback_div.display = "none";
        this.table.style.display = "table";
    }
}