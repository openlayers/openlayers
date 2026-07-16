import {assert} from 'chai';
import {
  ColorType,
  SizeType,
  StringType,
} from '../../../../../src/ol/expr/expression.js';
import Feature from '../../../../../src/ol/Feature.js';
import LineString from '../../../../../src/ol/geom/LineString.js';
import Point from '../../../../../src/ol/geom/Point.js';
import Polygon from '../../../../../src/ol/geom/Polygon.js';
import {
  getGlslSizeFromType,
  packColor,
} from '../../../../../src/ol/render/webgl/compileUtil.js';
import MixedGeometryBatch from '../../../../../src/ol/render/webgl/MixedGeometryBatch.js';
import {
  generateLineStringRenderInstructions,
  generatePointRenderInstructions,
  generatePolygonRenderInstructions,
} from '../../../../../src/ol/render/webgl/renderinstructions.js';
import {
  convertLineStringRenderInstructionsToCanvasTextBuilder,
  convertPointRenderInstructionsToCanvasTextBuilder,
  convertPolygonRenderInstructionsToCanvasTextBuilder,
  createPostProcessDefinition,
  hasTextStyle,
  stripNonTextStyleProperties,
  TextUniforms,
} from '../../../../../src/ol/render/webgl/textUtil.js';
import Style from '../../../../../src/ol/style/Style.js';
import Text from '../../../../../src/ol/style/Text.js';
import {
  create as createTransform,
  scale as scaleTransform,
} from '../../../../../src/ol/transform.js';
import {
  create as createMat4,
  rotate as rotateMat4,
  scale as scaleMat4,
  translate as translateMat4,
} from '../../../../../src/ol/vec/mat4.js';
import LabelsArray from '../../../../../src/ol/webgl/LabelsArray.js';

