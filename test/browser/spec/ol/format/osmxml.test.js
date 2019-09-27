import {assert} from 'chai';
import Feature from '../../../../../src/ol/Feature.js';
import OSMXML from '../../../../../src/ol/format/OSMXML.js';
import LineString from '../../../../../src/ol/geom/LineString.js';
import Point from '../../../../../src/ol/geom/Point.js';
import {get as getProjection, transform} from '../../../../../src/ol/proj.js';

describe('ol.format.OSMXML', function () {
  let format;
  beforeEach(function () {
    format = new OSMXML();
  });

  describe('#readProjection', function () {
    it('returns the default projection from document', function () {
      const projection = format.readProjectionFromDocument();
      assert.deepEqual(projection, getProjection('EPSG:4326'));
    });

    it('returns the default projection from node', function () {
      const projection = format.readProjectionFromNode();
      assert.deepEqual(projection, getProjection('EPSG:4326'));
    });
  });

  describe('#readFeatures', function () {
    it('can read an empty document', function () {
      const text =
        '<?xml version="1.0" encoding="UTF-8"?>' +
        '<osm version="0.6" generator="my hand">' +
        '</osm>';
      const fs = format.readFeatures(text);
      assert.lengthOf(fs, 0);
    });

    it('can read nodes', function () {
      const text =
        '<?xml version="1.0" encoding="UTF-8"?>' +
        '<osm version="0.6" generator="my hand">' +
        '  <node id="1" lat="1" lon="2">' +
        '    <tag k="name" v="1"/>' +
        '  </node>' +
        '  <node id="2" lat="3" lon="4">' +
        '    <tag k="name" v="2"/>' +
        '  </node>' +
        '</osm>';
      const fs = format.readFeatures(text);
      assert.lengthOf(fs, 2);
      const f = fs[0];
      assert.instanceOf(f, Feature);
      const g = f.getGeometry();
      assert.instanceOf(g, Point);
      assert.deepEqual(g.getCoordinates(), [2, 1]);
    });

    it('can read nodes and ways', function () {
      const text =
        '<?xml version="1.0" encoding="UTF-8"?>' +
        '<osm version="0.6" generator="my hand">' +
        '  <node id="1" lat="1" lon="2">' +
        '    <tag k="name" v="1"/>' +
        '  </node>' +
        '  <node id="2" lat="3" lon="4">' +
        '    <tag k="name" v="2"/>' +
        '  </node>' +
        '  <way id="3">' +
        '    <tag k="name" v="3"/>' +
        '    <nd ref="1" />' +
        '    <nd ref="2" />' +
        '  </way>' +
        '</osm>';
      const fs = format.readFeatures(text);
      assert.lengthOf(fs, 3);
      const point = fs[0];
      assert.instanceOf(point, Feature);
      let g = point.getGeometry();
      assert.instanceOf(g, Point);
      assert.deepEqual(g.getCoordinates(), [2, 1]);
      const line = fs[2];
      assert.instanceOf(line, Feature);
      g = line.getGeometry();
      assert.instanceOf(g, LineString);
      assert.deepEqual(g.getCoordinates(), [
        [2, 1],
        [4, 3],
      ]);
    });

    it('can read ways before nodes', function () {
      const text =
        '<?xml version="1.0" encoding="UTF-8"?>' +
        '<osm version="0.6" generator="my hand">' +
        '  <way id="3">' +
        '    <tag k="name" v="3"/>' +
        '    <nd ref="1" />' +
        '    <nd ref="2" />' +
        '  </way>' +
        '  <node id="1" lat="1" lon="2">' +
        '    <tag k="name" v="1"/>' +
        '  </node>' +
        '  <node id="2" lat="3" lon="4">' +
        '    <tag k="name" v="2"/>' +
        '  </node>' +
        '</osm>';
      const fs = format.readFeatures(text);
      assert.lengthOf(fs, 3);
      const line = fs[2];
      assert.instanceOf(line, Feature);
      const g = line.getGeometry();
      assert.instanceOf(g, LineString);
      assert.deepEqual(g.getCoordinates(), [
        [2, 1],
        [4, 3],
      ]);
    });

    it('can read coordinates from ways', function () {
      const text =
        '<?xml version="1.0" encoding="UTF-8"?>' +
        '<osm version="0.6" generator="my hand">' +
        '  <way id="3">' +
        '    <tag k="name" v="3"/>' +
        '    <nd ref="1" lat="1" lon="2" />' +
        '    <nd ref="2" lat="3" lon="4" />' +
        '  </way>' +
        '</osm>';
      const fs = format.readFeatures(text);
      assert.lengthOf(fs, 1);
      const line = fs[0];
      assert.instanceOf(line, Feature);
      const g = line.getGeometry();
      assert.instanceOf(g, LineString);
      assert.deepEqual(g.getCoordinates(), [
        [2, 1],
        [4, 3],
      ]);
    });

    it('can transform and read nodes', function () {
      const text =
        '<?xml version="1.0" encoding="UTF-8"?>' +
        '<osm version="0.6" generator="my hand">' +
        '  <node id="1" lat="1" lon="2">' +
        '    <tag k="name" v="1"/>' +
        '  </node>' +
        '  <node id="2" lat="3" lon="4">' +
        '    <tag k="name" v="2"/>' +
        '  </node>' +
        '</osm>';
      const fs = format.readFeatures(text, {
        featureProjection: 'EPSG:3857',
      });
      assert.lengthOf(fs, 2);
      const f = fs[0];
      assert.instanceOf(f, Feature);
      const g = f.getGeometry();
      assert.instanceOf(g, Point);
      assert.deepEqual(
        g.getCoordinates(),
        transform([2, 1], 'EPSG:4326', 'EPSG:3857'),
      );
    });
  });
});
