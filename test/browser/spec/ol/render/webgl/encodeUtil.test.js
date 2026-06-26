import {assert} from 'chai';
import {unpackColor} from '../../../../../../src/ol/render/webgl/compileUtil.js';
import {
  colorDecodeId,
  colorEncodeIdAndPack,
} from '../../../../../../src/ol/render/webgl/encodeUtil.js';

describe('webgl encode utils', function () {
  describe('colorEncodeIdAndPack and colorDecodeId', function () {
    it('correctly encodes and decodes ids', function () {
      assert.deepEqual(colorDecodeId(unpackColor(colorEncodeIdAndPack(0))), 0);
      assert.deepEqual(colorDecodeId(unpackColor(colorEncodeIdAndPack(1))), 1);
      assert.deepEqual(
        colorDecodeId(unpackColor(colorEncodeIdAndPack(123))),
        123,
      );
      assert.deepEqual(
        colorDecodeId(unpackColor(colorEncodeIdAndPack(12345))),
        12345,
      );
      assert.deepEqual(
        colorDecodeId(unpackColor(colorEncodeIdAndPack(123456))),
        123456,
      );
      assert.deepEqual(
        colorDecodeId(unpackColor(colorEncodeIdAndPack(91612))),
        91612,
      );
      assert.deepEqual(
        colorDecodeId(unpackColor(colorEncodeIdAndPack(1234567890))),
        1234567890,
      );
    });

    it('correctly reuses array', function () {
      const arr = [];
      assert.strictEqual(colorEncodeIdAndPack(123, arr), arr);
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
      assert.deepEqual(decoded, 91612);
    });
  });
});
