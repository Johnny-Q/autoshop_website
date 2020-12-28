let accounts_container = document.querySelector("div.accounts_container");

class PendingAccountsManager {
    accounts_container;
    check = `<svg width="25" height="25" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg"> <line x1="1.06066" y1="13.9393" x2="8.56066" y2="21.4393" stroke="#00A825" stroke-width="3" /> <line x1="31.0607" y1="1.06066" x2="8.56066" y2="23.5607" stroke="#00A825" stroke-width="3" /> </svg>`;
    cross = `<svg width="21" height="21" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg"> <line x1="1.46623" y1="19.0904" x2="19.0185" y2="1.2882" stroke="#A50000" stroke-width="3" /> <line x1="1.34122" y1="1.41331" x2="19.1434" y2="18.9655" stroke="#A50000" stroke-width="3" /> </svg>`;
    toast;
    toast_hide_func = null;
    constructor(accounts_container, toast) {
        this.accounts_container = accounts_container;
        this.toast = toast;
    }

    async getAndRender() {
        let accounts = await this.getPendingAccounts();
        accounts.forEach(account => {
            this.renderCard(account);
        });
    }

    async getPendingAccounts() {
        let resp = await fetch("/get_users", { "method": "get" });
        return await resp.json();
    }

    renderCard(account_details) {
        let card = this.createElement("div", ["card"]);

        let card_header = this.createElement("div", ["card_header"]);;
        let name = this.createElement("h2", [], `${account_details.contact_first} ${account_details.contact_last}`);
        let btn_div = document.createElement("div");
        let check = document.createElement("button");
        check.innerHTML = this.check;
        let cross = document.createElement("button");
        cross.innerHTML = this.cross;
        btn_div.append(check, cross);
        card_header.append(name, btn_div);

        check.onclick = () => {
            fetch("/user/approve", {
                "method": "POST",
                "headers": {
                    "Content-type": "application/json"
                },
                "body": JSON.stringify({
                    "id": account_details.id,
                    "status": 1
                })
            }).then(resp => {
                if (resp.status == 200) {
                    this.displayToast(true, account_details.contact_first);
                }
            });;
            card.remove();
            console.log("allow", account_details.id);
        }
        cross.onclick = () => {
            fetch("/user/approve", {
                "method": "POST",
                "headers": {
                    "Content-type": "application/json"
                },
                "body": JSON.stringify({
                    "id": account_details.id,
                    "status": -1
                })
            }).then(resp => {
                if (resp.status == 200) {
                    this.displayToast(false, account_details.contact_first);
                }
            });
            card.remove();
            console.log("reject", account_details.id);
        }
        card.append(card_header);

        let keys = ["company", "business", "email", "purchase", "telephone", "fax", "address1", "address2", "province", "city", "postal"];
        let field_name = ["Company Name", "Business Type", "E-Mail", "Spending Amount", "Phone", "Fax", "Address Line 1", "Address Line 2", "Province", "City", "Postal"];
        for (let i = 0; i < keys.length; i++) {
            let group = this.createElement("div", ["group"]);
            group.append(this.createElement("small", [], field_name[i]));
            group.append(this.createElement("p", [], account_details[keys[i]] || "None"));

            card.append(group);
        }

        this.accounts_container.append(card);
    }
    createElement(type: string, classes = [], text = "") {
        let temp = document.createElement(type);
        classes.forEach(name => {
            temp.classList.add(name);
        });
        if (text) {
            temp.innerText = text;
        }

        return temp;
    }
    displayToast(isPositive: boolean, name: string) {
        this.toast.style["background-color"] = isPositive ? "rgb(129, 211, 129)" : "rgb(212, 124, 124)";
        this.toast.innerText = `${isPositive ? "Approved" : "Rejected"} ${name}`;
        if (this.toast_hide_func) {
            clearTimeout(this.toast_hide_func);
            this.toast.classList.remove("show");
        }
        this.toast.classList.add("show");
        this.toast_hide_func = setTimeout(() => {
            this.toast.classList.remove("show");
            this.toast_hide_func = null;
        }, 1000);
    }
}

let manager = new PendingAccountsManager(accounts_container, document.querySelector("div.toast"));
window.onload = () => {
    manager.getAndRender();

    console.log("reee");
}