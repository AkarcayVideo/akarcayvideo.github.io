
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
(function () {
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
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
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
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    // unfortunately this can't be a constant as that wouldn't be tree-shakeable
    // so we cache the result instead
    let crossorigin;
    function is_crossorigin() {
        if (crossorigin === undefined) {
            crossorigin = false;
            try {
                if (typeof window !== 'undefined' && window.parent) {
                    void window.parent.document;
                }
            }
            catch (error) {
                crossorigin = true;
            }
        }
        return crossorigin;
    }
    function add_resize_listener(node, fn) {
        const computed_style = getComputedStyle(node);
        const z_index = (parseInt(computed_style.zIndex) || 0) - 1;
        if (computed_style.position === 'static') {
            node.style.position = 'relative';
        }
        const iframe = element('iframe');
        iframe.setAttribute('style', `display: block; position: absolute; top: 0; left: 0; width: 100%; height: 100%; ` +
            `overflow: hidden; border: 0; opacity: 0; pointer-events: none; z-index: ${z_index};`);
        iframe.setAttribute('aria-hidden', 'true');
        iframe.tabIndex = -1;
        const crossorigin = is_crossorigin();
        let unsubscribe;
        if (crossorigin) {
            iframe.src = `data:text/html,<script>onresize=function(){parent.postMessage(0,'*')}</script>`;
            unsubscribe = listen(window, 'message', (event) => {
                if (event.source === iframe.contentWindow)
                    fn();
            });
        }
        else {
            iframe.src = 'about:blank';
            iframe.onload = () => {
                unsubscribe = listen(iframe.contentWindow, 'resize', fn);
            };
        }
        append(node, iframe);
        return () => {
            if (crossorigin) {
                unsubscribe();
            }
            else if (unsubscribe && iframe.contentWindow) {
                unsubscribe();
            }
            detach(iframe);
        };
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error(`Function called outside component initialization`);
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function add_flush_callback(fn) {
        flush_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);

    function bind(component, name, callback) {
        const index = component.$$.props[name];
        if (index !== undefined) {
            component.$$.bound[index] = callback;
            callback(component.$$.ctx[index]);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
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
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
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
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.24.1' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
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
        $capture_state() { }
        $inject_state() { }
    }

    /* src\Nav.svelte generated by Svelte v3.24.1 */

    const file = "src\\Nav.svelte";

    function create_fragment(ctx) {
    	let nav;
    	let span0;
    	let t1;
    	let span1;
    	let t3;
    	let span2;
    	let t5;
    	let span3;
    	let t7;
    	let span4;
    	let t9;
    	let span5;
    	let t11;
    	let span6;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			nav = element("nav");
    			span0 = element("span");
    			span0.textContent = "Anasayfa";
    			t1 = space();
    			span1 = element("span");
    			span1.textContent = "Fotoğraflar";
    			t3 = space();
    			span2 = element("span");
    			span2.textContent = "Nostalji";
    			t5 = space();
    			span3 = element("span");
    			span3.textContent = "Düğün";
    			t7 = space();
    			span4 = element("span");
    			span4.textContent = "Klipler";
    			t9 = space();
    			span5 = element("span");
    			span5.textContent = "Canlı Yayın";
    			t11 = space();
    			span6 = element("span");
    			span6.textContent = "Akarçay Radyosu";
    			attr_dev(span0, "class", "svelte-n8p95x");
    			toggle_class(span0, "active", /*page*/ ctx[0] == 0);
    			add_location(span0, file, 5, 4, 51);
    			attr_dev(span1, "class", "svelte-n8p95x");
    			toggle_class(span1, "active", /*page*/ ctx[0] == 1);
    			add_location(span1, file, 6, 4, 137);
    			attr_dev(span2, "class", "svelte-n8p95x");
    			toggle_class(span2, "active", /*page*/ ctx[0] == 2);
    			add_location(span2, file, 7, 4, 223);
    			attr_dev(span3, "class", "svelte-n8p95x");
    			toggle_class(span3, "active", /*page*/ ctx[0] == 3);
    			add_location(span3, file, 8, 4, 309);
    			attr_dev(span4, "class", "svelte-n8p95x");
    			toggle_class(span4, "active", /*page*/ ctx[0] == 4);
    			add_location(span4, file, 9, 4, 395);
    			attr_dev(span5, "class", "svelte-n8p95x");
    			toggle_class(span5, "active", /*page*/ ctx[0] == 5);
    			add_location(span5, file, 10, 4, 481);
    			attr_dev(span6, "class", "svelte-n8p95x");
    			toggle_class(span6, "active", /*page*/ ctx[0] == 6);
    			add_location(span6, file, 11, 4, 567);
    			attr_dev(nav, "class", "svelte-n8p95x");
    			add_location(nav, file, 4, 0, 41);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, nav, anchor);
    			append_dev(nav, span0);
    			append_dev(nav, t1);
    			append_dev(nav, span1);
    			append_dev(nav, t3);
    			append_dev(nav, span2);
    			append_dev(nav, t5);
    			append_dev(nav, span3);
    			append_dev(nav, t7);
    			append_dev(nav, span4);
    			append_dev(nav, t9);
    			append_dev(nav, span5);
    			append_dev(nav, t11);
    			append_dev(nav, span6);

    			if (!mounted) {
    				dispose = [
    					listen_dev(span0, "click", /*click_handler*/ ctx[1], false, false, false),
    					listen_dev(span1, "click", /*click_handler_1*/ ctx[2], false, false, false),
    					listen_dev(span2, "click", /*click_handler_2*/ ctx[3], false, false, false),
    					listen_dev(span3, "click", /*click_handler_3*/ ctx[4], false, false, false),
    					listen_dev(span4, "click", /*click_handler_4*/ ctx[5], false, false, false),
    					listen_dev(span5, "click", /*click_handler_5*/ ctx[6], false, false, false),
    					listen_dev(span6, "click", /*click_handler_6*/ ctx[7], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*page*/ 1) {
    				toggle_class(span0, "active", /*page*/ ctx[0] == 0);
    			}

    			if (dirty & /*page*/ 1) {
    				toggle_class(span1, "active", /*page*/ ctx[0] == 1);
    			}

    			if (dirty & /*page*/ 1) {
    				toggle_class(span2, "active", /*page*/ ctx[0] == 2);
    			}

    			if (dirty & /*page*/ 1) {
    				toggle_class(span3, "active", /*page*/ ctx[0] == 3);
    			}

    			if (dirty & /*page*/ 1) {
    				toggle_class(span4, "active", /*page*/ ctx[0] == 4);
    			}

    			if (dirty & /*page*/ 1) {
    				toggle_class(span5, "active", /*page*/ ctx[0] == 5);
    			}

    			if (dirty & /*page*/ 1) {
    				toggle_class(span6, "active", /*page*/ ctx[0] == 6);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(nav);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { page } = $$props;
    	const writable_props = ["page"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Nav> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Nav", $$slots, []);

    	const click_handler = () => {
    		$$invalidate(0, page = 0);
    	};

    	const click_handler_1 = () => {
    		$$invalidate(0, page = 1);
    	};

    	const click_handler_2 = () => {
    		$$invalidate(0, page = 2);
    	};

    	const click_handler_3 = () => {
    		$$invalidate(0, page = 3);
    	};

    	const click_handler_4 = () => {
    		$$invalidate(0, page = 4);
    	};

    	const click_handler_5 = () => {
    		$$invalidate(0, page = 5);
    	};

    	const click_handler_6 = () => {
    		$$invalidate(0, page = 6);
    	};

    	$$self.$$set = $$props => {
    		if ("page" in $$props) $$invalidate(0, page = $$props.page);
    	};

    	$$self.$capture_state = () => ({ page });

    	$$self.$inject_state = $$props => {
    		if ("page" in $$props) $$invalidate(0, page = $$props.page);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		page,
    		click_handler,
    		click_handler_1,
    		click_handler_2,
    		click_handler_3,
    		click_handler_4,
    		click_handler_5,
    		click_handler_6
    	];
    }

    class Nav extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { page: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Nav",
    			options,
    			id: create_fragment.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*page*/ ctx[0] === undefined && !("page" in props)) {
    			console.warn("<Nav> was created without expected prop 'page'");
    		}
    	}

    	get page() {
    		throw new Error("<Nav>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set page(value) {
    		throw new Error("<Nav>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Videos.svelte generated by Svelte v3.24.1 */
    const file$1 = "src\\Videos.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[9] = list[i];
    	return child_ctx;
    }

    // (55:4) {#each videos as video}
    function create_each_block(ctx) {
    	let iframe;
    	let iframe_src_value;

    	const block = {
    		c: function create() {
    			iframe = element("iframe");
    			attr_dev(iframe, "title", "video");
    			if (iframe.src !== (iframe_src_value = /*video*/ ctx[9])) attr_dev(iframe, "src", iframe_src_value);
    			attr_dev(iframe, "frameborder", "0");
    			attr_dev(iframe, "allow", "gyroscope; picture-in-picture");
    			iframe.allowFullscreen = true;
    			attr_dev(iframe, "class", "svelte-7867pj");
    			add_location(iframe, file$1, 55, 4, 1273);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, iframe, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*videos*/ 1 && iframe.src !== (iframe_src_value = /*video*/ ctx[9])) {
    				attr_dev(iframe, "src", iframe_src_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(iframe);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(55:4) {#each videos as video}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let main;
    	let each_value = /*videos*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			main = element("main");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(main, "class", "svelte-7867pj");
    			add_location(main, file$1, 53, 0, 1234);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(main, null);
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*videos*/ 1) {
    				each_value = /*videos*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(main, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { pageName } = $$props;
    	let { active } = $$props;
    	let allVideos = [];
    	let videos = [];
    	let lastLoaded = 0;
    	let finished = false;

    	async function FetchVideos() {
    		const videoList = await GetVideos(pageName);
    		allVideos = videoList.split(",").map(id => `https://www.youtube.com/embed/${id}`);
    		return allVideos;
    	}

    	onMount(async () => {
    		await FetchVideos();
    		LoadVideos(0, 10);
    	});

    	function LoadVideos(from, to) {
    		for (let i = from; i < to; i++) {
    			if (allVideos[i]) {
    				$$invalidate(0, videos[i] = allVideos[i], videos);
    			} else {
    				finished = true;
    			}
    		}

    		lastLoaded = to;
    	}

    	function ScrollEvent() {
    		if (!active || finished) {
    			return;
    		}

    		const DOC = document.documentElement;
    		const top = DOC.scrollTop;
    		const height = DOC.scrollHeight - DOC.clientHeight;
    		const percent = top / height;
    		percent >= 0.75 && LoadVideos(lastLoaded, lastLoaded + 10);
    	}

    	const writable_props = ["pageName", "active"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Videos> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Videos", $$slots, []);

    	$$self.$$set = $$props => {
    		if ("pageName" in $$props) $$invalidate(1, pageName = $$props.pageName);
    		if ("active" in $$props) $$invalidate(2, active = $$props.active);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		pageName,
    		active,
    		allVideos,
    		videos,
    		lastLoaded,
    		finished,
    		FetchVideos,
    		LoadVideos,
    		ScrollEvent
    	});

    	$$self.$inject_state = $$props => {
    		if ("pageName" in $$props) $$invalidate(1, pageName = $$props.pageName);
    		if ("active" in $$props) $$invalidate(2, active = $$props.active);
    		if ("allVideos" in $$props) allVideos = $$props.allVideos;
    		if ("videos" in $$props) $$invalidate(0, videos = $$props.videos);
    		if ("lastLoaded" in $$props) lastLoaded = $$props.lastLoaded;
    		if ("finished" in $$props) finished = $$props.finished;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*active*/ 4) {
    			 {
    				if (active) {
    					document.onscroll = ScrollEvent;
    					document.ontouchmove = ScrollEvent;
    				}
    			}
    		}
    	};

    	return [videos, pageName, active];
    }

    class Videos extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { pageName: 1, active: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Videos",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*pageName*/ ctx[1] === undefined && !("pageName" in props)) {
    			console.warn("<Videos> was created without expected prop 'pageName'");
    		}

    		if (/*active*/ ctx[2] === undefined && !("active" in props)) {
    			console.warn("<Videos> was created without expected prop 'active'");
    		}
    	}

    	get pageName() {
    		throw new Error("<Videos>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set pageName(value) {
    		throw new Error("<Videos>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get active() {
    		throw new Error("<Videos>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set active(value) {
    		throw new Error("<Videos>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Photos.svelte generated by Svelte v3.24.1 */

    const { Object: Object_1, setTimeout: setTimeout_1, window: window_1 } = globals;
    const file$2 = "src\\Photos.svelte";

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[30] = list[i];
    	return child_ctx;
    }

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[27] = list[i];
    	return child_ctx;
    }

    // (114:8) {#each column as photo}
    function create_each_block_1(ctx) {
    	let img;
    	let img_src_value;
    	let mounted;
    	let dispose;

    	function click_handler(...args) {
    		return /*click_handler*/ ctx[9](/*photo*/ ctx[30], ...args);
    	}

    	const block = {
    		c: function create() {
    			img = element("img");
    			if (img.src !== (img_src_value = /*photo*/ ctx[30])) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "Resim");
    			attr_dev(img, "class", "svelte-zrfzr4");
    			add_location(img, file$2, 114, 8, 3428);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, img, anchor);

    			if (!mounted) {
    				dispose = listen_dev(img, "click", click_handler, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty[0] & /*columns*/ 1 && img.src !== (img_src_value = /*photo*/ ctx[30])) {
    				attr_dev(img, "src", img_src_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(img);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(114:8) {#each column as photo}",
    		ctx
    	});

    	return block;
    }

    // (112:4) {#each columns as column}
    function create_each_block$1(ctx) {
    	let div;
    	let t;
    	let each_value_1 = /*column*/ ctx[27];
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t = space();
    			attr_dev(div, "class", "column svelte-zrfzr4");
    			add_location(div, file$2, 112, 4, 3367);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			append_dev(div, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*columns, Focus*/ 33) {
    				each_value_1 = /*column*/ ctx[27];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div, t);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_1.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(112:4) {#each columns as column}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let scrolling = false;

    	let clear_scrolling = () => {
    		scrolling = false;
    	};

    	let scrolling_timeout;
    	let main;
    	let main_resize_listener;
    	let t;
    	let div;
    	let img;
    	let img_src_value;
    	let mounted;
    	let dispose;
    	add_render_callback(/*onwindowscroll*/ ctx[8]);
    	let each_value = /*columns*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			main = element("main");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t = space();
    			div = element("div");
    			img = element("img");
    			attr_dev(main, "style", /*style*/ ctx[4]);
    			attr_dev(main, "class", "svelte-zrfzr4");
    			add_render_callback(() => /*main_elementresize_handler*/ ctx[10].call(main));
    			add_location(main, file$2, 110, 0, 3293);
    			attr_dev(img, "id", "image");
    			if (img.src !== (img_src_value = /*focusedImage*/ ctx[2])) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "Resim");
    			attr_dev(img, "class", "svelte-zrfzr4");
    			add_location(img, file$2, 123, 4, 3709);
    			attr_dev(div, "id", "focused-image");
    			set_style(div, "display", !!/*focusedImage*/ ctx[2] ? "block" : "none");
    			set_style(div, "top", /*scrollY*/ ctx[3] + "px");
    			attr_dev(div, "class", "svelte-zrfzr4");
    			add_location(div, file$2, 122, 0, 3588);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(main, null);
    			}

    			main_resize_listener = add_resize_listener(main, /*main_elementresize_handler*/ ctx[10].bind(main));
    			insert_dev(target, t, anchor);
    			insert_dev(target, div, anchor);
    			append_dev(div, img);

    			if (!mounted) {
    				dispose = [
    					listen_dev(window_1, "scroll", () => {
    						scrolling = true;
    						clearTimeout(scrolling_timeout);
    						scrolling_timeout = setTimeout_1(clear_scrolling, 100);
    						/*onwindowscroll*/ ctx[8]();
    					}),
    					listen_dev(div, "click", /*LoseFocus*/ ctx[6], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*scrollY*/ 8 && !scrolling) {
    				scrolling = true;
    				clearTimeout(scrolling_timeout);
    				scrollTo(window_1.pageXOffset, /*scrollY*/ ctx[3]);
    				scrolling_timeout = setTimeout_1(clear_scrolling, 100);
    			}

    			if (dirty[0] & /*columns, Focus*/ 33) {
    				each_value = /*columns*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(main, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty[0] & /*style*/ 16) {
    				attr_dev(main, "style", /*style*/ ctx[4]);
    			}

    			if (dirty[0] & /*focusedImage*/ 4 && img.src !== (img_src_value = /*focusedImage*/ ctx[2])) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty[0] & /*focusedImage*/ 4) {
    				set_style(div, "display", !!/*focusedImage*/ ctx[2] ? "block" : "none");
    			}

    			if (dirty[0] & /*scrollY*/ 8) {
    				set_style(div, "top", /*scrollY*/ ctx[3] + "px");
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_each(each_blocks, detaching);
    			main_resize_listener();
    			if (detaching) detach_dev(t);
    			if (detaching) detach_dev(div);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const IMAGE_BASE_URL = "https://raw.githubusercontent.com/AkarcayVideo/akarcayvideo.github.io/master/fotograflar";

    function instance$2($$self, $$props, $$invalidate) {
    	let { active } = $$props;
    	let columns = [];
    	let photos = [];
    	let photoPaths = [];
    	let clientWidth = 0;
    	let focusedImage = null;
    	let focusedIndex = 0;
    	let scrollY;
    	let lastLoaded = 0;

    	onMount(async () => {
    		const focusedImage = document.querySelector("#focused-image");
    		document.body.appendChild(focusedImage);
    		$$invalidate(12, photoPaths = await GetImagePaths());
    		LoadMore();
    	});

    	async function LoadImage(path) {
    		const ref = imagesRef.child(path);
    		const url = await ref.getDownloadURL();
    		photos.push(url);
    		photos = [...new Set(photos)].sort();

    		await new Promise((res, rej) => {
    				setTimeout(res, 1);
    			});

    		Draw();
    	}

    	async function LoadImages(from, to) {
    		for (let i = from; i < to; i++) {
    			await LoadImage(photoPaths[i]);
    			$$invalidate(13, lastLoaded = to);
    		}
    	}

    	async function LoadMore() {
    		LoadImages(lastLoaded, lastLoaded + columnCount * 2);
    	}

    	function Draw() {
    		$$invalidate(0, columns = []);

    		photos.forEach((photo, i) => {
    			const col = i % columnCount;
    			$$invalidate(0, columns[col] = [...columns[col] || [], photo], columns);
    		});
    	}

    	function ScrollEvent() {
    		if (!active || finished) {
    			return;
    		}

    		const DOC = document.documentElement;
    		const top = DOC.scrollTop;
    		const height = DOC.scrollHeight - DOC.clientHeight;
    		const percent = top / height;
    		percent >= 0.75 && LoadMore();
    	}

    	/* FOCUS SYSTEM */
    	function Focus(photo) {
    		if (clientWidth <= 600) {
    			return;
    		}

    		$$invalidate(2, focusedImage = photo);
    		ScrollEnabled(false);
    	}

    	function LoseFocus(e) {
    		if (e.target.id !== "focused-image") {
    			return;
    		}

    		$$invalidate(2, focusedImage = "");
    		ScrollEnabled(true);
    	}

    	/* ENABLE & DISABLE SCROLLING */
    	let supportsPassive = false;

    	window.addEventListener("test", null, Object.defineProperty({}, "passive", {
    		get: () => {
    			supportsPassive = true;
    		}
    	}));

    	const preventDefault = e => e.preventDefault();
    	const wheelOpt = supportsPassive ? { passive: false } : false;

    	const wheelEvent = "onwheel" in document.createElement("div")
    	? "wheel"
    	: "mousewheel";

    	function ScrollEnabled(enabled) {
    		if (enabled) {
    			window.removeEventListener("DOMMouseScroll", preventDefault, false);
    			window.removeEventListener(wheelEvent, preventDefault, wheelOpt);
    			window.removeEventListener("touchmove", preventDefault, wheelOpt);
    		} else {
    			window.addEventListener("DOMMouseScroll", preventDefault, false);
    			window.addEventListener(wheelEvent, preventDefault, wheelOpt);
    			window.addEventListener("touchmove", preventDefault, wheelOpt);
    		}
    	}

    	const writable_props = ["active"];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Photos> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Photos", $$slots, []);

    	function onwindowscroll() {
    		$$invalidate(3, scrollY = window_1.pageYOffset);
    	}

    	const click_handler = photo => {
    		Focus(photo);
    	};

    	function main_elementresize_handler() {
    		clientWidth = this.clientWidth;
    		$$invalidate(1, clientWidth);
    	}

    	$$self.$$set = $$props => {
    		if ("active" in $$props) $$invalidate(7, active = $$props.active);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		active,
    		IMAGE_BASE_URL,
    		columns,
    		photos,
    		photoPaths,
    		clientWidth,
    		focusedImage,
    		focusedIndex,
    		scrollY,
    		lastLoaded,
    		LoadImage,
    		LoadImages,
    		LoadMore,
    		Draw,
    		ScrollEvent,
    		Focus,
    		LoseFocus,
    		supportsPassive,
    		preventDefault,
    		wheelOpt,
    		wheelEvent,
    		ScrollEnabled,
    		columnCount,
    		finished,
    		style
    	});

    	$$self.$inject_state = $$props => {
    		if ("active" in $$props) $$invalidate(7, active = $$props.active);
    		if ("columns" in $$props) $$invalidate(0, columns = $$props.columns);
    		if ("photos" in $$props) photos = $$props.photos;
    		if ("photoPaths" in $$props) $$invalidate(12, photoPaths = $$props.photoPaths);
    		if ("clientWidth" in $$props) $$invalidate(1, clientWidth = $$props.clientWidth);
    		if ("focusedImage" in $$props) $$invalidate(2, focusedImage = $$props.focusedImage);
    		if ("focusedIndex" in $$props) focusedIndex = $$props.focusedIndex;
    		if ("scrollY" in $$props) $$invalidate(3, scrollY = $$props.scrollY);
    		if ("lastLoaded" in $$props) $$invalidate(13, lastLoaded = $$props.lastLoaded);
    		if ("supportsPassive" in $$props) supportsPassive = $$props.supportsPassive;
    		if ("columnCount" in $$props) $$invalidate(15, columnCount = $$props.columnCount);
    		if ("finished" in $$props) finished = $$props.finished;
    		if ("style" in $$props) $$invalidate(4, style = $$props.style);
    	};

    	let columnCount;
    	let finished;
    	let style;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty[0] & /*clientWidth*/ 2) {
    			 $$invalidate(15, columnCount = clientWidth > 600 ? 2 : 1);
    		}

    		if ($$self.$$.dirty[0] & /*columnCount*/ 32768) {
    			 columnCount && Draw();
    		}

    		if ($$self.$$.dirty[0] & /*lastLoaded, photoPaths*/ 12288) {
    			 finished = lastLoaded >= photoPaths.length;
    		}

    		if ($$self.$$.dirty[0] & /*columnCount*/ 32768) {
    			 $$invalidate(4, style = `grid-template-columns: repeat(${columnCount}, 1fr)`);
    		}

    		if ($$self.$$.dirty[0] & /*active*/ 128) {
    			 {
    				if (active) {
    					document.onscroll = ScrollEvent;
    					document.ontouchmove = ScrollEvent;
    				}
    			}
    		}
    	};

    	return [
    		columns,
    		clientWidth,
    		focusedImage,
    		scrollY,
    		style,
    		Focus,
    		LoseFocus,
    		active,
    		onwindowscroll,
    		click_handler,
    		main_elementresize_handler
    	];
    }

    class Photos extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { active: 7 }, [-1, -1]);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Photos",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*active*/ ctx[7] === undefined && !("active" in props)) {
    			console.warn("<Photos> was created without expected prop 'active'");
    		}
    	}

    	get active() {
    		throw new Error("<Photos>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set active(value) {
    		throw new Error("<Photos>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Live.svelte generated by Svelte v3.24.1 */

    const file$3 = "src\\Live.svelte";

    function create_fragment$3(ctx) {
    	let main;
    	let iframe;
    	let iframe_src_value;

    	const block = {
    		c: function create() {
    			main = element("main");
    			iframe = element("iframe");
    			attr_dev(iframe, "title", "Canlı Yayın");
    			if (iframe.src !== (iframe_src_value = URL)) attr_dev(iframe, "src", iframe_src_value);
    			attr_dev(iframe, "frameborder", "0");
    			iframe.allowFullscreen = true;
    			attr_dev(iframe, "class", "svelte-1cd8oux");
    			add_location(iframe, file$3, 5, 4, 125);
    			attr_dev(main, "class", "svelte-1cd8oux");
    			add_location(main, file$3, 4, 0, 114);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, iframe);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const URL = "https://www.youtube.com/embed/live_stream?channel=UCpsYwd-aZF6FLfIzjv3V4Dw";

    function instance$3($$self, $$props, $$invalidate) {
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Live> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Live", $$slots, []);
    	$$self.$capture_state = () => ({ URL });
    	return [];
    }

    class Live extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Live",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* src\Radio.svelte generated by Svelte v3.24.1 */

    const file$4 = "src\\Radio.svelte";

    function create_fragment$4(ctx) {
    	let main;
    	let p;
    	let t0;
    	let a0;
    	let t2;
    	let t3;
    	let a1;
    	let button;

    	const block = {
    		c: function create() {
    			main = element("main");
    			p = element("p");
    			t0 = text("Yayını izlemek için\r\n        ");
    			a0 = element("a");
    			a0.textContent = "Flatcast Programını";
    			t2 = text("\r\n        İndirin");
    			t3 = space();
    			a1 = element("a");
    			button = element("button");
    			button.textContent = "Yayına Git";
    			set_style(a0, "color", "blue");
    			attr_dev(a0, "href", "https://www.flatcast.com/Download.aspx?con=u&version=531");
    			add_location(a0, file$4, 3, 8, 54);
    			add_location(p, file$4, 1, 4, 12);
    			attr_dev(button, "class", "svelte-ugog68");
    			add_location(button, file$4, 10, 8, 265);
    			attr_dev(a1, "href", "flatcast:?sid=1603470");
    			add_location(a1, file$4, 9, 4, 223);
    			attr_dev(main, "class", "svelte-ugog68");
    			add_location(main, file$4, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, p);
    			append_dev(p, t0);
    			append_dev(p, a0);
    			append_dev(p, t2);
    			append_dev(main, t3);
    			append_dev(main, a1);
    			append_dev(a1, button);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props) {
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Radio> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Radio", $$slots, []);
    	return [];
    }

    class Radio extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Radio",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* src\App.svelte generated by Svelte v3.24.1 */
    const file$5 = "src\\App.svelte";

    function create_fragment$5(ctx) {
    	let div0;
    	let t0;
    	let nav;
    	let updating_page;
    	let t1;
    	let div8;
    	let div1;
    	let videos0;
    	let t2;
    	let div2;
    	let photos;
    	let t3;
    	let div3;
    	let videos1;
    	let t4;
    	let div4;
    	let videos2;
    	let t5;
    	let div5;
    	let videos3;
    	let t6;
    	let div6;
    	let live;
    	let t7;
    	let div7;
    	let radio;
    	let current;

    	function nav_page_binding(value) {
    		/*nav_page_binding*/ ctx[1].call(null, value);
    	}

    	let nav_props = {};

    	if (/*page*/ ctx[0] !== void 0) {
    		nav_props.page = /*page*/ ctx[0];
    	}

    	nav = new Nav({ props: nav_props, $$inline: true });
    	binding_callbacks.push(() => bind(nav, "page", nav_page_binding));

    	videos0 = new Videos({
    			props: {
    				active: /*page*/ ctx[0] === 0,
    				pageName: "anasayfa"
    			},
    			$$inline: true
    		});

    	photos = new Photos({
    			props: { active: /*page*/ ctx[0] === 1 },
    			$$inline: true
    		});

    	videos1 = new Videos({
    			props: {
    				active: /*page*/ ctx[0] === 2,
    				pageName: "nostalji"
    			},
    			$$inline: true
    		});

    	videos2 = new Videos({
    			props: {
    				active: /*page*/ ctx[0] === 3,
    				pageName: "dugun"
    			},
    			$$inline: true
    		});

    	videos3 = new Videos({
    			props: {
    				active: /*page*/ ctx[0] === 4,
    				pageName: "klipler"
    			},
    			$$inline: true
    		});

    	live = new Live({ $$inline: true });
    	radio = new Radio({ $$inline: true });

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			t0 = space();
    			create_component(nav.$$.fragment);
    			t1 = space();
    			div8 = element("div");
    			div1 = element("div");
    			create_component(videos0.$$.fragment);
    			t2 = space();
    			div2 = element("div");
    			create_component(photos.$$.fragment);
    			t3 = space();
    			div3 = element("div");
    			create_component(videos1.$$.fragment);
    			t4 = space();
    			div4 = element("div");
    			create_component(videos2.$$.fragment);
    			t5 = space();
    			div5 = element("div");
    			create_component(videos3.$$.fragment);
    			t6 = space();
    			div6 = element("div");
    			create_component(live.$$.fragment);
    			t7 = space();
    			div7 = element("div");
    			create_component(radio.$$.fragment);
    			attr_dev(div0, "id", "banner");
    			attr_dev(div0, "class", "svelte-1w3tpas");
    			add_location(div0, file$5, 10, 0, 219);
    			attr_dev(div1, "class", "page svelte-1w3tpas");
    			toggle_class(div1, "active", /*page*/ ctx[0] === 0);
    			add_location(div1, file$5, 14, 1, 280);
    			attr_dev(div2, "class", "page svelte-1w3tpas");
    			toggle_class(div2, "active", /*page*/ ctx[0] === 1);
    			add_location(div2, file$5, 15, 1, 388);
    			attr_dev(div3, "class", "page svelte-1w3tpas");
    			toggle_class(div3, "active", /*page*/ ctx[0] === 2);
    			add_location(div3, file$5, 16, 1, 474);
    			attr_dev(div4, "class", "page svelte-1w3tpas");
    			toggle_class(div4, "active", /*page*/ ctx[0] === 3);
    			add_location(div4, file$5, 17, 1, 582);
    			attr_dev(div5, "class", "page svelte-1w3tpas");
    			toggle_class(div5, "active", /*page*/ ctx[0] === 4);
    			add_location(div5, file$5, 18, 1, 687);
    			attr_dev(div6, "class", "page svelte-1w3tpas");
    			toggle_class(div6, "active", /*page*/ ctx[0] === 5);
    			add_location(div6, file$5, 19, 1, 794);
    			attr_dev(div7, "class", "page svelte-1w3tpas");
    			toggle_class(div7, "active", /*page*/ ctx[0] === 6);
    			add_location(div7, file$5, 20, 1, 856);
    			attr_dev(div8, "id", "pages");
    			attr_dev(div8, "class", "svelte-1w3tpas");
    			add_location(div8, file$5, 13, 0, 262);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(nav, target, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div8, anchor);
    			append_dev(div8, div1);
    			mount_component(videos0, div1, null);
    			append_dev(div8, t2);
    			append_dev(div8, div2);
    			mount_component(photos, div2, null);
    			append_dev(div8, t3);
    			append_dev(div8, div3);
    			mount_component(videos1, div3, null);
    			append_dev(div8, t4);
    			append_dev(div8, div4);
    			mount_component(videos2, div4, null);
    			append_dev(div8, t5);
    			append_dev(div8, div5);
    			mount_component(videos3, div5, null);
    			append_dev(div8, t6);
    			append_dev(div8, div6);
    			mount_component(live, div6, null);
    			append_dev(div8, t7);
    			append_dev(div8, div7);
    			mount_component(radio, div7, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const nav_changes = {};

    			if (!updating_page && dirty & /*page*/ 1) {
    				updating_page = true;
    				nav_changes.page = /*page*/ ctx[0];
    				add_flush_callback(() => updating_page = false);
    			}

    			nav.$set(nav_changes);
    			const videos0_changes = {};
    			if (dirty & /*page*/ 1) videos0_changes.active = /*page*/ ctx[0] === 0;
    			videos0.$set(videos0_changes);

    			if (dirty & /*page*/ 1) {
    				toggle_class(div1, "active", /*page*/ ctx[0] === 0);
    			}

    			const photos_changes = {};
    			if (dirty & /*page*/ 1) photos_changes.active = /*page*/ ctx[0] === 1;
    			photos.$set(photos_changes);

    			if (dirty & /*page*/ 1) {
    				toggle_class(div2, "active", /*page*/ ctx[0] === 1);
    			}

    			const videos1_changes = {};
    			if (dirty & /*page*/ 1) videos1_changes.active = /*page*/ ctx[0] === 2;
    			videos1.$set(videos1_changes);

    			if (dirty & /*page*/ 1) {
    				toggle_class(div3, "active", /*page*/ ctx[0] === 2);
    			}

    			const videos2_changes = {};
    			if (dirty & /*page*/ 1) videos2_changes.active = /*page*/ ctx[0] === 3;
    			videos2.$set(videos2_changes);

    			if (dirty & /*page*/ 1) {
    				toggle_class(div4, "active", /*page*/ ctx[0] === 3);
    			}

    			const videos3_changes = {};
    			if (dirty & /*page*/ 1) videos3_changes.active = /*page*/ ctx[0] === 4;
    			videos3.$set(videos3_changes);

    			if (dirty & /*page*/ 1) {
    				toggle_class(div5, "active", /*page*/ ctx[0] === 4);
    			}

    			if (dirty & /*page*/ 1) {
    				toggle_class(div6, "active", /*page*/ ctx[0] === 5);
    			}

    			if (dirty & /*page*/ 1) {
    				toggle_class(div7, "active", /*page*/ ctx[0] === 6);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(nav.$$.fragment, local);
    			transition_in(videos0.$$.fragment, local);
    			transition_in(photos.$$.fragment, local);
    			transition_in(videos1.$$.fragment, local);
    			transition_in(videos2.$$.fragment, local);
    			transition_in(videos3.$$.fragment, local);
    			transition_in(live.$$.fragment, local);
    			transition_in(radio.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(nav.$$.fragment, local);
    			transition_out(videos0.$$.fragment, local);
    			transition_out(photos.$$.fragment, local);
    			transition_out(videos1.$$.fragment, local);
    			transition_out(videos2.$$.fragment, local);
    			transition_out(videos3.$$.fragment, local);
    			transition_out(live.$$.fragment, local);
    			transition_out(radio.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t0);
    			destroy_component(nav, detaching);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div8);
    			destroy_component(videos0);
    			destroy_component(photos);
    			destroy_component(videos1);
    			destroy_component(videos2);
    			destroy_component(videos3);
    			destroy_component(live);
    			destroy_component(radio);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let page = 0;
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("App", $$slots, []);

    	function nav_page_binding(value) {
    		page = value;
    		$$invalidate(0, page);
    	}

    	$$self.$capture_state = () => ({ Nav, Videos, Photos, Live, Radio, page });

    	$$self.$inject_state = $$props => {
    		if ("page" in $$props) $$invalidate(0, page = $$props.page);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [page, nav_page_binding];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    new App({ target: document.body });

}());
