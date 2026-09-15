/**
 * ApexSaaS — app.js
 * Architecture: IIFE-wrapped modules, no bundler needed.
 *
 * Modules:
 * HeroAnimations   — GSAP load timeline + dashboard float loop
 * KPICounters      — animated number counters for dashboard
 * ChartDraw        — SVG chart-line stroke-dashoffset reveal
 * ScrollAnimations — All scroll-triggered section reveals
 *
 * GSAP plugins registered: ScrollTrigger, CustomEase
 */

'use strict';

/* ============================================================
   WAIT FOR GSAP CDN SCRIPTS BEFORE RUNNING
============================================================ */
document.addEventListener('DOMContentLoaded', () => {

  // Safety net: whatever happens with GSAP (CDN hiccup, a throttled
  // background tab stalling the rAF-driven timeline, an unexpected
  // runtime error mid-animation), the hero content and dashboard must
  // never stay permanently invisible. Force them visible after a max
  // wait, no matter what state the animation is in.
  const revealTimer = setTimeout(forceRevealHero, 4000);

  function forceRevealHero() {
    document.querySelectorAll(
      '.hero__badge, .hero__hl-line, .hero__sub, .hero__ctas, .hero__proof, .dashboard'
    ).forEach(el => {
      el.style.opacity = '1';
      el.style.transform = 'none';
    });
  }

  try {
    // Register GSAP plugins
    gsap.registerPlugin(ScrollTrigger, CustomEase);

    // Smooth custom ease for Hero section elements
    CustomEase.create('apex-out', 'M0,0 C0.1,0 0.2,1 1,1');

    // Initialize hero animations (Nav and Calculator are handled in script.js)
    HeroAnimations.init();

    // ScrollTrigger animations — run right after first paint
    setTimeout(() => ScrollAnimations.init(), 80);
  } catch (err) {
    // GSAP failed to load or register (e.g. CDN unreachable) — don't leave
    // the page blank, just show everything without the load animation.
    console.warn('Animation setup failed, showing content without animation:', err);
    clearTimeout(revealTimer);
    forceRevealHero();
  }

});


/* ============================================================
   MODULE: HeroAnimations
   — Staggered reveal (badge → headline → sub → ctas)
   — Dashboard panel slides in + infinite float loop
   — Slow pulse animation for background orbs
   — KPI counters and chart line draw kicked off inside the timeline
============================================================ */
const HeroAnimations = (() => {

  function initLoadTimeline() {
    const tl = gsap.timeline({ defaults: { ease: 'apex-out', duration: 0.7 } });

    // Set initial hidden states for all animated elements
    gsap.set([
      '.hero__badge',
      '.hero__hl-line',
      '.hero__sub',
      '.hero__ctas',
      '.hero__proof'
    ], { opacity: 0, y: 22 });

    gsap.set('.dashboard', { opacity: 0, y: 40 });

    tl
      .to('.hero__badge',    { opacity: 1, y: 0, duration: 0.5 })
      .to('.hero__hl-line',  { opacity: 1, y: 0, stagger: 0.12 }, '-=0.25')
      .to('.hero__sub',      { opacity: 1, y: 0 }, '-=0.3')
      .to('.hero__ctas',     { opacity: 1, y: 0 }, '-=0.4')
      .to('.hero__proof',    { opacity: 1, y: 0, duration: 0.5 }, '-=0.3')
      // Dashboard slides in from below
      .to('.dashboard', {
        opacity: 1,
        y: 0,
        duration: 0.9,
        ease: 'power3.out',
        onComplete: () => {
          initDashboardFloat();
          KPICounters.init();
          ChartDraw.init();
          initFeedStagger();
        }
      }, '-=0.5');
  }

  function initDashboardFloat() {
    // Infinite gentle float up/down
    gsap.to('.dashboard', {
      y: -10,
      duration: 3.5,
      ease: 'sine.inOut',
      yoyo: true,
      repeat: -1,
    });
  }

  function initOrbPulse() {
    gsap.to('.hero__orb--violet', {
      scale: 1.15,
      opacity: 0.8,
      duration: 5,
      ease: 'sine.inOut',
      yoyo: true,
      repeat: -1,
    });
    gsap.to('.hero__orb--cyan', {
      scale: 1.2,
      opacity: 0.7,
      duration: 6.5,
      ease: 'sine.inOut',
      yoyo: true,
      repeat: -1,
      delay: 1.5,
    });
  }

  function initFeedStagger() {
    // Activity feed items stagger in one by one
    const items = document.querySelectorAll('.dash-feed__item');
    gsap.from(items, {
      opacity: 0,
      x: -8,
      duration: 0.4,
      stagger: 0.15,
      ease: 'power2.out',
      delay: 0.2,
    });
  }

  return {
    init() {
      // Respect user motion preference
      const noMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      if (noMotion) {
        // Skip animations — show everything immediately
        gsap.set([
          '.hero__badge', '.hero__hl-line', '.hero__sub',
          '.hero__ctas', '.hero__proof', '.dashboard'
        ], { opacity: 1, y: 0 });
        KPICounters.init();
        ChartDraw.init();
        return;
      }

      initOrbPulse();
      initLoadTimeline();
    }
  };

})();


