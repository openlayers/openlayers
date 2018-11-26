import Map from 'ol/Map';
import View from 'ol/View';
import GeoJSON from 'ol/format/GeoJSON';
import VectorImageLayer from 'ol/layer/VectorImage';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import {Fill, Stroke, Style, Text} from 'ol/style';


const style = new Style({
  fill: new Fill({
    color: 'rgba(255, 255, 255, 0.6)'
  }),
  stroke: new Stroke({
    color: '#319FD3',
    width: 1
  }),
  text: new Text()
});

const map = new Map({
  layers: [
    new VectorImageLayer({
      imageRatio: 2,
      source: new VectorSource({
        url: 'data/geojson/countries.geojson',
        format: new GeoJSON()
      }),
      style: function(feature) {
        style.getText().setText(feature.get('name'));
        return style;
      }
    })
  ],
  target: 'map',
  view: new View({
    center: [0, 0],
    zoom: 1
  })
});

const featureOverlay = new VectorLayer({
  source: new VectorSource(),
  map: map,
  style: new Style({
    stroke: new Stroke({
      color: '#f00',
      width: 1
    }),
    fill: new Fill({
      color: 'rgba(255,0,0,0.1)'
    })
  })
});

let highlight;
const displayFeatureInfo = function(pixel) {

  const feature = map.forEachFeatureAtPixel(pixel, function(feature) {
    return feature;
  });

  const info = document.getElementById('info');
  if (feature) {
    info.innerHTML = feature.getId() + ': ' + feature.get('name');
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
