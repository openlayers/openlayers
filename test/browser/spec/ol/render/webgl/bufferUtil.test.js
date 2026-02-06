import {
  writeLineSegmentToBuffers,
  writePointFeatureToBuffers,
  writePolygonTrianglesToBuffers,
} from '../../../../../../src/ol/render/webgl/bufferUtil.js';
import {
  compose as composeTransform,
  create as createTransform,
  makeInverse as makeInverseTransform,
} from '../../../../../../src/ol/transform.js';

describe('webgl buffer generation utils', function () {
  describe('writePointFeatureToBuffers', function () {
    let instanceAttributesBuffer, instructions;

    beforeEach(function () {
      instanceAttributesBuffer = new Float32Array(100);
      instructions = new Float32Array(100);

      instructions.set([0, 0, 0, 0, 10, 11]);
    });

    it('writes correctly to the buffers (without custom attributes)', function () {
      const stride = 2;
      const positions = writePointFeatureToBuffers(
        instructions,
        4,
        instanceAttributesBuffer,
        0,
      );

      expect(instanceAttributesBuffer[0]).to.eql(10);
      expect(instanceAttributesBuffer[1]).to.eql(11);

      expect(positions.instanceAttributesPosition).to.eql(stride);
    });

    it('writes correctly to the buffers (with 2 custom attributes)', function () {
      instructions.set([0, 0, 0, 0, 0, 0, 0, 0, 10, 11, 12, 13]);
      const stride = 4;
      const positions = writePointFeatureToBuffers(
        instructions,
        8,
        instanceAttributesBuffer,
        2,
      );

      expect(instanceAttributesBuffer[0]).to.eql(10);
      expect(instanceAttributesBuffer[1]).to.eql(11);
      expect(instanceAttributesBuffer[2]).to.eql(12);
      expect(instanceAttributesBuffer[3]).to.eql(13);

      expect(positions.instanceAttributesPosition).to.eql(stride);
    });

    it('correctly chains buffer writes', function () {
      instructions.set([10, 11, 20, 21, 30, 31]);
      const stride = 2;
      let positions = writePointFeatureToBuffers(
        instructions,
        0,
        instanceAttributesBuffer,
        0,
      );
      positions = writePointFeatureToBuffers(
        instructions,
        2,
        instanceAttributesBuffer,
        0,
        positions,
      );
      positions = writePointFeatureToBuffers(
        instructions,
        4,
        instanceAttributesBuffer,
        0,
        positions,
      );

      expect(instanceAttributesBuffer[0]).to.eql(10);
      expect(instanceAttributesBuffer[1]).to.eql(11);

      expect(instanceAttributesBuffer[stride + 0]).to.eql(20);
      expect(instanceAttributesBuffer[stride + 1]).to.eql(21);

      expect(instanceAttributesBuffer[stride * 2 + 0]).to.eql(30);
      expect(instanceAttributesBuffer[stride * 2 + 1]).to.eql(31);

      expect(positions.instanceAttributesPosition).to.eql(stride * 3);
    });
  });

  describe('writeLineSegmentToBuffers', function () {
    let instanceAttributesArray, instructions;
    let instructionsTransform, invertInstructionsTransform;
    let currentLength, currentAngleTangentSum;

    beforeEach(function () {
      instanceAttributesArray = [];
      instructions = new Float32Array(100);

      instructionsTransform = createTransform();
      invertInstructionsTransform = createTransform();
      composeTransform(instructionsTransform, 0, 0, 10, 10, 0, -50, 200);
      makeInverseTransform(invertInstructionsTransform, instructionsTransform);
    });

    describe('isolated segment', function () {
      beforeEach(function () {
        instructions.set([0, 0, 10, 0, 2, 20, 5, 5, 30, 25, 5, 40]);
        const result = writeLineSegmentToBuffers(
          instructions,
          6,
          9,
          null,
          null,
          instanceAttributesArray,
          [],
          invertInstructionsTransform,
          100,
          100,
        );
        currentLength = result.length;
        currentAngleTangentSum = result.angle;
      });
      // we expect one quad with 10 attributes each:
      // Xstart, Ystart, Mstart, Xend, Yend, Mend, joinAngleStart, joinAngleEnd, distance (low part), distance (high part) angle tangent sum
      it('generates a quad for the segment', function () {
        expect(instanceAttributesArray).to.eql([
          5, 5, 30, 25, 5, 40, -1, -1, 100, 0, 100,
        ]);
      });
      it('computes the new current length', () => {
        expect(currentLength).to.eql(102);
      });
      it('angle tangent sum stays the same', () => {
        expect(currentAngleTangentSum).to.eql(100);
      });
    });

    describe('isolated segment with custom attributes', function () {
      beforeEach(function () {
        instructions.set([888, 999, 2, 5, 5, 30, 25, 5, 40]);
        const result = writeLineSegmentToBuffers(
          instructions,
          3,
          6,
          null,
          null,
          instanceAttributesArray,
          [888, 999],
          invertInstructionsTransform,
          100,
          100,
        );
        currentLength = result.length;
        currentAngleTangentSum = result.angle;
      });
      // we expect 4 vertices (one quad) with 10 attributes each:
      // Xstart, Ystart, Xend, Yend, joinAngleStart, joinAngleEnd, distance (low part), distance (high part), vertex number (0..3), + 2 custom attributes
      it('adds custom attributes in the vertices buffer', function () {
        expect(instanceAttributesArray).to.eql([
          5, 5, 30, 25, 5, 40, -1, -1, 100, 0, 100, 888, 999,
        ]);
      });
      it('computes the new current length', () => {
        expect(currentLength).to.eql(102);
      });
      it('angle tangent sum stays the same', () => {
        expect(currentAngleTangentSum).to.eql(100);
      });
    });

    describe('segment with a point coming before it, join angle < PI', function () {
      beforeEach(function () {
        instructions.set([2, 5, 5, 0, 25, 5, 0, 5, 20, 0]);
        const result = writeLineSegmentToBuffers(
          instructions,
          1,
          4,
          7,
          null,
          instanceAttributesArray,
          [],
          invertInstructionsTransform,
          0,
          10,
        );
        currentAngleTangentSum = result.angle;
      });
      it('generate the correct amount of vertices', () => {
        expect(instanceAttributesArray).to.have.length(11);
      });
      it('correctly encodes the join angles', () => {
        expect(instanceAttributesArray.slice(6, 8)).to.eql([Math.PI / 2, -1]);
      });
      it('angle tangent sum decreases by one', () => {
        expect(currentAngleTangentSum).roughlyEqual(9, 1e-9);
      });
    });

    describe('segment with a point coming before it, join angle > PI', function () {
      beforeEach(function () {
        instructions.set([2, 5, 5, 25, 5, 5, -10]);
        const result = writeLineSegmentToBuffers(
          instructions,
          1,
          3,
          5,
          null,
          instanceAttributesArray,
          [],
          invertInstructionsTransform,
          0,
          10,
        );
        currentAngleTangentSum = result.angle;
      });
      it('generate the correct amount of vertices', () => {
        expect(instanceAttributesArray).to.have.length(11);
      });
      it('correctly encodes the join angle', () => {
        expect(instanceAttributesArray.slice(6, 8)).to.eql([
          (Math.PI * 3) / 2,
          -1,
        ]);
      });
      it('angle tangent sum increases by one', () => {
        expect(currentAngleTangentSum).roughlyEqual(11, 1e-9);
      });
    });

    describe('segment with a point coming after it, join angle > PI', function () {
      beforeEach(function () {
        instructions.set([2, 5, 5, 25, 5, 5, 25]);
        const result = writeLineSegmentToBuffers(
          instructions,
          1,
          3,
          null,
          5,
          instanceAttributesArray,
          [],
          invertInstructionsTransform,
          0,
          10,
        );
        currentAngleTangentSum = result.angle;
      });
      it('generate the correct amount of vertices', () => {
        expect(instanceAttributesArray).to.have.length(11);
      });
      it('correctly encodes the join angle', () => {
        expect(instanceAttributesArray.slice(6, 8)).to.eql([
          -1,
          (Math.PI * 7) / 4,
        ]);
      });
      it('angle tangent sum decreases', () => {
        expect(currentAngleTangentSum).roughlyEqual(
          10 - (1 + Math.sqrt(2)),
          1e-9,
        );
      });
    });

    describe('segment with a point coming after it, join angle < PI', function () {
      beforeEach(function () {
        instructions.set([2, 5, 5, 25, 5, 25, -10]);
        const result = writeLineSegmentToBuffers(
          instructions,
          1,
          3,
          null,
          5,
          instanceAttributesArray,
          [],
          invertInstructionsTransform,
          0,
          10,
        );
        currentAngleTangentSum = result.angle;
      });
      it('generate the correct amount of vertices', () => {
        expect(instanceAttributesArray).to.have.length(11);
      });
      it('correctly encodes join angles', () => {
        expect(instanceAttributesArray.slice(6, 8)).to.eql([-1, Math.PI / 2]);
      });
      it('angle tangent sum increases', () => {
        expect(currentAngleTangentSum).roughlyEqual(11, 1e-9);
      });
    });

    describe('segment with zero length', function () {
      beforeEach(function () {
        instructions.set([-10, -10, 5, 5, 5, 5, 10, 10]);
        const result = writeLineSegmentToBuffers(
          instructions,
          2,
          4,
          0,
          6,
          instanceAttributesArray,
          [],
          invertInstructionsTransform,
          0,
          10,
        );
        currentAngleTangentSum = result.angle;
      });
      it('generate the correct amount of vertices', () => {
        expect(instanceAttributesArray).to.have.length(11);
      });
      it('do not use zero or 2PI for both angles', () => {
        expect(instanceAttributesArray.slice(6, 8)).to.not.eql([
          Math.PI * 2,
          Math.PI * 2,
        ]);
        expect(instanceAttributesArray.slice(6, 8)).to.not.eql([0, 0]);
      });
    });

    describe('colinear segment', function () {
      beforeEach(function () {
        instructions.set([-10, -10, 5, 5, -5, -5, -15, 5]);
        const result = writeLineSegmentToBuffers(
          instructions,
          2,
          4,
          0,
          6,
          instanceAttributesArray,
          [],
          invertInstructionsTransform,
          0,
          10,
        );
        currentAngleTangentSum = result.angle;
      });
      it('generate the correct amount of vertices', () => {
        expect(instanceAttributesArray).to.have.length(11);
      });
      it('do not use zero or 2PI for the first angle', () => {
        expect(instanceAttributesArray[6]).to.not.eql(Math.PI * 2);
        expect(instanceAttributesArray[6]).to.not.eql(0);
        expect(instanceAttributesArray[7]).to.eql(Math.PI / 2); // this is normal
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
          0,
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
          1,
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
});
