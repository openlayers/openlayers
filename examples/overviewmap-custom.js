import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import {defaults as defaultControls, OverviewMap} from '../src/ol/control.js';
import {defaults as defaultInteractions, DragRotateAndZoom} from '../src/ol/interaction.js';
import TileLayer from '../src/ol/layer/Tile.js';
import OSM from '../src/ol/source/OSM.js';


const rotateWithView = document.getElementById('rotateWithView');

const overviewMapControl = new OverviewMap({
  // see in overviewmap-custom.html to see the custom CSS used
  className: 'ol-overviewmap ol-custom-overviewmap',
  layers: [
    new TileLayer({
      source: new OSM({
        'url': 'https://{a-c}.tile.thunderforest.com/cycle/{z}/{x}/{y}.png' +
            '?apikey=0e6fc415256d4fbb9b5166a718591d71'
      })
    })
  ],
  collapseLabel: '\u00BB',
  label: '\u00AB',
  collapsed: false
});

rotateWithView.addEventListener('change', function() {
  overviewMapControl.setRotateWithView(this.checked);
});

const map = new Map({
  controls: defaultControls().extend([
    overviewMapControl
  ]),
  interactions: defaultInteractions().extend([
    new DragRotateAndZoom()
  ]),
  layers: [
    new TileLayer({
      source: new OSM()
    })
  ],
  target: 'map',
  view: new View({
    center: [500000, 6000000],
    zoom: 7
  })
});
