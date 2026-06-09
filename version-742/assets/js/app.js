(function () {
  function qs(selector, root) {
    return (root || document).querySelector(selector);
  }

  function qsa(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  var menuButton = qs('[data-menu-toggle]');
  var mobilePanel = qs('[data-mobile-panel]');

  if (menuButton && mobilePanel) {
    menuButton.addEventListener('click', function () {
      var opened = mobilePanel.classList.toggle('is-open');
      menuButton.setAttribute('aria-expanded', opened ? 'true' : 'false');
    });
  }

  var hero = qs('[data-hero]');

  if (hero) {
    var slides = qsa('[data-hero-slide]', hero);
    var dots = qsa('[data-hero-dot]', hero);
    var index = 0;

    function showSlide(next) {
      if (!slides.length) {
        return;
      }
      index = (next + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle('is-active', slideIndex === index);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle('is-active', dotIndex === index);
      });
    }

    dots.forEach(function (dot, dotIndex) {
      dot.addEventListener('click', function () {
        showSlide(dotIndex);
      });
    });

    if (slides.length > 1) {
      setInterval(function () {
        showSlide(index + 1);
      }, 5200);
    }
  }

  var filterForm = qs('[data-filter-form]');
  var filterGrid = qs('[data-filter-grid]');
  var emptyState = qs('[data-filter-empty]');

  if (filterForm && filterGrid) {
    var params = new URLSearchParams(window.location.search);
    var queryInput = qs('[name="q"]', filterForm);
    var yearSelect = qs('[name="year"]', filterForm);
    var regionSelect = qs('[name="region"]', filterForm);
    var typeSelect = qs('[name="type"]', filterForm);

    if (queryInput && params.get('q')) {
      queryInput.value = params.get('q');
    }

    function normalize(value) {
      return String(value || '').trim().toLowerCase();
    }

    function runFilter() {
      var query = normalize(queryInput && queryInput.value);
      var year = normalize(yearSelect && yearSelect.value);
      var region = normalize(regionSelect && regionSelect.value);
      var type = normalize(typeSelect && typeSelect.value);
      var shown = 0;

      qsa('[data-card]', filterGrid).forEach(function (card) {
        var search = normalize(card.getAttribute('data-search'));
        var cardYear = normalize(card.getAttribute('data-year'));
        var cardRegion = normalize(card.getAttribute('data-region'));
        var cardType = normalize(card.getAttribute('data-type'));
        var matched = true;

        if (query && search.indexOf(query) === -1) {
          matched = false;
        }
        if (year && cardYear !== year) {
          matched = false;
        }
        if (region && cardRegion !== region) {
          matched = false;
        }
        if (type && cardType !== type) {
          matched = false;
        }

        card.classList.toggle('is-hidden', !matched);
        if (matched) {
          shown += 1;
        }
      });

      if (emptyState) {
        emptyState.classList.toggle('is-visible', shown === 0);
      }
    }

    filterForm.addEventListener('submit', function (event) {
      event.preventDefault();
      runFilter();
    });

    qsa('input, select', filterForm).forEach(function (control) {
      control.addEventListener('input', runFilter);
      control.addEventListener('change', runFilter);
    });

    runFilter();
  }
})();
