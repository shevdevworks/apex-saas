'use strict';

(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const precisePointer = matchMedia('(hover: hover) and (pointer: fine)');
  const root = document.documentElement;
  const art = document.querySelector('.hero-art');
  const sculpture = document.querySelector('.flow-sculpture');
  const heroAgent = document.querySelector('.hero-agent');
  const heroEvent = document.querySelector('.hero-event');
  const heroDelivered = document.querySelector('.hero-delivered');
  const header = document.getElementById('site-header');
  const workspace = document.querySelector('.workspace-shell');
  const network = document.querySelector('.integration-map');
  const closingMark = document.querySelector('.cta-mark');
  const navLinks = [...document.querySelectorAll('.desktop-nav a')];
  const sections = [
    ...document.querySelectorAll('#workspace,#how-it-works,#integrations,#pricing'),
  ];
  const ease = 'cubic-bezier(.16,1,.3,1)';
  const activeAnimations = new Set();
  const animationFor = new WeakMap();
  const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, value));
  let paused = false;
  try {
    paused = sessionStorage.getItem('apex-motion-paused') === 'true';
  } catch {
    /* Storage is optional. */
  }
  const motionAllowed = () => !reduced.matches && !paused;

  // Short effects never own visibility. Cancelling them returns the element
  // to its complete, readable CSS state, including during rapid interactions.
  function play(element, keyframes, options = {}) {
    if (!element) return null;
    animationFor.get(element)?.cancel();
    if (!motionAllowed()) return null;
    const animation = element.animate(keyframes, { duration: 650, easing: ease, ...options });
    animationFor.set(element, animation);
    activeAnimations.add(animation);
    animation.finished.then(clean, clean);
    function clean() {
      activeAnimations.delete(animation);
      if (animationFor.get(element) === animation) animationFor.delete(element);
    }
    return animation;
  }

  // An unobtrusive control is available for the ambient motion. The system's
  // reduced-motion setting always takes precedence; the choice lasts this tab.
  const motionButton = document.createElement('button');
  motionButton.type = 'button';
  motionButton.className = 'motion-toggle';
  art.append(motionButton);
  motionButton.addEventListener('click', () => {
    paused = !paused;
    try {
      sessionStorage.setItem('apex-motion-paused', String(paused));
    } catch {
      /* Optional. */
    }
    applyMotionPreference();
  });

  // A fine glint travels along the actual ribbon geometry, so the visual
  // belongs to the product's flow motif rather than to a generic particle effect.
  const ribbonPath = sculpture.querySelector('[stroke="url(#ribbon-main)"]');
  const glint = ribbonPath.cloneNode();
  glint.classList.add('ribbon-glint');
  glint.setAttribute('stroke', '#e5edff');
  glint.setAttribute('stroke-width', '2.4');
  glint.setAttribute('pathLength', '1000');
  glint.setAttribute('stroke-linecap', 'round');
  sculpture.append(glint);

  // Each headline line has a small mask; the h1 text and its semantics stay intact.
  document.querySelectorAll('#hero-title > span').forEach((line) => {
    const text = document.createElement('span');
    text.className = 'hero-line-content';
    text.textContent = line.textContent;
    line.classList.add('hero-line-mask');
    line.replaceChildren(text);
  });

  let heroVisible = true;
  let networkVisible = false;
  let frame = 0;
  let lastFrame = 0;
  let clock = 0;
  let scrollDepth = 0;
  const pointer = { x: 0, y: 0, targetX: 0, targetY: 0 };

  function stopAmbient() {
    cancelAnimationFrame(frame);
    frame = 0;
    lastFrame = 0;
  }
  function syncAmbient() {
    const enabled = motionAllowed() && !document.hidden;
    art.classList.toggle('is-live', enabled && heroVisible);
    network.classList.toggle('is-live', enabled && networkVisible);
    if (enabled && heroVisible) {
      if (!frame) frame = requestAnimationFrame(renderDepth);
    } else stopAmbient();
  }
  function renderDepth(now) {
    frame = 0;
    if (!motionAllowed() || document.hidden || !heroVisible) {
      lastFrame = 0;
      return;
    }
    const delta = lastFrame ? Math.min((now - lastFrame) / 1000, 0.05) : 0.016;
    lastFrame = now;
    clock += delta;
    const smoothing = 1 - Math.exp(-delta * 7);
    pointer.x += (pointer.targetX - pointer.x) * smoothing;
    pointer.y += (pointer.targetY - pointer.y) * smoothing;
    const mobile = innerWidth < 680;
    const amount = mobile ? 0.45 : 1;
    const wave = Math.sin(clock * 0.7);
    const waveB = Math.sin(clock * 0.7 + 1.5);
    const px = pointer.x * amount;
    const py = pointer.y * amount;
    const lift = innerWidth >= 960 ? scrollDepth : 0;
    sculpture.style.translate = `${(px * 20 + wave * 2) * amount}px ${(py * 12 + wave * 7) * amount - lift * 28}px`;
    sculpture.style.rotate = `${wave * 0.55 * amount}deg`;
    heroAgent.style.translate = `${px * 8}px ${(py * 5 - wave * 5) * amount - lift * 9}px`;
    heroAgent.style.setProperty('--tilt-x', `${-py * 3}deg`);
    heroAgent.style.setProperty('--tilt-y', `${px * 5}deg`);
    heroEvent.style.translate = `${px * 14}px ${(py * 9 + waveB * 5) * amount - lift * 17}px`;
    heroDelivered.style.translate = `${px * 22}px ${(py * 12 - waveB * 6) * amount + lift * 5}px`;
    heroAgent.style.setProperty('--light-x', `${50 + px * 35}%`);
    frame = requestAnimationFrame(renderDepth);
  }
  art.addEventListener('pointermove', (event) => {
    if (!motionAllowed() || !precisePointer.matches || event.pointerType === 'touch') return;
    const bounds = art.getBoundingClientRect();
    pointer.targetX = clamp((event.clientX - bounds.left) / bounds.width, 0, 1) - 0.5;
    pointer.targetY = clamp((event.clientY - bounds.top) / bounds.height, 0, 1) - 0.5;
  });
  art.addEventListener('pointerleave', () => {
    pointer.targetX = 0;
    pointer.targetY = 0;
  });

  let viewportFrame = 0;
  function updateViewport() {
    viewportFrame = 0;
    header.classList.toggle('scrolled', scrollY > 16);
    const marker = Math.max(header.offsetHeight + 40, innerHeight * 0.3);
    const active = sections.find((section) => {
      const rect = section.getBoundingClientRect();
      return rect.top <= marker && rect.bottom > marker;
    });
    navLinks.forEach((link) => {
      if (active && link.hash === `#${active.id}`) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
    scrollDepth = clamp(scrollY / innerHeight);
    if (motionAllowed() && innerWidth >= 960) {
      const top = workspace.getBoundingClientRect().top;
      const progress = workspace.contains(document.activeElement)
        ? 1
        : clamp((innerHeight - top) / (innerHeight * 0.65));
      workspace.style.transform =
        progress >= 1
          ? ''
          : `perspective(1400px) rotateX(${(1 - progress) * 5}deg) scale(${0.98 + progress * 0.02})`;
    } else workspace.style.transform = '';
    if (motionAllowed()) {
      const rect = document.querySelector('.final-cta').getBoundingClientRect();
      const progress = clamp((innerHeight - rect.top) / (innerHeight + rect.height));
      closingMark.style.translate = `0 ${(1 - progress) * 34}px`;
      closingMark.style.rotate = `${(1 - progress) * -9}deg`;
    }
    updateTabIndicator();
  }
  function requestViewport() {
    if (!viewportFrame) viewportFrame = requestAnimationFrame(updateViewport);
  }
  addEventListener('scroll', requestViewport, { passive: true });
  addEventListener('resize', requestViewport, { passive: true });
  workspace.addEventListener('focusin', requestViewport);

  function heroEntrance() {
    if (!motionAllowed()) return;
    play(
      document.querySelector('.hero-intro'),
      [
        { opacity: 0, translate: '0 10px' },
        { opacity: 1, translate: '0 0' },
      ],
      { duration: 650, fill: 'backwards' },
    );
    document.querySelectorAll('.hero-line-content').forEach((line, index) => {
      play(
        line,
        [
          { transform: 'translateY(108%) rotate(2deg)' },
          { transform: 'translateY(0) rotate(0deg)' },
        ],
        { duration: 1100, delay: 90 + index * 140, fill: 'backwards' },
      );
    });
    ['.hero-description', '.hero-actions', '.hero-footnote'].forEach((selector, index) => {
      play(
        document.querySelector(selector),
        [
          { opacity: 0, translate: '0 15px' },
          { opacity: 1, translate: '0 0' },
        ],
        { duration: 850, delay: 330 + index * 80, fill: 'backwards' },
      );
    });
    play(
      sculpture,
      [
        { opacity: 0, transform: 'rotate(-8deg) scale(.9)' },
        { opacity: 1, transform: 'rotate(6deg) scale(1)' },
      ],
      { duration: 1550, delay: 80, fill: 'backwards' },
    );
    [
      [heroEvent, 300],
      [heroAgent, 460],
      [heroDelivered, 900],
    ].forEach(([element, delay]) => {
      play(
        element,
        [
          { opacity: 0, translate: '0 28px', filter: 'blur(3px)' },
          { opacity: 1, translate: '0 0', filter: 'blur(0)' },
        ],
        { duration: 1050, delay, fill: 'backwards' },
      );
    });
    document.querySelectorAll('.agent-task').forEach((row, index) => {
      play(
        row,
        [
          { opacity: 0, translate: '10px 0' },
          { opacity: 1, translate: '0 0' },
        ],
        { duration: 650, delay: 1050 + index * 140, fill: 'backwards' },
      );
      play(
        row.querySelector('.task-check'),
        [
          { scale: '.4', opacity: 0 },
          { scale: '1', opacity: 1 },
        ],
        { duration: 450, delay: 1200 + index * 140, fill: 'backwards' },
      );
    });
    setTimeout(() => art.classList.add('intro-complete'), 1250);
  }

  const tabs = document.querySelector('.scenario-tabs');
  const tabIndicator = document.createElement('span');
  tabIndicator.className = 'tab-motion-indicator';
  tabIndicator.setAttribute('aria-hidden', 'true');
  tabs.append(tabIndicator);
  function updateTabIndicator() {
    const selected = tabs.querySelector('[aria-selected="true"]');
    tabIndicator.style.width = `${selected.offsetWidth}px`;
    tabIndicator.style.transform = `translateX(${selected.offsetLeft}px)`;
  }
  if ('ResizeObserver' in window) new ResizeObserver(updateTabIndicator).observe(tabs);

  function revealSetup(key) {
    const view = document.querySelector(`[data-view="${key}"]`);
    const panel = view.querySelector('.mini-window');
    play(
      panel,
      [
        { opacity: 0.25, translate: '22px 8px', rotate: '2deg' },
        { opacity: 1, translate: '0 0', rotate: '0deg' },
      ],
      { duration: 620 },
    );
    const children = view.querySelectorAll(
      '.connection-row,.rule-example,.approval-request,.approval-person',
    );
    children.forEach((child, index) =>
      play(
        child,
        [
          { opacity: 0.2, translate: '12px 0' },
          { opacity: 1, translate: '0 0' },
        ],
        { duration: 500, delay: 80 + index * 75, fill: 'backwards' },
      ),
    );
    play(
      view.querySelector('.floating-note'),
      [
        { opacity: 0, translate: '0 12px' },
        { opacity: 1, translate: '0 0' },
      ],
      { duration: 500, delay: 220, fill: 'backwards' },
    );
  }
  document.addEventListener('apex:scenario', () => {
    updateTabIndicator();
    document.querySelectorAll('.flow-node').forEach((node, index) =>
      play(
        node,
        [
          { opacity: 0.3, translate: '0 10px' },
          { opacity: 1, translate: '0 0' },
        ],
        { duration: 450, delay: index * 55, fill: 'backwards' },
      ),
    );
    play(
      document.querySelector('.flow-toolbar > div'),
      [
        { opacity: 0.25, translate: '6px 0' },
        { opacity: 1, translate: '0 0' },
      ],
      { duration: 400 },
    );
  });
  document.addEventListener('apex:step', (event) => {
    const node = document.querySelector(`[data-node="${event.detail.step}"]`);
    play(
      node.querySelector('.app-icon'),
      [{ scale: '.85' }, { scale: '1.1', offset: 0.6 }, { scale: '1' }],
      { duration: 500 },
    );
  });
  document.addEventListener('apex:complete', () => {
    play(
      document.querySelector('.flow-inspector'),
      [
        { backgroundColor: '#e7eeff', boxShadow: '0 0 0 4px #3c5bff16' },
        { backgroundColor: '#f7f9ff', boxShadow: '0 0 0 0px #3c5bff00' },
      ],
      { duration: 1000 },
    );
  });
  document.addEventListener('apex:walkthrough', (event) => revealSetup(event.detail.key));
  document.addEventListener('apex:approval', (event) => {
    if (!event.detail.approved) return;
    const button = document.getElementById('approve-example');
    play(
      button.querySelector('svg'),
      [
        { scale: '.7', rotate: '-20deg' },
        { scale: '1.2', rotate: '6deg', offset: 0.65 },
        { scale: '1', rotate: '0deg' },
      ],
      { duration: 600 },
    );
    play(button, [{ boxShadow: '0 0 0 0px #3c5bff35' }, { boxShadow: '0 0 0 13px #3c5bff00' }], {
      duration: 700,
    });
  });
  document.addEventListener('apex:pricing', () => {
    for (const id of ['starter-price', 'growth-price', 'volume-output']) {
      play(
        document.getElementById(id),
        [
          { opacity: 0.2, translate: '0 9px', filter: 'blur(2px)' },
          { opacity: 1, translate: '0 0', filter: 'blur(0)' },
        ],
        { duration: 420 },
      );
    }
  });
  document.addEventListener('apex:dialog', () => {
    play(
      document.getElementById('plan-dialog'),
      [
        { opacity: 0, translate: '0 14px', scale: '.98' },
        { opacity: 1, translate: '0 0', scale: '1' },
      ],
      { duration: 320 },
    );
  });

  // Native details semantics, with a reversible height transition. State is
  // committed on finish or cancellation so reduced motion never strands it.
  const accordions = new Map();
  document.querySelectorAll('.faq-list details').forEach((details) => {
    const summary = details.querySelector('summary');
    const content = details.querySelector('div');
    summary.addEventListener('click', (event) => {
      if (!motionAllowed()) return; // Preserve the browser's native toggle.
      event.preventDefault();
      const previous = accordions.get(details);
      const opening = previous ? !previous.opening : !details.open;
      const from = details.open ? content.getBoundingClientRect().height : 0;
      if (previous) {
        previous.animation.oncancel = null;
        previous.animation.onfinish = null;
        previous.animation.cancel();
      }
      details.open = true;
      const to = opening ? content.getBoundingClientRect().height : 0;
      const animation = play(
        content,
        [
          { height: `${from}px`, opacity: opening ? 0.4 : 1 },
          { height: `${to}px`, opacity: opening ? 1 : 0 },
        ],
        { duration: 330 },
      );
      accordions.set(details, { animation, opening });
      const finish = () => {
        if (accordions.get(details)?.animation !== animation) return;
        details.open = opening;
        accordions.delete(details);
      };
      animation.onfinish = finish;
      animation.oncancel = finish;
    });
  });

  function applyMotionPreference() {
    root.dataset.motion = motionAllowed() ? 'on' : 'off';
    motionButton.hidden = reduced.matches;
    const label = paused ? 'Resume animations' : 'Pause animations';
    motionButton.setAttribute('aria-label', label);
    motionButton.title = label;
    motionButton.innerHTML = paused
      ? '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="m7 5 8 5-8 5Z" fill="currentColor"/></svg>'
      : '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M7 5v10m6-10v10" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';
    if (!motionAllowed()) {
      activeAnimations.forEach((animation) => animation.cancel());
      [sculpture, heroAgent, heroEvent, heroDelivered, closingMark].forEach((element) => {
        element.style.translate = '';
        element.style.rotate = '';
      });
      heroAgent.style.removeProperty('--tilt-x');
      heroAgent.style.removeProperty('--tilt-y');
      workspace.style.transform = '';
      pointer.x = pointer.y = pointer.targetX = pointer.targetY = 0;
    }
    syncAmbient();
    requestViewport();
  }
  reduced.addEventListener('change', applyMotionPreference);
  document.addEventListener('visibilitychange', () => {
    activeAnimations.forEach((animation) => {
      if (document.hidden) animation.pause();
      else if (motionAllowed()) animation.play();
    });
    syncAmbient();
  });

  root.classList.add('motion-ready');
  applyMotionPreference();
  if ('IntersectionObserver' in window) {
    const visibility = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.target === art) heroVisible = entry.isIntersecting;
        if (entry.target === network) networkVisible = entry.isIntersecting;
      });
      syncAmbient();
    });
    visibility.observe(art);
    visibility.observe(network);
    const entrance = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          if (entry.target === network) {
            play(
              network.querySelector('.network-center'),
              [
                { opacity: 0.2, scale: '.8' },
                { opacity: 1, scale: '1' },
              ],
              { duration: 800 },
            );
            network.querySelectorAll('.network-app').forEach((app, index) =>
              play(
                app,
                [
                  { opacity: 0, translate: '0 15px' },
                  { opacity: 1, translate: '0 0' },
                ],
                { duration: 650, delay: 100 + index * 65, fill: 'backwards' },
              ),
            );
          } else revealSetup(document.querySelector('.how-step[aria-selected="true"]').dataset.how);
          entrance.unobserve(entry.target);
        }),
      { threshold: 0.3 },
    );
    entrance.observe(network);
    entrance.observe(document.querySelector('.how-preview'));
  }
  Promise.race([document.fonts.ready, new Promise((resolve) => setTimeout(resolve, 350))]).then(
    () => {
      updateViewport();
      heroEntrance();
    },
  );
})();
