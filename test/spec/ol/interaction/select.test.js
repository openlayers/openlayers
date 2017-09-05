

import _ol_Collection_ from '../../../../src/ol/collection';
import _ol_Feature_ from '../../../../src/ol/feature';
import _ol_Map_ from '../../../../src/ol/map';
import _ol_MapBrowserEventType_ from '../../../../src/ol/mapbrowsereventtype';
import _ol_MapBrowserPointerEvent_ from '../../../../src/ol/mapbrowserpointerevent';
import _ol_View_ from '../../../../src/ol/view';
import _ol_geom_Polygon_ from '../../../../src/ol/geom/polygon';
import _ol_interaction_Interaction_ from '../../../../src/ol/interaction/interaction';
import _ol_interaction_Select_ from '../../../../src/ol/interaction/select';
import _ol_layer_Vector_ from '../../../../src/ol/layer/vector';
import _ol_pointer_PointerEvent_ from '../../../../src/ol/pointer/pointerevent';
import _ol_source_Vector_ from '../../../../src/ol/source/vector';


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

    var geometry = new _ol_geom_Polygon_([[[0, 0], [0, 40], [40, 40], [40, 0]]]);

    // Four overlapping features, two features of type "foo" and two features
    // of type "bar". The rendering order is, from top to bottom, foo -> bar
    // -> foo -> bar.
    var features = [];
    features.push(
        new _ol_Feature_({
          geometry: geometry,
          type: 'bar'
        }),
        new _ol_Feature_({
          geometry: geometry,
          type: 'foo'
        }),
        new _ol_Feature_({
          geometry: geometry,
          type: 'bar'
        }),
        new _ol_Feature_({
          geometry: geometry,
          type: 'foo'
        }));

    source = new _ol_source_Vector_({
      features: features
    });

    layer = new _ol_layer_Vector_({source: source});

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
    var event = new _ol_pointer_PointerEvent_(type, {
      clientX: position.left + x + width / 2,
      clientY: position.top + y + height / 2,
      shiftKey: shiftKey
    });
    map.handleMapBrowserEvent(new _ol_MapBrowserPointerEvent_(type, map, event));
  }

  describe('constructor', function() {

    it('creates a new interaction', function() {
      var select = new _ol_interaction_Select_();
      expect(select).to.be.a(_ol_interaction_Select_);
      expect(select).to.be.a(_ol_interaction_Interaction_);
    });

    describe('user-provided collection', function() {

      it('uses the user-provided collection', function() {
        var features = new _ol_Collection_();
        var select = new _ol_interaction_Select_({features: features});
        expect(select.getFeatures()).to.be(features);
      });

    });

  });

  describe('selecting a polygon', function() {
    var select;

    beforeEach(function() {
      select = new _ol_interaction_Select_();
      map.addInteraction(select);
    });

    it('select with single-click', function() {
      var listenerSpy = sinon.spy(function(e) {
        expect(e.selected).to.have.length(1);
      });
      select.on('select', listenerSpy);

      simulateEvent('singleclick', 10, -20);

      expect(listenerSpy.callCount).to.be(1);

      var features = select.getFeatures();
      expect(features.getLength()).to.equal(1);
    });

    it('single-click outside the geometry', function() {
      var listenerSpy = sinon.spy(function(e) {
        expect(e.selected).to.have.length(1);
      });
      select.on('select', listenerSpy);

      simulateEvent(_ol_MapBrowserEventType_.SINGLECLICK, -10, -10);

      expect(listenerSpy.callCount).to.be(0);

      var features = select.getFeatures();
      expect(features.getLength()).to.equal(0);
    });

    it('select twice with single-click', function() {
      var listenerSpy = sinon.spy(function(e) {
        expect(e.selected).to.have.length(1);
      });
      select.on('select', listenerSpy);

      simulateEvent(_ol_MapBrowserEventType_.SINGLECLICK, 10, -20);
      simulateEvent(_ol_MapBrowserEventType_.SINGLECLICK, 9, -21);

      expect(listenerSpy.callCount).to.be(1);

      var features = select.getFeatures();
      expect(features.getLength()).to.equal(1);
    });

    it('select with shift single-click', function() {
      var listenerSpy = sinon.spy(function(e) {
        expect(e.selected).to.have.length(1);
      });
      select.on('select', listenerSpy);

      simulateEvent('singleclick', 10, -20, true);

      expect(listenerSpy.callCount).to.be(1);

      var features = select.getFeatures();
      expect(features.getLength()).to.equal(1);
    });
  });

  describe('multiselecting polygons', function() {
    var select;

    beforeEach(function() {
      select = new _ol_interaction_Select_({
        multi: true
      });
      map.addInteraction(select);
    });

    it('select with single-click', function() {
      var listenerSpy = sinon.spy(function(e) {
        expect(e.selected).to.have.length(4);
      });
      select.on('select', listenerSpy);

      simulateEvent('singleclick', 10, -20);

      expect(listenerSpy.callCount).to.be(1);

      var features = select.getFeatures();
      expect(features.getLength()).to.equal(4);
    });

    it('select with shift single-click', function() {
      var listenerSpy = sinon.spy(function(e) {
        expect(e.selected).to.have.length(4);
      });
      select.on('select', listenerSpy);

      simulateEvent('singleclick', 10, -20, true);

      expect(listenerSpy.callCount).to.be(1);

      var features = select.getFeatures();
      expect(features.getLength()).to.equal(4);
      expect(select.getLayer(features.item(0))).to.equal(layer);

      // Select again to make sure the internal layer isn't reported
      simulateEvent('singleclick', 10, -20);

      expect(listenerSpy.callCount).to.be(1);

      features = select.getFeatures();
      expect(features.getLength()).to.equal(4);
      expect(select.getLayer(features.item(0))).to.equal(layer);
    });
  });

  describe('toggle selecting polygons', function() {
    var select;

    beforeEach(function() {
      select = new _ol_interaction_Select_({
        multi: true
      });
      map.addInteraction(select);
    });

    it('with SHIFT + single-click', function() {
      var listenerSpy = sinon.spy();
      select.on('select', listenerSpy);

      simulateEvent('singleclick', 10, -20, true);

      expect(listenerSpy.callCount).to.be(1);

      var features = select.getFeatures();
      expect(features.getLength()).to.equal(4);

      map.renderSync();

      simulateEvent('singleclick', 10, -20, true);

      expect(listenerSpy.callCount).to.be(2);

      features = select.getFeatures();
      expect(features.getLength()).to.equal(0);
    });
  });

  describe('filter features using the filter option', function() {

    describe('with multi set to true', function() {

      it('only selects features that pass the filter', function() {
        var select = new _ol_interaction_Select_({
          multi: true,
          filter: function(feature, layer) {
            return feature.get('type') === 'bar';
          }
        });
        map.addInteraction(select);

        simulateEvent('singleclick', 10, -20);
        var features = select.getFeatures();
        expect(features.getLength()).to.equal(2);
        expect(features.item(0).get('type')).to.be('bar');
        expect(features.item(1).get('type')).to.be('bar');
      });

      it('only selects features that pass the filter ' +
         'using shift single-click', function() {
        var select = new _ol_interaction_Select_({
          multi: true,
          filter: function(feature, layer) {
            return feature.get('type') === 'bar';
          }
        });
        map.addInteraction(select);

        simulateEvent('singleclick', 10, -20,
            true);
        var features = select.getFeatures();
        expect(features.getLength()).to.equal(2);
        expect(features.item(0).get('type')).to.be('bar');
        expect(features.item(1).get('type')).to.be('bar');
      });
    });

    describe('with multi set to false', function() {

      it('only selects the first feature that passes the filter', function() {
        var select = new _ol_interaction_Select_({
          multi: false,
          filter: function(feature, layer) {
            return feature.get('type') === 'bar';
          }
        });
        map.addInteraction(select);
        simulateEvent('singleclick', 10, -20);
        var features = select.getFeatures();
        expect(features.getLength()).to.equal(1);
        expect(features.item(0).get('type')).to.be('bar');
      });

      it('only selects the first feature that passes the filter ' +
         'using shift single-click', function() {
        var select = new _ol_interaction_Select_({
          multi: false,
          filter: function(feature, layer) {
            return feature.get('type') === 'bar';
          }
        });
        map.addInteraction(select);
        simulateEvent('singleclick', 10, -20,
            true);
        var features = select.getFeatures();
        expect(features.getLength()).to.equal(1);
        expect(features.item(0).get('type')).to.be('bar');
      });
    });
  });

  describe('#getLayer(feature)', function() {
    var interaction;

    beforeEach(function() {
      interaction = new _ol_interaction_Select_();
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
        expect(feature).to.be.a(_ol_Feature_);
        expect(layer_).to.be.a(_ol_layer_Vector_);
        expect(layer_).to.equal(layer);
      });
      interaction.on('select', listenerSpy);

      simulateEvent('singleclick', 10, -20);
      // Select again to make sure that the internal layer doesn't get reported.
      simulateEvent('singleclick', 10, -20);
    });
  });

  describe('#setActive()', function() {
    var interaction;

    beforeEach(function() {
      interaction = new _ol_interaction_Select_();

      expect(interaction.getActive()).to.be(true);

      map.addInteraction(interaction);

      expect(interaction.featureOverlay_).not.to.be(null);

      simulateEvent('singleclick', 10, -20);
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
      interaction = new _ol_interaction_Select_();
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
