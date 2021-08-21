
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    const identity = x => x;
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
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
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
            if ($$scope.dirty === undefined) {
                return lets;
            }
            if (typeof lets === 'object') {
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
    function update_slot(slot, slot_definition, ctx, $$scope, dirty, get_slot_changes_fn, get_slot_context_fn) {
        const slot_changes = get_slot_changes(slot_definition, $$scope, dirty, get_slot_changes_fn);
        if (slot_changes) {
            const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
            slot.p(slot_context, slot_changes);
        }
    }

    const is_client = typeof window !== 'undefined';
    let now = is_client
        ? () => window.performance.now()
        : () => Date.now();
    let raf = is_client ? cb => requestAnimationFrame(cb) : noop;

    const tasks = new Set();
    function run_tasks(now) {
        tasks.forEach(task => {
            if (!task.c(now)) {
                tasks.delete(task);
                task.f();
            }
        });
        if (tasks.size !== 0)
            raf(run_tasks);
    }
    /**
     * Creates a new task that runs on each raf frame
     * until it returns a falsy value or is aborted
     */
    function loop(callback) {
        let task;
        if (tasks.size === 0)
            raf(run_tasks);
        return {
            promise: new Promise(fulfill => {
                tasks.add(task = { c: callback, f: fulfill });
            }),
            abort() {
                tasks.delete(task);
            }
        };
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
    function svg_element(name) {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
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
    function stop_propagation(fn) {
        return function (event) {
            event.stopPropagation();
            // @ts-ignore
            return fn.call(this, event);
        };
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
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    const active_docs = new Set();
    let active = 0;
    // https://github.com/darkskyapp/string-hash/blob/master/index.js
    function hash(str) {
        let hash = 5381;
        let i = str.length;
        while (i--)
            hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
        return hash >>> 0;
    }
    function create_rule(node, a, b, duration, delay, ease, fn, uid = 0) {
        const step = 16.666 / duration;
        let keyframes = '{\n';
        for (let p = 0; p <= 1; p += step) {
            const t = a + (b - a) * ease(p);
            keyframes += p * 100 + `%{${fn(t, 1 - t)}}\n`;
        }
        const rule = keyframes + `100% {${fn(b, 1 - b)}}\n}`;
        const name = `__svelte_${hash(rule)}_${uid}`;
        const doc = node.ownerDocument;
        active_docs.add(doc);
        const stylesheet = doc.__svelte_stylesheet || (doc.__svelte_stylesheet = doc.head.appendChild(element('style')).sheet);
        const current_rules = doc.__svelte_rules || (doc.__svelte_rules = {});
        if (!current_rules[name]) {
            current_rules[name] = true;
            stylesheet.insertRule(`@keyframes ${name} ${rule}`, stylesheet.cssRules.length);
        }
        const animation = node.style.animation || '';
        node.style.animation = `${animation ? `${animation}, ` : ''}${name} ${duration}ms linear ${delay}ms 1 both`;
        active += 1;
        return name;
    }
    function delete_rule(node, name) {
        const previous = (node.style.animation || '').split(', ');
        const next = previous.filter(name
            ? anim => anim.indexOf(name) < 0 // remove specific animation
            : anim => anim.indexOf('__svelte') === -1 // remove all Svelte animations
        );
        const deleted = previous.length - next.length;
        if (deleted) {
            node.style.animation = next.join(', ');
            active -= deleted;
            if (!active)
                clear_rules();
        }
    }
    function clear_rules() {
        raf(() => {
            if (active)
                return;
            active_docs.forEach(doc => {
                const stylesheet = doc.__svelte_stylesheet;
                let i = stylesheet.cssRules.length;
                while (i--)
                    stylesheet.deleteRule(i);
                doc.__svelte_rules = {};
            });
            active_docs.clear();
        });
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function setContext(key, context) {
        get_current_component().$$.context.set(key, context);
    }
    function getContext(key) {
        return get_current_component().$$.context.get(key);
    }
    // TODO figure out if we still want to support
    // shorthand events, or if we want to implement
    // a real bubbling mechanism
    function bubble(component, event) {
        const callbacks = component.$$.callbacks[event.type];
        if (callbacks) {
            callbacks.slice().forEach(fn => fn(event));
        }
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
            set_current_component(null);
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

    let promise;
    function wait() {
        if (!promise) {
            promise = Promise.resolve();
            promise.then(() => {
                promise = null;
            });
        }
        return promise;
    }
    function dispatch(node, direction, kind) {
        node.dispatchEvent(custom_event(`${direction ? 'intro' : 'outro'}${kind}`));
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
    const null_transition = { duration: 0 };
    function create_bidirectional_transition(node, fn, params, intro) {
        let config = fn(node, params);
        let t = intro ? 0 : 1;
        let running_program = null;
        let pending_program = null;
        let animation_name = null;
        function clear_animation() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function init(program, duration) {
            const d = program.b - t;
            duration *= Math.abs(d);
            return {
                a: t,
                b: program.b,
                d,
                duration,
                start: program.start,
                end: program.start + duration,
                group: program.group
            };
        }
        function go(b) {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            const program = {
                start: now() + delay,
                b
            };
            if (!b) {
                // @ts-ignore todo: improve typings
                program.group = outros;
                outros.r += 1;
            }
            if (running_program || pending_program) {
                pending_program = program;
            }
            else {
                // if this is an intro, and there's a delay, we need to do
                // an initial tick and/or apply CSS animation immediately
                if (css) {
                    clear_animation();
                    animation_name = create_rule(node, t, b, duration, delay, easing, css);
                }
                if (b)
                    tick(0, 1);
                running_program = init(program, duration);
                add_render_callback(() => dispatch(node, b, 'start'));
                loop(now => {
                    if (pending_program && now > pending_program.start) {
                        running_program = init(pending_program, duration);
                        pending_program = null;
                        dispatch(node, running_program.b, 'start');
                        if (css) {
                            clear_animation();
                            animation_name = create_rule(node, t, running_program.b, running_program.duration, 0, easing, config.css);
                        }
                    }
                    if (running_program) {
                        if (now >= running_program.end) {
                            tick(t = running_program.b, 1 - t);
                            dispatch(node, running_program.b, 'end');
                            if (!pending_program) {
                                // we're done
                                if (running_program.b) {
                                    // intro — we can tidy up immediately
                                    clear_animation();
                                }
                                else {
                                    // outro — needs to be coordinated
                                    if (!--running_program.group.r)
                                        run_all(running_program.group.c);
                                }
                            }
                            running_program = null;
                        }
                        else if (now >= running_program.start) {
                            const p = now - running_program.start;
                            t = running_program.a + running_program.d * easing(p / running_program.duration);
                            tick(t, 1 - t);
                        }
                    }
                    return !!(running_program || pending_program);
                });
            }
        }
        return {
            run(b) {
                if (is_function(config)) {
                    wait().then(() => {
                        // @ts-ignore
                        config = config();
                        go(b);
                    });
                }
                else {
                    go(b);
                }
            },
            end() {
                clear_animation();
                running_program = pending_program = null;
            }
        };
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
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
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
        }
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
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : options.context || []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
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
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
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
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.38.2' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
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
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    function fade(node, { delay = 0, duration = 400, easing = identity } = {}) {
        const o = +getComputedStyle(node).opacity;
        return {
            delay,
            duration,
            easing,
            css: t => `opacity: ${t * o}`
        };
    }

    /* SvelteComponents\Overlay.svelte generated by Svelte v3.38.2 */

    const file$5 = "SvelteComponents\\Overlay.svelte";

    // (13:0) {#if shown}
    function create_if_block$2(ctx) {
    	let div1;
    	let div0;
    	let div0_style_value;
    	let current;
    	let mounted;
    	let dispose;
    	const default_slot_template = /*#slots*/ ctx[5].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[4], null);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			if (default_slot) default_slot.c();
    			attr_dev(div0, "class", "container svelte-1v4unt7");
    			attr_dev(div0, "style", div0_style_value = "width: " + /*width*/ ctx[2] + "%");
    			add_location(div0, file$5, 19, 8, 425);
    			attr_dev(div1, "class", "overlay svelte-1v4unt7");
    			toggle_class(div1, "closable", /*closable*/ ctx[1]);
    			add_location(div1, file$5, 13, 4, 280);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);

    			if (default_slot) {
    				default_slot.m(div0, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(div0, "click", stop_propagation(/*click_handler*/ ctx[6]), false, false, true),
    					listen_dev(div1, "click", /*click_handler_1*/ ctx[7], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 16)) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[4], dirty, null, null);
    				}
    			}

    			if (!current || dirty & /*width*/ 4 && div0_style_value !== (div0_style_value = "width: " + /*width*/ ctx[2] + "%")) {
    				attr_dev(div0, "style", div0_style_value);
    			}

    			if (dirty & /*closable*/ 2) {
    				toggle_class(div1, "closable", /*closable*/ ctx[1]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if (default_slot) default_slot.d(detaching);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(13:0) {#if shown}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let if_block_anchor;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block = /*shown*/ ctx[0] && create_if_block$2(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(window, "keydown", /*handleKeydown*/ ctx[3], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*shown*/ ctx[0]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*shown*/ 1) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$2(ctx);
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
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    			mounted = false;
    			dispose();
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
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Overlay", slots, ['default']);
    	let { shown = false } = $$props;
    	let { closable = true } = $$props;
    	let { width = 50 } = $$props;

    	function handleKeydown(e) {
    		if (closable && e.keyCode === 27) $$invalidate(0, shown = false);
    	}

    	const writable_props = ["shown", "closable", "width"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Overlay> was created with unknown prop '${key}'`);
    	});

    	function click_handler(event) {
    		bubble($$self, event);
    	}

    	const click_handler_1 = () => {
    		if (closable) $$invalidate(0, shown = false);
    	};

    	$$self.$$set = $$props => {
    		if ("shown" in $$props) $$invalidate(0, shown = $$props.shown);
    		if ("closable" in $$props) $$invalidate(1, closable = $$props.closable);
    		if ("width" in $$props) $$invalidate(2, width = $$props.width);
    		if ("$$scope" in $$props) $$invalidate(4, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({ shown, closable, width, handleKeydown });

    	$$self.$inject_state = $$props => {
    		if ("shown" in $$props) $$invalidate(0, shown = $$props.shown);
    		if ("closable" in $$props) $$invalidate(1, closable = $$props.closable);
    		if ("width" in $$props) $$invalidate(2, width = $$props.width);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		shown,
    		closable,
    		width,
    		handleKeydown,
    		$$scope,
    		slots,
    		click_handler,
    		click_handler_1
    	];
    }

    class Overlay extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, { shown: 0, closable: 1, width: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Overlay",
    			options,
    			id: create_fragment$5.name
    		});
    	}

    	get shown() {
    		throw new Error("<Overlay>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set shown(value) {
    		throw new Error("<Overlay>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get closable() {
    		throw new Error("<Overlay>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set closable(value) {
    		throw new Error("<Overlay>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get width() {
    		throw new Error("<Overlay>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set width(value) {
    		throw new Error("<Overlay>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

    function createCommonjsModule(fn) {
      var module = { exports: {} };
    	return fn(module, module.exports), module.exports;
    }

    var gauge_min = createCommonjsModule(function (module) {
    !function(e){var t,o,F,S,n=(o=(t=e).document,F=Array.prototype.slice,S=t.requestAnimationFrame||t.mozRequestAnimationFrame||t.webkitRequestAnimationFrame||t.msRequestAnimationFrame||function(e){return setTimeout(e,1e3/60)},function(){var r="http://www.w3.org/2000/svg",M={centerX:50,centerY:50},k={dialRadius:40,dialStartAngle:135,dialEndAngle:45,value:0,max:100,min:0,valueDialClass:"value",valueClass:"value-text",dialClass:"dial",gaugeClass:"gauge",showValue:!0,gaugeColor:null,label:function(e){return Math.round(e)}};function V(e,t,n){var a=o.createElementNS(r,e);for(var i in t)a.setAttribute(i,t[i]);return n&&n.forEach(function(e){a.appendChild(e);}),a}function R(e,t){return e*t/100}function E(e,t,n){var a=Number(e);return n<a?n:a<t?t:a}function q(e,t,n,a){var i=a*Math.PI/180;return {x:Math.round(1e3*(e+n*Math.cos(i)))/1e3,y:Math.round(1e3*(t+n*Math.sin(i)))/1e3}}return function(e,r){r=function(){var n=arguments[0];return F.call(arguments,1).forEach(function(e){for(var t in e)e.hasOwnProperty(t)&&(n[t]=e[t]);}),n}({},k,r);var o,l,t,n=e,s=r.max,u=r.min,a=E(r.value,u,s),c=r.dialRadius,d=r.showValue,f=r.dialStartAngle,v=r.dialEndAngle,i=r.valueDialClass,m=r.valueClass,g=(r.valueLabelClass,r.dialClass),h=r.gaugeClass,p=r.color,w=r.label,x=r.viewBox;if(f<v){console.log("WARN! startAngle < endAngle, Swapping");var A=f;f=v,v=A;}function y(e,t,n,a){var i=function(e,t,n){var a=M.centerX,i=M.centerY;return {end:q(a,i,e,n),start:q(a,i,e,t)}}(e,t,n),r=i.start,o=i.end,l=void 0===a?1:a;return ["M",r.x,r.y,"A",e,e,0,l,1,o.x,o.y].join(" ")}function b(e,t){var n=function(e,t,n){return 100*(e-t)/(n-t)}(e,u,s),a=R(n,360-Math.abs(f-v)),i=a<=180?0:1;d&&(o.textContent=w.call(r,e)),l.setAttribute("d",y(c,f,a+f,i));}function C(e,t){var n=p.call(r,e),a=1e3*t,i="stroke "+a+"ms ease";l.style.stroke=n,l.style["-webkit-transition"]=i,l.style["-moz-transition"]=i,l.style.transition=i;}return t={setMaxValue:function(e){s=e;},setValue:function(e){a=E(e,u,s),p&&C(a,0),b(a);},setValueAnimated:function(e,t){var n=a;a=E(e,u,s),n!==a&&(p&&C(a,t),function(e){var t=e.duration,a=1,i=60*t,r=e.start||0,o=e.end-r,l=e.step,s=e.easing||function(e){return (e/=.5)<1?.5*Math.pow(e,3):.5*(Math.pow(e-2,3)+2)};S(function e(){var t=a/i,n=o*s(t)+r;l(n,a),a+=1,t<1&&S(e);});}({start:n||0,end:a,duration:t||1,step:function(e,t){b(e);}}));},getValue:function(){return a}},function(e){o=V("text",{x:50,y:50,fill:"#999",class:m,"font-size":"100%","font-family":"comfortaa","font-weight":"normal","text-anchor":"middle","alignment-baseline":"middle","dominant-baseline":"central"}),l=V("path",{class:i,fill:"none",stroke:"#666","stroke-width":2.5,d:y(c,f,f)});var t=R(100,360-Math.abs(f-v)),n=V("svg",{viewBox:x||"0 0 100 100",class:h},[V("path",{class:g,fill:"none",stroke:"#eee","stroke-width":2,d:y(c,f,v,t<=180?0:1)}),V("g",{class:"text-container"},[o]),l]);e.appendChild(n);}(n),t.setValue(a),t}}());module.exports?module.exports=n:e.Gauge=n;}("undefined"==typeof window?commonjsGlobal:window);
    });

    function getColor(voltage, max = 4.15, min = 3.2) {
        const start = "#ff5000", end = "#00ff00";
        // from 3.2 to 4.15
        let factor = (voltage - min) / (max - min);
        return r2h(interpolateHSL(h2r(start), h2r(end), factor));
    }

    // Converts a #ffffff hex string into an [r,g,b] array
    var h2r = function (hex) {
        var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? [
            parseInt(result[1], 16),
            parseInt(result[2], 16),
            parseInt(result[3], 16)
        ] : null;
    };

    // Inverse of the above
    var r2h = function (rgb) {
        return "#" + ((1 << 24) + (rgb[0] << 16) + (rgb[1] << 8) + rgb[2]).toString(16).slice(1);
    };

    var rgb2hsl = function (color) {
        var r = color[0] / 255;
        var g = color[1] / 255;
        var b = color[2] / 255;

        var max = Math.max(r, g, b), min = Math.min(r, g, b);
        var h, s, l = (max + min) / 2;

        if (max == min) {
            h = s = 0; // achromatic
        } else {
            var d = max - min;
            s = (l > 0.5 ? d / (2 - max - min) : d / (max + min));
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }

        return [h, s, l];
    };

    var hsl2rgb = function (color) {
        var l = color[2];

        if (color[1] == 0) {
            l = Math.round(l * 255);
            return [l, l, l];
        } else {
            function hue2rgb(p, q, t) {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1 / 6) return p + (q - p) * 6 * t;
                if (t < 1 / 2) return q;
                if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
                return p;
            }

            var s = color[1];
            var q = (l < 0.5 ? l * (1 + s) : l + s - l * s);
            var p = 2 * l - q;
            var r = hue2rgb(p, q, color[0] + 1 / 3);
            var g = hue2rgb(p, q, color[0]);
            var b = hue2rgb(p, q, color[0] - 1 / 3);
            return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
        }
    };

    var interpolateHSL = function (color1, color2, factor) {
        if (arguments.length < 3) { factor = 0.5; }
        var hsl1 = rgb2hsl(color1);
        var hsl2 = rgb2hsl(color2);
        for (var i = 0; i < 3; i++) {
            hsl1[i] += factor * (hsl2[i] - hsl1[i]);
        }
        return hsl2rgb(hsl1);
    };

    /* SvelteComponents\Gauge.svelte generated by Svelte v3.38.2 */
    const file$4 = "SvelteComponents\\Gauge.svelte";

    function create_fragment$4(ctx) {
    	let div;
    	let t0;
    	let t1;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t0 = space();
    			t1 = text(/*name*/ ctx[0]);
    			attr_dev(div, "class", "gauge-container svelte-e9fljk");
    			add_location(div, file$4, 29, 0, 927);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			/*div_binding*/ ctx[7](div);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, t1, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*name*/ 1) set_data_dev(t1, /*name*/ ctx[0]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			/*div_binding*/ ctx[7](null);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(t1);
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

    function instance$4($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Gauge", slots, []);
    	let { name = "No name given" } = $$props;
    	let { bounds = [0, 10] } = $$props;
    	let { colorBounds = bounds } = $$props;
    	let { value = bounds[0] } = $$props;
    	let { digits = 3 - (bounds[1] + "").split(".")[0].length } = $$props;
    	let gaugeElement;
    	let gaugeObject;

    	onMount(() => {
    		$$invalidate(6, gaugeObject = gauge_min(gaugeElement, {
    			max: bounds[1],
    			min: bounds[0],
    			label(value) {
    				return value.toFixed(digits);
    			},
    			color(value) {
    				return getColor(value, colorBounds[1], colorBounds[0]);
    			}
    		}));

    		if (value) gaugeObject.setValue(value);
    	});

    	const writable_props = ["name", "bounds", "colorBounds", "value", "digits"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Gauge> was created with unknown prop '${key}'`);
    	});

    	function div_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			gaugeElement = $$value;
    			$$invalidate(1, gaugeElement);
    		});
    	}

    	$$self.$$set = $$props => {
    		if ("name" in $$props) $$invalidate(0, name = $$props.name);
    		if ("bounds" in $$props) $$invalidate(2, bounds = $$props.bounds);
    		if ("colorBounds" in $$props) $$invalidate(3, colorBounds = $$props.colorBounds);
    		if ("value" in $$props) $$invalidate(4, value = $$props.value);
    		if ("digits" in $$props) $$invalidate(5, digits = $$props.digits);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		Gauge: gauge_min,
    		getColor,
    		name,
    		bounds,
    		colorBounds,
    		value,
    		digits,
    		gaugeElement,
    		gaugeObject
    	});

    	$$self.$inject_state = $$props => {
    		if ("name" in $$props) $$invalidate(0, name = $$props.name);
    		if ("bounds" in $$props) $$invalidate(2, bounds = $$props.bounds);
    		if ("colorBounds" in $$props) $$invalidate(3, colorBounds = $$props.colorBounds);
    		if ("value" in $$props) $$invalidate(4, value = $$props.value);
    		if ("digits" in $$props) $$invalidate(5, digits = $$props.digits);
    		if ("gaugeElement" in $$props) $$invalidate(1, gaugeElement = $$props.gaugeElement);
    		if ("gaugeObject" in $$props) $$invalidate(6, gaugeObject = $$props.gaugeObject);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*gaugeObject, value*/ 80) {
    			if (gaugeObject && value) gaugeObject.setValueAnimated(value);
    		}
    	};

    	return [
    		name,
    		gaugeElement,
    		bounds,
    		colorBounds,
    		value,
    		digits,
    		gaugeObject,
    		div_binding
    	];
    }

    class Gauge_1 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {
    			name: 0,
    			bounds: 2,
    			colorBounds: 3,
    			value: 4,
    			digits: 5
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Gauge_1",
    			options,
    			id: create_fragment$4.name
    		});
    	}

    	get name() {
    		throw new Error("<Gauge>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set name(value) {
    		throw new Error("<Gauge>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get bounds() {
    		throw new Error("<Gauge>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set bounds(value) {
    		throw new Error("<Gauge>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get colorBounds() {
    		throw new Error("<Gauge>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set colorBounds(value) {
    		throw new Error("<Gauge>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get value() {
    		throw new Error("<Gauge>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set value(value) {
    		throw new Error("<Gauge>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get digits() {
    		throw new Error("<Gauge>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set digits(value) {
    		throw new Error("<Gauge>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* SvelteComponents\TempGauge.svelte generated by Svelte v3.38.2 */

    const { console: console_1$1 } = globals;
    const file$3 = "SvelteComponents\\TempGauge.svelte";

    function create_fragment$3(ctx) {
    	let svg;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			attr_dev(svg, "viewBox", "0 0 400 200");
    			set_style(svg, "width", "100%");
    			set_style(svg, "height", "20%");
    			add_location(svg, file$3, 179, 0, 4986);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			/*svg_binding*/ ctx[2](svg);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    			/*svg_binding*/ ctx[2](null);
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

    const centerX = 200;
    const centerY = 180;

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("TempGauge", slots, []);
    	let { data } = $$props;
    	let element;
    	let object;
    	let Q0Q4;
    	let Q1Q3;
    	let text;
    	let ptFrmVal;
    	let width = 0.7;
    	let radius = 0.72;

    	function update() {
    		const animationDuration = getContext("animationDuration");
    		if (!data || !Q0Q4 || !Q1Q3) return;

    		const sorted = data.sort(function (a, b) {
    			return a - b;
    		});

    		const Q0 = sorted[0];
    		const Q1 = sorted[Math.round(data.length / 4)];
    		const Q3 = sorted[Math.round(3 * data.length / 4)];
    		const Q4 = sorted.last();
    		console.log(sorted);

    		Q0Q4.animate(
    			{
    				d: [
    					"M",
    					ptFrmVal(Q0),
    					"A",
    					centerX * radius,
    					centerX * radius,
    					0,
    					0,
    					1,
    					ptFrmVal(Q4)
    				].join(" ")
    			},
    			animationDuration * 1000,
    			mina.easeinout
    		);

    		Q1Q3.animate(
    			{
    				d: [
    					"M",
    					ptFrmVal(Q1),
    					"A",
    					centerX * radius,
    					centerX * radius,
    					0,
    					0,
    					1,
    					ptFrmVal(Q3)
    				].join(" ")
    			},
    			animationDuration * 1000,
    			mina.easeinout
    		);

    		text.attr({
    			text: "Min: " + Q0.toFixed(0) + " Max: " + Q4.toFixed(0)
    		});
    	}

    	onMount(() => {
    		object = Snap(element);

    		let marker = object.line(5, 4, 5, 6).attr({
    			stroke: "#FF5733",
    			strokeLinecap: "round",
    			strokeWidth: 0.75
    		}).marker(4, 2, 6, 8, 5, 5);

    		// The main arc
    		const background = object.path([
    			"M",
    			centerX * (1 - width),
    			centerY,
    			"A",
    			centerX * radius,
    			centerX * radius,
    			0,
    			1,
    			1,
    			centerX * (1 + width),
    			centerY
    		].join(" ")).attr({
    			stroke: "#566675",
    			strokeWidth: 9,
    			strokeLinecap: "round",
    			fill: "rgba(0, 0, 0, 0.267)"
    		});

    		ptFrmVal = function (value) {
    			value = Math.clamp(value, 10, 50);
    			const totalLen = background.getTotalLength();
    			const len = totalLen * (value - 10) / 50;
    			let pt = background.getPointAtLength(len);
    			return pt.x + " " + pt.y;
    		};

    		//The max to min arc
    		Q0Q4 = object.path([
    			"M",
    			ptFrmVal(10),
    			"A",
    			centerX * radius,
    			centerX * radius,
    			0,
    			0,
    			1,
    			ptFrmVal(13)
    		].join(" ")).attr({
    			stroke: "#FF5733",
    			// strokeLinecap: "round",
    			strokeWidth: 15,
    			fill: "none",
    			"marker-start": marker,
    			"marker-end": marker
    		});

    		//The Q1 to Q3 arc
    		//The max to min arc
    		Q1Q3 = object.path([
    			"M",
    			ptFrmVal(11),
    			"A",
    			centerX * radius,
    			centerX * radius,
    			0,
    			0,
    			1,
    			ptFrmVal(12)
    		].join(" ")).attr({
    			stroke: "#FFC300",
    			strokeWidth: 25,
    			fill: "none"
    		});

    		text = object.text(centerX, centerY - 50, "Min: 00 Max: 00").attr({ fontWeight: "bolder", fontSize: "23px" });

    		text.attr({
    			x: centerX - text.node.getBBox().width / 2
    		});

    		object.text(centerX * (1 - 0.85 * width), centerY - 10, "10").attr({
    			fontWeight: "bolder",
    			fontSize: "30px",
    			fill: "#566675"
    		});

    		object.text(centerX * (1 + 0.7 * width), centerY - 10, "50").attr({
    			fontWeight: "bolder",
    			fontSize: "30px",
    			fill: "#566675"
    		});
    	});

    	const writable_props = ["data"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$1.warn(`<TempGauge> was created with unknown prop '${key}'`);
    	});

    	function svg_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			element = $$value;
    			$$invalidate(0, element);
    		});
    	}

    	$$self.$$set = $$props => {
    		if ("data" in $$props) $$invalidate(1, data = $$props.data);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		getContext,
    		data,
    		element,
    		object,
    		Q0Q4,
    		Q1Q3,
    		text,
    		centerX,
    		centerY,
    		ptFrmVal,
    		width,
    		radius,
    		update
    	});

    	$$self.$inject_state = $$props => {
    		if ("data" in $$props) $$invalidate(1, data = $$props.data);
    		if ("element" in $$props) $$invalidate(0, element = $$props.element);
    		if ("object" in $$props) object = $$props.object;
    		if ("Q0Q4" in $$props) Q0Q4 = $$props.Q0Q4;
    		if ("Q1Q3" in $$props) Q1Q3 = $$props.Q1Q3;
    		if ("text" in $$props) text = $$props.text;
    		if ("ptFrmVal" in $$props) ptFrmVal = $$props.ptFrmVal;
    		if ("width" in $$props) width = $$props.width;
    		if ("radius" in $$props) radius = $$props.radius;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*data*/ 2) {
    			update();
    		}
    	};

    	return [element, data, svg_binding];
    }

    class TempGauge extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { data: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "TempGauge",
    			options,
    			id: create_fragment$3.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*data*/ ctx[1] === undefined && !("data" in props)) {
    			console_1$1.warn("<TempGauge> was created without expected prop 'data'");
    		}
    	}

    	get data() {
    		throw new Error("<TempGauge>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set data(value) {
    		throw new Error("<TempGauge>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* SvelteComponents\Graph.svelte generated by Svelte v3.38.2 */
    const file$2 = "SvelteComponents\\Graph.svelte";

    function create_fragment$2(ctx) {
    	let div;
    	let svg;

    	const block = {
    		c: function create() {
    			div = element("div");
    			svg = svg_element("svg");
    			attr_dev(svg, "class", "voltages svelte-1hj7nhu");
    			attr_dev(svg, "viewBox", "0 0 400 100");
    			add_location(svg, file$2, 70, 4, 2047);
    			attr_dev(div, "class", "container svelte-1hj7nhu");
    			add_location(div, file$2, 69, 0, 2018);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, svg);
    			/*svg_binding*/ ctx[3](svg);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			/*svg_binding*/ ctx[3](null);
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

    function getPathString(data, minY, maxY) {
    	let ret = "";
    	let i = 0;

    	data.forEach(e => {
    		// -25 = 90,  125 = 60
    		ret += i + "," + Math.map(minY, maxY, 125, -25, e).toFixed(1) + ",";

    		i += 10;
    	});

    	return ret.slice(0, -1);
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Graph", slots, []);
    	let { axisSettings } = $$props;
    	let { datas } = $$props;
    	let element;
    	let objects = [];

    	onMount(() => {
    		const s = Snap(element);

    		for (const line of axisSettings) {
    			objects.push([
    				s.polyline([10, 10]).attr({
    					fill: "none",
    					stroke: line.color,
    					strokeWidth: "5"
    				}),
    				s.text(line.axis, -19, "- " + line.units),
    				s.text(line.axis, 132, "- " + line.units)
    			]);
    		}
    	});

    	function update() {
    		for (let i = 0; i < objects.length; i++) {
    			$$invalidate(1, datas[i] = datas[i].slice(Math.max(datas[i].length - axisSettings[i].maxPoints, 0)), datas);

    			let maxY = datas[i].reduce(function (a, b) {
    				return Math.max(a, b);
    			});

    			let minY = axisSettings[i].minIs0
    			? 0
    			: datas[i].reduce(function (a, b) {
    					return Math.min(a, b);
    				});

    			maxY += Math.max(1, 0.2 * (maxY - minY));

    			minY -= axisSettings[i].minIs0
    			? 0
    			: Math.max(1, 0.2 * (maxY - minY));

    			maxY = Math.round(maxY);
    			minY = Math.round(minY);

    			objects[i][0].attr({
    				points: getPathString(datas[i], minY, maxY)
    			});

    			objects[i][2].attr({ text: minY + axisSettings[i].units });
    			objects[i][1].attr({ text: maxY + axisSettings[i].units });
    		}
    	}

    	const writable_props = ["axisSettings", "datas"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Graph> was created with unknown prop '${key}'`);
    	});

    	function svg_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			element = $$value;
    			$$invalidate(0, element);
    		});
    	}

    	$$self.$$set = $$props => {
    		if ("axisSettings" in $$props) $$invalidate(2, axisSettings = $$props.axisSettings);
    		if ("datas" in $$props) $$invalidate(1, datas = $$props.datas);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		axisSettings,
    		datas,
    		element,
    		objects,
    		update,
    		getPathString
    	});

    	$$self.$inject_state = $$props => {
    		if ("axisSettings" in $$props) $$invalidate(2, axisSettings = $$props.axisSettings);
    		if ("datas" in $$props) $$invalidate(1, datas = $$props.datas);
    		if ("element" in $$props) $$invalidate(0, element = $$props.element);
    		if ("objects" in $$props) objects = $$props.objects;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*datas*/ 2) {
    			update();
    		}
    	};

    	return [element, datas, axisSettings, svg_binding];
    }

    class Graph extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { axisSettings: 2, datas: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Graph",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*axisSettings*/ ctx[2] === undefined && !("axisSettings" in props)) {
    			console.warn("<Graph> was created without expected prop 'axisSettings'");
    		}

    		if (/*datas*/ ctx[1] === undefined && !("datas" in props)) {
    			console.warn("<Graph> was created without expected prop 'datas'");
    		}
    	}

    	get axisSettings() {
    		throw new Error("<Graph>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set axisSettings(value) {
    		throw new Error("<Graph>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get datas() {
    		throw new Error("<Graph>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set datas(value) {
    		throw new Error("<Graph>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* SvelteComponents\Slider.svelte generated by Svelte v3.38.2 */

    const file$1 = "SvelteComponents\\Slider.svelte";

    // (12:0) {#if iconPath}
    function create_if_block$1(ctx) {
    	let img;
    	let img_src_value;

    	const block = {
    		c: function create() {
    			img = element("img");
    			if (img.src !== (img_src_value = /*iconPath*/ ctx[2])) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "yo mama lol");
    			set_style(img, "width", "100%");
    			set_style(img, "animation-play-state", /*value*/ ctx[0] == 0 ? "paused" : "running");
    			attr_dev(img, "class", "svelte-16q8zc7");
    			add_location(img, file$1, 12, 4, 252);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, img, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*iconPath*/ 4 && img.src !== (img_src_value = /*iconPath*/ ctx[2])) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*value*/ 1) {
    				set_style(img, "animation-play-state", /*value*/ ctx[0] == 0 ? "paused" : "running");
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(img);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(12:0) {#if iconPath}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let div1;
    	let div0;
    	let t0;
    	let t1_value = /*value*/ ctx[0].toFixed(0) + "";
    	let t1;
    	let t2;
    	let t3;
    	let if_block_anchor;
    	let if_block = /*iconPath*/ ctx[2] && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			t0 = space();
    			t1 = text(t1_value);
    			t2 = text("%");
    			t3 = space();
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    			attr_dev(div0, "class", "data svelte-16q8zc7");
    			set_style(div0, "height", /*value*/ ctx[0] + "%");
    			set_style(div0, "background-color", /*color*/ ctx[1]);
    			add_location(div0, file$1, 7, 4, 122);
    			attr_dev(div1, "class", "outline svelte-16q8zc7");
    			add_location(div1, file$1, 6, 0, 95);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div1, t0);
    			append_dev(div1, t1);
    			append_dev(div1, t2);
    			insert_dev(target, t3, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*value*/ 1) {
    				set_style(div0, "height", /*value*/ ctx[0] + "%");
    			}

    			if (dirty & /*color*/ 2) {
    				set_style(div0, "background-color", /*color*/ ctx[1]);
    			}

    			if (dirty & /*value*/ 1 && t1_value !== (t1_value = /*value*/ ctx[0].toFixed(0) + "")) set_data_dev(t1, t1_value);

    			if (/*iconPath*/ ctx[2]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$1(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if (detaching) detach_dev(t3);
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
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
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Slider", slots, []);
    	let { value } = $$props;
    	let { color } = $$props;
    	let { iconPath } = $$props;
    	const writable_props = ["value", "color", "iconPath"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Slider> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("value" in $$props) $$invalidate(0, value = $$props.value);
    		if ("color" in $$props) $$invalidate(1, color = $$props.color);
    		if ("iconPath" in $$props) $$invalidate(2, iconPath = $$props.iconPath);
    	};

    	$$self.$capture_state = () => ({ value, color, iconPath });

    	$$self.$inject_state = $$props => {
    		if ("value" in $$props) $$invalidate(0, value = $$props.value);
    		if ("color" in $$props) $$invalidate(1, color = $$props.color);
    		if ("iconPath" in $$props) $$invalidate(2, iconPath = $$props.iconPath);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [value, color, iconPath];
    }

    class Slider extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { value: 0, color: 1, iconPath: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Slider",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*value*/ ctx[0] === undefined && !("value" in props)) {
    			console.warn("<Slider> was created without expected prop 'value'");
    		}

    		if (/*color*/ ctx[1] === undefined && !("color" in props)) {
    			console.warn("<Slider> was created without expected prop 'color'");
    		}

    		if (/*iconPath*/ ctx[2] === undefined && !("iconPath" in props)) {
    			console.warn("<Slider> was created without expected prop 'iconPath'");
    		}
    	}

    	get value() {
    		throw new Error("<Slider>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set value(value) {
    		throw new Error("<Slider>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get color() {
    		throw new Error("<Slider>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set color(value) {
    		throw new Error("<Slider>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get iconPath() {
    		throw new Error("<Slider>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set iconPath(value) {
    		throw new Error("<Slider>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* App.svelte generated by Svelte v3.38.2 */

    const { console: console_1 } = globals;
    const file = "App.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[20] = list[i];
    	child_ctx[22] = i;
    	return child_ctx;
    }

    // (80:0) {#if showImage}
    function create_if_block_4(ctx) {
    	let div;
    	let img;
    	let img_src_value;
    	let div_transition;
    	let current;

    	const block = {
    		c: function create() {
    			div = element("div");
    			img = element("img");
    			attr_dev(img, "height", "100%");
    			if (img.src !== (img_src_value = "static/logo.png")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "img");
    			add_location(img, file, 81, 8, 2618);
    			attr_dev(div, "id", "photo");
    			add_location(div, file, 80, 4, 2556);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, img);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!div_transition) div_transition = create_bidirectional_transition(div, fade, { duration: 3000 }, true);
    				div_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (!div_transition) div_transition = create_bidirectional_transition(div, fade, { duration: 3000 }, false);
    			div_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (detaching && div_transition) div_transition.end();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4.name,
    		type: "if",
    		source: "(80:0) {#if showImage}",
    		ctx
    	});

    	return block;
    }

    // (86:0) <Overlay bind:shown={showOverlay}>
    function create_default_slot(ctx) {
    	let h1;
    	let t1;
    	let div0;
    	let t3;
    	let div1;
    	let t4;
    	let t5;
    	let input0;
    	let t6;
    	let input1;
    	let t7;
    	let input2;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "Error: Unable to find port.";
    			t1 = space();
    			div0 = element("div");
    			div0.textContent = "Ports found:";
    			t3 = space();
    			div1 = element("div");
    			t4 = text(/*availablePorts*/ ctx[7]);
    			t5 = space();
    			input0 = element("input");
    			t6 = space();
    			input1 = element("input");
    			t7 = space();
    			input2 = element("input");
    			add_location(h1, file, 86, 4, 2729);
    			add_location(div0, file, 87, 4, 2770);
    			attr_dev(div1, "id", "ports");
    			add_location(div1, file, 88, 4, 2798);
    			set_style(input0, "padding", "10px");
    			set_style(input0, "font-size", "20px");
    			attr_dev(input0, "type", "button");
    			input0.value = "Add 'COM'";
    			add_location(input0, file, 89, 4, 2841);
    			set_style(input1, "padding", "10px");
    			set_style(input1, "font-size", "20px");
    			attr_dev(input1, "type", "text");
    			attr_dev(input1, "id", "portsSelect");
    			add_location(input1, file, 94, 4, 3006);
    			set_style(input2, "padding", "10px");
    			set_style(input2, "font-size", "20px");
    			attr_dev(input2, "type", "button");
    			input2.value = "Submit";
    			add_location(input2, file, 99, 4, 3143);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div0, anchor);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, div1, anchor);
    			append_dev(div1, t4);
    			insert_dev(target, t5, anchor);
    			insert_dev(target, input0, anchor);
    			insert_dev(target, t6, anchor);
    			insert_dev(target, input1, anchor);
    			set_input_value(input1, /*portName*/ ctx[6]);
    			insert_dev(target, t7, anchor);
    			insert_dev(target, input2, anchor);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "click", /*click_handler*/ ctx[13], false, false, false),
    					listen_dev(input1, "input", /*input1_input_handler*/ ctx[14]),
    					listen_dev(input2, "click", /*click_handler_1*/ ctx[15], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*availablePorts*/ 128) set_data_dev(t4, /*availablePorts*/ ctx[7]);

    			if (dirty & /*portName*/ 64 && input1.value !== /*portName*/ ctx[6]) {
    				set_input_value(input1, /*portName*/ ctx[6]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(div1);
    			if (detaching) detach_dev(t5);
    			if (detaching) detach_dev(input0);
    			if (detaching) detach_dev(t6);
    			if (detaching) detach_dev(input1);
    			if (detaching) detach_dev(t7);
    			if (detaching) detach_dev(input2);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(86:0) <Overlay bind:shown={showOverlay}>",
    		ctx
    	});

    	return block;
    }

    // (111:4) {#if data?.c}
    function create_if_block_3(ctx) {
    	let each_1_anchor;
    	let each_value = /*data*/ ctx[0].c;
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*getColor, data, bS*/ 1025) {
    				each_value = /*data*/ ctx[0].c;
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(111:4) {#if data?.c}",
    		ctx
    	});

    	return block;
    }

    // (112:8) {#each data.c as cell, index}
    function create_each_block(ctx) {
    	let div;
    	let t0_value = /*cell*/ ctx[20] + "";
    	let t0;
    	let t1;
    	let div_style_value;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t0 = text(t0_value);
    			t1 = space();
    			attr_dev(div, "class", "cell");
    			attr_dev(div, "style", div_style_value = "background-color: " + getColor(/*cell*/ ctx[20]));
    			toggle_class(div, "balancing", /*bS*/ ctx[10][/*index*/ ctx[22]] == "1");
    			add_location(div, file, 112, 12, 3445);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t0);
    			append_dev(div, t1);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*data*/ 1 && t0_value !== (t0_value = /*cell*/ ctx[20] + "")) set_data_dev(t0, t0_value);

    			if (dirty & /*data*/ 1 && div_style_value !== (div_style_value = "background-color: " + getColor(/*cell*/ ctx[20]))) {
    				attr_dev(div, "style", div_style_value);
    			}

    			if (dirty & /*bS*/ 1024) {
    				toggle_class(div, "balancing", /*bS*/ ctx[10][/*index*/ ctx[22]] == "1");
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(112:8) {#each data.c as cell, index}",
    		ctx
    	});

    	return block;
    }

    // (123:4) {#if data?.c}
    function create_if_block_2(ctx) {
    	let gauge0;
    	let t0;
    	let gauge1;
    	let t1;
    	let gauge2;
    	let t2;
    	let gauge3;
    	let current;

    	gauge0 = new Gauge_1({
    			props: {
    				name: "Pack Voltage",
    				value: /*voltage*/ ctx[9],
    				bounds: [50, 90],
    				colorBounds: [88.1, 65]
    			},
    			$$inline: true
    		});

    	gauge1 = new Gauge_1({
    			props: {
    				name: "Min Cell Voltage",
    				value: Math.min(.../*data*/ ctx[0].c),
    				bounds: [2.7, 4.2],
    				colorBounds: [3.2, 4.15]
    			},
    			$$inline: true
    		});

    	gauge2 = new Gauge_1({
    			props: {
    				name: "Avg. Cell Voltage",
    				value: /*voltage*/ ctx[9] / /*data*/ ctx[0].c.length,
    				bounds: [2.7, 4.2],
    				colorBounds: [3.2, 4.15]
    			},
    			$$inline: true
    		});

    	gauge3 = new Gauge_1({
    			props: {
    				name: "Max Cell Voltage",
    				value: Math.max(.../*data*/ ctx[0].c),
    				bounds: [2.7, 4.2],
    				colorBounds: [3.2, 4.15]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(gauge0.$$.fragment);
    			t0 = space();
    			create_component(gauge1.$$.fragment);
    			t1 = space();
    			create_component(gauge2.$$.fragment);
    			t2 = space();
    			create_component(gauge3.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(gauge0, target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(gauge1, target, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(gauge2, target, anchor);
    			insert_dev(target, t2, anchor);
    			mount_component(gauge3, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const gauge0_changes = {};
    			if (dirty & /*voltage*/ 512) gauge0_changes.value = /*voltage*/ ctx[9];
    			gauge0.$set(gauge0_changes);
    			const gauge1_changes = {};
    			if (dirty & /*data*/ 1) gauge1_changes.value = Math.min(.../*data*/ ctx[0].c);
    			gauge1.$set(gauge1_changes);
    			const gauge2_changes = {};
    			if (dirty & /*voltage, data*/ 513) gauge2_changes.value = /*voltage*/ ctx[9] / /*data*/ ctx[0].c.length;
    			gauge2.$set(gauge2_changes);
    			const gauge3_changes = {};
    			if (dirty & /*data*/ 1) gauge3_changes.value = Math.max(.../*data*/ ctx[0].c);
    			gauge3.$set(gauge3_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(gauge0.$$.fragment, local);
    			transition_in(gauge1.$$.fragment, local);
    			transition_in(gauge2.$$.fragment, local);
    			transition_in(gauge3.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(gauge0.$$.fragment, local);
    			transition_out(gauge1.$$.fragment, local);
    			transition_out(gauge2.$$.fragment, local);
    			transition_out(gauge3.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(gauge0, detaching);
    			if (detaching) detach_dev(t0);
    			destroy_component(gauge1, detaching);
    			if (detaching) detach_dev(t1);
    			destroy_component(gauge2, detaching);
    			if (detaching) detach_dev(t2);
    			destroy_component(gauge3, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(123:4) {#if data?.c}",
    		ctx
    	});

    	return block;
    }

    // (190:4) {#if data}
    function create_if_block_1(ctx) {
    	let tempgauge;
    	let t0;
    	let div2;
    	let div0;
    	let gauge0;
    	let t1;
    	let div1;
    	let gauge1;
    	let current;

    	tempgauge = new TempGauge({
    			props: { data: /*data*/ ctx[0].t },
    			$$inline: true
    		});

    	gauge0 = new Gauge_1({
    			props: {
    				name: "Current (Amps)",
    				value: /*data*/ ctx[0].pC,
    				bounds: [-50, 500]
    			},
    			$$inline: true
    		});

    	gauge1 = new Gauge_1({
    			props: {
    				name: "Power (kW)",
    				value: Math.abs(/*data*/ ctx[0].pC * /*voltage*/ ctx[9] / 1000),
    				bounds: [0, 40]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(tempgauge.$$.fragment);
    			t0 = space();
    			div2 = element("div");
    			div0 = element("div");
    			create_component(gauge0.$$.fragment);
    			t1 = space();
    			div1 = element("div");
    			create_component(gauge1.$$.fragment);
    			set_style(div0, "width", "50%");
    			set_style(div0, "font-weight", "bolder");
    			set_style(div0, "text-align", "center");
    			add_location(div0, file, 192, 12, 5645);
    			set_style(div1, "width", "50%");
    			set_style(div1, "font-weight", "bolder");
    			set_style(div1, "text-align", "center");
    			add_location(div1, file, 198, 12, 5886);
    			set_style(div2, "display", "flex");
    			add_location(div2, file, 191, 8, 5604);
    		},
    		m: function mount(target, anchor) {
    			mount_component(tempgauge, target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			mount_component(gauge0, div0, null);
    			append_dev(div2, t1);
    			append_dev(div2, div1);
    			mount_component(gauge1, div1, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const tempgauge_changes = {};
    			if (dirty & /*data*/ 1) tempgauge_changes.data = /*data*/ ctx[0].t;
    			tempgauge.$set(tempgauge_changes);
    			const gauge0_changes = {};
    			if (dirty & /*data*/ 1) gauge0_changes.value = /*data*/ ctx[0].pC;
    			gauge0.$set(gauge0_changes);
    			const gauge1_changes = {};
    			if (dirty & /*data, voltage*/ 513) gauge1_changes.value = Math.abs(/*data*/ ctx[0].pC * /*voltage*/ ctx[9] / 1000);
    			gauge1.$set(gauge1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(tempgauge.$$.fragment, local);
    			transition_in(gauge0.$$.fragment, local);
    			transition_in(gauge1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(tempgauge.$$.fragment, local);
    			transition_out(gauge0.$$.fragment, local);
    			transition_out(gauge1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(tempgauge, detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div2);
    			destroy_component(gauge0);
    			destroy_component(gauge1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(190:4) {#if data}",
    		ctx
    	});

    	return block;
    }

    // (210:4) {#if data}
    function create_if_block(ctx) {
    	let slider;
    	let current;

    	slider = new Slider({
    			props: {
    				value: /*data*/ ctx[0].f,
    				color: "#4fc3f7",
    				iconPath: "static/fan.svg"
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(slider.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(slider, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const slider_changes = {};
    			if (dirty & /*data*/ 1) slider_changes.value = /*data*/ ctx[0].f;
    			slider.$set(slider_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(slider.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(slider.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(slider, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(210:4) {#if data}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let t0;
    	let overlay;
    	let updating_shown;
    	let t1;
    	let div0;
    	let t2;
    	let div1;
    	let t3;
    	let div6;
    	let div2;
    	let t4_value = /*time*/ ctx[2].toLocaleTimeString() + "";
    	let t4;
    	let t5;
    	let img;
    	let img_src_value;
    	let t6;
    	let div5;
    	let div3;
    	let t7;
    	let t8;
    	let div4;
    	let t10;
    	let graph;
    	let t11;
    	let div7;
    	let t12;
    	let div8;
    	let current;
    	let if_block0 = /*showImage*/ ctx[5] && create_if_block_4(ctx);

    	function overlay_shown_binding(value) {
    		/*overlay_shown_binding*/ ctx[16](value);
    	}

    	let overlay_props = {
    		$$slots: { default: [create_default_slot] },
    		$$scope: { ctx }
    	};

    	if (/*showOverlay*/ ctx[8] !== void 0) {
    		overlay_props.shown = /*showOverlay*/ ctx[8];
    	}

    	overlay = new Overlay({ props: overlay_props, $$inline: true });
    	binding_callbacks.push(() => bind(overlay, "shown", overlay_shown_binding));
    	let if_block1 = /*data*/ ctx[0]?.c && create_if_block_3(ctx);
    	let if_block2 = /*data*/ ctx[0]?.c && create_if_block_2(ctx);

    	graph = new Graph({
    			props: {
    				axisSettings: [
    					{
    						axis: 0,
    						color: "#FF5733",
    						maxPoints: 35,
    						units: "V",
    						minIs0: false
    					},
    					{
    						axis: 350,
    						color: "black",
    						maxPoints: 35,
    						units: "kW",
    						minIs0: true
    					}
    				],
    				datas: /*graphData*/ ctx[4]
    			},
    			$$inline: true
    		});

    	let if_block3 = /*data*/ ctx[0] && create_if_block_1(ctx);
    	let if_block4 = /*data*/ ctx[0] && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			if (if_block0) if_block0.c();
    			t0 = space();
    			create_component(overlay.$$.fragment);
    			t1 = space();
    			div0 = element("div");
    			if (if_block1) if_block1.c();
    			t2 = space();
    			div1 = element("div");
    			if (if_block2) if_block2.c();
    			t3 = space();
    			div6 = element("div");
    			div2 = element("div");
    			t4 = text(t4_value);
    			t5 = space();
    			img = element("img");
    			t6 = space();
    			div5 = element("div");
    			div3 = element("div");
    			t7 = text(/*status*/ ctx[1]);
    			t8 = space();
    			div4 = element("div");
    			div4.textContent = `${/*chgstatus*/ ctx[11]}`;
    			t10 = space();
    			create_component(graph.$$.fragment);
    			t11 = space();
    			div7 = element("div");
    			if (if_block3) if_block3.c();
    			t12 = space();
    			div8 = element("div");
    			if (if_block4) if_block4.c();
    			attr_dev(div0, "id", "cells");
    			add_location(div0, file, 109, 0, 3360);
    			set_style(div1, "color", "black");
    			set_style(div1, "text-align", "center");
    			set_style(div1, "font-weight", "bolder");
    			add_location(div1, file, 121, 0, 3668);
    			set_style(div2, "text-align", "center");
    			set_style(div2, "font-size", "3vw");
    			set_style(div2, "margin-top", "20px");
    			set_style(div2, "font-weight", "bolder");
    			add_location(div2, file, 148, 4, 4491);
    			if (img.src !== (img_src_value = "./static/export.png")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "width", "85%");
    			set_style(img, "margin-left", "-50px");
    			attr_dev(img, "alt", "car logo dumbass");
    			add_location(img, file, 153, 4, 4657);
    			attr_dev(div3, "class", "statusBox");
    			toggle_class(div3, "old", /*time*/ ctx[2] - /*lastUpdateDate*/ ctx[3] > new Date(3000));
    			add_location(div3, file, 161, 8, 4905);
    			attr_dev(div4, "class", "statusBox");
    			add_location(div4, file, 166, 8, 5048);
    			set_style(div5, "background-color", "lightgrey");
    			set_style(div5, "padding", "10px");
    			set_style(div5, "border-radius", "20px");
    			add_location(div5, file, 159, 4, 4810);
    			set_style(div6, "position", "relative");
    			set_style(div6, "text-align", "center");
    			add_location(div6, file, 146, 0, 4414);
    			add_location(div7, file, 188, 0, 5539);
    			add_location(div8, file, 208, 0, 6170);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block0) if_block0.m(target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(overlay, target, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div0, anchor);
    			if (if_block1) if_block1.m(div0, null);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, div1, anchor);
    			if (if_block2) if_block2.m(div1, null);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, div6, anchor);
    			append_dev(div6, div2);
    			append_dev(div2, t4);
    			append_dev(div6, t5);
    			append_dev(div6, img);
    			append_dev(div6, t6);
    			append_dev(div6, div5);
    			append_dev(div5, div3);
    			append_dev(div3, t7);
    			append_dev(div5, t8);
    			append_dev(div5, div4);
    			append_dev(div6, t10);
    			mount_component(graph, div6, null);
    			insert_dev(target, t11, anchor);
    			insert_dev(target, div7, anchor);
    			if (if_block3) if_block3.m(div7, null);
    			insert_dev(target, t12, anchor);
    			insert_dev(target, div8, anchor);
    			if (if_block4) if_block4.m(div8, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*showImage*/ ctx[5]) {
    				if (if_block0) {
    					if (dirty & /*showImage*/ 32) {
    						transition_in(if_block0, 1);
    					}
    				} else {
    					if_block0 = create_if_block_4(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(t0.parentNode, t0);
    				}
    			} else if (if_block0) {
    				group_outros();

    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});

    				check_outros();
    			}

    			const overlay_changes = {};

    			if (dirty & /*$$scope, portName, showOverlay, availablePorts*/ 8389056) {
    				overlay_changes.$$scope = { dirty, ctx };
    			}

    			if (!updating_shown && dirty & /*showOverlay*/ 256) {
    				updating_shown = true;
    				overlay_changes.shown = /*showOverlay*/ ctx[8];
    				add_flush_callback(() => updating_shown = false);
    			}

    			overlay.$set(overlay_changes);

    			if (/*data*/ ctx[0]?.c) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block_3(ctx);
    					if_block1.c();
    					if_block1.m(div0, null);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			if (/*data*/ ctx[0]?.c) {
    				if (if_block2) {
    					if_block2.p(ctx, dirty);

    					if (dirty & /*data*/ 1) {
    						transition_in(if_block2, 1);
    					}
    				} else {
    					if_block2 = create_if_block_2(ctx);
    					if_block2.c();
    					transition_in(if_block2, 1);
    					if_block2.m(div1, null);
    				}
    			} else if (if_block2) {
    				group_outros();

    				transition_out(if_block2, 1, 1, () => {
    					if_block2 = null;
    				});

    				check_outros();
    			}

    			if ((!current || dirty & /*time*/ 4) && t4_value !== (t4_value = /*time*/ ctx[2].toLocaleTimeString() + "")) set_data_dev(t4, t4_value);
    			if (!current || dirty & /*status*/ 2) set_data_dev(t7, /*status*/ ctx[1]);

    			if (dirty & /*time, lastUpdateDate, Date*/ 12) {
    				toggle_class(div3, "old", /*time*/ ctx[2] - /*lastUpdateDate*/ ctx[3] > new Date(3000));
    			}

    			const graph_changes = {};
    			if (dirty & /*graphData*/ 16) graph_changes.datas = /*graphData*/ ctx[4];
    			graph.$set(graph_changes);

    			if (/*data*/ ctx[0]) {
    				if (if_block3) {
    					if_block3.p(ctx, dirty);

    					if (dirty & /*data*/ 1) {
    						transition_in(if_block3, 1);
    					}
    				} else {
    					if_block3 = create_if_block_1(ctx);
    					if_block3.c();
    					transition_in(if_block3, 1);
    					if_block3.m(div7, null);
    				}
    			} else if (if_block3) {
    				group_outros();

    				transition_out(if_block3, 1, 1, () => {
    					if_block3 = null;
    				});

    				check_outros();
    			}

    			if (/*data*/ ctx[0]) {
    				if (if_block4) {
    					if_block4.p(ctx, dirty);

    					if (dirty & /*data*/ 1) {
    						transition_in(if_block4, 1);
    					}
    				} else {
    					if_block4 = create_if_block(ctx);
    					if_block4.c();
    					transition_in(if_block4, 1);
    					if_block4.m(div8, null);
    				}
    			} else if (if_block4) {
    				group_outros();

    				transition_out(if_block4, 1, 1, () => {
    					if_block4 = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block0);
    			transition_in(overlay.$$.fragment, local);
    			transition_in(if_block2);
    			transition_in(graph.$$.fragment, local);
    			transition_in(if_block3);
    			transition_in(if_block4);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block0);
    			transition_out(overlay.$$.fragment, local);
    			transition_out(if_block2);
    			transition_out(graph.$$.fragment, local);
    			transition_out(if_block3);
    			transition_out(if_block4);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block0) if_block0.d(detaching);
    			if (detaching) detach_dev(t0);
    			destroy_component(overlay, detaching);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div0);
    			if (if_block1) if_block1.d();
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(div1);
    			if (if_block2) if_block2.d();
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(div6);
    			destroy_component(graph);
    			if (detaching) detach_dev(t11);
    			if (detaching) detach_dev(div7);
    			if (if_block3) if_block3.d();
    			if (detaching) detach_dev(t12);
    			if (detaching) detach_dev(div8);
    			if (if_block4) if_block4.d();
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
    	let voltage;
    	let bS;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
    	const { ipcRenderer } = require("electron");

    	// Basically we need to wait for the script to load.
    	let data;

    	let status = "Waiting for data...";
    	let chgstatus = "Waiting for charging data...";
    	let time = new Date();
    	let lastUpdateDate;
    	let showGauges;

    	onMount(() => {
    		const interval = setInterval(
    			() => {
    				$$invalidate(2, time = new Date());
    			},
    			1000
    		);

    		ipcRenderer.send("ready_for_data");
    		console.log("1) Sent ready");

    		return () => {
    			clearInterval(interval);
    		};
    	});

    	let graphData = [[], []];
    	let fake_data = typeof require === "undefined";
    	console.log(fake_data ? "Faking data.." : "Not faking data.");
    	let showImage = true;

    	ipcRenderer.on("data", (event, _data) => {
    		if (_data.s == "normal") {
    			if (showImage) {
    				$$invalidate(5, showImage = false);
    				console.log("2/4) Got data");
    			}

    			if (voltage && _data.pC) {
    				graphData[0].push(voltage);
    				graphData[1].push(Math.abs(_data.pC * voltage / 1000));
    				$$invalidate(4, graphData);
    			}

    			$$invalidate(0, data = _data);
    			$$invalidate(1, status = "Got last data " + new Date().toLocaleTimeString());
    			$$invalidate(3, lastUpdateDate = new Date());
    		} else if (_data.s == "bms_error") {
    			console.log("BMS Error: " + _data.error);
    		} else if (_data.s == "log") {
    			console.log(_data.m);
    		}
    	});

    	ipcRenderer.on("select_port", (event, _data) => {
    		$$invalidate(8, showOverlay = true);
    		$$invalidate(7, availablePorts = _data);
    		console.log("2) Selecting port");
    	});

    	function sendPort(portName) {
    		console.log("3) Sending port " + portName);
    		ipcRenderer.send("selected_port", portName);
    		$$invalidate(8, showOverlay = false);
    	}

    	let portName = "";
    	let availablePorts;
    	let showOverlay = false;
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => $$invalidate(6, portName = "COM" + portName);

    	function input1_input_handler() {
    		portName = this.value;
    		$$invalidate(6, portName);
    	}

    	const click_handler_1 = () => {
    		sendPort(portName);
    		$$invalidate(8, showOverlay = false);
    	};

    	function overlay_shown_binding(value) {
    		showOverlay = value;
    		$$invalidate(8, showOverlay);
    	}

    	$$self.$capture_state = () => ({
    		onMount,
    		setContext,
    		fade,
    		Overlay,
    		Gauge: Gauge_1,
    		TempGauge,
    		Graph,
    		Slider,
    		getColor,
    		ipcRenderer,
    		data,
    		status,
    		chgstatus,
    		time,
    		lastUpdateDate,
    		showGauges,
    		graphData,
    		fake_data,
    		showImage,
    		sendPort,
    		portName,
    		availablePorts,
    		showOverlay,
    		voltage,
    		bS
    	});

    	$$self.$inject_state = $$props => {
    		if ("data" in $$props) $$invalidate(0, data = $$props.data);
    		if ("status" in $$props) $$invalidate(1, status = $$props.status);
    		if ("chgstatus" in $$props) $$invalidate(11, chgstatus = $$props.chgstatus);
    		if ("time" in $$props) $$invalidate(2, time = $$props.time);
    		if ("lastUpdateDate" in $$props) $$invalidate(3, lastUpdateDate = $$props.lastUpdateDate);
    		if ("showGauges" in $$props) showGauges = $$props.showGauges;
    		if ("graphData" in $$props) $$invalidate(4, graphData = $$props.graphData);
    		if ("fake_data" in $$props) fake_data = $$props.fake_data;
    		if ("showImage" in $$props) $$invalidate(5, showImage = $$props.showImage);
    		if ("portName" in $$props) $$invalidate(6, portName = $$props.portName);
    		if ("availablePorts" in $$props) $$invalidate(7, availablePorts = $$props.availablePorts);
    		if ("showOverlay" in $$props) $$invalidate(8, showOverlay = $$props.showOverlay);
    		if ("voltage" in $$props) $$invalidate(9, voltage = $$props.voltage);
    		if ("bS" in $$props) $$invalidate(10, bS = $$props.bS);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*data*/ 1) {
    			$$invalidate(9, voltage = data?.c.reduce((a, b) => a + b));
    		}

    		if ($$self.$$.dirty & /*data*/ 1) {
    			$$invalidate(10, bS = data?.bS.toString(2).split("").reverse().join(""));
    		}

    		if ($$self.$$.dirty & /*data*/ 1) {
    			setContext("animationDuration", data ? data.i : 1);
    		}
    	};

    	return [
    		data,
    		status,
    		time,
    		lastUpdateDate,
    		graphData,
    		showImage,
    		portName,
    		availablePorts,
    		showOverlay,
    		voltage,
    		bS,
    		chgstatus,
    		sendPort,
    		click_handler,
    		input1_input_handler,
    		click_handler_1,
    		overlay_shown_binding
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    	}
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
