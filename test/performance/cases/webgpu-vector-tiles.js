import WebGPUVectorTileLayer from '../../../src/ol/layer/WebGPUVectorTile.js';
import {
  createNavigationPhases,
  readFlightConfig,
  runFlight,
} from '../shared/flight.js';
import {
  createVersatilesMap,
  versatilesCenter,
  versatilesSourceMaxZoom,
  versatilesZoom,
} from '../shared/versatiles-map.js';

export const name = 'webgpu-vector-tiles';
export const title = 'WebGPU vector tiles';
export const order = 3;
export const fixture = 'versatiles';

/**
 * Offline VersaTiles navigation on a WebGPU vector tile layer.
 * @param {HTMLElement} target Map target.
 * @param {URLSearchParams} params Page query.
 * @return {Promise<Object>} Benchmark.
 */
export async function setup(target, params) {
  const prepared = await createVersatilesMap(target, WebGPUVectorTileLayer);
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
  return {
    run: (signal) =>
      runFlight({
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
      }),
    dispose: () => map.setTarget(null),
  };
}