/* ============================================================
   MODULE: KPICounters
   — Animates elements with [data-count-to] attribute from 0 to target
   — Uses requestAnimationFrame for buttery smooth updates
============================================================ */
const KPICounters = (() => {

  function animateCounter(el) {
    const target   = parseInt(el.dataset.countTo, 10);
    const duration = 1600; // Animation duration in ms
    const start    = performance.now();

    function update(now) {
      const elapsed  = now - start;
      const progress = Math.min(elapsed / duration, 1);

      // Ease Out Cubic easing function
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(eased * target);

      // Format with thousands separator (e.g. 2,400)
      el.textContent = current.toLocaleString('en-US');

      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        el.textContent = target.toLocaleString('en-US');
      }
    }

    requestAnimationFrame(update);
  }

  return {
    init() {
      document.querySelectorAll('[data-count-to]').forEach(animateCounter);
    }
  };

})();


/* ============================================================
   MODULE: ChartDraw
   — SVG chart-line draw-on effect via stroke-dashoffset animation
============================================================ */
const ChartDraw = (() => {

  return {
    init() {
      const path = document.getElementById('chart-line-path');
      if (!path) return;

      const length = path.getTotalLength();

      gsap.set(path, {
        strokeDasharray: length,
        strokeDashoffset: length,
      });

      gsap.to(path, {
        strokeDashoffset: 0,
        duration: 1.8,
        ease: 'power2.inOut',
        delay: 0.3,
      });
    }
  };

})();


