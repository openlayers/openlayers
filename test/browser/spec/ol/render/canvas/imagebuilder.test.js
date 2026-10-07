import {assert} from 'chai';
import Feature from '../../../../../../src/ol/Feature.js';
import LineString from '../../../../../../src/ol/geom/LineString.js';
import MultiLineString from '../../../../../../src/ol/geom/MultiLineString.js';
import MultiPolygon from '../../../../../../src/ol/geom/MultiPolygon.js';
import Polygon from '../../../../../../src/ol/geom/Polygon.js';
import CanvasImageBuilder from '../../../../../../src/ol/render/canvas/ImageBuilder.js';
import CanvasInstruction from '../../../../../../src/ol/render/canvas/Instruction.js';
import Icon from '../../../../../../src/ol/style/Icon.js';

function createBuilder() {
  return new CanvasImageBuilder(1, [-180, -90, 180, 90], 1, 1);
}

function createIcon(options) {
  const canvas = document.createElement('canvas');
  canvas.width = 2;
  canvas.height = 2;
  return new Icon(Object.assign({img: canvas, size: [2, 2]}, options));
}

function getDrawImageInstructions(builder) {
  return builder.instructions.filter(
    (instruction) => instruction[0] === CanvasInstruction.DRAW_IMAGE,
  );
}

