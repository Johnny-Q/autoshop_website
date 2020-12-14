function onScreenCallback(entries, observer){
    entries.forEach( entry => {
        if(entry.isIntersecting){
            entry.target.classList.add('visible');
        }
    });
}
let onScreenOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.3
};

window.addEventListener("load", event => {
    let fadeDownObserver = new IntersectionObserver(onScreenCallback, onScreenOptions);
    let hiddenContent = document.querySelector('.content.fade');
    fadeDownObserver.observe(hiddenContent);
})