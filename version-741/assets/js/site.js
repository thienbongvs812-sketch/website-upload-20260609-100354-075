(function () {
  var menuButton = document.querySelector('[data-menu-toggle]');

  if (menuButton) {
    menuButton.addEventListener('click', function () {
      document.body.classList.toggle('menu-open');
    });
  }

  var hero = document.querySelector('[data-hero]');

  if (hero) {
    var slides = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-slide]'));
    var dots = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-dot]'));
    var current = 0;

    function showSlide(index) {
      if (!slides.length) {
        return;
      }

      current = (index + slides.length) % slides.length;

      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle('is-active', slideIndex === current);
      });

      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle('is-active', dotIndex === current);
      });
    }

    dots.forEach(function (dot, dotIndex) {
      dot.addEventListener('click', function () {
        showSlide(dotIndex);
      });
    });

    if (slides.length > 1) {
      window.setInterval(function () {
        showSlide(current + 1);
      }, 5200);
    }
  }

  var filterInput = document.querySelector('[data-page-filter]');
  var yearFilter = document.querySelector('[data-year-filter]');
  var typeFilter = document.querySelector('[data-type-filter]');
  var grid = document.querySelector('[data-card-grid]');
  var emptyNote = document.querySelector('[data-empty-note]');

  function normalize(value) {
    return String(value || '').toLowerCase().trim();
  }

  function applyFilters() {
    if (!grid) {
      return;
    }

    var keyword = normalize(filterInput && filterInput.value);
    var year = normalize(yearFilter && yearFilter.value);
    var type = normalize(typeFilter && typeFilter.value);
    var cards = Array.prototype.slice.call(grid.querySelectorAll('[data-card]'));
    var visibleCount = 0;

    cards.forEach(function (card) {
      var text = normalize(card.getAttribute('data-search'));
      var cardYear = normalize(card.getAttribute('data-year'));
      var cardType = normalize(card.getAttribute('data-type'));
      var matched = true;

      if (keyword && text.indexOf(keyword) === -1) {
        matched = false;
      }

      if (year && cardYear !== year) {
        matched = false;
      }

      if (type && cardType !== type) {
        matched = false;
      }

      card.style.display = matched ? '' : 'none';

      if (matched) {
        visibleCount += 1;
      }
    });

    if (emptyNote) {
      emptyNote.classList.toggle('is-visible', visibleCount === 0);
    }
  }

  [filterInput, yearFilter, typeFilter].forEach(function (control) {
    if (control) {
      control.addEventListener('input', applyFilters);
      control.addEventListener('change', applyFilters);
    }
  });

  function renderSearchPage() {
    var results = document.getElementById('searchResults');
    var summary = document.getElementById('searchSummary');
    var input = document.getElementById('searchInput');

    if (!results || !summary || !input || !window.MOVIE_SEARCH_DATA) {
      return;
    }

    var params = new URLSearchParams(window.location.search);
    var query = params.get('q') || '';
    input.value = query;

    var normalizedQuery = normalize(query);

    if (!normalizedQuery) {
      return;
    }

    var matched = window.MOVIE_SEARCH_DATA.filter(function (movie) {
      var text = normalize([
        movie.title,
        movie.year,
        movie.region,
        movie.type,
        movie.genre,
        movie.category,
        (movie.tags || []).join(' '),
        movie.oneLine
      ].join(' '));

      return text.indexOf(normalizedQuery) !== -1;
    }).slice(0, 120);

    summary.textContent = '找到 ' + matched.length + ' 条匹配结果，最多展示前 120 条。';

    if (!matched.length) {
      results.innerHTML = '<p class="empty-note is-visible">没有找到匹配影片。</p>';
      return;
    }

    results.innerHTML = matched.map(function (movie) {
      var tags = (movie.tags || []).slice(0, 3).map(function (tag) {
        return '<span>' + escapeHtml(tag) + '</span>';
      }).join('');

      return [
        '<article class="movie-card">',
        '  <a class="poster" href="' + escapeAttribute(movie.url) + '">',
        '    <img class="poster-img" src="' + escapeAttribute(movie.cover) + '" alt="' + escapeAttribute(movie.title) + '" loading="lazy" onerror="this.classList.add(\'image-missing\')">',
        '    <span class="poster-badge">' + escapeHtml(movie.year) + '</span>',
        '  </a>',
        '  <div class="card-body">',
        '    <div class="card-meta"><a href="categories/' + escapeAttribute(movie.categorySlug) + '.html">' + escapeHtml(movie.category) + '</a><span>' + escapeHtml(movie.region) + '</span></div>',
        '    <h3><a href="' + escapeAttribute(movie.url) + '">' + escapeHtml(movie.title) + '</a></h3>',
        '    <p>' + escapeHtml(movie.oneLine) + '</p>',
        '    <div class="tag-list">' + tags + '</div>',
        '  </div>',
        '</article>'
      ].join('');
    }).join('');
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function escapeAttribute(value) {
    return escapeHtml(value).replace(/`/g, '&#096;');
  }

  renderSearchPage();
})();
