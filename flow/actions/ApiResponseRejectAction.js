const { Base } = require('../../lib/Base');

class ApiResponseRejectAction extends Base {
  /**
   * @param {Object} options
   * @param {import('@types/homey/lib/Homey')} options.homey
   * @param {Map<string, any>} options.responseMap
   */
  constructor({ homey, responseMap }) {
    super(homey);
    this.id = 'api_response_reject';
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

    const error = new Error(args.message ?? 'Unknown Error');
    error.statusCode = args.statusCode ?? 400;
    response.reject(error);

    return true;
  }
}

module.exports = { ApiResponseRejectAction };
