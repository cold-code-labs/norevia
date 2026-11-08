# Norevia — visual identity

Status: adopted 2026-11-08. Applies to the landing page and the research archive (norevia.coldcodelabs.com).
Source of truth in code: `site/src/base.css` (tokens, type, chrome), `site/lib/chrome.mjs` (top bar, footer).

## Idea
A natural-history field guide for AI swarms: living systems drawn with care, labelled like specimens,
measured like lab notes. Organic where it narrates, precise where it reports.

## Typography
Type study (three directions, rendered with the site's real copy): `docs/brand/type-study.png`.

| Direction | Display | Text | Verdict |
|---|---|---|---|
| **A · Natural history** | Fraunces (soft, "wonky" variable serif) | Hanken Grotesk | **Adopted** — organic and distinctive; reads as biology, not as another tech startup |
| B · Field lab | Bricolage Grotesque (condensed) | Bricolage Grotesque | Rejected — loud, poster-like, closer to "tech" than "living" |
| C · Editorial | Instrument Serif | Instrument Sans | Rejected — elegant but generic, weak at small sizes |

Roles:
- **Fraunces** (`--display`) — h1–h4, wordmark, manifesto, card and principle titles. Axes `SOFT 100, WONK 1`,
  optical size automatic, weight ~560 (titles) / ~400 italic for emphasis (`em`, `.it`).
- **Hanken Grotesk** (`--sans`) — body, leads, buttons, navigation.
- **JetBrains Mono** (`--mono`) — "specimen labels": kickers, status pills, ids, table headers, metadata, numbers.

All three are SIL Open Font License 1.1 (`site/src/fonts/OFL-*.txt`), self-hosted as WOFF2 (latin + latin-ext),
hashed and cached immutably; the two main faces are preloaded. No third-party font CDN.

## Colour
Paper `#f4f3ee` · card `#fbfaf6` · ink `#101312` / `#3d4340` / muted `#7d837f` · accent (leaf) `#0e7a62` ·
honey `#c98a00` · signal `#e2572b` (live/Soon dot only). Data colours: validated light categorical palette (see `site/src/style.css`).

## Motifs
Living, generative illustrations — ant colony with evaporating pheromone trails, Physarum network, hive and
waggle dance, cells and immune response, starling murmuration. Each is labelled as an illustration, never as a result;
any natural claim in copy links to an archive card with its primary source.
