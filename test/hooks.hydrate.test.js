import { expect } from 'chai';
import hydrate from '../src/hooks/hydrate';
import Sequelize from 'sequelize';

const sequelize = new Sequelize('sequelize', '', '', {
  dialect: 'sqlite',
  storage: './db.sqlite',
  logging: false
});

const BlogPost = sequelize.define('blogpost', {
  title: {
    type: Sequelize.STRING,
    allowNull: false
  }
}, {
  freezeTableName: true
});
const Comment = sequelize.define('comment', {
  text: {
    type: Sequelize.STRING,
    allowNull: false
  }
}, {
  freezeTableName: true
});
BlogPost.hasMany(Comment);
Comment.belongsTo(BlogPost);

const callBeforeHook = (Model, method, data, options) => {
  return hydrate(options).call({ Model }, {
    type: 'before',
    method,
    data
  });
};

const callAfterHook = (Model, method, result, options) => {
  return hydrate(options).call({ Model }, {
    type: 'after',
    method,
    result
  });
};

describe('Feathers Sequelize Hydrate Hook', () => {
  before(() =>
    sequelize.sync()
  );

  it('hydrates included (associated) models', () => {
    return callAfterHook(BlogPost, 'get', {
      title: 'David',
      comments: [{ text: 'Comment text' }]
    }, {
      include: [Comment]
    }).then(hook =>
      expect(hook.result.comments[0] instanceof Comment.Instance).to.be.ok
    );
  });

  it('does not hydrate if data is a Model instance', () => {
    const instance = BlogPost.build({ title: 'David' });
    return callAfterHook(BlogPost, 'get', instance).then(hook =>
      expect(hook.result).to.equal(instance)
    );
  });

  describe('Used as a "before" hook', () => {
    it('throws if used on get()', () => {
      const hook = hydrate().bind(null, { method: 'get', type: 'before' });
      expect(hook).to.throw(Error);
    });

    it('throws if used on find()', () => {
      const hook = hydrate().bind(null, { method: 'find', type: 'before' });
      expect(hook).to.throw(Error);
    });

    it('throws if used on remove()', () => {
      const hook = hydrate().bind(null, { method: 'remove', type: 'before' });
      expect(hook).to.throw(Error);
    });

    ['create', 'update', 'patch'].forEach(method => {
      it(`hydrates data for single ${method}()`, () => {
        return callBeforeHook(BlogPost, method, {title: 'David'}).then(hook =>
          expect(hook.data instanceof BlogPost.Instance).to.be.ok
        );
      });
    });

    ['create', 'patch'].forEach(method => {
      it(`hydrates data for bulk ${method}()`, () => {
        return callBeforeHook(BlogPost, method, [{title: 'David'}]).then(hook =>
          expect(hook.data[0] instanceof BlogPost.Instance).to.be.ok
        );
      });
    });
  });

  describe('Used as an "after" hook', () => {
    it('hydrates results for find()', () => {
      return callAfterHook(BlogPost, 'find', [{title: 'David'}]).then(hook =>
        expect(hook.result[0] instanceof BlogPost.Instance).to.be.ok
      );
    });

    it('hydrates results for paginated find()', () => {
      return callAfterHook(BlogPost, 'find', {
        data: [{title: 'David'}]
      }).then(hook =>
        expect(hook.result.data[0] instanceof BlogPost.Instance).to.be.ok
      );
    });

    it('hydrates results for get()', () => {
      return callAfterHook(BlogPost, 'get', {title: 'David'}).then(hook =>
        expect(hook.result instanceof BlogPost.Instance).to.be.ok
      );
    });

    ['create', 'update', 'patch', 'remove'].forEach(method => {
      it(`hydrates results for single ${method}()`, () => {
        return callAfterHook(BlogPost, method, {title: 'David'}).then(hook =>
          expect(hook.result instanceof BlogPost.Instance).to.be.ok
        );
      });
    });

    ['create', 'patch'].forEach(method => {
      it(`hydrates results for bulk ${method}()`, () => {
        return callAfterHook(BlogPost, method, [{title: 'David'}]).then(hook =>
          expect(hook.result[0] instanceof BlogPost.Instance).to.be.ok
        );
      });
    });
  });
});
