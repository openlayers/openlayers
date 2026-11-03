import {assert} from 'chai';
import ImageTile from '../../../../src/ol/ImageTile.js';
import Tile from '../../../../src/ol/Tile.js';
import TileQueue, {getTilePriority} from '../../../../src/ol/TileQueue.js';
import TileState from '../../../../src/ol/TileState.js';
import {defaultImageLoadFunction} from '../../../../src/ol/source/Image.js';
import LRUCache from '../../../../src/ol/structs/LRUCache.js';
import {DROP} from '../../../../src/ol/structs/PriorityQueue.js';

describe('ol.TileQueue', function () {
  function addRandomPriorityTiles(tq, num) {
    let i, tile, priority;
    for (i = 0; i < num; i++) {
      tile = new Tile();
      priority = Math.floor(Math.random() * 100);
      tq.elements_.push([tile, '', [0, 0]]);
      tq.priorities_.push(priority);
      tq.queuedElements_[tile.getKey()] = true;
    }
  }

  let tileId = 0;
  function createImageTile(opt_tileLoadFunction) {
    ++tileId;
    const tileCoord = [tileId, tileId, tileId];
    const state = 0; // IDLE
    // The tile queue requires a unique URI for each item added.
    // Browsers still load the resource even if they don't understand
    // the charset.  So we create a unique URI by abusing the charset.
    const src =
      'data:image/gif;charset=junk-' +
      tileId +
      ';base64,R0lGODlhAQABAPAAAP8AAP///' +
      'yH5BAAAAAAALAAAAAABAAEAAAICRAEAOw==';

    const tileLoadFunction = opt_tileLoadFunction
      ? opt_tileLoadFunction
      : defaultImageLoadFunction;
    return new ImageTile(tileCoord, state, src, null, tileLoadFunction);
  }

  describe('getTilePriority()', function () {
    const tile = new Tile([5, 0, 0], TileState.IDLE);
    const sourceKey = 'source';

    function frameState(viewState, nextExtent) {
      return {
        viewState: Object.assign({center: [0, 0], resolution: 10}, viewState),
        nextExtent: nextExtent,
        wantedTiles: {[sourceKey]: {[tile.getKey()]: true}},
      };
    }

    // An animation from [0, 0] to [100000, 0], at 10 m per pixel, in a
    // 1000 x 1000 pixel viewport.
    const flying = frameState(
      {nextCenter: [100000, 0], nextResolution: 10},
      [95000, -5000, 105000, 5000],
    );

    it('ranks by zoom level and distance from the center at rest', function () {
      const atRest = frameState({});
      assert.isBelow(
        getTilePriority(atRest, tile, sourceKey, [0, 0], 10),
        getTilePriority(atRest, tile, sourceKey, [5000, 0], 10),
      );
      assert.isBelow(
        getTilePriority(atRest, tile, sourceKey, [5000, 0], 10),
        getTilePriority(atRest, tile, sourceKey, [0, 0], 20),
      );
    });

    it('ranks the destination of an animation before the area it passes over', function () {
      const here = getTilePriority(flying, tile, sourceKey, [0, 0], 10);
      const halfWay = getTilePriority(flying, tile, sourceKey, [50000, 0], 10);
      const destination = getTilePriority(
        flying,
        tile,
        sourceKey,
        [100000, 0],
        10,
      );
      const destinationEdge = getTilePriority(
        flying,
        tile,
        sourceKey,
        [104000, 4000],
        10,
      );
      assert.isBelow(destination, destinationEdge);
      assert.isBelow(destinationEdge, here);
      assert.isBelow(destinationEdge, halfWay);
      // Away from the destination, the order is unchanged.
      assert.isBelow(here, halfWay);
    });

    it('ranks coarser tiles at the destination behind its own zoom level', function () {
      const coarser = getTilePriority(flying, tile, sourceKey, [100000, 0], 20);
      assert.isBelow(
        getTilePriority(flying, tile, sourceKey, [104000, 4000], 10),
        coarser,
      );
      assert.isBelow(
        coarser,
        getTilePriority(flying, tile, sourceKey, [0, 0], 10),
      );
    });

    it('does not count finer tiles than the destination zoom level as destination', function () {
      const climbing = frameState(
        {nextCenter: [100000, 0], nextResolution: 40},
        [80000, -20000, 120000, 20000],
      );
      // The coarse destination tile first, the fine tile under it after.
      assert.isBelow(
        getTilePriority(climbing, tile, sourceKey, [100000, 0], 40),
        getTilePriority(climbing, tile, sourceKey, [100000, 0], 10),
      );
    });

    describe('at the zoom level boundary', function () {
      // The same animation at 20 m per pixel, in a 1000 x 1000 pixel viewport.
      const flyingAt20 = frameState(
        {nextCenter: [100000, 0], nextResolution: 20},
        [90000, -10000, 110000, 10000],
      );
      const destinationEdge = getTilePriority(
        flyingAt20,
        tile,
        sourceKey,
        [104000, 4000],
        20,
      );

      it('does not count a tile one level finer than the destination', function () {
        const oneLevelFiner = getTilePriority(
          flyingAt20,
          tile,
          sourceKey,
          [100000, 0],
          10,
        );
        assert.isBelow(destinationEdge, oneLevelFiner);
        assert.strictEqual(
          oneLevelFiner,
          getTilePriority(frameState({}), tile, sourceKey, [100000, 0], 10) +
            1e7,
        );
      });

      it('counts a tile coarser than half the destination resolution', function () {
        const nearlyAtLevel = getTilePriority(
          flyingAt20,
          tile,
          sourceKey,
          [100000, 0],
          12,
        );
        assert.isBelow(
          nearlyAtLevel,
          getTilePriority(flyingAt20, tile, sourceKey, [0, 0], 20),
        );
        assert.isBelow(nearlyAtLevel, 1e7);
      });
    });

    it('still drops tiles that are not wanted', function () {
      const unwanted = new Tile([5, 1, 1], TileState.IDLE);
      assert.strictEqual(
        getTilePriority(flying, unwanted, sourceKey, [100000, 0], 10),
        DROP,
      );
    });
  });

  describe('#loadMoreTiles()', function () {
    const noop = function () {};

    it('works when tile queues share tiles', () =>
      new Promise((resolve) => {
        const q1 = new TileQueue(noop, noop);
        const q2 = new TileQueue(noop, noop);

        const numTiles = 20;
        const maxLoading = numTiles / 2;

        let processedTiles = 0;
        for (let i = 0; i < numTiles; ++i) {
          const tile = createImageTile();
          tile.addEventListener('change', function processed() {
            const state = tile.getState();
            if (state === TileState.LOADED || state === TileState.ERROR) {
              tile.removeEventListener('change', processed);
              ++processedTiles;
            }
            if (processedTiles === numTiles) {
              setTimeout(finish, 0);
            }
          });
          q1.enqueue([tile]);
          q2.enqueue([tile]);
        }

        assert.equal(q1.getCount(), numTiles);
        assert.equal(q2.getCount(), numTiles);

        assert.equal(q1.getTilesLoading(), 0);
        assert.equal(q2.getTilesLoading(), 0);

        // ask both to load
        q1.loadMoreTiles(maxLoading, maxLoading);
        q2.loadMoreTiles(maxLoading, maxLoading);

        assert.equal(q1.getTilesLoading(), maxLoading);
        assert.equal(q2.getTilesLoading(), maxLoading);

        assert.equal(q1.getCount(), numTiles - maxLoading);
        assert.equal(q2.getCount(), 0);

        // let all tiles load
        function finish() {
          assert.equal(q1.getTilesLoading(), 0);
          assert.equal(q2.getTilesLoading(), 0);

          // ask both to load, this should clear q1
          q1.loadMoreTiles(maxLoading, maxLoading);
          q2.loadMoreTiles(maxLoading, maxLoading);

          assert.equal(q1.getCount(), 0);
          assert.equal(q2.getCount(), 0);

          resolve();
        }
      }));
  });

  describe('heapify', function () {
    it('does convert an arbitrary array into a heap', function () {
      const tq = new TileQueue(function () {});
      addRandomPriorityTiles(tq, 100);

      tq.heapify_();
    });
  });

  describe('reprioritize', function () {
    it('does reprioritize the array', function () {
      const tq = new TileQueue(function () {});
      addRandomPriorityTiles(tq, 100);

      tq.heapify_();

      // now reprioritize, changing the priority of 50 tiles and removing the
      // rest

      let i = 0;
      tq.priorityFunction_ = function () {
        if (i++ % 2 === 0) {
          return DROP;
        }
        return Math.floor(Math.random() * 100);
      };

      tq.reprioritize();
      assert.deepEqual(tq.elements_.length, 50);
      assert.deepEqual(tq.priorities_.length, 50);
    });
  });

  describe('tile change event', function () {
    const noop = function () {};

    it('loaded tiles', function () {
      const tq = new TileQueue(noop, noop);
      const tile = createImageTile();
      assert.strictEqual(tile.hasListener('change'), false);

      tq.enqueue([tile]);
      assert.strictEqual(tile.hasListener('change'), true);

      tile.setState(TileState.LOADED);
      assert.strictEqual(tile.hasListener('change'), false);
    });

    it('error tiles - with retry', () =>
      new Promise((resolve, reject) => {
        const tq = new TileQueue(noop, noop);
        const tile = createImageTile(noop);

        tq.enqueue([tile]);
        tq.loadMoreTiles(Infinity, Infinity);
        assert.deepEqual(tq.getTilesLoading(), 1);
        assert.deepEqual(tile.getState(), 1);

        tile.setState(TileState.ERROR);
        assert.deepEqual(tq.getTilesLoading(), 0);
        assert.strictEqual(tile.hasListener('change'), true);

        tile.setState(TileState.IDLE);
        setTimeout(() => tile.setState(TileState.LOADING), 100);
        setTimeout(() => tile.setState(TileState.LOADED), 200);
        setTimeout(() => {
          try {
            assert.deepEqual(tq.getTilesLoading(), 0);
            assert.strictEqual(tile.hasListener('change'), false);
            resolve();
          } catch (e) {
            reject(e);
          }
        }, 300);
      }));

    it('error tiles - without retry', () =>
      new Promise((resolve, reject) => {
        const tq = new TileQueue(noop, noop);
        const tile = createImageTile(noop);
        const tileCache = new LRUCache();
        tileCache.set(tile.getTileCoord().toString(), tile);

        tq.enqueue([tile]);
        tq.loadMoreTiles(Infinity, Infinity);
        assert.deepEqual(tq.getTilesLoading(), 1);
        assert.deepEqual(tile.getState(), 1);

        tile.setState(TileState.ERROR);
        assert.deepEqual(tq.getTilesLoading(), 0);
        assert.strictEqual(tile.hasListener('change'), true);

        setTimeout(() => tileCache.clear(), 100);
        setTimeout(() => {
          try {
            assert.deepEqual(tq.getTilesLoading(), 0);
            assert.strictEqual(tile.hasListener('change'), false);
            resolve();
          } catch (e) {
            reject(e);
          }
        }, 200);
      }));
  });
});
