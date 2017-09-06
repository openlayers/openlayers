

import _ol_Feature_ from '../../../src/ol/feature';
import _ol_VectorImageTile_ from '../../../src/ol/vectorimagetile';
import _ol_VectorTile_ from '../../../src/ol/vectortile';
import _ol_events_ from '../../../src/ol/events';
import _ol_format_TextFeature_ from '../../../src/ol/format/textfeature';
import _ol_proj_ from '../../../src/ol/proj';
import _ol_proj_Projection_ from '../../../src/ol/proj/projection';


describe('ol.VectorTile', function() {

  it('loader sets features on the tile and updates proj units', function(done) {
    // mock format that return a tile-pixels feature
    var format = new _ol_format_TextFeature_();
    format.readProjection = function(source) {
      return new _ol_proj_Projection_({
        code: '',
        units: 'tile-pixels'
      });
    };
    format.readFeatures = function(source, options) {
      return [new _ol_Feature_()];
    };

    var tile = new _ol_VectorTile_([0, 0, 0], null, null, format);
    var url = 'spec/ol/data/point.json';

    _ol_VectorImageTile_.defaultLoadFunction(tile, url);
    var loader = tile.loader_;
    _ol_events_.listen(tile, 'change', function(e) {
      expect(tile.getFeatures().length).to.be.greaterThan(0);
      expect(tile.getProjection().getUnits()).to.be('tile-pixels');
      done();
    });
    loader.call(tile, [], 1, _ol_proj_.get('EPSG:3857'));
  });

});
