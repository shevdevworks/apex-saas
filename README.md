# ApexSaaS

A responsive SaaS landing page concept for a workflow automation platform. Designed and developed by [ShevDevWorks](https://shevdevworks.com/).

[Live site](https://shevdevworks.github.io/apex-saas/)

## The concept

**Great work. Less busywork.** The landing page explains an automation product through an interactive workflow, rather than invented reviews or customer statistics.

A light, spacious opening pairs large typography with an original folded-ribbon illustration. Cobalt blue ties the brand mark, workflow paths, actions, and closing section together. A dark integration section creates a change of pace between the product walkthrough and pricing.

This is an independent portfolio project, not an operating software company. Workflows use sample data in the browser. App logos illustrate possible connections; no third-party accounts are accessed. Plans are illustrative and no payments or personal data are collected.

## Try it

- **Workflow playground:** route an inbound lead, triage a support request, or share a release. Run any scenario, inspect its steps, or switch scenarios during execution. Pending updates from the previous run are cancelled.
- **Product walkthrough:** three selectable views explain connections, conditional rules, and human approvals. The approval example can be approved and reset.
- **Pricing calculator:** seven automation volumes, monthly/yearly billing, and one suggested plan. Prices are calculated in cents; yearly billing applies an exact 20% discount and shows the annual total.
- **Plan previews:** accessible dialogs show the selected plan, capacity, and current price. Choosing an undersized plan explains the limit.
- **Navigation and FAQ:** mobile menu, section navigation, keyboard-operable tabsets, and native HTML disclosures.

## Run locally

No build or dependency installation is needed to serve the site.

```powershell
python -m http.server 5173 --bind 127.0.0.1
```

Open http://127.0.0.1:5173/ in a browser. A static server such as VS Code Live Server also works.

## Implementation

- Semantic HTML, CSS, and vanilla JavaScript.
- Self-hosted Manrope and Space Grotesk, with their licenses in `fonts/`.
- Original inline SVG artwork and a shared icon symbol set.
- CSS and the Web Animations API for masked headline reveals, a layered hero entrance, a light trace along the ribbon, and softly floating interface layers. The workflow stage gains depth on desktop scroll, and the integration map carries moving signals.
- Scenario transitions, step confirmation, product walkthroughs, prices, and FAQ expansion respond to user actions. Motion is kept separate from workflow and pricing state.
- Pointer-responsive depth only on precise pointing devices. Mobile motion is gentler. Scrolling remains native, with no animation CDN or scroll-jacking.
- Ambient animation stops outside the viewport or in a hidden tab. The small pause control beneath the hero artwork disables motion and remembers the preference for the tab. The system's reduced-motion setting takes precedence.
- Native range input and dialog, visible focus, ARIA tab patterns, live workflow status, and Escape handling.
- Reduced-motion support. No-JavaScript fallback keeps page content and FAQ available, with a notice explaining the interactive areas.

## Files

| Path                        | Purpose                                                               |
| --------------------------- | --------------------------------------------------------------------- |
| `index.html`                | Page structure, copy, inline SVGs, social metadata                    |
| `css/style.css`             | Design tokens, components, responsive layouts, motion preferences     |
| `css/motion.css`            | Progressive motion layer, light effects, and reduced-motion overrides |
| `js/script.js`              | Navigation, workflows, walkthrough, pricing, plan previews            |
| `js/app.js`                 | Motion, section tracking, header state                                |
| `fonts/`                    | Local fonts and open font licenses                                    |
| `images/og-apex-v2.png`     | 1200 × 630 social sharing image                                       |
| `scripts/social-cover.html` | Editable HTML source for the social image                             |

To export the social cover, open its HTML source on the local server at a 1200 × 630 viewport and capture it at device scale factor 1. The new image filename helps link previews pick up the redesign after deployment; a service may still retain an already-shared preview in its cache.

## Validation

Browser checks cover all three workflow runs, switching during a run, keyboard tabs, approval/reset, every pricing/billing combination, plan capacity warnings, dialog focus restoration, the mobile menu, FAQ, reduced motion, and the no-JavaScript fallback.

Layouts were checked at 320, 390, 540, 679, 680, 768, 959, 1024, 1280, 1440, and 1920 pixels, including the largest yearly price. No horizontal page overflow, missing assets, external runtime requests, or browser errors were found in Chromium.

## Publishing

The project remains a static site compatible with GitHub Pages. Commit and push the verified changes when ready. The canonical URL and social image URL currently point to the existing `shevdevworks.github.io/apex-saas/` deployment.
