const uploadInput = document.getElementById("image-upload");
const clearButton = document.getElementById("clear-uploads");
const gallery = document.querySelector(".gallery-grid");
const storageKey = "twoheartpillows_uploaded_images_v1";

function createImageFigure(src, altText) {
  const figure = document.createElement("figure");
  const img = document.createElement("img");
  img.src = src;
  img.alt = altText;
  figure.appendChild(img);
  return figure;
}

function loadSavedImages() {
  const raw = localStorage.getItem(storageKey);
  if (!raw) return;

  try {
    const saved = JSON.parse(raw);
    if (!Array.isArray(saved)) return;

    saved.forEach((entry, index) => {
      if (!entry || typeof entry.src !== "string") return;
      gallery.appendChild(createImageFigure(entry.src, `Hochgeladenes Bild ${index + 1}`));
    });
  } catch (_err) {
    localStorage.removeItem(storageKey);
  }
}

function saveImages(images) {
  localStorage.setItem(storageKey, JSON.stringify(images));
}

if (uploadInput && gallery) {
  uploadInput.addEventListener("change", (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    const existing = JSON.parse(localStorage.getItem(storageKey) || "[]");

    files.forEach((file) => {
      if (!file.type.startsWith("image/")) return;
      const reader = new FileReader();
      reader.onload = () => {
        const src = String(reader.result || "");
        gallery.appendChild(createImageFigure(src, file.name));
        existing.push({ src, name: file.name });
        saveImages(existing);
      };
      reader.readAsDataURL(file);
    });
  });
}

if (clearButton && gallery) {
  clearButton.addEventListener("click", () => {
    localStorage.removeItem(storageKey);
    const figures = gallery.querySelectorAll("figure");
    figures.forEach((figure, idx) => {
      if (idx > 2) figure.remove();
    });
  });
}

loadSavedImages();
