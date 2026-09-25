import Lenis from "lenis";

document.documentElement.classList.add("js-ready");

const reducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
).matches;
const lenis = reducedMotion
  ? null
  : new Lenis({
      duration: 1.25,
      smoothWheel: true,
      wheelMultiplier: 0.85,
      touchMultiplier: 1.1,
    });

const scrollFrame = (time) => {
  lenis?.raf(time);
  requestAnimationFrame(scrollFrame);
};
requestAnimationFrame(scrollFrame);

document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener("click", (event) => {
    const targetId = link.getAttribute("href");
    if (!targetId || targetId === "#") return;
    const target = document.querySelector(targetId);
    if (!target) return;
    event.preventDefault();
    lenis?.scrollTo(target, { offset: -12 });
    if (!lenis) target.scrollIntoView({ behavior: "smooth" });
  });
});

const menuToggle = document.getElementById("menuToggle");
const sidebar = document.getElementById("sidebar");
const backToTop = document.getElementById("backToTop");
const certificateMarquee = document.querySelector("[data-certificate-marquee]");
let lastScrollY = window.scrollY;
let certificateShift = 0;

window.addEventListener(
  "scroll",
  () => {
    if (!certificateMarquee || reducedMotion) return;
    const nextScrollY = window.scrollY;
    const direction = nextScrollY >= lastScrollY ? -1 : 1;
    certificateShift += direction * 3;
    certificateMarquee.style.setProperty(
      "--certificate-shift",
      `${certificateShift}px`,
    );
    lastScrollY = nextScrollY;
  },
  { passive: true },
);

const introTitleLines = [
  ...document.querySelectorAll("[data-intro-normal][data-intro-away]"),
];
const introTitleCharacters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.-";
let introTitleAway = false;
let introTitleScrambleTimers = [];

const setIntroTitleState = (isAway) => {
  introTitleAway = isAway;
  introTitleScrambleTimers.forEach((timer) => window.clearInterval(timer));
  introTitleScrambleTimers = [];
  introTitleLines.forEach((line) => {
    const target = isAway ? line.dataset.introAway : line.dataset.introNormal;
    if (reducedMotion) {
      line.textContent = target;
      return;
    }
    let step = 0;
    const totalSteps = Math.max(8, target.length);
    const timer = window.setInterval(() => {
      step += 1;
      line.textContent = [...target]
        .map((character, index) => {
          if (character === " ") return " ";
          if (index < step - 2) return character;
          return introTitleCharacters[
            Math.floor(Math.random() * introTitleCharacters.length)
          ];
        })
        .join("");
      if (step > totalSteps + 2) {
        window.clearInterval(timer);
        line.textContent = target;
      }
    }, 40);
    introTitleScrambleTimers.push(timer);
  });
};

let introTitleScrollY = window.scrollY;
window.addEventListener(
  "scroll",
  () => {
    if (!introTitleLines.length) return;
    const nextScrollY = window.scrollY;
    if (nextScrollY > introTitleScrollY + 2 && !introTitleAway) {
      setIntroTitleState(true);
    }
    if (nextScrollY < introTitleScrollY - 2 && introTitleAway) {
      setIntroTitleState(false);
    }
    introTitleScrollY = nextScrollY;
  },
  { passive: true },
);

document.querySelectorAll(".intro-portrait img").forEach((image) => {
  image.addEventListener("error", () => image.classList.add("is-missing"));
});

