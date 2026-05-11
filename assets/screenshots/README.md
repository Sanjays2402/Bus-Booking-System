# Assets

This directory is for project screenshots referenced from the root `README.md`.
Drop PNGs here using stable names like `home.png`, `seat-select.png`,
`admin-dashboard.png`, `admin-audit.png`, `booking-confirmation.png`.

Suggested capture commands (using a 1280×800 viewport):

```bash
# Run the app
npm run dev

# In a separate shell, take screenshots with Playwright
npx playwright codegen http://localhost:5173
```

Sized assets render cleanly on GitHub's dark and light themes when they are
saved as PNG with a transparent background, but a solid dark background is
fine too — the rest of the README is dark anyway.

Once captured, link them from the README:

```md
![Home](assets/screenshots/home.png)
```
