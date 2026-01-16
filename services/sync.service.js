// services/sync.service.js
const dbManager = require('../database/manager');
const syncConfig = require('../config/database.config').sync;

class SyncService {
  constructor() {
    this.rules = syncConfig.rules;
    this.enabled = syncConfig.enabled;
  }

  async syncOnCreate(entity, data) {
    if (!this.enabled) return;

    const rules = this.rules.filter(rule => 
      rule.from === `postgres.${entity}` && rule.trigger === 'onCreate'
    );

    for (const rule of rules) {
      const [targetDb, targetEntity] = rule.to.split('.');
      const targetData = this.filterFields(data, rule.fields);
      
      if (targetDb === 'firebase') {
        // Assuming Firebase model has a method like set or updateById
        const targetModel = dbManager.get(targetEntity);
        // Firebase often uses the postgres ID as the key in the new location
        await targetModel.set(data.id, targetData);
      }
    }
  }

  async syncOnComplete(entity, data) {
    if (!this.enabled) return;

    const rules = this.rules.filter(rule => 
      rule.from === `firebase.${entity}` && rule.trigger === 'onComplete'
    );

    for (const rule of rules) {
      const [targetDb, targetEntity] = rule.to.split('.');
      
      if (targetDb === 'postgres') {
        const targetModel = dbManager.get(targetEntity);
        // This assumes a simple create operation. 
        // You might need more complex logic here.
        await targetModel.create(data);
      }
    }
  }

  filterFields(data, fields) {
    return fields.reduce((obj, key) => {
      if (data[key] !== undefined) {
        obj[key] = data[key];
      }
      return obj;
    }, {});
  }
}

module.exports = new SyncService();