const photoShowcase = document.querySelector("[data-photo-showcase]");
if (photoShowcase) {
  const photoSlides = [...photoShowcase.querySelectorAll("[data-photo-slide]")];
  const photoChoices = [...document.querySelectorAll("[data-photo-choice]")];
  const photoSets = {
    casual: 0,
    formal: 1,
  };
  let photoSwipeTimer;

  const playPhotoTransition = (nextPhoto) => {
    photoShowcase.style.setProperty(
      "--portrait-mask",
      `url("${nextPhoto.getAttribute("src")}")`,
    );
    photoShowcase.classList.remove("is-transitioning");
    void photoShowcase.offsetWidth;
    photoShowcase.classList.add("is-transitioning");
    window.clearTimeout(photoSwipeTimer);
    photoSwipeTimer = window.setTimeout(
      () => photoShowcase.classList.remove("is-transitioning"),
      1400,
    );
  };

  const showPhoto = (currentIndex, nextIndex) => {
    if (currentIndex === nextIndex) return;
    const currentPhoto = photoSlides[currentIndex];
    const nextPhoto = photoSlides[nextIndex];
    if (reducedMotion) {
      currentPhoto.classList.remove("is-active");
      nextPhoto.classList.add("is-active");
      return;
    }

    currentPhoto.classList.remove("is-active");
    nextPhoto.classList.add("is-active");
    playPhotoTransition(nextPhoto);
  };

  const playPhotoSet = (style) => {
    const nextIndex = photoSets[style];
    if (nextIndex === undefined) return;
    const currentIndex = photoSlides.findIndex((slide) =>
      slide.classList.contains("is-active"),
    );
    if (currentIndex !== nextIndex) {
      showPhoto(currentIndex, nextIndex);
    } else if (!reducedMotion) {
      playPhotoTransition(photoSlides[nextIndex]);
    }
    photoChoices.forEach((choice) => {
      const isSelected = choice.dataset.photoChoice === style;
      choice.classList.toggle("is-selected", isSelected);
      choice.setAttribute("aria-pressed", String(isSelected));
    });
  };

  photoChoices.forEach((choice) => {
    choice.addEventListener("click", () =>
      playPhotoSet(choice.dataset.photoChoice),
    );
  });

  playPhotoSet("casual");
}

const updateBackToTop = () => {
  backToTop?.classList.toggle(
    "is-visible",
    window.scrollY > window.innerHeight * 0.7,
  );
};

window.addEventListener("scroll", updateBackToTop, { passive: true });
updateBackToTop();

const setSidebarOpen = (open) => {
  sidebar?.classList.toggle("is-open", open);
  menuToggle?.setAttribute("aria-expanded", String(open));
  menuToggle?.setAttribute(
    "aria-label",
    open ? "Close navigation" : "Open navigation",
  );
};



const menuToggleIcon = document.getElementById("menuToggleIcon");
let currentMenuIconHref = "";

const updateMenuToggleIcon = (targetHref) => {
  if (!menuToggleIcon || !targetHref || targetHref === currentMenuIconHref) return;
  const activeLink = document.querySelector(`.sidebar-link[href="${targetHref}"]`);
  const iconHtml = activeLink?.querySelector(".sidebar-icon")?.innerHTML;
  if (!iconHtml) return;

  currentMenuIconHref = targetHref;
  menuToggleIcon.innerHTML = iconHtml;
  menuToggleIcon.classList.remove("is-changing");
  void menuToggleIcon.offsetWidth;
  menuToggleIcon.classList.add("is-changing");
};

menuToggle?.addEventListener("click", () => {
  setSidebarOpen(!sidebar?.classList.contains("is-open"));
});

document.querySelectorAll(".sidebar-link").forEach((link) => {
  link.addEventListener("click", () => {
    setSidebarOpen(false);
    const targetHref = link.getAttribute("href");
    document.querySelectorAll(".sidebar-link").forEach((item) => {
      item.classList.toggle(
        "active",
        item.getAttribute("href") === targetHref,
      );
    });
    if (targetHref) updateMenuToggleIcon(targetHref);
  });
});

const sections = document.querySelectorAll("section[id]");
const links = document.querySelectorAll(".sidebar-link");

