(() => {
  const menuButton = document.querySelector('[data-menu-toggle]');
  const mobilePanel = document.querySelector('[data-mobile-panel]');

  if (menuButton && mobilePanel) {
    menuButton.addEventListener('click', () => {
      mobilePanel.classList.toggle('open');
    });
  }

  const hero = document.querySelector('[data-hero]');

  if (hero) {
    const slides = Array.from(hero.querySelectorAll('[data-hero-slide]'));
    const dots = Array.from(hero.querySelectorAll('[data-hero-dot]'));
    let index = 0;

    const show = (nextIndex) => {
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach((slide, slideIndex) => {
        slide.classList.toggle('active', slideIndex === index);
      });
      dots.forEach((dot, dotIndex) => {
        dot.classList.toggle('active', dotIndex === index);
      });
    };

    dots.forEach((dot, dotIndex) => {
      dot.addEventListener('click', () => show(dotIndex));
    });

    if (slides.length > 1) {
      window.setInterval(() => show(index + 1), 5200);
    }
  }

  const filterList = document.querySelector('[data-filter-list]');
  const filterButtons = Array.from(document.querySelectorAll('[data-filter-year] button'));

  if (filterList && filterButtons.length) {
    const cards = Array.from(filterList.querySelectorAll('[data-card]'));
    const emptyState = document.querySelector('[data-empty-state]');

    const applyYear = (year) => {
      let visible = 0;
      cards.forEach((card) => {
        const match = year === 'all' || card.dataset.year === year;
        card.classList.toggle('hidden', !match);
        if (match) {
          visible += 1;
        }
      });
      if (emptyState) {
        emptyState.classList.toggle('show', visible === 0);
      }
    };

    filterButtons.forEach((button) => {
      button.addEventListener('click', () => {
        filterButtons.forEach((item) => item.classList.remove('active'));
        button.classList.add('active');
        applyYear(button.dataset.filterYear || 'all');
      });
    });
  }

  const searchResults = document.querySelector('[data-search-results]');
  const searchInput = document.querySelector('[data-search-input]');
  const searchChips = Array.from(document.querySelectorAll('[data-search-chip]'));

  if (searchResults) {
    const cards = Array.from(searchResults.querySelectorAll('[data-card]'));
    const emptyState = document.querySelector('[data-empty-state]');
    const params = new URLSearchParams(window.location.search);
    let query = (params.get('q') || '').trim();
    let chip = 'all';

    if (searchInput) {
      searchInput.value = query;
    }

    const cardText = (card) => [
      card.dataset.title || '',
      card.dataset.genre || '',
      card.dataset.year || '',
      card.dataset.region || '',
      card.dataset.tags || ''
    ].join(' ').toLowerCase();

    const applySearch = () => {
      const keyword = query.toLowerCase();
      let visible = 0;
      cards.forEach((card) => {
        const text = cardText(card);
        const keywordMatch = !keyword || text.includes(keyword);
        const chipMatch = chip === 'all' || text.includes(chip.toLowerCase());
        const match = keywordMatch && chipMatch;
        card.classList.toggle('hidden', !match);
        if (match) {
          visible += 1;
        }
      });
      if (emptyState) {
        emptyState.classList.toggle('show', visible === 0);
      }
    };

    if (searchInput) {
      searchInput.addEventListener('input', () => {
        query = searchInput.value.trim();
        applySearch();
      });
    }

    searchChips.forEach((button) => {
      button.addEventListener('click', () => {
        searchChips.forEach((item) => item.classList.remove('active'));
        button.classList.add('active');
        chip = button.dataset.searchChip || 'all';
        applySearch();
      });
    });

    applySearch();
  }
})();
