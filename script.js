const langDeBtn = document.getElementById("lang-de");
const langEnBtn = document.getElementById("lang-en");
const storyModal = document.getElementById("story-modal");
const storyCloseBtn = document.getElementById("story-close");
const storyPrevBtn = document.getElementById("story-prev");
const storyNextBtn = document.getElementById("story-next");
const storyCounter = document.getElementById("story-counter");
const storyImage = document.getElementById("story-image");
const storyTitle = document.getElementById("story-title");
const storyText = document.getElementById("story-text");
const galleryImages = document.querySelectorAll(".gallery-grid img[data-story-id]");
const navToggle = document.getElementById("nav-toggle");
const navLinks = document.querySelector(".nav-links");
const walletConnectBtn = document.getElementById("wallet-connect");
const walletSwitchAmoyBtn = document.getElementById("wallet-switch-amoy");
const walletStatus = document.getElementById("wallet-status");
const walletNftGrid = document.getElementById("wallet-nft-grid");
const walletNftInfo = document.getElementById("wallet-nft-info");
const walletCard = document.querySelector(".wallet-card");
const langKey = "twoheartpillows_lang_v1";
let currentLang = "de";
let activeStoryId = "";
let activeGalleryIndex = -1;
const polygonAmoyHex = "0x13882";
let walletManuallyDisconnected = false;
let walletUiConnected = false;

function setWalletConnectButton(connected) {
  if (!walletConnectBtn) return;
  walletConnectBtn.textContent = connected ? t("walletDisconnect") : t("walletConnect");
}

function shortAddress(address) {
  if (!address || address.length < 10) return address || "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function getChainLabel(chainIdHex) {
  if (!chainIdHex) return t("walletUnknownNetwork");
  if (chainIdHex === "0x89") return "Polygon Mainnet";
  if (chainIdHex === polygonAmoyHex) return "Polygon Amoy";
  return `Chain ${parseInt(chainIdHex, 16)}`;
}

function getReservoirBaseUrl(chainIdHex) {
  if (chainIdHex === "0x1") return "https://api.reservoir.tools";
  if (chainIdHex === "0x89") return "https://api-polygon.reservoir.tools";
  return "";
}

function getAmoyAlchemyKey() {
  const fromConfig = window.APP_CONFIG && typeof window.APP_CONFIG.AMOY_ALCHEMY_KEY === "string"
    ? window.APP_CONFIG.AMOY_ALCHEMY_KEY.trim()
    : "";
  if (fromConfig) return fromConfig;
  if (!walletCard) return "";
  return (walletCard.getAttribute("data-amoy-alchemy-key") || "").trim();
}

function normalizeAlchemyNfts(items) {
  return items.map((nft) => {
    const token = nft || {};
    const imageCandidate = token.image && (token.image.cachedUrl || token.image.pngUrl || token.image.originalUrl);
    const collectionName = token.contract && token.contract.name ? token.contract.name : "";
    return {
      token: {
        image: imageCandidate || "",
        name: token.name || "",
        tokenId: token.tokenId || "",
        collection: { name: collectionName }
      }
    };
  });
}

function clearWalletNfts(message) {
  if (walletNftGrid) walletNftGrid.innerHTML = "";
  if (walletNftInfo && typeof message === "string") {
    walletNftInfo.textContent = message;
  } else if (walletNftInfo) {
    walletNftInfo.textContent = t("walletNftsPrompt");
  }
}

function ipfsToHttp(url) {
  if (!url) return "";
  if (url.startsWith("ipfs://")) return `https://ipfs.io/ipfs/${url.slice(7)}`;
  return url;
}

function renderWalletNfts(items) {
  if (!walletNftGrid) return;
  walletNftGrid.innerHTML = "";

  items.forEach((item) => {
    const token = item && item.token ? item.token : item;
    const image = ipfsToHttp(token.image || token.imageSmall || "");
    const name = token.name || `Token #${token.tokenId || ""}`;
    const collectionName = token.collection ? token.collection.name || "" : "";

    const figure = document.createElement("figure");
    const img = document.createElement("img");
    img.src = image || "assets/images/0ABB3191-537D-4B44-A244-2AD033994957.JPG";
    img.alt = name;

    const meta = document.createElement("figcaption");
    meta.className = "nft-token-meta";
    const title = document.createElement("p");
    title.className = "nft-token-title";
    title.textContent = name;
    const sub = document.createElement("p");
    sub.className = "nft-token-sub";
    sub.textContent = collectionName || "Unbekannte Kollektion";

    meta.appendChild(title);
    meta.appendChild(sub);
    figure.appendChild(img);
    figure.appendChild(meta);
    walletNftGrid.appendChild(figure);
  });
}

