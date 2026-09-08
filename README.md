# Designated Murals

Marketing site for **Designated** — a mural and event design practice in Boise, Idaho. Built from the Designated design system (Claude Design export): five pages — Home, Work, Process, Studio, and Book a Consult.

It is a plain static site: no framework, no build step. HTML lives in `public/`, styling in `public/css/site.css` (the design tokens + component styles), and one small script on the booking page.

## Structure

```
public/
  index.html         Home
  work.html          The Work (projects + case studies)
  process.html       The Design Process + event activation framework
  studio.html        The Studio (bio, stats)
  book.html          Book a Consult (inquiry form)
  css/site.css       Design tokens + all component styles
  assets/work/       Project photography
  fonts/             TAN-NIMBUS.otf (display font — NOT committed, see below)
  favicon.svg
vercel.json          Vercel config (serves public/, clean URLs)
```

## Run locally

Any static server works. Clean URLs (`/work` → `work.html`) match the Vercel config:

```
npx serve public
```

or `python3 -m http.server -d public 8000` (then use `/work.html`-style URLs).

## Deploy to Vercel

1. Push this repo to GitHub (already done if you're reading this there).
2. Go to [vercel.com/new](https://vercel.com/new), import `calebburb/designated-murals`.
3. Leave every setting as detected — `vercel.json` already points Vercel at `public/` with clean URLs. No build command is needed.
4. Deploy. Every push to the production branch redeploys automatically.

Or from the command line: `npm i -g vercel && vercel --prod` from the repo root.

### The display font

The display face is **TAN Nimbus** (TAN Type Foundry), self-hosted as a woff2 at `public/fonts/TAN-NIMBUS.woff2` — shipped at the site owner's decision. Note it is a licensed retail font: a proper desktop + web license from [TAN](https://tan.type-department.com) should be picked up when practical, and making this repo private (GitHub → Settings → Change visibility) reduces exposure in the meantime. Free fallback candidates evaluated earlier, if ever needed: Shrikhand, Kavoon, Chicle (all SIL OFL on Google Fonts).

## The consult form

The booking form currently shows the on-brand confirmation toast but does not send the lead anywhere. To receive requests, create a form endpoint (e.g. [Formspree](https://formspree.io), free tier) and paste its URL into `FORM_ENDPOINT` at the bottom of `public/book.html`. Until then, the phone number on the page is the only capture path — wiring this up is the single highest-leverage change on the site.

## Asset provenance

Photography and the design system come from the Claude Design project "Designated Murals Site". Images were cropped from the studio's capability deck, so resolution is limited; replace with original photography when available (same filenames in `public/assets/work/`). `south-pine-event.jpg` was recovered from a truncated transfer and is cropped shorter than the original.
