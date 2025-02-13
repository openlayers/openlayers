import Feature from '../../../../src/ol/Feature.js';
import Map from '../../../../src/ol/Map.js';
import View from '../../../../src/ol/View.js';
import {containsCoordinate} from '../../../../src/ol/extent.js';
import Point from '../../../../src/ol/geom/Point.js';
import VectorTileLayer from '../../../../src/ol/layer/VectorTile.js';
import VectorTileSource from '../../../../src/ol/source/VectorTile.js';
import Circle from '../../../../src/ol/style/Circle.js';
import Fill from '../../../../src/ol/style/Fill.js';
import Style from '../../../../src/ol/style/Style.js';

const offset = 1380000;
const points = [
  [-offset, -offset],
  [-offset, offset],
  [offset, offset],
  [offset, -offset],
];

const vectorTileSource = new VectorTileSource({
  tileUrlFunction: (tileCoord) => tileCoord,
  tileLoadFunction(tile, tileCoord) {
    const features = points
      .filter((coordinate) =>
        containsCoordinate(
          vectorTileSource.getTileGrid().getTileCoordExtent(tileCoord),
          coordinate,
        ),
      )
      .map(
        (corner) =>
          new Feature({
            geometry: new Point(corner),
            tileCoord,
          }),
      );
    tile.setFeatures(features);
  },
});

const vectorTileLayer = new VectorTileLayer({
  source: vectorTileSource,
  style: [
    new Style({
      image: new Circle({radius: 50, fill: new Fill({color: '#f00'})}),
      zIndex: 0,
    }),
    new Style({
      image: new Circle({radius: 40, fill: new Fill({color: '#0f0'})}),
      zIndex: 1,
    }),
    new Style({
      image: new Circle({radius: 30, fill: new Fill({color: '#00f'})}),
      zIndex: 2,
    }),
  ],
});

new Map({
  target: 'map',
  layers: [vectorTileLayer],
  view: new View({
    center: [0, 0],
    zoom: 2,
    multiWorld: true,
  }),
});

render({
  message: 'The order of rendering circles in the style is: red, green, blue',
});
