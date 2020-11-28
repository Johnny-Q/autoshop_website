let year_button = document.querySelector("#year_submit");
let int_button = document.querySelector("#int_submit");
let add_button = document.querySelector("#add_item");
let status_text = (document.querySelector("#status_text") as HTMLParagraphElement);

year_button.addEventListener("click", async function () {
    let start_year = (document.querySelector("#start_year") as HTMLInputElement).value;
    let end_year = (document.querySelector("#end_year") as HTMLInputElement).value;
    try {
        let res = await fetch("/year", {
            "method": "POST",
            "headers": {
                "Authorization": "Basic ",
                "Content-Type": "application/json"
            },
            "body": JSON.stringify({
                "start_year": start_year,
                "end_year": end_year
            })
        })
        let json = await res.json();
        status_text.innerText = JSON.stringify(json);
        console.log(json);
    }catch(err){

    }
    
    console.log(start_year, end_year);
});

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

add_button.addEventListener("click", async function(){
    fetch("/debug", {
        "method": "POST",
        "headers": {
            "Authorization": "Basic ",
            "Content-Type": "application/json"
        },
        "body": JSON.stringify({})
    })
});