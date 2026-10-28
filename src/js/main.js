(function () {
  document.documentElement.classList.add("js");
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Jaartal in de footer
  document.querySelectorAll("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });

  // Header: verbergen bij naar beneden scrollen, tonen bij omhoog scrollen
  var header = document.querySelector("[data-header]");
  var lastY = window.scrollY;
  window.addEventListener("scroll", function () {
    var y = window.scrollY;
    if (!header || document.body.classList.contains("menu-open")) return;
    if (y > lastY && y > 150) header.classList.add("is-hidden");
    else header.classList.remove("is-hidden");
    lastY = y;
  }, { passive: true });

  // Mobiel menu
  var toggle = document.querySelector("[data-menu-toggle]");
  var menu = document.getElementById("mobile-menu");
  function setMenu(open) {
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    menu.hidden = !open;
    document.body.classList.toggle("menu-open", open);
  }
  if (toggle && menu) {
    toggle.addEventListener("click", function () { setMenu(menu.hidden); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !menu.hidden) { setMenu(false); toggle.focus(); } });
    window.addEventListener("resize", function () { if (window.innerWidth >= 990 && !menu.hidden) setMenu(false); });
  }

  // Video's met eigen play-knop
  var players = Array.prototype.slice.call(document.querySelectorAll("[data-video-player]"));
  players.forEach(function (player) {
    var video = player.querySelector("video");
    var button = player.querySelector(".video-player__hit");
    if (!video || !button) return;
    function update() { player.classList.toggle("is-playing", !video.paused); button.setAttribute("aria-label", (video.paused ? "Play" : "Pause") + " video"); }
    button.addEventListener("click", function () {
      if (video.paused) {
        players.forEach(function (other) { var v = other.querySelector("video"); if (v && v !== video) v.pause(); });
        video.play().catch(function () {});
      } else {
        video.pause();
      }
    });
    video.addEventListener("play", update);
    video.addEventListener("pause", update);
    video.addEventListener("ended", function () { video.currentTime = 0; update(); });
  });

  // Slider-bolletjes (mobiel, shortfilms)
  document.querySelectorAll("[data-slider]").forEach(function (track) {
    var dots = track.parentElement.querySelector("[data-slider-dots]");
    var slides = track.children;
    if (!dots || slides.length < 2) return;
    for (var i = 0; i < slides.length; i++) {
      (function (index) {
        var b = document.createElement("button");
        b.type = "button";
        b.tabIndex = -1;
        b.addEventListener("click", function () { slides[index].scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "nearest", inline: "start" }); });
        dots.appendChild(b);
      })(i);
    }
    function mark() {
      var active = 0, best = Infinity, left = track.getBoundingClientRect().left;
      for (var i = 0; i < slides.length; i++) {
        var d = Math.abs(slides[i].getBoundingClientRect().left - left);
        if (d < best) { best = d; active = i; }
      }
      Array.prototype.forEach.call(dots.children, function (b, i) { b.setAttribute("aria-current", i === active ? "true" : "false"); });
    }
    track.addEventListener("scroll", function () { window.requestAnimationFrame(mark); }, { passive: true });
    mark();
  });

  // Equipment: afbeelding wisselt mee met de geopende vraag
  var faqs = document.querySelectorAll("[data-faq]");
  faqs.forEach(function (item) {
    item.addEventListener("toggle", function () {
      if (!item.open) return;
      faqs.forEach(function (other) { if (other !== item) other.open = false; });
      document.querySelectorAll("[data-faq-image]").forEach(function (img) {
        img.classList.toggle("is-active", img.getAttribute("data-faq-image") === item.getAttribute("data-faq"));
      });
    });
  });

  // Contactformulier: portfoliosite, het formulier verstuurt niets
  document.querySelectorAll("[data-contact-form]").forEach(function (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      form.querySelector("[data-form-status]").textContent = form.getAttribute("data-inactive-message") || "";
    });
  });

  // Rustig infaden bij scrollen
  var reveals = document.querySelectorAll(".reveal");
  if (!reduceMotion && "IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { entry.target.classList.add("is-visible"); io.unobserve(entry.target); }
      });
    }, { rootMargin: "0px 0px -10% 0px" });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("is-visible"); });
  }
})();
