import {
  binarySearch,
  equals,
  extend,
  find,
  findIndex,
  isSorted,
  linearFindNearest,
  numberSafeCompareFunction,
  remove,
  reverseSubArray,
  stableSort
} from '../../../src/ol/array.js';


describe('ol.array', () => {

  describe('binarySearch', () => {

    const insertionPoint = function(position) {
      return -(position + 1);
    };
    const revNumCompare = function(a, b) {
      return b - a;
    };

    describe('default comparison on array of String(s)', () => {
      const a = [
        '1000', '9', 'AB', 'ABC', 'ABCABC', 'ABD', 'ABDA', 'B', 'B', 'B',
        'C', 'CA', 'CC', 'ZZZ', 'ab', 'abc', 'abcabc', 'abd', 'abda', 'b',
        'c', 'ca', 'cc', 'zzz'
      ];

      test('should find \'1000\' at index 0', () => {
        expect(binarySearch(a, '1000')).toBe(0);
      });
      test('should find \'zzz\' at index ' + (a.length - 1), () => {
        expect(binarySearch(a, 'zzz')).toBe(a.length - 1);
      });
      test('should find \'C\' at index 10', () => {
        expect(binarySearch(a, 'C')).toBe(10);
      });
      test('should find \'B\' at index 7 || 8 || 9', () => {
        const pos = binarySearch(a, 'B');
        expect(pos == 7 || pos == 8 || pos == 9).toBeTruthy();
      });
      test('should not find \'100\'', () => {
        const pos = binarySearch(a, '100');
        expect(pos < 0).toBeTruthy();
      });
      test('should have an insertion point of 0 for \'100\'', () => {
        const pos = binarySearch(a, '100');
        expect(insertionPoint(pos)).toBe(0);
      });
      test('should not find \'zzz0\'', () => {
        const pos = binarySearch(a, 'zzz0');
        expect(pos < 0).toBeTruthy();
      });
      test(
        'should have an insertion point of ' + (a.length) + ' for \'zzz0\'',
        () => {
          const pos = binarySearch(a, 'zzz0');
          expect(insertionPoint(pos)).toBe(a.length);
        }
      );
      test('should not find \'BA\'', () => {
        const pos = binarySearch(a, 'zzz0');
        expect(pos < 0).toBeTruthy();
      });
      test('should have an insertion point of 10 for \'BA\'', () => {
        const pos = binarySearch(a, 'BA');
        expect(insertionPoint(pos)).toBe(10);
      });
    });

    describe('0 length array with default comparison', () => {
      const b = [];
      test('should not find \'a\'', () => {
        expect(binarySearch(b, 'a') < 0).toBeTruthy();
      });
      test('should have an insertion point of 0 for \'a\'', () => {
        const pos = binarySearch(b, 'a');
        expect(insertionPoint(pos)).toBe(0);
      });
    });

    describe('single element array with default lexiographical comparison',
      () => {
        const c = ['only item'];
        test('should find \'only item\' at index 0', () => {
          expect(binarySearch(c, 'only item')).toBe(0);
        });
        test('should not find \'a\'', () => {
          expect(binarySearch(c, 'a') < 0).toBeTruthy();
        });
        test('should have an insertion point of 0 for \'a\'', () => {
          const pos = binarySearch(c, 'a');
          expect(insertionPoint(pos)).toBe(0);
        });
        test('should not find \'z\'', () => {
          expect(binarySearch(c, 'z') < 0).toBeTruthy();
        });
        test('should have an insertion point of 1 for \'z\'', () => {
          const pos = binarySearch(c, 'z');
          expect(insertionPoint(pos)).toBe(1);
        });
      }
    );

    describe('default comparison on array of Number(s)', () => {
      const d = [
        -897123.9, -321434.58758, -1321.3124, -324, -9, -3, 0, 0, 0,
        0.31255, 5, 142.88888708, 334, 342, 453, 54254
      ];
      test('should find -897123.9 at index 0', () => {
        expect(binarySearch(d, -897123.9)).toBe(0);
      });
      test('should find 54254 at index ' + (d.length - 1), () => {
        expect(binarySearch(d, 54254)).toBe(d.length - 1);
      });
      test('should find -3 at index 5', () => {
        expect(binarySearch(d, -3)).toBe(5);
      });
      test('should find 0 at index 6 || 7 || 8', () => {
        const pos = binarySearch(d, 0);
        expect(pos == 6 || pos == 7 || pos == 8).toBe(true);
      });
      test('should not find -900000', () => {
        const pos = binarySearch(d, -900000);
        expect(pos < 0).toBe(true);
      });
      test('should have an insertion point of 0 for -900000', () => {
        const pos = binarySearch(d, -900000);
        expect(insertionPoint(pos)).toBe(0);
      });
      test('should not find 54255', () => {
        const pos = binarySearch(d, 54255);
        expect(pos < 0).toBe(true);
      });
      test(
        'should have an insertion point of ' + (d.length) + ' for 54255',
        () => {
          const pos = binarySearch(d, 54255);
          expect(insertionPoint(pos)).toBe(d.length);
        }
      );
      test('should not find 1.1', () => {
        const pos = binarySearch(d, 1.1);
        expect(pos < 0).toBe(true);
      });
      test('should have an insertion point of 10 for 1.1', () => {
        const pos = binarySearch(d, 1.1);
        expect(insertionPoint(pos)).toBe(10);
      });
    });

    describe('custom comparison function, which reverse orders numbers',
      () => {
        const e = [
          54254, 453, 342, 334, 142.88888708, 5, 0.31255, 0, 0, 0, -3,
          -9, -324, -1321.3124, -321434.58758, -897123.9
        ];
        test('should find 54254 at index 0', () => {
          const pos = binarySearch(e, 54254, revNumCompare);
          expect(pos).toBe(0);
        });
        test('should find -897123.9 at index ' + (e.length - 1), () => {
          const pos = binarySearch(e, -897123.9, revNumCompare);
          expect(pos).toBe(e.length - 1);
        });
        test('should find -3 at index 10', () => {
          const pos = binarySearch(e, -3, revNumCompare);
          expect(pos).toBe(10);
        });
        test('should find 0 at index 7 || 8 || 9', () => {
          const pos = binarySearch(e, 0, revNumCompare);
          expect(pos == 7 || pos == 8 || pos == 9).toBe(true);
        });
        test('should not find 54254.1', () => {
          const pos = binarySearch(e, 54254.1, revNumCompare);
          expect(pos < 0).toBe(true);
        });
        test('should have an insertion point of 0 for 54254.1', () => {
          const pos = binarySearch(e, 54254.1, revNumCompare);
          expect(insertionPoint(pos)).toBe(0);
        });
        test('should not find -897124', () => {
          const pos = binarySearch(e, -897124, revNumCompare);
          expect(pos < 0).toBe(true);
        });
        test(
          'should have an insertion point of ' + e.length + ' for -897124',
          () => {
            const pos = binarySearch(e, -897124, revNumCompare);
            expect(insertionPoint(pos)).toBe(e.length);
          }
        );
        test('should not find 1.1', () => {
          const pos = binarySearch(e, 1.1, revNumCompare);
          expect(pos < 0).toBe(true);
        });
        test('should have an insertion point of 0 for 1.1', () => {
          const pos = binarySearch(e, 1.1, revNumCompare);
          expect(insertionPoint(pos)).toBe(6);
        });
      }
    );

    describe('0 length array with custom comparison function', () => {
      const f = [];
      test('should not find 0', () => {
        const pos = binarySearch(f, 0, revNumCompare);
        expect(pos < 0).toBe(true);
      });
      test('should have an insertion point of 0 for 0', () => {
        const pos = binarySearch(f, 0, revNumCompare);
        expect(insertionPoint(pos)).toBe(0);
      });
    });

    describe('single element array with custom comparison function',
      () => {
        const g = [1];
        test('should find 1 at index 0', () => {
          const pos = binarySearch(g, 1, revNumCompare);
          expect(pos).toBe(0);
        });
        test('should not find 2', () => {
          const pos = binarySearch(g, 2, revNumCompare);
          expect(pos < 0).toBe(true);
        });
        test('should have an insertion point of 0 for 2', () => {
          const pos = binarySearch(g, 2, revNumCompare);
          expect(insertionPoint(pos)).toBe(0);
        });
        test('should not find 0', () => {
          const pos = binarySearch(g, 0, revNumCompare);
          expect(pos < 0).toBe(true);
        });
        test('should have an insertion point of 1 for 0', () => {
          const pos = binarySearch(g, 0, revNumCompare);
          expect(insertionPoint(pos)).toBe(1);
        });
      }
    );

    describe('finding first index when multiple candidates', () => {
      test('should find the index of the first 0', () => {
        expect(binarySearch([0, 0, 1], 0)).toBe(0);
      });
      test('should find the index of the first 1', () => {
        expect(binarySearch([0, 1, 1], 1)).toBe(1);
      });
    });

    describe('Don\'t use Array#slice, Function#apply and Function#call',
      () => {
        const a = [1, 5, 7, 11, 13, 16, 19, 24, 28, 31, 33, 36, 40, 50, 52, 55];
        const calls = {
          'Array#slice': false,
          'Function#apply': false,
          'Function#call': false
        };
        let origArraySlice;
        let origFunctionApply;
        let origFunctionCall;

        test(
          'does not use potentially slow methods (default & custom compare)',
          () => {
            // Mockup (I failed to use sinon.spy and beforeEach-hooks)
            origArraySlice = Array.prototype.slice;
            origFunctionApply = Function.prototype.apply;
            origFunctionCall = Function.prototype.call;
            Array.prototype.slice = function() {
              calls['Array#slice'] = true;
            };
            Function.prototype.apply = function() {
              calls['Function#apply'] = true;
            };
            Function.prototype.call = function() {
              calls['Function#call'] = true;
            };

            // Now actually call and test the method twice
            binarySearch(a, 48);
            binarySearch(a, 13, function(a, b) {
              return a > b ? 1 : a < b ? -1 : 0;
            });

            // Restore mocked up methods
            Array.prototype.slice = origArraySlice;
            Function.prototype.apply = origFunctionApply;
            Function.prototype.call = origFunctionCall;

            expect(calls['Array#slice']).toBe(false);
            expect(calls['Function#apply']).toBe(false);
            expect(calls['Function#call']).toBe(false);
          }
        );
      }
    );

    describe('when items are not found', () => {
      const arr = [1, 2, 2, 2, 3, 5, 9];

      test(
        'should return the index of where the item would go plus one, negated, if the item is not found',
        () => {
          expect(binarySearch(arr, 4)).toBe(-6);
        }
      );
      test('should work even on empty arrays', () => {
        expect(binarySearch([], 42)).toBe(-1);
      });
      test('should work even on arrays of doubles', () => {
        expect(binarySearch([0.0, 0.1, 0.2, 0.3, 0.4], 0.25)).toBe(-4);
      });
    });
  });

  describe('equals', () => {
    test('returns true for [] == []', () => {
      expect(equals([], [])).toBe(true);
    });
    test('returns true for [1] == [1]', () => {
      expect(equals([1], [1])).toBe(true);
    });
    test('returns true for [\'1\'] == [\'1\']', () => {
      expect(equals(['1'], ['1'])).toBe(true);
    });
    test('returns false for [1] == [\'1\']', () => {
      expect(equals([1], ['1'])).toBe(false);
    });
    test('returns true for [null] == [null]', () => {
      expect(equals([null], [null])).toBe(true);
    });
    test('returns false for [null] == [undefined]', () => {
      expect(equals([null], [undefined])).toBe(false);
    });
    test('returns true for [1, 2] == [1, 2]', () => {
      expect(equals([1, 2], [1, 2])).toBe(true);
    });
    test('returns false for [1, 2] == [2, 1]', () => {
      expect(equals([1, 2], [2, 1])).toBe(false);
    });
    test('returns false for [1, 2] == [1]', () => {
      expect(equals([1, 2], [1])).toBe(false);
    });
    test('returns false for [1] == [1, 2]', () => {
      expect(equals([1], [1, 2])).toBe(false);
    });
    test('returns false for [{}] == [{}]', () => {
      expect(equals([{}], [{}])).toBe(false);
    });
  });
  describe('extend', () => {
    test('extends an array in place with an array', () => {
      const a = [0, 1];
      extend(a, [2, 3]);
      expect(a).toEqual([0, 1, 2, 3]);
    });
    test('extends an array in place with a number', () => {
      const a = [0, 1];
      extend(a, 2);
      expect(a).toEqual([0, 1, 2]);
    });
    test('extends an array in place with a big array', () => {
      const a = [];
      let i = 250000; // original test has 1.000.000, but that was too slow
      const bigArray = Array(i);
      while (i--) {
        bigArray[i] = i;
      }
      extend(a, bigArray);
      expect(a).toEqual(bigArray);
    });
  });

  describe('find', () => {
    test('finds numbers in an array', () => {
      const a = [0, 1, 2, 3];
      const b = find(a, function(val, index, a2) {
        expect(a).toBe(a2);
        expect(typeof index).toBe('number');
        return val > 1;
      });
      expect(b).toBe(2);
    });

    test('returns null when an item in an array is not found', () => {
      const a = [0, 1, 2, 3];
      const b = find(a, function(val, index, a2) {
        return val > 100;
      });
      expect(b).toBe(null);
    });

    test('finds items in an array-like', () => {
      const a = 'abCD';
      const b = find(a, function(val, index, a2) {
        expect(a).toBe(a2);
        expect(typeof index).toBe('number');
        return val >= 'A' && val <= 'Z';
      });
      expect(b).toBe('C');
    });

    test('returns null when nothing in an array-like is found', () => {
      const a = 'abcd';
      const b = find(a, function(val, index, a2) {
        return val >= 'A' && val <= 'Z';
      });
      expect(b).toBe(null);
    });
  });

  describe('findIndex', () => {
    test('finds index of numbers in an array', () => {
      const a = [0, 1, 2, 3];
      const b = findIndex(a, function(val, index, a2) {
        expect(a).toBe(a2);
        expect(typeof index).toBe('number');
        return val > 1;
      });
      expect(b).toBe(2);
    });

    test('returns -1 when an item in an array is not found', () => {
      const a = [0, 1, 2, 3];
      const b = findIndex(a, function(val, index, a2) {
        return val > 100;
      });
      expect(b).toBe(-1);
    });
  });

  describe('isSorted', () => {
    test('works with just an array as argument', () => {
      expect(isSorted([1, 2, 3])).toBe(true);
      expect(isSorted([1, 2, 2])).toBe(true);
      expect(isSorted([1, 2, 1])).toBe(false);
    });

    test('works with strict comparison without compare function', () => {
      expect(isSorted([1, 2, 3], null, true)).toBe(true);
      expect(isSorted([1, 2, 2], null, true)).toBe(false);
      expect(isSorted([1, 2, 1], null, true)).toBe(false);
    });

    test('works with a compare function', () => {
      function compare(a, b) {
        return b - a;
      }
      expect(isSorted([1, 2, 3], compare)).toBe(false);
      expect(isSorted([3, 2, 2], compare)).toBe(true);
    });
  });

  describe('linearFindNearest', () => {
    test('returns expected value', () => {
      const arr = [1000, 500, 100];

      expect(linearFindNearest(arr, 10000, 0)).toEqual(0);
      expect(linearFindNearest(arr, 10000, 1)).toEqual(0);
      expect(linearFindNearest(arr, 10000, -1)).toEqual(0);

      expect(linearFindNearest(arr, 1000, 0)).toEqual(0);
      expect(linearFindNearest(arr, 1000, 1)).toEqual(0);
      expect(linearFindNearest(arr, 1000, -1)).toEqual(0);

      expect(linearFindNearest(arr, 900, 0)).toEqual(0);
      expect(linearFindNearest(arr, 900, 1)).toEqual(0);
      expect(linearFindNearest(arr, 900, -1)).toEqual(1);

      expect(linearFindNearest(arr, 750, 0)).toEqual(1);
      expect(linearFindNearest(arr, 750, 1)).toEqual(0);
      expect(linearFindNearest(arr, 750, -1)).toEqual(1);

      expect(linearFindNearest(arr, 550, 0)).toEqual(1);
      expect(linearFindNearest(arr, 550, 1)).toEqual(0);
      expect(linearFindNearest(arr, 550, -1)).toEqual(1);

      expect(linearFindNearest(arr, 500, 0)).toEqual(1);
      expect(linearFindNearest(arr, 500, 1)).toEqual(1);
      expect(linearFindNearest(arr, 500, -1)).toEqual(1);

      expect(linearFindNearest(arr, 450, 0)).toEqual(1);
      expect(linearFindNearest(arr, 450, 1)).toEqual(1);
      expect(linearFindNearest(arr, 450, -1)).toEqual(2);

      expect(linearFindNearest(arr, 300, 0)).toEqual(2);
      expect(linearFindNearest(arr, 300, 1)).toEqual(1);
      expect(linearFindNearest(arr, 300, -1)).toEqual(2);

      expect(linearFindNearest(arr, 200, 0)).toEqual(2);
      expect(linearFindNearest(arr, 200, 1)).toEqual(1);
      expect(linearFindNearest(arr, 200, -1)).toEqual(2);

      expect(linearFindNearest(arr, 100, 0)).toEqual(2);
      expect(linearFindNearest(arr, 100, 1)).toEqual(2);
      expect(linearFindNearest(arr, 100, -1)).toEqual(2);

      expect(linearFindNearest(arr, 50, 0)).toEqual(2);
      expect(linearFindNearest(arr, 50, 1)).toEqual(2);
      expect(linearFindNearest(arr, 50, -1)).toEqual(2);
    });
  });

  describe('numberSafeCompareFunction', () => {
    test('sorts as expected', () => {
      const arr = [40, 200, 3000];
      // default sort would yield [200, 3000, 40]
      arr.sort(numberSafeCompareFunction);
      expect(arr).toEqual(arr);
    });
  });

  describe('remove', () => {
    test('removes elements from an array', () => {
      const a = ['a', 'b', 'c', 'd'];
      remove(a, 'c');
      expect(a).toEqual(['a', 'b', 'd']);
      remove(a, 'x');
      expect(a).toEqual(['a', 'b', 'd']);
    });
  });

  describe('reverseSubArray', () => {
    test('returns expected value', () => {
      let arr;
      const expected = [1, 2, 3, 4, 5, 6];

      arr = [1, 5, 4, 3, 2, 6];
      reverseSubArray(arr, 1, 4);
      expect(arr).toEqual(expected);

      arr = [3, 2, 1, 4, 5, 6];
      reverseSubArray(arr, 0, 2);
      expect(arr).toEqual(expected);

      arr = [1, 2, 3, 6, 5, 4];
      reverseSubArray(arr, 3, 5);
      expect(arr).toEqual(expected);

      arr = [6, 5, 4, 3, 2, 1];
      reverseSubArray(arr, 0, 5);
      expect(arr).toEqual(expected);
    });
  });

  describe('stableSort', () => {
    let arr, wantedSortedValues;

    beforeEach(() => {
      arr = [{key: 3, val: 'a'}, {key: 2, val: 'b'}, {key: 3, val: 'c'},
        {key: 4, val: 'd'}, {key: 3, val: 'e'}];
      wantedSortedValues = ['b', 'a', 'c', 'e', 'd'];
    });

    test('works on an array with custom comparison function', () => {
      function comparisonFn(obj1, obj2) {
        return obj1.key - obj2.key;
      }
      stableSort(arr, comparisonFn);
      const sortedValues = [];
      for (let i = 0; i < arr.length; i++) {
        sortedValues.push(arr[i].val);
      }
      expect(wantedSortedValues).toEqual(sortedValues);
    });
  });

});
