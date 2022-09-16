import expect from '../../expect.js';
import proj4 from 'proj4';
import {
  Projection,
  addCommon,
  clearAllProjections,
  transform,
} from '../../../../src/ol/proj.js';
import {
  fromEPSGCode,
  getEPSGLookup,
  isRegistered,
  register,
  setEPSGLookup,
  unregister,
} from '../../../../src/ol/proj/proj4.js';

const epsgDefinitions = {
  32721: '+proj=utm +zone=21 +south +datum=WGS84 +units=m +no_defs +type=crs',
  32612: '+proj=utm +zone=12 +datum=WGS84 +units=m +no_defs +type=crs',
};

async function mockEPSGLookup(code) {
  const definition = epsgDefinitions[code];
  if (!definition) {
    throw new Error('Unexpected response from epsg.io: 404');
  }
  return definition;
}

describe('ol/proj/proj4.js', () => {
  let originalEPSGLookup;
  beforeEach(() => {
    originalEPSGLookup = getEPSGLookup();
  });

  afterEach(() => {
    clearAllProjections();
    addCommon();
    unregister();
    setEPSGLookup(originalEPSGLookup);
  });

  describe('isRegistered', () => {
    it('returns true if register has been called', () => {
      register(proj4);
      expect(isRegistered()).to.be(true);
    });

    it('returns false if register has not been called', () => {
      expect(isRegistered()).to.be(false);
    });
  });

  describe('unregister', () => {
    it('unregisters proj4', () => {
      register(proj4);
      expect(isRegistered()).to.be(true);
      unregister();
      expect(isRegistered()).to.be(false);
    });
  });

  describe('setEPSGLookup', () => {
    it('can be called to provide a custom lookup function', async () => {
      let called = false;
      function lookup(code) {
        called = true;
        return Promise.resolve(epsgDefinitions[code]);
      }

      register(proj4);
      setEPSGLookup(lookup);
      await fromEPSGCode(32612);

      expect(called).to.be(true);
    });
  });

  describe('fromEPSGCode', () => {
    beforeEach(() => {
      setEPSGLookup(mockEPSGLookup);
    });

    it('fetches the proj4 definition and returns a promise for a projection', async () => {
      register(proj4);

      const code = 'EPSG:32721';
      const projection = await fromEPSGCode(code);
      expect(projection).to.be.a(Projection);

      expect(projection.getCode()).to.be(code);

      const center = [500000.0, 5572242.78];
      const transformed = transform(center, code, 'EPSG:4326');
      expect(transformed[0]).to.roughlyEqual(-57, 1e-7);
      expect(transformed[1]).to.roughlyEqual(-40, 1e-7);
    });

    it('accepts a number in addition to a string', async () => {
      register(proj4);

      const number = 32721;
      const code = 'EPSG:' + number;
      const projection = await fromEPSGCode(number);
      expect(projection).to.be.a(Projection);

      expect(projection.getCode()).to.be(code);

      const center = [500000.0, 5572242.78];
      const transformed = transform(center, code, 'EPSG:4326');
      expect(transformed[0]).to.roughlyEqual(-57, 1e-7);
      expect(transformed[1]).to.roughlyEqual(-40, 1e-7);
    });

    it('throws if the definition is not found', async () => {
      register(proj4);

      let error;
      try {
        await fromEPSGCode('EPSG:404');
      } catch (err) {
        error = err;
      }

      expect(error).to.be.an(Error);
      expect(error.message).to.be('Unexpected response from epsg.io: 404');
    });

    it('throws if proj4 is not already registered', async () => {
      let error;
      try {
        await fromEPSGCode('EPSG:32721');
      } catch (err) {
        error = err;
      }

      expect(error).to.be.an(Error);
      expect(error.message).to.be(
        'Proj4 must be registered first with register(proj4)'
      );
    });
  });
});
