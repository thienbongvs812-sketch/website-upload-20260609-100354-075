(function () {
  "use strict";

  function ready(callback) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback);
      return;
    }
    callback();
  }

  function normalize(value) {
    return (value || "").toString().trim().toLowerCase();
  }

  function setupMenu() {
    var button = document.querySelector("[data-menu-toggle]");
    var nav = document.querySelector("[data-mobile-nav]");
    if (!button || !nav) {
      return;
    }
    button.addEventListener("click", function () {
      nav.classList.toggle("is-open");
    });
  }

  function setupHero() {
    var root = document.querySelector(".js-hero");
    if (!root) {
      return;
    }
    var slides = Array.prototype.slice.call(root.querySelectorAll(".hero-slide"));
    var prev = root.querySelector("[data-hero-prev]");
    var next = root.querySelector("[data-hero-next]");
    var dotsRoot = root.querySelector("[data-hero-dots]");
    if (!slides.length) {
      return;
    }
    var index = 0;
    var timer = null;
    var dots = [];

    function activate(target) {
      index = (target + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle("is-active", slideIndex === index);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle("is-active", dotIndex === index);
      });
    }

    function restart() {
      if (timer) {
        window.clearInterval(timer);
      }
      timer = window.setInterval(function () {
        activate(index + 1);
      }, 6200);
    }

    if (dotsRoot) {
      slides.forEach(function (_, slideIndex) {
        var dot = document.createElement("button");
        dot.type = "button";
        dot.setAttribute("aria-label", "切换推荐" + (slideIndex + 1));
        dot.addEventListener("click", function () {
          activate(slideIndex);
          restart();
        });
        dotsRoot.appendChild(dot);
        dots.push(dot);
      });
    }

    if (prev) {
      prev.addEventListener("click", function () {
        activate(index - 1);
        restart();
      });
    }

    if (next) {
      next.addEventListener("click", function () {
        activate(index + 1);
        restart();
      });
    }

    activate(0);
    restart();
  }

  function setupFilters() {
    var inputs = Array.prototype.slice.call(document.querySelectorAll(".js-filter-input"));
    inputs.forEach(function (input) {
      var section = input.closest(".content-section") || document;
      var list = section.querySelector(".js-filter-list");
      var empty = section.querySelector("[data-empty-state]");
      if (!list) {
        return;
      }
      var cards = Array.prototype.slice.call(list.querySelectorAll("[data-search]"));
      var params = new URLSearchParams(window.location.search);
      var query = params.get("q") || "";
      if (query && !input.value) {
        input.value = query;
      }
      function applyFilter() {
        var term = normalize(input.value);
        var visible = 0;
        cards.forEach(function (card) {
          var content = normalize(card.getAttribute("data-search"));
          var matched = !term || content.indexOf(term) !== -1;
          card.style.display = matched ? "" : "none";
          if (matched) {
            visible += 1;
          }
        });
        if (empty) {
          empty.classList.toggle("is-visible", visible === 0);
        }
      }
      input.addEventListener("input", applyFilter);
      applyFilter();
    });
  }

  function attachStream(video, url) {
    if (!video || !url) {
      return;
    }
    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = url;
      return;
    }
    if (window.Hls && window.Hls.isSupported()) {
      var hls = new window.Hls({
        enableWorker: true,
        lowLatencyMode: true
      });
      hls.loadSource(url);
      hls.attachMedia(video);
      video._hls = hls;
      return;
    }
    video.src = url;
  }

  function setupPlayers() {
    var players = Array.prototype.slice.call(document.querySelectorAll(".js-player"));
    players.forEach(function (player) {
      var video = player.querySelector("video");
      var button = player.querySelector(".play-toggle");
      var url = player.getAttribute("data-stream-url");
      var initialized = false;

      function start() {
        if (!initialized) {
          attachStream(video, url);
          initialized = true;
        }
        video.controls = true;
        var promise = video.play();
        if (promise && promise.catch) {
          promise.catch(function () {});
        }
      }

      function toggle() {
        if (!video) {
          return;
        }
        if (video.paused) {
          start();
        } else {
          video.pause();
        }
      }

      if (button) {
        button.addEventListener("click", start);
      }
      if (video) {
        video.addEventListener("click", toggle);
        video.addEventListener("play", function () {
          player.classList.add("is-playing");
        });
        video.addEventListener("pause", function () {
          player.classList.remove("is-playing");
        });
        video.addEventListener("ended", function () {
          player.classList.remove("is-playing");
        });
      }
    });
  }

  ready(function () {
    setupMenu();
    setupHero();
    setupFilters();
    setupPlayers();
  });
})();
