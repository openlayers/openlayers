goog.provide('ol.test.structs.RTree');


describe('ol.structs.RTree', function() {

  describe('put and find', function() {
    var rTree = new ol.structs.RTree();
    rTree.put([0, 1, 0, 1], 1);
    rTree.put([1, 4, 1, 4], 2);
    rTree.put([2, 3, 2, 3], 3);
    rTree.put([-5, -4, -5, -4], 4);
    rTree.put([-4, -1, -4, -1], 5);
    rTree.put([-3, -2, -3, -2], 6);

    it('stores items', function() {
      expect(goog.object.getCount(rTree.find([
        Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY,
        Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY
      ]))).to.be(6);
    });

    it('filters by rectangle', function() {
      var result;
      result = goog.object.getValues(rTree.find([2, 3, 2, 3]));
      expect(result).to.contain(2);
      expect(result).to.contain(3);
      expect(result.length).to.be(2);
      result = goog.object.getValues(rTree.find([-1, 2, -1, 2]));
      expect(result).to.contain(1);
      expect(result).to.contain(2);
      expect(result).to.contain(3);
      expect(result).to.contain(5);
      expect(result.length).to.be(4);
      expect(goog.object.getCount(rTree.find([5, 6, 5, 6]))).to.be(0);
    });

    it('can store thousands of items and find fast', function() {
      for (var i = 7; i <= 10000; ++i) {
        rTree.put([
          Math.random() * -10, Math.random() * 10,
          Math.random() * -10, Math.random() * 10
        ], i);
      }
      expect(goog.object.getCount(rTree.find([-10, 10, -10, 10]))).to.be(10000);
      var result = rTree.find([0, 0, 0, 0]);
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

goog.require('goog.object');
goog.require('ol.structs.RTree');
