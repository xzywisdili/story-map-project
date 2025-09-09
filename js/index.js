import { SlideDeck } from './slidedeck.js';

// Center on Philadelphia
const map = L.map('map', { scrollWheelZoom: false }).setView([39.9526, -75.1652], 12);

// Base map: CartoDB Positron (soft, low-contrast)
L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
	attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
	subdomains: 'abcd',
	maxZoom: 20
}).addTo(map);

// Legend (match styles in slidedeck.js)
const legend = L.control({ position: 'topleft' });
legend.onAdd = function () {
  const div = L.DomUtil.create('div', 'legend leaflet-control');
  div.innerHTML = `
    <div><strong>Layers</strong></div>
    <div><span style="display:inline-block;width:14px;height:4px;background:#B10026;margin-right:6px;"></span> Prohibited Streets</div>
    <div><span style="display:inline-block;width:14px;height:10px;background:#FD8D3C;opacity:.5;margin-right:6px;"></span> Prohibited Areas</div>
    <div><span style="display:inline-block;width:10px;height:10px;border:2px solid #2B8CBE;background:#fff;border-radius:50%;margin-right:6px;"></span> Exceptions</div>
    <div><span style="display:inline-block;width:14px;height:10px;background:#31A354;opacity:.5;margin-right:6px;"></span> Special Vending Districts</div>
    <div><span style="display:inline-block;width:10px;height:10px;border:2px solid #6A51A3;background:#EDE7F6;border-radius:50%;margin-right:6px;"></span> Bus Shelters</div>
    <div><span style="display:inline-block;width:14px;height:10px;background:#2CA1B8;opacity:.35;margin-right:6px;"></span> PPR Districts</div>
  `;
  return div;
};
legend.addTo(map);

// SlideDeck
const slides = document.querySelectorAll('.slide');
const deck = new SlideDeck(slides, map);

document.addEventListener('scroll', () => deck.calcCurrentSlideIndex());
deck.preloadFeatureCollections();
deck.syncMapToCurrentSlide();
