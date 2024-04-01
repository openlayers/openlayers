import Feature from '../../../../../src/ol/Feature.js';
import IGC from '../../../../../src/ol/format/IGC.js';
import {get as getProjection, transform} from '../../../../../src/ol/proj.js';

describe('ol/format/IGC', function () {
  describe('2012', function () {
    let format;
    const igc =
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

    beforeEach(function () {
      format = new IGC();
    });

    describe('#readProjectionFromText', function () {
      it('returns the default projection', function () {
        const projection = format.readProjectionFromText(igc);
        expect(projection).to.eql(getProjection('EPSG:4326'));
      });
    });

    describe('#readFeature', function () {
      it('does not read invalid features', function () {
        expect(format.readFeature('invalid')).to.be(null);
      });

      it('does read a feature', function () {
        const feature = format.readFeature(igc);
        expect(feature).to.be.an(Feature);
        const geom = feature.getGeometry();
        expect(geom.getType()).to.eql('LineString');
        expect(geom.getCoordinates()).to.eql([
          [6.851583333333333, 45.9376, 1303202928],
          [6.850183333333334, 45.93395, 1303203353],
          [6.800816666666667, 45.916066666666666, 1303203815],
          [6.851583333333333, 45.9376, 1303289328],
        ]);
      });

      it('does transform and read a feature', function () {
        const feature = format.readFeature(igc, {
          featureProjection: 'EPSG:3857',
        });
        expect(feature).to.be.an(Feature);
        const geom = feature.getGeometry();
        expect(geom.getType()).to.eql('LineString');

        const expectedPoint1 = transform(
          [6.851583333333333, 45.9376],
          'EPSG:4326',
          'EPSG:3857',
        );
        expectedPoint1.push(1303202928);
        const expectedPoint2 = transform(
          [6.850183333333334, 45.93395],
          'EPSG:4326',
          'EPSG:3857',
        );
        expectedPoint2.push(1303203353);
        const expectedPoint3 = transform(
          [6.800816666666667, 45.916066666666666],
          'EPSG:4326',
          'EPSG:3857',
        );
        expectedPoint3.push(1303203815);
        const expectedPoint4 = transform(
          [6.851583333333333, 45.9376],
          'EPSG:4326',
          'EPSG:3857',
        );
        expectedPoint4.push(1303289328);

        expect(geom.getCoordinates()).to.eql([
          expectedPoint1,
          expectedPoint2,
          expectedPoint3,
          expectedPoint4,
        ]);
      });
    });

    describe('#readFeatures', function () {
      it('does not read invalid features', function () {
        expect(format.readFeatures('invalid')).to.be.empty();
      });

      it('does read features', function () {
        const features = format.readFeatures(igc);
        expect(features.length).to.eql(1);
        const feature = features[0];
        expect(feature).to.be.an(Feature);
        const geom = feature.getGeometry();
        expect(geom.getType()).to.eql('LineString');
        expect(geom.getCoordinates()).to.eql([
          [6.851583333333333, 45.9376, 1303202928],
          [6.850183333333334, 45.93395, 1303203353],
          [6.800816666666667, 45.916066666666666, 1303203815],
          [6.851583333333333, 45.9376, 1303289328],
        ]);
      });

      it('does transform and read features', function () {
        const features = format.readFeatures(igc, {
          featureProjection: 'EPSG:3857',
        });
        expect(features.length).to.eql(1);
        const feature = features[0];
        expect(feature).to.be.an(Feature);
        const geom = feature.getGeometry();
        expect(geom.getType()).to.eql('LineString');

        const expectedPoint1 = transform(
          [6.851583333333333, 45.9376],
          'EPSG:4326',
          'EPSG:3857',
        );
        expectedPoint1.push(1303202928);
        const expectedPoint2 = transform(
          [6.850183333333334, 45.93395],
          'EPSG:4326',
          'EPSG:3857',
        );
        expectedPoint2.push(1303203353);
        const expectedPoint3 = transform(
          [6.800816666666667, 45.916066666666666],
          'EPSG:4326',
          'EPSG:3857',
        );
        expectedPoint3.push(1303203815);
        const expectedPoint4 = transform(
          [6.851583333333333, 45.9376],
          'EPSG:4326',
          'EPSG:3857',
        );
        expectedPoint4.push(1303289328);

        expect(geom.getCoordinates()).to.eql([
          expectedPoint1,
          expectedPoint2,
          expectedPoint3,
          expectedPoint4,
        ]);
      });
    });
  });

  describe('2024', function () {
    let format;
    const igc =
      'AXCT09a66af0dfb5a1b7\n' +
      'HFFTYFRTYPE:Xiaomi 21061119DG 11\n' +
      'HFRFWFIRMWAREVERSION:0.9.10.6\n' +
      'HFPLTPILOTINCHARGE:\n' +
      'HOSITSite:Cuges Sud\n' +
      'HOCCLCOMPETITION CLASS:FAI-3\n' +
      'HFGTYGLIDERTYPE:OZONE Alpina 4\n' +
      'HODTM100GPSDATUM:WGS-84\n' +
      'HFALPALTPRESSURE:ISA\n' +
      'HFALG:GEO\n' +
      'HFDTEDATE:070324,02\n' +
      'I023636LAD3737LOD\n' +
      'B1221394319216N00549692EA000000064468\n' +
      'B1221594319220N00549691EA000000064605\n' +
      'B1222014319222N00549692EA000000064632\n' +
      'B1222084319226N00549694EA000000064613\n' +
      'B1222164319231N00549696EA000000064758\n' +
      'B1222244319237N00549698EA000000064701\n' +
      'B1222324319243N00549699EA000000065003\n' +
      'B1222494319252N00549700EA000000065148\n' +
      'B1222574319257N00549703EA000000065192\n' +
      'B1223134319267N00549707EA000000065033\n' +
      'B1223244319268N00549708EA000000065096\n' +
      'B1223384319278N00549717EA000000065319\n' +
      'B1223474319278N00549721EA000000065471\n' +
      'B1223594319283N00549730EA000000066208\n' +
      'B1224114319282N00549731EA000000066285\n' +
      'G7340FBEC83CC325B72B2F4F20E92ABD8CD127C22511EF61EA7ABEEE2510A35FB\n' +
      'GA4577265D3C7FC1DB1ED8EB68F37485B37B88D5FAEE61910A53E8E88AF5BC9F3\n' +
      'G85B857F950D56BFEFC11568C135B1A71D022DF2BF80CB03D9E6209F7D0107451\n' +
      'G98029586E5F5A40DE8819F0CD045EAC246C684B4BEAD813CF92C24C671C5D3BB';

    beforeEach(function () {
      format = new IGC();
    });

    describe('#readProjectionFromText', function () {
      it('returns the default projection', function () {
        const projection = format.readProjectionFromText(igc);
        expect(projection).to.eql(getProjection('EPSG:4326'));
      });
    });

    describe('#readFeature', function () {
      it('does not read invalid features', function () {
        expect(format.readFeature('invalid')).to.be(null);
      });

      it('does read a feature', function () {
        const feature = format.readFeature(igc);
        expect(feature).to.be.an(Feature);
        const geom = feature.getGeometry();
        expect(geom.getType()).to.eql('LineString');
        expect(geom.getCoordinates()).to.eql([
          [5.828213333333333, 43.32027666666667, 1709814099],
          [5.828191666666667, 43.32033333333333, 1709814119],
          [5.828203333333333, 43.32037166666667, 1709814121],
          [5.828238333333333, 43.320435, 1709814128],
          [5.82828, 43.320525, 1709814136],
          [5.828301666666667, 43.320616666666666, 1709814144],
          [5.828321666666667, 43.32071666666667, 1709814152],
          [5.828346666666667, 43.32087333333333, 1709814169],
          [5.828386666666666, 43.320965, 1709814177],
          [5.828455, 43.32112166666667, 1709814193],
          [5.828476666666666, 43.32114833333333, 1709814204],
          [5.828631666666667, 43.32130166666667, 1709814218],
          [5.828685, 43.321311666666666, 1709814227],
          [5.828846666666667, 43.32138333333333, 1709814239],
          [5.828858333333334, 43.321380000000005, 1709814251],
        ]);
      });

      it('does transform and read a feature', function () {
        const feature = format.readFeature(igc, {
          featureProjection: 'EPSG:3857',
        });
        expect(feature).to.be.an(Feature);
        const geom = feature.getGeometry();
        expect(geom.getType()).to.eql('LineString');

        const expectedPoint1 = transform(
          [5.828213333333333, 43.32027666666667],
          'EPSG:4326',
          'EPSG:3857',
        );
        expectedPoint1.push(1709814099);
        const expectedPoint2 = transform(
          [5.828191666666667, 43.32033333333333],
          'EPSG:4326',
          'EPSG:3857',
        );
        expectedPoint2.push(1709814119);
        const expectedPoint3 = transform(
          [5.828203333333333, 43.32037166666667],
          'EPSG:4326',
          'EPSG:3857',
        );
        expectedPoint3.push(1709814121);
        const expectedPoint4 = transform(
          [5.828238333333333, 43.320435],
          'EPSG:4326',
          'EPSG:3857',
        );
        expectedPoint4.push(1709814128);
        const expectedPoint5 = transform(
          [5.82828, 43.320525],
          'EPSG:4326',
          'EPSG:3857',
        );
        expectedPoint5.push(1709814136);
        const expectedPoint6 = transform(
          [5.828301666666667, 43.320616666666666],
          'EPSG:4326',
          'EPSG:3857',
        );
        expectedPoint6.push(1709814144);
        const expectedPoint7 = transform(
          [5.828321666666667, 43.32071666666667],
          'EPSG:4326',
          'EPSG:3857',
        );
        expectedPoint7.push(1709814152);
        const expectedPoint8 = transform(
          [5.828346666666667, 43.32087333333333],
          'EPSG:4326',
          'EPSG:3857',
        );
        expectedPoint8.push(1709814169);
        const expectedPoint9 = transform(
          [5.828386666666666, 43.320965],
          'EPSG:4326',
          'EPSG:3857',
        );
        expectedPoint9.push(1709814177);
        const expectedPoint10 = transform(
          [5.828455, 43.32112166666667],
          'EPSG:4326',
          'EPSG:3857',
        );
        expectedPoint10.push(1709814193);
        const expectedPoint11 = transform(
          [5.828476666666666, 43.32114833333333],
          'EPSG:4326',
          'EPSG:3857',
        );
        expectedPoint11.push(1709814204);
        const expectedPoint12 = transform(
          [5.828631666666667, 43.32130166666667],
          'EPSG:4326',
          'EPSG:3857',
        );
        expectedPoint12.push(1709814218);
        const expectedPoint13 = transform(
          [5.828685, 43.321311666666666],
          'EPSG:4326',
          'EPSG:3857',
        );
        expectedPoint13.push(1709814227);
        const expectedPoint14 = transform(
          [5.828846666666667, 43.32138333333333],
          'EPSG:4326',
          'EPSG:3857',
        );
        expectedPoint14.push(1709814239);
        const expectedPoint15 = transform(
          [5.828858333333334, 43.321380000000005],
          'EPSG:4326',
          'EPSG:3857',
        );
        expectedPoint15.push(1709814251);

        expect(geom.getCoordinates()).to.eql([
          expectedPoint1,
          expectedPoint2,
          expectedPoint3,
          expectedPoint4,
          expectedPoint5,
          expectedPoint6,
          expectedPoint7,
          expectedPoint8,
          expectedPoint9,
          expectedPoint10,
          expectedPoint11,
          expectedPoint12,
          expectedPoint13,
          expectedPoint14,
          expectedPoint15,
        ]);
      });
    });

    describe('#readFeatures', function () {
      it('does not read invalid features', function () {
        expect(format.readFeatures('invalid')).to.be.empty();
      });

      it('does read features', function () {
        const features = format.readFeatures(igc);
        expect(features.length).to.eql(1);
        const feature = features[0];
        expect(feature).to.be.an(Feature);
        const geom = feature.getGeometry();
        expect(geom.getType()).to.eql('LineString');
        expect(geom.getCoordinates()).to.eql([
          [5.828213333333333, 43.32027666666667, 1709814099],
          [5.828191666666667, 43.32033333333333, 1709814119],
          [5.828203333333333, 43.32037166666667, 1709814121],
          [5.828238333333333, 43.320435, 1709814128],
          [5.82828, 43.320525, 1709814136],
          [5.828301666666667, 43.320616666666666, 1709814144],
          [5.828321666666667, 43.32071666666667, 1709814152],
          [5.828346666666667, 43.32087333333333, 1709814169],
          [5.828386666666666, 43.320965, 1709814177],
          [5.828455, 43.32112166666667, 1709814193],
          [5.828476666666666, 43.32114833333333, 1709814204],
          [5.828631666666667, 43.32130166666667, 1709814218],
          [5.828685, 43.321311666666666, 1709814227],
          [5.828846666666667, 43.32138333333333, 1709814239],
          [5.828858333333334, 43.321380000000005, 1709814251],
        ]);
      });

      it('does transform and read features', function () {
        const features = format.readFeatures(igc, {
          featureProjection: 'EPSG:3857',
        });
        expect(features.length).to.eql(1);
        const feature = features[0];
        expect(feature).to.be.an(Feature);
        const geom = feature.getGeometry();
        expect(geom.getType()).to.eql('LineString');

        const expectedPoint1 = transform(
          [5.828213333333333, 43.32027666666667],
          'EPSG:4326',
          'EPSG:3857',
        );
        expectedPoint1.push(1709814099);
        const expectedPoint2 = transform(
          [5.828191666666667, 43.32033333333333],
          'EPSG:4326',
          'EPSG:3857',
        );
        expectedPoint2.push(1709814119);
        const expectedPoint3 = transform(
          [5.828203333333333, 43.32037166666667],
          'EPSG:4326',
          'EPSG:3857',
        );
        expectedPoint3.push(1709814121);
        const expectedPoint4 = transform(
          [5.828238333333333, 43.320435],
          'EPSG:4326',
          'EPSG:3857',
        );
        expectedPoint4.push(1709814128);
        const expectedPoint5 = transform(
          [5.82828, 43.320525],
          'EPSG:4326',
          'EPSG:3857',
        );
        expectedPoint5.push(1709814136);
        const expectedPoint6 = transform(
          [5.828301666666667, 43.320616666666666],
          'EPSG:4326',
          'EPSG:3857',
        );
        expectedPoint6.push(1709814144);
        const expectedPoint7 = transform(
          [5.828321666666667, 43.32071666666667],
          'EPSG:4326',
          'EPSG:3857',
        );
        expectedPoint7.push(1709814152);
        const expectedPoint8 = transform(
          [5.828346666666667, 43.32087333333333],
          'EPSG:4326',
          'EPSG:3857',
        );
        expectedPoint8.push(1709814169);
        const expectedPoint9 = transform(
          [5.828386666666666, 43.320965],
          'EPSG:4326',
          'EPSG:3857',
        );
        expectedPoint9.push(1709814177);
        const expectedPoint10 = transform(
          [5.828455, 43.32112166666667],
          'EPSG:4326',
          'EPSG:3857',
        );
        expectedPoint10.push(1709814193);
        const expectedPoint11 = transform(
          [5.828476666666666, 43.32114833333333],
          'EPSG:4326',
          'EPSG:3857',
        );
        expectedPoint11.push(1709814204);
        const expectedPoint12 = transform(
          [5.828631666666667, 43.32130166666667],
          'EPSG:4326',
          'EPSG:3857',
        );
        expectedPoint12.push(1709814218);
        const expectedPoint13 = transform(
          [5.828685, 43.321311666666666],
          'EPSG:4326',
          'EPSG:3857',
        );
        expectedPoint13.push(1709814227);
        const expectedPoint14 = transform(
          [5.828846666666667, 43.32138333333333],
          'EPSG:4326',
          'EPSG:3857',
        );
        expectedPoint14.push(1709814239);
        const expectedPoint15 = transform(
          [5.828858333333334, 43.321380000000005],
          'EPSG:4326',
          'EPSG:3857',
        );
        expectedPoint15.push(1709814251);

        expect(geom.getCoordinates()).to.eql([
          expectedPoint1,
          expectedPoint2,
          expectedPoint3,
          expectedPoint4,
          expectedPoint5,
          expectedPoint6,
          expectedPoint7,
          expectedPoint8,
          expectedPoint9,
          expectedPoint10,
          expectedPoint11,
          expectedPoint12,
          expectedPoint13,
          expectedPoint14,
          expectedPoint15,
        ]);
      });
    });
  });
});
