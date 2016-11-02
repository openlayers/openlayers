goog.provide('ol.test.interaction.Rotate');

goog.require('ol.Collection');
goog.require('ol.Feature');
goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.events.condition');
goog.require('ol.geom.Polygon');
goog.require('ol.interaction.Interaction');
goog.require('ol.interaction.Rotate');
goog.require('ol.layer.Vector');
goog.require('ol.source.Vector');


describe('ol.interaction.Rotate', function() {
  var target, map, source, features, originalFeatures;

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

    features = [
      new ol.Feature({
        geometry: new ol.geom.Polygon([
          [[0, 0], [10, 20], [0, 40], [40, 40], [40, 0]]
        ])
      }),
      new ol.Feature({
        geometry: new ol.geom.Polygon([
          [[-40, 0], [-40, 40], [0, 40], [10, 20], [0, 0]]
        ])
      })
    ];

    originalFeatures = features.map(function(feature) {
      return feature.clone();
    });

    source = new ol.source.Vector({
      features: features
    });

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
    var event = new ol.MapBrowserPointerEvent(type, map,
        new ol.pointer.PointerEvent(type, {
          clientX: position.left + x + width / 2,
          clientY: position.top + y + height / 2,
          shiftKey: shiftKey
        }));
    map.handleMapBrowserEvent(event);
  }

  describe('constructor', function() {

    it('creates a new interaction', function() {
      var rotate = new ol.interaction.Rotate({
        features: new ol.Collection(features)
      });
      expect(rotate).to.be.a(ol.interaction.Rotate);
      expect(rotate).to.be.an(ol.interaction.Interaction);
    });

  });

  describe('rotating features', function() {
    var rotate;

    beforeEach(function() {
      rotate = new ol.interaction.Rotate({
        features: new ol.Collection([features[0]])
      });
      map.addInteraction(rotate);
    });

    it('rotates a selected feature', function() {
      // rotates 90° anticlockwise
      simulateEvent('pointermove', 30, -20);
      simulateEvent('pointerdown', 30, -20);
      simulateEvent('pointerdrag', 20, -30);
      simulateEvent('pointerup', 20, -30);

      var geometry = features[0].getGeometry();
      expect(geometry).to.be.a(ol.geom.Polygon);

      var refGeometry = originalFeatures[0].getGeometry();
      refGeometry.rotate(Math.PI / 2, [20, 20]);

      expect(geometry.getCoordinates()).to.eql(refGeometry.getCoordinates());
    });

    it('does not rotates an unselected feature', function() {
      simulateEvent('pointermove', 0, -20);
      simulateEvent('pointerdown', 0, -20);
      simulateEvent('pointerdrag', -20, -30);
      simulateEvent('pointerup', -20, -30);

      var geometry = features[1].getGeometry();
      expect(geometry).to.be.a(ol.geom.Polygon);

      var refGeometry = originalFeatures[1].getGeometry();

      expect(geometry.getCoordinates()).to.eql(refGeometry.getCoordinates());
    });
  });

  describe('rotating features with condition', function() {
    var rotate;

    beforeEach(function() {
      rotate = new ol.interaction.Rotate({
        features: new ol.Collection([features[0]]),
        condition: ol.events.condition.shiftKeyOnly
      });
      map.addInteraction(rotate);
    });

    it('rotates when condition is met', function() {
      // rotates 90° anticlockwise
      simulateEvent('pointermove', 30, -20);
      simulateEvent('pointerdown', 30, -20, true);
      simulateEvent('pointerdrag', 20, -30, true);
      simulateEvent('pointerup', 20, -30, true);

      var geometry = features[0].getGeometry();
      expect(geometry).to.be.a(ol.geom.Polygon);

      var refGeometry = originalFeatures[0].getGeometry();
      refGeometry.rotate(Math.PI / 2, [20, 20]);

      expect(geometry.getCoordinates()).to.eql(refGeometry.getCoordinates());
    });

    it('does not rotates when condition is not met', function() {
      simulateEvent('pointermove', 30, -20);
      simulateEvent('pointerdown', 30, -20);
      simulateEvent('pointerdrag', 20, -30);
      simulateEvent('pointerup', 20, -30);

      var geometry = features[0].getGeometry();
      expect(geometry).to.be.a(ol.geom.Polygon);

      var refGeometry = originalFeatures[0].getGeometry();

      expect(geometry.getCoordinates()).to.eql(refGeometry.getCoordinates());
    });
  });

  describe('rotating features from custom anchor', function() {
    var rotate;

    beforeEach(function() {
      rotate = new ol.interaction.Rotate({
        features: new ol.Collection([features[0]]),
        customAnchorCondition: ol.events.condition.shiftKeyOnly
      });
      map.addInteraction(rotate);
    });

    it('rotates from cursor position', function() {
      // rotates 90° anticlockwise
      simulateEvent('pointermove', 30, -20);
      simulateEvent('pointerdown', 30, -20, true);
      simulateEvent('pointerdrag', 30, -30, true);
      simulateEvent('pointerup', 30, -30, true);

      var geometry = features[0].getGeometry();
      expect(geometry).to.be.a(ol.geom.Polygon);

      var refGeometry = originalFeatures[0].getGeometry();
      refGeometry.rotate(Math.PI / 2, [30, 20]);

      expect(geometry.getCoordinates()).to.eql(refGeometry.getCoordinates());
    });

    it('rotates from extent center when condition is not met', function() {
      simulateEvent('pointermove', 30, -20);
      simulateEvent('pointerdown', 30, -20);
      simulateEvent('pointerdrag', 20, -30);
      simulateEvent('pointerup', 20, -30);

      var geometry = features[0].getGeometry();
      expect(geometry).to.be.a(ol.geom.Polygon);

      var refGeometry = originalFeatures[0].getGeometry();
      refGeometry.rotate(Math.PI / 2, [20, 20]);

      expect(geometry.getCoordinates()).to.eql(refGeometry.getCoordinates());
    });
  });

  describe('rotating features with step', function() {
    var rotate;

    beforeEach(function() {
      rotate = new ol.interaction.Rotate({
        features: new ol.Collection([features[0]]),
        step: Math.PI,
        rotateByStepCondition: ol.events.condition.shiftKeyOnly
      });
      map.addInteraction(rotate);
    });

    it('rotates at fixed angle', function() {
      // rotates 135° anticlockwise, should snap at 180°
      simulateEvent('pointermove', 30, -20);
      simulateEvent('pointerdown', 30, -20, true);
      simulateEvent('pointerdrag', 10, -30, true);
      simulateEvent('pointerup', 10, -30, true);

      var geometry = features[0].getGeometry();
      expect(geometry).to.be.a(ol.geom.Polygon);

      var refGeometry = originalFeatures[0].getGeometry();
      refGeometry.rotate(Math.PI, [20, 20]);

      expect(geometry.getCoordinates()).to.eql(refGeometry.getCoordinates());
    });

    it('does not rotates at fixed angle when condition is not met', function() {
      // rotates 135° anticlockwise
      simulateEvent('pointermove', 30, -20);
      simulateEvent('pointerdown', 30, -20);
      simulateEvent('pointerdrag', 10, -30);
      simulateEvent('pointerup', 10, -30);

      var geometry = features[0].getGeometry();
      expect(geometry).to.be.a(ol.geom.Polygon);

      var refGeometry = originalFeatures[0].getGeometry();
      refGeometry.rotate(3 * Math.PI / 4, [20, 20]);

      expect(geometry.getCoordinates()).to.eql(refGeometry.getCoordinates());
    });
  });
});
