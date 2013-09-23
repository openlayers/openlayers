goog.provide('ol.test.layer.LayerGroup');

describe('ol.layer.Group', function() {

  describe('constructor (defaults)', function() {

    var layerGroup;

    beforeEach(function() {
      layerGroup = new ol.layer.Group();
    });

    afterEach(function() {
      goog.dispose(layerGroup);
    });

    it('creates an instance', function() {
      expect(layerGroup).to.be.a(ol.layer.Group);
    });

    it('provides default brightness', function() {
      expect(layerGroup.getBrightness()).to.be(0);
    });

    it('provides default contrast', function() {
      expect(layerGroup.getContrast()).to.be(1);
    });

    it('provides default hue', function() {
      expect(layerGroup.getHue()).to.be(0);
    });

    it('provides default opacity', function() {
      expect(layerGroup.getOpacity()).to.be(1);
    });

    it('provides default saturation', function() {
      expect(layerGroup.getSaturation()).to.be(1);
    });

    it('provides default visibility', function() {
      expect(layerGroup.getVisible()).to.be(true);
    });

    it('provides default layerState', function() {
      expect(layerGroup.getLayerState()).to.eql({
        brightness: 0,
        contrast: 1,
        hue: 0,
        opacity: 1,
        saturation: 1,
        visible: true,
        ready: true,
        maxResolution: Infinity,
        minResolution: 0
      });
    });

    it('provides default empty layers collection', function() {
      expect(layerGroup.getLayers()).to.be.a(ol.Collection);
      expect(layerGroup.getLayers().getLength()).to.be(0);
    });

  });

  describe('constructor (options)', function() {

    it('accepts options', function() {
      var layer = new ol.layer.Layer({
        source: new ol.source.Source({
          projection: 'EPSG:4326'
        })
      });
      var layerGroup = new ol.layer.Group({
        layers: [layer],
        brightness: 0.5,
        contrast: 10,
        hue: 180,
        opacity: 0.5,
        saturation: 5,
        visible: false,
        maxResolution: 500,
        minResolution: 0.25
      });

      expect(layerGroup.getBrightness()).to.be(0.5);
      expect(layerGroup.getContrast()).to.be(10);
      expect(layerGroup.getHue()).to.be(180);
      expect(layerGroup.getOpacity()).to.be(0.5);
      expect(layerGroup.getSaturation()).to.be(5);
      expect(layerGroup.getVisible()).to.be(false);
      expect(layerGroup.getMaxResolution()).to.be(500);
      expect(layerGroup.getMinResolution()).to.be(0.25);
      expect(layerGroup.getLayerState()).to.eql({
        brightness: 0.5,
        contrast: 10,
        hue: 180,
        opacity: 0.5,
        saturation: 5,
        visible: false,
        ready: true,
        maxResolution: 500,
        minResolution: 0.25
      });
      expect(layerGroup.getLayers()).to.be.a(ol.Collection);
      expect(layerGroup.getLayers().getLength()).to.be(1);
      expect(layerGroup.getLayers().getAt(0)).to.be(layer);

      goog.dispose(layer);
      goog.dispose(layerGroup);
    });

  });

  describe('#getLayerState', function() {

    var layerGroup;

    beforeEach(function() {
      layerGroup = new ol.layer.Group();
    });

    afterEach(function() {
      goog.dispose(layerGroup);
    });

    it('returns a layerState from the properties values', function() {
      layerGroup.setBrightness(-0.7);
      layerGroup.setContrast(0.3);
      layerGroup.setHue(-0.3);
      layerGroup.setOpacity(0.3);
      layerGroup.setSaturation(0.3);
      layerGroup.setVisible(false);
      layerGroup.setMaxResolution(500);
      layerGroup.setMinResolution(0.25);
      expect(layerGroup.getLayerState()).to.eql({
        brightness: -0.7,
        contrast: 0.3,
        hue: -0.3,
        opacity: 0.3,
        saturation: 0.3,
        visible: false,
        ready: true,
        maxResolution: 500,
        minResolution: 0.25
      });
    });

    it('returns a layerState with clamped values', function() {
      layerGroup.setBrightness(1.5);
      layerGroup.setContrast(-0.7);
      layerGroup.setHue(42);
      layerGroup.setOpacity(-1.5);
      layerGroup.setSaturation(-0.7);
      layerGroup.setVisible(false);
      expect(layerGroup.getLayerState()).to.eql({
        brightness: 1,
        contrast: 0,
        hue: 42,
        opacity: 0,
        saturation: 0,
        visible: false,
        ready: true,
        maxResolution: Infinity,
        minResolution: 0
      });

      layerGroup.setBrightness(-3);
      layerGroup.setContrast(42);
      layerGroup.setHue(-100);
      layerGroup.setOpacity(3);
      layerGroup.setSaturation(42);
      layerGroup.setVisible(true);
      expect(layerGroup.getLayerState()).to.eql({
        brightness: -1,
        contrast: 42,
        hue: -100,
        opacity: 1,
        saturation: 42,
        visible: true,
        ready: true,
        maxResolution: Infinity,
        minResolution: 0
      });
    });

  });


  describe('#setLayers', function() {

    it('sets layers property', function() {
      var layer = new ol.layer.Layer({
        source: new ol.source.Source({
          projection: 'EPSG:4326'
        })
      });
      var layers = new ol.Collection([layer]);
      var layerGroup = new ol.layer.Group();

      layerGroup.setLayers(layers);
      expect(layerGroup.getLayers()).to.be(layers);

      layerGroup.setLayers(null);
      expect(layerGroup.getLayers()).to.be(null);

      goog.dispose(layerGroup);
      goog.dispose(layer);
      goog.dispose(layers);
    });

  });


  describe('#getLayerStatesArray', function() {

    var layerGroup;
    var layersArray;
    var layerStatesArray;
    var obj;

    it('returns an empty array if no layer', function() {
      layerGroup = new ol.layer.Group();

      obj = layerGroup.getLayerStatesArray();
      layersArray = obj.layers;
      layerStatesArray = obj.layerStates;
      expect(layersArray).to.be.a(Array);
      expect(layersArray.length).to.be(0);
      expect(layerStatesArray).to.be.a(Array);
      expect(layerStatesArray.length).to.be(0);

      goog.dispose(layerGroup);
    });

    var layer1 = new ol.layer.Layer({
      source: new ol.source.Source({
        projection: 'EPSG:4326'
      })
    });
    var layer2 = new ol.layer.Layer({
      source: new ol.source.Source({
        projection: 'EPSG:4326'
      }),
      brightness: 0.5,
      contrast: 10,
      hue: 180,
      opacity: 0.5,
      saturation: 5,
      visible: false,
      maxResolution: 500,
      minResolution: 0.25
    });

    it('does not transform layerStates by default', function() {
      layerGroup = new ol.layer.Group({
        layers: [layer1, layer2]
      });

      obj = layerGroup.getLayerStatesArray();
      layersArray = obj.layers;
      layerStatesArray = obj.layerStates;
      expect(layersArray).to.be.a(Array);
      expect(layersArray.length).to.be(2);
      expect(layersArray[0]).to.be(layer1);
      expect(layersArray[1]).to.be(layer2);
      expect(layerStatesArray).to.be.a(Array);
      expect(layerStatesArray.length).to.be(2);
      expect(layerStatesArray[0]).to.eql(layer1.getLayerState());
      expect(layerStatesArray[0]).to.eql(layerGroup.getLayerState());
      expect(layerStatesArray[1]).to.eql(layer2.getLayerState());

      goog.dispose(layerGroup);
    });

    it('transforms layerStates correctly', function() {
      layerGroup = new ol.layer.Group({
        layers: [layer1, layer2],
        brightness: 0.5,
        contrast: 10,
        hue: 180,
        opacity: 0.5,
        saturation: 5,
        visible: false,
        maxResolution: 150,
        minResolution: 0.2
      });

      obj = layerGroup.getLayerStatesArray();
      layersArray = obj.layers;
      layerStatesArray = obj.layerStates;
      expect(layerStatesArray[0]).to.eql(layerGroup.getLayerState());
      expect(layerStatesArray[1]).to.eql({
        brightness: 1,
        contrast: 100,
        hue: 360,
        opacity: 0.25,
        saturation: 25,
        visible: false,
        ready: true,
        maxResolution: 150,
        minResolution: 0.25
      });

      goog.dispose(layerGroup);
    });

    goog.dispose(layer1);
    goog.dispose(layer2);

  });

});

goog.require('goog.dispose');
goog.require('ol.layer.Layer');
goog.require('ol.layer.Group');
goog.require('ol.source.Source');
goog.require('ol.Collection');
