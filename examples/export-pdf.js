// NOCOMPILE
import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import {defaults as defaultControls} from '../src/ol/control.js';
import WKT from '../src/ol/format/WKT.js';
import TileLayer from '../src/ol/layer/Tile.js';
import VectorLayer from '../src/ol/layer/Vector.js';
import OSM from '../src/ol/source/OSM.js';
import VectorSource from '../src/ol/source/Vector.js';

const raster = new TileLayer({
  source: new OSM()
});

const format = new WKT();
const feature = format.readFeature(
  'POLYGON((10.689697265625 -25.0927734375, 34.595947265625 ' +
        '-20.1708984375, 38.814697265625 -35.6396484375, 13.502197265625 ' +
        '-39.1552734375, 10.689697265625 -25.0927734375))');
feature.getGeometry().transform('EPSG:4326', 'EPSG:3857');

const vector = new VectorLayer({
  source: new VectorSource({
    features: [feature]
  })
});


const map = new Map({
  layers: [raster, vector],
  target: 'map',
  controls: defaultControls({
    attributionOptions: {
      collapsible: false
    }
  }),
  view: new View({
    center: [0, 0],
    zoom: 2
  })
});


const dims = {
  a0: [1189, 841],
  a1: [841, 594],
  a2: [594, 420],
  a3: [420, 297],
  a4: [297, 210],
  a5: [210, 148]
};

let loading = 0;
let loaded = 0;

const exportButton = document.getElementById('export-pdf');

exportButton.addEventListener('click', function() {

  exportButton.disabled = true;
  document.body.style.cursor = 'progress';

  const format = document.getElementById('format').value;
  const resolution = document.getElementById('resolution').value;
  const dim = dims[format];
  const width = Math.round(dim[0] * resolution / 25.4);
  const height = Math.round(dim[1] * resolution / 25.4);
  const size = /** @type {ol.Size} */ (map.getSize());
  const extent = map.getView().calculateExtent(size);

  const source = raster.getSource();

  const tileLoadStart = function() {
    ++loading;
  };

  function tileLoadEnd() {
    ++loaded;
    if (loading === loaded) {
      const canvas = this;
      window.setTimeout(function() {
        loading = 0;
        loaded = 0;
        const data = canvas.toDataURL('image/png');
        const pdf = new jsPDF('landscape', undefined, format);
        pdf.addImage(data, 'JPEG', 0, 0, dim[0], dim[1]);
        pdf.save('map.pdf');
        source.un('tileloadstart', tileLoadStart);
        source.un('tileloadend', tileLoadEnd, canvas);
        source.un('tileloaderror', tileLoadEnd, canvas);
        map.setSize(size);
        map.getView().fit(extent);
        map.renderSync();
        exportButton.disabled = false;
        document.body.style.cursor = 'auto';
      }, 100);
    }
  }

  map.once('postcompose', function(event) {
    source.on('tileloadstart', tileLoadStart);
    source.on('tileloadend', tileLoadEnd, event.context.canvas);
    source.on('tileloaderror', tileLoadEnd, event.context.canvas);
  });

  map.setSize([width, height]);
  map.getView().fit(extent);
  map.renderSync();

}, false);
