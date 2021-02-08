let tbody = document.querySelector("tbody");
(async () => {
    try {
        let resp = await fetch("/get_all_users");
        let json = await resp.json();
        console.log(json);
        for (let user of Object.values(json)) {
            let row = tbody.insertRow();
            row.onclick = ()=>{window.location.assign(`/admin/edit_user?id=${user.id}`)};
            let email = row.insertCell();
            email.innerText = user.email;
            let fname = row.insertCell();
            fname.innerText = user.contact_first;
            let lname = row.insertCell();
            lname.innerText = user.contact_last;

            let icon = row.insertCell();
            icon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="32.69" height="32.69" fill="currentColor" class="bi bi-pencil-square" viewBox="0 0 16 16">
            <path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456l-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z"/>
            <path fill-rule="evenodd" d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5v11z"/>
            </svg>`;
            icon.onclick = ()=>{window.location.assign(`/admin/edit_user?id=${user.id}`)};
        }
        sorttable.makeSortable(document.querySelector("sortable"));
    } catch (err) {
        console.log(err);
    }
})();
