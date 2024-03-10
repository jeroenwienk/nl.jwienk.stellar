module.exports = {
  async get({ homey, body, query, params }) {
    const result = await homey.app.router.onGet({ body, query, params });
    return result;
  },

  async post({ homey, body, query, params }) {
    const result = await homey.app.router.onPost({ body, query, params });
    return result;
  },

  async put({ homey, params, body }) {},

  async delete({ homey, params }) {},
};
