goog.provide('ol.test.structs.RTree');


describe('ol.structs.RTree', function() {

  describe('put and find', function() {
    var rTree = new ol.structs.RTree();
    rTree.put(new ol.Rectangle(0, 0, 1, 1), 1);
    rTree.put(new ol.Rectangle(1, 1, 4, 4), 2);
    rTree.put(new ol.Rectangle(2, 2, 3, 3), 3);
    rTree.put(new ol.Rectangle(-5, -5, -4, -4), 4);
    rTree.put(new ol.Rectangle(-4, -4, -1, -1), 5);
    rTree.put(new ol.Rectangle(-3, -3, -2, -2), 6);

    it('stores items', function() {
      expect(goog.object.getCount(rTree.find(new ol.Rectangle(
          Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY,
          Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY)))).to.be(6);
    });

    it('filters by rectangle', function() {
      var result;
      result = goog.object.getValues(rTree.find(new ol.Rectangle(2, 2, 3, 3)));
      expect(result).to.contain(2);
      expect(result).to.contain(3);
      expect(result.length).to.be(2);
      result = goog.object.getValues(
          rTree.find(new ol.Rectangle(-1, -1, 2, 2)));
      expect(result).to.contain(1);
      expect(result).to.contain(2);
      expect(result).to.contain(3);
      expect(result).to.contain(5);
      expect(result.length).to.be(4);
      expect(goog.object.getCount(rTree.find(new ol.Rectangle(5, 5, 6, 6))))
          .to.be(0);
    });

    it('can store thousands of items and find fast', function() {
      for (var i = 7; i <= 10000; ++i) {
        rTree.put(new ol.Rectangle(Math.random() * -10, Math.random() * -10,
            Math.random() * 10, Math.random() * 10), i);
      }
      expect(goog.object.getCount(
          rTree.find(new ol.Rectangle(-10, -10, 10, 10)))).to.be(10000);
      var result = rTree.find(new ol.Rectangle(0, 0, 0, 0));
      expect(goog.object.getCount(result)).to.be(9995);
      var values = goog.object.getValues(result);
      expect(values).to.contain(1);
      expect(values).not.to.contain(2);
      expect(values).not.to.contain(3);
      expect(values).not.to.contain(4);
      expect(values).not.to.contain(5);
      expect(values).not.to.contain(6);
      expect(values).to.contain(7);
    });

  });

});

goog.require('ol.Rectangle');
goog.require('ol.structs.RTree');
