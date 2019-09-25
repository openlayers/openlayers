import Circle from '../../../../../src/ol/geom/Circle.js';
import GeometryCollection from '../../../../../src/ol/geom/GeometryCollection.js';
import LineString from '../../../../../src/ol/geom/LineString.js';
import MultiLineString from '../../../../../src/ol/geom/MultiLineString.js';
import MultiPoint from '../../../../../src/ol/geom/MultiPoint.js';
import MultiPolygon from '../../../../../src/ol/geom/MultiPolygon.js';
import Point from '../../../../../src/ol/geom/Point.js';
import Polygon from '../../../../../src/ol/geom/Polygon.js';
import VectorContext from '../../../../../src/ol/render/VectorContext.js';
import CanvasImmediateRenderer from '../../../../../src/ol/render/canvas/Immediate.js';
import CircleStyle from '../../../../../src/ol/style/Circle.js';
import Fill from '../../../../../src/ol/style/Fill.js';
import Stroke from '../../../../../src/ol/style/Stroke.js';
import Style from '../../../../../src/ol/style/Style.js';
import Text from '../../../../../src/ol/style/Text.js';


describe('ol.render.canvas.Immediate', () => {

  function getMockContext() {
    return {
      setLineDash: sinon.spy(),
      beginPath: sinon.spy(),
      closePath: sinon.spy(),
      stroke: sinon.spy(),
      lineTo: sinon.spy(),
      moveTo: sinon.spy()
    };
  }

  describe('constructor', () => {
    test('creates an instance', () => {
      const instance = new CanvasImmediateRenderer();
      expect(instance).toBeInstanceOf(CanvasImmediateRenderer);
      expect(instance).toBeInstanceOf(VectorContext);
    });
  });

  describe('#setStyle()', () => {
    test('calls the more specific methods with style parts', () => {
      const context = new CanvasImmediateRenderer();
      sinon.spy(context, 'setFillStrokeStyle');
      sinon.spy(context, 'setImageStyle');
      sinon.spy(context, 'setTextStyle');
      const fill = new Fill({});
      const stroke = new Stroke({});
      const text = new Text({});
      const image = new CircleStyle({});
      const style = new Style({
        fill: fill,
        stroke: stroke,
        image: image,
        text: text
      });

      context.setStyle(style);
      expect(context.setFillStrokeStyle.calledOnce).toBe(true);
      expect(context.setFillStrokeStyle.firstCall.calledWithExactly(fill, stroke)).toBe(true);
      expect(context.setImageStyle.calledOnce).toBe(true);
      expect(context.setImageStyle.firstCall.calledWithExactly(image)).toBe(true);
      expect(context.setTextStyle.calledOnce).toBe(true);
      expect(context.setTextStyle.firstCall.calledWithExactly(text)).toBe(true);
    });
  });

  describe('#drawGeometry()', () => {

    const extent = [-10, -10, 10, 10];

    test('calls drawPoint() with a Point', () => {
      const context = new CanvasImmediateRenderer(getMockContext(), 1, extent);
      sinon.spy(context, 'drawPoint');

      const geometry = new Point([1, 2]);
      context.drawGeometry(geometry);
      expect(context.drawPoint.calledOnce).toBe(true);
      expect(context.drawPoint.firstCall.calledWithExactly(geometry)).toBe(true);
    });

    test('calls drawLineString() with a LineString', () => {
      const context = new CanvasImmediateRenderer(getMockContext(), 1, extent);
      sinon.spy(context, 'drawLineString');

      const geometry = new LineString([[1, 2], [3, 4]]);
      context.drawGeometry(geometry);
      expect(context.drawLineString.calledOnce).toBe(true);
      expect(context.drawLineString.firstCall.calledWithExactly(geometry)).toBe(true);
    });

    test('calls drawPolygon() with a Polygon', () => {
      const context = new CanvasImmediateRenderer(getMockContext(), 1, extent);
      sinon.spy(context, 'drawPolygon');

      const geometry = new Polygon([[[1, 2], [3, 4], [5, 6], [1, 2]]]);
      context.drawGeometry(geometry);
      expect(context.drawPolygon.calledOnce).toBe(true);
      expect(context.drawPolygon.firstCall.calledWithExactly(geometry)).toBe(true);
    });

    test('calls drawMultiPoint() with a MultiPoint', () => {
      const context = new CanvasImmediateRenderer(getMockContext(), 1, extent);
      sinon.spy(context, 'drawMultiPoint');

      const geometry = new MultiPoint([[1, 2], [3, 4]]);
      context.drawGeometry(geometry);
      expect(context.drawMultiPoint.calledOnce).toBe(true);
      expect(context.drawMultiPoint.firstCall.calledWithExactly(geometry)).toBe(true);
    });

    test('calls drawMultiLineString() with a MultiLineString', () => {
      const context = new CanvasImmediateRenderer(getMockContext(), 1, extent);
      sinon.spy(context, 'drawMultiLineString');

      const geometry = new MultiLineString([[[1, 2], [3, 4]]]);
      context.drawGeometry(geometry);
      expect(context.drawMultiLineString.calledOnce).toBe(true);
      expect(context.drawMultiLineString.firstCall.calledWithExactly(geometry)).toBe(true);
    });

    test('calls drawMultiPolygon() with a MultiPolygon', () => {
      const context = new CanvasImmediateRenderer(getMockContext(), 1, extent);
      sinon.spy(context, 'drawMultiPolygon');

      const geometry = new MultiPolygon([[[[1, 2], [3, 4], [5, 6], [1, 2]]]]);
      context.drawGeometry(geometry);
      expect(context.drawMultiPolygon.calledOnce).toBe(true);
      expect(context.drawMultiPolygon.firstCall.calledWithExactly(geometry)).toBe(true);
    });

    test('calls drawGeometryCollection() with a GeometryCollection', () => {
      const context = new CanvasImmediateRenderer(getMockContext(), 1, extent);
      sinon.spy(context, 'drawGeometryCollection');
      sinon.spy(context, 'drawPoint');
      sinon.spy(context, 'drawLineString');
      sinon.spy(context, 'drawPolygon');

      const point = new Point([1, 2]);
      const linestring = new LineString([[1, 2], [3, 4]]);
      const polygon = new Polygon([[[1, 2], [3, 4], [5, 6], [1, 2]]]);

      const geometry = new GeometryCollection([point, linestring, polygon]);
      context.drawGeometry(geometry);

      expect(context.drawGeometryCollection.calledOnce).toBe(true);
      expect(context.drawPoint.calledOnce).toBe(true);
      expect(context.drawPoint.firstCall.calledWithExactly(point)).toBe(true);
      expect(context.drawLineString.calledOnce).toBe(true);
      expect(context.drawLineString.firstCall.calledWithExactly(linestring)).toBe(true);
      expect(context.drawPolygon.calledOnce).toBe(true);
      expect(context.drawPolygon.firstCall.calledWithExactly(polygon)).toBe(true);
    });

    test('calls drawCircle() with a Circle', () => {
      const context = new CanvasImmediateRenderer(getMockContext(), 1, extent);
      sinon.spy(context, 'drawCircle');

      const geometry = new Circle([0, 0]);
      context.drawGeometry(geometry);

      expect(context.drawCircle.calledOnce).toBe(true);
      expect(context.drawCircle.firstCall.calledWithExactly(geometry)).toBe(true);
    });

  });

  describe('#drawMultiPolygon()', () => {

    test('creates the correct canvas instructions for 3D geometries', () => {

      const instructions = [];

      function serialize(index, instruction) {
        if (!instruction) {
          return 'id: ' + index + ' NO INSTRUCTION';
        }
        const parts = [
          'id: ' + index,
          'type: ' + instruction.type
        ];
        if (instruction.args) {
          parts.push('args: [' + instruction.args.map(function(arg) {
            if (typeof arg === 'number') {
              return arg.toFixed(9);
            } else {
              return arg;
            }
          }).join(', ') + ']');
        }
        return parts.join(', ');
      }

      const context = {
        beginPath: function() {},
        moveTo: function(x, y) {
          instructions.push({
            type: 'moveTo',
            args: [x, y]
          });
        },
        lineTo: function(x, y) {
          instructions.push({
            type: 'lineTo',
            args: [x, y]
          });
        },
        closePath: function() {
          instructions.push({
            type: 'closePath'
          });
        },
        setLineDash: function() {},
        stroke: function() {}
      };

      const transform = [
        0.0004088332670837288, 0,
        0, -0.0004088332670837288,
        4480.991370439071, 1529.5752568707105
      ];

      const extent = [
        -10960437.252092224, 2762924.0275091752,
        -7572748.158493212, 3741317.9895594316
      ];

      const canvas = new CanvasImmediateRenderer(context, 1, extent, transform);

      canvas.strokeState_ = {
        lineCap: 'round',
        lineDash: [],
        lineJoin: 'round',
        lineWidth: 3,
        miterLimit: 10,
        strokeStyle: '#00FFFF'
      };

      const multiPolygonGeometry = new MultiPolygon([[[
        // first polygon
        [-80.736061, 28.788576000000006, 0], // moveTo()
        [-80.763557, 28.821799999999996, 0], // lineTo()
        [-80.817406, 28.895123999999996, 0], // lineTo()
        [-80.891304, 29.013130000000004, 0], // lineTo()
        [-80.916512, 29.071560000000005, 0], // lineTo()
        [-80.899323, 29.061249000000004, 0], // lineTo()
        [-80.862663, 28.991361999999995, 0], // lineTo()
        [-80.736061, 28.788576000000006, 0] //  closePath()
      ]], [[
        // second polygon
        [-82.102127, 26.585724, 0], //          moveTo()
        [-82.067139, 26.497208, 0], //          lineTo()
        [-82.097641, 26.493585999999993, 0], // lineTo()
        [-82.135895, 26.642279000000002, 0], // lineTo()
        [-82.183495, 26.683082999999996, 0], // lineTo()
        [-82.128838, 26.693342, 0], //          lineTo()
        [-82.102127, 26.585724, 0] //           closePath()
      ]]]).transform('EPSG:4326', 'EPSG:3857');

      canvas.drawMultiPolygon(multiPolygonGeometry, null);

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
        {type: 'closePath'}
      ];


      for (let i = 0, ii = instructions.length; i < ii; ++i) {
        const actualInstruction = serialize(i, instructions[i]);
        const expectedInstruction = serialize(i, expected[i]);
        expect(actualInstruction).toBe(expectedInstruction);
      }

      expect(instructions.length).toBe(expected.length);

    });
  });
});
