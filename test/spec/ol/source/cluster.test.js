

import _ol_Feature_ from '../../../../src/ol/feature';
import _ol_geom_LineString_ from '../../../../src/ol/geom/linestring';
import _ol_geom_Point_ from '../../../../src/ol/geom/point';
import _ol_geom_Polygon_ from '../../../../src/ol/geom/polygon';
import _ol_proj_ from '../../../../src/ol/proj';
import _ol_source_Cluster_ from '../../../../src/ol/source/cluster';
import _ol_source_Source_ from '../../../../src/ol/source/source';
import _ol_source_Vector_ from '../../../../src/ol/source/vector';

describe('ol.source.Cluster', function() {

  describe('constructor', function() {
    it('returns a cluster source', function() {
      var source = new _ol_source_Cluster_({
        projection: _ol_proj_.get('EPSG:4326'),
        source: new _ol_source_Vector_()
      });
      expect(source).to.be.a(_ol_source_Source_);
      expect(source).to.be.a(_ol_source_Cluster_);
      expect(source.getDistance()).to.be(20);
    });
  });

  describe('#loadFeatures', function() {
    var extent = [-1, -1, 1, 1];
    var projection = _ol_proj_.get('EPSG:3857');
    it('clusters a source with point features', function() {
      var source = new _ol_source_Cluster_({
        source: new _ol_source_Vector_({
          features: [
            new _ol_Feature_(new _ol_geom_Point_([0, 0])),
            new _ol_Feature_(new _ol_geom_Point_([0, 0]))
          ]
        })
      });
      source.loadFeatures(extent, 1, projection);
      expect(source.getFeatures().length).to.be(1);
      expect(source.getFeatures()[0].get('features').length).to.be(2);
    });
    it('clusters with a custom geometryFunction', function() {
      var source = new _ol_source_Cluster_({
        geometryFunction: function(feature) {
          var geom = feature.getGeometry();
          if (geom.getType() == 'Point') {
            return geom;
          } else if (geom.getType() == 'Polygon') {
            return geom.getInteriorPoint();
          }
          return null;
        },
        source: new _ol_source_Vector_({
          features: [
            new _ol_Feature_(new _ol_geom_Point_([0, 0])),
            new _ol_Feature_(new _ol_geom_LineString_([[0, 0], [1, 1]])),
            new _ol_Feature_(new _ol_geom_Polygon_(
                [[[-1, -1], [-1, 1], [1, 1], [1, -1], [-1, -1]]]))
          ]
        })
      });
      source.loadFeatures(extent, 1, projection);
      expect(source.getFeatures().length).to.be(1);
      expect(source.getFeatures()[0].get('features').length).to.be(2);
    });
  });

  describe('#setDistance', function() {
    it('changes the distance value', function() {
      var source = new _ol_source_Cluster_({
        distance: 100,
        source: new _ol_source_Vector_()
      });
      expect(source.getDistance()).to.be(100);
      source.setDistance(10);
      expect(source.getDistance()).to.be(10);
    });
  });

});
