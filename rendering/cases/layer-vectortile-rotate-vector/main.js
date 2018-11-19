import Map from '../../../src/ol/Map.js';
import View from '../../../src/ol/View.js';
import VectorTileSource from '../../../src/ol/source/VectorTile';
import MVT from '../../../src/ol/format/MVT';
import {createXYZ} from '../../../src/ol/tilegrid';
import VectorTileLayer from '../../../src/ol/layer/VectorTile';
import VectorSource from '../../../src/ol/source/Vector';
import Feature from '../../../src/ol/Feature';
import Point from '../../../src/ol/geom/Point';
import VectorLayer from '../../../src/ol/layer/Vector';
import Style from '../../../src/ol/style/Style';
import CircleStyle from '../../../src/ol/style/Circle';
import Fill from '../../../src/ol/style/Fill';

const vectorSource = new VectorSource({
  features: [
    new Feature(new Point([1825727.7316762917, 6143091.089223046]))
  ]
});
const layer = new VectorLayer({
  zIndex: 1,
  source: vectorSource,
  style: new Style({
    image: new CircleStyle({
      radius: 10,
      fill: new Fill({
        color: 'red'
      })
    })
  })
});

new Map({
  layers: [
    layer,
    new VectorTileLayer({
      source: new VectorTileSource({
        format: new MVT(),
        tileGrid: createXYZ(),
        url: '/data/tiles/mapbox-streets-v6/{z}/{x}/{y}.vector.pbf',
        transition: 0
      })
    })
  ],
  target: 'map',
  view: new View({
    center: [1825927.7316762917, 6143091.089223046],
    zoom: 14,
    rotation: Math.PI / 4
  })
});

render({message: 'Vector tile layer rotates with vector layer on top'});
