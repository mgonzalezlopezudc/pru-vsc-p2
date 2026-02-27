function initMap(container, location) {
  if (!container || !location || location.type !== "Point") {
    return;
  }

  const coordinates = location.coordinates;
  if (!Array.isArray(coordinates) || coordinates.length !== 2) {
    return;
  }

  const [lon, lat] = coordinates;
  if (typeof lat !== "number" || typeof lon !== "number") {
    return;
  }

  const map = L.map(container).setView([lat, lon], 15);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(map);

  L.marker([lat, lon]).addTo(map);
}

function escapeHtml(value) {
  if (typeof value !== "string") {
    return "";
  }

  const htmlEntities = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  };

  return value.replace(/[&<>"']/g, (char) => htmlEntities[char]);
}

function toLatLonCoordinates(location) {
  if (!location || location.type !== "Point") {
    return null;
  }

  const coordinates = location.coordinates;
  if (!Array.isArray(coordinates) || coordinates.length !== 2) {
    return null;
  }

  const [lon, lat] = coordinates;
  if (typeof lat !== "number" || typeof lon !== "number") {
    return null;
  }

  return [lat, lon];
}

function initStoresMap(container, stores) {
  if (!container || !Array.isArray(stores) || stores.length === 0) {
    return;
  }

  const validStores = stores
    .map((store) => {
      const coordinates = toLatLonCoordinates(store.location);
      if (!coordinates) {
        return null;
      }

      return {
        name: store.name,
        address: store.address,
        detailUrl: store.detail_url,
        coordinates
      };
    })
    .filter(Boolean);

  if (validStores.length === 0) {
    return;
  }

  const map = L.map(container);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(map);

  const bounds = [];
  const popupLinkLabel = container.dataset.popupLinkLabel || "View store";

  validStores.forEach((store) => {
    const marker = L.marker(store.coordinates).addTo(map);
    const popupParts = [
      `<strong>${escapeHtml(store.name)}</strong>`,
      escapeHtml(store.address)
    ];

    if (typeof store.detailUrl === "string" && store.detailUrl.length > 0) {
      popupParts.push(`<a class="map-popup-link" href="${escapeHtml(store.detailUrl)}">${escapeHtml(popupLinkLabel)}</a>`);
    }

    const popup = popupParts.join("<br>");
    marker.bindPopup(popup);
    bounds.push(store.coordinates);
  });

  if (bounds.length === 1) {
    map.setView(bounds[0], 15);
    return;
  }

  map.fitBounds(bounds, { padding: [30, 30] });
}

document.addEventListener("DOMContentLoaded", () => {
  const storesMapElement = document.querySelector("[data-stores]");
  if (storesMapElement) {
    try {
      const stores = JSON.parse(storesMapElement.dataset.stores);
      initStoresMap(storesMapElement, stores);
    } catch (error) {
      console.error("Invalid stores map data", error);
    }
  }

  const mapElements = document.querySelectorAll("[data-geojson]");
  mapElements.forEach((element) => {
    try {
      const location = JSON.parse(element.dataset.geojson);
      initMap(element, location);
    } catch (error) {
      console.error("Invalid geojson data", error);
    }
  });
});
