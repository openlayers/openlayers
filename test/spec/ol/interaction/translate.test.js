

import _ol_Collection_ from '../../../../src/ol/collection';
import _ol_Feature_ from '../../../../src/ol/feature';
import _ol_Map_ from '../../../../src/ol/map';
import _ol_MapBrowserPointerEvent_ from '../../../../src/ol/mapbrowserpointerevent';
import _ol_View_ from '../../../../src/ol/view';
import _ol_geom_Point_ from '../../../../src/ol/geom/point';
import _ol_interaction_Translate_ from '../../../../src/ol/interaction/translate';
import _ol_interaction_Interaction_ from '../../../../src/ol/interaction/interaction';
import _ol_layer_Vector_ from '../../../../src/ol/layer/vector';
import _ol_pointer_PointerEvent_ from '../../../../src/ol/pointer/pointerevent';
import _ol_source_Vector_ from '../../../../src/ol/source/vector';


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
    source = new _ol_source_Vector_();
    features = [new _ol_Feature_({
      geometry: new _ol_geom_Point_([10, -20])
    }), new _ol_Feature_({
      geometry: new _ol_geom_Point_([20, -30])
    })];
    source.addFeatures(features);
    var layer = new _ol_layer_Vector_({source: source});
    map = new _ol_Map_({
      target: target,
      layers: [layer],
      view: new _ol_View_({
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
    var event = new _ol_MapBrowserPointerEvent_(type, map,
        new _ol_pointer_PointerEvent_(type, {
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
    expect(startevent).to.be.an(_ol_interaction_Translate_.Event);
    expect(startevent.type).to.eql('translatestart');

    // last event should be translateend
    expect(endevent).to.be.an(_ol_interaction_Translate_.Event);
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
      var translate = new _ol_interaction_Translate_({
        features: features
      });
      expect(translate).to.be.a(_ol_interaction_Translate_);
      expect(translate).to.be.a(_ol_interaction_Interaction_);
    });

  });

  describe('setActive', function() {

    it('works when the map is not set', function() {
      var translate = new _ol_interaction_Translate_({
        features: features
      });
      expect(translate.getActive()).to.be(true);
      translate.setActive(false);
      expect(translate.getActive()).to.be(false);
    });

  });

  describe('moving features, with features option', function() {
    var translate;

    beforeEach(function() {
      translate = new _ol_interaction_Translate_({
        features: new _ol_Collection_([features[0]])
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
      expect(geometry).to.be.a(_ol_geom_Point_);
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
      expect(geometry).to.be.a(_ol_geom_Point_);
      expect(geometry.getCoordinates()).to.eql([20, -30]);

      expect(events).to.be.empty();
    });
  });

  describe('moving features, without features option', function() {
    var translate;

    beforeEach(function() {
      translate = new _ol_interaction_Translate_();
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
      translate = new _ol_interaction_Translate_();
      map.addInteraction(translate);
      element = map.getViewport();
    });

    it('changes css cursor', function() {
      expect(element.classList.contains('ol-grabbing')).to.be(false);
      expect(element.classList.contains('ol-grab')).to.be(false);

      simulateEvent('pointermove', 10, 20);
      expect(element.classList.contains('ol-grabbing')).to.be(false);
      expect(element.classList.contains('ol-grab')).to.be(true);

      simulateEvent('pointerdown', 10, 20);
      expect(element.classList.contains('ol-grabbing')).to.be(true);
      expect(element.classList.contains('ol-grab')).to.be(false);

      simulateEvent('pointerup', 10, 20);
      expect(element.classList.contains('ol-grabbing')).to.be(false);
      expect(element.classList.contains('ol-grab')).to.be(true);

      simulateEvent('pointermove', 0, 0);
      expect(element.classList.contains('ol-grabbing')).to.be(false);
      expect(element.classList.contains('ol-grab')).to.be(false);
    });

    it('resets css cursor when interaction is deactivated while pointer is on feature', function() {
      simulateEvent('pointermove', 10, 20);
      expect(element.classList.contains('ol-grabbing')).to.be(false);
      expect(element.classList.contains('ol-grab')).to.be(true);

      translate.setActive(false);

      simulateEvent('pointermove', 0, 0);
      expect(element.classList.contains('ol-grabbing')).to.be(false);
      expect(element.classList.contains('ol-grab')).to.be(false);
    });

    it('resets css cursor interaction is removed while pointer is on feature', function() {
      simulateEvent('pointermove', 10, 20);
      expect(element.classList.contains('ol-grabbing')).to.be(false);
      expect(element.classList.contains('ol-grab')).to.be(true);

      map.removeInteraction(translate);

      simulateEvent('pointermove', 0, 0);
      expect(element.classList.contains('ol-grabbing')).to.be(false);
      expect(element.classList.contains('ol-grab')).to.be(false);
    });

    it('resets css cursor to existing cursor interaction is removed while pointer is on feature', function() {
      element.style.cursor = 'pointer';

      simulateEvent('pointermove', 10, 20);
      expect(element.classList.contains('ol-grabbing')).to.be(false);
      expect(element.classList.contains('ol-grab')).to.be(true);

      map.removeInteraction(translate);

      simulateEvent('pointermove', 0, 0);
      expect(element.classList.contains('ol-grabbing')).to.be(false);
      expect(element.classList.contains('ol-grab')).to.be(false);
    });

  });

});
