import Map from '../../../../src/ol/Map.js';
import MousePosition from '../../../../src/ol/control/MousePosition.js';
import View from '../../../../src/ol/View.js';

import EventType from '../../../../src/ol/events/EventType.js';

describe('ol.control.MousePosition', function() {

  describe('constructor', function() {

    it('can be constructed without arguments', function() {
      const instance = new MousePosition();
      expect(instance).to.be.an(MousePosition);
      expect(instance.element.className).to.be('ol-mouse-position');
    });

    it('creates the element with the provided class name', function() {
      const className = 'foobar';
      const instance = new MousePosition({
        className: className
      });
      expect(instance.element.className).to.be(className);
    });

  });

  describe('configuration options', function() {
    let target, map;
    const width = 360;
    const height = 180;

    beforeEach(function() {
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
          resolution: 1
        })
      });
    });
    afterEach(function() {
      map.dispose();
      document.body.removeChild(target);
    });

    function simulateEvent(type, x, y) {
      const viewport = map.getViewport();
      // calculated in case body has top < 0 (test runner with small window)
      const position = viewport.getBoundingClientRect();
      const evt = new MouseEvent(type, {
        clientX: position.left + x + width / 2,
        clientY: position.top + y + height / 2
      });
      document.querySelector('div.ol-viewport').dispatchEvent(evt);
    }

    describe('clearOnMouseOut', function() {
      it('sets div.ol-mouse-position undefinedHTML when clearOnMouseOut=true', function(done) {
        const ctrl = new MousePosition({
          undefinedHTML: 'undefined',
          clearOnMouseOut: true
        });
        ctrl.setMap(map);
        map.renderSync();

        const element = document.querySelector('.ol-mouse-position', map.getTarget());
        expect(element.innerText).to.be('undefined');

        simulateEvent(EventType.MOUSEMOVE, 20, 30);
        map.renderSync();
        expect(element.innerText).to.be('20,-30');

        map.once('postrender', function() {
          expect(element.innerText).to.be('undefined');
          done();
        });
        simulateEvent(EventType.MOUSEOUT, width + 1, height + 1);
        map.renderSync();
      });

      it('keeps div.ol-mouse-position set when clearOnMouseOut=false', function(done) {
        const ctrl = new MousePosition({
          undefinedHTML: 'undefined',
          clearOnMouseOut: false
        });
        ctrl.setMap(map);
        map.renderSync();

        const element = document.querySelector('.ol-mouse-position', map.getTarget());
        expect(element.innerText).to.be('undefined');

        target.dispatchEvent(new MouseEvent('mousemove'));
        simulateEvent(EventType.MOUSEMOVE, 20, 30);
        map.renderSync();
        map.once('postrender', function() {
          expect(element.innerText).to.be('20,-30');
          done();
        });
        simulateEvent(EventType.MOUSEOUT, width + 1, height + 1);
        map.renderSync();
      });
    });
  });
});
