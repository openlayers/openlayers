import {assert} from 'chai';
import {requestDevice} from '../../../../../src/ol/webgpu/Device.js';
import ImageAtlas from '../../../../../src/ol/webgpu/ImageAtlas.js';

/**
 * @param {HTMLCanvasElement} image Source image.
 * @param {number} x Source x.
 * @param {number} y Source y.
 * @param {number} width Width.
 * @param {number} height Height.
 * @return {import("../../../../../src/ol/render/ImageStyle.js").ImageStyleData} Image style data.
 */
function imageData(image, x, y, width, height) {
  return /** @type {any} */ ({
    image,
    sourceX: x,
    sourceY: y,
    sourceWidth: width,
    sourceHeight: height,
  });
}

/**
 * @param {GPUDevice} device Device.
 * @param {GPUTexture} texture Atlas texture.
 * @param {number} x Left texel.
 * @param {number} y Top texel.
 * @return {Promise<Array<number>>} RGBA of one texel.
 */
async function readTexel(device, texture, x, y) {
  const buffer = device.createBuffer({
    size: 256,
    usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
  });
  const encoder = device.createCommandEncoder();
  encoder.copyTextureToBuffer(
    {texture, origin: {x, y}},
    {buffer, bytesPerRow: 256},
    [1, 1],
  );
  device.queue.submit([encoder.finish()]);
  await buffer.mapAsync(GPUMapMode.READ);
  const texel = Array.from(new Uint8Array(buffer.getMappedRange(), 0, 4));
  buffer.destroy();
  return texel;
}

/**
 * @return {HTMLCanvasElement} Red square left of a green square.
 */
function createSprite() {
  const source = document.createElement('canvas');
  source.width = 8;
  source.height = 4;
  const context = source.getContext('2d');
  context.fillStyle = '#f00';
  context.fillRect(0, 0, 4, 4);
  context.fillStyle = '#0f0';
  context.fillRect(4, 0, 4, 4);
  return source;
}

describe('ol/webgpu/ImageAtlas', () => {
  it('packs and deduplicates sprite rectangles', () => {
    const source = createSprite();
    const atlas = new ImageAtlas();
    const red = atlas.add(imageData(source, 0, 0, 4, 4));
    const green = atlas.add(imageData(source, 4, 0, 4, 4));
    assert.strictEqual(atlas.add(imageData(source, 0, 0, 4, 4)), red);
    assert.notDeepEqual(red, green);
  });

  it('keeps entries stable when the atlas grows', () => {
    const source = document.createElement('canvas');
    source.width = 300;
    source.height = 300;
    source.getContext('2d').fillRect(0, 0, 300, 300);
    const atlas = new ImageAtlas();
    const first = atlas.add(imageData(source, 0, 0, 300, 300));
    const before = {...first};
    const initialSize = atlas.getSize();
    atlas.add(imageData(source, 1, 0, 299, 300));
    assert.strictEqual(atlas.getSize(), initialSize * 2);
    assert.deepEqual(first, before);
  });

  it('forgets entries when disposed', () => {
    const source = createSprite();
    const atlas = new ImageAtlas();
    const red = atlas.add(imageData(source, 0, 0, 4, 4));
    atlas.dispose();
    assert.notStrictEqual(atlas.add(imageData(source, 0, 0, 4, 4)), red);
  });

  it('copies sprite rectangles and keeps them when the texture grows', async ({
    skip,
  }) => {
    const device = await requestDevice().then(
      (handle) => handle.device,
      () => null,
    );
    if (!device) {
      skip();
    }
    const helper = /** @type {*} */ ({getDevice: () => device});
    const source = createSprite();
    const atlas = new ImageAtlas();
    const red = atlas.add(imageData(source, 0, 0, 4, 4));
    // Fractional rectangles are drawn to a canvas first.
    const green = atlas.add(imageData(source, 4.5, 0, 3.5, 4));
    const texture = atlas.upload(helper);
    assert.deepEqual(
      await readTexel(device, texture, red.texX0, red.texY0),
      [255, 0, 0, 255],
    );
    assert.deepEqual(
      await readTexel(device, texture, green.texX0, green.texY0),
      [0, 255, 0, 255],
    );
    assert.strictEqual(atlas.upload(helper), texture);

    const large = document.createElement('canvas');
    large.width = 600;
    large.height = 600;
    large.getContext('2d').fillRect(0, 0, 600, 600);
    atlas.add(imageData(large, 0, 0, 600, 600));
    const grown = atlas.upload(helper);
    assert.notStrictEqual(grown, texture);
    assert.strictEqual(grown.width, 1024);
    assert.deepEqual(
      await readTexel(device, grown, red.texX0, red.texY0),
      [255, 0, 0, 255],
    );
  });
});
