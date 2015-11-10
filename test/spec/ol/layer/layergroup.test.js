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

    it('provides default opacity', function() {
      expect(layerGroup.getOpacity()).to.be(1);
    });

    it('provides default visibility', function() {
      expect(layerGroup.getVisible()).to.be(true);
    });

    it('provides default layerState', function() {
      expect(layerGroup.getLayerState()).to.eql({
        layer: layerGroup,
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
        opacity: 0.5,
        visible: false,
        zIndex: 10,
        maxResolution: 500,
        minResolution: 0.25
      });

      expect(layerGroup.getOpacity()).to.be(0.5);
      expect(layerGroup.getVisible()).to.be(false);
      expect(layerGroup.getMaxResolution()).to.be(500);
      expect(layerGroup.getMinResolution()).to.be(0.25);
      expect(layerGroup.getLayerState()).to.eql({
        layer: layerGroup,
        opacity: 0.5,
        visible: false,
        managed: true,
        sourceState: ol.source.State.READY,
        extent: undefined,
        zIndex: 10,
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
        opacity: 0.5,
        visible: false,
        extent: groupExtent,
        maxResolution: 500,
        minResolution: 0.25
      });

      expect(layerGroup.getOpacity()).to.be(0.5);
      expect(layerGroup.getVisible()).to.be(false);
      expect(layerGroup.getExtent()).to.eql(groupExtent);
      expect(layerGroup.getMaxResolution()).to.be(500);
      expect(layerGroup.getMinResolution()).to.be(0.25);
      expect(layerGroup.getLayerState()).to.eql({
        layer: layerGroup,
        opacity: 0.5,
        visible: false,
        managed: true,
        sourceState: ol.source.State.READY,
        extent: groupExtent,
        zIndex: 0,
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
      layerGroup.setOpacity(0.3);
      layerGroup.setVisible(false);
      layerGroup.setZIndex(10);
      var groupExtent = [-100, 50, 100, 50];
      layerGroup.setExtent(groupExtent);
      layerGroup.setMaxResolution(500);
      layerGroup.setMinResolution(0.25);
      expect(layerGroup.getLayerState()).to.eql({
        layer: layerGroup,
        opacity: 0.3,
        visible: false,
        managed: true,
        sourceState: ol.source.State.READY,
        extent: groupExtent,
        zIndex: 10,
        maxResolution: 500,
        minResolution: 0.25
      });
    });

    it('returns a layerState with clamped values', function() {
      layerGroup.setOpacity(-1.5);
      layerGroup.setVisible(false);
      expect(layerGroup.getLayerState()).to.eql({
        layer: layerGroup,
        opacity: 0,
        visible: false,
        managed: true,
        sourceState: ol.source.State.READY,
        extent: undefined,
        zIndex: 0,
        maxResolution: Infinity,
        minResolution: 0
      });

      layerGroup.setOpacity(3);
      layerGroup.setVisible(true);
      expect(layerGroup.getLayerState()).to.eql({
        layer: layerGroup,
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

  describe('layers events', function() {

    it('listen / unlisten for layers added to the collection', function() {
      var layers = new ol.Collection();
      var layerGroup = new ol.layer.Group({
        layers: layers
      });
      expect(goog.object.getCount(layerGroup.listenerKeys_)).to.eql(0);
      var layer = new ol.layer.Layer({});
      layers.push(layer);
      expect(goog.object.getCount(layerGroup.listenerKeys_)).to.eql(1);

      var listeners = layerGroup.listenerKeys_[goog.getUid(layer)];
      expect(listeners.length).to.eql(2);
      expect(listeners[0]).to.be.a(goog.events.Listener);
      expect(listeners[1]).to.be.a(goog.events.Listener);

      // remove the layer from the group
      layers.pop();
      expect(goog.object.getCount(layerGroup.listenerKeys_)).to.eql(0);
      expect(listeners[0].removed).to.eql(true);
      expect(listeners[1].removed).to.eql(true);
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
      opacity: 0.5,
      visible: false,
      maxResolution: 500,
      minResolution: 0.25
    });
    var layer3 = new ol.layer.Layer({
      source: new ol.source.Source({
        projection: 'EPSG:4326'
      }),
      extent: [-5, -2, 5, 2]
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

    it('uses the layer group extent if layer has no extent', function() {
      var groupExtent = [-10, -5, 10, 5];
      var layerGroup = new ol.layer.Group({
        extent: groupExtent,
        layers: [layer1]
      });
      var layerStatesArray = layerGroup.getLayerStatesArray();
      expect(layerStatesArray[0].extent).to.eql(groupExtent);
      goog.dispose(layerGroup);
    });

    it('uses the intersection of group and child extent', function() {
      var groupExtent = [-10, -5, 10, 5];
      var layerGroup = new ol.layer.Group({
        extent: groupExtent,
        layers: [layer3]
      });
      var layerStatesArray = layerGroup.getLayerStatesArray();
      expect(layerStatesArray[0].extent).to.eql(
          ol.extent.getIntersection(layer3.getExtent(), groupExtent));
      goog.dispose(layerGroup);
    });

    it('transforms layerStates correctly', function() {
      var layerGroup = new ol.layer.Group({
        layers: [layer1, layer2],
        opacity: 0.5,
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
        opacity: 0.25,
        visible: false,
        managed: true,
        sourceState: ol.source.State.READY,
        extent: undefined,
        zIndex: 0,
        maxResolution: 150,
        minResolution: 0.25
      });

      goog.dispose(layerGroup);
    });

    it('let order of layers without Z-index unchanged', function() {
      var layerGroup = new ol.layer.Group({
        layers: [layer1, layer2]
      });

      var layerStatesArray = layerGroup.getLayerStatesArray();
      var initialArray = layerStatesArray.slice();
      goog.array.stableSort(layerStatesArray, ol.renderer.Map.sortByZIndex);
      expect(layerStatesArray[0]).to.eql(initialArray[0]);
      expect(layerStatesArray[1]).to.eql(initialArray[1]);

      goog.dispose(layerGroup);
    });

    it('orders layer with higher Z-index on top', function() {
      var layer10 = new ol.layer.Layer({
        source: new ol.source.Source({
          projection: 'EPSG:4326'
        })
      });
      layer10.setZIndex(10);

      var layerM1 = new ol.layer.Layer({
        source: new ol.source.Source({
          projection: 'EPSG:4326'
        })
      });
      layerM1.setZIndex(-1);

      var layerGroup = new ol.layer.Group({
        layers: [layer1, layer10, layer2, layerM1]
      });

      var layerStatesArray = layerGroup.getLayerStatesArray();
      var initialArray = layerStatesArray.slice();
      goog.array.stableSort(layerStatesArray, ol.renderer.Map.sortByZIndex);
      expect(layerStatesArray[0]).to.eql(initialArray[3]);
      expect(layerStatesArray[1]).to.eql(initialArray[0]);
      expect(layerStatesArray[2]).to.eql(initialArray[2]);
      expect(layerStatesArray[3]).to.eql(initialArray[1]);

      goog.dispose(layer10);
      goog.dispose(layerM1);
      goog.dispose(layerGroup);
    });

    goog.dispose(layer1);
    goog.dispose(layer2);
    goog.dispose(layer3);
  });

});

goog.require('goog.array');
goog.require('goog.dispose');
goog.require('goog.events.EventType');
goog.require('goog.events.Listener');
goog.require('goog.object');
goog.require('ol.ObjectEventType');
goog.require('ol.extent');
goog.require('ol.layer.Layer');
goog.require('ol.layer.Group');
goog.require('ol.renderer.Map');
goog.require('ol.source.Source');
goog.require('ol.source.State');
goog.require('ol.Collection');
