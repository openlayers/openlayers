import {getUid} from '../../../../src/ol/util.js';
import Collection from '../../../../src/ol/Collection.js';
import {getIntersection} from '../../../../src/ol/extent.js';
import LayerGroup from '../../../../src/ol/layer/Group.js';
import Layer from '../../../../src/ol/layer/Layer.js';
import {assign} from '../../../../src/ol/obj.js';
import Source from '../../../../src/ol/source/Source.js';


describe('ol.layer.Group', () => {

  describe('constructor (defaults)', () => {

    let layerGroup;

    beforeEach(() => {
      layerGroup = new LayerGroup();
    });

    afterEach(() => {
      layerGroup.dispose();
    });

    test('creates an instance', () => {
      expect(layerGroup).toBeInstanceOf(LayerGroup);
    });

    test('provides default opacity', () => {
      expect(layerGroup.getOpacity()).toBe(1);
    });

    test('provides default visibility', () => {
      expect(layerGroup.getVisible()).toBe(true);
    });

    test('provides default layerState', () => {
      expect(layerGroup.getLayerState()).toEqual({
        layer: layerGroup,
        opacity: 1,
        visible: true,
        managed: true,
        hasOverlay: false,
        sourceState: 'ready',
        extent: undefined,
        zIndex: 0,
        maxResolution: Infinity,
        minResolution: 0,
        minZoom: -Infinity,
        maxZoom: Infinity
      });
    });

    test('provides default empty layers collection', () => {
      expect(layerGroup.getLayers()).toBeInstanceOf(Collection);
      expect(layerGroup.getLayers().getLength()).toBe(0);
    });

  });

  describe('generic change event', () => {

    let layer, group, listener;
    beforeEach(() => {
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

    afterEach(() => {
      group.dispose();
      layer.dispose();
    });

    test('is dispatched by the group when layer opacity changes', () => {
      group.on('change', listener);

      layer.setOpacity(0.5);
      expect(listener.calledOnce).toBe(true);
    });

    test('is dispatched by the group when layer visibility changes', () => {
      group.on('change', listener);

      layer.setVisible(false);
      expect(listener.callCount).toBe(1);

      layer.setVisible(true);
      expect(listener.callCount).toBe(2);
    });

  });

  describe('property change event', () => {

    let layer, group, listener;
    beforeEach(() => {
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

    afterEach(() => {
      group.dispose();
      layer.dispose();
    });

    test('is dispatched by the group when group opacity changes', () => {
      group.on('propertychange', listener);

      group.setOpacity(0.5);
      expect(listener.calledOnce).toBe(true);
    });

    test('is dispatched by the group when group visibility changes', () => {
      group.on('propertychange', listener);

      group.setVisible(false);
      expect(listener.callCount).toBe(1);

      group.setVisible(true);
      expect(listener.callCount).toBe(2);
    });

  });

  describe('constructor (options)', () => {

    test('accepts options', () => {
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
        minResolution: 0.25,
        minZoom: 1,
        maxZoom: 10
      });

      expect(layerGroup.getOpacity()).toBe(0.5);
      expect(layerGroup.getVisible()).toBe(false);
      expect(layerGroup.getMaxResolution()).toBe(500);
      expect(layerGroup.getMinResolution()).toBe(0.25);
      expect(layerGroup.getMinZoom()).toBe(1);
      expect(layerGroup.getMaxZoom()).toBe(10);
      expect(layerGroup.getLayerState()).toEqual({
        layer: layerGroup,
        opacity: 0.5,
        visible: false,
        managed: true,
        hasOverlay: false,
        sourceState: 'ready',
        extent: undefined,
        zIndex: 10,
        maxResolution: 500,
        minResolution: 0.25,
        minZoom: 1,
        maxZoom: 10
      });
      expect(layerGroup.getLayers()).toBeInstanceOf(Collection);
      expect(layerGroup.getLayers().getLength()).toBe(1);
      expect(layerGroup.getLayers().item(0)).toBe(layer);

      layer.dispose();
      layerGroup.dispose();
    });

    test('accepts an extent option', () => {
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

      expect(layerGroup.getOpacity()).toBe(0.5);
      expect(layerGroup.getVisible()).toBe(false);
      expect(layerGroup.getExtent()).toEqual(groupExtent);
      expect(layerGroup.getMaxResolution()).toBe(500);
      expect(layerGroup.getMinResolution()).toBe(0.25);
      expect(layerGroup.getLayerState()).toEqual({
        layer: layerGroup,
        opacity: 0.5,
        visible: false,
        managed: true,
        hasOverlay: false,
        sourceState: 'ready',
        extent: groupExtent,
        zIndex: 0,
        maxResolution: 500,
        minResolution: 0.25,
        minZoom: -Infinity,
        maxZoom: Infinity
      });
      expect(layerGroup.getLayers()).toBeInstanceOf(Collection);
      expect(layerGroup.getLayers().getLength()).toBe(1);
      expect(layerGroup.getLayers().item(0)).toBe(layer);

      layer.dispose();
      layerGroup.dispose();
    });
  });

  describe('#getLayerState', () => {

    let layerGroup;

    beforeEach(() => {
      layerGroup = new LayerGroup();
    });

    afterEach(() => {
      layerGroup.dispose();
    });

    test('returns a layerState from the properties values', () => {
      layerGroup.setOpacity(0.3);
      layerGroup.setVisible(false);
      layerGroup.setZIndex(10);
      const groupExtent = [-100, 50, 100, 50];
      layerGroup.setExtent(groupExtent);
      layerGroup.setMaxResolution(500);
      layerGroup.setMinResolution(0.25);
      layerGroup.setMinZoom(5);
      layerGroup.setMaxZoom(10);
      expect(layerGroup.getLayerState()).toEqual({
        layer: layerGroup,
        opacity: 0.3,
        visible: false,
        managed: true,
        hasOverlay: false,
        sourceState: 'ready',
        extent: groupExtent,
        zIndex: 10,
        maxResolution: 500,
        minResolution: 0.25,
        minZoom: 5,
        maxZoom: 10
      });
    });

    test('returns a layerState with clamped values', () => {
      layerGroup.setOpacity(-1.5);
      layerGroup.setVisible(false);
      expect(layerGroup.getLayerState()).toEqual({
        layer: layerGroup,
        opacity: 0,
        visible: false,
        managed: true,
        hasOverlay: false,
        sourceState: 'ready',
        extent: undefined,
        zIndex: 0,
        maxResolution: Infinity,
        minResolution: 0,
        minZoom: -Infinity,
        maxZoom: Infinity
      });

      layerGroup.setOpacity(3);
      layerGroup.setVisible(true);
      expect(layerGroup.getLayerState()).toEqual({
        layer: layerGroup,
        opacity: 1,
        visible: true,
        managed: true,
        hasOverlay: false,
        sourceState: 'ready',
        extent: undefined,
        zIndex: 0,
        maxResolution: Infinity,
        minResolution: 0,
        minZoom: -Infinity,
        maxZoom: Infinity
      });
    });

  });

  describe('layers events', () => {

    test('listen / unlisten for layers added to the collection', () => {
      const layers = new Collection();
      const layerGroup = new LayerGroup({
        layers: layers
      });
      expect(Object.keys(layerGroup.listenerKeys_).length).toEqual(0);
      const layer = new Layer({});
      layers.push(layer);
      expect(Object.keys(layerGroup.listenerKeys_).length).toEqual(1);

      const listeners = layerGroup.listenerKeys_[getUid(layer)];
      expect(listeners.length).toEqual(2);
      expect(typeof listeners[0]).toBe('object');
      expect(typeof listeners[1]).toBe('object');

      // remove the layer from the group
      layers.pop();
      expect(Object.keys(layerGroup.listenerKeys_).length).toEqual(0);
      expect(listeners[0].listener).toBe(undefined);
      expect(listeners[1].listener).toBe(undefined);
    });

  });

  describe('#setLayers', () => {

    test('sets layers property', () => {
      const layer = new Layer({
        source: new Source({
          projection: 'EPSG:4326'
        })
      });
      const layers = new Collection([layer]);
      const layerGroup = new LayerGroup();

      layerGroup.setLayers(layers);
      expect(layerGroup.getLayers()).toBe(layers);

      layerGroup.dispose();
      layer.dispose();
      layers.dispose();
    });

  });


  describe('#getLayerStatesArray', () => {

    let layer1, layer2, layer3;
    beforeEach(() => {
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

    afterEach(() => {
      layer1.dispose();
      layer2.dispose();
      layer3.dispose();
    });

    test('returns an empty array if no layer', () => {
      const layerGroup = new LayerGroup();

      const layerStatesArray = layerGroup.getLayerStatesArray();
      expect(layerStatesArray).toBeInstanceOf(Array);
      expect(layerStatesArray.length).toBe(0);

      layerGroup.dispose();
    });

    test('does not transform layerStates by default', () => {
      const layerGroup = new LayerGroup({
        layers: [layer1, layer2]
      });

      const layerStatesArray = layerGroup.getLayerStatesArray();
      expect(layerStatesArray).toBeInstanceOf(Array);
      expect(layerStatesArray.length).toBe(2);
      expect(layerStatesArray[0]).toEqual(layer1.getLayerState());

      // layer state should match except for layer reference
      const layerState = assign({}, layerStatesArray[0]);
      delete layerState.layer;
      const groupState = assign({}, layerGroup.getLayerState());
      delete groupState.layer;
      expect(layerState).toEqual(groupState);

      expect(layerStatesArray[1]).toEqual(layer2.getLayerState());

      layerGroup.dispose();
    });

    test('uses the layer group extent if layer has no extent', () => {
      const groupExtent = [-10, -5, 10, 5];
      const layerGroup = new LayerGroup({
        extent: groupExtent,
        layers: [layer1]
      });
      const layerStatesArray = layerGroup.getLayerStatesArray();
      expect(layerStatesArray[0].extent).toEqual(groupExtent);
      layerGroup.dispose();
    });

    test('uses the intersection of group and child extent', () => {
      const groupExtent = [-10, -5, 10, 5];
      const layerGroup = new LayerGroup({
        extent: groupExtent,
        layers: [layer3]
      });
      const layerStatesArray = layerGroup.getLayerStatesArray();
      expect(layerStatesArray[0].extent).toEqual(getIntersection(layer3.getExtent(), groupExtent));
      layerGroup.dispose();
    });

    test('transforms layerStates correctly', () => {
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
      expect(layerState).toEqual(groupState);

      // layer state should be transformed (and we ignore layer reference)
      layerState = assign({}, layerStatesArray[1]);
      delete layerState.layer;
      expect(layerState).toEqual({
        opacity: 0.25,
        visible: false,
        managed: true,
        hasOverlay: false,
        sourceState: 'ready',
        extent: undefined,
        zIndex: 0,
        maxResolution: 150,
        minResolution: 0.25,
        minZoom: -Infinity,
        maxZoom: Infinity
      });

      layerGroup.dispose();
    });

    test('returns max minZoom', () => {
      const group = new LayerGroup({
        minZoom: 5,
        layers: [
          new Layer({
            source: new Source({
              projection: 'EPSG:4326'
            })
          }),
          new Layer({
            source: new Source({
              projection: 'EPSG:4326'
            }),
            minZoom: 10
          })
        ]
      });

      expect(group.getLayerStatesArray()[0].minZoom).toBe(5);
      expect(group.getLayerStatesArray()[1].minZoom).toBe(10);
    });

    test('returns min maxZoom of layers', () => {
      const group = new LayerGroup({
        maxZoom: 5,
        layers: [
          new Layer({
            source: new Source({
              projection: 'EPSG:4326'
            })
          }),
          new Layer({
            source: new Source({
              projection: 'EPSG:4326'
            }),
            maxZoom: 2
          })
        ]
      });

      expect(group.getLayerStatesArray()[0].maxZoom).toBe(5);
      expect(group.getLayerStatesArray()[1].maxZoom).toBe(2);
    });

  });

});
