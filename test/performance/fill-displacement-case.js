import Map from '../../src/ol/Map.js';
import View from '../../src/ol/View.js';
import WebGPUVectorLayer from '../../src/ol/layer/WebGPUVector.js';
import {get as getProjection} from '../../src/ol/proj.js';
import VectorSource from '../../src/ol/source/Vector.js';
import {createWorldPolygons} from './data.js';
import {createFlightPhases, readFlightConfig, runFlight} from './flight.js';

/**
 * Creates a two-fill benchmark that differs only in the top fill displacement.
 *
 * @param {string} name Benchmark case name.
 * @param {import("../../src/ol/coordinate.js").Coordinate} displacement Top
 * fill displacement.
 * @return {function(HTMLElement, URLSearchParams): {run: function(): Promise<Object>}} Setup function.
 */
export function createFillDisplacementCase(name, displacement) {
  return function setup(target, params) {
    const config = {...readFlightConfig(params), case: name};
    const source = new VectorSource();
    source.setProjection('EPSG:4326');
    source.addFeatures(createWorldPolygons(config.features, config.vertices));
    const layer = new WebGPUVectorLayer({
      style: [
        {'fill-color': [72, 72, 72, 0.3]},
        {
          'fill-color': [255, 255, 255, 0.3],
          'fill-displacement': displacement,
          'fill-displacement-anchor': 'viewport',
        },
      ],
      source,
    });
    const projection = getProjection(config.projection);
    const view = new View({
      projection: projection || 'EPSG:3857',
      center: [0, 0],
      zoom: 2,
    });
    const map = new Map({layers: [layer], target, view});
    const phases = createFlightPhases(view, 1, 7);
    return {
      run: () =>
        runFlight({
          map,
          layer,
          phases,
          framesPerPhase: config.framesPerPhase,
          warmup: config.warmup,
          config,
        }),
    };
  };
}
