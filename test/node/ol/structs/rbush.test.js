import {assert} from 'chai';
import RBush from '../../../../src/ol/structs/RBush.js';

describe('ol/structs/RBush.js', function () {
  let rBush;
  beforeEach(function () {
    rBush = new RBush();
  });

  describe('when empty', function () {
    describe('#getAll', function () {
      it('returns the expected number of objects', function () {
        assert.isEmpty(rBush.getAll());
      });
    });

    describe('#isEmpty', function () {
      it('returns true', function () {
        assert.strictEqual(rBush.isEmpty(), true);
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
      assert.deepEqual(rBush.getInExtent([0, 0, 1, 1]), [obj]);
      rBush.update([2, 2, 3, 3], obj);
      assert.isEmpty(rBush.getInExtent([0, 0, 1, 1]));
      assert.deepEqual(rBush.getAll(), [obj]);
      assert.deepEqual(rBush.getInExtent([2, 2, 3, 3]), [obj]);
    });

    it("don't throws an exception if the extent is not modified", function () {
      assert.doesNotThrow(function () {
        rBush.forEach(function (value) {
          rBush.update([0, 0, 1, 1], obj);
        });
      });
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
        assert.strictEqual(i, objs.length);
      });

      it('stops when the function returns true', function () {
        let i = 0;
        const result = rBush.forEach(function () {
          return ++i >= 4;
        });
        assert.strictEqual(i, 4);
        assert.strictEqual(result, true);
      });
    });

    describe('#getInExtent', function () {
      it('returns the expected objects', function () {
        let result;
        result = rBush.getInExtent([2, 2, 3, 3]);
        assert.include(result, objs[1]);
        assert.include(result, objs[2]);
        assert.strictEqual(result.length, 2);
        result = rBush.getInExtent([-1, -1, 2, 2]);
        assert.include(result, objs[0]);
        assert.include(result, objs[1]);
        assert.include(result, objs[2]);
        assert.include(result, objs[4]);
        assert.strictEqual(result.length, 4);
      });

      it('returns an empty array when given a disjoint extent', function () {
        assert.strictEqual(rBush.getInExtent([5, 5, 6, 6]).length, 0);
      });
    });

    describe('#isEmpty', function () {
      it('returns false', function () {
        assert.strictEqual(rBush.isEmpty(), false);
      });
    });

    describe('#remove', function () {
      it('can remove each object', function () {
        let i, ii;
        for (i = 0, ii = objs.length; i < ii; ++i) {
          assert.include(rBush.getAll(), objs[i]);
          rBush.remove(objs[i]);
          assert.notInclude(rBush.getAll(), objs[i]);
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
          assert.deepEqual(rBush.getInExtent(extents[i]), [objs[i]]);
        }
      });
    });

    describe('#isEmpty', function () {
      it('returns false', function () {
        assert.strictEqual(rBush.isEmpty(), false);
      });
    });

    describe('#remove', function () {
      it('can remove each object in turn', function () {
        let i, ii;
        for (i = 0, ii = objs.length; i < ii; ++i) {
          assert.deepEqual(rBush.getInExtent(extents[i]), [objs[i]]);
          rBush.remove(objs[i]);
          assert.isEmpty(rBush.getInExtent(extents[i]));
        }
        assert.isEmpty(rBush.getAll());
        assert.strictEqual(rBush.isEmpty(), true);
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
          assert.deepEqual(rBush.getInExtent(extents[index]), [objs[index]]);
          rBush.remove(objs[index]);
          assert.isEmpty(rBush.getInExtent(extents[index]));
        }
        assert.isEmpty(rBush.getAll());
        assert.strictEqual(rBush.isEmpty(), true);
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
        assert.strictEqual(rBush.getAll().length, 1000);
      });
    });

    describe('#getInExtent', function () {
      it('returns the expected number of objects', function () {
        assert.strictEqual(
          rBush.getInExtent([0, 0, 10600, 10600]).length,
          1000,
        );
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
        assert.notEqual(n, 0);
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
        assert.strictEqual(n, 0);
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
        assert.strictEqual(
          rBush.getInExtent([0, 0, 10600, 10600]).length,
          2000,
        );
      });
    });

    describe('#isEmpty', function () {
      it('returns false', function () {
        assert.strictEqual(rBush.isEmpty(), false);
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
        assert.strictEqual(rBush.isEmpty(), true);
      });
    });
  });

  describe('#getExtent', function () {
    it('gets the extent', function () {
      const obj = {};
      rBush.insert([0, 0, 1, 1], obj);
      assert.deepEqual(rBush.getExtent(), [0, 0, 1, 1]);
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
      assert.deepEqual(rBush.getExtent(), [0, 0, 2, 2]);
      assert.strictEqual(rBush.getAll().length, 2);
    });

    it("preserves the concatenated object's references", function () {
      const obj1 = {};
      const obj2 = {};
      const rBush2 = new RBush();
      rBush.insert([0, 0, 1, 1], obj1);
      rBush2.insert([0, 0, 2, 2], obj2);
      rBush.concat(rBush2);
      rBush.update([0, 0, 3, 3], obj2);
      assert.deepEqual(rBush.getExtent(), [0, 0, 3, 3]);
    });
  });
});
