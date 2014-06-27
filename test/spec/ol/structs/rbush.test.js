goog.provide('ol.test.structs.RBush');


describe('ol.structs.RBush', function() {

  var rBush;
  beforeEach(function() {
    rBush = new ol.structs.RBush();
  });

  describe('when empty', function() {

    describe('#getAll', function() {

      it('returns the expected number of objects', function() {
        expect(rBush.getAll()).to.be.empty();
      });

    });

    describe('#isEmpty', function() {

      it('returns true', function() {
        expect(rBush.isEmpty()).to.be(true);
      });

    });

  });

  describe('with a single object', function() {

    var obj;
    beforeEach(function() {
      obj = {};
      rBush.insert([0, 0, 1, 1], obj);
    });

    it('can update the object', function() {
      expect(rBush.getInExtent([0, 0, 1, 1])).to.eql([obj]);
      rBush.update([2, 2, 3, 3], obj);
      expect(rBush.getInExtent([0, 0, 1, 1])).to.be.empty();
      expect(rBush.getAll()).to.eql([obj]);
      expect(rBush.getInExtent([2, 2, 3, 3])).to.eql([obj]);
    });

  });

  describe('with a few objects', function() {

    var objs;
    beforeEach(function() {
      objs = [{}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}];
      rBush.insert([0, 0, 1, 1], objs[0]);
      rBush.insert([1, 1, 4, 4], objs[1]);
      rBush.insert([2, 2, 3, 3], objs[2]);
      rBush.insert([-5, -5, -4, -4], objs[3]);
      rBush.insert([-4, -4, -1, -1], objs[4]);
      rBush.insert([-3, -3, -2, -2], objs[5]);
      rBush.insert([-3, -3, -2, -2], objs[6]);
      rBush.insert([-3, -3, -2, -2], objs[7]);
      rBush.insert([-3, -3, -2, -2], objs[8]);
      rBush.insert([-3, -3, -2, -2], objs[9]);
      rBush.insert([-3, -3, -2, -2], objs[10]);
    });

    describe('#forEach', function() {

      it('called for all the objects', function() {
        var i = 0;
        rBush.forEach(function() {
          ++i;
        });
        expect(i).to.be(objs.length);
      });

      it('stops when the function returns true', function() {
        var i = 0;
        var result = rBush.forEach(function() {
          return ++i >= 4;
        });
        expect(i).to.be(4);
        expect(result).to.be(true);
      });

    });

    describe('#getInExtent', function() {

      it('returns the expected objects', function() {
        var result;
        result = rBush.getInExtent([2, 2, 3, 3]);
        expect(result).to.contain(objs[1]);
        expect(result).to.contain(objs[2]);
        expect(result.length).to.be(2);
        result = rBush.getInExtent([-1, -1, 2, 2]);
        expect(result).to.contain(objs[0]);
        expect(result).to.contain(objs[1]);
        expect(result).to.contain(objs[2]);
        expect(result).to.contain(objs[4]);
        expect(result.length).to.be(4);
      });

      it('returns an empty array when given a disjoint extent', function() {
        expect(rBush.getInExtent([5, 5, 6, 6]).length).to.be(0);
      });

    });

    describe('#insert', function() {

      it('throws an exception if called while iterating over all values',
          function() {
            expect(function() {
              rBush.forEach(function(value) {
                rBush.insert([0, 0, 1, 1], {});
              });
            }).to.throwException();
          });

      it('throws an exception if called while iterating over an extent',
          function() {
            expect(function() {
              rBush.forEachInExtent([-10, -10, 10, 10], function(value) {
                rBush.insert([0, 0, 1, 1], {});
              });
            }).to.throwException();
          });
    });

    describe('#isEmpty', function() {

      it('returns false', function() {
        expect(rBush.isEmpty()).to.be(false);
      });

    });

    describe('#remove', function() {

      it('can remove each object', function() {
        var i, ii;
        for (i = 0, ii = objs.length; i < ii; ++i) {
          expect(rBush.getAll()).to.contain(objs[i]);
          rBush.remove(objs[i]);
          expect(rBush.getAll()).not.to.contain(objs[i]);
        }
      });

      it('throws an exception if called while iterating over all values',
          function() {
            expect(function() {
              rBush.forEach(function(value) {
                rBush.remove(value);
              });
            }).to.throwException();
          });

      it('throws an exception if called while iterating over an extent',
          function() {
            expect(function() {
              rBush.forEachInExtent([-10, -10, 10, 10], function(value) {
                rBush.remove(value);
              });
            }).to.throwException();
          });

    });

    describe('#update', function() {

      it('throws an exception if called while iterating over all values',
          function() {
            expect(function() {
              rBush.forEach(function(value) {
                rBush.update([0, 0, 1, 1], objs[1]);
              });
            }).to.throwException();
          });

      it('throws an exception if called while iterating over an extent',
          function() {
            expect(function() {
              rBush.forEachInExtent([-10, -10, 10, 10], function(value) {
                rBush.update([0, 0, 1, 1], objs[1]);
              });
            }).to.throwException();
          });
    });

  });

  describe('with 100 objects', function() {

    var extents, objs;
    beforeEach(function() {
      extents = [];
      objs = [];
      var i;
      for (i = 0; i < 100; ++i) {
        extents[i] = [i - 0.1, i - 0.1, i + 0.1, i + 0.1];
        objs[i] = {id: i};
        rBush.insert(extents[i], objs[i]);
      }
    });

    describe('#getInExtent', function() {

      it('returns the expected objects', function() {
        var i, ii;
        for (i = 0, ii = objs.length; i < ii; ++i) {
          expect(rBush.getInExtent(extents[i])).to.eql([objs[i]]);
        }
      });

    });

    describe('#isEmpty', function() {

      it('returns false', function() {
        expect(rBush.isEmpty()).to.be(false);
      });

    });

    describe('#remove', function() {

      it('can remove each object in turn', function() {
        var i, ii;
        for (i = 0, ii = objs.length; i < ii; ++i) {
          expect(rBush.getInExtent(extents[i])).to.eql([objs[i]]);
          rBush.remove(objs[i]);
          expect(rBush.getInExtent(extents[i])).to.be.empty();
        }
        expect(rBush.getAll()).to.be.empty();
        expect(rBush.isEmpty()).to.be(true);
      });

      it('can remove objects in random order', function() {
        var i, ii, j;
        // http://en.wikipedia.org/wiki/Random_permutation
        var indexes = [];
        for (i = 0, ii = objs.length; i < ii; ++i) {
          j = Math.floor(Math.random() * (i + 1));
          indexes[i] = indexes[j];
          indexes[j] = i;
        }
        for (i = 0, ii = objs.length; i < ii; ++i) {
          var index = indexes[i];
          expect(rBush.getInExtent(extents[index])).to.eql([objs[index]]);
          rBush.remove(objs[index]);
          expect(rBush.getInExtent(extents[index])).to.be.empty();
        }
        expect(rBush.getAll()).to.be.empty();
        expect(rBush.isEmpty()).to.be(true);
      });

    });

  });

  describe('with 1000 objects', function() {

    beforeEach(function() {
      var i;
      for (i = 0; i < 1000; ++i) {
        var min = [Math.random() * 10000, Math.random() * 10000];
        var max = [min[0] + Math.random() * 500, min[1] + Math.random() * 500];
        var extent = [min[0], min[1], max[0], max[1]];
        rBush.insert(extent, {id: i});
      }
    });

    describe('#getAll', function() {

      it('returns the expected number of objects', function() {
        expect(rBush.getAll().length).to.be(1000);
      });

    });

    describe('#getInExtent', function() {

      it('returns the expected number of objects', function() {
        expect(rBush.getInExtent([0, 0, 10600, 10600]).length).to.be(1000);
      });

      it('can perform 1000 in-extent searches', function() {
        var n = 0;
        var i;
        for (i = 0; i < 1000; ++i) {
          var min = [Math.random() * 10000, Math.random() * 10000];
          var max = [min[0] + Math.random() * 500,
                     min[1] + Math.random() * 500];
          var extent = [min[0], min[1], max[0], max[1]];
          n += rBush.getInExtent(extent).length;
        }
        expect(n).not.to.be(0);
      });

      it('can perform 1000 out-of-extent searches', function() {
        var n = 0;
        var i;
        for (i = 0; i < 1000; ++i) {
          var min = [-(Math.random() * 10000 + 501),
                -(Math.random() * 10000 + 501)];
          var max = [min[0] + Math.random() * 500,
                     min[1] + Math.random() * 500];
          var extent = [min[0], min[1], max[0], max[1]];
          n += rBush.getInExtent(extent).length;
        }
        expect(n).to.be(0);
      });

    });

    describe('#insert', function() {

      it('can insert another 1000 objects', function() {
        var i;
        for (i = 1000; i < 2000; ++i) {
          var min = [Math.random() * 10000, Math.random() * 10000];
          var max = [min[0] + Math.random() * 500,
                     min[1] + Math.random() * 500];
          var extent = [min[0], min[1], max[0], max[1]];
          rBush.insert(extent, {id: i});
        }
        expect(rBush.getInExtent([0, 0, 10600, 10600]).length).to.be(2000);
      });

    });

    describe('#isEmpty', function() {

      it('returns false', function() {
        expect(rBush.isEmpty()).to.be(false);
      });

    });

    describe('#remove', function() {

      it('can remove all 1000 objects', function() {
        var objs = rBush.getAll();
        var i, value;
        for (i = objs.length - 1; i >= 0; --i) {
          value = objs[i];
          rBush.remove(value);
        }
        expect(rBush.isEmpty()).to.be(true);
      });

    });

  });

});

goog.require('ol.structs.RBush');
