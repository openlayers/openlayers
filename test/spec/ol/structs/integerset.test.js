goog.provide('ol.test.structs.IntegerSet');


describe('ol.structs.IntegerSet', function() {

  describe('constructor', function() {

    describe('without an argument', function() {

      it('constructs an empty instance', function() {
        var is = new ol.structs.IntegerSet();
        expect(is).to.be.an(ol.structs.IntegerSet);
        expect(is.getArray()).to.be.empty();
      });

    });

  });

  describe('unpack', function() {

    it('constructs with a valid array', function() {
      var is = ol.structs.IntegerSet.unpack([0, 2, 4, 6]);
      expect(is).to.be.an(ol.structs.IntegerSet);
      expect(is.getArray()).to.equalArray([0, 2, 4, 6]);
    });

    it('throws an exception with an odd number of elements', function() {
      expect(function() {
        var is = ol.structs.IntegerSet.unpack([0, 2, 4]);
      }).to.throwException();
    });

    it('throws an exception with out-of-order elements', function() {
      expect(function() {
        var is = ol.structs.IntegerSet.unpack([0, 2, 2, 4]);
      }).to.throwException();
    });

  });

  describe('with an empty instance', function() {

    var is;
    beforeEach(function() {
      is = new ol.structs.IntegerSet();
    });

    describe('addRange', function() {

      it('creates a new element', function() {
        is.addRange(0, 2);
        expect(is.getArray()).to.equalArray([0, 2]);
      });

    });

    describe('findRange', function() {

      it('returns -1', function() {
        expect(is.findRange(2)).to.be(-1);
      });

    });

    describe('forEachRange', function() {

      it('does not call the callback', function() {
        var callback = sinon.spy();
        is.forEachRange(callback);
        expect(callback).to.not.be.called();
      });

    });

    describe('forEachRangeInverted', function() {

      it('does call the callback', function() {
        var callback = sinon.spy();
        is.forEachRangeInverted(0, 8, callback);
        expect(callback.calledOnce).to.be(true);
        expect(callback.args[0]).to.equalArray([0, 8]);
      });

    });

    describe('getFirst', function() {

      it('returns -1', function() {
        expect(is.getFirst()).to.be(-1);
      });

    });

    describe('getLast', function() {

      it('returns -1', function() {
        expect(is.getLast()).to.be(-1);
      });

    });

    describe('getSize', function() {

      it('returns 0', function() {
        expect(is.getSize()).to.be(0);
      });

    });

    describe('isEmpty', function() {

      it('returns true', function() {
        expect(is.isEmpty()).to.be(true);
      });

    });

    describe('toString', function() {

      it('returns an empty string', function() {
        expect(is.toString()).to.be.empty();
      });

    });

  });

  describe('with a populated instance', function() {

    var is;
    beforeEach(function() {
      is = ol.structs.IntegerSet.unpack([4, 6, 8, 10, 12, 14]);
    });

    describe('addRange', function() {

      it('inserts before the first element', function() {
        is.addRange(0, 2);
        expect(is.getArray()).to.equalArray([0, 2, 4, 6, 8, 10, 12, 14]);
      });

      it('extends the first element to the left', function() {
        is.addRange(0, 4);
        expect(is.getArray()).to.equalArray([0, 6, 8, 10, 12, 14]);
      });

      it('extends the first element to the right', function() {
        is.addRange(6, 7);
        expect(is.getArray()).to.equalArray([4, 7, 8, 10, 12, 14]);
      });

      it('merges the first two elements', function() {
        is.addRange(6, 8);
        expect(is.getArray()).to.equalArray([4, 10, 12, 14]);
      });

      it('extends middle elements to the left', function() {
        is.addRange(7, 8);
        expect(is.getArray()).to.equalArray([4, 6, 7, 10, 12, 14]);
      });

      it('extends middle elements to the right', function() {
        is.addRange(10, 11);
        expect(is.getArray()).to.equalArray([4, 6, 8, 11, 12, 14]);
      });

      it('merges the last two elements', function() {
        is.addRange(10, 12);
        expect(is.getArray()).to.equalArray([4, 6, 8, 14]);
      });

      it('extends the last element to the left', function() {
        is.addRange(11, 12);
        expect(is.getArray()).to.equalArray([4, 6, 8, 10, 11, 14]);
      });

      it('extends the last element to the right', function() {
        is.addRange(14, 15);
        expect(is.getArray()).to.equalArray([4, 6, 8, 10, 12, 15]);
      });

      it('inserts after the last element', function() {
        is.addRange(16, 18);
        expect(is.getArray()).to.equalArray([4, 6, 8, 10, 12, 14, 16, 18]);
      });

    });

    describe('clear', function() {

      it('clears the instance', function() {
        is.clear();
        expect(is.getArray()).to.be.empty();
      });

    });

    describe('findRange', function() {

      it('throws an exception when passed a negative size', function() {
        expect(function() {
          is.findRange(-1);
        }).to.throwException();
      });

      it('throws an exception when passed a zero size', function() {
        expect(function() {
          is.findRange(0);
        }).to.throwException();
      });

      it('finds the first range of size 1', function() {
        expect(is.findRange(1)).to.be(4);
      });

      it('finds the first range of size 2', function() {
        expect(is.findRange(2)).to.be(4);
      });

      it('returns -1 when no range can be found', function() {
        expect(is.findRange(3)).to.be(-1);
      });

    });

    describe('forEachRange', function() {

      it('calls the callback', function() {
        var callback = sinon.spy();
        is.forEachRange(callback);
        expect(callback).to.be.called();
        expect(callback.calledThrice).to.be(true);
        expect(callback.args[0]).to.equalArray([4, 6]);
        expect(callback.args[1]).to.equalArray([8, 10]);
        expect(callback.args[2]).to.equalArray([12, 14]);
      });

    });

    describe('forEachRangeInverted', function() {

      it('does call the callback', function() {
        var callback = sinon.spy();
        is.forEachRangeInverted(0, 16, callback);
        expect(callback.callCount).to.be(4);
        expect(callback.args[0]).to.equalArray([0, 4]);
        expect(callback.args[1]).to.equalArray([6, 8]);
        expect(callback.args[2]).to.equalArray([10, 12]);
        expect(callback.args[3]).to.equalArray([14, 16]);
      });

    });


    describe('getFirst', function() {

      it('returns the expected value', function() {
        expect(is.getFirst()).to.be(4);
      });

    });

    describe('getLast', function() {

      it('returns the expected value', function() {
        expect(is.getLast()).to.be(14);
      });

    });

    describe('getSize', function() {

      it('returns the expected value', function() {
        expect(is.getSize()).to.be(6);
      });

    });

    describe('isEmpty', function() {

      it('returns false', function() {
        expect(is.isEmpty()).to.be(false);
      });

    });

    describe('removeRange', function() {

      it('removes the first part of the first element', function() {
        is.removeRange(4, 5);
        expect(is.getArray()).to.equalArray([5, 6, 8, 10, 12, 14]);
      });

      it('removes the last part of the first element', function() {
        is.removeRange(5, 6);
        expect(is.getArray()).to.equalArray([4, 5, 8, 10, 12, 14]);
      });

      it('removes the first element', function() {
        is.removeRange(4, 6);
        expect(is.getArray()).to.equalArray([8, 10, 12, 14]);
      });

      it('removes the first part of a middle element', function() {
        is.removeRange(8, 9);
        expect(is.getArray()).to.equalArray([4, 6, 9, 10, 12, 14]);
      });

      it('removes the last part of a middle element', function() {
        is.removeRange(9, 10);
        expect(is.getArray()).to.equalArray([4, 6, 8, 9, 12, 14]);
      });

      it('removes a middle element', function() {
        is.removeRange(8, 10);
        expect(is.getArray()).to.equalArray([4, 6, 12, 14]);
      });

      it('removes the first part of the last element', function() {
        is.removeRange(12, 13);
        expect(is.getArray()).to.equalArray([4, 6, 8, 10, 13, 14]);
      });

      it('removes the last part of the last element', function() {
        is.removeRange(13, 14);
        expect(is.getArray()).to.equalArray([4, 6, 8, 10, 12, 13]);
      });

      it('removes the last element', function() {
        is.removeRange(12, 14);
        expect(is.getArray()).to.equalArray([4, 6, 8, 10]);
      });

      it('can remove multiple ranges near the start', function() {
        is.removeRange(3, 11);
        expect(is.getArray()).to.equalArray([12, 14]);
      });

      it('can remove multiple ranges near the start', function() {
        is.removeRange(7, 15);
        expect(is.getArray()).to.equalArray([4, 6]);
      });

      it('throws an exception when passed an invalid range', function() {
        expect(function() {
          is.removeRange(2, 0);
        }).to.throwException();
      });

    });

    describe('toString', function() {

      it('returns the expected value', function() {
        expect(is.toString()).to.be('4-6, 8-10, 12-14');
      });
    });

  });

  describe('with fragmentation', function() {

    var is;
    beforeEach(function() {
      is = ol.structs.IntegerSet.unpack(
          [0, 1, 2, 4, 5, 8, 9, 12, 13, 15, 16, 17]);
    });

    describe('findRange', function() {

      it('finds the first range of size 1', function() {
        expect(is.findRange(1)).to.be(0);
      });

      it('finds the first range of size 2', function() {
        expect(is.findRange(2)).to.be(2);
      });

      it('finds the first range of size 3', function() {
        expect(is.findRange(3)).to.be(5);
      });

      it('returns -1 when no range can be found', function() {
        expect(is.findRange(4)).to.be(-1);
      });

    });

    describe('getFirst', function() {

      it('returns the expected value', function() {
        expect(is.getFirst()).to.be(0);
      });

    });

    describe('getLast', function() {

      it('returns the expected value', function() {
        expect(is.getLast()).to.be(17);
      });

    });

    describe('getSize', function() {

      it('returns the expected value', function() {
        expect(is.getSize()).to.be(12);
      });

    });

    describe('removeRange', function() {

      it('removing an empty range has no effect', function() {
        is.removeRange(0, 0);
        expect(is.getArray()).to.equalArray(
            [0, 1, 2, 4, 5, 8, 9, 12, 13, 15, 16, 17]);
      });

      it('can remove elements from the middle of range', function() {
        is.removeRange(6, 7);
        expect(is.getArray()).to.equalArray(
            [0, 1, 2, 4, 5, 6, 7, 8, 9, 12, 13, 15, 16, 17]);
      });

      it('can remove multiple ranges', function() {
        is.removeRange(2, 12);
        expect(is.getArray()).to.equalArray([0, 1, 13, 15, 16, 17]);
      });

      it('can remove multiple ranges and reduce others', function() {
        is.removeRange(0, 10);
        expect(is.getArray()).to.equalArray([10, 12, 13, 15, 16, 17]);
      });

      it('can remove all ranges', function() {
        is.removeRange(0, 18);
        expect(is.getArray()).to.equalArray([]);
      });

    });

    describe('toString', function() {

      it('returns the expected value', function() {
        expect(is.toString()).to.be('0-1, 2-4, 5-8, 9-12, 13-15, 16-17');
      });

    });

  });

  describe('compared to a slow reference implementation', function() {

    var SimpleIntegerSet = function() {
      this.integers_ = {};
    };

    SimpleIntegerSet.prototype.addRange = function(addStart, addStop) {
      var i;
      for (i = addStart; i < addStop; ++i) {
        this.integers_[i.toString()] = true;
      }
    };

    SimpleIntegerSet.prototype.clear = function() {
      this.integers_ = {};
    };

    SimpleIntegerSet.prototype.getArray = function() {
      var integers = goog.array.map(
          goog.object.getKeys(this.integers_), Number);
      goog.array.sort(integers);
      var arr = [];
      var start = -1, stop;
      var i;
      for (i = 0; i < integers.length; ++i) {
        if (start == -1) {
          start = stop = integers[i];
        } else if (integers[i] == stop + 1) {
          ++stop;
        } else {
          arr.push(start, stop + 1);
          start = stop = integers[i];
        }
      }
      if (start != -1) {
        arr.push(start, stop + 1);
      }
      return arr;
    };

    SimpleIntegerSet.prototype.removeRange = function(removeStart, removeStop) {
      var i;
      for (i = removeStart; i < removeStop; ++i) {
        delete this.integers_[i.toString()];
      }
    };

    var is, sis;
    beforeEach(function() {
      is = new ol.structs.IntegerSet();
      sis = new SimpleIntegerSet();
    });

    it('behaves identically with random adds', function() {
      var addStart, addStop, i;
      for (i = 0; i < 64; ++i) {
        addStart = goog.math.randomInt(128);
        addStop = addStart + goog.math.randomInt(16);
        is.addRange(addStart, addStop);
        sis.addRange(addStart, addStop);
        expect(is.getArray()).to.equalArray(sis.getArray());
      }
    });

    it('behaves identically with random removes', function() {
      is.addRange(0, 128);
      sis.addRange(0, 128);
      var i, removeStart, removeStop;
      for (i = 0; i < 64; ++i) {
        removeStart = goog.math.randomInt(128);
        removeStop = removeStart + goog.math.randomInt(16);
        is.removeRange(removeStart, removeStop);
        sis.removeRange(removeStart, removeStop);
        expect(is.getArray()).to.equalArray(sis.getArray());
      }
    });

    it('behaves identically with random adds and removes', function() {
      var i, start, stop;
      for (i = 0; i < 64; ++i) {
        start = goog.math.randomInt(128);
        stop = start + goog.math.randomInt(16);
        if (Math.random() < 0.5) {
          is.addRange(start, stop);
          sis.addRange(start, stop);
        } else {
          is.removeRange(start, stop);
          sis.removeRange(start, stop);
        }
        expect(is.getArray()).to.equalArray(sis.getArray());
      }
    });

    it('behaves identically with random adds, removes, and clears', function() {
      var i, p, start, stop;
      for (i = 0; i < 64; ++i) {
        start = goog.math.randomInt(128);
        stop = start + goog.math.randomInt(16);
        p = Math.random();
        if (p < 0.45) {
          is.addRange(start, stop);
          sis.addRange(start, stop);
        } else if (p < 0.9) {
          is.removeRange(start, stop);
          sis.removeRange(start, stop);
        } else {
          is.clear();
          sis.clear();
        }
        expect(is.getArray()).to.equalArray(sis.getArray());
      }
    });

  });

});


goog.require('goog.array');
goog.require('goog.object');
goog.require('ol.structs.IntegerSet');
