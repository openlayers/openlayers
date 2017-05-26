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

  /**
   * Tracks events triggered by the interaction as well as feature
   * modifications. Helper function to
   * @param {ol.Feature} feature Translated feature.
   * @param {ol.interaction.Translate} interaction The interaction.
   * @return {Array<ol.interaction.Translate.Event|string>} events
   */
  function trackEvents(feature, interaction) {
    var events = [];
    feature.on('change', function(event) {
      events.push('change');
    });
    interaction.on('translatestart', function(event) {
      events.push(event);
    });
    interaction.on('translateend', function(event) {
      events.push(event);
    });
    return events;
  }

  /**
   * Validates the event array to verify proper event sequence. Checks
   * that first and last event are correct TranslateEvents and that feature
   * modifications event are in between.
   * @param {Array<ol.interaction.Translate.Event|string>} events The events.
   * @param {Array<ol.Feature>} features The features.
   */
  function validateEvents(events, features) {

    var startevent = events[0];
    var endevent = events[events.length - 1];

    // first event should be translatestart
    expect(startevent).to.be.an(ol.interaction.Translate.Event);
    expect(startevent.type).to.eql('translatestart');

    // last event should be translateend
    expect(endevent).to.be.an(ol.interaction.Translate.Event);
    expect(endevent.type).to.eql('translateend');

    // make sure we get change events to events array
    expect(events.length > 2).to.be(true);
    // middle events should be feature modification events
    for (var i = 1; i < events.length - 1; i++) {
      expect(events[i]).to.equal('change');
    }

    // TranslateEvents should include the expected features
    expect(startevent.features.getArray()).to.eql(features);
    expect(endevent.features.getArray()).to.eql(features);
  }


  describe('constructor', function() {

    it('creates a new interaction', function() {
      var translate = new ol.interaction.Translate({
        features: features
      });
      expect(translate).to.be.a(ol.interaction.Translate);
      expect(translate).to.be.a(ol.interaction.Interaction);
    });

  });

  describe('moving features, with features option', function() {
    var translate;

    beforeEach(function() {
      translate = new ol.interaction.Translate({
        features: new ol.Collection([features[0]])
      });
      map.addInteraction(translate);
    });

    it('moves a selected feature', function() {
      var events = trackEvents(features[0], translate);

      simulateEvent('pointermove', 10, 20);
      simulateEvent('pointerdown', 10, 20);
      simulateEvent('pointerdrag', 50, -40);
      simulateEvent('pointerup', 50, -40);
      var geometry = features[0].getGeometry();
      expect(geometry).to.be.a(ol.geom.Point);
      expect(geometry.getCoordinates()).to.eql([50, 40]);

      validateEvents(events, [features[0]]);
    });

    it('does not move an unselected feature', function() {
      var events = trackEvents(features[0], translate);

      simulateEvent('pointermove', 20, 30);
      simulateEvent('pointerdown', 20, 30);
      simulateEvent('pointerdrag', 50, -40);
      simulateEvent('pointerup', 50, -40);
      var geometry = features[1].getGeometry();
      expect(geometry).to.be.a(ol.geom.Point);
      expect(geometry.getCoordinates()).to.eql([20, -30]);

      expect(events).to.be.empty();
    });
  });

  describe('moving features, without features option', function() {
    var translate;

    beforeEach(function() {
      translate = new ol.interaction.Translate();
      map.addInteraction(translate);
    });

    it('moves only targeted feature', function() {
      var events = trackEvents(features[0], translate);

      simulateEvent('pointermove', 10, 20);
      simulateEvent('pointerdown', 10, 20);
      simulateEvent('pointerdrag', 50, -40);
      simulateEvent('pointerup', 50, -40);
      expect(features[0].getGeometry().getCoordinates()).to.eql([50, 40]);
      expect(features[1].getGeometry().getCoordinates()).to.eql([20, -30]);

      validateEvents(events, [features[0]]);
    });
  });

  describe('changes css cursor', function() {
    var element, translate;

    beforeEach(function() {
      translate = new ol.interaction.Translate();
      map.addInteraction(translate);
      element = map.getTargetElement();
    });

    it('changes css cursor', function() {
      expect(element.style.cursor).to.eql('');

      simulateEvent('pointermove', 10, 20);
      expect(element.style.cursor).to.match(/grab$/);

      simulateEvent('pointerdown', 10, 20);
      expect(element.style.cursor).to.match(/grabbing$/);

      simulateEvent('pointerup', 10, 20);
      expect(element.style.cursor).to.match(/grab$/);

      simulateEvent('pointermove', 0, 0);
      expect(element.style.cursor).to.eql('');
    });

    it('respects existing cursor value', function() {
      element.style.cursor = 'pointer';

      simulateEvent('pointermove', 10, 20);
      expect(element.style.cursor).to.match(/grab$/);

      simulateEvent('pointerdown', 10, 20);
      expect(element.style.cursor).to.match(/grabbing$/);

      simulateEvent('pointerup', 10, 20);
      expect(element.style.cursor).to.match(/grab$/);

      simulateEvent('pointermove', 0, 0);
      expect(element.style.cursor).to.eql('pointer');
    });

    it('resets css cursor when interaction is deactivated while pointer is on feature', function() {
      simulateEvent('pointermove', 10, 20);
      expect(element.style.cursor).to.match(/grab$/);

      translate.setActive(false);

      simulateEvent('pointermove', 0, 0);
      expect(element.style.cursor).to.eql('');
    });

    it('resets css cursor to existing cursor when interaction is deactivated while pointer is on feature', function() {
      element.style.cursor = 'pointer';

      simulateEvent('pointermove', 10, 20);
      expect(element.style.cursor).to.match(/grab$/);

      translate.setActive(false);

      simulateEvent('pointermove', 0, 0);
      expect(element.style.cursor).to.eql('pointer');
    });

    it('resets css cursor interaction is removed while pointer is on feature', function() {
      simulateEvent('pointermove', 10, 20);
      expect(element.style.cursor).to.match(/grab$/);

      map.removeInteraction(translate);

      simulateEvent('pointermove', 0, 0);
      expect(element.style.cursor).to.eql('');
    });

    it('resets css cursor to existing cursor interaction is removed while pointer is on feature', function() {
      element.style.cursor = 'pointer';

      simulateEvent('pointermove', 10, 20);
      expect(element.style.cursor).to.match(/grab$/);

      map.removeInteraction(translate);

      simulateEvent('pointermove', 0, 0);
      expect(element.style.cursor).to.eql('pointer');
    });

  });

});
