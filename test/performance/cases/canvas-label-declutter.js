import VectorTileLayer from '../../../src/ol/layer/VectorTile.js';
import {createLabelDeclutterBenchmark} from '../shared/synthetic-cases.js';

export const name = 'canvas-label-declutter';
export const title = 'Canvas label declutter';
export const order = 4;

/**
 * Isolated point-label placement on a Canvas vector tile layer.
 * @param {HTMLElement} target Map target.
 * @param {URLSearchParams} params Page query.
 * @return {{run: function(): Promise<Object>, dispose: function(): void}} Benchmark.
 */
export function setup(target, params) {
  return createLabelDeclutterBenchmark(
    target,
    params,
    name,
    VectorTileLayer,
    (layer) => !!layer.getRenderer(),
  );
}
