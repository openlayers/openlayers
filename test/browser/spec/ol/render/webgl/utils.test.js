import {
  colorDecodeId,
  colorEncodeId,
  getBlankImageData,
  writeLineSegmentToBuffers,
  writePointFeatureToBuffers,
  writePolygonTrianglesToBuffers,
} from '../../../../../../src/ol/render/webgl/utils.js';
import {
  compose as composeTransform,
  create as createTransform,
  makeInverse as makeInverseTransform,
} from '../../../../../../src/ol/transform.js';

describe('webgl render utils', function () {
  describe('writePointFeatureToBuffers', function () {
    let vertexBuffer, indexBuffer, instructions;

    beforeEach(function () {
      vertexBuffer = new Float32Array(100);
      indexBuffer = new Uint32Array(100);
      instructions = new Float32Array(100);

      instructions.set([0, 0, 0, 0, 10, 11]);
    });

    it('writes correctly to the buffers (without custom attributes)', function () {
      const stride = 3;
      const positions = writePointFeatureToBuffers(
        instructions,
        4,
        vertexBuffer,
        indexBuffer,
        0
      );

      expect(vertexBuffer[0]).to.eql(10);
      expect(vertexBuffer[1]).to.eql(11);
      expect(vertexBuffer[2]).to.eql(0);

      expect(vertexBuffer[stride + 0]).to.eql(10);
      expect(vertexBuffer[stride + 1]).to.eql(11);
      expect(vertexBuffer[stride + 2]).to.eql(1);

      expect(vertexBuffer[stride * 2 + 0]).to.eql(10);
      expect(vertexBuffer[stride * 2 + 1]).to.eql(11);
      expect(vertexBuffer[stride * 2 + 2]).to.eql(2);

      expect(vertexBuffer[stride * 3 + 0]).to.eql(10);
      expect(vertexBuffer[stride * 3 + 1]).to.eql(11);
      expect(vertexBuffer[stride * 3 + 2]).to.eql(3);

      expect(indexBuffer[0]).to.eql(0);
      expect(indexBuffer[1]).to.eql(1);
      expect(indexBuffer[2]).to.eql(3);
      expect(indexBuffer[3]).to.eql(1);
      expect(indexBuffer[4]).to.eql(2);
      expect(indexBuffer[5]).to.eql(3);

      expect(positions.indexPosition).to.eql(6);
      expect(positions.vertexPosition).to.eql(stride * 4);
    });

    it('writes correctly to the buffers (with 2 custom attributes)', function () {
      instructions.set([0, 0, 0, 0, 0, 0, 0, 0, 10, 11, 12, 13]);
      const stride = 5;
      const positions = writePointFeatureToBuffers(
        instructions,
        8,
        vertexBuffer,
        indexBuffer,
        2
      );

      expect(vertexBuffer[0]).to.eql(10);
      expect(vertexBuffer[1]).to.eql(11);
      expect(vertexBuffer[2]).to.eql(0);
      expect(vertexBuffer[3]).to.eql(12);
      expect(vertexBuffer[4]).to.eql(13);

      expect(vertexBuffer[stride + 0]).to.eql(10);
      expect(vertexBuffer[stride + 1]).to.eql(11);
      expect(vertexBuffer[stride + 2]).to.eql(1);
      expect(vertexBuffer[stride + 3]).to.eql(12);
      expect(vertexBuffer[stride + 4]).to.eql(13);

      expect(vertexBuffer[stride * 2 + 0]).to.eql(10);
      expect(vertexBuffer[stride * 2 + 1]).to.eql(11);
      expect(vertexBuffer[stride * 2 + 2]).to.eql(2);
      expect(vertexBuffer[stride * 2 + 3]).to.eql(12);
      expect(vertexBuffer[stride * 2 + 4]).to.eql(13);

      expect(vertexBuffer[stride * 3 + 0]).to.eql(10);
      expect(vertexBuffer[stride * 3 + 1]).to.eql(11);
      expect(vertexBuffer[stride * 3 + 2]).to.eql(3);
      expect(vertexBuffer[stride * 3 + 3]).to.eql(12);
      expect(vertexBuffer[stride * 3 + 4]).to.eql(13);

      expect(indexBuffer[0]).to.eql(0);
      expect(indexBuffer[1]).to.eql(1);
      expect(indexBuffer[2]).to.eql(3);
      expect(indexBuffer[3]).to.eql(1);
      expect(indexBuffer[4]).to.eql(2);
      expect(indexBuffer[5]).to.eql(3);

      expect(positions.indexPosition).to.eql(6);
      expect(positions.vertexPosition).to.eql(stride * 4);
    });

    it('correctly chains buffer writes', function () {
      instructions.set([10, 11, 20, 21, 30, 31]);
      const stride = 3;
      let positions = writePointFeatureToBuffers(
        instructions,
        0,
        vertexBuffer,
        indexBuffer,
        0
      );
      positions = writePointFeatureToBuffers(
        instructions,
        2,
        vertexBuffer,
        indexBuffer,
        0,
        positions
      );
      positions = writePointFeatureToBuffers(
        instructions,
        4,
        vertexBuffer,
        indexBuffer,
        0,
        positions
      );

      expect(vertexBuffer[0]).to.eql(10);
      expect(vertexBuffer[1]).to.eql(11);
      expect(vertexBuffer[2]).to.eql(0);

      expect(vertexBuffer[stride * 4 + 0]).to.eql(20);
      expect(vertexBuffer[stride * 4 + 1]).to.eql(21);
      expect(vertexBuffer[stride * 4 + 2]).to.eql(0);

      expect(vertexBuffer[stride * 8 + 0]).to.eql(30);
      expect(vertexBuffer[stride * 8 + 1]).to.eql(31);
      expect(vertexBuffer[stride * 8 + 2]).to.eql(0);

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

  describe('writeLineSegmentToBuffers', function () {
    let vertexArray, indexArray, instructions;
    let instructionsTransform, invertInstructionsTransform;

    beforeEach(function () {
      vertexArray = [];
      indexArray = [];

      instructions = new Float32Array(100);

      instructionsTransform = createTransform();
      invertInstructionsTransform = createTransform();
      composeTransform(instructionsTransform, 0, 0, 10, 20, 0, -50, 200);
      makeInverseTransform(invertInstructionsTransform, instructionsTransform);
    });

    describe('isolated segment', function () {
      beforeEach(function () {
        instructions.set([0, 0, 0, 2, 5, 5, 25, 5]);
        writeLineSegmentToBuffers(
          instructions,
          4,
          6,
          null,
          null,
          vertexArray,
          indexArray,
          [],
          instructionsTransform,
          invertInstructionsTransform
        );
      });
      it('generates a quad for the segment', function () {
        expect(vertexArray).to.have.length(20);
        expect(vertexArray).to.eql([
          5, 5, 25, 5, 0, 5, 5, 25, 5, 100000000, 5, 5, 25, 5, 200000000, 5, 5,
          25, 5, 300000000,
        ]);
        expect(indexArray).to.have.length(6);
        expect(indexArray).to.eql([0, 1, 2, 1, 3, 2]);
      });
    });

    describe('isolated segment with custom attributes', function () {
      beforeEach(function () {
        instructions.set([888, 999, 2, 5, 5, 25, 5]);
        writeLineSegmentToBuffers(
          instructions,
          3,
          5,
          null,
          null,
          vertexArray,
          indexArray,
          [888, 999],
          instructionsTransform,
          invertInstructionsTransform
        );
      });
      it('adds custom attributes in the vertices buffer', function () {
        expect(vertexArray).to.have.length(28);
        expect(vertexArray).to.eql([
          5, 5, 25, 5, 0, 888, 999, 5, 5, 25, 5, 100000000, 888, 999, 5, 5, 25,
          5, 200000000, 888, 999, 5, 5, 25, 5, 300000000, 888, 999,
        ]);
      });
      it('does not impact indices array', function () {
        expect(indexArray).to.have.length(6);
      });
    });

    describe('segment with a point coming before it, join angle < PI', function () {
      beforeEach(function () {
        instructions.set([2, 5, 5, 25, 5, 5, 20]);
        writeLineSegmentToBuffers(
          instructions,
          1,
          3,
          5,
          null,
          vertexArray,
          indexArray,
          [],
          instructionsTransform,
          invertInstructionsTransform
        );
      });
      it('generate the correct amount of vertices', () => {
        expect(vertexArray).to.have.length(20);
      });
      it('correctly encodes the join angle', () => {
        expect(vertexArray[4]).to.eql(2356);
        expect(vertexArray[9]).to.eql(100002356);
        expect(vertexArray[14]).to.eql(200002356);
        expect(vertexArray[19]).to.eql(300002356);
      });
      it('does not impact indices array', function () {
        expect(indexArray).to.have.length(6);
      });
    });

    describe('segment with a point coming before it, join angle > PI', function () {
      beforeEach(function () {
        instructions.set([2, 5, 5, 25, 5, 5, -10]);
        writeLineSegmentToBuffers(
          instructions,
          1,
          3,
          5,
          null,
          vertexArray,
          indexArray,
          [],
          instructionsTransform,
          invertInstructionsTransform
        );
      });
      it('generate the correct amount of vertices', () => {
        expect(vertexArray).to.have.length(20);
      });
      it('correctly encodes the join angle', () => {
        expect(vertexArray[4]).to.eql(7069);
        expect(vertexArray[9]).to.eql(100007069);
        expect(vertexArray[14]).to.eql(200007069);
        expect(vertexArray[19]).to.eql(300007069);
      });
      it('does not impact indices array', function () {
        expect(indexArray).to.have.length(6);
      });
    });

    describe('segment with a point coming after it, join angle < PI', function () {
      beforeEach(function () {
        instructions.set([2, 5, 5, 25, 5, 5, 20]);
        writeLineSegmentToBuffers(
          instructions,
          1,
          3,
          null,
          5,
          vertexArray,
          indexArray,
          [],
          instructionsTransform,
          invertInstructionsTransform
        );
      });
      it('generate the correct amount of vertices', () => {
        expect(vertexArray).to.have.length(20);
      });
      it('correctly encodes the join angle', () => {
        expect(vertexArray[4]).to.eql(88870000);
        expect(vertexArray[9]).to.eql(188870000);
        expect(vertexArray[14]).to.eql(288870000);
        expect(vertexArray[19]).to.eql(388870000);
      });
      it('does not impact indices array', function () {
        expect(indexArray).to.have.length(6);
      });
    });

    describe('segment with a point coming after it, join angle > PI', function () {
      beforeEach(function () {
        instructions.set([2, 5, 5, 25, 5, 25, -10]);
        writeLineSegmentToBuffers(
          instructions,
          1,
          3,
          null,
          5,
          vertexArray,
          indexArray,
          [],
          instructionsTransform,
          invertInstructionsTransform
        );
      });
      it('generate the correct amount of vertices', () => {
        expect(vertexArray).to.have.length(20);
      });
      it('correctly encodes join angles', () => {
        expect(vertexArray[4]).to.eql(23560000);
        expect(vertexArray[9]).to.eql(123560000);
        expect(vertexArray[14]).to.eql(223560000);
        expect(vertexArray[19]).to.eql(323560000);
      });
      it('does not impact indices array', function () {
        expect(indexArray).to.have.length(6);
      });
    });
  });

  describe('writePolygonTrianglesToBuffers', function () {
    let vertexArray, indexArray, instructions, newIndex;

    beforeEach(function () {
      vertexArray = [];
      indexArray = [];
      instructions = new Float32Array(100);
    });

    describe('polygon with a hole', function () {
      beforeEach(function () {
        instructions.set([
          0, 0, 0, 2, 6, 5, 0, 0, 10, 0, 15, 6, 10, 12, 0, 12, 0, 0, 3, 3, 5, 1,
          7, 3, 5, 5, 3, 3,
        ]);
        newIndex = writePolygonTrianglesToBuffers(
          instructions,
          3,
          vertexArray,
          indexArray,
          0
        );
      });
      it('generates triangles correctly', function () {
        expect(vertexArray).to.have.length(22);
        expect(vertexArray).to.eql([
          0, 0, 10, 0, 15, 6, 10, 12, 0, 12, 0, 0, 3, 3, 5, 1, 7, 3, 5, 5, 3, 3,
        ]);
        expect(indexArray).to.have.length(27);
        expect(indexArray).to.eql([
          1, 2, 3, 3, 4, 0, 3, 0, 10, 7, 10, 0, 3, 10, 9, 7, 0, 1, 3, 9, 8, 8,
          7, 1, 1, 3, 8,
        ]);
      });
      it('correctly returns the new index', function () {
        expect(newIndex).to.eql(28);
      });
    });

    describe('polygon with a hole and custom attributes', function () {
      beforeEach(function () {
        instructions.set([
          0, 0, 0, 1234, 2, 6, 5, 0, 0, 10, 0, 15, 6, 10, 12, 0, 12, 0, 0, 3, 3,
          5, 1, 7, 3, 5, 5, 3, 3,
        ]);
        newIndex = writePolygonTrianglesToBuffers(
          instructions,
          3,
          vertexArray,
          indexArray,
          1
        );
      });
      it('generates triangles correctly', function () {
        expect(vertexArray).to.have.length(33);
        expect(vertexArray).to.eql([
          0, 0, 1234, 10, 0, 1234, 15, 6, 1234, 10, 12, 1234, 0, 12, 1234, 0, 0,
          1234, 3, 3, 1234, 5, 1, 1234, 7, 3, 1234, 5, 5, 1234, 3, 3, 1234,
        ]);
        expect(indexArray).to.have.length(27);
        expect(indexArray).to.eql([
          1, 2, 3, 3, 4, 0, 3, 0, 10, 7, 10, 0, 3, 10, 9, 7, 0, 1, 3, 9, 8, 8,
          7, 1, 1, 3, 8,
        ]);
      });
      it('correctly returns the new index', function () {
        expect(newIndex).to.eql(29);
      });
    });
  });

  describe('getBlankImageData', function () {
    it('creates a 1x1 white texture', function () {
      const texture = getBlankImageData();
      expect(texture.height).to.eql(1);
      expect(texture.width).to.eql(1);
      expect(texture.data[0]).to.eql(255);
      expect(texture.data[1]).to.eql(255);
      expect(texture.data[2]).to.eql(255);
      expect(texture.data[3]).to.eql(255);
    });
  });

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
        encoded[3] * 255
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
