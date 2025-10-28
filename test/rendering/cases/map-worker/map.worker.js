import Feature from '../../../../src/ol/Feature.js';
import Map from '../../../../src/ol/Map.js';
import View from '../../../../src/ol/View.js';
import Point from '../../../../src/ol/geom/Point.js';
import TileLayer from '../../../../src/ol/layer/Tile.js';
import VectorLayer from '../../../../src/ol/layer/Vector.js';
import VectorSource from '../../../../src/ol/source/Vector.js';
import XYZ from '../../../../src/ol/source/XYZ.js';
import CircleStyle from '../../../../src/ol/style/Circle.js';
import {Fill, Stroke, Style} from '../../../../src/ol/style.js';

/** @type {any} */
const worker = self;

worker.onmessage = (event) => {
  if (event.data.action !== 'render') {
    return;
  }
  const map = new Map({
    pixelRatio: 1,
    target: new OffscreenCanvas(256, 256),
    layers: [
      new TileLayer({
        source: new XYZ({
          url: '/data/tiles/osm/{z}/{x}/{y}.png',
          transition: 0,
        }),
      }),
      new VectorLayer({
        style: new Style({
          image: new CircleStyle({
            radius: 15,
            stroke: new Stroke({
              color: '#000',
              width: 2,
            }),
            fill: new Fill({
              color: '#3399CC',
            }),
          }),
        }),
        source: new VectorSource({
          features: [
            new Feature({
              geometry: new Point([0, 0]),
            }),
          ],
        }),
      }),
    ],
    view: new View({
      center: [0, 0],
      zoom: 0,
    }),
  });
  map.on('rendercomplete', (e) => {
    const bitmap = e.target.getTargetElement().transferToImageBitmap();
    worker.postMessage(
      {
        action: 'rendered',
        bitmap: bitmap,
      },
      [bitmap],
    );
  });
};
