# PWA UI And Design With TanStack Router

**Decision:** Use TanStack Router for the routed application experience and `vite-plugin-pwa` for the web-platform PWA integration. Build the visible install, offline, and update experiences as React components styled primarily with the existing Tailwind/shadcn design system. Tailwind is the right default for responsive layout, visual states, and component styling; it is not a replacement for the manifest, service worker, cache strategy, service-worker lifecycle, or browser installation APIs. [TanStack Router code splitting](https://tanstack.com/router/latest/docs/framework/react/guide/code-splitting) [Vite PWA getting started](https://vite-pwa-org.netlify.app/guide/) [Tailwind custom styles](https://tailwindcss.com/docs/adding-custom-styles)

## Scope And Current State

Watch3r is a Vite/React application using TanStack Router, TanStack Query, Tailwind 4, shared shadcn primitives, and `vite-plugin-pwa`; its Vite configuration already enables TanStack Router automatic route code splitting and `VitePWA` with generated PWA assets and development service-worker support. The current PWA registration type is `autoUpdate`, and the current manifest only supplies name, short name, description, and a dark theme color. [Repository: `apps/web/package.json`](../../apps/web/package.json) [Repository: `apps/web/vite.config.ts`](../../apps/web/vite.config.ts) [Repository: `apps/web/pwa-assets.config.ts`](../../apps/web/pwa-assets.config.ts)

The existing ADR deliberately limits offline product behavior to user-scoped, last-known Watchlist reads and bounded poster-image caching. It explicitly excludes queued shared Watchlist mutations and persisted discovery-search history; retain that boundary rather than implying that all UI is editable offline. [Repository: `docs/adr/0001-persist-last-known-watchlist-reads.md`](../adr/0001-persist-last-known-watchlist-reads.md)

## Responsibility Split

| Concern | Owner | Practical implication |
| --- | --- | --- |
| URL matching, typed parameters/search, navigation, route pending/error/not-found UI, and route-level document metadata | TanStack Router | Keep Watchlist deep links as normal routes. Router code splitting reduces initial JavaScript and loads route components on demand, but it neither installs the app nor controls offline fetches. [TanStack Router code splitting](https://tanstack.com/router/latest/docs/framework/react/guide/code-splitting) [TanStack Router router context](https://tanstack.com/router/latest/docs/framework/react/guide/router-context) |
| Manifest identity, launch/display metadata, icons, service-worker registration, precache/runtime caching, and update activation | Web platform plus `vite-plugin-pwa`/Workbox | A manifest is startup metadata, while a service worker can intercept navigations and resource requests. The Vite plugin generates the manifest, service worker, and registration script from configuration. [Web App Manifest](https://www.w3.org/TR/appmanifest/) [Service Workers](https://www.w3.org/TR/service-workers/) [Vite PWA getting started](https://vite-pwa-org.netlify.app/guide/) |
| Install availability/prompt, online/offline truth, offline-ready acknowledgement, update decision, and explanation of read-only data | React application state and UI components | Browser install behavior differs by platform, so expose an optional install call-to-action only when the browser makes it available and always keep a browser-native/manual path. Model offline as an application capability state, not simply `navigator.onLine`. [web.dev installation](https://web.dev/learn/pwa/installation/) [Vite PWA prompt for update](https://vite-pwa-org.netlify.app/guide/prompt-for-update.html) |
| Visual hierarchy, adaptive layout, focus/touch affordances, design tokens, safe-area padding, and display-mode-specific presentation | Tailwind plus small global CSS where platform CSS is required | Use Tailwind utilities and existing shared primitives for most component styling. Use `@theme`, `@layer`, or a small CSS rule for reusable tokens, media queries, and `env(safe-area-inset-*)`; Tailwind supports custom CSS and arbitrary properties when no utility exists. [Tailwind custom styles](https://tailwindcss.com/docs/adding-custom-styles) [Tailwind responsive design](https://tailwindcss.com/docs/responsive-design) [web.dev app design](https://web.dev/learn/pwa/app-design/) |

## Recommended UI And Design

### Installation

- Do not use a permanent, high-priority install banner. Offer installation after a user has demonstrated value, such as returning to a Watchlist, and make dismissal durable. Installation UI must be progressive: browser and operating-system criteria differ, and iOS/iPadOS requires the user to use the share menu rather than a browser installation prompt. [web.dev installation](https://web.dev/learn/pwa/installation/)
- Present an install affordance only in browser display mode and hide it once installed. The `display-mode` media query distinguishes browser, standalone, minimal-ui, and fullscreen contexts. [web.dev app design](https://web.dev/learn/pwa/app-design/)
- Keep the app usable without installation. Installation changes launch/window integration; it is not a prerequisite for core Watchlist behavior. [web.dev installation](https://web.dev/learn/pwa/installation/)

### Offline And Data Freshness

- Place a compact, persistent offline/read-only status in the root application chrome, adjacent to the existing `ApiConnectionStatus` seam, instead of showing a toast that disappears. State exactly what remains available: previously viewed Watchlists and cached poster images; mark data as last updated when that value is available. [Repository: `apps/web/src/routes/__root.tsx`](../../apps/web/src/routes/__root.tsx) [Repository: `apps/web/src/components/api-connection-status.tsx`](../../apps/web/src/components/api-connection-status.tsx) [Repository: `docs/adr/0001-persist-last-known-watchlist-reads.md`](../adr/0001-persist-last-known-watchlist-reads.md)
- Disable or omit mutations that cannot succeed offline, explaining that collaborative changes require a connection. Do not create an optimistic queue merely to make the offline UI look native; that would contradict the ADR boundary.
- Treat a service worker as an independent, event-driven execution context that may be stopped between events. Persistent read data belongs in the chosen storage/data layer, not in service-worker in-memory state. [Service Workers](https://www.w3.org/TR/service-workers/)
- Use route pending UI for navigation/data-loading states and keep an offline empty state distinct from a route error: cached data available, no cached data, and an authentic authorization/error response are different user situations. TanStack Router supports route pending and error components as non-critical route configuration. [TanStack Router code splitting](https://tanstack.com/router/latest/docs/framework/react/guide/code-splitting)

### Updates

- Replace `registerType: "autoUpdate"` with prompt-driven registration before the product exposes offline read data. A new service worker normally waits to avoid taking over older clients that may be incompatible; forcing activation can mix old page assets with a new service worker. [web.dev update](https://web.dev/learn/pwa/update/)
- Use `virtual:pwa-register` and a small React-owned update controller. On `onNeedRefresh`, show a non-blocking banner with **Update now** and **Later**; call `updateSW()` only after the user chooses the former. On `onOfflineReady`, show one dismissible confirmation. This is the plugin's documented prompt flow. [Vite PWA prompt for update](https://vite-pwa-org.netlify.app/guide/prompt-for-update.html)
- Preserve user work: an update notification must not interrupt a form, dialog, or an in-progress Watchlist action. Update checks should not delay initial rendering. [web.dev update](https://web.dev/learn/pwa/update/)

### Icons, Launch, And Splash

- Complete the manifest with stable `id`, `start_url`, `scope`, `display: "standalone"`, `background_color`, and an icon set that includes an appropriate maskable icon. Manifest `name`, `short_name`, icons, scope, display mode, launch URL, and colors are the platform metadata that controls installed presentation; `background_color` is specifically for the period before the stylesheet is ready. [Web App Manifest](https://www.w3.org/TR/appmanifest/)
- Keep the manifest identity and start URL user-neutral. The manifest specification warns against unique user identifiers in `start_url`, and changing an app `id` makes browsers treat it as a distinct PWA. [Web App Manifest](https://www.w3.org/TR/appmanifest/) [web.dev update](https://web.dev/learn/pwa/update/)
- Retain the existing asset-generator configuration and generated 64, 192, 512, maskable, and Apple touch icon assets, but inspect the actual logo within platform masks before release. Operating systems apply different icon shapes/masks; iOS/iPadOS benefits from an explicit `apple-touch-icon`. [Repository: `apps/web/pwa-assets.config.ts`](../../apps/web/pwa-assets.config.ts) [web.dev app design](https://web.dev/learn/pwa/app-design/) [web.dev installation](https://web.dev/learn/pwa/installation/)
- Align manifest `theme_color` and `background_color` with each supported color scheme, and ensure the loaded app background matches the splash color. The app currently supports light and dark tokens but declares only a dark manifest theme color. A manifest color is a plain color, not a gradient or image. [Repository: `packages/ui/src/styles/globals.css`](../../packages/ui/src/styles/globals.css) [Repository: `apps/web/vite.config.ts`](../../apps/web/vite.config.ts) [web.dev app design](https://web.dev/learn/pwa/app-design/)

### Mobile Navigation And Window Layout

- Design the current top header as a mobile-first app bar, then add a bottom navigation only if Watchlist, dashboard, and settings become frequent peer destinations. Keep navigation controls within thumb reach, preserve visible labels or accessible names, and use active route state rather than duplicate browser history controls. The installed standalone window has no consistent browser navigation UI across platforms. [Repository: `apps/web/src/components/header.tsx`](../../apps/web/src/components/header.tsx) [web.dev app design](https://web.dev/learn/pwa/app-design/)
- Apply safe-area-aware padding to fixed headers, bottom navigation, sheets, and dialogs. This requires `viewport-fit=cover` in the viewport declaration and CSS `env(safe-area-inset-*)`; critical content and targets must remain outside notches and rounded corners. [web.dev app design](https://web.dev/learn/pwa/app-design/)
- The root uses `h-svh` and an internal scroll container, a good basis for an app-shell layout. Add safe-area tokens at this shell rather than padding every routed screen independently. [Repository: `apps/web/src/routes/__root.tsx`](../../apps/web/src/routes/__root.tsx)
- Start with unprefixed mobile utilities and layer larger-screen changes with Tailwind breakpoints. Use container queries for reusable cards whose available space varies with a sidebar or narrow desktop PWA window. [Tailwind responsive design](https://tailwindcss.com/docs/responsive-design)
- Set useful route-specific titles. In desktop standalone mode the HTML title participates in the application window and task switching; TanStack Router's root `head` and route metadata are the correct location. [web.dev app design](https://web.dev/learn/pwa/app-design/) [TanStack Router router context](https://tanstack.com/router/latest/docs/framework/react/guide/router-context)

## Implementation Options For Watch3r

### Recommended: Incremental Existing-Plugin Path

1. Keep `VitePWA`, the asset generator, TanStack Router's existing automatic code splitting, and the root app shell. No router replacement or router-specific PWA adapter is required. [Repository: `apps/web/vite.config.ts`](../../apps/web/vite.config.ts) [Repository: `apps/web/src/main.tsx`](../../apps/web/src/main.tsx) [TanStack Router code splitting](https://tanstack.com/router/latest/docs/framework/react/guide/code-splitting)
2. Expand the manifest and validate generated icons; set `display: "standalone"`, stable identity/scope/start URL, and colors matched to the application shell. [Web App Manifest](https://www.w3.org/TR/appmanifest/)
3. Change from automatic to prompt-driven service-worker registration, then put the update and offline-ready UI in a small app-level controller rendered beneath the root shell/toaster. [Vite PWA prompt for update](https://vite-pwa-org.netlify.app/guide/prompt-for-update.html) [Repository: `apps/web/src/routes/__root.tsx`](../../apps/web/src/routes/__root.tsx)
4. Implement the ADR's persisted, user-scoped read model and bounded poster cache, then render the explicit offline/read-only state in the root chrome and relevant Watchlist screens. [Repository: `docs/adr/0001-persist-last-known-watchlist-reads.md`](../adr/0001-persist-last-known-watchlist-reads.md)
5. Use Tailwind/shadcn for banners, status chips, layout, responsive navigation, and empty states. Add a small shared CSS layer only for safe areas and display-mode media queries, because these are platform CSS concerns rather than reusable utility-class composition. [Tailwind custom styles](https://tailwindcss.com/docs/adding-custom-styles) [web.dev app design](https://web.dev/learn/pwa/app-design/)

### Defer: Custom Service Worker

Move from the plugin's generated Workbox service worker to `injectManifest` only if Watch3r needs cache behavior that cannot be expressed with plugin/Workbox configuration, such as custom navigation fallbacks, authenticated request handling with explicit policy, or a future mutation-sync design. A custom service worker increases lifecycle and cache-versioning responsibility; it is not needed for the ADR's initial read-only offline scope. [Vite PWA advanced service worker](https://vite-pwa-org.netlify.app/guide/inject-manifest.html) [Service Workers](https://www.w3.org/TR/service-workers/)

## Caveats And Release Checks

- Validate actual installed behavior on Chromium desktop/Android and Safari iOS/iPadOS. Installation, install prompts, display-mode support, isolated storage, app shortcuts, and manifest updates vary by browser and operating system. [web.dev installation](https://web.dev/learn/pwa/installation/) [web.dev update](https://web.dev/learn/pwa/update/)
- Do not assume `autoUpdate` is harmless. An update may activate while an older page is open; prompt-driven activation protects compatibility and lets users choose a safe point. [web.dev update](https://web.dev/learn/pwa/update/)
- Test direct navigation and refresh for every protected deep link, both online and after the app shell has been cached. Router navigation alone does not supply an offline navigation response; that comes from service-worker/cache policy. [TanStack Router code splitting](https://tanstack.com/router/latest/docs/framework/react/guide/code-splitting) [Service Workers](https://www.w3.org/TR/service-workers/)
- Test offline after logout and account switching. The ADR requires clearing persisted user-scoped reads at those boundaries, so the offline UI must never reveal another account's Watchlist. [Repository: `docs/adr/0001-persist-last-known-watchlist-reads.md`](../adr/0001-persist-last-known-watchlist-reads.md)
- Test narrow widths, standalone display mode, light/dark themes, notch devices, keyboard focus, and reduced-motion behavior. Installed desktop windows can be very small and mobile safe areas can overlap content. [web.dev app design](https://web.dev/learn/pwa/app-design/)

## Sources

- [TanStack Router: Code Splitting](https://tanstack.com/router/latest/docs/framework/react/guide/code-splitting)
- [TanStack Router: Router Context](https://tanstack.com/router/latest/docs/framework/react/guide/router-context)
- [W3C: Web Application Manifest](https://www.w3.org/TR/appmanifest/)
- [W3C: Service Workers](https://www.w3.org/TR/service-workers/)
- [web.dev: App design](https://web.dev/learn/pwa/app-design/)
- [web.dev: Installation](https://web.dev/learn/pwa/installation/)
- [web.dev: Update](https://web.dev/learn/pwa/update/)
- [Vite PWA: Getting Started](https://vite-pwa-org.netlify.app/guide/)
- [Vite PWA: Register Service Worker](https://vite-pwa-org.netlify.app/guide/register-service-worker.html)
- [Vite PWA: Prompt for Update](https://vite-pwa-org.netlify.app/guide/prompt-for-update.html)
- [Vite PWA: Advanced Service Worker](https://vite-pwa-org.netlify.app/guide/inject-manifest.html)
- [Tailwind CSS: Adding custom styles](https://tailwindcss.com/docs/adding-custom-styles)
- [Tailwind CSS: Responsive design](https://tailwindcss.com/docs/responsive-design)
