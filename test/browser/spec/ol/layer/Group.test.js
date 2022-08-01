import Collection from '../../../../../src/ol/Collection.js';
import Layer from '../../../../../src/ol/layer/Layer.js';
import LayerGroup from '../../../../../src/ol/layer/Group.js';
import Source from '../../../../../src/ol/source/Source.js';
import {getIntersection} from '../../../../../src/ol/extent.js';
import {getUid} from '../../../../../src/ol/util.js';

describe('ol/layer/Group', function () {
  function disposeHierarchy(layer) {
    if (layer instanceof LayerGroup) {
      layer.getLayers().forEach((l) => disposeHierarchy(l));
    }
    layer.dispose();
  }

  describe('constructor (defaults)', function () {
    /** @type {LayerGroup} */
    let group;

    beforeEach(function () {
      group = new LayerGroup();
    });

    afterEach(function () {
      group.dispose();
    });

    it('creates an instance', function () {
      expect(group).to.be.a(LayerGroup);
    });

    it('provides default opacity', function () {
      expect(group.getOpacity()).to.be(1);
    });

    it('provides default visibility', function () {
      expect(group.getVisible()).to.be(true);
    });

    it('provides default layerState', function () {
      expect(group.getLayerState()).to.eql({
        layer: group,
        opacity: 1,
        visible: true,
        managed: true,
        extent: undefined,
        zIndex: undefined,
        maxResolution: Infinity,
        minResolution: 0,
        minZoom: -Infinity,
        maxZoom: Infinity,
      });
    });

    it('provides default empty layers collection', function () {
      expect(group.getLayers()).to.be.a(Collection);
      expect(group.getLayers().getLength()).to.be(0);
    });
  });

  describe('generic change event', function () {
    let layer, group, listener;
    beforeEach(function () {
      layer = new Layer({
        source: new Source({
          projection: 'EPSG:4326',
        }),
      });
      group = new LayerGroup({
        layers: [layer],
      });
      listener = sinon.spy();
    });

    afterEach(function () {
      disposeHierarchy(group);
    });

    it('is dispatched by the group when layer opacity changes', function () {
      group.on('change', listener);

      layer.setOpacity(0.5);
      expect(listener.calledOnce).to.be(true);
    });

    it('is dispatched by the group when layer visibility changes', function () {
      group.on('change', listener);

      layer.setVisible(false);
      expect(listener.callCount).to.be(1);

      layer.setVisible(true);
      expect(listener.callCount).to.be(2);
    });
  });

  describe('property change event', function () {
    let layer, group, listener;
    beforeEach(function () {
      layer = new Layer({
        source: new Source({
          projection: 'EPSG:4326',
        }),
      });
      group = new LayerGroup({
        layers: [layer],
      });
      listener = sinon.spy();
    });

    afterEach(function () {
      disposeHierarchy(group);
    });

    it('is dispatched by the group when group opacity changes', function () {
      group.on('propertychange', listener);

      group.setOpacity(0.5);
      expect(listener.calledOnce).to.be(true);
    });

    it('is dispatched by the group when group visibility changes', function () {
      group.on('propertychange', listener);

      group.setVisible(false);
      expect(listener.callCount).to.be(1);

      group.setVisible(true);
      expect(listener.callCount).to.be(2);
    });
  });

  describe('constructor (options)', function () {
    it('accepts options', function () {
      const layer = new Layer({
        source: new Source({
          projection: 'EPSG:4326',
        }),
      });
      const group = new LayerGroup({
        layers: [layer],
        opacity: 0.5,
        visible: false,
        zIndex: 10,
        maxResolution: 500,
        minResolution: 0.25,
        minZoom: 1,
        maxZoom: 10,
      });

      expect(group.getOpacity()).to.be(0.5);
      expect(group.getVisible()).to.be(false);
      expect(group.getMaxResolution()).to.be(500);
      expect(group.getMinResolution()).to.be(0.25);
      expect(group.getMinZoom()).to.be(1);
      expect(group.getMaxZoom()).to.be(10);
      expect(group.getLayerState()).to.eql({
        layer: group,
        opacity: 0.5,
        visible: false,
        managed: true,
        extent: undefined,
        zIndex: 10,
        maxResolution: 500,
        minResolution: 0.25,
        minZoom: 1,
        maxZoom: 10,
      });
      expect(group.getLayers()).to.be.a(Collection);
      expect(group.getLayers().getLength()).to.be(1);
      expect(group.getLayers().item(0)).to.be(layer);

      disposeHierarchy(group);
    });

    it('accepts an extent option', function () {
      const layer = new Layer({
        source: new Source({
          projection: 'EPSG:4326',
        }),
      });

      const groupExtent = [-10, -5, 10, 5];
      const group = new LayerGroup({
        layers: [layer],
        opacity: 0.5,
        visible: false,
        extent: groupExtent,
        maxResolution: 500,
        minResolution: 0.25,
      });

      expect(group.getOpacity()).to.be(0.5);
      expect(group.getVisible()).to.be(false);
      expect(group.getExtent()).to.eql(groupExtent);
      expect(group.getMaxResolution()).to.be(500);
      expect(group.getMinResolution()).to.be(0.25);
      expect(group.getLayerState()).to.eql({
        layer: group,
        opacity: 0.5,
        visible: false,
        managed: true,
        extent: groupExtent,
        zIndex: undefined,
        maxResolution: 500,
        minResolution: 0.25,
        minZoom: -Infinity,
        maxZoom: Infinity,
      });
      expect(group.getLayers()).to.be.a(Collection);
      expect(group.getLayers().getLength()).to.be(1);
      expect(group.getLayers().item(0)).to.be(layer);

      disposeHierarchy(group);
    });
  });

  describe('addlayer event', () => {
    it('is dispatched when a layer is added', (done) => {
      const group = new LayerGroup();
      const layer = new Layer({});
      group.on('addlayer', (event) => {
        expect(event.layer).to.be(layer);
        done();
      });

      group.getLayers().push(layer);
    });

    it('is dispatched once for each layer added', (done) => {
      const group = new LayerGroup();
      const layers = [new Layer({}), new Layer({}), new Layer({})];

      let count = 0;
      group.on('addlayer', (event) => {
        expect(event.layer).to.be(layers[count]);
        count++;
        if (count === layers.length) {
          done();
        }
      });

      group.getLayers().extend(layers);
    });

    it('is dispatched when setLayers is called', (done) => {
      const group = new LayerGroup();

      const layers = [new Layer({}), new Layer({}), new Layer({})];

      let count = 0;
      group.on('addlayer', (event) => {
        expect(event.layer).to.be(layers[count]);
        count++;
        if (count === layers.length) {
          done();
        }
      });

      group.setLayers(new Collection(layers));
    });

    it('is dispatched when a layer group is added', (done) => {
      const group = new LayerGroup();
      const layer = new LayerGroup();
      group.on('addlayer', (event) => {
        expect(event.layer).to.be(layer);
        done();
      });

      group.getLayers().push(layer);
    });

    it('is dispatched for each layer added to a child group', (done) => {
      const group = new LayerGroup();
      const child = new LayerGroup();
      group.getLayers().push(child);

      const layer = new Layer({});
      group.on('addlayer', (event) => {
        expect(event.layer).to.be(layer);
        done();
      });

      child.getLayers().push(layer);
    });

    it('is dispatched for each layer added to a child group configured at construction', (done) => {
      const child = new LayerGroup();
      const group = new LayerGroup({
        layers: [child],
      });

      const layer = new Layer({});
      group.on('addlayer', (event) => {
        expect(event.layer).to.be(layer);
        done();
      });

      child.getLayers().push(layer);
    });

    it('is not dispatched for layers added to a child group after the child group is removed', (done) => {
      const child = new LayerGroup();
      const group = new LayerGroup({
        layers: [child],
      });

      const layer = new Layer({});
      group.on('addlayer', (event) => {
        done(new Error('unexpected addlayer after group removal'));
      });

      group.getLayers().remove(child);
      child.getLayers().push(layer);

      setTimeout(done, 10);
    });
  });

  describe('removelayer event', () => {
    it('is dispatched when a layer is removed', (done) => {
      const layer = new Layer({});
      const group = new LayerGroup({layers: [layer]});
      group.on('removelayer', (event) => {
        expect(event.layer).to.be(layer);
        done();
      });

      group.getLayers().remove(layer);
    });

    it('is dispatched when a setLayers is called', (done) => {
      const layer = new Layer({});
      const group = new LayerGroup({layers: [layer]});
      group.on('removelayer', (event) => {
        expect(event.layer).to.be(layer);
        done();
      });

      group.setLayers(new Collection());
    });

    it('is dispatched when a layer is removed from a child group', (done) => {
      const layer = new Layer({});
      const child = new LayerGroup({layers: [layer]});
      const group = new LayerGroup({layers: [child]});
      group.on('removelayer', (event) => {
        expect(event.layer).to.be(layer);
        done();
      });

      child.getLayers().remove(layer);
    });

    it('is not dispatched when a layer is removed from a child group after child group removal', (done) => {
      const layer = new Layer({});
      const child = new LayerGroup({layers: [layer]});
      const group = new LayerGroup({layers: [child]});
      group.getLayers().remove(child);

      group.on('removelayer', (event) => {
        done(new Error('unexpected removelayer after group removal'));
      });

      child.getLayers().remove(layer);

      setTimeout(done, 10);
    });
  });

  describe('#getLayerState', function () {
    let group;

    beforeEach(function () {
      group = new LayerGroup();
    });

    afterEach(function () {
      disposeHierarchy(group);
    });

    it('returns a layerState from the properties values', function () {
      group.setOpacity(0.3);
      group.setVisible(false);
      group.setZIndex(10);
      const groupExtent = [-100, 50, 100, 50];
      group.setExtent(groupExtent);
      group.setMaxResolution(500);
      group.setMinResolution(0.25);
      group.setMinZoom(5);
      group.setMaxZoom(10);
      expect(group.getLayerState()).to.eql({
        layer: group,
        opacity: 0.3,
        visible: false,
        managed: true,
        extent: groupExtent,
        zIndex: 10,
        maxResolution: 500,
        minResolution: 0.25,
        minZoom: 5,
        maxZoom: 10,
      });
    });

    it('returns a layerState with clamped values', function () {
      group.setOpacity(-1.5);
      group.setVisible(false);
      expect(group.getLayerState()).to.eql({
        layer: group,
        opacity: 0,
        visible: false,
        managed: true,
        extent: undefined,
        zIndex: undefined,
        maxResolution: Infinity,
        minResolution: 0,
        minZoom: -Infinity,
        maxZoom: Infinity,
      });

      group.setOpacity(3);
      group.setVisible(true);
      expect(group.getLayerState()).to.eql({
        layer: group,
        opacity: 1,
        visible: true,
        managed: true,
        extent: undefined,
        zIndex: undefined,
        maxResolution: Infinity,
        minResolution: 0,
        minZoom: -Infinity,
        maxZoom: Infinity,
      });
    });
  });

  describe('layers events', function () {
    it('listen / unlisten for layers added to the collection', function () {
      const layers = new Collection();
      const group = new LayerGroup({
        layers: layers,
      });
      expect(Object.keys(group.listenerKeys_).length).to.eql(0);
      const layer = new Layer({});
      layers.push(layer);
      expect(Object.keys(group.listenerKeys_).length).to.eql(1);

      const listeners = group.listenerKeys_[getUid(layer)];
      expect(listeners.length).to.eql(2);
      expect(typeof listeners[0]).to.be('object');
      expect(typeof listeners[1]).to.be('object');

      // remove the layer from the group
      layers.pop();
      expect(Object.keys(group.listenerKeys_).length).to.eql(0);
      expect(listeners[0].listener).to.be(undefined);
      expect(listeners[1].listener).to.be(undefined);
    });
  });

  describe('#setLayers', function () {
    it('sets layers property', function () {
      const layer = new Layer({
        source: new Source({
          projection: 'EPSG:4326',
        }),
      });
      const layers = new Collection([layer]);
      const group = new LayerGroup();

      group.setLayers(layers);
      expect(group.getLayers()).to.be(layers);

      disposeHierarchy(group);
    });
  });

  describe('#getLayerStatesArray', function () {
    let layer1, layer2, layer3;
    beforeEach(function () {
      layer1 = new Layer({
        source: new Source({
          projection: 'EPSG:4326',
        }),
      });
      layer2 = new Layer({
        source: new Source({
          projection: 'EPSG:4326',
        }),
        opacity: 0.5,
        visible: false,
        maxResolution: 500,
        minResolution: 0.25,
      });
      layer3 = new Layer({
        source: new Source({
          projection: 'EPSG:4326',
        }),
        extent: [-5, -2, 5, 2],
      });
    });

    afterEach(function () {
      layer1.dispose();
      layer2.dispose();
      layer3.dispose();
    });

    it('returns an empty array if no layer', function () {
      const group = new LayerGroup();

      const layerStatesArray = group.getLayerStatesArray();
      expect(layerStatesArray).to.be.a(Array);
      expect(layerStatesArray.length).to.be(0);

      group.dispose();
    });

    it('does not transform layerStates by default', function () {
      const group = new LayerGroup({
        layers: [layer1, layer2],
      });

      const layerStatesArray = group.getLayerStatesArray();
      expect(layerStatesArray).to.be.a(Array);
      expect(layerStatesArray.length).to.be(2);
      expect(layerStatesArray[0]).to.eql(layer1.getLayerState());

      // layer state should match except for layer reference
      const layerState = Object.assign({}, layerStatesArray[0]);
      delete layerState.layer;
      const groupState = Object.assign({}, group.getLayerState());
      delete groupState.layer;
      expect(layerState).to.eql(groupState);

      expect(layerStatesArray[1]).to.eql(layer2.getLayerState());

      group.dispose();
    });

    it('uses the layer group extent if layer has no extent', function () {
      const groupExtent = [-10, -5, 10, 5];
      const group = new LayerGroup({
        extent: groupExtent,
        layers: [layer1],
      });
      const layerStatesArray = group.getLayerStatesArray();
      expect(layerStatesArray[0].extent).to.eql(groupExtent);
      group.dispose();
    });

    it('uses the intersection of group and child extent', function () {
      const groupExtent = [-10, -5, 10, 5];
      const group = new LayerGroup({
        extent: groupExtent,
        layers: [layer3],
      });
      const layerStatesArray = group.getLayerStatesArray();
      expect(layerStatesArray[0].extent).to.eql(
        getIntersection(layer3.getExtent(), groupExtent)
      );
      group.dispose();
    });

    it('transforms layerStates correctly', function () {
      const group = new LayerGroup({
        layers: [layer1, layer2],
        opacity: 0.5,
        visible: false,
        maxResolution: 150,
        minResolution: 0.2,
      });

      const layerStatesArray = group.getLayerStatesArray([]);

      // compare layer state to group state

      // layer state should match except for layer reference
      let layerState = Object.assign({}, layerStatesArray[0]);
      delete layerState.layer;
      const groupState = Object.assign({}, group.getLayerState());
      delete groupState.layer;
      expect(layerState).to.eql(groupState);

      // layer state should be transformed (and we ignore layer reference)
      layerState = Object.assign({}, layerStatesArray[1]);
      delete layerState.layer;
      expect(layerState).to.eql({
        opacity: 0.25,
        visible: false,
        managed: true,
        extent: undefined,
        zIndex: undefined,
        maxResolution: 150,
        minResolution: 0.25,
        minZoom: -Infinity,
        maxZoom: Infinity,
      });

      group.dispose();
    });

    it('returns max minZoom', function () {
      const group = new LayerGroup({
        minZoom: 5,
        layers: [
          new Layer({
            source: new Source({
              projection: 'EPSG:4326',
            }),
          }),
          new Layer({
            source: new Source({
              projection: 'EPSG:4326',
            }),
            minZoom: 10,
          }),
        ],
      });

      expect(group.getLayerStatesArray()[0].minZoom).to.be(5);
      expect(group.getLayerStatesArray()[1].minZoom).to.be(10);

      disposeHierarchy(group);
    });

    it('returns min maxZoom of layers', function () {
      const group = new LayerGroup({
        maxZoom: 5,
        layers: [
          new Layer({
            source: new Source({
              projection: 'EPSG:4326',
            }),
          }),
          new Layer({
            source: new Source({
              projection: 'EPSG:4326',
            }),
            maxZoom: 2,
          }),
        ],
      });

      expect(group.getLayerStatesArray()[0].maxZoom).to.be(5);
      expect(group.getLayerStatesArray()[1].maxZoom).to.be(2);

      disposeHierarchy(group);
    });

    it('uses the layer group zIndex if layer has no zIndex', function () {
      const layerM1 = new Layer({
        zIndex: -1,
        source: new Source({}),
      });
      const layerUndefined = new Layer({
        source: new Source({}),
      });
      const layer0 = new Layer({
        zIndex: 0,
        source: new Source({}),
      });
      const group = new LayerGroup({
        zIndex: 2,
        layers: [layerM1, layerUndefined, layer0],
      });

      const layerStatesArray = group.getLayerStatesArray();
      expect(layerStatesArray[0].zIndex).to.be(-1);
      expect(layerStatesArray[1].zIndex).to.be(2);
      expect(layerStatesArray[2].zIndex).to.be(0);

      disposeHierarchy(group);
    });

    it('uses the deepest nested group with zIndex as default', function () {
      const group = new LayerGroup({
        zIndex: 1,
        layers: [
          new LayerGroup({
            zIndex: 5,
            layers: [
              new Layer({
                source: new Source({}),
              }),
            ],
          }),
        ],
      });

      const layerStatesArray = group.getLayerStatesArray();
      expect(layerStatesArray[0].zIndex).to.be(5);

      disposeHierarchy(group);
    });

    it('uses zIndex of closest parent group where it is not undefined', function () {
      const group = new LayerGroup({
        zIndex: 1,
        layers: [
          new LayerGroup({
            layers: [
              new Layer({
                source: new Source({}),
              }),
            ],
          }),
        ],
      });

      const layerStatesArray = group.getLayerStatesArray();
      expect(layerStatesArray[0].zIndex).to.be(1);

      disposeHierarchy(group);
    });
  });
});
