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

const languageSelect = document.querySelector("[data-language-select]");
const savedLanguage = localStorage.getItem("levchin-language");
let currentLanguage = savedLanguage || document.documentElement.lang || "fr";

function setLanguage(language) {
  currentLanguage = language;
  document.documentElement.lang = language;
  localStorage.setItem("levchin-language", language);

  document
    .querySelectorAll("[data-fr][data-en][data-es][data-it][data-ja][data-zh][data-de][data-ko][data-pt]")
    .forEach((element) => {
    element.textContent = element.dataset[language];
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
}

if (languageSelect) {
  languageSelect.addEventListener("change", (event) => {
    setLanguage(event.target.value);
  });

  setLanguage(currentLanguage);
}

const comingSoonTrigger = document.querySelector("[data-coming-soon]");
const comingSoonToast = document.querySelector("[data-coming-soon-toast]");
let comingSoonTimeout;

if (comingSoonTrigger && comingSoonToast) {
  comingSoonTrigger.addEventListener("click", (event) => {
    event.preventDefault();
    const triggerBox = comingSoonTrigger.getBoundingClientRect();

    comingSoonToast.style.left = `${triggerBox.left + triggerBox.width / 2 + window.scrollX}px`;
    comingSoonToast.style.top = `${triggerBox.top + window.scrollY}px`;
    comingSoonToast.classList.add("is-visible");

    window.clearTimeout(comingSoonTimeout);
    comingSoonTimeout = window.setTimeout(() => {
      comingSoonToast.classList.remove("is-visible");
    }, 2600);
  });

  comingSoonToast.addEventListener("click", () => {
    comingSoonToast.classList.remove("is-visible");
  });
}

const contactForm = document.querySelector("[data-contact-form]");

if (contactForm) {
  const contactSubmit = contactForm.querySelector("[data-contact-submit]");
  const contactError = document.querySelector("[data-contact-error]");

  contactSubmit?.addEventListener("click", () => {
    const requiredFields = Array.from(contactForm.querySelectorAll("[data-required-field]"));
    const hasEmptyField = requiredFields.some((field) => !field.value.trim());

    if (hasEmptyField) {
      contactError?.classList.add("is-visible");
      return;
    }

    contactError?.classList.remove("is-visible");

    const formData = new FormData();
    contactForm.querySelectorAll("input, textarea").forEach((field) => {
      if ((field.type === "radio" && !field.checked) || !field.name) {
        return;
      }

      formData.set(field.name, field.value);
    });

    const recipient = contactForm.dataset.contactEmail;
    const subject = `LEVCHIN - ${formData.get("type") || "Contact"}`;
    const body = [
      `Nom: ${formData.get("nom") || ""}`,
      `Email: ${formData.get("email") || ""}`,
      `Type de demande: ${formData.get("type") || ""}`,
      "",
      formData.get("message") || ""
    ].join("\n");

    window.location.href = `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  });
}
