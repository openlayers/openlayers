import Disposable from '../../../../src/ol/Disposable.js';
import Map from '../../../../src/ol/Map.js';
import MapRenderer from '../../../../src/ol/renderer/Map.js';


describe('ol.renderer.Map', function() {

  describe('constructor', function() {

    it('createst an instance', function() {
      var map = new Map({});
      var renderer = new MapRenderer(null, map);
      expect(renderer).to.be.a(MapRenderer);
      expect(renderer).to.be.a(Disposable);
      renderer.dispose();
      map.dispose();
    });

  });

});
