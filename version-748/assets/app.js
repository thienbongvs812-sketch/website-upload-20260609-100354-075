(function() {
  function ready(callback) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', callback);
    } else {
      callback();
    }
  }

  function normalize(value) {
    return String(value || '').trim().toLowerCase();
  }

  function setupMenu() {
    var button = document.querySelector('.nav-toggle');
    var panel = document.querySelector('.mobile-panel');
    if (!button || !panel) {
      return;
    }
    button.addEventListener('click', function() {
      var isOpen = panel.classList.toggle('is-open');
      button.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
  }

  function setupHero() {
    var root = document.querySelector('[data-hero]');
    if (!root) {
      return;
    }
    var slides = Array.prototype.slice.call(root.querySelectorAll('[data-hero-slide]'));
    var dots = Array.prototype.slice.call(root.querySelectorAll('[data-hero-dot]'));
    var prev = root.querySelector('[data-hero-prev]');
    var next = root.querySelector('[data-hero-next]');
    if (!slides.length) {
      return;
    }
    var index = 0;
    var timer = null;

    function setSlide(nextIndex) {
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach(function(slide, slideIndex) {
        slide.classList.toggle('is-active', slideIndex === index);
      });
      dots.forEach(function(dot, dotIndex) {
        dot.classList.toggle('is-active', dotIndex === index);
      });
    }

    function start() {
      stop();
      timer = window.setInterval(function() {
        setSlide(index + 1);
      }, 5200);
    }

    function stop() {
      if (timer) {
        window.clearInterval(timer);
        timer = null;
      }
    }

    dots.forEach(function(dot, dotIndex) {
      dot.addEventListener('click', function() {
        setSlide(dotIndex);
        start();
      });
    });

    if (prev) {
      prev.addEventListener('click', function() {
        setSlide(index - 1);
        start();
      });
    }

    if (next) {
      next.addEventListener('click', function() {
        setSlide(index + 1);
        start();
      });
    }

    root.addEventListener('mouseenter', stop);
    root.addEventListener('mouseleave', start);
    setSlide(0);
    start();
  }

  function filterCards(list, value) {
    var keyword = normalize(value);
    var cards = Array.prototype.slice.call(list.querySelectorAll('.movie-card'));
    cards.forEach(function(card) {
      var text = normalize(card.getAttribute('data-search'));
      var matched = !keyword || text.indexOf(keyword) !== -1;
      card.classList.toggle('is-hidden', !matched);
    });
  }

  function setupFilters() {
    var lists = Array.prototype.slice.call(document.querySelectorAll('[data-filter-list]'));
    if (!lists.length) {
      return;
    }
    lists.forEach(function(list) {
      var section = list.closest('.section-block') || document;
      var input = section.querySelector('[data-filter-input]');
      var chips = Array.prototype.slice.call(section.querySelectorAll('[data-filter-chip]'));
      if (input) {
        input.addEventListener('input', function() {
          filterCards(list, input.value);
        });
      }
      chips.forEach(function(chip) {
        chip.addEventListener('click', function() {
          var value = chip.getAttribute('data-filter-chip') || '';
          if (input) {
            input.value = value;
          }
          filterCards(list, value);
        });
      });
    });
  }

  function setupSearchPage() {
    var list = document.querySelector('[data-search-page-list]');
    var input = document.querySelector('[data-search-page-input]');
    if (!list || !input) {
      return;
    }
    var params = new URLSearchParams(window.location.search);
    var query = params.get('q') || '';
    input.value = query;
    filterCards(list, query);
    input.addEventListener('input', function() {
      filterCards(list, input.value);
    });
  }

  ready(function() {
    setupMenu();
    setupHero();
    setupFilters();
    setupSearchPage();
  });
})();

function initMoviePlayer(videoId, buttonId, streamUrl) {
  var video = document.getElementById(videoId);
  var button = document.getElementById(buttonId);
  if (!video || !button || !streamUrl) {
    return;
  }
  var initialized = false;
  var hlsInstance = null;

  function hideButton() {
    button.classList.add('is-hidden');
  }

  function attach() {
    if (initialized) {
      return Promise.resolve();
    }
    initialized = true;
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = streamUrl;
      return Promise.resolve();
    }
    if (window.Hls && window.Hls.isSupported()) {
      hlsInstance = new window.Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90
      });
      hlsInstance.loadSource(streamUrl);
      hlsInstance.attachMedia(video);
      return new Promise(function(resolve) {
        hlsInstance.on(window.Hls.Events.MANIFEST_PARSED, function() {
          resolve();
        });
        window.setTimeout(resolve, 1600);
      });
    }
    video.src = streamUrl;
    return Promise.resolve();
  }

  function play() {
    hideButton();
    attach().then(function() {
      var attempt = video.play();
      if (attempt && typeof attempt.catch === 'function') {
        attempt.catch(function() {
          button.classList.remove('is-hidden');
        });
      }
    });
  }

  button.addEventListener('click', play);
  video.addEventListener('click', function() {
    if (video.paused) {
      play();
    }
  });
  video.addEventListener('play', hideButton);
  video.addEventListener('pause', function() {
    if (!video.ended) {
      button.classList.remove('is-hidden');
    }
  });
  video.addEventListener('ended', function() {
    button.classList.remove('is-hidden');
  });
  window.addEventListener('beforeunload', function() {
    if (hlsInstance) {
      hlsInstance.destroy();
    }
  });
}
