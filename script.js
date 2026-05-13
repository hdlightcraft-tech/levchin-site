const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.18 }
);

if ("scrollRestoration" in history) {
  history.scrollRestoration = "manual";
}

window.addEventListener("load", () => {
  if (!window.location.hash) {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }
});

document.querySelectorAll(".reveal").forEach((element, index) => {
  element.style.transitionDelay = `${index * 120}ms`;
  revealObserver.observe(element);
});

document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener("click", (event) => {
    const targetId = link.getAttribute("href");
    const target = document.querySelector(targetId);

    if (!target) {
      return;
    }

    event.preventDefault();
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  });
});

function stripImageTitles(root = document) {
  root.querySelectorAll("img, picture").forEach((element) => {
    element.removeAttribute("title");
    element.removeAttribute("aria-label");

    if (element instanceof HTMLImageElement) {
      element.draggable = false;
    }
  });
}

stripImageTitles();

function syncStoryViewportState() {
  if (!document.body.classList.contains("story-document")) {
    return;
  }

  const viewport = window.visualViewport;
  const width = Math.round(viewport?.width || window.innerWidth);
  const height = Math.round(viewport?.height || window.innerHeight);
  const storyHeader = document.querySelector("body.story-document .story-header");
  const shell = document.querySelector("body.story-document .site-shell");
  const firstSlide = document.querySelector("body.story-document .story-snap-intro");
  const headerHeight = Math.ceil(storyHeader?.getBoundingClientRect().height || 0);
  const shellRect = shell?.getBoundingClientRect();
  const firstSlideRect = firstSlide?.getBoundingClientRect();
  const firstSlideOffset = Math.ceil(
    shell && firstSlide && shellRect && firstSlideRect
      ? firstSlideRect.top - shellRect.top + shell.scrollTop
      : headerHeight
  );
  const isLandscape = width > height;
  const isTouchViewport =
    navigator.maxTouchPoints > 0 ||
    window.matchMedia("(pointer: coarse)").matches ||
    /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  const classes = [
    "story-vp-tablet-landscape",
    "story-vp-tablet-portrait",
    "story-vp-phone-landscape",
    "story-vp-phone-portrait",
    "story-vp-compact-landscape"
  ];

  document.body.classList.remove(...classes);
  document.body.style.setProperty("--story-vh", `${height}px`);
  document.body.style.setProperty("--story-header-height", `${headerHeight}px`);
  document.body.style.setProperty("--story-first-offset", `${Math.max(0, firstSlideOffset)}px`);

  if (!isTouchViewport) {
    return;
  }

  if (isLandscape && height <= 560) {
    document.body.classList.add("story-vp-phone-landscape", "story-vp-compact-landscape");
    return;
  }

  if (!isLandscape && width < 768) {
    document.body.classList.add("story-vp-phone-portrait");
    return;
  }

  if (isLandscape && width <= 1366) {
    document.body.classList.add("story-vp-tablet-landscape");
    return;
  }

  if (!isLandscape && width <= 1100) {
    document.body.classList.add("story-vp-tablet-portrait");
  }
}

syncStoryViewportState();
window.addEventListener("resize", syncStoryViewportState);
window.addEventListener("orientationchange", syncStoryViewportState);
window.visualViewport?.addEventListener("resize", syncStoryViewportState);

function initStorySnap() {
  const shell = document.querySelector("body.story-document .site-shell");

  if (!shell) {
    return;
  }

  const slideSelectors = [
    ".story-snap-intro",
    ".story-snap-origin",
    ".story-snap-union",
    ".story-snap-lines",
    ".story-snap-materials",
    ".story-snap-overlay",
    ".story-snap-statement",
    ".story-snap-final"
  ];
  const wheelThreshold = 44;
  const touchThreshold = 46;
  const animationDuration = 780;
  let wheelDelta = 0;
  let wheelResetTimer = 0;
  let isAnimating = false;
  let animationFrame = 0;
  let touchStartY = 0;
  let touchDeltaY = 0;
  let activeIndex = 0;
  let resizeTimer = 0;

  const easeSlide = (progress) => 1 - Math.pow(1 - progress, 3);

  const getTop = (element) => {
    const shellRect = shell.getBoundingClientRect();
    const elementRect = element.getBoundingClientRect();
    return elementRect.top - shellRect.top + shell.scrollTop;
  };

  const getTargets = () => {
    const slides = slideSelectors
      .map((selector, index) => {
        const element = document.querySelector(selector);

        if (!element) {
          return null;
        }

        return {
          element,
          isFooter: false,
          step: index + 1,
          top: index === 0 ? 0 : getTop(element)
        };
      })
      .filter(Boolean);
    const footer = document.querySelector("body.story-document .site-footer");

    if (footer) {
      slides.push({
        element: footer,
        isFooter: true,
        step: "footer",
        top: shell.scrollHeight - shell.clientHeight
      });
    }

    return slides;
  };

  const getCurrentTargetIndex = (targets = getTargets()) => {
    const currentTop = shell.scrollTop;

    return targets.reduce((closestIndex, target, index) => {
      const closest = targets[closestIndex];
      return Math.abs(target.top - currentTop) < Math.abs(closest.top - currentTop)
        ? index
        : closestIndex;
    }, 0);
  };

  const animateTo = (targetTop) => {
    window.cancelAnimationFrame(animationFrame);

    const maxTop = shell.scrollHeight - shell.clientHeight;
    const start = shell.scrollTop;
    const end = Math.max(0, Math.min(targetTop, maxTop));
    const distance = end - start;
    const startedAt = performance.now();

    if (Math.abs(distance) < 2) {
      isAnimating = false;
      return;
    }

    const step = (time) => {
      const progress = Math.min((time - startedAt) / animationDuration, 1);
      shell.scrollTop = start + distance * easeSlide(progress);

      if (progress < 1) {
        animationFrame = window.requestAnimationFrame(step);
        return;
      }

      shell.scrollTop = end;
      isAnimating = false;
    };

    animationFrame = window.requestAnimationFrame(step);
  };

  const goToTarget = (direction) => {
    const targets = getTargets();
    const currentIndex = getCurrentTargetIndex(targets);
    const nextIndex = Math.max(0, Math.min(currentIndex + direction, targets.length - 1));

    if (nextIndex === currentIndex) {
      activeIndex = currentIndex;
      return;
    }

    activeIndex = nextIndex;
    isAnimating = true;
    animateTo(targets[nextIndex].top);
  };

  if (!window.location.hash) {
    window.requestAnimationFrame(() => {
      shell.scrollTop = 0;
    });
  }

  shell.addEventListener(
    "wheel",
    (event) => {
      event.preventDefault();

      if (isAnimating) {
        return;
      }

      wheelDelta += event.deltaY;
      window.clearTimeout(wheelResetTimer);
      wheelResetTimer = window.setTimeout(() => {
        wheelDelta = 0;
      }, 150);

      if (Math.abs(wheelDelta) < wheelThreshold) {
        return;
      }

      const direction = wheelDelta > 0 ? 1 : -1;
      wheelDelta = 0;
      goToTarget(direction);
    },
    { passive: false }
  );

  shell.addEventListener(
    "touchstart",
    (event) => {
      touchStartY = event.touches[0]?.clientY || 0;
      touchDeltaY = 0;
    },
    { passive: true }
  );

  shell.addEventListener(
    "touchmove",
    (event) => {
      const currentY = event.touches[0]?.clientY || touchStartY;
      touchDeltaY = touchStartY - currentY;

      if (isAnimating || Math.abs(touchDeltaY) > 8) {
        event.preventDefault();
      }
    },
    { passive: false }
  );

  shell.addEventListener(
    "touchend",
    (event) => {
      if (isAnimating) {
        return;
      }

      const touchEndY = event.changedTouches[0]?.clientY || touchStartY;
      const delta = touchDeltaY || touchStartY - touchEndY;

      if (Math.abs(delta) < touchThreshold) {
        return;
      }

      goToTarget(delta > 0 ? 1 : -1);
    },
    { passive: true }
  );

  document.addEventListener("keydown", (event) => {
    if (!document.body.classList.contains("story-document") || isAnimating) {
      return;
    }

    if (["ArrowDown", "PageDown", " "].includes(event.key)) {
      event.preventDefault();
      goToTarget(1);
    }

    if (["ArrowUp", "PageUp"].includes(event.key)) {
      event.preventDefault();
      goToTarget(-1);
    }
  });

  window.addEventListener("resize", () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      const targets = getTargets();
      const nextIndex = Math.max(0, Math.min(activeIndex, targets.length - 1));

      if (targets[nextIndex]) {
        shell.scrollTop = targets[nextIndex].top;
      }
    }, 160);
  });
}

initStorySnap();

document.addEventListener("dragstart", (event) => {
  if (event.target.closest("img, picture, .story-visual, .story-media")) {
    event.preventDefault();
  }
});

document.addEventListener("contextmenu", (event) => {
  if (event.target.closest("img, picture, .story-visual, .story-media")) {
    event.preventDefault();
  }
});

document.addEventListener("selectstart", (event) => {
  if (event.target.closest("img, picture, .story-visual, .story-media")) {
    event.preventDefault();
  }
});

const imageProtectionObserver = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    mutation.addedNodes.forEach((node) => {
      if (!(node instanceof HTMLElement)) {
        return;
      }

      if (node.matches("img, picture")) {
        stripImageTitles(node.parentElement || node);
      } else if (node.querySelector("img, picture")) {
        stripImageTitles(node);
      }
    });
  });
});

imageProtectionObserver.observe(document.body, {
  childList: true,
  subtree: true
});

