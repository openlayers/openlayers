goog.provide('ol.test.format.IGC');

goog.require('ol.format.IGC');
goog.require('ol.Feature');
goog.require('ol.proj');


describe('ol.format.IGC', function() {

  var format;
  var igc =
      'AFLY05094\n' +
      'HFDTE190411\n' +
      'HFFXA100\n' +
      'HFPLTPILOT:Tom Payne\n' +
      'HFGTYGLIDERTYPE:Axis Mercury\n' +
      'HFGIDGLIDERID:\n' +
      'HFDTM100GPSDATUM:WGS84\n' +
      'HFGPSGPS:FURUNO GH-80\n' +
      'HFRFWFIRMWAREVERSION:1.22\n' +
      'HFRHWHARDWAREVERSION:1.00\n' +
      'HFFTYFRTYPE:FLYTEC,5020\n' +
      'I013638TAS\n' +
      'B0848484556256N00651095EA0205102039000\n' +
      'B0855534556037N00651011EA0259302513000\n' +
      'B0903354554964N00648049EA0272402758000\n' +
      'B0848484556256N00651095EA0205102039000\n' +
      'GAB890A77AFE5CE63979AF6B1BED7F07D\n' +
      'G62BB282E44D63A1149EF2F5E8AF6F2F1\n' +
      'GEC14381987B15F81003EDE1E01A47843\n' +
      'G60189641B00B00800019000000000000';

  beforeEach(function() {
    format = new ol.format.IGC();
  });

  describe('#readProjectionFromText', function() {
    it('returns the default projection', function() {
      var projection = format.readProjectionFromText(igc);
      expect(projection).to.eql(ol.proj.get('EPSG:4326'));
    });
  });

  describe('#readFeature', function() {
    it('does not read invalid features', function() {
      expect(format.readFeature('invalid')).to.be(null);
    });

    it('does read a feature', function() {
      var feature = format.readFeature(igc);
      expect(feature).to.be.an(ol.Feature);
      var geom = feature.getGeometry();
      expect(geom.getType()).to.eql('LineString');
      expect(geom.getCoordinates()).to.eql([
        [6.851583333333333, 45.9376, 1303202928],
        [6.850183333333334, 45.93395, 1303203353],
        [6.800816666666667, 45.916066666666666, 1303203815],
        [6.851583333333333, 45.9376, 1303289328]]);
    });

    it('does transform and read a feature', function() {
      var feature = format.readFeature(igc, {
        featureProjection: 'EPSG:3857'
      });
      expect(feature).to.be.an(ol.Feature);
      var geom = feature.getGeometry();
      expect(geom.getType()).to.eql('LineString');

      var expectedPoint1 = ol.proj.transform(
          [6.851583333333333, 45.9376], 'EPSG:4326', 'EPSG:3857');
      expectedPoint1.push(1303202928);
      var expectedPoint2 = ol.proj.transform(
          [6.850183333333334, 45.93395], 'EPSG:4326', 'EPSG:3857');
      expectedPoint2.push(1303203353);
      var expectedPoint3 = ol.proj.transform(
          [6.800816666666667, 45.916066666666666], 'EPSG:4326', 'EPSG:3857');
      expectedPoint3.push(1303203815);
      var expectedPoint4 = ol.proj.transform(
          [6.851583333333333, 45.9376], 'EPSG:4326', 'EPSG:3857');
      expectedPoint4.push(1303289328);

      expect(geom.getCoordinates()).to.eql(
          [expectedPoint1, expectedPoint2, expectedPoint3, expectedPoint4]);
    });

  });

  describe('#readFeatures', function() {

    it('does not read invalid features', function() {
      expect(format.readFeatures('invalid')).to.be.empty();
    });

    it('does read features', function() {
      var features = format.readFeatures(igc);
      expect(features.length).to.eql(1);
      var feature = features[0];
      expect(feature).to.be.an(ol.Feature);
      var geom = feature.getGeometry();
      expect(geom.getType()).to.eql('LineString');
      expect(geom.getCoordinates()).to.eql([
        [6.851583333333333, 45.9376, 1303202928],
        [6.850183333333334, 45.93395, 1303203353],
        [6.800816666666667, 45.916066666666666, 1303203815],
        [6.851583333333333, 45.9376, 1303289328]]);
    });

    it('does transform and read features', function() {
      var features = format.readFeatures(igc, {
        featureProjection: 'EPSG:3857'
      });
      expect(features.length).to.eql(1);
      var feature = features[0];
      expect(feature).to.be.an(ol.Feature);
      var geom = feature.getGeometry();
      expect(geom.getType()).to.eql('LineString');

      var expectedPoint1 = ol.proj.transform(
          [6.851583333333333, 45.9376], 'EPSG:4326', 'EPSG:3857');
      expectedPoint1.push(1303202928);
      var expectedPoint2 = ol.proj.transform(
          [6.850183333333334, 45.93395], 'EPSG:4326', 'EPSG:3857');
      expectedPoint2.push(1303203353);
      var expectedPoint3 = ol.proj.transform(
          [6.800816666666667, 45.916066666666666], 'EPSG:4326', 'EPSG:3857');
      expectedPoint3.push(1303203815);
      var expectedPoint4 = ol.proj.transform(
          [6.851583333333333, 45.9376], 'EPSG:4326', 'EPSG:3857');
      expectedPoint4.push(1303289328);

      expect(geom.getCoordinates()).to.eql(
          [expectedPoint1, expectedPoint2, expectedPoint3, expectedPoint4]);
    });
  });

});
