goog.provide('ol.test.interaction.Select');

describe('ol.interaction.Select', function() {
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
    var geometry = new ol.geom.Polygon([[[0, 0], [0, 40], [40, 40], [40, 0]]]);
    var geometry2 = new ol.geom.Polygon([[[0, 0], [0, 40], [40, 40], [40, 0]]]);
    var feature = new ol.Feature({
      geometry: geometry
    });
    var feature2 = new ol.Feature({
      geometry: geometry2
    });
    source = new ol.source.Vector({
      features: [feature, feature2]
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
  function simulateEvent(type, x, y, opt_shiftKey) {
    var viewport = map.getViewport();
    // calculated in case body has top < 0 (test runner with small window)
    var position = goog.style.getClientPosition(viewport);
    var shiftKey = goog.isDef(opt_shiftKey) ? opt_shiftKey : false;
    var event = new ol.MapBrowserPointerEvent(type, map,
        new ol.pointer.PointerEvent(type,
            new goog.events.BrowserEvent({
              clientX: position.x + x + width / 2,
              clientY: position.y + y + height / 2,
              shiftKey: shiftKey
            })));
    map.handleMapBrowserEvent(event);
  }

  describe('constructor', function() {

    it('creates a new interaction', function() {
      var select = new ol.interaction.Select();
      expect(select).to.be.a(ol.interaction.Select);
      expect(select).to.be.a(ol.interaction.Interaction);
    });

  });

  describe('selecting a polygon', function() {
    var select;

    beforeEach(function() {
      select = new ol.interaction.Select();
      map.addInteraction(select);
    });

    it('select with single-click', function() {
      var listenerSpy = sinon.spy(function(e) {
        expect(e.selected).to.have.length(1);
      });
      select.on('select', listenerSpy);

      simulateEvent(ol.MapBrowserEvent.EventType.SINGLECLICK, 10, -20);

      expect(listenerSpy.callCount).to.be(1);

      var features = select.getFeatures();
      expect(features.getLength()).to.equal(1);
    });
  });

  describe('multiselecting polygons', function() {
    var select;

    beforeEach(function() {
      select = new ol.interaction.Select({
        multi: true
      });
      map.addInteraction(select);
    });

    it('select with single-click', function() {
      var listenerSpy = sinon.spy(function(e) {
        expect(e.selected).to.have.length(2);
      });
      select.on('select', listenerSpy);

      simulateEvent(ol.MapBrowserEvent.EventType.SINGLECLICK, 10, -20);

      expect(listenerSpy.callCount).to.be(1);

      var features = select.getFeatures();
      expect(features.getLength()).to.equal(2);
    });
  });

  describe('#setActive()', function() {
    var interaction;

    beforeEach(function() {
      interaction = new ol.interaction.Select();

      expect(interaction.getActive()).to.be(true);

      map.addInteraction(interaction);

      expect(interaction.featureOverlay_).not.to.be(null);

      simulateEvent(ol.MapBrowserEvent.EventType.SINGLECLICK, 10, -20);
    });

    afterEach(function() {
      map.removeInteraction(interaction);
    });

    describe('#setActive(false)', function() {
      it('keeps the the selection', function() {
        interaction.setActive(false);
        expect(interaction.getFeatures().getLength()).to.equal(1);
      });
    });

    describe('#setActive(true)', function() {
      beforeEach(function() {
        interaction.setActive(false);
      });
      it('sets the map into the feature overlay', function() {
        interaction.setActive(true);
        expect(interaction.featureOverlay_.map_).to.be(map);
      });
      it('fires change:active', function() {
        var listenerSpy = sinon.spy(function() {
          // test that the interaction's change:active listener is called first
          expect(interaction.featureOverlay_.map_).not.to.be(null);
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
      interaction = new ol.interaction.Select();
      expect(interaction.getActive()).to.be(true);
    });

    describe('#setMap(null)', function() {
      beforeEach(function() {
        map.addInteraction(interaction);
      });
      afterEach(function() {
        map.removeInteraction(interaction);
      });
      describe('#setMap(null) when interaction is active', function() {
        it('unsets the map from the feature overlay', function() {
          interaction.setMap(null);
          expect(interaction.featureOverlay_.map_).to.be(null);
        });
      });
    });

    describe('#setMap(map)', function() {
      describe('#setMap(map) when interaction is active', function() {
        it('sets the map into the feature overlay', function() {
          interaction.setMap(map);
          expect(interaction.featureOverlay_.map_).to.be(map);
        });
      });
    });
  });
});

goog.require('goog.dispose');
goog.require('goog.events');
goog.require('goog.events.BrowserEvent');
goog.require('goog.style');
goog.require('ol.Feature');
goog.require('ol.Map');
goog.require('ol.MapBrowserEvent.EventType');
goog.require('ol.MapBrowserPointerEvent');
goog.require('ol.View');
goog.require('ol.geom.Polygon');
goog.require('ol.interaction.Select');
goog.require('ol.interaction.Interaction');
goog.require('ol.layer.Vector');
goog.require('ol.pointer.PointerEvent');
goog.require('ol.source.Vector');
