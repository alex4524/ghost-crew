# Demo video

`make.mjs` builds the submission video from real footage: it serves `_site/`, records each
scene in Chrome with Playwright (1920×1080), narrates `script.json` with the macOS `say`
voice "Daniel", burns in captions, and joins everything with ffmpeg. The background is a
generated drone, so the video contains no third-party music.

```bash
npm run midnight && node scripts/build-site.mjs
node video/make.mjs              # → video/build/ghost-crew-demo.mp4 (about 2:17)
ONLY=05-spirit node video/make.mjs   # re-record one scene
```

The terminal scene (`cards/terminal.html`) replays the real CLI output of `npm run midnight`
from 2026-11-24.
