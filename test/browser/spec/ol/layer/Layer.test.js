import Group from '../../../../../src/ol/layer/Group.js';
import Layer, {inView} from '../../../../../src/ol/layer/Layer.js';
import Map from '../../../../../src/ol/Map.js';
import Property from '../../../../../src/ol/layer/Property.js';
import RenderEvent from '../../../../../src/ol/render/Event.js';
import Source from '../../../../../src/ol/source/Source.js';
import TileLayer from '../../../../../src/ol/layer/Tile.js';
import View from '../../../../../src/ol/View.js';
import XYZ from '../../../../../src/ol/source/XYZ.js';
import {get as getProjection} from '../../../../../src/ol/proj.js';

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
      expect(layer).to.be.a(Layer);
    });

    it('provides default opacity', function () {
      expect(layer.getOpacity()).to.be(1);
    });

    it('provides default visibility', function () {
      expect(layer.getVisible()).to.be(true);
    });

    it('provides default max resolution', function () {
      expect(layer.getMaxResolution()).to.be(Infinity);
    });

    it('provides default min resolution', function () {
      expect(layer.getMinResolution()).to.be(0);
    });

    it('provides default min zoom', function () {
      expect(layer.getMinZoom()).to.be(-Infinity);
    });

    it('provides default max zoom', function () {
      expect(layer.getMaxZoom()).to.be(Infinity);
    });

    it('provides default layerState', function () {
      expect(layer.getLayerState()).to.eql({
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

      expect(layer.getOpacity()).to.be(0.5);
      expect(layer.getVisible()).to.be(false);
      expect(layer.getMaxResolution()).to.be(500);
      expect(layer.getMinResolution()).to.be(0.25);
      expect(layer.getMinZoom()).to.be(1);
      expect(layer.getMaxZoom()).to.be(10);
      expect(layer.get('foo')).to.be(42);
      expect(layer.getLayerState()).to.eql({
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
      expect(o.get('foo')).to.be('bar');
      expect(o.get('properties')).to.be(undefined);
    });

    it('can have a `properties` property', function () {
      const o = new Layer({
        properties: {
          properties: {foo: 'bar'},
        },
      });
      expect(o.get('properties')).to.eql({foo: 'bar'});
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

      expect(create).to.throwException();
    });

    it('accepts a custom render function', function () {
      let called = false;
      const layer = new Layer({
        render: function () {
          called = true;
        },
      });
      layer.render();
      expect(called).to.eql(true);
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
        expect(inView(layerState, c.view)).to.be(c.inView);
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
      expect(layer.getLayerState()).to.eql({
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
      expect(state.opacity).to.be(0);
      expect(state.visible).to.be(false);

      layer.setOpacity(3);
      layer.setVisible(true);
      state = layer.getLayerState();
      expect(state.opacity).to.be(1);
      expect(state.visible).to.be(true);
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
      expect(layer.isVisible(view)).to.be(true);
    });

    it('returns false if the layer is not visible', function () {
      layer.setVisible(false);
      expect(layer.isVisible(view)).to.be(false);
    });

    it('returns false if the layer is not in view', function () {
      layer.setExtent([15, 47, 16, 48]);
      view.setZoom(14);
      expect(layer.isVisible(view)).to.be(false);
    });

    it('returns false if the layer is not within zoom range', function () {
      layer.setMinZoom(2);
      expect(layer.isVisible(view)).to.be(false);
    });

    it('works without arguments on layers that are in a map', function () {
      new Map({
        view: view,
        layers: [layer],
      });
      expect(layer.isVisible()).to.be(true);
    });

    it('throws when called without arguments', function () {
      expect(() => layer.isVisible()).to.throwException();
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
      expect(layer.getAttributions(view)).to.be(attributions);
    });

    it('returns an empty array when the layer is not visible', function () {
      layer.setVisible(false);
      expect(layer.getAttributions(view)).to.eql([]);
    });

    it('returns an empty array when the layer is in a hidden group', function () {
      new Map({
        layers: [new Group({layers: [layer], visible: false})],
        view: view,
      });
      expect(layer.getAttributions()).to.eql([]);
    });
  });

  describe('#getSource', function () {
    it('gets the layer source', function () {
      const source = new Source({projection: getProjection('EPSG:4326')});
      const layer = new Layer({source: source});
      expect(layer.getSource()).to.be(source);
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
      expect(layer.getSource()).to.be(source);
    });

    it('calls changed', function () {
      const layer = new Layer({
        source: new Source({projection: projection}),
      });
      sinon.spy(layer, 'changed');

      const source = new Source({projection: projection});
      layer.set('source', source);
      expect(layer.changed.calledOnce).to.be(true);
    });

    it('sets up event listeners', function () {
      sinon.spy(Layer.prototype, 'handleSourceChange_');

      const first = new Source({projection: projection});
      const layer = new Layer({source: first});

      first.setState('ready');
      expect(layer.handleSourceChange_.calledOnce).to.be(true);

      const second = new Source({projection: projection});
      layer.set('source', second);

      expect(layer.handleSourceChange_.calledOnce).to.be(true);
      second.setState('ready');
      expect(layer.handleSourceChange_.callCount).to.be(2);

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
      expect(layer.getSource()).to.be(source);
    });

    it('calls changed', function () {
      const layer = new Layer({
        source: new Source({projection: projection}),
      });
      sinon.spy(layer, 'changed');

      const source = new Source({projection: projection});
      layer.setSource(source);
      expect(layer.changed.calledOnce).to.be(true);
    });

    it('sets up event listeners', function () {
      sinon.spy(Layer.prototype, 'handleSourceChange_');

      const first = new Source({projection: projection});
      const layer = new Layer({source: first});

      first.setState('ready');
      expect(layer.handleSourceChange_.calledOnce).to.be(true);

      const second = new Source({projection: projection});
      layer.setSource(second);

      expect(layer.handleSourceChange_.calledOnce).to.be(true);
      second.setState('ready');
      expect(layer.handleSourceChange_.callCount).to.be(2);

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
      expect(layer.getOpacity()).to.be(0.3);
    });

    it('throws on types other than number', function () {
      function set() {
        layer.setOpacity('foo');
      }
      expect(set).to.throwException();
    });

    it('triggers a change event', function () {
      const listener = sinon.spy();
      layer.on('propertychange', listener);
      layer.setOpacity(0.4);
      expect(listener.calledOnce).to.be(true);
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
      expect(layer.getVisible()).to.be(false);

      layer.setVisible(true);
      expect(layer.getVisible()).to.be(true);
    });

    it('fires a change event', function () {
      const listener = sinon.spy();
      layer.on('propertychange', listener);

      layer.setVisible(false);
      expect(listener.callCount).to.be(1);

      layer.setVisible(true);
      expect(listener.callCount).to.be(2);
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
      map.setTarget(null);
      document.body.removeChild(target);
    });

    it('is called when a layer goes from visible to not visible', () => {
      const spy = sinon.spy(layer, 'unrender');
      map.renderSync();
      expect(spy.callCount).to.be(0);

      layer.setVisible(false);
      map.renderSync();
      expect(spy.callCount).to.be(1);
    });

    it('is called when a layer is removed from the map', () => {
      const spy = sinon.spy(layer, 'unrender');
      map.renderSync();
      expect(spy.callCount).to.be(0);

      map.removeLayer(layer);
      map.renderSync();
      expect(spy.callCount).to.be(1);
    });

    it('is called when a layer goes out of range', () => {
      const spy = sinon.spy(layer, 'unrender');
      map.renderSync();
      expect(spy.callCount).to.be(0);

      layer.setMaxZoom(3);
      map.getView().setZoom(4);
      map.renderSync();
      expect(spy.callCount).to.be(1);
    });
  });

  describe('map property', () => {
    it('is set when a layer is added to a map', () => {
      const map = new Map({});
      const layer = new Layer({});
      map.addLayer(layer);

      expect(layer.get(Property.MAP)).to.be(map);
    });

    it('is set when a layer is added to a map in the constructor', () => {
      const layer = new Layer({});
      const map = new Map({layers: [layer]});

      expect(layer.get(Property.MAP)).to.be(map);
    });

    it('is set when a layer is added to a group', () => {
      const layer = new Layer({});
      const group = new Group();
      const map = new Map({});
      map.addLayer(group);
      group.getLayers().push(layer);

      expect(layer.get(Property.MAP)).to.be(map);
    });

    it('is set when a layer is added to a group set in the constructor', () => {
      const layer = new Layer({});
      const group = new Group();
      const map = new Map({layers: [group]});
      group.getLayers().push(layer);

      expect(layer.get(Property.MAP)).to.be(map);
    });

    it('is set when a layer already added to a group set in the constructor', () => {
      const layer = new Layer({});
      const group = new Group({layers: [layer]});
      const map = new Map({layers: [group]});

      expect(layer.get(Property.MAP)).to.be(map);
    });

    it('is removed when a layer is removed from the map', () => {
      const map = new Map({});
      const layer = new Layer({});
      map.addLayer(layer);
      expect(layer.get(Property.MAP)).to.be(map);

      map.removeLayer(layer);
      expect(layer.get(Property.MAP)).to.be(null);
    });

    it('is removed when a layer added in the constructor is removed from the map', () => {
      const layer = new Layer({});
      const map = new Map({layers: [layer]});
      expect(layer.get(Property.MAP)).to.be(map);

      map.removeLayer(layer);
      expect(layer.get(Property.MAP)).to.be(null);
    });

    it('is removed when a layer is removed from a group', () => {
      const layer = new Layer({});
      const group = new Group({layers: [layer]});
      const map = new Map({layers: [group]});
      expect(layer.get(Property.MAP)).to.be(map);

      group.getLayers().remove(layer);
      expect(layer.get(Property.MAP)).to.be(null);
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
          new RenderEvent('precompose', null, frameState, null)
        );
        expect(frameState.layerStatesArray.length).to.be(1);
        const layerState = frameState.layerStatesArray[0];
        expect(layerState.layer).to.equal(layer);
      });
    });

    describe('setMap sequences', function () {
      let mapRenderSpy;

      beforeEach(function () {
        mapRenderSpy = sinon.spy(map, 'render');
      });

      afterEach(function () {
        mapRenderSpy.restore();
      });

      it('requests a render frame', function () {
        const layer = new Layer({});

        layer.setMap(map);
        expect(mapRenderSpy.callCount).to.be(1);

        layer.setMap(null);
        expect(mapRenderSpy.callCount).to.be(2);

        layer.setMap(map);
        expect(mapRenderSpy.callCount).to.be(3);
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
          new RenderEvent('precompose', null, frameState, null)
        );
        const layerState = frameState.layerStatesArray[0];
        expect(layerState.zIndex).to.be(Infinity);
      });

      it('respects the configured zIndex', function () {
        [-5, 0, 42].forEach((index) => {
          layer.setZIndex(index);
          map.dispatchEvent(
            new RenderEvent('precompose', null, frameState, null)
          );
          const layerState = frameState.layerStatesArray[0];
          frameState.layerStatesArray.length = 0;
          expect(layerState.zIndex).to.be(index);
        });
      });
    });
  });
});
