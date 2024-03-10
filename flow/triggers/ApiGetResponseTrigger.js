const { Base } = require('../../lib/Base');

class ApiGetResponseTrigger extends Base {
  /**
   * @param {Object} options
   * @param {import('@types/homey/lib/Homey')} options.homey
   * @param {Map<string, any>} options.responseMap
   */
  constructor({ homey, responseMap }) {
    super(homey);
    this.id = 'api_get_response';
    this.responseMap = responseMap;

    this.card = this.homey.flow.getTriggerCard(this.id);
    this.card.registerRunListener(this.runListener.bind(this));
  }

  async runListener(args, state) {
    this.log({ args, state });

    let result = false;

    const response = this.responseMap.get(state.responseToken);
    response.count += 1;

    if (args.path === state.path) {
      response.trueCount += 1;
      result = true;
    } else {
      response.falseCount += 1;
    }

    if (response.count === response.cardCount && response.falseCount === response.cardCount) {
      // No cards have triggered reject the request.
      response.reject(new Error('No Cards Triggered'));
    }

    return result;
  }
}

module.exports = { ApiGetResponseTrigger };
