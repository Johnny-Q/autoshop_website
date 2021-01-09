let save_button = document.querySelector("#save_cart");
let order_button = document.querySelector("#place_order");
let comments = document.querySelector("textarea");
let po_number = document.querySelector("#po_number");
let requiredText = document.querySelector("#required")

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

function image_onerror(id, image_string){
    console.log(id, image_string);
    let image = document.querySelector(`#image-${id}`);
    image.src = `/img/parts/${image_string}.png`;
    image.onerror = null;
}

function updateSubtotal(){
    let total_price = 0;
    document.querySelectorAll(".total").forEach(e =>{
        total_price += parseFloat(e.innerText.substr(1));
    });

    subtotal.innerText = "Subtotal: $" + total_price.toFixed(2) + " CAD";

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
        "body": JSON.stringify({ updates })
    })
}

function removePast2Decimals(price: number): string{
    return price.toFixed(2);


    let price_string = price.toString();

    price_string = price_string.split(".");
    if(price_string.length != 1){
        price_string[1] = price_string[1].substring(0, 2);
    } else price_string.push('00')

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

        data.po_number = po_number.value;
        if(!data.po_number){
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
        }).then(res=>{
            res.text().then((html)=>{
                document.documentElement.innerHTML = html;
            })
        })
    });
};
//# sourceMappingURL=cart.js.map