describe('ol/render/webgl/textUtil', function () {
  describe('hasTextStyle', function () {
    it('works on single style', function () {
      assert.strictEqual(
        hasTextStyle({
          'fill-color': 'red',
          'text-value': 'foo',
          'text-font': 'bold 12px "Open Sans", "Arial Unicode MS", sans-serif',
        }),
        true,
      );
      assert.strictEqual(
        hasTextStyle({
          'fill-color': 'red',
          'text-font': 'bold 12px "Open Sans", "Arial Unicode MS", sans-serif',
        }),
        false,
      );
    });
    it('works on multiple simple styles', function () {
      assert.strictEqual(
        hasTextStyle([
          {
            'fill-color': ['get', 'color'],
            'stroke-width': 2,
            'circle-radius': ['get', 'size'],
            'circle-fill-color': 'red',
          },
          {
            'fill-color': 'white',
            'text-value': ['get', 'name'],
          },
        ]),
        true,
      );
      assert.strictEqual(
        hasTextStyle([
          {
            'fill-color': ['get', 'color'],
            'stroke-width': 2,
            'circle-radius': ['get', 'size'],
            'circle-fill-color': 'red',
          },
          {
            'fill-color': 'white',
          },
        ]),
        false,
      );
    });
    it('works on multiple style rules', function () {
      assert.strictEqual(
        hasTextStyle([
          {
            style: {
              'fill-color': ['get', 'color'],
              'stroke-width': 2,
              'circle-radius': ['get', 'size'],
              'circle-fill-color': 'red',
            },
            filter: ['>', ['get', 'size'], 10],
          },
          {
            style: {
              'fill-color': 'white',
              'text-value': ['get', 'name'],
            },
            filter: ['==', ['get', 'id'], ['var', 'highlightedId']],
          },
          {
            style: {
              'text-value': 'foo',
              'text-font':
                'bold 12px "Open Sans", "Arial Unicode MS", sans-serif',
            },
          },
        ]),
        true,
      );
      assert.strictEqual(
        hasTextStyle([
          {
            style: {
              'fill-color': ['get', 'color'],
              'stroke-width': 2,
              'circle-radius': ['get', 'size'],
              'circle-fill-color': 'red',
            },
            filter: ['>', ['get', 'size'], 10],
          },
          {
            style: {
              'fill-color': 'white',
            },
            filter: ['==', ['get', 'id'], ['var', 'highlightedId']],
          },
        ]),
        false,
      );
    });
    it('works on style rules with multiple styles', function () {
      assert.strictEqual(
        hasTextStyle([
          {
            style: [
              {
                'fill-color': ['get', 'color'],
                'stroke-width': 2,
                'circle-radius': ['get', 'size'],
                'circle-fill-color': 'red',
              },
              {
                'fill-color': 'white',
                'text-value': ['get', 'name'],
              },
            ],
            filter: ['>', ['get', 'size'], 10],
          },
        ]),
        true,
      );
      assert.strictEqual(
        hasTextStyle([
          {
            style: [
              {
                'fill-color': ['get', 'color'],
                'stroke-width': 2,
                'circle-radius': ['get', 'size'],
                'circle-fill-color': 'red',
              },
              {
                'fill-color': 'white',
              },
            ],
            filter: ['==', ['get', 'id'], ['var', 'highlightedId']],
          },
        ]),
        false,
      );
    });
  });

  describe('stripNonTextStyleProperties', function () {
    it('only keeps the style properties relevant to text rendering (single style)', function () {
      assert.deepEqual(
        stripNonTextStyleProperties({
          'fill-color': 'red',
          'text-value': 'foo',
          'text-font': 'bold 12px "Open Sans", "Arial Unicode MS", sans-serif',
          'z-index': 12,
        }),
        {
          'text-value': 'foo',
          'text-font': 'bold 12px "Open Sans", "Arial Unicode MS", sans-serif',
          'z-index': 12,
        },
      );
    });
    it('only keeps the style properties relevant to text rendering (multiple simple styles)', function () {
      assert.deepEqual(
        stripNonTextStyleProperties([
          {
            'fill-color': ['get', 'color'],
            'stroke-width': 2,
            'circle-radius': ['get', 'size'],
            'circle-fill-color': 'red',
          },
          {
            'fill-color': 'white',
            'text-value': ['get', 'name'],
            'z-index': 12,
          },
          {
            'fill-color': 'red',
            'text-value': 'foo',
            'text-font':
              'bold 12px "Open Sans", "Arial Unicode MS", sans-serif',
          },
        ]),
        [
          {},
          {'text-value': ['get', 'name'], 'z-index': 12},
          {
            'text-value': 'foo',
            'text-font':
              'bold 12px "Open Sans", "Arial Unicode MS", sans-serif',
          },
        ],
      );
    });
    it('only keeps the style properties relevant to text rendering (multiple style rules)', function () {
      assert.deepEqual(
        stripNonTextStyleProperties([
          {
            style: {
              'fill-color': ['get', 'color'],
              'stroke-width': 2,
              'circle-radius': ['get', 'size'],
              'circle-fill-color': 'red',
            },
            filter: ['>', ['get', 'size'], 10],
          },
          {
            style: {
              'fill-color': 'white',
              'text-value': ['get', 'name'],
            },
            filter: ['==', ['get', 'id'], ['var', 'highlightedId']],
          },
          {
            style: {
              'text-value': 'foo',
              'text-font':
                'bold 12px "Open Sans", "Arial Unicode MS", sans-serif',
            },
          },
        ]),
        [
          {style: {}, filter: ['>', ['get', 'size'], 10]},
          {
            style: {
              'text-value': ['get', 'name'],
            },
            filter: ['==', ['get', 'id'], ['var', 'highlightedId']],
          },
          {
            style: {
              'text-value': 'foo',
              'text-font':
                'bold 12px "Open Sans", "Arial Unicode MS", sans-serif',
            },
          },
        ],
      );
    });
    it('only keeps the style properties relevant to text rendering (style rules with multiple styles)', function () {
      assert.deepEqual(
        stripNonTextStyleProperties([
          {
            style: [
              {
                'fill-color': ['get', 'color'],
                'stroke-width': 2,
                'circle-radius': ['get', 'size'],
                'circle-fill-color': 'red',
              },
              {
                'fill-color': 'white',
                'text-value': ['get', 'name'],
              },
            ],
            filter: ['==', ['get', 'id'], ['var', 'highlightedId']],
          },
        ]),
        [
          {
            style: [
              {},
              {
                'text-value': ['get', 'name'],
              },
            ],
            filter: ['==', ['get', 'id'], ['var', 'highlightedId']],
          },
        ],
      );
    });
    it('only keeps the style properties relevant to text rendering (style rules with multiple styles)', function () {
      assert.deepEqual(
        stripNonTextStyleProperties([
          {
            style: [
              {
                'fill-color': ['get', 'color'],
                'stroke-width': 2,
                'circle-radius': ['get', 'size'],
                'circle-fill-color': 'red',
              },
              {
                'fill-color': 'white',
                'text-value': ['get', 'name'],
              },
            ],
            filter: ['==', ['get', 'id'], ['var', 'highlightedId']],
          },
        ]),
        [
          {
            style: [
              {},
              {
                'text-value': ['get', 'name'],
              },
            ],
            filter: ['==', ['get', 'id'], ['var', 'highlightedId']],
          },
        ],
      );
    });
  });

  describe('createPostProcessDefinition', function () {
    it('creates a post process definition that applies the correct transform to the text overlay canvas', function () {
      const canvasWidth = 120;
      const canvasHeight = 260;
      const mockCanvas = {
        width: canvasWidth,
        height: canvasHeight,
      };
      const currentFrameState = {
        viewState: {
          resolution: 1.5,
          rotation: Math.PI / 4,
          center: [60, 90],
        },
        size: [canvasWidth, canvasHeight],
        pixelRatio: 2,
      };
      const textOverlayFrameState = {
        viewState: {
          resolution: 1.1,
          rotation: (3 * Math.PI) / 4,
          center: [-100, -200],
        },
        size: [canvasWidth, canvasHeight],
        pixelRatio: 2,
      };

      const postProcess = createPostProcessDefinition(
        () => mockCanvas,
        () => textOverlayFrameState,
      );
      assert.typeOf(postProcess.fragmentShader, 'string');

      const overlayMatrixFn =
        postProcess.uniforms[TextUniforms.TEXT_OVERLAY_MATRIX];

      const expectedMatrix = createMat4();

      // 1. from text overlay world coordinates to pixel coordinates to [-1;1] viewport coordinates
      scaleMat4(
        expectedMatrix,
        1 / 1.1 / (canvasWidth / 2),
        1 / 1.1 / (canvasHeight / 2),
        1,
        expectedMatrix,
      );
      // 2. remove text overlay coordinates rotation
      rotateMat4(expectedMatrix, (3 * Math.PI) / 4, expectedMatrix);
      // 3. translate to the expected center in world coordinates
      translateMat4(expectedMatrix, 60 - -100, 90 - -200, 0, expectedMatrix);
      // 4. apply expected rotation to coordinates
      rotateMat4(expectedMatrix, -(Math.PI / 4), expectedMatrix);
      // 5. scale back from [-1;1] viewport coordinates to pixel coordinates to world coordinates in the expected frame state
      scaleMat4(
        expectedMatrix,
        1.5 * (canvasWidth / 2),
        1.5 * (canvasHeight / 2),
        1,
        expectedMatrix,
      );

      assert.deepEqual(overlayMatrixFn(currentFrameState), expectedMatrix);
    });
  });

  describe('canvas text builder utils', () => {
    function makeTextBuilder() {
      const calls = [];
      return {
        calls,
        setTextStyle(textStyle) {
          calls.push(['setTextStyle', textStyle.getText()]);
        },
        drawText(geometry, feature) {
          calls.push([
            'drawText',
            geometry.getType(),
            geometry.getFlatCoordinates(),
          ]);
        },
      };
    }

    function makeStyleFunction() {
      const first = new Style({
        text: new Text({text: 'feature', placement: 'line'}),
      });
      const second = new Style({text: new Text({text: '#'})});
      return (feature) => {
        second.getText().setText('# ' + feature.get('label'));
        return [first, second];
      };
    }

    const renderInstructionsTransform = scaleTransform(
      createTransform(),
      1 / 10,
      1 / 10,
    );
    const properties = new Map([
      ['label', StringType],
      ['size', SizeType],
      ['color', ColorType],
    ]);
    const customAttributes = {
      'prop_label': {
        callback: (f) => f.get('label'),
        size: getGlslSizeFromType(StringType),
      },
      'prop_size': {
        callback: (f) => f.get('size'),
        size: getGlslSizeFromType(SizeType),
      },
      'prop_color': {
        callback: (f) => packColor(f.get('color')),
        size: getGlslSizeFromType(ColorType),
      },
    };

    let labelsArray;
    let polygonRenderInstructions;
    let lineStringRenderInstructions;
    let pointRenderInstructions;

    beforeEach(() => {
      labelsArray = new LabelsArray();

      const geometryBatch = new MixedGeometryBatch();
      geometryBatch.addFeatures([
        new Feature({
          label: 'ab',
          size: [1000, 1000],
          color: [255, 200, 100],
          geometry: new Point([10, 20]),
        }),
        new Feature({
          label: 'cd',
          size: [2000, 2000],
          color: [255, 200, 100],
          geometry: new Point([30, 40]),
        }),
        new Feature({
          label: 'ef',
          size: [3000, 3000],
          color: [255, 200, 100],
          geometry: new Polygon([
            [
              [10, 10],
              [20, 10],
              [20, 20],
              [20, 40],
              [10, 40],
              [10, 10],
            ],
            [
              [15, 15],
              [15, 17.5],
              [17.5, 17.5],
              [17.5, 15],
              [15, 15],
            ],
          ]),
        }),
        new Feature({
          label: 'gh',
          size: [4000, 4000],
          color: [255, 200, 100],
          geometry: new Polygon([
            [
              [30, 30],
              [40, 30],
              [40, 40],
              [30, 40],
              [30, 30],
            ],
          ]),
        }),
        new Feature({
          label: 'ij',
          size: [5000, 5000],
          color: [255, 200, 100],
          geometry: new LineString([
            [10, 20],
            [30, 40],
            [50, 60],
          ]),
        }),
        new Feature({
          label: 'kl',
          size: [6000, 6000],
          color: [255, 200, 100],
          geometry: new LineString([
            [10, 10],
            [20, 20],
            [30, 30],
            [40, 40],
          ]),
        }),
      ]);

      polygonRenderInstructions = generatePolygonRenderInstructions(
        geometryBatch.polygonBatch,
        new Float32Array(0),
        labelsArray,
        customAttributes,
        renderInstructionsTransform,
      );
      lineStringRenderInstructions = generateLineStringRenderInstructions(
        geometryBatch.lineStringBatch,
        new Float32Array(0),
        labelsArray,
        customAttributes,
        renderInstructionsTransform,
      );
      pointRenderInstructions = generatePointRenderInstructions(
        geometryBatch.pointBatch,
        new Float32Array(0),
        labelsArray,
        customAttributes,
        renderInstructionsTransform,
      );
    });

    describe('convertPolygonRenderInstructionsToCanvasTextBuilder', function () {
      it('calls setTextStyle and drawText once for each style rule and each polygon in the render instructions', function () {
        const textBuilder = makeTextBuilder();
        const styleFunction = makeStyleFunction();

        convertPolygonRenderInstructionsToCanvasTextBuilder(
          polygonRenderInstructions,
          labelsArray.getArray(),
          properties,
          customAttributes,
          textBuilder,
          styleFunction,
        );

        assert.strictEqual(textBuilder.calls.length, 4); // 2 polygons, 1 style rule without line placement, 2 calls for each
        // first polygon
        assert.deepEqual(textBuilder.calls[0], ['setTextStyle', '# ef']);
        assert.deepEqual(textBuilder.calls[1], [
          'drawText',
          'Polygon',
          [
            1, 1, 2, 1, 2, 2, 2, 4, 1, 4, 1, 1, 1.5, 1.5, 1.5, 1.75, 1.75, 1.75,
            1.75, 1.5, 1.5, 1.5,
          ],
        ]);
        // second polygon
        assert.deepEqual(textBuilder.calls[2], ['setTextStyle', '# gh']);
        assert.deepEqual(textBuilder.calls[3], [
          'drawText',
          'Polygon',
          [3, 3, 4, 3, 4, 4, 3, 4, 3, 3],
        ]);
      });
    });

    describe('convertLineStringRenderInstructionsToCanvasTextBuilder', function () {
      it('calls setTextStyle and drawText once for each style rule and each line string in the render instructions', function () {
        const textBuilder = makeTextBuilder();
        const styleFunction = makeStyleFunction();

        convertLineStringRenderInstructionsToCanvasTextBuilder(
          lineStringRenderInstructions,
          labelsArray.getArray(),
          properties,
          customAttributes,
          textBuilder,
          styleFunction,
        );

        assert.strictEqual(textBuilder.calls.length, 10); // 2 polygons (3 linear rings) + 2 lines, 1 style rule with line placement, 2 calls for each
        // first linear ring
        assert.deepEqual(textBuilder.calls[0], ['setTextStyle', 'feature']);
        assert.deepEqual(textBuilder.calls[1], [
          'drawText',
          'LineString',
          [1, 1, 0, 2, 1, 0, 2, 2, 0, 2, 4, 0, 1, 4, 0, 1, 1, 0],
        ]);
        // second linear ring
        assert.deepEqual(textBuilder.calls[2], ['setTextStyle', 'feature']);
        assert.deepEqual(textBuilder.calls[3], [
          'drawText',
          'LineString',
          [1.5, 1.5, 0, 1.5, 1.75, 0, 1.75, 1.75, 0, 1.75, 1.5, 0, 1.5, 1.5, 0],
        ]);
        // third linear ring
        assert.deepEqual(textBuilder.calls[4], ['setTextStyle', 'feature']);
        assert.deepEqual(textBuilder.calls[5], [
          'drawText',
          'LineString',
          [3, 3, 0, 4, 3, 0, 4, 4, 0, 3, 4, 0, 3, 3, 0],
        ]);
        // first line
        assert.deepEqual(textBuilder.calls[6], ['setTextStyle', 'feature']);
        assert.deepEqual(textBuilder.calls[7], [
          'drawText',
          'LineString',
          [1, 2, 0, 3, 4, 0, 5, 6, 0],
        ]);
        // second line
        assert.deepEqual(textBuilder.calls[8], ['setTextStyle', 'feature']);
        assert.deepEqual(textBuilder.calls[9], [
          'drawText',
          'LineString',
          [1, 1, 0, 2, 2, 0, 3, 3, 0, 4, 4, 0],
        ]);
      });
    });

    describe('convertPointRenderInstructionsToCanvasTextBuilder', function () {
      it('calls setTextStyle and drawText once for each style rule and each point in the render instructions', function () {
        const textBuilder = makeTextBuilder();
        const styleFunction = makeStyleFunction();

        convertPointRenderInstructionsToCanvasTextBuilder(
          pointRenderInstructions,
          labelsArray.getArray(),
          properties,
          customAttributes,
          textBuilder,
          styleFunction,
        );

        assert.deepEqual(textBuilder.calls.length, 4); // 2 points, 1 style rule without line placement, 2 calls for each

        // first point
        assert.deepEqual(textBuilder.calls[0], ['setTextStyle', '# ab']);
        assert.deepEqual(textBuilder.calls[1], ['drawText', 'Point', [1, 2]]);

        // second point
        assert.deepEqual(textBuilder.calls[2], ['setTextStyle', '# cd']);
        assert.deepEqual(textBuilder.calls[3], ['drawText', 'Point', [3, 4]]);
      });
    });
  });
});
