/**
 * @module ol/source/GlTiles
 */

import Tile from '../Tile.js';
import TileState from '../TileState.js';
import {createCanvasContext2D} from '../dom.js';
import {toSize} from '../size.js';
import XYZ from './XYZ.js';
import TileImage from './TileImage.js';
import {getKeyZXY} from '../tilecoord.js';
import EventType from '../events/EventType.js';
import {listenOnce} from '../events.js';

class GlTile extends Tile {
  /**
   * @param {import("../tilecoord.js").TileCoord} tileCoord Tile coordinate.
   * @param {import("../size.js").Size} tileSize Tile size.
   *
   * @param {gl} The GL context from the parent GlTiles source
   * @param {texFetches} An array of `Promise`s for each of the textures to be
   * fetched for this tile.
   * @param {textures} An array of already-instantiated `WebGLTexture`s
   */
  constructor(tileCoord, tileSize, gl, texFetches = [], textures = []) {

    super(tileCoord, TileState.LOADING);

   /**
    * @private
    * @type {import("../size.js").Size}
    */
    this.tileSize_ = tileSize;

   /**
    * @private
    * @type {HTMLCanvasElement}
    */
    this.canvas_ = null;

    this.gl = gl;


    Promise.all(texFetches).then(loadedTextures =>{
      console.log('textures for tile: ',tileCoord, loadedTextures);

      // Attach textures to the tile source's already-defined texture buffers
      for (let i in loadedTextures) {
        if (loadedTextures[i] instanceof HTMLImageElement) {
          bindTextureImageData(gl, textures[i], Number(i), loadedTextures[i]);
        } else {
          console.warn("Could not attach texture", i, ": not an HTMLImageElement");
        }
      }

      // TODO: attach textures
      // TODO: copy-paste code from Leaflet.TileLayerGL's render() method
      // to update the per-tile attributes

		gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
		gl.clearColor(0.5, 0.5, 0.5, 0);
		gl.enable(gl.BLEND);

      // TODO: trigger draw call
    		// ... and then the magic happens.
		gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      const tileSize = this.tileSize_;
      const context2d = createCanvasContext2D(tileSize[0], tileSize[1]);

      /// Copy gl canvas over tile's canvas

      context2d.drawImage(gl.canvas, 0, 0);
      this.canvas_ = context2d.canvas;

//       this.state = TileState.LOADED;
//       this.changed(); // Notifies the tile layer containing this tile that the tile has changed
      this.setState(TileState.LOADED);

      return context2d.canvas;
    });

//     setTimeout(function(){
//     }.bind(this), Math.random() * 10000);

  }

  /**
  * Get the image element for this tile.
  * @return {HTMLCanvasElement} Image.
  */
  getImage() {
      return this.canvas_;
  }

  /**
  * @override
  */
  load() {}

}


/**
 * @typedef {Object} Options
 * @property {import("../proj.js").ProjectionLike} [projection='EPSG:3857'] Optional projection.
 * @property {import("../tilegrid/TileGrid.js").default} [tileGrid] Tile grid.
 * @property {boolean} [wrapX=true] Whether to wrap the world horizontally.
 * @property {number} [zDirection=0] Set to `1` when debugging `VectorTile` sources with
 * a default configuration. Indicates which resolution should be used by a renderer if
 * the view resolution does not match any resolution of the tile source. If 0, the nearest
 * resolution will be used. If 1, the nearest lower resolution will be used. If -1, the
 * nearest higher resolution will be used.
 *
 * @property {textureSources} An array of texture sources, each element being
 * either a `TileImage` source, or a GeoTIFF. (TODO: implement GeoTIFFs)
 * @property {fragmentShader} A string representing the GLSL fragment shader
 * to be run. This must NOT include defining the variants, nor the texture uniforms,
 * nor user-defined uniforms.
 *
 * TODO:
 * @property {uniforms} A plain object containing a map of uniform names and their
 * initial values. Values must be a `Number` or an `Array` of up to four `Number`s.
 */


