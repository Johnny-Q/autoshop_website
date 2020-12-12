// /**
//  * @description works similar to a linked list
//  * @param button the button the user clicks to show the elemnts
//  * @param options the actual options div that is being shown
//  * @param input the hidden input field that will store the value of the search field
//  * @param next_field the next SearchBox to focus on after a value is sumbitted
//  */
// class SearchNode {
//     button;
//     options_div;
//     input;
//     next_field;
//     default_text;
//     active = false;
//     isFocused = false;
//     getOptions = () => {
//         let data = ["ree"];
//         return data;
//     };
//     constructor(button, options, input, next_field: SearchNode, default_text) {
//         this.button = button;
//         this.options_div = options;
//         this.input = input;
//         this.next_field = next_field;
//         this.default_text = default_text;

//         let option_elements = this.options_div.children[0].children;

//         for (let i = 0; i < option_elements.length; i++) {
//             option_elements[i].onclick = (event) => {
//                 let { target } = event;
//                 //if it's the same value nothing changed
//                 if (this.input.value == target.innerText) {
//                     console.log(this.input.value, target.innerText);
//                     this.hideOptions();
//                     return;
//                 }

//                 //set the value and update visually
//                 this.input.value = target.innerText;
//                 this.input.dispatchEvent(new Event("change"));
//                 this.button.innerText = target.innerText;
//             };
//         }
//     }
//     showOptions() {
//         if (this.options_div.classList.contains("active")) return;
//         this.options_div.classList.add("active");
//     }
//     hideOptions() {
//         if (!this.options_div.classList.contains("active")) return;
//         this.options_div.classList.remove("active");
//     }
//     reset() {
//         this.button.innerText = this.default_text;
//         this.input.value = "";
//     }

//     populateOptions() {
//         let values = this.getOptions();

//         let ul = this.options_div.children[0];

//         //remove the old options
//         while (ul.firstChild) {
//             ul.removeChild(ul.lastChild);
//         }

//         //add children
//         values.forEach(value => {
//             let temp = document.createElement("li");
//             let span = document.createElement("span");
//             span.innerText = value;
//             temp.append(span);

//             //have to add listeners to them;
//             //@ts-expect-error
//             temp.onclick = (event) => {
//                 let { target } = event;

//                 if (this.input.value == target.innerText) {
//                     console.log(this.input.value, target.innerText);
//                     this.hideOptions();
//                     return;
//                 }

//                 //set the value and update visually
//                 this.input.value = target.innerText;
//                 this.input.dispatchEvent(new Event("change"));
//                 this.button.innerText = target.innerText;
//             }

//             ul.append(temp);
//         });
//     }
// }

// /**
//  * @description flow logic for the search bar
//  * 
//  */
// class SearchBar {
//     /**
//      * when the user changes a value, autofocus onto the next one
//      */
//     search_fields: Array<SearchNode>;

//     current_index = 0; //start at the beginning
//     constructor(search_fields) {
//         this.search_fields = search_fields;

//         this.updateButtonStates();

//         //set the first one as active
//         // search_fields[0].button.disabled = false;

//         //add button listeners;
//         for (let i = 0; i < search_fields.length; i++) {
//             let field = search_fields[i];


//             field.button.onclick = (event) => {
//                 let target = { event };
//                 this.requestShow(i);
//             };

//             field.input.onchange = (event) => {
//                 console.log("changed", event);
//                 this.current_index = i + 1;

//                 if (field.next_field == null) {
//                     this.hideAll();
//                     //call the search function here or something
//                     asdf.search();
//                     return;
//                 }

//                 this.updateButtonStates();
//             };
//         }
//     }

//     requestShow(index) {
//         if (this.current_index < index) return;
//         //hide everything else before showing the one we want to see

//         this.hideAll();
//         //init the values
//         this.search_fields[index].populateOptions();
//         this.search_fields[index].showOptions();
//     }

//     hideAll() {
//         this.search_fields.forEach(field => {
//             field.hideOptions();
//         });
//     }

//     updateButtonStates() {
//         let current_field = search_fields[this.current_index];
//         current_field.button.disabled = false;
//         current_field.reset();
//         //for the autofocus
//         if (this.current_index != 0) this.requestShow(this.current_index);


//         //if the user changed a value in something that was previous, reset everything in front of it
//         for (let i = this.current_index + 1; i < this.search_fields.length; i++) {
//             search_fields[i].button.disabled = true;
//             search_fields[i].reset();
//         }
//     }
// }

