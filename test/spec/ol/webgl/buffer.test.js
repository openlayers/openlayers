import WebGLArrayBuffer from '../../../../src/ol/webgl/Buffer';


describe('ol.webgl.Buffer', function() {

  describe('constructor', function() {

    describe('without an argument', function() {

      let b;
      beforeEach(function() {
        b = new WebGLArrayBuffer();
      });

      it('constructs an empty instance', function() {
        expect(b.getArray()).to.be.empty();
      });

    });

    describe('with a single array argument', function() {

      let b;
      beforeEach(function() {
        b = new WebGLArrayBuffer([0, 1, 2, 3]);
      });

      it('constructs a populated instance', function() {
        expect(b.getArray()).to.eql([0, 1, 2, 3]);
      });

    });

  });

  describe('with an empty instance', function() {

    let b;
    beforeEach(function() {
      b = new WebGLArrayBuffer();
    });

    describe('getArray', function() {

      it('returns an empty array', function() {
        expect(b.getArray()).to.be.empty();
      });

    });

  });

});
