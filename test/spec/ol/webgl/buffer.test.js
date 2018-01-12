import _ol_webgl_Buffer_ from '../../../../src/ol/webgl/Buffer.js';


describe('ol.webgl.Buffer', function() {

  describe('constructor', function() {

    describe('without an argument', function() {

      let b;
      beforeEach(function() {
        b = new _ol_webgl_Buffer_();
      });

      it('constructs an empty instance', function() {
        expect(b.getArray()).to.be.empty();
      });

    });

    describe('with a single array argument', function() {

      let b;
      beforeEach(function() {
        b = new _ol_webgl_Buffer_([0, 1, 2, 3]);
      });

      it('constructs a populated instance', function() {
        expect(b.getArray()).to.eql([0, 1, 2, 3]);
      });

    });

  });

  describe('with an empty instance', function() {

    let b;
    beforeEach(function() {
      b = new _ol_webgl_Buffer_();
    });

    describe('getArray', function() {

      it('returns an empty array', function() {
        expect(b.getArray()).to.be.empty();
      });

    });

  });

});
