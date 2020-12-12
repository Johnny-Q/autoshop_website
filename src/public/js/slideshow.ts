// class Slideshow {
//     current_slide = 0;
//     image_urls: string[];
//     max_index = 0;
//     image_div: HTMLDivElement
//     constructor(left_arrow: HTMLDivElement, right_arrow: HTMLDivElement, image_div: HTMLDivElement, image_urls: string[], indicator_div: HTMLDivElement) {
//         this.image_urls = image_urls;
//         this.max_index = image_urls.length - 1;
//         this.image_div = image_div;
//         left_arrow.onclick = () => {
//             this.current_slide--;
//             //bound it to 0
//             this.current_slide = this.current_slide < 0 ? 0 : this.current_slide;
//             this.renderSlide(this.current_slide);
//         };
//         right_arrow.onclick = () => {
//             this.current_slide++;
//             this.current_slide = this.current_slide > this.max_index ? this.max_index : this.current_slide;
//             this.renderSlide(this.current_slide);
//         }
//     }
//     renderSlide(index) {
//         this.image_div.style = `background-image: url(${this.image_urls[index]})`;
//     }
//     hideAllSlides() {
//     }
// }
// let image_urls = [];
// for (let i = 1; i < 7; i++) {
//     image_urls.push(`../img/catalog${i}.png`);
// }
// let slides = new Slideshow(document.querySelector(".left_arrow"), document.querySelector(".right_arrow"), document.querySelector(".images"), image_urls, document.querySelector(".indicators"));

class Slideshow {
    current_slide = 0;
    max_index = 0;
    image_divs: Array<HTMLDivElement>
    indicators: Array<HTMLDivElement>;
    constructor(left_arrow: HTMLDivElement, right_arrow: HTMLDivElement, image_divs: Array<HTMLElement>, indicators: Array<HTMLElement>) {
        this.max_index = image_divs.length - 1;
        this.image_divs = image_divs as Array<HTMLDivElement>
        this.indicators = indicators as Array<HTMLDivElement>;
        left_arrow.onclick = () => {
            this.current_slide--;
            //bound it to 0
            this.current_slide = this.current_slide < 0 ? 0 : this.current_slide;
            this.renderSlide(this.current_slide);
        };
        right_arrow.onclick = () => {
            this.current_slide++;
            this.current_slide = this.current_slide > this.max_index ? this.max_index : this.current_slide;
            this.renderSlide(this.current_slide);
        }
    }
    renderSlide(index) {
        this.hideAllSlides();
        this.image_divs[index].classList.add("active");
        this.indicators[index].classList.add("active");
    }
    hideAllSlides() {
        this.image_divs.forEach(div => {
            if (div.classList.contains("active"))
                div.classList.remove("active");
        });
        this.indicators.forEach(div => {
            if (div.classList.contains("active"))
                div.classList.remove("active");
        });
    }
}
let slides = new Slideshow(document.querySelector(".left_arrow"), document.querySelector(".right_arrow"), Array.from(document.querySelectorAll("div.cards > div.images > div.img")), Array.from(document.querySelectorAll(".indicators > .line")));