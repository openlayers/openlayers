import Map from '../../../src/ol/Map.js';
import View from '../../../src/ol/View.js';
import WebGPUVectorTileLayer from '../../../src/ol/layer/WebGPUVectorTile.js';
import {get as getProjection} from '../../../src/ol/proj.js';
import VectorTileSource from '../../../src/ol/source/VectorTile.js';
import {createXYZ} from '../../../src/ol/tilegrid.js';
import {createLabelTileFeatures} from '../data.js';
import {createFlightPhases, readFlightConfig, runFlight} from '../flight.js';

export const name = 'webgpu-label-declutter';

/**
 * Isolated point-label placement during deterministic pan, zoom, and rotation.
 * @param {HTMLElement} target Map target.
 * @param {URLSearchParams} params Page query.
 * @return {{run: function(): Promise<Object>}} Benchmark.
 */
export function setup(target, params) {
  const config = {...readFlightConfig(params), case: name};
  const tileGrid = createXYZ({maxZoom: 14});
  const layer = new WebGPUVectorTileLayer({
    declutter: true,
    style: {
      'text-value': ['get', 'name'],
      'text-font': '12px sans-serif',
      'text-fill-color': '#334',
      'text-stroke-color': '#fff',
      'text-stroke-width': 2,
    },
    source: new VectorTileSource({
      tileGrid,
      projection: 'EPSG:3857',
      transition: 0,
      tileUrlFunction: (tileCoord) => JSON.stringify(tileCoord),
      tileLoadFunction: (tile, url) => {
        const tileCoord = JSON.parse(url);
        tile.setFeatures(
          createLabelTileFeatures(
            tileCoord,
            tileGrid.getTileCoordExtent(tileCoord),
          ),
        );
      },
    }),
  });
  const projection = getProjection(config.projection);
  const view = new View({
    projection: projection || 'EPSG:3857',
    center: [0, 0],
    zoom: 2,
  });
  const map = new Map({layers: [layer], target, view});
  return {
    run: () =>
      runFlight({
        map,
        layer,
        phases: createFlightPhases(view, 2, 9),
        framesPerPhase: config.framesPerPhase,
        warmup: config.warmup,
        config,
      }),
  };
}
