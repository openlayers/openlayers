import {spy as sinonSpy} from 'sinon';
import Feature from '../../../../../../src/ol/Feature.js';
import {UNDEFINED_PROP_VALUE} from '../../../../../../src/ol/expr/gpu.js';
import LineString from '../../../../../../src/ol/geom/LineString.js';
import Point from '../../../../../../src/ol/geom/Point.js';
import Polygon from '../../../../../../src/ol/geom/Polygon.js';
import MixedGeometryBatch from '../../../../../../src/ol/render/webgl/MixedGeometryBatch.js';
import {
  generateLineStringRenderInstructions,
  generatePointRenderInstructions,
  generatePolygonRenderInstructions,
} from '../../../../../../src/ol/render/webgl/renderinstructions.js';
import {
  compose as composeTransform,
  create as createTransform,
} from '../../../../../../src/ol/transform.js';

const SAMPLE_FRAMESTATE = {
  viewState: {
    center: [0, 10],
    resolution: 1,
    rotation: 0,
  },
  size: [10, 10],
};
const SAMPLE_TRANSFORM = composeTransform(
  createTransform(),
  0,
  0,
  2 / (SAMPLE_FRAMESTATE.viewState.resolution * SAMPLE_FRAMESTATE.size[0]),
  2 / (SAMPLE_FRAMESTATE.viewState.resolution * SAMPLE_FRAMESTATE.size[1]),
  -SAMPLE_FRAMESTATE.viewState.rotation,
  -SAMPLE_FRAMESTATE.viewState.center[0],
  -SAMPLE_FRAMESTATE.viewState.center[1],
);

describe('Render instructions utilities', function () {
  let mixedBatch, customAttributes;

  beforeEach(function () {
    customAttributes = [
      {
        name: 'test',
        size: 1,
        callback: function (feature) {
          return feature.get('test');
        },
      },
      {
        name: 'testVec',
        size: 3,
        callback: function (feature) {
          return feature.get('test2');
        },
      },
    ];

    mixedBatch = new MixedGeometryBatch();
    mixedBatch.addFeatures([
      new Feature({
        test: 1000,
        test2: [22, 33, 44],
        test3: null,
        geometry: new Point([10, 20]),
      }),
      new Feature({
        test: 2000,
        test2: [44, 55, 66],
        test3: 3,
        geometry: new Point([30, 40]),
      }),
      new Feature({
        test: 3000,
        test2: [66, 77, 88],
        geometry: new Polygon([
          [
            [10, 10],
            [20, 10],
            [30, 20],
            [20, 40],
            [10, 10],
          ],
        ]),
      }),
      new Feature({
        test: 4000,
        test2: [88, 99, 0],
        geometry: new LineString(
          [
            [100, 200, 1],
            [300, 400, 2],
            [500, 600, 3],
          ],
          'XYM',
        ),
      }),
    ]);
  });

  let renderInstructions;

  describe('generatePointRenderInstructions', function () {
    beforeEach(function () {
      renderInstructions = generatePointRenderInstructions(
        mixedBatch.pointBatch,
        new Float32Array(0),
        customAttributes,
        SAMPLE_TRANSFORM,
      );
    });
    it('generates render instructions', function () {
      expect(Array.from(renderInstructions)).to.eql([
        2, 2, 1000, 22, 33, 44, 6, 6, 2000, 44, 55, 66,
      ]);
    });
  });

  describe('generateLineStringRenderInstructions', function () {
    beforeEach(function () {
      renderInstructions = generateLineStringRenderInstructions(
        mixedBatch.lineStringBatch,
        new Float32Array(0),
        customAttributes,
        SAMPLE_TRANSFORM,
      );
    });
    it('generates render instructions', function () {
      expect(Array.from(renderInstructions)).to.eql([
        3000, 66, 77, 88, 5, 2, 0, 0, 4, 0, 0, 6, 2, 0, 4, 6, 0, 2, 0, 0, 4000,
        88, 99, 0, 3, 20, 38, 1, 60, 78, 2, 100, 118, 3,
      ]);
    });
  });

  describe('generatePolygonRenderInstructions', function () {
    beforeEach(function () {
      renderInstructions = generatePolygonRenderInstructions(
        mixedBatch.polygonBatch,
        new Float32Array(0),
        customAttributes,
        SAMPLE_TRANSFORM,
      );
    });
    it('generates render instructions', function () {
      expect(Array.from(renderInstructions)).to.eql([
        3000, 66, 77, 88, 1, 5, 2, 0, 4, 0, 6, 2, 4, 6, 2, 0,
      ]);
    });
  });

  describe('custom attribute returning an array', () => {
    beforeEach(function () {
      renderInstructions = generatePointRenderInstructions(
        mixedBatch.pointBatch,
        new Float32Array(0),
        [
          {
            name: 'test',
            size: 4,
            callback: function () {
              return [0, 1, 2, 3];
            },
          },
        ],
        SAMPLE_TRANSFORM,
      );
    });
    it('generates render instructions', function () {
      expect(Array.from(renderInstructions)).to.eql([
        2, 2, 0, 1, 2, 3, 6, 6, 0, 1, 2, 3,
      ]);
    });
  });

  describe('undefined property', () => {
    it('uses the value UNDEFINED_PROP_VALUE if the feature does not have this property set', () => {
      renderInstructions = generatePointRenderInstructions(
        mixedBatch.pointBatch,
        new Float32Array(0),
        [
          {
            name: 'test',
            size: 1,
            callback: function (feature) {
              return feature.get('anotherProp');
            },
          },
        ],
        SAMPLE_TRANSFORM,
      );

      expect(Array.from(renderInstructions)).to.eql([
        2, 2, -9999999, 6, 6, -9999999,
      ]);
    });
    it('uses zero if the feature have this property set to null', () => {
      renderInstructions = generatePointRenderInstructions(
        mixedBatch.pointBatch,
        new Float32Array(0),
        [
          {
            name: 'test',
            size: 1,
            callback: function (feature) {
              return feature.get('test3');
            },
          },
        ],
        SAMPLE_TRANSFORM,
      );

      expect(Array.from(renderInstructions)).to.eql([2, 2, 0, 6, 6, 3]);
    });

    describe('an attribute value conflicts with UNDEFINED_PROP_VALUE', () => {
      let consoleSpy, originalConsole;
      beforeEach(() => {
        originalConsole = console;
        consoleSpy = sinonSpy();
        window.console = {
          ...console,
          warn: consoleSpy,
        };
        mixedBatch = new MixedGeometryBatch();
        mixedBatch.addFeatures([
          new Feature({
            test: UNDEFINED_PROP_VALUE,
            geometry: new Point([10, 20]),
          }),
        ]);
      });
      afterEach(function () {
        window.console = originalConsole;
      });
      it('outputs a console warning', () => {
        renderInstructions = generatePointRenderInstructions(
          mixedBatch.pointBatch,
          new Float32Array(0),
          [
            {
              name: 'test',
              size: 1,
              callback: function (feature) {
                return feature.get('test');
              },
            },
          ],
          SAMPLE_TRANSFORM,
        );

        expect(
          consoleSpy.calledWith(
            'The "has" operator might return false positives.',
          ),
        ).to.be(true);
      });
    });
  });
});
