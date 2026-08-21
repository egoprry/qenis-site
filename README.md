# $qenis landing page

A dependency-free static site that rebuilds the supplied design as real HTML and
CSS. Nothing is a flat image of the mockup: the title plate, buttons, contract
bar, merch card, and social row are live elements, so text stays selectable and
crisp at any zoom, and the layout reflows properly on phones.

## Links you still need to fill in

Three social buttons ship with `href="#"` placeholders. Open `index.html` and
replace them:

| Button    | Status                                  |
| --------- | --------------------------------------- |
| X         | set — `https://x.com/TheQenis`          |
| Telegram  | set — `https://t.me/+mbH20IrYeLhkZTk5`  |
| Instagram | **placeholder `#`**                     |
| YouTube   | **placeholder `#`**                     |
| TikTok    | **placeholder `#`**                     |

The pump.fun button and both copy buttons already point at the real contract.

## Contract address

Used in three places (the contract bar, the "how to buy" dialog, and that
dialog's copy card). If it ever changes, update all three `data-copy` /
visible-text occurrences in `index.html`:

```text
EkcTa8n14fXcHdfvZqCg72cTCutJnnKb19vcHwKTpump
```

The address is never truncated with an ellipsis — on very narrow screens it
wraps to two lines instead, so it can always be read and verified in full.

## Interactions

- **buy on pump.fun** opens the token page in a new tab.
- **Contract bar** copies the full address and confirms with a toast. It tries
  the async clipboard API first and falls back to a selection-based copy when
  that is unavailable or rejected (plain http, unfocused document).
- **how to buy** opens a dialog with the three buying steps plus a second copy
  button. Closes on Escape, the × button, the "Got it" button, or a
  click on the backdrop.
- Keyboard focus rings, screen-reader labels, and `prefers-reduced-motion`
  support are included throughout.

## Colour and type

Every colour in `:root` was sampled pixel-by-pixel out of
`design-refs/ref-desktop.png` and the isolated component sheet, not eyeballed.
The measured anchors:

| Surface            | Hex       |
| ------------------ | --------- |
| Sky                | `#1e5cd8` |
| Warning card       | `#0b2da6` |
| Warning gold rim   | `#e3b561` |
| Contract bar       | `#0a2fee` |
| how to buy         | `#244ef7` |
| Merch card         | `#0154da` |
| Social button      | `#2340e6` |
| pump.fun dark half | `#001a00` |
| pump.fun green     | `#22b400` |
| Verified shield    | `#fb9e2d` |
| Lettering face     | `#f6dbb6` |
| Lettering extrude  | `#ceae7b` → `#83733e` |

Rendered output was sampled back and compared against those anchors; every
surface lands within about 6% per channel, and the warning card is exact.

The supplied `bg-islands.webp` sits slightly deeper than the mockup's sky, so
`.scene` lays a thin light-blue wash over it to bring it onto `#215cd9`. If you
ever swap that background asset, re-check the wash.

Type is **Poppins** throughout — the mockup's lettering is geometric with flat
terminals, which Baloo 2 (used in the first build) did not match. The title is
Poppins 800 with a seven-step text-shadow that walks down-left through the two
measured tan tones to build the extruded edge.

## The glass button component

Every button — `how to buy`, `buy on pump.fun`, the contract bar and the five
socials — is one component, `.gbtn`, ported from
`qenis-how-to-buy-button.html`. Each instance carries the same layer stack:

```html
<button class="gbtn how-to-buy">
  <span class="gbtn-rim"></span>      <!-- translucent glass thickness -->
  <span class="gbtn-face"></span>     <!-- opaque plate + sheen + specular -->
  <span class="gbtn-glints"></span>   <!-- perimeter highlights -->
  <span class="gbtn-groove"></span>
  <span class="gbtn-lip"></span>      <!-- cyan lower lip -->
  <span class="gbtn-label">how to buy</span>
</button>
```

**How it scales.** The template was authored at a fixed 366×125. Every
dimension is divided by that 125px height and written in `em`, with the
button's `font-size` pinned to its own height — so `1em` always equals the
button height and one component fits any size. Horizontal offsets stay in `%`
so wide bars keep their proportions.

**Size a button with `--gb-h`, never `font-size` or `min-height`.** Setting
either directly breaks the em scale silently: `font-size` rescales the entire
layer stack, and the label collapses. This actually happened — leftover mobile
rules set `font-size` on `.how-to-buy` and shrank its label to 6px. There is a
check for it now (see below).

**Retinting.** The palette is in custom properties (`--gb-body`, `--gb-face`,
`--gb-rim`, `--gb-groove`, `--gb-lip`, plus rgb triplets for the edges and
glints), so a variant only overrides colours. `.pump-btn` is exactly that: the
same construction in green, keeping the mockup's hard 50/50 dark-to-vivid split.

Shape variants: `--gb-r: 50%` plus a square box makes the circular socials;
`--gb-r: 1.35rem` makes the contract bar. A button whose content is not a plain
label uses `.gbtn-content` instead of `.gbtn-label`.

## Look and feel

The glass is built from layered inset shadows rather than a flat border: a
1px bright outer ring, a cool mid ring, a dark inner seat, a specular pool
under the top edge, and weight at the bottom. That stack is what makes the
cards read as thick glass with a bevelled rim instead of translucent
rectangles. Backdrop blur is `blur(16px) saturate(1.7)`.

The panel sits at a resting 3/4 tilt (`rotateY(-7deg) rotateX(1.4deg)`) to
match the mockups, with the inner cards pushed forward on the Z axis
(`translateZ`) so they float above the glass. Tune the resting angle with two
variables in `:root`:

```css
--tilt-rest-x: 1.4deg;
--tilt-rest-y: -7deg;
```

On desktop the tilt also follows the pointer by a few degrees. That is turned
off for touch input, for `prefers-reduced-motion: reduce`, and below 921px,
where the panel is deliberately flat — a tilted panel that wide would push its
corners off screen.

No third-party library is involved. The tilt is about 30 lines of vanilla JS in
`app.js` (rAF-throttled, listeners passive), which keeps the site fully
self-contained and avoids a blocking CDN request for an effect this small.

## Layout

- **≥ 921px** — character on the left over the background; the glass panel is
  absolutely positioned and **runs off the right and bottom edges of the
  viewport**, so only its top-left corner is on screen and only that corner
  carries a radius. `right: -8vw` and `bottom: -10vh` push the other edges out
  of frame, and the matching right/bottom padding absorbs the bleed so content
  stays framed.
- **≤ 920px** — the panel reverts to a contained, flat card at
  `max-width: 40rem` and everything stacks into a single centred column; the
  warning card moves into normal flow above the panel, and the character moves
  inside the panel to stand beside the merch card.

Two constraints keep this layout honest, and both have checks:

1. **Content must stay above the fold on desktop.** The panel bleeds past the
   bottom, so nothing reflows it back into view — the content column is sized
   in `vh` units (`.title-mark` is height-driven at `23vh`) to fit. Widening
   the title or the cards can push the social row off screen.
2. **The content column is capped** at `min(62rem, 56vw)` so it does not
   stretch into the bleed. That cap is released on mobile, where the panel is
   contained again — forgetting to release it squeezes the phone layout to
   `56vw`.

The panel width and the warning width are also coupled: the warning is
`min(24rem, 25.5vw)` so it always clears the panel's left edge.

### Stacking

The leaves sit at `z-index: 10`, above the panel, so the foliage frames it.
That means anything that must stay legible has to clear them. On mobile the
panel is a **flex item**, and a flex item with a `z-index` creates a stacking
context even at `position: static` — which trapped the social row at the
panel's level and let a leaf cover the X button by 64%. The panel therefore
resets `transform`, `will-change` *and* `z-index` on mobile so `.socials` can
lift to `z-index: 12`. Removing any one of those three re-breaks it.

Verified with no horizontal overflow, no clipped text, no element covering
another, no content below the fold, and no leaf painting over a control, from
320px up to 1920px wide. Note that a plain hit-test check cannot catch the leaf
case, because the leaves are `pointer-events: none` and hit-testing sees
straight through them — it needs a pixel diff with the foliage hidden.

## Assets

Shipped in `assets/`:

| File                  | Used by                                    |
| --------------------- | ------------------------------------------ |
| `scene-wide.jpg`      | desktop background (`.scene::before`)       |
| `scene-tall.jpg`      | portrait background, ≤ 920px                |
| `qenis-wordmark.png`  | the `$qenis` title artwork (transparent)    |
| `leaves.webp`         | the three foliage overlays                  |
| `qenis.webp`          | the character (transparent)                 |
| `qenis-icon-*.png`    | favicon and web app manifest                |

The two backgrounds are downscaled to 1200px and 860px wide and saved as JPEG.
They are blurred at render time, so full resolution would be wasted bytes —
together they are under 200 KB. They live on `.scene::before` rather than
`.scene` itself so the blur cannot soften the content above them.

The title is real artwork rather than styled text, which is why it matches the
mockup's 3D bevel exactly. The `<h1>` gets its accessible name from the image's
`alt="$qenis"` — verified as a level-1 heading named `$qenis` in the
accessibility tree — so don't drop that alt.

`assets/bg-islands.webp` and `assets/qenis-design.png` are from earlier
versions and are no longer referenced. Safe to delete whenever you like.

`design-refs/` holds the original mockups and full-size PNG sources for
reference. It is not needed at runtime; leave it out when deploying.

## Run locally

```bash
npx --yes http-server -p 8123 -c-1
```

Then visit `http://localhost:8123`. Opening `index.html` straight from disk also
works, but a server is closer to production (and the clipboard API needs a
secure context, which `localhost` counts as).

## Deploy

Upload the folder to GitHub Pages, Netlify, Cloudflare Pages, Vercel, or any
static host. No build step.
