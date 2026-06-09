(function () {
    function $(selector, root) {
        return (root || document).querySelector(selector);
    }

    function $all(selector, root) {
        return Array.prototype.slice.call((root || document).querySelectorAll(selector));
    }

    function normalize(value) {
        return String(value || '').toLowerCase().trim();
    }

    function initMobileMenu() {
        var button = $('.menu-toggle');
        var panel = $('.mobile-panel');
        if (!button || !panel) {
            return;
        }
        button.addEventListener('click', function () {
            var open = panel.classList.toggle('is-open');
            button.setAttribute('aria-expanded', open ? 'true' : 'false');
        });
    }

    function initGlobalSearch() {
        $all('.global-search-form').forEach(function (form) {
            form.addEventListener('submit', function (event) {
                event.preventDefault();
                var input = form.querySelector('input[name="q"]');
                var target = form.getAttribute('action') || 'search.html';
                var query = input ? input.value.trim() : '';
                window.location.href = target + (query ? '?q=' + encodeURIComponent(query) : '');
            });
        });
    }

    function initHero() {
        var hero = $('.hero-carousel');
        if (!hero) {
            return;
        }
        var slides = $all('.hero-slide', hero);
        var dots = $all('.hero-dots button', hero);
        var prev = $('.hero-prev', hero);
        var next = $('.hero-next', hero);
        var current = 0;
        var timer;

        function show(index) {
            current = (index + slides.length) % slides.length;
            slides.forEach(function (slide, i) {
                slide.classList.toggle('is-active', i === current);
            });
            dots.forEach(function (dot, i) {
                dot.classList.toggle('is-active', i === current);
            });
        }

        function start() {
            stop();
            timer = window.setInterval(function () {
                show(current + 1);
            }, 5200);
        }

        function stop() {
            if (timer) {
                window.clearInterval(timer);
            }
        }

        if (!slides.length) {
            return;
        }
        dots.forEach(function (dot, i) {
            dot.addEventListener('click', function () {
                show(i);
                start();
            });
        });
        if (prev) {
            prev.addEventListener('click', function () {
                show(current - 1);
                start();
            });
        }
        if (next) {
            next.addEventListener('click', function () {
                show(current + 1);
                start();
            });
        }
        hero.addEventListener('mouseenter', stop);
        hero.addEventListener('mouseleave', start);
        show(0);
        start();
    }

    function initFilters() {
        var input = $('[data-filter-input]');
        var yearSelect = $('[data-year-filter]');
        var cards = $all('.movie-card[data-search]');
        var empty = $('.no-results');
        if (!cards.length || (!input && !yearSelect)) {
            return;
        }
        var params = new URLSearchParams(window.location.search);
        var initialQuery = params.get('q') || '';
        if (input && initialQuery) {
            input.value = initialQuery;
        }

        function apply() {
            var query = normalize(input ? input.value : '');
            var year = yearSelect ? yearSelect.value : '';
            var visible = 0;
            cards.forEach(function (card) {
                var haystack = normalize(card.getAttribute('data-search'));
                var cardYear = card.getAttribute('data-year') || '';
                var matchQuery = !query || haystack.indexOf(query) !== -1;
                var matchYear = !year || cardYear === year;
                var show = matchQuery && matchYear;
                card.style.display = show ? '' : 'none';
                if (show) {
                    visible += 1;
                }
            });
            if (empty) {
                empty.classList.toggle('is-visible', visible === 0);
            }
        }

        if (input) {
            input.addEventListener('input', apply);
        }
        if (yearSelect) {
            yearSelect.addEventListener('change', apply);
        }
        apply();
    }

    function initPlayers() {
        $all('.player-card[data-source]').forEach(function (card) {
            var video = card.querySelector('video');
            var overlay = card.querySelector('.player-overlay');
            var source = card.getAttribute('data-source');
            var hlsInstance = null;
            var prepared = false;
            if (!video || !source) {
                return;
            }

            function attachSource() {
                if (prepared) {
                    return Promise.resolve();
                }
                prepared = true;
                if (video.canPlayType('application/vnd.apple.mpegurl')) {
                    video.src = source;
                } else if (window.Hls && window.Hls.isSupported()) {
                    hlsInstance = new window.Hls({
                        enableWorker: true,
                        lowLatencyMode: false
                    });
                    hlsInstance.loadSource(source);
                    hlsInstance.attachMedia(video);
                } else {
                    video.src = source;
                }
                video.controls = true;
                return Promise.resolve();
            }

            function playVideo() {
                attachSource().then(function () {
                    if (overlay) {
                        overlay.classList.add('is-hidden');
                    }
                    var promise = video.play();
                    if (promise && typeof promise.catch === 'function') {
                        promise.catch(function () {
                            video.controls = true;
                        });
                    }
                });
            }

            if (overlay) {
                overlay.addEventListener('click', playVideo);
            }
            video.addEventListener('click', function () {
                if (!prepared) {
                    playVideo();
                }
            });
            window.addEventListener('pagehide', function () {
                if (hlsInstance) {
                    hlsInstance.destroy();
                    hlsInstance = null;
                }
            });
        });
    }

    document.addEventListener('DOMContentLoaded', function () {
        initMobileMenu();
        initGlobalSearch();
        initHero();
        initFilters();
        initPlayers();
    });
}());
