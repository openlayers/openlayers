import GeoJSON from '../../../../../src/ol/format/GeoJSON.js';
import {
  inflateEnds,
  linearRingIsClockwise,
  linearRingsAreOriented,
  linearRingssAreOriented,
  orientLinearRings,
  orientLinearRingsArray,
} from '../../../../../src/ol/geom/flat/orient.js';
import RenderFeature from '../../../../../src/ol/render/Feature.js';
import expect from '../../../expect.js';

describe('ol/geom/flat/orient.js', function () {
  describe('linearRingIsClockwise', function () {
    it('identifies clockwise rings', function () {
      const flatCoordinates = [0, 1, 1, 4, 4, 3, 3, 0];
      const isClockwise = linearRingIsClockwise(
        flatCoordinates,
        0,
        flatCoordinates.length,
        2,
      );
      expect(isClockwise).to.be(true);
    });

    it('identifies anti-clockwise rings', function () {
      const flatCoordinates = [2, 2, 3, 2, 3, 3, 2, 3];
      const isClockwise = linearRingIsClockwise(
        flatCoordinates,
        0,
        flatCoordinates.length,
        2,
      );
      expect(isClockwise).to.be(false);
    });

    it('identifies clockwise with duplicated coordinates', function () {
      const flatCoordinates = [0, 1, 0, 1, 1, 4, 1, 4, 4, 3, 4, 3, 3, 0, 3, 0];
      const isClockwise = linearRingIsClockwise(
        flatCoordinates,
        0,
        flatCoordinates.length,
        2,
      );
      expect(isClockwise).to.be(true);
    });

    it('identifies anti-clockwise with duplicated coordinates', function () {
      const flatCoordinates = [2, 2, 2, 2, 3, 2, 3, 2, 3, 3, 3, 3, 2, 3, 2, 3];
      const isClockwise = linearRingIsClockwise(
        flatCoordinates,
        0,
        flatCoordinates.length,
        2,
      );
      expect(isClockwise).to.be(false);
    });

    it('identifies clockwise when last coordinate equals first', function () {
      const flatCoordinates = [0, 1, 1, 4, 4, 3, 3, 0, 0, 1];
      const isClockwise = linearRingIsClockwise(
        flatCoordinates,
        0,
        flatCoordinates.length,
        2,
      );
      expect(isClockwise).to.be(true);
    });

    it('identifies anti-clockwise when last coordinate equals first', function () {
      const flatCoordinates = [2, 2, 3, 2, 3, 3, 2, 3, 2, 2];
      const isClockwise = linearRingIsClockwise(
        flatCoordinates,
        0,
        flatCoordinates.length,
        2,
      );
      expect(isClockwise).to.be(false);
    });

    it('returns undefined when ring has too few vertices', function () {
      const flatCoordinates = [2, 2, 3, 2];
      const isClockwise = linearRingIsClockwise(
        flatCoordinates,
        0,
        flatCoordinates.length,
        2,
      );
      expect(isClockwise).to.be(undefined);
    });
  });

  describe('linearRingsAreOriented', function () {
    const oriented = linearRingsAreOriented;

    const rightCoords = [
      -180, -90, 180, -90, 180, 90, -180, 90, -180, -90, -100, -45, -100, 45,
      100, 45, 100, -45, -100, -45,
    ];

    const leftCoords = [
      -180, -90, -180, 90, 180, 90, 180, -90, -180, -90, -100, -45, 100, -45,
      100, 45, -100, 45, -100, -45,
    ];

    const ends = [10, 20];

    it('checks for left-hand orientation by default', function () {
      expect(oriented(rightCoords, 0, ends, 2)).to.be(false);
      expect(oriented(leftCoords, 0, ends, 2)).to.be(true);
    });

    it('can check for right-hand orientation', function () {
      expect(oriented(rightCoords, 0, ends, 2, true)).to.be(true);
      expect(oriented(leftCoords, 0, ends, 2, true)).to.be(false);
    });
  });

  describe('linearRingssAreOriented', function () {
    const oriented = linearRingssAreOriented;

    const rightCoords = [
      -180, -90, 180, -90, 180, 90, -180, 90, -180, -90, -100, -45, -100, 45,
      100, 45, 100, -45, -100, -45, -180, -90, 180, -90, 180, 90, -180, 90,
      -180, -90, -100, -45, -100, 45, 100, 45, 100, -45, -100, -45,
    ];

    const leftCoords = [
      -180, -90, -180, 90, 180, 90, 180, -90, -180, -90, -100, -45, 100, -45,
      100, 45, -100, 45, -100, -45, -180, -90, -180, 90, 180, 90, 180, -90,
      -180, -90, -100, -45, 100, -45, 100, 45, -100, 45, -100, -45,
    ];

    const ends = [
      [10, 20],
      [30, 40],
    ];

    it('checks for left-hand orientation by default', function () {
      expect(oriented(rightCoords, 0, ends, 2)).to.be(false);
      expect(oriented(leftCoords, 0, ends, 2)).to.be(true);
    });

    it('can check for right-hand orientation', function () {
      expect(oriented(rightCoords, 0, ends, 2, true)).to.be(true);
      expect(oriented(leftCoords, 0, ends, 2, true)).to.be(false);
    });
  });

  describe('orientLinearRings', function () {
    const orient = orientLinearRings;

    const rightCoords = [
      -180, -90, 180, -90, 180, 90, -180, 90, -180, -90, -100, -45, -100, 45,
      100, 45, 100, -45, -100, -45,
    ];

    const leftCoords = [
      -180, -90, -180, 90, 180, 90, 180, -90, -180, -90, -100, -45, 100, -45,
      100, 45, -100, 45, -100, -45,
    ];

    const ends = [10, 20];

    it('orients using the left-hand rule by default', function () {
      const rightClone = rightCoords.slice();
      orient(rightClone, 0, ends, 2);
      expect(rightClone).to.eql(leftCoords);

      const leftClone = leftCoords.slice();
      orient(leftClone, 0, ends, 2);
      expect(leftClone).to.eql(leftCoords);
    });

    it('can orient using the right-hand rule', function () {
      const rightClone = rightCoords.slice();
      orient(rightClone, 0, ends, 2, true);
      expect(rightClone).to.eql(rightCoords);

      const leftClone = leftCoords.slice();
      orient(leftClone, 0, ends, 2, true);
      expect(leftClone).to.eql(rightCoords);
    });
  });

  describe('orientLinearRingsArray', function () {
    const orient = orientLinearRingsArray;

    const rightCoords = [
      -180, -90, 180, -90, 180, 90, -180, 90, -180, -90, -100, -45, -100, 45,
      100, 45, 100, -45, -100, -45, -180, -90, 180, -90, 180, 90, -180, 90,
      -180, -90, -100, -45, -100, 45, 100, 45, 100, -45, -100, -45,
    ];

    const leftCoords = [
      -180, -90, -180, 90, 180, 90, 180, -90, -180, -90, -100, -45, 100, -45,
      100, 45, -100, 45, -100, -45, -180, -90, -180, 90, 180, 90, 180, -90,
      -180, -90, -100, -45, 100, -45, 100, 45, -100, 45, -100, -45,
    ];

    const ends = [
      [10, 20],
      [30, 40],
    ];

    it('orients using the left-hand rule by default', function () {
      const rightClone = rightCoords.slice();
      orient(rightClone, 0, ends, 2);
      expect(rightClone).to.eql(leftCoords);

      const leftClone = leftCoords.slice();
      orient(leftClone, 0, ends, 2);
      expect(leftClone).to.eql(leftCoords);
    });

    it('can orient using the right-hand rule', function () {
      const rightClone = rightCoords.slice();
      orient(rightClone, 0, ends, 2, true);
      expect(rightClone).to.eql(rightCoords);

      const leftClone = leftCoords.slice();
      orient(leftClone, 0, ends, 2, true);
      expect(leftClone).to.eql(rightCoords);
    });
  });

  describe('inflateEnds', function () {
    const data = `{
      "type": "FeatureCollection",
      "name": "7-64-55",
      "features": [
      { "type": "Feature", "properties": { "mvt_id": 1 }, "geometry": { "type": "MultiPolygon", "coordinates": [ [ [ [ 0.11810302734375, 24.046463999666589 ], [ 0.237579345703125, 24.046463999666589 ], [ 0.237579345703125, 23.956136333969283 ], [ 0.11810302734375, 23.956136333969283 ], [ 0.11810302734375, 24.046463999666589 ] ], [ [ 0.153121948242188, 24.01949779624486 ], [ 0.153121948242188, 23.979978958263413 ], [ 0.2032470703125, 23.979978958263413 ], [ 0.2032470703125, 24.01949779624486 ], [ 0.153121948242188, 24.01949779624486 ] ] ] ] } },
      { "type": "Feature", "properties": { "mvt_id": 26 }, "geometry": { "type": "MultiPolygon", "coordinates": [ [ [ [ 0.293197631835938, 24.036430724667376 ], [ 0.389328002929688, 24.036430724667376 ], [ 0.3570556640625, 23.95864629158493 ], [ 0.260238647460938, 23.95864629158493 ], [ 0.293197631835938, 24.036430724667376 ] ], [ [ 0.342636108398438, 24.0332951655089 ], [ 0.32684326171875, 23.988761970899695 ], [ 0.352935791015625, 23.988761970899695 ], [ 0.369415283203125, 24.0332951655089 ], [ 0.342636108398438, 24.0332951655089 ] ], [ [ 0.291824340820312, 24.018870607907278 ], [ 0.291824340820312, 23.971195346707443 ], [ 0.319290161132813, 23.971195346707443 ], [ 0.319290161132813, 24.018870607907278 ], [ 0.291824340820312, 24.018870607907278 ] ] ] ] } },
      { "type": "Feature", "properties": { "mvt_id": 30 }, "geometry": { "type": "MultiPolygon", "coordinates": [ [ [ [ 0.287704467773438, 24.219414393426444 ], [ 0.350875854492188, 24.219414393426444 ], [ 0.33233642578125, 24.147380157655896 ], [ 0.268478393554688, 24.147380157655896 ], [ 0.287704467773438, 24.219414393426444 ] ] ], [ [ [ 0.3460693359375, 24.166802085303235 ], [ 0.372848510742188, 24.166802085303235 ], [ 0.383148193359375, 24.144873887414654 ], [ 0.355682373046875, 24.144873887414654 ], [ 0.3460693359375, 24.166802085303235 ] ] ], [ [ [ 0.352249145507812, 24.218161971731128 ], [ 0.377655029296875, 24.218161971731128 ], [ 0.383834838867187, 24.186847428521244 ], [ 0.358428955078125, 24.186847428521244 ], [ 0.352249145507812, 24.218161971731128 ] ] ] ] } },
      { "type": "Feature", "properties": { "mvt_id": 33 }, "geometry": { "type": "MultiPolygon", "coordinates": [ [ [ [ 0.10986328125, 24.168055011483165 ], [ 0.199813842773438, 24.168055011483165 ], [ 0.199813842773438, 24.075305297879073 ], [ 0.10986328125, 24.075305297879073 ], [ 0.10986328125, 24.168055011483165 ] ] ], [ [ [ 0.202560424804687, 24.16742854993004 ], [ 0.240325927734375, 24.16742854993004 ], [ 0.240325927734375, 24.128581933124689 ], [ 0.202560424804687, 24.128581933124689 ], [ 0.202560424804687, 24.16742854993004 ] ] ] ] } },
      { "type": "Feature", "properties": { "mvt_id": 48 }, "geometry": { "type": "MultiPolygon", "coordinates": [ [ [ [ 0.268478393554688, 24.136101554583817 ], [ 0.336456298828125, 24.136101554583817 ], [ 0.31585693359375, 24.047718103928766 ], [ 0.247879028320312, 24.047718103928766 ], [ 0.268478393554688, 24.136101554583817 ] ], [ [ 0.27191162109375, 24.123568606548453 ], [ 0.27191162109375, 24.07279761626851 ], [ 0.31585693359375, 24.07279761626851 ], [ 0.31585693359375, 24.123568606548453 ], [ 0.27191162109375, 24.123568606548453 ] ] ], [ [ [ 0.328216552734375, 24.077812930451806 ], [ 0.357742309570313, 24.077812930451806 ], [ 0.3680419921875, 24.05085331099432 ], [ 0.339202880859375, 24.05085331099432 ], [ 0.328216552734375, 24.077812930451806 ] ] ] ] } }
      ]
      }`;
    const features = new GeoJSON().readFeatures(data);
    const renderFeatures = features.map((feature) => {
      const multipolygon = feature.getGeometry();
      const flatCoordinates = multipolygon.getFlatCoordinates();
      const ends = multipolygon.getEndss().flat();
      return new RenderFeature(
        'Polygon',
        flatCoordinates,
        ends,
        2,
        {},
        feature.getId(),
      );
    });

    it('inflates ends', function () {
      renderFeatures.forEach((renderFeature, i) => {
        const ends = renderFeature.getEnds();
        expect(inflateEnds(renderFeature.getFlatCoordinates(), ends)).to.eql(
          features[i].getGeometry().getEndss(),
        );
      });
    });
  });
});
