goog.provide('ol.test.interaction.Select');

describe('ol.interaction.Select', function() {
  var target, map, layer, source;

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

    // Four overlapping features, two features of type "foo" and two features
    // of type "bar". The rendering order is, from top to bottom, foo -> bar
    // -> foo -> bar.
    var features = [];
    features.push(
        new ol.Feature({
          geometry: geometry,
          type: 'bar'
        }),
        new ol.Feature({
          geometry: geometry,
          type: 'foo'
        }),
        new ol.Feature({
          geometry: geometry,
          type: 'bar'
        }),
        new ol.Feature({
          geometry: geometry,
          type: 'foo'
        }));

    source = new ol.source.Vector({
      features: features
    });

    layer = new ol.layer.Vector({source: source});

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
    var shiftKey = opt_shiftKey !== undefined ? opt_shiftKey : false;
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

    describe('user-provided collection', function() {

      it('uses the user-provided collection', function() {
        var features = new ol.Collection();
        var select = new ol.interaction.Select({features: features});
        expect(select.getFeatures()).to.be(features);
      });

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
        expect(e.selected).to.have.length(4);
      });
      select.on('select', listenerSpy);

      simulateEvent(ol.MapBrowserEvent.EventType.SINGLECLICK, 10, -20);

      expect(listenerSpy.callCount).to.be(1);

      var features = select.getFeatures();
      expect(features.getLength()).to.equal(4);
    });
  });

  describe('filter features using the filter option', function() {
    var select;

    describe('with multi set to true', function() {

      it('only selects features that pass the filter', function() {
        var select = new ol.interaction.Select({
          multi: true,
          filter: function(feature, layer) {
            return feature.get('type') === 'bar';
          }
        });
        map.addInteraction(select);

        simulateEvent(ol.MapBrowserEvent.EventType.SINGLECLICK, 10, -20);
        var features = select.getFeatures();
        expect(features.getLength()).to.equal(2);
        expect(features.item(0).get('type')).to.be('bar');
        expect(features.item(1).get('type')).to.be('bar');
      });
    });

    describe('with multi set to false', function() {

      it('only selects the first feature that passes the filter', function() {
        var select = new ol.interaction.Select({
          multi: false,
          filter: function(feature, layer) {
            return feature.get('type') === 'bar';
          }
        });
        map.addInteraction(select);
        simulateEvent(ol.MapBrowserEvent.EventType.SINGLECLICK, 10, -20);
        var features = select.getFeatures();
        expect(features.getLength()).to.equal(1);
        expect(features.item(0).get('type')).to.be('bar');
      });
    });

  });

  describe('#getLayer(feature)', function() {
    var interaction;

    beforeEach(function() {
      interaction = new ol.interaction.Select();
      map.addInteraction(interaction);
    });
    afterEach(function() {
      map.removeInteraction(interaction);
    });

    it('returns a layer from a selected feature', function() {
      var listenerSpy = sinon.spy(function(e) {
        var feature = e.selected[0];
        var layer_ = interaction.getLayer(feature);
        expect(e.selected).to.have.length(1);
        expect(feature).to.be.a(ol.Feature);
        expect(layer_).to.be.a(ol.layer.Vector);
        expect(layer_).to.equal(layer);
      });
      interaction.on('select', listenerSpy);

      simulateEvent(ol.MapBrowserEvent.EventType.SINGLECLICK, 10, -20);
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
      it('fires change:active', function() {
        var listenerSpy = sinon.spy();
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
          var spy = sinon.spy(interaction.featureOverlay_, 'setMap');
          interaction.setMap(null);
          expect(spy.getCall(0).args[0]).to.be(null);
        });
      });
    });

    describe('#setMap(map)', function() {
      describe('#setMap(map) when interaction is active', function() {
        it('sets the map into the feature overlay', function() {
          var spy = sinon.spy(interaction.featureOverlay_, 'setMap');
          interaction.setMap(map);
          expect(spy.getCall(0).args[0]).to.be(map);
        });
      });
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
goog.require('ol.MapBrowserEvent.EventType');
goog.require('ol.MapBrowserPointerEvent');
goog.require('ol.View');
goog.require('ol.geom.Polygon');
goog.require('ol.interaction.Select');
goog.require('ol.interaction.Interaction');
goog.require('ol.layer.Vector');
goog.require('ol.pointer.PointerEvent');
goog.require('ol.source.Vector');
