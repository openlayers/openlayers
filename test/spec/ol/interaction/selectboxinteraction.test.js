goog.provide('ol.test.interaction.SelectBox');

describe('ol.interaction.SelectBox', function() {
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
              type: type,
              button: 0,
              clientX: position.x + x + width / 2,
              clientY: position.y + y + height / 2,
              shiftKey: shiftKey
            })));
    event.pointerEvent.pointerId = 1;
    map.handleMapBrowserEvent(event);
  }

  describe('constructor', function() {

    it('creates a new interaction', function() {
      var select = new ol.interaction.SelectBox();
      expect(select).to.be.a(ol.interaction.SelectBox);
      expect(select).to.be.a(ol.interaction.Select);
    });

  });

  describe('selecting a polygon', function() {
    var select;

    beforeEach(function() {
      select = new ol.interaction.SelectBox();
      map.addInteraction(select);
    });

    it('select with drag box', function() {
      var listenerSpy = sinon.spy(function(e) {
        expect(e.selected).to.have.length(4);
      });
      select.on('select', listenerSpy);

      simulateEvent(ol.MapBrowserEvent.EventType.POINTERDOWN, 10, -20, true);
      simulateEvent(ol.MapBrowserEvent.EventType.POINTERDRAG, 7.5, -15, true);
      simulateEvent(ol.MapBrowserEvent.EventType.POINTERUP, 5, -10, true);

      expect(listenerSpy.callCount).to.be(1);

      var features = select.getFeatures();
      expect(features.getLength()).to.equal(4);
    });
  });

  describe('filter features using the filter option', function() {
    var select;

    it('only selects features that pass the filter', function() {
      var select = new ol.interaction.SelectBox({
        filter: function(feature, layer) {
          return feature.get('type') === 'bar';
        }
      });
      map.addInteraction(select);

      simulateEvent(ol.MapBrowserEvent.EventType.POINTERDOWN, 10, -20, true);
      simulateEvent(ol.MapBrowserEvent.EventType.POINTERDRAG, 7.5, -15, true);
      simulateEvent(ol.MapBrowserEvent.EventType.POINTERUP, 5, -10, true);

      var features = select.getFeatures();
      expect(features.getLength()).to.equal(2);
      expect(features.item(0).get('type')).to.be('bar');
      expect(features.item(1).get('type')).to.be('bar');
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
goog.require('ol.interaction.SelectBox');
goog.require('ol.interaction.Select');
goog.require('ol.layer.Vector');
goog.require('ol.pointer.PointerEvent');
goog.require('ol.source.Vector');
