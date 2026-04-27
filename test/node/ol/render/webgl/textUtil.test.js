import expect from 'expect.js';
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
  stripNonTextStyleProperties,
  Uniforms,
} from '../../../../../src/ol/render/webgl/textUtil.js';
import Style from '../../../../../src/ol/style/Style.js';
import Text from '../../../../../src/ol/style/Text.js';
import {
  create as createTransform,
  scale as scaleTransform,
} from '../../../../../src/ol/transform.js';
import LabelsArray from '../../../../../src/ol/webgl/LabelsArray.js';

describe('ol/render/webgl/textUtil', function () {
  describe('stripNonTextStyleProperties', function () {
    it('only keeps the style properties relevant to text rendering (single style)', function () {
      expect(
        stripNonTextStyleProperties({
          'fill-color': 'red',
          'text-value': 'foo',
          'text-font': 'bold 12px "Open Sans", "Arial Unicode MS", sans-serif',
        }),
      ).to.eql({
        'text-value': 'foo',
        'text-font': 'bold 12px "Open Sans", "Arial Unicode MS", sans-serif',
      });
    });
    it('only keeps the style properties relevant to text rendering (multiple simple styles)', function () {
      expect(
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
          },
          {
            'fill-color': 'red',
            'text-value': 'foo',
            'text-font':
              'bold 12px "Open Sans", "Arial Unicode MS", sans-serif',
          },
        ]),
      ).to.eql([
        {},
        {'text-value': ['get', 'name']},
        {
          'text-value': 'foo',
          'text-font': 'bold 12px "Open Sans", "Arial Unicode MS", sans-serif',
        },
      ]);
    });
    it('only keeps the style properties relevant to text rendering (multiple style rules)', function () {
      expect(
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
      ).to.eql([
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
      ]);
    });
  });

  describe('createPostProcessDefinition', function () {
    it('creates a post process definition that applies the correct transform to the text overlay canvas', function () {
      const mockCanvas = {
        width: 120,
        height: 260,
      };
      const currentFrameState = {
        viewState: {
          resolution: 1.5,
          rotation: Math.PI / 4,
          center: [60, 90],
        },
        size: [240, 520],
        pixelRatio: 2,
      };
      const textOverlayFrameState = {
        viewState: {
          resolution: 1.1,
          rotation: Math.PI / 4,
          center: [-100, -200],
        },
        size: [240, 520],
        pixelRatio: 2,
      };

      const postProcess = createPostProcessDefinition(
        () => mockCanvas,
        () => textOverlayFrameState,
      );
      expect(postProcess.fragmentShader).to.be.a('string');

      const overlayMatrixFn =
        postProcess.uniforms[Uniforms.TEXT_OVERLAY_MATRIX];

      // Without rotation
      expect(overlayMatrixFn(currentFrameState)).to.eql(
        // this matrix is used when reading pixels from the text overlay
        // combination of:
        //   translate( 160, 290 )  ->  difference between current view center and overlay view center
        //   scale( 1 / 240 / 1.5, 1 / 520 / 1.5 )  ->  divide by current resolution and current viewport size
        //   translate( -16 , 0 )  ->  subtract current view center
        //   translate( 0 , 16 )  ->  add initial view center
        //   scale( 2 / ( 0.5 * 200px ) , 2 / ( 0.5 * 100px ) )  ->  divide by current resolution & viewport size
        // [
        //   160 / 240 / 1.5,
        //   0.2,
        //   0,
        //   0,
        //   //
        //   -4.2,
        //   290 / 240 / 1.5,
        //   0,
        //   0,
        //   //
        //   0,
        //   0,
        //   1,
        //   0,
        //   //
        //   160 / 240 / 1.5,
        //   290 / 240 / 1.5,
        //   0,
        //   1,
        // ],

        [
          1.9284730395996748, 0.8900644798152346, 0, 0, -4.178358252465962,
          1.928473039599675, 0, 0, 0, 0, 1, 0, 2.424242424242424,
          2.027972027972028, 0, 1,
        ],
      );
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
      const first = new Style({text: new Text({text: 'feature'})});
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
          renderInstructionsTransform,
          labelsArray.getArray(),
          properties,
          customAttributes,
          textBuilder,
          styleFunction,
        );

        expect(textBuilder.calls.length).to.be(8); // 2 polygons, 2 style rules, 2 calls for each
        // first polygon
        expect(textBuilder.calls[0]).to.eql(['setTextStyle', 'feature']);
        expect(textBuilder.calls[1]).to.eql([
          'drawText',
          'Polygon',
          [1, 1, 2, 1, 2, 2, 2, 4, 1, 4, 1, 1],
        ]);
        expect(textBuilder.calls[2]).to.eql(['setTextStyle', '# ef']);
        expect(textBuilder.calls[3]).to.eql([
          'drawText',
          'Polygon',
          [1, 1, 2, 1, 2, 2, 2, 4, 1, 4, 1, 1],
        ]);
        // second polygon
        expect(textBuilder.calls[4]).to.eql(['setTextStyle', 'feature']);
        expect(textBuilder.calls[5]).to.eql([
          'drawText',
          'Polygon',
          [3, 3, 4, 3, 4, 4, 3, 4, 3, 3],
        ]);
        expect(textBuilder.calls[6]).to.eql(['setTextStyle', '# gh']);
        expect(textBuilder.calls[7]).to.eql([
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
          renderInstructionsTransform,
          labelsArray.getArray(),
          properties,
          customAttributes,
          textBuilder,
          styleFunction,
        );

        expect(textBuilder.calls.length).to.be(16); // 2 polygons & 2 lines, 2 style rules, 2 calls for each
        // first polygon
        expect(textBuilder.calls[0]).to.eql(['setTextStyle', 'feature']);
        expect(textBuilder.calls[1]).to.eql([
          'drawText',
          'LineString',
          [1, 1, 0, 2, 1, 0, 2, 2, 0, 2, 4, 0, 1, 4, 0, 1, 1, 0],
        ]);
        expect(textBuilder.calls[2]).to.eql(['setTextStyle', '# ef']);
        expect(textBuilder.calls[3]).to.eql([
          'drawText',
          'LineString',
          [1, 1, 0, 2, 1, 0, 2, 2, 0, 2, 4, 0, 1, 4, 0, 1, 1, 0],
        ]);
        // second polygon
        expect(textBuilder.calls[4]).to.eql(['setTextStyle', 'feature']);
        expect(textBuilder.calls[5]).to.eql([
          'drawText',
          'LineString',
          [3, 3, 0, 4, 3, 0, 4, 4, 0, 3, 4, 0, 3, 3, 0],
        ]);
        expect(textBuilder.calls[6]).to.eql(['setTextStyle', '# gh']);
        expect(textBuilder.calls[7]).to.eql([
          'drawText',
          'LineString',
          [3, 3, 0, 4, 3, 0, 4, 4, 0, 3, 4, 0, 3, 3, 0],
        ]);
        // first line
        expect(textBuilder.calls[8]).to.eql(['setTextStyle', 'feature']);
        expect(textBuilder.calls[9]).to.eql([
          'drawText',
          'LineString',
          [1, 2, 0, 3, 4, 0, 5, 6, 0],
        ]);
        expect(textBuilder.calls[10]).to.eql(['setTextStyle', '# ij']);
        expect(textBuilder.calls[11]).to.eql([
          'drawText',
          'LineString',
          [1, 2, 0, 3, 4, 0, 5, 6, 0],
        ]);
        // second line
        expect(textBuilder.calls[12]).to.eql(['setTextStyle', 'feature']);
        expect(textBuilder.calls[13]).to.eql([
          'drawText',
          'LineString',
          [1, 1, 0, 2, 2, 0, 3, 3, 0, 4, 4, 0],
        ]);
        expect(textBuilder.calls[14]).to.eql(['setTextStyle', '# kl']);
        expect(textBuilder.calls[15]).to.eql([
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
          renderInstructionsTransform,
          labelsArray.getArray(),
          properties,
          customAttributes,
          textBuilder,
          styleFunction,
        );

        expect(textBuilder.calls.length).to.eql(8); // 2 points, 2 style rules, 2 calls for each

        // first point
        expect(textBuilder.calls[0]).to.eql(['setTextStyle', 'feature']);
        expect(textBuilder.calls[1]).to.eql(['drawText', 'Point', [1, 2]]);
        expect(textBuilder.calls[2]).to.eql(['setTextStyle', '# ab']);
        expect(textBuilder.calls[3]).to.eql(['drawText', 'Point', [1, 2]]);

        // second point
        expect(textBuilder.calls[4]).to.eql(['setTextStyle', 'feature']);
        expect(textBuilder.calls[5]).to.eql(['drawText', 'Point', [3, 4]]);
        expect(textBuilder.calls[6]).to.eql(['setTextStyle', '# cd']);
        expect(textBuilder.calls[7]).to.eql(['drawText', 'Point', [3, 4]]);
      });
    });
  });
});
