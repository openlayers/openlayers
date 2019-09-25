import Feature from '../../../../src/ol/Feature.js';
import OSMXML from '../../../../src/ol/format/OSMXML.js';
import Point from '../../../../src/ol/geom/Point.js';
import LineString from '../../../../src/ol/geom/LineString.js';
import {get as getProjection, transform} from '../../../../src/ol/proj.js';


describe('ol.format.OSMXML', () => {

  let format;
  beforeEach(() => {
    format = new OSMXML();
  });

  describe('#readProjection', () => {
    test('returns the default projection from document', () => {
      const projection = format.readProjectionFromDocument();
      expect(projection).toEqual(getProjection('EPSG:4326'));
    });

    test('returns the default projection from node', () => {
      const projection = format.readProjectionFromNode();
      expect(projection).toEqual(getProjection('EPSG:4326'));
    });
  });

  describe('#readFeatures', () => {

    test('can read an empty document', () => {
      const text =
          '<?xml version="1.0" encoding="UTF-8"?>' +
          '<osm version="0.6" generator="my hand">' +
          '</osm>';
      const fs = format.readFeatures(text);
      expect(fs).toHaveLength(0);
    });

    test('can read nodes', () => {
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
      expect(fs).toHaveLength(2);
      const f = fs[0];
      expect(f).toBeInstanceOf(Feature);
      const g = f.getGeometry();
      expect(g).toBeInstanceOf(Point);
      expect(g.getCoordinates()).toEqual([2, 1]);
    });

    test('can read nodes and ways', () => {
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
      expect(fs).toHaveLength(3);
      const point = fs[0];
      expect(point).toBeInstanceOf(Feature);
      let g = point.getGeometry();
      expect(g).toBeInstanceOf(Point);
      expect(g.getCoordinates()).toEqual([2, 1]);
      const line = fs[2];
      expect(line).toBeInstanceOf(Feature);
      g = line.getGeometry();
      expect(g).toBeInstanceOf(LineString);
      expect(g.getCoordinates()).toEqual([[2, 1], [4, 3]]);
    });


    test('can read ways before nodes', () => {
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
      expect(fs).toHaveLength(3);
      const line = fs[2];
      expect(line).toBeInstanceOf(Feature);
      const g = line.getGeometry();
      expect(g).toBeInstanceOf(LineString);
      expect(g.getCoordinates()).toEqual([[2, 1], [4, 3]]);
    });


    test('can transform and read nodes', () => {
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
        featureProjection: 'EPSG:3857'
      });
      expect(fs).toHaveLength(2);
      const f = fs[0];
      expect(f).toBeInstanceOf(Feature);
      const g = f.getGeometry();
      expect(g).toBeInstanceOf(Point);
      expect(g.getCoordinates()).toEqual(transform([2, 1], 'EPSG:4326', 'EPSG:3857'));
    });

  });

});
