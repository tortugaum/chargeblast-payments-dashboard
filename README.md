# Payments dashboard

A Stripe-inspired payments screen built with Next.js and TypeScript. All data is fictional and generated locally; no Stripe account, API keys, database, or environment variables are required.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000. Run `npm run build` to check the production build, `npm run lint` for linting, and `npm test` for data and filter tests (Node.js 22 or newer).

## Features

- 500 reproducible mock payments, with dates relative to the current session.
- Search, date presets and custom range, status and payment method multi-selects, and amount range filters.
- Date, amount, and status sorting; 25/50/100-row pagination; copyable payment IDs and relative-date tooltips.
- Shareable filter URLs, a copy-link button, and browser Back/Forward support.
- Drag column grips to reorder and drag column edges to resize. Both support arrow keys; Edit columns resets the locally saved layout.
- Responsive dashboard shell, keyboard-accessible controls, and an empty-results state.

Amounts are compared by their numeric value in the original currency; no exchange rates or currency conversion are applied. Date presets use the browser's local time zone and include today. Filters are combined, and selecting an option in a status tab replaces the multi-select status filter.

The page is a visual demo: the surrounding navigation is decorative, and no real payments can be created or modified. Click a payment to open its detail route. Missing details are shown as unavailable rather than presented as real payment data. The mock data's date anchor is retained for the browser session so the list and detail view agree. Relative date filters are evaluated in each viewer's local time zone, so results can differ between sessions or over time.

## Deployment

Import the repository into Vercel and deploy with the default Next.js settings. No environment variables are needed.
