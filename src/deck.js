// Stage navigation, fit-to-window scaling, inline slide videos. Flow mode (phones, portrait) and ?all
// show every slide stacked, so navigation only runs on the stage.
(function () {
  var slides = Array.prototype.slice.call(document.querySelectorAll('.slide'));
  var flowMq = window.matchMedia('(max-width: 860px), (max-aspect-ratio: 1/1)');
  var all = /[?&]all\b/.test(location.search);
  if (all) document.body.classList.add('all');
  var i = 0;
  var inl = Array.prototype.slice.call(document.querySelectorAll('.inl'));
  var count = document.querySelector('.nav .count');
  var bar = document.querySelector('.progress i');

  function staged() { return !all && !flowMq.matches; }
  function fit() {
    var s = Math.min(window.innerWidth / 1280, window.innerHeight / 720);
    document.documentElement.style.setProperty('--s', String(s));
  }
  function indexOf(id) {
    for (var k = 0; k < slides.length; k++) if (slides[k].id === id) return k;
    return -1;
  }
  function show(n, push) {
    var from = i;
    i = Math.max(0, Math.min(slides.length - 1, n));
    slides.forEach(function (el, k) { el.classList.toggle('on', k === i); });
    if (i !== from) pauseAll(null); // a resize (or leaving fullscreen) re-shows the same slide: keep playing
    if (count) count.textContent = (i + 1) + ' / ' + slides.length;
    if (bar) bar.style.width = ((i + 1) / slides.length * 100) + '%';
    var h = '#' + slides[i].id;
    if (push && location.hash !== h) history.replaceState(null, '', h);
    document.querySelectorAll('.lang a').forEach(function (a) { a.hash = h; });
  }
  function fromHash() {
    var k = indexOf(location.hash.slice(1));
    if (staged()) show(k < 0 ? 0 : k, false);
    else if (k >= 0) slides[k].scrollIntoView();
  }

  // in-deck links (#call) jump on the stage instead of scrolling
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a || !staged()) return;
    var k = indexOf(a.getAttribute('href').slice(1));
    if (k < 0) return;
    e.preventDefault();
    show(k, true);
  });

  document.addEventListener('keydown', function (e) {
    if (!staged()) return;
    if (e.target.tagName === 'VIDEO' && (e.key === ' ' || e.key === 'Enter')) return; // the video's own play/pause
    if (['ArrowRight', 'PageDown', ' ', 'Enter'].indexOf(e.key) >= 0) { e.preventDefault(); show(i + 1, true); }
    else if (['ArrowLeft', 'PageUp', 'Backspace'].indexOf(e.key) >= 0) { e.preventDefault(); show(i - 1, true); }
    else if (e.key === 'Home') show(0, true);
    else if (e.key === 'End') show(slides.length - 1, true);
  });
  var x0 = null;
  document.addEventListener('touchstart', function (e) {
    x0 = e.target.closest && e.target.closest('video') ? null : e.touches[0].clientX; // a swipe on the video scrubs it
  }, { passive: true });
  document.addEventListener('touchend', function (e) {
    if (x0 === null || !staged()) return;
    var dx = e.changedTouches[0].clientX - x0; x0 = null;
    if (Math.abs(dx) > 50) show(i + (dx < 0 ? 1 : -1), true);
  });
  var prev = document.querySelector('.nav .prev'), next = document.querySelector('.nav .next');
  if (prev) prev.addEventListener('click', function () { show(i - 1, true); });
  if (next) next.addEventListener('click', function () { show(i + 1, true); });

  // inline video: media/<name>.mp4 plays where the poster sits; a missing file says so instead of a black box
  function pauseAll(except) {
    inl.forEach(function (v) { if (v !== except && !v.paused) v.pause(); });
  }
  inl.forEach(function (v) {
    v.addEventListener('play', function () { pauseAll(v); });
    v.addEventListener('error', function () {
      v.classList.remove('on');
      v.parentNode.querySelector('.soon').classList.add('on');
    });
  });
  document.querySelectorAll('[data-video]').forEach(function (b) {
    b.addEventListener('click', function (e) {
      e.preventDefault();
      var box = b.closest('.screen, .shot');
      var v = box.querySelector('.inl');
      box.querySelector('.soon').classList.remove('on');
      v.src = '../media/' + b.getAttribute('data-video') + '.mp4';
      v.classList.add('on');
      b.classList.add('gone');
      var p = v.play();
      if (p && p.catch) p.catch(function () {});
    });
  });
  // flow mode and ?all stack the slides: a video scrolled out of view stops too
  var scrollTick = false;
  window.addEventListener('scroll', function () {
    if (scrollTick) return;
    scrollTick = true;
    requestAnimationFrame(function () {
      scrollTick = false;
      inl.forEach(function (v) {
        if (v.paused) return;
        var r = v.getBoundingClientRect();
        var seen = Math.min(r.bottom, window.innerHeight) - Math.max(r.top, 0);
        if (seen < r.height * 0.2) v.pause();
      });
    });
  }, { passive: true });

  window.addEventListener('resize', function () { fit(); if (staged()) show(i, false); });
  window.addEventListener('hashchange', fromHash);
  flowMq.addEventListener && flowMq.addEventListener('change', fromHash);
  fit();
  show(0, false);
  fromHash();
})();
