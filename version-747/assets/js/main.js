(function () {
  'use strict';

  function ready(callback) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', callback);
    } else {
      callback();
    }
  }

  function escapeHTML(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function initMobileNavigation() {
    var toggle = document.querySelector('[data-mobile-toggle]');
    var nav = document.querySelector('[data-mobile-nav]');

    if (!toggle || !nav) {
      return;
    }

    toggle.addEventListener('click', function () {
      nav.classList.toggle('is-open');
      toggle.textContent = nav.classList.contains('is-open') ? '×' : '☰';
    });
  }

  function initHeroCarousel() {
    var carousel = document.querySelector('[data-hero-carousel]');

    if (!carousel) {
      return;
    }

    var slides = Array.prototype.slice.call(carousel.querySelectorAll('[data-hero-slide]'));
    var dots = Array.prototype.slice.call(carousel.querySelectorAll('[data-hero-dot]'));
    var previous = carousel.querySelector('[data-hero-prev]');
    var next = carousel.querySelector('[data-hero-next]');
    var current = 0;
    var timer = null;

    function showSlide(index) {
      current = (index + slides.length) % slides.length;

      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle('is-active', slideIndex === current);
      });

      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle('is-active', dotIndex === current);
      });
    }

    function start() {
      stop();
      timer = window.setInterval(function () {
        showSlide(current + 1);
      }, 5000);
    }

    function stop() {
      if (timer) {
        window.clearInterval(timer);
        timer = null;
      }
    }

    if (previous) {
      previous.addEventListener('click', function () {
        showSlide(current - 1);
        start();
      });
    }

    if (next) {
      next.addEventListener('click', function () {
        showSlide(current + 1);
        start();
      });
    }

    dots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        var dotIndex = parseInt(dot.getAttribute('data-hero-dot'), 10);
        showSlide(dotIndex);
        start();
      });
    });

    carousel.addEventListener('mouseenter', stop);
    carousel.addEventListener('mouseleave', start);
    start();
  }

  function initLocalFilters() {
    var input = document.querySelector('[data-filter-input]');
    var list = document.querySelector('[data-filter-list]');
    var counter = document.querySelector('[data-filter-count]');

    if (!input || !list) {
      return;
    }

    var cards = Array.prototype.slice.call(list.querySelectorAll('.movie-card'));

    input.addEventListener('input', function () {
      var keyword = input.value.trim().toLowerCase();
      var visibleCount = 0;

      cards.forEach(function (card) {
        var haystack = [
          card.getAttribute('data-title'),
          card.getAttribute('data-year'),
          card.getAttribute('data-region'),
          card.getAttribute('data-genre'),
          card.textContent
        ].join(' ').toLowerCase();
        var visible = !keyword || haystack.indexOf(keyword) !== -1;

        card.hidden = !visible;
        if (visible) {
          visibleCount += 1;
        }
      });

      if (counter) {
        counter.textContent = visibleCount + ' 部作品';
      }
    });
  }

  function buildSearchCard(movie) {
    var tags = (movie.tags || []).slice(0, 3).map(function (tag) {
      return '<span>' + escapeHTML(tag) + '</span>';
    }).join('');

    return '' +
      '<article class="movie-card movie-card-default">' +
        '<a class="movie-poster" href="' + escapeHTML(movie.url) + '" aria-label="观看 ' + escapeHTML(movie.title) + '">' +
          '<img src="' + escapeHTML(movie.cover) + '" alt="' + escapeHTML(movie.title) + '" loading="lazy">' +
          '<span class="play-badge">▶</span>' +
          '<span class="duration-badge">' + escapeHTML(movie.duration) + '</span>' +
        '</a>' +
        '<div class="movie-card-body">' +
          '<a class="movie-title" href="' + escapeHTML(movie.url) + '">' + escapeHTML(movie.title) + '</a>' +
          '<p class="movie-desc">' + escapeHTML(movie.description) + '</p>' +
          '<div class="movie-tags">' + tags + '</div>' +
          '<div class="movie-meta">' +
            '<span>★ ' + escapeHTML(movie.rating) + '</span>' +
            '<span>' + escapeHTML(movie.region) + '</span>' +
            '<span>' + escapeHTML(movie.year) + '</span>' +
          '</div>' +
        '</div>' +
      '</article>';
  }

  function initSearchPage() {
    var page = document.querySelector('[data-search-page]');

    if (!page || !window.MOVIE_SEARCH_INDEX) {
      return;
    }

    var form = page.querySelector('[data-search-form]');
    var keywordInput = page.querySelector('#search-keyword');
    var categorySelect = page.querySelector('#search-category');
    var yearSelect = page.querySelector('#search-year');
    var regionSelect = page.querySelector('#search-region');
    var summary = page.querySelector('[data-search-summary]');
    var results = page.querySelector('[data-search-results]');
    var loadMore = page.querySelector('[data-load-more]');
    var visibleLimit = 60;
    var currentMatches = [];

    function getQueryParams() {
      return new URLSearchParams(window.location.search);
    }

    function applyParams() {
      var params = getQueryParams();
      keywordInput.value = params.get('q') || '';
      categorySelect.value = params.get('category') || '';
      yearSelect.value = params.get('year') || '';
      regionSelect.value = params.get('region') || '';
    }

    function normalize(value) {
      return String(value || '').trim().toLowerCase();
    }

    function filterMovies() {
      var keyword = normalize(keywordInput.value);
      var category = normalize(categorySelect.value);
      var year = normalize(yearSelect.value);
      var region = normalize(regionSelect.value);

      currentMatches = window.MOVIE_SEARCH_INDEX.filter(function (movie) {
        var haystack = [
          movie.title,
          movie.description,
          movie.summary,
          movie.category,
          movie.region,
          movie.year,
          movie.genre,
          (movie.tags || []).join(' ')
        ].join(' ').toLowerCase();

        var keywordMatch = !keyword || haystack.indexOf(keyword) !== -1;
        var categoryMatch = !category || normalize(movie.category) === category;
        var yearMatch = !year || normalize(movie.year) === year;
        var regionMatch = !region || normalize(movie.region) === region;

        return keywordMatch && categoryMatch && yearMatch && regionMatch;
      });

      visibleLimit = 60;
      renderResults();
      updateAddress();
    }

    function renderResults() {
      var visibleMovies = currentMatches.slice(0, visibleLimit);
      results.innerHTML = visibleMovies.map(buildSearchCard).join('');

      if (summary) {
        summary.textContent = '共筛选出 ' + currentMatches.length + ' 部影片，当前显示 ' + visibleMovies.length + ' 部。';
      }

      if (loadMore) {
        loadMore.hidden = currentMatches.length <= visibleLimit;
      }
    }

    function updateAddress() {
      var params = new URLSearchParams();

      if (keywordInput.value.trim()) {
        params.set('q', keywordInput.value.trim());
      }
      if (categorySelect.value) {
        params.set('category', categorySelect.value);
      }
      if (yearSelect.value) {
        params.set('year', yearSelect.value);
      }
      if (regionSelect.value) {
        params.set('region', regionSelect.value);
      }

      var nextUrl = window.location.pathname + (params.toString() ? '?' + params.toString() : '');
      window.history.replaceState({}, '', nextUrl);
    }

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      filterMovies();
    });

    [keywordInput, categorySelect, yearSelect, regionSelect].forEach(function (control) {
      control.addEventListener('input', filterMovies);
      control.addEventListener('change', filterMovies);
    });

    if (loadMore) {
      loadMore.addEventListener('click', function () {
        visibleLimit += 60;
        renderResults();
      });
    }

    applyParams();
    filterMovies();
  }

  function initPlayers() {
    var playerCards = Array.prototype.slice.call(document.querySelectorAll('[data-player-card]'));

    playerCards.forEach(function (card) {
      var video = card.querySelector('video');
      var trigger = card.querySelector('[data-play-video]');
      var status = card.querySelector('[data-player-status]');
      var source = card.getAttribute('data-video-url');
      var initialized = false;
      var hlsInstance = null;

      if (!video || !trigger || !source) {
        return;
      }

      function setStatus(message) {
        if (status) {
          status.textContent = message;
        }
      }

      function playVideo() {
        var playPromise = video.play();

        if (playPromise && typeof playPromise.catch === 'function') {
          playPromise.catch(function () {
            setStatus('浏览器阻止了自动播放，请再次点击播放器播放。');
          });
        }
      }

      function initialize() {
        if (initialized) {
          playVideo();
          return;
        }

        initialized = true;
        trigger.classList.add('is-hidden');
        setStatus('正在载入视频源...');

        if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = source;
          video.addEventListener('loadedmetadata', playVideo, { once: true });
          setStatus('视频源已载入，正在准备播放。');
          return;
        }

        if (window.Hls && window.Hls.isSupported()) {
          hlsInstance = new window.Hls({
            enableWorker: true,
            lowLatencyMode: true,
            backBufferLength: 90
          });
          hlsInstance.loadSource(source);
          hlsInstance.attachMedia(video);
          hlsInstance.on(window.Hls.Events.MANIFEST_PARSED, function () {
            setStatus('播放源加载完成。');
            playVideo();
          });
          hlsInstance.on(window.Hls.Events.ERROR, function (event, data) {
            if (data && data.fatal) {
              setStatus('播放源加载失败，请刷新页面或稍后再试。');
              if (hlsInstance) {
                hlsInstance.destroy();
              }
            }
          });
          return;
        }

        video.src = source;
        setStatus('正在尝试直接加载播放源。');
        playVideo();
      }

      trigger.addEventListener('click', initialize);
      video.addEventListener('click', function () {
        if (!initialized) {
          initialize();
        }
      });
    });
  }

  ready(function () {
    initMobileNavigation();
    initHeroCarousel();
    initLocalFilters();
    initSearchPage();
    initPlayers();
  });
})();
