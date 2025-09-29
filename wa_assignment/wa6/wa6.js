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
    navMenu.style.display = '';               // hide menu (back to CSS default)
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

/*
Feature 1: Search filter
* Get the search input (#resource-search) and all resource cards (.quick-link).
* When the user types, compare the input to each card's text.
* If it matches, show the card. If not, hide it.

Feature 2: View toggle (Grid/List)
* Get the view buttons (inside .view-toggle) and the grid (.quick-links__grid).
* If user picks "List", add class .is-list to the grid. If "Grid", remove it.

Feature 3: '/' keyboard shortcut
* If the user presses '/', focus the search box (so they can type right away).
*/

// Feature 1: search filter
const searchInput = document.querySelector('#resource-search');
const grid = document.querySelector('.quick-links__grid');
const cards = grid ? grid.querySelectorAll('.quick-link') : null;

if (searchInput && grid && cards) {
  searchInput.addEventListener('input', () => {
    const q = searchInput.value.toLowerCase().trim();
    cards.forEach(card => {
      const text = card.textContent.toLowerCase();
      card.style.display = (!q || text.includes(q)) ? '' : 'none';
    });
  });
}

// Feature 2: grid/list view toggle
const viewToggle = document.querySelector('.view-toggle');
if (viewToggle && grid) {
  viewToggle.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-view]');
    if (!btn) return;
    const isList = btn.dataset.view === 'list';
    grid.classList.toggle('is-list', isList);
  });
}

// Feature 3: '/' keyboard shortcut
document.addEventListener('keydown', (e) => {
  if (e.key === '/' && searchInput) {
    const active = document.activeElement;
    const typing = active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable);
    if (!typing) {
      e.preventDefault();
      searchInput.focus();
    }
  }
});