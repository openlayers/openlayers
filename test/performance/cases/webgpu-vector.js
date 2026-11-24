import VectorLayer from '../../../src/ol/layer/Vector.js';
import {setDefaultRenderer} from '../../../src/ol/renderer.js';
import {createVectorBenchmark} from '../shared/synthetic-cases.js';

setDefaultRenderer('webgpu');

export const name = 'webgpu-vector';
export const title = 'WebGPU vector layer';
export const order = 1;

/**
 * Seeded points, lines, polygons, and multi-part geometries on a WebGPU vector layer.
 * @param {HTMLElement} target Map target.
 * @param {URLSearchParams} params Page query.
 * @return {{run: function(): Promise<Object>, dispose: function(): void}} Benchmark.
 */
export function setup(target, params) {
  return createVectorBenchmark(target, params, name, VectorLayer);
}