async function loadWalletNfts(account, chainIdHex) {
  if (!walletNftInfo) return;
  if (!account) {
    clearWalletNfts(t("walletNftsPrompt"));
    return;
  }

  const baseUrl = getReservoirBaseUrl(chainIdHex);

  walletNftInfo.textContent = t("walletNftsLoading");
  try {
    let tokens = [];

    if (chainIdHex === polygonAmoyHex) {
      const alchemyKey = getAmoyAlchemyKey();
      if (!alchemyKey) {
        clearWalletNfts(t("walletAmoyKeyMissing"));
        return;
      }
      const amoyUrl = `https://polygon-amoy.g.alchemy.com/nft/v3/${alchemyKey}/getNFTsForOwner?owner=${account}&withMetadata=true`;
      const amoyResponse = await fetch(amoyUrl);
      if (!amoyResponse.ok) throw new Error("Amoy fetch failed");
      const amoyData = await amoyResponse.json();
      const ownedNfts = Array.isArray(amoyData.ownedNfts) ? amoyData.ownedNfts : [];
      tokens = normalizeAlchemyNfts(ownedNfts);
    } else {
      if (!baseUrl) {
        clearWalletNfts(t("walletNftsNetworkUnsupported"));
        return;
      }
      const url = `${baseUrl}/users/${account}/tokens/v10?limit=24&sortBy=acquiredAt`;
      const response = await fetch(url);
      if (!response.ok) throw new Error("Reservoir fetch failed");
      const data = await response.json();
      tokens = Array.isArray(data.tokens) ? data.tokens : [];
    }

    if (!tokens.length) {
      clearWalletNfts(t("walletNftsEmpty"));
      return;
    }
    renderWalletNfts(tokens);
    walletNftInfo.textContent = `${tokens.length} ${t("walletNftsLoadedSuffix")}`;
  } catch (_err) {
    clearWalletNfts(t("walletNftsLoadError"));
  }
}

async function updateWalletStatus() {
  if (!walletStatus) return;
  if (walletManuallyDisconnected) {
    walletStatus.textContent = t("walletDisconnected");
    clearWalletNfts(t("walletNftsPrompt"));
    walletUiConnected = false;
    setWalletConnectButton(false);
    return;
  }
  if (!window.ethereum) {
    walletStatus.textContent = t("walletNoWeb3");
    clearWalletNfts(t("walletNotDetected"));
    walletUiConnected = false;
    setWalletConnectButton(false);
    return;
  }

  try {
    const [account] = await window.ethereum.request({ method: "eth_accounts" });
    const chainId = await window.ethereum.request({ method: "eth_chainId" });
    if (!account) {
      walletStatus.textContent = t("walletDisconnected");
      clearWalletNfts(t("walletNftsPrompt"));
      walletUiConnected = false;
      setWalletConnectButton(false);
      return;
    }
    walletStatus.textContent = `${t("walletConnectedPrefix")}: ${shortAddress(account)} | ${getChainLabel(chainId)}`;
    walletUiConnected = true;
    setWalletConnectButton(true);
    await loadWalletNfts(account, chainId);
  } catch (_err) {
    walletStatus.textContent = t("walletStatusReadError");
    clearWalletNfts(t("walletStatusReadError"));
    walletUiConnected = false;
    setWalletConnectButton(false);
  }
}

async function connectWallet() {
  if (!walletStatus) return;
  if (!window.ethereum) {
    walletStatus.textContent = t("walletInstallHint");
    return;
  }
  try {
    walletManuallyDisconnected = false;
    await window.ethereum.request({ method: "eth_requestAccounts" });
    await updateWalletStatus();
  } catch (_err) {
    walletStatus.textContent = t("walletConnectError");
    walletUiConnected = false;
    setWalletConnectButton(false);
  }
}

function disconnectWalletUi() {
  walletManuallyDisconnected = true;
  walletUiConnected = false;
  if (walletStatus) walletStatus.textContent = t("walletDisconnected");
  clearWalletNfts(t("walletNftsPrompt"));
  setWalletConnectButton(false);
}

