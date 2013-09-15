goog.provide('ol.test.geom2.LineStringCollection');


describe('ol.geom2.LineStringCollection', function() {

  describe('createEmpty', function() {

    it('creates an empty instance with the specified capacity', function() {
      var lsc = ol.geom2.LineStringCollection.createEmpty(16);
      expect(lsc.getCount()).to.be(0);
      expect(lsc.buf.getArray()).to.have.length(32);
    });

    it('can create empty collections for higher dimensions', function() {
      var lsc = ol.geom2.LineStringCollection.createEmpty(16, 3);
      expect(lsc.getCount()).to.be(0);
      expect(lsc.buf.getArray()).to.have.length(48);
    });

  });

  describe('pack', function() {

    it('packs an empty array', function() {
      var lsc = ol.geom2.LineStringCollection.pack([]);
      expect(lsc.buf.getArray()).to.be.empty();
      expect(lsc.ranges).to.be.empty();
      expect(lsc.dim).to.be(2);
    });

    it('packs an empty array with a capacity', function() {
      var lsc = ol.geom2.LineStringCollection.pack([], 4);
      expect(lsc.buf.getArray()).to.eql(
          [NaN, NaN, NaN, NaN, NaN, NaN, NaN, NaN]);
      expect(lsc.ranges).to.be.empty();
      expect(lsc.dim).to.be(2);
    });

    it('packs an array of line strings', function() {
      var lsc = ol.geom2.LineStringCollection.pack(
          [[[0, 1], [2, 3], [4, 5]], [[6, 7], [8, 9]]]);
      expect(lsc.buf.getArray()).to.eql([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
      expect(lsc.getCount()).to.be(2);
      expect(lsc.ranges[0]).to.be(6);
      expect(lsc.ranges[6]).to.be(10);
      expect(lsc.dim).to.be(2);
    });

    it('packs an array of line strings with a different dimension', function() {
      var lsc = ol.geom2.LineStringCollection.pack(
          [[[0, 1, 2], [3, 4, 5]], [[6, 7, 8], [9, 10, 11]]]);
      expect(lsc.buf.getArray()).to.eql([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
      expect(lsc.getCount()).to.be(2);
      expect(lsc.ranges[0]).to.be(6);
      expect(lsc.ranges[6]).to.be(12);
      expect(lsc.dim).to.be(3);
    });

    it('packs an array of line strings with extra capacity', function() {
      var lsc = ol.geom2.LineStringCollection.pack(
          [[[0, 1], [2, 3], [4, 5]], [[6, 7], [8, 9]]], 16);
      expect(lsc.buf.getArray().slice(0, 10)).to.eql(
          [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
      expect(lsc.buf.getArray()).to.have.length(32);
      expect(lsc.getCount()).to.be(2);
      expect(lsc.ranges[0]).to.be(6);
      expect(lsc.ranges[6]).to.be(10);
      expect(lsc.dim).to.be(2);
    });

    it('throws an error when dimensions are inconsistent', function() {
      expect(function() {
        var lsc = ol.geom2.LineStringCollection.pack([[[0, 1], [2, 3, 4]]]);
        lsc = lsc; // suppress gjslint warning about unused variable
      }).to.throwException();
    });

    it('throws an error when a line string is too short', function() {
      expect(function() {
        var lsc = ol.geom2.LineStringCollection.pack([[[0, 1]]]);
        lsc = lsc; // suppress gjslint warning about unused variable
      }).to.throwException();
    });

    it('throws an error when the capacity is too small', function() {
      expect(function() {
        var lsc = ol.geom2.LineStringCollection.pack(
            [[[0, 1], [2, 3], [4, 5]], [[6, 7], [8, 9]]], 4);
        lsc = lsc; // suppress gjslint warning about unused variable
      }).to.throwException();
    });

  });

  describe('with an empty instance with spare capacity', function() {

    var lsc;
    beforeEach(function() {
      var buf = new ol.structs.Buffer(new Array(8), 0);
      lsc = new ol.geom2.LineStringCollection(buf);
    });

    describe('add', function() {

      it('adds a line string', function() {
        var offset = lsc.add([[0, 1], [2, 3]]);
        expect(offset).to.be(0);
        expect(lsc.getCount()).to.be(1);
        expect(lsc.ranges[0]).to.be(4);
        expect(lsc.dim).to.be(2);
      });

    });

    describe('getCount', function() {

      it('returns zero', function() {
        expect(lsc.getCount()).to.be(0);
      });

    });

    describe('getExtent', function() {

      it('returns an empty extent', function() {
        expect(ol.extent.isEmpty(lsc.getExtent())).to.be(true);
      });

    });

    describe('getIndices', function() {

      it('returns the expected value', function() {
        expect(lsc.getIndices()).to.be.empty();
      });

    });

    describe('remove', function() {

      it('throws an exception', function() {
        expect(function() {
          lsc.remove(0);
        }).to.throwException();
      });

    });

  });

  describe('with an initial line string', function() {

    var lsc, offset;
    beforeEach(function() {
      var buf = new ol.structs.Buffer(new Array(8), 0);
      lsc = new ol.geom2.LineStringCollection(buf);
      offset = lsc.add([[0, 1], [2, 3]]);
    });

    describe('add', function() {

      it('can add a second line string', function() {
        var offset2 = lsc.add([[4, 5], [6, 7]]);
        expect(offset2).to.be(4);
        expect(lsc.getCount()).to.be(2);
        expect(lsc.ranges[0]).to.be(4);
        expect(lsc.ranges[4]).to.be(8);
        expect(lsc.dim).to.be(2);
      });

    });

    describe('get', function() {

      it('returns the expected line string', function() {
        expect(lsc.get(0)).to.eql([[0, 1], [2, 3]]);
      });

    });

    describe('getCount', function() {

      it('returns the expected value', function() {
        expect(lsc.getCount()).to.be(1);
      });

    });

    describe('getExtent', function() {

      it('returns the expected extent', function() {
        expect(lsc.getExtent()).to.eql([0, 1, 2, 3]);
      });

    });

    describe('getIndices', function() {

      it('returns the expected value', function() {
        expect(lsc.getIndices()).to.arreql([0, 1]);
      });

    });

    describe('remove', function() {

      it('removes the line string', function() {
        lsc.remove(0);
        expect(lsc.getCount()).to.be(0);
      });

    });

    describe('set', function() {

      it('can update the line string in place', function() {
        expect(lsc.set(0, [[4, 5], [6, 7]])).to.be(0);
        expect(lsc.buf.getArray()).to.eql([4, 5, 6, 7, NaN, NaN, NaN, NaN]);
      });

      it('can replace the line string with a shorter one', function() {
        expect(lsc.set(0, [[4, 5]])).to.be(0);
        expect(lsc.buf.getArray()).to.eql([4, 5, NaN, NaN, NaN, NaN, NaN, NaN]);
      });

      it('can replace the line string with a longer one', function() {
        expect(lsc.set(0, [[4, 5], [6, 7], [8, 9], [10, 11]])).to.be(0);
        expect(lsc.buf.getArray()).to.eql([4, 5, 6, 7, 8, 9, 10, 11]);
      });

    });

    describe('unpack', function() {

      it('returns the expected value', function() {
        expect(lsc.unpack()).to.eql([[[0, 1], [2, 3]]]);
      });

    });

  });

  describe('with multiple initial line strings', function() {

    var lsc;
    beforeEach(function() {
      lsc = ol.geom2.LineStringCollection.pack(
          [[[0, 1], [2, 3]], [[4, 5], [6, 7], [8, 9]]], 16);
    });

    describe('get', function() {

      it('returns the expected values', function() {
        expect(lsc.get(0)).to.eql([[0, 1], [2, 3]]);
        expect(lsc.get(4)).to.eql([[4, 5], [6, 7], [8, 9]]);
      });

    });

    describe('getCount', function() {

      it('returns the expected value', function() {
        expect(lsc.getCount()).to.be(2);
      });

    });

    describe('getExtent', function() {

      it('returns the expected value', function() {
        expect(lsc.getExtent()).to.eql([0, 1, 8, 9]);
      });

    });

    describe('getIndices', function() {

      it('returns the expected value', function() {
        expect(lsc.getIndices()).to.arreql([0, 1, 2, 3, 3, 4]);
      });

    });

    describe('remove', function() {

      it('can remove the first line string', function() {
        lsc.remove(0);
        expect(lsc.getCount()).to.be(1);
        expect(lsc.get(4)).to.eql([[4, 5], [6, 7], [8, 9]]);
        expect(lsc.getIndices()).to.arreql([2, 3, 3, 4]);
      });

      it('can remove the second line string', function() {
        lsc.remove(4);
        expect(lsc.getCount()).to.be(1);
        expect(lsc.get(0)).to.eql([[0, 1], [2, 3]]);
        expect(lsc.getIndices()).to.arreql([0, 1]);
      });

    });

    describe('usage examples', function() {

      it('allows the first line string to be replaced', function() {
        lsc.remove(0);
        expect(lsc.getCount()).to.be(1);
        expect(lsc.add([[10, 11], [12, 13]])).to.be(0);
        expect(lsc.getCount()).to.be(2);
        expect(lsc.get(0)).to.eql([[10, 11], [12, 13]]);
      });

      it('will allocate at the end of the array', function() {
        lsc.remove(0);
        expect(lsc.getCount()).to.be(1);
        expect(lsc.add([[10, 11], [12, 13], [14, 15]])).to.be(10);
        expect(lsc.getCount()).to.be(2);
        expect(lsc.get(10)).to.eql([[10, 11], [12, 13], [14, 15]]);
        expect(lsc.getIndices()).to.arreql([2, 3, 3, 4, 5, 6, 6, 7]);
      });

    });

  });

});


goog.require('ol.geom2.LineStringCollection');
goog.require('ol.extent');
goog.require('ol.structs.Buffer');
