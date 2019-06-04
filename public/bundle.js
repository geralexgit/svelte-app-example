
(function(l, i, v, e) { v = l.createElement(i); v.async = 1; v.src = '//' + (location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; e = l.getElementsByTagName(i)[0]; e.parentNode.insertBefore(v, e)})(document, 'script');
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function validate_store(store, name) {
        if (!store || typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(component, store, callback) {
        const unsub = store.subscribe(callback);
        component.$$.on_destroy.push(unsub.unsubscribe
            ? () => unsub.unsubscribe()
            : unsub);
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function prevent_default(fn) {
        return function (event) {
            event.preventDefault();
            // @ts-ignore
            return fn.call(this, event);
        };
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_data(text, data) {
        data = '' + data;
        if (text.data !== data)
            text.data = data;
    }
    function select_option(select, value) {
        for (let i = 0; i < select.options.length; i += 1) {
            const option = select.options[i];
            if (option.__value === value) {
                option.selected = true;
                return;
            }
        }
    }
    function select_value(select) {
        const selected_option = select.querySelector(':checked') || select.options[0];
        return selected_option && selected_option.__value;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function flush() {
        const seen_callbacks = new Set();
        do {
            // first, call beforeUpdate functions
            // and update components
            while (dirty_components.length) {
                const component = dirty_components.shift();
                set_current_component(component);
                update(component.$$);
            }
            while (binding_callbacks.length)
                binding_callbacks.shift()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            while (render_callbacks.length) {
                const callback = render_callbacks.pop();
                if (!seen_callbacks.has(callback)) {
                    callback();
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                }
            }
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
    }
    function update($$) {
        if ($$.fragment) {
            $$.update($$.dirty);
            run_all($$.before_render);
            $$.fragment.p($$.dirty, $$.ctx);
            $$.dirty = null;
            $$.after_render.forEach(add_render_callback);
        }
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_render } = component.$$;
        fragment.m(target, anchor);
        // onMount happens after the initial afterUpdate. Because
        // afterUpdate callbacks happen in reverse order (inner first)
        // we schedule onMount callbacks before afterUpdate callbacks
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_render.forEach(add_render_callback);
    }
    function destroy(component, detaching) {
        if (component.$$) {
            run_all(component.$$.on_destroy);
            component.$$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            component.$$.on_destroy = component.$$.fragment = null;
            component.$$.ctx = {};
        }
    }
    function make_dirty(component, key) {
        if (!component.$$.dirty) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty = blank_object();
        }
        component.$$.dirty[key] = true;
    }
    function init(component, options, instance, create_fragment, not_equal$$1, prop_names) {
        const parent_component = current_component;
        set_current_component(component);
        const props = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props: prop_names,
            update: noop,
            not_equal: not_equal$$1,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_render: [],
            after_render: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty: null
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, props, (key, value) => {
                if ($$.ctx && not_equal$$1($$.ctx[key], $$.ctx[key] = value)) {
                    if ($$.bound[key])
                        $$.bound[key](value);
                    if (ready)
                        make_dirty(component, key);
                }
            })
            : props;
        $$.update();
        ready = true;
        run_all($$.before_render);
        $$.fragment = create_fragment($$.ctx);
        if (options.target) {
            if (options.hydrate) {
                $$.fragment.l(children(options.target));
            }
            else {
                $$.fragment.c();
            }
            if (options.intro && component.$$.fragment.i)
                component.$$.fragment.i();
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy(this, true);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
    }

    /**
     * Initialize new store and apply all modules to the store.
     *
     * @param {moduleInitializer[]} modules Functions which will set initial state
     *                                      define reducer and subscribe
     *                                      to all system events.
     *
     * @return {Store} The new store.
     *
     * @example
     * import createStore from 'storeon'
     * let increment = store => {
     *   store.on('@init', () => ({ count: 0 }))
     *   store.on('inc', ({ count }) => ({ count: count + 1 }))
     * }
     * const store = createStore([increment])
     * store.get().count //=> 0
     * store.dispatch('inc')
     * store.get().count //=> 1
     */
    var createStore = function (modules) {
      var events = { };
      var state = { };

      var on = function (event, cb) {
        (events[event] || (events[event] = [])).push(cb);

        return function () {
          events[event] = events[event].filter(function (i) {
            return i !== cb
          });
        }
      };

      var dispatch = function (event, data) {
        if (event !== '@dispatch') {
          dispatch('@dispatch', [event, data, events[event]]);
        }

        if (events[event]) {
          var changes = { };
          var changed;
          events[event].forEach(function (i) {
            var diff = i(state, data);
            if (diff && typeof diff.then !== 'function') {
              changed = Object.assign({ }, state, diff);
              Object.assign(changes, diff);
              state = changed;
            }
          });
          if (changed) dispatch('@changed', changes);
        }
      };

      var get = function () {
        return state
      };

      var store = { dispatch: dispatch, get: get, on: on };

      modules.forEach(function (i) {
        if (i) i(store);
      });
      dispatch('@init');

      return store
    };

    var storeon = createStore;

    /**
     * Initialize new store and apply all modules to the store for Svelte app.
     *
     * @param {modules[]} modules Functions which will set initial state
     *                            define reducer and subscribe
     *                            to all system events
     *
     * @return {connect} The store connector.
     *
     * @example
     * import { createSvelteStore } from "@storeon/svelte";
     *
     * let counter = store => {
     *  store.on("@init", () => ({ count: 0 }));
     *  store.on("inc", ({ count }) => ({ count: count + 1 }));
     * };
     * export const connect = createSvelteStore([counter]);
     */
    function createSvelteStore (modules) {
      var store = storeon(modules);

      /**
       * Hook-like function to use Storeon in Svelte app
       *
       * @param {string} key Key of state field
       *
       */
      return function (key) {
        var subscribers = [];

        /**
         * Subscription for the state
         *
         * @param {function} run Callback function
         *
         */
        function subscribe (run) {
          var state = store.get();

          subscribers.push(run);
          run(state[key]);

          return function () {
            subscribers = subscribers.filter(function (i) {
              return i !== run
            });
          }
        }

        store.on('@changed', function (_, changed) {
          if (key in changed) {
            subscribers.forEach(function (s) {
              s(changed[key]);
            });
          }
        });

        var changes = {
          subscribe: subscribe
        };

        return [store.dispatch, changes]
      }
    }

    var svelte = { createSvelteStore: createSvelteStore };
    var svelte_1 = svelte.createSvelteStore;

    /**
     * Create Redux DevTools module for Storeon.
     *
     * @param {object} options Redux DevTools option.
     * @returns {devtools} Redux DevTools module
     *
     * @example
     * const store = createStore([
     *   process.env.NODE_ENV !== 'production' && require('storeon/devtools')()
     * ])
     *
     * @name devtools
     * @function
     */
    function devtools (options) {
      function module (store) {
        var extension =
          window.__REDUX_DEVTOOLS_EXTENSION__ ||
          window.top.__REDUX_DEVTOOLS_EXTENSION__;

        if (!extension) {
          if (process.env.NODE_ENV !== 'production') {
            console.warn(
              'Please install Redux devtools extension\n' +
              'http://extension.remotedev.io/'
            );
          }
          return
        }

        var ReduxTool = extension.connect();
        store.on('@init', function () {
          ReduxTool.subscribe(function (message) {
            if (message.type === 'DISPATCH' && message.state) {
              store.dispatch('UPDATE_FROM_DEVTOOLS', JSON.parse(message.state));
            }
          });
          ReduxTool.init(store.get());
        });

        var prev = '';
        store.on('@dispatch', function (state, data) {
          var event = String(data[0]);
          if (event !== 'UPDATE_FROM_DEVTOOLS' && prev !== 'UPDATE_FROM_DEVTOOLS') {
            if (event[0] !== '@' && (!data[2] || data[2].length === 0)) {
              throw new Error('Unknown Storeon event ' + event)
            }
            if (event !== '@changed' || Object.keys(data[1]).length) {
              ReduxTool.send({ type: event, payload: data[1] }, state);
            }
          }
          prev = event;
        });

        store.on('UPDATE_FROM_DEVTOOLS', function (state, data) {
          var newState = {};
          var key;
          for (key in state) {
            newState[key] = undefined;
          }
          for (key in data) {
            newState[key] = data[key];
          }
          return newState
        });
      }

      if (options && options.on && options.dispatch && options.get) {
        return module(options)
      } else {
        return module
      }
    }

    var devtools_1 = devtools;

    let counter = store => {
      store.on('@init', () => ({
        count: 0
      }));
      store.on('inc', ({
        count
      }) => ({
        count: count + 1
      }));
    };

    let currentUser = store => {
      store.on('@init', () => ({
        currentUser: {}
      }));
      store.on('user/auth', ({
        currentUser
      }, user) => {
        return {
          currentUser: { ...user
          }
        };
      });
    };

    const connect = svelte_1([counter, currentUser, devtools_1]);

    function unwrapExports (x) {
    	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
    }

    function createCommonjsModule(fn, module) {
    	return module = { exports: {} }, fn(module, module.exports), module.exports;
    }

    var assertString_1 = createCommonjsModule(function (module, exports) {

    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.default = assertString;

    function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

    function assertString(input) {
      var isString = typeof input === 'string' || input instanceof String;

      if (!isString) {
        var invalidType;

        if (input === null) {
          invalidType = 'null';
        } else {
          invalidType = _typeof(input);

          if (invalidType === 'object' && input.constructor && input.constructor.hasOwnProperty('name')) {
            invalidType = input.constructor.name;
          } else {
            invalidType = "a ".concat(invalidType);
          }
        }

        throw new TypeError("Expected string but received ".concat(invalidType, "."));
      }
    }

    module.exports = exports.default;
    module.exports.default = exports.default;
    });

    unwrapExports(assertString_1);

    var merge_1 = createCommonjsModule(function (module, exports) {

    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.default = merge;

    function merge() {
      var obj = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      var defaults = arguments.length > 1 ? arguments[1] : undefined;

      for (var key in defaults) {
        if (typeof obj[key] === 'undefined') {
          obj[key] = defaults[key];
        }
      }

      return obj;
    }

    module.exports = exports.default;
    module.exports.default = exports.default;
    });

    unwrapExports(merge_1);

    var isByteLength_1 = createCommonjsModule(function (module, exports) {

    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.default = isByteLength;

    var _assertString = _interopRequireDefault(assertString_1);

    function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

    function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

    /* eslint-disable prefer-rest-params */
    function isByteLength(str, options) {
      (0, _assertString.default)(str);
      var min;
      var max;

      if (_typeof(options) === 'object') {
        min = options.min || 0;
        max = options.max;
      } else {
        // backwards compatibility: isByteLength(str, min [, max])
        min = arguments[1];
        max = arguments[2];
      }

      var len = encodeURI(str).split(/%..|./).length - 1;
      return len >= min && (typeof max === 'undefined' || len <= max);
    }

    module.exports = exports.default;
    module.exports.default = exports.default;
    });

    unwrapExports(isByteLength_1);

    var isFQDN_1 = createCommonjsModule(function (module, exports) {

    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.default = isFQDN;

    var _assertString = _interopRequireDefault(assertString_1);

    var _merge = _interopRequireDefault(merge_1);

    function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

    var default_fqdn_options = {
      require_tld: true,
      allow_underscores: false,
      allow_trailing_dot: false
    };

    function isFQDN(str, options) {
      (0, _assertString.default)(str);
      options = (0, _merge.default)(options, default_fqdn_options);
      /* Remove the optional trailing dot before checking validity */

      if (options.allow_trailing_dot && str[str.length - 1] === '.') {
        str = str.substring(0, str.length - 1);
      }

      var parts = str.split('.');

      for (var i = 0; i < parts.length; i++) {
        if (parts[i].length > 63) {
          return false;
        }
      }

      if (options.require_tld) {
        var tld = parts.pop();

        if (!parts.length || !/^([a-z\u00a1-\uffff]{2,}|xn[a-z0-9-]{2,})$/i.test(tld)) {
          return false;
        } // disallow spaces


        if (/[\s\u2002-\u200B\u202F\u205F\u3000\uFEFF\uDB40\uDC20]/.test(tld)) {
          return false;
        }
      }

      for (var part, _i = 0; _i < parts.length; _i++) {
        part = parts[_i];

        if (options.allow_underscores) {
          part = part.replace(/_/g, '');
        }

        if (!/^[a-z\u00a1-\uffff0-9-]+$/i.test(part)) {
          return false;
        } // disallow full-width chars


        if (/[\uff01-\uff5e]/.test(part)) {
          return false;
        }

        if (part[0] === '-' || part[part.length - 1] === '-') {
          return false;
        }
      }

      return true;
    }

    module.exports = exports.default;
    module.exports.default = exports.default;
    });

    unwrapExports(isFQDN_1);

    var isIP_1 = createCommonjsModule(function (module, exports) {

    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.default = isIP;

    var _assertString = _interopRequireDefault(assertString_1);

    function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

    var ipv4Maybe = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
    var ipv6Block = /^[0-9A-F]{1,4}$/i;

    function isIP(str) {
      var version = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '';
      (0, _assertString.default)(str);
      version = String(version);

      if (!version) {
        return isIP(str, 4) || isIP(str, 6);
      } else if (version === '4') {
        if (!ipv4Maybe.test(str)) {
          return false;
        }

        var parts = str.split('.').sort(function (a, b) {
          return a - b;
        });
        return parts[3] <= 255;
      } else if (version === '6') {
        var blocks = str.split(':');
        var foundOmissionBlock = false; // marker to indicate ::
        // At least some OS accept the last 32 bits of an IPv6 address
        // (i.e. 2 of the blocks) in IPv4 notation, and RFC 3493 says
        // that '::ffff:a.b.c.d' is valid for IPv4-mapped IPv6 addresses,
        // and '::a.b.c.d' is deprecated, but also valid.

        var foundIPv4TransitionBlock = isIP(blocks[blocks.length - 1], 4);
        var expectedNumberOfBlocks = foundIPv4TransitionBlock ? 7 : 8;

        if (blocks.length > expectedNumberOfBlocks) {
          return false;
        } // initial or final ::


        if (str === '::') {
          return true;
        } else if (str.substr(0, 2) === '::') {
          blocks.shift();
          blocks.shift();
          foundOmissionBlock = true;
        } else if (str.substr(str.length - 2) === '::') {
          blocks.pop();
          blocks.pop();
          foundOmissionBlock = true;
        }

        for (var i = 0; i < blocks.length; ++i) {
          // test for a :: which can not be at the string start/end
          // since those cases have been handled above
          if (blocks[i] === '' && i > 0 && i < blocks.length - 1) {
            if (foundOmissionBlock) {
              return false; // multiple :: in address
            }

            foundOmissionBlock = true;
          } else if (foundIPv4TransitionBlock && i === blocks.length - 1) ; else if (!ipv6Block.test(blocks[i])) {
            return false;
          }
        }

        if (foundOmissionBlock) {
          return blocks.length >= 1;
        }

        return blocks.length === expectedNumberOfBlocks;
      }

      return false;
    }

    module.exports = exports.default;
    module.exports.default = exports.default;
    });

    unwrapExports(isIP_1);

    var isEmail_1 = createCommonjsModule(function (module, exports) {

    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.default = isEmail;

    var _assertString = _interopRequireDefault(assertString_1);

    var _merge = _interopRequireDefault(merge_1);

    var _isByteLength = _interopRequireDefault(isByteLength_1);

    var _isFQDN = _interopRequireDefault(isFQDN_1);

    var _isIP = _interopRequireDefault(isIP_1);

    function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

    function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest(); }

    function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance"); }

    function _iterableToArrayLimit(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

    function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

    var default_email_options = {
      allow_display_name: false,
      require_display_name: false,
      allow_utf8_local_part: true,
      require_tld: true
    };
    /* eslint-disable max-len */

    /* eslint-disable no-control-regex */

    var splitNameAddress = /^([^\x00-\x1F\x7F-\x9F\cX]+)<(.+)>$/i;
    var emailUserPart = /^[a-z\d!#\$%&'\*\+\-\/=\?\^_`{\|}~]+$/i;
    var gmailUserPart = /^[a-z\d]+$/;
    var quotedEmailUser = /^([\s\x01-\x08\x0b\x0c\x0e-\x1f\x7f\x21\x23-\x5b\x5d-\x7e]|(\\[\x01-\x09\x0b\x0c\x0d-\x7f]))*$/i;
    var emailUserUtf8Part = /^[a-z\d!#\$%&'\*\+\-\/=\?\^_`{\|}~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+$/i;
    var quotedEmailUserUtf8 = /^([\s\x01-\x08\x0b\x0c\x0e-\x1f\x7f\x21\x23-\x5b\x5d-\x7e\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]|(\\[\x01-\x09\x0b\x0c\x0d-\x7f\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))*$/i;
    var defaultMaxEmailLength = 254;
    /* eslint-enable max-len */

    /* eslint-enable no-control-regex */

    /**
     * Validate display name according to the RFC2822: https://tools.ietf.org/html/rfc2822#appendix-A.1.2
     * @param {String} display_name
     */

    function validateDisplayName(display_name) {
      var trim_quotes = display_name.match(/^"(.+)"$/i);
      var display_name_without_quotes = trim_quotes ? trim_quotes[1] : display_name; // display name with only spaces is not valid

      if (!display_name_without_quotes.trim()) {
        return false;
      } // check whether display name contains illegal character


      var contains_illegal = /[\.";<>]/.test(display_name_without_quotes);

      if (contains_illegal) {
        // if contains illegal characters,
        // must to be enclosed in double-quotes, otherwise it's not a valid display name
        if (!trim_quotes) {
          return false;
        } // the quotes in display name must start with character symbol \


        var all_start_with_back_slash = display_name_without_quotes.split('"').length === display_name_without_quotes.split('\\"').length;

        if (!all_start_with_back_slash) {
          return false;
        }
      }

      return true;
    }

    function isEmail(str, options) {
      (0, _assertString.default)(str);
      options = (0, _merge.default)(options, default_email_options);

      if (options.require_display_name || options.allow_display_name) {
        var display_email = str.match(splitNameAddress);

        if (display_email) {
          var display_name;

          var _display_email = _slicedToArray(display_email, 3);

          display_name = _display_email[1];
          str = _display_email[2];

          // sometimes need to trim the last space to get the display name
          // because there may be a space between display name and email address
          // eg. myname <address@gmail.com>
          // the display name is `myname` instead of `myname `, so need to trim the last space
          if (display_name.endsWith(' ')) {
            display_name = display_name.substr(0, display_name.length - 1);
          }

          if (!validateDisplayName(display_name)) {
            return false;
          }
        } else if (options.require_display_name) {
          return false;
        }
      }

      if (!options.ignore_max_length && str.length > defaultMaxEmailLength) {
        return false;
      }

      var parts = str.split('@');
      var domain = parts.pop();
      var user = parts.join('@');
      var lower_domain = domain.toLowerCase();

      if (options.domain_specific_validation && (lower_domain === 'gmail.com' || lower_domain === 'googlemail.com')) {
        /*
          Previously we removed dots for gmail addresses before validating.
          This was removed because it allows `multiple..dots@gmail.com`
          to be reported as valid, but it is not.
          Gmail only normalizes single dots, removing them from here is pointless,
          should be done in normalizeEmail
        */
        user = user.toLowerCase(); // Removing sub-address from username before gmail validation

        var username = user.split('+')[0]; // Dots are not included in gmail length restriction

        if (!(0, _isByteLength.default)(username.replace('.', ''), {
          min: 6,
          max: 30
        })) {
          return false;
        }

        var _user_parts = username.split('.');

        for (var i = 0; i < _user_parts.length; i++) {
          if (!gmailUserPart.test(_user_parts[i])) {
            return false;
          }
        }
      }

      if (!(0, _isByteLength.default)(user, {
        max: 64
      }) || !(0, _isByteLength.default)(domain, {
        max: 254
      })) {
        return false;
      }

      if (!(0, _isFQDN.default)(domain, {
        require_tld: options.require_tld
      })) {
        if (!options.allow_ip_domain) {
          return false;
        }

        if (!(0, _isIP.default)(domain)) {
          if (!domain.startsWith('[') || !domain.endsWith(']')) {
            return false;
          }

          var noBracketdomain = domain.substr(1, domain.length - 2);

          if (noBracketdomain.length === 0 || !(0, _isIP.default)(noBracketdomain)) {
            return false;
          }
        }
      }

      if (user[0] === '"') {
        user = user.slice(1, user.length - 1);
        return options.allow_utf8_local_part ? quotedEmailUserUtf8.test(user) : quotedEmailUser.test(user);
      }

      var pattern = options.allow_utf8_local_part ? emailUserUtf8Part : emailUserPart;
      var user_parts = user.split('.');

      for (var _i2 = 0; _i2 < user_parts.length; _i2++) {
        if (!pattern.test(user_parts[_i2])) {
          return false;
        }
      }

      return true;
    }

    module.exports = exports.default;
    module.exports.default = exports.default;
    });

    var isEmail = unwrapExports(isEmail_1);

    /* src/components/LoginForm.svelte generated by Svelte v3.4.4 */

    const file = "src/components/LoginForm.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.question = list[i];
    	return child_ctx;
    }

    // (53:4) {#if !isValidEmail && touched}
    function create_if_block_1(ctx) {
    	var span;

    	return {
    		c: function create() {
    			span = element("span");
    			span.textContent = "Email is invalid";
    			span.className = "inputError svelte-1ol1brq";
    			add_location(span, file, 53, 6, 1347);
    		},

    		m: function mount(target, anchor) {
    			insert(target, span, anchor);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(span);
    			}
    		}
    	};
    }

    // (61:6) {#each questions as question}
    function create_each_block(ctx) {
    	var option, t_value = ctx.question.text, t, option_value_value;

    	return {
    		c: function create() {
    			option = element("option");
    			t = text(t_value);
    			option.__value = option_value_value = ctx.question;
    			option.value = option.__value;
    			add_location(option, file, 61, 8, 1624);
    		},

    		m: function mount(target, anchor) {
    			insert(target, option, anchor);
    			append(option, t);
    		},

    		p: function update(changed, ctx) {
    			option.value = option.__value;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(option);
    			}
    		}
    	};
    }

    // (69:0) {#if $currentUser}
    function create_if_block(ctx) {
    	var h1, t0, t1_value = ctx.$currentUser.login, t1;

    	return {
    		c: function create() {
    			h1 = element("h1");
    			t0 = text("Current user ");
    			t1 = text(t1_value);
    			add_location(h1, file, 69, 2, 1853);
    		},

    		m: function mount(target, anchor) {
    			insert(target, h1, anchor);
    			append(h1, t0);
    			append(h1, t1);
    		},

    		p: function update(changed, ctx) {
    			if ((changed.$currentUser) && t1_value !== (t1_value = ctx.$currentUser.login)) {
    				set_data(t1, t1_value);
    			}
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(h1);
    			}
    		}
    	};
    }

    function create_fragment(ctx) {
    	var form, div, h1, t1, input0, t2, input1, t3, input2, t4, t5, label, input3, t6, t7, select, t8, input4, t9, button, t11, if_block1_anchor, dispose;

    	var if_block0 = (!ctx.isValidEmail && ctx.touched) && create_if_block_1(ctx);

    	var each_value = ctx.questions;

    	var each_blocks = [];

    	for (var i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	var if_block1 = (ctx.$currentUser) && create_if_block(ctx);

    	return {
    		c: function create() {
    			form = element("form");
    			div = element("div");
    			h1 = element("h1");
    			h1.textContent = "Sign Up form";
    			t1 = space();
    			input0 = element("input");
    			t2 = space();
    			input1 = element("input");
    			t3 = space();
    			input2 = element("input");
    			t4 = space();
    			if (if_block0) if_block0.c();
    			t5 = space();
    			label = element("label");
    			input3 = element("input");
    			t6 = text("\n      Agree with terms and conditions");
    			t7 = space();
    			select = element("select");

    			for (var i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t8 = space();
    			input4 = element("input");
    			t9 = space();
    			button = element("button");
    			button.textContent = "go!";
    			t11 = space();
    			if (if_block1) if_block1.c();
    			if_block1_anchor = empty();
    			add_location(h1, file, 48, 4, 1078);
    			input0.placeholder = "login";
    			attr(input0, "type", "text");
    			add_location(input0, file, 49, 4, 1104);
    			input1.placeholder = "password";
    			attr(input1, "type", "password");
    			add_location(input1, file, 50, 4, 1169);
    			input2.placeholder = "email";
    			attr(input2, "type", "email");
    			add_location(input2, file, 51, 4, 1244);
    			input3.id = "agree";
    			attr(input3, "type", "checkbox");
    			add_location(input3, file, 56, 6, 1436);
    			label.htmlFor = "agree";
    			add_location(label, file, 55, 4, 1410);
    			if (ctx.selected === void 0) add_render_callback(() => ctx.select_change_handler.call(select));
    			add_location(select, file, 59, 4, 1549);
    			input4.placeholder = "Your answer";
    			attr(input4, "type", "text");
    			add_location(input4, file, 64, 4, 1708);
    			button.type = "submit";
    			add_location(button, file, 65, 4, 1780);
    			div.className = "formWrapper svelte-1ol1brq";
    			add_location(div, file, 47, 2, 1048);
    			add_location(form, file, 46, 0, 999);

    			dispose = [
    				listen(input0, "input", ctx.input0_input_handler),
    				listen(input1, "input", ctx.input1_input_handler),
    				listen(input2, "input", ctx.input2_input_handler),
    				listen(input3, "change", ctx.input3_change_handler),
    				listen(select, "change", ctx.select_change_handler),
    				listen(input4, "input", ctx.input4_input_handler),
    				listen(form, "submit", prevent_default(ctx.loginHandler))
    			];
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, form, anchor);
    			append(form, div);
    			append(div, h1);
    			append(div, t1);
    			append(div, input0);

    			input0.value = ctx.login;

    			append(div, t2);
    			append(div, input1);

    			input1.value = ctx.password;

    			append(div, t3);
    			append(div, input2);

    			input2.value = ctx.email;

    			append(div, t4);
    			if (if_block0) if_block0.m(div, null);
    			append(div, t5);
    			append(div, label);
    			append(label, input3);

    			input3.checked = ctx.agree;

    			append(label, t6);
    			append(div, t7);
    			append(div, select);

    			for (var i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(select, null);
    			}

    			select_option(select, ctx.selected);

    			append(div, t8);
    			append(div, input4);

    			input4.value = ctx.answer;

    			append(div, t9);
    			append(div, button);
    			insert(target, t11, anchor);
    			if (if_block1) if_block1.m(target, anchor);
    			insert(target, if_block1_anchor, anchor);
    		},

    		p: function update(changed, ctx) {
    			if (changed.login && (input0.value !== ctx.login)) input0.value = ctx.login;
    			if (changed.password) input1.value = ctx.password;
    			if (changed.email) input2.value = ctx.email;

    			if (!ctx.isValidEmail && ctx.touched) {
    				if (!if_block0) {
    					if_block0 = create_if_block_1(ctx);
    					if_block0.c();
    					if_block0.m(div, t5);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (changed.agree) input3.checked = ctx.agree;

    			if (changed.questions) {
    				each_value = ctx.questions;

    				for (var i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(changed, child_ctx);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(select, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}
    				each_blocks.length = each_value.length;
    			}

    			if (changed.selected) select_option(select, ctx.selected);
    			if (changed.answer && (input4.value !== ctx.answer)) input4.value = ctx.answer;

    			if (ctx.$currentUser) {
    				if (if_block1) {
    					if_block1.p(changed, ctx);
    				} else {
    					if_block1 = create_if_block(ctx);
    					if_block1.c();
    					if_block1.m(if_block1_anchor.parentNode, if_block1_anchor);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(form);
    			}

    			if (if_block0) if_block0.d();

    			destroy_each(each_blocks, detaching);

    			if (detaching) {
    				detach(t11);
    			}

    			if (if_block1) if_block1.d(detaching);

    			if (detaching) {
    				detach(if_block1_anchor);
    			}

    			run_all(dispose);
    		}
    	};
    }

    function instance($$self, $$props, $$invalidate) {
    	let $currentUser;

    	

      let login = "User";
      let password = "Password";
      let email = "";
      let agree = false;
      let selected = {};
      let answer = "";
      let touched = false;

      let questions = [
        { id: 1, text: `Where did you go to school?` },
        { id: 2, text: `What is your mother's name?` },
        {
          id: 3,
          text: `What is another personal fact that an attacker could easily find with Google?`
        }
      ];

      // const [dispatch, count] = connect("count");
      const [dispatch, currentUser] = connect("currentUser"); validate_store(currentUser, 'currentUser'); subscribe($$self, currentUser, $$value => { $currentUser = $$value; $$invalidate('$currentUser', $currentUser); });

      function loginHandler() {
        $$invalidate('touched', touched = true);
        let userData = { login, password, agree, selected: selected.id };
        dispatch("user/auth", userData);
      }

    	function input0_input_handler() {
    		login = this.value;
    		$$invalidate('login', login);
    	}

    	function input1_input_handler() {
    		password = this.value;
    		$$invalidate('password', password);
    	}

    	function input2_input_handler() {
    		email = this.value;
    		$$invalidate('email', email);
    	}

    	function input3_change_handler() {
    		agree = this.checked;
    		$$invalidate('agree', agree);
    	}

    	function select_change_handler() {
    		selected = select_value(this);
    		$$invalidate('selected', selected);
    		$$invalidate('questions', questions);
    	}

    	function input4_input_handler() {
    		answer = this.value;
    		$$invalidate('answer', answer);
    	}

    	let isValidEmail;

    	$$self.$$.update = ($$dirty = { email: 1 }) => {
    		if ($$dirty.email) { $$invalidate('isValidEmail', isValidEmail = isEmail(email)); }
    	};

    	return {
    		login,
    		password,
    		email,
    		agree,
    		selected,
    		answer,
    		touched,
    		questions,
    		currentUser,
    		loginHandler,
    		isValidEmail,
    		$currentUser,
    		input0_input_handler,
    		input1_input_handler,
    		input2_input_handler,
    		input3_change_handler,
    		select_change_handler,
    		input4_input_handler
    	};
    }

    class LoginForm extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, []);
    	}
    }

    /* src/containers/MainContainer.svelte generated by Svelte v3.4.4 */

    const file$1 = "src/containers/MainContainer.svelte";

    function create_fragment$1(ctx) {
    	var div, current;

    	var loginform = new LoginForm({ $$inline: true });

    	return {
    		c: function create() {
    			div = element("div");
    			loginform.$$.fragment.c();
    			add_location(div, file$1, 4, 0, 78);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, div, anchor);
    			mount_component(loginform, div, null);
    			current = true;
    		},

    		p: noop,

    		i: function intro(local) {
    			if (current) return;
    			loginform.$$.fragment.i(local);

    			current = true;
    		},

    		o: function outro(local) {
    			loginform.$$.fragment.o(local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div);
    			}

    			loginform.$destroy();
    		}
    	};
    }

    class MainContainer extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, null, create_fragment$1, safe_not_equal, []);
    	}
    }

    /* src/App.svelte generated by Svelte v3.4.4 */

    function create_fragment$2(ctx) {
    	var current;

    	var maincontainer = new MainContainer({ $$inline: true });

    	return {
    		c: function create() {
    			maincontainer.$$.fragment.c();
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			mount_component(maincontainer, target, anchor);
    			current = true;
    		},

    		p: noop,

    		i: function intro(local) {
    			if (current) return;
    			maincontainer.$$.fragment.i(local);

    			current = true;
    		},

    		o: function outro(local) {
    			maincontainer.$$.fragment.o(local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			maincontainer.$destroy(detaching);
    		}
    	};
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, null, create_fragment$2, safe_not_equal, []);
    	}
    }

    const app = new App({
      target: document.body
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
