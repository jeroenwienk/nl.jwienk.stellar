class Base {
  /**
   * @param {import('@types/homey/lib/Homey')} homey
   */
  constructor(homey) {
    this.homey = homey;

    this.log = (...args) => {
      homey.emit('__log', `[${this.constructor.name}]`, ...args);
    };

    this.error = (...args) => {
      homey.emit('__error', `[${this.constructor.name}]`, ...args);
    };
  }
}

module.exports = { Base };
