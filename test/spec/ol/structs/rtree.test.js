goog.provide('ol.test.structs.RTree');


describe('ol.structs.RTree', function() {

  var rTree = new ol.structs.RTree();

  describe('creation', function() {
    it('can insert 1k objects', function() {
      var i = 1000;
      while (i > 0) {
        var bounds = new Array(4);
        bounds[0] = Math.random() * 10000;
        bounds[1] = bounds[0] + Math.random() * 500;
        bounds[2] = Math.random() * 10000;
        bounds[3] = bounds[2] + Math.random() * 500;
        rTree.put(bounds, 'JUST A TEST OBJECT!_' + i);
        i--;
      }
      expect(goog.object.getCount(rTree.find([0, 10600, 0, 10600])))
          .to.be(1000);
    });
    it('can insert 1k more objects', function() {
      var i = 1000;
      while (i > 0) {
        var bounds = new Array(4);
        bounds[0] = Math.random() * 10000;
        bounds[1] = bounds[0] + Math.random() * 500;
        bounds[2] = Math.random() * 10000;
        bounds[3] = bounds[2] + Math.random() * 500;
        rTree.put(bounds, 'JUST A TEST OBJECT!_' + i);
        i--;
      }
      expect(goog.object.getCount(rTree.find([0, 10600, 0, 10600])))
          .to.be(2000);
    });
  });

  describe('search', function() {
    it('can perform 1k out-of-bounds searches', function() {
      var i = 1000;
      var len = 0;
      while (i > 0) {
        var bounds = new Array(4);
        bounds[0] = -(Math.random() * 10000 + 501);
        bounds[1] = bounds[0] + Math.random() * 500;
        bounds[2] = -(Math.random() * 10000 + 501);
        bounds[3] = bounds[2] + Math.random() * 500;
        len += goog.object.getCount(rTree.find(bounds));
        i--;
      }
      expect(len).to.be(0);
    });
    it('can perform 1k in-bounds searches', function() {
      var i = 1000;
      var len = 0;
      while (i > 0) {
        var bounds = new Array(4);
        bounds[0] = Math.random() * 10000;
        bounds[1] = bounds[0] + Math.random() * 500;
        bounds[2] = Math.random() * 10000;
        bounds[3] = bounds[2] + Math.random() * 500;
        len += goog.object.getCount(rTree.find(bounds));
        i--;
      }
      expect(len).not.to.be(0);
    });
  });

  describe('deletion', function() {
    var len = 0;
    it('can delete half the RTree', function() {
      var bounds = [5000, 10500, 0, 10500];
      len += rTree.remove(bounds).length;
      expect(len).to.not.be(0);
    });
    it('can delete the other half of the RTree', function() {
      var bounds = [0, 5000, 0, 10500];
      len += rTree.remove(bounds).length;
      expect(len).to.be(2000);
    });
  });

  describe('result plausibility', function() {

    it('filters by rectangle', function() {
      rTree.put([0, 1, 0, 1], 1);
      rTree.put([1, 4, 1, 4], 2);
      rTree.put([2, 3, 2, 3], 3);
      rTree.put([-5, -4, -5, -4], 4);
      rTree.put([-4, -1, -4, -1], 5);
      rTree.put([-3, -2, -3, -2], 6);

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

  });

});

goog.require('goog.object');
goog.require('ol.structs.RTree');
