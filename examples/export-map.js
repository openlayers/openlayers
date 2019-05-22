import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import Overlay from '../src/ol/Overlay.js';
import GeoJSON from '../src/ol/format/GeoJSON.js';
import {Tile as TileLayer, Vector as VectorLayer} from '../src/ol/layer.js';
import {OSM, Vector as VectorSource} from '../src/ol/source.js';

import {toPng} from 'html-to-image';

const map = new Map({
  layers: [
    new TileLayer({
      source: new OSM()
    }),
    new VectorLayer({
      source: new VectorSource({
        url: 'data/geojson/countries.geojson',
        format: new GeoJSON()
      })
    })
  ],
  target: 'map',
  view: new View({
    center: [0, 0],
    zoom: 2
  })
});

map.addOverlay(new Overlay({
  position: [0, 0],
  element: document.getElementById('null')
}));


// export options for html-to-image.
// See: https://github.com/bubkoo/html-to-image#options
const exportOptions = {
  filter: function(element) {
    return element.className ? element.className.indexOf('ol-control') === -1 : true;
  }
};

document.getElementById('export-png').addEventListener('click', function() {
  map.once('rendercomplete', function() {
    toPng(map.getTargetElement(), exportOptions)
      .then(function(dataURL) {
        const link = document.getElementById('image-download');
        link.href = dataURL;
        link.click();
      });
  });
  map.renderSync();
});
