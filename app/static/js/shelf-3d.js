(function () {
  const sceneRoot = document.getElementById("shelf-3d-view");
  if (!sceneRoot) {
    return;
  }

  const safeParse = (rawValue) => {
    try {
      const parsed = JSON.parse(rawValue || "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  };

  const toNumber = (value) => {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : 0;
  };

  const clampPercent = (value) => {
    const percent = Math.round(value * 100);
    if (!Number.isFinite(percent)) {
      return 0;
    }
    return Math.max(0, Math.min(percent, 100));
  };

  const escapeHtml = (value) =>
    String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");

  const sceneData = safeParse(sceneRoot.dataset.scene);
  const emptyProductsMessage = sceneRoot.dataset.emptyProductsMessage || "Sin productos asignados.";
  if (sceneData.length === 0) {
    sceneRoot.innerHTML = `<p class="shelf-scene-empty">${escapeHtml(sceneRoot.dataset.emptyMessage || "No hay datos")}</p>`;
    return;
  }

  const stage = document.createElement("div");
  stage.className = "shelf-scene-stage";

  sceneData.forEach((shelf, shelfIndex) => {
    const shelfLayer = document.createElement("article");
    shelfLayer.className = "shelf-layer";
    shelfLayer.style.setProperty("--layer-index", String(shelfIndex));

    const loadRatio = toNumber(shelf.loadRatio);
    const loadPercent = clampPercent(loadRatio);

    const productsHtml = (Array.isArray(shelf.products) ? shelf.products : [])
      .map((product) => {
        const shelfCount = toNumber(product.shelfCount);
        const stockCount = toNumber(product.stockCount);
        const stockPercent = clampPercent(stockCount > 0 ? shelfCount / stockCount : 0);

        return `
          <div class="shelf-product" title="${escapeHtml(product.productName)}">
            <div class="shelf-product-image-wrap">
              <img class="shelf-product-image" src="${escapeHtml(product.productImage)}" alt="${escapeHtml(product.productName)}" loading="lazy">
            </div>
            <div class="shelf-product-info">
              <p class="shelf-product-name">${escapeHtml(product.productName)}</p>
              <p class="shelf-product-meta">${shelfCount} / ${stockCount}</p>
              <div class="shelf-product-meter">
                <span style="width:${stockPercent}%"></span>
              </div>
            </div>
          </div>
        `;
      })
      .join("");

    shelfLayer.innerHTML = `
      <div class="shelf-surface">
        <div class="shelf-headline">
          <p class="shelf-name">${escapeHtml(shelf.name)}</p>
          <p class="shelf-capacity">${shelf.currentLoad} / ${shelf.maxCapacity}</p>
        </div>
        <div class="shelf-load-meter" aria-hidden="true"><span style="width:${loadPercent}%"></span></div>
        <div class="shelf-products">${productsHtml || `<p class="shelf-scene-empty-inline">${escapeHtml(emptyProductsMessage)}</p>`}</div>
      </div>
    `;

    stage.appendChild(shelfLayer);
  });

  sceneRoot.replaceChildren(stage);

  sceneRoot.addEventListener("pointermove", (event) => {
    const rect = sceneRoot.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    const rotateY = (x - 0.5) * 10;
    const rotateX = (0.5 - y) * 8;
    sceneRoot.style.setProperty("--scene-rotate-y", `${rotateY.toFixed(2)}deg`);
    sceneRoot.style.setProperty("--scene-rotate-x", `${rotateX.toFixed(2)}deg`);
  });

  sceneRoot.addEventListener("pointerleave", () => {
    sceneRoot.style.setProperty("--scene-rotate-y", "0deg");
    sceneRoot.style.setProperty("--scene-rotate-x", "0deg");
  });
})();
