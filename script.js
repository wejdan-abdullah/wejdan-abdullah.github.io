/* ============================================================
   ملف أعمال وجدان القرني — السكربت
   ============================================================ */
(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var root = document.documentElement;

  /* ---------- الوضع الداكن / الفاتح ---------- */
  var themeBtn = document.getElementById('theme-toggle');
  function currentTheme() { return root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light'; }
  function applyTheme(t) {
    root.setAttribute('data-theme', t);
    if (themeBtn) {
      themeBtn.setAttribute('aria-pressed', t === 'dark' ? 'true' : 'false');
      themeBtn.setAttribute('aria-label', t === 'dark' ? 'التبديل إلى الوضع الفاتح' : 'التبديل إلى الوضع الداكن');
    }
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', t === 'dark' ? '#321F12' : '#5D593C');
  }
  applyTheme(currentTheme());
  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      var next = currentTheme() === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      try { localStorage.setItem('theme', next); } catch (e) { /* التخزين غير متاح */ }
    });
  }

  /* ---------- قائمة الجوال ---------- */
  var menuBtn = document.getElementById('menu-btn');
  var nav = document.getElementById('nav');
  if (menuBtn && nav) {
    menuBtn.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    nav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') { nav.classList.remove('open'); menuBtn.setAttribute('aria-expanded', 'false'); }
    });
  }

  /* ---------- شريط التقدم ---------- */
  var bar = document.querySelector('.progress');
  if (bar) {
    var ticking = false;
    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        var h = document.documentElement.scrollHeight - window.innerHeight;
        bar.style.transform = 'scaleX(' + (h > 0 ? Math.min(1, window.scrollY / h) : 0) + ')';
        ticking = false;
      });
    }, { passive: true });
  }

  /* ---------- ظهور العناصر عند النزول ---------- */
  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduce) {
    var ro = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); ro.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach(function (el) { ro.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- العدّادات ---------- */
  function fmt(n) { return Math.round(n).toLocaleString('en-US'); }
  var counters = document.querySelectorAll('[data-target]');
  var running = new WeakMap();
  function stopCounter(el) { var id = running.get(el); if (id) cancelAnimationFrame(id); running.delete(el); }
  function finalText(el) { return fmt(parseFloat(el.dataset.target)) + (el.dataset.suffix || ''); }
  function playCounter(el) {
    stopCounter(el);
    var target = parseFloat(el.dataset.target), start = parseFloat(el.dataset.start || '0');
    var dur = parseFloat(el.dataset.duration || '1800'), t0 = null;
    function step(ts) {
      if (t0 === null) t0 = ts;
      var p = Math.min(1, (ts - t0) / dur), eased = 1 - Math.pow(1 - p, 3);
      el.textContent = p === 1 ? finalText(el) : fmt(start + (target - start) * eased);
      if (p < 1) running.set(el, requestAnimationFrame(step));
    }
    running.set(el, requestAnimationFrame(step));
  }
  counters.forEach(function (el) { el.textContent = finalText(el); });
  if ('IntersectionObserver' in window && !reduce) {
    var co = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) playCounter(en.target);
        else { stopCounter(en.target); en.target.textContent = finalText(en.target); }
      });
    }, { threshold: 0.6 });
    counters.forEach(function (el) { co.observe(el); });
  }

  /* ---------- تحميل الصور (تجرّب jpg ثم png ثم jpeg ثم webp) ---------- */
  var EXT = ['jpg', 'png', 'jpeg', 'webp'];
  function loadSlot(el) {
    var base = el.dataset.src;
    if (!base || el.dataset.state) return;
    el.dataset.state = 'loading';
    var i = 0;
    (function next() {
      if (i >= EXT.length) { el.dataset.state = 'missing'; return; }
      var img = new Image();
      img.onload = function () {
        img.alt = el.dataset.alt || '';
        if (!el.classList.contains('clip') && img.naturalWidth && img.naturalHeight && !el.closest('.card') && !el.parentNode.classList.contains('plan') && !el.classList.contains('logo-tile')) {
          el.style.setProperty('--r', Math.min(2.2, Math.max(0.45, img.naturalWidth / img.naturalHeight)).toFixed(3));
        }
        el.classList.add('zoomable');
        img.loading = 'lazy';
        img.decoding = 'async';
        el.appendChild(img);
        el.classList.add('loaded');
        el.dataset.state = 'ok';
      };
      img.onerror = next;
      img.src = base + '.' + EXT[i++];
    })();
  }
  var slots = document.querySelectorAll('[data-src]');
  if ('IntersectionObserver' in window) {
    var so = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { loadSlot(en.target); so.unobserve(en.target); }
      });
    }, { rootMargin: '500px 0px' });
    slots.forEach(function (el) { so.observe(el); });
  } else {
    slots.forEach(loadSlot);
  }

  /* ---------- فلتر الحملات ---------- */
  var filters = document.querySelectorAll('.filter');
  var cards = document.querySelectorAll('.card[data-cat]');
  filters.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var f = btn.dataset.filter;
      filters.forEach(function (b) { b.setAttribute('aria-pressed', b === btn ? 'true' : 'false'); });
      cards.forEach(function (c) {
        var show = f === 'all' || c.dataset.cat === f;
        c.hidden = !show;
        if (show) { c.classList.remove('fade'); void c.offsetWidth; c.classList.add('fade'); }
      });
    });
  });

  /* ---------- صور إضافية تلقائية: -4 و -5 و -6 ... تظهر لو رفعتيها ---------- */
  function extendGallery(g) {
    var slotsIn = g.querySelectorAll('[data-src]');
    if (!slotsIn.length) return;
    var last = slotsIn[slotsIn.length - 1];
    var m = /^(.*-)(\d+)$/.exec(last.dataset.src);
    if (!m) return;
    var base = m[1], n = parseInt(m[2], 10), alt = (last.dataset.alt || '').replace(/\d+$/, '');
    (function tryNext() {
      n++;
      if (n > 20) return;
      var k = 0;
      (function ext() {
        if (k >= EXT.length) return;               // ما فيه صورة بهذا الرقم، نوقف
        var img = new Image();
        img.onload = function () {
          var fig = document.createElement('figure');
          fig.className = 'slot loaded';
          fig.style.setProperty('--r', '4 / 5');
          img.alt = alt + n; img.loading = 'lazy';
          fig.appendChild(img); g.appendChild(fig);
          tryNext();
        };
        img.onerror = ext;
        img.src = base + n + '.' + EXT[k++];
      })();
    })();
  }

  /* ---------- مقاطع داخل المعرض (تيك توك / إنستقرام / يوتيوب / ملف mp4) ---------- */
  function setupClips(scope) {
    scope.querySelectorAll('.clip[data-embed]').forEach(function (el) {
      var u = (el.getAttribute('data-embed') || '').trim();
      if (!u || u.indexOf('#TODO') === 0 || el.classList.contains('ready')) return;
      var m, node;
      if ((m = /tiktok\.com\/.*video\/(\d+)/.exec(u))) {
        node = document.createElement('iframe'); node.src = 'https://www.tiktok.com/embed/v2/' + m[1];
      } else if ((m = /instagram\.com\/(reel|p)\/([\w-]+)/.exec(u))) {
        node = document.createElement('iframe'); node.src = 'https://www.instagram.com/' + m[1] + '/' + m[2] + '/embed';
      } else if ((m = /(?:youtu\.be\/|v=|shorts\/)([\w-]{11})/.exec(u))) {
        node = document.createElement('iframe'); node.src = 'https://www.youtube-nocookie.com/embed/' + m[1] + '?rel=0&modestbranding=1&playsinline=1';
      } else if (/\.(mp4|webm|mov)(\?.*)?$/i.test(u)) {
        node = document.createElement('video'); node.src = u; node.controls = true; node.playsInline = true; node.preload = 'metadata';
        (function (v, host) { v.addEventListener('error', function () { if (v.parentNode) v.parentNode.removeChild(v); host.classList.remove('ready'); }, true); v.addEventListener('loadedmetadata', function () { if (v.videoWidth && v.videoHeight) host.style.setProperty('--r', (v.videoWidth / v.videoHeight).toFixed(3)); }); })(node, el);
      } else { return; }
      if (node.tagName === 'IFRAME') { node.setAttribute('allowfullscreen', ''); node.setAttribute('loading', 'lazy'); node.setAttribute('allow', 'autoplay; encrypted-media; picture-in-picture'); node.title = 'مقطع'; }
      el.appendChild(node); el.classList.add('ready');
    });
  }

  /* ---------- نافذة تفاصيل الحملة ---------- */
  var dlg = document.getElementById('modal');
  var body = document.getElementById('modal-body');
  function openCard(card) {
    var d = card.querySelector('.detail');
    if (!d || !dlg || !body) return;
    body.innerHTML = d.innerHTML;
    body.querySelectorAll('[data-src]').forEach(function (el) { el.removeAttribute('data-state'); loadSlot(el); });
    body.querySelectorAll('.gallery').forEach(function (g) { if (!g.classList.contains('clips') && !g.nextElementSibling) extendGallery(g); });
    setupClips(body);
    if (typeof dlg.showModal === 'function') dlg.showModal(); else dlg.setAttribute('open', '');
    dlg.scrollTop = 0;
  }
  cards.forEach(function (card) {
    card.addEventListener('click', function (e) {
      if (e.target.closest('a')) return;
      openCard(card);
    });
  });
  document.querySelectorAll('.js-open').forEach(function (btn) {
    btn.addEventListener('click', function () { var c = btn.closest('.plan'); if (c) openCard(c); });
  });
  setupClips(document);
  if (dlg) {
    dlg.addEventListener('click', function (e) {
      if (e.target === dlg || e.target.closest('[data-close]')) dlg.close ? dlg.close() : dlg.removeAttribute('open');
    });
  }


  /* ---------- معرض كتابة المحتوى ---------- */
  (function () {
    var root = document.getElementById('wr');
    if (!root) return;
    var tabs = [].slice.call(root.querySelectorAll('.wr-tab'));
    var items = [].slice.call(root.querySelectorAll('.wr-item'));
    var figs = [].slice.call(root.querySelectorAll('.wr-fig'));
    var stage = root.querySelector('.wr-stage');
    var cap = document.getElementById('wr-cap');
    var count = document.getElementById('wr-count');
    var g = 0;
    function pad(n) { return (n < 10 ? '0' : '') + n; }
    function inGroup() { return items.filter(function (b) { return +b.dataset.g === g; }); }
    function show(idx) {
      var list = inGroup(), pos = list.indexOf(items[idx]);
      items.forEach(function (b, i) { b.setAttribute('aria-current', i === idx ? 'true' : 'false'); });
      figs.forEach(function (f, i) { f.classList.toggle('on', i === idx); });
      var slot = figs[idx].querySelector('.slot'); if (slot) loadSlot(slot);
      var nx = list[(pos + 1) % list.length]; var ns = figs[items.indexOf(nx)].querySelector('.slot'); if (ns) loadSlot(ns);
      cap.textContent = items[idx].dataset.title;
      count.textContent = pad(pos + 1) + ' / ' + pad(list.length);
      stage.setAttribute('data-n', pad(pos + 1));
    }
    function setGroup(gi) {
      g = gi;
      tabs.forEach(function (t) { t.setAttribute('aria-pressed', +t.dataset.g === gi ? 'true' : 'false'); });
      items.forEach(function (b) { b.parentNode.hidden = +b.dataset.g !== gi; });
      show(items.indexOf(inGroup()[0]));
    }
    function step(d) {
      var list = inGroup(), pos = list.indexOf(items[figs.findIndex(function (f) { return f.classList.contains('on'); })]);
      show(items.indexOf(list[(pos + d + list.length) % list.length]));
    }
    tabs.forEach(function (t) { t.addEventListener('click', function () { setGroup(+t.dataset.g); }); });
    items.forEach(function (b, i) { b.addEventListener('click', function () { show(i); }); });
    document.getElementById('wr-prev').addEventListener('click', function () { step(-1); });
    document.getElementById('wr-next').addEventListener('click', function () { step(1); });
    root.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { step(1); } else if (e.key === 'ArrowRight') { step(-1); }
    });
    setGroup(0);
  })();

  /* ---------- عارض الصور ---------- */
  (function () {
    var lb = document.getElementById('lightbox');
    if (!lb) return;
    var img = document.getElementById('lb-img'), cnt = document.getElementById('lb-count');
    var list = [], idx = 0, x0 = null;
    function show(i) {
      idx = (i + list.length) % list.length;
      img.src = list[idx].currentSrc || list[idx].src; img.alt = list[idx].alt || '';
      cnt.textContent = list.length > 1 ? (idx + 1) + ' / ' + list.length : '';
      lb.classList.toggle('single', list.length < 2);
    }
    function close() { if (lb.close) lb.close(); else lb.removeAttribute('open'); }
    document.addEventListener('click', function (e) {
      var im = e.target.closest && e.target.closest('.slot.zoomable img');
      if (!im || im.closest('.card') || im.closest('.logo-tile')) return;
      var scope = im.closest('#modal-body, .mini, .shots, .loyal-media, .plan, .wr-stage') || im.parentNode;
      list = [].slice.call(scope.querySelectorAll('.slot.zoomable img'));
      var at = list.indexOf(im); if (at < 0) { list = [im]; at = 0; }
      show(at);
      if (lb.showModal) lb.showModal(); else lb.setAttribute('open', '');
    });
    lb.querySelector('.lb-close').addEventListener('click', close);
    lb.querySelector('.lb-prev').addEventListener('click', function () { show(idx - 1); });
    lb.querySelector('.lb-next').addEventListener('click', function () { show(idx + 1); });
    lb.addEventListener('click', function (e) { if (e.target === lb || e.target.classList.contains('lb-in')) close(); });
    lb.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') show(idx + 1); else if (e.key === 'ArrowRight') show(idx - 1);
    });
    lb.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener('touchend', function (e) {
      if (x0 === null) return; var dx = e.changedTouches[0].clientX - x0; x0 = null;
      if (Math.abs(dx) > 50 && list.length > 1) show(idx + (dx < 0 ? 1 : -1));
    });
  })();

  /* ---------- المهن المتحركة في الرئيسية ---------- */
  (function () {
    var dataEl = document.getElementById('roles-data');
    var box = document.getElementById('roles');
    if (!dataEl || !box) return;
    var roles;
    try { roles = JSON.parse(dataEl.textContent); } catch (e) { return; }
    if (!roles || roles.length < 3) return;
    var prev = document.getElementById('role-prev');
    var main = document.getElementById('role-main');
    var next = document.getElementById('role-next');
    var tag = document.getElementById('tagline');
    var i = 0;
    function paint() {
      var n = roles.length;
      var cur = roles[i], p = roles[(i - 1 + n) % n], nx = roles[(i + 1) % n];
      prev.innerHTML = p.icon; prev.style.setProperty('--tint', p.tint);
      next.innerHTML = nx.icon; next.style.setProperty('--tint', nx.tint);
      main.innerHTML = cur.icon + '<span class="role-text">' + cur.title + '</span>';
      main.style.setProperty('--tint', cur.tint);
      tag.innerHTML = cur.tag;
      box.classList.remove('swap'); tag.classList.remove('swap');
      void box.offsetWidth;
      box.classList.add('swap'); tag.classList.add('swap');
    }
    var timer = null;
    function auto() {
      clearInterval(timer);
      if (reduce || document.hidden) return;
      timer = setInterval(function () { i = (i + 1) % roles.length; paint(); }, 3800);
    }
    function go(d) { i = (i + d + roles.length) % roles.length; paint(); auto(); }
    document.addEventListener('visibilitychange', auto);
    auto();
    main.addEventListener('click', function () { go(1); });
    next.addEventListener('click', function () { go(1); });
    prev.addEventListener('click', function () { go(-1); });
    [main, next, prev].forEach(function (el) {
      el.setAttribute('role', 'button'); el.setAttribute('tabindex', '0');
      el.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(el === prev ? -1 : 1); }
      });
    });
  })();

  /* ---------- تمييز القسم الحالي في القائمة ---------- */
  (function () {
    var links = document.querySelectorAll('.nav a[href^="#"]');
    if (!links.length || !('IntersectionObserver' in window)) return;
    var map = {};
    links.forEach(function (a) { map[a.getAttribute('href').slice(1)] = a; });
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting && map[en.target.id]) {
          links.forEach(function (l) { l.classList.remove('active'); });
          map[en.target.id].classList.add('active');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(map).forEach(function (id) { var el = document.getElementById(id); if (el) spy.observe(el); });
    window.addEventListener('scroll', function () {
      if (window.scrollY < 300) links.forEach(function (l) { l.classList.remove('active'); });
    }, { passive: true });
  })();

  /* ---------- روابط المقاطع التي لم تُضف بعد ---------- */
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href^="#TODO"]');
    if (a) {
      e.preventDefault();
      a.setAttribute('title', 'ضعي رابط المقطع هنا في ملف index.html');
    }
  });
})();
