import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import {GPX, GeoJSON, IGC, KML, TopoJSON} from '../src/ol/format.js';
import {defaults as defaultInteractions, DragAndDrop} from '../src/ol/interaction.js';
import {VectorImage as VectorImageLayer, Tile as TileLayer} from '../src/ol/layer.js';
import {BingMaps, Vector as VectorSource} from '../src/ol/source.js';

const dragAndDropInteraction = new DragAndDrop({
  formatConstructors: [
    GPX,
    GeoJSON,
    IGC,
    KML,
    TopoJSON
  ]
});

const map = new Map({
  interactions: defaultInteractions().extend([dragAndDropInteraction]),
  layers: [
    new TileLayer({
      source: new BingMaps({
        imagerySet: 'Aerial',
        key: 'As1HiMj1PvLPlqc_gtM7AqZfBL8ZL3VrjaS3zIb22Uvb9WKhuJObROC-qUpa81U5'
      })
    })
  ],
  target: 'map',
  view: new View({
    center: [0, 0],
    zoom: 2
  })
});

dragAndDropInteraction.on('addfeatures', function(event) {
  const vectorSource = new VectorSource({
    features: event.features
  });
  map.addLayer(new VectorImageLayer({
    source: vectorSource
  }));
  map.getView().fit(vectorSource.getExtent());
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
    document.getElementById('info').innerHTML = info.join(', ') || '&nbsp';
  } else {
    document.getElementById('info').innerHTML = '&nbsp;';
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
