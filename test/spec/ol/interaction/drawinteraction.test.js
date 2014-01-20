goog.provide('ol.test.interaction.Draw');

describe('ol.interaction.Draw', function() {
  var target, map, source;

  var width = 360;
  var height = 180;

  beforeEach(function() {
    target = document.createElement('div');
    var style = target.style;
    style.position = 'absolute';
    style.left = '-1000px';
    style.top = '-1000px';
    style.width = width + 'px';
    style.height = height + 'px';
    document.body.appendChild(target);
    source = new ol.source.Vector();
    var layer = new ol.layer.Vector({source: source});
    map = new ol.Map({
      target: target,
      renderer: ol.RendererHint.CANVAS,
      layers: [layer],
      view: new ol.View2D({
        projection: 'EPSG:4326',
        center: [0, 0],
        resolution: 1
      })
    });
  });

  afterEach(function() {
    goog.dispose(map);
    document.body.removeChild(target);
  });

  /**
   * Simulates a browser event on the map viewport.  The client x/y location
   * will be adjusted as if the map were centered at 0,0.
   * @param {string} type Event type.
   * @param {number} x Horizontal offset from map center.
   * @param {number} y Vertical offset from map center.
   */
  function simulateEvent(type, x, y) {
    var viewport = map.getViewport();
    // calculated in case body has top < 0 (test runner with small window)
    var position = goog.style.getClientPosition(viewport);
    var event = new goog.events.BrowserEvent({
      type: type,
      clientX: position.x + x + width / 2,
      clientY: position.y + y + height / 2
    });
    goog.events.fireListeners(viewport, type, false, event);
  }

  describe('constructor', function() {

    it('creates a new interaction', function() {
      var draw = new ol.interaction.Draw({
        source: source,
        type: ol.geom.GeometryType.POINT
      });
      expect(draw).to.be.a(ol.interaction.Draw);
      expect(draw).to.be.a(ol.interaction.Interaction);
    });

  });

  describe('drawing points', function() {
    var draw;

    beforeEach(function() {
      draw = new ol.interaction.Draw({
        source: source,
        type: ol.geom.GeometryType.POINT
      });
      map.addInteraction(draw);
    });

    it('draws a point on click', function() {
      simulateEvent('mousemove', 10, 20);
      simulateEvent('mousedown', 10, 20);
      simulateEvent('mouseup', 10, 20);
      simulateEvent('click', 10, 20);
      var features = source.getAllFeatures();
      expect(features).to.have.length(1);
      var geometry = features[0].getGeometry();
      expect(geometry).to.be.a(ol.geom.Point);
      expect(geometry.getCoordinates()).to.eql([10, -20]);
    });

    it('does not draw a point with a significant drag', function() {
      simulateEvent('mousemove', 10, 20);
      simulateEvent('mousedown', 10, 20);
      simulateEvent('mousemove', 15, 20);
      simulateEvent('mouseup', 15, 20);
      simulateEvent('click', 15, 20);
      var features = source.getAllFeatures();
      expect(features).to.have.length(0);
    });

    it('triggers draw events', function() {
      var ds = sinon.spy();
      var de = sinon.spy();
      goog.events.listen(draw, ol.DrawEventType.DRAWSTART, ds);
      goog.events.listen(draw, ol.DrawEventType.DRAWEND, de);
      simulateEvent('mousemove', 10, 20);
      simulateEvent('mousedown', 10, 20);
      simulateEvent('mouseup', 10, 20);
      simulateEvent('click', 10, 20);
      simulateEvent('mousemove', 20, 20);
      expect(ds).to.be.called(2);
      expect(de).to.be.called(1);
    });

  });

  describe('drawing multipoints', function() {

    beforeEach(function() {
      map.addInteraction(new ol.interaction.Draw({
        source: source,
        type: ol.geom.GeometryType.MULTI_POINT
      }));
    });

    it('draws multipoint on click', function() {
      simulateEvent('mousemove', 30, 15);
      simulateEvent('mousedown', 30, 15);
      simulateEvent('mouseup', 30, 15);
      simulateEvent('click', 30, 15);
      var features = source.getAllFeatures();
      expect(features).to.have.length(1);
      var geometry = features[0].getGeometry();
      expect(geometry).to.be.a(ol.geom.MultiPoint);
      expect(geometry.getCoordinates()).to.eql([[30, -15]]);
    });

  });

  describe('drawing linestrings', function() {
    var draw;

    beforeEach(function() {
      draw = new ol.interaction.Draw({
        source: source,
        type: ol.geom.GeometryType.LINE_STRING
      });
      map.addInteraction(draw);
    });

    it('draws linestring with clicks, finishing on last point', function() {
      // first point
      simulateEvent('mousemove', 10, 20);
      simulateEvent('mousedown', 10, 20);
      simulateEvent('mouseup', 10, 20);
      simulateEvent('click', 10, 20);

      // second point
      simulateEvent('mousemove', 30, 20);
      simulateEvent('mousedown', 30, 20);
      simulateEvent('mouseup', 30, 20);
      simulateEvent('click', 30, 20);

      // finish on second point
      simulateEvent('mousedown', 30, 20);
      simulateEvent('mouseup', 30, 20);
      simulateEvent('click', 30, 20);

      var features = source.getAllFeatures();
      expect(features).to.have.length(1);
      var geometry = features[0].getGeometry();
      expect(geometry).to.be.a(ol.geom.LineString);
      expect(geometry.getCoordinates()).to.eql([[10, -20], [30, -20]]);
    });

    it('does not add a point with a significant drag', function() {
      // first point
      simulateEvent('mousemove', 10, 20);
      simulateEvent('mousedown', 10, 20);
      simulateEvent('mouseup', 10, 20);
      simulateEvent('click', 10, 20);

      // drag map
      simulateEvent('mousemove', 15, 20);
      simulateEvent('mousedown', 15, 20);
      simulateEvent('mousemove', 20, 20);
      simulateEvent('mouseup', 20, 20);
      simulateEvent('click', 20, 20);


      // second point
      simulateEvent('mousemove', 30, 20);
      simulateEvent('mousedown', 30, 20);
      simulateEvent('mouseup', 30, 20);
      simulateEvent('click', 30, 20);

      // finish on second point
      simulateEvent('mousedown', 30, 20);
      simulateEvent('mouseup', 30, 20);
      simulateEvent('click', 30, 20);

      var features = source.getAllFeatures();
      expect(features).to.have.length(1);
      var geometry = features[0].getGeometry();
      expect(geometry).to.be.a(ol.geom.LineString);
      expect(geometry.getCoordinates()).to.eql([[10, -20], [30, -20]]);
    });

    it('triggers draw events', function() {
      var ds = sinon.spy();
      var de = sinon.spy();
      goog.events.listen(draw, ol.DrawEventType.DRAWSTART, ds);
      goog.events.listen(draw, ol.DrawEventType.DRAWEND, de);

      // first point
      simulateEvent('mousemove', 10, 20);
      simulateEvent('mousedown', 10, 20);
      simulateEvent('mouseup', 10, 20);
      simulateEvent('click', 10, 20);

      // second point
      simulateEvent('mousemove', 30, 20);
      simulateEvent('mousedown', 30, 20);
      simulateEvent('mouseup', 30, 20);
      simulateEvent('click', 30, 20);

      // finish on second point
      simulateEvent('mousedown', 30, 20);
      simulateEvent('mouseup', 30, 20);
      simulateEvent('click', 30, 20);
      simulateEvent('mousemove', 10, 20);

      expect(ds).to.be.called(1);
      expect(de).to.be.called(1);
    });

  });

  describe('drawing multi-linestrings', function() {

    beforeEach(function() {
      map.addInteraction(new ol.interaction.Draw({
        source: source,
        type: ol.geom.GeometryType.MULTI_LINE_STRING
      }));
    });

    it('draws multi with clicks, finishing on last point', function() {
      // first point
      simulateEvent('mousemove', 10, 20);
      simulateEvent('mousedown', 10, 20);
      simulateEvent('mouseup', 10, 20);
      simulateEvent('click', 10, 20);

      // second point
      simulateEvent('mousemove', 30, 20);
      simulateEvent('mousedown', 30, 20);
      simulateEvent('mouseup', 30, 20);
      simulateEvent('click', 30, 20);

      // finish on second point
      simulateEvent('mousedown', 30, 20);
      simulateEvent('mouseup', 30, 20);
      simulateEvent('click', 30, 20);

      var features = source.getAllFeatures();
      expect(features).to.have.length(1);
      var geometry = features[0].getGeometry();
      expect(geometry).to.be.a(ol.geom.MultiLineString);
      expect(geometry.getCoordinates()).to.eql([[[10, -20], [30, -20]]]);
    });

  });

  describe('drawing polygons', function() {
    var draw;

    beforeEach(function() {
      draw = new ol.interaction.Draw({
        source: source,
        type: ol.geom.GeometryType.POLYGON
      });
      map.addInteraction(draw);
    });

    it('draws polygon with clicks, finishing on first point', function() {
      // first point
      simulateEvent('mousemove', 10, 20);
      simulateEvent('mousedown', 10, 20);
      simulateEvent('mouseup', 10, 20);
      simulateEvent('click', 10, 20);

      // second point
      simulateEvent('mousemove', 30, 20);
      simulateEvent('mousedown', 30, 20);
      simulateEvent('mouseup', 30, 20);
      simulateEvent('click', 30, 20);

      // third point
      simulateEvent('mousemove', 30, 10);
      simulateEvent('mousedown', 30, 10);
      simulateEvent('mouseup', 30, 10);
      simulateEvent('click', 30, 10);

      // finish on first point
      simulateEvent('mousemove', 10, 20);
      simulateEvent('mousedown', 10, 20);
      simulateEvent('mouseup', 10, 20);
      simulateEvent('click', 10, 20);

      var features = source.getAllFeatures();
      expect(features).to.have.length(1);
      var geometry = features[0].getGeometry();
      expect(geometry).to.be.a(ol.geom.Polygon);

      // note that order is forced clockwise (despite drawing counter-clockwise)
      expect(geometry.getCoordinates()).to.eql([
        [[10, -20], [30, -10], [30, -20], [10, -20]]
      ]);
    });

    it('triggers draw events', function() {
      var ds = sinon.spy();
      var de = sinon.spy();
      goog.events.listen(draw, ol.DrawEventType.DRAWSTART, ds);
      goog.events.listen(draw, ol.DrawEventType.DRAWEND, de);

      // first point
      simulateEvent('mousemove', 10, 20);
      simulateEvent('mousedown', 10, 20);
      simulateEvent('mouseup', 10, 20);
      simulateEvent('click', 10, 20);

      // second point
      simulateEvent('mousemove', 30, 20);
      simulateEvent('mousedown', 30, 20);
      simulateEvent('mouseup', 30, 20);
      simulateEvent('click', 30, 20);

      // third point
      simulateEvent('mousemove', 30, 10);
      simulateEvent('mousedown', 30, 10);
      simulateEvent('mouseup', 30, 10);
      simulateEvent('click', 30, 10);

      // finish on first point
      simulateEvent('mousemove', 10, 20);
      simulateEvent('mousedown', 10, 20);
      simulateEvent('mouseup', 10, 20);
      simulateEvent('click', 10, 20);

      expect(ds).to.be.called(1);
      expect(de).to.be.called(1);
    });

  });

  describe('drawing multi-polygons', function() {

    beforeEach(function() {
      map.addInteraction(new ol.interaction.Draw({
        source: source,
        type: ol.geom.GeometryType.MULTI_POLYGON
      }));
    });

    it('draws multi with clicks, finishing on first point', function() {
      // first point
      simulateEvent('mousemove', 10, 20);
      simulateEvent('mousedown', 10, 20);
      simulateEvent('mouseup', 10, 20);
      simulateEvent('click', 10, 20);

      // second point
      simulateEvent('mousemove', 30, 20);
      simulateEvent('mousedown', 30, 20);
      simulateEvent('mouseup', 30, 20);
      simulateEvent('click', 30, 20);

      // third point
      simulateEvent('mousemove', 30, 10);
      simulateEvent('mousedown', 30, 10);
      simulateEvent('mouseup', 30, 10);
      simulateEvent('click', 30, 10);

      // finish on first point
      simulateEvent('mousemove', 10, 20);
      simulateEvent('mousedown', 10, 20);
      simulateEvent('mouseup', 10, 20);
      simulateEvent('click', 10, 20);

      var features = source.getAllFeatures();
      expect(features).to.have.length(1);
      var geometry = features[0].getGeometry();
      expect(geometry).to.be.a(ol.geom.MultiPolygon);
      var coordinates = geometry.getCoordinates();
      expect(coordinates).to.have.length(1);

      // note that order is forced clockwise (despite drawing counter-clockwise)
      expect(coordinates[0]).to.eql([
        [[10, -20], [30, -10], [30, -20], [10, -20]]
      ]);
    });

  });

});

goog.require('goog.dispose');
goog.require('goog.events');
goog.require('goog.events.BrowserEvent');
goog.require('goog.style');
goog.require('ol.Map');
goog.require('ol.RendererHint');
goog.require('ol.View2D');
goog.require('ol.geom.GeometryType');
goog.require('ol.geom.LineString');
goog.require('ol.geom.MultiLineString');
goog.require('ol.geom.MultiPoint');
goog.require('ol.geom.MultiPolygon');
goog.require('ol.geom.Point');
goog.require('ol.geom.Polygon');
goog.require('ol.interaction.Draw');
goog.require('ol.interaction.Interaction');
goog.require('ol.layer.Vector');
goog.require('ol.source.Vector');
