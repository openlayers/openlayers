import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import {
  equalTo as equalToFilter,
  like as likeFilter,
  and as andFilter
} from '../src/ol/format/filter.js';
import {WFS, GeoJSON} from '../src/ol/format.js';
import {Tile as TileLayer, Vector as VectorLayer} from '../src/ol/layer.js';
import BingMaps from '../src/ol/source/BingMaps.js';
import VectorSource from '../src/ol/source/Vector.js';
import {Stroke, Style} from '../src/ol/style.js';


const vectorSource = new VectorSource();
const vector = new VectorLayer({
  source: vectorSource,
  style: new Style({
    stroke: new Stroke({
      color: 'rgba(0, 0, 255, 1.0)',
      width: 2
    })
  })
});

const raster = new TileLayer({
  source: new BingMaps({
    imagerySet: 'Aerial',
    key: 'As1HiMj1PvLPlqc_gtM7AqZfBL8ZL3VrjaS3zIb22Uvb9WKhuJObROC-qUpa81U5'
  })
});

const map = new Map({
  layers: [raster, vector],
  target: document.getElementById('map'),
  view: new View({
    center: [-8908887.277395891, 5381918.072437216],
    maxZoom: 19,
    zoom: 12
  })
});

// generate a GetFeature request
const featureRequest = new WFS().writeGetFeature({
  srsName: 'EPSG:3857',
  featureNS: 'http://openstreemap.org',
  featurePrefix: 'osm',
  featureTypes: ['water_areas'],
  outputFormat: 'application/json',
  filter: andFilter(
    likeFilter('name', 'Mississippi*'),
    equalToFilter('waterway', 'riverbank')
  )
});

// then post the request and add the received features to a layer
fetch('https://ahocevar.com/geoserver/wfs', {
  method: 'POST',
  body: new XMLSerializer().serializeToString(featureRequest)
}).then(function(response) {
  return response.json();
}).then(function(json) {
  const features = new GeoJSON().readFeatures(json);
  vectorSource.addFeatures(features);
  map.getView().fit(vectorSource.getExtent());
});
