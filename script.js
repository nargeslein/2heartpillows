const langDeBtn = document.getElementById("lang-de");
const langEnBtn = document.getElementById("lang-en");
const storyModal = document.getElementById("story-modal");
const storyCloseBtn = document.getElementById("story-close");
const storyImage = document.getElementById("story-image");
const storyTitle = document.getElementById("story-title");
const storyText = document.getElementById("story-text");
const galleryImages = document.querySelectorAll(".gallery-grid img[data-story-id]");
const contactForm = document.getElementById("contact-form");
const turnstileContainer = document.getElementById("turnstile-container");
const contactStatus = document.getElementById("contact-status");
const langKey = "twoheartpillows_lang_v1";
let currentLang = localStorage.getItem(langKey) || "de";
let activeStoryId = "";
const pageLoadedAt = Date.now();
let turnstileWidgetId = null;

function initTurnstileIfConfigured() {
  if (!contactForm || !turnstileContainer) return;
  const siteKey = (contactForm.getAttribute("data-turnstile-sitekey") || "").trim();
  if (!siteKey) return;

  const existing = document.querySelector('script[data-turnstile="true"]');
  if (existing) return;

  const script = document.createElement("script");
  script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
  script.async = true;
  script.defer = true;
  script.setAttribute("data-turnstile", "true");
  script.onload = () => {
    if (window.turnstile && turnstileContainer.childElementCount === 0) {
      turnstileWidgetId = window.turnstile.render("#turnstile-container", { sitekey: siteKey });
    }
  };
  document.head.appendChild(script);
}

