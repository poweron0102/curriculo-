(() => {
  "use strict";
  const button = document.querySelector(".menu-toggle");
  const nav = document.querySelector(".site-nav");
  if (!button || !nav) return;

  const setMenu = open => {
    document.body.classList.toggle("menu-open", open);
    button.setAttribute("aria-expanded", String(open));
    button.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
  };

  button.addEventListener("click", () => setMenu(!document.body.classList.contains("menu-open")));
  nav.addEventListener("click", event => {
    if (event.target.closest("a")) setMenu(false);
  });
  document.addEventListener("keydown", event => {
    if (event.key === "Escape") setMenu(false);
  });
})();
