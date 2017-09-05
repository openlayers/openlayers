

import _ol_Disposable_ from '../../../../src/ol/disposable';
import _ol_Map_ from '../../../../src/ol/map';
import _ol_renderer_Map_ from '../../../../src/ol/renderer/map';


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
