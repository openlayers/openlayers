goog.provide('ol.test.layer.Layer');

describe('ol.layer.Layer', function() {

  describe('constructor (defaults)', function() {

    var layer;

    beforeEach(function() {
      layer = new ol.layer.Layer({
        source: new ol.source.Source({
          projection: ol.proj.get('EPSG:4326')
        })
      });
    });

    afterEach(function() {
      goog.dispose(layer);
    });

    it('creates an instance', function() {
      expect(layer).to.be.a(ol.layer.Layer);
    });

    it('provides default opacity', function() {
      expect(layer.getOpacity()).to.be(1);
    });

    it('provides default visibility', function() {
      expect(layer.getVisible()).to.be(true);
    });

    it('provides default max resolution', function() {
      expect(layer.getMaxResolution()).to.be(Infinity);
    });

    it('provides default min resolution', function() {
      expect(layer.getMinResolution()).to.be(0);
    });

    it('provides default layerState', function() {
      expect(layer.getLayerState()).to.eql({
        layer: layer,
        opacity: 1,
        visible: true,
        managed: true,
        sourceState: ol.source.State.READY,
        extent: undefined,
        zIndex: 0,
        maxResolution: Infinity,
        minResolution: 0
      });
    });

  });

  describe('constructor (options)', function() {

    it('accepts options', function() {
      var layer = new ol.layer.Layer({
        source: new ol.source.Source({
          projection: ol.proj.get('EPSG:4326')
        }),
        opacity: 0.5,
        visible: false,
        zIndex: 10,
        maxResolution: 500,
        minResolution: 0.25,
        foo: 42
      });

      expect(layer.getOpacity()).to.be(0.5);
      expect(layer.getVisible()).to.be(false);
      expect(layer.getMaxResolution()).to.be(500);
      expect(layer.getMinResolution()).to.be(0.25);
      expect(layer.get('foo')).to.be(42);
      expect(layer.getLayerState()).to.eql({
        layer: layer,
        opacity: 0.5,
        visible: false,
        managed: true,
        sourceState: ol.source.State.READY,
        extent: undefined,
        zIndex: 10,
        maxResolution: 500,
        minResolution: 0.25
      });

      goog.dispose(layer);
    });

  });

  describe('visibleAtResolution', function() {
    var layer;

    beforeEach(function() {
      layer = new ol.layer.Layer({
        source: new ol.source.Source({
          projection: ol.proj.get('EPSG:4326')
        })
      });
    });

    afterEach(function() {
      goog.dispose(layer);
    });

    it('returns false if layer is not visible', function() {
      layer.setVisible(false);
      layer.setMinResolution(3);
      layer.setMaxResolution(5);
      var layerState = layer.getLayerState();
      expect(ol.layer.Layer.visibleAtResolution(layerState, 4)).to.be(false);
    });

    it('returns false if resolution lower than minResolution', function() {
      layer.setVisible(true);
      layer.setMinResolution(3);
      layer.setMaxResolution(5);
      var layerState = layer.getLayerState();
      expect(ol.layer.Layer.visibleAtResolution(layerState, 2)).to.be(false);
    });

    it('returns false if resolution greater than maxResolution', function() {
      layer.setVisible(true);
      layer.setMinResolution(3);
      layer.setMaxResolution(5);
      var layerState = layer.getLayerState();
      expect(ol.layer.Layer.visibleAtResolution(layerState, 6)).to.be(false);
    });

    it('returns true otherwise', function() {
      layer.setVisible(true);
      layer.setMinResolution(3);
      layer.setMaxResolution(5);
      var layerState = layer.getLayerState();
      expect(ol.layer.Layer.visibleAtResolution(layerState, 4)).to.be(true);
    });

  });

  describe('#getLayerState', function() {

    var layer;

    beforeEach(function() {
      layer = new ol.layer.Layer({
        source: new ol.source.Source({
          projection: ol.proj.get('EPSG:4326')
        })
      });
    });

    afterEach(function() {
      goog.dispose(layer);
    });

    it('returns a layerState from the properties values', function() {
      layer.setOpacity(0.3);
      layer.setVisible(false);
      layer.setMaxResolution(500);
      layer.setMinResolution(0.25);
      layer.setZIndex(10);
      expect(layer.getLayerState()).to.eql({
        layer: layer,
        opacity: 0.3,
        visible: false,
        managed: true,
        sourceState: ol.source.State.READY,
        extent: undefined,
        zIndex: 10,
        maxResolution: 500,
        minResolution: 0.25
      });
    });

    it('returns a layerState with clamped values', function() {
      layer.setOpacity(-1.5);
      layer.setVisible(false);
      expect(layer.getLayerState()).to.eql({
        layer: layer,
        opacity: 0,
        visible: false,
        managed: true,
        sourceState: ol.source.State.READY,
        extent: undefined,
        zIndex: 0,
        maxResolution: Infinity,
        minResolution: 0
      });

      layer.setOpacity(3);
      layer.setVisible(true);
      expect(layer.getLayerState()).to.eql({
        layer: layer,
        opacity: 1,
        visible: true,
        managed: true,
        sourceState: ol.source.State.READY,
        extent: undefined,
        zIndex: 0,
        maxResolution: Infinity,
        minResolution: 0
      });
    });

  });

  describe('#getSource', function() {

    it('gets the layer source', function() {
      var source = new ol.source.Source({projection: ol.proj.get('EPSG:4326')});
      var layer = new ol.layer.Layer({source: source});
      expect(layer.getSource()).to.be(source);
    });

  });

  describe('#set("source", source)', function() {
    var projection = ol.proj.get('EPSG:4326');

    it('sets the layer source', function() {
      var layer = new ol.layer.Layer({
        source: new ol.source.Source({projection: projection})
      });

      var source = new ol.source.Source({projection: projection});
      layer.set('source', source);
      expect(layer.getSource()).to.be(source);
    });

    it('calls changed', function() {
      var layer = new ol.layer.Layer({
        source: new ol.source.Source({projection: projection})
      });
      sinon.spy(layer, 'changed');

      var source = new ol.source.Source({projection: projection});
      layer.set('source', source);
      expect(layer.changed.calledOnce).to.be(true);
    });

    it('sets up event listeners', function() {
      sinon.spy(ol.layer.Layer.prototype, 'handleSourceChange_');

      var first = new ol.source.Source({projection: projection});
      var layer = new ol.layer.Layer({source: first});

      first.setState(ol.source.State.READY);
      expect(layer.handleSourceChange_.calledOnce).to.be(true);

      var second = new ol.source.Source({projection: projection});
      layer.set('source', second);

      expect(layer.handleSourceChange_.calledOnce).to.be(true);
      second.setState(ol.source.State.READY);
      expect(layer.handleSourceChange_.callCount).to.be(2);

      // remove spy
      ol.layer.Layer.prototype.handleSourceChange_.restore();
    });

  });

  describe('#setSource()', function() {
    var projection = ol.proj.get('EPSG:4326');

    it('sets the layer source', function() {
      var layer = new ol.layer.Layer({
        source: new ol.source.Source({projection: projection})
      });

      var source = new ol.source.Source({projection: projection});
      layer.setSource(source);
      expect(layer.getSource()).to.be(source);
    });

    it('calls changed', function() {
      var layer = new ol.layer.Layer({
        source: new ol.source.Source({projection: projection})
      });
      sinon.spy(layer, 'changed');

      var source = new ol.source.Source({projection: projection});
      layer.setSource(source);
      expect(layer.changed.calledOnce).to.be(true);
    });

    it('sets up event listeners', function() {
      sinon.spy(ol.layer.Layer.prototype, 'handleSourceChange_');

      var first = new ol.source.Source({projection: projection});
      var layer = new ol.layer.Layer({source: first});

      first.setState(ol.source.State.READY);
      expect(layer.handleSourceChange_.calledOnce).to.be(true);

      var second = new ol.source.Source({projection: projection});
      layer.setSource(second);

      expect(layer.handleSourceChange_.calledOnce).to.be(true);
      second.setState(ol.source.State.READY);
      expect(layer.handleSourceChange_.callCount).to.be(2);

      // remove spy
      ol.layer.Layer.prototype.handleSourceChange_.restore();
    });

  });


  describe('#setOpacity', function() {

    var layer;

    beforeEach(function() {
      layer = new ol.layer.Layer({
        source: new ol.source.Source({
          projection: ol.proj.get('EPSG:4326')
        })
      });
    });

    afterEach(function() {
      goog.dispose(layer);
    });

    it('accepts a positive number', function() {
      layer.setOpacity(0.3);
      expect(layer.getOpacity()).to.be(0.3);
    });

    it('triggers a change event', function() {
      var listener = sinon.spy();
      layer.on(ol.ObjectEventType.PROPERTYCHANGE, listener);
      layer.setOpacity(0.4);
      expect(listener.calledOnce).to.be(true);
    });

  });


  describe('#setVisible', function() {

    var layer;
    beforeEach(function() {
      layer = new ol.layer.Layer({
        source: new ol.source.Source({
          projection: ol.proj.get('EPSG:4326')
        })
      });
    });

    afterEach(function() {
      goog.dispose(layer);
    });

    it('sets visible property', function() {
      layer.setVisible(false);
      expect(layer.getVisible()).to.be(false);

      layer.setVisible(true);
      expect(layer.getVisible()).to.be(true);
    });

    it('fires a change event', function() {
      var listener = sinon.spy();
      layer.on(ol.ObjectEventType.PROPERTYCHANGE, listener);

      layer.setVisible(false);
      expect(listener.callCount).to.be(1);

      layer.setVisible(true);
      expect(listener.callCount).to.be(2);
    });

  });

  describe('#setMap (unmanaged layer)', function() {
    var map;

    beforeEach(function() {
      map = new ol.Map({});
    });

    describe('with map in constructor options', function() {
      it('renders the layer', function() {
        var layer = new ol.layer.Layer({
          map: map
        });
        var frameState = {
          layerStatesArray: [],
          layerStates: {}
        };
        map.dispatchEvent(new ol.render.Event('precompose', map, null,
            frameState, null, null));
        expect(frameState.layerStatesArray.length).to.be(1);
        var layerState = frameState.layerStatesArray[0];
        expect(layerState.layer).to.equal(layer);
        expect(frameState.layerStates[goog.getUid(layer)]).to.equal(layerState);
      });
    });

    describe('setMap sequences', function() {
      var mapRenderSpy;

      beforeEach(function() {
        mapRenderSpy = sinon.spy(map, 'render');
      });

      afterEach(function() {
        mapRenderSpy.restore();
      });

      it('requests a render frame', function() {
        var layer = new ol.layer.Layer({});

        layer.setMap(map);
        expect(mapRenderSpy.callCount).to.be(1);

        layer.setMap(null);
        expect(mapRenderSpy.callCount).to.be(2);

        layer.setMap(map);
        expect(mapRenderSpy.callCount).to.be(3);
      });

    });

  });

});

goog.require('goog.dispose');
goog.require('ol.Map');
goog.require('ol.ObjectEventType');
goog.require('ol.layer.Layer');
goog.require('ol.proj');
goog.require('ol.render.Event');
goog.require('ol.source.Source');
goog.require('ol.source.State');
