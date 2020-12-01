let search_full_button = document.querySelector("#search_full");
let int_button = document.querySelector("#int_submit");
let add_part_button = document.querySelector("#add_part");
let search_oe_button = document.querySelector("#search_id_number");
let add_app_button = document.querySelector("#add_app");
let status_text = (document.querySelector("#status_text") as HTMLParagraphElement);

add_app_button.addEventListener("click", function () {
    console.log("reee");

    let applications = document.querySelectorAll("#applications > div");
    if (!assertValue(applications[applications.length - 1].children)) {
        alert("rart");
        return;
    }

    let app_div = document.querySelector("#applications");

    let parent_div = document.createElement("div");
    let model = document.createElement("input");
    model.placeholder = "model";

    let input_begin_year = document.createElement("input");
    input_begin_year.placeholder = "begin_year";

    let input_end_year = document.createElement("input");
    input_end_year.placeholder = "end_year";

    parent_div.append(model, input_begin_year, input_end_year);
    app_div.append(parent_div);
})

search_full_button.addEventListener("click", async function () {
    let make = (document.querySelector("#make") as HTMLInputElement).value;
    let model = (document.querySelector("#model") as HTMLInputElement).value;
    let year = (document.querySelector("#year") as HTMLInputElement).value;
    try {
        let res = await fetch("/search_full", {
            "method": "POST",
            "headers": {
                "Authorization": "Basic ",
                "Content-Type": "application/json"
            },
            "body": JSON.stringify({
                "make": make,
                "model": model,
                "year": year
            })
        })
        let json = await res.json();
        status_text.innerText = JSON.stringify(json);
        console.log(json);
    } catch (err) {

    }

    console.log(make, model, year);
});

search_oe_button.addEventListener("click", async function () {
    let id_number = (document.querySelector("#id_number") as HTMLInputElement).value;
    try {
        let res = await fetch("/search_id_number", {
            "method": "POST",
            "headers": {
                "Authorization": "Basic ",
                "Content-Type": "application/json"
            },
            "body": JSON.stringify({
                "id_number": id_number
            })
        })
        let json = await res.json();
        status_text.innerText = JSON.stringify(json);
        console.log(json);
    } catch (err) {

    }
})

int_button.addEventListener("click", async function () {
    let part_name = (document.querySelector("#part_name") as HTMLInputElement).value;
    fetch("/int", {
        "method": "POST",
        "headers": {
            "Authorization": "Basic ",
            "Content-Type": "application/json"
        },
        "body": JSON.stringify({
            "part_name": part_name
        })
    });
    console.log(part_name);
});

add_part_button.addEventListener("click", async function () {
    // select all the divs which fall under applications
    let applications = document.querySelectorAll("#applications > div");
    // assert that all of the application fields are filled out, otherwise alert user
    if (!assertValue(applications[applications.length - 1].children)) {
        alert("rart app");
        return;
    }
    // select part information div
    let part_information = document.querySelector("#part_information").children;
    // assert that all of the part information fields are filled out, otherwise alert user
    if (!assertValue(part_information)) {
        alert("rart info");
        return;
    }

    try {
        let part = {
            'make': part_information[2].value, 
            'oe_number': part_information[0].value, 
            'frey_number': part_information[1].value, 
            'price': part_information[3].value, 
            'description': "", 
            'enabled': 1, 
            'in_stock': 1};
        let part_applications = [];
        for(let i = 0; i < applications.length; i++){
            let temp = {
                'model': applications[i].children[0].value, 
                'begin_year': applications[i].children[1].value, 
                'end_year': applications[i].children[2].value
            };
            part_applications.push(temp);
        }
        console.log(part, part_applications);
        let body = JSON.stringify({
            'part': part,
            'applications': part_applications
        });
        console.log(body);
        let res = await fetch("/add_part", {
            "method": "POST",
            "headers": {
                "Authorization": "Basic ",
                "Content-Type": "application/json"
            },
            "body": body
        })
        let json = await res.json();
        status_text.innerText = JSON.stringify(json);
        console.log(json);
    } catch (err) {
        console.log(err);
    }
});

function assertValue(elements) {
    for (let i = 0; i < elements.length; i++) {
        if (!elements[i].value) return false;
    }
    return true;
};