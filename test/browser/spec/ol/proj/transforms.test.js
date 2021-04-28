import * as transforms from '../../../../../src/ol/proj/transforms.js';
import Projection from '../../../../../src/ol/proj/Projection.js';

describe('transforms.remove()', function () {
  const extent = [180, -90, 180, 90];
  const units = 'degrees';

  it('removes functions cached by transforms.add()', function () {
    const foo = new Projection({
      code: 'foo',
      units: units,
      extent: extent,
    });
    const bar = new Projection({
      code: 'bar',
      units: units,
      extent: extent,
    });
    const transform = function (input, output, dimension) {
      return input;
    };
    transforms.add(foo, bar, transform);
    expect(transforms.get('foo', 'bar')).to.be(transform);

    const removed = transforms.remove(foo, bar);
    expect(removed).to.be(transform);
    expect(transforms.get('foo', 'bar')).to.be(undefined);
  });
});
