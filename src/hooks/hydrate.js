import { hydrateFactory } from '../utils';

export default options => {
  options = options || {};

  return function (hook) {
    const makeInstance = hydrateFactory(this.Model, options.include);
    if (hook.type === 'before') {
      switch (hook.method) {
        case 'get':
        case 'find':
        case 'remove':
          throw new Error('feathers-sequelize hydrate() - cannot hydrate get/find/remove requests in the "before" phase');

        case 'update':
          hook.data = makeInstance(hook.data);
          break;

        case 'create':
        case 'patch':
          if (Array.isArray(hook.data)) {
            hook.data = hook.data.map(makeInstance);
          } else {
            hook.data = makeInstance(hook.data);
          }
          break;
      }
    } else {
      switch (hook.method) {
        case 'find':
          if (hook.result.data) {
            hook.result.data = hook.result.data.map(makeInstance);
          } else {
            hook.result = hook.result.map(makeInstance);
          }
          break;

        case 'get':
        case 'update':
        case 'remove':
          hook.result = makeInstance(hook.result);
          break;

        case 'create':
        case 'patch':
          if (Array.isArray(hook.result)) {
            hook.result = hook.result.map(makeInstance);
          } else {
            hook.result = makeInstance(hook.result);
          }
          break;
      }
    }

    return Promise.resolve(hook);
  };
};
