/**
 * @module ol/TileQueue
 */
import TileState from './TileState.js';
import EventType from './events/EventType.js';
import PriorityQueue, {DROP} from './structs/PriorityQueue.js';

/**
 * @typedef {function(import("./Tile.js").default, string, import('./tilecoord.js').TileCoord, number): number} PriorityFunction
 */

/**
 * @typedef {[import('./Tile.js').default, string, import('./tilecoord.js').TileCoord, number]} TileQueueElement
 */

/**
 * @extends PriorityQueue<TileQueueElement>}
 */
class TileQueue extends PriorityQueue {
  /**
   * @param {PriorityFunction} tilePriorityFunction Tile priority function.
   * @param {function(): ?} tileChangeCallback Function called on each tile change event.
   */
  constructor(tilePriorityFunction, tileChangeCallback) {
    super(
      (element) => tilePriorityFunction.apply(null, element),
      (element) => element[0].getKey(),
    );

    /** @private */
    this.boundHandleTileChange_ = this.handleTileChange.bind(this);

    /**
     * @private
     * @type {function(): ?}
     */
    this.tileChangeCallback_ = tileChangeCallback;

    /**
     * @private
     * @type {number}
     */
    this.tilesLoading_ = 0;

    /**
     * @private
     * @type {!Object<string,boolean>}
     */
    this.tilesLoadingKeys_ = {};
  }

  /**
   * @param {TileQueueElement} element Element.
   * @return {boolean} The element was added to the queue.
   * @override
   */
  enqueue(element) {
    const added = super.enqueue(element);
    if (added) {
      const tile = element[0];
      tile.addEventListener(
        EventType.CHANGE,
        /** @type {import("./events.js").ListenerFunction} */ (
          this.boundHandleTileChange_
        ),
      );
    }
    return added;
  }

  /**
   * @return {number} Number of tiles loading.
   */
  getTilesLoading() {
    return this.tilesLoading_;
  }

  /**
   * @param {import("./events/Event.js").default} event Event.
   * @protected
   */
  handleTileChange(event) {
    const tile = /** @type {import("./Tile.js").default} */ (event.target);
    const state = tile.getState();
    if (
      state === TileState.LOADED ||
      state === TileState.ERROR ||
      state === TileState.EMPTY
    ) {
      if (state !== TileState.ERROR) {
        tile.removeEventListener(
          EventType.CHANGE,
          /** @type {import("./events.js").ListenerFunction} */ (
            this.boundHandleTileChange_
          ),
        );
      }
      const tileKey = tile.getKey();
      if (tileKey in this.tilesLoadingKeys_) {
        delete this.tilesLoadingKeys_[tileKey];
        --this.tilesLoading_;
      }
      this.tileChangeCallback_();
    }
  }

  /**
   * @param {number} maxTotalLoading Maximum number tiles to load simultaneously.
   * @param {number} maxNewLoads Maximum number of new tiles to load.
   */
  loadMoreTiles(maxTotalLoading, maxNewLoads) {
    let newLoads = 0;
    while (
      this.tilesLoading_ < maxTotalLoading &&
      newLoads < maxNewLoads &&
      this.getCount() > 0
    ) {
      const tile = this.dequeue()[0];
      const tileKey = tile.getKey();
      const state = tile.getState();
      if (state === TileState.IDLE && !(tileKey in this.tilesLoadingKeys_)) {
        this.tilesLoadingKeys_[tileKey] = true;
        ++this.tilesLoading_;
        ++newLoads;
        tile.load();
      }
    }
  }
}

export default TileQueue;

/**
 * Offset that puts a tile behind every tile of the views an animation starts
 * from and ends in. It exceeds the whole range of the zoom level term (65536
 * times the logarithm of resolutions from about 1e-3 to 1e6) plus the distance
 * term of a tile within a viewport of either view's center.
 * @type {number}
 */
const BEHIND_VIEWS = 1e7;

/**
 * Whether a tile is part of a view: inside its extent (or straddling its edge,
 * for tiles up to 512 pixels), and not finer than the zoom level drawn there.
 * The level is not known here, so a tile counts when its resolution is more
 * than half the view's resolution, which admits the level nearest to it and
 * every coarser one.
 * @param {import("./extent.js").Extent} extent Extent of the view.
 * @param {number} resolution Resolution of the view.
 * @param {import("./coordinate.js").Coordinate} tileCenter Tile center.
 * @param {number} tileResolution Tile resolution.
 * @return {boolean} The tile is part of the view.
 */
function isInView(extent, resolution, tileCenter, tileResolution) {
  // Half a 512 pixel tile, for tiles straddling the edge of the extent.
  const margin = 256 * tileResolution;
  return (
    tileResolution > resolution / 2 &&
    tileCenter[0] >= extent[0] - margin &&
    tileCenter[0] <= extent[2] + margin &&
    tileCenter[1] >= extent[1] - margin &&
    tileCenter[1] <= extent[3] + margin
  );
}

/**
 * @param {import('./Map.js').FrameState} frameState Frame state.
 * @param {import("./Tile.js").default} tile Tile.
 * @param {string} tileSourceKey Tile source key.
 * @param {import("./coordinate.js").Coordinate} tileCenter Tile center.
 * @param {number} tileResolution Tile resolution.
 * @return {number} Tile priority.
 */
export function getTilePriority(
  frameState,
  tile,
  tileSourceKey,
  tileCenter,
  tileResolution,
) {
  // Filter out tiles at higher zoom levels than the current zoom level, or that
  // are outside the visible extent.
  if (!frameState || !(tileSourceKey in frameState.wantedTiles)) {
    return DROP;
  }
  if (!frameState.wantedTiles[tileSourceKey][tile.getKey()]) {
    return DROP;
  }
  // Prioritize the highest zoom level tiles closest to the focus.
  // Tiles at higher zoom levels are prioritized using Math.log(tileResolution).
  // Within a zoom level, tiles are prioritized by the distance in pixels between
  // the center of the tile and the center of the viewport.  The factor of 65536
  // means that the prioritization should behave as desired for tiles up to
  // 65536 * Math.log(2) = 45426 pixels from the focus.
  const viewState = frameState.viewState;
  const nextExtent = frameState.nextExtent;
  const startExtent = frameState.startExtent;
  let center = viewState.center;
  let inViews = false;
  if (nextExtent && viewState.nextCenter && viewState.nextResolution) {
    // A tile of the view the animation started from ranks with the
    // destination, by its distance from the start center. A tile of both
    // views counts as a destination tile.
    if (
      isInView(nextExtent, viewState.nextResolution, tileCenter, tileResolution)
    ) {
      center = viewState.nextCenter;
      inViews = true;
    } else if (
      startExtent &&
      viewState.startCenter &&
      viewState.startResolution &&
      isInView(
        startExtent,
        viewState.startResolution,
        tileCenter,
        tileResolution,
      )
    ) {
      center = viewState.startCenter;
      inViews = true;
    }
  }
  const deltaX = tileCenter[0] - center[0];
  const deltaY = tileCenter[1] - center[1];
  const priority =
    65536 * Math.log(tileResolution) +
    Math.sqrt(deltaX * deltaX + deltaY * deltaY) / tileResolution;
  // During an animation, the tiles of the views where it starts and ends come
  // before the tiles of the area it passes over, which are only on screen for
  // a moment.
  return nextExtent && !inViews ? priority + BEHIND_VIEWS : priority;
}
