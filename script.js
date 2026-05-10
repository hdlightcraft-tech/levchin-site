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

function initStorySnap() {
  const shell = document.querySelector("body.story-document .site-shell");

  if (!shell) {
    return;
  }

  if (!window.location.hash) {
    window.requestAnimationFrame(() => {
      shell.scrollTop = 0;
    });
  }
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
      element.textContent = element.dataset[`story${language.charAt(0).toUpperCase()}${language.slice(1)}`] || element.dataset.storyEn || element.dataset.storyFr;
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
