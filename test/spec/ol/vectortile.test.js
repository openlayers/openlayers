import Feature from '../../../src/ol/Feature.js';
import {defaultLoadFunction} from '../../../src/ol/VectorImageTile.js';
import VectorTile from '../../../src/ol/VectorTile.js';
import _ol_events_ from '../../../src/ol/events.js';
import TextFeature from '../../../src/ol/format/TextFeature.js';
import {get as getProjection} from '../../../src/ol/proj.js';
import Projection from '../../../src/ol/proj/Projection.js';


describe('ol.VectorTile', function() {

  it('loader sets features on the tile and updates proj units', function(done) {
    // mock format that return a tile-pixels feature
    var format = new TextFeature();
    format.readProjection = function(source) {
      return new Projection({
        code: '',
        units: 'tile-pixels'
      });
    };
    format.readFeatures = function(source, options) {
      return [new Feature()];
    };

    var tile = new VectorTile([0, 0, 0], null, null, format);
    var url = 'spec/ol/data/point.json';

    defaultLoadFunction(tile, url);
    var loader = tile.loader_;
    _ol_events_.listen(tile, 'change', function(e) {
      expect(tile.getFeatures().length).to.be.greaterThan(0);
      expect(tile.getProjection().getUnits()).to.be('tile-pixels');
      done();
    });
    loader.call(tile, [], 1, getProjection('EPSG:3857'));
  });

});