async function switchToPolygonAmoy() {
  if (!walletStatus) return;
  if (!window.ethereum) {
    walletStatus.textContent = t("walletSwitchNoWallet");
    return;
  }
  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: polygonAmoyHex }]
    });
    await updateWalletStatus();
  } catch (err) {
    if (err && err.code === 4902) {
      try {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [{
            chainId: polygonAmoyHex,
            chainName: "Polygon Amoy",
            nativeCurrency: { name: "POL", symbol: "POL", decimals: 18 },
            rpcUrls: ["https://rpc-amoy.polygon.technology"],
            blockExplorerUrls: ["https://amoy.polygonscan.com"]
          }]
        });
        await updateWalletStatus();
        return;
      } catch (_addErr) {
        walletStatus.textContent = t("walletAmoyAddError");
        return;
      }
    }
    walletStatus.textContent = t("walletSwitchError");
  }
}

function detectPreferredLanguage() {
  const saved = localStorage.getItem(langKey);
  if (saved === "de" || saved === "en") return saved;

  const browserLang = String(navigator.language || navigator.userLanguage || "").toLowerCase();
  if (browserLang.startsWith("de")) return "de";
  return "en";
}

currentLang = detectPreferredLanguage();

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
    walletTitle: "Wallet",
    walletIntro: "Verbinde deine Wallet, um den NFT-Bereich zu nutzen.",
    walletHint: "Hinweis: Funktioniert nur in Browsern mit Wallet (z.B. MetaMask Extension oder MetaMask In-App Browser).",
    walletConnect: "Wallet verbinden",
    walletDisconnect: "Verbindung trennen",
    walletSwitchAmoy: "Zu Polygon Amoy",
    walletDisconnected: "Nicht verbunden",
    walletConnectedPrefix: "Wallet verbunden",
    walletNftsTitle: "Wallet NFTs",
    walletNftsPrompt: "Verbinde zuerst deine Wallet, um NFTs zu laden.",
    walletNftsLoading: "Lade Wallet NFTs...",
    walletNftsLoadedSuffix: "NFT(s) geladen.",
    walletAmoyKeyMissing: "Amoy erkannt. Bitte in config.js den AMOY_ALCHEMY_KEY eintragen.",
    walletNftsNetworkUnsupported: "NFT-Listing ist aktuell fuer dieses Netzwerk nicht verfuegbar.",
    walletNftsEmpty: "Keine NFTs in dieser Wallet auf dem aktuellen Netzwerk gefunden.",
    walletNftsLoadError: "NFTs konnten nicht geladen werden. Bitte spaeter erneut versuchen.",
    walletNoWeb3: "Keine Web3 Wallet gefunden (z.B. MetaMask).",
    walletNotDetected: "Keine Wallet erkannt.",
    walletStatusReadError: "Wallet-Status konnte nicht gelesen werden.",
    walletInstallHint: "Keine Wallet erkannt. Bitte MetaMask installieren oder den MetaMask In-App Browser nutzen.",
    walletConnectError: "Verbindung abgebrochen oder fehlgeschlagen.",
    walletSwitchNoWallet: "Keine Wallet erkannt. Netzwerkwechsel nicht moeglich.",
    walletAmoyAddError: "Polygon Amoy konnte nicht hinzugefuegt werden.",
    walletSwitchError: "Netzwerkwechsel fehlgeschlagen.",
    walletUnknownNetwork: "Unbekanntes Netzwerk",
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
    walletTitle: "Wallet",
    walletIntro: "Connect your wallet to use the NFT section.",
    walletHint: "Works only in browsers with a wallet (e.g. MetaMask extension or MetaMask in-app browser).",
    walletConnect: "Connect wallet",
    walletDisconnect: "Disconnect",
    walletSwitchAmoy: "Switch to Polygon Amoy",
    walletDisconnected: "Not connected",
    walletConnectedPrefix: "Wallet connected",
    walletNftsTitle: "Wallet NFTs",
    walletNftsPrompt: "Connect your wallet first to load NFTs.",
    walletNftsLoading: "Loading wallet NFTs...",
    walletNftsLoadedSuffix: "NFT(s) loaded.",
    walletAmoyKeyMissing: "Amoy detected. Please set AMOY_ALCHEMY_KEY in config.js.",
    walletNftsNetworkUnsupported: "NFT listing is currently not available for this network.",
    walletNftsEmpty: "No NFTs found in this wallet on the current network.",
    walletNftsLoadError: "Could not load NFTs. Please try again later.",
    walletNoWeb3: "No Web3 wallet found (e.g. MetaMask).",
    walletNotDetected: "No wallet detected.",
    walletStatusReadError: "Could not read wallet status.",
    walletInstallHint: "No wallet detected. Please install MetaMask or use the MetaMask in-app browser.",
    walletConnectError: "Connection canceled or failed.",
    walletSwitchNoWallet: "No wallet detected. Cannot switch network.",
    walletAmoyAddError: "Could not add Polygon Amoy.",
    walletSwitchError: "Network switch failed.",
    walletUnknownNetwork: "Unknown network",
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

