import Map from 'ol/Map';
import View from 'ol/View';
import KML from 'ol/format/KML';
import {Tile as TileLayer, Vector as VectorLayer} from 'ol/layer';
import BingMaps from 'ol/source/BingMaps';
import VectorSource from 'ol/source/Vector';

const raster = new TileLayer({
  source: new BingMaps({
    imagerySet: 'Aerial',
    key: 'As1HiMj1PvLPlqc_gtM7AqZfBL8ZL3VrjaS3zIb22Uvb9WKhuJObROC-qUpa81U5'
  })
});

const vector = new VectorLayer({
  source: new VectorSource({
    url: 'data/kml/2012-02-10.kml',
    format: new KML()
  })
});

const map = new Map({
  layers: [raster, vector],
  target: document.getElementById('map'),
  view: new View({
    center: [876970.8463461736, 5859807.853963373],
    projection: 'EPSG:3857',
    zoom: 10
  })
});

const displayFeatureInfo = function(pixel) {
  const features = [];
  map.forEachFeatureAtPixel(pixel, function(feature) {
    features.push(feature);
  });
  if (features.length > 0) {
    const info = [];
    let i, ii;
    for (i = 0, ii = features.length; i < ii; ++i) {
      info.push(features[i].get('name'));
    }
    document.getElementById('info').innerHTML = info.join(', ') || '(unknown)';
    map.getTarget().style.cursor = 'pointer';
  } else {
    document.getElementById('info').innerHTML = '&nbsp;';
    map.getTarget().style.cursor = '';
  }
};

map.on('pointermove', function(evt) {
  if (evt.dragging) {
    return;
  }
  const pixel = map.getEventPixel(evt.originalEvent);
  displayFeatureInfo(pixel);
});

map.on('click', function(evt) {
  displayFeatureInfo(evt.pixel);
});
