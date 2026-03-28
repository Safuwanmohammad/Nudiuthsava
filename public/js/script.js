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

    // Close menu when any nav link is clicked
    const navLinks = document.querySelectorAll('.nav-links a');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (menu.classList.contains('active')) {
                menu.classList.remove('active');
            }
        });
    });
}

/* ===== SMOOTH SCROLL ===== */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
});

/* ===== TOGGLE CONTACT FORM VISIBILITY ===== */
const showContactFormBtn = document.getElementById('showContactFormBtn');
const contactFormContainer = document.getElementById('contactFormContainer');

if (showContactFormBtn && contactFormContainer) {
    showContactFormBtn.addEventListener('click', () => {
        if (contactFormContainer.style.display === 'none' || contactFormContainer.style.display === '') {
            contactFormContainer.style.display = 'block';
        } else {
            contactFormContainer.style.display = 'none';
        }
    });
}

/* ===== EVENT BOX ANIMATION ===== */
const boxes = document.querySelectorAll('.event-box');
window.addEventListener('scroll', () => {
    const trigger = window.innerHeight * 0.85;
    boxes.forEach(box => {
        const top = box.getBoundingClientRect().top;
        if (top < trigger) box.classList.add('show');
    });
});

/* ===== CONTACT FORM ===== */
const contactForm = document.querySelector(".contact-form");
const contactSuccess = document.getElementById("contactSuccess");
if (contactForm) {
    contactForm.addEventListener("submit", async function (e) {
        e.preventDefault();
        const formData = new FormData(contactForm);
        const data = Object.fromEntries(formData.entries());
        try {
            const res = await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (res.ok) {
                contactSuccess.style.display = "block";
                contactForm.reset();
                setTimeout(() => contactSuccess.style.display = "none", 3000);
            } else {
                alert('Failed to send message');
            }
        } catch (err) {
            console.error(err);
            alert('Error sending message');
        }
    });
}

/* ===== HOME SLIDER ===== */
let homeSliderInterval = null;

function startHomeSlider() {
    if (homeSliderInterval) clearInterval(homeSliderInterval);
    const track = document.querySelector(".slide-track");
    if (!track) return;
    const slides = () => track.querySelectorAll(".slide");
    let index = 0;
    homeSliderInterval = setInterval(() => {
        const currentSlides = slides();
        if (currentSlides.length === 0) return;
        index++;
        if (index >= currentSlides.length) index = 0;
        track.style.transform = `translateX(-${index * 100}%)`;
    }, 2500);
}
startHomeSlider();

/* ===== SPONSOR VIDEO SLIDERS ===== */
function initDynamicSponsorSliders() {
    document.querySelectorAll('.sponsor-full.dynamic-sponsor').forEach(section => {
        const video = section.querySelector('.sponsor-video');
        const track = section.querySelector('.media-track');
        const slides = section.querySelectorAll('.media-slide');

        if (!video || !track) return;

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

        video.pause();
        video.currentTime = 0;

        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    video.currentTime = 0;
                    video.play();
                } else {
                    video.pause();
                    video.currentTime = 0;
                    if (interval) {
                        clearInterval(interval);
                        interval = null;
                    }
                    goToSlide(0);
                }
            });
        }, { threshold: 0.6 });

        observer.observe(section);

        video.addEventListener('ended', () => {
            index = 1;
            goToSlide(index);
            startImageSlider();
        });
    });
}

(function initStaticSponsors() {
    document.querySelectorAll('.sponsor-full.static-sponsor').forEach(section => {
        const video = section.querySelector('.sponsor-video');
        const track = section.querySelector('.media-track');
        const slides = section.querySelectorAll('.media-slide');
        if (!track || slides.length === 0) return;

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
                    if (video) {
                        video.currentTime = 0;
                        video.play();
                    }
                    return;
                }
                goToSlide(index);
            }, 3000);
        }

        if (video) {
            video.addEventListener('ended', () => {
                index = 1;
                goToSlide(index);
                startImageSlider();
            });
        }
    });
})();

/* ========== DYNAMIC DATA LOADING ========== */
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM fully loaded – starting data fetch');
    loadHomeImages();
    loadEvents();
    loadSponsors();
    loadGallery();
});

