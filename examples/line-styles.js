import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import GeoJSON from '../src/ol/format/GeoJSON.js';
import Draw from '../src/ol/interaction/Draw.js';
import Modify from '../src/ol/interaction/Modify.js';
import Snap from '../src/ol/interaction/Snap.js';
import {defaults as defaultInteractions} from '../src/ol/interaction/defaults.js';
import TileLayer from '../src/ol/layer/Tile.js';
import VectorLayer from '../src/ol/layer/Vector.js';
import OSM from '../src/ol/source/OSM.js';
import VectorSource from '../src/ol/source/Vector.js';
import Stroke from '../src/ol/style/Stroke.js';
import Style from '../src/ol/style/Style.js';

const source = new VectorSource({
  url: 'data/geojson/line-samples.geojson',
  format: new GeoJSON(),
});

const vector = new VectorLayer({source: source});

const styleOptionsForm = document.getElementById('line-style-options-form');
function updateStyles() {
  const formData = new FormData(styleOptionsForm);
  const styles = [
    new Style({
      stroke: new Stroke({
        color: formData.get('color'),
        lineCap: formData.get('lineCap'),
        lineJoin: formData.get('lineJoin'),
        lineDash: formData
          .get('lineDash')
          ?.split(',')
          ?.map((value) => Number(value)),
        lineDashOffset: formData.get('lineDashOffset'),
        miterLimit: formData.get('miterLimit'),
        width: formData.get('width'),
        offset: formData.get('offset'),
      }),
    }),
  ];

  // If offset is defined, add a reference line style to also see the original line without offset
  if (Math.abs(formData.get('offset')) > 0) {
    styles.push(
      new Style({
        stroke: new Stroke({
          color: '#aaa',
          width: 1,
          lineDash: [3, 3],
        }),
      }),
    );
  }
  vector.setStyle(styles);
}
updateStyles();
styleOptionsForm.addEventListener('change', updateStyles);

const modify = new Modify({source});
const draw = new Draw({source, type: 'Polygon'});
const snap = new Snap({source: source});

const map = new Map({
  layers: [
    new TileLayer({
      source: new OSM(),
    }),
    vector,
  ],
  target: 'map',
  view: new View({
    center: [-8161939, 6095025],
    zoom: 8,
  }),
  interactions: defaultInteractions().extend([modify, draw, snap]),
});
