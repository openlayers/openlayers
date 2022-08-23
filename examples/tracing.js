import Draw from '../src/ol/interaction/Draw.js';
import Feature from '../src/ol/Feature.js';
import Fill from '../src/ol/style/Fill.js';
import GeoJSON from '../src/ol/format/GeoJSON.js';
import LineString from '../src/ol/geom/LineString.js';
import Map from '../src/ol/Map.js';
import Snap from '../src/ol/interaction/Snap.js';
import Stroke from '../src/ol/style/Stroke.js';
import Style from '../src/ol/style/Style.js';
import View from '../src/ol/View.js';
import {OSM, Vector as VectorSource} from '../src/ol/source.js';
import {Tile as TileLayer, Vector as VectorLayer} from '../src/ol/layer.js';

const raster = new TileLayer({
  source: new OSM(),
});

// features in this layer will be snapped to
const baseVector = new VectorLayer({
  source: new VectorSource({
    format: new GeoJSON(),
    url: "https://ahocevar.com/geoserver/wfs?service=wfs&request=getfeature&typename=topp:states&cql_filter=STATE_NAME='Idaho'&outputformat=application/json",
  }),
});

// this is were the drawn features go
const drawVector = new VectorLayer({
  source: new VectorSource(),
  style: new Style({
    stroke: new Stroke({
      color: 'rgba(100, 255, 0, 1)',
      width: 2,
    }),
    fill: new Fill({
      color: 'rgba(100, 255, 0, 0.3)',
    }),
  }),
});

// this line only appears when we're tracing a feature outer ring
const previewLine = new Feature({
  geometry: new LineString([]),
});
const previewVector = new VectorLayer({
  source: new VectorSource({
    features: [previewLine],
  }),
  style: new Style({
    stroke: new Stroke({
      color: 'rgba(255, 0, 0, 1)',
      width: 2,
    }),
  }),
});

const map = new Map({
  layers: [raster, baseVector, drawVector, previewVector],
  target: 'map',
  view: new View({
    center: [-12986427, 5678422],
    zoom: 5,
  }),
});

let drawInteraction;

const snapInteraction = new Snap({
  source: baseVector.getSource(),
});

const typeSelect = document.getElementById('type');

function addInteraction() {
  const value = typeSelect.value;
  if (value !== 'None') {
    drawInteraction = new Draw({
      type: value,
      source: drawVector.getSource(),
      trace: true,
      traceSource: baseVector.getSource(),
    });
    map.addInteraction(drawInteraction);
    map.addInteraction(snapInteraction);
  }
}

typeSelect.onchange = function () {
  map.removeInteraction(drawInteraction);
  map.removeInteraction(snapInteraction);
  addInteraction();
};
addInteraction();
