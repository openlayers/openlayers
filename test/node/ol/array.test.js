import expect from '../expect.js';
import {
  binarySearch,
  equals,
  extend,
  isSorted,
  linearFindNearest,
  numberSafeCompareFunction,
  remove,
  reverseSubArray,
  stableSort,
} from '../../../src/ol/array.js';

describe('ol/array.js', function () {
  describe('binarySearch', function () {
    const insertionPoint = function (position) {
      return -(position + 1);
    };
    const revNumCompare = function (a, b) {
      return b - a;
    };

    describe('default comparison on array of String(s)', function () {
      const a = [
        '1000',
        '9',
        'AB',
        'ABC',
        'ABCABC',
        'ABD',
        'ABDA',
        'B',
        'B',
        'B',
        'C',
        'CA',
        'CC',
        'ZZZ',
        'ab',
        'abc',
        'abcabc',
        'abd',
        'abda',
        'b',
        'c',
        'ca',
        'cc',
        'zzz',
      ];

      it("should find '1000' at index 0", function () {
        expect(binarySearch(a, '1000')).to.be(0);
      });
      it("should find 'zzz' at index " + (a.length - 1), function () {
        expect(binarySearch(a, 'zzz')).to.be(a.length - 1);
      });
      it("should find 'C' at index 10", function () {
        expect(binarySearch(a, 'C')).to.be(10);
      });
      it("should find 'B' at index 7 || 8 || 9", function () {
        const pos = binarySearch(a, 'B');
        expect(pos == 7 || pos == 8 || pos == 9).to.be.ok();
      });
      it("should not find '100'", function () {
        const pos = binarySearch(a, '100');
        expect(pos < 0).to.be.ok();
      });
      it("should have an insertion point of 0 for '100'", function () {
        const pos = binarySearch(a, '100');
        expect(insertionPoint(pos)).to.be(0);
      });
      it("should not find 'zzz0'", function () {
        const pos = binarySearch(a, 'zzz0');
        expect(pos < 0).to.be.ok();
      });
      it(
        'should have an insertion point of ' + a.length + " for 'zzz0'",
        function () {
          const pos = binarySearch(a, 'zzz0');
          expect(insertionPoint(pos)).to.be(a.length);
        }
      );
      it("should not find 'BA'", function () {
        const pos = binarySearch(a, 'zzz0');
        expect(pos < 0).to.be.ok();
      });
      it("should have an insertion point of 10 for 'BA'", function () {
        const pos = binarySearch(a, 'BA');
        expect(insertionPoint(pos)).to.be(10);
      });
    });

    describe('0 length array with default comparison', function () {
      const b = [];
      it("should not find 'a'", function () {
        expect(binarySearch(b, 'a') < 0).to.be.ok();
      });
      it("should have an insertion point of 0 for 'a'", function () {
        const pos = binarySearch(b, 'a');
        expect(insertionPoint(pos)).to.be(0);
      });
    });

    describe('single element array with default lexiographical comparison', function () {
      const c = ['only item'];
      it("should find 'only item' at index 0", function () {
        expect(binarySearch(c, 'only item')).to.be(0);
      });
      it("should not find 'a'", function () {
        expect(binarySearch(c, 'a') < 0).to.be.ok();
      });
      it("should have an insertion point of 0 for 'a'", function () {
        const pos = binarySearch(c, 'a');
        expect(insertionPoint(pos)).to.be(0);
      });
      it("should not find 'z'", function () {
        expect(binarySearch(c, 'z') < 0).to.be.ok();
      });
      it("should have an insertion point of 1 for 'z'", function () {
        const pos = binarySearch(c, 'z');
        expect(insertionPoint(pos)).to.be(1);
      });
    });

    describe('default comparison on array of Number(s)', function () {
      const d = [
        -897123.9, -321434.58758, -1321.3124, -324, -9, -3, 0, 0, 0, 0.31255, 5,
        142.88888708, 334, 342, 453, 54254,
      ];
      it('should find -897123.9 at index 0', function () {
        expect(binarySearch(d, -897123.9)).to.be(0);
      });
      it('should find 54254 at index ' + (d.length - 1), function () {
        expect(binarySearch(d, 54254)).to.be(d.length - 1);
      });
      it('should find -3 at index 5', function () {
        expect(binarySearch(d, -3)).to.be(5);
      });
      it('should find 0 at index 6 || 7 || 8', function () {
        const pos = binarySearch(d, 0);
        expect(pos == 6 || pos == 7 || pos == 8).to.be(true);
      });
      it('should not find -900000', function () {
        const pos = binarySearch(d, -900000);
        expect(pos < 0).to.be(true);
      });
      it('should have an insertion point of 0 for -900000', function () {
        const pos = binarySearch(d, -900000);
        expect(insertionPoint(pos)).to.be(0);
      });
      it('should not find 54255', function () {
        const pos = binarySearch(d, 54255);
        expect(pos < 0).to.be(true);
      });
      it(
        'should have an insertion point of ' + d.length + ' for 54255',
        function () {
          const pos = binarySearch(d, 54255);
          expect(insertionPoint(pos)).to.be(d.length);
        }
      );
      it('should not find 1.1', function () {
        const pos = binarySearch(d, 1.1);
        expect(pos < 0).to.be(true);
      });
      it('should have an insertion point of 10 for 1.1', function () {
        const pos = binarySearch(d, 1.1);
        expect(insertionPoint(pos)).to.be(10);
      });
    });

    describe('custom comparison function, which reverse orders numbers', function () {
      const e = [
        54254, 453, 342, 334, 142.88888708, 5, 0.31255, 0, 0, 0, -3, -9, -324,
        -1321.3124, -321434.58758, -897123.9,
      ];
      it('should find 54254 at index 0', function () {
        const pos = binarySearch(e, 54254, revNumCompare);
        expect(pos).to.be(0);
      });
      it('should find -897123.9 at index ' + (e.length - 1), function () {
        const pos = binarySearch(e, -897123.9, revNumCompare);
        expect(pos).to.be(e.length - 1);
      });
      it('should find -3 at index 10', function () {
        const pos = binarySearch(e, -3, revNumCompare);
        expect(pos).to.be(10);
      });
      it('should find 0 at index 7 || 8 || 9', function () {
        const pos = binarySearch(e, 0, revNumCompare);
        expect(pos == 7 || pos == 8 || pos == 9).to.be(true);
      });
      it('should not find 54254.1', function () {
        const pos = binarySearch(e, 54254.1, revNumCompare);
        expect(pos < 0).to.be(true);
      });
      it('should have an insertion point of 0 for 54254.1', function () {
        const pos = binarySearch(e, 54254.1, revNumCompare);
        expect(insertionPoint(pos)).to.be(0);
      });
      it('should not find -897124', function () {
        const pos = binarySearch(e, -897124, revNumCompare);
        expect(pos < 0).to.be(true);
      });
      it(
        'should have an insertion point of ' + e.length + ' for -897124',
        function () {
          const pos = binarySearch(e, -897124, revNumCompare);
          expect(insertionPoint(pos)).to.be(e.length);
        }
      );
      it('should not find 1.1', function () {
        const pos = binarySearch(e, 1.1, revNumCompare);
        expect(pos < 0).to.be(true);
      });
      it('should have an insertion point of 0 for 1.1', function () {
        const pos = binarySearch(e, 1.1, revNumCompare);
        expect(insertionPoint(pos)).to.be(6);
      });
    });

    describe('0 length array with custom comparison function', function () {
      const f = [];
      it('should not find 0', function () {
        const pos = binarySearch(f, 0, revNumCompare);
        expect(pos < 0).to.be(true);
      });
      it('should have an insertion point of 0 for 0', function () {
        const pos = binarySearch(f, 0, revNumCompare);
        expect(insertionPoint(pos)).to.be(0);
      });
    });

    describe('single element array with custom comparison function', function () {
      const g = [1];
      it('should find 1 at index 0', function () {
        const pos = binarySearch(g, 1, revNumCompare);
        expect(pos).to.be(0);
      });
      it('should not find 2', function () {
        const pos = binarySearch(g, 2, revNumCompare);
        expect(pos < 0).to.be(true);
      });
      it('should have an insertion point of 0 for 2', function () {
        const pos = binarySearch(g, 2, revNumCompare);
        expect(insertionPoint(pos)).to.be(0);
      });
      it('should not find 0', function () {
        const pos = binarySearch(g, 0, revNumCompare);
        expect(pos < 0).to.be(true);
      });
      it('should have an insertion point of 1 for 0', function () {
        const pos = binarySearch(g, 0, revNumCompare);
        expect(insertionPoint(pos)).to.be(1);
      });
    });

    describe('finding first index when multiple candidates', function () {
      it('should find the index of the first 0', function () {
        expect(binarySearch([0, 0, 1], 0)).to.be(0);
      });
      it('should find the index of the first 1', function () {
        expect(binarySearch([0, 1, 1], 1)).to.be(1);
      });
    });

    describe("Don't use Array#slice, Function#apply and Function#call", function () {
      const a = [1, 5, 7, 11, 13, 16, 19, 24, 28, 31, 33, 36, 40, 50, 52, 55];
      const calls = {
        'Array#slice': false,
        'Function#apply': false,
        'Function#call': false,
      };
      let origArraySlice;
      let origFunctionApply;
      let origFunctionCall;

      it('does not use potentially slow methods (default & custom compare)', function () {
        // Mockup (I failed to use sinon.spy and beforeEach-hooks)
        origArraySlice = Array.prototype.slice;
        origFunctionApply = Function.prototype.apply;
        origFunctionCall = Function.prototype.call;
        Array.prototype.slice = function () {
          calls['Array#slice'] = true;
        };
        Function.prototype.apply = function () {
          calls['Function#apply'] = true;
        };
        Function.prototype.call = function () {
          calls['Function#call'] = true;
        };

        // Now actually call and test the method twice
        binarySearch(a, 48);
        binarySearch(a, 13, function (a, b) {
          return a > b ? 1 : a < b ? -1 : 0;
        });

        // Restore mocked up methods
        Array.prototype.slice = origArraySlice;
        Function.prototype.apply = origFunctionApply;
        Function.prototype.call = origFunctionCall;

        // Expectations
        expect(calls['Array#slice']).to.be(false);
        expect(calls['Function#apply']).to.be(false);
        expect(calls['Function#call']).to.be(false);
      });
    });

    describe('when items are not found', function () {
      const arr = [1, 2, 2, 2, 3, 5, 9];

      it('should return the index of where the item would go plus one, negated, if the item is not found', function () {
        expect(binarySearch(arr, 4)).to.equal(-6);
      });
      it('should work even on empty arrays', function () {
        expect(binarySearch([], 42)).to.equal(-1);
      });
      it('should work even on arrays of doubles', function () {
        expect(binarySearch([0.0, 0.1, 0.2, 0.3, 0.4], 0.25)).to.equal(-4);
      });
    });
  });

  describe('equals', function () {
    it('returns true for [] == []', function () {
      expect(equals([], [])).to.be(true);
    });
    it('returns true for [1] == [1]', function () {
      expect(equals([1], [1])).to.be(true);
    });
    it("returns true for ['1'] == ['1']", function () {
      expect(equals(['1'], ['1'])).to.be(true);
    });
    it("returns false for [1] == ['1']", function () {
      expect(equals([1], ['1'])).to.be(false);
    });
    it('returns true for [null] == [null]', function () {
      expect(equals([null], [null])).to.be(true);
    });
    it('returns false for [null] == [undefined]', function () {
      expect(equals([null], [undefined])).to.be(false);
    });
    it('returns true for [1, 2] == [1, 2]', function () {
      expect(equals([1, 2], [1, 2])).to.be(true);
    });
    it('returns false for [1, 2] == [2, 1]', function () {
      expect(equals([1, 2], [2, 1])).to.be(false);
    });
    it('returns false for [1, 2] == [1]', function () {
      expect(equals([1, 2], [1])).to.be(false);
    });
    it('returns false for [1] == [1, 2]', function () {
      expect(equals([1], [1, 2])).to.be(false);
    });
    it('returns false for [{}] == [{}]', function () {
      expect(equals([{}], [{}])).to.be(false);
    });
  });
  describe('extend', function () {
    it('extends an array in place with an array', function () {
      const a = [0, 1];
      extend(a, [2, 3]);
      expect(a).to.eql([0, 1, 2, 3]);
    });
    it('extends an array in place with a number', function () {
      const a = [0, 1];
      extend(a, 2);
      expect(a).to.eql([0, 1, 2]);
    });
    it('extends an array in place with a big array', function () {
      const a = [];
      let i = 250000; // original test has 1.000.000, but that was too slow
      const bigArray = Array(i);
      while (i--) {
        bigArray[i] = i;
      }
      extend(a, bigArray);
      expect(a).to.eql(bigArray);
    });
  });

  describe('isSorted', function () {
    it('works with just an array as argument', function () {
      expect(isSorted([1, 2, 3])).to.be(true);
      expect(isSorted([1, 2, 2])).to.be(true);
      expect(isSorted([1, 2, 1])).to.be(false);
    });

    it('works with strict comparison without compare function', function () {
      expect(isSorted([1, 2, 3], null, true)).to.be(true);
      expect(isSorted([1, 2, 2], null, true)).to.be(false);
      expect(isSorted([1, 2, 1], null, true)).to.be(false);
    });

    it('works with a compare function', function () {
      function compare(a, b) {
        return b - a;
      }
      expect(isSorted([1, 2, 3], compare)).to.be(false);
      expect(isSorted([3, 2, 2], compare)).to.be(true);
    });
  });

  describe('linearFindNearest', function () {
    it('returns expected value', function () {
      const arr = [1000, 500, 100];

      expect(linearFindNearest(arr, 10000, 0)).to.eql(0);
      expect(linearFindNearest(arr, 10000, 1)).to.eql(0);
      expect(linearFindNearest(arr, 10000, -1)).to.eql(0);

      expect(linearFindNearest(arr, 1000, 0)).to.eql(0);
      expect(linearFindNearest(arr, 1000, 1)).to.eql(0);
      expect(linearFindNearest(arr, 1000, -1)).to.eql(0);

      expect(linearFindNearest(arr, 999, -1)).to.eql(1);

      expect(
        linearFindNearest(arr, 901, function (value, high, low) {
          return value - (low + (high - low) * 0.8);
        })
      ).to.eql(0);

      expect(
        linearFindNearest(arr, 900, function (value, high, low) {
          return value - (low + (high - low) * 0.8);
        })
      ).to.eql(1);

      expect(linearFindNearest(arr, 900, 0)).to.eql(0);
      expect(linearFindNearest(arr, 900, 1)).to.eql(0);
      expect(linearFindNearest(arr, 900, -1)).to.eql(1);

      expect(linearFindNearest(arr, 751, 0)).to.eql(0);

      expect(linearFindNearest(arr, 750, 0)).to.eql(1);
      expect(linearFindNearest(arr, 750, 1)).to.eql(0);
      expect(linearFindNearest(arr, 750, -1)).to.eql(1);

      expect(
        linearFindNearest(arr, 551, function (value, high, low) {
          return value - (low + (high - low) * 0.1);
        })
      ).to.eql(0);

      expect(
        linearFindNearest(arr, 550, function (value, high, low) {
          return value - (low + (high - low) * 0.1);
        })
      ).to.eql(1);

      expect(linearFindNearest(arr, 550, 0)).to.eql(1);
      expect(linearFindNearest(arr, 550, 1)).to.eql(0);
      expect(linearFindNearest(arr, 550, -1)).to.eql(1);

      expect(linearFindNearest(arr, 501, 1)).to.eql(0);

      expect(linearFindNearest(arr, 500, 0)).to.eql(1);
      expect(linearFindNearest(arr, 500, 1)).to.eql(1);
      expect(linearFindNearest(arr, 500, -1)).to.eql(1);

      expect(linearFindNearest(arr, 499, -1)).to.eql(2);

      expect(
        linearFindNearest(arr, 451, function (value, high, low) {
          return value - (low + (high - low) * 0.875);
        })
      ).to.eql(1);

      expect(
        linearFindNearest(arr, 450, function (value, high, low) {
          return value - (low + (high - low) * 0.875);
        })
      ).to.eql(2);

      expect(linearFindNearest(arr, 450, 0)).to.eql(1);
      expect(linearFindNearest(arr, 450, 1)).to.eql(1);
      expect(linearFindNearest(arr, 450, -1)).to.eql(2);

      expect(linearFindNearest(arr, 301, 0)).to.eql(1);

      expect(linearFindNearest(arr, 300, 0)).to.eql(2);
      expect(linearFindNearest(arr, 300, 1)).to.eql(1);
      expect(linearFindNearest(arr, 300, -1)).to.eql(2);

      expect(
        linearFindNearest(arr, 201, function (value, high, low) {
          return value - (low + (high - low) * 0.25);
        })
      ).to.eql(1);

      expect(
        linearFindNearest(arr, 200, function (value, high, low) {
          return value - (low + (high - low) * 0.25);
        })
      ).to.eql(2);

      expect(linearFindNearest(arr, 200, 0)).to.eql(2);
      expect(linearFindNearest(arr, 200, 1)).to.eql(1);
      expect(linearFindNearest(arr, 200, -1)).to.eql(2);

      expect(linearFindNearest(arr, 101, 1)).to.eql(1);

      expect(linearFindNearest(arr, 100, 0)).to.eql(2);
      expect(linearFindNearest(arr, 100, 1)).to.eql(2);
      expect(linearFindNearest(arr, 100, -1)).to.eql(2);

      expect(linearFindNearest(arr, 50, 0)).to.eql(2);
      expect(linearFindNearest(arr, 50, 1)).to.eql(2);
      expect(linearFindNearest(arr, 50, -1)).to.eql(2);
    });
  });

  describe('numberSafeCompareFunction', function () {
    it('sorts as expected', function () {
      const arr = [40, 200, 3000];
      // default sort would yield [200, 3000, 40]
      arr.sort(numberSafeCompareFunction);
      expect(arr).to.eql(arr);
    });
  });

  describe('remove', function () {
    it('removes elements from an array', function () {
      const a = ['a', 'b', 'c', 'd'];
      remove(a, 'c');
      expect(a).to.eql(['a', 'b', 'd']);
      remove(a, 'x');
      expect(a).to.eql(['a', 'b', 'd']);
    });
  });

  describe('reverseSubArray', function () {
    it('returns expected value', function () {
      let arr;
      const expected = [1, 2, 3, 4, 5, 6];

      arr = [1, 5, 4, 3, 2, 6];
      reverseSubArray(arr, 1, 4);
      expect(arr).to.eql(expected);

      arr = [3, 2, 1, 4, 5, 6];
      reverseSubArray(arr, 0, 2);
      expect(arr).to.eql(expected);

      arr = [1, 2, 3, 6, 5, 4];
      reverseSubArray(arr, 3, 5);
      expect(arr).to.eql(expected);

      arr = [6, 5, 4, 3, 2, 1];
      reverseSubArray(arr, 0, 5);
      expect(arr).to.eql(expected);
    });
  });

  describe('stableSort', function () {
    let arr, wantedSortedValues;

    beforeEach(function () {
      arr = [
        {key: 3, val: 'a'},
        {key: 2, val: 'b'},
        {key: 3, val: 'c'},
        {key: 4, val: 'd'},
        {key: 3, val: 'e'},
      ];
      wantedSortedValues = ['b', 'a', 'c', 'e', 'd'];
    });

    it('works on an array with custom comparison function', function () {
      function comparisonFn(obj1, obj2) {
        return obj1.key - obj2.key;
      }
      stableSort(arr, comparisonFn);
      const sortedValues = [];
      for (let i = 0; i < arr.length; i++) {
        sortedValues.push(arr[i].val);
      }
      expect(wantedSortedValues).to.eql(sortedValues);
    });
  });
});
