
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

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
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

    /* src/components/LoginForm.svelte generated by Svelte v3.4.4 */

    const file = "src/components/LoginForm.svelte";

    function create_fragment(ctx) {
    	var h1, t1, form, input0, t2, input1, t3, input2, t4, t5, t6, select, option0, option1, t9, button, dispose;

    	return {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "Login form";
    			t1 = space();
    			form = element("form");
    			input0 = element("input");
    			t2 = space();
    			input1 = element("input");
    			t3 = space();
    			input2 = element("input");
    			t4 = text("\n  Save: ");
    			t5 = text(ctx.save);
    			t6 = space();
    			select = element("select");
    			option0 = element("option");
    			option0.textContent = "👦";
    			option1 = element("option");
    			option1.textContent = "👧";
    			t9 = space();
    			button = element("button");
    			button.textContent = "go!";
    			add_location(h1, file, 13, 0, 222);
    			input0.placeholder = "login";
    			attr(input0, "type", "text");
    			add_location(input0, file, 15, 2, 291);
    			input1.placeholder = "password";
    			attr(input1, "type", "password");
    			add_location(input1, file, 16, 2, 354);
    			attr(input2, "type", "checkbox");
    			add_location(input2, file, 17, 2, 427);
    			option0.__value = "male";
    			option0.value = option0.__value;
    			add_location(option0, file, 20, 4, 520);
    			option1.__value = "female";
    			option1.value = option1.__value;
    			add_location(option1, file, 21, 4, 557);
    			if (ctx.sex === void 0) add_render_callback(() => ctx.select_change_handler.call(select));
    			add_location(select, file, 19, 2, 490);
    			button.type = "submit";
    			add_location(button, file, 23, 2, 606);
    			add_location(form, file, 14, 0, 242);

    			dispose = [
    				listen(input0, "input", ctx.input0_input_handler),
    				listen(input1, "input", ctx.input1_input_handler),
    				listen(input2, "change", ctx.input2_change_handler),
    				listen(select, "change", ctx.select_change_handler),
    				listen(form, "submit", prevent_default(ctx.loginHandler))
    			];
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, h1, anchor);
    			insert(target, t1, anchor);
    			insert(target, form, anchor);
    			append(form, input0);

    			input0.value = ctx.login;

    			append(form, t2);
    			append(form, input1);

    			input1.value = ctx.password;

    			append(form, t3);
    			append(form, input2);

    			input2.checked = ctx.save;

    			append(form, t4);
    			append(form, t5);
    			append(form, t6);
    			append(form, select);
    			append(select, option0);
    			append(select, option1);

    			select_option(select, ctx.sex);

    			append(form, t9);
    			append(form, button);
    		},

    		p: function update(changed, ctx) {
    			if (changed.login && (input0.value !== ctx.login)) input0.value = ctx.login;
    			if (changed.password) input1.value = ctx.password;
    			if (changed.save) input2.checked = ctx.save;

    			if (changed.save) {
    				set_data(t5, ctx.save);
    			}

    			if (changed.sex) select_option(select, ctx.sex);
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(h1);
    				detach(t1);
    				detach(form);
    			}

    			run_all(dispose);
    		}
    	};
    }

    function instance($$self, $$props, $$invalidate) {
    	let login = "User";
      let password = "Password";
      let save = false;
      let sex = "sex";

      const userData = { login, password, save, sex };

      function loginHandler() {
        console.log(userData);
      }

    	function input0_input_handler() {
    		login = this.value;
    		$$invalidate('login', login);
    	}

    	function input1_input_handler() {
    		password = this.value;
    		$$invalidate('password', password);
    	}

    	function input2_change_handler() {
    		save = this.checked;
    		$$invalidate('save', save);
    	}

    	function select_change_handler() {
    		sex = select_value(this);
    		$$invalidate('sex', sex);
    	}

    	return {
    		login,
    		password,
    		save,
    		sex,
    		loginHandler,
    		input0_input_handler,
    		input1_input_handler,
    		input2_change_handler,
    		select_change_handler
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
