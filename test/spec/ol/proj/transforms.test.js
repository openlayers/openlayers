import Projection from '../../../../src/ol/proj/Projection.js';
import * as transforms from '../../../../src/ol/proj/transforms.js';


describe('transforms.remove()', function() {

  var extent = [180, -90, 180, 90];
  var units = 'degrees';

  it('removes functions cached by transforms.add()', function() {
    var foo = new Projection({
      code: 'foo',
      units: units,
      extent: extent
    });
    var bar = new Projection({
      code: 'bar',
      units: units,
      extent: extent
    });
    var transform = function(input, output, dimension) {
      return input;
    };
    transforms.add(foo, bar, transform);
    expect(transforms.get('foo', 'bar')).to.be(transform);

    var removed = transforms.remove(foo, bar);
    expect(removed).to.be(transform);
    expect(transforms.get('foo', 'bar')).to.be(undefined);
  });

});
