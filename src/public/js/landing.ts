class Carousel {
    counter
    num_images;
    constructor(num, left, right) {
        this.counter = 0;
        this.num_images = num;
        right.onclick = () => this.right();
        left.onclick = () => this.left();
        console.log(left); console.log(right);
    }

    hide(){
        document.getElementsByClassName('images')[0].children[this.counter].classList.remove("active");
        document.getElementsByClassName('images')[0].children[this.counter].classList.add("inactive");
    }
    show(){
        document.getElementsByClassName('images')[0].children[this.counter].classList.remove("inactive");
        document.getElementsByClassName('images')[0].children[this.counter].classList.add("active");
    }
    right(){
        this.hide();
        this.counter++;
        this.counter %= this.num_images;
        this.show();
    }
    left(){
        this.hide();
        this.counter--; this.counter += this.num_images;
        this.counter %= this.num_images;
        this.show();
    }
}

let carousel = new Carousel(
    document.getElementsByClassName('images')[0].childElementCount,
    document.querySelector(".left-arrow"),
    document.querySelector(".right-arrow")
    );
    
//document.getElementsByClassName('right')[0].onclick = carousel.right;

function search(destination){
    let search = "/search?category=" + destination.replace(" ", "%20");
    window.location.href = search;
}
