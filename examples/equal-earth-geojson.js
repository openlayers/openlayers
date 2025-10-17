import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import GeoJSON from '../src/ol/format/GeoJSON.js';
import VectorLayer from '../src/ol/layer/Vector.js';
import VectorSource from '../src/ol/source/Vector.js';

(async () => {
  const response = await fetch(
    'https://openlayers.org/data/vector/ecoregions.json',
  );
  const geojson = await response.json();

  const vectorLayer = new VectorLayer({
    source: new VectorSource({
      features: new GeoJSON({featureProjection: 'EPSG:3857'}).readFeatures(
        geojson,
      ),
    }),
    style: {
      'fill-color': ['string', ['get', 'COLOR'], '#eee'],
    },
  });

  const map = new Map({
    layers: [vectorLayer],
    target: 'map',
    view: new View({
      center: [0, 0],
      zoom: 1,
    }),
  });

  const featureOverlay = new VectorLayer({
    source: new VectorSource(),
    map: map,
    style: {
      'stroke-color': 'rgba(255, 255, 255, 0.7)',
      'stroke-width': 2,
    },
  });

  let highlight;
  const displayFeatureInfo = function (pixel) {
    const feature = map.forEachFeatureAtPixel(pixel, function (feature) {
      return feature;
    });

    const info = document.getElementById('info');
    if (feature) {
      info.innerHTML = feature.get('ECO_NAME') || '&nbsp;';
    } else {
      info.innerHTML = '&nbsp;';
    }

    if (feature !== highlight) {
      if (highlight) {
        featureOverlay.getSource().removeFeature(highlight);
      }
      if (feature) {
        featureOverlay.getSource().addFeature(feature);
      }
      highlight = feature;
    }
  };

  map.on('pointermove', function (evt) {
    if (evt.dragging) {
      return;
    }
    displayFeatureInfo(evt.pixel);
  });

  map.on('click', function (evt) {
    displayFeatureInfo(evt.pixel);
  });
})();
