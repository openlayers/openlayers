import Map from '../../../../src/ol/Map.js';
import View from '../../../../src/ol/View.js';
import MapBrowserEvent from '../../../../src/ol/MapBrowserEvent.js';
import {primaryAction} from '../../../../src/ol/events/condition.js';
import {preventDefault} from '../../../../src/ol/events/Event.js';

describe('ol/events/condition', function() {
  let target, map;

  beforeEach(function(done) {
    target = document.createElement('div');
    const style = target.style;
    style.position = 'absolute';
    style.left = '-1000px';
    style.top = '-1000px';
    style.width = '360px';
    style.height =  '180px';
    document.body.appendChild(target);
    map = new Map({
      target: target,
      view: new View({
        projection: 'EPSG:4326',
        center: [0, 0],
        resolution: 1
      })
    });
    map.once('postrender', function() {
      done();
    });
  });

  afterEach(function() {
    map.dispose();
    document.body.removeChild(target);
  });

  describe('primaryAction', function() {
    it('works with wheel events', function() {
      const event = new MapBrowserEvent('wheel', map, {
        type: 'wheel',
        deltaMode: WheelEvent.DOM_DELTA_PIXEL,
        deltaY: 1,
        target: document,
        preventDefault: preventDefault
      });
      expect(primaryAction(event)).to.be(false);
    });
  });

});
