import {assert} from 'chai';
import Map from '../../../../../src/ol/Map.js';
import View from '../../../../../src/ol/View.js';
import MousePosition from '../../../../../src/ol/control/MousePosition.js';
import EventType from '../../../../../src/ol/pointer/EventType.js';
import {
  clearUserProjection,
  fromLonLat,
  useGeographic,
} from '../../../../../src/ol/proj.js';

describe('ol/control/MousePosition', function () {
  describe('constructor', function () {
    it('can be constructed without arguments', function () {
      const instance = new MousePosition();
      assert.instanceOf(instance, MousePosition);
      assert.strictEqual(instance.element.className, 'ol-mouse-position');
    });

    it('creates the element with the provided class name', function () {
      const className = 'foobar';
      const instance = new MousePosition({
        className: className,
      });
      assert.strictEqual(instance.element.className, className);
    });
  });

  describe('configuration options', function () {
    let target, map;
    const width = 360;
    const height = 180;

    beforeEach(function () {
      target = document.createElement('div');
      const style = target.style;
      style.position = 'absolute';
      style.left = '-1000px';
      style.top = '-1000px';
      style.width = width + 'px';
      style.height = height + 'px';

      document.body.appendChild(target);
      map = new Map({
        target: target,
        controls: [],
        view: new View({
          projection: 'EPSG:4326',
          center: [0, 0],
          resolution: 1,
        }),
      });
    });
    afterEach(function () {
      disposeMap(map);
      clearUserProjection();
    });

    function simulateEvent(type, x, y) {
      const viewport = map.getViewport();
      // calculated in case body has top < 0 (test runner with small window)
      const position = viewport.getBoundingClientRect();
      const evt = new PointerEvent(type, {
        clientX: position.left + x + width / 2,
        clientY: position.top + y + height / 2,
      });
      document.querySelector('div.ol-viewport').dispatchEvent(evt);
    }

    describe('placeholder', function () {
      it('renders placeholder when mouse moves out', function () {
        const ctrl = new MousePosition({
          placeholder: 'some text',
        });
        ctrl.setMap(map);
        map.renderSync();

        const element = document.querySelector('.ol-mouse-position');

        simulateEvent(EventType.POINTEROUT, width + 1, height + 1);
        assert.strictEqual(element.innerHTML, 'some text');

        simulateEvent(EventType.POINTERMOVE, 20, 30);
        assert.strictEqual(element.innerHTML, '20,-30');

        simulateEvent(EventType.POINTEROUT, width + 1, height + 1);
        assert.strictEqual(element.innerHTML, 'some text');
      });

      it('renders the last posisition if placeholder is not set and mouse moves outside the viewport', function () {
        const ctrl = new MousePosition();
        ctrl.setMap(map);
        map.renderSync();

        const element = document.querySelector('.ol-mouse-position');

        simulateEvent(EventType.POINTEROUT, width + 1, height + 1);
        assert.strictEqual(element.innerHTML, '&nbsp;');

        target.dispatchEvent(new PointerEvent('pointermove'));
        simulateEvent(EventType.POINTERMOVE, 20, 30);
        assert.strictEqual(element.innerHTML, '20,-30');

        simulateEvent(EventType.POINTEROUT, width + 1, height + 1);
        assert.strictEqual(element.innerHTML, '20,-30');
      });

      it('renders an empty space if placeholder is set to the same and mouse moves outside the viewport', function () {
        const ctrl = new MousePosition({
          placeholder: '',
        });
        ctrl.setMap(map);
        map.renderSync();

        const element = document.querySelector('.ol-mouse-position');

        simulateEvent(EventType.POINTEROUT, width + 1, height + 1);
        assert.strictEqual(element.innerHTML, '');

        target.dispatchEvent(new PointerEvent('pointermove'));
        simulateEvent(EventType.POINTERMOVE, 20, 30);
        assert.strictEqual(element.innerHTML, '20,-30');

        simulateEvent(EventType.POINTEROUT, width + 1, height + 1);
        assert.strictEqual(element.innerHTML, '');
      });
    });

    it('can opt out of wrapX', function () {
      const ctrl = new MousePosition({wrapX: false});
      ctrl.setMap(map);
      map.getView().setCenter([-360, 0]);
      map.renderSync();
      simulateEvent(EventType.POINTERMOVE, 0, 0);
      assert.strictEqual(ctrl.element.innerHTML, '-360,0');
    });

    it('can wrapX', function () {
      const ctrl = new MousePosition();
      ctrl.setMap(map);
      map.getView().setCenter([-360, 0]);
      map.renderSync();
      simulateEvent(EventType.POINTERMOVE, 0, 0);
      assert.strictEqual(ctrl.element.innerHTML, '0,0');
    });

    it('can wrapX with projection', function () {
      const ctrl = new MousePosition({projection: 'EPSG:4326'});
      map.setView(new View({resolution: 1}));
      ctrl.setMap(map);
      map.getView().setCenter(fromLonLat([-360, 0]));
      map.renderSync();
      simulateEvent(EventType.POINTERMOVE, 0, 0);
      assert.strictEqual(ctrl.element.innerHTML, '0,0');
    });

    it('can wrapX with user projection', function () {
      useGeographic();
      const ctrl = new MousePosition({projection: 'EPSG:4326'});
      map.setView(new View({resolution: 1}));
      ctrl.setMap(map);
      map.getView().setCenter([-360, 0]);
      map.renderSync();
      simulateEvent(EventType.POINTERMOVE, 0, 0);
      assert.strictEqual(ctrl.element.innerHTML, '0,0');
    });
  });
});
