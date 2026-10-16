import View from '../../../src/ol/View.js';
import {get as getProjection} from '../../../src/ol/proj.js';
import VectorSource from '../../../src/ol/source/Vector.js';
import VectorTileSource from '../../../src/ol/source/VectorTile.js';
import {createXYZ} from '../../../src/ol/tilegrid.js';
import {createLabelTileFeatures, createVectorFeatures} from './data.js';
import {
  createBenchmarkMap,
  createFlightPhases,
  readFlightConfig,
  runFlight,
} from './flight.js';

const vectorStyle = {
  'fill-color': 'rgba(32, 32, 32, 0.45)',
  'stroke-color': '#222',
  'stroke-width': 1,
  'circle-radius': 3.5,
  'circle-fill-color': '#222',
  'circle-stroke-color': '#fff',
  'circle-stroke-width': 1,
};

const labelStyle = {
  'text-value': ['get', 'name'],
  'text-font': '12px sans-serif',
  'text-fill-color': '#334',
  'text-stroke-color': '#fff',
  'text-stroke-width': 2,
};

/**
 * Creates one side of the Canvas/WebGPU vector layer pair.
 * @param {HTMLElement} target Map target.
 * @param {URLSearchParams} params Page query.
 * @param {string} name Stable case name.
 * @param {Function} LayerClass Vector layer constructor.
 * @param {function(import('../../../src/ol/layer/Layer.js').default): boolean} [ready] Canvas renderer readiness check.
 * @return {{run: function(AbortSignal): Promise<Object>, dispose: function(): void}} Benchmark.
 */
export function createVectorBenchmark(target, params, name, LayerClass, ready) {
  const config = {...readFlightConfig(params), case: name};
  const source = new VectorSource();
  source.addFeatures(
    createVectorFeatures(config.features, config.vertices, config.projection),
  );
  const layer = new LayerClass({style: vectorStyle, source});
  const projection = getProjection(config.projection);
  const view = new View({
    projection: projection || 'EPSG:3857',
    center: [0, 0],
    zoom: 2,
  });
  const map = createBenchmarkMap(target, layer, view);
  const phases = createFlightPhases(view, 1, 7);
  return {
    run: (signal) =>
      runFlight({
        map,
        layer,
        phases,
        framesPerPhase: config.framesPerPhase,
        warmup: config.warmup,
        config,
        ready,
        signal,
      }),
    dispose: () => map.setTarget(null),
  };
}

/**
 * Creates one side of the Canvas/WebGPU label-declutter pair.
 * @param {HTMLElement} target Map target.
 * @param {URLSearchParams} params Page query.
 * @param {string} name Stable case name.
 * @param {Function} LayerClass Vector tile layer constructor.
 * @param {function(import('../../../src/ol/layer/Layer.js').default): boolean} [ready] Canvas renderer readiness check.
 * @return {{run: function(AbortSignal): Promise<Object>, dispose: function(): void}} Benchmark.
 */
export function createLabelDeclutterBenchmark(
  target,
  params,
  name,
  LayerClass,
  ready,
) {
  const config = {...readFlightConfig(params), case: name};
  const tileGrid = createXYZ({maxZoom: 14});
  const layer = new LayerClass({
    declutter: true,
    style: labelStyle,
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
  const map = createBenchmarkMap(target, layer, view);
  return {
    run: (signal) =>
      runFlight({
        map,
        layer,
        phases: createFlightPhases(view, 2, 9),
        framesPerPhase: config.framesPerPhase,
        warmup: config.warmup,
        config,
        ready,
        signal,
      }),
    dispose: () => map.setTarget(null),
  };
}
