const { Base } = require('../../lib/Base');

class ApiResponseResolveJsonAction extends Base {
  /**
   * @param {Object} options
   * @param {import('@types/homey/lib/Homey')} options.homey
   * @param {Map<string, any>} options.responseMap
   */
  constructor({ homey, responseMap }) {
    super(homey);
    this.id = 'api_response_resolve_json';
    this.responseMap = responseMap;

    this.card = this.homey.flow.getActionCard(this.id);
    this.card.registerRunListener(this.runListener.bind(this));
  }

  async runListener(args, state) {
    this.log({ args, state });

    const response = this.responseMap.get(args.droptoken);

    // check for manual and throw

    if (response == null) {
      throw new Error('Invalid Response Token');
    }

    let json;

    try {
      json = JSON.parse(args.json);
    } catch (error) {
      response.reject(error);
      return false;
    }

    response.resolve(json);

    return true;
  }
}

module.exports = { ApiResponseResolveJsonAction };
