import {Map, View} from '../src/ol/index.js';
import GeoJSON from '../src/ol/format/GeoJSON.js';
import {Modify, Select, Draw, Snap} from '../src/ol/interaction.js';
import {Tile as TileLayer, Vector as VectorLayer} from '../src/ol/layer.js';
import {OSM, Vector as VectorSource} from '../src/ol/source.js';
import {useGeographic} from '../src/ol/proj.js';

useGeographic();

const source = new VectorSource({
  url: 'data/geojson/countries.geojson',
  format: new GeoJSON()
});

const map = new Map({
  target: 'map',
  layers: [
    new TileLayer({
      source: new OSM()
    }),
    new VectorLayer({
      source: source
    })
  ],
  view: new View({
    center: [0, 0],
    zoom: 2
  })
});

const select = new Select();

const modify = new Modify({
  features: select.getFeatures()
});

const draw = new Draw({
  type: 'Polygon',
  source: source
});

const snap = new Snap({
  source: source
});

function removeInteractions() {
  map.removeInteraction(modify);
  map.removeInteraction(select);
  map.removeInteraction(draw);
  map.removeInteraction(select);
}

const mode = document.getElementById('mode');
function onChange() {
  removeInteractions();
  switch (mode.value) {
    case 'draw': {
      map.addInteraction(draw);
      map.addInteraction(snap);
      break;
    }
    case 'modify': {
      map.addInteraction(select);
      map.addInteraction(modify);
      map.addInteraction(snap);
      break;
    }
    default: {
      // pass
    }
  }
}
mode.addEventListener('change', onChange);
onChange();
