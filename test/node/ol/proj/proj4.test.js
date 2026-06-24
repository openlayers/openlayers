import proj4 from 'proj4';
import {
  addCommon,
  clearAllProjections,
  get,
  transform,
} from '../../../../src/ol/proj.js';
import Projection from '../../../../src/ol/proj/Projection.js';
import {
  fromProjectionCode,
  fromProjectionDefinition,
  getProjectionCodeLookup,
  isRegistered,
  register,
  setProjectionCodeLookup,
  unregister,
} from '../../../../src/ol/proj/proj4.js';
import expect from '../../expect.js';

// https://spatialreference.org/ref/epsg/4326/projjson.json
const EPSG4326_PROJJSON = {
  $schema: 'https://proj.org/schemas/v0.7/projjson.schema.json',
  type: 'GeographicCRS',
  name: 'WGS 84',
  datum_ensemble: {
    name: 'World Geodetic System 1984 ensemble',
    members: [
      {
        name: 'World Geodetic System 1984 (Transit)',
        id: {authority: 'EPSG', code: 1166},
      },
      {
        name: 'World Geodetic System 1984 (G730)',
        id: {authority: 'EPSG', code: 1152},
      },
      {
        name: 'World Geodetic System 1984 (G873)',
        id: {authority: 'EPSG', code: 1153},
      },
      {
        name: 'World Geodetic System 1984 (G1150)',
        id: {authority: 'EPSG', code: 1154},
      },
      {
        name: 'World Geodetic System 1984 (G1674)',
        id: {authority: 'EPSG', code: 1155},
      },
      {
        name: 'World Geodetic System 1984 (G1762)',
        id: {authority: 'EPSG', code: 1156},
      },
      {
        name: 'World Geodetic System 1984 (G2139)',
        id: {authority: 'EPSG', code: 1309},
      },
      {
        name: 'World Geodetic System 1984 (G2296)',
        id: {authority: 'EPSG', code: 1383},
      },
    ],
    ellipsoid: {
      name: 'WGS 84',
      semi_major_axis: 6378137,
      inverse_flattening: 298.257223563,
    },
    accuracy: '2.0',
    id: {authority: 'EPSG', code: 6326},
  },
  coordinate_system: {
    subtype: 'ellipsoidal',
    axis: [
      {
        name: 'Geodetic latitude',
        abbreviation: 'Lat',
        direction: 'north',
        unit: 'degree',
      },
      {
        name: 'Geodetic longitude',
        abbreviation: 'Lon',
        direction: 'east',
        unit: 'degree',
      },
    ],
  },
  scope: 'Horizontal component of 3D system.',
  area: 'World.',
  bbox: {
    south_latitude: -90,
    west_longitude: -180,
    north_latitude: 90,
    east_longitude: 180,
  },
  id: {authority: 'EPSG', code: 4326},
};

// https://spatialreference.org/ref/epsg/32632/prettywkt2.txt
const EPSG32632_WKT2 = `PROJCRS["WGS 84 / UTM zone 32N",
    BASEGEOGCRS["WGS 84",
        ENSEMBLE["World Geodetic System 1984 ensemble",
            MEMBER["World Geodetic System 1984 (Transit)"],
            MEMBER["World Geodetic System 1984 (G730)"],
            MEMBER["World Geodetic System 1984 (G873)"],
            MEMBER["World Geodetic System 1984 (G1150)"],
            MEMBER["World Geodetic System 1984 (G1674)"],
            MEMBER["World Geodetic System 1984 (G1762)"],
            MEMBER["World Geodetic System 1984 (G2139)"],
            MEMBER["World Geodetic System 1984 (G2296)"],
            ELLIPSOID["WGS 84",6378137,298.257223563,
                LENGTHUNIT["metre",1]],
            ENSEMBLEACCURACY[2.0]],
        PRIMEM["Greenwich",0,
            ANGLEUNIT["degree",0.0174532925199433]],
        ID["EPSG",4326]],
    CONVERSION["UTM zone 32N",
        METHOD["Transverse Mercator",
            ID["EPSG",9807]],
        PARAMETER["Latitude of natural origin",0,
            ANGLEUNIT["degree",0.0174532925199433],
            ID["EPSG",8801]],
        PARAMETER["Longitude of natural origin",9,
            ANGLEUNIT["degree",0.0174532925199433],
            ID["EPSG",8802]],
        PARAMETER["Scale factor at natural origin",0.9996,
            SCALEUNIT["unity",1],
            ID["EPSG",8805]],
        PARAMETER["False easting",500000,
            LENGTHUNIT["metre",1],
            ID["EPSG",8806]],
        PARAMETER["False northing",0,
            LENGTHUNIT["metre",1],
            ID["EPSG",8807]]],
    CS[Cartesian,2],
        AXIS["(E)",east,
            ORDER[1],
            LENGTHUNIT["metre",1]],
        AXIS["(N)",north,
            ORDER[2],
            LENGTHUNIT["metre",1]],
    USAGE[
        SCOPE["Navigation and medium accuracy spatial referencing."],
        AREA["Between 6\u00b0E and 12\u00b0E, northern hemisphere between equator and 84\u00b0N, onshore and offshore."],
        BBOX[0,6,84,12]],
    ID["EPSG",32632]]`;

