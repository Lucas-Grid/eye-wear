# LUMIÈRE — Premium Eyewear Demo Site

A complete, self-contained marketing website for a fictional premium eyewear
maison ("LUMIÈRE"), built as a static multi-page demo. No build step, no
framework, no external runtime dependencies — every image and video is bundled
in the repo so nothing 404s.

> Demo / portfolio piece. All brand names, people and locations are fictional.

## Live site
Served via GitHub Pages: **https://lucas-grid.github.io/eye-wear/**

## Pages
| File | Purpose |
|------|---------|
| `index.html` | Landing: hero video, features, collection preview, collection film, stats, testimonials, CTA |
| `collection.html` | 8-product grid with category filter (Sunglasses / Optical / Blue-light) |
| `about.html` | Brand story, craft process, sustainability, with video |
| `contact.html` | Booking form (client-side confirmation), store info, hours |

## Assets
- `assets/img/` — 8 AI-generated product / lifestyle / boutique photographs (PNG)
- `assets/video/` — 3 MP4 reels (hero, collection, about) generated locally with `ffmpeg` as Ken-Burns + crossfade slideshows (`build_videos.sh`)
- `assets/css/styles.css` — brand system (Cormorant Garamond display + Inter, gold/cream/ink palette, responsive, scroll-reveal, mobile nav)
- `assets/js/main.js` — sticky header, reveal-on-scroll, animated counters, form handling, mobile menu

## Run locally
```bash
cd eye-wear
python3 -m http.server 8000
# open http://localhost:8000
```
Or just open `index.html` in a browser.

## Regenerate the videos (optional)
```bash
bash build_videos.sh   # requires ffmpeg + the images in assets/img/
```

## Structure
```
eye-wear/
├── index.html  collection.html  about.html  contact.html
├── 404.html
├── assets/
│   ├── css/styles.css
│   ├── js/main.js
│   ├── img/*.png
│   └── video/*.mp4
├── build_videos.sh
├── check.py          # validates asset refs + HTML tag balance
├── sitemap.xml  robots.txt  favicon.svg
└── README.md
```

## Validation
`python3 check.py` verifies every page's tag balance and that all 26 asset
references resolve to real files.
