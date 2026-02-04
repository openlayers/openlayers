import {unpackColor} from '../../../../../../src/ol/render/webgl/compileUtil.js';
import {
  colorDecodeId,
  colorEncodeIdAndPack,
} from '../../../../../../src/ol/render/webgl/encodeUtil.js';

describe('webgl encode utils', function () {
  describe('colorEncodeIdAndPack and colorDecodeId', function () {
    it('correctly encodes and decodes ids', function () {
      expect(colorDecodeId(unpackColor(colorEncodeIdAndPack(0)))).to.eql(0);
      expect(colorDecodeId(unpackColor(colorEncodeIdAndPack(1)))).to.eql(1);
      expect(colorDecodeId(unpackColor(colorEncodeIdAndPack(123)))).to.eql(123);
      expect(colorDecodeId(unpackColor(colorEncodeIdAndPack(12345)))).to.eql(
        12345,
      );
      expect(colorDecodeId(unpackColor(colorEncodeIdAndPack(123456)))).to.eql(
        123456,
      );
      expect(colorDecodeId(unpackColor(colorEncodeIdAndPack(91612)))).to.eql(
        91612,
      );
      expect(
        colorDecodeId(unpackColor(colorEncodeIdAndPack(1234567890))),
      ).to.eql(1234567890);
    });

    it('correctly reuses array', function () {
      const arr = [];
      expect(colorEncodeIdAndPack(123, arr)).to.be(arr);
    });

    it('make sure that the encoded color (once unpacked) is compatible with Uint8Array storage', function () {
      const encoded = colorEncodeIdAndPack(91612);
      const unpackedColor = unpackColor(encoded);
      const typed = Uint8Array.of(
        unpackedColor[0] * 255,
        unpackedColor[1] * 255,
        unpackedColor[2] * 255,
        unpackedColor[3] * 255,
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
