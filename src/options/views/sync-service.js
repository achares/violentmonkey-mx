define('views/SyncService', function (require, _exports, module) {
  var BaseView = require('cache').BaseView;
  module.exports = BaseView.extend({
    className: 'line',
    templateUrl: '/options/templates/sync-service.html',
    events: {
      'click .sync-start': 'retry',
    },
    initialize: function () {
      BaseView.prototype.initialize.call(this);
      this.listenTo(this.model, 'change', this.render);
    },
    _render: function () {
      var it = this.model.toJSON();
      it.enabled = _.options.get(it.name + 'Enabled');
      if (it.lastSync) it.lastSync = new Date(it.lastSync).toLocaleString();
      it.progress = it.progress && it.progress.total ? ' (' + it.progress.finished + '/' + it.progress.total + ')' : '';
      this.$el.html(this.templateFn(it));
    },
    retry: function () {
      _.sendMessage({
        cmd: 'SyncStart',
        data: this.model.get('name'),
      });
    },
  });
});
