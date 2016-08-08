goog.provide('ol.test.interaction.Draw');

goog.require('ol.array');
goog.require('ol.events');
goog.require('ol.Feature');
goog.require('ol.Map');
goog.require('ol.MapBrowserPointerEvent');
goog.require('ol.View');
goog.require('ol.geom.Circle');
goog.require('ol.geom.LineString');
goog.require('ol.geom.MultiLineString');
goog.require('ol.geom.MultiPoint');
goog.require('ol.geom.MultiPolygon');
goog.require('ol.geom.Point');
goog.require('ol.geom.Polygon');
goog.require('ol.interaction.Draw');
goog.require('ol.interaction.Interaction');
goog.require('ol.layer.Vector');
goog.require('ol.pointer.PointerEvent');
goog.require('ol.source.Vector');


describe('ol.interaction.Draw', function() {
  var target, map, source;

  var width = 360;
  var height = 180;

  beforeEach(function(done) {
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
      layers: [layer],
      view: new ol.View({
        projection: 'EPSG:4326',
        center: [0, 0],
        resolution: 1
      })
    });
    map.once('postrender', function() {
      done();
    });
  });

  afterEach(function() {
    map.dispose();
    document.body.removeChild(target);
  });

  /**
   * Simulates a browser event on the map viewport.  The client x/y location
   * will be adjusted as if the map were centered at 0,0.
   * @param {string} type Event type.
   * @param {number} x Horizontal offset from map center.
   * @param {number} y Vertical offset from map center.
   * @param {boolean=} opt_shiftKey Shift key is pressed.
   */
  function simulateEvent(type, x, y, opt_shiftKey) {
    var viewport = map.getViewport();
    // calculated in case body has top < 0 (test runner with small window)
    var position = viewport.getBoundingClientRect();
    var shiftKey = opt_shiftKey !== undefined ? opt_shiftKey : false;
    var event = new ol.pointer.PointerEvent(type, {
      clientX: position.left + x + width / 2,
      clientY: position.top + y + height / 2,
      shiftKey: shiftKey
    });
    map.handleMapBrowserEvent(new ol.MapBrowserPointerEvent(type, map, event));
  }

  describe('constructor', function() {

    it('creates a new interaction', function() {
      var draw = new ol.interaction.Draw({
        source: source,
        type: 'Point'
      });
      expect(draw).to.be.a(ol.interaction.Draw);
      expect(draw).to.be.a(ol.interaction.Interaction);
    });

  });

  describe('specifying a geometryName', function() {

    beforeEach(function() {
      var draw = new ol.interaction.Draw({
        source: source,
        geometryName: 'the_geom',
        type: 'Point'
      });
      map.addInteraction(draw);
    });

    it('creates a feature with the correct geometryName', function() {
      simulateEvent('pointermove', 10, 20);
      simulateEvent('pointerdown', 10, 20);
      simulateEvent('pointerup', 10, 20);
      var features = source.getFeatures();
      var geometry = features[0].getGeometry();
      expect(features[0].getGeometryName()).to.equal('the_geom');
      expect(geometry).to.be.a(ol.geom.Point);
    });
  });

  describe('specifying a clickTolerance', function() {
    beforeEach(function() {
      var draw = new ol.interaction.Draw({
        source: source,
        type: 'Point',
        clickTolerance: 6
      });
      map.addInteraction(draw);
    });

    it('adds a point when below the tolerance', function() {
      var features;

      simulateEvent('pointermove', 10, 20);
      simulateEvent('pointerdown', 10, 20);
      simulateEvent('pointerup', 15, 25);
      features = source.getFeatures();
      expect(features).to.length(0);

      simulateEvent('pointermove', 10, 20);
      simulateEvent('pointerdown', 10, 20);
      simulateEvent('pointerup', 14, 24);
      features = source.getFeatures();
      expect(features).to.length(1);
    });
  });

  describe('drawing points', function() {
    var draw;

    beforeEach(function() {
      draw = new ol.interaction.Draw({
        source: source,
        type: 'Point'
      });
      map.addInteraction(draw);
    });

    it('draws a point on click', function() {
      simulateEvent('pointermove', 10, 20);
      simulateEvent('pointerdown', 10, 20);
      simulateEvent('pointerup', 10, 20);
      var features = source.getFeatures();
      expect(features).to.have.length(1);
      var geometry = features[0].getGeometry();
      expect(geometry).to.be.a(ol.geom.Point);
      expect(geometry.getCoordinates()).to.eql([10, -20]);
    });

    it('does not draw a point with a significant drag', function() {
      simulateEvent('pointermove', 10, 20);
      simulateEvent('pointerdown', 10, 20);
      simulateEvent('pointermove', 18, 20);
      simulateEvent('pointerup', 18, 20);
      var features = source.getFeatures();
      expect(features).to.have.length(0);
    });

    it('does not draw a point when modifier key is pressed', function() {
      simulateEvent('pointermove', 10, 20);
      simulateEvent('pointerdown', 10, 20, true);
      simulateEvent('pointerup', 10, 20);
      var features = source.getFeatures();
      expect(features).to.have.length(0);
    });

    it('triggers draw events', function() {
      var ds = sinon.spy();
      var de = sinon.spy();
      ol.events.listen(draw, 'drawstart', ds);
      ol.events.listen(draw, 'drawend', de);
      simulateEvent('pointermove', 10, 20);
      simulateEvent('pointerdown', 10, 20);
      simulateEvent('pointerup', 10, 20);
      expect(ds).to.be.called();
      expect(de).to.be.called();
      simulateEvent('pointermove', 20, 20);
      expect(ds.callCount).to.be(1);
      expect(de.callCount).to.be(1);
    });

    it('triggers drawend event before inserting the feature', function() {
      var receivedEvents = {
        end: 0,
        addfeature: 0
      };
      ol.events.listen(draw, 'drawend',
          function() {
            expect(receivedEvents.end).to.be(0);
            expect(receivedEvents.addfeature).to.be(0);
            ++receivedEvents.end;
          });
      source.on('addfeature', function() {
        expect(receivedEvents.end).to.be(1);
        expect(receivedEvents.addfeature).to.be(0);
        receivedEvents.addfeature++;
      });
      simulateEvent('pointermove', 10, 20);
      simulateEvent('pointerdown', 10, 20);
      simulateEvent('pointerup', 10, 20);
      simulateEvent('pointermove', 20, 20);
      expect(receivedEvents.end).to.be(1);
      expect(receivedEvents.addfeature).to.be(1);
    });
  });

  describe('drawing multipoints', function() {

    beforeEach(function() {
      map.addInteraction(new ol.interaction.Draw({
        source: source,
        type: 'MultiPoint'
      }));
    });

    it('draws multipoint on click', function() {
      simulateEvent('pointermove', 30, 15);
      simulateEvent('pointerdown', 30, 15);
      simulateEvent('pointerup', 30, 15);
      var features = source.getFeatures();
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
        type: 'LineString'
      });
      map.addInteraction(draw);
    });

    it('draws linestring with clicks, finishing on last point', function() {
      // first point
      simulateEvent('pointermove', 10, 20);
      simulateEvent('pointerdown', 10, 20);
      simulateEvent('pointerup', 10, 20);

      // second point
      simulateEvent('pointermove', 30, 20);
      simulateEvent('pointerdown', 30, 20);
      simulateEvent('pointerup', 30, 20);

      // finish on second point
      simulateEvent('pointerdown', 30, 20);
      simulateEvent('pointerup', 30, 20);

      var features = source.getFeatures();
      expect(features).to.have.length(1);
      var geometry = features[0].getGeometry();
      expect(geometry).to.be.a(ol.geom.LineString);
      expect(geometry.getCoordinates()).to.eql([[10, -20], [30, -20]]);
    });

    it('supports freehand drawing for linestrings', function() {
      // freehand sequence
      simulateEvent('pointermove', 10, 20);
      simulateEvent('pointerdown', 10, 20, true);
      simulateEvent('pointermove', 20, 30, true);
      simulateEvent('pointerdrag', 20, 30, true);
      simulateEvent('pointermove', 20, 40, true);
      simulateEvent('pointerdrag', 20, 40, true);
      simulateEvent('pointerup', 20, 40, true);

      // finish on third point
      simulateEvent('pointermove', 20, 40);
      simulateEvent('pointerdown', 20, 40);
      simulateEvent('pointerup', 20, 40);

      var features = source.getFeatures();
      expect(features).to.have.length(1);
      var geometry = features[0].getGeometry();
      expect(geometry).to.be.a(ol.geom.LineString);
      expect(geometry.getCoordinates()).to.eql(
          [[10, -20], [20, -30], [20, -40]]);
    });

    it('does not add a point with a significant drag', function() {
      // first point
      simulateEvent('pointermove', 10, 20);
      simulateEvent('pointerdown', 10, 20);
      simulateEvent('pointerup', 10, 20);

      // drag map
      simulateEvent('pointermove', 15, 20);
      simulateEvent('pointerdown', 15, 20);
      simulateEvent('pointermove', 23, 20);
      simulateEvent('pointerup', 23, 20);

      // second point
      simulateEvent('pointermove', 30, 20);
      simulateEvent('pointerdown', 30, 20);
      simulateEvent('pointerup', 30, 20);

      // finish on second point
      simulateEvent('pointerdown', 30, 20);
      simulateEvent('pointerup', 30, 20);

      var features = source.getFeatures();
      expect(features).to.have.length(1);
      var geometry = features[0].getGeometry();
      expect(geometry).to.be.a(ol.geom.LineString);
      expect(geometry.getCoordinates()).to.eql([[10, -20], [30, -20]]);
    });

    it('triggers draw events', function() {
      var ds = sinon.spy();
      var de = sinon.spy();
      ol.events.listen(draw, 'drawstart', ds);
      ol.events.listen(draw, 'drawend', de);

      // first point
      simulateEvent('pointermove', 10, 20);
      simulateEvent('pointerdown', 10, 20);
      simulateEvent('pointerup', 10, 20);

      // second point
      simulateEvent('pointermove', 30, 20);
      simulateEvent('pointerdown', 30, 20);
      simulateEvent('pointerup', 30, 20);

      // finish on second point
      simulateEvent('pointerdown', 30, 20);
      simulateEvent('pointerup', 30, 20);
      simulateEvent('pointermove', 10, 20);

      expect(ds).to.be.called();
      expect(ds.callCount).to.be(1);
      expect(de).to.be.called();
      expect(de.callCount).to.be(1);
    });

  });

  describe('drawing with a finishCondition', function() {
    beforeEach(function() {
      var draw = new ol.interaction.Draw({
        source: source,
        type: 'LineString',
        finishCondition: function(event) {
          if (ol.array.equals(event.coordinate,[30,-20])) {
            return true;
          }
          return false;
        }
      });
      map.addInteraction(draw);
    });

    it('draws a linestring failing to finish it first, the finishes it', function() {
      var features;

      // first point
      simulateEvent('pointermove', 10, 20);
      simulateEvent('pointerdown', 10, 20);
      simulateEvent('pointerup', 10, 20);

      // second point
      simulateEvent('pointermove', 40, 30);
      simulateEvent('pointerdown', 40, 30);
      simulateEvent('pointerup', 40, 30);

      // try to finish on this point
      simulateEvent('pointerdown', 40, 30);
      simulateEvent('pointerup', 40, 30);

      features = source.getFeatures();
      expect(features).to.have.length(0);

      // third point
      simulateEvent('pointermove', 30, 20);
      simulateEvent('pointerdown', 30, 20);
      simulateEvent('pointerup', 30, 20);

      //  finish on this point
      simulateEvent('pointerdown', 30, 20);
      simulateEvent('pointerup', 30, 20);

      features = source.getFeatures();
      expect(features).to.have.length(1);
    });
  });

  describe('drawing multi-linestrings', function() {

    beforeEach(function() {
      map.addInteraction(new ol.interaction.Draw({
        source: source,
        type: 'MultiLineString'
      }));
    });

    it('draws multi with clicks, finishing on last point', function() {
      // first point
      simulateEvent('pointermove', 10, 20);
      simulateEvent('pointerdown', 10, 20);
      simulateEvent('pointerup', 10, 20);

      // second point
      simulateEvent('pointermove', 30, 20);
      simulateEvent('pointerdown', 30, 20);
      simulateEvent('pointerup', 30, 20);

      // finish on second point
      simulateEvent('pointerdown', 30, 20);
      simulateEvent('pointerup', 30, 20);

      var features = source.getFeatures();
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
        type: 'Polygon'
      });
      map.addInteraction(draw);
    });

    it('draws polygon with clicks, finishing on first point', function() {
      // first point
      simulateEvent('pointermove', 10, 20);
      simulateEvent('pointerdown', 10, 20);
      simulateEvent('pointerup', 10, 20);

      // second point
      simulateEvent('pointermove', 30, 20);
      simulateEvent('pointerdown', 30, 20);
      simulateEvent('pointerup', 30, 20);

      // third point
      simulateEvent('pointermove', 40, 10);
      simulateEvent('pointerdown', 40, 10);
      simulateEvent('pointerup', 40, 10);

      // finish on first point
      simulateEvent('pointermove', 10, 20);
      simulateEvent('pointerdown', 10, 20);
      simulateEvent('pointerup', 10, 20);

      var features = source.getFeatures();
      expect(features).to.have.length(1);
      var geometry = features[0].getGeometry();
      expect(geometry).to.be.a(ol.geom.Polygon);

      expect(geometry.getCoordinates()).to.eql([
        [[10, -20], [30, -20], [40, -10], [10, -20]]
      ]);
    });

    it('draws polygon with clicks, finishing on last point', function() {
      // first point
      simulateEvent('pointermove', 10, 20);
      simulateEvent('pointerdown', 10, 20);
      simulateEvent('pointerup', 10, 20);

      // second point
      simulateEvent('pointermove', 30, 20);
      simulateEvent('pointerdown', 30, 20);
      simulateEvent('pointerup', 30, 20);

      // third point
      simulateEvent('pointermove', 40, 10);
      simulateEvent('pointerdown', 40, 10);
      simulateEvent('pointerup', 40, 10);

      // finish on last point
      simulateEvent('pointerdown', 40, 10);
      simulateEvent('pointerup', 40, 10);

      var features = source.getFeatures();
      expect(features).to.have.length(1);
      var geometry = features[0].getGeometry();
      expect(geometry).to.be.a(ol.geom.Polygon);

      expect(geometry.getCoordinates()).to.eql([
        [[10, -20], [30, -20], [40, -10], [10, -20]]
      ]);
    });

    it('supports freehand drawing for polygons', function() {
      // freehand sequence
      simulateEvent('pointermove', 10, 20);
      simulateEvent('pointerdown', 10, 20, true);
      simulateEvent('pointermove', 30, 20, true);
      simulateEvent('pointerdrag', 30, 20, true);
      simulateEvent('pointermove', 40, 10, true);
      simulateEvent('pointerdrag', 40, 10, true);
      simulateEvent('pointerup', 40, 10, true);

      // finish on last point
      simulateEvent('pointerdown', 40, 10);
      simulateEvent('pointerup', 40, 10);

      var features = source.getFeatures();
      expect(features).to.have.length(1);
      var geometry = features[0].getGeometry();
      expect(geometry).to.be.a(ol.geom.Polygon);

      expect(geometry.getCoordinates()).to.eql([
        [[10, -20], [30, -20], [40, -10], [10, -20]]
      ]);
    });

    it('triggers draw events', function() {
      var ds = sinon.spy();
      var de = sinon.spy();
      ol.events.listen(draw, 'drawstart', ds);
      ol.events.listen(draw, 'drawend', de);

      // first point
      simulateEvent('pointermove', 10, 20);
      simulateEvent('pointerdown', 10, 20);
      simulateEvent('pointerup', 10, 20);

      // second point
      simulateEvent('pointermove', 30, 20);
      simulateEvent('pointerdown', 30, 20);
      simulateEvent('pointerup', 30, 20);

      // third point
      simulateEvent('pointermove', 30, 10);
      simulateEvent('pointerdown', 30, 10);
      simulateEvent('pointerup', 30, 10);

      // finish on first point
      simulateEvent('pointermove', 10, 20);
      simulateEvent('pointerdown', 10, 20);
      simulateEvent('pointerup', 10, 20);

      expect(ds).to.be.called();
      expect(ds.callCount).to.be(1);
      expect(de).to.be.called();
      expect(de.callCount).to.be(1);
    });

  });

  describe('drawing multi-polygons', function() {

    beforeEach(function() {
      map.addInteraction(new ol.interaction.Draw({
        source: source,
        type: 'MultiPolygon'
      }));
    });

    it('draws multi with clicks, finishing on first point', function() {
      // first point
      simulateEvent('pointermove', 10, 20);
      simulateEvent('pointerdown', 10, 20);
      simulateEvent('pointerup', 10, 20);

      // second point
      simulateEvent('pointermove', 30, 20);
      simulateEvent('pointerdown', 30, 20);
      simulateEvent('pointerup', 30, 20);

      // third point
      simulateEvent('pointermove', 40, 10);
      simulateEvent('pointerdown', 40, 10);
      simulateEvent('pointerup', 40, 10);

      // finish on first point
      simulateEvent('pointermove', 10, 20);
      simulateEvent('pointerdown', 10, 20);
      simulateEvent('pointerup', 10, 20);

      var features = source.getFeatures();
      expect(features).to.have.length(1);
      var geometry = features[0].getGeometry();
      expect(geometry).to.be.a(ol.geom.MultiPolygon);
      var coordinates = geometry.getCoordinates();
      expect(coordinates).to.have.length(1);

      expect(coordinates[0]).to.eql([
        [[10, -20], [30, -20], [40, -10], [10, -20]]
      ]);
    });

    it('draws multi with clicks, finishing on last point', function() {
      // first point
      simulateEvent('pointermove', 10, 20);
      simulateEvent('pointerdown', 10, 20);
      simulateEvent('pointerup', 10, 20);

      // second point
      simulateEvent('pointermove', 30, 20);
      simulateEvent('pointerdown', 30, 20);
      simulateEvent('pointerup', 30, 20);

      // third point
      simulateEvent('pointermove', 40, 10);
      simulateEvent('pointerdown', 40, 10);
      simulateEvent('pointerup', 40, 10);

      // finish on last point
      simulateEvent('pointerdown', 40, 10);
      simulateEvent('pointerup', 40, 10);

      var features = source.getFeatures();
      expect(features).to.have.length(1);
      var geometry = features[0].getGeometry();
      expect(geometry).to.be.a(ol.geom.MultiPolygon);
      var coordinates = geometry.getCoordinates();
      expect(coordinates).to.have.length(1);

      expect(coordinates[0]).to.eql([
        [[10, -20], [30, -20], [40, -10], [10, -20]]
      ]);
    });

  });

  describe('drawing circles', function() {
    var draw;

    beforeEach(function() {
      draw = new ol.interaction.Draw({
        source: source,
        type: 'Circle'
      });
      map.addInteraction(draw);
    });

    it('draws circle with clicks, finishing on second point', function() {
      // first point
      simulateEvent('pointermove', 10, 20);
      simulateEvent('pointerdown', 10, 20);
      simulateEvent('pointerup', 10, 20);

      // finish on second point
      simulateEvent('pointermove', 30, 20);
      simulateEvent('pointerdown', 30, 20);
      simulateEvent('pointerup', 30, 20);

      var features = source.getFeatures();
      expect(features).to.have.length(1);
      var geometry = features[0].getGeometry();
      expect(geometry).to.be.a(ol.geom.Circle);
      expect(geometry.getCenter()).to.eql([10, -20]);
      expect(geometry.getRadius()).to.eql(20);
    });

    it('triggers draw events', function() {
      var ds = sinon.spy();
      var de = sinon.spy();
      ol.events.listen(draw, 'drawstart', ds);
      ol.events.listen(draw, 'drawend', de);

      // first point
      simulateEvent('pointermove', 10, 20);
      simulateEvent('pointerdown', 10, 20);
      simulateEvent('pointerup', 10, 20);

      // finish on second point
      simulateEvent('pointermove', 30, 20);
      simulateEvent('pointerdown', 30, 20);
      simulateEvent('pointerup', 30, 20);

      expect(ds).to.be.called();
      expect(ds.callCount).to.be(1);
      expect(de).to.be.called();
      expect(de.callCount).to.be(1);
    });

  });

  describe('#setActive()', function() {
    var interaction;

    beforeEach(function() {
      interaction = new ol.interaction.Draw({
        type: 'LineString'
      });

      expect(interaction.getActive()).to.be(true);

      map.addInteraction(interaction);

      // first point
      simulateEvent('pointermove', 10, 20);
      simulateEvent('pointerdown', 10, 20);
      simulateEvent('pointerup', 10, 20);

      expect(interaction.sketchFeature_).not.to.be(null);
    });

    afterEach(function() {
      map.removeInteraction(interaction);
    });

    describe('#setActive(false)', function() {
      it('unsets the map from the feature overlay', function() {
        var spy = sinon.spy(interaction.overlay_, 'setMap');
        interaction.setActive(false);
        expect(spy.getCall(0).args[0]).to.be(null);
      });
      it('aborts the drawing', function() {
        interaction.setActive(false);
        expect(interaction.sketchFeature_).to.be(null);
      });
      it('fires change:active', function() {
        var spy = sinon.spy(interaction.overlay_, 'setMap');
        var listenerSpy = sinon.spy(function() {
          // test that the interaction's change:active listener is called first
          expect(spy.getCall(0).args[0]).to.be(null);
        });
        interaction.on('change:active', listenerSpy);
        interaction.setActive(false);
        expect(listenerSpy.callCount).to.be(1);
      });
    });

    describe('#setActive(true)', function() {
      beforeEach(function() {
        interaction.setActive(false);
      });
      it('sets the map into the feature overlay', function() {
        var spy = sinon.spy(interaction.overlay_, 'setMap');
        interaction.setActive(true);
        expect(spy.getCall(0).args[0]).to.be(map);
      });
      it('fires change:active', function() {
        var spy = sinon.spy(interaction.overlay_, 'setMap');
        var listenerSpy = sinon.spy(function() {
          // test that the interaction's change:active listener is called first
          expect(spy.getCall(0).args[0]).to.be(map);
        });
        interaction.on('change:active', listenerSpy);
        interaction.setActive(true);
        expect(listenerSpy.callCount).to.be(1);
      });
    });

  });

  describe('#setMap()', function() {
    var interaction;

    beforeEach(function() {
      interaction = new ol.interaction.Draw({
        type: 'LineString'
      });
      expect(interaction.getActive()).to.be(true);
    });

    describe('#setMap(null)', function() {
      beforeEach(function() {
        map.addInteraction(interaction);
        // first point
        simulateEvent('pointermove', 10, 20);
        simulateEvent('pointerdown', 10, 20);
        simulateEvent('pointerup', 10, 20);
        expect(interaction.sketchFeature_).not.to.be(null);
      });
      afterEach(function() {
        map.removeInteraction(interaction);
      });
      describe('#setMap(null) when interaction is active', function() {
        it('unsets the map from the feature overlay', function() {
          var spy = sinon.spy(interaction.overlay_, 'setMap');
          interaction.setMap(null);
          expect(spy.getCall(0).args[0]).to.be(null);
        });
        it('aborts the drawing', function() {
          interaction.setMap(null);
          expect(interaction.sketchFeature_).to.be(null);
        });
      });
    });

    describe('#setMap(map)', function() {
      describe('#setMap(map) when interaction is active', function() {
        it('sets the map into the feature overlay', function() {
          var spy = sinon.spy(interaction.overlay_, 'setMap');
          interaction.setMap(map);
          expect(spy.getCall(0).args[0]).to.be(map);
        });
      });
      describe('#setMap(map) when interaction is not active', function() {
        it('does not set the map into the feature overlay', function() {
          interaction.setActive(false);
          var spy = sinon.spy(interaction.overlay_, 'setMap');
          interaction.setMap(map);
          expect(spy.getCall(0).args[0]).to.be(null);
        });
      });

    });
  });

  describe('ol.interaction.Draw.createRegularPolygon', function() {
    it('creates a regular polygon in Circle mode', function() {
      var draw = new ol.interaction.Draw({
        source: source,
        type: 'Circle',
        geometryFunction:
            ol.interaction.Draw.createRegularPolygon(4, Math.PI / 4)
      });
      map.addInteraction(draw);

      // first point
      simulateEvent('pointermove', 0, 0);
      simulateEvent('pointerdown', 0, 0);
      simulateEvent('pointerup', 0, 0);

      // finish on second point
      simulateEvent('pointermove', 20, 20);
      simulateEvent('pointerdown', 20, 20);
      simulateEvent('pointerup', 20, 20);

      var features = source.getFeatures();
      var geometry = features[0].getGeometry();
      expect(geometry).to.be.a(ol.geom.Polygon);
      var coordinates = geometry.getCoordinates();
      expect(coordinates[0].length).to.eql(5);
      expect(coordinates[0][0][0]).to.roughlyEqual(20, 1e-9);
      expect(coordinates[0][0][1]).to.roughlyEqual(20, 1e-9);
    });
  });

  describe('extend an existing feature', function() {
    var draw;
    var feature;

    beforeEach(function() {
      draw = new ol.interaction.Draw({
        source: source,
        type: 'LineString'
      });
      map.addInteraction(draw);
      feature = new ol.Feature(
          new ol.geom.LineString([[0, 0], [1, 1], [2, 0]]));
    });

    it('sets the initial state', function() {
      draw.extend(feature);
      expect(draw.sketchCoords_).to.have.length(4);
      expect(draw.sketchCoords_).to.eql([[0, 0], [1, 1], [2, 0], [2, 0]]);
      expect(draw.finishCoordinate_).to.eql([2, 0]);
    });

    it('dispatches a drawstart event', function() {
      var spy = sinon.spy();
      ol.events.listen(draw, 'drawstart', spy);
      draw.extend(feature);
      expect(spy.callCount).to.be(1);
    });

  });
});
