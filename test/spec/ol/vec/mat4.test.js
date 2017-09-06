

import _ol_vec_Mat4_ from '../../../../src/ol/vec/mat4';


describe('ol.vec.Mat4', function() {

  describe('ol.vec.Mat4.create()', function() {
    it('returns the expected matrix', function() {
      expect(_ol_vec_Mat4_.create()).to.eql(
          [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
    });
  });

  describe('ol.vec.Mat4.fromTransform()', function() {
    it('sets the expected transform on the matrix', function() {
      var transform = [1, 2, 3, 4, 5, 6];
      var result = _ol_vec_Mat4_.create();
      expect(_ol_vec_Mat4_.fromTransform(result, transform)).to.eql(
          [1, 2, 0, 0, 3, 4, 0, 0, 0, 0, 1, 0, 5, 6, 0, 1]);
      expect(result).to.eql(
          [1, 2, 0, 0, 3, 4, 0, 0, 0, 0, 1, 0, 5, 6, 0, 1]);
    });
  });

});