const epsgDefinitions = {
  'EPSG:32721':
    '+proj=utm +zone=21 +south +datum=WGS84 +units=m +no_defs +type=crs',
  'EPSG:32612': '+proj=utm +zone=12 +datum=WGS84 +units=m +no_defs +type=crs',
  'EPSG:3416':
    '+proj=lcc +lat_0=47.5 +lon_0=13.3333333333333 +lat_1=49 +lat_2=46 +x_0=400000 +y_0=400000 +ellps=GRS80 +units=m +no_defs +type=crs',
};

async function mockProjectionCodeLookup(code) {
  const definition = epsgDefinitions[code];
  if (!definition) {
    throw new Error('Unexpected response from spatialreference.org: 404');
  }
  return definition;
}

describe('ol/proj/proj4.js', () => {
  let originalProjLookup;
  beforeEach(() => {
    originalProjLookup = getProjectionCodeLookup();
  });

  afterEach(() => {
    clearAllProjections();
    addCommon();
    unregister();
    setProjectionCodeLookup(originalProjLookup);
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

  describe('setProjectionCodeLookup', () => {
    it('can be called to provide a custom lookup function', async () => {
      let called = false;
      function lookup(code) {
        called = true;
        return Promise.resolve(epsgDefinitions[code]);
      }

      register(proj4);
      setProjectionCodeLookup(lookup);
      await fromProjectionCode('EPSG:3416');

      expect(called).to.be(true);
    });
  });

  describe('fromProjectionCode', () => {
    beforeEach(() => {
      setProjectionCodeLookup(mockProjectionCodeLookup);
    });

    it('fetches the proj4 definition and returns a promise for a projection', async () => {
      register(proj4);

      const code = 'EPSG:32721';
      const projection = await fromProjectionCode(code);
      expect(projection).to.be.a(Projection);

      expect(projection.getCode()).to.be(code);

      const center = [500000.0, 5572242.78];
      const transformed = transform(center, code, 'EPSG:4326');
      expect(transformed[0]).to.roughlyEqual(-57, 1e-7);
      expect(transformed[1]).to.roughlyEqual(-40, 1e-7);
    });

    it('accepts a number in addition to a string', async () => {
      register(proj4);

      const code = 'EPSG:32721';
      const projection = await fromProjectionCode(code);
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
        await fromProjectionCode('EPSG:404');
      } catch (err) {
        error = err;
      }

      expect(error).to.be.an(Error);
      expect(error.message).to.be(
        'Unexpected response from spatialreference.org: 404',
      );
    });

    it('throws if proj4 is not already registered', async () => {
      let error;
      try {
        await fromProjectionCode('EPSG:32721');
      } catch (err) {
        error = err;
      }

      expect(error).to.be.an(Error);
      expect(error.message).to.be(
        'Proj4 must be registered first with register(proj4)',
      );
    });
  });

  describe('fromProjectionDefinition()', () => {
    it('throws when proj4 is not registered', () => {
      let error;
      try {
        fromProjectionDefinition(EPSG4326_PROJJSON);
      } catch (err) {
        error = err;
      }
      expect(error).to.be.an(Error);
      expect(error.message).to.be(
        'Proj4 must be registered first with register(proj4)',
      );
    });

    describe('with proj4 registered', () => {
      beforeEach(() => {
        register(proj4);
      });

      it('returns the cached EPSG:4326 projection for WGS 84 PROJJSON', () => {
        const cached = get('EPSG:4326');
        const projection = fromProjectionDefinition(EPSG4326_PROJJSON);
        expect(projection).to.be(cached);
      });

      it('creates a projection with code EPSG:32632 for UTM zone 32N WKT2', () => {
        const projection = fromProjectionDefinition(EPSG32632_WKT2);
        expect(projection.getCode()).to.be('EPSG:32632');
        expect(projection.getUnits()).to.be('m');
      });

      it('returns the same projection instance for repeated calls', () => {
        const p1 = fromProjectionDefinition(EPSG32632_WKT2);
        const p2 = fromProjectionDefinition(EPSG32632_WKT2);
        expect(p1).to.be(p2);
      });
    });
  });
});
