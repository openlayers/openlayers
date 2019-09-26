import {Map, View} from '../../../src/ol/index.js';
import MapBrowserEvent from '../../../src/ol/MapBrowserEvent.js';
import Event from '../../../src/ol/events/Event.js';
import {useGeographic, clearUserProjection} from '../../../src/ol/proj.js';

function createMap() {
  const size = 256;
  const target = document.createElement('div');
  Object.assign(target.style, {
    width: `${size}px`,
    height: `${size}px`,
    position: 'absolute',
    top: 0,
    left: 0
  });
  document.body.appendChild(target);

  const map = new Map({
    target: target,
    view: new View({
      center: [0, 0],
      zoom: 0
    })
  });
  return {map, target, size};
}


describe('ol/MapBrowserEvent', function() {

  describe('pixel', function() {
    let ref;
    beforeEach(() => {
      ref = createMap();
    });

    afterEach(() => {
      ref.map.dispose();
      document.body.removeChild(ref.target);
    });

    it('is the pixel position of the event', () => {
      const x = 10;
      const y = 15;

      const event = new Event();
      event.clientX = x;
      event.clientY = y;
      const mapEvent = new MapBrowserEvent('test', ref.map, event);

      expect(mapEvent.pixel).to.eql([x, y]);
    });

    it('is settable', () => {
      const x = 10;
      const y = 15;

      const event = new Event();
      event.clientX = x;
      event.clientY = y;
      const mapEvent = new MapBrowserEvent('test', ref.map, event);

      expect(mapEvent.pixel).to.eql([x, y]);

      const pixel = [x + 5, y + 5];
      mapEvent.pixel = pixel;
      expect(mapEvent.pixel).to.eql(pixel);
    });

  });

  describe('coordinate', function() {
    let ref;
    beforeEach(() => {
      ref = createMap();
      ref.map.renderSync();
    });

    afterEach(() => {
      ref.map.dispose();
      document.body.removeChild(ref.target);
    });

    it('is the map coordinate of the event', () => {
      const x = ref.size / 2;
      const y = ref.size / 2;

      const event = new Event();
      event.clientX = x;
      event.clientY = y;
      const mapEvent = new MapBrowserEvent('test', ref.map, event);

      expect(mapEvent.coordinate).to.eql([0, 0]);
    });

    it('is settable', () => {
      const x = ref.size / 2;
      const y = ref.size / 2;

      const event = new Event();
      event.clientX = x;
      event.clientY = y;
      const mapEvent = new MapBrowserEvent('test', ref.map, event);

      expect(mapEvent.coordinate).to.eql([0, 0]);

      const coordinate = [1, 2];
      mapEvent.coordinate = coordinate;
      expect(mapEvent.coordinate).to.eql(coordinate);
    });

  });

  describe('coordinate - with useGeographic()', function() {
    let ref;
    beforeEach(() => {
      useGeographic();
      ref = createMap();
      ref.map.renderSync();
    });

    afterEach(() => {
      clearUserProjection();
      ref.map.dispose();
      document.body.removeChild(ref.target);
    });

    it('is the geographic coordinate of the event', () => {
      const x = ref.size / 4;
      const y = ref.size / 4;

      const event = new Event();
      event.clientX = x;
      event.clientY = y;
      const mapEvent = new MapBrowserEvent('test', ref.map, event);

      const coord = mapEvent.coordinate;
      expect(coord[0]).to.be(-90);
      expect(coord[1]).to.roughlyEqual(66.5132, 1e-4);
    });

  });
});
