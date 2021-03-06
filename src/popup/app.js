define('app', function (require, exports, _module) {
  var models = require('models');
  var Menu = models.Menu;
  var MenuItem = models.MenuItem;
  var MenuView = require('views/Menu');
  var CommandsView = require('views/Command');
  var cache = require('cache');

  var scriptsMenu = exports.scriptsMenu = new Menu;
  var commandsMenu = exports.commandsMenu = new Menu;
  var menuOptions = exports.menuOptions = new Backbone.Model({
    canSearch: false,
    hasCommands: false,
  });

  var App = cache.BaseRouter.extend({
    routes: {
      '': 'renderMenu',
      commands: 'renderCommands',
    },
    renderMenu: function () {
      this.loadView('menu', function () {
        return new MenuView;
      });
    },
    renderCommands: function () {
      this.loadView('commands', function () {
        return new CommandsView;
      });
    },
  });
  var app = new App('#app');
  Backbone.history.start() || app.navigate('', {trigger: true, replace: true});
  exports.navigate = app.navigate.bind(app);

  !function () {
    function commandClick(_e, model) {
      _.mx.rt.post(exports.currentTab.id, {
        cmd: 'Command',
        data: model.get('name'),
      });
    }
    function scriptSymbol(data) {
      return data ? 'check' : 'remove';
    }
    function scriptClick(_e, model) {
      var data = !model.get('data');
      _.sendMessage({
        cmd: 'UpdateScriptInfo',
        data: {
          id: model.get('id'),
          enabled: data,
        },
      }).then(function () {
        model.set({data: data});
        _.options.get('autoReload') && _.mx.br.tabs.getCurrentTab().refresh();
      });
    }
    function init() {
      getPopup();
    }
    function clear() {
      commandsMenu.set([]);
      scriptsMenu.set([]);
      menuOptions.set({
        canSearch: false,
        hasCommands: false,
      });
      delayedClear = null;
    }
    function cancelClear() {
      delayedClear && clearTimeout(delayedClear);
    }
    function delayClear() {
      cancelClear();
      delayedClear = setTimeout(clear, 200);
    }
    var getPopup = _.debounce(function () {
      _.injectContent('setPopup()');
      delayClear();
    }, 100);
    var delayedClear;

    var commands = {
      GetPopup: getPopup,
      SetPopup: function (data, src) {
        cancelClear();
        exports.currentTab = src;
        menuOptions.set({
          canSearch: /^https?:\/\//i.test(exports.currentTab.url),
          hasCommands: !!data.menus.length,
        });
        commandsMenu.set(data.menus.map(function (menu) {
          var name = menu[0];
          return commandsMenu.get(name) || new MenuItem({
            id: name,
            name: name,
            symbol: 'right-hand',
            onClick: commandClick,
          });
        }));
        _.sendMessage({
          cmd: 'GetMetas',
          data: data.ids,
        }).then(function (scripts) {
          scriptsMenu.set(scripts.map(function (script) {
            return scriptsMenu.get(script.id) || new MenuItem({
              id: script.id,
              name: script.custom.name || _.getLocaleString(script.meta, 'name'),
              data: !!script.enabled,
              symbol: scriptSymbol,
              title: true,
              onClick: scriptClick,
            });
          }));
        });
      },
    };
    _.sendMessage = _.getMessenger({});
    _.mx.rt.listen('Popup', function (req) {
      var func = commands[req.cmd];
      if (func) func(req.data, req.src);
    });

    init();
    _.mx.br.onBrowserEvent = function (data) {
      switch (data.type) {
        case 'TAB_SWITCH':
        case 'ON_NAVIGATE':
        init();
      }
    };
  }();
});
