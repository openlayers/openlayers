import Map from '../../../../src/ol/Map.js';
import View from '../../../../src/ol/View.js';
import ZoomSlider from '../../../../src/ol/control/ZoomSlider.js';
import Event from '../../../../src/ol/events/Event.js';
import EventTarget from '../../../../src/ol/events/Target.js';

describe('ol.control.ZoomSlider', () => {
  let map, target, zoomslider;

  const createElement = document.createElement;
  function createEventElement(type) {
    const element = createElement.call(document, type);
    const eventTarget = new EventTarget();
    element.listeners_ = {};
    element.dispatching_ = {};
    element.pendingRemovals_ = {};
    element.dispatchEvent = eventTarget.dispatchEvent.bind(element);
    element.addEventListener = eventTarget.addEventListener.bind(element);
    return element;
  }

  beforeEach(() => {
    target = document.createElement('div');
    document.body.appendChild(target);
    zoomslider = new ZoomSlider();
    map = new Map({
      target: target,
      controls: [zoomslider]
    });
  });

  afterEach(() => {
    zoomslider.dispose();
    map.dispose();
    document.body.removeChild(target);
    zoomslider = null;
    map = null;
    target = null;
  });

  describe('DOM creation', () => {
    test('creates the expected DOM elements', () => {
      const zoomSliderContainers = target.querySelectorAll('.ol-zoomslider');

      expect(zoomSliderContainers.length).toBe(1);

      const zoomSliderContainer = zoomSliderContainers[0];
      expect(zoomSliderContainer instanceof HTMLDivElement).toBe(true);

      let hasUnselectableCls = zoomSliderContainer.classList.contains('ol-unselectable');
      expect(hasUnselectableCls).toBe(true);

      const zoomSliderThumbs = zoomSliderContainer.querySelectorAll('.ol-zoomslider-thumb');
      expect(zoomSliderThumbs.length).toBe(1);

      const zoomSliderThumb = zoomSliderThumbs[0];
      expect(zoomSliderThumb instanceof HTMLButtonElement).toBe(true);

      hasUnselectableCls = zoomSliderThumb.classList.contains('ol-unselectable');
      expect(hasUnselectableCls).toBe(true);
    });

  });

  describe('#initSlider_', () => {
    test('sets limits', () => {
      zoomslider.initSlider_();
      expect(zoomslider.widthLimit_).not.toBe(0);
      expect(zoomslider.heightLimit_).toBe(0);
    });
  });

  describe('#direction_', () => {
    test('is horizontal for wide containers', () => {
      const control = new ZoomSlider({});
      control.element.style.width = '1000px';
      control.element.style.height = '10px';
      control.setMap(map);
      control.initSlider_();

      const horizontal = 1;
      expect(control.direction_).toBe(horizontal);

      control.dispose();
    });

    test('is vertical for tall containers', () => {
      const control = new ZoomSlider({});
      control.element.style.width = '10px';
      control.element.style.height = '1000px';

      control.setMap(map);

      const vertical = 0;
      expect(control.direction_).toBe(vertical);

      control.dispose();
    });
  });

  describe('Pointer event handling', () => {
    let map;

    beforeEach(() => {
      map = new Map({
        target: createMapDiv(500, 100),
        view: new View({
          center: [0, 0],
          resolutions: [16, 8, 4, 2, 1, 0.5, 0.25, 0.125, 0.0625]
        })
      });
    });
    afterEach(() => {
      disposeMap(map);
    });

    test('[horizontal] handles a drag sequence', () => {
      document.createElement = createEventElement;
      const control = new ZoomSlider();
      map.addControl(control);
      document.createElement = createElement;
      map.getView().setZoom(0);
      control.element.style.width = '500px';
      control.element.style.height = '10px';
      control.element.firstChild.style.width = '100px';
      control.element.firstChild.style.height = '10px';
      map.renderSync();
      const event = new Event();
      event.type = 'pointerdown',
      event.target = control.element.firstElementChild;
      event.clientX = control.widthLimit_;
      event.clientY = 0;
      control.element.dispatchEvent(event);
      expect(control.currentResolution_).toBe(16);
      expect(control.dragging_).toBe(true);
      expect(control.dragListenerKeys_.length).toBe(2);
      event.type = 'pointermove';
      event.clientX = 6 * control.widthLimit_ / 8;
      event.clientY = 0;
      control.element.dispatchEvent(event);
      expect(control.currentResolution_).toBe(4);
      event.type = 'pointermove';
      event.clientX = 4 * control.widthLimit_ / 8;
      event.clientY = 0;
      control.element.dispatchEvent(event);
      event.type = 'pointerup';
      control.element.dispatchEvent(event);
      expect(control.currentResolution_).toBe(1);
      expect(control.dragListenerKeys_.length).toBe(0);
      expect(control.dragging_).toBe(false);
    });
    test(
      '[horizontal] handles a drag sequence ending outside its bounds',
      () => {
        document.createElement = createEventElement;
        const control = new ZoomSlider();
        map.addControl(control);
        document.createElement = createElement;
        map.getView().setZoom(0);
        control.element.style.width = '500px';
        control.element.style.height = '10px';
        control.element.firstChild.style.width = '100px';
        control.element.firstChild.style.height = '10px';
        map.renderSync();
        const event = new Event();
        event.type = 'pointerdown';
        event.target = control.element.firstElementChild;
        event.clientX = control.widthLimit_;
        event.clientY = 0;
        control.element.dispatchEvent(event);
        expect(control.currentResolution_).toBe(16);
        expect(control.dragging_).toBe(true);
        expect(control.dragListenerKeys_.length).toBe(2);
        event.type = 'pointermove';
        event.clientX = 6 * control.widthLimit_ / 8;
        event.clientY = 0;
        control.element.dispatchEvent(event);
        expect(control.currentResolution_).toBe(4);
        event.type = 'pointermove';
        event.clientX = 12 * control.widthLimit_ / 8;
        event.clientY = 0;
        control.element.dispatchEvent(event);
        event.type = 'pointerup';
        event.target = 'document';
        control.element.dispatchEvent(event);
        expect(control.dragListenerKeys_.length).toBe(0);
        expect(control.dragging_).toBe(false);
        expect(control.currentResolution_).toBe(16);
      }
    );
    test('[vertical] handles a drag sequence', () => {
      document.createElement = createEventElement;
      const control = new ZoomSlider();
      control.element.style.width = '10px';
      control.element.style.height = '100px';
      control.element.firstChild.style.width = '10px';
      control.element.firstChild.style.height = '20px';
      map.addControl(control);
      document.createElement = createElement;
      map.getView().setZoom(8);
      map.renderSync();
      const event = new Event();
      event.type = 'pointerdown';
      event.target = control.element.firstElementChild;
      event.clientX = 0;
      event.clientY = 0;
      control.element.dispatchEvent(event);
      expect(control.currentResolution_).toBe(0.0625);
      expect(control.dragging_).toBe(true);
      expect(control.dragListenerKeys_.length).toBe(2);
      event.type = 'pointermove';
      event.clientX = 0;
      event.clientY = 2 * control.heightLimit_ / 8;
      control.element.dispatchEvent(event);
      expect(control.currentResolution_).toBe(0.25);
      event.type = 'pointermove';
      event.clientX = 0;
      event.clientY = 4 * control.heightLimit_ / 8;
      control.element.dispatchEvent(event);
      event.type = 'pointerup';
      control.element.dispatchEvent(event);
      expect(control.currentResolution_).toBe(1);
      expect(control.dragListenerKeys_.length).toBe(0);
      expect(control.dragging_).toBe(false);
    });
    test(
      '[vertical] handles a drag sequence ending outside its bounds',
      () => {
        document.createElement = createEventElement;
        const control = new ZoomSlider();
        control.element.style.width = '10px';
        control.element.style.height = '100px';
        control.element.firstChild.style.width = '10px';
        control.element.firstChild.style.height = '20px';
        map.addControl(control);
        document.createElement = createElement;
        map.getView().setZoom(8);
        map.renderSync();
        const event = new Event();
        event.type = 'pointerdown';
        event.target = control.element.firstElementChild;
        event.clientX = 0;
        event.clientY = 0;
        control.element.dispatchEvent(event);
        expect(control.currentResolution_).toBe(0.0625);
        expect(control.dragging_).toBe(true);
        expect(control.dragListenerKeys_.length).toBe(2);
        event.type = 'pointermove';
        event.clientX = 0;
        event.clientY = 2 * control.heightLimit_ / 8;
        control.element.dispatchEvent(event);
        expect(control.currentResolution_).toBe(0.25);
        event.type = 'pointermove';
        event.clientX = 0;
        event.clientY = 12 * control.heightLimit_ / 8;
        control.element.dispatchEvent(event);
        event.type = 'pointerup';
        control.element.dispatchEvent(event);
        expect(control.currentResolution_).toBe(16);
        expect(control.dragListenerKeys_.length).toBe(0);
        expect(control.dragging_).toBe(false);
      }
    );
  });

});
