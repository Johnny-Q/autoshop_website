let mobile_nav = document.querySelector(".mobile_content");
document.querySelector(".mobile_hamburger").onclick = (e) => {
    mobile_nav.style.display = "flex";
};

window.onclick = (e) => {
    if (e.target == mobile_nav) {
        console.log(e.target);
        mobile_nav.style.display = "none";
    }
};
