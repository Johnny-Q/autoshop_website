let save_button = document.querySelector("#save_cart");
let order_button = document.querySelector("#place_order");
let comments = document.querySelector("textarea");
let po_number = document.querySelector("#po_number");
save_button.onclick = () => {
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
    }).then(resp => {
        if (resp.status == 200) {
            window.location.reload();
        }
    });
};
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
        Array.from(document.querySelectorAll("input[name=delivery]")).forEach(input=>{
            if(input.checked) data.delivery = input.id;
        });

        //get the delivery type
        Array.from(document.querySelectorAll("input[name=payment]")).forEach(input=>{
            if(input.checked) data.payment = input.id;
        });

        data.po_number = po_number.value || "N/A";
        data.comments = comments.value || "None";

        fetch("/cart/place_order", {
            "method": "post",
            "headers": {
                "content-type": "application/json"
            },
            "body": JSON.stringify(data)
        });
    });
};
//# sourceMappingURL=cart.js.map