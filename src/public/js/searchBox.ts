
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
        return [this.default_text];
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

        //add all the options to the options div, we don't have any options to begin with
        // for (let j = 0; j < options.length; j++) {
        //     let option = document.createElement("div");
        //     option.innerText = options[j].innerText;
        //     this.options_div.append(option);

        //     //add onclick to the options
        //     option.onclick = (event) => {
        //         let value = event.target.innerText;
        //         if (this.input_element.value == value) {
        //             this.hideOptions();
        //             return;
        //         }

        //         this.input_element.value = event.target.innerText;
        //         this.input_element.dispatchEvent(new Event("change")); //this will trigger the parent's function
        //         this.select_div.innerText = event.target.innerText;
        //         this.hideOptions();
        //     }
        // }
    }
    hideOptions() {
        if (this.options_div.classList.contains("active")) {
            this.options_div.classList.remove("active");
            this.select_div.classList.remove("selected");
        }
    }
    showOptions() {
        if (!this.options_div.classList.contains("active")) {
            this.options_div.classList.add("active");
            this.select_div.classList.add('selected');
            this.enable();
        }
    }
    reset() {
        this.select_div.innerText = this.default_text;
        this.input_element.value = "";
    }
    //for css
    enable() {
        if (this.select_div.classList.contains("disabled")) {
            this.select_div.classList.remove("disabled");
        }
    }
    disable() {
        if (!this.select_div.classList.contains("disabled")) {
            this.select_div.classList.add("disabled");
            // console.log("added class");
        }
    }

    async populateOptions(filter) {
        let values = await this.getOptions(filter);
        // console.log(this.getOptions.toString());
        // console.log(values);

        //remove the old options
        while (this.options_div.firstChild) {
            this.options_div.removeChild(this.options_div.lastChild);
        }

        values.push('Any');

        //add children
        values.forEach(value => {
            if(!value) return;
            if (value != "Any") {
                value = value.toString().toUpperCase();
            }
            let option = document.createElement("div");
            option.innerText = value;



            //have to add listeners to them;
            option.onclick = (event) => {
                let { target } = event;

                // if (this.input_element.value == target.innerText) {
                //     // console.log(this.input_element.value, target.innerText);
                //     this.hideOptions();
                //     return;
                // }

                //set the value and update visually
                this.input_element.value = target.innerText; //== "Any" ? "null" : target.innerText;
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

/**
 * @param custom_select the array of div.custom_select
 * @param default_text the default texts of each custom select respectively
 * @param name name of each custom select respectively , for key value in filter
 * @description the functionality for a collection of custom selects to form a search filter
 */
class SearchBar {
    selects: Array<CustomSelect> = [];
    last_filled = -1;
    filter = {};
    names: string[];
    parts_manager: PartsManager;
    constructor(custom_selects: Array<HTMLElement>, default_texts: string[], names: string[], parts_manager: PartsManager = null) {
        this.names = names;
        this.parts_manager = parts_manager;
        let options_container = document.querySelector(".options_container");

        //create the CustomSelect Object
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

            //autofocus the next one when the current one gets a value
            temp.input_element.addEventListener("change", (event) => {
                // console.log(event);

                //update the filter so we get the new options
                let key = this.names[i];
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
                        // console.log(query_params);
                        // console.log("Searching");
                        this.parts_manager.searchAndRender(this.filter);
                    } else {
                        /**
                         * @todo see if I can abstract this part somehow
                         */
                        //redirect to the search page
                        let { make, year, model, engine } = this.filter;
                        window.location.assign(`/search?make=${make || null}&year=${year || null}&model=${model || null}&engine=${engine || null}`);
                    }
                }
            })

            this.selects.push(temp);
        }

        //init the buttons
        this.resetSelects();
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
            if (i != this.last_filled + 1) {
                this.selects[i].disable();
            }
        }
    }
    getQuery() {
        let data = [];
        this.selects.forEach(select => {
            data.push(select.getValue());
        });
        return data;
    }
}
