(function () {
  function onReady(callback) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback);
    } else {
      callback();
    }
  }

  function setupNavigation() {
    var toggle = document.querySelector(".nav-toggle");
    var links = document.querySelector(".nav-links");
    if (!toggle || !links) {
      return;
    }
    toggle.addEventListener("click", function () {
      var isOpen = links.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });
  }

  function setupHeroSlider() {
    var slider = document.querySelector(".hero-slider");
    if (!slider) {
      return;
    }
    var slides = Array.prototype.slice.call(slider.querySelectorAll(".hero-slide"));
    var dots = Array.prototype.slice.call(slider.querySelectorAll(".hero-dot"));
    var prev = slider.querySelector(".hero-prev");
    var next = slider.querySelector(".hero-next");
    var index = 0;
    var timer = null;

    function show(nextIndex) {
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle("is-active", slideIndex === index);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle("is-active", dotIndex === index);
      });
    }

    function start() {
      stop();
      timer = window.setInterval(function () {
        show(index + 1);
      }, 5000);
    }

    function stop() {
      if (timer) {
        window.clearInterval(timer);
      }
    }

    if (prev) {
      prev.addEventListener("click", function () {
        show(index - 1);
        start();
      });
    }
    if (next) {
      next.addEventListener("click", function () {
        show(index + 1);
        start();
      });
    }
    dots.forEach(function (dot, dotIndex) {
      dot.addEventListener("click", function () {
        show(dotIndex);
        start();
      });
    });
    slider.addEventListener("mouseenter", stop);
    slider.addEventListener("mouseleave", start);
    show(0);
    start();
  }

  function setupFilters() {
    var areas = Array.prototype.slice.call(document.querySelectorAll("[data-filter-area]"));
    areas.forEach(function (area) {
      var search = area.querySelector("[data-filter-search]");
      var type = area.querySelector("[data-filter-type]");
      var year = area.querySelector("[data-filter-year]");
      var category = area.querySelector("[data-filter-category]");
      var cards = Array.prototype.slice.call(area.querySelectorAll(".movie-card, .rank-card"));

      function normalize(value) {
        return String(value || "").trim().toLowerCase();
      }

      function filter() {
        var query = normalize(search ? search.value : "");
        var selectedType = normalize(type ? type.value : "");
        var selectedYear = normalize(year ? year.value : "");
        var selectedCategory = normalize(category ? category.value : "");
        cards.forEach(function (card) {
          var blob = normalize([
            card.getAttribute("data-title"),
            card.getAttribute("data-tags"),
            card.getAttribute("data-type"),
            card.getAttribute("data-year"),
            card.getAttribute("data-region"),
            card.getAttribute("data-category")
          ].join(" "));
          var ok = true;
          if (query && blob.indexOf(query) === -1) {
            ok = false;
          }
          if (selectedType && normalize(card.getAttribute("data-type")) !== selectedType) {
            ok = false;
          }
          if (selectedYear && normalize(card.getAttribute("data-year")) !== selectedYear) {
            ok = false;
          }
          if (selectedCategory && normalize(card.getAttribute("data-category")) !== selectedCategory) {
            ok = false;
          }
          card.hidden = !ok;
        });
      }

      [search, type, year, category].forEach(function (control) {
        if (!control) {
          return;
        }
        control.addEventListener("input", filter);
        control.addEventListener("change", filter);
      });

      if (search) {
        var params = new URLSearchParams(window.location.search);
        var q = params.get("q");
        if (q) {
          search.value = q;
        }
      }
      filter();
    });
  }

  window.initVideoPlayer = function (options) {
    var video = document.getElementById("video-player");
    var cover = document.getElementById("player-cover");
    var status = document.getElementById("player-status");
    if (!video || !options || !options.src) {
      return;
    }

    var streamUrl = options.src;
    var hlsInstance = null;

    if (options.poster) {
      video.setAttribute("poster", options.poster);
    }

    function showStatus(message) {
      if (status) {
        status.textContent = message || "";
      }
    }

    function attachStream() {
      if (window.Hls && window.Hls.isSupported()) {
        hlsInstance = new window.Hls({
          enableWorker: true,
          lowLatencyMode: true
        });
        hlsInstance.loadSource(streamUrl);
        hlsInstance.attachMedia(video);
        hlsInstance.on(window.Hls.Events.MANIFEST_PARSED, function () {
          showStatus("");
        });
        hlsInstance.on(window.Hls.Events.ERROR, function (eventName, data) {
          if (data && data.fatal) {
            showStatus("播放加载遇到问题，请稍后重试。");
          }
        });
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = streamUrl;
        video.addEventListener("loadedmetadata", function () {
          showStatus("");
        });
        video.addEventListener("error", function () {
          showStatus("播放加载遇到问题，请稍后重试。");
        });
      } else {
        showStatus("播放加载遇到问题，请稍后重试。");
      }
    }

    function startPlayback() {
      if (cover) {
        cover.classList.add("is-hidden");
      }
      video.controls = true;
      var promise = video.play();
      if (promise && typeof promise.catch === "function") {
        promise.catch(function () {
          if (cover) {
            cover.classList.remove("is-hidden");
          }
        });
      }
    }

    attachStream();

    if (cover) {
      cover.addEventListener("click", startPlayback);
    }

    video.addEventListener("click", function () {
      if (video.paused) {
        startPlayback();
      }
    });

    window.addEventListener("beforeunload", function () {
      if (hlsInstance) {
        hlsInstance.destroy();
      }
    });
  };

  onReady(function () {
    setupNavigation();
    setupHeroSlider();
    setupFilters();
  });
})();
