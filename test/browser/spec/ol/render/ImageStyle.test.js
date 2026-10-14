import {assert} from 'chai';
import {getImageStyleData} from '../../../../../src/ol/render/ImageStyle.js';
import Icon from '../../../../../src/ol/style/Icon.js';

describe('ol/render/ImageStyle', () => {
  it('normalizes a tinted high-DPI sprite rectangle', () => {
    const image = document.createElement('canvas');
    image.width = 10;
    image.height = 8;
    const icon = new Icon({
      img: image,
      size: [4, 3],
      offset: [1, 2],
      offsetOrigin: 'bottom-right',
      color: '#f00',
    });
    const data = getImageStyleData(icon, 2);
    assert.isNotNull(data);
    assert.strictEqual(data.imagePixelRatio, 2);
    assert.deepEqual(
      [data.sourceX, data.sourceY, data.sourceWidth, data.sourceHeight],
      [10, 6, 8, 6],
    );
    assert.deepEqual([data.anchorX, data.anchorY], [4, 3]);
  });
});
