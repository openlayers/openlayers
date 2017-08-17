
goog.require('ol');

describe('getUid()', function() {
  it('is constant once generated', function() {
    var a = {};
    expect(ol.getUid(a)).to.be(ol.getUid(a));
  });

  it('generates a strictly increasing sequence', function() {
    var a = {}, b = {}, c = {};
    ol.getUid(a);
    ol.getUid(c);
    ol.getUid(b);

    //uid order should be a < c < b
    expect(ol.getUid(a)).to.be.lessThan(ol.getUid(c));
    expect(ol.getUid(c)).to.be.lessThan(ol.getUid(b));
    expect(ol.getUid(a)).to.be.lessThan(ol.getUid(b));
  });
});


