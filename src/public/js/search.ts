let table = document.querySelector("table");
let feedback_div = document.querySelector("div.feedback");
let toast = document.querySelector("div.toast");
let image_modal = document.querySelector(".image_modal");
let parts_manager = new PartsManager(table, feedback_div, toast, image_modal);

//search box
//@ts-expect-error
let search_bar = new SearchBar(Array.from(document.querySelectorAll(".custom_select")), ["Select Make", "Select Year", "Select Model", "Select Engine Size"], ["make", "year", "model", "engine"], parts_manager);
search_bar.selects[0].getOptions = async (filter): Promise<string[]> => {
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
search_bar.selects[1].getOptions = async (filter): Promise<string[]> => {
    try {
        let { make } = filter;
        let resp = await fetch(`/names/years?make=${make}`, {//${filter}`, {
            "method": 'get'
        });
        let json = await resp.json() as Array<Object>;
        let data = []
        //json is an array
        json.forEach((object: any) => {
            data.push(object.year);
        });
        data.reverse();
        return data;
    } catch (err) {
        return [];
    }
}
search_bar.selects[2].getOptions = async (filter): Promise<string[]> => {
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
search_bar.selects[3].getOptions = async (filter): Promise<string[]> => {
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
        return data;
    } catch (err) {
        return [];
    }
}
search_bar.selects[0].populateOptions("");

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
window.onload = async () => {
    const urlParams = new URLSearchParams(window.location.search);

    if (urlParams.get("make")) {

        let params = ["make", "year", "model", "engine"];
        let search_data = {};
        for (let i = 0; i < params.length; i++) {
            search_data[params[i]] = urlParams.get(params[i]) || "Any";
        }
        // parts_manager.showTable();
        parts_manager.searchAndRender(search_data);
    }
    else if (urlParams.get("oe_number")) {
        let parts = await parts_manager.apiOESearch(urlParams.get("oe_number"));
        // console.log(parts);
        parts_manager.clearParts();
        parts.forEach(part => {
            parts_manager.renderPart(part);
        });
        parts_manager.showTable();
    }
    
}