const translations = {
  de: {
    pageTitle: "2heartpillows | Von Frauen für Frauen",
    pageDescription: "Herzkissen nach Brustkrebs: von Frauen für Frauen. Jedes Stück Stoff schenkt Hoffnung, Solidarität und Mitgefühl.",
    navMission: "Mission",
    navGallery: "Galerie",
    heroEyebrow: "Von Frauen für Frauen",
    heroTitle: "Jedes Herzkissen ist ein Zeichen für Solidarität und Mitgefühl.",
    heroText: "Dieses Projekt unterstützt Frauen nach Brustkrebs. Die Kissen werden gespendet. Jedes Stück Stoff schenkt Hoffnung.",
    careGuide: "Pflegeanleitung (PDF)",
    missionTitle: "Unsere Mission",
    missionText1: "Ich habe privat Herzkissen genäht und den größten Teil bereits verteilt. Ich nähe keine weiteren Kissen mehr, aber die Idee lebt weiter: Unterstützung von Frauen für Frauen, getragen von Herz, Zeit und Spenden.",
    missionText2: "Diese Website hält die Geschichte und den Gedanken dahinter lebendig und macht die Wirkung sichtbar.",
    galleryTitle: "Galerie",
    gallerySubtitle: "Bilder aus dem Projekt.",
    imgAlt1: "Herzkissen in Stoffmustern",
    imgAlt2: "Gespendete Herzkissen",
    imgAlt3: "Detailaufnahme eines Herzkissens",
    instagramBtn: "Zum Instagram-Profil",
    nftTitle: "NFT Bereich",
    nftText: "Ziel: Jede Kissenbesitzerin erhält ein NFT als digitale Erinnerung. Dieser Bereich ist als Start für Erstellung und spätere Ausgabe vorbereitet.",
    nftStep1Title: "1. NFT-Motive erstellen",
    nftStep1Text: "Die Herzkissen-Motive werden als digitale Kollektion vorbereitet.",
    nftStep2Title: "2. Wallet verknüpfen",
    nftStep2Text: "Optionaler Wallet-Login für spätere Ausgabe.",
    nftStep3Title: "3. Claim für Besitzerinnen",
    nftStep3Text: "NFT-Übergabe über einen geschützten Claim-Code.",
    claimTitle: "Kontakt aufnehmen",
    claimNameLabel: "Name",
    claimNamePlaceholder: "Dein Name",
    claimContactLabel: "Deine E-Mail",
    claimContactPlaceholder: "beispiel@email.de",
    claimMessageLabel: "Nachricht",
    claimMessagePlaceholder: "Ich möchte das Projekt unterstützen...",
    claimBtn: "E-Mail senden",
    contactSending: "Nachricht wird gesendet...",
    contactSuccess: "Danke. Deine Nachricht wurde gesendet.",
    contactError: "Senden fehlgeschlagen. Bitte später erneut versuchen.",
    contactBotBlocked: "Anfrage blockiert.",
    footerText: "2heartpillows | Für Hoffnung, Solidarität und Mitgefühl."
  },
  en: {
    pageTitle: "2heartpillows | From Women to Women",
    pageDescription: "Heart pillows after breast cancer: from women to women. Every piece of fabric offers hope, solidarity, and compassion.",
    navMission: "Mission",
    navGallery: "Gallery",
    heroEyebrow: "From Women to Women",
    heroTitle: "Every heart pillow is a symbol of solidarity and compassion.",
    heroText: "This project supports women after breast cancer. The pillows are donated. Every piece of fabric brings hope.",
    careGuide: "Care Guide (PDF)",
    missionTitle: "Our Mission",
    missionText1: "I sewed heart pillows privately and already distributed most of them. I am no longer sewing new pillows, but the idea lives on: women supporting women, carried by heart, time, and donations.",
    missionText2: "This website keeps the story and purpose alive and makes the impact visible.",
    galleryTitle: "Gallery",
    gallerySubtitle: "Images from the project.",
    imgAlt1: "Heart pillows in different fabric patterns",
    imgAlt2: "Donated heart pillows",
    imgAlt3: "Close-up of a heart pillow",
    instagramBtn: "Open Instagram Profile",
    nftTitle: "NFT Section",
    nftText: "Goal: every pillow owner receives an NFT as a digital memory. This section is prepared as a starting point for creation and later distribution.",
    nftStep1Title: "1. Create NFT artworks",
    nftStep1Text: "Heart pillow motifs are prepared as a digital collection.",
    nftStep2Title: "2. Connect wallet",
    nftStep2Text: "Optional wallet login for later distribution.",
    nftStep3Title: "3. Claim for owners",
    nftStep3Text: "NFT handover via a protected claim code.",
    claimTitle: "Get in Touch",
    claimNameLabel: "Name",
    claimNamePlaceholder: "Your name",
    claimContactLabel: "Your Email",
    claimContactPlaceholder: "name@example.com",
    claimMessageLabel: "Message",
    claimMessagePlaceholder: "I would like to support the project...",
    claimBtn: "Send Email",
    contactSending: "Sending message...",
    contactSuccess: "Thank you. Your message was sent.",
    contactError: "Sending failed. Please try again later.",
    contactBotBlocked: "Request blocked.",
    footerText: "2heartpillows | For hope, solidarity, and compassion."
  }
};

