import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import GeoJSON from '../src/ol/format/GeoJSON.js';
import WFS from '../src/ol/format/WFS.js';
import {
  and as andFilter,
  equalTo as equalToFilter,
  like as likeFilter,
} from '../src/ol/format/filter.js';
import TileLayer from '../src/ol/layer/Tile.js';
import VectorLayer from '../src/ol/layer/Vector.js';
import ImageTile from '../src/ol/source/ImageTile.js';
import VectorSource from '../src/ol/source/Vector.js';
import Stroke from '../src/ol/style/Stroke.js';
import Style from '../src/ol/style/Style.js';

const vectorSource = new VectorSource();
const vector = new VectorLayer({
  source: vectorSource,
  style: new Style({
    stroke: new Stroke({
      color: 'rgba(0, 0, 255, 1.0)',
      width: 2,
    }),
  }),
});

const key = 'get_your_own_D6rA4zTHduk6KOKTXzGB';
const attributions =
  '<a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a> ' +
  '<a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap contributors</a>';

const raster = new TileLayer({
  source: new ImageTile({
    attributions: attributions,
    url: 'https://api.maptiler.com/maps/satellite/{z}/{x}/{y}.jpg?key=' + key,
    tileSize: 512,
    maxZoom: 20,
  }),
});

const map = new Map({
  layers: [raster, vector],
  target: document.getElementById('map'),
  view: new View({
    center: [-8908887.277395891, 5381918.072437216],
    maxZoom: 19,
    zoom: 12,
  }),
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
    equalToFilter('waterway', 'riverbank'),
  ),
});

// then post the request and add the received features to a layer
fetch('https://ahocevar.com/geoserver/wfs', {
  method: 'POST',
  body: new XMLSerializer().serializeToString(featureRequest),
})
  .then(function (response) {
    return response.json();
  })
  .then(function (json) {
    const features = new GeoJSON().readFeatures(json);
    vectorSource.addFeatures(features);
    map.getView().fit(vectorSource.getExtent());
  });
