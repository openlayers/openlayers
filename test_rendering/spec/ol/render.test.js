goog.provide('ol.test.rendering.render');

goog.require('ol.geom.LineString');
goog.require('ol.geom.Point');
goog.require('ol.geom.Polygon');
goog.require('ol.render');
goog.require('ol.render.VectorContext');
goog.require('ol.render.canvas.Immediate');
goog.require('ol.style.Circle');
goog.require('ol.style.Fill');
goog.require('ol.style.Stroke');
goog.require('ol.style.Style');


describe('ol.render', function() {

  var context;

  beforeEach(function() {
    context = document.createElement('canvas').getContext('2d');
  });

  describe('ol.render.toContext()', function() {

    it('creates a vector context from a Canvas 2d context', function() {
      var vectorContext = ol.render.toContext(context, {size: [100, 100]});
      expect(vectorContext).to.be.a(ol.render.VectorContext);
      expect(vectorContext).to.be.a(ol.render.canvas.Immediate);
    });

    it('can be used to render a point geometry', function(done) {
      var vectorContext = ol.render.toContext(context, {size: [100, 100]});

      var style = new ol.style.Style({
        image: new ol.style.Circle({
          fill: new ol.style.Fill({
            color: 'green'
          }),
          radius: 10
        })
      });

      vectorContext.setStyle(style);
      vectorContext.drawGeometry(new ol.geom.Point([50, 50]));

      resembleCanvas(context.canvas,
          'spec/ol/expected/render-point.png', IMAGE_TOLERANCE, done);

    });

    it('can be used to render a linestring geometry', function(done) {
      var vectorContext = ol.render.toContext(context, {size: [100, 100]});

      var style = new ol.style.Style({
        stroke: new ol.style.Stroke({
          color: 'red',
          width: 14
        })
      });

      vectorContext.setStyle(style);
      vectorContext.drawGeometry(new ol.geom.LineString([
        [10, 60], [30, 40], [50, 60], [70, 40], [90, 60]
      ]));

      resembleCanvas(context.canvas,
          'spec/ol/expected/render-linestring.png', IMAGE_TOLERANCE, done);

    });

    it('respects lineCap for linestring', function(done) {
      var vectorContext = ol.render.toContext(context, {size: [100, 100]});

      var style = new ol.style.Style({
        stroke: new ol.style.Stroke({
          lineCap: 'butt',
          color: 'red',
          width: 14
        })
      });

      vectorContext.setStyle(style);
      vectorContext.drawGeometry(new ol.geom.LineString([
        [10, 60], [30, 40], [50, 60], [70, 40], [90, 60]
      ]));

      resembleCanvas(context.canvas,
          'spec/ol/expected/render-linestring-butt.png', IMAGE_TOLERANCE, done);

    });

    it('respects lineJoin for linestring', function(done) {
      var vectorContext = ol.render.toContext(context, {size: [100, 100]});

      var style = new ol.style.Style({
        stroke: new ol.style.Stroke({
          lineJoin: 'bevel',
          color: 'red',
          width: 14
        })
      });

      vectorContext.setStyle(style);
      vectorContext.drawGeometry(new ol.geom.LineString([
        [10, 60], [30, 40], [50, 60], [70, 40], [90, 60]
      ]));

      resembleCanvas(context.canvas,
          'spec/ol/expected/render-linestring-bevel.png', IMAGE_TOLERANCE, done);

    });

    it('can be used to render a polygon geometry', function(done) {
      var vectorContext = ol.render.toContext(context, {size: [100, 100]});

      var style = new ol.style.Style({
        stroke: new ol.style.Stroke({
          color: 'blue',
          width: 8
        }),
        fill: new ol.style.Fill({
          color: 'rgba(0,0,255,0.5)'
        })
      });

      vectorContext.setStyle(style);

      vectorContext.drawGeometry(new ol.geom.Polygon([
        [[25, 25], [75, 25], [75, 75], [25, 75], [25, 25]],
        [[40, 40], [40, 60], [60, 60], [60, 40], [40, 40]]
      ]));

      resembleCanvas(context.canvas,
          'spec/ol/expected/render-polygon.png', IMAGE_TOLERANCE, done);

    });

  });

});
