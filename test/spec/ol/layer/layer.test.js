goog.provide('ol.test.layer.Layer');

describe('ol.layer.Layer', function() {

  describe('constructor (defaults)', function() {

    var layer;

    beforeEach(function() {
      layer = new ol.layer.Layer({
        source: new ol.source.Source({
          projection: ol.projection.getFromCode('EPSG:4326')
        })
      });
    });

    afterEach(function() {
      layer.dispose();
    });

    it('creates an instance', function() {
      expect(layer).toBeA(ol.layer.Layer);
    });

    it('provides default brightness', function() {
      expect(layer.getBrightness()).toBe(0);
    });

    it('provides default contrast', function() {
      expect(layer.getContrast()).toBe(1);
    });

    it('provides default hue', function() {
      expect(layer.getHue()).toBe(0);
    });

    it('provides default opacity', function() {
      expect(layer.getOpacity()).toBe(1);
    });

    it('provides default saturation', function() {
      expect(layer.getSaturation()).toBe(1);
    });

    it('provides default visibility', function() {
      expect(layer.getVisible()).toBe(true);
    });

  });

  describe('constructor (options)', function() {

    it('accepts options', function() {
      var layer = new ol.layer.Layer({
        source: new ol.source.Source({
          projection: ol.projection.getFromCode('EPSG:4326')
        }),
        brightness: 0.5,
        contrast: 10,
        hue: 180,
        opacity: 0.5,
        saturation: 5,
        visible: false
      });

      expect(layer.getBrightness()).toBe(0.5);
      expect(layer.getContrast()).toBe(10);
      expect(layer.getHue()).toBe(180);
      expect(layer.getOpacity()).toBe(0.5);
      expect(layer.getSaturation()).toBe(5);
      expect(layer.getVisible()).toBe(false);

      layer.dispose();
    });

  });

  describe('#setBrightness', function() {

    var layer;

    beforeEach(function() {
      layer = new ol.layer.Layer({
        source: new ol.source.Source({
          projection: ol.projection.getFromCode('EPSG:4326')
        })
      });
    });

    afterEach(function() {
      layer.dispose();
    });

    it('accepts a positive number', function() {
      layer.setBrightness(0.3);
      expect(layer.getBrightness()).toBe(0.3);
    });

    it('accepts a negative number', function() {
      layer.setBrightness(-0.7);
      expect(layer.getBrightness()).toBe(-0.7);
    });

    it('clamps to 1', function() {
      layer.setBrightness(1.5);
      expect(layer.getBrightness()).toBe(1);
    });

    it('clamps to -1', function() {
      layer.setBrightness(-3);
      expect(layer.getBrightness()).toBe(-1);
    });

  });

  describe('#setContrast', function() {

    var layer;

    beforeEach(function() {
      layer = new ol.layer.Layer({
        source: new ol.source.Source({
          projection: ol.projection.getFromCode('EPSG:4326')
        })
      });
    });

    afterEach(function() {
      layer.dispose();
    });

    it('accepts a small positive number', function() {
      layer.setContrast(0.3);
      expect(layer.getContrast()).toBe(0.3);
    });

    it('clamps to 0', function() {
      layer.setContrast(-0.7);
      expect(layer.getContrast()).toBe(0);
    });

    it('accepts a big positive number', function() {
      layer.setContrast(42);
      expect(layer.getContrast()).toBe(42);
    });

  });


  describe('#setHue', function() {

    var layer;

    beforeEach(function() {
      layer = new ol.layer.Layer({
        source: new ol.source.Source({
          projection: ol.projection.getFromCode('EPSG:4326')
        })
      });
    });

    afterEach(function() {
      layer.dispose();
    });

    it('accepts a small positive number', function() {
      layer.setHue(0.3);
      expect(layer.getHue()).toBe(0.3);
    });

    it('accepts a small negative number', function() {
      layer.setHue(-0.7);
      expect(layer.getHue()).toBe(-0.7);
    });

    it('accepts a big positive number', function() {
      layer.setHue(42);
      expect(layer.getHue()).toBe(42);
    });

    it('accepts a big negative number', function() {
      layer.setHue(-100);
      expect(layer.getHue()).toBe(-100);
    });

  });


  describe('#setOpacity', function() {

    var layer;

    beforeEach(function() {
      layer = new ol.layer.Layer({
        source: new ol.source.Source({
          projection: ol.projection.getFromCode('EPSG:4326')
        })
      });
    });

    afterEach(function() {
      layer.dispose();
    });

    it('accepts a positive number', function() {
      layer.setOpacity(0.3);
      expect(layer.getOpacity()).toBe(0.3);
    });

    it('clamps to 0', function() {
      layer.setOpacity(-1.5);
      expect(layer.getOpacity()).toBe(0);
    });

    it('clamps to 1', function() {
      layer.setOpacity(3);
      expect(layer.getOpacity()).toBe(1);
    });

  });


  describe('#setSaturation', function() {

    var layer;

    beforeEach(function() {
      layer = new ol.layer.Layer({
        source: new ol.source.Source({
          projection: ol.projection.getFromCode('EPSG:4326')
        })
      });
    });

    afterEach(function() {
      layer.dispose();
    });

    it('accepts a small positive number', function() {
      layer.setSaturation(0.3);
      expect(layer.getSaturation()).toBe(0.3);
    });

    it('clamps to 0', function() {
      layer.setSaturation(-0.7);
      expect(layer.getSaturation()).toBe(0);
    });

    it('accepts a big positive number', function() {
      layer.setSaturation(42);
      expect(layer.getSaturation()).toBe(42);
    });

  });


  describe('#setVisible', function() {

    it('sets visible property', function() {
      var layer = new ol.layer.Layer({
        source: new ol.source.Source({
          projection: ol.projection.getFromCode('EPSG:4326')
        })
      });

      layer.setVisible(false);
      expect(layer.getVisible()).toBe(false);

      layer.setVisible(true);
      expect(layer.getVisible()).toBe(true);

      layer.dispose();
    });

  });

});

goog.require('ol.projection');
