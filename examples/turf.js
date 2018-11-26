import Map from 'ol/Map';
import View from 'ol/View';
import GeoJSON from 'ol/format/GeoJSON';
import {Tile as TileLayer, Vector as VectorLayer} from 'ol/layer';
import {fromLonLat} from 'ol/proj';
import {OSM, Vector as VectorSource} from 'ol/source';


const source = new VectorSource();
fetch('data/geojson/roads-seoul.geojson').then(function(response) {
  return response.json();
}).then(function(json) {
  const format = new GeoJSON();
  const features = format.readFeatures(json);
  const street = features[0];

  // convert to a turf.js feature
  const turfLine = format.writeFeatureObject(street);

  // show a marker every 200 meters
  const distance = 0.2;

  // get the line length in kilometers
  const length = turf.lineDistance(turfLine, 'kilometers');
  for (let i = 1; i <= length / distance; i++) {
    const turfPoint = turf.along(turfLine, i * distance, 'kilometers');

    // convert the generated point to a OpenLayers feature
    const marker = format.readFeature(turfPoint);
    marker.getGeometry().transform('EPSG:4326', 'EPSG:3857');
    source.addFeature(marker);
  }

  street.getGeometry().transform('EPSG:4326', 'EPSG:3857');
  source.addFeature(street);
});
const vectorLayer = new VectorLayer({
  source: source
});

const rasterLayer = new TileLayer({
  source: new OSM()
});

const map = new Map({
  layers: [rasterLayer, vectorLayer],
  target: document.getElementById('map'),
  view: new View({
    center: fromLonLat([126.980366, 37.526540]),
    zoom: 15
  })
});
