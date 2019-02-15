import {getUid} from '../../../../src/ol/util.js';
import Collection from '../../../../src/ol/Collection.js';
import {getIntersection} from '../../../../src/ol/extent.js';
import LayerGroup from '../../../../src/ol/layer/Group.js';
import Layer from '../../../../src/ol/layer/Layer.js';
import {assign} from '../../../../src/ol/obj.js';
import Source from '../../../../src/ol/source/Source.js';


describe('ol.layer.Group', function() {

  describe('constructor (defaults)', function() {

    let layerGroup;

    beforeEach(function() {
      layerGroup = new LayerGroup();
    });

    afterEach(function() {
      layerGroup.dispose();
    });

    it('creates an instance', function() {
      expect(layerGroup).to.be.a(LayerGroup);
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
        sourceState: 'ready',
        extent: undefined,
        zIndex: 0,
        maxResolution: Infinity,
        minResolution: 0
      });
    });

    it('provides default empty layers collection', function() {
      expect(layerGroup.getLayers()).to.be.a(Collection);
      expect(layerGroup.getLayers().getLength()).to.be(0);
    });

  });

  describe('generic change event', function() {

    let layer, group, listener;
    beforeEach(function() {
      layer = new Layer({
        source: new Source({
          projection: 'EPSG:4326'
        })
      });
      group = new LayerGroup({
        layers: [layer]
      });
      listener = sinon.spy();
    });

    afterEach(function() {
      group.dispose();
      layer.dispose();
    });

    it('is dispatched by the group when layer opacity changes', function() {
      group.on('change', listener);

      layer.setOpacity(0.5);
      expect(listener.calledOnce).to.be(true);
    });

    it('is dispatched by the group when layer visibility changes', function() {
      group.on('change', listener);

      layer.setVisible(false);
      expect(listener.callCount).to.be(1);

      layer.setVisible(true);
      expect(listener.callCount).to.be(2);
    });

  });

  describe('property change event', function() {

    let layer, group, listener;
    beforeEach(function() {
      layer = new Layer({
        source: new Source({
          projection: 'EPSG:4326'
        })
      });
      group = new LayerGroup({
        layers: [layer]
      });
      listener = sinon.spy();
    });

    afterEach(function() {
      group.dispose();
      layer.dispose();
    });

    it('is dispatched by the group when group opacity changes', function() {
      group.on('propertychange', listener);

      group.setOpacity(0.5);
      expect(listener.calledOnce).to.be(true);
    });

    it('is dispatched by the group when group visibility changes', function() {
      group.on('propertychange', listener);

      group.setVisible(false);
      expect(listener.callCount).to.be(1);

      group.setVisible(true);
      expect(listener.callCount).to.be(2);
    });

  });

  describe('constructor (options)', function() {

    it('accepts options', function() {
      const layer = new Layer({
        source: new Source({
          projection: 'EPSG:4326'
        })
      });
      const layerGroup = new LayerGroup({
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
        sourceState: 'ready',
        extent: undefined,
        zIndex: 10,
        maxResolution: 500,
        minResolution: 0.25
      });
      expect(layerGroup.getLayers()).to.be.a(Collection);
      expect(layerGroup.getLayers().getLength()).to.be(1);
      expect(layerGroup.getLayers().item(0)).to.be(layer);

      layer.dispose();
      layerGroup.dispose();
    });

    it('accepts an extent option', function() {
      const layer = new Layer({
        source: new Source({
          projection: 'EPSG:4326'
        })
      });

      const groupExtent = [-10, -5, 10, 5];
      const layerGroup = new LayerGroup({
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
        sourceState: 'ready',
        extent: groupExtent,
        zIndex: 0,
        maxResolution: 500,
        minResolution: 0.25
      });
      expect(layerGroup.getLayers()).to.be.a(Collection);
      expect(layerGroup.getLayers().getLength()).to.be(1);
      expect(layerGroup.getLayers().item(0)).to.be(layer);

      layer.dispose();
      layerGroup.dispose();
    });
  });

  describe('#getLayerState', function() {

    let layerGroup;

    beforeEach(function() {
      layerGroup = new LayerGroup();
    });

    afterEach(function() {
      layerGroup.dispose();
    });

    it('returns a layerState from the properties values', function() {
      layerGroup.setOpacity(0.3);
      layerGroup.setVisible(false);
      layerGroup.setZIndex(10);
      const groupExtent = [-100, 50, 100, 50];
      layerGroup.setExtent(groupExtent);
      layerGroup.setMaxResolution(500);
      layerGroup.setMinResolution(0.25);
      expect(layerGroup.getLayerState()).to.eql({
        layer: layerGroup,
        opacity: 0.3,
        visible: false,
        managed: true,
        sourceState: 'ready',
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
        sourceState: 'ready',
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
        sourceState: 'ready',
        extent: undefined,
        zIndex: 0,
        maxResolution: Infinity,
        minResolution: 0
      });
    });

  });

  describe('layers events', function() {

    it('listen / unlisten for layers added to the collection', function() {
      const layers = new Collection();
      const layerGroup = new LayerGroup({
        layers: layers
      });
      expect(Object.keys(layerGroup.listenerKeys_).length).to.eql(0);
      const layer = new Layer({});
      layers.push(layer);
      expect(Object.keys(layerGroup.listenerKeys_).length).to.eql(1);

      const listeners = layerGroup.listenerKeys_[getUid(layer)];
      expect(listeners.length).to.eql(2);
      expect(typeof listeners[0]).to.be('object');
      expect(typeof listeners[1]).to.be('object');

      // remove the layer from the group
      layers.pop();
      expect(Object.keys(layerGroup.listenerKeys_).length).to.eql(0);
      expect(listeners[0].listener).to.be(undefined);
      expect(listeners[1].listener).to.be(undefined);
    });

  });

  describe('#setLayers', function() {

    it('sets layers property', function() {
      const layer = new Layer({
        source: new Source({
          projection: 'EPSG:4326'
        })
      });
      const layers = new Collection([layer]);
      const layerGroup = new LayerGroup();

      layerGroup.setLayers(layers);
      expect(layerGroup.getLayers()).to.be(layers);

      layerGroup.dispose();
      layer.dispose();
      layers.dispose();
    });

  });


  describe('#getLayerStatesArray', function() {

    let layer1, layer2, layer3;
    beforeEach(function() {
      layer1 = new Layer({
        source: new Source({
          projection: 'EPSG:4326'
        })
      });
      layer2 = new Layer({
        source: new Source({
          projection: 'EPSG:4326'
        }),
        opacity: 0.5,
        visible: false,
        maxResolution: 500,
        minResolution: 0.25
      });
      layer3 = new Layer({
        source: new Source({
          projection: 'EPSG:4326'
        }),
        extent: [-5, -2, 5, 2]
      });
    });

    afterEach(function() {
      layer1.dispose();
      layer2.dispose();
      layer3.dispose();
    });

    it('returns an empty array if no layer', function() {
      const layerGroup = new LayerGroup();

      const layerStatesArray = layerGroup.getLayerStatesArray();
      expect(layerStatesArray).to.be.a(Array);
      expect(layerStatesArray.length).to.be(0);

      layerGroup.dispose();
    });

    it('does not transform layerStates by default', function() {
      const layerGroup = new LayerGroup({
        layers: [layer1, layer2]
      });

      const layerStatesArray = layerGroup.getLayerStatesArray();
      expect(layerStatesArray).to.be.a(Array);
      expect(layerStatesArray.length).to.be(2);
      expect(layerStatesArray[0]).to.eql(layer1.getLayerState());

      // layer state should match except for layer reference
      const layerState = assign({}, layerStatesArray[0]);
      delete layerState.layer;
      const groupState = assign({}, layerGroup.getLayerState());
      delete groupState.layer;
      expect(layerState).to.eql(groupState);

      expect(layerStatesArray[1]).to.eql(layer2.getLayerState());

      layerGroup.dispose();
    });

    it('uses the layer group extent if layer has no extent', function() {
      const groupExtent = [-10, -5, 10, 5];
      const layerGroup = new LayerGroup({
        extent: groupExtent,
        layers: [layer1]
      });
      const layerStatesArray = layerGroup.getLayerStatesArray();
      expect(layerStatesArray[0].extent).to.eql(groupExtent);
      layerGroup.dispose();
    });

    it('uses the intersection of group and child extent', function() {
      const groupExtent = [-10, -5, 10, 5];
      const layerGroup = new LayerGroup({
        extent: groupExtent,
        layers: [layer3]
      });
      const layerStatesArray = layerGroup.getLayerStatesArray();
      expect(layerStatesArray[0].extent).to.eql(
        getIntersection(layer3.getExtent(), groupExtent));
      layerGroup.dispose();
    });

    it('transforms layerStates correctly', function() {
      const layerGroup = new LayerGroup({
        layers: [layer1, layer2],
        opacity: 0.5,
        visible: false,
        maxResolution: 150,
        minResolution: 0.2
      });

      const layerStatesArray = layerGroup.getLayerStatesArray();

      // compare layer state to group state

      // layer state should match except for layer reference
      let layerState = assign({}, layerStatesArray[0]);
      delete layerState.layer;
      const groupState = assign({}, layerGroup.getLayerState());
      delete groupState.layer;
      expect(layerState).to.eql(groupState);

      // layer state should be transformed (and we ignore layer reference)
      layerState = assign({}, layerStatesArray[1]);
      delete layerState.layer;
      expect(layerState).to.eql({
        opacity: 0.25,
        visible: false,
        managed: true,
        sourceState: 'ready',
        extent: undefined,
        zIndex: 0,
        maxResolution: 150,
        minResolution: 0.25
      });

      layerGroup.dispose();
    });

  });

});
