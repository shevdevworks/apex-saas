/**
 * script.js — ApexSaaS Navigation + Pricing Calculator
 *
 * Modules:
 *   1. initSmoothScroll    — smooth anchor scrolling
 *   2. initActiveNav       — IntersectionObserver for active nav link
 *   3. initBurger          — mobile nav drawer
 *   4. initHeaderScroll    — header backdrop on scroll
 *   5. initPricing         — pricing calculator (index-based architecture)
 *
 * Why pricing is here and not in app.js:
 *   app.js contained the old PricingCalculator using real min/max values.
 *   The new architecture is index-based (0–6). To avoid conflicts,
 *   the old call is disabled in app.js — this module is the sole owner of the slider.
 */

'use strict';


/* ============================================================
   1. SMOOTH SCROLL
============================================================ */
function initSmoothScroll() {
  document.querySelectorAll('.nav__link').forEach(link => {
    link.addEventListener('click', e => {
      const href = link.getAttribute('href');
      if (!href?.startsWith('#')) return;
      const target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      closeMobileMenu();
    });
  });
}


/* ============================================================
   2. ACTIVE LINK — IntersectionObserver
   Winner algorithm: the section with the highest
   intersectionRatio at any given moment wins.
============================================================ */
function initActiveNav() {
  const navLinks = document.querySelectorAll('.nav__links .nav__link');
  if (!navLinks.length) return;

  const linkMap = new Map();
  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (!href?.startsWith('#')) return;
    const id = href.slice(1);
    if (document.getElementById(id)) linkMap.set(id, link);
  });
  if (!linkMap.size) return;

  const visibilityMap = new Map();
  linkMap.forEach((_, id) => visibilityMap.set(id, 0));

  function updateActiveLink() {
    let maxRatio = -1;
    let activeId = null;
    visibilityMap.forEach((ratio, id) => {
      if (ratio > maxRatio) { maxRatio = ratio; activeId = id; }
    });
    linkMap.forEach((link, id) => {
      link.classList.toggle('nav__link--active', id === activeId && maxRatio > 0);
    });
  }

  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => visibilityMap.set(e.target.id, e.intersectionRatio));
    updateActiveLink();
  }, {
    rootMargin: '-15% 0px -70% 0px',
    threshold: Array.from({ length: 21 }, (_, i) => i / 20),
  });

  linkMap.forEach((_, id) => {
    const el = document.getElementById(id);
    if (el) observer.observe(el);
  });
}


/* ============================================================
   3. MOBILE MENU
============================================================ */
function closeMobileMenu(returnFocus = false) {
  const burger    = document.querySelector('.nav__burger');
  const mobileNav = document.getElementById('mobile-nav');
  if (!burger || !mobileNav) return;
  burger.setAttribute('aria-expanded', 'false');
  mobileNav.setAttribute('aria-hidden', 'true');
  // On Escape close, return focus to the burger button — otherwise focus
  // disappears into the now-hidden drawer, breaking keyboard navigation.
  if (returnFocus) burger.focus();
}

function initBurger() {
  const burger    = document.querySelector('.nav__burger');
  const mobileNav = document.getElementById('mobile-nav');
  const header    = document.getElementById('header');
  if (!burger || !mobileNav) return;

  burger.addEventListener('click', () => {
    const isOpen = burger.getAttribute('aria-expanded') === 'true';
    burger.setAttribute('aria-expanded', String(!isOpen));
    mobileNav.setAttribute('aria-hidden', String(isOpen));

    // On open — move focus to the first menu link.
    // Without this, keyboard/screen-reader users have no indication
    // the menu opened — focus just stays on the burger button.
    if (!isOpen) {
      mobileNav.querySelector('a')?.focus();
    }
  });

  document.addEventListener('click', e => {
    if (!header?.contains(e.target)) closeMobileMenu();
  });

  // Escape closes the menu and returns focus to the burger button —
  // standard accessibility pattern for disclosure menus.
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && burger.getAttribute('aria-expanded') === 'true') {
      closeMobileMenu(true);
    }
  });
}


