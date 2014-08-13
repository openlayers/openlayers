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

    it('provides default brightness', function() {
      expect(layer.getBrightness()).to.be(0);
    });

    it('provides default contrast', function() {
      expect(layer.getContrast()).to.be(1);
    });

    it('provides default hue', function() {
      expect(layer.getHue()).to.be(0);
    });

    it('provides default opacity', function() {
      expect(layer.getOpacity()).to.be(1);
    });

    it('provides default saturation', function() {
      expect(layer.getSaturation()).to.be(1);
    });

    it('provides default visibility', function() {
      expect(layer.getVisible()).to.be(true);
    });

    it('provides default layerState', function() {
      expect(layer.getLayerState()).to.eql({
        layer: layer,
        brightness: 0,
        contrast: 1,
        hue: 0,
        opacity: 1,
        saturation: 1,
        visible: true,
        sourceState: ol.source.State.READY,
        extent: undefined,
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
        brightness: 0.5,
        contrast: 10,
        hue: 180,
        opacity: 0.5,
        saturation: 5,
        visible: false,
        maxResolution: 500,
        minResolution: 0.25,
        foo: 42
      });

      expect(layer.getBrightness()).to.be(0.5);
      expect(layer.getContrast()).to.be(10);
      expect(layer.getHue()).to.be(180);
      expect(layer.getOpacity()).to.be(0.5);
      expect(layer.getSaturation()).to.be(5);
      expect(layer.getVisible()).to.be(false);
      expect(layer.getMaxResolution()).to.be(500);
      expect(layer.getMinResolution()).to.be(0.25);
      expect(layer.get('foo')).to.be(42);
      expect(layer.getLayerState()).to.eql({
        layer: layer,
        brightness: 0.5,
        contrast: 10,
        hue: 180,
        opacity: 0.5,
        saturation: 5,
        visible: false,
        sourceState: ol.source.State.READY,
        extent: undefined,
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
      layer.setBrightness(-0.7);
      layer.setContrast(0.3);
      layer.setHue(-0.3);
      layer.setOpacity(0.3);
      layer.setSaturation(0.3);
      layer.setVisible(false);
      layer.setMaxResolution(500);
      layer.setMinResolution(0.25);
      expect(layer.getLayerState()).to.eql({
        layer: layer,
        brightness: -0.7,
        contrast: 0.3,
        hue: -0.3,
        opacity: 0.3,
        saturation: 0.3,
        visible: false,
        sourceState: ol.source.State.READY,
        extent: undefined,
        maxResolution: 500,
        minResolution: 0.25
      });
    });

    it('returns a layerState with clamped values', function() {
      layer.setBrightness(1.5);
      layer.setContrast(-0.7);
      layer.setHue(42);
      layer.setOpacity(-1.5);
      layer.setSaturation(-0.7);
      layer.setVisible(false);
      expect(layer.getLayerState()).to.eql({
        layer: layer,
        brightness: 1,
        contrast: 0,
        hue: 42,
        opacity: 0,
        saturation: 0,
        visible: false,
        sourceState: ol.source.State.READY,
        extent: undefined,
        maxResolution: Infinity,
        minResolution: 0
      });

      layer.setBrightness(-3);
      layer.setContrast(42);
      layer.setHue(-100);
      layer.setOpacity(3);
      layer.setSaturation(42);
      layer.setVisible(true);
      expect(layer.getLayerState()).to.eql({
        layer: layer,
        brightness: -1,
        contrast: 42,
        hue: -100,
        opacity: 1,
        saturation: 42,
        visible: true,
        sourceState: ol.source.State.READY,
        extent: undefined,
        maxResolution: Infinity,
        minResolution: 0
      });
    });

  });

  describe('#setBrightness', function() {

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
      layer.setBrightness(0.3);
      expect(layer.getBrightness()).to.be(0.3);
    });

    it('accepts a negative number', function() {
      layer.setBrightness(-0.7);
      expect(layer.getBrightness()).to.be(-0.7);
    });

    it('triggers a change event', function() {
      var listener = sinon.spy();
      layer.on(ol.ObjectEventType.PROPERTYCHANGE, listener);
      layer.setBrightness(0.5);
      expect(listener.calledOnce).to.be(true);
    });

  });

  describe('#setContrast', function() {

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

    it('accepts a small positive number', function() {
      layer.setContrast(0.3);
      expect(layer.getContrast()).to.be(0.3);
    });

    it('accepts a big positive number', function() {
      layer.setContrast(42);
      expect(layer.getContrast()).to.be(42);
    });

    it('triggers a change event', function() {
      var listener = sinon.spy();
      layer.on(ol.ObjectEventType.PROPERTYCHANGE, listener);
      layer.setContrast(43);
      expect(listener.calledOnce).to.be(true);
    });

  });


  describe('#setHue', function() {

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

    it('accepts a small positive number', function() {
      layer.setHue(0.3);
      expect(layer.getHue()).to.be(0.3);
    });

    it('accepts a small negative number', function() {
      layer.setHue(-0.7);
      expect(layer.getHue()).to.be(-0.7);
    });

    it('accepts a big positive number', function() {
      layer.setHue(42);
      expect(layer.getHue()).to.be(42);
    });

    it('accepts a big negative number', function() {
      layer.setHue(-100);
      expect(layer.getHue()).to.be(-100);
    });

    it('triggers a change event', function() {
      var listener = sinon.spy();
      layer.on(ol.ObjectEventType.PROPERTYCHANGE, listener);
      layer.setHue(0.5);
      expect(listener.calledOnce).to.be(true);
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


  describe('#setSaturation', function() {

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

    it('accepts a small positive number', function() {
      layer.setSaturation(0.3);
      expect(layer.getSaturation()).to.be(0.3);
    });

    it('accepts a big positive number', function() {
      layer.setSaturation(42);
      expect(layer.getSaturation()).to.be(42);
    });

    it('triggers a change event', function() {
      var listener = sinon.spy();
      layer.on(ol.ObjectEventType.PROPERTYCHANGE, listener);
      layer.setSaturation(42);
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

});

goog.require('goog.dispose');
goog.require('ol.ObjectEventType');
goog.require('ol.layer.Layer');
goog.require('ol.proj');
goog.require('ol.source.Source');
goog.require('ol.source.State');
