class SearchBox{
    button;
    options;
    input;
    isFocused = false;
    constructor(button, options, input){
        this.button = button;
        this.options = options;
        this.input = input;

        //add listeners to all the objects
        options.querySelectorAll("li").forEach((li)=>{
            li.onclick = function(){
                console.log(this);
            };
        });


        this.button.onclick = ()=>{
            this.isFocused = !this.isFocused;
            if(this.isFocused){
                this.options.classList.add("active");
            }else{
                this.options.classList.remove("active");
            }
        };

        this.options.onclick = ()=>{

        };
    }
}

let asdf = new SearchBox(document.querySelector("button"), document.querySelector(".options"), document.querySelector("input"));
// console.log(asdf.button);
// console.log(asdf.options);
// console.log(asdf.input);

class SearchBar{
    
    constructor(){

    }
}