function renderStoryByIndex(index) {
  if (!galleryImages.length || !storyImage || !storyTitle || !storyText) return;
  const safeIndex = (index + galleryImages.length) % galleryImages.length;
  const imageElement = galleryImages[safeIndex];
  const storyId = imageElement.getAttribute("data-story-id");
  if (!storyId) return;
  const story = getStory(storyId);
  if (!story) return;

  activeGalleryIndex = safeIndex;
  activeStoryId = storyId;
  storyImage.src = imageElement.src;
  storyImage.alt = imageElement.alt;
  storyTitle.textContent = story.title;
  storyText.textContent = story.text;
  if (storyCounter) storyCounter.textContent = `${safeIndex + 1} / ${galleryImages.length}`;
}

function openStoryModal(imageElement) {
  if (!storyModal || !storyImage || !storyTitle || !storyText) return;
  const clickedIndex = Array.from(galleryImages).indexOf(imageElement);
  renderStoryByIndex(clickedIndex >= 0 ? clickedIndex : 0);
  storyModal.classList.add("open");
  storyModal.setAttribute("aria-hidden", "false");
}

function closeStoryModal() {
  if (!storyModal) return;
  storyModal.classList.remove("open");
  storyModal.setAttribute("aria-hidden", "true");
  activeStoryId = "";
  activeGalleryIndex = -1;
  if (storyCounter) storyCounter.textContent = "";
}

function applyLanguage(lang) {
  currentLang = lang in translations ? lang : "de";
  localStorage.setItem(langKey, currentLang);
  document.documentElement.lang = currentLang;
  document.title = t("pageTitle");
  const descriptionMeta = document.querySelector('meta[name="description"]');
  if (descriptionMeta) descriptionMeta.setAttribute("content", t("pageDescription"));

  document.querySelectorAll("[data-i18n]").forEach((element) => {
    if (element.id === "wallet-status" || element.id === "wallet-nft-info") return;
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
  setWalletConnectButton(walletUiConnected);
  updateWalletStatus();
}

if (langDeBtn && langEnBtn) {
  langDeBtn.addEventListener("click", () => applyLanguage("de"));
  langEnBtn.addEventListener("click", () => applyLanguage("en"));
}

if (navToggle && navLinks) {
  navToggle.addEventListener("click", () => {
    document.body.classList.toggle("nav-open");
    navToggle.setAttribute("aria-expanded", document.body.classList.contains("nav-open") ? "true" : "false");
  });

  navLinks.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      document.body.classList.remove("nav-open");
      navToggle.setAttribute("aria-expanded", "false");
    });
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 420) {
      document.body.classList.remove("nav-open");
      navToggle.setAttribute("aria-expanded", "false");
    }
  });
}

galleryImages.forEach((imageElement) => {
  imageElement.addEventListener("click", () => openStoryModal(imageElement));
});

if (storyCloseBtn) {
  storyCloseBtn.addEventListener("click", closeStoryModal);
}

if (storyPrevBtn) {
  storyPrevBtn.addEventListener("click", () => {
    if (!storyModal || !storyModal.classList.contains("open")) return;
    renderStoryByIndex(activeGalleryIndex - 1);
  });
}

if (storyNextBtn) {
  storyNextBtn.addEventListener("click", () => {
    if (!storyModal || !storyModal.classList.contains("open")) return;
    renderStoryByIndex(activeGalleryIndex + 1);
  });
}

if (storyModal) {
  storyModal.addEventListener("click", (event) => {
    if (event.target === storyModal) closeStoryModal();
  });
}

document.addEventListener("keydown", (event) => {
  if (!storyModal || !storyModal.classList.contains("open")) return;
  if (event.key === "Escape") closeStoryModal();
  if (event.key === "ArrowLeft") renderStoryByIndex(activeGalleryIndex - 1);
  if (event.key === "ArrowRight") renderStoryByIndex(activeGalleryIndex + 1);
});

if (walletConnectBtn) {
  walletConnectBtn.addEventListener("click", async () => {
    if (walletConnectBtn.textContent === t("walletDisconnect")) {
      disconnectWalletUi();
      return;
    }
    await connectWallet();
  });
}

if (walletSwitchAmoyBtn) {
  walletSwitchAmoyBtn.addEventListener("click", switchToPolygonAmoy);
}

if (window.ethereum) {
  window.ethereum.on("accountsChanged", () => updateWalletStatus());
  window.ethereum.on("chainChanged", () => updateWalletStatus());
}

applyLanguage(currentLang);
setWalletConnectButton(false);
updateWalletStatus();
