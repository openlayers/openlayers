import GeoTIFFSource from '../../../../../src/ol/source/GeoTIFF.js';
import TileDebug from '../../../../../src/ol/source/TileDebug.js';
import {createXYZ} from '../../../../../src/ol/tilegrid.js';

describe('ol/source/TileDebug', function () {
  it('applies default options', function () {
    const debugSource = new TileDebug();
    expect(debugSource.getProjection().getCode()).to.be('EPSG:3857');
    expect(debugSource.getProjection().getUnits()).to.be('m');
    expect(debugSource.getTileGrid().getExtent()).to.eql([
      -20037508.342789244, -20037508.342789244, 20037508.342789244,
      20037508.342789244,
    ]);
    expect(debugSource.getTileGrid().getResolutions().length).to.be(43);
    expect(debugSource.getTileGrid().getResolution(0)).to.be(
      156543.03392804097,
    );
    expect(debugSource.getWrapX()).to.be(true);
    expect(debugSource.zDirection).to.be(0);
  });

  it('applies options from another source', function (done) {
    const cogSource = new GeoTIFFSource({
      sources: [
        {
          url: 'spec/ol/source/images/0-0-0.tif',
        },
      ],
    });
    const debugSource = new TileDebug({
      source: cogSource,
    });
    cogSource.getView().then(() => {
      expect(debugSource.getProjection().getCode()).to.be('EPSG:4326');
      expect(debugSource.getProjection().getUnits()).to.be('degrees');
      expect(debugSource.getTileGrid().getExtent()).to.eql([
        -180, -90, 180, 90,
      ]);
      expect(debugSource.getTileGrid().getResolutions().length).to.be(1);
      expect(debugSource.getTileGrid().getResolution(0)).to.be(0.703125);
      expect(debugSource.getWrapX()).to.be(false);
      expect(debugSource.zDirection).to.be(0);
      done();
    });
  });

  it('overrides options from another source', function (done) {
    const cogSource = new GeoTIFFSource({
      sources: [
        {
          url: 'spec/ol/source/images/0-0-0.tif',
        },
      ],
    });
    const debugSource = new TileDebug({
      source: cogSource,
      projection: 'EPSG:3857',
      tileGrid: createXYZ(),
      wrapX: true,
      zDirection: 1,
    });
    cogSource.getView().then(() => {
      expect(debugSource.getProjection().getCode()).to.be('EPSG:3857');
      expect(debugSource.getProjection().getUnits()).to.be('m');
      expect(debugSource.getTileGrid().getExtent()).to.eql([
        -20037508.342789244, -20037508.342789244, 20037508.342789244,
        20037508.342789244,
      ]);
      expect(debugSource.getTileGrid().getResolutions().length).to.be(43);
      expect(debugSource.getTileGrid().getResolution(0)).to.be(
        156543.03392804097,
      );
      expect(debugSource.getWrapX()).to.be(true);
      expect(debugSource.zDirection).to.be(1);
      done();
    });
  });
});
