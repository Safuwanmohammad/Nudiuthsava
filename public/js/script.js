/* ===== MULTIPLE GALLERY SLIDERS ===== */

document.querySelectorAll('.gallery-slider').forEach(slider => {

    const track = slider.querySelector('.gallery-track');
    const slides = slider.querySelectorAll('img');

    let index = 0;

    if (!track || slides.length === 0) return;

    setInterval(() => {

        index++;

        if (index >= slides.length) {
            index = 0;
        }

        track.style.transform = `translateX(-${index * 100}%)`;

    }, 3000);

});


/* ===== SCROLL REVEAL GENERAL ===== */

window.addEventListener('scroll', function () {

    let reveals = document.querySelectorAll('.reveal');

    for (let i = 0; i < reveals.length; i++) {

        let windowHeight = window.innerHeight;
        let elementTop = reveals[i].getBoundingClientRect().top;
        let elementVisible = 100;

        if (elementTop < windowHeight - elementVisible) {
            reveals[i].classList.add('active');
        }
    }
});


/* ===== RESPONSIVE MENU ===== */

const toggle = document.getElementById("menu-toggle");
const menu = document.getElementById("nav-menu");

if (toggle && menu) {
    toggle.addEventListener("click", () => {
        menu.classList.toggle("active");
    });
}


/* ===== REGISTRATION FORM ===== */

const form = document.getElementById("registrationForm");

if (form) {
    form.addEventListener("submit", function (e) {
        e.preventDefault();
        document.getElementById("successMessage").style.display = "block";
        this.reset();
    });
}


/* ===== SMOOTH SCROLL ===== */

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {

        e.preventDefault();

        const target = document.querySelector(this.getAttribute('href'));

        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});


/* ===== EVENT BOX ANIMATION ===== */

const boxes = document.querySelectorAll('.event-box');

window.addEventListener('scroll', () => {

    const trigger = window.innerHeight * 0.85;

    boxes.forEach(box => {

        const top = box.getBoundingClientRect().top;

        if (top < trigger) {
            box.classList.add('show');
        }
    });
});


/* ===== CONTACT FORM ===== */

const contactForm = document.querySelector(".contact-form");
const contactSuccess = document.getElementById("contactSuccess");

if (contactForm) {
    contactForm.addEventListener("submit", function (e) {
        e.preventDefault();
        contactSuccess.style.display = "block";
        contactForm.reset();
    });
}


/* ===== SPONSOR HOTSTAR STYLE SLIDER ===== */

const sponsorTrack = document.querySelector(".slide-track");
const sponsorSlides = document.querySelectorAll(".slide");
let sponsorIndex = 0;

if (sponsorTrack && sponsorSlides.length > 0) {

    function moveSponsorSlide() {

        sponsorIndex++;

        if (sponsorIndex >= sponsorSlides.length) {
            sponsorIndex = 0;
        }

        sponsorTrack.style.transform =
            `translateX(-${sponsorIndex * 100}%)`;
    }

    setInterval(moveSponsorSlide, 2500);
}
/* ===== SPONSOR VIDEO → IMAGE AUTO LOOP ===== */

window.addEventListener("DOMContentLoaded", function () {

    document.querySelectorAll(".sponsor-full").forEach(section => {

        const video = section.querySelector(".sponsor-video");
        const track = section.querySelector(".media-track");
        const slides = section.querySelectorAll(".media-slide");

        if (!video || !track || slides.length === 0) return;

        let index = 0;
        let interval = null;

        function goToSlide(i) {
            track.style.transform = `translateX(-${i * 100}%)`;
        }

        function startImageSlider() {

            interval = setInterval(() => {

                index++;

                if (index >= slides.length) {

                    clearInterval(interval);
                    interval = null;

                    index = 0;
                    goToSlide(0);

                    video.currentTime = 0;
                    video.play();
                    return;
                }

                goToSlide(index);

            }, 3000);
        }

        video.addEventListener("ended", function () {

            index = 1;
            goToSlide(index);
            startImageSlider();

        });

    });

});