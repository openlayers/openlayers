

import _ol_proj_Projection_ from '../../../../src/ol/proj/projection';
import _ol_proj_transforms_ from '../../../../src/ol/proj/transforms';


describe('ol.proj.transforms.remove()', function() {

  var extent = [180, -90, 180, 90];
  var units = 'degrees';

  it('removes functions cached by ol.proj.transforms.add()', function() {
    var foo = new _ol_proj_Projection_({
      code: 'foo',
      units: units,
      extent: extent
    });
    var bar = new _ol_proj_Projection_({
      code: 'bar',
      units: units,
      extent: extent
    });
    var transform = function(input, output, dimension) {
      return input;
    };
    _ol_proj_transforms_.add(foo, bar, transform);
    var cache = _ol_proj_transforms_.cache_;
    expect(cache).not.to.be(undefined);
    expect(cache.foo).not.to.be(undefined);
    expect(cache.foo.bar).to.be(transform);

    var removed = _ol_proj_transforms_.remove(foo, bar);
    expect(removed).to.be(transform);
    expect(cache.foo).to.be(undefined);
  });

});
