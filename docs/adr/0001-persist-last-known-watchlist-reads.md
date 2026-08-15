# Persist Last-Known Watchlist Reads

Watch3r will persist user-scoped last-known Watchlist reads with TanStack Query and IndexedDB, and cache previously viewed poster images within bounded limits. This lets the PWA present a clearly marked offline view after reload without queueing shared Watchlist mutations or persisting discovery-search history; persisted data must be cleared on logout or account change.
