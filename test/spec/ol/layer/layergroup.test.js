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
        layer: layerGroup,
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

    it('provides default empty layers collection', function() {
      expect(layerGroup.getLayers()).to.be.a(ol.Collection);
      expect(layerGroup.getLayers().getLength()).to.be(0);
    });

  });

  describe('generic change event', function() {

    var layer, group, listener;
    beforeEach(function() {
      layer = new ol.layer.Layer({
        source: new ol.source.Source({
          projection: 'EPSG:4326'
        })
      });
      group = new ol.layer.Group({
        layers: [layer]
      });
      listener = sinon.spy();
    });

    afterEach(function() {
      goog.dispose(group);
      goog.dispose(layer);
    });

    it('is dispatched by the group when layer opacity changes', function() {
      group.on(goog.events.EventType.CHANGE, listener);

      layer.setOpacity(0.5);
      expect(listener.calledOnce).to.be(true);
    });

    it('is dispatched by the group when layer visibility changes', function() {
      group.on(goog.events.EventType.CHANGE, listener);

      layer.setVisible(false);
      expect(listener.callCount).to.be(1);

      layer.setVisible(true);
      expect(listener.callCount).to.be(2);
    });

  });

  describe('property change event', function() {

    var layer, group, listener;
    beforeEach(function() {
      layer = new ol.layer.Layer({
        source: new ol.source.Source({
          projection: 'EPSG:4326'
        })
      });
      group = new ol.layer.Group({
        layers: [layer]
      });
      listener = sinon.spy();
    });

    afterEach(function() {
      goog.dispose(group);
      goog.dispose(layer);
    });

    it('is dispatched by the group when group opacity changes', function() {
      group.on(ol.ObjectEventType.PROPERTYCHANGE, listener);

      group.setOpacity(0.5);
      expect(listener.calledOnce).to.be(true);
    });

    it('is dispatched by the group when group visibility changes', function() {
      group.on(ol.ObjectEventType.PROPERTYCHANGE, listener);

      group.setVisible(false);
      expect(listener.callCount).to.be(1);

      group.setVisible(true);
      expect(listener.callCount).to.be(2);
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
        layer: layerGroup,
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
      expect(layerGroup.getLayers()).to.be.a(ol.Collection);
      expect(layerGroup.getLayers().getLength()).to.be(1);
      expect(layerGroup.getLayers().item(0)).to.be(layer);

      goog.dispose(layer);
      goog.dispose(layerGroup);
    });

    it('accepts an extent option', function() {
      var layer = new ol.layer.Layer({
        source: new ol.source.Source({
          projection: 'EPSG:4326'
        })
      });

      var groupExtent = [-10, -5, 10, 5];
      var layerGroup = new ol.layer.Group({
        layers: [layer],
        brightness: 0.5,
        contrast: 10,
        hue: 180,
        opacity: 0.5,
        saturation: 5,
        visible: false,
        extent: groupExtent,
        maxResolution: 500,
        minResolution: 0.25
      });

      expect(layerGroup.getBrightness()).to.be(0.5);
      expect(layerGroup.getContrast()).to.be(10);
      expect(layerGroup.getHue()).to.be(180);
      expect(layerGroup.getOpacity()).to.be(0.5);
      expect(layerGroup.getSaturation()).to.be(5);
      expect(layerGroup.getVisible()).to.be(false);
      expect(layerGroup.getExtent()).to.eql(groupExtent);
      expect(layerGroup.getMaxResolution()).to.be(500);
      expect(layerGroup.getMinResolution()).to.be(0.25);
      expect(layerGroup.getLayerState()).to.eql({
        layer: layerGroup,
        brightness: 0.5,
        contrast: 10,
        hue: 180,
        opacity: 0.5,
        saturation: 5,
        visible: false,
        sourceState: ol.source.State.READY,
        extent: groupExtent,
        maxResolution: 500,
        minResolution: 0.25
      });
      expect(layerGroup.getLayers()).to.be.a(ol.Collection);
      expect(layerGroup.getLayers().getLength()).to.be(1);
      expect(layerGroup.getLayers().item(0)).to.be(layer);

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
      var groupExtent = [-100, 50, 100, 50];
      layerGroup.setExtent(groupExtent);
      layerGroup.setMaxResolution(500);
      layerGroup.setMinResolution(0.25);
      expect(layerGroup.getLayerState()).to.eql({
        layer: layerGroup,
        brightness: -0.7,
        contrast: 0.3,
        hue: -0.3,
        opacity: 0.3,
        saturation: 0.3,
        visible: false,
        sourceState: ol.source.State.READY,
        extent: groupExtent,
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
        layer: layerGroup,
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

      layerGroup.setBrightness(-3);
      layerGroup.setContrast(42);
      layerGroup.setHue(-100);
      layerGroup.setOpacity(3);
      layerGroup.setSaturation(42);
      layerGroup.setVisible(true);
      expect(layerGroup.getLayerState()).to.eql({
        layer: layerGroup,
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

    it('returns an empty array if no layer', function() {
      var layerGroup = new ol.layer.Group();

      var layerStatesArray = layerGroup.getLayerStatesArray();
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
      var layerGroup = new ol.layer.Group({
        layers: [layer1, layer2]
      });

      var layerStatesArray = layerGroup.getLayerStatesArray();
      expect(layerStatesArray).to.be.a(Array);
      expect(layerStatesArray.length).to.be(2);
      expect(layerStatesArray[0]).to.eql(layer1.getLayerState());

      // layer state should match except for layer reference
      var layerState = goog.object.clone(layerStatesArray[0]);
      delete layerState.layer;
      var groupState = goog.object.clone(layerGroup.getLayerState());
      delete groupState.layer;
      expect(layerState).to.eql(groupState);

      expect(layerStatesArray[1]).to.eql(layer2.getLayerState());

      goog.dispose(layerGroup);
    });

    it('transforms layerStates correctly', function() {
      var layerGroup = new ol.layer.Group({
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

      var layerStatesArray = layerGroup.getLayerStatesArray();

      // compare layer state to group state
      var groupState, layerState;

      // layer state should match except for layer reference
      layerState = goog.object.clone(layerStatesArray[0]);
      delete layerState.layer;
      groupState = goog.object.clone(layerGroup.getLayerState());
      delete groupState.layer;
      expect(layerState).to.eql(groupState);

      // layer state should be transformed (and we ignore layer reference)
      layerState = goog.object.clone(layerStatesArray[1]);
      delete layerState.layer;
      expect(layerState).to.eql({
        brightness: 1,
        contrast: 100,
        hue: 360,
        opacity: 0.25,
        saturation: 25,
        visible: false,
        sourceState: ol.source.State.READY,
        extent: undefined,
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
goog.require('goog.events.EventType');
goog.require('goog.object');
goog.require('ol.ObjectEventType');
goog.require('ol.layer.Layer');
goog.require('ol.layer.Group');
goog.require('ol.source.Source');
goog.require('ol.source.State');
goog.require('ol.Collection');
