let tbody = document.querySelector("tbody");
(async () => {
    try {
        let resp = await fetch("/get_all_users");
        let json = await resp.json();
        console.log(json);
        for (let user of Object.values(json)) {
            let row = tbody.insertRow();
            // row.onclick = () => {
            //     window.location.assign(`/admin/edit_user?id=${user.id}`);
            // };
            let email = row.insertCell();
            email.innerText = user.email;
            let fname = row.insertCell();
            fname.innerText = user.contact_first;
            let lname = row.insertCell();
            lname.innerText = user.contact_last;

            let icon = row.insertCell();
            icon.style.display = "flex";
            icon.style["flex-direction"] = "row";
            icon.style["width"] = "fit-content";
            let editIcon = document.createElement("div");
            // editIcon.href = `/admin/edit_user?id=${user.id}`;
            editIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" class="bi bi-pencil-square" viewBox="0 0 16 16">
            <path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456l-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z"/>
            <path fill-rule="evenodd" d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5v11z"/>
            </svg>
            `;
            editIcon.style["margin-right"] = "5px";
            
            let trashIcon = document.createElement("div");
            // trashIcon.href = `/admin/delete_user?id=${user.id}`;
            trashIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" class="bi bi-trash" viewBox="0 0 16 16">
            <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
            <path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4L4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
            </svg>`;


            icon.append(editIcon, trashIcon);
            icon.append(editIcon);

            editIcon.querySelector("svg").onclick = (e) => {
                window.location.assign(`/admin/edit_user?id=${user.id}`);
            };

            trashIcon.querySelector("svg").onclick = (e) => {
                // window.location.assign(`/admin/delete_user?id=${user.id}`);
                fetch(`/admin/delete_user?id=${user.id}`).then((res) => {
                    if (res.status == 200) {
                        row.remove();
                    }
                });
            };
        }
        sorttable.makeSortable(document.querySelector("sortable"));
    } catch (err) {
        console.log(err);
    }
})();
