const { Base } = require('../../lib/Base');

class ApiPostTrigger extends Base {
  /**
   * @param {Object} options
   * @param {import('@types/homey/lib/Homey')} options.homey
   * @param {Map<string, any>} options.responseMap
   */
  constructor({ homey, responseMap }) {
    super(homey);
    this.id = 'api_post';
    this.responseMap = responseMap;

    this.card = this.homey.flow.getTriggerCard(this.id);
    this.card.registerRunListener(this.runListener.bind(this));
  }

  async runListener(args, state) {
    this.log({ args, state });

    if (args.path === state.path) {
      return true;
    }

    return false;
  }
}

module.exports = { ApiPostTrigger };
