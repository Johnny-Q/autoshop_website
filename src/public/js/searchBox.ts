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
    name: string;

    next_select: CustomSelect;
    is_submit = true;
    enabled = false;
    showing = false;

    options = [];
    values = [];
    getOptions = (filter: Object): any => {
        return [this.default_text];
    }
    constructor(custom_select: HTMLElement, options_container, default_text, name) {
        this.default_text = default_text;
        this.name = name;
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
        //     this.showOptions();
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
        this.showing = false;
        if (this.options_div.classList.contains("active")) {
            this.options_div.classList.remove("active");
            this.select_div.classList.remove("selected");
        }
    }
    showOptions() {
        this.showing = true;
        if (!this.options_div.classList.contains("active")) {
            this.options_div.classList.add("active");
            this.select_div.classList.add('selected');
        }
    }
    reset() {
        this.select_div.innerText = this.default_text;
        this.input_element.value = "";
        this.options = [];
        this.values = [];
        this.disable();
        if (this.next_select) {
            this.next_select.reset();
        }
    }
    //for css
    enable() {
        this.enabled = true;
        if (this.select_div.classList.contains("disabled")) {
            this.select_div.classList.remove("disabled");
        }
    }
    disable() {
        this.enabled = false;
        if (!this.select_div.classList.contains("disabled")) {
            this.select_div.classList.add("disabled");
        }
    }

    async populateOptions(filter) {
        let options = await this.getOptions(filter);
        let text;
        if(options.length == 2){
            text = options[0];
            options[1].unshift("ANY");
        }else{
            text = options;
        }

        this.options = text;
        
        console.log(text);
        // console.log(this.getOptions.toString());
        // console.log(values);
        text.unshift("ANY");

        //remove the old options
        while (this.options_div.firstChild) {
            this.options_div.removeChild(this.options_div.lastChild);
        }


        let htmlOptionObjects = [];
        for(let i = 0; i < text.length;i++){
            // let value = text[i]
            if(options.length == 2){
                htmlOptionObjects.push(this.createOption(text[i], options[1][i]));
            }else{
                htmlOptionObjects.push(this.createOption(text[i]));
            }
            // console.log(value);
            // htmlOptionObjects.push(this.createOption(value));
        };

        //order in columns
        //will always have 4 columns
        if (htmlOptionObjects.length > 4) {
            //@ts-expect-error 
            let one_column = parseInt(htmlOptionObjects.length / 4);
            let extras = htmlOptionObjects.length % 4; //1 add one more option to the first column, 2 is for second...
            let first_break = extras >= 1 ? one_column + 1 : one_column;
            let second_break = extras >= 2 ? first_break + + one_column + 1 : first_break + one_column;
            let third_break = extras >= 3 ? second_break + one_column + 1 : second_break + one_column;;
            let temp_objects = [[...htmlOptionObjects.slice(0, first_break)], [...htmlOptionObjects.slice(first_break, second_break)], [...htmlOptionObjects.slice(second_break, third_break)], [...htmlOptionObjects.slice(third_break, htmlOptionObjects.length)]];
            console.log(temp_objects);

            for (let j = 0; j < one_column; j++) {
                for (let i = 0; i < 4; i++) {
                    let option = temp_objects[i][j];
                    this.options_div.append(option);
                    // this.createOption(value);
                }
            }
            for (let i = 0; i < extras; i++) {
                let option = temp_objects[i][temp_objects[i].length - 1];
                this.options_div.append(option);
                // this.createOption(option);
            }
        } else {
            //add children
            htmlOptionObjects.forEach(option => {
                this.options_div.append(option);
                // this.createOption(value);
            });
        }
    }
    createOption(text, value = "") {
        // if (!value) return;
        text = text.toString().toUpperCase();
        let option = document.createElement("div");
        option.innerText = text;

        //have to add listeners to them;
        option.onclick = (event) => {
            let { target } = event;

            // if (this.input_element.value == target.innerText) {
            //     // console.log(this.input_element.value, target.innerText);
            //     this.hideOptions();
            //     return;
            // }

            //set the value and update visually
            //@ts-expect-error
            //assign value if exists, else use text
            this.input_element.value = value ? value : text; //target.innerText; //== "Any" ? "null" : target.innerText;
            this.input_element.dispatchEvent(new Event("change"));
            //@ts-expect-error
            this.select_div.innerText = target.innerText;
        }
        return option;
        // this.options_div.append(option);
    }
    getValue() {
        return this.input_element.value;
    }
}
class FilterBar {
    filter = {};
    custom_selects: Array<CustomSelect>;
    parts_manager = null;
    constructor(custom_selects: Array<CustomSelect>, parts_manager = null) {
        this.parts_manager = parts_manager;
        this.custom_selects = custom_selects;
        for (let i = 0; i < custom_selects.length; i++) {
            custom_selects[i].disable();
            custom_selects[i].select_div.onclick = async () => {
                let show = !custom_selects[i].showing;
                this.hideAllOptions();
                if (custom_selects[i].enabled) {
                    if (custom_selects[i].options.length == 0) {
                        await custom_selects[i].populateOptions(this.filter);
                    }
                    if (show) {
                        custom_selects[i].showOptions();
                    } else {
                        custom_selects[i].hideOptions();
                    }
                }
            }
            custom_selects[i].input_element.onchange = async () => {
                this.hideAllOptions();
                this.filter[custom_selects[i].name] = custom_selects[i].getValue();
                if (custom_selects[i].next_select) {
                    let next_select = custom_selects[i].next_select;
                    next_select.reset();
                    next_select.enable();
                    await next_select.populateOptions(this.filter);
                    next_select.showOptions();
                } else {
                    if (custom_selects[i].name == "category") {
                        this.submit({ "category": custom_selects[i].getValue() });
                    } else {
                        this.submit(this.filter);
                    }
                }
            }
        }
        custom_selects[0].enable();
        custom_selects[4].enable();
    }
    hideAllOptions() {
        this.custom_selects.forEach(select => {
            select.hideOptions();
        });
    }
    submit(filter) {
        //perform the search
        console.log(filter);
        //this has to be overwritten
        if (this.parts_manager) {
            this.parts_manager.searchAndRender(filter);
        } else {
            let url = "/search?";
            let counter = 0;
            for (let [key, value] of Object.entries(filter)) {
                if (counter > 0) url += "&";
                url += `${key}=${value}`;
                counter++;
            }
            window.location.assign(url);
        }

    }
}
/**
 * @param custom_select the array of div.custom_select
 * @param default_text the default texts of each custom select respectively
 * @param name name of each custom select respectively , for key value in filter
 * @description the functionality for a collection of custom selects to form a search filter
 */
