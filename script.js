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
let languageCustomButton;
let languageCustomOptions = [];
let languageCustomLabel;

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
}

const comingSoonTrigger = document.querySelector("[data-coming-soon]");
const comingSoonToast = document.querySelector("[data-coming-soon-toast]");
let comingSoonTimeout;

if (comingSoonTrigger && comingSoonToast) {
  const hideComingSoonToast = () => {
    comingSoonToast.classList.remove("is-visible");
  };

  comingSoonTrigger.addEventListener("click", (event) => {
    event.preventDefault();
    const triggerBox = comingSoonTrigger.getBoundingClientRect();

    comingSoonToast.style.left = `${triggerBox.left + triggerBox.width / 2 + window.scrollX}px`;
    comingSoonToast.style.top = `${triggerBox.top + window.scrollY}px`;
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
      fr: "Veuillez corriger les champs obligatoires avant l’envoi.",
      en: "Please correct the required fields before sending.",
      es: "Corrija los campos obligatorios antes de enviar.",
      it: "Correggi i campi obbligatori prima dell’invio.",
      ja: "送信前に必須項目を修正してください。",
      zh: "发送前请更正必填字段。",
      de: "Bitte korrigieren Sie die Pflichtfelder vor dem Senden.",
      ko: "전송 전에 필수 입력 항목을 수정해 주세요.",
      pt: "Corrija os campos obrigatórios antes de enviar."
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
    const selectedSubject =
      contactForm.querySelector("#contact-subject option:checked")?.textContent || labels.fallback;
    const subject = `LEVCHIN - ${selectedSubject}`;
    const body = [
      `${labels.firstName}: ${formData.get("firstname") || ""}`,
      `${labels.lastName}: ${formData.get("lastname") || ""}`,
      `${labels.email}: ${formData.get("email") || ""}`,
      `${labels.phone}: ${formData.get("phone") || ""}`,
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