/**
 * @classdesc
 * A pseudo tile source, which does not fetch tiles from a server, but renders
 * a grid outline for the tile grid/projection along with the coordinates for
 * each tile. Each tile is rendered after a random delay.
 *
 * Uses Canvas context2d, so requires Canvas support.
 * @api
 */
class GlTiles extends XYZ {
  /**
   * @param {Options=} opt_options Debug tile options.
   */
  constructor(opt_options) {
    /**
     * @type {Options}
     */
    const options = opt_options || {};

    super({
      opaque: false,
      projection: options.projection,
      tileGrid: options.tileGrid,
      wrapX: options.wrapX !== undefined ? options.wrapX : true,
      zDirection: options.zDirection
    });

    this.fragmentShader = options.fragmentShader || "void main(void) {gl_FragColor = vec4(0.2,0.2,0.2,1.0);}";

    this.uniforms = options.uniforms || {};

    this.texSources = options.textureSources || [];


    // Init WebGL context. Mostly copy-pasted from Leaflet.TileLayerGL.
    this._renderer = document.createElement("canvas");
		this._renderer.width = this._renderer.height = 256; /// FIXME: fetch from tilegrid
		this._glError = false;

		const gl = (this._gl =
			this._renderer.getContext("webgl", {
				premultipliedAlpha: false,
			}) ||
			this._renderer.getContext("experimental-webgl", {
				premultipliedAlpha: false,
			}));
		gl.viewportWidth = 256; /// FIXME: fetch from tilegrid
		gl.viewportHeight = 256; /// FIXME: fetch from tilegrid

		this.loadGLProgram_();

		// TODO: Init textures based on the `textureSources` constructor parameter
// 		this._textures = [];
// 		for (i = 0; i < this._tileLayers.length && i < 8; i++) {
// 			this._textures[i] = gl.createTexture();
// 			gl.uniform1i(gl.getUniformLocation(this._glProgram, "uTexture" + i), i);
// 		}

    /// for DEBUG only
//     document.body.append(this._renderer);

  }

  /**
  * @inheritDoc
  */
  getTile(z, x, y) {
    const tileCoordKey = getKeyZXY(z, x, y);
    if (this.tileCache.containsKey(tileCoordKey)) {
      return /** @type {!LabeledTile} */ (this.tileCache.get(tileCoordKey));
    } else {
      const tileSize = toSize(this.tileGrid.getTileSize(z));
      const tileCoord = [z, x, y];
//       const textTileCoord = this.getTileCoordForTileUrlFunction(tileCoord);
//       let text;
//       if (textTileCoord) {
//         text = 'z:' + textTileCoord[0] + ' x:' + textTileCoord[1] + ' y:' + textTileCoord[2];
//       } else {
//         text = 'none';
//       }

      const texFetches = [];
      for (const i in this.texSources) {
        if (this.texSources[i] instanceof TileImage) {
          // For image-based tile sources, wrap the load/error events into a promise
          texFetches[i] = new Promise((res, rej)=>{
            const tile = this.texSources[i].getTile(z, x, y);

            listenOnce(tile.getImage(), EventType.LOAD, (ev)=>{
              console.log('texture source tile loaded: ',ev);
              res(ev.path[0]);
            });
            listenOnce(tile.getImage(), EventType.ERROR, (ev)=>{
              console.log('texture source errored: ',ev);
              rej(ev.path[0]);
            });

            tile.load();
          });
        } else {
          // TODO: geotiff.js not implemented yet
          console.warn('GLTiles expected a TileImage source, got:', this.texSources[i]);
        }
      }


      // Instantiate tile, pass an array of texfetches for this particular tile,
      // and the instances of WebGLTexture (so they can be re-put into the texture units)
      const tile = new GlTile(tileCoord, tileSize, this._gl, texFetches, this.textures_);

      // Listen to the tile when it has finished loading, mark the tile layer as
      // changed in order to trigger a redraw
      tile.addEventListener(EventType.CHANGE, this.changed.bind(this));


      /// TODO: How to set caches of fetched tile textures? Right now the strategy is
      /// to cache the already-rendered tiles.
      this.tileCache.set(tileCoordKey, tile);
      return tile;
    }
  }


