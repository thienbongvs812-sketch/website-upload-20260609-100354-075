import { H as Hls } from './hls-dru42stk.js';

function setupPlayer(root) {
  var video = root.querySelector('video');
  var button = root.querySelector('[data-play-button]');
  var message = root.querySelector('[data-player-message]');
  var source = root.getAttribute('data-m3u8');
  var started = false;

  if (!video || !button || !source) {
    if (message) {
      message.textContent = '当前页面没有可用播放源。';
    }

    return;
  }

  function setMessage(text) {
    if (message) {
      message.textContent = text || '';
    }
  }

  function play() {
    if (started) {
      video.play();
      return;
    }

    started = true;
    button.classList.add('is-hidden');
    video.controls = true;
    setMessage('正在加载播放源...');

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = source;
      video.addEventListener('loadedmetadata', function () {
        video.play().catch(function () {
          setMessage('浏览器阻止了自动播放，请再次点击视频播放。');
        });
      }, { once: true });
      return;
    }

    if (Hls && Hls.isSupported()) {
      var hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90
      });

      hls.loadSource(source);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, function () {
        setMessage('');
        video.play().catch(function () {
          setMessage('浏览器阻止了自动播放，请再次点击视频播放。');
        });
      });
      hls.on(Hls.Events.ERROR, function (event, data) {
        if (data && data.fatal) {
          setMessage('播放源加载失败，请稍后重试。');
        }
      });
      return;
    }

    video.src = source;
    video.play().catch(function () {
      setMessage('当前浏览器不支持该播放源。');
    });
  }

  button.addEventListener('click', play);
  video.addEventListener('click', function () {
    if (!started) {
      play();
    }
  });
}

document.querySelectorAll('[data-player]').forEach(setupPlayer);
