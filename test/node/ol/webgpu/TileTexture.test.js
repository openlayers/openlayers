import {assert} from 'chai';
import {packTileSamples} from '../../../../src/ol/webgpu/TileTexture.js';

describe('packTileSamples', () => {
  it('uploads one- and two-band bytes without an RGBA copy', () => {
    const one = new Uint8Array([10, 20, 30, 40]);
    const packedOne = packTileSamples(one, 2, 2, 1);
    assert.strictEqual(packedOne.data, one);
    assert.strictEqual(packedOne.format, 'r8unorm');
    assert.strictEqual(packedOne.bytesPerPixel, 1);
    assert.strictEqual(packedOne.unfilterable, false);

    const two = new Uint8ClampedArray([1, 2, 3, 4]);
    const packedTwo = packTileSamples(two, 1, 2, 2);
    assert.strictEqual(packedTwo.data, two);
    assert.strictEqual(packedTwo.format, 'rg8unorm');
    assert.strictEqual(packedTwo.bytesPerPixel, 2);
    assert.strictEqual(packedTwo.unfilterable, false);
  });

  it('expands three-band bytes to opaque RGBA', () => {
    const packed = packTileSamples(new Uint8Array([1, 2, 3, 4, 5, 6]), 2, 1, 3);
    assert.deepEqual(Array.from(packed.data), [1, 2, 3, 255, 4, 5, 6, 255]);
    assert.strictEqual(packed.format, 'rgba8unorm');
    assert.strictEqual(packed.bytesPerPixel, 4);
  });

  it('keeps four-band bytes as they are', () => {
    const rgba = new Uint8Array([1, 2, 3, 4]);
    const packed = packTileSamples(rgba, 1, 1, 4);
    assert.strictEqual(packed.data, rgba);
    assert.strictEqual(packed.format, 'rgba8unorm');
    assert.strictEqual(packed.bytesPerPixel, 4);
  });

  it('uploads one- and two-band floats without an RGBA copy', () => {
    const one = new Float32Array([1.5, -2]);
    const packedOne = packTileSamples(one, 2, 1, 1);
    assert.strictEqual(packedOne.data, one);
    assert.strictEqual(packedOne.format, 'r32float');
    assert.strictEqual(packedOne.bytesPerPixel, 4);
    assert.strictEqual(packedOne.unfilterable, true);

    const two = new Float32Array([1, 2, 3, 4]);
    const packedTwo = packTileSamples(two, 1, 2, 2);
    assert.strictEqual(packedTwo.data, two);
    assert.strictEqual(packedTwo.format, 'rg32float');
    assert.strictEqual(packedTwo.bytesPerPixel, 8);
    assert.strictEqual(packedTwo.unfilterable, true);
  });

  it('expands three-band floats to opaque RGBA', () => {
    const packed = packTileSamples(new Float32Array([1, 2, 3]), 1, 1, 3);
    assert.deepEqual(Array.from(packed.data), [1, 2, 3, 1]);
    assert.strictEqual(packed.format, 'rgba32float');
    assert.strictEqual(packed.bytesPerPixel, 16);
    assert.strictEqual(packed.unfilterable, true);
  });
});