  loadGLProgram_() {
    // Mostly copy-pasted from Leaflet.TileLayerGL's code.
		const gl = this._gl;

		// Force using this vertex shader.
		// Just copy all attributes to predefined variants and set the vertex positions
		const vertexShaderCode =
			"attribute vec2 aVertexCoords;  " +
			"attribute vec2 aTextureCoords;  " +
			"attribute vec2 aCRSCoords;  " +
			"attribute vec2 aLatLngCoords;  " +
			"varying vec2 vTextureCoords;  " +
			"varying vec2 vCRSCoords;  " +
			"varying vec2 vLatLngCoords;  " +
			"void main(void) {  " +
			"	gl_Position = vec4(aVertexCoords , 1.0, 1.0);  " +
			"	vTextureCoords = aTextureCoords;  " +
			"	vCRSCoords = aCRSCoords;  " +
			"	vLatLngCoords = aLatLngCoords;  " +
			"}";

		// Force using this bit for the fragment shader. All fragment shaders
		// will use the same predefined variants, and
		let fragmentShaderHeader =
			"precision highp float;\n" +
			"uniform float uNow;\n" +
			"varying vec2 vTextureCoords;\n" +
			"varying vec2 vCRSCoords;\n" +
			"varying vec2 vLatLngCoords;\n";

      /// TODO: enable textures
		for (let i = 0; i < this.texSources.length && i < 8; i++) {
			fragmentShaderHeader += "uniform sampler2D uTexture" + i + ";\n";
		}

		fragmentShaderHeader += this.getUniformSizes_();

		const program = (this._glProgram = gl.createProgram());
		const vertexShader = gl.createShader(gl.VERTEX_SHADER);
		const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
		gl.shaderSource(vertexShader, vertexShaderCode);
		gl.shaderSource(fragmentShader, fragmentShaderHeader + this.fragmentShader);
		gl.compileShader(vertexShader);
		gl.compileShader(fragmentShader);

		// @event shaderError
		// Fired when there was an error creating the shaders.
		if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
			this._glError = gl.getShaderInfoLog(vertexShader);
			console.error(this._glError);
			return null;
		}
		if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
			this._glError = gl.getShaderInfoLog(fragmentShader);
			console.error(this._glError);
			return null;
		}

		gl.attachShader(program, vertexShader);
		gl.attachShader(program, fragmentShader);
		gl.linkProgram(program);
		gl.useProgram(program);

		// There will be four vec2 vertex attributes per vertex - aCRSCoords and
		// aTextureCoords
		this._aVertexPosition = gl.getAttribLocation(program, "aVertexCoords");
		this._aTexPosition = gl.getAttribLocation(program, "aTextureCoords");
		this._aCRSPosition = gl.getAttribLocation(program, "aCRSCoords");
		this._aLatLngPosition = gl.getAttribLocation(program, "aLatLngCoords");

		this.initUniforms_(program);

		// If the shader is time-dependent (i.e. animated), or has custom uniforms,
		// init the texture cache
    /// FIXME
