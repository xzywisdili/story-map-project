/**
 * SlideDeck: supports multiple data files per slide; auto-styles by source tag.
 */
class SlideDeck {
  constructor(slides, map) {
    this.slides = slides;
    this.map = map;
    this.dataLayer = L.layerGroup().addTo(map);
    this.currentSlideIndex = 0;
  }

  updateDataLayer(collection) {
    this.dataLayer.clearLayers();

    const style = (feat) => {
      const src = (feat.properties?._src || '').toLowerCase();
      const g = feat.geometry?.type || '';

      // Lines
      if (/LineString/i.test(g)) {
        // Prohibited streets (default red)
        let color = '#B10026', dashArray = '4,4';
        if (src.includes('exceptions')) { color = '#2B8CBE'; dashArray = '0'; } // exception lines if any
        return { color, weight: 3, opacity: 0.9, dashArray };
      }

      // Polygons
      if (/Polygon/i.test(g)) {
        // Defaults
        let fillColor = '#FD8D3C'; // prohibited areas
        let fillOpacity = 0.45;

        if (src.includes('special')) { fillColor = '#31A354'; } // special vending districts (green)
        if (src.includes('ppr_districts')) { fillColor = '#2CA1B8'; fillOpacity = 0.35; } // PPR (soft teal)

        return { color: '#666', weight: 1, fillColor, fillOpacity, opacity: 0.8 };
      }

      // Points (fallback)
      return { color: '#2B8CBE', weight: 2 };
    };

    const pointToLayer = (feature, latlng) => {
      const src = (feature.properties?._src || '').toLowerCase();

      // Exceptions: blue circle
      if (src.includes('exceptions')) {
        return L.circleMarker(latlng, { radius: 6, color: '#2B8CBE', weight: 2, fillOpacity: 0.9, fillColor: '#2B8CBE' });
      }
      // Bus shelters: purple-outline soft fill
      if (src.includes('bus_transit_shelters')) {
        return L.circleMarker(latlng, { radius: 5, color: '#6A51A3', weight: 2, fillOpacity: 0.85, fillColor: '#EDE7F6' });
      }
      // Fallback
      return L.circleMarker(latlng, { radius: 5, color: '#555', weight: 2, fillOpacity: .8, fillColor: '#fff' });
    };

    const tooltipText = (f) => {
      const p = f.properties || {};
      const candidates = ['label','name','Name','street','Street','TITLE','Title','STOP_NAME','SHELTER_NA','DISTRICT','PPR_DIST'];
      const k = candidates.find((kk) => p[kk] != null);
      return k ? p[k] : (p._src || '');
    };

    const onEachFeature = (feature, layer) => {
      const src = (feature.properties?._src || '').toLowerCase();
      const g = feature.geometry?.type || '';

      // Non-exception polygons: keep non-interactive to avoid noisy tooltips
      if (/Polygon/i.test(g) && !src.includes('exceptions')) {
        layer.options.interactive = false;
        return;
      }

      const text = tooltipText(feature);
      if (text) {
        layer.on('mouseover', () => layer.bindTooltip(text).openTooltip());
        layer.on('mouseout',  () => layer.closeTooltip());
      }
    };

    const layer = L.geoJSON(collection, { style, pointToLayer, onEachFeature }).addTo(this.dataLayer);
    return layer;
  }

  async getSlideFeatureCollection(slide) {
    const filesAttr = slide.getAttribute('data-files') || `${slide.id}.json`;
    const files = filesAttr.split(',').map(s => s.trim());

    const features = [];
    for (const fname of files) {
      const resp = await fetch(`data/${fname}`);
      const gj = await resp.json();
      const srcTag = fname.replace(/\.geojson$/i, '');
      if (gj && gj.type === 'FeatureCollection' && Array.isArray(gj.features)) {
        gj.features.forEach(f => {
          f.properties = f.properties || {};
          f.properties._src = srcTag;
          features.push(f);
        });
      }
    }
    return { type: 'FeatureCollection', features };
  }

  hideAllSlides() {
    for (const slide of this.slides) slide.classList.add('hidden');
  }

  async syncMapToSlide(slide) {
    slide.showpopups = (slide.getAttribute('data-showpopups') === 'true');

    const collection = await this.getSlideFeatureCollection(slide);
    const layer = this.updateDataLayer(collection);

    const handleFlyEnd = () => {
      if (slide.showpopups) {
        const bounds = this.map.getBounds();
        let shown = 0;
        const MAX_LABELS = 30;

        layer.eachLayer((l) => {
          const f = l.feature;
          if (!f) return;
          const src = (f.properties?._src || '').toLowerCase();

          // Only permanent labels for "exceptions" points (limited and inside view)
          if (src.includes('exceptions') && l.getLatLng && bounds.contains(l.getLatLng()) && shown < MAX_LABELS) {
            const p = f.properties || {};
            const text = p.label || p.name || p.street || p.TITLE || p.SHELTER_NA || p.STOP_NAME || p._src || '';
            if (text) {
              l.bindTooltip(text, { permanent: true, direction: 'top', className: 'perm-tip' }).openTooltip();
              shown++;
            }
          }
        });
      }
      this.map.removeEventListener('moveend', handleFlyEnd);
    };

    this.map.addEventListener('moveend', handleFlyEnd);

    const b = layer.getBounds && layer.getBounds();
    if (b && b.isValid()) {
      this.map.flyToBounds(b, { padding: [40, 40] });
    }
  }

  syncMapToCurrentSlide() {
    const slide = this.slides[this.currentSlideIndex] || this.slides[0];
    this.syncMapToSlide(slide);
  }

  goNextSlide() {
    this.currentSlideIndex++;
    if (this.currentSlideIndex === this.slides.length) this.currentSlideIndex = 0;
    this.syncMapToCurrentSlide();
  }

  goPrevSlide() {
    this.currentSlideIndex--;
    if (this.currentSlideIndex < 0) this.currentSlideIndex = this.slides.length - 1;
    this.syncMapToCurrentSlide();
  }

  preloadFeatureCollections() {
    for (const slide of this.slides) this.getSlideFeatureCollection(slide);
  }

  calcCurrentSlideIndex() {
    const scrollPos = window.scrollY;
    const windowHeight = window.innerHeight;
    let i;
    for (i = 0; i < this.slides.length; i++) {
      const slidePos = this.slides[i].offsetTop - scrollPos + (windowHeight * .7);
      if (slidePos >= 0) break;
    }
    if (i !== this.currentSlideIndex) {
      this.currentSlideIndex = i;
      this.syncMapToCurrentSlide();
    }
  }
}

export { SlideDeck };
