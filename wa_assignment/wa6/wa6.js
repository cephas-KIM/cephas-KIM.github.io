const navToggle = document.querySelector('.nav-toggle');
const navMenu = document.querySelector('.nav-menu');

// ARIA //
if (!navMenu.id) navMenu.id = 'main-menu';
navToggle.setAttribute('aria-controls', navMenu.id);
navToggle.setAttribute('aria-expanded', 'false');

// toggle functionality//
let isOpen = false;

navToggle.addEventListener('click', () => {
  if (isOpen == false) {
    navMenu.style.display = 'block';          // show menu
    navToggle.setAttribute('aria-expanded', 'true');
    isOpen = true;
  } else {
    navMenu.style.display = '';           // hide menu
    navToggle.setAttribute('aria-expanded', 'false');
    isOpen = false;
  }
});

// enhanced accessibility //
navToggle.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    navToggle.click();
  }
});

