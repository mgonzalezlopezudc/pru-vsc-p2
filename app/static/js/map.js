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

document.addEventListener("DOMContentLoaded", () => {
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
