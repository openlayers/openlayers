import Google from '../../../../../src/ol/source/Google.js';

const validKey = 'valid-key';
const sessionId = 'test-session';

/**
 * @param {number} ms Milliseconds.
 * @return {Promise<void>} A promise that resolves after the given time.
 */
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * @param {string} url URL.
 * @param {RequestInit} config Config.
 * @return {Promise<Response>} A promise that resolves with the response.
 */
async function fetchSessionToken(url, config) {
  await delay(5);

  const requestUrl = new URL(url);
  if (requestUrl.searchParams.get('key') !== validKey) {
    const response = new Response(
      JSON.stringify({
        error: {message: 'API key not valid. Please pass a valid API key.'},
      }),
      {status: 400},
    );
    return Promise.resolve(response);
  }

  /**
   * @type {import("../../../../../src/ol/source/Google").SessionTokenRequest}
   */
  const requestBody = JSON.parse(config.body);

  /**
   * @type {import("../../../../../src/ol/source/Google").SessionTokenResponse}
   */
  const responseBody = {
    session: sessionId,
    expiry: Math.floor(600 + Date.now() / 1000).toString(),
    tileWidth: 256,
    tileHeight: 256,
    imageFormat: requestBody.imageFormat || 'png',
  };

  const response = new Response(JSON.stringify(responseBody), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  });
  return Promise.resolve(response);
}

describe('ol/source/Google', () => {
  let originalFetch;
  let source;
  beforeEach(() => {
    originalFetch = Google.prototype.fetchSessionToken;
    Google.prototype.fetchSessionToken = fetchSessionToken;
  });

  afterEach(() => {
    Google.prototype.fetchSessionToken = originalFetch;
    if (source) {
      source.dispose();
    }
  });

  describe('constructor', (done) => {
    it('creates a new source', () => {
      source = new Google({key: validKey});
      expect(source).to.be.a(Google);

      expect(source.tileGrid).not.to.be.ok();

      source.once('change', () => {
        expect(source.getState()).to.be('ready');
        expect(source.tileGrid).to.be.ok();
        done();
      });
    });

    it('sets error if key is not valid', (done) => {
      source = new Google({key: 'invalid'});
      source.once('change', () => {
        expect(source.getState()).to.be('error');
        expect(source.getError().message).to.be(
          'API key not valid. Please pass a valid API key.',
        );
        done();
      });
    });
  });

  describe('tileUrlFunction()', (done) => {
    it('returns a url that includes the session and api key', () => {
      source = new Google({key: validKey});
      expect(source).to.be.a(Google);

      source.once('change', () => {
        expect(source.getState()).to.be('ready');

        const url = new URL(
          source.tileUrlFunction([0, 0, 0], 1, source.getProjection()),
        );

        expect(url.searchParams.get('session')).to.be(sessionId);
        expect(url.searchParams.get('key').to.be(validKey));
        done();
      });
    });
  });
});