// 		if (this._isReRenderable) {
// 			this._fetchedTextures = {};
// 			this._2dContexts = {};
// 		}

		// 		console.log('Tex position: ', this._aTexPosition);
		// 		console.log('CRS position: ', this._aCRSPosition);
		// 		console.log("uNow position: ", this._uNowPosition);

		// Create four data buffer with 8 elements each - the (easting,northing)
		// CRS coords, idem for LatLng coords, the (s,t) texture coords and
		// the (x,y) viewport coords for each of the 4 vertices
		// Data for the texel and viewport coords is totally static, and
		// needs to be declared only once.
		this._CRSBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this._CRSBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(8), gl.STATIC_DRAW);
		if (this._aCRSPosition !== -1) {
			gl.enableVertexAttribArray(this._aCRSPosition);
			gl.vertexAttribPointer(this._aCRSPosition, 2, gl.FLOAT, false, 8, 0);
		}

		this._LatLngBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this._LatLngBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(8), gl.STATIC_DRAW);
		if (this._aLatLngPosition !== -1) {
			gl.enableVertexAttribArray(this._aLatLngPosition);
			gl.vertexAttribPointer(this._aLatLngPosition, 2, gl.FLOAT, false, 8, 0);
		}

		this._TexCoordsBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this._TexCoordsBuffer);

		// prettier-ignore
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
			1.0, 0.0,
			0.0, 0.0,
			1.0, 1.0,
			0.0, 1.0,
		]), gl.STATIC_DRAW);
		if (this._aTexPosition !== -1) {
			gl.enableVertexAttribArray(this._aTexPosition);
			gl.vertexAttribPointer(this._aTexPosition, 2, gl.FLOAT, false, 8, 0);
		}

		this._VertexCoordsBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this._VertexCoordsBuffer);

		// prettier-ignore
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
			 1,  1,
			-1,  1,
			 1, -1,
			-1, -1
		]), gl.STATIC_DRAW);
		if (this._aVertexPosition !== -1) {
			gl.enableVertexAttribArray(this._aVertexPosition);
			gl.vertexAttribPointer(this._aVertexPosition, 2, gl.FLOAT, false, 8, 0);
		}

    // Init textures
		this.textures_ = [];
		for (let i = 0; i < this.texSources.length && i < 8; i++) {
			this.textures_[i] = gl.createTexture();
			gl.uniform1i(gl.getUniformLocation(program, "uTexture" + i), i);
		}

  }


	// Looks at the size of the default values given for the uniforms.
	// Returns a string valid for defining the uniforms in the shader header.
  getUniformSizes_(){
    return "";
    /// FIXME
// 		var defs = "";
// 		this._uniformSizes = {};
// 		for (var uniformName in this.options.uniforms) {
// 			var defaultValue = this.options.uniforms[uniformName];
// 			if (typeof defaultValue === "number") {
// 				this._uniformSizes[uniformName] = 0;
// 				defs += "uniform float " + uniformName + ";\n";
// 			} else if (typeof defaultValue === "array") {
// 				if (defaultValue.length > 4) {
// 					throw new Error("Max size for uniform value is 4 elements");
// 				}
// 				this._uniformSizes[uniformName] = defaultValue.length;
// 				if (defaultValue.length === 1) {
// 					defs += "uniform float " + uniformName + ";\n";
// 				} else {
// 					defs += "uniform vec" + defaultValue.length + " " + uniformName + ";\n";
// 				}
// 			} else {
// 				throw new Error(
// 					"Default value for uniforms must be either number or array of numbers"
// 				);
// 			}
// 		}
// 		return defs;
  }


  // Inits the uNow uniform, and the user-provided uniforms, given the current GL program.
	// Sets the _isReRenderable property if there are any set uniforms.
  initUniforms_(){
    /// TODO
//     var gl = this._gl;
// 		this._uNowPosition = gl.getUniformLocation(program, "uNow");
// 		this._isReRenderable = false;
//
// 		if (this._uNowPosition) {
// 			gl.uniform1f(this._uNowPosition, performance.now());
// 			this._isReRenderable = true;
// 		}
//
// 		this._uniformLocations = {};
// 		for (var uniformName in this.options.uniforms) {
// 			this._uniformLocations[uniformName] = gl.getUniformLocation(program, uniformName);
// 			this.setUniform(uniformName, this.options.uniforms[uniformName]);
// 			this._isReRenderable = true;
// 		}
  }
}






/**
  * Helper function. Binds a ImageData (HTMLImageElement, HTMLCanvasElement or
  * ImageBitmap) to a texture, given its index (0 to 7).
  * @param {index} The 0-indexed texture index
  * @param {imageData} An instance of ImageData with the 8-bit RGBA data
  * @return undefined
  */
function bindTextureImageData(gl, texture, index, imageData) {

  gl.activeTexture(gl.TEXTURE0 + index);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, imageData);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.generateMipmap(gl.TEXTURE_2D);
}



export default GlTiles;
