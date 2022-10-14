import Disposable from '../Disposable.js';
import {getUid} from '../util.js';

let counter = 0;

/**
 * @typedef {Object} InitMessage
 * @property {'init'} type The message type.
 * @property {string} channel The message channel.
 */

/**
 * @typedef {Object} Request
 * @property {any} data The request data.
 * @property {string} channel The request channel.
 * @property {string} id The request id.
 */

/**
 * @typedef {Object} PendingRequest
 * @property {Request} request The request.
 * @property {function(any):void} resolve The function that resolves the request.
 * @property {function(Error):void} reject The function that rejects the request.
 */

/**
 * @typedef {Object} ResponseError
 * @property {string} message The error message.
 * @property {string} stack The error stack.
 */

/**
 * @typedef {Object} Response
 * @property {any} data The response data.
 * @property {ResponseError} [error] Any response error.
 * @property {string} channel The response channel.
 * @property {string} id The response id.
 */

export class MessageClient extends Disposable {
  /**
   * @param {Worker} worker The worker.
   */
  constructor(worker) {
    super();

    /**
     * @type {Worker}
     */
    this.worker_ = worker;

    const channel = getUid(this);

    /**
     * @type {string}
     */
    this.channel_ = channel;

    /**
     * @type {Object<string, PendingRequest>}
     */
    this.pendingRequests_ = {};

    /**
     * @type {InitMessage}
     */
    const message = {type: 'init', channel};
    worker.postMessage(message);

    this.handleResponse_ = this.handleResponse_.bind(this);

    worker.addEventListener('message', this.handleResponse_);
  }

  disposeInternal() {
    if (this.worker_) {
      this.worker_.removeEventListener('message', this.handleResponse_);
      delete this.worker_;
      this.pendingRequests_ = {};
    }
  }

  /**
   * @param {any} data The message data to post.
   * @param {Array<Transferable>} [transfer] The objects to transfer.
   * @return {Promise<any>} A promise for a response message.
   */
  postMessage(data, transfer) {
    const id = String(++counter);
    const channel = this.channel_;

    /**
     * @type {Request}
     */
    const request = {data, channel, id};

    /**
     * @type {PendingRequest}
     */
    const pending = {request, resolve: null, reject: null};
    this.pendingRequests_[id] = pending;

    const promise = new Promise((resolve, reject) => {
      pending.resolve = resolve;
      pending.reject = reject;
    });

    this.worker_.postMessage(request, transfer);
    return promise;
  }

  /**
   * @param {MessageEvent<Response>} event The message event.
   * @private
   */
  handleResponse_(event) {
    const response = event.data;

    if (!response || response.channel !== this.channel_) {
      return;
    }
    const id = response.id;
    const pending = this.pendingRequests_[id];
    if (!pending) {
      return;
    }
    delete this.pendingRequests_[id];

    if (response.error) {
      const error = new Error(response.error.message);
      error.stack = response.error.stack;
      pending.reject(error);
      return;
    }

    pending.resolve(response.data);
  }
}

/**
 * @typedef {Object} ServerResponse
 * @property {any} data The response data.
 * @property {Array<Transferable>} [transfer] The objects to transfer.
 */

/**
 * @typedef {Object} ServerOptions
 * @property {typeof globalThis} target The object that emits message events.
 * @property {function(any):Promise<ServerResponse>} handler The request handler.
 */

export class MessageServer extends Disposable {
  /**
   * @param {ServerOptions} options Server options.
   */
  constructor(options) {
    super();

    /**
     * @type {typeof globalThis}
     */
    this.target_ = options.target;

    /**
     * @type {string}
     */
    this.channel_;

    /**
     * @type {function(any):Promise<ServerResponse>}
     */
    this.handler_ = options.handler;

    this.handleInit_ = this.handleInit_.bind(this);
    this.target_.addEventListener('message', this.handleInit_);

    this.handleRequest_ = this.handleRequest_.bind(this);
    this.target_.addEventListener('message', this.handleRequest_);
  }

  disposeInternal() {
    if (this.target_) {
      this.target_.removeEventListener('message', this.handleInit_);
      this.target_.removeEventListener('message', this.handleRequest_);
      delete this.target_;
    }
  }

  /**
   * @param {MessageEvent<InitMessage>} event The init message.
   * @private
   */
  handleInit_(event) {
    const message = event.data;
    if (!message || message.type !== 'init') {
      return;
    }
    this.channel_ = message.channel;
    this.target_.removeEventListener('message', this.handleInit_);
  }

  /**
   * @param {MessageEvent<Request>} event The message event.
   * @private
   */
  async handleRequest_(event) {
    const channel = this.channel_;

    const request = event.data;
    if (!request || request.channel !== channel || !request.id) {
      return;
    }

    const id = request.id;

    /**
     * @type {Response}
     */
    const response = {data: null, channel, id};

    /**
     * @type {Array<Transferable>}
     */
    let transfer;

    try {
      const result = await this.handler_(request.data);
      response.data = result.data;
      transfer = result.transfer;
    } catch (error) {
      response.error = {message: error.message, stack: error.stack};
    }

    this.target_.postMessage(response, transfer);
  }
}