/* ============================================================
   4. HEADER BACKDROP
   IntersectionObserver on a sentinel element — more efficient
   than a scroll event listener.
============================================================ */
function initHeaderScroll() {
  const header = document.getElementById('header');
  if (!header) return;

  const sentinel = document.createElement('div');
  sentinel.style.cssText =
    'position:absolute;top:80px;left:0;width:1px;height:1px;pointer-events:none;';
  document.body.prepend(sentinel);

  new IntersectionObserver(
    ([entry]) => header.classList.toggle('header--scrolled', !entry.isIntersecting),
    { threshold: 0 }
  ).observe(sentinel);
}


/* ============================================================
   5. PRICING CALCULATOR — index-based architecture
   The slider uses 7 discrete indices (0-6) instead of raw user
   counts, so the thumb snaps evenly to each tick label instead
   of drifting between unevenly spaced values. See TIERS below
   for the index -> users/tier/price mapping.
============================================================ */
function initPricing() {

  /* ── Tier data ── */
  const TIERS = [
    { index: 0, users: 1_000,   label: '1,000 users',   card: 'starter',    proPrice: 99  },
    { index: 1, users: 2_000,   label: '2,000 users',   card: 'starter',    proPrice: 99  },
    { index: 2, users: 5_000,   label: '5,000 users',   card: 'pro',        proPrice: 149 },
    { index: 3, users: 10_000,  label: '10,000 users',  card: 'pro',        proPrice: 199 },
    { index: 4, users: 25_000,  label: '25,000 users',  card: 'pro',        proPrice: 249 },
    { index: 5, users: 50_000,  label: '50,000 users',  card: 'enterprise', proPrice: 349 },
    { index: 6, users: 100_000, label: '100,000 users', card: 'enterprise', proPrice: 449 },
  ];

  const STARTER_BASE_PRICE = 49;
  const MAX_INDEX          = TIERS.length - 1; // 6
  const YEARLY_DISCOUNT    = 0.20;

  /* ── DOM refs ── */
  const slider         = document.getElementById('user-slider');
  const sliderOutput   = document.getElementById('slider-output');
  const sliderWrap     = slider?.closest('.slider-wrap');
  const billingBtn     = document.getElementById('billing-btn');

  const starterCard    = document.querySelector('[data-tier="starter"]');
  const proCard        = document.querySelector('[data-tier="pro"]');
  const enterpriseCard = document.querySelector('[data-tier="enterprise"]');

  const starterPrice   = document.getElementById('starter-price');
  const starterNote    = document.getElementById('starter-note');
  const proPrice       = document.getElementById('pro-price');
  const proNote        = document.getElementById('pro-note');

  const coverageBlock  = document.getElementById('coverage-block');
  const coverageFill   = document.getElementById('coverage-fill');
  const coverageLabel  = document.getElementById('coverage-label');

  // Guard: bail out if critical DOM elements are missing
  if (!slider || !billingBtn || !starterCard || !proCard || !enterpriseCard) {
    console.warn('PricingCalculator: required DOM elements not found, init skipped.');
    return;
  }

  /* ── State ── */
  let isYearly     = false;
  let currentIndex = parseInt(slider.value, 10); // initial index from HTML value="2"

  /* ── Utilities ── */

  /**
   * Calculates the final monthly price applying the yearly discount if active.
   * @param {number} base — base price in USD
   * @returns {number} — rounded final price
   */
  function calcPrice(base) {
    return isYearly ? Math.round(base * (1 - YEARLY_DISCOUNT)) : base;
  }

  /**
   * Formats a number to a string with thousands separators.
   * 12480 → "12,480"
   * @param {number} n
   * @returns {string}
   */
  function fmt(n) {
    return n.toLocaleString('en-US');
  }

  /* Fills the track up to the thumb center.
     CSS turns --progress into a width that accounts for the thumb size
     (see .slider-fill-track), so the fill and tick labels match the thumb. */
  function updateFill(index) {
    sliderWrap?.style.setProperty('--progress', String(index / MAX_INDEX));
  }

  /* ── Active card ──
     Sets .pcard--slider-active on the matching card only.
     All visuals (dimming inactive cards, lift, glow) live in CSS —
     inline styles here used to fight the GSAP reveal tween.
  ─────────────────────────────────────────────────────── */
  const allCards = [starterCard, proCard, enterpriseCard];

  function updateActiveCard(cardName) {
    const target = { starter: starterCard, pro: proCard, enterprise: enterpriseCard }[cardName];
    allCards.forEach(card => card.classList.toggle('pcard--slider-active', card === target));
  }

  /* ── Coverage bar (Pro tier only) ──
     Shows how much of the selected volume the Pro plan covers.
     Pro max = 25K users (index 4).
     If volume exceeds 25K — red warning state.
  ─────────────────────────────────────────────────────────── */
  const PRO_MAX_USERS = 25_000;

  function updateCoverage(users, isProActive) {
    if (!coverageFill || !coverageLabel || !coverageBlock) return;

    // The coverage bar reflects Pro plan capacity — only show it when
    // Pro is the active tier. On Starter/Enterprise the message
    // "Covers your selected volume" would refer to the Pro plan, not
    // the selected tier, which is misleading.
    if (!isProActive) {
      coverageBlock.style.display = 'none';
      return;
    }
    coverageBlock.style.display = '';

    const pct     = Math.min((users / PRO_MAX_USERS) * 100, 100);
    const exceeds = users > PRO_MAX_USERS;

    coverageFill.style.width = `${pct}%`;
    coverageBlock.classList.toggle('coverage--exceeds', exceeds);

    coverageLabel.textContent = exceeds
      ? '⚠ Exceeds Pro plan — see Enterprise'
      : `✓ Covers your selected volume (${Math.round(pct)}% of cap)`;
  }

  /* ── Main render function ──
     Called on any state change
     (index update or billing cycle toggle).
  ─────────────────────────────────────────── */
  function render() {
    const tier = TIERS[currentIndex];

    /* 1. Label above the slider */
    if (sliderOutput) sliderOutput.textContent = tier.label;

    /* 2. Update ARIA values for screen readers */
    slider.setAttribute('aria-valuenow',  String(tier.users));
    slider.setAttribute('aria-valuetext', tier.label);

    /* 3. Track fill */
    updateFill(currentIndex);

    /* 4. Active card highlight */
    updateActiveCard(tier.card);

    /* 5. Prices */
    const newStarterPrice = calcPrice(STARTER_BASE_PRICE);
    const newProPrice     = calcPrice(tier.proPrice);

    if (starterPrice) starterPrice.textContent = fmt(newStarterPrice);
    if (proPrice) {
      // If Enterprise is active — hide the numeric Pro price
      proPrice.textContent = tier.card === 'enterprise' ? '—' : fmt(newProPrice);
    }

    /* 6. Billing cycle notes */
    if (starterNote) {
      starterNote.textContent = isYearly
        ? `Billed yearly · $${fmt(newStarterPrice * 12)}/yr`
        : `Billed monthly · $${newStarterPrice}/mo`;
    }
    if (proNote) {
      proNote.textContent = tier.card === 'enterprise'
        ? 'Volume exceeds Pro plan — see Enterprise'
        : isYearly
          ? `Billed yearly · $${fmt(newProPrice * 12)}/yr`
          : `Billed monthly · $${newProPrice}/mo`;
    }

    /* 7. Coverage bar */
    updateCoverage(tier.users, tier.card === 'pro');
  }

  /* ── Event handlers ── */

  /**
   * input  — fires on every thumb movement.
   * change — fires on release (fallback for some browsers).
   * We listen to both for maximum compatibility.
   */
  function onSliderChange() {
    currentIndex = parseInt(slider.value, 10);
    render();
  }

  slider.addEventListener('input',  onSliderChange);
  slider.addEventListener('change', onSliderChange);

  /**
   * Keyboard navigation for the slider.
   * ArrowLeft/Right and ArrowDown/Up are handled natively by the browser,
   * but we call render() on top of that for an immediate UI update.
   */
  slider.addEventListener('keydown', () => {
    // setTimeout(0) lets the browser update .value before we read it
    setTimeout(() => {
      currentIndex = parseInt(slider.value, 10);
      render();
    }, 0);
  });

  /**
   * Billing toggle — Monthly ↔ Yearly.
   * aria-checked=true → Yearly (20% discount applied).
   */
  billingBtn.addEventListener('click', () => {
    isYearly = !isYearly;
    billingBtn.setAttribute('aria-checked', String(isYearly));
    render();
  });

  /* ── Initial render on page load ── */
  render();
}


/* ============================================================
   INIT
============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  initHeaderScroll();
  initBurger();
  initSmoothScroll();
  initActiveNav();
  initPricing();
});