const certificateCarousel = document.querySelector(
  "[data-certificate-carousel]",
);
if (certificateCarousel) {
  const slides = [
    ...certificateCarousel.querySelectorAll("[data-certificate-slide]"),
  ];
  const certificateTrack = certificateCarousel.querySelector(
    "[data-certificate-track]",
  );
  const current = certificateCarousel.querySelector(
    "[data-certificate-current]",
  );
  const detailFields = Object.fromEntries(
    [...certificateCarousel.querySelectorAll("[data-certificate-field]")].map(
      (field) => [field.dataset.certificateField, field],
    ),
  );
  let activeIndex = 0;
  let scrambleTimers = [];
  let swipeTimer;

  const playCertificateSwipe = () => {
    certificateCarousel.classList.remove("is-swiping");
    void certificateCarousel.offsetWidth;
    certificateCarousel.classList.add("is-swiping");
    window.clearTimeout(swipeTimer);
    swipeTimer = window.setTimeout(
      () => certificateCarousel.classList.remove("is-swiping"),
      1400,
    );
  };

  const scrambleField = (field, value) => {
    if (!field) return;
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/.-";
    const finalValue = String(value || "");
    let step = 0;
    const totalSteps = Math.max(8, finalValue.length);
    const timer = window.setInterval(() => {
      step += 1;
      field.textContent = [...finalValue]
        .map((character, index) => {
          if (character === " ") return " ";
          if (index < step - 2) return character;
          return characters[Math.floor(Math.random() * characters.length)];
        })
        .join("");
      if (step > totalSteps + 2) {
        window.clearInterval(timer);
        field.textContent = finalValue;
      }
    }, 24);
    scrambleTimers.push(timer);
  };

  const positionCertificateTrack = () => {
    if (!certificateTrack) return;
    const slideStep = certificateTrack.clientWidth;
    certificateTrack.style.transform = `translate3d(-${activeIndex * slideStep}px, 0, 0)`;
  };

  const updateCertificates = (nextIndex) => {
    activeIndex = (nextIndex + slides.length) % slides.length;
    playCertificateSwipe();
    slides.forEach((slide, index) =>
      slide.classList.toggle("is-active", index === activeIndex),
    );
    positionCertificateTrack();
    scrambleTimers.forEach((timer) => window.clearInterval(timer));
    scrambleTimers = [];
    const activeSlide = slides[activeIndex];
    scrambleField(detailFields.type, activeSlide?.dataset.type);
    scrambleField(detailFields.title, activeSlide?.dataset.title);
    scrambleField(detailFields.issuer, activeSlide?.dataset.issuer);
    scrambleField(detailFields.date, activeSlide?.dataset.date);
    if (current) current.textContent = String(activeIndex + 1).padStart(2, "0");
  };

  certificateCarousel
    .querySelector("[data-certificate-prev]")
    ?.addEventListener("click", () => updateCertificates(activeIndex - 1));
  certificateCarousel
    .querySelector("[data-certificate-next]")
    ?.addEventListener("click", () => updateCertificates(activeIndex + 1));
  certificateCarousel.querySelectorAll("img").forEach((image) => {
    image.addEventListener("error", () => image.classList.add("is-missing"));
  });
  window.addEventListener("resize", positionCertificateTrack);
}

sidebar?.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    setSidebarOpen(false);
    document.activeElement?.blur();
  }
});

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const targetHref = `#${entry.target.id}`;
      links.forEach((link) => {
        link.classList.toggle(
          "active",
          link.getAttribute("href") === targetHref,
        );
      });
      updateMenuToggleIcon(targetHref);
    });
  },
  { rootMargin: "-35% 0px -55% 0px" },
);

sections.forEach((section) => observer.observe(section));
updateMenuToggleIcon(document.querySelector(".sidebar-link.active")?.getAttribute("href") || "#intro");

const revealTargets = document.querySelectorAll(
  ".hero-top, .hero-mode, .section-head, .about-grid, .about-assets, " +
    ".project-card, .skill-group, .progress-list > div, .tech-rail, " +
    ".roadmap-stop, .contact-grid",
);

revealTargets.forEach((element, index) => {
  element.classList.add("reveal");
  element.style.setProperty(
    "--reveal-delay",
    `${Math.min(index % 5, 4) * 80}ms`,
  );
});

const revealObserver = new IntersectionObserver(
  (entries, observerInstance) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      observerInstance.unobserve(entry.target);
    });
  },
  { rootMargin: "0px 0px -10% 0px", threshold: 0.08 },
);

revealTargets.forEach((element) => revealObserver.observe(element));
