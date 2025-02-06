import Feature from '../../../../src/ol/Feature.js';
import Map from '../../../../src/ol/Map.js';
import View from '../../../../src/ol/View.js';
import {fromExtent} from '../../../../src/ol/geom/Polygon.js';
import VectorTileLayer from '../../../../src/ol/layer/VectorTile.js';
import VectorTileSource from '../../../../src/ol/source/VectorTile.js';
import Fill from '../../../../src/ol/style/Fill.js';
import Stroke from '../../../../src/ol/style/Stroke.js';
import Style from '../../../../src/ol/style/Style.js';
import Text from '../../../../src/ol/style/Text.js';

const vectorTileSource = new VectorTileSource({
  tileSize: 64,
  tileUrlFunction: (tileCoord) => tileCoord,
  tileLoadFunction(tile, tileCoord) {
    const polygon = new Feature({
      geometry: fromExtent(
        vectorTileSource.getTileGrid().getTileCoordExtent(tileCoord),
      ),
    });
    tile.setFeatures([polygon]);
  },
});

const vectorTileLayer = new VectorTileLayer({
  renderMode: 'vector',
  source: vectorTileSource,
  style: new Style({
    text: new Text({
      overflow: true,
      font: '32px ubuntu',
      offsetX: -10,
      text: 'W-',
      fill: new Fill({
        color: 'rgba(0, 0, 0, 1)',
      }),
      stroke: new Stroke({
        width: 35,
        color: 'red',
      }),
    }),
    fill: new Fill({
      color: 'rgba(0, 0, 255, 0.3)',
    }),
  }),
});

new Map({
  target: 'map',
  layers: [vectorTileLayer],
  view: new View({
    center: [0, 0],
    zoom: 1,
    multiWorld: true,
  }),
});

render({
  message: 'Text is rendered above polygons, even when from different tiles',
  tolerance: 0.001,
});
