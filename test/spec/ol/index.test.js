
import _ol_ from '../../../src/ol';

describe('getUid()', function() {
  it('is constant once generated', function() {
    var a = {};
    expect(_ol_.getUid(a)).to.be(_ol_.getUid(a));
  });

  it('generates a strictly increasing sequence', function() {
    var a = {}, b = {}, c = {};
    _ol_.getUid(a);
    _ol_.getUid(c);
    _ol_.getUid(b);

    //uid order should be a < c < b
    expect(_ol_.getUid(a)).to.be.lessThan(_ol_.getUid(c));
    expect(_ol_.getUid(c)).to.be.lessThan(_ol_.getUid(b));
    expect(_ol_.getUid(a)).to.be.lessThan(_ol_.getUid(b));
  });
});


