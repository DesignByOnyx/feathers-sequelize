import errors from 'feathers-errors';

export function errorHandler (error) {
  let feathersError = error;

  if (error.name) {
    switch (error.name) {
      case 'SequelizeValidationError':
      case 'SequelizeUniqueConstraintError':
      case 'SequelizeExclusionConstraintError':
      case 'SequelizeForeignKeyConstraintError':
      case 'SequelizeInvalidConnectionError':
        feathersError = new errors.BadRequest(error);
        break;
      case 'SequelizeTimeoutError':
      case 'SequelizeConnectionTimedOutError':
        feathersError = new errors.Timeout(error);
        break;
      case 'SequelizeConnectionRefusedError':
      case 'SequelizeAccessDeniedError':
        feathersError = new errors.Forbidden(error);
        break;
      case 'SequelizeHostNotReachableError':
        feathersError = new errors.Unavailable(error);
        break;
      case 'SequelizeHostNotFoundError':
        feathersError = new errors.NotFound(error);
        break;
    }
  }

  throw feathersError;
}

export function getOrder (sort = {}) {
  let order = [];

  Object.keys(sort).forEach(name =>
    order.push([ name, parseInt(sort[name], 10) === 1 ? 'ASC' : 'DESC' ]));

  return order;
}

export function getWhere (query) {
  let where = Object.assign({}, query);

  if (where.$select) {
    delete where.$select;
  }

  Object.keys(where).forEach(prop => {
    let value = where[prop];
    if (value && value.$nin) {
      value = Object.assign({}, value);

      value.$notIn = value.$nin;
      delete value.$nin;

      where[prop] = value;
    }
  });

  return where;
}

export function hydrateFactory (Model, include = null) {
  return item => {
    if (!(item instanceof Model.Instance)) {
      return Model.build(item, { isNewRecord: false, include });
    }
    return item;
  };
}

export function serialize (item) {
  if (typeof item.toJSON === 'function') {
    return item.toJSON();
  }
  return item;
}
