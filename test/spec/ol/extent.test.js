goog.require('ol.Extent');
goog.require('ol.Projection');

describe('ol.Extent', function() {

  describe('clone', function() {

    it('does clone', function() {
      var extent = new ol.Extent(1, 2, 3, 4);
      var clonedExtent = extent.clone();
      expect(clonedExtent).toBeA(ol.Extent);
      expect(clonedExtent).not.toBe(extent);
      expect(clonedExtent.minX).toEqual(extent.minX);
      expect(clonedExtent.minY).toEqual(extent.minY);
      expect(clonedExtent.maxX).toEqual(extent.maxX);
      expect(clonedExtent.maxY).toEqual(extent.maxY);
    });
  });

  describe('transform', function() {

    it('does transform', function() {
      var transformFn =
          ol.Projection.getTransformFromCodes('EPSG:4326', 'EPSG:3857');
      var sourceExtent = new ol.Extent(-15, -30, 45, 60);
      var destinationExtent = sourceExtent.transform(transformFn);
      expect(destinationExtent).not.toBeUndefined();
      expect(destinationExtent).not.toBeNull();
      // FIXME check values with third-party tool
      expect(destinationExtent.minX).toRoughlyEqual(-1669792.3618991037, 1e-9);
      expect(destinationExtent.minY).toRoughlyEqual(-3503549.843504376, 1e-9);
      expect(destinationExtent.maxX).toRoughlyEqual(5009377.085697311, 1e-9);
      expect(destinationExtent.maxY).toRoughlyEqual(8399737.889818361, 1e-9);
    });
  });
});
