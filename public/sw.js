const CACHE = "e4g-v1"

// Install: skip waiting so new SW takes over immediately
self.addEventListener("install", () => {
  self.skipWaiting()
})

// Activate: delete old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  )
})

// Fetch: network-first for navigation, cache-first for static assets
self.addEventListener("fetch", (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Only handle same-origin requests
  if (url.origin !== self.location.origin) return

  // Skip API routes, auth callbacks, and auth pages — always network
  // /login and /signup must never be cached: they handle invite tokens in URLs
  if (
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/auth/") ||
    url.pathname === "/login" ||
    url.pathname === "/signup"
  ) return

  if (request.mode === "navigate") {
    // Navigation: network first, fall back to cache
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone()
          caches.open(CACHE).then((cache) => cache.put(request, clone))
          return response
        })
        .catch(() => caches.match(request))
    )
  }
})
