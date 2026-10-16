import WebGPUVectorTileLayer from '../../../src/ol/layer/WebGPUVectorTile.js';
import {createLabelDeclutterBenchmark} from '../shared/synthetic-cases.js';

export const name = 'webgpu-label-declutter';
export const title = 'WebGPU label declutter';
export const order = 5;

/**
 * Isolated point-label placement during deterministic pan, zoom, and rotation.
 * @param {HTMLElement} target Map target.
 * @param {URLSearchParams} params Page query.
 * @return {{run: function(): Promise<Object>, dispose: function(): void}} Benchmark.
 */
export function setup(target, params) {
  return createLabelDeclutterBenchmark(
    target,
    params,
    name,
    WebGPUVectorTileLayer,
  );
}
