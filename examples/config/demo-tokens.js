/**
 * Demo API tokens used in examples. Running JS keeps `value` so hosted maps
 * work. Displayed source replaces `value` with `cloak`. Optional `examples/.env`
 * entries named `env` override `value` during `vite serve` only.
 */
export const demoTokens = [
  {
    env: 'MAPBOX_KEY',
    value:
      'pk.eyJ1IjoiYWhvY2V2YXIiLCJhIjoiY2t0cGdwMHVnMGdlbzMxbDhwazBic2xrNSJ9.WbcTL9uj8JPAsnT9mgb7oQ',
    cloak: 'Your Mapbox access token from https://mapbox.com/ here',
  },
  {
    env: 'MAPTILER_KEY',
    value: 'get_your_own_D6rA4zTHduk6KOKTXzGB',
    cloak: 'Get your own API key at https://www.maptiler.com/cloud/',
  },
  {
    env: 'THUNDERFOREST_KEY',
    value: '0e6fc415256d4fbb9b5166a718591d71',
    cloak: 'Your API key from https://www.thunderforest.com/docs/apikeys/ here',
  },
  {
    env: 'NEXTZEN_KEY',
    value: 'uZNs91nMR-muUTP99MyBSg',
    cloak: 'Your Nextzen API key from https://developers.nextzen.org/',
  },
];
