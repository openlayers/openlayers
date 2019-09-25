import Disposable from '../../../../src/ol/Disposable.js';
import Map from '../../../../src/ol/Map.js';
import MapRenderer from '../../../../src/ol/renderer/Map.js';


describe('ol.renderer.Map', () => {

  describe('constructor', () => {

    test('createst an instance', () => {
      const map = new Map({});
      const renderer = new MapRenderer(null, map);
      expect(renderer).toBeInstanceOf(MapRenderer);
      expect(renderer).toBeInstanceOf(Disposable);
      renderer.dispose();
      map.dispose();
    });

  });

});
