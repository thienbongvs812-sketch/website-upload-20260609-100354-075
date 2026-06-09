import { H as Hls } from './hls-dru42stk.js';

const players = Array.from(document.querySelectorAll('[data-player]'));

players.forEach((player) => {
  const video = player.querySelector('video[data-stream]');
  const button = player.querySelector('[data-play-button]');
  const frame = player.querySelector('.player-frame');

  if (!video || !button || !frame) {
    return;
  }

  const stream = video.getAttribute('data-stream');
  let prepared = false;
  let controller = null;

  const prepare = () => {
    if (prepared || !stream) {
      return;
    }

    prepared = true;

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = stream;
      return;
    }

    if (Hls && Hls.isSupported()) {
      controller = new Hls({
        maxBufferLength: 30,
        backBufferLength: 30
      });
      controller.loadSource(stream);
      controller.attachMedia(video);
      video.hlsController = controller;
    } else {
      video.src = stream;
    }
  };

  const play = () => {
    prepare();
    const promise = video.play();
    if (promise && typeof promise.catch === 'function') {
      promise.catch(() => {
        frame.classList.remove('is-playing');
      });
    }
  };

  button.addEventListener('click', play);

  video.addEventListener('click', () => {
    if (video.paused) {
      play();
    } else {
      video.pause();
    }
  });

  video.addEventListener('play', () => {
    frame.classList.add('is-playing');
  });

  video.addEventListener('pause', () => {
    frame.classList.remove('is-playing');
  });

  video.addEventListener('ended', () => {
    frame.classList.remove('is-playing');
  });
});
