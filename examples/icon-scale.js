import Feature from '../src/ol/Feature.js';
import Map from '../src/ol/Map.js';
import Overlay from '../src/ol/Overlay.js';
import Point from '../src/ol/geom/Point.js';
import TileJSON from '../src/ol/source/TileJSON.js';
import VectorSource from '../src/ol/source/Vector.js';
import View from '../src/ol/View.js';
import {Icon, Style, Text} from '../src/ol/style.js';
import {Tile as TileLayer, Vector as VectorLayer} from '../src/ol/layer.js';
import {fromLonLat} from '../src/ol/proj.js';
import {getVectorContext} from '../src/ol/render.js';

const rasterLayer = new TileLayer({
  source: new TileJSON({
    url: 'https://a.tiles.mapbox.com/v3/aj.1x1-degrees.json',
    crossOrigin: '',
  }),
});

const iconFeature = new Feature({
  geometry: new Point(fromLonLat([0, -10])),
  name: 'Fish.1',
});

const feature1 = new Feature({
  geometry: new Point(fromLonLat([0, -10])),
  name: 'Fish.1 Island',
});

const feature2 = new Feature({
  geometry: new Point(fromLonLat([-30, 10])),
  name: 'Fish.2 Island',
});

const iconStyle = new Style({
  image: new Icon({
    anchor: [0.5, 0.9],
    src: 'data/fish.png',
    crossOrigin: '',
    scale: [0, 0],
    rotation: Math.PI / 4,
  }),
  text: new Text({
    text: 'FISH\nTEXT',
    scale: [0, 0],
    rotation: Math.PI / 4,
    textAlign: 'center',
    textBaseline: 'top',
  }),
});

let i = 0;
let j = 45;

iconFeature.setStyle(function () {
  const x = Math.sin((i * Math.PI) / 180) * 3;
  const y = Math.sin((j * Math.PI) / 180) * 4;
  iconStyle.getImage().setScale([x, y]);
  iconStyle.getText().setScale([x, y]);
  return iconStyle;
});

rasterLayer.on('postrender', function (event) {
  const vectorContext = getVectorContext(event);
  const x = Math.cos((i * Math.PI) / 180) * 3;
  const y = Math.cos((j * Math.PI) / 180) * 4;
  iconStyle.getImage().setScale([x, y]);
  iconStyle.getText().setScale([x, y]);
  vectorContext.drawFeature(feature2, iconStyle);
});

const vectorSource = new VectorSource({
  features: [iconFeature, feature1, feature2],
});

const vectorLayer = new VectorLayer({
  source: vectorSource,
});

const map = new Map({
  layers: [rasterLayer, vectorLayer],
  target: document.getElementById('map'),
  view: new View({
    center: fromLonLat([-15, 0]),
    zoom: 3,
  }),
});

setInterval(function () {
  i = (i + 4) % 360;
  j = (j + 5) % 360;
  vectorSource.changed();
}, 1000);

const element = document.getElementById('popup');

const popup = new Overlay({
  element: element,
  positioning: 'bottom-center',
  stopEvent: false,
  offset: [0, -50],
});
map.addOverlay(popup);

// display popup on click
map.on('click', function (evt) {
  const feature = map.forEachFeatureAtPixel(evt.pixel, function (feature) {
    return feature;
  });
  $(element).popover('dispose');
  if (feature) {
    const coordinates = feature.getGeometry().getCoordinates();
    popup.setPosition(coordinates);
    $(element).popover({
      placement: 'top',
      html: true,
      animation: false,
      content: feature.get('name'),
    });
    $(element).popover('show');
  }
});

// change mouse cursor when over marker
map.on('pointermove', function (e) {
  if (e.dragging) {
    $(element).popover('dispose');
    return;
  }
  const pixel = map.getEventPixel(e.originalEvent);
  const hit = map.hasFeatureAtPixel(pixel);
  map.getTarget().style.cursor = hit ? 'pointer' : '';
});
