'use strict';

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { debounce } = require('./debounce');
const { Base } = require('./Base');

const { ApiPostTrigger } = require('../flow/triggers/ApiPostTrigger');
const { ApiPostResponseTrigger } = require('../flow/triggers/ApiPostResponseTrigger');
const { ApiGetTrigger } = require('../flow/triggers/ApiGetTrigger');
const { ApiGetResponseTrigger } = require('../flow/triggers/ApiGetResponseTrigger');

const { ApiResponseRejectAction } = require('../flow/actions/ApiResponseRejectAction');
const { ApiResponseResolveAction } = require('../flow/actions/ApiResponseResolveAction');
const { ApiResponseResolveJsonAction } = require('../flow/actions/ApiResponseResolveJsonAction');

class Router extends Base {
  constructor({ homey }) {
    super(homey);
  }

  async onInit() {
    this.log('onInit');

    /**
     * @type {Map<string, {
     *   resolve: Function,
     *   reject: Function,
     *   promise: Promise<any>,
     *   cardCount: number,
     *   count: number,
     *   trueCount: number,
     *   falseCount: number
     * }>}
     */
    this.responseMap = new Map();

    const options = {
      homey: this.homey,
      responseMap: this.responseMap,
    };

    this.apiPostTrigger = new ApiPostTrigger(options);
    this.apiPostResponseTrigger = new ApiPostResponseTrigger(options);

    this.apiGetTrigger = new ApiGetTrigger(options);
    this.apiGetResponseTrigger = new ApiGetResponseTrigger(options);

    this.apiResponseRejectAction = new ApiResponseRejectAction(options);
    this.apiResponseResolveAction = new ApiResponseResolveAction(options);
    this.apiResponseResolveJsonAction = new ApiResponseResolveJsonAction(options);

    await this.constructRouter();

    this.constructRouterDebounced = debounce(this.constructRouter.bind(this), 1000);
    this.apiPostTrigger.card.on('update', this.constructRouterDebounced);
    this.apiPostResponseTrigger.card.on('update', this.constructRouterDebounced);
    this.apiGetTrigger.card.on('update', this.constructRouterDebounced);
    this.apiGetResponseTrigger.card.on('update', this.constructRouterDebounced);
  }

  async handleRequest({ method, body, query, params }) {
    const path = params[0];

    const req = {
      method: method,
      url: `http://localhost/${path}`,
      headers: {},
      query: query,
      body: body,
    };

    return new Promise((resolve, reject) => {
      const res = {
        end: (result) => {
          this.log('end');
          resolve(result);
        },
        error: (error) => {
          this.log('error');
          reject(error);
        },
      };

      this.router.handle(req, res, () => {
        // void next
        this.log('next');
      });
    });
  }

