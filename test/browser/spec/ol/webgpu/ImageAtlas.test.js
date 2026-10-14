import {assert} from 'chai';
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

describe('ol/webgpu/ImageAtlas', () => {
  it('packs and deduplicates sprite rectangles', () => {
    const source = document.createElement('canvas');
    source.width = 8;
    source.height = 4;
    const context = source.getContext('2d');
    context.fillStyle = '#f00';
    context.fillRect(0, 0, 4, 4);
    context.fillStyle = '#0f0';
    context.fillRect(4, 0, 4, 4);

    const atlas = new ImageAtlas();
    const red = atlas.add(imageData(source, 0, 0, 4, 4));
    const green = atlas.add(imageData(source, 4, 0, 4, 4));
    assert.strictEqual(atlas.add(imageData(source, 0, 0, 4, 4)), red);
    assert.notDeepEqual(red, green);

    const pixels = atlas
      .getCanvas()
      .getContext('2d')
      .getImageData(red.texX0, red.texY0, 1, 1).data;
    assert.deepEqual(Array.from(pixels), [255, 0, 0, 255]);
    const greenPixels = atlas
      .getCanvas()
      .getContext('2d')
      .getImageData(green.texX0, green.texY0, 1, 1).data;
    assert.deepEqual(Array.from(greenPixels), [0, 255, 0, 255]);
  });

  it('keeps texels stable when the atlas grows', () => {
    const source = document.createElement('canvas');
    source.width = 300;
    source.height = 300;
    source.getContext('2d').fillRect(0, 0, 300, 300);
    const atlas = new ImageAtlas();
    const first = atlas.add(imageData(source, 0, 0, 300, 300));
    const before = {...first};
    const initialSize = atlas.getCanvas().width;
    atlas.add(imageData(source, 1, 0, 299, 300));
    assert.strictEqual(atlas.getCanvas().width, initialSize * 2);
    assert.deepEqual(first, before);
  });
});
