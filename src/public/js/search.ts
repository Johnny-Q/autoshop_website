let table = document.querySelector("table");
let feedback_div = document.querySelector("div.feedback");
let toast = document.querySelector("div.toast");
let image_modal = document.querySelector(".image_modal");
let parts_manager = new PartsManager(table, feedback_div, toast, image_modal);

//search box
//init the custom selects
let custom_select_nodes = document.querySelectorAll(".custom_select");
let filter_options = document.querySelector(".part_options");
let category_options = document.querySelector(".specific_options");
//construct the custom selects
let default_texts = ["Select Make", "Select Year", "Select Model", "Select Engine", "Select Type"];
let names = ["make", "year", "model", "engine", "category"];
let custom_selects = [];
for (let i = 0; i < custom_select_nodes.length - 1; i++) {
    let temp = new CustomSelect(custom_select_nodes[i] as HTMLElement, filter_options, default_texts[i], names[i]);
    custom_selects.push(temp);
}
for (let i = 0; i < custom_selects.length - 1; i++) {
    custom_selects[i].next_select = custom_selects[i + 1];
}
custom_selects.push(new CustomSelect(custom_select_nodes[custom_select_nodes.length - 1] as HTMLElement, category_options, "Select Type", "category"));
let filter_bar = new FilterBar(custom_selects);
//search box
// let search_bar = new SearchBar(custom_selects, ["Select Make", "Select Year", "Select Model", "Select Engine Size", "Select Type"], ["make", "year", "model", "engine", "category"]);
filter_bar.custom_selects[0].getOptions = async (filter): Promise<string[]> => {
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
filter_bar.custom_selects[1].getOptions = async (filter): Promise<string[]> => {
    try {
        let { make } = filter;
        let resp = await fetch(`/names/years?make=${make}`, {//${filter}`, {
            "method": 'get'
        });
        let json = await resp.json() as Array<Object>;
        let { begin_year, end_year } = json;
        console.log(json);
        let data = [];
        for (let i = end_year; i >= begin_year; i--) {
            data.push(i);
        }
        return data;
    } catch (err) {
        return [];
    }
}
filter_bar.custom_selects[2].getOptions = async (filter): Promise<string[]> => {
    try {
        let { make, year } = filter;
        let resp = await fetch(`/names/models?make=${make}&year=${year}`, {
            "method": 'get'
        });
        let json = await resp.json() as Array<Object>;
        let data = []
        //json is an array
        json.forEach((object: any) => {
            data.push(object.model);
        });
        return data;
    } catch (err) {
        return [];
    }
}
filter_bar.custom_selects[3].getOptions = async (filter): Promise<string[]> => {
    try {
        let { make, year, model } = filter;
        let resp = await fetch(`/names/engine?make=${make}&year=${year}&model=${model}`, {
            "method": 'get'
        });
        let json = await resp.json() as Array<Object>;
        let data = []
        //json is an array
        json.forEach((object: any) => {
            data.push(object.engine);
        });
        console.log(data);
        return data;
    } catch (err) {
        return [];
    }
}
filter_bar.custom_selects[4].getOptions = (filter) => {
    return [[
        "Alternators",
        "Starters",
        "Brake Sensors",
        "ABS Sensors",
        "Crankshaft Sensors",
        "Camshaft Sensors"
    ],
    [
        "Alternator",
        "Starter",
        "Brake Sensor",
        "ABS Sensor",
        "Crankshaft",
        "Camshaft"
    ]];
}

let oe_input = document.querySelector("div.smaller_search_bar > input") as HTMLInputElement;
let oe_search_button = document.querySelector("div.smaller_search_bar > button");
document.querySelector(".oe_form").addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!oe_input.value) return;
    let parts = await parts_manager.apiOESearch(oe_input.value);
    // console.log(parts);
    parts_manager.clearParts();
    parts.forEach(part => {
        parts_manager.renderPart(part);
    });
    parts_manager.showTable();
});

// let specific_type_bar = new SearchBar(Array.from(document.querySelectorAll(".specific_custom_select")), ["Select Type"], ["type"], document.querySelector(".specific_options"));
// specific_type_bar.selects[0].getOptions = (filter)=>{
//     return [
//         "Alternators and Starters",
//         "Brake Sensors",
//         "ABS Sensors",
//         "Crankshaft and Camshaft Sensors"
//     ];
// }
// specific_type_bar.selects[0].populateOptions("");
window.onload = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    let parts;
    if (urlParams.get("make")) {
        let params = ["make", "year", "model", "engine"];
        let search_data = {};
        for (let i = 0; i < params.length; i++) {
            search_data[params[i]] = urlParams.get(params[i]) || "ANY";
        }

        parts = await parts_manager.apiSearchFull(search_data);
        // parts_manager.showTable();
    }
    else if (urlParams.get("oe_number")) {
        parts = await parts_manager.apiOESearch(urlParams.get("oe_number"));
        // console.log(parts);
    } else if (urlParams.get("category")) {
        parts = await parts_manager.apiCategorySearch(urlParams.get("category"));
        console.log(urlParams.get("category"));
    }
    console.log(parts);
    parts_manager.clearParts();
    parts.forEach(part => {
        parts_manager.renderPart(part);
    });
    parts_manager.showTable();
}