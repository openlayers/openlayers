import {assert} from 'chai';
import Circle from '../../../../../../src/ol/geom/Circle.js';
import GeometryCollection from '../../../../../../src/ol/geom/GeometryCollection.js';
import LineString from '../../../../../../src/ol/geom/LineString.js';
import MultiLineString from '../../../../../../src/ol/geom/MultiLineString.js';
import MultiPoint from '../../../../../../src/ol/geom/MultiPoint.js';
import MultiPolygon from '../../../../../../src/ol/geom/MultiPolygon.js';
import Point from '../../../../../../src/ol/geom/Point.js';
import Polygon from '../../../../../../src/ol/geom/Polygon.js';
import VectorContext from '../../../../../../src/ol/render/VectorContext.js';
import CanvasImmediateRenderer from '../../../../../../src/ol/render/canvas/Immediate.js';
import CircleStyle from '../../../../../../src/ol/style/Circle.js';
import Fill from '../../../../../../src/ol/style/Fill.js';
import Stroke from '../../../../../../src/ol/style/Stroke.js';
import Style from '../../../../../../src/ol/style/Style.js';
import Text from '../../../../../../src/ol/style/Text.js';

describe('ol.render.canvas.Immediate', function () {
  function getMockContext() {
    return {
      setLineDash: vi.fn(),
      beginPath: vi.fn(),
      closePath: vi.fn(),
      stroke: vi.fn(),
      lineTo: vi.fn(),
      moveTo: vi.fn(),
    };
  }

  describe('constructor', function () {
    it('creates an instance', function () {
      const instance = new CanvasImmediateRenderer();
      assert.instanceOf(instance, CanvasImmediateRenderer);
      assert.instanceOf(instance, VectorContext);
    });
  });

  describe('#setStyle()', function () {
    it('calls the more specific methods with style parts', function () {
      const context = new CanvasImmediateRenderer();
      vi.spyOn(context, 'setFillStrokeStyle');
      vi.spyOn(context, 'setImageStyle');
      vi.spyOn(context, 'setTextStyle');
      const fill = new Fill({});
      const stroke = new Stroke({});
      const text = new Text({});
      const image = new CircleStyle({});
      const style = new Style({
        fill: fill,
        stroke: stroke,
        image: image,
        text: text,
      });

      context.setStyle(style);
      assert.strictEqual(context.setFillStrokeStyle.mock.calls.length, 1);
      assert.deepEqual(context.setFillStrokeStyle.mock.calls[0], [
        fill,
        stroke,
      ]);
      assert.strictEqual(context.setImageStyle.mock.calls.length, 1);
      assert.deepEqual(context.setImageStyle.mock.calls[0], [image]);
      assert.strictEqual(context.setTextStyle.mock.calls.length, 1);
      assert.deepEqual(context.setTextStyle.mock.calls[0], [text]);
    });
  });

  describe('#drawGeometry()', function () {
    const extent = [-10, -10, 10, 10];

    it('calls drawPoint() with a Point', function () {
      const context = new CanvasImmediateRenderer(getMockContext(), 1, extent);
      vi.spyOn(context, 'drawPoint');

      const geometry = new Point([1, 2]);
      context.drawGeometry(geometry);
      assert.strictEqual(context.drawPoint.mock.calls.length, 1);
      assert.deepEqual(context.drawPoint.mock.calls[0], [geometry]);
    });

    it('calls drawLineString() with a LineString', function () {
      const context = new CanvasImmediateRenderer(getMockContext(), 1, extent);
      vi.spyOn(context, 'drawLineString');

      const geometry = new LineString([
        [1, 2],
        [3, 4],
      ]);
      context.drawGeometry(geometry);
      assert.strictEqual(context.drawLineString.mock.calls.length, 1);
      assert.deepEqual(context.drawLineString.mock.calls[0], [geometry]);
    });

    it('calls drawPolygon() with a Polygon', function () {
      const context = new CanvasImmediateRenderer(getMockContext(), 1, extent);
      vi.spyOn(context, 'drawPolygon');

      const geometry = new Polygon([
        [
          [1, 2],
          [3, 4],
          [5, 6],
          [1, 2],
        ],
      ]);
      context.drawGeometry(geometry);
      assert.strictEqual(context.drawPolygon.mock.calls.length, 1);
      assert.deepEqual(context.drawPolygon.mock.calls[0], [geometry]);
    });

    it('calls drawMultiPoint() with a MultiPoint', function () {
      const context = new CanvasImmediateRenderer(getMockContext(), 1, extent);
      vi.spyOn(context, 'drawMultiPoint');

      const geometry = new MultiPoint([
        [1, 2],
        [3, 4],
      ]);
      context.drawGeometry(geometry);
      assert.strictEqual(context.drawMultiPoint.mock.calls.length, 1);
      assert.deepEqual(context.drawMultiPoint.mock.calls[0], [geometry]);
    });

    it('calls drawMultiLineString() with a MultiLineString', function () {
      const context = new CanvasImmediateRenderer(getMockContext(), 1, extent);
      vi.spyOn(context, 'drawMultiLineString');

      const geometry = new MultiLineString([
        [
          [1, 2],
          [3, 4],
        ],
      ]);
      context.drawGeometry(geometry);
      assert.strictEqual(context.drawMultiLineString.mock.calls.length, 1);
      assert.deepEqual(context.drawMultiLineString.mock.calls[0], [geometry]);
    });

    it('calls drawMultiPolygon() with a MultiPolygon', function () {
      const context = new CanvasImmediateRenderer(getMockContext(), 1, extent);
      vi.spyOn(context, 'drawMultiPolygon');

      const geometry = new MultiPolygon([
        [
          [
            [1, 2],
            [3, 4],
            [5, 6],
            [1, 2],
          ],
        ],
      ]);
      context.drawGeometry(geometry);
      assert.strictEqual(context.drawMultiPolygon.mock.calls.length, 1);
      assert.deepEqual(context.drawMultiPolygon.mock.calls[0], [geometry]);
    });

    it('calls drawGeometryCollection() with a GeometryCollection', function () {
      const context = new CanvasImmediateRenderer(getMockContext(), 1, extent);
      vi.spyOn(context, 'drawGeometryCollection');
      vi.spyOn(context, 'drawPoint');
      vi.spyOn(context, 'drawLineString');
      vi.spyOn(context, 'drawPolygon');

      const point = new Point([1, 2]);
      const linestring = new LineString([
        [1, 2],
        [3, 4],
      ]);
      const polygon = new Polygon([
        [
          [1, 2],
          [3, 4],
          [5, 6],
          [1, 2],
        ],
      ]);

      const geometry = new GeometryCollection([point, linestring, polygon]);
      context.drawGeometry(geometry);

      assert.strictEqual(context.drawGeometryCollection.mock.calls.length, 1);
      assert.strictEqual(context.drawPoint.mock.calls.length, 1);
      assert.deepEqual(context.drawPoint.mock.calls[0], [point]);
      assert.strictEqual(context.drawLineString.mock.calls.length, 1);
      assert.deepEqual(context.drawLineString.mock.calls[0], [linestring]);
      assert.strictEqual(context.drawPolygon.mock.calls.length, 1);
      assert.deepEqual(context.drawPolygon.mock.calls[0], [polygon]);
    });

    it('calls drawCircle() with a Circle', function () {
      const context = new CanvasImmediateRenderer(getMockContext(), 1, extent);
      vi.spyOn(context, 'drawCircle');

      const geometry = new Circle([0, 0]);
      context.drawGeometry(geometry);

      assert.strictEqual(context.drawCircle.mock.calls.length, 1);
      assert.deepEqual(context.drawCircle.mock.calls[0], [geometry]);
    });
  });

  describe('#drawMultiPolygon()', function () {
    it('creates the correct canvas instructions for 3D geometries', function () {
      const instructions = [];

      function serialize(index, instruction) {
        if (!instruction) {
          return 'id: ' + index + ' NO INSTRUCTION';
        }
        const parts = ['id: ' + index, 'type: ' + instruction.type];
        if (instruction.args) {
          parts.push(
            'args: [' +
              instruction.args
                .map(function (arg) {
                  if (typeof arg === 'number') {
                    return arg.toFixed(9);
                  }
                  return arg;
                })
                .join(', ') +
              ']',
          );
        }
        return parts.join(', ');
      }

      const context = {
        beginPath: function () {},
        moveTo: function (x, y) {
          instructions.push({
            type: 'moveTo',
            args: [x, y],
          });
        },
        lineTo: function (x, y) {
          instructions.push({
            type: 'lineTo',
            args: [x, y],
          });
        },
        closePath: function () {
          instructions.push({
            type: 'closePath',
          });
        },
        setLineDash: function () {},
        stroke: function () {},
      };

      const transform = [
        0.0004088332670837288, 0, 0, -0.0004088332670837288, 4480.991370439071,
        1529.5752568707105,
      ];

      const extent = [
        -10960437.252092224, 2762924.0275091752, -7572748.158493212,
        3741317.9895594316,
      ];

      const canvas = new CanvasImmediateRenderer(context, 1, extent, transform);

      canvas.strokeState_ = {
        lineCap: 'round',
        lineDash: [],
        lineJoin: 'round',
        lineWidth: 3,
        miterLimit: 10,
        strokeStyle: '#00FFFF',
      };

      const multiPolygonGeometry = new MultiPolygon([
        [
          [
            // first polygon
            [-80.736061, 28.788576000000006, 0], // moveTo()
            [-80.763557, 28.821799999999996, 0], // lineTo()
            [-80.817406, 28.895123999999996, 0], // lineTo()
            [-80.891304, 29.013130000000004, 0], // lineTo()
            [-80.916512, 29.071560000000005, 0], // lineTo()
            [-80.899323, 29.061249000000004, 0], // lineTo()
            [-80.862663, 28.991361999999995, 0], // lineTo()
            [-80.736061, 28.788576000000006, 0], //  closePath()
          ],
        ],
        [
          [
            // second polygon
            [-82.102127, 26.585724, 0], //          moveTo()
            [-82.067139, 26.497208, 0], //          lineTo()
            [-82.097641, 26.493585999999993, 0], // lineTo()
            [-82.135895, 26.642279000000002, 0], // lineTo()
            [-82.183495, 26.683082999999996, 0], // lineTo()
            [-82.128838, 26.693342, 0], //          lineTo()
            [-82.102127, 26.585724, 0], //           closePath()
          ],
        ],
      ]).transform('EPSG:4326', 'EPSG:3857');

      canvas.drawMultiPolygon(multiPolygonGeometry);

      const expected = [
        // first polygon
        {type: 'moveTo', args: [806.6035275946265, 160.48916296287916]},
        {type: 'lineTo', args: [805.3521540835154, 158.76358389011807]},
        {type: 'lineTo', args: [802.9014262612932, 154.95335187132082]},
        {type: 'lineTo', args: [799.5382461724039, 148.815592819916]},
        {type: 'lineTo', args: [798.3910020835165, 145.77392230456553]},
        {type: 'lineTo', args: [799.1732925724045, 146.31080369865776]},
        {type: 'lineTo', args: [800.8417299057378, 149.94832216046188]},
        {type: 'closePath'},
        // second polygon
        {type: 'moveTo', args: [744.4323460835158, 273.7179168205373]},
        {type: 'lineTo', args: [746.0246888390716, 278.22094795365365]},
        {type: 'lineTo', args: [744.6365089279602, 278.40513424671826]},
        {type: 'lineTo', args: [742.8955268835157, 270.83899948444764]},
        {type: 'lineTo', args: [740.7291979946272, 268.76099731369345]},
        {type: 'lineTo', args: [743.2166987946266, 268.23842607400616]},
        {type: 'closePath'},
      ];

      for (let i = 0, ii = instructions.length; i < ii; ++i) {
        const actualInstruction = serialize(i, instructions[i]);
        const expectedInstruction = serialize(i, expected[i]);
        assert.equal(actualInstruction, expectedInstruction);
      }

      assert.equal(instructions.length, expected.length);
    });
  });
});