async function loadHomeImages() {
    try {
        const res = await fetch('/api/home-images');
        if (!res.ok) throw new Error('Failed to fetch home images');
        const images = await res.json();
        const track = document.getElementById('homeSliderTrack');
        if (!track) return;
        track.innerHTML = '';
        images.forEach(img => {
            const slide = document.createElement('div');
            slide.className = 'slide';
            slide.innerHTML = `<img src="${img.imageUrl}" alt="Home Slider">`;
            track.appendChild(slide);
        });
        startHomeSlider();
    } catch (err) {
        console.error('Error loading home images:', err);
    }
}

// ===== MODIFIED FUNCTION: now links to unified register.html with event name =====
async function loadEvents() {
    console.log('loadEvents() started');
    try {
        const res = await fetch('/api/events');
        console.log('Fetch response status:', res.status);
        if (!res.ok) throw new Error('Failed to fetch events');
        const events = await res.json();
        console.log('Events received:', events);

        const container = document.getElementById('dynamicEvents');
        if (!container) {
            console.error('❌ #dynamicEvents container not found!');
            return;
        }

        container.innerHTML = ''; // clear any previous

        if (events.length === 0) {
            console.log('No dynamic events to display');
            container.innerHTML = '<p style="text-align:center;">No additional events at this time.</p>';
            return;
        }

        events.forEach(ev => {
            console.log('Creating card for:', ev.title);
            const box = document.createElement('div');
            box.className = 'event-box dynamic-event';
            const imgUrl = ev.imageUrl || '/images/placeholder.png';
            box.innerHTML = `
                <img src="${imgUrl}" alt="${ev.title}" onerror="this.src='/images/placeholder.png'">
                <h3>${ev.title}</h3>
                ${ev.hasForm ? `<a href="/register.html?event=${encodeURIComponent(ev.title)}" class="btn">Register Now</a>` : ''}
            `;
            container.appendChild(box);
        });

        // Trigger scroll animation for new boxes
        window.dispatchEvent(new Event('scroll'));
        console.log('Event cards appended and scroll event dispatched');
    } catch (err) {
        console.error('❌ Error in loadEvents:', err);
    }
}

async function loadSponsors() {
    try {
        const res = await fetch('/api/sponsors');
        if (!res.ok) throw new Error('Failed to fetch sponsors');
        const sponsors = await res.json();
        const container = document.getElementById('dynamicSponsors');
        if (!container) return;
        container.innerHTML = '';
        sponsors.forEach(sp => {
            let slides = '';
            if (sp.videoUrl) {
                slides += `
                    <div class="media-slide">
                        <video class="sponsor-video" controls playsinline>
                            <source src="${sp.videoUrl}" type="video/mp4">
                        </video>
                    </div>
                `;
            }
            if (sp.coverUrl) {
                slides += `
                    <div class="media-slide">
                        <img src="${sp.coverUrl}" alt="${sp.title} cover">
                    </div>
                `;
            }

            const sponsorDiv = document.createElement('div');
            sponsorDiv.className = 'sponsor-full dynamic-sponsor';
            sponsorDiv.innerHTML = `
                <div class="sponsor-logo">
                    <img src="${sp.logoUrl || '/images/placeholder-logo.png'}" alt="${sp.title}">
                    <h2>${sp.title}</h2>
                </div>
                <div class="media-slider">
                    <div class="media-track">
                        ${slides}
                    </div>
                </div>
            `;
            container.appendChild(sponsorDiv);
        });

        initDynamicSponsorSliders();
    } catch (err) {
        console.error('Error loading sponsors:', err);
    }
}

async function loadGallery() {
    try {
        const res = await fetch('/api/gallery');
        if (!res.ok) throw new Error('Failed to fetch gallery');
        const items = await res.json();
        const grid = document.getElementById('galleryGrid');
        if (!grid) return;
        grid.innerHTML = items.map(item => `
            <div class="gallery-item">
                <div class="gallery-image">
                    <img src="${item.imageUrl}" alt="${item.title}">
                </div>
                <h3 class="gallery-title">${item.title}</h3>
                <p class="gallery-description">${item.description || 'Click to view more'}</p>
            </div>
        `).join('');
    } catch (err) {
        console.error('Error loading gallery:', err);
        document.getElementById('galleryGrid').innerHTML = '<p style="color:red;">Error loading gallery.</p>';
    }
}