const languageSelect = document.querySelector("[data-language-select]");
const savedLanguage = localStorage.getItem("levchin-language");
const dismissedLanguageSuggestion = localStorage.getItem("levchin-language-suggestion-dismissed");
const supportedLanguages = ["fr", "en", "es", "de", "it", "pt", "ja", "ko", "zh"];
const languageDisplayNames = {
  fr: "Français",
  en: "English",
  es: "Español",
  de: "Deutsch",
  it: "Italiano",
  pt: "Português",
  ja: "日本語",
  ko: "한국어",
  zh: "中文"
};
const phoneSearchPlaceholders = {
  fr: "Rechercher un pays ou un indicatif",
  en: "Search a country or dialing code",
  es: "Buscar un país o prefijo",
  de: "Land oder Vorwahl suchen",
  it: "Cerca un paese o prefisso",
  pt: "Pesquisar país ou indicativo",
  ja: "国名または国番号を検索",
  ko: "국가 또는 국가번호 검색",
  zh: "搜索国家或区号"
};
const phoneCountryEntries = [
  { region: "FR", dial: "+33" }, { region: "BE", dial: "+32" }, { region: "CH", dial: "+41" },
  { region: "LU", dial: "+352" }, { region: "MC", dial: "+377" }, { region: "AD", dial: "+376" },
  { region: "ES", dial: "+34" }, { region: "PT", dial: "+351" }, { region: "IT", dial: "+39" },
  { region: "SM", dial: "+378" }, { region: "VA", dial: "+379" }, { region: "DE", dial: "+49" },
  { region: "AT", dial: "+43" }, { region: "NL", dial: "+31" }, { region: "GB", dial: "+44" },
  { region: "IE", dial: "+353" }, { region: "DK", dial: "+45" }, { region: "SE", dial: "+46" },
  { region: "NO", dial: "+47" }, { region: "FI", dial: "+358" }, { region: "IS", dial: "+354" },
  { region: "PL", dial: "+48" }, { region: "CZ", dial: "+420" }, { region: "SK", dial: "+421" },
  { region: "HU", dial: "+36" }, { region: "RO", dial: "+40" }, { region: "BG", dial: "+359" },
  { region: "GR", dial: "+30" }, { region: "HR", dial: "+385" }, { region: "SI", dial: "+386" },
  { region: "RS", dial: "+381" }, { region: "BA", dial: "+387" }, { region: "ME", dial: "+382" },
  { region: "MK", dial: "+389" }, { region: "AL", dial: "+355" }, { region: "XK", dial: "+383" },
  { region: "EE", dial: "+372" }, { region: "LV", dial: "+371" }, { region: "LT", dial: "+370" },
  { region: "UA", dial: "+380" }, { region: "MD", dial: "+373" }, { region: "RU", dial: "+7" },
  { region: "TR", dial: "+90" }, { region: "CY", dial: "+357" }, { region: "MT", dial: "+356" },
  { region: "US_CA", dial: "+1", aliases: "etats unis etatsunis etat unis usa us united states america amerique canada" }, { region: "MX", dial: "+52" },
  { region: "BR", dial: "+55" }, { region: "AR", dial: "+54" }, { region: "CL", dial: "+56" },
  { region: "CO", dial: "+57" }, { region: "PE", dial: "+51" }, { region: "UY", dial: "+598" },
  { region: "PY", dial: "+595" }, { region: "BO", dial: "+591" }, { region: "EC", dial: "+593" },
  { region: "VE", dial: "+58" }, { region: "CR", dial: "+506" }, { region: "PA", dial: "+507" },
  { region: "DO", dial: "+1-809" }, { region: "CU", dial: "+53" }, { region: "JM", dial: "+1-876" },
  { region: "GT", dial: "+502" }, { region: "HN", dial: "+504" }, { region: "SV", dial: "+503" },
  { region: "NI", dial: "+505" }, { region: "PR", dial: "+1-787" }, { region: "BS", dial: "+1-242" },
  { region: "MA", dial: "+212" }, { region: "DZ", dial: "+213" }, { region: "TN", dial: "+216" },
  { region: "EG", dial: "+20" }, { region: "LY", dial: "+218" }, { region: "SN", dial: "+221" },
  { region: "CI", dial: "+225" }, { region: "GH", dial: "+233" }, { region: "NG", dial: "+234" },
  { region: "CM", dial: "+237" }, { region: "ET", dial: "+251" }, { region: "KE", dial: "+254" },
  { region: "TZ", dial: "+255" }, { region: "UG", dial: "+256" }, { region: "RW", dial: "+250" },
  { region: "ZA", dial: "+27" }, { region: "NA", dial: "+264" }, { region: "BW", dial: "+267" },
  { region: "ZM", dial: "+260" }, { region: "ZW", dial: "+263" }, { region: "MZ", dial: "+258" },
  { region: "AO", dial: "+244" }, { region: "MG", dial: "+261" }, { region: "MU", dial: "+230" },
  { region: "RE", dial: "+262" }, { region: "AE", dial: "+971" }, { region: "SA", dial: "+966" },
  { region: "QA", dial: "+974" }, { region: "KW", dial: "+965" }, { region: "BH", dial: "+973" },
  { region: "OM", dial: "+968" }, { region: "JO", dial: "+962" }, { region: "LB", dial: "+961" },
  { region: "IL", dial: "+972" }, { region: "IQ", dial: "+964" }, { region: "IR", dial: "+98" },
  { region: "IN", dial: "+91" }, { region: "PK", dial: "+92" }, { region: "BD", dial: "+880" },
  { region: "LK", dial: "+94" }, { region: "NP", dial: "+977" }, { region: "CN", dial: "+86" },
  { region: "HK", dial: "+852" }, { region: "MO", dial: "+853" }, { region: "TW", dial: "+886" },
  { region: "JP", dial: "+81" }, { region: "KR", dial: "+82" }, { region: "SG", dial: "+65" },
  { region: "MY", dial: "+60" }, { region: "TH", dial: "+66" }, { region: "VN", dial: "+84" },
  { region: "ID", dial: "+62" }, { region: "PH", dial: "+63" }, { region: "KH", dial: "+855" },
  { region: "LA", dial: "+856" }, { region: "MM", dial: "+95" }, { region: "AU", dial: "+61" },
  { region: "NZ", dial: "+64" }, { region: "FJ", dial: "+679" }, { region: "PF", dial: "+689" }
];
const phoneRegionFallbackNames = {
  fr: { XK: "Kosovo", US_CA: "États-Unis / Canada" },
  en: { XK: "Kosovo", US_CA: "United States / Canada" },
  es: { XK: "Kosovo", US_CA: "Estados Unidos / Canadá" },
  de: { XK: "Kosovo", US_CA: "Vereinigte Staaten / Kanada" },
  it: { XK: "Kosovo", US_CA: "Stati Uniti / Canada" },
  pt: { XK: "Kosovo", US_CA: "Estados Unidos / Canadá" },
  ja: { XK: "コソボ" },
  ko: { XK: "코소보" },
  zh: { XK: "科索沃" }
};
const phoneRegionDisplayNames = {
  fr: { US_CA: "États-Unis / Canada" },
  en: { US_CA: "United States / Canada" },
  es: { US_CA: "Estados Unidos / Canadá" },
  de: { US_CA: "Vereinigte Staaten / Kanada" },
  it: { US_CA: "Stati Uniti / Canada" },
  pt: { US_CA: "Estados Unidos / Canadá" },
  ja: { US_CA: "アメリカ合衆国 / カナダ" },
  ko: { US_CA: "미국 / 캐나다" },
  zh: { US_CA: "美国 / 加拿大" }
};
let currentLanguage = savedLanguage || "fr";
let languageCustomButton;
let languageCustomOptions = [];
let languageCustomLabel;
const enhancedSelects = [];

function normalizeLanguage(value) {
  if (!value) {
    return null;
  }

  const shortCode = value.toLowerCase().split("-")[0];
  return supportedLanguages.includes(shortCode) ? shortCode : null;
}

