import {spy as sinonSpy} from 'sinon';
import Map from '../../../../../src/ol/Map.js';
import MapBrowserEvent from '../../../../../src/ol/MapBrowserEvent.js';
import View from '../../../../../src/ol/View.js';
import Event from '../../../../../src/ol/events/Event.js';

describe('ol.interaction.KeyboardPan', function () {
  let map;

  beforeEach(function () {
    map = new Map({
      target: createMapDiv(100, 100),
      view: new View({
        center: [0, 0],
        resolutions: [1],
        zoom: 0,
      }),
    });
    map.renderSync();
  });
  afterEach(function () {
    disposeMap(map);
  });

  describe('handleEvent()', function () {
    it('pans on arrow keys', function () {
      const view = map.getView();
      const spy = sinonSpy(view, 'animateInternal');
      const event = new MapBrowserEvent('keydown', map, {
        type: 'keydown',
        target: map.getTargetElement(),
        preventDefault: Event.prototype.preventDefault,
      });

      event.originalEvent.key = 'ArrowDown';
      map.handleMapBrowserEvent(event);
      expect(spy.getCall(0).args[0].center).to.eql([0, -128]);
      view.setCenter([0, 0]);

      event.originalEvent.key = 'ArrowUp';
      map.handleMapBrowserEvent(event);
      expect(spy.getCall(1).args[0].center).to.eql([0, 128]);
      view.setCenter([0, 0]);

      event.originalEvent.key = 'ArrowLeft';
      map.handleMapBrowserEvent(event);
      expect(spy.getCall(2).args[0].center).to.eql([-128, 0]);
      view.setCenter([0, 0]);

      event.originalEvent.key = 'ArrowRight';
      map.handleMapBrowserEvent(event);
      expect(spy.getCall(3).args[0].center).to.eql([128, 0]);
      view.setCenter([0, 0]);

      view.animateInternal.restore();
    });
  });

  describe('handleEvent with map in ShadowRoot', function () {
    let olMap;
    let customMapEl;
    const options = {
      altShiftDragRotate: false,
      doubleClickZoom: false,
      keyboard: true,
      mouseWheelZoom: false,
      shiftDragZoom: false,
      dragPan: false,
      pinchRotate: false,
      pinchZoom: false,
      onFocusOnly: true,
    };

    defineCustomMapEl({interactionOpts: options});

    beforeEach(function () {
      // create custom ol-map element and add to body
      customMapEl = document.createElement('ol-map');
      customMapEl.setAttribute('tabindex', '0');
      customMapEl.style.position = 'absolute';
      customMapEl.style.left = '-1000px';
      customMapEl.style.top = '-1000px';
      customMapEl.style.width = '100px';
      customMapEl.style.height = '100px';
      document.body.appendChild(customMapEl);

      olMap = customMapEl.map;
      olMap.renderSync();
    });

    afterEach(() => {
      disposeMap(olMap);
      customMapEl.remove();
    });

    it('pans on arrow keys', function (done) {
      // we have to wait until the map is rendered
      olMap.on('rendercomplete', () => {
        const view = olMap.getView();
        const spy = sinonSpy(view, 'animateInternal');
        const event = new MapBrowserEvent('keydown', olMap, {
          type: 'keydown',
          target: customMapEl,
          preventDefault: Event.prototype.preventDefault,
        });

        event.originalEvent.key = 'ArrowDown';
        olMap.handleMapBrowserEvent(event);
        expect(spy.getCall(0).args[0].center).to.eql([0, -128]);
        view.setCenter([0, 0]);

        event.originalEvent.key = 'ArrowUp';
        map.handleMapBrowserEvent(event);
        expect(spy.getCall(1).args[0].center).to.eql([0, 128]);
        view.setCenter([0, 0]);

        event.originalEvent.key = 'ArrowLeft';
        map.handleMapBrowserEvent(event);
        expect(spy.getCall(2).args[0].center).to.eql([-128, 0]);
        view.setCenter([0, 0]);

        event.originalEvent.key = 'ArrowRight';
        map.handleMapBrowserEvent(event);
        expect(spy.getCall(3).args[0].center).to.eql([128, 0]);
        view.setCenter([0, 0]);

        view.animateInternal.restore();

        done();
      });
    });
  });
});
