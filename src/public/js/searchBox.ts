/**
 * @description works similar to a linked list
 * @param button the button the user clicks to show the elemnts
 * @param options the actual options div that is being shown
 * @param input the hidden input field that will store the value of the search field
 * @param next_field the next SearchBox to focus on after a value is sumbitted
 */
class SearchNode {
    button;
    options_div;
    input;
    next_field;
    default_text;
    active = false;
    isFocused = false;
    getOptions = () => {
        let data = ["ree"];
        return data;
    };
    constructor(button, options, input, next_field: SearchNode, default_text) {
        this.button = button;
        this.options_div = options;
        this.input = input;
        this.next_field = next_field;
        this.default_text = default_text;

        let option_elements = this.options_div.children[0].children;

        for (let i = 0; i < option_elements.length; i++) {
            option_elements[i].onclick = (event) => {
                let { target } = event;
                //if it's the same value nothing changed
                if (this.input.value == target.innerText) {
                    console.log(this.input.value, target.innerText);
                    this.hideOptions();
                    return;
                }

                //set the value and update visually
                this.input.value = target.innerText;
                this.input.dispatchEvent(new Event("change"));
                this.button.innerText = target.innerText;
            };
        }
    }
    showOptions() {
        if (this.options_div.classList.contains("active")) return;
        this.options_div.classList.add("active");
    }
    hideOptions() {
        if (!this.options_div.classList.contains("active")) return;
        this.options_div.classList.remove("active");
    }
    reset() {
        this.button.innerText = this.default_text;
        this.input.value = "";
    }

    populateOptions() {
        let values = this.getOptions();

        let ul = this.options_div.children[0];

        //remove the old options
        while (ul.firstChild) {
            ul.removeChild(ul.lastChild);
        }

        //add children
        values.forEach(value => {
            let temp = document.createElement("li");
            let span = document.createElement("span");
            span.innerText = value;
            temp.append(span);

            //have to add listeners to them;
            //@ts-expect-error
            temp.onclick = (event) => {
                let { target } = event;

                if (this.input.value == target.innerText) {
                    console.log(this.input.value, target.innerText);
                    this.hideOptions();
                    return;
                }

                //set the value and update visually
                this.input.value = target.innerText;
                this.input.dispatchEvent(new Event("change"));
                this.button.innerText = target.innerText;
            }
            
            ul.append(temp);
        });
    }
}

/**
 * @description flow logic for the search bar
 * 
 */
class SearchBar {
    /**
     * when the user changes a value, autofocus onto the next one
     */
    search_fields: Array<SearchNode>;

    current_index = 0; //start at the beginning
    constructor(search_fields) {
        this.search_fields = search_fields;

        this.updateButtonStates();

        //set the first one as active
        // search_fields[0].button.disabled = false;

        //add button listeners;
        for (let i = 0; i < search_fields.length; i++) {
            let field = search_fields[i];


            field.button.onclick = (event) => {
                let target = { event };
                this.requestShow(i);
            };

            field.input.onchange = (event) => {
                console.log("changed", event);
                this.current_index = i + 1;

                if (field.next_field == null) {
                    this.hideAll();
                    //call the search function here or something
                    asdf.search();
                    return;
                }

                this.updateButtonStates();
            };
        }
    }

    requestShow(index) {
        if (this.current_index < index) return;
        //hide everything else before showing the one we want to see

        this.hideAll();
        //init the values
        this.search_fields[index].populateOptions();
        this.search_fields[index].showOptions();
    }

    hideAll() {
        this.search_fields.forEach(field => {
            field.hideOptions();
        });
    }

    updateButtonStates() {
        let current_field = search_fields[this.current_index];
        current_field.button.disabled = false;
        current_field.reset();
        //for the autofocus
        if (this.current_index != 0) this.requestShow(this.current_index);


        //if the user changed a value in something that was previous, reset everything in front of it
        for (let i = this.current_index + 1; i < this.search_fields.length; i++) {
            search_fields[i].button.disabled = true;
            search_fields[i].reset();
        }
    }
}

function min(a, b) {
    return a < b ? a : b;
}


let names = ["make", "year", "model", "engine"];
names.reverse();
let search_fields: Array<SearchNode> = [];
for (let i = 0; i < names.length; i++) {
    let name = names[i];
    let temp = new SearchNode(document.querySelector(`#${name}_button`), document.querySelector(`.${name}_options`), document.querySelector(`input[name=search_${name}]`), i == 0 ? null : search_fields[i - 1], `Select ${name}`);
    search_fields.push(temp);
}
search_fields.reverse();


//TEMP
search_fields[0].getOptions = ()=>{
    return ["bmw", "amd", "intel", "any"];
};
search_fields[1].getOptions = ()=>{
    let data = []
    for(let i = 2000;i < 2500; i++){
        data.push(i.toString());
    }
    data.push("any");
    return data;
};
search_fields[2].getOptions = ()=>{
    return ["model 1", "model 2", "any"];
};
search_fields[3].getOptions = ()=>{
    return ["1.0L", "1.5L", "2.0L", "any"];
};


let search_bar = new SearchBar(search_fields);