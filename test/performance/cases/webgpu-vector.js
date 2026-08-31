import Map from '../../../src/ol/Map.js';
import View from '../../../src/ol/View.js';
import WebGPUVectorLayer from '../../../src/ol/layer/WebGPUVector.js';
import {get as getProjection} from '../../../src/ol/proj.js';
import VectorSource from '../../../src/ol/source/Vector.js';
import {createWorldPolygons} from '../data.js';
import {createFlightPhases, readFlightConfig, runFlight} from '../flight.js';

export const name = 'webgpu-vector';

const style = {
  'stroke-color': '#777777aa',
  'stroke-width': 0.5,
  'fill-color': [255, 255, 255, 0.15],
};

/**
 * World polygons on a WebGPU vector layer.
 * @param {HTMLElement} target Map target.
 * @param {URLSearchParams} params Page query.
 * @return {{run: function(): Promise<Object>}} Benchmark.
 */
export function setup(target, params) {
  const config = {...readFlightConfig(params), case: name};
  const source = new VectorSource();
  source.setProjection('EPSG:4326');
  source.addFeatures(createWorldPolygons(config.features, config.vertices));
  const layer = new WebGPUVectorLayer({style, source});
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
}
