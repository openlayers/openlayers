import Feature from '../../../../src/ol/Feature.js';
import Map from '../../../../src/ol/Map.js';
import View from '../../../../src/ol/View.js';
import Polygon from '../../../../src/ol/geom/Polygon.js';
import WebGPUVectorTileLayer from '../../../../src/ol/layer/WebGPUVectorTile.js';
import VectorTileSource from '../../../../src/ol/source/VectorTile.js';
import TileGrid from '../../../../src/ol/tilegrid/TileGrid.js';

if (!navigator.gpu || !(await navigator.gpu.requestAdapter())) {
  render({
    skip: true,
    message: 'WebGPU is not available',
  });
} else {
  // The label sits in the view, but after the pan its tile does not. The tile
  // stays inside the declutter padding, so its label wins placement and has to
  // be drawn even though the tile's geometry is not.
  const grid = new TileGrid({
    extent: [0, -256, 256, 792],
    origin: [0, 792],
    resolutions: [1],
    tileSize: 256,
  });
  const labelTile = grid.getTileCoordForCoordAndZ([128, 400], 0).join('/');
  const feature = new Feature({
    geometry: new Polygon([
      [
        [20, 160],
        [236, 160],
        [236, 240],
        [20, 240],
        [20, 160],
      ],
    ]),
  });
  const layer = new WebGPUVectorTileLayer({
    declutter: true,
    source: new VectorTileSource({
      tileGrid: grid,
      tileUrlFunction: (tileCoord) => tileCoord.join('/'),
      tileLoadFunction(tile, url) {
        tile.setFeatures(url === labelTile ? [feature] : []);
      },
    }),
    style: {
      'text-value': 'Kept',
      'text-font': 'bold 48px sans-serif',
      'text-overflow': true,
      'text-fill-color': '#111',
      'text-stroke-color': '#fff',
      'text-stroke-width': 6,
    },
  });

  const map = new Map({
    pixelRatio: 1,
    layers: [layer],
    target: 'map',
    view: new View({
      center: [128, 320],
      resolution: 1,
      projection: 'EPSG:3857',
    }),
  });

  map.on('rendercomplete', function onStart() {
    const renderer = layer.getRenderer();
    const labels = renderer?.labelView_?.labels;
    const visibility = renderer?.visibility_;
    if (!renderer?.helper || !labels || !visibility) {
      return;
    }
    const index = labels.findIndex((label) => label.text === 'Kept');
    if (index < 0 || !visibility[index]) {
      return;
    }
    map.un('rendercomplete', onStart);
    map.getView().setCenter([128, 120]);
    map.on('rendercomplete', function onPan() {
      const view = renderer.labelView_;
      const panIndex = view.labels.findIndex((label) => label.text === 'Kept');
      if (panIndex < 0 || !renderer.visibility_?.[panIndex]) {
        return;
      }
      let source = 0;
      const starts = view.starts;
      while (source + 1 < starts.length && starts[source + 1] <= panIndex) {
        ++source;
      }
      // Still on a rendered tile: this pan did not reach the bug.
      if (source < renderer.renderedBatches_.length) {
        return;
      }
      map.un('rendercomplete', onPan);
      render({
        message: 'A label whose tile has left the view is still drawn',
        tolerance: 0.01,
      });
    });
  });
}
