(function () {
  function initializePlayer(shell) {
    var video = shell.querySelector('video');
    var button = shell.querySelector('[data-play-button]');
    var cover = shell.querySelector('.player-cover');
    var status = shell.querySelector('[data-player-status]');

    if (!video) {
      return;
    }

    function setStatus(value) {
      if (status) {
        status.textContent = value || '';
      }
    }

    function playVideo() {
      var source = video.getAttribute('data-m3u8');

      if (!source) {
        setStatus('播放源暂不可用');
        return;
      }

      shell.classList.add('is-playing');
      setStatus('正在缓冲...');

      if (video.getAttribute('data-ready') === 'true') {
        video.play().catch(function () {
          setStatus('点击视频继续播放');
        });
        return;
      }

      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = source;
        video.setAttribute('data-ready', 'true');
        video.play().catch(function () {
          setStatus('点击视频继续播放');
        });
        return;
      }

      if (window.Hls && window.Hls.isSupported()) {
        var hls = new window.Hls({
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 90
        });
        hls.loadSource(source);
        hls.attachMedia(video);
        hls.on(window.Hls.Events.MANIFEST_PARSED, function () {
          video.setAttribute('data-ready', 'true');
          video.play().catch(function () {
            setStatus('点击视频继续播放');
          });
        });
        hls.on(window.Hls.Events.ERROR, function (eventName, data) {
          if (data && data.fatal) {
            setStatus('播放失败，请稍后重试');
          }
        });
        return;
      }

      video.src = source;
      video.setAttribute('data-ready', 'true');
      video.play().catch(function () {
        setStatus('点击视频继续播放');
      });
    }

    if (button) {
      button.addEventListener('click', playVideo);
    }

    if (cover) {
      cover.addEventListener('click', playVideo);
    }

    video.addEventListener('playing', function () {
      shell.classList.add('is-playing');
      setStatus('');
    });

    video.addEventListener('pause', function () {
      if (!video.ended) {
        shell.classList.remove('is-playing');
      }
    });
  }

  document.querySelectorAll('[data-player]').forEach(initializePlayer);
})();
