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
   * @param {import("../extent.js").Extent} tileExtent BBox of the tile, in the map's display CRS.
   *
   * @param {WebGLContext} gl The GL context from the parent GlTiles source
   * @param {Promise[]} texFetches An array of `Promise`s for each of the textures to be fetched for this tile.
   * @param {WbGLTexture[]} textures An array of already-instantiated `WebGLTexture`s
   */
  constructor(tileCoord, tileSize, tileExtent, gl, texFetches = [], textures = []) {

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

      // Attach textures to the tile source's already-defined texture buffers
      for (const i in loadedTextures) {
        if (loadedTextures[i] instanceof HTMLImageElement) {
          bindTextureImageData(gl, textures[i], Number(i), loadedTextures[i]);
        } else if (loadedTextures[i][0] && loadedTextures[i][0].BYTES_PER_ELEMENT) {
          // Assume this is the result from a geotiff call, get one of the channels
          // in this case, always channel 0 (as per loadedTextures[i][ **0** ]
          bindTextureTypedArray(gl, textures[i], Number(i), loadedTextures[i][0], loadedTextures[i].width, loadedTextures[i].height);
        } else {
          throw new Error('Could not attach texture ' + i + ': not an HTMLImageElement or a GeoTiff slice');
        }
      }

      // TODO: copy-paste code from Leaflet.TileLayerGL's render() method
      // to update the per-tile attributes

      gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
      gl.clearColor(0.5, 0.5, 0.5, 0);
      gl.enable(gl.BLEND);

      // Trigger draw call. Magic happens here.
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      const tileSize = this.tileSize_;
      const context2d = createCanvasContext2D(tileSize[0], tileSize[1]);

      /// Copy gl canvas over tile's canvas
      context2d.drawImage(gl.canvas, 0, 0);
      this.canvas_ = context2d.canvas;

      return context2d.canvas;
    });
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

    this.fragmentShader = options.fragmentShader || 'void main(void) {gl_FragColor = vec4(0.2,0.2,0.2,1.0);}';

    this.uniforms = options.uniforms || {};

    this.texSources = options.textureSources || [];


    /// FIXME. This is a hack.
    /// Check whether the tileGrid has one tile size, or multiple tile sizes (one per
    /// zoom level, as per some WMTS implementations). In the later case, error out.
    /// The rationale is that having several tile sizes complicates the logic for
    /// the <canvas> element used for the WebGL context. It should be possible
    /// to handle a dynamic tile size (knowing the maximum tile area, then rendering
    /// only in the needed area for the given zoom level), but that's left as a TODO.

    if (!options.tileGrid.tileSize_) {
      throw new Error('GlTiles can not work on a tileGrid with multiple tile sizes.');
    }

    const tileSize = this.tileGrid.getTileSize();

    // Init WebGL context. Mostly copy-pasted from Leaflet.TileLayerGL.
    this._renderer = document.createElement('canvas');
    this._renderer.width = tileSize[0];
    this._renderer.height = tileSize[1];
    this._glError = false;

    this._gl =
      this._renderer.getContext('webgl', {
        premultipliedAlpha: false
      }) ||
      this._renderer.getContext('experimental-webgl', {
        premultipliedAlpha: false
      });
    this._gl.viewportWidth = tileSize[0];
    this._gl.viewportHeight = tileSize[1];

    this.loadGLProgram_();
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

      // Get the projected coords for the tile
      const tileExtent = this.getTileGrid().getTileCoordExtent(tileCoord, this.tmpExtent_);
      const texFetches = [];

      for (const i in this.texSources) {
        if (this.texSources[i] instanceof TileImage) {
          // For image-based tile sources, wrap the load/error events into a promise
          texFetches[i] = new Promise((res, rej)=>{
            const tile = this.texSources[i].getTile(z, x, y);

            listenOnce(tile.getImage(), EventType.LOAD, (ev)=>{
              // For whatever reason, some browsers (e.g. Chromium) do not follow the
              // DOM events standard and do not have the ev.target property. Fall back
              // to ev.path[0] in that case.
              res(ev.target || ev.path[0]);
              // console.log('texture source tile loaded: ',ev);
            });
            listenOnce(tile.getImage(), EventType.ERROR, (ev)=>{
              rej(ev.target || ev.path[0]);
              // console.log('texture source errored: ',ev);
            });

            tile.load();
          });
        } else if ('GeoTIFF' in window && this.texSources[i] instanceof window.GeoTIFF.GeoTIFF) {

          const tiff = this.texSources[i];

          texFetches[i] = tiff.getImage().then(function(img) {
            const w = img.getWidth();
            const h = img.getHeight();
            const bbox = img.getBoundingBox();

            // TODO: Allow developers to specify which sample to fetch. Given WebGL1 and
            // float32 channels, this shall allow *one* sample/channel per texture.
            // TODO: perform a sanity check on the samples per pixel of this geotiff, and
            // the requested sample.
            // const samplesPerPixel = img.getSamplesPerPixel();

            // Calculate the pixel coords to be fetched from the projected coords and the image size
            const x1 = ((tileExtent[2] - bbox[0]) / (bbox[2] - bbox[0])) * w;
            const x2 = ((tileExtent[0] - bbox[0]) / (bbox[2] - bbox[0])) * w;
            const y1 = ((tileExtent[3] - bbox[1]) / (bbox[3] - bbox[1])) * h;
            const y2 = ((tileExtent[1] - bbox[1]) / (bbox[3] - bbox[1])) * h;

            return tiff.readRasters({
              window: [x2, h - y1, x1, h - y2],
              width: 256, // tileSize.x,
              height: 256, // tileSize.y,
              // resampleMethod: 'nearest',
              samples: [0], /// FIXME: for now, read only the first channel
              fillValue: -999
            });
          });
        } else {
          throw new Error('GLTiles expected a TileImage source or a GeoTIFF definition, got:' + this.texSources[i]);
        }
      }

      // Instantiate tile, pass an array of texfetches for this particular tile,
      // and the instances of WebGLTexture (so they can be re-put into the texture units)
      const tile = new GlTile(tileCoord, tileSize, this.projection_, this._gl, texFetches, this.textures_);

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
			'attribute vec2 aVertexCoords;  ' +
			'attribute vec2 aTextureCoords;  ' +
			'attribute vec2 aCRSCoords;  ' +
			'attribute vec2 aLatLngCoords;  ' +
			'varying vec2 vTextureCoords;  ' +
			'varying vec2 vCRSCoords;  ' +
			'varying vec2 vLatLngCoords;  ' +
			'void main(void) {  ' +
			'	gl_Position = vec4(aVertexCoords , 1.0, 1.0);  ' +
			'	vTextureCoords = aTextureCoords;  ' +
			'	vCRSCoords = aCRSCoords;  ' +
			'	vLatLngCoords = aLatLngCoords;  ' +
			'}';

    // Force using this bit for the fragment shader. All fragment shaders
    // will use the same predefined varyings.
    let fragmentShaderHeader =
			'precision highp float;\n' +
			'uniform float uNow;\n' +
			'varying vec2 vTextureCoords;\n' +
			'varying vec2 vCRSCoords;\n' +
			'varying vec2 vLatLngCoords;\n';

    for (let i = 0; i < this.texSources.length && i < 8; i++) {
      fragmentShaderHeader += 'uniform sampler2D uTexture' + i + ';\n';
    }

    fragmentShaderHeader += this.getUniformSizes_();

    this._glProgram = gl.createProgram();
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
      throw this._glError;
    }
    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
      this._glError = gl.getShaderInfoLog(fragmentShader);
      throw this._glError;
    }

    gl.attachShader(this._glProgram, vertexShader);
    gl.attachShader(this._glProgram, fragmentShader);
    gl.linkProgram(this._glProgram);
    gl.useProgram(this._glProgram);

    // There will be four vec2 vertex attributes per vertex - aCRSCoords and
    // aTextureCoords
    this._aVertexPosition = gl.getAttribLocation(this._glProgram, 'aVertexCoords');
    this._aTexPosition = gl.getAttribLocation(this._glProgram, 'aTextureCoords');
    this._aCRSPosition = gl.getAttribLocation(this._glProgram, 'aCRSCoords');
    this._aLatLngPosition = gl.getAttribLocation(this._glProgram, 'aLatLngCoords');

    this.initUniforms_(this._glProgram);

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

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      1.0, 0.0,
      0.0, 0.0,
      1.0, 1.0,
      0.0, 1.0
    ]), gl.STATIC_DRAW);
    if (this._aTexPosition !== -1) {
      gl.enableVertexAttribArray(this._aTexPosition);
      gl.vertexAttribPointer(this._aTexPosition, 2, gl.FLOAT, false, 8, 0);
    }

    this._VertexCoordsBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this._VertexCoordsBuffer);

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      1, 1,
      -1, 1,
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
      gl.uniform1i(gl.getUniformLocation(this._glProgram, 'uTexture' + i), i);
    }

  }


  // Looks at the size of the default values given for the uniforms.
  // Returns a string valid for defining the uniforms in the shader header.
  getUniformSizes_() {
    return '';
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
  initUniforms_() {
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
  * @param {WebGLContext} gl The GL context to work in
  * @param {WebGLTexture} texture The 0-indexed texture index
  * @param {number} index The 0-indexed texture index
  * @param {ImageData} imageData An instance of ImageData with the 8-bit RGBA data
  * @return {undefined}
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


/**
  * Helper function. Binds a TypedArray to a texture, given its index (0 to 7).
  *
  * See https://www.khronos.org/registry/webgl/specs/latest/1.0/#5.14.8
  *
  * @param {WebGLContext} gl The GL context to work in
  * @param {WebGLTexture} texture The 0-indexed texture index
  * @param {number} index The 0-indexed texture index
  * @param {TypedArray} arr A TypedArray with 8-bit, 16-bit or 32-bit data
  * @param {number} w Width of the texture
  * @param {number} h Height of the texture
  * @return {undefined}
  */
function bindTextureTypedArray(gl, texture, index, arr, w, h) {

  //   void texImage2D(GLenum target, GLint level, GLint internalformat, GLsizei width, GLsizei height, GLint border, GLenum format, GLenum type, [AllowShared] ArrayBufferView? pixels) (OpenGL ES 2.0 §3.7.1, man page)
  //   void texImage2D(target, level, internalformat, width, height, border, format, type, pixels)
  //   void texImage2D(gl.TEXTURE_2D, 0, internalformat, width, height, border, format, type, pixels)

  // The only possible `internalformat` is 8-bit: « If pixels is non-null, the type of pixels must match the type of the data to be read. If it is UNSIGNED_BYTE, a Uint8Array or Uint8ClampedArray must be supplied; if it is UNSIGNED_SHORT_5_6_5, UNSIGNED_SHORT_4_4_4_4, or UNSIGNED_SHORT_5_5_5_1, a Uint16Array must be supplied. If the types do not match, an INVALID_OPERATION error is generated.»

  gl.activeTexture(gl.TEXTURE0 + index);
  gl.bindTexture(gl.TEXTURE_2D, texture);

  // For 8-bit data:
  gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, w, h, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, arr);

  //   void gl.texImage2D(target, level, internalformat, width, height, border, format, type, ArrayBufferView? pixels);

  //   // For 16-bit data:
  //   gl.pixelStorei(gl.UNPACK_ALIGNMENT,2);
  //   gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE_ALPHA, gl.LUMINANCE_ALPHA, w, h, 0, gl.UNSIGNED_BYTE, imageData);
  //
  //   // For 32-bit data:
  //   gl.pixelStorei(gl.UNPACK_ALIGNMENT,4);
  //   gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, w, h, 0, gl.UNSIGNED_BYTE, imageData);

  //   gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, imageData);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.generateMipmap(gl.TEXTURE_2D);
}


export default GlTiles;
