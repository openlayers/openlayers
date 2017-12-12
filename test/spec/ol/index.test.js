import {getUid} from '../../../src/ol/index.js';

describe('getUid()', function() {
  it('is constant once generated', function() {
    var a = {};
    expect(getUid(a)).to.be(getUid(a));
  });

  it('generates a strictly increasing sequence', function() {
    var a = {}, b = {}, c = {};
    getUid(a);
    getUid(c);
    getUid(b);

    //uid order should be a < c < b
    expect(getUid(a)).to.be.lessThan(getUid(c));
    expect(getUid(c)).to.be.lessThan(getUid(b));
    expect(getUid(a)).to.be.lessThan(getUid(b));
  });
});
