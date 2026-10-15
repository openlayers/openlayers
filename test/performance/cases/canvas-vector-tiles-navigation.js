import Map from '../../../src/ol/Map.js';
import View from '../../../src/ol/View.js';
import VectorTileLayer from '../../../src/ol/layer/VectorTile.js';
import {
  createNavigationPhases,
  readFlightConfig,
  runFlight,
} from '../flight.js';
import {
  createUrbanSource,
  NAVIGATION_ZOOM,
  urbanStyle,
  VIENNA_CENTER,
} from '../urban.js';

export const name = 'canvas-vector-tiles-navigation';

/**
 * Canvas baseline for the dense high-zoom navigation flight.
 * @param {HTMLElement} target Map target.
 * @param {URLSearchParams} params Page query.
 * @return {{run: function(): Promise<Object>}} Benchmark.
 */
export function setup(target, params) {
  const density = Number(params.get('density') || 8);
  const config = {
    ...readFlightConfig(params),
    case: name,
    density,
    mode: 'animate',
  };
  const {source} = createUrbanSource(density);
  const layer = new VectorTileLayer({
    source,
    style: urbanStyle,
    declutter: true,
  });
  const view = new View({
    center: VIENNA_CENTER,
    zoom: NAVIGATION_ZOOM,
  });
  const map = new Map({layers: [layer], target, view});
  let run = 0;
  return {
    run: () =>
      runFlight({
        map,
        layer,
        phases: createNavigationPhases(
          view,
          VIENNA_CENTER,
          NAVIGATION_ZOOM,
          run++,
        ),
        framesPerPhase: config.framesPerPhase,
        warmup: config.warmup,
        config,
        mode: 'animate',
        ready: (candidate) => !!candidate.getRenderer(),
      }),
  };
}
