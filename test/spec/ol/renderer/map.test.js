import _ol_Disposable_ from '../../../../src/ol/Disposable.js';
import _ol_Map_ from '../../../../src/ol/Map.js';
import _ol_renderer_Map_ from '../../../../src/ol/renderer/Map.js';


describe('ol.renderer.Map', function() {

  describe('constructor', function() {

    it('createst an instance', function() {
      var map = new _ol_Map_({});
      var renderer = new _ol_renderer_Map_(null, map);
      expect(renderer).to.be.a(_ol_renderer_Map_);
      expect(renderer).to.be.a(_ol_Disposable_);
      renderer.dispose();
      map.dispose();
    });

  });

});
