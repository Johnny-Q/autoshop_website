let add_application = document.querySelector("#add_application");
let add_int = document.querySelector("#add_int");
let application_table = document.querySelector("#app_table");
let int_table = document.querySelector("#int_table");
add_application.onclick = (e)=>{
    e.preventDefault();
    let row = application_table.insertRow();
    let model = row.insertCell();
    model.classList.add("labelled_input");
    let start_year = row.insertCell();
    start_year.classList.add("labelled_input");
    let end_year = row.insertCell();
    end_year.classList.add("labelled_input");
    let delete_btn = row.insertCell();
    delete_btn.innerHTML = `<button onclick="this.parentElement.parentElement.remove()">Delete Application</button>`;
    model.innerHTML = `<input type="text" name="model" placeholder="Model" required>`;
    start_year.innerHTML = `<input type="text" name="begin_year" placeholder="Start Year" required>`;
    end_year.innerHTML = `<input type="text" name="end_year" placeholder="End Year" required>`;
};

add_int.onclick = (e)=>{
    e.preventDefault();
    let row = int_table.insertRow();
    let int = row.insertCell();
    int.classList.add("labelled_input");
    let delete_btn = row.insertCell();
    delete_btn.innerHTML = `<button onclick="this.parentElement.parentElement.remove()">Delete Application</button>`;
    int.innerHTML = `<input type="text" name="int_number" placeholder="Interchange No." required>`;
};
