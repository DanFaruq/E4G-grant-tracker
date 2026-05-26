const CACHE = "e4g-v3"
const OFFLINE_URL = "/offline.html"

const PRECACHE = [
  "/offline.html",
  "/icon-192.png",
  "/icon-512.png",
  "/manifest.json",
]

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE))
  )
  self.skipWaiting()
})

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

self.addEventListener("fetch", (event) => {
  const { request } = event
  const url = new URL(request.url)

  if (url.origin !== self.location.origin) return

  if (
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/auth/") ||
    url.pathname === "/login" ||
    url.pathname === "/signup"
  ) return

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone()
          caches.open(CACHE).then((cache) => cache.put(request, clone))
          return response
        })
        .catch(() =>
          caches.match(request).then((cached) => cached || caches.match(OFFLINE_URL))
        )
    )
  } else {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone()
            caches.open(CACHE).then((cache) => cache.put(request, clone))
          }
          return response
        })
      })
    )
  }
})

// ── Push notifications ──────────────────────────────────────────────────────

self.addEventListener("push", (event) => {
  let data = {}
  try { data = event.data?.json() ?? {} } catch (_) {}
  const title = data.title ?? "E4G Team"
  const options = {
    body:    data.body  ?? "You have a new notification",
    icon:    "/e4g-logo.jpeg",
    badge:   "/icon-96.png",
    tag:     data.tag   ?? "e4g-notification",
    data:    { url: data.url ?? "/notifications" },
    vibrate: [200, 100, 200],
    requireInteraction: false,
  }
  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener("notificationclick", (event) => {
  event.notification.close()
  const url = event.notification.data?.url ?? "/notifications"
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      const existing = list.find((c) => c.url.includes(self.location.origin))
      if (existing) {
        existing.focus()
        existing.navigate(url)
      } else {
        clients.openWindow(url)
      }
    })
  )
})
