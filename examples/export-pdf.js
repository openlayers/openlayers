import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import WKT from '../src/ol/format/WKT.js';
import {Tile as TileLayer, Vector as VectorLayer} from '../src/ol/layer.js';
import {OSM, Vector as VectorSource} from '../src/ol/source.js';

import {toJpeg} from 'html-to-image';

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


// export options for html-to-image.
// See: https://github.com/bubkoo/html-to-image#options
const exportOptions = {
  filter: function(element) {
    return element.className.indexOf('ol-control') === -1;
  }
};

const exportButton = document.getElementById('export-pdf');

exportButton.addEventListener('click', function() {

  exportButton.disabled = true;
  document.body.style.cursor = 'progress';

  const format = document.getElementById('format').value;
  const resolution = document.getElementById('resolution').value;
  const dim = dims[format];
  const width = Math.round(dim[0] * resolution / 25.4);
  const height = Math.round(dim[1] * resolution / 25.4);
  const size = map.getSize();
  const viewResolution = map.getView().getResolution();

  map.once('rendercomplete', function() {
    exportOptions.width = width;
    exportOptions.height = height;
    toJpeg(map.getViewport(), exportOptions).then(function(dataUrl) {
      const pdf = new jsPDF('landscape', undefined, format);
      pdf.addImage(dataUrl, 'JPEG', 0, 0, dim[0], dim[1]);
      pdf.save('map.pdf');
      // Reset original map size
      map.setSize(size);
      map.getView().setResolution(viewResolution);
      exportButton.disabled = false;
      document.body.style.cursor = 'auto';
    });
  });

  // Set print size
  const printSize = [width, height];
  map.setSize(printSize);
  const scaling = Math.min(width / size[0], height / size[1]);
  map.getView().setResolution(viewResolution / scaling);

}, false);
