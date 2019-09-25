import WebGLLayerRenderer, {
  colorDecodeId,
  colorEncodeId,
  getBlankImageData, POINT_INSTRUCTIONS_COUNT, POINT_VERTEX_STRIDE,
  writePointFeatureInstructions, writePointFeatureToBuffers
} from '../../../../../src/ol/renderer/webgl/Layer.js';
import Layer from '../../../../../src/ol/layer/Layer.js';


describe('ol.renderer.webgl.Layer', () => {

  describe('constructor', () => {

    let target;

    beforeEach(() => {
      target = document.createElement('div');
      target.style.width = '256px';
      target.style.height = '256px';
      document.body.appendChild(target);
    });

    afterEach(() => {
      document.body.removeChild(target);
    });

    test('creates a new instance', () => {
      const layer = new Layer({});
      const renderer = new WebGLLayerRenderer(layer);
      expect(renderer).toBeInstanceOf(WebGLLayerRenderer);
    });

  });

  describe('writePointFeatureInstructions', () => {
    let instructions;

    beforeEach(() => {
      instructions = new Float32Array(100);
    });

    test('writes instructions corresponding to the given parameters', () => {
      const baseIndex = 17;
      writePointFeatureInstructions(instructions, baseIndex,
        1, 2, 3, 4, 5, 6,
        7, 8, true, [10, 11, 12, 13]);
      expect(instructions[baseIndex + 0]).toEqual(1);
      expect(instructions[baseIndex + 1]).toEqual(2);
      expect(instructions[baseIndex + 2]).toEqual(3);
      expect(instructions[baseIndex + 3]).toEqual(4);
      expect(instructions[baseIndex + 4]).toEqual(5);
      expect(instructions[baseIndex + 5]).toEqual(6);
      expect(instructions[baseIndex + 6]).toEqual(7);
      expect(instructions[baseIndex + 7]).toEqual(8);
      expect(instructions[baseIndex + 8]).toEqual(1);
      expect(instructions[baseIndex + 9]).toEqual(10);
      expect(instructions[baseIndex + 10]).toEqual(11);
      expect(instructions[baseIndex + 11]).toEqual(12);
      expect(instructions[baseIndex + 12]).toEqual(13);
    });

    test('correctly chains writes', () => {
      let baseIndex = 0;
      baseIndex = writePointFeatureInstructions(instructions, baseIndex,
        1, 2, 3, 4, 5, 6,
        7, 8, true, [10, 11, 12, 13]);
      baseIndex = writePointFeatureInstructions(instructions, baseIndex,
        1, 2, 3, 4, 5, 6,
        7, 8, true, [10, 11, 12, 13]);
      writePointFeatureInstructions(instructions, baseIndex,
        1, 2, 3, 4, 5, 6,
        7, 8, true, [10, 11, 12, 13]);
      expect(instructions[baseIndex + 0]).toEqual(1);
      expect(instructions[baseIndex + 1]).toEqual(2);
      expect(instructions[baseIndex + 2]).toEqual(3);
      expect(instructions[baseIndex + 3]).toEqual(4);
      expect(instructions[baseIndex + 4]).toEqual(5);
      expect(instructions[baseIndex + 5]).toEqual(6);
      expect(instructions[baseIndex + 6]).toEqual(7);
      expect(instructions[baseIndex + 7]).toEqual(8);
      expect(instructions[baseIndex + 8]).toEqual(1);
      expect(instructions[baseIndex + 9]).toEqual(10);
      expect(instructions[baseIndex + 10]).toEqual(11);
      expect(instructions[baseIndex + 11]).toEqual(12);
      expect(instructions[baseIndex + 12]).toEqual(13);
    });
  });

  describe('writePointFeatureToBuffers', () => {
    let vertexBuffer, indexBuffer, instructions, elementIndex;

    beforeEach(() => {
      vertexBuffer = new Float32Array(100);
      indexBuffer = new Uint32Array(100);
      instructions = new Float32Array(100);
      elementIndex = 3;

      writePointFeatureInstructions(instructions, elementIndex,
        1, 2, 3, 4, 5, 6,
        7, 8, true, [10, 11, 12, 13]);
    });

    test(
      'writes correctly to the buffers (without custom attributes)',
      () => {
        const stride = POINT_VERTEX_STRIDE;
        const positions = writePointFeatureToBuffers(instructions, elementIndex, vertexBuffer, indexBuffer);

        expect(vertexBuffer[0]).toEqual(1);
        expect(vertexBuffer[1]).toEqual(2);
        expect(vertexBuffer[2]).toEqual(-3.5);
        expect(vertexBuffer[3]).toEqual(-3.5);
        expect(vertexBuffer[4]).toEqual(3);
        expect(vertexBuffer[5]).toEqual(4);
        expect(vertexBuffer[6]).toEqual(8);
        expect(vertexBuffer[7]).toEqual(1);
        expect(vertexBuffer[8]).toEqual(10);
        expect(vertexBuffer[9]).toEqual(11);
        expect(vertexBuffer[10]).toEqual(12);
        expect(vertexBuffer[11]).toEqual(13);

        expect(vertexBuffer[stride + 0]).toEqual(1);
        expect(vertexBuffer[stride + 1]).toEqual(2);
        expect(vertexBuffer[stride + 2]).toEqual(+3.5);
        expect(vertexBuffer[stride + 3]).toEqual(-3.5);
        expect(vertexBuffer[stride + 4]).toEqual(5);
        expect(vertexBuffer[stride + 5]).toEqual(4);

        expect(vertexBuffer[stride * 2 + 0]).toEqual(1);
        expect(vertexBuffer[stride * 2 + 1]).toEqual(2);
        expect(vertexBuffer[stride * 2 + 2]).toEqual(+3.5);
        expect(vertexBuffer[stride * 2 + 3]).toEqual(+3.5);
        expect(vertexBuffer[stride * 2 + 4]).toEqual(5);
        expect(vertexBuffer[stride * 2 + 5]).toEqual(6);

        expect(vertexBuffer[stride * 3 + 0]).toEqual(1);
        expect(vertexBuffer[stride * 3 + 1]).toEqual(2);
        expect(vertexBuffer[stride * 3 + 2]).toEqual(-3.5);
        expect(vertexBuffer[stride * 3 + 3]).toEqual(+3.5);
        expect(vertexBuffer[stride * 3 + 4]).toEqual(3);
        expect(vertexBuffer[stride * 3 + 5]).toEqual(6);

        expect(indexBuffer[0]).toEqual(0);
        expect(indexBuffer[1]).toEqual(1);
        expect(indexBuffer[2]).toEqual(3);
        expect(indexBuffer[3]).toEqual(1);
        expect(indexBuffer[4]).toEqual(2);
        expect(indexBuffer[5]).toEqual(3);

        expect(positions.indexPosition).toEqual(6);
        expect(positions.vertexPosition).toEqual(stride * 4);
      }
    );

    test('writes correctly to the buffers (with custom attributes)', () => {
      instructions[elementIndex + POINT_INSTRUCTIONS_COUNT] = 101;
      instructions[elementIndex + POINT_INSTRUCTIONS_COUNT + 1] = 102;
      instructions[elementIndex + POINT_INSTRUCTIONS_COUNT + 2] = 103;

      const stride = POINT_VERTEX_STRIDE + 3;
      const positions = writePointFeatureToBuffers(instructions, elementIndex, vertexBuffer, indexBuffer,
        undefined, POINT_INSTRUCTIONS_COUNT + 3);

      expect(vertexBuffer[0]).toEqual(1);
      expect(vertexBuffer[1]).toEqual(2);
      expect(vertexBuffer[2]).toEqual(-3.5);
      expect(vertexBuffer[3]).toEqual(-3.5);
      expect(vertexBuffer[4]).toEqual(3);
      expect(vertexBuffer[5]).toEqual(4);
      expect(vertexBuffer[6]).toEqual(8);
      expect(vertexBuffer[7]).toEqual(1);
      expect(vertexBuffer[8]).toEqual(10);
      expect(vertexBuffer[9]).toEqual(11);
      expect(vertexBuffer[10]).toEqual(12);
      expect(vertexBuffer[11]).toEqual(13);

      expect(vertexBuffer[12]).toEqual(101);
      expect(vertexBuffer[13]).toEqual(102);
      expect(vertexBuffer[14]).toEqual(103);

      expect(vertexBuffer[stride + 12]).toEqual(101);
      expect(vertexBuffer[stride + 13]).toEqual(102);
      expect(vertexBuffer[stride + 14]).toEqual(103);

      expect(vertexBuffer[stride * 2 + 12]).toEqual(101);
      expect(vertexBuffer[stride * 2 + 13]).toEqual(102);
      expect(vertexBuffer[stride * 2 + 14]).toEqual(103);

      expect(vertexBuffer[stride * 3 + 12]).toEqual(101);
      expect(vertexBuffer[stride * 3 + 13]).toEqual(102);
      expect(vertexBuffer[stride * 3 + 14]).toEqual(103);

      expect(indexBuffer[0]).toEqual(0);
      expect(indexBuffer[1]).toEqual(1);
      expect(indexBuffer[2]).toEqual(3);
      expect(indexBuffer[3]).toEqual(1);
      expect(indexBuffer[4]).toEqual(2);
      expect(indexBuffer[5]).toEqual(3);

      expect(positions.indexPosition).toEqual(6);
      expect(positions.vertexPosition).toEqual(stride * 4);
    });

    test('correctly chains buffer writes', () => {
      const stride = POINT_VERTEX_STRIDE;
      let positions = writePointFeatureToBuffers(instructions, elementIndex, vertexBuffer, indexBuffer);
      positions = writePointFeatureToBuffers(instructions, elementIndex, vertexBuffer, indexBuffer, positions);
      positions = writePointFeatureToBuffers(instructions, elementIndex, vertexBuffer, indexBuffer, positions);

      expect(vertexBuffer[0]).toEqual(1);
      expect(vertexBuffer[1]).toEqual(2);
      expect(vertexBuffer[2]).toEqual(-3.5);
      expect(vertexBuffer[3]).toEqual(-3.5);

      expect(vertexBuffer[stride * 4 + 0]).toEqual(1);
      expect(vertexBuffer[stride * 4 + 1]).toEqual(2);
      expect(vertexBuffer[stride * 4 + 2]).toEqual(-3.5);
      expect(vertexBuffer[stride * 4 + 3]).toEqual(-3.5);

      expect(vertexBuffer[stride * 8 + 0]).toEqual(1);
      expect(vertexBuffer[stride * 8 + 1]).toEqual(2);
      expect(vertexBuffer[stride * 8 + 2]).toEqual(-3.5);
      expect(vertexBuffer[stride * 8 + 3]).toEqual(-3.5);

      expect(indexBuffer[6 + 0]).toEqual(4);
      expect(indexBuffer[6 + 1]).toEqual(5);
      expect(indexBuffer[6 + 2]).toEqual(7);
      expect(indexBuffer[6 + 3]).toEqual(5);
      expect(indexBuffer[6 + 4]).toEqual(6);
      expect(indexBuffer[6 + 5]).toEqual(7);

      expect(indexBuffer[6 * 2 + 0]).toEqual(8);
      expect(indexBuffer[6 * 2 + 1]).toEqual(9);
      expect(indexBuffer[6 * 2 + 2]).toEqual(11);
      expect(indexBuffer[6 * 2 + 3]).toEqual(9);
      expect(indexBuffer[6 * 2 + 4]).toEqual(10);
      expect(indexBuffer[6 * 2 + 5]).toEqual(11);

      expect(positions.indexPosition).toEqual(6 * 3);
      expect(positions.vertexPosition).toEqual(stride * 4 * 3);
    });

  });

  describe('getBlankImageData', () => {
    test('creates a 1x1 white texture', () => {
      const texture = getBlankImageData();
      expect(texture.height).toEqual(1);
      expect(texture.width).toEqual(1);
      expect(texture.data[0]).toEqual(255);
      expect(texture.data[1]).toEqual(255);
      expect(texture.data[2]).toEqual(255);
      expect(texture.data[3]).toEqual(255);
    });
  });

  describe('colorEncodeId and colorDecodeId', () => {
    test('correctly encodes and decodes ids', () => {
      expect(colorDecodeId(colorEncodeId(0))).toEqual(0);
      expect(colorDecodeId(colorEncodeId(1))).toEqual(1);
      expect(colorDecodeId(colorEncodeId(123))).toEqual(123);
      expect(colorDecodeId(colorEncodeId(12345))).toEqual(12345);
      expect(colorDecodeId(colorEncodeId(123456))).toEqual(123456);
      expect(colorDecodeId(colorEncodeId(91612))).toEqual(91612);
      expect(colorDecodeId(colorEncodeId(1234567890))).toEqual(1234567890);
    });

    test('correctly reuses array', () => {
      const arr = [];
      expect(colorEncodeId(123, arr)).toBe(arr);
    });

    test('is compatible with Uint8Array storage', () => {
      const encoded = colorEncodeId(91612);
      const typed = Uint8Array.of(encoded[0] * 255, encoded[1] * 255,
        encoded[2] * 255, encoded[3] * 255);
      const arr = [
        typed[0] / 255,
        typed[1] / 255,
        typed[2] / 255,
        typed[3] / 255
      ];
      const decoded = colorDecodeId(arr);
      expect(decoded).toEqual(91612);
    });
  });

});
