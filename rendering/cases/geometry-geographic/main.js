import {Map, View, Feature} from '../../../src/ol/index.js';
import {Point} from '../../../src/ol/geom.js';
import {Tile as TileLayer, Vector as VectorLayer} from '../../../src/ol/layer.js';
import {useGeographic} from '../../../src/ol/proj.js';
import {XYZ, Vector as VectorSource} from '../../../src/ol/source.js';
import {Style, Circle, Fill} from '../../../src/ol/style.js';

useGeographic();

const center = [8.6, 50.1];

const point = new Point(center);

new Map({
  layers: [
    new TileLayer({
      source: new XYZ({
        url: '/data/tiles/satellite/{z}/{x}/{y}.jpg',
        transition: 0
      })
    }),
    new VectorLayer({
      source: new VectorSource({
        features: [
          new Feature(point)
        ]
      }),
      style: new Style({
        image: new Circle({
          radius: 5,
          fill: new Fill({color: 'red'})
        })
      })
    })
  ],
  target: 'map',
  view: new View({
    center: center,
    zoom: 3
  })
});

render();
