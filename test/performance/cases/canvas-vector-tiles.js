import VectorTileLayer from '../../../src/ol/layer/VectorTile.js';
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

export const name = 'canvas-vector-tiles';
export const title = 'Canvas vector tiles';
export const order = 2;
export const fixture = 'versatiles';

/**
 * Offline VersaTiles navigation on a Canvas vector tile layer.
 * This is the Canvas counterpart of the WebGPU vector tiles case.
 * @param {HTMLElement} target Map target.
 * @param {URLSearchParams} params Page query.
 * @return {Promise<Object>} Benchmark.
 */
export async function setup(target, params) {
  const prepared = await createVersatilesMap(target, VectorTileLayer);
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
        ready: (candidate) => !!candidate.getRenderer(),
        signal,
      });
    },
    dispose: () => map.setTarget(null),
  };
}
