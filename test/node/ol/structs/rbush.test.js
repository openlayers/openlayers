import RBush from '../../../../src/ol/structs/RBush.js';
import expect from '../../expect.js';

describe('ol/structs/RBush.js', function () {
  let rBush;
  beforeEach(function () {
    rBush = new RBush();
  });

  describe('when empty', function () {
    describe('#getAll', function () {
      it('returns the expected number of objects', function () {
        expect(rBush.getAll()).to.be.empty();
      });
    });

    describe('#isEmpty', function () {
      it('returns true', function () {
        expect(rBush.isEmpty()).to.be(true);
      });
    });
  });

  describe('with a single object', function () {
    let obj;
    beforeEach(function () {
      obj = {};
      rBush.insert([0, 0, 1, 1], obj);
    });

    it('can update the object', function () {
      expect(rBush.getInExtent([0, 0, 1, 1])).to.eql([obj]);
      rBush.update([2, 2, 3, 3], obj);
      expect(rBush.getInExtent([0, 0, 1, 1])).to.be.empty();
      expect(rBush.getAll()).to.eql([obj]);
      expect(rBush.getInExtent([2, 2, 3, 3])).to.eql([obj]);
    });

    it("don't throws an exception if the extent is not modified", function () {
      expect(function () {
        rBush.forEach(function (value) {
          rBush.update([0, 0, 1, 1], obj);
        });
      }).not.to.throwException();
    });
  });

  describe('with a few objects', function () {
    let objs;
    beforeEach(function () {
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

    describe('#forEach', function () {
      it('called for all the objects', function () {
        let i = 0;
        rBush.forEach(function () {
          ++i;
        });
        expect(i).to.be(objs.length);
      });

      it('stops when the function returns true', function () {
        let i = 0;
        const result = rBush.forEach(function () {
          return ++i >= 4;
        });
        expect(i).to.be(4);
        expect(result).to.be(true);
      });
    });

    describe('#getInExtent', function () {
      it('returns the expected objects', function () {
        let result;
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

      it('returns an empty array when given a disjoint extent', function () {
        expect(rBush.getInExtent([5, 5, 6, 6]).length).to.be(0);
      });
    });

    describe('#isEmpty', function () {
      it('returns false', function () {
        expect(rBush.isEmpty()).to.be(false);
      });
    });

    describe('#remove', function () {
      it('can remove each object', function () {
        let i, ii;
        for (i = 0, ii = objs.length; i < ii; ++i) {
          expect(rBush.getAll()).to.contain(objs[i]);
          rBush.remove(objs[i]);
          expect(rBush.getAll()).not.to.contain(objs[i]);
        }
      });
    });
  });

  describe('with 100 objects', function () {
    let extents, objs;
    beforeEach(function () {
      extents = [];
      objs = [];
      let i;
      for (i = 0; i < 100; ++i) {
        extents[i] = [i - 0.1, i - 0.1, i + 0.1, i + 0.1];
        objs[i] = {id: i};
        rBush.insert(extents[i], objs[i]);
      }
    });

    describe('#getInExtent', function () {
      it('returns the expected objects', function () {
        let i, ii;
        for (i = 0, ii = objs.length; i < ii; ++i) {
          expect(rBush.getInExtent(extents[i])).to.eql([objs[i]]);
        }
      });
    });

    describe('#isEmpty', function () {
      it('returns false', function () {
        expect(rBush.isEmpty()).to.be(false);
      });
    });

    describe('#remove', function () {
      it('can remove each object in turn', function () {
        let i, ii;
        for (i = 0, ii = objs.length; i < ii; ++i) {
          expect(rBush.getInExtent(extents[i])).to.eql([objs[i]]);
          rBush.remove(objs[i]);
          expect(rBush.getInExtent(extents[i])).to.be.empty();
        }
        expect(rBush.getAll()).to.be.empty();
        expect(rBush.isEmpty()).to.be(true);
      });

      it('can remove objects in random order', function () {
        let i, ii, j;
        // https://en.wikipedia.org/wiki/Random_permutation
        const indexes = [];
        for (i = 0, ii = objs.length; i < ii; ++i) {
          j = Math.floor(Math.random() * (i + 1));
          indexes[i] = indexes[j];
          indexes[j] = i;
        }
        for (i = 0, ii = objs.length; i < ii; ++i) {
          const index = indexes[i];
          expect(rBush.getInExtent(extents[index])).to.eql([objs[index]]);
          rBush.remove(objs[index]);
          expect(rBush.getInExtent(extents[index])).to.be.empty();
        }
        expect(rBush.getAll()).to.be.empty();
        expect(rBush.isEmpty()).to.be(true);
      });
    });
  });

  describe('with 1000 objects', function () {
    beforeEach(function () {
      let i;
      for (i = 0; i < 1000; ++i) {
        const min = [Math.random() * 10000, Math.random() * 10000];
        const max = [
          min[0] + Math.random() * 500,
          min[1] + Math.random() * 500,
        ];
        const extent = [min[0], min[1], max[0], max[1]];
        rBush.insert(extent, {id: i});
      }
    });

    describe('#getAll', function () {
      it('returns the expected number of objects', function () {
        expect(rBush.getAll().length).to.be(1000);
      });
    });

    describe('#getInExtent', function () {
      it('returns the expected number of objects', function () {
        expect(rBush.getInExtent([0, 0, 10600, 10600]).length).to.be(1000);
      });

      it('can perform 1000 in-extent searches', function () {
        let n = 0;
        let i;
        for (i = 0; i < 1000; ++i) {
          const min = [Math.random() * 10000, Math.random() * 10000];
          const max = [
            min[0] + Math.random() * 500,
            min[1] + Math.random() * 500,
          ];
          const extent = [min[0], min[1], max[0], max[1]];
          n += rBush.getInExtent(extent).length;
        }
        expect(n).not.to.be(0);
      });

      it('can perform 1000 out-of-extent searches', function () {
        let n = 0;
        let i;
        for (i = 0; i < 1000; ++i) {
          const min = [
            -(Math.random() * 10000 + 501),
            -(Math.random() * 10000 + 501),
          ];
          const max = [
            min[0] + Math.random() * 500,
            min[1] + Math.random() * 500,
          ];
          const extent = [min[0], min[1], max[0], max[1]];
          n += rBush.getInExtent(extent).length;
        }
        expect(n).to.be(0);
      });
    });

    describe('#insert', function () {
      it('can insert another 1000 objects', function () {
        let i;
        for (i = 1000; i < 2000; ++i) {
          const min = [Math.random() * 10000, Math.random() * 10000];
          const max = [
            min[0] + Math.random() * 500,
            min[1] + Math.random() * 500,
          ];
          const extent = [min[0], min[1], max[0], max[1]];
          rBush.insert(extent, {id: i});
        }
        expect(rBush.getInExtent([0, 0, 10600, 10600]).length).to.be(2000);
      });
    });

    describe('#isEmpty', function () {
      it('returns false', function () {
        expect(rBush.isEmpty()).to.be(false);
      });
    });

    describe('#remove', function () {
      it('can remove all 1000 objects', function () {
        const objs = rBush.getAll();
        let i, value;
        for (i = objs.length - 1; i >= 0; --i) {
          value = objs[i];
          rBush.remove(value);
        }
        expect(rBush.isEmpty()).to.be(true);
      });
    });
  });

  describe('#getExtent', function () {
    it('gets the extent', function () {
      const obj = {};
      rBush.insert([0, 0, 1, 1], obj);
      expect(rBush.getExtent()).to.eql([0, 0, 1, 1]);
    });
  });

  describe('#concat', function () {
    it('concatenates two RBush objects', function () {
      const obj1 = {};
      const obj2 = {};
      const rBush2 = new RBush();
      rBush.insert([0, 0, 1, 1], obj1);
      rBush2.insert([0, 0, 2, 2], obj2);
      rBush.concat(rBush2);
      expect(rBush.getExtent()).to.eql([0, 0, 2, 2]);
      expect(rBush.getAll().length).to.be(2);
    });

    it("preserves the concatenated object's references", function () {
      const obj1 = {};
      const obj2 = {};
      const rBush2 = new RBush();
      rBush.insert([0, 0, 1, 1], obj1);
      rBush2.insert([0, 0, 2, 2], obj2);
      rBush.concat(rBush2);
      rBush.update([0, 0, 3, 3], obj2);
      expect(rBush.getExtent()).to.eql([0, 0, 3, 3]);
    });
  });
});
