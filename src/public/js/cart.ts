let save_button = document.querySelector("#save_cart");
let order_button = document.querySelector("#place_order");
let comments = document.querySelector("textarea");
let po_number = document.querySelector("#po_number");
let requiredText = document.querySelector("#required")

let subtotal = document.querySelector(".subtotal");

const default_time = 750;
let time = default_time;
let changed = false;
// let current_cart = []; //former updates

let timer = setInterval(() => {
    if (time <= 0) {
        time = 750;
        if (changed) {
            changed = false;
            // do fetch here
            console.log('posting cart');
            // update cart totals
            let updates = [];
            //get the update from the number inputs
            let inputs = document.querySelectorAll("input[type=number]");
            inputs.forEach(input => {
                updates.push({ "id": input.name, "quantity": input.value });
            });

            fetch("/cart", {
                "method": "post",
                "headers": {
                    "content-type": "application/json"
                },
                "body": JSON.stringify({ updates, })
            })
        }

    } else {
        time -= 10;
    }
}, 10);


window.onload = () => {
    document.querySelectorAll("input[type=number]").forEach((input) => {
        let parent = input.parentElement.parentElement;
        let total = parent.querySelector(".total");
        let price = parent.querySelector(".unit_price");

        input.onchange = function () {
            console.log(this.value);
            console.log(this.parentElement.parentElement);

            total.innerText = `$${removePast2Decimals(parseFloat(price.innerText.substr(1)) * this.value)}`;
            updateSubtotal();
        }
    });
}

function image_onerror(id, image_string) {
    console.log(id, image_string);
    let image = document.querySelector(`#image-${id}`);
    image.src = `/img/parts/${image_string}.png`;
    image.onerror = null;
}

function updateSubtotal() {
    let total_price = 0;
    document.querySelectorAll(".total").forEach(e => {
        total_price += parseFloat(e.innerText.substr(1));
    });

    subtotal.innerText = "Subtotal: $" + total_price.toFixed(2) + " CAD";

    changed = true;
    time = default_time;
}

function removePast2Decimals(price: number): string {
    return price.toFixed(2);
}

order_button.onclick = () => {
    //save their changes first
    let updates = [];
    //get the update from the number inputs
    let inputs = document.querySelectorAll("input[type=number]");
    inputs.forEach(input => {
        updates.push({ "id": input.name, "quantity": input.value });
    });
    fetch("/cart", {
        "method": "post",
        "headers": {
            "content-type": "application/json"
        },
        "body": JSON.stringify({ updates })
    }).then(() => {
        let data = {};
        //get the delivery type
        Array.from(document.querySelectorAll("input[name=delivery]")).forEach(input => {
            if (input.checked) data.delivery = input.id;
        });

        data.po_number = po_number.value;
        if (!data.po_number) {
            po_number.style.borderWidth = "3px";
            po_number.style.borderColor = "red";
            requiredText.style.display = "inline";
            return;
        }
        data.comments = comments.value || "None";

        fetch("/cart/place_order", {
            "method": "post",
            "headers": {
                "content-type": "application/json"
            },
            "body": JSON.stringify(data)
        }).then(res => {
            res.text().then((html) => {
                document.documentElement.innerHTML = html;
            })
        })
    });
};

function deletePart(part, id){
    part.parentElement.parentElement.remove();

    updateSubtotal();
    // time = 0;

    fetch("/cart/part", {
        "method":"delete",
        "headers": {
            "content-type": "application/json"
        },
        "body": JSON.stringify({
            "part": {
                "id": id
            }
        })
    });

    part.onclick = null;
}
//# sourceMappingURL=cart.js.map