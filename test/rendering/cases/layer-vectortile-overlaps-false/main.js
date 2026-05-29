import Feature from '../../../../src/ol/Feature.js';
import Map from '../../../../src/ol/Map.js';
import View from '../../../../src/ol/View.js';
import {fromExtent} from '../../../../src/ol/geom/Polygon.js';
import VectorTileLayer from '../../../../src/ol/layer/VectorTile.js';
import VectorTileSource from '../../../../src/ol/source/VectorTile.js';
import Fill from '../../../../src/ol/style/Fill.js';
import Stroke from '../../../../src/ol/style/Stroke.js';
import Style from '../../../../src/ol/style/Style.js';

// Two non-overlapping polygons in the same tile.
// Only the second one should have a stroke.
const vectorTileSource = new VectorTileSource({
  overlaps: false,
  tileSize: 512,
  tileUrlFunction: (tileCoord) => tileCoord.join('/'),
  tileLoadFunction(tile) {
    const extent = vectorTileSource
      .getTileGrid()
      .getTileCoordExtent(tile.tileCoord);
    const midX = (extent[0] + extent[2]) / 2;
    const quarterH = (extent[3] - extent[1]) / 4;
    const quarterW = (extent[2] - extent[0]) / 4;
    const midY = (extent[1] + extent[3]) / 2;

    const feature1 = new Feature({
      geometry: fromExtent([
        extent[0] + quarterW * 0.5,
        midY,
        midX - quarterW * 0.5,
        extent[3] - quarterH * 0.5,
      ]),
      hasStroke: false,
    });

    const feature2 = new Feature({
      geometry: fromExtent([
        midX + quarterW * 0.5,
        midY,
        extent[2] - quarterW * 0.5,
        extent[3] - quarterH * 0.5,
      ]),
      hasStroke: true,
    });

    tile.setFeatures([feature1, feature2]);
  },
});

const vectorTileLayer = new VectorTileLayer({
  renderMode: 'vector',
  source: vectorTileSource,
  style: function (feature) {
    return new Style({
      fill: new Fill({
        color: 'rgba(100, 100, 255, 0.5)',
      }),
      stroke: feature.get('hasStroke')
        ? new Stroke({color: 'red', width: 3})
        : null,
    });
  },
});

new Map({
  target: 'map',
  layers: [vectorTileLayer],
  view: new View({
    center: [0, 0],
    zoom: 0,
  }),
});

render({
  message:
    'With overlaps: false, stroke should only apply to the feature that has a stroke style',
  tolerance: 0.01,
});
