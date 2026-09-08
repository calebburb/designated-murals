// Designated — motion layer
document.documentElement.classList.add('js');

(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // --- Word-rise headlines: wrap each word in a masked span ---
  document.querySelectorAll('[data-words]').forEach(el => {
    let i = 0;
    const wrap = node => {
      if (node.nodeType === Node.TEXT_NODE) {
        const frag = document.createDocumentFragment();
        node.textContent.split(/(\s+)/).forEach(part => {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
          const w = document.createElement('span');
          w.className = 'w';
          const inner = document.createElement('span');
          inner.style.setProperty('--wi', i++);
          inner.textContent = part;
          w.appendChild(inner);
          frag.appendChild(w);
        });
        node.replaceWith(frag);
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        [...node.childNodes].forEach(wrap);
      }
    };
    [...el.childNodes].forEach(wrap);
    el.style.setProperty('--nw', i); // lets the accent sweep wait for the last word
  });

  // --- Stagger groups: assign incremental --d to children ---
  document.querySelectorAll('[data-stagger]').forEach(group => {
    const step = +group.dataset.stagger || 90;
    [...group.children].forEach((c, i) => c.style.setProperty('--d', (i * step) + 'ms'));
  });

  // --- Reveal engine ---
  // Deterministic scroll-position checks instead of IntersectionObserver:
  // IO delivery can lag after navigations, which leaves sections invisible.
  const pending = new Set(
    document.querySelectorAll('.reveal, [data-words], .bleed, .badge-pop, .eyebrow, [data-count]')
  );
  let armed = false; // reveals wait for the loader to finish

  const runCounter = el => {
    const target = +el.dataset.count, suffix = el.dataset.suffix || '';
    if (reduced) { el.textContent = target + suffix; return; }
    const t0 = performance.now(), dur = 1100;
    const tick = t => {
      const p = Math.min((t - t0) / dur, 1), eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  const checkPending = () => {
    if (!armed) return;
    const limit = innerHeight * 0.92;
    for (const el of pending) {
      const r = el.getBoundingClientRect();
      // top above the view line = seen now or already scrolled past; either way it stays revealed
      if (r.top < limit) {
        pending.delete(el);
        if (el.dataset.count !== undefined) runCounter(el);
        else el.classList.add('in');
      }
    }
  };

  // --- Parallax, process spine, header hide/show ---
  const plx = [...document.querySelectorAll('[data-parallax]')];
  const spine = document.querySelector('.spine');
  let lastY = 0, ticking = false;
  const onScroll = () => {
    checkPending(); // direct call: rAF can starve in headless/background contexts
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      const y = scrollY;
      if (!reduced) plx.forEach(el => {
        el.style.transform = `translateY(${(y * +el.dataset.parallax).toFixed(1)}px)`;
      });
      if (spine) {
        const r = spine.getBoundingClientRect();
        const p = Math.min(Math.max((innerHeight * 0.85 - r.top) / r.height, 0), 1);
        spine.style.setProperty('--spine', p.toFixed(3));
      }
      const wrap = document.querySelector('.site-header-wrap');
      if (wrap) {
        wrap.classList.toggle('hidden', y > lastY && y > 160);
        lastY = y;
      }
    });
  };
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll, { passive: true });

  const initMotion = () => { armed = true; checkPending(); onScroll(); };
  const sweep = setInterval(() => { if (pending.size) checkPending(); else clearInterval(sweep); }, 400);

  // --- Hero work cycler: layers wipe in, captions follow ---
  document.querySelectorAll('[data-cycle]').forEach(stage => {
    const layers = [...stage.querySelectorAll('.hc-layer')];
    const caption = stage.querySelector('.hc-caption');
    if (layers.length < 2 || reduced) return;
    let cur = 0;
    layers[0].classList.add('on');
    setInterval(() => {
      if (document.hidden) return;
      const next = (cur + 1) % layers.length;
      const l = layers[next];
      l.classList.add('incoming');
      l.classList.add('on');
      requestAnimationFrame(() => requestAnimationFrame(() => l.classList.remove('incoming')));
      if (caption) {
        caption.classList.add('swap');
        setTimeout(() => {
          caption.textContent = l.dataset.label || '';
          caption.classList.remove('swap');
        }, 300);
      }
      setTimeout(() => { layers[cur].classList.remove('on'); cur = next; }, 1000);
    }, +stage.dataset.cycle || 4200);
  });

  // --- Loading animation: the Momentum Mark ---
  // The inline head script adds html.loading (first visit per session,
  // motion allowed) before first paint; the page waits under an ivory
  // screen while the mark breathes in, floods copper, and lifts.
  if (document.documentElement.classList.contains('loading')) {
    try { sessionStorage.dsgSeen = '1'; } catch (e) {}
    const loader = document.createElement('div');
    loader.className = 'loader';
    loader.setAttribute('aria-hidden', 'true');
    loader.innerHTML = '<div class="loader-stack"><div class="loader-mark"></div><div class="loader-word">Designated</div></div>';
    document.body.appendChild(loader);
    const mark = loader.querySelector('.loader-mark');

    setTimeout(() => {
      loader.classList.add('flood');
      const s = (Math.hypot(innerWidth, innerHeight) / 96) * 1.1;
      mark.style.transform = `scale(${s.toFixed(2)})`;
    }, 1250);
    setTimeout(() => {
      // page becomes visible beneath the copper, then the screen lifts
      document.documentElement.classList.remove('loading');
      loader.classList.add('done');
      initMotion();
      setTimeout(() => loader.remove(), 700);
    }, 1950);
  } else {
    initMotion();
  }

  // --- Copper cursor dot (fine pointers only) ---
  if (matchMedia('(pointer: fine)').matches && !reduced) {
    const dot = document.createElement('div');
    dot.id = 'cursor';
    document.body.appendChild(dot);
    let tx = 0, ty = 0, cx = 0, cy = 0, seen = false;
    addEventListener('mousemove', e => {
      tx = e.clientX; ty = e.clientY;
      if (!seen) { seen = true; cx = tx; cy = ty; dot.classList.add('on'); loop(); }
    }, { passive: true });
    const loop = () => {
      cx += (tx - cx) * 0.22; cy += (ty - cy) * 0.22;
      dot.style.transform = `translate(${cx}px, ${cy}px)`;
      requestAnimationFrame(loop);
    };
    addEventListener('mouseover', e => {
      dot.classList.toggle('grow', !!e.target.closest('a, button, label, input, select, textarea'));
    }, { passive: true });
    document.documentElement.addEventListener('mouseleave', () => dot.classList.remove('on'));
    document.documentElement.addEventListener('mouseenter', () => seen && dot.classList.add('on'));
  }
})();