const stories = {
  de: {
    story1: {
      title: "Ein Anfang mit Stoffresten",
      text: "Dieses Kissen stand am Anfang vieler Spenden. Aus kleinen Resten wurde ein Stück Trost, das direkt weitergegeben wurde."
    },
    story2: {
      title: "Weitergeben statt aufbewahren",
      text: "Viele Kissen wurden nicht gesammelt, sondern bewusst verteilt. Die Idee war immer: Hilfe soll schnell dort ankommen, wo sie gebraucht wird."
    },
    story3: {
      title: "Von Frau zu Frau",
      text: "Hinter jedem Kissen steckt eine stille Geste: gesehen werden, ernst genommen werden und nicht allein durch die Behandlung gehen."
    },
    story4: {
      title: "Farbe als Mutmacher",
      text: "Bunte Stoffe bringen Leichtigkeit in schwere Tage. Jedes Muster macht sichtbar, dass Fürsorge auch im Detail spürbar ist."
    },
    story5: {
      title: "Viele Hände, ein Ziel",
      text: "Das Projekt lebt von Gemeinschaft. Jede Spende, jedes Teilen und jede Empfehlung hilft, neue Frauen zu erreichen."
    },
    story6: {
      title: "Praktisch und persönlich",
      text: "Die Herzkissen sind nicht nur symbolisch. Sie wurden mit Blick auf den Alltag nach einer Brustkrebs-Operation genäht."
    },
    story7: {
      title: "Solidarität im Alltag",
      text: "Zwischen Terminen und Alltag entstand Raum für Mitgefühl. Aus Nähzeit wurde konkrete Unterstützung."
    },
    story8: {
      title: "Ein Zeichen ohne große Worte",
      text: "Manchmal reicht ein Kissen als Botschaft: Du bist nicht allein. Genau dafür wurden diese Stücke gemacht."
    },
    story9: {
      title: "Erinnerung an geteilte Stärke",
      text: "Jedes Foto erinnert daran, wie viel Kraft in kleinen Gesten liegt, wenn Frauen einander tragen."
    },
    story10: {
      title: "Ein Projekt, das weiterlebt",
      text: "Auch wenn heute keine neuen Kissen mehr genäht werden, bleibt die Wirkung erhalten: sichtbar, teilbar und inspirierend."
    },
    story11: {
      title: "Nähe trotz Distanz",
      text: "Nicht jede Begegnung war persönlich. Trotzdem entstand Verbindung durch Spenden, Nachrichten und Weiterempfehlungen."
    },
    story12: {
      title: "Hoffnung in jeder Naht",
      text: "Jedes Kissen wurde mit dem Gedanken gefertigt, einer Frau den Heilungsweg ein wenig leichter zu machen."
    }
  },
  en: {
    story1: {
      title: "A Beginning with Fabric Scraps",
      text: "This pillow marked the beginning of many donations. Small leftovers became a meaningful piece of comfort."
    },
    story2: {
      title: "Give, Don't Store",
      text: "The pillows were meant to be passed on quickly. The goal was always direct help for women who needed support."
    },
    story3: {
      title: "From Woman to Woman",
      text: "Each pillow carries a quiet gesture: being seen, being heard, and not facing treatment alone."
    },
    story4: {
      title: "Color as Encouragement",
      text: "Bright fabrics bring lightness to difficult days. Every pattern makes care visible."
    },
    story5: {
      title: "Many Hands, One Goal",
      text: "The project is powered by community. Every donation, share, and recommendation reaches another woman."
    },
    story6: {
      title: "Practical and Personal",
      text: "These heart pillows are not only symbolic. They were sewn to support daily life after breast cancer surgery."
    },
    story7: {
      title: "Solidarity in Everyday Life",
      text: "Between appointments and routines, time was turned into practical support and compassion."
    },
    story8: {
      title: "A Message Without Many Words",
      text: "Sometimes one pillow says enough: you are not alone. That is exactly what these pieces were made for."
    },
    story9: {
      title: "Memory of Shared Strength",
      text: "Each image reflects how much strength can live in small gestures when women support each other."
    },
    story10: {
      title: "A Project That Continues",
      text: "Even without sewing new pillows today, the impact remains visible, shareable, and inspiring."
    },
    story11: {
      title: "Closeness Across Distance",
      text: "Not every encounter was in person, but connection still grew through donations, messages, and sharing."
    },
    story12: {
      title: "Hope in Every Stitch",
      text: "Each pillow was made with one intention: making one woman's healing journey a little easier."
    }
  }
};

function t(key) {
  return translations[currentLang][key] || translations.de[key] || "";
}

function getStory(storyId) {
  return (stories[currentLang] && stories[currentLang][storyId]) || (stories.de && stories.de[storyId]) || null;
}

