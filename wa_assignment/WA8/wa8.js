// Mobile nav
const navToggle = document.querySelector('.nav-toggle');
const navMenu = document.querySelector('.nav-menu');

if (navToggle && navMenu) {
  navToggle.addEventListener('click', function () {
    const isOpen = navMenu.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  });
}

// Elements
const searchInput = document.getElementById('resource-search');
const cardsWrap = document.getElementById('cards');
const cards = cardsWrap ? cardsWrap.querySelectorAll('.card') : [];

const gridBtn = document.getElementById('grid-btn');
const listBtn = document.getElementById('list-btn');
const themeBtn = document.getElementById('theme-btn');
const resetBtn = document.getElementById('reset-btn');

// Restore saved prefs
(function restorePrefs() {
  const view = localStorage.getItem('vma:view') || 'grid';
  const theme = localStorage.getItem('vma:theme') || 'light';
  const query = localStorage.getItem('vma:query') || '';

  if (view === 'list') cardsWrap?.classList.add('list');
  if (theme === 'dark') document.body.classList.add('dark');
  if (searchInput) {
    searchInput.value = query;
    filterCards(query);
  }
})();

// Filter
function filterCards(q) {
  const text = (q || '').toLowerCase();
  cards.forEach(function (card) {
    const content = card.textContent.toLowerCase();
    card.style.display = content.includes(text) ? '' : 'none';
  });
}

if (searchInput) {
  searchInput.addEventListener('input', function () {
    const q = searchInput.value;
    localStorage.setItem('vma:query', q);
    filterCards(q);
  });
}

// View toggle
function setView(mode) {
  if (!cardsWrap) return;
  if (mode === 'list') {
    cardsWrap.classList.add('list');
  } else {
    cardsWrap.classList.remove('list');
    mode = 'grid';
  }
  localStorage.setItem('vma:view', mode);
}

gridBtn?.addEventListener('click', function () { setView('grid'); });
listBtn?.addEventListener('click', function () { setView('list'); });

// Theme toggle
themeBtn?.addEventListener('click', function () {
  document.body.classList.toggle('dark');
  const theme = document.body.classList.contains('dark') ? 'dark' : 'light';
  localStorage.setItem('vma:theme', theme);
});

// Reset all prefs
resetBtn?.addEventListener('click', function () {
  localStorage.removeItem('vma:view');
  localStorage.removeItem('vma:theme');
  localStorage.removeItem('vma:query');

  // Defaults
  setView('grid');
  document.body.classList.remove('dark');
  if (searchInput) {
    searchInput.value = '';
    filterCards('');
  }
});