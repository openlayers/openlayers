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

    describe('getArray', function() {

      it('returns an empty array', function() {
        expect(b.getArray()).to.be.empty();
      });

    });

  });

});

goog.require('ol.structs.Buffer');