function openStoryModal(imageElement) {
  if (!storyModal || !storyImage || !storyTitle || !storyText) return;
  const storyId = imageElement.getAttribute("data-story-id");
  if (!storyId) return;
  const story = getStory(storyId);
  if (!story) return;

  activeStoryId = storyId;
  storyImage.src = imageElement.src;
  storyImage.alt = imageElement.alt;
  storyTitle.textContent = story.title;
  storyText.textContent = story.text;
  storyModal.classList.add("open");
  storyModal.setAttribute("aria-hidden", "false");
}

function closeStoryModal() {
  if (!storyModal) return;
  storyModal.classList.remove("open");
  storyModal.setAttribute("aria-hidden", "true");
  activeStoryId = "";
}

function applyLanguage(lang) {
  currentLang = lang in translations ? lang : "de";
  localStorage.setItem(langKey, currentLang);
  document.documentElement.lang = currentLang;
  document.title = t("pageTitle");
  const descriptionMeta = document.querySelector('meta[name="description"]');
  if (descriptionMeta) descriptionMeta.setAttribute("content", t("pageDescription"));

  document.querySelectorAll("[data-i18n]").forEach((element) => {
    const key = element.getAttribute("data-i18n");
    if (!key) return;
    element.innerHTML = t(key);
  });

  document.querySelectorAll("[data-i18n-alt]").forEach((element) => {
    const key = element.getAttribute("data-i18n-alt");
    if (!key) return;
    element.setAttribute("alt", t(key));
  });

  document.querySelectorAll("[data-i18n-placeholder]").forEach((element) => {
    const key = element.getAttribute("data-i18n-placeholder");
    if (!key) return;
    element.setAttribute("placeholder", t(key));
  });

  if (langDeBtn && langEnBtn) {
    langDeBtn.classList.toggle("active", currentLang === "de");
    langEnBtn.classList.toggle("active", currentLang === "en");
  }

  if (activeStoryId && storyTitle && storyText) {
    const story = getStory(activeStoryId);
    if (story) {
      storyTitle.textContent = story.title;
      storyText.textContent = story.text;
    }
  }
}

if (langDeBtn && langEnBtn) {
  langDeBtn.addEventListener("click", () => applyLanguage("de"));
  langEnBtn.addEventListener("click", () => applyLanguage("en"));
}

galleryImages.forEach((imageElement) => {
  imageElement.addEventListener("click", () => openStoryModal(imageElement));
});

if (storyCloseBtn) {
  storyCloseBtn.addEventListener("click", closeStoryModal);
}

if (storyModal) {
  storyModal.addEventListener("click", (event) => {
    if (event.target === storyModal) closeStoryModal();
  });
}

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeStoryModal();
});

if (contactForm) {
  contactForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (contactForm.getAttribute("data-form-enabled") !== "true") return;
    const honeypot = (document.getElementById("claim-company") || { value: "" }).value.trim();
    if (honeypot) {
      if (contactStatus) contactStatus.textContent = t("contactBotBlocked");
      return;
    }
    if (Date.now() - pageLoadedAt < 2500) {
      if (contactStatus) contactStatus.textContent = t("contactBotBlocked");
      return;
    }

    const name = (document.getElementById("claim-name") || { value: "" }).value.trim();
    const email = (document.getElementById("claim-contact") || { value: "" }).value.trim();
    const message = (document.getElementById("claim-message") || { value: "" }).value.trim();
    const turnstileToken = window.turnstile && turnstileWidgetId !== null
      ? window.turnstile.getResponse(turnstileWidgetId)
      : "";

    if (contactStatus) contactStatus.textContent = t("contactSending");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message, turnstileToken })
      });

      if (!response.ok) throw new Error("Request failed");
      if (contactStatus) contactStatus.textContent = t("contactSuccess");
      contactForm.reset();
      if (window.turnstile && turnstileWidgetId !== null) window.turnstile.reset(turnstileWidgetId);
    } catch (_err) {
      if (contactStatus) contactStatus.textContent = t("contactError");
    }
  });
}

applyLanguage(currentLang);
initTurnstileIfConfigured();
