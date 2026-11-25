import {assert} from 'chai';
import DataTile from '../../../../../src/ol/DataTile.js';
import TileState from '../../../../../src/ol/TileState.js';
import TileTexture from '../../../../../src/ol/webgpu/TileTexture.js';

describe('ol/webgpu/TileTexture', () => {
  it('takes the interpolate setting from its tile', async () => {
    const tile = new DataTile({
      tileCoord: [0, 0, 0],
      loader: async () => document.createElement('canvas'),
      interpolate: false,
    });
    tile.load();
    while (tile.getState() !== TileState.LOADED) {
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
    const helper = /** @type {any} */ ({
      createTextureFromImage: () => ({destroy() {}}),
    });

    const texture = new TileTexture({tile, helper});

    assert.isTrue(texture.ready);
    assert.isFalse(texture.interpolate);
  });
});
