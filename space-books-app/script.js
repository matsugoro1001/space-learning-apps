// State
const activeFilters = {
  formats: new Set(),
  periods: new Set(),
  keywords: new Set(),
  chapters: new Set()
};

// DOM Elements
const formatFiltersContainer = document.getElementById('format-filters');
const periodFiltersContainer = document.getElementById('period-filters');
const chapterFiltersContainer = document.getElementById('chapter-filters');
const keywordFiltersContainer = document.getElementById('keyword-filters');
const booksContainer = document.getElementById('books-container');
const resultCountEl = document.getElementById('result-count');
const noResultsEl = document.getElementById('no-results');
const resetBtn = document.getElementById('reset-btn');

// Initialize
function init() {
  extractAndRenderFilters();
  renderBooks(booksData);
  setupReset();
}

function extractAndRenderFilters() {
  const formats = new Set();
  const periods = new Set();
  const keywords = new Set();

  booksData.forEach(book => {
    if (book.format) formats.add(book.format);
    if (book.period) {
      if (Array.isArray(book.period)) {
        book.period.forEach(p => periods.add(p));
      } else {
        periods.add(book.period);
      }
    }
    if (book.keywords) {
      book.keywords.forEach(kw => keywords.add(kw));
    }
  });

  const allChapters = [
    "プロローグ 星空をながめよう",
    "1章 地球の運動と天体の動き",
    "2章 月と金星の見え方",
    "3章 宇宙の広がり"
  ];

  renderFilterChips(Array.from(formats).sort(), formatFiltersContainer, 'formats');
  renderFilterChips(allChapters, chapterFiltersContainer, 'chapters');
  renderFilterChips(Array.from(periods).sort(), periodFiltersContainer, 'periods');
  renderFilterChips(Array.from(keywords).sort(), keywordFiltersContainer, 'keywords');
}

function renderFilterChips(items, container, filterCategory) {
  items.forEach(item => {
    const chip = document.createElement('div');
    chip.className = 'chip';
    chip.textContent = item;
    
    chip.addEventListener('click', () => {
      chip.classList.toggle('active');
      
      if (chip.classList.contains('active')) {
        activeFilters[filterCategory].add(item);
      } else {
        activeFilters[filterCategory].delete(item);
      }
      
      filterAndRenderBooks();
    });
    
    container.appendChild(chip);
  });
}

function filterAndRenderBooks() {
  const filteredBooks = booksData.filter(book => {
    // Check Formats (OR logic within category)
    const formatMatch = activeFilters.formats.size === 0 || activeFilters.formats.has(book.format);
    
    // Check Periods (OR logic within category)
    const periodMatch = activeFilters.periods.size === 0 || 
      (book.period && (Array.isArray(book.period) ? book.period.some(p => activeFilters.periods.has(p)) : activeFilters.periods.has(book.period)));
    
    // Check Keywords (OR logic within category - if user selects "Mars" and "Moon", show books having EITHER)
    let keywordMatch = true;
    if (activeFilters.keywords.size > 0) {
      if (!book.keywords) {
        keywordMatch = false;
      } else {
        keywordMatch = Array.from(activeFilters.keywords).some(kw => book.keywords.includes(kw));
      }
    }
    // Check Chapters (OR logic)
    const chapterMatch = activeFilters.chapters.size === 0 || 
      (book.chapters && (Array.isArray(book.chapters) ? book.chapters.some(c => activeFilters.chapters.has(c)) : activeFilters.chapters.has(book.chapters)));

    return formatMatch && periodMatch && keywordMatch && chapterMatch;
  });

  renderBooks(filteredBooks);
}

function renderBooks(books) {
  booksContainer.innerHTML = '';
  resultCountEl.textContent = books.length;

  if (books.length === 0) {
    booksContainer.classList.add('hidden');
    noResultsEl.classList.remove('hidden');
    return;
  }

  booksContainer.classList.remove('hidden');
  noResultsEl.classList.add('hidden');

  books.forEach(book => {
    const card = document.createElement('div');
    card.className = 'book-card';
    
    const keywordsHtml = book.keywords 
      ? book.keywords.map(kw => `<span class="book-keyword">${kw}</span>`).join('')
      : '';

    // Show format and period together in the badge if period exists
    const periodStr = Array.isArray(book.period) ? book.period.join('・') : book.period;
    const badgeText = periodStr ? `${book.format} | ${periodStr}` : book.format;

    card.innerHTML = `
      <div class="book-image-container">
        <img src="images/${book.image || 'books/placeholder.jpg'}" alt="${book.title}" class="book-image" onerror="this.style.display='none'">
      </div>
      <div class="book-content">
        <span class="book-format">${badgeText}</span>
        <h3 class="book-title">${book.title}</h3>
        <p class="book-description">${book.description}</p>
        <div class="book-keywords">
          ${keywordsHtml}
        </div>
      </div>
    `;
    
    booksContainer.appendChild(card);
  });
}

function setupReset() {
  resetBtn.addEventListener('click', () => {
    activeFilters.formats.clear();
    activeFilters.periods.clear();
    activeFilters.keywords.clear();
    activeFilters.chapters.clear();
    
    document.querySelectorAll('.chip.active').forEach(chip => {
      chip.classList.remove('active');
    });
    
    renderBooks(booksData);
  });
}

// Start app
document.addEventListener('DOMContentLoaded', init);
