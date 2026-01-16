// database/adapters/base.adapter.js
class BaseAdapter {
  constructor(config) {
    if (this.constructor === BaseAdapter) {
      throw new Error("Abstract classes can't be instantiated.");
    }
    this.config = config;
  }

  connect() {
    throw new Error("Method 'connect()' must be implemented.");
  }

  disconnect() {
    throw new Error("Method 'disconnect()' must be implemented.");
  }

  getInstance() {
    throw new Error("Method 'getInstance()' must be implemented.");
  }
}

module.exports = BaseAdapter;
