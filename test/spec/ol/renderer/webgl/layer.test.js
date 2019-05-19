import WebGLLayerRenderer, {
  colorDecodeId,
  colorEncodeId,
  getBlankImageData, POINT_INSTRUCTIONS_COUNT, POINT_VERTEX_STRIDE,
  writePointFeatureInstructions, writePointFeatureToBuffers
} from '../../../../../src/ol/renderer/webgl/Layer.js';
import Layer from '../../../../../src/ol/layer/Layer.js';


describe('ol.renderer.webgl.Layer', function() {

  describe('constructor', function() {

    let target;

    beforeEach(function() {
      target = document.createElement('div');
      target.style.width = '256px';
      target.style.height = '256px';
      document.body.appendChild(target);
    });

    afterEach(function() {
      document.body.removeChild(target);
    });

    it('creates a new instance', function() {
      const layer = new Layer({});
      const renderer = new WebGLLayerRenderer(layer);
      expect(renderer).to.be.a(WebGLLayerRenderer);
    });

  });

  describe('writePointFeatureInstructions', function() {
    let instructions;

    beforeEach(function() {
      instructions = new Float32Array(100);
    });

    it('writes instructions corresponding to the given parameters', function() {
      const baseIndex = 17;
      writePointFeatureInstructions(instructions, baseIndex,
        1, 2, 3, 4, 5, 6,
        7, 8, true, [10, 11, 12, 13]);
      expect(instructions[baseIndex + 0]).to.eql(1);
      expect(instructions[baseIndex + 1]).to.eql(2);
      expect(instructions[baseIndex + 2]).to.eql(3);
      expect(instructions[baseIndex + 3]).to.eql(4);
      expect(instructions[baseIndex + 4]).to.eql(5);
      expect(instructions[baseIndex + 5]).to.eql(6);
      expect(instructions[baseIndex + 6]).to.eql(7);
      expect(instructions[baseIndex + 7]).to.eql(8);
      expect(instructions[baseIndex + 8]).to.eql(1);
      expect(instructions[baseIndex + 9]).to.eql(10);
      expect(instructions[baseIndex + 10]).to.eql(11);
      expect(instructions[baseIndex + 11]).to.eql(12);
      expect(instructions[baseIndex + 12]).to.eql(13);
    });

    it('correctly chains writes', function() {
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
      expect(instructions[baseIndex + 0]).to.eql(1);
      expect(instructions[baseIndex + 1]).to.eql(2);
      expect(instructions[baseIndex + 2]).to.eql(3);
      expect(instructions[baseIndex + 3]).to.eql(4);
      expect(instructions[baseIndex + 4]).to.eql(5);
      expect(instructions[baseIndex + 5]).to.eql(6);
      expect(instructions[baseIndex + 6]).to.eql(7);
      expect(instructions[baseIndex + 7]).to.eql(8);
      expect(instructions[baseIndex + 8]).to.eql(1);
      expect(instructions[baseIndex + 9]).to.eql(10);
      expect(instructions[baseIndex + 10]).to.eql(11);
      expect(instructions[baseIndex + 11]).to.eql(12);
      expect(instructions[baseIndex + 12]).to.eql(13);
    });
  });

  describe('writePointFeatureToBuffers', function() {
    let vertexBuffer, indexBuffer, instructions, elementIndex;

    beforeEach(function() {
      vertexBuffer = new Float32Array(100);
      indexBuffer = new Uint32Array(100);
      instructions = new Float32Array(100);
      elementIndex = 3;

      writePointFeatureInstructions(instructions, elementIndex,
        1, 2, 3, 4, 5, 6,
        7, 8, true, [10, 11, 12, 13]);
    });

    it('writes correctly to the buffers (without custom attributes)', function() {
      const stride = POINT_VERTEX_STRIDE;
      const positions = writePointFeatureToBuffers(instructions, elementIndex, vertexBuffer, indexBuffer);

      expect(vertexBuffer[0]).to.eql(1);
      expect(vertexBuffer[1]).to.eql(2);
      expect(vertexBuffer[2]).to.eql(-3.5);
      expect(vertexBuffer[3]).to.eql(-3.5);
      expect(vertexBuffer[4]).to.eql(3);
      expect(vertexBuffer[5]).to.eql(4);
      expect(vertexBuffer[6]).to.eql(8);
      expect(vertexBuffer[7]).to.eql(1);
      expect(vertexBuffer[8]).to.eql(10);
      expect(vertexBuffer[9]).to.eql(11);
      expect(vertexBuffer[10]).to.eql(12);
      expect(vertexBuffer[11]).to.eql(13);

      expect(vertexBuffer[stride + 0]).to.eql(1);
      expect(vertexBuffer[stride + 1]).to.eql(2);
      expect(vertexBuffer[stride + 2]).to.eql(+3.5);
      expect(vertexBuffer[stride + 3]).to.eql(-3.5);
      expect(vertexBuffer[stride + 4]).to.eql(5);
      expect(vertexBuffer[stride + 5]).to.eql(4);

      expect(vertexBuffer[stride * 2 + 0]).to.eql(1);
      expect(vertexBuffer[stride * 2 + 1]).to.eql(2);
      expect(vertexBuffer[stride * 2 + 2]).to.eql(+3.5);
      expect(vertexBuffer[stride * 2 + 3]).to.eql(+3.5);
      expect(vertexBuffer[stride * 2 + 4]).to.eql(5);
      expect(vertexBuffer[stride * 2 + 5]).to.eql(6);

      expect(vertexBuffer[stride * 3 + 0]).to.eql(1);
      expect(vertexBuffer[stride * 3 + 1]).to.eql(2);
      expect(vertexBuffer[stride * 3 + 2]).to.eql(-3.5);
      expect(vertexBuffer[stride * 3 + 3]).to.eql(+3.5);
      expect(vertexBuffer[stride * 3 + 4]).to.eql(3);
      expect(vertexBuffer[stride * 3 + 5]).to.eql(6);

      expect(indexBuffer[0]).to.eql(0);
      expect(indexBuffer[1]).to.eql(1);
      expect(indexBuffer[2]).to.eql(3);
      expect(indexBuffer[3]).to.eql(1);
      expect(indexBuffer[4]).to.eql(2);
      expect(indexBuffer[5]).to.eql(3);

      expect(positions.indexPosition).to.eql(6);
      expect(positions.vertexPosition).to.eql(stride * 4);
    });

    it('writes correctly to the buffers (with custom attributes)', function() {
      instructions[elementIndex + POINT_INSTRUCTIONS_COUNT] = 101;
      instructions[elementIndex + POINT_INSTRUCTIONS_COUNT + 1] = 102;
      instructions[elementIndex + POINT_INSTRUCTIONS_COUNT + 2] = 103;

      const stride = POINT_VERTEX_STRIDE + 3;
      const positions = writePointFeatureToBuffers(instructions, elementIndex, vertexBuffer, indexBuffer,
        undefined, POINT_INSTRUCTIONS_COUNT + 3);

      expect(vertexBuffer[0]).to.eql(1);
      expect(vertexBuffer[1]).to.eql(2);
      expect(vertexBuffer[2]).to.eql(-3.5);
      expect(vertexBuffer[3]).to.eql(-3.5);
      expect(vertexBuffer[4]).to.eql(3);
      expect(vertexBuffer[5]).to.eql(4);
      expect(vertexBuffer[6]).to.eql(8);
      expect(vertexBuffer[7]).to.eql(1);
      expect(vertexBuffer[8]).to.eql(10);
      expect(vertexBuffer[9]).to.eql(11);
      expect(vertexBuffer[10]).to.eql(12);
      expect(vertexBuffer[11]).to.eql(13);

      expect(vertexBuffer[12]).to.eql(101);
      expect(vertexBuffer[13]).to.eql(102);
      expect(vertexBuffer[14]).to.eql(103);

      expect(vertexBuffer[stride + 12]).to.eql(101);
      expect(vertexBuffer[stride + 13]).to.eql(102);
      expect(vertexBuffer[stride + 14]).to.eql(103);

      expect(vertexBuffer[stride * 2 + 12]).to.eql(101);
      expect(vertexBuffer[stride * 2 + 13]).to.eql(102);
      expect(vertexBuffer[stride * 2 + 14]).to.eql(103);

      expect(vertexBuffer[stride * 3 + 12]).to.eql(101);
      expect(vertexBuffer[stride * 3 + 13]).to.eql(102);
      expect(vertexBuffer[stride * 3 + 14]).to.eql(103);

      expect(indexBuffer[0]).to.eql(0);
      expect(indexBuffer[1]).to.eql(1);
      expect(indexBuffer[2]).to.eql(3);
      expect(indexBuffer[3]).to.eql(1);
      expect(indexBuffer[4]).to.eql(2);
      expect(indexBuffer[5]).to.eql(3);

      expect(positions.indexPosition).to.eql(6);
      expect(positions.vertexPosition).to.eql(stride * 4);
    });

    it('correctly chains buffer writes', function() {
      const stride = POINT_VERTEX_STRIDE;
      let positions = writePointFeatureToBuffers(instructions, elementIndex, vertexBuffer, indexBuffer);
      positions = writePointFeatureToBuffers(instructions, elementIndex, vertexBuffer, indexBuffer, positions);
      positions = writePointFeatureToBuffers(instructions, elementIndex, vertexBuffer, indexBuffer, positions);

      expect(vertexBuffer[0]).to.eql(1);
      expect(vertexBuffer[1]).to.eql(2);
      expect(vertexBuffer[2]).to.eql(-3.5);
      expect(vertexBuffer[3]).to.eql(-3.5);

      expect(vertexBuffer[stride * 4 + 0]).to.eql(1);
      expect(vertexBuffer[stride * 4 + 1]).to.eql(2);
      expect(vertexBuffer[stride * 4 + 2]).to.eql(-3.5);
      expect(vertexBuffer[stride * 4 + 3]).to.eql(-3.5);

      expect(vertexBuffer[stride * 8 + 0]).to.eql(1);
      expect(vertexBuffer[stride * 8 + 1]).to.eql(2);
      expect(vertexBuffer[stride * 8 + 2]).to.eql(-3.5);
      expect(vertexBuffer[stride * 8 + 3]).to.eql(-3.5);

      expect(indexBuffer[6 + 0]).to.eql(4);
      expect(indexBuffer[6 + 1]).to.eql(5);
      expect(indexBuffer[6 + 2]).to.eql(7);
      expect(indexBuffer[6 + 3]).to.eql(5);
      expect(indexBuffer[6 + 4]).to.eql(6);
      expect(indexBuffer[6 + 5]).to.eql(7);

      expect(indexBuffer[6 * 2 + 0]).to.eql(8);
      expect(indexBuffer[6 * 2 + 1]).to.eql(9);
      expect(indexBuffer[6 * 2 + 2]).to.eql(11);
      expect(indexBuffer[6 * 2 + 3]).to.eql(9);
      expect(indexBuffer[6 * 2 + 4]).to.eql(10);
      expect(indexBuffer[6 * 2 + 5]).to.eql(11);

      expect(positions.indexPosition).to.eql(6 * 3);
      expect(positions.vertexPosition).to.eql(stride * 4 * 3);
    });

  });

  describe('getBlankImageData', function() {
    it('creates a 1x1 white texture', function() {
      const texture = getBlankImageData();
      expect(texture.height).to.eql(1);
      expect(texture.width).to.eql(1);
      expect(texture.data[0]).to.eql(255);
      expect(texture.data[1]).to.eql(255);
      expect(texture.data[2]).to.eql(255);
      expect(texture.data[3]).to.eql(255);
    });
  });

  describe('colorEncodeId and colorDecodeId', function() {
    it('correctly encodes and decodes ids', function() {
      expect(colorDecodeId(colorEncodeId(0))).to.eql(0);
      expect(colorDecodeId(colorEncodeId(1))).to.eql(1);
      expect(colorDecodeId(colorEncodeId(123))).to.eql(123);
      expect(colorDecodeId(colorEncodeId(12345))).to.eql(12345);
      expect(colorDecodeId(colorEncodeId(123456))).to.eql(123456);
      expect(colorDecodeId(colorEncodeId(91612))).to.eql(91612);
      expect(colorDecodeId(colorEncodeId(1234567890))).to.eql(1234567890);
    });

    it('correctly reuses array', function() {
      const arr = [];
      expect(colorEncodeId(123, arr)).to.be(arr);
    });

    it('is compatible with Uint8Array storage', function() {
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
      expect(decoded).to.eql(91612);
    });
  });

});
