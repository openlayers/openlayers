import {assert} from 'chai';
import Collection from '../../../../../src/ol/Collection.js';
import {getIntersection} from '../../../../../src/ol/extent.js';
import LayerGroup from '../../../../../src/ol/layer/Group.js';
import Layer from '../../../../../src/ol/layer/Layer.js';
import Source from '../../../../../src/ol/source/Source.js';
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
      assert.instanceOf(group, LayerGroup);
    });

    it('provides default opacity', function () {
      assert.strictEqual(group.getOpacity(), 1);
    });

    it('provides default visibility', function () {
      assert.strictEqual(group.getVisible(), true);
    });

    it('provides default layerState', function () {
      assert.deepEqual(group.getLayerState(), {
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
      assert.instanceOf(group.getLayers(), Collection);
      assert.strictEqual(group.getLayers().getLength(), 0);
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
      listener = vi.fn();
    });

    afterEach(function () {
      disposeHierarchy(group);
    });

    it('is dispatched by the group when layer opacity changes', function () {
      group.on('change', listener);

      layer.setOpacity(0.5);
      assert.strictEqual(listener.mock.calls.length, 1);
    });

    it('is dispatched by the group when layer visibility changes', function () {
      group.on('change', listener);

      layer.setVisible(false);
      assert.strictEqual(listener.mock.calls.length, 1);

      layer.setVisible(true);
      assert.strictEqual(listener.mock.calls.length, 2);
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
      listener = vi.fn();
    });

    afterEach(function () {
      disposeHierarchy(group);
    });

    it('is dispatched by the group when group opacity changes', function () {
      group.on('propertychange', listener);

      group.setOpacity(0.5);
      assert.strictEqual(listener.mock.calls.length, 1);
    });

    it('is dispatched by the group when group visibility changes', function () {
      group.on('propertychange', listener);

      group.setVisible(false);
      assert.strictEqual(listener.mock.calls.length, 1);

      group.setVisible(true);
      assert.strictEqual(listener.mock.calls.length, 2);
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

      assert.strictEqual(group.getOpacity(), 0.5);
      assert.strictEqual(group.getVisible(), false);
      assert.strictEqual(group.getMaxResolution(), 500);
      assert.strictEqual(group.getMinResolution(), 0.25);
      assert.strictEqual(group.getMinZoom(), 1);
      assert.strictEqual(group.getMaxZoom(), 10);
      assert.deepEqual(group.getLayerState(), {
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
      assert.instanceOf(group.getLayers(), Collection);
      assert.strictEqual(group.getLayers().getLength(), 1);
      assert.strictEqual(group.getLayers().item(0), layer);

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

      assert.strictEqual(group.getOpacity(), 0.5);
      assert.strictEqual(group.getVisible(), false);
      assert.deepEqual(group.getExtent(), groupExtent);
      assert.strictEqual(group.getMaxResolution(), 500);
      assert.strictEqual(group.getMinResolution(), 0.25);
      assert.deepEqual(group.getLayerState(), {
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
      assert.instanceOf(group.getLayers(), Collection);
      assert.strictEqual(group.getLayers().getLength(), 1);
      assert.strictEqual(group.getLayers().item(0), layer);

      disposeHierarchy(group);
    });
  });

  describe('addlayer event', () => {
    it('is dispatched when a layer is added', () => {
      return new Promise((resolve) => {
        const group = new LayerGroup();
        const layer = new Layer({});
        group.on('addlayer', (event) => {
          assert.strictEqual(event.layer, layer);
          resolve();
        });

        group.getLayers().push(layer);
      });
    });

    it('is dispatched once for each layer added', () => {
      return new Promise((resolve) => {
        const group = new LayerGroup();
        const layers = [new Layer({}), new Layer({}), new Layer({})];

        let count = 0;
        group.on('addlayer', (event) => {
          assert.strictEqual(event.layer, layers[count]);
          count++;
          if (count === layers.length) {
            resolve();
          }
        });

        group.getLayers().extend(layers);
      });
    });

    it('is dispatched when setLayers is called', () => {
      return new Promise((resolve) => {
        const group = new LayerGroup();

        const layers = [new Layer({}), new Layer({}), new Layer({})];

        let count = 0;
        group.on('addlayer', (event) => {
          assert.strictEqual(event.layer, layers[count]);
          count++;
          if (count === layers.length) {
            resolve();
          }
        });

        group.setLayers(new Collection(layers));
      });
    });

    it('is dispatched when a layer group is added', () => {
      return new Promise((resolve) => {
        const group = new LayerGroup();
        const layer = new LayerGroup();
        group.on('addlayer', (event) => {
          assert.strictEqual(event.layer, layer);
          resolve();
        });

        group.getLayers().push(layer);
      });
    });

    it('is dispatched for each layer added to a child group', () => {
      return new Promise((resolve) => {
        const group = new LayerGroup();
        const child = new LayerGroup();
        group.getLayers().push(child);

        const layer = new Layer({});
        group.on('addlayer', (event) => {
          assert.strictEqual(event.layer, layer);
          resolve();
        });

        child.getLayers().push(layer);
      });
    });

    it('is dispatched for each layer added to a child group configured at construction', () => {
      return new Promise((resolve) => {
        const child = new LayerGroup();
        const group = new LayerGroup({
          layers: [child],
        });

        const layer = new Layer({});
        group.on('addlayer', (event) => {
          assert.strictEqual(event.layer, layer);
          resolve();
        });

        child.getLayers().push(layer);
      });
    });

    it('is not dispatched for layers added to a child group after the child group is removed', () => {
      return new Promise((resolve, reject) => {
        const child = new LayerGroup();
        const group = new LayerGroup({
          layers: [child],
        });

        const layer = new Layer({});
        group.on('addlayer', () => {
          reject(new Error('unexpected addlayer after group removal'));
        });

        group.getLayers().remove(child);
        child.getLayers().push(layer);

        setTimeout(resolve, 10);
      });
    });
  });

  describe('removelayer event', () => {
    it('is dispatched when a layer is removed', () => {
      return new Promise((resolve) => {
        const layer = new Layer({});
        const group = new LayerGroup({layers: [layer]});
        group.on('removelayer', (event) => {
          assert.strictEqual(event.layer, layer);
          resolve();
        });

        group.getLayers().remove(layer);
      });
    });

    it('is dispatched when a setLayers is called', () => {
      return new Promise((resolve) => {
        const layer = new Layer({});
        const group = new LayerGroup({layers: [layer]});
        group.on('removelayer', (event) => {
          assert.strictEqual(event.layer, layer);
          resolve();
        });

        group.setLayers(new Collection());
      });
    });

    it('is dispatched when a layer is removed from a child group', () => {
      return new Promise((resolve) => {
        const layer = new Layer({});
        const child = new LayerGroup({layers: [layer]});
        const group = new LayerGroup({layers: [child]});
        group.on('removelayer', (event) => {
          assert.strictEqual(event.layer, layer);
          resolve();
        });

        child.getLayers().remove(layer);
      });
    });

    it('is not dispatched when a layer is removed from a child group after child group removal', () => {
      return new Promise((resolve, reject) => {
        const layer = new Layer({});
        const child = new LayerGroup({layers: [layer]});
        const group = new LayerGroup({layers: [child]});
        group.getLayers().remove(child);

        group.on('removelayer', () => {
          reject(new Error('unexpected removelayer after group removal'));
        });

        child.getLayers().remove(layer);

        setTimeout(resolve, 10);
      });
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
      assert.deepEqual(group.getLayerState(), {
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
      assert.deepEqual(group.getLayerState(), {
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
      assert.deepEqual(group.getLayerState(), {
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
      assert.deepEqual(Object.keys(group.listenerKeys_).length, 0);
      const layer = new Layer({});
      layers.push(layer);
      assert.deepEqual(Object.keys(group.listenerKeys_).length, 1);

      const listeners = group.listenerKeys_[getUid(layer)];
      assert.deepEqual(listeners.length, 2);
      assert.strictEqual(typeof listeners[0], 'object');
      assert.strictEqual(typeof listeners[1], 'object');

      // remove the layer from the group
      layers.pop();
      assert.deepEqual(Object.keys(group.listenerKeys_).length, 0);
      assert.strictEqual(listeners[0].listener, undefined);
      assert.strictEqual(listeners[1].listener, undefined);
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
      assert.strictEqual(group.getLayers(), layers);

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
      assert.instanceOf(layerStatesArray, Array);
      assert.strictEqual(layerStatesArray.length, 0);

      group.dispose();
    });

    it('does not transform layerStates by default', function () {
      const group = new LayerGroup({
        layers: [layer1, layer2],
      });

      const layerStatesArray = group.getLayerStatesArray();
      assert.instanceOf(layerStatesArray, Array);
      assert.strictEqual(layerStatesArray.length, 2);
      assert.deepEqual(layerStatesArray[0], layer1.getLayerState());

      // layer state should match except for layer reference
      const layerState = Object.assign({}, layerStatesArray[0]);
      delete layerState.layer;
      const groupState = Object.assign({}, group.getLayerState());
      delete groupState.layer;
      assert.deepEqual(layerState, groupState);

      assert.deepEqual(layerStatesArray[1], layer2.getLayerState());

      group.dispose();
    });

    it('uses the layer group extent if layer has no extent', function () {
      const groupExtent = [-10, -5, 10, 5];
      const group = new LayerGroup({
        extent: groupExtent,
        layers: [layer1],
      });
      const layerStatesArray = group.getLayerStatesArray();
      assert.deepEqual(layerStatesArray[0].extent, groupExtent);
      group.dispose();
    });

    it('uses the intersection of group and child extent', function () {
      const groupExtent = [-10, -5, 10, 5];
      const group = new LayerGroup({
        extent: groupExtent,
        layers: [layer3],
      });
      const layerStatesArray = group.getLayerStatesArray();
      assert.deepEqual(
        layerStatesArray[0].extent,
        getIntersection(layer3.getExtent(), groupExtent),
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
      assert.deepEqual(layerState, groupState);

      // layer state should be transformed (and we ignore layer reference)
      layerState = Object.assign({}, layerStatesArray[1]);
      delete layerState.layer;
      assert.deepEqual(layerState, {
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

      assert.strictEqual(group.getLayerStatesArray()[0].minZoom, 5);
      assert.strictEqual(group.getLayerStatesArray()[1].minZoom, 10);

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

      assert.strictEqual(group.getLayerStatesArray()[0].maxZoom, 5);
      assert.strictEqual(group.getLayerStatesArray()[1].maxZoom, 2);

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
      assert.strictEqual(layerStatesArray[0].zIndex, -1);
      assert.strictEqual(layerStatesArray[1].zIndex, 2);
      assert.strictEqual(layerStatesArray[2].zIndex, 0);

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
      assert.strictEqual(layerStatesArray[0].zIndex, 5);

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
      assert.strictEqual(layerStatesArray[0].zIndex, 1);

      disposeHierarchy(group);
    });
  });
});
