goog.provide('ol.test.render.canvas.Immediate');

goog.require('ol.geom.Circle');
goog.require('ol.geom.GeometryCollection');
goog.require('ol.geom.LineString');
goog.require('ol.geom.MultiLineString');
goog.require('ol.geom.MultiPoint');
goog.require('ol.geom.MultiPolygon');
goog.require('ol.geom.Point');
goog.require('ol.geom.Polygon');
goog.require('ol.render.VectorContext');
goog.require('ol.render.canvas.Immediate');
goog.require('ol.style.Circle');
goog.require('ol.style.Fill');
goog.require('ol.style.Stroke');
goog.require('ol.style.Style');
goog.require('ol.style.Text');


describe('ol.render.canvas.Immediate', function() {

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

  describe('constructor', function() {
    it('creates an instance', function() {
      var instance = new ol.render.canvas.Immediate();
      expect(instance).to.be.a(ol.render.canvas.Immediate);
      expect(instance).to.be.a(ol.render.VectorContext);
    });
  });

  describe('#setStyle()', function() {
    it('calls the more specific methods with style parts', function() {
      var context = new ol.render.canvas.Immediate();
      sinon.spy(context, 'setFillStrokeStyle');
      sinon.spy(context, 'setImageStyle');
      sinon.spy(context, 'setTextStyle');
      var fill = new ol.style.Fill({});
      var stroke = new ol.style.Stroke({});
      var text = new ol.style.Text({});
      var image = new ol.style.Circle({});
      var style = new ol.style.Style({
        fill: fill,
        stroke: stroke,
        image: image,
        text: text
      });

      context.setStyle(style);
      expect(context.setFillStrokeStyle.calledOnce).to.be(true);
      expect(context.setFillStrokeStyle.firstCall.calledWithExactly(fill, stroke)).to.be(true);
      expect(context.setImageStyle.calledOnce).to.be(true);
      expect(context.setImageStyle.firstCall.calledWithExactly(image)).to.be(true);
      expect(context.setTextStyle.calledOnce).to.be(true);
      expect(context.setTextStyle.firstCall.calledWithExactly(text)).to.be(true);
    });
  });

  describe('#drawGeometry()', function() {

    var extent = [-10, -10, 10, 10];

    it('calls drawPoint() with a Point', function() {
      var context = new ol.render.canvas.Immediate(getMockContext(), 1, extent);
      sinon.spy(context, 'drawPoint');

      var geometry = new ol.geom.Point([1, 2]);
      context.drawGeometry(geometry);
      expect(context.drawPoint.calledOnce).to.be(true);
      expect(context.drawPoint.firstCall.calledWithExactly(geometry)).to.be(true);
    });

    it('calls drawLineString() with a LineString', function() {
      var context = new ol.render.canvas.Immediate(getMockContext(), 1, extent);
      sinon.spy(context, 'drawLineString');

      var geometry = new ol.geom.LineString([[1, 2], [3, 4]]);
      context.drawGeometry(geometry);
      expect(context.drawLineString.calledOnce).to.be(true);
      expect(context.drawLineString.firstCall.calledWithExactly(geometry)).to.be(true);
    });

    it('calls drawPolygon() with a Polygon', function() {
      var context = new ol.render.canvas.Immediate(getMockContext(), 1, extent);
      sinon.spy(context, 'drawPolygon');

      var geometry = new ol.geom.Polygon([[[1, 2], [3, 4], [5, 6], [1, 2]]]);
      context.drawGeometry(geometry);
      expect(context.drawPolygon.calledOnce).to.be(true);
      expect(context.drawPolygon.firstCall.calledWithExactly(geometry)).to.be(true);
    });

    it('calls drawMultiPoint() with a MultiPoint', function() {
      var context = new ol.render.canvas.Immediate(getMockContext(), 1, extent);
      sinon.spy(context, 'drawMultiPoint');

      var geometry = new ol.geom.MultiPoint([[1, 2], [3, 4]]);
      context.drawGeometry(geometry);
      expect(context.drawMultiPoint.calledOnce).to.be(true);
      expect(context.drawMultiPoint.firstCall.calledWithExactly(geometry)).to.be(true);
    });

    it('calls drawMultiLineString() with a MultiLineString', function() {
      var context = new ol.render.canvas.Immediate(getMockContext(), 1, extent);
      sinon.spy(context, 'drawMultiLineString');

      var geometry = new ol.geom.MultiLineString([[[1, 2], [3, 4]]]);
      context.drawGeometry(geometry);
      expect(context.drawMultiLineString.calledOnce).to.be(true);
      expect(context.drawMultiLineString.firstCall.calledWithExactly(geometry)).to.be(true);
    });

    it('calls drawMultiPolygon() with a MultiPolygon', function() {
      var context = new ol.render.canvas.Immediate(getMockContext(), 1, extent);
      sinon.spy(context, 'drawMultiPolygon');

      var geometry = new ol.geom.MultiPolygon([[[[1, 2], [3, 4], [5, 6], [1, 2]]]]);
      context.drawGeometry(geometry);
      expect(context.drawMultiPolygon.calledOnce).to.be(true);
      expect(context.drawMultiPolygon.firstCall.calledWithExactly(geometry)).to.be(true);
    });

    it('calls drawGeometryCollection() with a GeometryCollection', function() {
      var context = new ol.render.canvas.Immediate(getMockContext(), 1, extent);
      sinon.spy(context, 'drawGeometryCollection');
      sinon.spy(context, 'drawPoint');
      sinon.spy(context, 'drawLineString');
      sinon.spy(context, 'drawPolygon');

      var point = new ol.geom.Point([1, 2]);
      var linestring = new ol.geom.LineString([[1, 2], [3, 4]]);
      var polygon = new ol.geom.Polygon([[[1, 2], [3, 4], [5, 6], [1, 2]]]);

      var geometry = new ol.geom.GeometryCollection([point, linestring, polygon]);
      context.drawGeometry(geometry);

      expect(context.drawGeometryCollection.calledOnce).to.be(true);
      expect(context.drawPoint.calledOnce).to.be(true);
      expect(context.drawPoint.firstCall.calledWithExactly(point)).to.be(true);
      expect(context.drawLineString.calledOnce).to.be(true);
      expect(context.drawLineString.firstCall.calledWithExactly(linestring)).to.be(true);
      expect(context.drawPolygon.calledOnce).to.be(true);
      expect(context.drawPolygon.firstCall.calledWithExactly(polygon)).to.be(true);
    });

    it('calls drawCircle() with a Circle', function() {
      var context = new ol.render.canvas.Immediate(getMockContext(), 1, extent);
      sinon.spy(context, 'drawCircle');

      var geometry = new ol.geom.Circle([0, 0]);
      context.drawGeometry(geometry);

      expect(context.drawCircle.calledOnce).to.be(true);
      expect(context.drawCircle.firstCall.calledWithExactly(geometry)).to.be(true);
    });

  });

  describe('#drawMultiPolygon()', function() {

    it('creates the correct canvas instructions for 3D geometries', function() {

      var instructions = [];

      function serialize(index, instruction) {
        if (!instruction) {
          return 'id: ' + index + ' NO INSTRUCTION';
        }
        var parts = [
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

      var context = {
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

      var transform = [
        0.0004088332670837288, 0,
        0, -0.0004088332670837288,
        4480.991370439071, 1529.5752568707105
      ];

      var extent = [
        -10960437.252092224, 2762924.0275091752,
        -7572748.158493212, 3741317.9895594316
      ];

      var canvas = new ol.render.canvas.Immediate(context, 1, extent, transform);

      canvas.strokeState_ = {
        lineCap: 'round',
        lineDash: [],
        lineJoin: 'round',
        lineWidth: 3,
        miterLimit: 10,
        strokeStyle: '#00FFFF'
      };

      var multiPolygonGeometry = new ol.geom.MultiPolygon([[[
        // first polygon
        [-80.736061, 28.788576000000006, 0], // moveTo()
        [-80.763557, 28.821799999999996, 0], // lineTo()
        [-80.817406, 28.895123999999996, 0], // lineTo()
        [-80.891304, 29.013130000000004, 0], // lineTo()
        [-80.916512, 29.071560000000005, 0], // lineTo()
        [-80.899323, 29.061249000000004, 0], // lineTo()
        [-80.862663, 28.991361999999995, 0], // lineTo()
        [-80.736061, 28.788576000000006, 0] //  closePath()
      ]],[[
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

      var expected = [
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


      for (var i = 0, ii = instructions.length; i < ii; ++i) {
        var actualInstruction = serialize(i, instructions[i]);
        var expectedInstruction = serialize(i, expected[i]);
        expect(actualInstruction).to.equal(expectedInstruction);
      }

      expect(instructions.length).to.equal(expected.length);

    });
  });
});
