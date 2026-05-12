def generate_tracker_script() -> str:
    return """
(function () {
  var currentScript = document.currentScript;
  var siteId = currentScript && currentScript.getAttribute("data-site-id");
  if (!siteId) return;

  var endpoint = new URL("/api/v1/track/event/", currentScript.src).toString();
  var queue = [];
  var maxBatchSize = 10;
  var flushTimer = null;
  var maxScroll = 0;
  var startedAt = Date.now();

  function enqueue(event) {
    queue.push(Object.assign({
      url: location.href,
      title: document.title,
      referrer: document.referrer,
      ts: new Date().toISOString()
    }, event));
    if (queue.length >= maxBatchSize) flush();
    if (!flushTimer) flushTimer = setTimeout(flush, 5000);
  }

  function flush() {
    if (!queue.length) return;
    var body = JSON.stringify({ site_id: siteId, events: queue.splice(0, maxBatchSize) });
    clearTimeout(flushTimer);
    flushTimer = null;
    if (navigator.sendBeacon) {
      navigator.sendBeacon(endpoint, new Blob([body], { type: "text/plain" }));
      return;
    }
    fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: body,
      keepalive: true,
      mode: "no-cors",
      credentials: "omit"
    }).catch(function () {});
  }

  function debounce(fn, wait) {
    var timer;
    return function () {
      clearTimeout(timer);
      timer = setTimeout(fn, wait);
    };
  }

  enqueue({ type: "pageview", scroll_depth: 0 });

  window.addEventListener("scroll", debounce(function () {
    var doc = document.documentElement;
    var total = Math.max(1, doc.scrollHeight - innerHeight);
    maxScroll = Math.max(maxScroll, Math.round((scrollY / total) * 100));
    enqueue({ type: "scroll", name: "Scroll Depth", scroll_depth: maxScroll });
  }, 1000), { passive: true });

  document.addEventListener("click", function (event) {
    var target = event.target.closest("a,button,[data-track]");
    if (!target) return;
    enqueue({
      type: "click",
      name: target.getAttribute("data-track") || target.textContent.trim().slice(0, 80) || target.tagName,
      properties: { tag: target.tagName, href: target.href || "", id: target.id || "", class: target.className || "" }
    });
  }, true);

  document.addEventListener("submit", function (event) {
    var form = event.target;
    enqueue({ type: "form_submit", name: form.getAttribute("name") || form.id || "Form Submit" });
  }, true);

  window.addEventListener("beforeunload", function () {
    enqueue({ type: "pageview", time_on_page: Math.round((Date.now() - startedAt) / 1000), scroll_depth: maxScroll });
    flush();
  });

  window.pelecTrack = function (name, properties) {
    enqueue({ type: "custom", name: name, properties: properties || {} });
  };
})();
""".strip()
