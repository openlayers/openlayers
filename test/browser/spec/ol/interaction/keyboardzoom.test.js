import {spy as sinonSpy} from 'sinon';
import Map from '../../../../../src/ol/Map.js';
import MapBrowserEvent from '../../../../../src/ol/MapBrowserEvent.js';
import View from '../../../../../src/ol/View.js';
import Event from '../../../../../src/ol/events/Event.js';
import {MAC} from '../../../../../src/ol/has.js';

describe('ol.interaction.KeyboardZoom', function () {
  let map;

  beforeEach(function () {
    map = new Map({
      target: createMapDiv(100, 100),
      view: new View({
        center: [0, 0],
        resolutions: [4, 2, 1],
        zoom: 1,
      }),
    });
    map.renderSync();
  });
  afterEach(function () {
    disposeMap(map);
  });

  describe('handleEvent()', function () {
    it('zooms on + and - keys', function () {
      const view = map.getView();
      const spy = sinonSpy(view, 'animateInternal');
      const event = new MapBrowserEvent('keydown', map, {
        type: 'keydown',
        target: map.getTargetElement(),
        preventDefault: Event.prototype.preventDefault,
      });

      event.originalEvent.key = '+';
      map.handleMapBrowserEvent(event);
      expect(spy.getCall(0).args[0].resolution).to.eql(1);
      view.setResolution(2);

      event.originalEvent.key = '-';
      map.handleMapBrowserEvent(event);
      expect(spy.getCall(1).args[0].resolution).to.eql(4);
      view.setResolution(2);

      view.animateInternal.restore();
    });

    it('does nothing if the target is editable', function () {
      const view = map.getView();
      const spy = sinonSpy(view, 'animateInternal');
      const event = new MapBrowserEvent('keydown', map, {
        type: 'keydown',
        target: document.createElement('input'),
        preventDefault: Event.prototype.preventDefault,
      });

      event.originalEvent.key = '+';
      map.handleMapBrowserEvent(event);
      expect(spy.called).to.be(false);
    });

    it('does nothing if platform modifier key is pressed at the same time', function () {
      const view = map.getView();
      const spy = sinonSpy(view, 'animateInternal');
      const event = new MapBrowserEvent('keydown', map, {
        type: 'keydown',
        target: map.getTargetElement(),
        preventDefault: Event.prototype.preventDefault,
      });

      event.originalEvent.key = '+';
      if (MAC) {
        event.originalEvent.metaKey = true;
      } else {
        event.originalEvent.ctrlKey = true;
      }
      map.handleMapBrowserEvent(event);
      expect(spy.called).to.be(false);
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

    it('zooms on +/- keys', function (done) {
      // we have to wait until the map is rendered
      olMap.on('rendercomplete', () => {
        const view = map.getView();
        const spy = sinonSpy(view, 'animateInternal');
        const event = new MapBrowserEvent('keydown', map, {
          type: 'keydown',
          target: customMapEl,
          preventDefault: Event.prototype.preventDefault,
        });

        event.originalEvent.key = '+';
        olMap.handleMapBrowserEvent(event);
        expect(spy.getCall(0).args[0].resolution).to.eql(1);
        view.setResolution(2);

        event.originalEvent.key = '-';
        olMap.handleMapBrowserEvent(event);
        expect(spy.getCall(1).args[0].resolution).to.eql(4);
        view.setResolution(2);

        view.animateInternal.restore();

        done();
      });
    });
  });
});
