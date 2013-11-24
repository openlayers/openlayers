goog.provide('ol.test.structs.RBush');


describe('ol.structs.RBush', function() {

  var rBush = new ol.structs.RBush();

  describe('creation', function() {
    it('can insert 1k objects', function() {
      var i = 1000;
      while (i > 0) {
        var min = [Math.random() * 10000, Math.random() * 10000];
        var max = [min[0] + Math.random() * 500, min[1] + Math.random() * 500];
        var bounds = [min[0], min[1], max[0], max[1]];
        rBush.insert(bounds, {id: i});
        i--;
      }
      expect(rBush.allInExtent([0, 0, 10600, 10600]).length).to.be(1000);
    });
    it('can insert 1k more objects', function() {
      var i = 1000;
      while (i > 0) {
        var min = [Math.random() * 10000, Math.random() * 10000];
        var max = [min[0] + Math.random() * 500, min[1] + Math.random() * 500];
        var bounds = [min[0], min[1], max[0], max[1]];
        rBush.insert(bounds, {id: i});
        i--;
      }
      expect(rBush.allInExtent([0, 0, 10600, 10600]).length).to.be(2000);
    });
  });

  describe('search', function() {
    it('can perform 1k out-of-bounds searches', function() {
      var i = 1000;
      var len = 0;
      while (i > 0) {
        var min = [-(Math.random() * 10000 + 501),
              -(Math.random() * 10000 + 501)];
        var max = [min[0] + Math.random() * 500, min[1] + Math.random() * 500];
        var bounds = [min[0], min[1], max[0], max[1]];
        len += rBush.allInExtent(bounds).length;
        i--;
      }
      expect(len).to.be(0);
    });
    it('can perform 1k in-bounds searches', function() {
      var i = 1000;
      var len = 0;
      while (i > 0) {
        var min = [Math.random() * 10000, Math.random() * 10000];
        var max = [min[0] + Math.random() * 500, min[1] + Math.random() * 500];
        var bounds = [min[0], min[1], max[0], max[1]];
        len += rBush.allInExtent(bounds).length;
        i--;
      }
      expect(len).not.to.be(0);
    });
  });

  describe.skip('deletion', function() {
    var len = 0;
    it('can delete half the RBush', function() {
      var bounds = [5000, 0, 10500, 10500];
      len += rBush.remove(bounds).length;
      expect(len).to.not.be(0);
    });
    it('can delete the other half of the RBush', function() {
      var bounds = [0, 0, 5000, 10500];
      len += rBush.remove(bounds).length;
      expect(len).to.be(2000);
    });
  });

  describe('result plausibility and structure', function() {

    it('filters by rectangle', function() {
      var objs = [{}, {}, {}, {}, {}, {}];
      rBush.insert([0, 0, 1, 1], objs[0]);
      rBush.insert([1, 1, 4, 4], objs[1]);
      rBush.insert([2, 2, 3, 3], objs[2]);
      rBush.insert([-5, -5, -4, -4], objs[3]);
      rBush.insert([-4, -4, -1, -1], objs[4]);
      rBush.insert([-3, -3, -2, -2], objs[5]);

      var result;
      result = rBush.allInExtent([2, 2, 3, 3]);
      expect(result).to.contain(objs[1]);
      expect(result).to.contain(objs[2]);
      expect(result.length).to.be(2);
      result = rBush.allInExtent([-1, -1, 2, 2]);
      expect(result).to.contain(objs[0]);
      expect(result).to.contain(objs[1]);
      expect(result).to.contain(objs[2]);
      expect(result).to.contain(objs[4]);
      expect(result.length).to.be(4);
      expect(rBush.allInExtent([5, 5, 6, 6]).length).to.be(0);
    });

  });

});

goog.require('goog.object');
goog.require('ol.structs.RBush');
