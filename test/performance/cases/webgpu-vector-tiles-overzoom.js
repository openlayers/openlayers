import Map from '../../../src/ol/Map.js';
import View from '../../../src/ol/View.js';
import WebGPUVectorTileLayer from '../../../src/ol/layer/WebGPUVectorTile.js';
import {get as getProjection} from '../../../src/ol/proj.js';
import VectorTileSource from '../../../src/ol/source/VectorTile.js';
import {createXYZ} from '../../../src/ol/tilegrid.js';
import {createTileFeatures} from '../data.js';
import {createOverzoomPhases, readFlightConfig, runFlight} from '../flight.js';

export const name = 'webgpu-vector-tiles-overzoom';

const sourceMaxZoom = 14;
const minZoom = 13;
const maxZoom = 17;

const style = {
  'stroke-color': '#667788aa',
  'stroke-width': 1.5,
  'fill-color': '#dde4ea',
  'circle-radius': 3,
  'circle-fill-color': '#445566',
  'text-value': ['case', ['has', 'name'], ['get', 'name'], ''],
  'text-font': '13px sans-serif',
  'text-fill-color': '#223344',
  'text-stroke-color': '#ffffff',
  'text-stroke-width': 2,
};

/**
 * Dense source-z14 tiles viewed through render tiles up to z17.
 * @param {HTMLElement} target Map target.
 * @param {URLSearchParams} params Page query.
 * @return {{run: function(): Promise<Object>}} Benchmark.
 */
export function setup(target, params) {
  const config = {
    ...readFlightConfig(params),
    case: name,
    sourceMaxZoom,
    minZoom,
    maxZoom,
  };
  const tileGrid = createXYZ({maxZoom: sourceMaxZoom});
  const layer = new WebGPUVectorTileLayer({
    declutter: true,
    style,
    source: new VectorTileSource({
      tileGrid,
      projection: 'EPSG:3857',
      transition: 0,
      tileUrlFunction: (tileCoord) => JSON.stringify(tileCoord),
      tileLoadFunction: (tile, url) => {
        const tileCoord = JSON.parse(url);
        // Complete asynchronously, like decoded network tiles entering the
        // renderer while the camera is moving.
        setTimeout(() => {
          tile.setFeatures(
            createTileFeatures(
              tileCoord,
              tileGrid.getTileCoordExtent(tileCoord),
              4,
            ),
          );
        }, 4);
      },
    }),
  });
  const projection = getProjection(config.projection);
  const view = new View({
    projection: projection || 'EPSG:3857',
    center: [0, 0],
    zoom: minZoom,
  });
  const map = new Map({layers: [layer], target, view});
  let run = 0;
  return {
    run: () =>
      runFlight({
        map,
        layer,
        phases: createOverzoomPhases(view, minZoom, maxZoom, run++),
        framesPerPhase: config.framesPerPhase,
        warmup: config.warmup,
        config,
      }),
  };
}
