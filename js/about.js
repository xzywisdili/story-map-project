/* Minimal map for the About page (separate from story logic) */
import L from 'https://cdn.skypack.dev/leaflet@1.9.4';

const map = L.map('map', {
  zoomControl: false,
  attributionControl: true,
  scrollWheelZoom: false,
  keyboard: false,
});

// Center on Philadelphia
map.setView([39.9526, -75.1652], 12);

// Light basemap (Carto/Voyager-like via Carto CDN)
const tiles = L.tileLayer(
    'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    {
      maxZoom: 19,
      attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    },
);
tiles.addTo(map);

// Optional: add a very subtle mask to keep attention on the card
const mask = L.rectangle([[-90, -180], [90, 180]], {
  color: '#000',
  weight: 0,
  fillOpacity: 0.02,
});
mask.addTo(map);

// Keep map behind the header & card
document.getElementById('map').setAttribute('aria-hidden', 'true');