  async constructRouter() {
    this.log('constructRouter');
    const router = express.Router();

    router.use((req, res, next) => {
      // this.log(req);
      // this.log(res);
      next();
    });

    const postValues = await this.apiPostTrigger.card.getArgumentValues();
    const postResponseValues = await this.apiPostResponseTrigger.card.getArgumentValues();

    const getValues = await this.apiGetTrigger.card.getArgumentValues();
    const getResponseValues = await this.apiGetResponseTrigger.card.getArgumentValues();

    const postHandlers = {};
    const getHandlers = {};

    for (const postEndpoint of postValues) {
      postHandlers[postEndpoint.path] = (req, res, next) => {
        res.end();

        const tokens = {
          body: JSON.stringify(req.body),
          query: JSON.stringify(req.query),
          params: JSON.stringify(req.params),
        };

        const state = {
          path: req.route.path,
        };

        this.apiPostTrigger.card.trigger(tokens, state).catch((error) => {
          this.error(error);
        });
      };
    }

    // This will replace apiPostTriggerCard paths and allow us to change to behavior for responses.
    for (const postResponseEndpoint of postResponseValues) {
      postHandlers[postResponseEndpoint.path] = (req, res, next) => {
        const responseToken = uuidv4();

        let resolve;
        let reject;
        let timeout;

        const promise = new Promise((_resolve, _reject) => {
          resolve = _resolve;
          reject = _reject;
        });

        timeout = this.homey.setTimeout(() => {
          reject(new Error('Timeout'));
        }, 10 * 1000);

        promise
          .then((result) => {
            res.end(result);
          })
          .catch((error) => {
            res.error(error);
          })
          .finally(() => {
            this.responseMap.delete(responseToken);
            this.homey.clearTimeout(timeout);
          });

        this.responseMap.set(responseToken, {
          resolve,
          reject,
          promise,
          cardCount: postResponseValues.length,
          count: 0,
          trueCount: 0,
          falseCount: 0,
        });

        const tokens = {
          body: JSON.stringify(req.body),
          query: JSON.stringify(req.query),
          params: JSON.stringify(req.params),
        };

        const state = {
          path: req.route.path,
        };

        this.apiPostTrigger.card.trigger(tokens, state).catch((error) => {
          this.error(error);
        });

        this.apiPostResponseTrigger.card
          .trigger(
            {
              ...tokens,
              responseToken: responseToken,
            },
            {
              ...state,
              responseToken: responseToken,
            },
          )
          .catch((error) => {
            this.error(error);
          });
      };
    }

    for (const getEndpoint of getValues) {
      getHandlers[getEndpoint.path] = (req, res, next) => {
        res.end();

        const tokens = {
          query: JSON.stringify(req.query),
          params: JSON.stringify(req.params),
        };

        const state = {
          path: req.route.path,
        };

        this.apiGetTrigger.card.trigger(tokens, state).catch((error) => {
          this.error(error);
        });
      };
    }

    // This will replace apiGetTriggerCard paths and allow us to change to behavior for responses.
    for (const getResponseEndpoint of getResponseValues) {
      getHandlers[getResponseEndpoint.path] = (req, res, next) => {
        const responseToken = uuidv4();

        let resolve;
        let reject;
        let timeout;

        const promise = new Promise((_resolve, _reject) => {
          resolve = _resolve;
          reject = _reject;
        });

        timeout = this.homey.setTimeout(() => {
          reject(new Error('Timeout'));
        }, 10 * 1000);

        promise
          .then((result) => {
            res.end(result);
          })
          .catch((error) => {
            res.error(error);
          })
          .finally(() => {
            this.responseMap.delete(responseToken);
            this.homey.clearTimeout(timeout);
          });

        this.responseMap.set(responseToken, {
          resolve,
          reject,
          promise,
          cardCount: getResponseValues.length,
          count: 0,
          trueCount: 0,
          falseCount: 0,
        });

        const tokens = {
          query: JSON.stringify(req.query),
          params: JSON.stringify(req.params),
        };

        const state = {
          path: req.route.path,
        };

        this.apiGetTrigger.card.trigger(tokens, state).catch((error) => {
          this.error(error);
        });

        this.apiGetResponseTrigger.card
          .trigger(
            {
              ...tokens,
              responseToken: responseToken,
            },
            {
              ...state,
              responseToken: responseToken,
            },
          )
          .catch((error) => {
            this.error(error);
          });
      };
    }

    for (const [path, handler] of Object.entries(postHandlers)) {
      router.post(path, handler);
    }

    for (const [path, handler] of Object.entries(getHandlers)) {
      router.get(path, handler);
    }

    router.all('*', (req, res) => {
      this.log('Route Not Found');
      res.error(new Error('Route Not Found'));
    });

    this.router = router;
  }

  async onPost({ body, query, params }) {
    const result = await this.handleRequest({ method: 'POST', body, query, params });
    return result;
  }

  async onGet({ body, query, params }) {
    const result = await this.handleRequest({ method: 'GET', body, query, params });
    return result;
  }
}

module.exports = { Router };
