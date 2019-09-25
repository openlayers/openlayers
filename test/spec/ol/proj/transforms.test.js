import Projection from '../../../../src/ol/proj/Projection.js';
import * as transforms from '../../../../src/ol/proj/transforms.js';


describe('transforms.remove()', () => {

  const extent = [180, -90, 180, 90];
  const units = 'degrees';

  test('removes functions cached by transforms.add()', () => {
    const foo = new Projection({
      code: 'foo',
      units: units,
      extent: extent
    });
    const bar = new Projection({
      code: 'bar',
      units: units,
      extent: extent
    });
    const transform = function(input, output, dimension) {
      return input;
    };
    transforms.add(foo, bar, transform);
    expect(transforms.get('foo', 'bar')).toBe(transform);

    const removed = transforms.remove(foo, bar);
    expect(removed).toBe(transform);
    expect(transforms.get('foo', 'bar')).toBe(undefined);
  });

});
