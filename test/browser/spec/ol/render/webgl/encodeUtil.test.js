import {
  colorDecodeId,
  colorEncodeId,
} from '../../../../../../src/ol/render/webgl/encodeUtil.js';

describe('webgl encode utils', function () {
  describe('colorEncodeId and colorDecodeId', function () {
    it('correctly encodes and decodes ids', function () {
      expect(colorDecodeId(colorEncodeId(0))).to.eql(0);
      expect(colorDecodeId(colorEncodeId(1))).to.eql(1);
      expect(colorDecodeId(colorEncodeId(123))).to.eql(123);
      expect(colorDecodeId(colorEncodeId(12345))).to.eql(12345);
      expect(colorDecodeId(colorEncodeId(123456))).to.eql(123456);
      expect(colorDecodeId(colorEncodeId(91612))).to.eql(91612);
      expect(colorDecodeId(colorEncodeId(1234567890))).to.eql(1234567890);
    });

    it('correctly reuses array', function () {
      const arr = [];
      expect(colorEncodeId(123, arr)).to.be(arr);
    });

    it('is compatible with Uint8Array storage', function () {
      const encoded = colorEncodeId(91612);
      const typed = Uint8Array.of(
        encoded[0] * 255,
        encoded[1] * 255,
        encoded[2] * 255,
        encoded[3] * 255,
      );
      const arr = [
        typed[0] / 255,
        typed[1] / 255,
        typed[2] / 255,
        typed[3] / 255,
      ];
      const decoded = colorDecodeId(arr);
      expect(decoded).to.eql(91612);
    });
  });
});
