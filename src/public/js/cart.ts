let save_button = document.querySelector("#save_cart");
let order_button = document.querySelector("#place_order");
let comments = document.querySelector("textarea");
let po_number = document.querySelector("#po_number");

let subtotal = document.querySelector(".subtotal");


window.onload = ()=>{
    document.querySelectorAll("input[type=number]").forEach((input)=>{
        let parent = input.parentElement.parentElement;
        let total = parent.querySelector(".total");
        let price = parent.querySelector(".unit_price");
        
        input.onchange = function(){
            console.log(this.value);
            console.log(this.parentElement.parentElement);

            total.innerText = `$${removePast2Decimals(parseFloat(price.innerText.substr(1)) * this.value)}`;
            updateSubtotal();
        }
    });
}

function updateSubtotal(){
    let total_price = 0;
    document.querySelectorAll(".total").forEach(e =>{
        total_price += parseFloat(e.innerText.substr(1));
    });

    subtotal.innerText = "Subtotal: $" + removePast2Decimals(total_price) + " CAD";
}

function removePast2Decimals(price: number): string{
    let price_string = price.toString();

    price_string = price_string.split(".");
    price_string[1] = price_string[1].substring(0, 2);

    return price_string.join(".");
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
        Array.from(document.querySelectorAll("input[name=delivery]")).forEach(input=>{
            if(input.checked) data.delivery = input.id;
        });

        data.po_number = po_number.value || "N/A";
        data.comments = comments.value || "None";

        fetch("/cart/place_order", {
            "method": "post",
            "headers": {
                "content-type": "application/json"
            },
            "body": JSON.stringify(data)
        }).then(res=>{
            res.text().then((html)=>{
                document.documentElement.innerHTML = html;
            })
        })
    });
};
//# sourceMappingURL=cart.js.map