// function min(a, b) {
//     return a < b ? a : b;
// }


// let names = ["make", "year", "model", "engine"];
// names.reverse();
// let search_fields: Array<SearchNode> = [];
// for (let i = 0; i < names.length; i++) {
//     let name = names[i];
//     let temp = new SearchNode(document.querySelector(`#${name}_button`), document.querySelector(`.${name}_options`), document.querySelector(`input[name=search_${name}]`), i == 0 ? null : search_fields[i - 1], `Select ${name}`);
//     search_fields.push(temp);
// }
// search_fields.reverse();


// //TEMP
// search_fields[0].getOptions = ()=>{
//     return ["bmw", "amd", "intel", "any"];
// };
// search_fields[1].getOptions = ()=>{
//     let data = []
//     for(let i = 2000;i < 2500; i++){
//         data.push(i.toString());
//     }
//     data.push("any");
//     return data;
// };
// search_fields[2].getOptions = ()=>{
//     return ["model 1", "model 2", "any"];
// };
// search_fields[3].getOptions = ()=>{
//     return ["1.0L", "1.5L", "2.0L", "any"];
// };


// let search_bar = new SearchBar(search_fields);

/**
 * @description creates styled select and option list as divs
 * @param custom_select the div.custom_select containing a select elmeent
 * @param options_container where to put the styled options list
 * @param default_text the text to display on the screen when nothing is selected
 */
class CustomSelect {
    select_div: HTMLDivElement;
    options_div: HTMLDivElement;
    select_element: HTMLSelectElement;
    input_element: HTMLInputElement;
    default_text: string;
    getOptions = (filter: Object): any => {
        return [this.default_text, "ree"];
    }
    constructor(custom_select: HTMLElement, options_container, default_text) {
        this.default_text = default_text;
        //get the actual select element and it's options
        this.select_element = custom_select.querySelector("select");
        let options = this.select_element.children;
        this.input_element = custom_select.querySelector("input");

        //create the styled components
        this.select_div = document.createElement("div");
        this.options_div = document.createElement("div");
        this.select_div.classList.add("selector");
        this.select_div.innerText = default_text;
        this.options_div.classList.add("options")

        custom_select.append(this.select_div);

        options_container.append(this.options_div);

        //add listener to select
        // this.select_div.onclick = () => {
        // this.showOptions();
        // }

        //add all the options to the options div
        for (let j = 0; j < options.length; j++) {
            let option = document.createElement("div");
            option.innerText = options[j].innerText;
            this.options_div.append(option);

            //add onclick to the options
            // option.onclick = (event) => {
            //     let value = event.target.innerText;
            //     if (this.input_element.value == value) {
            //         this.hideOptions();
            //         return;
            //     }

            //     this.input_element.value = event.target.innerText;
            //     this.input_element.dispatchEvent(new Event("change")); //this will trigger the parent's function
            //     this.select_div.innerText = event.target.innerText;
            //     this.hideOptions();
            // }
        }
    }
    hideOptions() {
        if (this.options_div.classList.contains("active"))
            this.options_div.classList.remove("active");
    }
    showOptions() {
        if (!this.options_div.classList.contains("active"))
            this.options_div.classList.add("active");
    }
    reset() {
        this.select_div.innerText = this.default_text;
        this.input_element.value = "";
    }

    async populateOptions(filter) {
        let values = await this.getOptions(filter);
        console.log(this.getOptions.toString());
        console.log(values);

        //remove the old options
        while (this.options_div.firstChild) {
            this.options_div.removeChild(this.options_div.lastChild);
        }

        //add children
        values.forEach(value => {
            let option = document.createElement("div");
            option.innerText = value;


            //have to add listeners to them;
            option.onclick = (event) => {
                let { target } = event;

                if (this.input_element.value == target.innerText) {
                    // console.log(this.input_element.value, target.innerText);
                    this.hideOptions();
                    return;
                }

                //set the value and update visually
                this.input_element.value = target.innerText == "any" ? "" : target.innerText;
                this.input_element.dispatchEvent(new Event("change"));
                this.select_div.innerText = target.innerText;
            }

            this.options_div.append(option);
        });
    }
    getValue() {
        return this.input_element.value;
    }
}


