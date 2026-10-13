'use strict';

(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const setText = (id, value) => {
    document.getElementById(id).textContent = value;
  };
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const noMotion = () => motion.matches || document.documentElement.dataset.motion === 'off';
  const notifyMotion = (name, detail = {}) =>
    document.dispatchEvent(new CustomEvent(`apex:${name}`, { detail }));

  // The mobile navigation is a disclosure, with normal document tab order.
  const menuButton = $('.menu-toggle');
  const menu = $('#mobile-menu');
  function setMenu(open, restoreFocus = false) {
    menu.hidden = !open;
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    if (restoreFocus) menuButton.focus();
  }
  menuButton.addEventListener('click', () => setMenu(menu.hidden));
  $$('a', menu).forEach((link) => link.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !menu.hidden) setMenu(false, true);
  });
  document.addEventListener('click', (event) => {
    if (!menu.hidden && !event.target.closest('.site-header')) setMenu(false);
  });
  window.matchMedia('(min-width: 680px)').addEventListener('change', (event) => {
    if (event.matches) setMenu(false);
  });

  // Both product tabsets support arrows, Home and End; only the active tab
  // participates in the document's tab sequence.
  function bindTabs(container, attribute, onSelect) {
    const tabs = $$('[role="tab"]', container);
    const vertical = container.getAttribute('aria-orientation') === 'vertical';
    function select(tab, focus = false) {
      tabs.forEach((item) => {
        const selected = item === tab;
        item.setAttribute('aria-selected', String(selected));
        item.tabIndex = selected ? 0 : -1;
      });
      const panel = document.getElementById(tab.getAttribute('aria-controls'));
      panel.setAttribute('aria-labelledby', tab.id);
      onSelect(tab.dataset[attribute]);
      if (focus) tab.focus();
    }
    tabs.forEach((tab, index) => {
      tab.addEventListener('click', () => select(tab));
      tab.addEventListener('keydown', (event) => {
        const next = vertical ? 'ArrowDown' : 'ArrowRight';
        const previous = vertical ? 'ArrowUp' : 'ArrowLeft';
        let target;
        if (event.key === next) target = (index + 1) % tabs.length;
        if (event.key === previous) target = (index - 1 + tabs.length) % tabs.length;
        if (event.key === 'Home') target = 0;
        if (event.key === 'End') target = tabs.length - 1;
        if (target !== undefined) {
          event.preventDefault();
          select(tabs[target], true);
        }
      });
    });
  }

  const scenarios = {
    leads: {
      title: 'A warm welcome, without the handoff.',
      description: 'From a new form submission to an informed account owner.',
      trigger: [
        'New inbound lead',
        'Website form · HubSpot',
        'Ready to listen',
        'i-hub',
        'app-orange',
      ],
      process: ['Find the right owner', 'Match region + account size', 'Your rules, applied'],
      action: [
        'Give sales a heads-up',
        '#new-leads · Slack',
        'Context included',
        'i-slack',
        'app-purple',
      ],
      details: [
        [
          'A lead enters the flow',
          'Sample: Morgan from Northstar submits a request. Team size: 80. Region: Europe.',
        ],
        [
          'The rules find a match',
          'Europe + more than 50 people → assign to the enterprise sales team.',
        ],
        [
          'The team gets the context',
          'A Slack message includes the request, the account owner, and a link to the sample CRM record.',
        ],
      ],
      completion: [
        'Lead routed. Team in the loop.',
        'Northstar → enterprise sales → #new-leads. Three steps completed with sample data.',
      ],
    },
    support: {
      title: 'The right request. The right person.',
      description: 'Give incoming requests a clear route to a useful answer.',
      trigger: [
        'New support request',
        '#help-desk · Slack',
        'Ready to listen',
        'i-slack',
        'app-purple',
      ],
      process: ['Sort by priority', 'Topic + urgency + owner', 'Your rules, applied'],
      action: [
        'Create a clear next step',
        'Support queue · Linear',
        'Details attached',
        'i-linear',
        'app-blue',
      ],
      details: [
        [
          'A request enters the flow',
          'Sample: “Our export is failing before a deadline.” Received in the team’s help channel.',
        ],
        [
          'The request gets a priority',
          'Export issue + deadline today → high priority. Route to the product support team.',
        ],
        [
          'A ticket has an owner',
          'Create a sample Linear issue with the original message, priority, and assigned team.',
        ],
      ],
      completion: [
        'Request sorted. Next step clear.',
        'Export issue → high priority → product support. The original context stays with the task.',
      ],
    },
    release: {
      title: 'Ship the update. Skip the update-about-the-update.',
      description: 'Keep the whole team in the loop when a new version lands.',
      trigger: [
        'A release is published',
        'Version 2.4 · GitHub',
        'Ready to listen',
        'i-github',
        'app-ink',
      ],
      process: ['Prepare a clear summary', 'Changes + fixes + links', 'Context, organized'],
      action: [
        'Share the good news',
        '#product-updates · Slack',
        'Ready for the team',
        'i-slack',
        'app-purple',
      ],
      details: [
        [
          'A release enters the flow',
          'Sample: version 2.4 is published with four changes and two fixes in GitHub.',
        ],
        [
          'The details become a digest',
          'Group the changes, highlight the fixes, and include the release link in a short update.',
        ],
        [
          'Everyone gets the update',
          'Post the sample release digest to #product-updates, with a link back to the full notes.',
        ],
      ],
      completion: [
        'Release shipped. Everyone caught up.',
        'Version 2.4 → release digest → #product-updates. A complete handoff, using sample data.',
      ],
    },
  };

  const nodes = $$('.flow-node');
  const canvas = $('#flow-canvas');
  const runButton = $('#run-flow');
  let activeScenario = 'leads';
  let runVersion = 0;
  let running = false;
  let demoTimer;

  function inspect(title, description) {
    setText('inspector-status', title);
    setText('inspector-text', description);
  }
  function selectScenario(key) {
    clearTimeout(demoTimer);
    runVersion += 1; // Invalidate any awaited step of a previous run.
    running = false;
    activeScenario = key;
    const scenario = scenarios[key];
    setText('flow-title', scenario.title);
    setText('flow-description', scenario.description);
    for (const type of ['trigger', 'process', 'action']) {
      const [title, subtitle, meta, icon, color] = scenario[type];
      setText(`${type}-title`, title);
      setText(`${type}-subtitle`, subtitle);
      setText(`${type}-meta`, meta);
      if (icon) {
        const app = $(`#${type}-icon`);
        app.className = `app-icon ${color}`;
        $('use', app).setAttribute('href', `#${icon}`);
      }
    }
    nodes.forEach((node, index) => {
      node.disabled = false;
      node.classList.remove('is-active', 'is-done');
      node.setAttribute('aria-pressed', 'false');
      $('.node-number', node).textContent = `0${index + 1}`;
    });
    canvas.dataset.step = 'idle';
    runButton.disabled = false;
    $('span', runButton).textContent = 'Run workflow';
    inspect('Ready when you are', 'Run the sample workflow, or select a step to see what happens.');
    notifyMotion('scenario', { key });
  }
  const delay = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));

  async function runFlow() {
    clearTimeout(demoTimer);
    if (running) return;
    running = true;
    const version = ++runVersion;
    const scenario = scenarios[activeScenario];
    const instant = noMotion();
    nodes.forEach((node, index) => {
      node.disabled = true;
      node.classList.remove('is-active', 'is-done');
      node.setAttribute('aria-pressed', 'false');
      $('.node-number', node).textContent = `0${index + 1}`;
    });
    runButton.disabled = true;
    $('span', runButton).textContent = 'Running…';
    for (let step = 0; step < 3; step += 1) {
      if (version !== runVersion) return;
      canvas.dataset.step = String(step);
      setText(`${['trigger', 'process', 'action'][step]}-meta`, 'Processing sample…');
      nodes.forEach((node) => node.classList.remove('is-active'));
      nodes[step].classList.add('is-active');
      notifyMotion('step', { step });
      if (!instant) inspect(...scenario.details[step]);
      if (!instant) await delay(step === 0 ? 850 : 1100);
      if (version !== runVersion) return;
      nodes[step].classList.add('is-done');
      $('.node-number', nodes[step]).textContent = '✓';
      setText(
        `${['trigger', 'process', 'action'][step]}-meta`,
        ['Trigger received', 'Step completed', 'Action completed'][step],
      );
    }
    nodes.forEach((node) => {
      node.disabled = false;
      node.classList.remove('is-active');
    });
    canvas.dataset.step = 'done';
    inspect(...scenario.completion);
    runButton.disabled = false;
    $('span', runButton).textContent = 'Run again';
    running = false;
    notifyMotion('complete');
  }

  bindTabs($('.scenario-tabs'), 'scenario', selectScenario);
  runButton.addEventListener('click', runFlow);
  nodes.forEach((node, index) =>
    node.addEventListener('click', () => {
      nodes.forEach((item) => item.setAttribute('aria-pressed', String(item === node)));
      inspect(...scenarios[activeScenario].details[index]);
    }),
  );
  $('[data-demo-link]').addEventListener('click', (event) => {
    event.preventDefault();
    $('#workspace').scrollIntoView({ behavior: noMotion() ? 'instant' : 'smooth' });
    clearTimeout(demoTimer);
    demoTimer = setTimeout(
      () => {
        runButton.focus({ preventScroll: true });
        runFlow();
      },
      noMotion() ? 0 : 650,
    );
  });

  bindTabs($('.how-steps'), 'how', (key) => {
    $$('.setup-view').forEach((view) => {
      view.hidden = view.dataset.view !== key;
    });
    notifyMotion('walkthrough', { key });
  });
  let approved = false;
  $('#approve-example').addEventListener('click', () => {
    approved = !approved;
    setText('approval-status', approved ? 'Approved' : 'Your call');
    $('#approve-example span').textContent = approved
      ? 'Reset the example'
      : 'Approve this example';
    setText(
      'approval-result',
      approved ? 'Approved. The sample update can continue to the team.' : '',
    );
    notifyMotion('approval', { approved });
  });

  // Discrete volumes map to an explicit recommendation. Prices are stored in
  // cents so the advertised 20% discount and the annual total remain exact.
  const tiers = [
    { volume: 1000, plan: 'starter', growth: 3900 },
    { volume: 2500, plan: 'growth', growth: 3900 },
    { volume: 5000, plan: 'growth', growth: 7900 },
    { volume: 10000, plan: 'growth', growth: 12900 },
    { volume: 25000, plan: 'growth', growth: 24900 },
    { volume: 50000, plan: 'scale', growth: 24900 },
    { volume: 100000, plan: 'scale', growth: 24900 },
  ];
  const planNames = { starter: 'Starter', growth: 'Growth', scale: 'Scale' };
  const volumeInput = $('#volume');
  let yearly = false;
  const formatCount = (value) => value.toLocaleString('en-US');
  const formatMoney = (cents) =>
    (cents / 100).toLocaleString('en-US', {
      minimumFractionDigits: cents % 100 ? 2 : 0,
      maximumFractionDigits: 2,
    });
  const priceFor = (cents) => (yearly ? Math.round(cents * 0.8) : cents);
  function currentTier() {
    return tiers[Math.max(0, Math.min(6, Number(volumeInput.value)))];
  }
  function volumeLabel(tier) {
    return formatCount(tier.volume) + (tier.volume === 100000 ? '+' : '');
  }
  function updatePricing() {
    const tier = currentTier();
    const label = volumeLabel(tier);
    setText('volume-output', label);
    volumeInput.setAttribute('aria-valuetext', `${label} automations per month`);
    volumeInput.style.setProperty('--fill', `${(Number(volumeInput.value) / 6) * 100}%`);
    setText(
      'pricing-recommendation',
      `For ${label} automations, ${planNames[tier.plan]} is your fit.`,
    );
    $$('.plan').forEach((card) => {
      const selected = card.dataset.plan === tier.plan;
      card.classList.toggle('recommended', selected);
      $('.plan-fit', card).hidden = !selected;
    });
    for (const [key, base] of [
      ['starter', 1900],
      ['growth', tier.growth],
    ]) {
      const price = priceFor(base);
      setText(`${key}-price`, formatMoney(price));
      setText(
        `${key}-note`,
        yearly
          ? `$${formatMoney(price * 12)} billed yearly`
          : `$${formatMoney(price)} billed monthly`,
      );
    }
    setText(
      'growth-capacity',
      `${formatCount(Math.max(2500, Math.min(tier.volume, 25000)))} automations per month`,
    );
    notifyMotion('pricing');
  }
  volumeInput.addEventListener('input', updatePricing);
  volumeInput.addEventListener('change', updatePricing);
  $$('[data-billing]').forEach((button) =>
    button.addEventListener('click', () => {
      yearly = button.dataset.billing === 'yearly';
      $$('[data-billing]').forEach((item) =>
        item.setAttribute('aria-pressed', String(item === button)),
      );
      updatePricing();
    }),
  );
  updatePricing();

  const dialog = $('#plan-dialog');
  const planDescriptions = {
    starter: [
      'Your first flow starts here.',
      'A focused workspace for a few useful automations. Start with one repetitive task and give it a clear path.',
    ],
    growth: [
      'More room for good work.',
      'A workspace for connected processes, conditional steps, and the moments that need a human decision.',
    ],
    scale: [
      'A fit for the bigger picture.',
      'A workspace concept for larger operations, with tailored volumes and more control across teams.',
    ],
  };
  $$('[data-preview-plan]').forEach((button) =>
    button.addEventListener('click', () => {
      const plan = button.dataset.previewPlan;
      const tier = currentTier();
      const [title, description] = planDescriptions[plan];
      setText('plan-dialog-title', title);
      const selectedVolume =
        plan === 'starter'
          ? 1000
          : plan === 'growth'
            ? Math.max(2500, Math.min(tier.volume, 25000))
            : tier.volume;
      const exceeded = plan !== 'scale' && tier.volume > selectedVolume;
      setText(
        'plan-dialog-description',
        description +
          (exceeded
            ? ` Your selected volume exceeds this plan; ${planNames[tier.plan]} is the suggested fit.`
            : ''),
      );
      setText('summary-plan', planNames[plan]);
      setText(
        'summary-volume',
        plan === 'scale' ? `${volumeLabel(tier)} · Custom` : formatCount(selectedVolume),
      );
      setText(
        'summary-billing',
        plan === 'scale' ? 'Custom agreement' : yearly ? 'Yearly · save 20%' : 'Monthly',
      );
      const cents = priceFor(plan === 'starter' ? 1900 : tier.growth);
      setText(
        'summary-price',
        plan === 'scale'
          ? 'Tailored pricing'
          : yearly
            ? `$${formatMoney(cents * 12)} / year`
            : `$${formatMoney(cents)} / month`,
      );
      dialog.showModal();
      document.body.classList.add('dialog-open');
      notifyMotion('dialog');
    }),
  );
  $('.dialog-close', dialog).addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (event) => {
    if (event.target !== dialog) return;
    const box = dialog.getBoundingClientRect();
    if (
      event.clientX < box.left ||
      event.clientX > box.right ||
      event.clientY < box.top ||
      event.clientY > box.bottom
    )
      dialog.close();
  });
  dialog.addEventListener('close', () => document.body.classList.remove('dialog-open'));
  $('#dialog-try-flow').addEventListener('click', () => {
    dialog.close();
    $('#workspace').scrollIntoView({ behavior: noMotion() ? 'instant' : 'smooth' });
    runButton.focus({ preventScroll: true });
  });
})();
