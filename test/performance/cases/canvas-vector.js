import VectorLayer from '../../../src/ol/layer/Vector.js';
import {createVectorBenchmark} from '../shared/synthetic-cases.js';

export const name = 'canvas-vector';
export const title = 'Canvas vector layer';
export const order = 0;

/**
 * Seeded points, lines, polygons, and multi-part geometries on a Canvas vector layer.
 * @param {HTMLElement} target Map target.
 * @param {URLSearchParams} params Page query.
 * @return {{run: function(): Promise<Object>, dispose: function(): void}} Benchmark.
 */
export function setup(target, params) {
  return createVectorBenchmark(
    target,
    params,
    name,
    VectorLayer,
    (layer) => !!layer.getRenderer(),
  );
}