class SearchBar {
    selects: Array<CustomSelect> = [];
    last_filled = -1;
    filter = {};
    constructor(custom_selects: Array<HTMLElement>, default_texts: string[]) {
        let options_container = document.querySelector(".options_container");
        for (let i = 0; i < custom_selects.length; i++) {
            let temp = new CustomSelect(custom_selects[i], options_container, default_texts[i])

            //add listeners to select divs
            temp.select_div.onclick = () => {
                if (temp.options_div.classList.contains("active")) {
                    temp.hideOptions();
                } else {
                    this.requestShow(i);
                }
            }

            //autofocus the next one when the current one is clicked
            temp.input_element.addEventListener("change", (event) => {
                // console.log(event);
                let key = "";
                switch (i) {
                    case 0:
                        key = "make";
                        break;
                    case 1:
                        key = "year";
                        break;
                    case 2:
                        key = "model";
                        break;
                    case 3:
                        key = "engine";
                        break;
                }
                this.filter[key] = temp.getValue();
                //show the next element if there is one
                if (i + 1 < custom_selects.length) {
                    this.last_filled = i;

                    this.resetSelects();
                    this.selects[i + 1].populateOptions(this.filter);
                    this.requestShow(i + 1);
                } else {
                    temp.hideOptions();
                    //perform the search

                    //get the data
                    let query_params = [];
                    this.selects.forEach(select => {
                        query_params.push(select.getValue());
                    });

                    //this has to be overwritten
                    if (window.location.href.indexOf("/search") != -1) {
                        //do the api call
                        console.log(query_params);
                    } else {
                        //redirect to the search page
                        let {make, year, model, engine} = this.filter;
                        window.location.assign(`/search?make=${make||null}&year=${year||null}&model=${model||null}&engine=${engine||null}`);
                    }
                }
            })

            this.selects.push(temp);
        }
    }
    hideAllOptions() {
        this.selects.forEach(select => {
            select.hideOptions();
        });
    }
    requestShow(index) {
        this.hideAllOptions();
        if (index <= this.last_filled + 1) {
            this.selects[index].showOptions();
        }
    }
    resetSelects() {
        for (let i = this.last_filled + 1; i < this.selects.length; i++) {
            this.selects[i].reset();
        }
    }
}

let bruh_why_all_the_names_taken = new SearchBar(Array.from(document.querySelectorAll(".custom_select")), ["Select Make", "Select Year", "Select Model", "Select Engine Size"]);
bruh_why_all_the_names_taken.selects[0].getOptions = async (filter): Promise<string[]> => {
    try {
        let resp = await fetch("/names/makes", {
            "method": 'get'
        });
        let json = await resp.json() as Array<Object>;
        let data = []
        //json is an array
        json.forEach((object: any) => {
            data.push(object.make);
        });
        return data;
    } catch (err) {
        return [];
    }
}
bruh_why_all_the_names_taken.selects[1].getOptions = async (filter): Promise<string[]> => {
    try {
        let { make } = filter;
        console.log(filter);
        let resp = await fetch(`/names/years?make=${make}`, {//${filter}`, {
            "method": 'get'
        });
        let json = await resp.json() as Array<Object>;
        console.log(json);
        let data = []
        //json is an array
        json.forEach((object: any) => {
            data.push(object.year);
        });
        return data;
    } catch (err) {
        return [];
    }
}
bruh_why_all_the_names_taken.selects[2].getOptions = async (filter): Promise<string[]> => {
    try {
        let { make, year } = filter;
        console.log(filter);
        let resp = await fetch(`/names/models?make=${make}&year=${year}`, {
            "method": 'get'
        });
        let json = await resp.json() as Array<Object>;
        let data = []
        console.log(json);
        //json is an array
        json.forEach((object: any) => {
            data.push(object.model);
        });
        console.log(data);
        return data;
    } catch (err) {
        console.log(err);
        return ["any"];
    }
}
bruh_why_all_the_names_taken.selects[3].getOptions = async (filter): Promise<string[]> => {
    try {
        let { make, year, model } = filter;
        console.log(filter);
        let resp = await fetch(`/names/engine?make=${make}&year=${year}&model=${model}`, {
            "method": 'get'
        });
        let json = await resp.json() as Array<Object>;
        let data = []
        //json is an array
        json.forEach((object: any) => {
            data.push(object.make);
        });
        return data;
    } catch (err) {
        return ["any"];
    }
}
bruh_why_all_the_names_taken.selects[0].populateOptions("");