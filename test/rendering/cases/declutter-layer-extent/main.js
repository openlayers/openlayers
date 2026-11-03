import Feature from '../../../../src/ol/Feature.js';
import Map from '../../../../src/ol/Map.js';
import View from '../../../../src/ol/View.js';
import {containsCoordinate} from '../../../../src/ol/extent.js';
import Point from '../../../../src/ol/geom/Point.js';
import VectorLayer from '../../../../src/ol/layer/Vector.js';
import VectorTileLayer from '../../../../src/ol/layer/VectorTile.js';
import VectorSource from '../../../../src/ol/source/Vector.js';
import VectorTileSource from '../../../../src/ol/source/VectorTile.js';

const style = {
  'circle-radius': 20,
  'circle-fill-color': 'blue',
};

// Each layer has two overlapping symbols. The first is anchored outside the
// layer extent, so if it took part in decluttering, it would hide the second.
const vectorLayer = new VectorLayer({
  declutter: true,
  extent: [30, 0, 128, 128],
  source: new VectorSource({
    features: [
      new Feature(new Point([25, 50])),
      new Feature(new Point([55, 50])),
    ],
  }),
  style,
});

const vectorTileSource = new VectorTileSource({
  tileUrlFunction: (tileCoord) => tileCoord,
  tileLoadFunction(tile, tileCoord) {
    const tileExtent = vectorTileSource
      .getTileGrid()
      .getTileCoordExtent(tileCoord);
    tile.setFeatures(
      [
        [25, -50],
        [55, -50],
      ]
        .filter((coordinate) => containsCoordinate(tileExtent, coordinate))
        .map((coordinate) => new Feature(new Point(coordinate))),
    );
  },
});
const vectorTileLayer = new VectorTileLayer({
  declutter: true,
  extent: [30, -128, 128, 0],
  source: vectorTileSource,
  style,
});

new Map({
  target: 'map',
  view: new View({
    center: [0, 0],
    resolution: 1,
  }),
  layers: [vectorLayer, vectorTileLayer],
});

render({
  message: 'Symbols outside the layer extent do not declutter symbols inside',
});
