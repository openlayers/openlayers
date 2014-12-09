goog.provide('ol.test.structs.Buffer');


describe('ol.structs.Buffer', function() {

  describe('constructor', function() {

    describe('without an argument', function() {

      var b;
      beforeEach(function() {
        b = new ol.structs.Buffer();
      });

      it('constructs an empty instance', function() {
        expect(b.getArray()).to.be.empty();
        expect(b.getCount()).to.be(0);
      });

    });

    describe('with a single array argument', function() {

      var b;
      beforeEach(function() {
        b = new ol.structs.Buffer([0, 1, 2, 3]);
      });

      it('constructs a populated instance', function() {
        expect(b.getArray()).to.eql([0, 1, 2, 3]);
      });

    });

  });

  describe('with an empty instance', function() {

    var b;
    beforeEach(function() {
      b = new ol.structs.Buffer();
    });

    describe('forEachRange', function() {

      it('does not call the callback', function() {
        var callback = sinon.spy();
        b.forEachRange(callback);
        expect(callback).not.to.be.called();
      });

    });

    describe('getArray', function() {

      it('returns an empty array', function() {
        expect(b.getArray()).to.be.empty();
      });

    });

    describe('getCount', function() {

      it('returns 0', function() {
        expect(b.getCount()).to.be(0);
      });

    });

  });

  describe('with an empty instance with spare capacity', function() {

    var b;
    beforeEach(function() {
      b = new ol.structs.Buffer(new Array(4), 0);
    });

    describe('add', function() {

      it('allows elements to be added', function() {
        expect(b.add([0, 1, 2, 3])).to.be(0);
        expect(b.getArray()).to.eql([0, 1, 2, 3]);
      });

    });

    describe('forEachRange', function() {

      it('does not call the callback', function() {
        var callback = sinon.spy();
        b.forEachRange(callback);
        expect(callback).not.to.be.called();
      });

    });

    describe('getCount', function() {

      it('returns 0', function() {
        expect(b.getCount()).to.be(0);
      });

    });

  });

  describe('with an instance with no spare capacity', function() {

    var b;
    beforeEach(function() {
      b = new ol.structs.Buffer([0, 1, 2, 3]);
    });

    describe('add', function() {

      it('throws an exception', function() {
        expect(function() {
          b.add([4, 5]);
        }).to.throwException();
      });

    });

    describe('forEachRange', function() {

      it('calls the callback', function() {
        var callback = sinon.spy();
        b.forEachRange(callback);
        expect(callback.calledOnce).to.be(true);
        expect(callback.args[0]).to.eql([0, 4]);
      });

    });

    describe('getCount', function() {

      it('returns the expected value', function() {
        expect(b.getCount()).to.be(4);
      });

    });

    describe('remove', function() {

      it('allows items to be removes', function() {
        expect(function() {
          b.remove(4, 2);
        }).to.not.throwException();
      });

    });

    describe('set', function() {

      it('updates the items', function() {
        b.set([5, 6], 2);
        expect(b.getArray()).to.eql([0, 1, 5, 6]);
      });

      it('marks the set items as dirty', function() {
        var dirtySet = new ol.structs.IntegerSet();
        b.addDirtySet(dirtySet);
        expect(dirtySet.isEmpty()).to.be(true);
        b.set([5, 6], 2);
        expect(dirtySet.isEmpty()).to.be(false);
        expect(dirtySet.getArray()).to.eql([2, 4]);
      });

    });

  });

  describe('with an instance with spare capacity', function() {

    var b;
    beforeEach(function() {
      var arr = [0, 1, 2, 3];
      arr.length = 8;
      b = new ol.structs.Buffer(arr, 4);
    });

    describe('add', function() {

      it('allows more items to be added', function() {
        expect(b.add([4, 5, 6, 7])).to.be(4);
        expect(b.getArray()).to.eql([0, 1, 2, 3, 4, 5, 6, 7]);
      });

    });

    describe('forEachRange', function() {

      it('calls the callback with the expected values', function() {
        var callback = sinon.spy();
        b.forEachRange(callback);
        expect(callback.calledOnce).to.be(true);
        expect(callback.args[0]).to.eql([0, 4]);
      });

    });

    describe('getCount', function() {

      it('returns the expected value', function() {
        expect(b.getCount()).to.be(4);
      });

    });

    describe('getFreeSet', function() {

      it('returns the expected set', function() {
        var freeSet = b.getFreeSet();
        expect(freeSet.isEmpty()).to.be(false);
        expect(freeSet.getArray()).to.eql([4, 8]);
      });

    });

  });

  describe('with a populated instance', function() {

    var b;
    beforeEach(function() {
      b = new ol.structs.Buffer([1234567.1234567, -7654321.7654321]);
    });

    describe('getSplit32', function() {

      it('returns the expected value', function() {
        var split32 = b.getSplit32();
        expect(split32).to.be.a(Float32Array);
        expect(split32).to.have.length(4);
        expect(split32[0]).to.roughlyEqual(1179648.0, 1e1);
        expect(split32[1]).to.roughlyEqual(54919.12345670001, 1e-2);
        expect(split32[2]).to.roughlyEqual(-7602176.0, 1e1);
        expect(split32[3]).to.roughlyEqual(-52145.76543209981, 1e-2);
      });

      it('tracks updates', function() {
        b.getSplit32();
        b.getArray()[0] = 0;
        b.markDirty(1, 0);
        var split32 = b.getSplit32();
        expect(split32).to.be.a(Float32Array);
        expect(split32).to.have.length(4);
        expect(split32[0]).to.be(0);
        expect(split32[1]).to.be(0);
        expect(split32[2]).to.roughlyEqual(-7602176.0, 1e1);
        expect(split32[3]).to.roughlyEqual(-52145.76543209981, 1e-2);
      });

    });
  });

  describe('usage tests', function() {

    it('allows multiple adds and removes', function() {
      var b = new ol.structs.Buffer(new Array(8), 0);
      expect(b.add([0, 1])).to.be(0);
      expect(b.getArray()).to.arreqlNaN([0, 1, NaN, NaN, NaN, NaN, NaN, NaN]);
      expect(b.getCount()).to.be(2);
      expect(b.add([2, 3, 4, 5])).to.be(2);
      expect(b.getArray()).to.arreqlNaN([0, 1, 2, 3, 4, 5, NaN, NaN]);
      expect(b.getCount()).to.be(6);
      expect(b.add([6, 7])).to.be(6);
      expect(b.getArray()).to.eql([0, 1, 2, 3, 4, 5, 6, 7]);
      expect(b.getCount()).to.be(8);
      b.remove(2, 2);
      expect(b.getArray()).to.arreqlNaN([0, 1, NaN, NaN, 4, 5, 6, 7]);
      expect(b.getCount()).to.be(6);
      expect(b.add([8, 9])).to.be(2);
      expect(b.getArray()).to.eql([0, 1, 8, 9, 4, 5, 6, 7]);
      expect(b.getCount()).to.be(8);
      b.remove(1, 1);
      expect(b.getArray()).to.arreqlNaN([0, NaN, 8, 9, 4, 5, 6, 7]);
      expect(b.getCount()).to.be(7);
      b.remove(4, 4);
      expect(b.getArray()).to.arreqlNaN([0, NaN, 8, 9, NaN, NaN, NaN, NaN]);
      expect(b.getCount()).to.be(3);
      expect(b.add([10, 11, 12])).to.be(4);
      expect(b.getArray()).to.arreqlNaN([0, NaN, 8, 9, 10, 11, 12, NaN]);
      expect(b.getCount()).to.be(6);
      expect(b.add([13])).to.be(1);
      expect(b.getArray()).to.arreqlNaN([0, 13, 8, 9, 10, 11, 12, NaN]);
      expect(b.getCount()).to.be(7);
    });

  });

});


goog.require('ol.structs.Buffer');
goog.require('ol.structs.IntegerSet');
