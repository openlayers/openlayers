import Map from '../../../../src/ol/Map.js';
import Layer, {inView} from '../../../../src/ol/layer/Layer.js';
import {get as getProjection} from '../../../../src/ol/proj.js';
import RenderEvent from '../../../../src/ol/render/Event.js';
import Source from '../../../../src/ol/source/Source.js';


describe('ol.layer.Layer', () => {

  describe('constructor (defaults)', () => {

    let layer;

    beforeEach(() => {
      layer = new Layer({
        source: new Source({
          projection: getProjection('EPSG:4326')
        })
      });
    });

    afterEach(() => {
      layer.dispose();
    });

    test('creates an instance', () => {
      expect(layer).toBeInstanceOf(Layer);
    });

    test('provides default opacity', () => {
      expect(layer.getOpacity()).toBe(1);
    });

    test('provides default visibility', () => {
      expect(layer.getVisible()).toBe(true);
    });

    test('provides default max resolution', () => {
      expect(layer.getMaxResolution()).toBe(Infinity);
    });

    test('provides default min resolution', () => {
      expect(layer.getMinResolution()).toBe(0);
    });

    test('provides default min zoom', () => {
      expect(layer.getMinZoom()).toBe(-Infinity);
    });

    test('provides default max zoom', () => {
      expect(layer.getMaxZoom()).toBe(Infinity);
    });

    test('provides default layerState', () => {
      expect(layer.getLayerState()).toEqual({
        layer: layer,
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

  describe('constructor (options)', () => {

    test('accepts options', () => {
      const layer = new Layer({
        source: new Source({
          projection: getProjection('EPSG:4326')
        }),
        opacity: 0.5,
        visible: false,
        zIndex: 10,
        maxResolution: 500,
        minResolution: 0.25,
        minZoom: 1,
        maxZoom: 10,
        foo: 42
      });

      expect(layer.getOpacity()).toBe(0.5);
      expect(layer.getVisible()).toBe(false);
      expect(layer.getMaxResolution()).toBe(500);
      expect(layer.getMinResolution()).toBe(0.25);
      expect(layer.getMinZoom()).toBe(1);
      expect(layer.getMaxZoom()).toBe(10);
      expect(layer.get('foo')).toBe(42);
      expect(layer.getLayerState()).toEqual({
        layer: layer,
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

      layer.dispose();
    });

    test('throws on non-numeric opacity', () => {
      function create() {
        new Layer({
          source: new Source({
            projection: 'EPSG:4326'
          }),
          opacity: 'foo'
        });
      }

      expect(create).toThrow();
    });

    test('accepts a custom render function', () => {
      let called = false;
      const layer = new Layer({
        render: function() {
          called = true;
        }
      });
      layer.render();
      expect(called).toEqual(true);
    });
  });

  describe('inView', () => {
    let layer;

    beforeEach(() => {
      layer = new Layer({
        source: new Source({
          projection: getProjection('EPSG:4326')
        })
      });
    });

    afterEach(() => {
      layer.dispose();
    });

    const cases = [{
      when: 'layer is not visible',
      visible: false,
      view: {
        resolution: 4, zoom: 4
      },
      inView: false
    }, {
      when: 'layer is not visible (with min/max zoom and resolution)',
      visible: false,
      minZoom: 2,
      maxZoom: 6,
      minResolution: 2,
      maxResolution: 6,
      view: {
        resolution: 4, zoom: 4
      },
      inView: false
    }, {
      when: 'view zoom is less than minZoom',
      minZoom: 2,
      view: {
        resolution: 1, zoom: 1
      },
      inView: false
    }, {
      when: 'view zoom is less than minZoom (with maxZoom)',
      minZoom: 2,
      maxZoom: 4,
      view: {
        resolution: 1, zoom: 1
      },
      inView: false
    }, {
      when: 'view zoom is equal to minZoom',
      minZoom: 2,
      view: {
        resolution: 2, zoom: 2
      },
      inView: false
    }, {
      when: 'view zoom is equal to minZoom (with maxZoom)',
      minZoom: 2,
      maxZoom: 4,
      view: {
        resolution: 2, zoom: 2
      },
      inView: false
    }, {
      when: 'view zoom is greater than minZoom',
      minZoom: 2,
      view: {
        resolution: 3, zoom: 3
      },
      inView: true
    }, {
      when: 'view zoom is greater than minZoom (with maxZoom)',
      minZoom: 2,
      maxZoom: 4,
      view: {
        resolution: 3, zoom: 3
      },
      inView: true
    }, {
      when: 'view zoom is equal to maxZoom',
      maxZoom: 4,
      view: {
        resolution: 4, zoom: 4
      },
      inView: true
    }, {
      when: 'view zoom is equal to maxZoom (with minZoom)',
      minZoom: 2,
      maxZoom: 4,
      view: {
        resolution: 4, zoom: 4
      },
      inView: true
    }, {
      when: 'view zoom is greater than maxZoom',
      maxZoom: 4,
      view: {
        resolution: 5, zoom: 5
      },
      inView: false
    }, {
      when: 'view zoom is greater than maxZoom (with minZoom)',
      minZoom: 2,
      maxZoom: 4,
      view: {
        resolution: 5, zoom: 5
      },
      inView: false
    }, {
      when: 'view resolution is less than minResolution',
      minResolution: 2,
      view: {
        resolution: 1, zoom: 1
      },
      inView: false
    }, {
      when: 'view resolution is less than minResolution (with maxResolution)',
      minResolution: 2,
      maxResolution: 4,
      view: {
        resolution: 1, zoom: 1
      },
      inView: false
    }, {
      when: 'view resolution is equal to minResolution',
      minResolution: 2,
      view: {
        resolution: 2, zoom: 2
      },
      inView: true
    }, {
      when: 'view resolution is equal to minResolution (with maxResolution)',
      minResolution: 2,
      maxResolution: 4,
      view: {
        resolution: 2, zoom: 2
      },
      inView: true
    }, {
      when: 'view resolution is greater than minResolution',
      minResolution: 2,
      view: {
        resolution: 3, zoom: 3
      },
      inView: true
    }, {
      when: 'view resolution is greater than minResolution (with maxResolution)',
      minResolution: 2,
      maxResolution: 4,
      view: {
        resolution: 3, zoom: 3
      },
      inView: true
    }, {
      when: 'view resolution is equal to maxResolution',
      maxResolution: 4,
      view: {
        resolution: 4, zoom: 4
      },
      inView: false
    }, {
      when: 'view resolution is equal to maxResolution (with minResolution)',
      minResolution: 2,
      maxResolution: 4,
      view: {
        resolution: 4, zoom: 4
      },
      inView: false
    }, {
      when: 'view resolution is greater than maxResolution',
      maxResolution: 4,
      view: {
        resolution: 5, zoom: 5
      },
      inView: false
    }, {
      when: 'view resolution is greater than maxResolution (with minResolution)',
      minResolution: 2,
      maxResolution: 4,
      view: {
        resolution: 5, zoom: 5
      },
      inView: false
    }];

    cases.forEach(function(c, i) {
      test('returns ' + c.inView + ' when ' + c.when, () => {
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
        expect(inView(layerState, c.view)).toBe(c.inView);
      });
    });

  });

  describe('#getLayerState', () => {

    let layer;

    beforeEach(() => {
      layer = new Layer({
        source: new Source({
          projection: getProjection('EPSG:4326')
        })
      });
    });

    afterEach(() => {
      layer.dispose();
    });

    test('returns a layerState from the properties values', () => {
      layer.setOpacity(1 / 3);
      layer.setVisible(false);
      layer.setMaxResolution(500);
      layer.setMinResolution(0.25);
      layer.setZIndex(10);
      expect(layer.getLayerState()).toEqual({
        layer: layer,
        opacity: 0.33,
        visible: false,
        managed: true,
        hasOverlay: false,
        sourceState: 'ready',
        extent: undefined,
        zIndex: 10,
        maxResolution: 500,
        minResolution: 0.25,
        minZoom: -Infinity,
        maxZoom: Infinity
      });
    });

    test('returns a layerState with clamped values', () => {
      layer.setOpacity(-1.5);
      layer.setVisible(false);
      let state = layer.getLayerState();
      expect(state.opacity).toBe(0);
      expect(state.visible).toBe(false);

      layer.setOpacity(3);
      layer.setVisible(true);
      state = layer.getLayerState();
      expect(state.opacity).toBe(1);
      expect(state.visible).toBe(true);
    });

  });

  describe('#getSource', () => {

    test('gets the layer source', () => {
      const source = new Source({projection: getProjection('EPSG:4326')});
      const layer = new Layer({source: source});
      expect(layer.getSource()).toBe(source);
    });

  });

  describe('#set("source", source)', () => {
    const projection = getProjection('EPSG:4326');

    test('sets the layer source', () => {
      const layer = new Layer({
        source: new Source({projection: projection})
      });

      const source = new Source({projection: projection});
      layer.set('source', source);
      expect(layer.getSource()).toBe(source);
    });

    test('calls changed', () => {
      const layer = new Layer({
        source: new Source({projection: projection})
      });
      sinon.spy(layer, 'changed');

      const source = new Source({projection: projection});
      layer.set('source', source);
      expect(layer.changed.calledOnce).toBe(true);
    });

    test('sets up event listeners', () => {
      sinon.spy(Layer.prototype, 'handleSourceChange_');

      const first = new Source({projection: projection});
      const layer = new Layer({source: first});

      first.setState('ready');
      expect(layer.handleSourceChange_.calledOnce).toBe(true);

      const second = new Source({projection: projection});
      layer.set('source', second);

      expect(layer.handleSourceChange_.calledOnce).toBe(true);
      second.setState('ready');
      expect(layer.handleSourceChange_.callCount).toBe(2);

      // remove spy
      Layer.prototype.handleSourceChange_.restore();
    });

  });

  describe('#setSource()', () => {
    const projection = getProjection('EPSG:4326');

    test('sets the layer source', () => {
      const layer = new Layer({
        source: new Source({projection: projection})
      });

      const source = new Source({projection: projection});
      layer.setSource(source);
      expect(layer.getSource()).toBe(source);
    });

    test('calls changed', () => {
      const layer = new Layer({
        source: new Source({projection: projection})
      });
      sinon.spy(layer, 'changed');

      const source = new Source({projection: projection});
      layer.setSource(source);
      expect(layer.changed.calledOnce).toBe(true);
    });

    test('sets up event listeners', () => {
      sinon.spy(Layer.prototype, 'handleSourceChange_');

      const first = new Source({projection: projection});
      const layer = new Layer({source: first});

      first.setState('ready');
      expect(layer.handleSourceChange_.calledOnce).toBe(true);

      const second = new Source({projection: projection});
      layer.setSource(second);

      expect(layer.handleSourceChange_.calledOnce).toBe(true);
      second.setState('ready');
      expect(layer.handleSourceChange_.callCount).toBe(2);

      // remove spy
      Layer.prototype.handleSourceChange_.restore();
    });

  });


  describe('#setOpacity', () => {

    let layer;

    beforeEach(() => {
      layer = new Layer({
        source: new Source({
          projection: getProjection('EPSG:4326')
        })
      });
    });

    afterEach(() => {
      layer.dispose();
    });

    test('accepts a positive number', () => {
      layer.setOpacity(0.3);
      expect(layer.getOpacity()).toBe(0.3);
    });

    test('throws on types other than number', () => {
      function set() {
        layer.setOpacity('foo');
      }
      expect(set).toThrow();
    });

    test('triggers a change event', () => {
      const listener = sinon.spy();
      layer.on('propertychange', listener);
      layer.setOpacity(0.4);
      expect(listener.calledOnce).toBe(true);
    });

  });


  describe('#setVisible', () => {

    let layer;
    beforeEach(() => {
      layer = new Layer({
        source: new Source({
          projection: getProjection('EPSG:4326')
        })
      });
    });

    afterEach(() => {
      layer.dispose();
    });

    test('sets visible property', () => {
      layer.setVisible(false);
      expect(layer.getVisible()).toBe(false);

      layer.setVisible(true);
      expect(layer.getVisible()).toBe(true);
    });

    test('fires a change event', () => {
      const listener = sinon.spy();
      layer.on('propertychange', listener);

      layer.setVisible(false);
      expect(listener.callCount).toBe(1);

      layer.setVisible(true);
      expect(listener.callCount).toBe(2);
    });

  });

  describe('#setMap (unmanaged layer)', () => {
    let map;

    beforeEach(() => {
      map = new Map({});
    });

    describe('with map in constructor options', () => {
      test('renders the layer', () => {
        const layer = new Layer({
          map: map
        });
        const frameState = {
          layerStatesArray: []
        };
        map.dispatchEvent(new RenderEvent('precompose', null, frameState, null, null));
        expect(frameState.layerStatesArray.length).toBe(1);
        const layerState = frameState.layerStatesArray[0];
        expect(layerState.layer).toBe(layer);
      });
    });

    describe('setMap sequences', () => {
      let mapRenderSpy;

      beforeEach(() => {
        mapRenderSpy = sinon.spy(map, 'render');
      });

      afterEach(() => {
        mapRenderSpy.restore();
      });

      test('requests a render frame', () => {
        const layer = new Layer({});

        layer.setMap(map);
        expect(mapRenderSpy.callCount).toBe(1);

        layer.setMap(null);
        expect(mapRenderSpy.callCount).toBe(2);

        layer.setMap(map);
        expect(mapRenderSpy.callCount).toBe(3);
      });

    });

    describe('zIndex for unmanaged layers', () => {

      let frameState, layer;

      beforeEach(() => {
        layer = new Layer({
          map: map
        });
        frameState = {
          layerStatesArray: [],
          layerStates: {}
        };
      });

      afterEach(() => {
        layer.setMap(null);
      });

      test('has Infinity as zIndex when not configured otherwise', () => {
        map.dispatchEvent(new RenderEvent('precompose', null,
          frameState, null, null));
        const layerState = frameState.layerStatesArray[0];
        expect(layerState.zIndex).toBe(Infinity);
      });

      test('respects the configured zIndex', () => {
        layer.setZIndex(42);
        map.dispatchEvent(new RenderEvent('precompose', null,
          frameState, null, null));
        const layerState = frameState.layerStatesArray[0];
        expect(layerState.zIndex).toBe(42);
      });

    });

  });

});
