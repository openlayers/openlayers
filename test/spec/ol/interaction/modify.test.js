goog.provide('ol.test.interaction.Modify');

goog.require('ol.events');
goog.require('ol.Collection');
goog.require('ol.Feature');
goog.require('ol.Map');
goog.require('ol.MapBrowserPointerEvent');
goog.require('ol.View');
goog.require('ol.events.condition');
goog.require('ol.geom.LineString');
goog.require('ol.geom.Point');
goog.require('ol.geom.Polygon');
goog.require('ol.interaction.Modify');
goog.require('ol.interaction.ModifyEvent');
goog.require('ol.layer.Vector');
goog.require('ol.pointer.PointerEvent');
goog.require('ol.source.Vector');


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
   * @param {number} button The mouse button.
   */
  function simulateEvent(type, x, y, opt_shiftKey, button) {
    var viewport = map.getViewport();
    // calculated in case body has top < 0 (test runner with small window)
    var position = viewport.getBoundingClientRect();
    var shiftKey = opt_shiftKey !== undefined ? opt_shiftKey : false;
    var pointerEvent = new ol.pointer.PointerEvent(type, {
      type: type,
      clientX: position.left + x + width / 2,
      clientY: position.top + y + height / 2,
      shiftKey: shiftKey
    }, {
      button: button,
      isPrimary: true
    });
    var event = new ol.MapBrowserPointerEvent(type, map, pointerEvent);
    event.pointerEvent.pointerId = 1;
    map.handleMapBrowserEvent(event);
  }

  /**
   * Tracks events triggered by the interaction as well as feature
   * modifications. Helper function to
   * @param {ol.Feature} feature Modified feature.
   * @param {ol.interaction.Modify} interaction The interaction.
   * @return {Array<ol.interaction.ModifyEvent|string>} events
   */
  function trackEvents(feature, interaction) {
    var events = [];
    feature.on('change', function(event) {
      events.push('change');
    });
    interaction.on('modifystart', function(event) {
      events.push(event);
    });
    interaction.on('modifyend', function(event) {
      events.push(event);
    });
    return events;
  }

  /**
  * Validates the event array to verify proper event sequence. Checks
  * that first and last event are correct ModifyEvents and that feature
  * modifications event are in between.
  * @param {Array<ol.interaction.ModifyEvent|string>} events The events.
  * @param {Array<ol.Feature>} features The features.
  */
  function validateEvents(events, features) {

    var startevent = events[0];
    var endevent = events[events.length - 1];

    // first event should be modifystary
    expect(startevent).to.be.an(ol.interaction.ModifyEvent);
    expect(startevent.type).to.eql('modifystart');

    // last event should be modifyend
    expect(endevent).to.be.an(ol.interaction.ModifyEvent);
    expect(endevent.type).to.eql('modifyend');

    // make sure we get change events to events array
    expect(events.length > 2).to.be(true);
    // middle events should be feature modification events
    for (var i = 1; i < events.length - 2; i++) {
      expect(events[i]).to.equal('change');
    }

    // ModifyEvents should include the expected features
    expect(startevent.features.getArray()).to.eql(features);
    expect(endevent.features.getArray()).to.eql(features);
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

    it('accepts feature without geometry', function() {
      var feature = new ol.Feature();
      var features = new ol.Collection([feature]);
      var modify = new ol.interaction.Modify({
        features: features
      });
      var rbushEntries = modify.rBush_.getAll();
      expect(rbushEntries.length).to.be(0);

      feature.setGeometry(new ol.geom.Point([0, 10]));
      rbushEntries = modify.rBush_.getAll();
      expect(rbushEntries.length).to.be(1);
      expect(rbushEntries[0].feature).to.be(feature);
    });

  });

  describe('vertex deletion', function() {

    it('works when clicking on a shared vertex', function() {
      features.push(features[0].clone());

      var first = features[0];
      var firstRevision = first.getGeometry().getRevision();
      var second = features[1];
      var secondRevision = second.getGeometry().getRevision();

      var modify = new ol.interaction.Modify({
        features: new ol.Collection(features)
      });
      map.addInteraction(modify);

      var events = trackEvents(first, modify);

      expect(first.getGeometry().getRevision()).to.equal(firstRevision);
      expect(first.getGeometry().getCoordinates()[0]).to.have.length(5);
      expect(second.getGeometry().getRevision()).to.equal(secondRevision);
      expect(second.getGeometry().getCoordinates()[0]).to.have.length(5);

      simulateEvent('pointerdown', 10, -20, false, 0);
      simulateEvent('pointerup', 10, -20, false, 0);
      simulateEvent('click', 10, -20, false, 0);
      simulateEvent('singleclick', 10, -20, false, 0);

      expect(first.getGeometry().getRevision()).to.equal(firstRevision + 1);
      expect(first.getGeometry().getCoordinates()[0]).to.have.length(4);
      expect(second.getGeometry().getRevision()).to.equal(secondRevision + 1);
      expect(second.getGeometry().getCoordinates()[0]).to.have.length(4);

      validateEvents(events, features);
    });

    it('deletes first vertex of a LineString', function() {
      var lineFeature = new ol.Feature({
        geometry: new ol.geom.LineString(
          [[0, 0], [10, 20], [0, 40], [40, 40], [40, 0]]
        )
      });
      features.length = 0;
      features.push(lineFeature);
      features.push(lineFeature.clone());

      var first = features[0];
      var firstRevision = first.getGeometry().getRevision();

      var modify = new ol.interaction.Modify({
        features: new ol.Collection(features)
      });
      map.addInteraction(modify);

      var events = trackEvents(first, modify);

      expect(first.getGeometry().getRevision()).to.equal(firstRevision);
      expect(first.getGeometry().getCoordinates()).to.have.length(5);

      simulateEvent('pointerdown', 0, 0, false, 0);
      simulateEvent('pointerup', 0, 0, false, 0);
      simulateEvent('click', 0, 0, false, 0);
      simulateEvent('singleclick', 0, 0, false, 0);

      expect(first.getGeometry().getRevision()).to.equal(firstRevision + 1);
      expect(first.getGeometry().getCoordinates()).to.have.length(4);
      expect(first.getGeometry().getCoordinates()[0][0]).to.equal(10);
      expect(first.getGeometry().getCoordinates()[0][1]).to.equal(20);

      validateEvents(events, features);
    });

    it('deletes last vertex of a LineString', function() {
      var lineFeature = new ol.Feature({
        geometry: new ol.geom.LineString(
          [[0, 0], [10, 20], [0, 40], [40, 40], [40, 0]]
        )
      });
      features.length = 0;
      features.push(lineFeature);
      features.push(lineFeature.clone());

      var first = features[0];
      var firstRevision = first.getGeometry().getRevision();

      var modify = new ol.interaction.Modify({
        features: new ol.Collection(features)
      });
      map.addInteraction(modify);

      var events = trackEvents(first, modify);

      expect(first.getGeometry().getRevision()).to.equal(firstRevision);
      expect(first.getGeometry().getCoordinates()).to.have.length(5);

      simulateEvent('pointerdown', 40, 0, false, 0);
      simulateEvent('pointerup', 40, 0, false, 0);
      simulateEvent('click', 40, 0, false, 0);
      simulateEvent('singleclick', 40, 0, false, 0);

      expect(first.getGeometry().getRevision()).to.equal(firstRevision + 1);
      expect(first.getGeometry().getCoordinates()).to.have.length(4);
      expect(first.getGeometry().getCoordinates()[3][0]).to.equal(40);
      expect(first.getGeometry().getCoordinates()[3][1]).to.equal(40);

      validateEvents(events, features);
    });

    it('deletes vertex of a LineString programmatically', function() {
      var lineFeature = new ol.Feature({
        geometry: new ol.geom.LineString(
          [[0, 0], [10, 20], [0, 40], [40, 40], [40, 0]]
        )
      });
      features.length = 0;
      features.push(lineFeature);
      features.push(lineFeature.clone());

      var first = features[0];
      var firstRevision = first.getGeometry().getRevision();

      var modify = new ol.interaction.Modify({
        features: new ol.Collection(features)
      });
      map.addInteraction(modify);

      var events = trackEvents(first, modify);

      expect(first.getGeometry().getRevision()).to.equal(firstRevision);
      expect(first.getGeometry().getCoordinates()).to.have.length(5);

      simulateEvent('pointerdown', 40, 0, false, 0);
      simulateEvent('pointerup', 40, 0, false, 0);

      var removed = modify.removePoint();

      expect(removed).to.be(true);
      expect(first.getGeometry().getRevision()).to.equal(firstRevision + 1);
      expect(first.getGeometry().getCoordinates()).to.have.length(4);
      expect(first.getGeometry().getCoordinates()[3][0]).to.equal(40);
      expect(first.getGeometry().getCoordinates()[3][1]).to.equal(40);

      validateEvents(events, features);
    });


  });

  describe('boundary modification', function() {
    var modify, feature, events;

    beforeEach(function() {
      modify = new ol.interaction.Modify({
        features: new ol.Collection(features)
      });
      map.addInteraction(modify);

      feature = features[0];

      events = trackEvents(feature, modify);
    });

    it('clicking vertex should delete it and +r1', function() {
      expect(feature.getGeometry().getRevision()).to.equal(1);
      expect(feature.getGeometry().getCoordinates()[0]).to.have.length(5);

      simulateEvent('pointerdown', 10, -20, false, 0);
      simulateEvent('pointerup', 10, -20, false, 0);
      simulateEvent('click', 10, -20, false, 0);
      simulateEvent('singleclick', 10, -20, false, 0);

      expect(feature.getGeometry().getRevision()).to.equal(2);
      expect(feature.getGeometry().getCoordinates()[0]).to.have.length(4);

      validateEvents(events, [feature]);
    });

    it('single clicking boundary should add vertex and +r1', function() {
      expect(feature.getGeometry().getRevision()).to.equal(1);
      expect(feature.getGeometry().getCoordinates()[0]).to.have.length(5);

      simulateEvent('pointerdown', 40, -20, false, 0);
      simulateEvent('pointerup', 40, -20, false, 0);
      simulateEvent('click', 40, -20, false, 0);
      simulateEvent('singleclick', 40, -20, false, 0);

      expect(feature.getGeometry().getRevision()).to.equal(2);
      expect(feature.getGeometry().getCoordinates()[0]).to.have.length(6);

      validateEvents(events, [feature]);
    });

    it('single clicking on created vertex should delete it again', function() {
      expect(feature.getGeometry().getRevision()).to.equal(1);
      expect(feature.getGeometry().getCoordinates()[0]).to.have.length(5);

      simulateEvent('pointerdown', 40, -20, false, 0);
      simulateEvent('pointerup', 40, -20, false, 0);
      simulateEvent('click', 40, -20, false, 0);
      simulateEvent('singleclick', 40, -20, false, 0);

      expect(feature.getGeometry().getRevision()).to.equal(2);
      expect(feature.getGeometry().getCoordinates()[0]).to.have.length(6);

      validateEvents(events, [feature]);
      events.length = 0;

      simulateEvent('pointerdown', 40, -20, false, 0);
      simulateEvent('pointerup', 40, -20, false, 0);
      simulateEvent('click', 40, -20, false, 0);
      simulateEvent('singleclick', 40, -20, false, 0);

      expect(feature.getGeometry().getRevision()).to.equal(3);
      expect(feature.getGeometry().getCoordinates()[0]).to.have.length(5);

      validateEvents(events, [feature]);
    });

    it('clicking with drag should add vertex and +r3', function() {
      expect(feature.getGeometry().getRevision()).to.equal(1);
      expect(feature.getGeometry().getCoordinates()[0]).to.have.length(5);

      simulateEvent('pointermove', 40, -20, false, 0);
      simulateEvent('pointerdown', 40, -20, false, 0);
      simulateEvent('pointermove', 30, -20, false, 0);
      simulateEvent('pointerdrag', 30, -20, false, 0);
      simulateEvent('pointerup', 30, -20, false, 0);

      expect(feature.getGeometry().getRevision()).to.equal(4);
      expect(feature.getGeometry().getCoordinates()[0]).to.have.length(6);

      validateEvents(events, [feature]);
    });

    it('clicking with right button should not add a vertex', function() {
      expect(feature.getGeometry().getRevision()).to.equal(1);
      expect(feature.getGeometry().getCoordinates()[0]).to.have.length(5);

      simulateEvent('pointermove', 40, -20, false, 0);
      // right click
      simulateEvent('pointerdown', 40, -20, false, 1);
      simulateEvent('pointermove', 30, -20, false, 1);
      simulateEvent('pointerdrag', 30, -20, false, 1);
      simulateEvent('pointerup', 30, -20, false, 1);

      expect(feature.getGeometry().getRevision()).to.equal(1);
      expect(feature.getGeometry().getCoordinates()[0]).to.have.length(5);
      expect(events).to.have.length(0);
    });

  });

  describe('double click deleteCondition', function() {

    var modify, feature, events;

    beforeEach(function() {
      modify = new ol.interaction.Modify({
        features: new ol.Collection(features),
        deleteCondition: ol.events.condition.doubleClick
      });
      map.addInteraction(modify);

      feature = features[0];

      events = trackEvents(feature, modify);
    });

    it('should delete vertex on double click', function() {

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

      validateEvents(events, features);
    });

    it('should do nothing on single click', function() {

      expect(feature.getGeometry().getRevision()).to.equal(1);
      expect(feature.getGeometry().getCoordinates()[0]).to.have.length(5);

      simulateEvent('pointerdown', 10, -20, false, 0);
      simulateEvent('pointerup', 10, -20, false, 0);
      simulateEvent('click', 10, -20, false, 0);
      simulateEvent('singleclick', 10, -20, false, 0);

      expect(feature.getGeometry().getRevision()).to.equal(1);
      expect(feature.getGeometry().getCoordinates()[0]).to.have.length(5);

      expect(events.length).to.eql(0);
    });
  });

  describe('handle feature change', function() {
    var getListeners;

    beforeEach(function() {
      getListeners = function(feature, modify) {
        var listeners = ol.events.getListeners(
            feature, 'change');
        return listeners.filter(function(listener) {
          return listener.bindTo === modify;
        });
      };
    });

    it('updates the segment data', function() {
      var modify = new ol.interaction.Modify({
        features: new ol.Collection(features)
      });
      map.addInteraction(modify);

      var feature = features[0];
      var listeners;

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
