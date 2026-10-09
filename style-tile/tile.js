/* Aron Jay Consuelo — Style Tile v0.1
   Vanilla JS, no dependencies. Every effect degrades to static content. */
(function () {
  'use strict';

  var root = document.documentElement;
  var isEmbedded = root.classList.contains('is-embedded');
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  var reduced = function () { return root.dataset.motion === 'reduced'; };
  var clamp01 = function (v) { return Math.min(1, Math.max(0, v)); };
  var easeOut = function (t) { return 1 - Math.pow(1 - t, 3); };

  /* ---------- Placeholder screenshots ---------- */
  var MOCKS = {
    coffee: { brand: 'Northbound', links: ['Shop', 'Roastery', 'Journal'], navCta: 'Cart (0)', eyebrow: 'Small-batch roastery', title: 'Coffee for the slow morning.', sub: 'Single-origin beans, roasted every Thursday and shipped while they still smell of the roaster.', cta: 'Shop the beans', art: '<span class="a1"></span><span class="a2"></span><span class="a3 tx">Ethiopia Guji · 250g</span>' },
    ledger: { brand: 'Ledgerly', links: ['Product', 'Pricing', 'Customers'], navCta: 'Sign in', eyebrow: 'Accounting for small studios', title: 'Your books, finally calm.', sub: 'Invoices, expenses and tax estimates in one quiet dashboard built for freelancers.', cta: 'Start free trial', art: '<span class="a1"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></span><span class="a2 tx">+18.4% this quarter</span>' },
    clinic: { brand: 'Kindred Clinic', links: ['Services', 'Doctors', 'Locations'], navCta: 'Book', eyebrow: 'Community health', title: 'Book a doctor in under a minute.', sub: 'Real-time availability across six neighbourhood clinics, with reminders that actually help.', cta: 'Find a slot', art: '<span class="a1"></span><span class="a2 tx">Thu 10:30 · Dr. Reyes</span>' },
    game: { brand: 'PICO-8', links: ['Play', 'Controls', 'About'], navCta: '▶ Start', eyebrow: 'Press ❎ to start', title: 'Your game title here', sub: 'A 128×128 pixel game, playable right here in the browser with keyboard, gamepad or touch.', cta: 'Play now', art: spriteHTML() }
  };

  function spriteHTML() {
    var map = ['..rrrr..', '.rrrrrr.', '.pkppkp.', '.pppppp.', '..pppp..', '.bbbbbb.', 'b.bbbb.b', '..o..o..'];
    var pal = { r: '#FF004D', p: '#FFCCAA', k: '#000000', b: '#29ADFF', o: '#FFA300' };
    var cells = map.join('').split('').map(function (c) {
      return '<i style="background:' + (pal[c] || 'transparent') + '"></i>';
    }).join('');
    return '<span class="sprite">' + cells + '</span><span class="floor"></span>';
  }

  function mockHTML(key, structure) {
    var m = MOCKS[key];
    return '<div class="mock' + (structure ? ' is-structure' : '') + '" data-variant="' + key + '" aria-hidden="true">' +
      '<div class="mock__nav" data-s="NAV"><span class="mock__brand tx">' + m.brand + '</span>' +
        '<span class="mock__links" data-s="LINKS">' + m.links.map(function (l) { return '<span class="tx">' + l + '</span>'; }).join('') + '</span>' +
        '<span class="mock__navcta" data-s="BTN"><span class="tx">' + m.navCta + '</span></span></div>' +
      '<div class="mock__body"><div class="mock__copy">' +
        '<p class="mock__eyebrow" data-s="LABEL"><span class="tx">' + m.eyebrow + '</span></p>' +
        '<p class="mock__title" data-s="H1"><span class="tx">' + m.title + '</span></p>' +
        '<p class="mock__sub" data-s="BODY"><span class="tx">' + m.sub + '</span></p>' +
        '<span class="mock__cta" data-s="CTA"><span class="tx">' + m.cta + '</span></span>' +
      '</div><div class="mock__art" data-s="MEDIA">' + m.art + '</div></div></div>';
  }

  document.querySelectorAll('[data-mock]').forEach(function (el) {
    el.innerHTML = mockHTML(el.dataset.mock, el.hasAttribute('data-structure'));
  });
  document.querySelectorAll('[data-mock-lens]').forEach(function (el) {
    var key = el.dataset.mockLens;
    el.insertAdjacentHTML('afterbegin', mockHTML(key, false) + mockHTML(key, true));
  });

  /* ---------- Motion preference ---------- */
  var motionBtns = document.querySelectorAll('[data-motion-toggle]');
  function syncMotion() {
    var full = !reduced();
    motionBtns.forEach(function (b) {
      b.setAttribute('aria-pressed', String(full));
      b.querySelector('[data-motion-label]').textContent = full ? 'On' : 'Reduced';
    });
    if (!full) {
      // Drop scroll-driven inline values so the static CSS layout takes over.
      document.querySelectorAll('[data-scene]').forEach(function (s) {
        ['--t1', '--t2'].forEach(function (p) { s.style.removeProperty(p); });
      });
      document.querySelectorAll('.reveal, .fade-up, .draw').forEach(function (el) { el.classList.add('is-in'); });
    }
    requestUpdate();
  }
  motionBtns.forEach(function (b) {
    b.addEventListener('click', function () {
      root.dataset.motion = reduced() ? 'full' : 'reduced';
      try { localStorage.setItem('ajc-motion', root.dataset.motion); } catch (e) {}
      syncMotion();
    });
  });

  /* ---------- Reveals ---------- */
  document.querySelectorAll('.reveal').forEach(function (el) {
    el.querySelectorAll('.line > span').forEach(function (s, i) { s.style.setProperty('--i', i); });
  });
  var revealIO = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add('is-in'); revealIO.unobserve(e.target); }
    });
  }, { rootMargin: '0px 0px -8% 0px' });
  document.querySelectorAll('.reveal, .fade-up, .draw').forEach(function (el) { revealIO.observe(el); });

  document.querySelectorAll('[data-replay]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var t = document.getElementById(btn.dataset.replay);
      t.classList.add('is-resetting');
      t.classList.remove('is-in');
      void t.offsetWidth;
      t.classList.remove('is-resetting');
      requestAnimationFrame(function () { t.classList.add('is-in'); });
    });
  });

  /* ---------- Depth gauge + layer bar ---------- */
  var layers = Array.prototype.slice.call(document.querySelectorAll('[data-layer]'));
  var gaugeLinks = document.querySelectorAll('.gauge a');
  var topNum = document.querySelector('[data-topbar-num]');
  var topName = document.querySelector('[data-topbar-name]');
  function setActiveLayer(el) {
    var id = el.id;
    gaugeLinks.forEach(function (a) {
      if (a.getAttribute('href') === '#' + id) a.setAttribute('aria-current', 'location');
      else a.removeAttribute('aria-current');
    });
    if (topNum) topNum.textContent = el.dataset.layer;
    if (topName) topName.textContent = el.dataset.name;
  }
  var layerIO = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { if (e.isIntersecting) setActiveLayer(e.target); });
  }, { rootMargin: '-45% 0px -50% 0px' });
  layers.forEach(function (l) { layerIO.observe(l); });
  if (layers[0]) setActiveLayer(layers[0]);

  /* ---------- Grid overlay ---------- */
  var gridBtns = document.querySelectorAll('[data-grid-toggle]');
  function toggleGrid() {
    var on = root.classList.toggle('show-grid');
    gridBtns.forEach(function (b) { b.setAttribute('aria-pressed', String(on)); });
  }
  gridBtns.forEach(function (b) { b.addEventListener('click', toggleGrid); });
  window.addEventListener('keydown', function (e) {
    if (e.key && e.key.toLowerCase() === 'g' && !e.metaKey && !e.ctrlKey && !e.altKey &&
        !(e.target.closest && e.target.closest('input, textarea, select, [contenteditable]'))) toggleGrid();
  });

  /* ---------- Menu dialog ---------- */
  var menu = document.getElementById('menu');
  var openBtn = document.querySelector('[data-open-menu]');
  if (menu && openBtn && typeof menu.showModal === 'function') {
    openBtn.addEventListener('click', function () { menu.showModal(); openBtn.setAttribute('aria-expanded', 'true'); });
    menu.querySelectorAll('a, [data-close-menu]').forEach(function (el) {
      el.addEventListener('click', function () { menu.close(); });
    });
    menu.addEventListener('close', function () { openBtn.setAttribute('aria-expanded', 'false'); });
  }

  /* ---------- Structure lens ---------- */
  document.querySelectorAll('[data-lens]').forEach(function (lens) {
    var top = lens.querySelector('.mock.is-structure');
    var ring = lens.querySelector('.lens__ring');
    var divider = lens.querySelector('.lens__divider');
    var range = document.getElementById(lens.dataset.lens);
    var out = document.getElementById('lens-out');
    var split = 0, last = { x: 0, y: 0 };

    function circle(x, y, r) {
      top.style.clipPath = 'circle(' + r + 'px at ' + x + 'px ' + y + 'px)';
      ring.style.width = ring.style.height = (2 * r) + 'px';
      ring.style.transform = 'translate(' + (x - r) + 'px,' + (y - r) + 'px)';
    }
    lens.addEventListener('pointermove', function (e) {
      if (split > 0 || e.pointerType !== 'mouse') return;
      var b = lens.getBoundingClientRect();
      last = { x: e.clientX - b.left, y: e.clientY - b.top };
      circle(last.x, last.y, b.width * 0.15);
      lens.classList.add('is-lensing');
    });
    lens.addEventListener('pointerleave', function () {
      if (split > 0) return;
      lens.classList.remove('is-lensing');
      top.style.clipPath = 'circle(0px at ' + last.x + 'px ' + last.y + 'px)';
    });
    if (range) {
      range.addEventListener('input', function () {
        split = Number(range.value);
        lens.classList.remove('is-lensing');
        lens.classList.toggle('is-split', split > 0);
        top.style.clipPath = split > 0 ? 'inset(0 ' + (100 - split) + '% 0 0)' : 'circle(0px at 50% 50%)';
        divider.style.left = split + '%';
        if (out) out.textContent = split + '%';
        range.setAttribute('aria-valuetext', split === 0 ? 'Structure hidden' : split + '% of the screenshot shows its structure');
      });
    }
  });

  /* ---------- Index: filter + floating preview ---------- */
  var filterBtns = document.querySelectorAll('[data-filter]');
  var rows = Array.prototype.slice.call(document.querySelectorAll('.index-row'));
  var filterStatus = document.getElementById('filter-status');
  filterBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var f = btn.dataset.filter, n = 0;
      filterBtns.forEach(function (b) { b.setAttribute('aria-pressed', String(b === btn)); });
      rows.forEach(function (r) {
        var show = f === 'all' || r.dataset.cats.split(' ').indexOf(f) !== -1;
        r.hidden = !show;
        if (show) n++;
      });
      if (filterStatus) filterStatus.textContent = 'Showing ' + n + ' of ' + rows.length + ' projects';
    });
  });

  var index = document.querySelector('[data-index]');
  var fp = document.querySelector('.float-preview');
  if (index && fp) {
    var frames = fp.querySelectorAll('.frame');
    var pos = { x: 0, y: 0 }, target = { x: 0, y: 0 }, raf = 0, shown = false;
    var canPreview = function () { return finePointer.matches && window.innerWidth >= 720; };

    function place() {
      var k = reduced() ? 1 : 0.16;
      pos.x += (target.x - pos.x) * k;
      pos.y += (target.y - pos.y) * k;
      var w = fp.offsetWidth, h = fp.offsetHeight;
      var x = pos.x + 32;
      if (x + w > window.innerWidth - 16) x = pos.x - w - 32;
      var y = Math.min(Math.max(pos.y - h / 2, 16), window.innerHeight - h - 16);
      fp.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0)';
      raf = (Math.abs(target.x - pos.x) > 0.5 || Math.abs(target.y - pos.y) > 0.5) ? requestAnimationFrame(place) : 0;
    }
    index.addEventListener('pointermove', function (e) {
      target.x = e.clientX; target.y = e.clientY;
      if (!raf) raf = requestAnimationFrame(place);
    });
    rows.forEach(function (r) {
      r.querySelector('a').addEventListener('pointerenter', function (e) {
        if (!canPreview()) return;
        frames.forEach(function (f) { f.classList.toggle('is-active', f.dataset.key === r.dataset.mockKey); });
        if (!shown) { pos.x = target.x = e.clientX; pos.y = target.y = e.clientY; place(); }
        shown = true;
        fp.classList.add('is-visible');
      });
    });
    index.addEventListener('pointerleave', function () { shown = false; fp.classList.remove('is-visible'); });
  }

  /* ---------- Scroll-driven scenes ---------- */
  var strata = document.querySelector('[data-scene="strata"]');
  var steps = strata ? strata.querySelectorAll('.steps li') : [];
  var topbar = document.querySelector('.topbar');
  var ticking = false, lastStep = 0;

  function requestUpdate() {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }

  function sceneProgress(el, vh) {
    var r = el.getBoundingClientRect();
    if (r.bottom < -vh || r.top > vh * 2) return null;
    return clamp01(-r.top / Math.max(1, r.height - vh));
  }

  function update() {
    ticking = false;
    var vh = window.innerHeight;
    var max = document.documentElement.scrollHeight - vh;
    if (topbar) topbar.style.setProperty('--progress', max > 0 ? (window.scrollY / max).toFixed(4) : 0);
    if (reduced()) return;

    if (strata) {
      var p = sceneProgress(strata, vh);
      if (p !== null) {
        var t1 = easeOut(clamp01((p - 0.1) / 0.32));
        var t2 = easeOut(clamp01((p - 0.55) / 0.32));
        strata.style.setProperty('--t1', t1.toFixed(4));
        strata.style.setProperty('--t2', t2.toFixed(4));
        var step = t1 < 0.5 ? 0 : (t2 < 0.5 ? 1 : 2);
        if (step !== lastStep) {
          lastStep = step;
          steps.forEach(function (s, i) { s.toggleAttribute('data-active', i === step); });
        }
      }
    }
  }
  window.addEventListener('scroll', requestUpdate, { passive: true });
  window.addEventListener('resize', requestUpdate);

  /* ---------- Copy email ---------- */
  document.querySelectorAll('[data-copy]').forEach(function (btn) {
    var label = btn.querySelector('[data-copy-label]');
    var status = document.getElementById('copy-status');
    btn.addEventListener('click', function () {
      var done = function (ok) {
        btn.classList.toggle('is-copied', ok);
        label.textContent = ok ? 'Copied' : 'Press Ctrl+C';
        if (status) status.textContent = ok ? 'Email address copied to clipboard' : 'Copy failed. Select the address and copy it manually.';
        setTimeout(function () { btn.classList.remove('is-copied'); label.textContent = 'Copy'; }, 2200);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(btn.dataset.copy).then(function () { done(true); }, function () { done(false); });
      } else { done(false); }
    });
  });

  /* ---------- Live phones (top-level page only) ---------- */
  if (!isEmbedded) {
    var phoneIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.src = new URL(e.target.dataset.src, window.location.href).href;
        phoneIO.unobserve(e.target);
      });
    }, { rootMargin: '800px 0px' });
    document.querySelectorAll('iframe[data-src]').forEach(function (f) { phoneIO.observe(f); });
  }

  syncMotion();
  update();
})();
