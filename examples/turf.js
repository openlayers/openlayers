import {along} from '@turf/along';
import {length} from '@turf/length';
import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import GeoJSON from '../src/ol/format/GeoJSON.js';
import TileLayer from '../src/ol/layer/Tile.js';
import VectorLayer from '../src/ol/layer/Vector.js';
import {fromLonLat} from '../src/ol/proj.js';
import OSM from '../src/ol/source/OSM.js';
import VectorSource from '../src/ol/source/Vector.js';

const source = new VectorSource();
fetch('data/geojson/roads-seoul.geojson')
  .then(function (response) {
    return response.json();
  })
  .then(function (json) {
    const format = new GeoJSON();
    const features = format.readFeatures(json);
    const street = features[0];

    // convert to a turf.js feature
    const turfLine =
      /** @type {import('geojson').Feature<import('geojson').LineString>} */ (
        format.writeFeatureObject(street)
      );

    // show a marker every 200 meters
    const distance = 0.2;

    // get the line length in kilometers
    const units = {
      units: /** @type {import('@turf/helpers').Units} */ ('kilometers'),
    };
    const lineLength = length(turfLine, units);
    for (let i = 1; i <= lineLength / distance; i++) {
      const turfPoint = along(turfLine, i * distance, units);

      // convert the generated point to a OpenLayers feature
      const marker = /** @type {import('../src/ol/Feature.js').default} */ (
        format.readFeature(turfPoint)
      );
      marker.getGeometry().transform('EPSG:4326', 'EPSG:3857');
      source.addFeature(marker);
    }

    street.getGeometry().transform('EPSG:4326', 'EPSG:3857');
    source.addFeature(street);
  });
const vectorLayer = new VectorLayer({
  source: source,
});

const rasterLayer = new TileLayer({
  source: new OSM(),
});

const map = new Map({
  layers: [rasterLayer, vectorLayer],
  target: document.getElementById('map'),
  view: new View({
    center: fromLonLat([126.980366, 37.52654]),
    zoom: 15,
  }),
});