function normalizeSearchValue(value) {
  return (value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’'`-]/g, " ")
    .replace(/[^a-z0-9+ ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function levenshteinDistance(a, b) {
  const rows = a.length + 1;
  const cols = b.length + 1;
  const matrix = Array.from({ length: rows }, () => Array(cols).fill(0));

  for (let i = 0; i < rows; i += 1) matrix[i][0] = i;
  for (let j = 0; j < cols; j += 1) matrix[0][j] = j;

  for (let i = 1; i < rows; i += 1) {
    for (let j = 1; j < cols; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  return matrix[a.length][b.length];
}

function fuzzyTokenMatch(queryToken, targetToken) {
  if (!queryToken || !targetToken) return false;
  if (targetToken.includes(queryToken) || queryToken.includes(targetToken)) return true;
  const tolerance = queryToken.length <= 4 ? 1 : 2;
  return levenshteinDistance(queryToken, targetToken) <= tolerance;
}

function searchMatches(query, searchIndex) {
  if (!query) return true;
  const normalizedQuery = normalizeSearchValue(query);
  const normalizedTarget = normalizeSearchValue(searchIndex);
  if (!normalizedQuery) return true;
  if (normalizedTarget.includes(normalizedQuery)) return true;

  const queryTokens = normalizedQuery.split(" ");
  const targetTokens = normalizedTarget.split(" ");

  return queryTokens.every((queryToken) =>
    targetTokens.some((targetToken) => fuzzyTokenMatch(queryToken, targetToken))
  );
}

function getLocalizedRegionName(region, language) {
  const displayName = phoneRegionDisplayNames[language]?.[region] || phoneRegionDisplayNames.fr?.[region];
  if (displayName) {
    return displayName;
  }
  const fallback = phoneRegionFallbackNames[language]?.[region] || phoneRegionFallbackNames.fr[region];
  try {
    const formatter = new Intl.DisplayNames([language], { type: "region" });
    return formatter.of(region) || fallback || region;
  } catch {
    return fallback || region;
  }
}

function populatePhoneCodeSelect(select, language = currentLanguage || "fr") {
  if (!select) return;

  const previousValue = select.value || "+33";
  const previousSearchPlaceholder = phoneSearchPlaceholders[language] || phoneSearchPlaceholders.fr;
  select.dataset.searchPlaceholder = previousSearchPlaceholder;

  select.innerHTML = "";
  const collator = new Intl.Collator(language, { sensitivity: "base" });
  const localizedEntries = phoneCountryEntries
    .map(({ region, dial, aliases }) => ({
      region,
      dial,
      aliases,
      regionName: getLocalizedRegionName(region, language)
    }))
    .sort((a, b) => collator.compare(a.regionName, b.regionName));

  localizedEntries.forEach(({ region, dial, regionName, aliases }) => {
    const option = document.createElement("option");
    option.value = `${region}|${dial}`;
    option.dataset.dial = dial;
    option.textContent = `${regionName} (${dial})`;
    option.dataset.searchIndex = `${regionName} ${dial} ${region} ${aliases || ""}`;
    select.appendChild(option);
  });

  const matchingOption = Array.from(select.options).find(
    (option) => option.value === previousValue || option.dataset.dial === previousValue
  );
  const fallbackOption = Array.from(select.options).find((option) => option.dataset.dial === "+33");
  select.value = matchingOption?.value || fallbackOption?.value || select.options[0]?.value || "";
}

function getPreferredBrowserLanguage() {
  const candidates = navigator.languages?.length ? navigator.languages : [navigator.language];
  let hasNonFrenchPreference = false;

  for (const candidate of candidates) {
    if (!candidate) {
      continue;
    }

    const shortCode = candidate.toLowerCase().split("-")[0];

    if (shortCode === "fr") {
      return "fr";
    }

    if (supportedLanguages.includes(shortCode)) {
      return shortCode;
    }

    hasNonFrenchPreference = true;
  }

  return hasNonFrenchPreference ? "en" : null;
}

function renderBalancedAboutCopy(element, language) {
  const text = element.dataset[language];

  if (!text) {
    return;
  }

  if (language !== "fr") {
    element.textContent = text;
    return;
  }

  const breakText = " Sans plastique synthétique polluant";
  const nowrapText = "plus consciente.";
  const breakIndex = text.indexOf(breakText);
  const nowrapIndex = text.lastIndexOf(nowrapText);

  if (breakIndex === -1 || nowrapIndex === -1) {
    element.textContent = text;
    return;
  }

  const beforeBreak = text.slice(0, breakIndex);
  const afterBreakBeforeNowrap = text.slice(breakIndex + 1, nowrapIndex);
  const nowrap = text.slice(nowrapIndex);
  const lineBreak = document.createElement("br");
  const nowrapSpan = document.createElement("span");

  lineBreak.className = "about-copy-break";
  nowrapSpan.className = "about-nowrap";
  nowrapSpan.textContent = nowrap;

  element.replaceChildren(
    document.createTextNode(beforeBreak),
    lineBreak,
    document.createTextNode(` ${afterBreakBeforeNowrap}`),
    nowrapSpan
  );
}

const storyTranslationKeys = [
  "UNE MAISON DE CRÉATION, FRANÇAISE",
  "LEVCHIN est une maison française de création fondée par Gaspard Levchin et Julian Lafaye.",
  "Elle naît d’une envie claire. Construire une maison capable de créer ses propres pièces, ses propres signes, son propre rythme. Une maison qui ne cherche pas à suivre un mouvement déjà installé, mais à faire exister un univers précis, reconnaissable et durable.",
  "LEVCHIN commence à partir de trois territoires proches de la vie réelle. Le lieu, le corps, le geste. C’est là que se rencontrent les objets, les accessoires et les vêtements. C’est là aussi que la maison veut créer quelque chose qui compte.",
  "L’ORIGINE SENSIBLE",
  "Avant LEVCHIN, il y a un regard.",
  "Gaspard grandit avec une attention forte aux formes, aux images, aux matières et aux détails qui restent. Une lumière, une coupe, un volume, une façade, un objet bien placé peuvent suffire à changer la perception d’un moment.",
  "Son parcours passe par l’image, l’architecture photographiée, les objets, les vêtements et la relation directe avec les clients. Peu à peu, une évidence se forme. Il ne s’agit plus seulement d’observer, de collectionner des références ou d’admirer ce qui existe déjà. Il faut créer à son tour.",
  "LEVCHIN naît de ce passage. Du moment où l’imaginaire doit devenir matière.",
  "L’UNION AU CŒUR",
  "Gaspard choisit très vite de construire cette aventure avec Julian. Leur lien précède la maison. Il apporte une base humaine, simple et fidèle.",
  "Gaspard porte la direction créative, le dessin des pièces, l’univers général et la structure de LEVCHIN. Julian accompagne la construction visuelle et graphique de la maison avec son regard, sa technique et son sens de l’équilibre.",
  "Leur rôle est de poser les bases concrète. Chercher les bonnes formes. Trouver les bonnes matières. Choisir les bons rythmes. Avancer sans brûler ce qui doit prendre le temps d’exister.",
  "LES PREMIÈRES LIGNES",
  "Une création LEVCHIN peut partir d’un croquis, d’une matière, d’une proportion, d’un détail aperçu quelque part ou d’une idée qui revient avec insistance.",
  "Puis vient le travail réel. Dessiner, essayer, corriger, recommencer. Tester un volume. Regarder un poids. Comprendre une finition. Vérifier qu’une pièce tient dans l’usage, dans le corps, dans le lieu.",
  "Une idée seule ne suffit pas. Elle doit passer dans la matière. Elle doit gagner en précision. Elle doit devenir quelque chose que l’on peut choisir, porter, poser, déplacer, garder.",
  "C’est dans ce passage que la maison se construit vraiment.",
  "MATIÈRES, FABRICATION, RESPONSABILITÉ",
  "LEVCHIN veut avancer avec une exigence concrète. La matière choisie, l’atelier, la finition, l’emballage, le volume produit et la manière de livrer font partie de chaque création.",
  "La maison défend une fabrication française, des matériaux sourcés européens, une attention à la durée et une recherche de solutions plus responsables. Ces choix ne sont pas là pour décorer le discours. Ils doivent tenir dans les faits.",
  "La précommande s’inscrit dans cette logique. Produire plus près de la demande, limiter le superflu, suivre chaque pièce avec plus d’attention et donner plus de valeur au moment où elle arrive entre les mains de celui ou celle qui l’a choisie.",
  "L’écologie, la transparence et la durée ne remplacent pas le désir. Elles donnent un cadre à la création.",
  "LE SENS DES CHOSES",
  "LEVCHIN ne veut pas devenir une marque qui ajoute des produits au monde par réflexe. La maison veut créer peu, mais créer avec poids.",
  "Chaque création devra avoir une raison d’être. Une forme tenue. Une matière juste. Une fonction claire ou une force d’usage. Quelque chose qui donne envie de s’en approcher, de la garder, de la faire entrer dans sa vie.",
  "La maison avance avec cette idée simple. Une pièce réussie ne se contente pas d’être vue. Elle reste.",
  "DES PIÈCES INÉDITES POUR DES VIES UNIQUES",
  "Une pièce commence avec ceux qui la dessinent. Elle change lorsqu’elle rencontre quelqu’un.",
  "Elle peut devenir un vêtement que l’on porte souvent, un objet que l’on déplace dans son intérieur, un accessoire lié à une habitude, un détail que l’on associe à une période de sa vie.",
  "C’est là que LEVCHIN prend son sens. Dans le lien entre la maison, la création et la personne qui la choisit.",
  "La maison souhaite construire cette relation dès ses débuts. Avec attention, avec exigence, et avec le respect de ceux qui décideront de lui faire une place.",
  "NOUVELLE MAISON, PREMIER MOUVEMENT",
  "LEVCHIN est encore au début.",
  "Les premières créations devront installer la direction, poser les matières, les formes, les images et les gestes qui feront reconnaître la maison. Elles devront montrer ce que LEVCHIN vaut, non par de grands discours, mais par la manière dont elles seront pensées, fabriquées, présentées et reçues.",
  "Ce premier mouvement ouvre la suite. Une maison française de création en train de prendre forme, pièce après pièce, avec l’ambition de construire un univers durable, désirable et reconnaissable."
];

const storyTranslations = {
  es: [
    "UNA CASA DE CREACIÓN, FRANCESA",
    "LEVCHIN es una casa francesa de creación fundada por Gaspard Levchin y Julian Lafaye.",
    "Nace de un deseo claro. Construir una casa capaz de crear sus propias piezas, sus propios signos, su propio ritmo. Una casa que no busca seguir un movimiento ya establecido, sino hacer existir un universo preciso, reconocible y duradero.",
    "LEVCHIN comienza a partir de tres territorios cercanos a la vida real. El lugar, el cuerpo, el gesto. Allí se encuentran los objetos, los accesorios y las prendas. Allí también la casa quiere crear algo que importe.",
    "EL ORIGEN SENSIBLE",
    "Antes de LEVCHIN, hay una mirada.",
    "Gaspard crece con una fuerte atención a las formas, las imágenes, las materias y los detalles que permanecen. Una luz, un corte, un volumen, una fachada o un objeto bien situado pueden bastar para cambiar la percepción de un momento.",
    "Su recorrido pasa por la imagen, la arquitectura fotografiada, los objetos, la ropa y la relación directa con los clientes. Poco a poco, una evidencia toma forma. Ya no se trata solo de observar, reunir referencias o admirar lo que existe. Hay que crear a su vez.",
    "LEVCHIN nace de ese paso. Del momento en que el imaginario debe convertirse en materia.",
    "LA UNIÓN EN EL CENTRO",
    "Gaspard elige muy pronto construir esta aventura con Julian. Su vínculo precede a la casa. Aporta una base humana, simple y fiel.",
    "Gaspard lleva la dirección creativa, el dibujo de las piezas, el universo general y la estructura de LEVCHIN. Julian acompaña la construcción visual y gráfica de la casa con su mirada, su técnica y su sentido del equilibrio.",
    "Su papel es establecer bases concretas. Buscar las formas correctas. Encontrar las materias adecuadas. Elegir los ritmos justos. Avanzar sin quemar aquello que necesita tiempo para existir.",
    "LAS PRIMERAS LÍNEAS",
    "Una creación LEVCHIN puede partir de un boceto, una materia, una proporción, un detalle visto en alguna parte o una idea que vuelve con insistencia.",
    "Luego llega el trabajo real. Dibujar, probar, corregir, empezar de nuevo. Probar un volumen. Mirar un peso. Comprender un acabado. Verificar que una pieza se sostiene en el uso, en el cuerpo, en el lugar.",
    "Una idea sola no basta. Debe pasar a la materia. Debe ganar precisión. Debe convertirse en algo que se pueda elegir, llevar, colocar, desplazar, conservar.",
    "Es en ese paso donde la casa se construye realmente.",
    "MATERIAS, FABRICACIÓN, RESPONSABILIDAD",
    "LEVCHIN quiere avanzar con una exigencia concreta. La materia elegida, el taller, el acabado, el embalaje, el volumen producido y la forma de entregar forman parte de cada creación.",
    "La casa defiende una fabricación francesa, materiales de origen europeo, atención a la duración y búsqueda de soluciones más responsables. Estas elecciones no decoran el discurso. Deben sostenerse en los hechos.",
    "La preventa se inscribe en esta lógica. Producir más cerca de la demanda, limitar lo superfluo, seguir cada pieza con más atención y dar más valor al momento en que llega a las manos de quien la eligió.",
    "La ecología, la transparencia y la duración no sustituyen el deseo. Le dan un marco a la creación.",
    "EL SENTIDO DE LAS COSAS",
    "LEVCHIN no quiere convertirse en una marca que añade productos al mundo por reflejo. La casa quiere crear poco, pero crear con peso.",
    "Cada creación deberá tener una razón de ser. Una forma sostenida. Una materia justa. Una función clara o una fuerza de uso. Algo que invite a acercarse, a conservarlo, a hacerlo entrar en la vida.",
    "La casa avanza con esta idea simple. Una pieza lograda no se conforma con ser vista. Permanece.",
    "PIEZAS INÉDITAS PARA VIDAS ÚNICAS",
    "Una pieza comienza con quienes la dibujan. Cambia cuando encuentra a alguien.",
    "Puede convertirse en una prenda que se lleva a menudo, un objeto que se desplaza en un interior, un accesorio ligado a una costumbre, un detalle asociado a una etapa de la vida.",
    "Ahí es donde LEVCHIN cobra sentido. En el vínculo entre la casa, la creación y la persona que la elige.",
    "La casa desea construir esta relación desde sus inicios. Con atención, con exigencia y con respeto hacia quienes decidan darle un lugar.",
    "NUEVA CASA, PRIMER MOVIMIENTO",
    "LEVCHIN todavía está en sus comienzos.",
    "Las primeras creaciones deberán instalar la dirección, plantear las materias, las formas, las imágenes y los gestos que harán reconocer la casa. Deberán mostrar lo que vale LEVCHIN, no con grandes discursos, sino por la forma en que serán pensadas, fabricadas, presentadas y recibidas.",
    "Este primer movimiento abre lo que sigue. Una casa francesa de creación que toma forma, pieza tras pieza, con la ambición de construir un universo duradero, deseable y reconocible."
  ],
  de: [
    "EIN FRANZÖSISCHES HAUS DER KREATION",
    "LEVCHIN ist ein französisches Haus der Kreation, gegründet von Gaspard Levchin und Julian Lafaye.",
    "Es entsteht aus einem klaren Wunsch. Ein Haus zu bauen, das eigene Stücke, eigene Zeichen und einen eigenen Rhythmus schafft. Ein Haus, das keiner bestehenden Bewegung folgen will, sondern ein präzises, erkennbares und dauerhaftes Universum entstehen lässt.",
    "LEVCHIN beginnt mit drei Bereichen, die dem wirklichen Leben nahestehen. Ort, Körper, Geste. Dort begegnen sich Objekte, Accessoires und Kleidung. Dort will das Haus auch etwas schaffen, das zählt.",
    "DER SENSIBLE URSPRUNG",
    "Vor LEVCHIN steht ein Blick.",
    "Gaspard wächst mit einer starken Aufmerksamkeit für Formen, Bilder, Materialien und bleibende Details auf. Ein Licht, ein Schnitt, ein Volumen, eine Fassade oder ein richtig platzierter Gegenstand können genügen, um die Wahrnehmung eines Moments zu verändern.",
    "Sein Weg führt über das Bild, fotografierte Architektur, Objekte, Kleidung und die direkte Beziehung zu Kunden. Nach und nach entsteht eine Gewissheit. Es geht nicht mehr nur darum, zu beobachten, Referenzen zu sammeln oder Bestehendes zu bewundern. Es gilt, selbst zu schaffen.",
    "LEVCHIN entsteht aus diesem Übergang. Aus dem Moment, in dem Vorstellung zu Materie werden muss.",
    "DIE VERBINDUNG IM HERZEN",
    "Gaspard entscheidet sich sehr früh, dieses Abenteuer mit Julian aufzubauen. Ihre Verbindung geht dem Haus voraus. Sie gibt ihm eine menschliche, einfache und treue Grundlage.",
    "Gaspard trägt die kreative Leitung, den Entwurf der Stücke, das gesamte Universum und die Struktur von LEVCHIN. Julian begleitet den visuellen und grafischen Aufbau des Hauses mit seinem Blick, seiner Technik und seinem Sinn für Gleichgewicht.",
    "Ihre Aufgabe ist es, konkrete Grundlagen zu legen. Die richtigen Formen suchen. Die richtigen Materialien finden. Die richtigen Rhythmen wählen. Vorangehen, ohne das zu verbrennen, was Zeit braucht, um zu existieren.",
    "DIE ERSTEN LINIEN",
    "Eine LEVCHIN-Kreation kann mit einer Skizze, einem Material, einer Proportion, einem irgendwo gesehenen Detail oder einer Idee beginnen, die beharrlich wiederkehrt.",
    "Dann beginnt die eigentliche Arbeit. Zeichnen, ausprobieren, korrigieren, neu beginnen. Ein Volumen testen. Ein Gewicht betrachten. Eine Verarbeitung verstehen. Prüfen, ob ein Stück im Gebrauch, am Körper, an einem Ort Bestand hat.",
    "Eine Idee allein genügt nicht. Sie muss in die Materie übergehen. Sie muss an Präzision gewinnen. Sie muss zu etwas werden, das man wählen, tragen, platzieren, bewegen und bewahren kann.",
    "In diesem Übergang baut sich das Haus wirklich auf.",
    "MATERIALIEN, FERTIGUNG, VERANTWORTUNG",
    "LEVCHIN will mit konkretem Anspruch vorangehen. Das gewählte Material, die Werkstatt, die Verarbeitung, die Verpackung, die produzierte Menge und die Art der Lieferung gehören zu jeder Kreation.",
    "Das Haus steht für französische Fertigung, europäisch bezogene Materialien, Aufmerksamkeit für Dauer und die Suche nach verantwortungsvolleren Lösungen. Diese Entscheidungen sollen den Diskurs nicht schmücken. Sie müssen in den Fakten bestehen.",
    "Die Vorbestellung gehört zu dieser Logik. Näher am Bedarf produzieren, Überflüssiges begrenzen, jedes Stück aufmerksamer begleiten und dem Moment mehr Wert geben, in dem es bei der Person ankommt, die es gewählt hat.",
    "Ökologie, Transparenz und Dauer ersetzen nicht das Begehren. Sie geben der Kreation einen Rahmen.",
    "DER SINN DER DINGE",
    "LEVCHIN will keine Marke werden, die der Welt aus Reflex Produkte hinzufügt. Das Haus will wenig schaffen, aber mit Gewicht.",
    "Jede Kreation muss einen Grund haben zu existieren. Eine gehaltene Form. Ein richtiges Material. Eine klare Funktion oder eine Kraft im Gebrauch. Etwas, das den Wunsch weckt, sich zu nähern, es zu behalten und in das eigene Leben aufzunehmen.",
    "Das Haus geht mit dieser einfachen Idee voran. Ein gelungenes Stück begnügt sich nicht damit, gesehen zu werden. Es bleibt.",
    "UNGESEHENE STÜCKE FÜR EINZIGARTIGE LEBEN",
    "Ein Stück beginnt bei denen, die es zeichnen. Es verändert sich, wenn es jemandem begegnet.",
    "Es kann zu einem Kleidungsstück werden, das man oft trägt, zu einem Objekt, das man im eigenen Raum bewegt, zu einem Accessoire, das mit einer Gewohnheit verbunden ist, zu einem Detail, das man mit einer Lebensphase verbindet.",
    "Dort findet LEVCHIN seinen Sinn. In der Verbindung zwischen dem Haus, der Kreation und der Person, die sie wählt.",
    "Das Haus möchte diese Beziehung von Anfang an aufbauen. Mit Aufmerksamkeit, mit Anspruch und mit Respekt gegenüber denen, die ihm einen Platz geben.",
    "NEUES HAUS, ERSTE BEWEGUNG",
    "LEVCHIN steht noch am Anfang.",
    "Die ersten Kreationen müssen die Richtung setzen, die Materialien, Formen, Bilder und Gesten bestimmen, an denen man das Haus erkennt. Sie müssen zeigen, was LEVCHIN wert ist, nicht durch große Reden, sondern durch die Art, wie sie gedacht, gefertigt, präsentiert und aufgenommen werden.",
    "Diese erste Bewegung öffnet das Weitere. Ein französisches Haus der Kreation, das Stück für Stück Gestalt annimmt, mit dem Anspruch, ein dauerhaftes, begehrenswertes und erkennbares Universum aufzubauen."
  ],
  it: [
    "UNA CASA DI CREAZIONE, FRANCESE",
    "LEVCHIN è una casa francese di creazione fondata da Gaspard Levchin e Julian Lafaye.",
    "Nasce da un desiderio chiaro. Costruire una casa capace di creare i propri pezzi, i propri segni, il proprio ritmo. Una casa che non cerca di seguire un movimento già installato, ma di far esistere un universo preciso, riconoscibile e duraturo.",
    "LEVCHIN comincia da tre territori vicini alla vita reale. Il luogo, il corpo, il gesto. È lì che si incontrano oggetti, accessori e abiti. È lì anche che la casa vuole creare qualcosa che conta.",
    "L’ORIGINE SENSIBILE",
    "Prima di LEVCHIN, c’è uno sguardo.",
    "Gaspard cresce con una forte attenzione alle forme, alle immagini, alle materie e ai dettagli che restano. Una luce, un taglio, un volume, una facciata o un oggetto ben posizionato possono bastare a cambiare la percezione di un momento.",
    "Il suo percorso passa dall’immagine, dall’architettura fotografata, dagli oggetti, dagli abiti e dalla relazione diretta con i clienti. Poco a poco, si forma un’evidenza. Non si tratta più solo di osservare, raccogliere riferimenti o ammirare ciò che esiste già. Bisogna creare a propria volta.",
    "LEVCHIN nasce da questo passaggio. Dal momento in cui l’immaginario deve diventare materia.",
    "L’UNIONE AL CUORE",
    "Gaspard sceglie molto presto di costruire questa avventura con Julian. Il loro legame precede la casa. Le dà una base umana, semplice e fedele.",
    "Gaspard porta la direzione creativa, il disegno dei pezzi, l’universo generale e la struttura di LEVCHIN. Julian accompagna la costruzione visiva e grafica della casa con il suo sguardo, la sua tecnica e il suo senso dell’equilibrio.",
    "Il loro ruolo è porre basi concrete. Cercare le forme giuste. Trovare le materie giuste. Scegliere i ritmi giusti. Avanzare senza bruciare ciò che deve prendersi il tempo di esistere.",
    "LE PRIME LINEE",
    "Una creazione LEVCHIN può partire da uno schizzo, una materia, una proporzione, un dettaglio visto da qualche parte o un’idea che ritorna con insistenza.",
    "Poi arriva il lavoro reale. Disegnare, provare, correggere, ricominciare. Testare un volume. Guardare un peso. Capire una finitura. Verificare che un pezzo regga nell’uso, nel corpo, nel luogo.",
    "Un’idea da sola non basta. Deve passare nella materia. Deve guadagnare precisione. Deve diventare qualcosa che si può scegliere, indossare, posare, spostare, conservare.",
    "È in questo passaggio che la casa si costruisce davvero.",
    "MATERIE, FABBRICAZIONE, RESPONSABILITÀ",
    "LEVCHIN vuole avanzare con un’esigenza concreta. La materia scelta, l’atelier, la finitura, l’imballaggio, il volume prodotto e il modo di consegnare fanno parte di ogni creazione.",
    "La casa difende una fabbricazione francese, materiali di provenienza europea, attenzione alla durata e ricerca di soluzioni più responsabili. Queste scelte non servono a decorare il discorso. Devono reggere nei fatti.",
    "Il preordine si inserisce in questa logica. Produrre più vicino alla domanda, limitare il superfluo, seguire ogni pezzo con più attenzione e dare più valore al momento in cui arriva tra le mani di chi lo ha scelto.",
    "Ecologia, trasparenza e durata non sostituiscono il desiderio. Danno un quadro alla creazione.",
    "IL SENSO DELLE COSE",
    "LEVCHIN non vuole diventare un marchio che aggiunge prodotti al mondo per riflesso. La casa vuole creare poco, ma creare con peso.",
    "Ogni creazione dovrà avere una ragione d’essere. Una forma tenuta. Una materia giusta. Una funzione chiara o una forza d’uso. Qualcosa che faccia venire voglia di avvicinarsi, conservarla, farla entrare nella propria vita.",
    "La casa avanza con questa idea semplice. Un pezzo riuscito non si accontenta di essere visto. Resta.",
    "PEZZI INEDITI PER VITE UNICHE",
    "Un pezzo comincia con chi lo disegna. Cambia quando incontra qualcuno.",
    "Può diventare un abito che si indossa spesso, un oggetto che si sposta nel proprio interno, un accessorio legato a un’abitudine, un dettaglio associato a un periodo della vita.",
    "È lì che LEVCHIN prende senso. Nel legame tra la casa, la creazione e la persona che la sceglie.",
    "La casa desidera costruire questa relazione fin dai suoi inizi. Con attenzione, con esigenza e con rispetto per chi deciderà di farle spazio.",
    "NUOVA CASA, PRIMO MOVIMENTO",
    "LEVCHIN è ancora all’inizio.",
    "Le prime creazioni dovranno installare la direzione, porre le materie, le forme, le immagini e i gesti che faranno riconoscere la casa. Dovranno mostrare quanto vale LEVCHIN, non con grandi discorsi, ma attraverso il modo in cui saranno pensate, fabbricate, presentate e ricevute.",
    "Questo primo movimento apre il seguito. Una casa francese di creazione che prende forma, pezzo dopo pezzo, con l’ambizione di costruire un universo duraturo, desiderabile e riconoscibile."
  ],
  pt: [
    "UMA CASA DE CRIAÇÃO, FRANCESA",
    "LEVCHIN é uma casa francesa de criação fundada por Gaspard Levchin e Julian Lafaye.",
    "Nasce de um desejo claro. Construir uma casa capaz de criar as suas próprias peças, os seus próprios sinais, o seu próprio ritmo. Uma casa que não procura seguir um movimento já instalado, mas fazer existir um universo preciso, reconhecível e duradouro.",
    "LEVCHIN começa a partir de três territórios próximos da vida real. O lugar, o corpo, o gesto. É aí que se encontram os objetos, os acessórios e as roupas. É também aí que a casa quer criar algo que conta.",
    "A ORIGEM SENSÍVEL",
    "Antes de LEVCHIN, há um olhar.",
    "Gaspard cresce com uma forte atenção às formas, às imagens, às matérias e aos detalhes que permanecem. Uma luz, um corte, um volume, uma fachada ou um objeto bem colocado podem bastar para mudar a perceção de um momento.",
    "O seu percurso passa pela imagem, pela arquitetura fotografada, pelos objetos, pelas roupas e pela relação direta com os clientes. Pouco a pouco, forma-se uma evidência. Já não se trata apenas de observar, reunir referências ou admirar o que já existe. É preciso criar por sua vez.",
    "LEVCHIN nasce dessa passagem. Do momento em que o imaginário deve tornar-se matéria.",
    "A UNIÃO NO CENTRO",
    "Gaspard escolhe muito cedo construir esta aventura com Julian. A ligação entre eles precede a casa. Traz-lhe uma base humana, simples e fiel.",
    "Gaspard conduz a direção criativa, o desenho das peças, o universo geral e a estrutura de LEVCHIN. Julian acompanha a construção visual e gráfica da casa com o seu olhar, a sua técnica e o seu sentido de equilíbrio.",
    "O papel deles é lançar bases concretas. Procurar as formas certas. Encontrar as matérias certas. Escolher os ritmos certos. Avançar sem queimar aquilo que precisa de tempo para existir.",
    "AS PRIMEIRAS LINHAS",
    "Uma criação LEVCHIN pode partir de um esboço, de uma matéria, de uma proporção, de um detalhe visto algures ou de uma ideia que regressa com insistência.",
    "Depois vem o trabalho real. Desenhar, experimentar, corrigir, recomeçar. Testar um volume. Observar um peso. Compreender um acabamento. Verificar que uma peça se sustenta no uso, no corpo, no lugar.",
    "Uma ideia sozinha não basta. Deve passar para a matéria. Deve ganhar precisão. Deve tornar-se algo que se pode escolher, vestir, pousar, deslocar, guardar.",
    "É nessa passagem que a casa se constrói verdadeiramente.",
    "MATÉRIAS, FABRICAÇÃO, RESPONSABILIDADE",
    "LEVCHIN quer avançar com uma exigência concreta. A matéria escolhida, o atelier, o acabamento, a embalagem, o volume produzido e a forma de entregar fazem parte de cada criação.",
    "A casa defende uma fabricação francesa, materiais de origem europeia, atenção à duração e procura de soluções mais responsáveis. Estas escolhas não existem para decorar o discurso. Devem sustentar-se nos factos.",
    "A pré-encomenda inscreve-se nesta lógica. Produzir mais perto da procura, limitar o supérfluo, acompanhar cada peça com mais atenção e dar mais valor ao momento em que chega às mãos de quem a escolheu.",
    "A ecologia, a transparência e a duração não substituem o desejo. Dão um enquadramento à criação.",
    "O SENTIDO DAS COISAS",
    "LEVCHIN não quer tornar-se uma marca que acrescenta produtos ao mundo por reflexo. A casa quer criar pouco, mas criar com peso.",
    "Cada criação deverá ter uma razão de ser. Uma forma sustentada. Uma matéria justa. Uma função clara ou uma força de uso. Algo que dê vontade de se aproximar, de guardar, de fazer entrar na vida.",
    "A casa avança com esta ideia simples. Uma peça bem-sucedida não se contenta em ser vista. Permanece.",
    "PEÇAS INÉDITAS PARA VIDAS ÚNICAS",
    "Uma peça começa com quem a desenha. Muda quando encontra alguém.",
    "Pode tornar-se uma roupa que se usa muitas vezes, um objeto que se desloca no interior, um acessório ligado a um hábito, um detalhe associado a um período da vida.",
    "É aí que LEVCHIN ganha sentido. Na ligação entre a casa, a criação e a pessoa que a escolhe.",
    "A casa deseja construir esta relação desde os seus primeiros passos. Com atenção, com exigência e com respeito por quem decidir dar-lhe um lugar.",
    "NOVA CASA, PRIMEIRO MOVIMENTO",
    "LEVCHIN ainda está no início.",
    "As primeiras criações deverão instalar a direção, colocar as matérias, as formas, as imagens e os gestos que farão reconhecer a casa. Deverão mostrar o valor de LEVCHIN, não por grandes discursos, mas pela forma como serão pensadas, fabricadas, apresentadas e recebidas.",
    "Este primeiro movimento abre o que vem a seguir. Uma casa francesa de criação a tomar forma, peça após peça, com a ambição de construir um universo duradouro, desejável e reconhecível."
  ],
  ja: [
    "フランスのクリエーションメゾン",
    "LEVCHINは、Gaspard LevchinとJulian Lafayeによって創設されたフランスのクリエーションメゾンです。",
    "それは明確な願いから生まれます。自らのピース、自らの記号、自らのリズムを生み出せるメゾンを築くこと。既存の流れに従うのではなく、精密で、認識でき、持続する世界を存在させること。",
    "LEVCHINは、現実の生活に近い三つの領域から始まります。場所、身体、所作。そこにオブジェ、アクセサリー、衣服が出会います。そこにこそ、メゾンは意味のあるものを生み出したいと考えています。",
    "感性の起点",
    "LEVCHINの前には、ひとつの視線があります。",
    "Gaspardは、形、イメージ、素材、そして残り続ける細部への強い意識とともに育ちました。光、カット、量感、ファサード、よく置かれたオブジェだけで、ある瞬間の見え方は変わります。",
    "彼の歩みは、イメージ、撮影された建築、オブジェ、衣服、そして顧客との直接的な関係へと広がります。少しずつ、確信が形になります。見るだけ、参照を集めるだけ、既にあるものを称えるだけでは足りない。自ら創る時が来たのです。",
    "LEVCHINはその移行から生まれます。想像が素材にならなければならない瞬間から。",
    "中心にある結びつき",
    "Gaspardは早い段階で、この冒険をJulianと築くことを選びました。二人の関係はメゾンに先立つものです。人間的で、シンプルで、誠実な基盤を与えます。",
    "Gaspardはクリエイティブディレクション、ピースのデザイン、全体の世界観、LEVCHINの構造を担います。Julianはその視線、技術、バランス感覚によって、メゾンの視覚的・グラフィックな構築を支えます。",
    "二人の役割は、具体的な基盤を置くことです。正しい形を探すこと。正しい素材を見つけること。正しいリズムを選ぶこと。存在するために時間を必要とするものを急がずに進むこと。",
    "最初の線",
    "LEVCHINのクリエーションは、スケッチ、素材、比率、どこかで見た細部、あるいは何度も戻ってくるアイデアから始まります。",
    "その後に本当の仕事が始まります。描く、試す、直す、また始める。量感を試す。重さを見る。仕上げを理解する。ピースが使用の中で、身体の上で、場所の中で成り立つかを確かめる。",
    "アイデアだけでは足りません。それは素材へ移らなければなりません。精度を得なければなりません。選び、身につけ、置き、動かし、保ちたいものにならなければなりません。",
    "この移行の中で、メゾンは本当に築かれていきます。",
    "素材、製造、責任",
    "LEVCHINは具体的な基準を持って進みたいと考えています。選ばれる素材、工房、仕上げ、包装、生産量、届け方は、すべてのクリエーションの一部です。",
    "メゾンはフランスでの製造、ヨーロッパ由来の素材、耐久性への配慮、より責任ある解決策の探求を大切にします。これらの選択は言葉を飾るためではありません。事実として成り立たなければなりません。",
    "プレオーダーはこの考え方に含まれます。需要に近く生産し、余分を抑え、一つひとつのピースをより丁寧に見届け、選んだ人の手に届く瞬間により大きな価値を与えるためです。",
    "エコロジー、透明性、耐久性は欲望に取って代わるものではありません。クリエーションに枠組みを与えるものです。",
    "ものの意味",
    "LEVCHINは、反射的に世界へ商品を増やすブランドにはなりたくありません。メゾンは少なく創り、しかし重みを持って創りたいと考えています。",
    "すべてのクリエーションには存在する理由が必要です。保たれた形。正しい素材。明確な機能、あるいは使う力。近づきたい、保ちたい、自分の生活に迎え入れたいと思わせる何か。",
    "メゾンはこのシンプルな考えとともに進みます。成功したピースは、見られるだけでは終わりません。残ります。",
    "唯一の人生のための未発表のピース",
    "ピースは、それを描く人々から始まります。誰かと出会った時に変わります。",
    "それはよく着る衣服になり、室内で動かされるオブジェになり、習慣に結びつくアクセサリーになり、人生のある時期と結びつく細部になることがあります。",
    "そこにLEVCHINの意味があります。メゾン、クリエーション、そしてそれを選ぶ人との結びつきの中に。",
    "メゾンは初めからこの関係を築きたいと考えています。注意深く、基準を持ち、場所を与えてくれる人々への敬意とともに。",
    "新しいメゾン、最初の動き",
    "LEVCHINはまだ始まりにいます。",
    "最初のクリエーションは、方向性を定め、素材、形、イメージ、所作を置き、メゾンを認識させるものにならなければなりません。大きな言葉ではなく、考えられ、作られ、提示され、受け取られる方法によって、LEVCHINの価値を示す必要があります。",
    "この最初の動きが次を開きます。ピースごとに形を取っていくフランスのクリエーションメゾン。持続し、望まれ、認識される世界を築くという志とともに。"
  ],
  ko: [
    "프랑스 크리에이션 하우스",
    "LEVCHIN은 Gaspard Levchin과 Julian Lafaye가 설립한 프랑스 크리에이션 하우스입니다.",
    "그 시작에는 분명한 바람이 있습니다. 자기만의 피스, 자기만의 기호, 자기만의 리듬을 만들어내는 하우스를 세우는 것. 이미 자리 잡은 흐름을 따르기보다, 정확하고 알아볼 수 있으며 오래 지속될 세계를 존재하게 하는 것입니다.",
    "LEVCHIN은 실제 삶에 가까운 세 영역에서 시작합니다. 장소, 몸, 몸짓. 그곳에서 오브제, 액세서리, 의복이 만납니다. 또한 그곳에서 하우스는 의미 있는 것을 만들고자 합니다.",
    "감각적인 시작",
    "LEVCHIN 이전에는 하나의 시선이 있습니다.",
    "Gaspard는 형태, 이미지, 소재, 그리고 오래 남는 디테일에 대한 강한 관심 속에서 성장했습니다. 하나의 빛, 컷, 볼륨, 파사드, 잘 놓인 오브제만으로도 한 순간의 인식은 달라질 수 있습니다.",
    "그의 여정은 이미지, 사진으로 담은 건축, 오브제, 의복, 그리고 고객과의 직접적인 관계를 지나갑니다. 조금씩 하나의 확신이 생깁니다. 더 이상 관찰하고, 레퍼런스를 모으고, 이미 존재하는 것을 감상하는 것만으로는 충분하지 않습니다. 이제 스스로 만들어야 합니다.",
    "LEVCHIN은 이 전환에서 태어납니다. 상상이 물질이 되어야 하는 순간에서.",
    "중심에 있는 결합",
    "Gaspard는 아주 일찍 Julian과 함께 이 여정을 만들기로 선택했습니다. 두 사람의 관계는 하우스보다 먼저 존재합니다. 그것은 인간적이고 단순하며 충실한 기반을 줍니다.",
    "Gaspard는 크리에이티브 디렉션, 피스의 디자인, 전체 세계관과 LEVCHIN의 구조를 이끕니다. Julian은 자신의 시선, 기술, 균형 감각으로 하우스의 시각적·그래픽적 구축을 함께합니다.",
    "그들의 역할은 구체적인 기반을 세우는 것입니다. 올바른 형태를 찾는 것. 올바른 소재를 찾는 것. 올바른 리듬을 선택하는 것. 존재하기 위해 시간이 필요한 것을 서두르지 않고 앞으로 나아가는 것.",
    "첫 번째 선들",
    "LEVCHIN의 창작은 스케치, 소재, 비례, 어딘가에서 본 디테일, 혹은 집요하게 되돌아오는 아이디어에서 시작될 수 있습니다.",
    "그다음에는 실제 작업이 옵니다. 그리고, 시도하고, 수정하고, 다시 시작합니다. 볼륨을 시험합니다. 무게를 봅니다. 마감을 이해합니다. 피스가 사용 속에서, 몸 위에서, 장소 안에서 버틸 수 있는지 확인합니다.",
    "아이디어만으로는 충분하지 않습니다. 그것은 물질로 옮겨가야 합니다. 정밀함을 얻어야 합니다. 선택하고, 입고, 놓고, 옮기고, 간직할 수 있는 것이 되어야 합니다.",
    "바로 이 전환 속에서 하우스는 진정으로 지어집니다.",
    "소재, 제작, 책임",
    "LEVCHIN은 구체적인 기준과 함께 나아가고자 합니다. 선택한 소재, 아틀리에, 마감, 포장, 생산량, 전달 방식은 모든 창작의 일부입니다.",
    "하우스는 프랑스 제작, 유럽에서 소싱한 소재, 오래 지속되는 품질, 더 책임 있는 해결책을 향한 탐구를 지향합니다. 이러한 선택은 담론을 꾸미기 위한 것이 아닙니다. 실제로 성립해야 합니다.",
    "프리오더는 이 논리 안에 있습니다. 수요에 더 가까이 생산하고, 불필요한 것을 줄이며, 각 피스를 더 세심하게 따라가고, 그것을 선택한 사람의 손에 도착하는 순간에 더 큰 가치를 부여하기 위해서입니다.",
    "생태, 투명성, 지속성은 욕망을 대체하지 않습니다. 그것들은 창작에 하나의 틀을 부여합니다.",
    "사물의 의미",
    "LEVCHIN은 반사적으로 세상에 제품을 더하는 브랜드가 되고 싶지 않습니다. 하우스는 적게 만들되, 무게 있게 만들고자 합니다.",
    "각 창작에는 존재 이유가 있어야 합니다. 잡힌 형태. 적절한 소재. 분명한 기능 또는 사용의 힘. 가까이 다가가고 싶고, 간직하고 싶고, 삶 안으로 들이고 싶게 만드는 무언가.",
    "하우스는 이 단순한 생각과 함께 나아갑니다. 성공한 피스는 보이는 것에 그치지 않습니다. 남습니다.",
    "고유한 삶을 위한 새로운 피스들",
    "피스는 그것을 그리는 사람들로부터 시작됩니다. 누군가를 만날 때 변화합니다.",
    "그것은 자주 입는 옷이 될 수도 있고, 실내에서 옮겨지는 오브제가 될 수도 있으며, 습관과 연결된 액세서리나 삶의 한 시기와 연결되는 디테일이 될 수도 있습니다.",
    "그곳에서 LEVCHIN은 의미를 얻습니다. 하우스, 창작, 그리고 그것을 선택하는 사람 사이의 연결 속에서.",
    "하우스는 시작부터 이 관계를 구축하고자 합니다. 세심함과 기준, 그리고 자리를 내어주기로 한 사람들에 대한 존중과 함께.",
    "새로운 하우스, 첫 움직임",
    "LEVCHIN은 아직 시작점에 있습니다.",
    "첫 창작들은 방향을 세우고, 소재와 형태, 이미지와 몸짓을 놓아 하우스를 알아볼 수 있게 해야 합니다. 거창한 말이 아니라, 그것들이 생각되고, 제작되고, 제시되고, 받아들여지는 방식으로 LEVCHIN의 가치를 보여주어야 합니다.",
    "이 첫 움직임은 다음을 엽니다. 피스 하나하나를 통해 형태를 갖추어가는 프랑스 크리에이션 하우스. 지속 가능하고, 바람직하며, 알아볼 수 있는 세계를 구축하려는 야망과 함께."
  ],
  zh: [
    "法国创作之家",
    "LEVCHIN 是由 Gaspard Levchin 与 Julian Lafaye 创立的法国创作之家。",
    "它诞生于一个清晰的愿望。建立一座能够创造自身作品、自身符号、自身节奏的 maison。它不追随既有的潮流，而是让一个精准、可识别、可持续的世界真正存在。",
    "LEVCHIN 从三个贴近真实生活的领域开始。场所、身体、姿态。物件、配饰与服装在这里相遇。也正是在这里，LEVCHIN 想创造真正有意义的东西。",
    "感性的起点",
    "在 LEVCHIN 之前，先有一种观看方式。",
    "Gaspard 从小便关注形态、影像、材质以及那些会留下来的细节。一束光、一个剪裁、一个体量、一面立面、一个摆放得当的物件，都足以改变一个瞬间的感受。",
    "他的路径经过影像、被摄影记录的建筑、物件、服装，以及与客户的直接关系。渐渐地，一个事实成形。不再只是观察、收集参照或欣赏已经存在的事物。必须开始亲自创造。",
    "LEVCHIN 诞生于这一转变。诞生于想象必须成为材质的时刻。",
    "核心中的联结",
    "Gaspard 很早就选择与 Julian 一起建立这段冒险。他们的关系先于 maison 本身，为它带来一种人性的、简单而忠实的基础。",
    "Gaspard 负责创意方向、作品设计、整体世界观以及 LEVCHIN 的结构。Julian 以他的目光、技术和对平衡的感知，参与 maison 的视觉与图形构建。",
    "他们的角色是奠定具体的基础。寻找正确的形态。找到正确的材质。选择正确的节奏。不急于消耗那些需要时间才能存在的事物。",
    "最初的线条",
    "一件 LEVCHIN 创作可以从一张草图、一种材质、一个比例、某处看到的细节，或一个反复出现的想法开始。",
    "随后是真正的工作。绘制，尝试，修正，重新开始。测试体量。观察重量。理解收口。确认一件作品能否在使用中、身体上、空间里成立。",
    "仅有想法并不够。它必须进入材质。必须获得精度。必须成为可以被选择、穿着、放置、移动、保存的东西。",
    "正是在这一转化中，maison 真正被建立起来。",
    "材质、制造、责任",
    "LEVCHIN 希望以具体的标准前进。被选择的材质、工坊、完成度、包装、生产数量以及交付方式，都是每一件创作的一部分。",
    "Maison 坚持法国制造、欧洲来源的材质、对持久性的关注，以及对更负责任方案的探索。这些选择不是为了装饰话语。它们必须在事实中成立。",
    "预购属于这一逻辑。更接近需求地生产，限制多余，给予每一件作品更多关注，并让它抵达选择者手中的那一刻拥有更高的价值。",
    "生态、透明与持久并不取代欲望。它们为创作提供框架。",
    "事物的意义",
    "LEVCHIN 不想成为一个本能地向世界增加产品的品牌。Maison 想少量地创造，但创造得有重量。",
    "每一件创作都必须有存在的理由。被把握住的形态。合适的材质。清晰的功能或使用的力量。某种让人想靠近、保存，并让它进入生活的东西。",
    "Maison 带着这个简单的想法前进。一件成功的作品不只是被看见。它会留下。",
    "为独特生活而生的 inédit 作品",
    "一件作品从绘制它的人开始。当它遇见某个人时，它会改变。",
    "它可以成为一件常穿的衣服，一个在室内被移动的物件，一个与习惯相连的配饰，一个被关联到人生某段时期的细节。",
    "LEVCHIN 的意义正在于此。存在于 maison、创作以及选择它的人之间的关系里。",
    "Maison 希望从一开始就建立这种关系。以专注、以标准，也以对那些愿意为它留出位置的人们的尊重。",
    "新 maison，第一步",
    "LEVCHIN 仍处在开端。",
    "最初的创作需要确立方向，放置材质、形态、影像与姿态，让 maison 被识别。它们必须展示 LEVCHIN 的价值，不靠宏大的话语，而靠它们被思考、制造、呈现与接收的方式。",
    "这第一步打开之后的道路。一座法国创作之家正在一件一件地成形，怀着建立一个持久、令人渴望且可识别的世界的愿望。"
  ]
};

function getStoryTranslation(element, language) {
  const directTranslation = element.dataset[`story${language.charAt(0).toUpperCase()}${language.slice(1)}`];

  if (directTranslation) {
    return directTranslation;
  }

  const storyIndex = storyTranslationKeys.indexOf(element.dataset.storyFr);
  return storyTranslations[language]?.[storyIndex] || element.dataset.storyEn || element.dataset.storyFr;
}

function setLanguage(language) {
  currentLanguage = language;
  document.documentElement.lang = language;
  localStorage.setItem("levchin-language", language);

  document
    .querySelectorAll("[data-fr][data-en][data-es][data-it][data-ja][data-zh][data-de][data-ko][data-pt]")
    .forEach((element) => {
    if (element.hasAttribute("data-balanced-about")) {
      renderBalancedAboutCopy(element, language);
      return;
    }

    const buttonText = element.querySelector(":scope > .button-text");
    if (buttonText) {
      buttonText.textContent = element.dataset[language];
      return;
    }

    element.textContent = element.dataset[language];
  });

  document
    .querySelectorAll("[data-story-fr]")
    .forEach((element) => {
      element.textContent = getStoryTranslation(element, language);
    });

  document
    .querySelectorAll(
      "[data-fr-placeholder][data-en-placeholder][data-es-placeholder][data-it-placeholder][data-ja-placeholder][data-zh-placeholder][data-de-placeholder][data-ko-placeholder][data-pt-placeholder]"
    )
    .forEach((element) => {
    element.placeholder = element.dataset[`${language}Placeholder`];
  });

  if (languageSelect) {
    languageSelect.value = language;
  }

  if (languageCustomButton && languageSelect) {
    const selectedOption = languageSelect.querySelector(`option[value="${language}"]`);
    languageCustomButton.firstElementChild.textContent = selectedOption?.textContent || language;

    languageCustomOptions.forEach((option) => {
      const isActive = option.dataset.languageValue === language;
      option.classList.toggle("is-active", isActive);
      option.setAttribute("aria-selected", String(isActive));
    });
  }

  if (languageCustomLabel?.dataset[language]) {
    languageCustomLabel.textContent = languageCustomLabel.dataset[language];
  }

  document.dispatchEvent(
    new CustomEvent("levchin:languagechange", {
      detail: { language }
    })
  );
}

function dismissLanguageSuggestion() {
  localStorage.setItem("levchin-language-suggestion-dismissed", "true");
  document.querySelector("[data-language-suggestion]")?.remove();
}

function maybeOfferLanguageSuggestion() {
  const preferredLanguage = getPreferredBrowserLanguage();

  if (savedLanguage || dismissedLanguageSuggestion === "true" || !preferredLanguage || preferredLanguage === "fr") {
    return;
  }

  const suggestion = document.createElement("div");
  const targetLabel = languageDisplayNames[preferredLanguage] || preferredLanguage.toUpperCase();

  suggestion.className = "language-suggestion";
  suggestion.dataset.languageSuggestion = "";
  suggestion.innerHTML = `
    <p class="language-suggestion-copy">Ce site est disponible en <strong>${targetLabel}</strong>. Souhaitez-vous changer de langue ?</p>
    <div class="language-suggestion-actions">
      <button type="button" class="language-suggestion-confirm">Passer en ${targetLabel}</button>
      <button type="button" class="language-suggestion-dismiss">Rester en français</button>
    </div>
  `;

  suggestion.querySelector(".language-suggestion-confirm")?.addEventListener("click", () => {
    setLanguage(preferredLanguage);
    dismissLanguageSuggestion();
  });

  suggestion.querySelector(".language-suggestion-dismiss")?.addEventListener("click", () => {
    dismissLanguageSuggestion();
  });

  document.body.appendChild(suggestion);
}

function syncEnhancedSelect(enhancedSelect) {
  const { select, button, options, searchInput } = enhancedSelect;
  const selectedOption = select.options[select.selectedIndex];

  if (button?.firstElementChild) {
    button.firstElementChild.textContent = selectedOption?.textContent || "";
  }

  options.forEach((optionButton, index) => {
    const nativeOption = select.options[index];
    optionButton.textContent = nativeOption?.textContent || "";
    optionButton.dataset.searchIndex = nativeOption?.dataset.searchIndex || nativeOption?.textContent || "";
    optionButton.classList.toggle("is-active", nativeOption?.value === select.value);
    optionButton.setAttribute("aria-selected", String(nativeOption?.value === select.value));
  });

  if (searchInput) {
    searchInput.placeholder = select.dataset.searchPlaceholder || phoneSearchPlaceholders.fr;
    searchInput.value = "";
    options.forEach((optionButton) => {
      optionButton.parentElement?.removeAttribute("hidden");
    });
  }
}

function closeEnhancedSelect(enhancedSelect) {
  enhancedSelect.wrapper.classList.remove("is-open");
  enhancedSelect.button.setAttribute("aria-expanded", "false");
}

function enhanceSelect(select) {
  const host = select.closest(".select-wrap");

  if (!host || host.dataset.selectEnhanced === "true") {
    return null;
  }

  const wrapper = document.createElement("div");
  const button = document.createElement("button");
  const list = document.createElement("ul");
  const optionButtons = [];
  const enableSearch = select.hasAttribute("data-select-search");
  let searchInput = null;

  host.classList.add("is-enhanced");
  host.dataset.selectEnhanced = "true";
  wrapper.className = "form-select-custom";
  if (enableSearch) {
    wrapper.classList.add("form-select-custom-searchable");
  }
  button.className = "form-select-button";
  button.type = "button";
  button.setAttribute("aria-haspopup", "listbox");
  button.setAttribute("aria-expanded", "false");
  list.className = "form-select-list";
  list.setAttribute("role", "listbox");
  button.innerHTML = `<span></span><i aria-hidden="true"></i>`;

  if (enableSearch) {
    const searchWrap = document.createElement("li");
    searchWrap.className = "form-select-search-item";
    searchInput = document.createElement("input");
    searchInput.type = "search";
    searchInput.className = "form-select-search";
    searchInput.autocomplete = "off";
    searchInput.spellcheck = false;
    searchInput.placeholder = select.dataset.searchPlaceholder || "Rechercher un pays ou indicatif";
    searchWrap.appendChild(searchInput);
    list.appendChild(searchWrap);
  }

  Array.from(select.options).forEach((option) => {
    const item = document.createElement("li");
    const optionButton = document.createElement("button");

    optionButton.type = "button";
    optionButton.className = "form-select-option";
    optionButton.dataset.value = option.value;
    optionButton.setAttribute("role", "option");

    optionButton.addEventListener("click", () => {
      select.value = option.value;
      select.dispatchEvent(new Event("change", { bubbles: true }));
      closeEnhancedSelect(enhancedSelect);
    });

    item.appendChild(optionButton);
    list.appendChild(item);
    optionButtons.push(optionButton);
  });

  wrapper.appendChild(button);
  wrapper.appendChild(list);
  host.appendChild(wrapper);

  const enhancedSelect = { select, host, wrapper, button, list, options: optionButtons };
  if (searchInput) {
    enhancedSelect.searchInput = searchInput;
  }

  button.addEventListener("click", () => {
    const isOpen = wrapper.classList.toggle("is-open");
    button.setAttribute("aria-expanded", String(isOpen));
    if (isOpen && searchInput) {
      setTimeout(() => searchInput?.focus(), 0);
    }
  });

  document.addEventListener("click", (event) => {
    if (!wrapper.contains(event.target)) {
      closeEnhancedSelect(enhancedSelect);
    }
  });

  select.addEventListener("change", () => {
    syncEnhancedSelect(enhancedSelect);
  });

  if (searchInput) {
    searchInput.addEventListener("input", () => {
      const query = searchInput.value;
      optionButtons.forEach((optionButton) => {
        const matches = searchMatches(query, optionButton.dataset.searchIndex || optionButton.textContent);
        optionButton.parentElement?.toggleAttribute("hidden", !matches);
      });
    });
  }

  syncEnhancedSelect(enhancedSelect);
  enhancedSelects.push(enhancedSelect);
  return enhancedSelect;
}

if (languageSelect) {
  const nativeLabel = languageSelect.closest(".language-select-label");
  const languageCustom = document.createElement("div");
  const labelText = nativeLabel?.querySelector("span")?.cloneNode(true);
  const customButton = document.createElement("button");
  const customList = document.createElement("ul");

  languageCustom.className = "language-custom";
  customButton.className = "language-custom-button";
  customButton.type = "button";
  customButton.setAttribute("aria-haspopup", "listbox");
  customButton.setAttribute("aria-expanded", "false");
  customList.className = "language-custom-list";
  customList.setAttribute("role", "listbox");

  if (labelText) {
    labelText.className = "language-custom-label";
    languageCustomLabel = labelText;
    languageCustom.appendChild(labelText);
  }

  customButton.innerHTML = `<span>${languageSelect.options[languageSelect.selectedIndex]?.textContent || "Français"}</span><i aria-hidden="true"></i>`;
  languageCustom.appendChild(customButton);

  Array.from(languageSelect.options).forEach((option) => {
    const listItem = document.createElement("li");
    const optionButton = document.createElement("button");

    optionButton.className = "language-custom-option";
    optionButton.type = "button";
    optionButton.dataset.languageValue = option.value;
    optionButton.textContent = option.textContent;
    optionButton.setAttribute("role", "option");

    optionButton.addEventListener("click", () => {
      setLanguage(option.value);
      languageCustom.classList.remove("is-open");
      customButton.setAttribute("aria-expanded", "false");
    });

    listItem.appendChild(optionButton);
    customList.appendChild(listItem);
    languageCustomOptions.push(optionButton);
  });

  languageCustom.appendChild(customList);
  nativeLabel?.insertAdjacentElement("afterend", languageCustom);
  languageCustomButton = customButton;

  customButton.addEventListener("click", () => {
    const isOpen = languageCustom.classList.toggle("is-open");
    customButton.setAttribute("aria-expanded", String(isOpen));
  });

  document.addEventListener("click", (event) => {
    if (!languageCustom.contains(event.target)) {
      languageCustom.classList.remove("is-open");
      customButton.setAttribute("aria-expanded", "false");
    }
  });

  languageSelect.addEventListener("change", (event) => {
    setLanguage(event.target.value);
  });

  setLanguage(currentLanguage);
  maybeOfferLanguageSuggestion();
}

const phoneCodeSelect = document.querySelector("#contact-phone-code");
if (phoneCodeSelect) {
  populatePhoneCodeSelect(phoneCodeSelect, currentLanguage);
}

document.querySelectorAll("select[data-enhance-select]").forEach((select) => {
  enhanceSelect(select);
});

document.addEventListener("levchin:languagechange", () => {
  if (phoneCodeSelect) {
    populatePhoneCodeSelect(phoneCodeSelect, currentLanguage);
  }
  enhancedSelects.forEach(syncEnhancedSelect);
});

const comingSoonTrigger = document.querySelector("[data-coming-soon]");
const comingSoonToast = document.querySelector("[data-coming-soon-toast]");
let comingSoonTimeout;

if (comingSoonTrigger && comingSoonToast) {
  if (!comingSoonTrigger.parentElement?.classList.contains("coming-soon-anchor")) {
    const anchor = document.createElement("span");
    anchor.className = "coming-soon-anchor";
    comingSoonTrigger.parentNode.insertBefore(anchor, comingSoonTrigger);
    anchor.appendChild(comingSoonTrigger);
    anchor.appendChild(comingSoonToast);
  }

  const hideComingSoonToast = () => {
    comingSoonToast.classList.remove("is-visible");
  };

  comingSoonTrigger.addEventListener("click", (event) => {
    event.preventDefault();
    comingSoonToast.classList.add("is-visible");

    window.clearTimeout(comingSoonTimeout);
    comingSoonTimeout = window.setTimeout(() => {
      hideComingSoonToast();
    }, 2600);
  });

  comingSoonToast.addEventListener("click", () => {
    hideComingSoonToast();
  });

  comingSoonToast.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " " || event.key === "Escape") {
      event.preventDefault();
      hideComingSoonToast();
    }
  });

  comingSoonToast.tabIndex = 0;
}

const contactForm = document.querySelector("[data-contact-form]");

if (contactForm) {
  const contactError = document.querySelector("[data-contact-error]");
  const messageField = contactForm.querySelector("#contact-message");
  const messageCount = contactForm.querySelector("[data-message-count]");
  const formFields = Array.from(contactForm.querySelectorAll("[data-field-name]"));
  const fieldErrors = new Map();
  const contactMessages = {
    required: {
      fr: "Veuillez renseigner ce champ obligatoire.",
      en: "Please complete this required field.",
      es: "Complete este campo obligatorio.",
      it: "Compila questo campo obbligatorio.",
      ja: "この必須項目を入力してください。",
      zh: "请填写此必填字段。",
      de: "Bitte füllen Sie dieses Pflichtfeld aus.",
      ko: "이 필수 항목을 입력해 주세요.",
      pt: "Preencha este campo obrigatório."
    },
    subject: {
      fr: "Veuillez sélectionner un sujet.",
      en: "Please select a subject.",
      es: "Seleccione un asunto.",
      it: "Seleziona un argomento.",
      ja: "件名を選択してください。",
      zh: "请选择主题。",
      de: "Bitte wählen Sie ein Thema aus.",
      ko: "주제를 선택해 주세요.",
      pt: "Selecione um assunto."
    },
    email: {
      fr: "Veuillez entrer une adresse email valide.",
      en: "Please enter a valid email address.",
      es: "Introduzca una dirección de correo válida.",
      it: "Inserisci un indirizzo email valido.",
      ja: "有効なメールアドレスを入力してください。",
      zh: "请输入有效的电子邮箱地址。",
      de: "Bitte geben Sie eine gültige E-Mail-Adresse ein.",
      ko: "유효한 이메일 주소를 입력해 주세요.",
      pt: "Introduza um endereço de email válido."
    },
    phone: {
      fr: "Veuillez entrer un numéro de téléphone valide.",
      en: "Please enter a valid phone number.",
      es: "Introduzca un número de teléfono válido.",
      it: "Inserisci un numero di telefono valido.",
      ja: "有効な電話番号を入力してください。",
      zh: "请输入有效的电话号码。",
      de: "Bitte geben Sie eine gültige Telefonnummer ein.",
      ko: "유효한 전화번호를 입력해 주세요.",
      pt: "Introduza um número de telefone válido."
    },
    messageLength: {
      fr: "Votre message ne peut pas dépasser 2000 caractères.",
      en: "Your message cannot exceed 2000 characters.",
      es: "Su mensaje no puede superar los 2000 caracteres.",
      it: "Il tuo messaggio non può superare i 2000 caratteri.",
      ja: "メッセージは2000文字以内で入力してください。",
      zh: "您的留言不能超过 2000 个字符。",
      de: "Ihre Nachricht darf 2000 Zeichen nicht überschreiten.",
      ko: "메시지는 2000자를 초과할 수 없습니다.",
      pt: "A sua mensagem não pode ultrapassar 2000 caracteres."
    },
    form: {
      fr: "Certains champs obligatoires sont manquants ou incomplets. Vérifiez les champs en rouge avant d’envoyer votre message.",
      en: "Some required fields are missing or incomplete. Check the fields in red before sending your message.",
      es: "Algunos campos obligatorios faltan o están incompletos. Revise los campos en rojo antes de enviar su mensaje.",
      it: "Alcuni campi obbligatori mancano o sono incompleti. Controlla i campi in rosso prima di inviare il tuo messaggio.",
      ja: "必須項目の一部が未入力、または不完全です。送信前に赤く表示された項目をご確認ください。",
      zh: "部分必填字段缺失或不完整。请先检查红色标出的字段，再发送您的留言。",
      de: "Einige Pflichtfelder fehlen oder sind unvollständig. Prüfen Sie die rot markierten Felder, bevor Sie Ihre Nachricht senden.",
      ko: "일부 필수 항목이 비어 있거나 올바르지 않습니다. 메시지를 보내기 전에 빨간색으로 표시된 항목을 확인해 주세요.",
      pt: "Alguns campos obrigatórios estão em falta ou incompletos. Verifique os campos a vermelho antes de enviar a sua mensagem."
    }
  };
  const mailLabels = {
    fr: { firstName: "Prénom", lastName: "Nom", email: "Email", phone: "Téléphone", subject: "Sujet", message: "Message", fallback: "Contact" },
    en: { firstName: "First name", lastName: "Last name", email: "Email", phone: "Phone", subject: "Subject", message: "Message", fallback: "Contact" },
    es: { firstName: "Nombre", lastName: "Apellido", email: "Email", phone: "Teléfono", subject: "Asunto", message: "Mensaje", fallback: "Contacto" },
    it: { firstName: "Nome", lastName: "Cognome", email: "Email", phone: "Telefono", subject: "Oggetto", message: "Messaggio", fallback: "Contatto" },
    ja: { firstName: "名", lastName: "姓", email: "メール", phone: "電話番号", subject: "件名", message: "メッセージ", fallback: "お問い合わせ" },
    zh: { firstName: "名字", lastName: "姓氏", email: "邮箱", phone: "电话", subject: "主题", message: "留言", fallback: "联系" },
    de: { firstName: "Vorname", lastName: "Nachname", email: "E-Mail", phone: "Telefon", subject: "Betreff", message: "Nachricht", fallback: "Kontakt" },
    ko: { firstName: "이름", lastName: "성", email: "이메일", phone: "전화번호", subject: "주제", message: "메시지", fallback: "문의" },
    pt: { firstName: "Nome próprio", lastName: "Apelido", email: "Email", phone: "Telefone", subject: "Assunto", message: "Mensagem", fallback: "Contacto" }
  };

  const getContactLanguage = () => currentLanguage || document.documentElement.lang || "fr";
  const getContactMessage = (key) => contactMessages[key]?.[getContactLanguage()] || contactMessages[key]?.fr || "";
  const getMailLabels = () => mailLabels[getContactLanguage()] || mailLabels.fr;

  const updateMessageCount = () => {
    if (!messageField || !messageCount) {
      return;
    }

    messageCount.textContent = `${messageField.value.length} / 2000`;
  };

  const setFieldError = (field, message) => {
    const fieldName = field.dataset.fieldName;
    const wrapper = field.closest(".field-group");
    const errorNode = contactForm.querySelector(`[data-field-error="${fieldName}"]`);

    if (errorNode) {
      errorNode.textContent = message || "";
    }

    wrapper?.classList.toggle("is-invalid", Boolean(message));

    if (message) {
      fieldErrors.set(fieldName, message);
    } else {
      fieldErrors.delete(fieldName);
    }
  };

  const validateField = (field) => {
    const value = field.value.trim();
    const validationType = field.dataset.validate;

    if (!value) {
      setFieldError(field, field.dataset.fieldName === "subject" ? getContactMessage("subject") : getContactMessage("required"));
      return false;
    }

    if (field.dataset.fieldName === "message" && value.length > 2000) {
      setFieldError(field, getContactMessage("messageLength"));
      return false;
    }

    if (validationType === "email") {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(value)) {
        setFieldError(field, getContactMessage("email"));
        return false;
      }
    }

    if (validationType === "phone") {
      const digits = value.replace(/[^\d]/g, "");
      if (digits.length < 6) {
        setFieldError(field, getContactMessage("phone"));
        return false;
      }
    }

    setFieldError(field, "");
    return true;
  };

  const validateContactForm = () => {
    const invalidFields = formFields.filter((field) => !validateField(field));

    if (invalidFields.length > 0) {
      contactError?.classList.add("is-visible");
      contactError.textContent = getContactMessage("form");
      invalidFields[0]?.focus();
      invalidFields[0]?.scrollIntoView({ behavior: "smooth", block: "center" });
      return false;
    }

    contactError?.classList.remove("is-visible");
    return true;
  };

  formFields.forEach((field) => {
    const eventName = field.tagName === "SELECT" ? "change" : "input";
    field.addEventListener(eventName, () => {
      validateField(field);
      contactError?.classList.remove("is-visible");
      if (field === messageField) {
        updateMessageCount();
      }
    });

    field.addEventListener("blur", () => {
      validateField(field);
    });
  });

  contactForm.addEventListener("submit", (event) => {
    event.preventDefault();

    if (!validateContactForm()) {
      return;
    }

    const formData = new FormData(contactForm);
    const recipient = contactForm.dataset.contactEmail;
    const labels = getMailLabels();
    const selectedPhoneOption = contactForm.querySelector("#contact-phone-code option:checked");
    const phoneCode = selectedPhoneOption?.dataset.dial || formData.get("phoneCode") || "";
    const phoneNumber = formData.get("phone") || "";
    const selectedSubject =
      contactForm.querySelector("#contact-subject option:checked")?.textContent || labels.fallback;
    const subject = `LEVCHIN - ${selectedSubject}`;
    const body = [
      `${labels.firstName}: ${formData.get("firstname") || ""}`,
      `${labels.lastName}: ${formData.get("lastname") || ""}`,
      `${labels.email}: ${formData.get("email") || ""}`,
      `${labels.phone}: ${`${phoneCode} ${phoneNumber}`.trim()}`,
      `${labels.subject}: ${selectedSubject}`,
      "",
      `${labels.message}:`,
      `${formData.get("message") || ""}`
    ].join("\n");

    window.location.href = `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  });

  document.addEventListener("levchin:languagechange", () => {
    if (contactError?.classList.contains("is-visible")) {
      contactError.textContent = getContactMessage("form");
    }

    formFields.forEach((field) => {
      if (fieldErrors.has(field.dataset.fieldName)) {
        validateField(field);
      }
    });

    updateMessageCount();
  });

  updateMessageCount();
}
