import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import {
  DragAndDrop,
  defaults as defaultInteractions,
} from '../src/ol/interaction.js';
import {GPX, GeoJSON, IGC, KML, TopoJSON} from '../src/ol/format.js';
import {
  Tile as TileLayer,
  VectorImage as VectorImageLayer,
} from '../src/ol/layer.js';
import {Vector as VectorSource, XYZ} from '../src/ol/source.js';

const dragAndDropInteraction = new DragAndDrop({
  formatConstructors: [GPX, GeoJSON, IGC, KML, TopoJSON],
});

const key = 'get_your_own_D6rA4zTHduk6KOKTXzGB';
const attributions =
  '<a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a> ' +
  '<a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap contributors</a>';

const map = new Map({
  interactions: defaultInteractions().extend([dragAndDropInteraction]),
  layers: [
    new TileLayer({
      source: new XYZ({
        attributions: attributions,
        url:
          'https://api.maptiler.com/tiles/satellite/{z}/{x}/{y}.jpg?key=' + key,
        maxZoom: 20,
      }),
    }),
  ],
  target: 'map',
  view: new View({
    center: [0, 0],
    zoom: 2,
  }),
});

dragAndDropInteraction.on('addfeatures', function (event) {
  const vectorSource = new VectorSource({
    features: event.features,
  });
  map.addLayer(
    new VectorImageLayer({
      source: vectorSource,
    })
  );
  map.getView().fit(vectorSource.getExtent());
});

const displayFeatureInfo = function (pixel) {
  const features = [];
  map.forEachFeatureAtPixel(pixel, function (feature) {
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

map.on('pointermove', function (evt) {
  if (evt.dragging) {
    return;
  }
  const pixel = map.getEventPixel(evt.originalEvent);
  displayFeatureInfo(pixel);
});

map.on('click', function (evt) {
  displayFeatureInfo(evt.pixel);
});
