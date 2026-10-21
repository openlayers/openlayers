import WebGPUVectorTileLayer from '../../../src/ol/layer/WebGPUVectorTile.js';
import {
  createNavigationPhases,
  readFlightConfig,
  runFlight,
} from '../shared/flight.js';
import {
  createVersatilesFlatMap,
  versatilesCenter,
  versatilesSourceMaxZoom,
  versatilesZoom,
} from '../shared/versatiles-map.js';

export const name = 'webgpu-vector-tiles-flat';
export const title = 'WebGPU vector tiles (flat style)';
export const order = 3.5;
export const fixture = 'versatiles';

/**
 * Offline VersaTiles navigation on a WebGPU vector tile layer styled with an
 * array of flat style rules, which is not resolved through a style function.
 * @param {HTMLElement} target Map target.
 * @param {URLSearchParams} params Page query.
 * @return {Promise<Object>} Benchmark.
 */
export async function setup(target, params) {
  const prepared = await createVersatilesFlatMap(target, WebGPUVectorTileLayer);
  if (prepared.unavailable) {
    return prepared;
  }
  const {map} = prepared;
  const config = {
    ...readFlightConfig(params),
    case: name,
    fixture,
    mode: 'animate',
    sourceMaxZoom: versatilesSourceMaxZoom,
    zoom: versatilesZoom,
  };
  const layer = map.getLayers().item(0);
  let firstRun = true;
  return {
    run: (signal) => {
      if (firstRun) {
        firstRun = false;
      } else {
        layer.getSource().clear();
        layer.getRenderer()?.clearCache();
      }
      return runFlight({
        map,
        layer,
        phases: createNavigationPhases(
          map.getView(),
          versatilesCenter,
          versatilesZoom,
        ),
        framesPerPhase: config.framesPerPhase,
        warmup: config.warmup,
        config,
        mode: 'animate',
        signal,
      });
    },
    dispose: () => map.setTarget(null),
  };
}
