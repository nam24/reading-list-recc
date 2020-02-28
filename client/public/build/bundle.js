
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.head.appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
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
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if (typeof $$scope.dirty === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
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
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
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
    function onDestroy(fn) {
        get_current_component().$$.on_destroy.push(fn);
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
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
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
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
            dirty
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if ($$.bound[i])
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
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(children(options.target));
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
        $set() {
            // overridden by instance, if it has props
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.18.2' }, detail)));
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
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev("SvelteDOMSetProperty", { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
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

    /* src/Modal.svelte generated by Svelte v3.18.2 */
    const file = "src/Modal.svelte";
    const get_header_slot_changes = dirty => ({});
    const get_header_slot_context = ctx => ({});

    function create_fragment(ctx) {
    	let div0;
    	let t0;
    	let div1;
    	let t1;
    	let hr;
    	let t2;
    	let current;
    	let dispose;
    	const header_slot_template = /*$$slots*/ ctx[6].header;
    	const header_slot = create_slot(header_slot_template, ctx, /*$$scope*/ ctx[5], get_header_slot_context);
    	const default_slot_template = /*$$slots*/ ctx[6].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[5], null);

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			t0 = space();
    			div1 = element("div");
    			if (header_slot) header_slot.c();
    			t1 = space();
    			hr = element("hr");
    			t2 = space();
    			if (default_slot) default_slot.c();
    			attr_dev(div0, "class", "my-modal-background svelte-1tktj9o");
    			add_location(div0, file, 41, 0, 890);
    			add_location(hr, file, 45, 1, 1051);
    			attr_dev(div1, "class", "my-modal svelte-1tktj9o");
    			attr_dev(div1, "role", "dialog");
    			attr_dev(div1, "aria-modal", "true");
    			add_location(div1, file, 43, 0, 948);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div1, anchor);

    			if (header_slot) {
    				header_slot.m(div1, null);
    			}

    			append_dev(div1, t1);
    			append_dev(div1, hr);
    			append_dev(div1, t2);

    			if (default_slot) {
    				default_slot.m(div1, null);
    			}

    			/*div1_binding*/ ctx[7](div1);
    			current = true;

    			dispose = [
    				listen_dev(window, "keydown", /*handle_keydown*/ ctx[2], false, false, false),
    				listen_dev(div0, "click", /*close*/ ctx[1], false, false, false)
    			];
    		},
    		p: function update(ctx, [dirty]) {
    			if (header_slot && header_slot.p && dirty & /*$$scope*/ 32) {
    				header_slot.p(get_slot_context(header_slot_template, ctx, /*$$scope*/ ctx[5], get_header_slot_context), get_slot_changes(header_slot_template, /*$$scope*/ ctx[5], dirty, get_header_slot_changes));
    			}

    			if (default_slot && default_slot.p && dirty & /*$$scope*/ 32) {
    				default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[5], null), get_slot_changes(default_slot_template, /*$$scope*/ ctx[5], dirty, null));
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(header_slot, local);
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(header_slot, local);
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div1);
    			if (header_slot) header_slot.d(detaching);
    			if (default_slot) default_slot.d(detaching);
    			/*div1_binding*/ ctx[7](null);
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
    	const dispatch = createEventDispatcher();
    	const close = () => dispatch("close");
    	let modal;

    	const handle_keydown = e => {
    		if (e.key === "Escape") {
    			close();
    			return;
    		}

    		if (e.key === "Tab") {
    			// trap focus
    			const nodes = modal.querySelectorAll("*");

    			const tabbable = Array.from(nodes).filter(n => n.tabIndex >= 0);
    			let index = tabbable.indexOf(document.activeElement);
    			if (index === -1 && e.shiftKey) index = 0;
    			index += tabbable.length + (e.shiftKey ? -1 : 1);
    			index %= tabbable.length;
    			tabbable[index].focus();
    			e.preventDefault();
    		}
    	};

    	const previously_focused = typeof document !== "undefined" && document.activeElement;

    	if (previously_focused) {
    		onDestroy(() => {
    			previously_focused.focus();
    		});
    	}

    	let { $$slots = {}, $$scope } = $$props;

    	function div1_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			$$invalidate(0, modal = $$value);
    		});
    	}

    	$$self.$set = $$props => {
    		if ("$$scope" in $$props) $$invalidate(5, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ("modal" in $$props) $$invalidate(0, modal = $$props.modal);
    	};

    	return [
    		modal,
    		close,
    		handle_keydown,
    		dispatch,
    		previously_focused,
    		$$scope,
    		$$slots,
    		div1_binding
    	];
    }

    class Modal extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Modal",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.18.2 */
    const file$1 = "src/App.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[4] = list[i];
    	return child_ctx;
    }

    // (52:0) {#if showModal}
    function create_if_block(ctx) {
    	let current;

    	const modal = new Modal({
    			props: {
    				$$slots: {
    					default: [create_default_slot],
    					header: [create_header_slot]
    				},
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	modal.$on("close", /*close_handler*/ ctx[3]);

    	const block = {
    		c: function create() {
    			create_component(modal.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(modal, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const modal_changes = {};

    			if (dirty & /*$$scope, data*/ 129) {
    				modal_changes.$$scope = { dirty, ctx };
    			}

    			modal.$set(modal_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(modal.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(modal.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(modal, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(52:0) {#if showModal}",
    		ctx
    	});

    	return block;
    }

    // (54:2) <h2 slot="header">
    function create_header_slot(ctx) {
    	let h2;
    	let strong;

    	const block = {
    		c: function create() {
    			h2 = element("h2");
    			strong = element("strong");
    			strong.textContent = "Get your reading list recommendation";
    			add_location(strong, file$1, 54, 3, 1113);
    			attr_dev(h2, "slot", "header");
    			add_location(h2, file$1, 53, 2, 1091);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h2, anchor);
    			append_dev(h2, strong);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_header_slot.name,
    		type: "slot",
    		source: "(54:2) <h2 slot=\\\"header\\\">",
    		ctx
    	});

    	return block;
    }

    // (88:22) {#each data as item }
    function create_each_block(ctx) {
    	let option;
    	let t_value = /*item*/ ctx[4].name + "";
    	let t;
    	let option_value_value;

    	const block = {
    		c: function create() {
    			option = element("option");
    			t = text(t_value);
    			option.__value = option_value_value = /*item*/ ctx[4].name;
    			option.value = option.__value;
    			add_location(option, file$1, 88, 24, 2364);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, option, anchor);
    			append_dev(option, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*data*/ 1 && t_value !== (t_value = /*item*/ ctx[4].name + "")) set_data_dev(t, t_value);

    			if (dirty & /*data*/ 1 && option_value_value !== (option_value_value = /*item*/ ctx[4].name)) {
    				prop_dev(option, "__value", option_value_value);
    			}

    			option.value = option.__value;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(option);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(88:22) {#each data as item }",
    		ctx
    	});

    	return block;
    }

    // (53:1) <Modal on:close="{() => showModal = false}">
    function create_default_slot(ctx) {
    	let t0;
    	let div14;
    	let form;
    	let div1;
    	let label0;
    	let t2;
    	let div0;
    	let input;
    	let t3;
    	let div4;
    	let label1;
    	let t5;
    	let div3;
    	let div2;
    	let select0;
    	let option0;
    	let option1;
    	let option2;
    	let option3;
    	let option4;
    	let t11;
    	let div7;
    	let label2;
    	let t13;
    	let div6;
    	let div5;
    	let select1;
    	let t14;
    	let div10;
    	let label3;
    	let t16;
    	let div9;
    	let div8;
    	let select2;
    	let option5;
    	let t18;
    	let br;
    	let t19;
    	let div13;
    	let div11;
    	let button0;
    	let t21;
    	let div12;
    	let button1;
    	let each_value = /*data*/ ctx[0];
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			t0 = space();
    			div14 = element("div");
    			form = element("form");
    			div1 = element("div");
    			label0 = element("label");
    			label0.textContent = "Tags";
    			t2 = space();
    			div0 = element("div");
    			input = element("input");
    			t3 = space();
    			div4 = element("div");
    			label1 = element("label");
    			label1.textContent = "Rating";
    			t5 = space();
    			div3 = element("div");
    			div2 = element("div");
    			select0 = element("select");
    			option0 = element("option");
    			option0.textContent = "Any";
    			option1 = element("option");
    			option1.textContent = ">4";
    			option2 = element("option");
    			option2.textContent = ">3";
    			option3 = element("option");
    			option3.textContent = ">2";
    			option4 = element("option");
    			option4.textContent = ">1";
    			t11 = space();
    			div7 = element("div");
    			label2 = element("label");
    			label2.textContent = "Language";
    			t13 = space();
    			div6 = element("div");
    			div5 = element("div");
    			select1 = element("select");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t14 = space();
    			div10 = element("div");
    			label3 = element("label");
    			label3.textContent = "Publication Year";
    			t16 = space();
    			div9 = element("div");
    			div8 = element("div");
    			select2 = element("select");
    			option5 = element("option");
    			option5.textContent = "Any";
    			t18 = space();
    			br = element("br");
    			t19 = space();
    			div13 = element("div");
    			div11 = element("div");
    			button0 = element("button");
    			button0.textContent = "Submit";
    			t21 = space();
    			div12 = element("div");
    			button1 = element("button");
    			button1.textContent = "Cancel";
    			attr_dev(label0, "class", "label");
    			add_location(label0, file$1, 61, 16, 1306);
    			attr_dev(input, "class", "input");
    			attr_dev(input, "type", "text");
    			attr_dev(input, "placeholder", "Enter tag names for your search");
    			attr_dev(input, "id", "tags");
    			attr_dev(input, "name", "tags");
    			add_location(input, file$1, 63, 18, 1396);
    			attr_dev(div0, "class", "control");
    			add_location(div0, file$1, 62, 16, 1356);
    			attr_dev(div1, "class", "field");
    			add_location(div1, file$1, 60, 12, 1270);
    			attr_dev(label1, "class", "label");
    			add_location(label1, file$1, 68, 16, 1607);
    			option0.__value = "Any";
    			option0.value = option0.__value;
    			add_location(option0, file$1, 72, 22, 1785);
    			option1.__value = ">4";
    			option1.value = option1.__value;
    			add_location(option1, file$1, 73, 22, 1828);
    			option2.__value = ">3";
    			option2.value = option2.__value;
    			add_location(option2, file$1, 74, 22, 1870);
    			option3.__value = ">2";
    			option3.value = option3.__value;
    			add_location(option3, file$1, 75, 22, 1912);
    			option4.__value = ">1";
    			option4.value = option4.__value;
    			add_location(option4, file$1, 76, 22, 1954);
    			attr_dev(select0, "name", "rating");
    			add_location(select0, file$1, 71, 20, 1740);
    			attr_dev(div2, "class", "select");
    			add_location(div2, file$1, 70, 18, 1699);
    			attr_dev(div3, "class", "control");
    			add_location(div3, file$1, 69, 16, 1659);
    			attr_dev(div4, "class", "field");
    			add_location(div4, file$1, 67, 14, 1571);
    			attr_dev(label2, "class", "label");
    			add_location(label2, file$1, 83, 16, 2124);
    			attr_dev(select1, "name", "language");
    			add_location(select1, file$1, 86, 20, 2271);
    			attr_dev(div5, "class", "select is-multiple");
    			add_location(div5, file$1, 85, 18, 2218);
    			attr_dev(div6, "class", "control");
    			add_location(div6, file$1, 84, 16, 2178);
    			attr_dev(div7, "class", "field");
    			add_location(div7, file$1, 82, 14, 2088);
    			attr_dev(label3, "class", "label");
    			add_location(label3, file$1, 96, 16, 2573);
    			option5.__value = "Any";
    			option5.value = option5.__value;
    			add_location(option5, file$1, 100, 22, 2771);
    			attr_dev(select2, "name", "year");
    			add_location(select2, file$1, 99, 20, 2728);
    			attr_dev(div8, "class", "select is-multiple");
    			add_location(div8, file$1, 98, 18, 2675);
    			attr_dev(div9, "class", "control");
    			add_location(div9, file$1, 97, 16, 2635);
    			attr_dev(div10, "class", "field");
    			add_location(div10, file$1, 95, 14, 2537);
    			add_location(br, file$1, 105, 14, 2905);
    			attr_dev(button0, "class", "button is-link");
    			add_location(button0, file$1, 109, 18, 3026);
    			attr_dev(div11, "class", "control");
    			add_location(div11, file$1, 108, 16, 2986);
    			attr_dev(button1, "class", "button is-link is-light");
    			add_location(button1, file$1, 112, 18, 3152);
    			attr_dev(div12, "class", "control");
    			add_location(div12, file$1, 111, 16, 3112);
    			attr_dev(div13, "class", "field is-grouped");
    			add_location(div13, file$1, 107, 14, 2939);
    			attr_dev(form, "action", "");
    			attr_dev(form, "method", "POST");
    			add_location(form, file$1, 59, 11, 1227);
    			attr_dev(div14, "class", "content svelte-1cv1yew");
    			add_location(div14, file$1, 58, 8, 1194);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div14, anchor);
    			append_dev(div14, form);
    			append_dev(form, div1);
    			append_dev(div1, label0);
    			append_dev(div1, t2);
    			append_dev(div1, div0);
    			append_dev(div0, input);
    			append_dev(form, t3);
    			append_dev(form, div4);
    			append_dev(div4, label1);
    			append_dev(div4, t5);
    			append_dev(div4, div3);
    			append_dev(div3, div2);
    			append_dev(div2, select0);
    			append_dev(select0, option0);
    			append_dev(select0, option1);
    			append_dev(select0, option2);
    			append_dev(select0, option3);
    			append_dev(select0, option4);
    			append_dev(form, t11);
    			append_dev(form, div7);
    			append_dev(div7, label2);
    			append_dev(div7, t13);
    			append_dev(div7, div6);
    			append_dev(div6, div5);
    			append_dev(div5, select1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(select1, null);
    			}

    			append_dev(form, t14);
    			append_dev(form, div10);
    			append_dev(div10, label3);
    			append_dev(div10, t16);
    			append_dev(div10, div9);
    			append_dev(div9, div8);
    			append_dev(div8, select2);
    			append_dev(select2, option5);
    			append_dev(form, t18);
    			append_dev(form, br);
    			append_dev(form, t19);
    			append_dev(form, div13);
    			append_dev(div13, div11);
    			append_dev(div11, button0);
    			append_dev(div13, t21);
    			append_dev(div13, div12);
    			append_dev(div12, button1);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*data*/ 1) {
    				each_value = /*data*/ ctx[0];
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(select1, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div14);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(53:1) <Modal on:close=\\\"{() => showModal = false}\\\">",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let section;
    	let div1;
    	let div0;
    	let h1;
    	let t1;
    	let h2;
    	let t3;
    	let div4;
    	let div2;
    	let button0;
    	let t5;
    	let br;
    	let t6;
    	let div3;
    	let button1;
    	let t8;
    	let if_block_anchor;
    	let current;
    	let dispose;
    	let if_block = /*showModal*/ ctx[1] && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			section = element("section");
    			div1 = element("div");
    			div0 = element("div");
    			h1 = element("h1");
    			h1.textContent = "Reading List Recommendations";
    			t1 = space();
    			h2 = element("h2");
    			h2.textContent = "Get customised book recommendations";
    			t3 = space();
    			div4 = element("div");
    			div2 = element("div");
    			button0 = element("button");
    			button0.textContent = "Book Recommendations";
    			t5 = space();
    			br = element("br");
    			t6 = space();
    			div3 = element("div");
    			button1 = element("button");
    			button1.textContent = "Get Information";
    			t8 = space();
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    			attr_dev(h1, "class", "title");
    			add_location(h1, file$1, 30, 2, 566);
    			attr_dev(h2, "class", "subtitle");
    			add_location(h2, file$1, 33, 2, 628);
    			attr_dev(div0, "class", "container");
    			add_location(div0, file$1, 29, 3, 540);
    			attr_dev(div1, "class", "hero-body");
    			add_location(div1, file$1, 28, 1, 513);
    			attr_dev(section, "class", "hero is-link is-bold");
    			add_location(section, file$1, 27, 0, 473);
    			attr_dev(button0, "class", "button is-hovered is-link is-light");
    			add_location(button0, file$1, 43, 2, 778);
    			attr_dev(div2, "class", "options svelte-1cv1yew");
    			add_location(div2, file$1, 42, 1, 754);
    			add_location(br, file$1, 45, 1, 903);
    			attr_dev(button1, "class", "button is-hovered is-link is-light");
    			add_location(button1, file$1, 47, 2, 933);
    			attr_dev(div3, "class", "options svelte-1cv1yew");
    			add_location(div3, file$1, 46, 1, 909);
    			attr_dev(div4, "class", "content svelte-1cv1yew");
    			add_location(div4, file$1, 41, 0, 731);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);
    			append_dev(section, div1);
    			append_dev(div1, div0);
    			append_dev(div0, h1);
    			append_dev(div0, t1);
    			append_dev(div0, h2);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, div4, anchor);
    			append_dev(div4, div2);
    			append_dev(div2, button0);
    			append_dev(div4, t5);
    			append_dev(div4, br);
    			append_dev(div4, t6);
    			append_dev(div4, div3);
    			append_dev(div3, button1);
    			insert_dev(target, t8, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    			dispose = listen_dev(button0, "click", /*click_handler*/ ctx[2], false, false, false);
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*showModal*/ ctx[1]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    					transition_in(if_block, 1);
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(section);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(div4);
    			if (detaching) detach_dev(t8);
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    			dispose();
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

    const apiURL = "http://localhost:5000/student";

    function instance$1($$self, $$props, $$invalidate) {
    	let data = [];

    	onMount(async function () {
    		const response = await fetch(apiURL);
    		$$invalidate(0, data = await response.json());
    	});

    	let showModal = false;
    	const click_handler = () => $$invalidate(1, showModal = true);
    	const close_handler = () => $$invalidate(1, showModal = false);

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ("data" in $$props) $$invalidate(0, data = $$props.data);
    		if ("showModal" in $$props) $$invalidate(1, showModal = $$props.showModal);
    	};

    	return [data, showModal, click_handler, close_handler];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    var app = new App({
    	target: document.body
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map