import { H as Hls } from './hls-dru42stk.js';

const mobileButton = document.querySelector('.mobile-menu-button');
const mobileMenu = document.querySelector('.mobile-menu');

if (mobileButton && mobileMenu) {
  mobileButton.addEventListener('click', () => {
    mobileMenu.classList.toggle('is-open');
  });
}

function setupHero() {
  const hero = document.querySelector('[data-hero]');
  if (!hero) {
    return;
  }

  const slides = Array.from(hero.querySelectorAll('[data-hero-slide]'));
  const dots = Array.from(hero.querySelectorAll('[data-hero-dot]'));
  const previous = hero.querySelector('[data-hero-prev]');
  const next = hero.querySelector('[data-hero-next]');
  let current = 0;

  const show = (index) => {
    current = (index + slides.length) % slides.length;
    slides.forEach((slide, position) => {
      const active = position === current;
      slide.classList.toggle('opacity-100', active);
      slide.classList.toggle('pointer-events-auto', active);
      slide.classList.toggle('opacity-0', !active);
      slide.classList.toggle('pointer-events-none', !active);
    });
    dots.forEach((dot, position) => {
      const active = position === current;
      dot.classList.toggle('bg-white', active);
      dot.classList.toggle('w-8', active);
      dot.classList.toggle('bg-white/50', !active);
    });
  };

  if (previous) {
    previous.addEventListener('click', () => show(current - 1));
  }

  if (next) {
    next.addEventListener('click', () => show(current + 1));
  }

  dots.forEach((dot) => {
    dot.addEventListener('click', () => show(Number(dot.dataset.heroDot || 0)));
  });

  window.setInterval(() => show(current + 1), 5000);
}

function setupPlayers() {
  const videos = Array.from(document.querySelectorAll('.js-video-player'));

  videos.forEach((video) => {
    const startButton = video.parentElement ? video.parentElement.querySelector('.player-start') : null;
    const source = video.dataset.hls || '';
    let initialized = false;
    let hls = null;

    const initialize = () => {
      if (initialized || !source) {
        return;
      }

      initialized = true;

      if (Hls.isSupported()) {
        hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true
        });
        hls.loadSource(source);
        hls.attachMedia(video);
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = source;
      }
    };

    const play = () => {
      initialize();
      const request = video.play();
      if (request && typeof request.catch === 'function') {
        request.catch(() => {});
      }
    };

    if (startButton) {
      startButton.addEventListener('click', () => {
        startButton.classList.add('is-hidden');
        play();
      });
    }

    video.addEventListener('play', () => {
      if (startButton) {
        startButton.classList.add('is-hidden');
      }
    });

    video.addEventListener('click', () => {
      initialize();
    });

    window.addEventListener('pagehide', () => {
      if (hls) {
        hls.destroy();
      }
    });
  });
}

function makeResultCard(movie) {
  const tags = (movie.genres || []).slice(0, 2).map((tag) => `<span class="text-xs bg-cyan-50 text-cyan-700 px-2 py-1 rounded-full border border-cyan-100">${escapeHtml(tag)}</span>`).join('');
  return `
<a href="${movie.url}" class="group block bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-100">
  <div class="relative poster-frame overflow-hidden bg-slate-900">
    <img src="${movie.cover}" alt="${escapeHtml(movie.title)}" loading="lazy" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500">
    <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-90"></div>
    <span class="absolute right-3 top-3 bg-black/50 backdrop-blur-sm text-white text-xs px-3 py-1 rounded-full">${escapeHtml(movie.type)}</span>
    <div class="absolute bottom-3 left-3 right-3">
      <div class="flex items-center justify-between text-white text-xs">
        <span>${escapeHtml(movie.region)}</span>
        <span>${escapeHtml(movie.year)}</span>
      </div>
    </div>
    <div class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
      <span class="play-chip">▶</span>
    </div>
  </div>
  <div class="p-4">
    <h3 class="font-bold text-gray-900 group-hover:text-cyan-600 transition-colors line-clamp-1">${escapeHtml(movie.title)}</h3>
    <p class="text-sm text-gray-600 mt-2 line-clamp-2">${escapeHtml(movie.oneLine)}</p>
    <div class="flex flex-wrap gap-2 mt-3">${tags}</div>
  </div>
</a>`;
}

function escapeHtml(value) {
  return String(value || '').replace(/[&<>"]/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;'
  }[char]));
}

function setupSearch() {
  const input = document.getElementById('site-search-input');
  const typeFilter = document.getElementById('site-type-filter');
  const yearFilter = document.getElementById('site-year-filter');
  const results = document.getElementById('site-search-results');
  const data = window.__SITE_DATA__ || [];

  if (!input || !typeFilter || !yearFilter || !results || !data.length) {
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const queryValue = params.get('q') || '';
  input.value = queryValue;

  const types = Array.from(new Set(data.map((movie) => movie.type).filter(Boolean))).sort();
  const years = Array.from(new Set(data.map((movie) => movie.year).filter(Boolean))).sort((a, b) => Number(b) - Number(a));

  types.forEach((type) => {
    const option = document.createElement('option');
    option.value = type;
    option.textContent = type;
    typeFilter.appendChild(option);
  });

  years.forEach((year) => {
    const option = document.createElement('option');
    option.value = year;
    option.textContent = year;
    yearFilter.appendChild(option);
  });

  const render = () => {
    const keyword = input.value.trim().toLowerCase();
    const typeValue = typeFilter.value;
    const yearValue = yearFilter.value;
    const filtered = data.filter((movie) => {
      const haystack = [movie.title, movie.region, movie.type, movie.year, movie.genre, movie.oneLine, movie.tags].join(' ').toLowerCase();
      return (!keyword || haystack.includes(keyword)) && (!typeValue || movie.type === typeValue) && (!yearValue || movie.year === yearValue);
    }).slice(0, 96);

    results.innerHTML = filtered.map(makeResultCard).join('') || '<div class="col-span-full bg-white rounded-2xl p-10 text-center text-gray-500 border border-gray-100">没有找到匹配内容</div>';
  };

  input.addEventListener('input', render);
  typeFilter.addEventListener('change', render);
  yearFilter.addEventListener('change', render);
  render();
}

setupHero();
setupPlayers();
setupSearch();
