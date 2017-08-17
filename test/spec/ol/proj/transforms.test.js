

goog.require('ol.proj.Projection');
goog.require('ol.proj.transforms');


describe('ol.proj.transforms.remove()', function() {

  var extent = [180, -90, 180, 90];
  var units = 'degrees';

  it('removes functions cached by ol.proj.transforms.add()', function() {
    var foo = new ol.proj.Projection({
      code: 'foo',
      units: units,
      extent: extent
    });
    var bar = new ol.proj.Projection({
      code: 'bar',
      units: units,
      extent: extent
    });
    var transform = function(input, output, dimension) {
      return input;
    };
    ol.proj.transforms.add(foo, bar, transform);
    var cache = ol.proj.transforms.cache_;
    expect(cache).not.to.be(undefined);
    expect(cache.foo).not.to.be(undefined);
    expect(cache.foo.bar).to.be(transform);

    var removed = ol.proj.transforms.remove(foo, bar);
    expect(removed).to.be(transform);
    expect(cache.foo).to.be(undefined);
  });

});
