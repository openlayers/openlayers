goog.provide('ol.test.interaction.Translate');

goog.require('ol.Collection');
goog.require('ol.Feature');
goog.require('ol.Map');
goog.require('ol.MapBrowserPointerEvent');
goog.require('ol.View');
goog.require('ol.geom.Point');
goog.require('ol.interaction.Translate');
goog.require('ol.interaction.Interaction');
goog.require('ol.layer.Vector');
goog.require('ol.pointer.PointerEvent');
goog.require('ol.source.Vector');


describe('ol.interaction.Translate', function() {
  var target, map, source, features;

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
    features = [new ol.Feature({
      geometry: new ol.geom.Point([10, -20])
    }), new ol.Feature({
      geometry: new ol.geom.Point([20, -30])
    })];
    source.addFeatures(features);
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
      var draw = new ol.interaction.Translate({
        features: features
      });
      expect(draw).to.be.a(ol.interaction.Translate);
      expect(draw).to.be.a(ol.interaction.Interaction);
    });

  });

  describe('moving features', function() {
    var draw;

    beforeEach(function() {
      draw = new ol.interaction.Translate({
        features: new ol.Collection([features[0]])
      });
      map.addInteraction(draw);
    });

    it('moves a selected feature', function() {
      simulateEvent('pointermove', 10, 20);
      simulateEvent('pointerdown', 10, 20);
      simulateEvent('pointerdrag', 50, -40);
      simulateEvent('pointerup', 50, -40);
      var geometry = features[0].getGeometry();
      expect(geometry).to.be.a(ol.geom.Point);
      expect(geometry.getCoordinates()).to.eql([50, 40]);
    });

    it('does not move an unselected feature', function() {
      simulateEvent('pointermove', 20, 30);
      simulateEvent('pointerdown', 20, 30);
      simulateEvent('pointerdrag', 50, -40);
      simulateEvent('pointerup', 50, -40);
      var geometry = features[1].getGeometry();
      expect(geometry).to.be.a(ol.geom.Point);
      expect(geometry.getCoordinates()).to.eql([20, -30]);
    });
  });
});
