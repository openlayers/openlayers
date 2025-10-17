import proj4 from 'proj4';
import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import GeoJSON from '../src/ol/format/GeoJSON.js';
import VectorLayer from '../src/ol/layer/Vector.js';
import {register} from '../src/ol/proj/proj4.js';
import {get as getProjection} from '../src/ol/proj.js';
import VectorSource from '../src/ol/source/Vector.js';

// Equal Earth projection with dynamic center meridian
function dynEqualEarth(center) {
  const lon0 = Math.round(center[0] / 15) * 15; // rounded to 15°
  const code = `EqualEarth${lon0}`;
  let prj = getProjection(code);
  if (!prj) {
    proj4.defs(
      code,
      `+proj=eqearth +lon_0=${lon0} +x_0=0 +y_0=0 +R=6371008.7714 +units=m +no_defs +type=crs`,
    );
    register(proj4);
    prj = getProjection(code);
    prj.setGlobal(true);
    prj.setExtent([-17243959.06, -8392927.6, 17243959.06, 8392927.6]);
    prj.setWorldExtent([-180, -90, 180, 90]);
  }

  return prj;
}

(async () => {
  const response = await fetch(
    'https://openlayers.org/data/vector/ecoregions.json',
  );
  const geojson = await response.json();

  const vectorLayer = new VectorLayer({
    source: new VectorSource({
      features: new GeoJSON({
        featureProjection: dynEqualEarth([0, 0]),
      }).readFeatures(geojson),
    }),
    extent: [-17243959.06, -8392927.6, 17243959.06, 8392927.6],
    wrapX: false,
    style: {
      'fill-color': ['string', ['get', 'COLOR'], '#eee'],
    },
  });

  const map = new Map({
    layers: [vectorLayer],
    target: 'map',
    view: new View({
      projection: dynEqualEarth([0, 0]),
      center: [0, 0],
      zoom: 1.5,
      extent: [-17243959.06, -8392927.6, 17243959.06, 8392927.6],
      constrainOnlyCenter: true,
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
