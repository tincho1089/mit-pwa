// The non-prod service worker
// Runs during local execution like ng serve- removes SW caching logic
// while also maintaining the standard for PWA
self.addEventListener("install", event => {
    console.log("[local-sw] Installed");
});
self.addEventListener("activate", event => {
   console.log("[local-sw] Activated");
});
self.addEventListener("fetch", event => { });