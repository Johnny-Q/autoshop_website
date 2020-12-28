/**
 * @param left_arrow div containing the left arrow
 * @param right_arrow div containing the right_arrow
 * @param image_divs all div.img in the slideshow, acts as the actual slides
 * @param indicators array of the small lines
 */
class Slideshow {
    current_slide = 0;
    max_index = 0;
    image_divs: Array<HTMLDivElement>;
    indicators: Array<HTMLDivElement>;
    constructor(left_arrow: HTMLDivElement, right_arrow: HTMLDivElement, image_divs: Array<HTMLElement>, indicators: Array<HTMLElement>) {
        this.max_index = image_divs.length - 1;
        this.image_divs = image_divs as Array<HTMLDivElement>
        this.indicators = indicators as Array<HTMLDivElement>;
        left_arrow.onclick = () => {
            this.removeTag(this.current_slide, 'active');
            if(this.current_slide > 0) this.removeTag(this.current_slide-1, 'left');
            if(this.current_slide < this.max_index) this.removeTag(this.current_slide+1, 'right');
            this.current_slide--;
            //bound it to 0
            this.current_slide = this.current_slide < 0 ? 0 : this.current_slide;
            this.setTag(this.current_slide, 'active');
            if(this.current_slide > 0){
                this.setTag(this.current_slide-1, 'left')
            }
            if(this.current_slide < this.max_index){
                this.setTag(this.current_slide+1, 'right')
            }
            //this.renderSlide(this.current_slide);
        };
        right_arrow.onclick = () => {
            this.removeTag(this.current_slide, 'active');
            if(this.current_slide > 0) this.removeTag(this.current_slide-1, 'left');
            if(this.current_slide < this.max_index) this.removeTag(this.current_slide+1, 'right');
            this.current_slide++
            //bound it to 0
            this.current_slide = this.current_slide > this.max_index ? this.max_index : this.current_slide;
            this.setTag(this.current_slide, 'active');
            if(this.current_slide > 0){
                this.setTag(this.current_slide-1, 'left')
            }
            if(this.current_slide < this.max_index){
                this.setTag(this.current_slide+1, 'right')
            }
            //this.renderSlide(this.current_slide);
        };
        // right_arrow.onclick = () => {
        //     this.current_slide++;
        //     this.current_slide = this.current_slide > this.max_index ? this.max_index : this.current_slide;
        //     this.renderSlide(this.current_slide);
        // }
    }
    setTag(index, tag){
        this.image_divs[index].classList.add(tag);
        this.indicators[index].classList.add(tag);
    }
    removeTag(index, tag){
        this.image_divs[index].classList.remove(tag);
        this.indicators[index].classList.remove(tag);
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

function activate(img){
    slides.renderSlide(img-1);
}