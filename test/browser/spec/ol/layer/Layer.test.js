import {assert} from 'chai';
import {spy as sinonSpy} from 'sinon';
import Map from '../../../../../src/ol/Map.js';
import View from '../../../../../src/ol/View.js';
import Group from '../../../../../src/ol/layer/Group.js';
import Layer, {inView} from '../../../../../src/ol/layer/Layer.js';
import Property from '../../../../../src/ol/layer/Property.js';
import TileLayer from '../../../../../src/ol/layer/Tile.js';
import {get as getProjection} from '../../../../../src/ol/proj.js';
import RenderEvent from '../../../../../src/ol/render/Event.js';
import Source from '../../../../../src/ol/source/Source.js';
import XYZ from '../../../../../src/ol/source/XYZ.js';

describe('ol/layer/Layer', function () {
  describe('constructor (defaults)', function () {
    let layer;

    beforeEach(function () {
      layer = new Layer({
        source: new Source({
          projection: getProjection('EPSG:4326'),
        }),
      });
    });

    afterEach(function () {
      layer.dispose();
    });

    it('creates an instance', function () {
      assert.instanceOf(layer, Layer);
    });

    it('provides default opacity', function () {
      assert.strictEqual(layer.getOpacity(), 1);
    });

    it('provides default visibility', function () {
      assert.strictEqual(layer.getVisible(), true);
    });

    it('provides default max resolution', function () {
      assert.strictEqual(layer.getMaxResolution(), Infinity);
    });

    it('provides default min resolution', function () {
      assert.strictEqual(layer.getMinResolution(), 0);
    });

    it('provides default min zoom', function () {
      assert.strictEqual(layer.getMinZoom(), -Infinity);
    });

    it('provides default max zoom', function () {
      assert.strictEqual(layer.getMaxZoom(), Infinity);
    });

    it('provides default layerState', function () {
      assert.deepEqual(layer.getLayerState(), {
        layer: layer,
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

  describe('constructor (options)', function () {
    it('accepts options', function () {
      const layer = new Layer({
        source: new Source({
          projection: getProjection('EPSG:4326'),
        }),
        opacity: 0.5,
        visible: false,
        zIndex: 10,
        maxResolution: 500,
        minResolution: 0.25,
        minZoom: 1,
        maxZoom: 10,
        foo: 42,
      });

      assert.strictEqual(layer.getOpacity(), 0.5);
      assert.strictEqual(layer.getVisible(), false);
      assert.strictEqual(layer.getMaxResolution(), 500);
      assert.strictEqual(layer.getMinResolution(), 0.25);
      assert.strictEqual(layer.getMinZoom(), 1);
      assert.strictEqual(layer.getMaxZoom(), 10);
      assert.strictEqual(layer.get('foo'), 42);
      assert.deepEqual(layer.getLayerState(), {
        layer: layer,
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

      layer.dispose();
    });

    it('assigns key-value pairs of `properties` to the object', function () {
      const o = new Layer({
        properties: {
          foo: 'bar',
        },
      });
      assert.strictEqual(o.get('foo'), 'bar');
      assert.strictEqual(o.get('properties'), undefined);
    });

    it('can have a `properties` property', function () {
      const o = new Layer({
        properties: {
          properties: {foo: 'bar'},
        },
      });
      assert.deepEqual(o.get('properties'), {foo: 'bar'});
    });

    it('throws on non-numeric opacity', function () {
      function create() {
        new Layer({
          source: new Source({
            projection: 'EPSG:4326',
          }),
          opacity: 'foo',
        });
      }

      assert.throws(create);
    });

    it('accepts a custom render function', function () {
      let called = false;
      const layer = new Layer({
        render: function () {
          called = true;
        },
      });
      layer.render();
      assert.deepEqual(called, true);
    });
  });

  describe('inView', function () {
    let layer;

    beforeEach(function () {
      layer = new Layer({
        source: new Source({
          projection: getProjection('EPSG:4326'),
        }),
      });
    });

    afterEach(function () {
      layer.dispose();
    });

    const cases = [
      {
        when: 'layer is not visible',
        visible: false,
        view: {
          resolution: 4,
          zoom: 4,
        },
        inView: false,
      },
      {
        when: 'layer is not visible (with min/max zoom and resolution)',
        visible: false,
        minZoom: 2,
        maxZoom: 6,
        minResolution: 2,
        maxResolution: 6,
        view: {
          resolution: 4,
          zoom: 4,
        },
        inView: false,
      },
      {
        when: 'view zoom is less than minZoom',
        minZoom: 2,
        view: {
          resolution: 1,
          zoom: 1,
        },
        inView: false,
      },
      {
        when: 'view zoom is less than minZoom (with maxZoom)',
        minZoom: 2,
        maxZoom: 4,
        view: {
          resolution: 1,
          zoom: 1,
        },
        inView: false,
      },
      {
        when: 'view zoom is equal to minZoom',
        minZoom: 2,
        view: {
          resolution: 2,
          zoom: 2,
        },
        inView: false,
      },
      {
        when: 'view zoom is equal to minZoom (with maxZoom)',
        minZoom: 2,
        maxZoom: 4,
        view: {
          resolution: 2,
          zoom: 2,
        },
        inView: false,
      },
      {
        when: 'view zoom is greater than minZoom',
        minZoom: 2,
        view: {
          resolution: 3,
          zoom: 3,
        },
        inView: true,
      },
      {
        when: 'view zoom is greater than minZoom (with maxZoom)',
        minZoom: 2,
        maxZoom: 4,
        view: {
          resolution: 3,
          zoom: 3,
        },
        inView: true,
      },
      {
        when: 'view zoom is equal to maxZoom',
        maxZoom: 4,
        view: {
          resolution: 4,
          zoom: 4,
        },
        inView: true,
      },
      {
        when: 'view zoom is equal to maxZoom (with minZoom)',
        minZoom: 2,
        maxZoom: 4,
        view: {
          resolution: 4,
          zoom: 4,
        },
        inView: true,
      },
      {
        when: 'view zoom is greater than maxZoom',
        maxZoom: 4,
        view: {
          resolution: 5,
          zoom: 5,
        },
        inView: false,
      },
      {
        when: 'view zoom is greater than maxZoom (with minZoom)',
        minZoom: 2,
        maxZoom: 4,
        view: {
          resolution: 5,
          zoom: 5,
        },
        inView: false,
      },
      {
        when: 'view resolution is less than minResolution',
        minResolution: 2,
        view: {
          resolution: 1,
          zoom: 1,
        },
        inView: false,
      },
      {
        when: 'view resolution is less than minResolution (with maxResolution)',
        minResolution: 2,
        maxResolution: 4,
        view: {
          resolution: 1,
          zoom: 1,
        },
        inView: false,
      },
      {
        when: 'view resolution is equal to minResolution',
        minResolution: 2,
        view: {
          resolution: 2,
          zoom: 2,
        },
        inView: true,
      },
      {
        when: 'view resolution is equal to minResolution (with maxResolution)',
        minResolution: 2,
        maxResolution: 4,
        view: {
          resolution: 2,
          zoom: 2,
        },
        inView: true,
      },
      {
        when: 'view resolution is greater than minResolution',
        minResolution: 2,
        view: {
          resolution: 3,
          zoom: 3,
        },
        inView: true,
      },
      {
        when: 'view resolution is greater than minResolution (with maxResolution)',
        minResolution: 2,
        maxResolution: 4,
        view: {
          resolution: 3,
          zoom: 3,
        },
        inView: true,
      },
      {
        when: 'view resolution is equal to maxResolution',
        maxResolution: 4,
        view: {
          resolution: 4,
          zoom: 4,
        },
        inView: false,
      },
      {
        when: 'view resolution is equal to maxResolution (with minResolution)',
        minResolution: 2,
        maxResolution: 4,
        view: {
          resolution: 4,
          zoom: 4,
        },
        inView: false,
      },
      {
        when: 'view resolution is greater than maxResolution',
        maxResolution: 4,
        view: {
          resolution: 5,
          zoom: 5,
        },
        inView: false,
      },
      {
        when: 'view resolution is greater than maxResolution (with minResolution)',
        minResolution: 2,
        maxResolution: 4,
        view: {
          resolution: 5,
          zoom: 5,
        },
        inView: false,
      },
    ];

    cases.forEach(function (c, i) {
      it('returns ' + c.inView + ' when ' + c.when, function () {
        if ('visible' in c) {
          layer.setVisible(c.visible);
        }
        if ('minZoom' in c) {
          layer.setMinZoom(c.minZoom);
        }
        if ('maxZoom' in c) {
          layer.setMaxZoom(c.maxZoom);
        }
        if ('minResolution' in c) {
          layer.setMinResolution(c.minResolution);
        }
        if ('maxResolution' in c) {
          layer.setMaxResolution(c.maxResolution);
        }
        const layerState = layer.getLayerState();
        assert.strictEqual(inView(layerState, c.view), c.inView);
      });
    });
  });

  describe('#getLayerState', function () {
    let layer;

    beforeEach(function () {
      layer = new Layer({
        source: new Source({
          projection: getProjection('EPSG:4326'),
        }),
      });
    });

    afterEach(function () {
      layer.dispose();
    });

    it('returns a layerState from the properties values', function () {
      layer.setOpacity(1 / 3);
      layer.setVisible(false);
      layer.setMaxResolution(500);
      layer.setMinResolution(0.25);
      layer.setZIndex(10);
      assert.deepEqual(layer.getLayerState(), {
        layer: layer,
        opacity: 0.33,
        visible: false,
        managed: true,
        extent: undefined,
        zIndex: 10,
        maxResolution: 500,
        minResolution: 0.25,
        minZoom: -Infinity,
        maxZoom: Infinity,
      });
    });

    it('returns a layerState with clamped values', function () {
      layer.setOpacity(-1.5);
      layer.setVisible(false);
      let state = layer.getLayerState();
      assert.strictEqual(state.opacity, 0);
      assert.strictEqual(state.visible, false);

      layer.setOpacity(3);
      layer.setVisible(true);
      state = layer.getLayerState();
      assert.strictEqual(state.opacity, 1);
      assert.strictEqual(state.visible, true);
    });
  });

  describe('#isVisible', function () {
    let layer, view;

    beforeEach(function () {
      layer = new Layer({
        source: new Source({
          projection: 'EPSG:4326',
        }),
      });
      view = new View({
        projection: 'EPSG:4326',
        center: [0, 0],
        zoom: 0,
      });
    });

    it('returns true if the layer is visible', function () {
      layer.setVisible(true);
      assert.strictEqual(layer.isVisible(view), true);
    });

    it('returns false if the layer is not visible', function () {
      layer.setVisible(false);
      assert.strictEqual(layer.isVisible(view), false);
    });

    it('returns false if the layer is not in view', function () {
      layer.setExtent([15, 47, 16, 48]);
      view.setZoom(14);
      assert.strictEqual(layer.isVisible(view), false);
    });

    it('returns false if the layer is not within zoom range', function () {
      layer.setMinZoom(2);
      assert.strictEqual(layer.isVisible(view), false);
    });

    it('works without arguments on layers that are in a map', function () {
      new Map({
        view: view,
        layers: [layer],
      });
      assert.strictEqual(layer.isVisible(), true);
    });

    it('throws when called without arguments', function () {
      assert.throws(() => layer.isVisible());
    });
  });

  describe('#getAttributions', function () {
    const attributions = ['foo'];
    /** @type {Layer} */
    let layer;
    /** @type {View} */
    let view;

    beforeEach(function () {
      layer = new Layer({
        source: new Source({
          attributions: attributions,
          projection: getProjection('EPSG:4326'),
        }),
      });
      view = new View({
        projection: 'EPSG:4326',
        center: [0, 0],
        zoom: 0,
      });
    });

    it('returns the attributions', function () {
      assert.strictEqual(layer.getAttributions(view), attributions);
    });

    it('returns an empty array when the layer is not visible', function () {
      layer.setVisible(false);
      assert.deepEqual(layer.getAttributions(view), []);
    });

    it('returns an empty array when the layer is in a hidden group', function () {
      new Map({
        layers: [new Group({layers: [layer], visible: false})],
        view: view,
      });
      assert.deepEqual(layer.getAttributions(), []);
    });
  });

  describe('#getSource', function () {
    it('gets the layer source', function () {
      const source = new Source({projection: getProjection('EPSG:4326')});
      const layer = new Layer({source: source});
      assert.strictEqual(layer.getSource(), source);
    });
  });

  describe('#set("source", source)', function () {
    const projection = getProjection('EPSG:4326');

    it('sets the layer source', function () {
      const layer = new Layer({
        source: new Source({projection: projection}),
      });

      const source = new Source({projection: projection});
      layer.set('source', source);
      assert.strictEqual(layer.getSource(), source);
    });

    it('calls changed', function () {
      const layer = new Layer({
        source: new Source({projection: projection}),
      });
      sinonSpy(layer, 'changed');

      const source = new Source({projection: projection});
      layer.set('source', source);
      assert.strictEqual(layer.changed.calledOnce, true);
    });

    it('sets up event listeners', function () {
      sinonSpy(Layer.prototype, 'handleSourceChange_');

      const first = new Source({projection: projection});
      const layer = new Layer({source: first});

      first.setState('ready');
      assert.strictEqual(layer.handleSourceChange_.calledOnce, true);

      const second = new Source({projection: projection});
      layer.set('source', second);

      assert.strictEqual(layer.handleSourceChange_.calledOnce, true);
      second.setState('ready');
      assert.strictEqual(layer.handleSourceChange_.callCount, 2);

      // remove spy
      Layer.prototype.handleSourceChange_.restore();
    });
  });

  describe('#setSource()', function () {
    const projection = getProjection('EPSG:4326');

    it('sets the layer source', function () {
      const layer = new Layer({
        source: new Source({projection: projection}),
      });

      const source = new Source({projection: projection});
      layer.setSource(source);
      assert.strictEqual(layer.getSource(), source);
    });

    it('calls changed', function () {
      const layer = new Layer({
        source: new Source({projection: projection}),
      });
      sinonSpy(layer, 'changed');

      const source = new Source({projection: projection});
      layer.setSource(source);
      assert.strictEqual(layer.changed.calledOnce, true);
    });

    it('sets up event listeners', function () {
      sinonSpy(Layer.prototype, 'handleSourceChange_');

      const first = new Source({projection: projection});
      const layer = new Layer({source: first});

      first.setState('ready');
      assert.strictEqual(layer.handleSourceChange_.calledOnce, true);

      const second = new Source({projection: projection});
      layer.setSource(second);

      assert.strictEqual(layer.handleSourceChange_.calledOnce, true);
      second.setState('ready');
      assert.strictEqual(layer.handleSourceChange_.callCount, 2);

      // remove spy
      Layer.prototype.handleSourceChange_.restore();
    });
  });

  describe('#setOpacity', function () {
    let layer;

    beforeEach(function () {
      layer = new Layer({
        source: new Source({
          projection: getProjection('EPSG:4326'),
        }),
      });
    });

    afterEach(function () {
      layer.dispose();
    });

    it('accepts a positive number', function () {
      layer.setOpacity(0.3);
      assert.strictEqual(layer.getOpacity(), 0.3);
    });

    it('throws on types other than number', function () {
      function set() {
        layer.setOpacity('foo');
      }
      assert.throws(set);
    });

    it('triggers a change event', function () {
      const listener = sinonSpy();
      layer.on('propertychange', listener);
      layer.setOpacity(0.4);
      assert.strictEqual(listener.calledOnce, true);
    });
  });

  describe('#setVisible', function () {
    let layer;
    beforeEach(function () {
      layer = new Layer({
        source: new Source({
          projection: getProjection('EPSG:4326'),
        }),
      });
    });

    afterEach(function () {
      layer.dispose();
    });

    it('sets visible property', function () {
      layer.setVisible(false);
      assert.strictEqual(layer.getVisible(), false);

      layer.setVisible(true);
      assert.strictEqual(layer.getVisible(), true);
    });

    it('fires a change event', function () {
      const listener = sinonSpy();
      layer.on('propertychange', listener);

      layer.setVisible(false);
      assert.strictEqual(listener.callCount, 1);

      layer.setVisible(true);
      assert.strictEqual(listener.callCount, 2);
    });
  });

  describe('unrender()', () => {
    /** @type {Map} */
    let map;

    /** @type {TileLayer} */
    let layer;

    /** HTMLDivElement */
    let target;

    beforeEach((done) => {
      target = document.createElement('div');
      target.style.width = '100px';
      target.style.height = '100px';
      document.body.appendChild(target);

      layer = new TileLayer({
        source: new XYZ({
          url: 'spec/ol/data/osm-0-0-0.png',
        }),
      });

      map = new Map({
        target: target,
        layers: [layer],
        view: new View({
          center: [0, 0],
          zoom: 0,
        }),
      });

      map.once('rendercomplete', () => done());
    });

    afterEach(() => {
      disposeMap(map);
    });

    it('is called when a layer goes from visible to not visible', () => {
      const spy = sinonSpy(layer, 'unrender');
      map.renderSync();
      assert.strictEqual(spy.callCount, 0);

      layer.setVisible(false);
      map.renderSync();
      assert.strictEqual(spy.callCount, 1);
    });

    it('is called when a layer is removed from the map', () => {
      const spy = sinonSpy(layer, 'unrender');
      map.renderSync();
      assert.strictEqual(spy.callCount, 0);

      map.removeLayer(layer);
      map.renderSync();
      assert.strictEqual(spy.callCount, 1);
    });

    it('is called when a layer goes out of range', () => {
      const spy = sinonSpy(layer, 'unrender');
      map.renderSync();
      assert.strictEqual(spy.callCount, 0);

      layer.setMaxZoom(3);
      map.getView().setZoom(4);
      map.renderSync();
      assert.strictEqual(spy.callCount, 1);
    });
  });

  describe('map property', () => {
    it('is set when a layer is added to a map', () => {
      const map = new Map({});
      const layer = new Layer({});
      map.addLayer(layer);

      assert.strictEqual(layer.get(Property.MAP), map);
    });

    it('is set when a layer is added to a map in the constructor', () => {
      const layer = new Layer({});
      const map = new Map({layers: [layer]});

      assert.strictEqual(layer.get(Property.MAP), map);
    });

    it('is set when a layer is added to a group', () => {
      const layer = new Layer({});
      const group = new Group();
      const map = new Map({});
      map.addLayer(group);
      group.getLayers().push(layer);

      assert.strictEqual(layer.get(Property.MAP), map);
    });

    it('is set when a layer is added to a group set in the constructor', () => {
      const layer = new Layer({});
      const group = new Group();
      const map = new Map({layers: [group]});
      group.getLayers().push(layer);

      assert.strictEqual(layer.get(Property.MAP), map);
    });

    it('is set when a layer already added to a group set in the constructor', () => {
      const layer = new Layer({});
      const group = new Group({layers: [layer]});
      const map = new Map({layers: [group]});

      assert.strictEqual(layer.get(Property.MAP), map);
    });

    it('is removed when a layer is removed from the map', () => {
      const map = new Map({});
      const layer = new Layer({});
      map.addLayer(layer);
      assert.strictEqual(layer.get(Property.MAP), map);

      map.removeLayer(layer);
      assert.strictEqual(layer.get(Property.MAP), null);
    });

    it('is removed when a layer added in the constructor is removed from the map', () => {
      const layer = new Layer({});
      const map = new Map({layers: [layer]});
      assert.strictEqual(layer.get(Property.MAP), map);

      map.removeLayer(layer);
      assert.strictEqual(layer.get(Property.MAP), null);
    });

    it('is removed when a layer is removed from a group', () => {
      const layer = new Layer({});
      const group = new Group({layers: [layer]});
      const map = new Map({layers: [group]});
      assert.strictEqual(layer.get(Property.MAP), map);

      group.getLayers().remove(layer);
      assert.strictEqual(layer.get(Property.MAP), null);
    });
  });

  describe('#setMap (unmanaged layer)', function () {
    let map;

    beforeEach(function () {
      map = new Map({});
    });

    describe('with map in constructor options', function () {
      it('renders the layer', function () {
        const layer = new Layer({
          map: map,
        });
        const frameState = {
          layerStatesArray: [],
        };
        map.dispatchEvent(
          new RenderEvent('precompose', null, frameState, null),
        );
        assert.strictEqual(frameState.layerStatesArray.length, 1);
        const layerState = frameState.layerStatesArray[0];
        assert.equal(layerState.layer, layer);
      });
    });

    describe('setMap sequences', function () {
      let mapRenderSpy;

      beforeEach(function () {
        mapRenderSpy = sinonSpy(map, 'render');
      });

      afterEach(function () {
        mapRenderSpy.restore();
      });

      it('requests a render frame', function () {
        const layer = new Layer({});

        layer.setMap(map);
        assert.strictEqual(mapRenderSpy.callCount, 1);

        layer.setMap(null);
        assert.strictEqual(mapRenderSpy.callCount, 2);

        layer.setMap(map);
        assert.strictEqual(mapRenderSpy.callCount, 3);
      });
    });

    describe('zIndex for unmanaged layers', function () {
      let frameState, layer;

      beforeEach(function () {
        layer = new Layer({
          map: map,
        });
        frameState = {
          layerStatesArray: [],
        };
      });

      afterEach(function () {
        layer.setMap(null);
      });

      it('has Infinity as zIndex when not configured otherwise', function () {
        map.dispatchEvent(
          new RenderEvent('precompose', null, frameState, null),
        );
        const layerState = frameState.layerStatesArray[0];
        assert.strictEqual(layerState.zIndex, Infinity);
      });

      it('respects the configured zIndex', function () {
        [-5, 0, 42].forEach((index) => {
          layer.setZIndex(index);
          map.dispatchEvent(
            new RenderEvent('precompose', null, frameState, null),
          );
          const layerState = frameState.layerStatesArray[0];
          frameState.layerStatesArray.length = 0;
          assert.strictEqual(layerState.zIndex, index);
        });
      });
    });
  });
});
