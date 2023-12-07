import ImageMapGuide from '../../../../../src/ol/source/ImageMapGuide.js';

describe('ol/source/ImageMapGuide', function () {
  let options;
  beforeEach(function () {
    options = {
      params: {
        'MAPDEFINITION': 'mdf',
      },
      url: new URL('/mapagent.fcgi?', window.location.href).toString(),
    };
  });

  describe('#getParams', function () {
    it('verify getting a param', function () {
      const source = new ImageMapGuide(options);
      const setParams = source.getParams();
      expect(setParams).to.eql({MAPDEFINITION: 'mdf'});
    });

    it('verify on adding a param', function () {
      const source = new ImageMapGuide(options);
      source.updateParams({'TEST': 'value'});
      const setParams = source.getParams();
      expect(setParams).to.eql({MAPDEFINITION: 'mdf', TEST: 'value'});
      expect(options.params).to.eql({MAPDEFINITION: 'mdf'});
    });

    it('verify on update a param', function () {
      const source = new ImageMapGuide(options);
      source.updateParams({'MAPDEFINITION': 'newValue'});
      const setParams = source.getParams();
      expect(setParams).to.eql({MAPDEFINITION: 'newValue'});
      expect(options.params).to.eql({MAPDEFINITION: 'mdf'});
    });
  });
});
