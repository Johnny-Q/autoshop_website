// let search_names = ["make", "year", "model", "engine"];
// let search = {};
// search_names.forEach(name => {
//     search[name] = document.querySelector(`input[name=search_${name}]`);
// });

// let oe_input = document.querySelector("#search_oe");

// let full_search_btn = document.querySelector("#full_search_btn") as HTMLElement;
// let oe_search_btn = document.querySelector("#oe_search_btn") as HTMLElement;

// let feedback_div = document.querySelector(".feedback") as HTMLElement;
// let message_h1 = document.querySelector("#message") as HTMLElement;
// let loader_gif = document.querySelector("#loader") as HTMLElement;

// // let parts_table = document.querySelector("#parts_container") as HTMLTableElement;
// let results_div = document.querySelector(".search_results") as HTMLElement;
// let parts_grid = document.querySelector(".parts_grid");
// let check = `<svg width="33" height="25" viewBox="0 0 33 25" fill="none" xmlns="http://www.w3.org/2000/svg"><line x1="1.06066" y1="13.9393" x2="8.56066" y2="21.4393" stroke="#00A825" stroke-width="3"/><line x1="31.0607" y1="1.06066" x2="8.56066" y2="23.5607" stroke="#00A825" stroke-width="3"/></svg>`
// let cross = `<svg width="21" height="21" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg"><line x1="1.41102" y1="19.0282" x2="19.0887" y2="1.35054" stroke="#A50000" stroke-width="3"/><line x1="1.41125" y1="1.35053" x2="19.0889" y2="19.0282" stroke="#A50000" stroke-width="3"/></svg>`;

function onScreenCallback(entries, observer){
    entries.forEach( entry => {
        if(entry.isIntersecting){
            entry.target.classList.add('visible');
        }
    });
}
let onScreenOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.3
};

window.addEventListener("load", event => {
    let fadeDownObserver = new IntersectionObserver(onScreenCallback, onScreenOptions);
    let hiddenContent = document.querySelector('.content.fade');
    fadeDownObserver.observe(hiddenContent);
})

//search box
let search_bar = new SearchBar(Array.from(document.querySelectorAll(".custom_select")), ["Select Make", "Select Year", "Select Model", "Select Engine Size"], ["make", "year", "model", "engine"]);
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
document.querySelector(".oe_form").addEventListener("submit", async (e)=>{
    e.preventDefault();
    if(!oe_input.value) return;
    if(!oe_input.value) return;
    window.location.assign(`/search?oe_number=${oe_input.value}`);
});