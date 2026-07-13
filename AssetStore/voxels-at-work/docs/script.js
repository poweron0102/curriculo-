(() => {
  "use strict";

  const body = document.body;
  const menuButton = document.querySelector("#menu-button");
  const sidebar = document.querySelector("#sidebar");
  const sidebarScrim = document.querySelector("#sidebar-scrim");
  const navLinks = [...document.querySelectorAll(".sidebar a[href^='#']")];
  const sections = [...document.querySelectorAll(".doc-section")];
  const searchInput = document.querySelector("#search-input");
  const searchStatus = document.querySelector("#search-status");

  function setMenu(open) {
    body.classList.toggle("menu-open", open);
    menuButton.setAttribute("aria-expanded", String(open));
    menuButton.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
  }

  menuButton.addEventListener("click", () => setMenu(!body.classList.contains("menu-open")));
  sidebarScrim.addEventListener("click", () => setMenu(false));
  navLinks.forEach(link => link.addEventListener("click", () => setMenu(false)));

  const observer = new IntersectionObserver(entries => {
    if (searchInput.value.trim()) return;
    const visible = entries
      .filter(entry => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (!visible) return;
    navLinks.forEach(link => {
      const active = link.getAttribute("href") === `#${visible.target.id}`;
      link.classList.toggle("active", active);
      if (active) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
  }, { rootMargin: "-18% 0px -66% 0px", threshold: [0, .05, .25, .5] });
  sections.forEach(section => observer.observe(section));

  function normalize(value) {
    return value.toLocaleLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }

  function runSearch() {
    const query = normalize(searchInput.value.trim());
    let matches = 0;

    sections.forEach(section => {
      const searchable = normalize(`${section.dataset.title || ""} ${section.textContent}`);
      const match = !query || searchable.includes(query);
      section.hidden = !match;
      if (match && query) matches++;
    });

    navLinks.forEach(link => {
      const target = document.querySelector(link.getAttribute("href"));
      link.hidden = Boolean(query) && Boolean(target?.hidden);
    });

    document.querySelectorAll(".nav-label").forEach(label => {
      if (!query) {
        label.hidden = false;
        return;
      }
      let sibling = label.nextElementSibling;
      let hasVisibleLink = false;
      while (sibling && !sibling.classList.contains("nav-label")) {
        if (sibling.matches("a") && !sibling.hidden) hasVisibleLink = true;
        sibling = sibling.nextElementSibling;
      }
      label.hidden = !hasVisibleLink;
    });

    searchStatus.classList.toggle("visible", Boolean(query));
    if (query) {
      searchStatus.textContent = matches === 1
        ? `1 section matches “${searchInput.value.trim()}”.`
        : `${matches} sections match “${searchInput.value.trim()}”.`;
    } else {
      searchStatus.textContent = "";
    }
  }

  searchInput.addEventListener("input", runSearch);
  searchInput.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      searchInput.value = "";
      runSearch();
      searchInput.blur();
    }
    if (event.key === "Enter") {
      const first = sections.find(section => !section.hidden);
      if (first) first.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });

  document.addEventListener("keydown", event => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      searchInput.focus();
      searchInput.select();
    }
  });

  async function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return;
    }
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    const copied = document.execCommand("copy");
    textarea.remove();
    if (!copied) throw new Error("Copy command failed");
  }

  document.querySelectorAll(".code-card").forEach(card => {
    const code = card.querySelector("code");
    if (!code) return;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "copy-button";
    button.textContent = "Copy";
    button.setAttribute("aria-label", "Copy code to clipboard");
    button.addEventListener("click", async () => {
      try {
        await copyText(code.textContent);
        button.textContent = "Copied";
        button.classList.add("copied");
      } catch {
        button.textContent = "Select code";
        const range = document.createRange();
        range.selectNodeContents(code);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
      }
      window.setTimeout(() => {
        button.textContent = "Copy";
        button.classList.remove("copied");
      }, 1600);
    });
    card.appendChild(button);
  });

  const lightbox = document.querySelector("#lightbox");
  const lightboxImage = lightbox.querySelector("figure img");
  const lightboxCaption = lightbox.querySelector("figcaption");
  const lightboxClose = lightbox.querySelector(".lightbox-close");
  const lightboxPrevious = lightbox.querySelector(".previous");
  const lightboxNext = lightbox.querySelector(".next");
  const gallery = [...document.querySelectorAll("img[data-lightbox]")];
  let lightboxIndex = 0;

  function showImage(index) {
    lightboxIndex = (index + gallery.length) % gallery.length;
    const source = gallery[lightboxIndex];
    lightboxImage.src = source.src;
    lightboxImage.alt = source.alt;
    lightboxCaption.textContent = source.closest("figure")?.querySelector("figcaption")?.textContent || source.alt;
  }

  gallery.forEach((image, index) => {
    image.tabIndex = 0;
    image.setAttribute("role", "button");
    image.setAttribute("aria-label", `${image.alt}. Open full-size image.`);
    const open = () => {
      showImage(index);
      lightbox.showModal();
    };
    image.addEventListener("click", open);
    image.addEventListener("keydown", event => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        open();
      }
    });
  });

  lightboxClose.addEventListener("click", () => lightbox.close());
  lightboxPrevious.addEventListener("click", () => showImage(lightboxIndex - 1));
  lightboxNext.addEventListener("click", () => showImage(lightboxIndex + 1));
  lightbox.addEventListener("click", event => {
    if (event.target === lightbox) lightbox.close();
  });
  lightbox.addEventListener("keydown", event => {
    if (event.key === "ArrowLeft") showImage(lightboxIndex - 1);
    if (event.key === "ArrowRight") showImage(lightboxIndex + 1);
  });

  document.querySelectorAll("video[autoplay]").forEach(video => {
    video.muted = true;
    video.play().catch(() => {
      video.setAttribute("controls", "");
    });
  });
})();
