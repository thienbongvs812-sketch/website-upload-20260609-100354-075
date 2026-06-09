document.addEventListener("DOMContentLoaded", function () {
    setupMenu();
    setupSearchForms();
    setupHero();
    setupFilters();
    setupPlayers();
});

function setupMenu() {
    const toggle = document.querySelector("[data-menu-toggle]");
    const panel = document.querySelector("[data-mobile-panel]");
    if (!toggle || !panel) {
        return;
    }
    toggle.addEventListener("click", function () {
        panel.classList.toggle("is-open");
    });
}

function setupSearchForms() {
    document.querySelectorAll("[data-site-search]").forEach(function (form) {
        form.addEventListener("submit", function (event) {
            event.preventDefault();
            const input = form.querySelector("input[name='q']");
            const query = input ? input.value.trim() : "";
            const url = query ? "search.html?q=" + encodeURIComponent(query) : "search.html";
            window.location.href = url;
        });
    });
}

function setupHero() {
    const hero = document.querySelector("[data-hero]");
    if (!hero) {
        return;
    }
    const slides = Array.from(hero.querySelectorAll("[data-hero-slide]"));
    const dots = Array.from(hero.querySelectorAll("[data-hero-dot]"));
    if (slides.length <= 1) {
        return;
    }
    let active = 0;
    let timer = null;

    function show(index) {
        active = (index + slides.length) % slides.length;
        slides.forEach(function (slide, slideIndex) {
            slide.classList.toggle("is-active", slideIndex === active);
        });
        dots.forEach(function (dot, dotIndex) {
            dot.classList.toggle("is-active", dotIndex === active);
        });
    }

    function start() {
        stop();
        timer = window.setInterval(function () {
            show(active + 1);
        }, 5200);
    }

    function stop() {
        if (timer) {
            window.clearInterval(timer);
        }
    }

    dots.forEach(function (dot, index) {
        dot.addEventListener("click", function () {
            show(index);
            start();
        });
    });

    hero.addEventListener("mouseenter", stop);
    hero.addEventListener("mouseleave", start);
    start();
}

function setupFilters() {
    const filterForms = document.querySelectorAll("[data-local-filter]");
    if (!filterForms.length) {
        return;
    }

    const params = new URLSearchParams(window.location.search);
    const initialQuery = params.get("q") || "";

    filterForms.forEach(function (form) {
        const input = form.querySelector("[data-filter-input]");
        const year = form.querySelector("[data-year-filter]");
        const category = form.querySelector("[data-category-filter]");
        const region = form.querySelector("[data-region-filter]");
        const cards = Array.from(document.querySelectorAll("[data-movie-card]"));
        const empty = document.querySelector("[data-empty-state]");

        if (input && initialQuery) {
            input.value = initialQuery;
        }

        function apply() {
            const query = input ? input.value.trim().toLowerCase() : "";
            const yearValue = year ? year.value : "";
            const categoryValue = category ? category.value : "";
            const regionValue = region ? region.value : "";
            let visible = 0;

            cards.forEach(function (card) {
                const haystack = (card.getAttribute("data-search") || "").toLowerCase();
                const cardYear = card.getAttribute("data-year") || "";
                const cardCategory = card.getAttribute("data-category") || "";
                const cardRegion = card.getAttribute("data-region") || "";
                const matched = (!query || haystack.indexOf(query) !== -1) &&
                    (!yearValue || cardYear === yearValue) &&
                    (!categoryValue || cardCategory === categoryValue) &&
                    (!regionValue || cardRegion === regionValue);

                card.style.display = matched ? "" : "none";
                if (matched) {
                    visible += 1;
                }
            });

            if (empty) {
                empty.classList.toggle("is-visible", visible === 0);
            }
        }

        [input, year, category, region].forEach(function (control) {
            if (control) {
                control.addEventListener("input", apply);
                control.addEventListener("change", apply);
            }
        });

        form.addEventListener("submit", function (event) {
            event.preventDefault();
            apply();
        });

        apply();
    });
}

function setupPlayers() {
    document.querySelectorAll("[data-player]").forEach(function (player) {
        const video = player.querySelector("video");
        const button = player.querySelector("[data-play-button]");
        const stream = player.getAttribute("data-stream") || "";
        let prepared = false;
        let hlsInstance = null;

        if (!video || !button || !stream) {
            return;
        }

        function loadStream() {
            if (prepared) {
                return Promise.resolve();
            }
            prepared = true;

            if (window.Hls && window.Hls.isSupported()) {
                hlsInstance = new window.Hls({
                    enableWorker: true,
                    lowLatencyMode: true
                });
                hlsInstance.loadSource(stream);
                hlsInstance.attachMedia(video);
            } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
                video.src = stream;
            } else {
                video.src = stream;
            }

            return Promise.resolve();
        }

        function play() {
            loadStream().then(function () {
                const promise = video.play();
                if (promise && typeof promise.catch === "function") {
                    promise.catch(function () {});
                }
                button.classList.add("is-hidden");
            });
        }

        button.addEventListener("click", play);
        player.addEventListener("click", function (event) {
            if (event.target === video) {
                return;
            }
            if (!button.classList.contains("is-hidden")) {
                play();
            }
        });
        video.addEventListener("play", function () {
            button.classList.add("is-hidden");
        });
        video.addEventListener("pause", function () {
            if (video.currentTime === 0 || video.ended) {
                button.classList.remove("is-hidden");
            }
        });
        window.addEventListener("beforeunload", function () {
            if (hlsInstance) {
                hlsInstance.destroy();
            }
        });
    });
}
