/* ===== AUTO GALLERY SLIDER ===== */

let track = document.querySelector('.gallery-track');
let slides = document.querySelectorAll('.gallery-track img');
let index = 0;

if(track && slides.length > 0){

    setInterval(() => {
        index++;
        if(index >= slides.length){
            index = 0;
        }
        track.style.transform = `translateX(-${index * 100}%)`;
    }, 3000);

}


/* ===== SCROLL REVEAL FOR GALLERY ===== */

const observer = new IntersectionObserver((entries)=>{
    entries.forEach(entry=>{
        if(entry.isIntersecting){
            entry.target.classList.add('show');
        }
    });
},{ threshold:0.2 });

document.querySelectorAll('.hidden').forEach(el=>{
    observer.observe(el);
});


/* ===== SCROLL REVEAL GENERAL ===== */

window.addEventListener('scroll', function() {
    let reveals = document.querySelectorAll('.reveal');

    for(let i=0; i<reveals.length; i++){
        let windowHeight = window.innerHeight;
        let elementTop = reveals[i].getBoundingClientRect().top;
        let elementVisible = 100;

        if(elementTop < windowHeight - elementVisible){
            reveals[i].classList.add('active');
        }
    }
});

/*    RESPONSIVE    */

const toggle = document.getElementById("menu-toggle");
const menu = document.getElementById("nav-menu");

if(toggle && menu){
    toggle.addEventListener("click", () => {
        menu.classList.toggle("active");
    });
}

/* ===== REGISTRATION FORM ===== */

let form = document.getElementById("registrationForm");

if(form){
    form.addEventListener("submit", function(e){
        e.preventDefault();
        document.getElementById("successMessage").style.display = "block";
        this.reset();
    });
}
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();

        const target = document.querySelector(this.getAttribute('href'));

        if(target){
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});
 const boxes = document.querySelectorAll('.event-box');

    window.addEventListener('scroll', () => {
        const trigger = window.innerHeight * 0.85;

        boxes.forEach(box => {
            const top = box.getBoundingClientRect().top;

            if(top < trigger) {
                box.classList.add('show');
            }
        });
    });
// Contact Form Submission
const contactForm = document.querySelector(".contact-form");
const contactSuccess = document.getElementById("contactSuccess");

if (contactForm) {
    contactForm.addEventListener("submit", function(e) {
        e.preventDefault();
        contactSuccess.style.display = "block";
        contactForm.reset();
    });
}