/* ============================================================
   MODULE: ScrollAnimations
   — All scroll-triggered animations for sections below the hero.
   — Each group is an independent timeline with its own ScrollTrigger.
============================================================ */
const ScrollAnimations = (() => {

  const noMotion = () =>
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Shared defaults for all reveal animations */
  const BASE = {
    y: 32,
    opacity: 0,
    ease: 'power3.out',
    duration: 0.7,
  };

  /* Helper: builds a ScrollTrigger config with shared settings */
  function st(trigger, startOffset = '85%') {
    return {
      scrollTrigger: {
        trigger,
        start: `top ${startOffset}`,
        toggleActions: 'play none none none',
      },
    };
  }

  /* ── Features section header ── */
  function animateFeaturesHeader() {
    gsap.from('.features .section-header', {
      ...st('.features', '82%'),
      ...BASE,
    });
  }

  /* ── Bento grid cards — stagger in one by one ── */
  function animateBentoCards() {
    const cards = document.querySelectorAll('.bento__card');
    if (!cards.length) return;

    gsap.set(cards, { opacity: 0, y: 32 });

    gsap.to(cards, {
      ...st('.bento', '88%'),
      opacity: 1,
      y: 0,
      duration: 0.65,
      stagger: 0.1,
      ease: 'power3.out',
      clearProps: 'opacity,transform', // Hand control back to CSS after animation
    });
  }

  /* ── Testimonials section header ── */
  function animateTestimonialsHeader() {
    gsap.from('.testimonials .section-header', {
      ...st('.testimonials', '82%'),
      ...BASE,
    });
  }

  /* ── Testimonial cards — outer cards first, center card follows ── */
  function animateTestimonialCards() {
    const cards = document.querySelectorAll('.testi-card');
    if (!cards.length) return;

    gsap.set(cards, { opacity: 0, y: 32 });

    gsap.to(cards, {
      ...st('.testi-grid', '88%'),
      opacity: 1,
      y: 0,
      duration: 0.7,
      stagger: {
        each: 0.12,
        from: 'edges',
      },
      ease: 'power3.out',
      clearProps: 'opacity,transform',
    });
  }

  /* ── Brand logo strip ── */
  function animateLogosStrip() {
    gsap.from('.logo-item', {
      ...st('.logos-strip', '92%'),
      opacity: 0,
      y: 12,
      stagger: 0.07,
      duration: 0.45,
      ease: 'power2.out',
    });
  }

  /* ── Pricing section header ── */
  function animatePricingHeader() {
    gsap.from('.pricing .section-header', {
      ...st('.pricing', '82%'),
      ...BASE,
    });
  }

  /* ── Pricing cards and controls ── */
  function animatePricingCards() {
    // .pcard has a CSS transform transition, so gsap.from() read a
    // mid-transition value as its end state and left cards stuck 48px low.
    // fromTo() with explicit ends + clearProps hands transform back to CSS
    // (.pcard--pro elevation, hover lift). Opacity is faded on the grid,
    // because card opacity is owned by CSS (dimmed inactive tiers).
    gsap.fromTo('.pricing-grid',
      { opacity: 0 },
      { ...st('.pricing-grid', '88%'), opacity: 1, duration: 0.6, ease: 'power2.out', clearProps: 'opacity' }
    );

    gsap.fromTo('.pcard',
      { y: 48 },
      {
        ...st('.pricing-grid', '88%'),
        y: 0,
        duration: 0.72,
        stagger: 0.13,
        ease: 'power3.out',
        clearProps: 'transform',
      }
    );

    gsap.from('.trust-strip li', {
      ...st('.trust-strip', '92%'),
      y: 14,
      opacity: 0,
      duration: 0.45,
      stagger: 0.07,
      ease: 'power2.out',
    });

    gsap.from('.billing-toggle', {
      ...st('.billing-toggle', '90%'),
      ...BASE,
      duration: 0.5,
    });

    gsap.from('.slider-wrap', {
      ...st('.slider-wrap', '90%'),
      ...BASE,
      duration: 0.5,
      delay: 0.1,
    });
  }

  /* ── Integrations section ── */
  function animateIntegrations() {
    gsap.from('.integrations .section-header', {
      ...st('.integrations', '82%'),
      ...BASE,
    });

    // Same CSS-transition clash as .pcard — explicit end values + clearProps
    gsap.fromTo('.integration-pill',
      { y: 16, opacity: 0 },
      {
        ...st('.integrations__grid', '88%'),
        y: 0,
        opacity: 1,
        duration: 0.4,
        stagger: 0.04,
        ease: 'power2.out',
        clearProps: 'transform,opacity',
      }
    );
  }

  /* ── Section eyebrow labels ── */
  function animateSectionEyebrows() {
    document.querySelectorAll('.section-eyebrow').forEach(el => {
      gsap.from(el, {
        scrollTrigger: {
          trigger: el,
          start: 'top 90%',
          toggleActions: 'play none none none',
        },
        opacity: 0,
        x: -12,
        duration: 0.5,
        ease: 'power2.out',
      });
    });
  }

  return {
    init() {
      if (typeof ScrollTrigger === 'undefined') {
        console.warn('ScrollAnimations: ScrollTrigger not loaded.');
        return;
      }

      if (noMotion()) {
        return;
      }

      // ScrollTrigger is already registered globally in DOMContentLoaded above —
      // calling registerPlugin() again here was redundant, removed.
      // Note: the hero dashboard itself is intentionally NOT animated here —
      // HeroAnimations.initLoadTimeline() already reveals it on page load,
      // and re-animating it via ScrollTrigger caused a race condition
      // (see fix notes in DOMContentLoaded handler above).
      animateFeaturesHeader();
      animateBentoCards();
      animateTestimonialsHeader();
      animateTestimonialCards();
      animateLogosStrip();
      animatePricingHeader();
      animatePricingCards();
      animateIntegrations();
      animateSectionEyebrows();

      // Recalculate scroll positions after DOM is fully painted
      ScrollTrigger.refresh();
    },
  };

})();