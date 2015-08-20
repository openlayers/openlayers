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

    features = [
      new ol.Feature({
        geometry: new ol.geom.Polygon([
          [[0, 0], [10, 20], [0, 40], [40, 40], [40, 0]]
        ])
      })
    ];

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
      expect(rbushEntries[0].feature).to.be(feature);
    });
  });

  describe('vertex deletion', function() {

    it('works when clicking on a shared vertex', function() {
      features.push(features[0].clone());

      var modify = new ol.interaction.Modify({
        features: new ol.Collection(features)
      });
      map.addInteraction(modify);

      var first = features[0];
      var second = features[0];

      expect(first.getGeometry().getRevision()).to.equal(1);
      expect(first.getGeometry().getCoordinates()[0]).to.have.length(5);
      expect(second.getGeometry().getRevision()).to.equal(1);
      expect(second.getGeometry().getCoordinates()[0]).to.have.length(5);

      simulateEvent('pointerdown', 10, -20, false, 0);
      simulateEvent('pointerup', 10, -20, false, 0);
      simulateEvent('click', 10, -20, false, 0);
      simulateEvent('singleclick', 10, -20, false, 0);

      expect(first.getGeometry().getRevision()).to.equal(2);
      expect(first.getGeometry().getCoordinates()[0]).to.have.length(4);
      expect(second.getGeometry().getRevision()).to.equal(2);
      expect(second.getGeometry().getCoordinates()[0]).to.have.length(4);
    });

  });

  describe('boundary modification', function() {

    it('clicking vertex should delete it and +r1', function() {
      var modify = new ol.interaction.Modify({
        features: new ol.Collection(features)
      });
      map.addInteraction(modify);

      var feature = features[0];

      expect(feature.getGeometry().getRevision()).to.equal(1);
      expect(feature.getGeometry().getCoordinates()[0]).to.have.length(5);

      simulateEvent('pointerdown', 10, -20, false, 0);
      simulateEvent('pointerup', 10, -20, false, 0);
      simulateEvent('click', 10, -20, false, 0);
      simulateEvent('singleclick', 10, -20, false, 0);

      expect(feature.getGeometry().getRevision()).to.equal(2);
      expect(feature.getGeometry().getCoordinates()[0]).to.have.length(4);
    });

    it('single clicking boundary should add vertex and +r1', function() {
      var modify = new ol.interaction.Modify({
        features: new ol.Collection(features)
      });
      map.addInteraction(modify);

      var feature = features[0];

      expect(feature.getGeometry().getRevision()).to.equal(1);
      expect(feature.getGeometry().getCoordinates()[0]).to.have.length(5);

      simulateEvent('pointerdown', 40, -20, false, 0);
      simulateEvent('pointerup', 40, -20, false, 0);
      simulateEvent('click', 40, -20, false, 0);
      simulateEvent('singleclick', 40, -20, false, 0);

      expect(feature.getGeometry().getRevision()).to.equal(2);
      expect(feature.getGeometry().getCoordinates()[0]).to.have.length(6);
    });

    it('single clicking on created vertex should delete it again', function() {
      var modify = new ol.interaction.Modify({
        features: new ol.Collection(features)
      });
      map.addInteraction(modify);

      var feature = features[0];

      expect(feature.getGeometry().getRevision()).to.equal(1);
      expect(feature.getGeometry().getCoordinates()[0]).to.have.length(5);

      simulateEvent('pointerdown', 40, -20, false, 0);
      simulateEvent('pointerup', 40, -20, false, 0);
      simulateEvent('click', 40, -20, false, 0);
      simulateEvent('singleclick', 40, -20, false, 0);

      expect(feature.getGeometry().getRevision()).to.equal(2);
      expect(feature.getGeometry().getCoordinates()[0]).to.have.length(6);

      simulateEvent('pointerdown', 40, -20, false, 0);
      simulateEvent('pointerup', 40, -20, false, 0);
      simulateEvent('click', 40, -20, false, 0);
      simulateEvent('singleclick', 40, -20, false, 0);

      expect(feature.getGeometry().getRevision()).to.equal(3);
      expect(feature.getGeometry().getCoordinates()[0]).to.have.length(5);
    });

    it('clicking with drag should add vertex and +r3', function() {
      var modify = new ol.interaction.Modify({
        features: new ol.Collection(features)
      });
      map.addInteraction(modify);

      var feature = features[0];

      expect(feature.getGeometry().getRevision()).to.equal(1);
      expect(feature.getGeometry().getCoordinates()[0]).to.have.length(5);

      simulateEvent('pointermove', 40, -20, false, 0);
      simulateEvent('pointerdown', 40, -20, false, 0);
      simulateEvent('pointermove', 30, -20, false, 0);
      simulateEvent('pointerdrag', 30, -20, false, 0);
      simulateEvent('pointerup', 30, -20, false, 0);

      expect(feature.getGeometry().getRevision()).to.equal(4);
      expect(feature.getGeometry().getCoordinates()[0]).to.have.length(6);
    });
  });

  describe('double click deleteCondition', function() {

    it('should delete vertex on double click', function() {
      var modify = new ol.interaction.Modify({
        features: new ol.Collection(features),
        deleteCondition: ol.events.condition.doubleClick
      });
      map.addInteraction(modify);

      var feature = features[0];

      expect(feature.getGeometry().getRevision()).to.equal(1);
      expect(feature.getGeometry().getCoordinates()[0]).to.have.length(5);

      simulateEvent('pointerdown', 10, -20, false, 0);
      simulateEvent('pointerup', 10, -20, false, 0);
      simulateEvent('click', 10, -20, false, 0);
      simulateEvent('pointerdown', 10, -20, false, 0);
      simulateEvent('pointerup', 10, -20, false, 0);
      simulateEvent('click', 10, -20, false, 0);
      simulateEvent('dblclick', 10, -20, false, 0);

      expect(feature.getGeometry().getRevision()).to.equal(2);
      expect(feature.getGeometry().getCoordinates()[0]).to.have.length(4);
    });

    it('should do nothing on single click', function() {
      var modify = new ol.interaction.Modify({
        features: new ol.Collection(features),
        deleteCondition: ol.events.condition.doubleClick
      });
      map.addInteraction(modify);

      var feature = features[0];

      expect(feature.getGeometry().getRevision()).to.equal(1);
      expect(feature.getGeometry().getCoordinates()[0]).to.have.length(5);

      simulateEvent('pointerdown', 10, -20, false, 0);
      simulateEvent('pointerup', 10, -20, false, 0);
      simulateEvent('click', 10, -20, false, 0);
      simulateEvent('singleclick', 10, -20, false, 0);

      expect(feature.getGeometry().getRevision()).to.equal(1);
      expect(feature.getGeometry().getCoordinates()[0]).to.have.length(5);
    });
  });

  describe('handle feature change', function() {
    var getListeners;

    beforeEach(function() {
      getListeners = function(feature, modify) {
        var listeners = goog.events.getListeners(
            feature, goog.events.EventType.CHANGE, false);
        return goog.array.filter(listeners, function(listener) {
          return listener.handler == modify;
        });
      };
    });

    it('updates the segment data', function() {
      var modify = new ol.interaction.Modify({
        features: new ol.Collection(features)
      });
      map.addInteraction(modify);

      var feature = features[0];
      var listeners, listener;

      listeners = getListeners(feature, modify);
      expect(listeners).to.have.length(1);

      var firstSegmentData;

      firstSegmentData = modify.rBush_.forEachInExtent([0, 0, 5, 5],
          function(node) {
            return node;
          });
      expect(firstSegmentData.segment[0]).to.eql([0, 0]);
      expect(firstSegmentData.segment[1]).to.eql([10, 20]);

      var coordinates = feature.getGeometry().getCoordinates();
      var firstVertex = coordinates[0][0];
      firstVertex[0] = 1;
      firstVertex[1] = 1;
      feature.getGeometry().setCoordinates(coordinates);

      firstSegmentData = modify.rBush_.forEachInExtent([0, 0, 5, 5],
          function(node) {
            return node;
          });
      expect(firstSegmentData.segment[0]).to.eql([1, 1]);
      expect(firstSegmentData.segment[1]).to.eql([10, 20]);

      listeners = getListeners(feature, modify);
      expect(listeners).to.have.length(1);
    });
  });

});

goog.require('goog.array');
goog.require('goog.dispose');
goog.require('goog.events');
goog.require('goog.events.EventType');
goog.require('goog.events.BrowserEvent');
goog.require('goog.style');
goog.require('ol.Collection');
goog.require('ol.Feature');
goog.require('ol.Map');
goog.require('ol.MapBrowserPointerEvent');
goog.require('ol.View');
goog.require('ol.events.condition');
goog.require('ol.geom.Point');
goog.require('ol.geom.Polygon');
goog.require('ol.interaction.Modify');
goog.require('ol.layer.Vector');
goog.require('ol.pointer.PointerEvent');
goog.require('ol.source.Vector');
