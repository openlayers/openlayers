import Draw from '../src/ol/interaction/Draw.js';
import {Circle, Fill, Stroke, Style} from '../src/ol/style.js'
import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import {OSM, Vector as VectorSource} from '../src/ol/source.js';
import {Tile as TileLayer, Vector as VectorLayer} from '../src/ol/layer.js';

const raster = new TileLayer({
  source: new OSM(),
});

const source = new VectorSource({wrapX: false});

const vector = new VectorLayer({
  source: source,
});

const map = new Map({
  layers: [raster, vector],
  target: 'map',
  view: new View({
    center: [-11000000, 4600000],
    zoom: 4,
  }),
});
const styles = {
  Point: new Style({
    image: new Circle({
        radius: 5,
        fill: new Fill({
            color: 'red'
        })
    })
  }),
  LineString: new Style({
    image: new Circle({
        radius: 5,
        fill: new Fill({
            color: 'red'
        })
    }),
    stroke: new Stroke({
        color: 'yellow',
        width: 2
    })
  }),
  Polygon: new Style({
    image: new Circle({
        radius: 5,
        fill: new Fill({
            color: 'red',
        })
    }),
    stroke: new Stroke({
        color: 'yellow',
        width: 2
    }),
    fill: new Fill({
        color: 'blue'
    })
  }),
  Circle: new Style({
    image: new Circle({
        radius: 5,
        fill: new Fill({
            color: 'red'
        })
    }),
    stroke: new Stroke({
        color: 'yellow',
        width: 2
    }),
    fill: new Fill({
        color: 'blue'
    })
  })
}

const typeSelect = document.getElementById('type');

let draw; // global so we can remove it later
function addInteraction() {
  const value = typeSelect.value;
  if (value !== 'None') {
    draw = new Draw({
      source: source,
      type: typeSelect.value,
      style: styles[value],
    });
    map.addInteraction(draw);
  }
}

/**
 * Handle change event.
 */
typeSelect.onchange = function () {
  map.removeInteraction(draw);
  addInteraction();
};

document.getElementById('undo').addEventListener('click', function () {
  draw.removeLastPoint();
});

addInteraction();