describe('ol.render.canvas.ImageBuilder', function () {
  describe('#drawLineString', function () {
    it('does nothing when no image style has been set', function () {
      const builder = createBuilder();
      const geometry = new LineString([
        [0, 0],
        [10, 0],
      ]);
      builder.drawLineString(geometry, new Feature(geometry));
      assert.lengthOf(builder.instructions, 0);
    });

    it('draws a single centered image for the whole line when repeat is not set', function () {
      const builder = createBuilder();
      builder.setImageStyle(
        createIcon({placement: 'line', rotateWithView: true}),
      );
      const geometry = new LineString([
        [0, 0],
        [0, 10],
      ]);
      builder.drawLineString(geometry, new Feature(geometry));

      const drawImageInstructions = getDrawImageInstructions(builder);
      assert.lengthOf(drawImageInstructions, 1);
      assert.strictEqual(drawImageInstructions[0][11], -Math.PI / 2);
      assert.deepEqual(builder.coordinates, [0, 5]);
    });

    it('draws one image per repeat chunk, rotated to follow the local tangent', function () {
      const builder = createBuilder();
      builder.setImageStyle(
        createIcon({placement: 'line', repeat: 10, rotateWithView: true}),
      );
      const geometry = new LineString([
        [0, 0],
        [20, 0],
      ]);
      builder.drawLineString(geometry, new Feature(geometry));

      const drawImageInstructions = getDrawImageInstructions(builder);
      assert.lengthOf(drawImageInstructions, 2);
      drawImageInstructions.forEach((instruction) => {
        assert.strictEqual(instruction[11], 0);
      });
      assert.deepEqual(builder.coordinates, [5, 0, 15, 0]);
    });

    it("keeps the icon's own fixed rotation at every anchor when rotateWithView is false", function () {
      const builder = createBuilder();
      builder.setImageStyle(
        createIcon({
          placement: 'line',
          repeat: 10,
          rotation: 0.5,
          rotateWithView: false,
        }),
      );
      const geometry = new LineString([
        [0, 0],
        [20, 0],
      ]);
      builder.drawLineString(geometry, new Feature(geometry));

      const drawImageInstructions = getDrawImageInstructions(builder);
      assert.lengthOf(drawImageInstructions, 2);
      drawImageInstructions.forEach((instruction) => {
        assert.strictEqual(instruction[11], 0.5);
      });
      assert.deepEqual(builder.coordinates, [5, 0, 15, 0]);
    });

    it('draws a single static icon at the midpoint for the default "point" placement', function () {
      const builder = createBuilder();
      builder.setImageStyle(createIcon({rotation: 0.5}));
      const geometry = new LineString([
        [0, 0],
        [0, 10],
      ]);
      builder.drawLineString(geometry, new Feature(geometry));

      const drawImageInstructions = getDrawImageInstructions(builder);
      assert.lengthOf(drawImageInstructions, 1);
      // no line-following rotation: just the icon's own fixed rotation
      assert.strictEqual(drawImageInstructions[0][11], 0.5);
      assert.deepEqual(builder.coordinates, [0, 5]);
    });
  });

  describe('#drawMultiLineString', function () {
    it('chunks each sub-line independently', function () {
      const builder = new CanvasImageBuilder(1, [-180, -90, 180, 200], 1, 1);
      builder.setImageStyle(createIcon({placement: 'line', repeat: 10}));
      const geometry = new MultiLineString([
        [
          [0, 0],
          [20, 0],
        ],
        [
          [0, 100],
          [0, 120],
        ],
      ]);
      builder.drawMultiLineString(geometry, new Feature(geometry));

      const drawImageInstructions = getDrawImageInstructions(builder);
      assert.lengthOf(drawImageInstructions, 4);
      assert.deepEqual(builder.coordinates, [5, 0, 15, 0, 0, 105, 0, 115]);
    });

    it('draws one static icon per sub-line, at its own midpoint, for the default "point" placement', function () {
      const builder = new CanvasImageBuilder(1, [-180, -90, 180, 200], 1, 1);
      builder.setImageStyle(createIcon({rotation: 0.5}));
      const geometry = new MultiLineString([
        [
          [0, 0],
          [20, 0],
        ],
        [
          [0, 100],
          [0, 120],
        ],
      ]);
      builder.drawMultiLineString(geometry, new Feature(geometry));

      const drawImageInstructions = getDrawImageInstructions(builder);
      assert.lengthOf(drawImageInstructions, 1);
      assert.strictEqual(drawImageInstructions[0][11], 0.5);
      assert.deepEqual(builder.coordinates, [10, 0, 0, 110]);
    });
  });

  describe('#drawPolygon', function () {
    const square = new Polygon([
      [
        [0, 0],
        [10, 0],
        [10, 10],
        [0, 10],
        [0, 0],
      ],
    ]);

    it('draws one image per repeat chunk along the exterior ring, rotated to follow the local tangent', function () {
      const builder = createBuilder();
      builder.setImageStyle(
        createIcon({placement: 'line', repeat: 10, rotateWithView: true}),
      );
      builder.drawPolygon(square, new Feature(square));

      const drawImageInstructions = getDrawImageInstructions(builder);
      assert.lengthOf(drawImageInstructions, 4);
      assert.deepEqual(
        drawImageInstructions.map((instruction) => instruction[11]),
        [0, -Math.PI / 2, Math.PI, Math.PI / 2],
      );
      assert.deepEqual(builder.coordinates, [5, 0, 10, 5, 5, 10, 0, 5]);
    });

    it('draws a single static icon at the interior point for the default "point" placement', function () {
      const builder = createBuilder();
      builder.setImageStyle(createIcon({rotation: 0.5}));
      builder.drawPolygon(square, new Feature(square));

      const drawImageInstructions = getDrawImageInstructions(builder);
      assert.lengthOf(drawImageInstructions, 1);
      assert.strictEqual(drawImageInstructions[0][11], 0.5);
      const interiorPoint = square.getFlatInteriorPoint();
      assert.deepEqual(builder.coordinates, [
        interiorPoint[0],
        interiorPoint[1],
      ]);
    });
  });

  describe('#drawMultiPolygon', function () {
    const multiSquare = new MultiPolygon([
      [
        [
          [0, 0],
          [10, 0],
          [10, 10],
          [0, 10],
          [0, 0],
        ],
      ],
      [
        [
          [20, 0],
          [30, 0],
          [30, 10],
          [20, 10],
          [20, 0],
        ],
      ],
    ]);

    it('draws repeat chunks along each exterior ring independently', function () {
      const builder = createBuilder();
      builder.setImageStyle(createIcon({placement: 'line', repeat: 10}));
      builder.drawMultiPolygon(multiSquare, new Feature(multiSquare));

      const drawImageInstructions = getDrawImageInstructions(builder);
      assert.lengthOf(drawImageInstructions, 8);
    });

    it('draws one static icon per polygon, at its own interior point, for the default "point" placement', function () {
      const builder = createBuilder();
      builder.setImageStyle(createIcon({rotation: 0.5}));
      builder.drawMultiPolygon(multiSquare, new Feature(multiSquare));

      const drawImageInstructions = getDrawImageInstructions(builder);
      assert.lengthOf(drawImageInstructions, 1);
      assert.strictEqual(drawImageInstructions[0][11], 0.5);
      const interiorPoints = multiSquare.getFlatInteriorPoints();
      assert.deepEqual(builder.coordinates, [
        interiorPoints[0],
        interiorPoints[1],
        interiorPoints[3],
        interiorPoints[4],
      ]);
    });
  });
});
