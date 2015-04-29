goog.provide('ol.test.interaction.Modify');

describe('ol.interaction.Modify', function() {

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

    var geometry = new ol.geom.Polygon([[[0, 0], [0, 40], [40, 40], [40, 0]]]);

    features = [];
    features.push(
        new ol.Feature({
          geometry: geometry
        }));

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

    map.on('postrender', function() {
      done();
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
   * @param {boolean=} opt_shiftKey Shift key is pressed.
   */
  function simulateEvent(type, x, y, opt_shiftKey, button) {
    var viewport = map.getViewport();
    // calculated in case body has top < 0 (test runner with small window)
    var position = goog.style.getClientPosition(viewport);
    var shiftKey = goog.isDef(opt_shiftKey) ? opt_shiftKey : false;
    var event = new ol.MapBrowserPointerEvent(type, map,
        new ol.pointer.PointerEvent(type,
            new goog.events.BrowserEvent({
              type: type,
              button: button,
              clientX: position.x + x + width / 2,
              clientY: position.y + y + height / 2,
              shiftKey: shiftKey
            })));
    event.pointerEvent.pointerId = 1;
    map.handleMapBrowserEvent(event);
  }

  describe('constructor', function() {
    it('adds features to the RTree', function() {
      var feature = new ol.Feature(
          new ol.geom.Point([0, 0]));
      var features = new ol.Collection([feature]);
      var modify = new ol.interaction.Modify({
        features: features
      });
      var rbushEntries = modify.rBush_.getAll();
      expect(rbushEntries.length).to.be(1);
      expect(rbushEntries[0].feature === feature).to.be.ok();
    });
  });

  describe('boundary modification', function() {

    it('clicking without drag should not add vertex but +r2', function() {
      var modify = new ol.interaction.Modify({
        features: new ol.Collection(features)
      });
      map.addInteraction(modify);

      var feature = features[0];

      expect(feature.getGeometry().getRevision()).to.equal(1);
      expect(feature.getGeometry().getCoordinates()[0]).to.have.length(4);

      simulateEvent('pointerdown', 0, -20, false, 0);
      simulateEvent('pointerup', 0, -20, false, 0);
      simulateEvent('click', 0, -20, false, 0);
      simulateEvent('singleclick', 0, -20, false, 0);

      expect(feature.getGeometry().getRevision()).to.equal(3);
      expect(feature.getGeometry().getCoordinates()[0]).to.have.length(4);
    });

    it('clicking with drag should add vertex but +r3', function() {
      var modify = new ol.interaction.Modify({
        features: new ol.Collection(features)
      });
      map.addInteraction(modify);

      var feature = features[0];

      expect(feature.getGeometry().getRevision()).to.equal(1);
      expect(feature.getGeometry().getCoordinates()[0]).to.have.length(4);

      simulateEvent('pointerdown', 0, -20, false, 0);
      simulateEvent('pointerdrag', 20, -20, false, 0);
      simulateEvent('pointerup', 20, -20, false, 0);

      expect(feature.getGeometry().getRevision()).to.equal(4);
      expect(feature.getGeometry().getCoordinates()[0]).to.have.length(5);
    });
  });

});

goog.require('goog.dispose');
goog.require('goog.events');
goog.require('goog.events.BrowserEvent');
goog.require('goog.style');
goog.require('ol.Collection');
goog.require('ol.Feature');
goog.require('ol.Map');
goog.require('ol.MapBrowserPointerEvent');
goog.require('ol.View');
goog.require('ol.geom.Point');
goog.require('ol.geom.Polygon');
goog.require('ol.interaction.Modify');
goog.require('ol.layer.Vector');
goog.require('ol.pointer.PointerEvent');
goog.require('ol.source.Vector');
