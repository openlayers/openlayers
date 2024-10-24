import Projection from '../../../../../src/ol/proj/Projection.js';
import {add, get, remove} from '../../../../../src/ol/proj/transforms.js';

describe('ol/proj/transforms.js', function () {
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
    add(foo, bar, transform);
    expect(get('foo', 'bar')).to.be(transform);

    const removed = remove(foo, bar);
    expect(removed).to.be(transform);
    expect(get('foo', 'bar')).to.be(null);
  });
});
