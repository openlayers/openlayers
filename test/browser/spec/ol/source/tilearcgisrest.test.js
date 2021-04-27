import ImageTile from '../../../../../src/ol/ImageTile.js';
import TileArcGISRest from '../../../../../src/ol/source/TileArcGISRest.js';
import {get as getProjection} from '../../../../../src/ol/proj.js';

describe('ol.source.TileArcGISRest', function () {
  let options;
  beforeEach(function () {
    options = {
      params: {},
      url: 'http://example.com/MapServer',
    };
  });

  describe('#getTile', function () {
    it('returns a tile with the expected URL', function () {
      const source = new TileArcGISRest(options);
      const tile = source.getTile(3, 2, 6, 1, getProjection('EPSG:3857'));
      expect(tile).to.be.an(ImageTile);
      const uri = new URL(tile.src_);
      expect(uri.protocol).to.be('http:');
      expect(uri.hostname).to.be('example.com');
      expect(uri.pathname).to.be('/MapServer/export');
      const queryData = uri.searchParams;
      const bbox = queryData.get('BBOX').split(',').map(parseFloat);
      expect(bbox[0]).roughlyEqual(-10018754.171394622, 1e-9);
      expect(bbox[1]).roughlyEqual(-15028131.257091936, 1e-9);
      expect(bbox[2]).roughlyEqual(-5009377.085697311, 1e-9);
      expect(bbox[3]).roughlyEqual(-10018754.171394624, 1e-9);
      expect(queryData.get('FORMAT')).to.be('PNG32');
      expect(queryData.get('SIZE')).to.be('256,256');
      expect(queryData.get('IMAGESR')).to.be('3857');
      expect(queryData.get('BBOXSR')).to.be('3857');
      expect(queryData.get('TRANSPARENT')).to.be('true');
    });

    it('returns a non floating point DPI value', function () {
      const source = new TileArcGISRest(options);
      const tile = source.getTile(3, 2, 6, 1.12, getProjection('EPSG:3857'));
      const uri = new URL(tile.src_);
      const queryData = uri.searchParams;
      expect(queryData.get('DPI')).to.be('101');
    });

    it('takes DPI from params if specified', function () {
      options.params.DPI = 96;
      const source = new TileArcGISRest(options);
      const tile = source.getTile(3, 2, 6, 1.12, getProjection('EPSG:3857'));
      const uri = new URL(tile.src_);
      const queryData = uri.searchParams;
      expect(queryData.get('DPI')).to.be('108');
      delete options.params.DPI;
    });

    it('returns a tile with the expected URL with url list', function () {
      options.urls = [
        'http://test1.com/MapServer',
        'http://test2.com/MapServer',
      ];
      const source = new TileArcGISRest(options);

      const tile = source.getTile(3, 2, 6, 1, getProjection('EPSG:3857'));
      expect(tile).to.be.an(ImageTile);
      const uri = new URL(tile.src_);
      expect(uri.protocol).to.be('http:');
      expect(uri.hostname).to.match(/test[12]\.com/);
      expect(uri.pathname).to.be('/MapServer/export');
      const queryData = uri.searchParams;
      const bbox = queryData.get('BBOX').split(',').map(parseFloat);
      expect(bbox[0]).roughlyEqual(-10018754.171394622, 1e-9);
      expect(bbox[1]).roughlyEqual(-15028131.257091936, 1e-9);
      expect(bbox[2]).roughlyEqual(-5009377.085697311, 1e-9);
      expect(bbox[3]).roughlyEqual(-10018754.171394624, 1e-9);
      expect(queryData.get('FORMAT')).to.be('PNG32');
      expect(queryData.get('SIZE')).to.be('256,256');
      expect(queryData.get('IMAGESR')).to.be('3857');
      expect(queryData.get('BBOXSR')).to.be('3857');
      expect(queryData.get('TRANSPARENT')).to.be('true');
    });

    it('returns a tile with the expected URL for ImageServer', function () {
      options.url = 'http://example.com/ImageServer';
      const source = new TileArcGISRest(options);
      const tile = source.getTile(3, 2, 6, 1, getProjection('EPSG:3857'));
      expect(tile).to.be.an(ImageTile);
      const uri = new URL(tile.src_);
      expect(uri.protocol).to.be('http:');
      expect(uri.hostname).to.be('example.com');
      expect(uri.pathname).to.be('/ImageServer/exportImage');
      const queryData = uri.searchParams;
      const bbox = queryData.get('BBOX').split(',').map(parseFloat);
      expect(bbox[0]).roughlyEqual(-10018754.171394622, 1e-9);
      expect(bbox[1]).roughlyEqual(-15028131.257091936, 1e-9);
      expect(bbox[2]).roughlyEqual(-5009377.085697311, 1e-9);
      expect(bbox[3]).roughlyEqual(-10018754.171394624, 1e-9);
      expect(queryData.get('FORMAT')).to.be('PNG32');
      expect(queryData.get('SIZE')).to.be('256,256');
      expect(queryData.get('IMAGESR')).to.be('3857');
      expect(queryData.get('BBOXSR')).to.be('3857');
      expect(queryData.get('TRANSPARENT')).to.be('true');
    });

    it('allows various parameters to be overridden', function () {
      options.params.FORMAT = 'png';
      options.params.TRANSPARENT = false;
      const source = new TileArcGISRest(options);
      const tile = source.getTile(3, 2, 2, 1, getProjection('EPSG:4326'));
      const uri = new URL(tile.src_);
      const queryData = uri.searchParams;
      expect(queryData.get('FORMAT')).to.be('png');
      expect(queryData.get('TRANSPARENT')).to.be('false');
    });

    it('allows adding rest option', function () {
      options.params.LAYERS = 'show:1,3,4';
      const source = new TileArcGISRest(options);
      const tile = source.getTile(3, 2, 2, 1, getProjection('EPSG:4326'));
      const uri = new URL(tile.src_);
      const queryData = uri.searchParams;
      expect(queryData.get('LAYERS')).to.be('show:1,3,4');
    });
  });

  describe('#updateParams', function () {
    it('add a new param', function () {
      const source = new TileArcGISRest(options);
      source.updateParams({'TEST': 'value'});

      const tile = source.getTile(3, 2, 6, 1, getProjection('EPSG:3857'));
      const uri = new URL(tile.src_);
      const queryData = uri.searchParams;
      expect(queryData.get('TEST')).to.be('value');
    });

    it('updates an existing param', function () {
      options.params.TEST = 'value';

      const source = new TileArcGISRest(options);
      source.updateParams({'TEST': 'newValue'});

      const tile = source.getTile(3, 2, 6, 1, getProjection('EPSG:3857'));
      const uri = new URL(tile.src_);
      const queryData = uri.searchParams;
      expect(queryData.get('TEST')).to.be('newValue');
    });
  });

  describe('#getParams', function () {
    it('verify getting a param', function () {
      options.params.TEST = 'value';
      const source = new TileArcGISRest(options);

      const setParams = source.getParams();

      expect(setParams).to.eql({TEST: 'value'});
    });

    it('verify on adding a param', function () {
      options.params.TEST = 'value';

      const source = new TileArcGISRest(options);
      source.updateParams({'TEST2': 'newValue'});

      const setParams = source.getParams();

      expect(setParams).to.eql({TEST: 'value', TEST2: 'newValue'});
    });

    it('verify on update a param', function () {
      options.params.TEST = 'value';

      const source = new TileArcGISRest(options);
      source.updateParams({'TEST': 'newValue'});

      const setParams = source.getParams();

      expect(setParams).to.eql({TEST: 'newValue'});
    });
  });

  describe('#getUrls', function () {
    it('verify getting array of urls', function () {
      options.urls = [
        'http://test.com/MapServer',
        'http://test2.com/MapServer',
      ];

      const source = new TileArcGISRest(options);

      const urls = source.getUrls();

      expect(urls).to.eql([
        'http://test.com/MapServer',
        'http://test2.com/MapServer',
      ]);
    });
  });

  describe('#setUrls', function () {
    it('verify setting urls when not set yet', function () {
      const source = new TileArcGISRest(options);
      source.setUrls([
        'http://test.com/MapServer',
        'http://test2.com/MapServer',
      ]);

      const urls = source.getUrls();

      expect(urls).to.eql([
        'http://test.com/MapServer',
        'http://test2.com/MapServer',
      ]);
    });

    it('verify setting urls with existing list', function () {
      options.urls = [
        'http://test.com/MapServer',
        'http://test2.com/MapServer',
      ];

      const source = new TileArcGISRest(options);
      source.setUrls([
        'http://test3.com/MapServer',
        'http://test4.com/MapServer',
      ]);

      const urls = source.getUrls();

      expect(urls).to.eql([
        'http://test3.com/MapServer',
        'http://test4.com/MapServer',
      ]);
    });
  });

  describe('#setUrl', function () {
    it('verify setting url with no urls', function () {
      const source = new TileArcGISRest(options);
      source.setUrl('http://test.com/MapServer');

      const urls = source.getUrls();

      expect(urls).to.eql(['http://test.com/MapServer']);
    });

    it('verify setting url with list of urls', function () {
      options.urls = [
        'http://test.com/MapServer',
        'http://test2.com/MapServer',
      ];

      const source = new TileArcGISRest(options);
      source.setUrl('http://test3.com/MapServer');

      const urls = source.getUrls();

      expect(urls).to.eql(['http://test3.com/MapServer']);

      const tileUrl = source.tileUrlFunction(
        [0, 0, 0],
        1,
        getProjection('EPSG:4326')
      );
      expect(tileUrl.indexOf(urls[0])).to.be(0);
    });
  });
});