//submit selector
class SearchBar {
    selects: Array<CustomSelect> = [];
    last_filled = -1;
    filter = {};
    names: string[];
    parts_manager: PartsManager;
    constructor(custom_selects: Array<CustomSelect>, default_texts: string[], names: string[], parts_manager: PartsManager = null) {
        this.names = names;
        this.parts_manager = parts_manager;
        // let options_container = document.querySelector(".options_container");

        custom_selects[0].enable();
        //create the CustomSelect Object
        for (let i = 0; i < custom_selects.length; i++) {
            // let temp = new CustomSelect(custom_selects[i], options_container, default_texts[i])

            //add listeners to select divs
            custom_selects[i].select_div.onclick = () => {
                if (custom_selects[i].options_div.classList.contains("active")) {
                    custom_selects[i].hideOptions();
                } else {
                    this.requestShow(i);
                }
            }

            //autofocus the next one when the current one gets a value
            custom_selects[i].input_element.addEventListener("change", (event) => {
                // console.log(event);

                //update the filter so we get the new options
                let key = this.names[i];
                this.filter[key] = custom_selects[i].getValue();

                //show the next element if there is one
                if (i + 1 < custom_selects.length) {
                    this.last_filled = i;

                    this.resetSelects();
                    this.selects[i + 1].enable();
                    this.selects[i + 1].populateOptions(this.filter);
                    this.requestShow(i + 1);
                } else {
                    custom_selects[i].hideOptions();
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
                        let { make, year, model, engine, category } = this.filter;
                        window.location.assign(`/search?make=${make || "ANY"}&year=${year || "ANY"}&model=${model || "ANY"}&engine=${engine || "ANY"}&category=${category || "ANY"}`);
                    }
                }
            })

            this.selects.push(custom_selects[i]);
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
        if (this.selects[index].enabled /*index<= this.last_filled + 1*/) {
            this.selects[index].showOptions();
        }
    }
    resetSelects() {
        for (let i = this.last_filled + 1; i < this.selects.length - 1; i++) {
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