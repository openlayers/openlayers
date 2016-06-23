goog.provide('ol.test.transform');

describe('ol.transform', function() {

  function assertRoughlyEqual(t1, t2) {
    t1.forEach(function(item, index) {
      expect(item).to.roughlyEqual(t2[index], 1e-8);
    });
  }

  describe('ol.transform.create()', function() {
    it('creates an identity transform', function() {
      expect(ol.transform.create()).to.eql([1, 0, 0, 1, 0, 0]);
    });
  });

  describe('ol.transform.reset()', function() {
    it('resets tansform to an identity transform', function() {
      var transform = [1, 2, 3, 4, 5, 6];
      expect(ol.transform.reset(transform)).to.eql([1, 0, 0, 1, 0, 0]);
      expect(transform).to.eql([1, 0, 0, 1, 0, 0]);
    });
  });

  describe('ol.transform.set()', function() {
    it('sets the given values', function() {
      var transform = ol.transform.create();
      expect(ol.transform.set(transform, 1, 2, 3, 4, 5, 6)).to.eql([1, 2, 3, 4, 5, 6]);
      expect(transform).to.eql([1, 2, 3, 4, 5, 6]);
    });
  });

  describe('ol.transform.setFromArray()', function() {
    it('sets values of 2nd transform on 1st transform', function() {
      var transform1 = ol.transform.create();
      var transform2 = [1, 2, 3, 4, 5, 6];
      expect(ol.transform.setFromArray(transform1, transform2)).to.eql(transform2);
      expect(transform1).to.eql(transform2);
    });
  });

  describe('ol.transform.translate()', function() {
    var transform = ol.transform.create();
    expect(ol.transform.translate(transform, 3, 4)).to.eql([1, 0, 0, 1, 3, 4]);
    expect(transform).to.eql([1, 0, 0, 1, 3, 4]);
  });

  describe('ol.transform.scale()', function() {
    var transform = ol.transform.create();
    expect(ol.transform.scale(transform, 3, 4)).to.eql([3, 0, 0, 4, 0, 0]);
    expect(transform).to.eql([3, 0, 0, 4, 0, 0]);
  });

  describe('ol.transform.rotate()', function() {
    var transform = ol.transform.create();
    assertRoughlyEqual(ol.transform.rotate(transform, Math.PI / 2), [0, 1, -1, 0, 0, 0]);
    assertRoughlyEqual(transform, [0, 1, -1, 0, 0, 0]);
  });

  describe('ol.transform.multiply()', function() {
    var transform1 = [1, 2, 1, 2, 1, 2];
    var transform2 = [1, 2, 1, 2, 1, 2];
    expect(ol.transform.multiply(transform1, transform2)).to.eql([3, 6, 3, 6, 4, 8]);
    expect(transform1).to.eql([3, 6, 3, 6, 4, 8]);
  });

  describe('ol.transform.invert()', function() {
    var transform = [1, 0, 1, 0, 1, 0];
    expect(function() {
      ol.transform.invert(transform);
    }).to.throwException();
    transform = [1, 1, 1, 2, 2, 0];
    expect(ol.transform.invert(transform)).to.eql([2, -1, -1, 1, -4, 2]);
    expect(transform).to.eql([2, -1, -1, 1, -4, 2]);
  });

  describe('ol.transform.apply()', function() {
    var transform = ol.transform.translate(ol.transform.create(), 2, 3);
    var point = [1, 2];
    expect(ol.transform.apply(transform, point)).to.eql([3, 5]);
    expect(point).to.eql([3, 5]);
  });

});

goog.require('ol.transform');
