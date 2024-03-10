'use strict';

const Homey = require('homey');

const { Router } = require('./lib/Router');

class App extends Homey.App {
  async onInit() {
    this.log('onInit');

    this.router = new Router({ homey: this.homey });
    await this.router.onInit();
  }
}

module.exports = App;
