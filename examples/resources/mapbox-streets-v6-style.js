// Styles for the mapbox-streets-v6 vector tile data set. Loosely based on
// https://docs.mapbox.com/vector-tiles/reference/mapbox-streets-v6/

function getMapboxStreetsV6Style() {
  const iconOffsetVariables = {};
  const iconProperties = {
    'icon-src': '../data/maki-4.0.0.png',
    'icon-size': [15, 15],
    'icon-offset': ['var', ['concat', 'offset-', ['get', 'maki']]],
  };

  // load sprite info into style variables
  fetch('../data/maki-4.0.0.json')
    .then((resp) => resp.json())
    .then((sprites) => {
      Object.keys(sprites).forEach((spriteId) => {
        const offset = sprites[spriteId];
        const shortId = spriteId.replace(/-[0-9]+$/, '');
        iconOffsetVariables[`offset-${shortId}`] = [offset.x, offset.y];
      });
    });

  /** @type {Array<import('../../src/ol/style/flat.js').Rule>} */
  return [
    {
      filter: [
        'all',
        ['==', ['get', 'layer'], 'landuse'],
        ['==', ['get', 'class'], 'park'],
      ],
      style: {
        'fill-color': '#d8e8c8',
      },
    },
    {
      filter: [
        'all',
        ['==', ['get', 'layer'], 'landuse'],
        ['==', ['get', 'class'], 'cemetery'],
      ],
      style: {
        'fill-color': '#e0e4dd',
      },
    },
    {
      filter: [
        'all',
        ['==', ['get', 'layer'], 'landuse'],
        ['==', ['get', 'class'], 'hospital'],
      ],
      style: {
        'fill-color': '#fde',
      },
    },
    {
      filter: [
        'all',
        ['==', ['get', 'layer'], 'landuse'],
        ['==', ['get', 'class'], 'school'],
      ],
      style: {
        'fill-color': '#f0e8f8',
      },
    },
    {
      filter: [
        'all',
        ['==', ['get', 'layer'], 'landuse'],
        ['==', ['get', 'class'], 'wood'],
      ],
      style: {
        'fill-color': 'rgb(233,238,223)',
      },
    },
    {
      filter: ['==', ['get', 'layer'], 'waterway'],
      style: {
        'stroke-color': '#a0c8f0',
        'stroke-width': 1,
      },
    },
    {
      filter: ['==', ['get', 'layer'], 'water'],
      style: {
        'fill-color': '#a0c8f0',
      },
    },
    {
      filter: [
        'all',
        ['==', ['get', 'layer'], 'aeroway'],
        ['==', ['geometry-type'], 'Polygon'],
      ],
      style: {
        'fill-color': 'rgb(242,239,235)',
      },
    },
    {
      filter: [
        'all',
        ['==', ['get', 'layer'], 'aeroway'],
        ['==', ['geometry-type'], 'LineString'],
        ['<=', ['resolution'], 76.43702828517625],
      ],
      style: {
        'fill-color': '#f0ede9',
      },
    },
    {
      filter: ['==', ['get', 'layer'], 'building'],
      style: {
        'fill-color': '#f2eae2',
        'stroke-color': '#dfdbd7',
        'stroke-width': 1,
      },
    },
    {
      filter: [
        'all',
        ['==', ['get', 'layer'], 'tunnel'],
        ['==', ['get', 'class'], 'motorway_link'],
      ],
      style: {
        'stroke-color': '#e9ac77',
        'stroke-width': 1,
      },
    },
    {
      filter: [
        'all',
        ['==', ['get', 'layer'], 'tunnel'],
        ['==', ['get', 'class'], 'service'],
      ],
      style: {
        'stroke-color': '#cfcdca',
        'stroke-width': 1,
      },
    },
    {
      filter: [
        'all',
        ['==', ['get', 'layer'], 'tunnel'],
        [
          'any',
          ['==', ['get', 'class'], 'street'],
          ['==', ['get', 'class'], 'street_limited'],
        ],
      ],
      style: {
        'stroke-color': '#cfcdca',
        'stroke-width': 1,
      },
    },

    {
      filter: [
        'all',
        ['==', ['get', 'layer'], 'tunnel'],
        ['==', ['get', 'class'], 'main'],
        ['<=', ['resolution'], 1222.99245256282],
      ],
      style: {
        'stroke-color': '#e9ac77',
        'stroke-width': 1,
      },
    },
    {
      filter: [
        'all',
        ['==', ['get', 'layer'], 'tunnel'],
        ['==', ['get', 'class'], 'motorway'],
      ],
      style: {
        'stroke-color': '#e9ac77',
        'stroke-width': 1,
      },
    },
    {
      filter: [
        'all',
        ['==', ['get', 'layer'], 'tunnel'],
        ['==', ['get', 'class'], 'path'],
      ],
      style: {
        'stroke-color': '#cba',
        'stroke-width': 1,
      },
    },
    {
      filter: [
        'all',
        ['==', ['get', 'layer'], 'tunnel'],
        ['==', ['get', 'class'], 'major_rail'],
      ],
      style: {
        'stroke-color': '#bbb',
        'stroke-width': 2,
      },
    },
    {
      filter: [
        'all',
        ['==', ['get', 'layer'], 'road'],
        ['==', ['get', 'class'], 'motorway_link'],
      ],
      style: {
        'stroke-color': '#e9ac77',
        'stroke-width': 1,
      },
    },
    {
      filter: [
        'all',
        ['==', ['get', 'layer'], 'road'],
        [
          'any',
          ['==', ['get', 'class'], 'street'],
          ['==', ['get', 'class'], 'street_limited'],
        ],
        ['==', ['geometry-type'], 'LineString'],
      ],
      style: {
        'stroke-color': '#cfcdca',
        'stroke-width': 1,
      },
    },
    {
      filter: [
        'all',
        ['==', ['get', 'layer'], 'road'],
        ['==', ['get', 'class'], 'main'],
        ['<=', ['resolution'], 1222.99245256282],
      ],
      style: {
        'stroke-color': '#e9ac77',
        'stroke-width': 1,
      },
    },
    {
      filter: [
        'all',
        ['==', ['get', 'layer'], 'road'],
        ['==', ['get', 'class'], 'motorway'],
        ['<=', ['resolution'], 4891.96981025128],
      ],
      style: {
        'stroke-color': '#e9ac77',
        'stroke-width': 1,
      },
    },
    {
      filter: [
        'all',
        ['==', ['get', 'layer'], 'road'],
        ['==', ['get', 'class'], 'path'],
      ],
      style: {
        'stroke-color': '#cba',
        'stroke-width': 1,
      },
    },
    {
      filter: [
        'all',
        ['==', ['get', 'layer'], 'road'],
        ['==', ['get', 'class'], 'major_rail'],
      ],
      style: {
        'stroke-color': '#bbb',
        'stroke-width': 2,
      },
    },
    {
      filter: [
        'all',
        ['==', ['get', 'layer'], 'bridge'],
        ['==', ['get', 'class'], 'motorway_link'],
      ],
      style: {
        'stroke-color': '#e9ac77',
        'stroke-width': 1,
      },
    },
    {
      filter: [
        'all',
        ['==', ['get', 'layer'], 'bridge'],
        ['==', ['get', 'class'], 'motorway'],
      ],
      style: {
        'stroke-color': '#e9ac77',
        'stroke-width': 1,
      },
    },
    {
      filter: [
        'all',
        ['==', ['get', 'layer'], 'bridge'],
        ['==', ['get', 'class'], 'service'],
      ],
      style: {
        'stroke-color': '#cfcdca',
        'stroke-width': 1,
      },
    },
    {
      filter: [
        'all',
        ['==', ['get', 'layer'], 'bridge'],
        [
          'any',
          ['==', ['get', 'class'], 'street'],
          ['==', ['get', 'class'], 'street_limited'],
        ],
      ],
      style: {
        'stroke-color': '#cfcdca',
        'stroke-width': 1,
      },
    },
    {
      filter: [
        'all',
        ['==', ['get', 'layer'], 'bridge'],
        ['==', ['get', 'class'], 'main'],
        ['<=', ['resolution'], 1222.99245256282],
      ],
      style: {
        'stroke-color': '#e9ac77',
        'stroke-width': 1,
      },
    },
    {
      filter: [
        'all',
        ['==', ['get', 'layer'], 'bridge'],
        ['==', ['get', 'class'], 'path'],
      ],
      style: {
        'stroke-color': '#cba',
        'stroke-width': 1,
      },
    },
    {
      filter: [
        'all',
        ['==', ['get', 'layer'], 'bridge'],
        ['==', ['get', 'class'], 'major_rail'],
      ],
      style: {
        'stroke-color': '#bbb',
        'stroke-width': 2,
      },
    },
    {
      filter: [
        'all',
        ['==', ['get', 'layer'], 'admin'],
        ['>=', ['get', 'admin_level'], 3],
        ['==', ['get', 'maritime'], 0],
      ],
      style: {
        'stroke-color': '#9e9cab',
        'stroke-width': 1,
      },
    },
    {
      filter: [
        'all',
        ['==', ['get', 'layer'], 'admin'],
        ['==', ['get', 'admin_level'], 2],
        ['==', ['get', 'disputed'], 0],
        ['==', ['get', 'maritime'], 0],
      ],
      style: {
        'stroke-color': '#9e9cab',
        'stroke-width': 1,
      },
    },
    {
      filter: [
        'all',
        ['==', ['get', 'layer'], 'admin'],
        ['==', ['get', 'admin_level'], 2],
        ['==', ['get', 'disputed'], 1],
        ['==', ['get', 'maritime'], 0],
      ],
      style: {
        'stroke-color': '#9e9cab',
        'stroke-width': 1,
      },
    },
    {
      filter: [
        'all',
        ['==', ['get', 'layer'], 'admin'],
        ['>=', ['get', 'admin_level'], 3],
        ['==', ['get', 'maritime'], 1],
      ],

      style: {
        'stroke-color': '#a0c8f0',
        'stroke-width': 1,
      },
    },
    {
      filter: [
        'all',
        ['==', ['get', 'layer'], 'admin'],
        ['==', ['get', 'admin_level'], 2],
        ['==', ['get', 'maritime'], 1],
      ],

      style: {
        'stroke-color': '#a0c8f0',
        'stroke-width': 1,
      },
    },
    {
      filter: [
        'all',
        ['==', ['get', 'layer'], 'country_label'],
        ['==', ['get', 'scalerank'], 1],
      ],
      style: {
        'text-value': ['get', 'name_en'],
        'text-font': 'bold 11px "Open Sans", "Arial Unicode MS"',
        'text-fill-color': '#334',
        'text-stroke-color': 'rgba(255,255,255,0.8)',
        'text-stroke-width': 2,
      },
    },
    {
      filter: [
        'all',
        ['==', ['get', 'layer'], 'country_label'],
        ['==', ['get', 'scalerank'], 2],
        ['<=', ['resolution'], 19567.87924100512],
      ],
      style: {
        'text-value': ['get', 'name_en'],
        'text-font': 'bold 10px "Open Sans", "Arial Unicode MS"',
        'text-fill-color': '#334',
        'text-stroke-color': 'rgba(255,255,255,0.8)',
        'text-stroke-width': 2,
      },
    },
    {
      filter: [
        'all',
        ['==', ['get', 'layer'], 'country_label'],
        ['==', ['get', 'scalerank'], 3],
        ['<=', ['resolution'], 9783.93962050256],
      ],
      style: {
        'text-value': ['get', 'name_en'],
        'text-font': 'bold 9px "Open Sans", "Arial Unicode MS"',
        'text-fill-color': '#334',
        'text-stroke-color': 'rgba(255,255,255,0.8)',
        'text-stroke-width': 2,
      },
    },
    {
      filter: [
        'all',
        ['==', ['get', 'layer'], 'country_label'],
        ['==', ['get', 'scalerank'], 4],
        ['<=', ['resolution'], 4891.96981025128],
      ],
      style: {
        'text-value': ['get', 'name_en'],
        'text-font': 'bold 8px "Open Sans", "Arial Unicode MS"',
        'text-fill-color': '#334',
        'text-stroke-color': 'rgba(255,255,255,0.8)',
        'text-stroke-width': 2,
      },
    },
    {
      filter: [
        'all',
        ['==', ['get', 'layer'], 'marine_label'],
        ['==', ['get', 'labelrank'], 1],
        ['==', ['geometry-type'], 'Point'],
      ],
      style: {
        'text-value': ['get', 'name_en'],
        'text-font': 'italic 11px "Open Sans", "Arial Unicode MS"',
        'text-fill-color': '#74aee9',
        'text-stroke-color': 'rgba(255,255,255,0.8)',
        'text-stroke-width': 1,
      },
    },
    {
      filter: [
        'all',
        ['==', ['get', 'layer'], 'marine_label'],
        ['==', ['get', 'labelrank'], 2],
        ['==', ['geometry-type'], 'Point'],
      ],
      style: {
        'text-value': ['get', 'name_en'],
        'text-font': 'italic 11px "Open Sans", "Arial Unicode MS"',
        'text-fill-color': '#74aee9',
        'text-stroke-color': 'rgba(255,255,255,0.8)',
        'text-stroke-width': 1,
      },
    },
    {
      filter: [
        'all',
        ['==', ['get', 'layer'], 'marine_label'],
        ['==', ['get', 'labelrank'], 3],
        ['==', ['geometry-type'], 'Point'],
      ],
      style: {
        'text-value': ['get', 'name_en'],
        'text-font': 'italic 10px "Open Sans", "Arial Unicode MS"',
        'text-fill-color': '#74aee9',
        'text-stroke-color': 'rgba(255,255,255,0.8)',
        'text-stroke-width': 1,
      },
    },
    {
      filter: [
        'all',
        ['==', ['get', 'layer'], 'marine_label'],
        ['==', ['get', 'labelrank'], 4],
        ['==', ['geometry-type'], 'Point'],
      ],
      style: {
        'text-value': ['get', 'name_en'],
        'text-font': 'italic 9px "Open Sans", "Arial Unicode MS"',
        'text-fill-color': '#74aee9',
        'text-stroke-color': 'rgba(255,255,255,0.8)',
        'text-stroke-width': 1,
      },
    },
    {
      filter: [
        'all',
        ['==', ['get', 'layer'], 'place_label'],
        ['==', ['get', 'type'], 'city'],
        ['<=', ['resolution'], 1222.99245256282],
      ],
      style: {
        'text-value': ['get', 'name_en'],
        'text-font': '11px "Open Sans", "Arial Unicode MS"',
        'text-fill-color': '#333',
        'text-stroke-color': 'rgba(255,255,255,0.8)',
        'text-stroke-width': 1,
      },
    },
    {
      filter: [
        'all',
        ['==', ['get', 'layer'], 'place_label'],
        ['==', ['get', 'type'], 'town'],
        ['<=', ['resolution'], 305.748113140705],
      ],
      style: {
        'text-value': ['get', 'name_en'],
        'text-font': '9px "Open Sans", "Arial Unicode MS"',
        'text-fill-color': '#333',
        'text-stroke-color': 'rgba(255,255,255,0.8)',
        'text-stroke-width': 1,
      },
    },
    {
      filter: [
        'all',
        ['==', ['get', 'layer'], 'place_label'],
        ['==', ['get', 'type'], 'village'],
        ['<=', ['resolution'], 38.21851414258813],
      ],
      style: {
        'text-value': ['get', 'name_en'],
        'text-font': '8px "Open Sans", "Arial Unicode MS"',
        'text-fill-color': '#333',
        'text-stroke-color': 'rgba(255,255,255,0.8)',
        'text-stroke-width': 1,
      },
    },
    {
      filter: [
        'all',
        ['==', ['get', 'layer'], 'place_label'],
        ['<=', ['resolution'], 19.109257071294063],
        [
          'any',
          ['==', ['get', 'type'], 'hamlet'],
          ['==', ['get', 'type'], 'suburb'],
          ['==', ['get', 'type'], 'neighbourhood'],
        ],
      ],
      style: {
        'text-value': ['get', 'name_en'],
        'text-font': 'bold 9px "Arial Narrow"',
        'text-fill-color': '#633',
        'text-stroke-color': 'rgba(255,255,255,0.8)',
        'text-stroke-width': 1,
      },
    },

    // FIXME: missing to get icons to work:
    // canvas: dynamic icon offset, read from variables, dynamic var name
    // webgl: concat string, dynamic var name

    {
      filter: [
        'all',
        ['==', ['get', 'layer'], 'poi_label'],
        ['<=', ['resolution'], 19.109257071294063],
        ['==', ['get', 'scalerank'], 1],
        ['!=', ['get', 'maki'], 'marker'],
      ],
      style: {
        ...iconProperties,
        variables: iconOffsetVariables,
      },
    },
    {
      filter: [
        'all',
        ['==', ['get', 'layer'], 'poi_label'],
        ['<=', ['resolution'], 9.554628535647032],
        ['==', ['get', 'scalerank'], 2],
        ['!=', ['get', 'maki'], 'marker'],
      ],
      style: {
        ...iconProperties,
        variables: iconOffsetVariables,
      },
    },
    {
      filter: [
        'all',
        ['==', ['get', 'layer'], 'poi_label'],
        ['<=', ['resolution'], 4.777314267823516],
        ['==', ['get', 'scalerank'], 3],
        ['!=', ['get', 'maki'], 'marker'],
      ],
      style: {
        ...iconProperties,
        variables: iconOffsetVariables,
      },
    },
    {
      filter: [
        'all',
        ['==', ['get', 'layer'], 'poi_label'],
        ['<=', ['resolution'], 2.388657133911758],
        ['==', ['get', 'scalerank'], 4],
        ['!=', ['get', 'maki'], 'marker'],
      ],
      style: {
        ...iconProperties,
        variables: iconOffsetVariables,
      },
    },
    {
      filter: [
        'all',
        ['==', ['get', 'layer'], 'poi_label'],
        ['<=', ['resolution'], 1.194328566955879],
        ['==', ['get', 'scalerank'], 5],
        ['!=', ['get', 'maki'], 'marker'],
      ],
      style: {
        ...iconProperties,
        variables: iconOffsetVariables,
      },
    },
  ];
}
