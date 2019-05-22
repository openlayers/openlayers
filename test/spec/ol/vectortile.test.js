import {defaultLoadFunction} from '../../../src/ol/source/VectorTile.js';
import VectorTile from '../../../src/ol/VectorTile.js';
import {listen} from '../../../src/ol/events.js';
import GeoJSON from '../../../src/ol/format/GeoJSON.js';
import MVT from '../../../src/ol/format/MVT.js';
import {get as getProjection} from '../../../src/ol/proj.js';
import {createXYZ} from '../../../src/ol/tilegrid.js';


describe('ol.VectorTile', function() {

  it('loader reprojects GeoJSON features', function(done) {
    const format = new GeoJSON();
    const tile = new VectorTile([0, 0, 0], null, null, format);
    const url = 'spec/ol/data/point.json';
    defaultLoadFunction(tile, url);
    const loader = tile.loader_;
    listen(tile, 'change', function(e) {
      expect(tile.getFeatures()[0].getGeometry().getFlatCoordinates()).to.eql([-9724792.346778862, 4164041.638405114]);
      done();
    });
    loader.call(tile, [], 1, getProjection('EPSG:3857'));
  });

  it('loader reprojects MVT features', function(done) {
    const format = new MVT();
    const tileGrid = createXYZ({
      tileSize: 512
    });
    const tile = new VectorTile([14, 8938, 5680], null, null, format);
    const url = 'spec/ol/data/14-8938-5680.vector.pbf';
    defaultLoadFunction(tile, url);
    const loader = tile.loader_;
    listen(tile, 'change', function(e) {
      expect(tile.getFeatures()[1246].getGeometry().getFlatCoordinates()).to.eql([1827804.0218549764, 6144812.116688028]);
      done();
    });
    const extent = tileGrid.getTileCoordExtent(tile.tileCoord);
    loader.call(tile, extent, 1, getProjection('EPSG:3857'));
  });


});
