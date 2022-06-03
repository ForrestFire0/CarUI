
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
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function get_store_value(store) {
        let value;
        subscribe(store, _ => value = _)();
        return value;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
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
    function null_to_empty(value) {
        return value == null ? '' : value;
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
    function to_number(value) {
        return value === '' ? null : +value;
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
    class HtmlTag {
        constructor(anchor = null) {
            this.a = anchor;
            this.e = this.n = null;
        }
        m(html, target, anchor = null) {
            if (!this.e) {
                this.e = element(target.nodeName);
                this.t = target;
                this.h(html);
            }
            this.i(anchor);
        }
        h(html) {
            this.e.innerHTML = html;
            this.n = Array.from(this.e.childNodes);
        }
        i(anchor) {
            for (let i = 0; i < this.n.length; i += 1) {
                insert(this.t, this.n[i], anchor);
            }
        }
        p(html) {
            this.d();
            this.h(html);
            this.i(this.a);
        }
        d() {
            this.n.forEach(detach);
        }
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
    function create_in_transition(node, fn, params) {
        let config = fn(node, params);
        let running = false;
        let animation_name;
        let task;
        let uid = 0;
        function cleanup() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function go() {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            if (css)
                animation_name = create_rule(node, 0, 1, duration, delay, easing, css, uid++);
            tick(0, 1);
            const start_time = now() + delay;
            const end_time = start_time + duration;
            if (task)
                task.abort();
            running = true;
            add_render_callback(() => dispatch(node, true, 'start'));
            task = loop(now => {
                if (running) {
                    if (now >= end_time) {
                        tick(1, 0);
                        dispatch(node, true, 'end');
                        cleanup();
                        return running = false;
                    }
                    if (now >= start_time) {
                        const t = easing((now - start_time) / duration);
                        tick(t, 1 - t);
                    }
                }
                return running;
            });
        }
        let started = false;
        return {
            start() {
                if (started)
                    return;
                delete_rule(node);
                if (is_function(config)) {
                    config = config();
                    wait().then(go);
                }
                else {
                    go();
                }
            },
            invalidate() {
                started = false;
            },
            end() {
                if (running) {
                    cleanup();
                    running = false;
                }
            }
        };
    }
    function create_out_transition(node, fn, params) {
        let config = fn(node, params);
        let running = true;
        let animation_name;
        const group = outros;
        group.r += 1;
        function go() {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            if (css)
                animation_name = create_rule(node, 1, 0, duration, delay, easing, css);
            const start_time = now() + delay;
            const end_time = start_time + duration;
            add_render_callback(() => dispatch(node, false, 'start'));
            loop(now => {
                if (running) {
                    if (now >= end_time) {
                        tick(0, 1);
                        dispatch(node, false, 'end');
                        if (!--group.r) {
                            // this will result in `end()` being called,
                            // so we don't need to clean up here
                            run_all(group.c);
                        }
                        return false;
                    }
                    if (now >= start_time) {
                        const t = easing((now - start_time) / duration);
                        tick(1 - t, t);
                    }
                }
                return running;
            });
        }
        if (is_function(config)) {
            wait().then(() => {
                // @ts-ignore
                config = config();
                go();
            });
        }
        else {
            go();
        }
        return {
            end(reset) {
                if (reset && config.tick) {
                    config.tick(1, 0);
                }
                if (running) {
                    if (animation_name)
                        delete_rule(node, animation_name);
                    running = false;
                }
            }
        };
    }
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
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev('SvelteDOMSetProperty', { node, property, value });
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

    function bounceOut(t) {
        const a = 4.0 / 11.0;
        const b = 8.0 / 11.0;
        const c = 9.0 / 10.0;
        const ca = 4356.0 / 361.0;
        const cb = 35442.0 / 1805.0;
        const cc = 16061.0 / 1805.0;
        const t2 = t * t;
        return t < a
            ? 7.5625 * t2
            : t < b
                ? 9.075 * t2 - 9.9 * t + 3.4
                : t < c
                    ? ca * t2 - cb * t + cc
                    : 10.8 * t * t - 20.52 * t + 10.72;
    }
    function cubicOut(t) {
        const f = t - 1.0;
        return f * f * f + 1.0;
    }
    function sineIn(t) {
        const v = Math.cos(t * Math.PI * 0.5);
        if (Math.abs(v) < 1e-14)
            return 1;
        else
            return 1 - v;
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
    function fly(node, { delay = 0, duration = 400, easing = cubicOut, x = 0, y = 0, opacity = 0 } = {}) {
        const style = getComputedStyle(node);
        const target_opacity = +style.opacity;
        const transform = style.transform === 'none' ? '' : style.transform;
        const od = target_opacity * (1 - opacity);
        return {
            delay,
            duration,
            easing,
            css: (t, u) => `
			transform: ${transform} translate(${(1 - t) * x}px, ${(1 - t) * y}px);
			opacity: ${target_opacity - (od * u)}`
        };
    }

    /* SvelteComponents\Overlay.svelte generated by Svelte v3.38.2 */

    const file$b = "SvelteComponents\\Overlay.svelte";

    // (13:0) {#if shown}
    function create_if_block$4(ctx) {
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
    			attr_dev(div0, "class", "container svelte-16ajzzb");
    			attr_dev(div0, "style", div0_style_value = "width: " + /*width*/ ctx[2] + "%");
    			add_location(div0, file$b, 19, 8, 425);
    			attr_dev(div1, "class", "overlay svelte-16ajzzb");
    			toggle_class(div1, "closable", /*closable*/ ctx[1]);
    			add_location(div1, file$b, 13, 4, 280);
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
    		id: create_if_block$4.name,
    		type: "if",
    		source: "(13:0) {#if shown}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$b(ctx) {
    	let if_block_anchor;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block = /*shown*/ ctx[0] && create_if_block$4(ctx);

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
    					if_block = create_if_block$4(ctx);
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
    		id: create_fragment$b.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$b($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$b, create_fragment$b, safe_not_equal, { shown: 0, closable: 1, width: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Overlay",
    			options,
    			id: create_fragment$b.name
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

    const interpolateHSL = function (color1, color2, factor) {
        if (arguments.length < 3) {
            factor = 0.5;
        }
        var hsl1 = rgb2hsl(color1);
        var hsl2 = rgb2hsl(color2);
        for (var i = 0; i < 3; i++) {
            hsl1[i] += factor * (hsl2[i] - hsl1[i]);
        }
        return hsl2rgb(hsl1);
    };

    function getColor(voltage, dm, max = 4.2, min = 3.2) {
        let start, end;
        if (dm) {
            start = "#af3700";
            end = "#00a900";
        } else {
            start = "#ff5000";
            end = "#00ff00";
        }
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

    const rgb2hsl = function (color) {
        const r = color[0] / 255;
        const g = color[1] / 255;
        const b = color[2] / 255;

        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;

        if (max === min) {
            h = s = 0; // achromatic
        } else {
            const d = max - min;
            s = (l > 0.5 ? d / (2 - max - min) : d / (max + min));
            switch (max) {
                case r:
                    h = (g - b) / d + (g < b ? 6 : 0);
                    break;
                case g:
                    h = (b - r) / d + 2;
                    break;
                case b:
                    h = (r - g) / d + 4;
                    break;
            }
            h /= 6;
        }

        return [h, s, l];
    };

    const hsl2rgb = function (color) {
        let l = color[2];

        if (color[1] === 0) {
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

            const s = color[1];
            const q = (l < 0.5 ? l * (1 + s) : l + s - l * s);
            const p = 2 * l - q;
            const r = hue2rgb(p, q, color[0] + 1 / 3);
            const g = hue2rgb(p, q, color[0]);
            const b = hue2rgb(p, q, color[0] - 1 / 3);
            return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
        }
    };

    const subscriber_queue = [];
    /**
     * Creates a `Readable` store that allows reading by subscription.
     * @param value initial value
     * @param {StartStopNotifier}start start and stop notifications for subscriptions
     */
    function readable(value, start) {
        return {
            subscribe: writable(value, start).subscribe
        };
    }
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    /*
     (c) 2011-2015, Vladimir Agafonkin
     SunCalc is a JavaScript library for calculating sun/moon position and light phases.
     https://github.com/mourner/suncalc
    */

    var suncalc = createCommonjsModule(function (module, exports) {
    (function () {

    // shortcuts for easier to read formulas

        var PI = Math.PI,
            sin = Math.sin,
            cos = Math.cos,
            tan = Math.tan,
            asin = Math.asin,
            atan = Math.atan2,
            acos = Math.acos,
            rad = PI / 180;

    // sun calculations are based on http://aa.quae.nl/en/reken/zonpositie.html formulas


    // date/time constants and conversions

        var dayMs = 1000 * 60 * 60 * 24,
            J1970 = 2440588,
            J2000 = 2451545;

        function toJulian(date) {
            return date.valueOf() / dayMs - 0.5 + J1970;
        }

        function fromJulian(j) {
            return new Date((j + 0.5 - J1970) * dayMs);
        }

        function toDays(date) {
            return toJulian(date) - J2000;
        }


    // general calculations for position

        var e = rad * 23.4397; // obliquity of the Earth

        function rightAscension(l, b) {
            return atan(sin(l) * cos(e) - tan(b) * sin(e), cos(l));
        }

        function declination(l, b) {
            return asin(sin(b) * cos(e) + cos(b) * sin(e) * sin(l));
        }

        function azimuth(H, phi, dec) {
            return atan(sin(H), cos(H) * sin(phi) - tan(dec) * cos(phi));
        }

        function altitude(H, phi, dec) {
            return asin(sin(phi) * sin(dec) + cos(phi) * cos(dec) * cos(H));
        }

        function siderealTime(d, lw) {
            return rad * (280.16 + 360.9856235 * d) - lw;
        }

        function astroRefraction(h) {
            if (h < 0) // the following formula works for positive altitudes only.
                h = 0; // if h = -0.08901179 a div/0 would occur.

            // formula 16.4 of "Astronomical Algorithms" 2nd edition by Jean Meeus (Willmann-Bell, Richmond) 1998.
            // 1.02 / tan(h + 10.26 / (h + 5.10)) h in degrees, result in arc minutes -> converted to rad:
            return 0.0002967 / Math.tan(h + 0.00312536 / (h + 0.08901179));
        }

    // general sun calculations

        function solarMeanAnomaly(d) {
            return rad * (357.5291 + 0.98560028 * d);
        }

        function eclipticLongitude(M) {

            var C = rad * (1.9148 * sin(M) + 0.02 * sin(2 * M) + 0.0003 * sin(3 * M)), // equation of center
                P = rad * 102.9372; // perihelion of the Earth

            return M + C + P + PI;
        }

        function sunCoords(d) {

            var M = solarMeanAnomaly(d),
                L = eclipticLongitude(M);

            return {
                dec: declination(L, 0),
                ra: rightAscension(L, 0)
            };
        }


        var SunCalc = {};


    // calculates sun position for a given date and latitude/longitude

        SunCalc.getPosition = function (date, lat, lng) {

            var lw = rad * -lng,
                phi = rad * lat,
                d = toDays(date),

                c = sunCoords(d),
                H = siderealTime(d, lw) - c.ra;

            return {
                azimuth: azimuth(H, phi, c.dec),
                altitude: altitude(H, phi, c.dec)
            };
        };


    // sun times configuration (angle, morning name, evening name)

        var times = SunCalc.times = [
            [-0.833, 'sunrise', 'sunset'],
            [-0.3, 'sunriseEnd', 'sunsetStart'],
            [-6, 'dawn', 'dusk'],
            [-12, 'nauticalDawn', 'nauticalDusk'],
            [-18, 'nightEnd', 'night'],
            [6, 'goldenHourEnd', 'goldenHour']
        ];

    // adds a custom time to the times config

        SunCalc.addTime = function (angle, riseName, setName) {
            times.push([angle, riseName, setName]);
        };


    // calculations for sun times

        var J0 = 0.0009;

        function julianCycle(d, lw) {
            return Math.round(d - J0 - lw / (2 * PI));
        }

        function approxTransit(Ht, lw, n) {
            return J0 + (Ht + lw) / (2 * PI) + n;
        }

        function solarTransitJ(ds, M, L) {
            return J2000 + ds + 0.0053 * sin(M) - 0.0069 * sin(2 * L);
        }

        function hourAngle(h, phi, d) {
            return acos((sin(h) - sin(phi) * sin(d)) / (cos(phi) * cos(d)));
        }

        function observerAngle(height) {
            return -2.076 * Math.sqrt(height) / 60;
        }

    // returns set time for the given sun altitude
        function getSetJ(h, lw, phi, dec, n, M, L) {

            var w = hourAngle(h, phi, dec),
                a = approxTransit(w, lw, n);
            return solarTransitJ(a, M, L);
        }


    // calculates sun times for a given date, latitude/longitude, and, optionally,
    // the observer height (in meters) relative to the horizon

        SunCalc.getTimes = function (date, lat, lng, height) {

            height = height || 0;

            var lw = rad * -lng,
                phi = rad * lat,

                dh = observerAngle(height),

                d = toDays(date),
                n = julianCycle(d, lw),
                ds = approxTransit(0, lw, n),

                M = solarMeanAnomaly(ds),
                L = eclipticLongitude(M),
                dec = declination(L, 0),

                Jnoon = solarTransitJ(ds, M, L),

                i, len, time, h0, Jset, Jrise;


            var result = {
                solarNoon: fromJulian(Jnoon),
                nadir: fromJulian(Jnoon - 0.5)
            };

            for (i = 0, len = times.length; i < len; i += 1) {
                time = times[i];
                h0 = (time[0] + dh) * rad;

                Jset = getSetJ(h0, lw, phi, dec, n, M, L);
                Jrise = Jnoon - (Jset - Jnoon);

                result[time[1]] = fromJulian(Jrise);
                result[time[2]] = fromJulian(Jset);
            }

            return result;
        };


    // moon calculations, based on http://aa.quae.nl/en/reken/hemelpositie.html formulas

        function moonCoords(d) { // geocentric ecliptic coordinates of the moon

            var L = rad * (218.316 + 13.176396 * d), // ecliptic longitude
                M = rad * (134.963 + 13.064993 * d), // mean anomaly
                F = rad * (93.272 + 13.229350 * d),  // mean distance

                l = L + rad * 6.289 * sin(M), // longitude
                b = rad * 5.128 * sin(F),     // latitude
                dt = 385001 - 20905 * cos(M);  // distance to the moon in km

            return {
                ra: rightAscension(l, b),
                dec: declination(l, b),
                dist: dt
            };
        }

        SunCalc.getMoonPosition = function (date, lat, lng) {

            var lw = rad * -lng,
                phi = rad * lat,
                d = toDays(date),

                c = moonCoords(d),
                H = siderealTime(d, lw) - c.ra,
                h = altitude(H, phi, c.dec),
                // formula 14.1 of "Astronomical Algorithms" 2nd edition by Jean Meeus (Willmann-Bell, Richmond) 1998.
                pa = atan(sin(H), tan(phi) * cos(c.dec) - sin(c.dec) * cos(H));

            h = h + astroRefraction(h); // altitude correction for refraction

            return {
                azimuth: azimuth(H, phi, c.dec),
                altitude: h,
                distance: c.dist,
                parallacticAngle: pa
            };
        };


        // calculations for illumination parameters of the moon,
        // based on http://idlastro.gsfc.nasa.gov/ftp/pro/astro/mphase.pro formulas and
        // Chapter 48 of "Astronomical Algorithms" 2nd edition by Jean Meeus (Willmann-Bell, Richmond) 1998.

        SunCalc.getMoonIllumination = function (date) {

            var d = toDays(date || new Date()),
                s = sunCoords(d),
                m = moonCoords(d),

                sdist = 149598000, // distance from Earth to Sun in km

                phi = acos(sin(s.dec) * sin(m.dec) + cos(s.dec) * cos(m.dec) * cos(s.ra - m.ra)),
                inc = atan(sdist * sin(phi), m.dist - sdist * cos(phi)),
                angle = atan(cos(s.dec) * sin(s.ra - m.ra), sin(s.dec) * cos(m.dec) -
                    cos(s.dec) * sin(m.dec) * cos(s.ra - m.ra));

            return {
                fraction: (1 + cos(inc)) / 2,
                phase: 0.5 + 0.5 * inc * (angle < 0 ? -1 : 1) / Math.PI,
                angle: angle
            };
        };


        function hoursLater(date, h) {
            return new Date(date.valueOf() + h * dayMs / 24);
        }

        // calculations for moon rise/set times are based on http://www.stargazing.net/kepler/moonrise.html article

        SunCalc.getMoonTimes = function (date, lat, lng, inUTC) {
            var t = new Date(date);
            if (inUTC) t.setUTCHours(0, 0, 0, 0);
            else t.setHours(0, 0, 0, 0);

            var hc = 0.133 * rad,
                h0 = SunCalc.getMoonPosition(t, lat, lng).altitude - hc,
                h1, h2, rise, set, a, b, xe, ye, d, roots, x1, x2, dx;

            // go in 2-hour chunks, each time seeing if a 3-point quadratic curve crosses zero (which means rise or set)
            for (var i = 1; i <= 24; i += 2) {
                h1 = SunCalc.getMoonPosition(hoursLater(t, i), lat, lng).altitude - hc;
                h2 = SunCalc.getMoonPosition(hoursLater(t, i + 1), lat, lng).altitude - hc;

                a = (h0 + h2) / 2 - h1;
                b = (h2 - h0) / 2;
                xe = -b / (2 * a);
                ye = (a * xe + b) * xe + h1;
                d = b * b - 4 * a * h1;
                roots = 0;

                if (d >= 0) {
                    dx = Math.sqrt(d) / (Math.abs(a) * 2);
                    x1 = xe - dx;
                    x2 = xe + dx;
                    if (Math.abs(x1) <= 1) roots++;
                    if (Math.abs(x2) <= 1) roots++;
                    if (x1 < -1) x1 = x2;
                }

                if (roots === 1) {
                    if (h0 < 0) rise = i + x1;
                    else set = i + x1;

                } else if (roots === 2) {
                    rise = i + (ye < 0 ? x2 : x1);
                    set = i + (ye < 0 ? x1 : x2);
                }

                if (rise && set) break;

                h0 = h2;
            }

            var result = {};

            if (rise) result.rise = hoursLater(t, rise);
            if (set) result.set = hoursLater(t, set);

            if (!rise && !set) result[ye > 0 ? 'alwaysUp' : 'alwaysDown'] = true;

            return result;
        };


    // export as Node module / AMD module / browser variable
        module.exports = SunCalc;

    }());
    });

    /**
     * @param {string} localStorageKey The localStorageKey this should be saved under.
     * @param initial The initial value.
     * @returns A writable store, with a get method.
     *  If the initial value is an array, the push method is added.
     *  If the initial value is a date, the value when read from local storage is parsed into a date.
     */
    function storable(localStorageKey, initial) {
        if (typeof storable.usedKeys == 'undefined') {
            // It has not... perform the initialization
            storable.usedKeys = [];
        }
        if (storable.usedKeys.includes(localStorageKey)) {
            console.log('Err: cannot use the same key');
        }
        storable.usedKeys.push();
        let initial_value = JSON.parse(localStorage[localStorageKey] ? localStorage[localStorageKey] : JSON.stringify(initial));
        if (initial instanceof Date) {
            console.log(initial_value);
            const b = initial_value.split(/\D+/);
            initial_value = new Date(Date.UTC(b[0], --b[1], b[2], b[3], b[4], b[5], b[6]));
        }
        const ret = writable(initial_value);
        ret.subscribe((value) => localStorage.setItem(localStorageKey, JSON.stringify(value)));
        if (Array.isArray(initial_value)) {
            ret.push = (push_me) => ret.update(e => {
                e.push(push_me);
                return e;
            });
        }
        ret.get = () => get_store_value(ret);
        return ret;
    }
    const timeOffset = storable('timeOffset', 0);
    const times = suncalc.getTimes(new Date(new Date().getTime() + timeOffset.get() * 60 * 60 * 1000), 39.1532, -77.0669);
    let today_sunset = times.sunset;
    let today_sunrise = times.sunrise;

    const darkMode = readable(new Date() <= today_sunrise || new Date() > today_sunset, set => {
        const update = () => {
            let dm, now = new Date(new Date().getTime() + timeOffset.get() * 60 * 60 * 1000);
            if (get_store_value(forceMode) === 'Light') dm = false;
            else if (get_store_value(forceMode) === 'Dark') dm = true;
            else if (get_store_value(forceMode) === 'Adaptive') {
                const times = suncalc.getTimes(now, 39.1532, -77.0669);
                today_sunset = times.sunset;
                today_sunrise = times.sunrise;
                dm = (now <= today_sunrise || now > today_sunset);
            }
            set(dm);
            window.document.body.style.backgroundColor = dm ? '#42514f' : '';
        };
        update();
        const interval = setInterval(update, 1000);
        return () => clearInterval(interval);
    });

    const twelveCorrectiveFactor = storable('timeOffset', 1);

    const forceMode = writable('Adaptive');

    /* SvelteComponents\Gauge.svelte generated by Svelte v3.38.2 */
    const file$a = "SvelteComponents\\Gauge.svelte";

    function create_fragment$a(ctx) {
    	let div0;
    	let t0;
    	let div1;
    	let t1;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			t0 = space();
    			div1 = element("div");
    			t1 = text(/*name*/ ctx[0]);
    			attr_dev(div0, "class", "gauge-container svelte-1mfgm47");
    			set_style(div0, "height", /*height*/ ctx[2]);
    			add_location(div0, file$a, 36, 0, 1164);
    			set_style(div1, "margin", "0");
    			set_style(div1, "font-size", /*fontSize*/ ctx[3]);
    			set_style(div1, "color", /*$darkMode*/ ctx[4] ? "#c5c5c5" : "");
    			add_location(div1, file$a, 37, 0, 1246);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			/*div0_binding*/ ctx[11](div0);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div1, anchor);
    			append_dev(div1, t1);

    			if (!mounted) {
    				dispose = listen_dev(window, "resize", /*resize*/ ctx[5], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*height*/ 4) {
    				set_style(div0, "height", /*height*/ ctx[2]);
    			}

    			if (dirty & /*name*/ 1) set_data_dev(t1, /*name*/ ctx[0]);

    			if (dirty & /*fontSize*/ 8) {
    				set_style(div1, "font-size", /*fontSize*/ ctx[3]);
    			}

    			if (dirty & /*$darkMode*/ 16) {
    				set_style(div1, "color", /*$darkMode*/ ctx[4] ? "#c5c5c5" : "");
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			/*div0_binding*/ ctx[11](null);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div1);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$a.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$a($$self, $$props, $$invalidate) {
    	let $darkMode;
    	validate_store(darkMode, "darkMode");
    	component_subscribe($$self, darkMode, $$value => $$invalidate(4, $darkMode = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Gauge", slots, []);
    	let { name = "No name given" } = $$props;
    	let { bounds = [0, 10] } = $$props;
    	let { colorBounds = bounds } = $$props;
    	let { value = bounds[0] } = $$props;
    	let { digits = 3 - (bounds[1] + "").split(".")[0].length } = $$props;
    	let gaugeElement;
    	let gaugeObject;

    	const resize = () => {
    		$$invalidate(2, height = gaugeElement.offsetWidth * 0.85 + "px");
    		$$invalidate(3, fontSize = Math.min(gaugeElement.offsetWidth / name.length * 1.4, 18) + "px");
    	};

    	onMount(() => {
    		$$invalidate(10, gaugeObject = gauge_min(gaugeElement, {
    			max: bounds[1],
    			min: bounds[0],
    			label: value => value.toFixed(digits),
    			color: value => getColor(value, $darkMode, colorBounds[1], colorBounds[0])
    		}));

    		if (value) gaugeObject.setValue(value);
    		resize();
    	});

    	let height = "12vw";
    	let fontSize = "16px";
    	const writable_props = ["name", "bounds", "colorBounds", "value", "digits"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Gauge> was created with unknown prop '${key}'`);
    	});

    	function div0_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			gaugeElement = $$value;
    			$$invalidate(1, gaugeElement);
    		});
    	}

    	$$self.$$set = $$props => {
    		if ("name" in $$props) $$invalidate(0, name = $$props.name);
    		if ("bounds" in $$props) $$invalidate(6, bounds = $$props.bounds);
    		if ("colorBounds" in $$props) $$invalidate(7, colorBounds = $$props.colorBounds);
    		if ("value" in $$props) $$invalidate(8, value = $$props.value);
    		if ("digits" in $$props) $$invalidate(9, digits = $$props.digits);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		Gauge: gauge_min,
    		getColor,
    		darkMode,
    		name,
    		bounds,
    		colorBounds,
    		value,
    		digits,
    		gaugeElement,
    		gaugeObject,
    		resize,
    		height,
    		fontSize,
    		$darkMode
    	});

    	$$self.$inject_state = $$props => {
    		if ("name" in $$props) $$invalidate(0, name = $$props.name);
    		if ("bounds" in $$props) $$invalidate(6, bounds = $$props.bounds);
    		if ("colorBounds" in $$props) $$invalidate(7, colorBounds = $$props.colorBounds);
    		if ("value" in $$props) $$invalidate(8, value = $$props.value);
    		if ("digits" in $$props) $$invalidate(9, digits = $$props.digits);
    		if ("gaugeElement" in $$props) $$invalidate(1, gaugeElement = $$props.gaugeElement);
    		if ("gaugeObject" in $$props) $$invalidate(10, gaugeObject = $$props.gaugeObject);
    		if ("height" in $$props) $$invalidate(2, height = $$props.height);
    		if ("fontSize" in $$props) $$invalidate(3, fontSize = $$props.fontSize);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*gaugeObject, value*/ 1280) {
    			if (gaugeObject && value) gaugeObject.setValueAnimated(value);
    		}
    	};

    	return [
    		name,
    		gaugeElement,
    		height,
    		fontSize,
    		$darkMode,
    		resize,
    		bounds,
    		colorBounds,
    		value,
    		digits,
    		gaugeObject,
    		div0_binding
    	];
    }

    class Gauge_1 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$a, create_fragment$a, safe_not_equal, {
    			name: 0,
    			bounds: 6,
    			colorBounds: 7,
    			value: 8,
    			digits: 9
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Gauge_1",
    			options,
    			id: create_fragment$a.name
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
    const file$9 = "SvelteComponents\\TempGauge.svelte";

    function create_fragment$9(ctx) {
    	let svg;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			attr_dev(svg, "viewBox", "0 0 400 200");
    			set_style(svg, "width", "100%");
    			set_style(svg, "height", "23%");
    			add_location(svg, file$9, 178, 0, 4956);
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
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const centerX = 200;
    const centerY = 180;

    function instance$9($$self, $$props, $$invalidate) {
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
    		if (!data || !Q0Q4 || !Q1Q3) return;
    		const animationDuration = getContext("animationDuration");

    		const sorted = data.sort(function (a, b) {
    			return a - b;
    		});

    		const Q0 = sorted[0];
    		const Q1 = sorted[Math.round(data.length / 4)];
    		const Q3 = sorted[Math.round(3 * data.length / 4)];
    		const Q4 = sorted.last();

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
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<TempGauge> was created with unknown prop '${key}'`);
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
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, { data: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "TempGauge",
    			options,
    			id: create_fragment$9.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*data*/ ctx[1] === undefined && !("data" in props)) {
    			console.warn("<TempGauge> was created without expected prop 'data'");
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
    const file$8 = "SvelteComponents\\Graph.svelte";

    function create_fragment$8(ctx) {
    	let div;
    	let svg;

    	const block = {
    		c: function create() {
    			div = element("div");
    			svg = svg_element("svg");
    			attr_dev(svg, "class", "voltages svelte-1i2blxw");
    			attr_dev(svg, "viewBox", "0 0 400 100");
    			add_location(svg, file$8, 74, 4, 2199);
    			attr_dev(div, "class", "container svelte-1i2blxw");
    			set_style(div, "background-color", /*$darkMode*/ ctx[1] ? "darkgrey" : "#cccccc");
    			add_location(div, file$8, 73, 0, 2107);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, svg);
    			/*svg_binding*/ ctx[4](svg);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*$darkMode*/ 2) {
    				set_style(div, "background-color", /*$darkMode*/ ctx[1] ? "darkgrey" : "#cccccc");
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			/*svg_binding*/ ctx[4](null);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
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

    function instance$8($$self, $$props, $$invalidate) {
    	let $darkMode;
    	validate_store(darkMode, "darkMode");
    	component_subscribe($$self, darkMode, $$value => $$invalidate(1, $darkMode = $$value));
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

    	function update(_unused) {
    		for (let i = 0; i < objects.length; i++) {
    			$$invalidate(2, datas[i] = datas[i].slice(Math.max(datas[i].length - axisSettings[i].maxPoints, 0)), datas);

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
    				points: getPathString(datas[i], minY, maxY),
    				stroke: axisSettings[i].color
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
    		if ("axisSettings" in $$props) $$invalidate(3, axisSettings = $$props.axisSettings);
    		if ("datas" in $$props) $$invalidate(2, datas = $$props.datas);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		darkMode,
    		axisSettings,
    		datas,
    		element,
    		objects,
    		update,
    		getPathString,
    		$darkMode
    	});

    	$$self.$inject_state = $$props => {
    		if ("axisSettings" in $$props) $$invalidate(3, axisSettings = $$props.axisSettings);
    		if ("datas" in $$props) $$invalidate(2, datas = $$props.datas);
    		if ("element" in $$props) $$invalidate(0, element = $$props.element);
    		if ("objects" in $$props) objects = $$props.objects;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*datas*/ 4) {
    			update();
    		}
    	};

    	return [element, $darkMode, datas, axisSettings, svg_binding];
    }

    class Graph extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, { axisSettings: 3, datas: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Graph",
    			options,
    			id: create_fragment$8.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*axisSettings*/ ctx[3] === undefined && !("axisSettings" in props)) {
    			console.warn("<Graph> was created without expected prop 'axisSettings'");
    		}

    		if (/*datas*/ ctx[2] === undefined && !("datas" in props)) {
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
    const file$7 = "SvelteComponents\\Slider.svelte";

    // (14:0) {#if iconPath}
    function create_if_block$3(ctx) {
    	let img;
    	let img_src_value;

    	const block = {
    		c: function create() {
    			img = element("img");
    			if (img.src !== (img_src_value = /*iconPath*/ ctx[2])) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "yo mama lol");
    			set_style(img, "width", "100%");
    			set_style(img, "animation-play-state", /*value*/ ctx[0] == 0 ? "paused" : "running");
    			attr_dev(img, "class", "svelte-oh9cq3");
    			add_location(img, file$7, 14, 4, 384);
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
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(14:0) {#if iconPath}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$7(ctx) {
    	let div1;
    	let div0;
    	let t0;
    	let t1_value = /*value*/ ctx[0].toFixed(0) + "";
    	let t1;
    	let t2;
    	let t3;
    	let if_block_anchor;
    	let if_block = /*iconPath*/ ctx[2] && create_if_block$3(ctx);

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
    			attr_dev(div0, "class", "data svelte-oh9cq3");
    			set_style(div0, "height", /*value*/ ctx[0] + "%");
    			set_style(div0, "background-color", /*color*/ ctx[1]);
    			add_location(div0, file$7, 9, 4, 253);
    			attr_dev(div1, "class", "outline svelte-oh9cq3");
    			set_style(div1, "border-color", /*$darkMode*/ ctx[3] ? "#c5c5c5" : "");
    			set_style(div1, "color", /*$darkMode*/ ctx[3] ? "#c5c5c5" : "");
    			add_location(div1, file$7, 8, 0, 137);
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

    			if (dirty & /*$darkMode*/ 8) {
    				set_style(div1, "border-color", /*$darkMode*/ ctx[3] ? "#c5c5c5" : "");
    			}

    			if (dirty & /*$darkMode*/ 8) {
    				set_style(div1, "color", /*$darkMode*/ ctx[3] ? "#c5c5c5" : "");
    			}

    			if (/*iconPath*/ ctx[2]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$3(ctx);
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
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let $darkMode;
    	validate_store(darkMode, "darkMode");
    	component_subscribe($$self, darkMode, $$value => $$invalidate(3, $darkMode = $$value));
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

    	$$self.$capture_state = () => ({
    		darkMode,
    		value,
    		color,
    		iconPath,
    		$darkMode
    	});

    	$$self.$inject_state = $$props => {
    		if ("value" in $$props) $$invalidate(0, value = $$props.value);
    		if ("color" in $$props) $$invalidate(1, color = $$props.color);
    		if ("iconPath" in $$props) $$invalidate(2, iconPath = $$props.iconPath);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [value, color, iconPath, $darkMode];
    }

    class Slider extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, { value: 0, color: 1, iconPath: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Slider",
    			options,
    			id: create_fragment$7.name
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

    /* SvelteComponents\Message.svelte generated by Svelte v3.38.2 */
    const file$6 = "SvelteComponents\\Message.svelte";

    // (8:0) {#if shown}
    function create_if_block$2(ctx) {
    	let div;
    	let t0;
    	let br;
    	let t1;
    	let button;
    	let div_outro;
    	let current;
    	let mounted;
    	let dispose;
    	const default_slot_template = /*#slots*/ ctx[3].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[2], null);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (default_slot) default_slot.c();
    			t0 = space();
    			br = element("br");
    			t1 = space();
    			button = element("button");
    			button.textContent = "Select another port...";
    			add_location(br, file$6, 9, 8, 231);
    			add_location(button, file$6, 10, 4, 241);
    			attr_dev(div, "class", "container svelte-1ai26fn");
    			add_location(div, file$6, 8, 4, 160);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			append_dev(div, t0);
    			append_dev(div, br);
    			append_dev(div, t1);
    			append_dev(div, button);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler*/ ctx[4], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 4)) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[2], dirty, null, null);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			if (div_outro) div_outro.end(1);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			div_outro = create_out_transition(div, fade, { duration: 3000 });
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (default_slot) default_slot.d(detaching);
    			if (detaching && div_outro) div_outro.end();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(8:0) {#if shown}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$6(ctx) {
    	let if_block_anchor;
    	let current;
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
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Message", slots, ['default']);
    	let { shown = false } = $$props;

    	let { onClose = () => {
    		
    	} } = $$props;

    	const writable_props = ["shown", "onClose"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Message> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => {
    		onClose();
    		$$invalidate(0, shown = false);
    	};

    	$$self.$$set = $$props => {
    		if ("shown" in $$props) $$invalidate(0, shown = $$props.shown);
    		if ("onClose" in $$props) $$invalidate(1, onClose = $$props.onClose);
    		if ("$$scope" in $$props) $$invalidate(2, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({ fade, shown, onClose });

    	$$self.$inject_state = $$props => {
    		if ("shown" in $$props) $$invalidate(0, shown = $$props.shown);
    		if ("onClose" in $$props) $$invalidate(1, onClose = $$props.onClose);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [shown, onClose, $$scope, slots, click_handler];
    }

    class Message extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, { shown: 0, onClose: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Message",
    			options,
    			id: create_fragment$6.name
    		});
    	}

    	get shown() {
    		throw new Error("<Message>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set shown(value) {
    		throw new Error("<Message>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get onClose() {
    		throw new Error("<Message>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set onClose(value) {
    		throw new Error("<Message>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* SvelteComponents\Console.svelte generated by Svelte v3.38.2 */
    const file$5 = "SvelteComponents\\Console.svelte";

    function create_fragment$5(ctx) {
    	let textarea_1;
    	let textarea_1_class_value;

    	const block = {
    		c: function create() {
    			textarea_1 = element("textarea");
    			textarea_1.readOnly = true;
    			attr_dev(textarea_1, "class", textarea_1_class_value = "" + (null_to_empty(/*$darkMode*/ ctx[2] ? "darkIsland" : "island") + " svelte-1l72aks"));
    			set_style(textarea_1, "color", /*$darkMode*/ ctx[2] ? "#c5c5c5" : "black");
    			textarea_1.value = /*text*/ ctx[0];
    			add_location(textarea_1, file$5, 10, 0, 198);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, textarea_1, anchor);
    			/*textarea_1_binding*/ ctx[3](textarea_1);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*$darkMode*/ 4 && textarea_1_class_value !== (textarea_1_class_value = "" + (null_to_empty(/*$darkMode*/ ctx[2] ? "darkIsland" : "island") + " svelte-1l72aks"))) {
    				attr_dev(textarea_1, "class", textarea_1_class_value);
    			}

    			if (dirty & /*$darkMode*/ 4) {
    				set_style(textarea_1, "color", /*$darkMode*/ ctx[2] ? "#c5c5c5" : "black");
    			}

    			if (dirty & /*text*/ 1) {
    				prop_dev(textarea_1, "value", /*text*/ ctx[0]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(textarea_1);
    			/*textarea_1_binding*/ ctx[3](null);
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
    	let $darkMode;
    	validate_store(darkMode, "darkMode");
    	component_subscribe($$self, darkMode, $$value => $$invalidate(2, $darkMode = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Console", slots, []);
    	let { text } = $$props;
    	let textarea;
    	const writable_props = ["text"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Console> was created with unknown prop '${key}'`);
    	});

    	function textarea_1_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			textarea = $$value;
    			($$invalidate(1, textarea), $$invalidate(0, text));
    		});
    	}

    	$$self.$$set = $$props => {
    		if ("text" in $$props) $$invalidate(0, text = $$props.text);
    	};

    	$$self.$capture_state = () => ({ darkMode, text, textarea, $darkMode });

    	$$self.$inject_state = $$props => {
    		if ("text" in $$props) $$invalidate(0, text = $$props.text);
    		if ("textarea" in $$props) $$invalidate(1, textarea = $$props.textarea);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*text, textarea*/ 3) {
    			if (text && textarea) {
    				$$invalidate(1, textarea.scrollTop = textarea.scrollHeight, textarea);
    			}
    		}
    	};

    	return [text, textarea, $darkMode, textarea_1_binding];
    }

    class Console extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, { text: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Console",
    			options,
    			id: create_fragment$5.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*text*/ ctx[0] === undefined && !("text" in props)) {
    			console.warn("<Console> was created without expected prop 'text'");
    		}
    	}

    	get text() {
    		throw new Error("<Console>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set text(value) {
    		throw new Error("<Console>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* SvelteComponents\LEDSelector.svelte generated by Svelte v3.38.2 */
    const file$4 = "SvelteComponents\\LEDSelector.svelte";

    function create_fragment$4(ctx) {
    	let div1;
    	let div0;
    	let t0;
    	let h4;
    	let t1_value = /*patterns*/ ctx[2][/*pattern_index*/ ctx[0]] + "";
    	let t1;
    	let t2;
    	let i;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			t0 = text("Current LED Pattern:\r\n        ");
    			h4 = element("h4");
    			t1 = text(t1_value);
    			t2 = space();
    			i = element("i");
    			i.textContent = "Tap to select the next pattern";
    			set_style(h4, "width", "100%");
    			set_style(h4, "text-align", "center");
    			set_style(h4, "font-weight", "bolder");
    			set_style(h4, "margin", ".156vw 0 .156vw 0");
    			set_style(h4, "font-size", "1.8vw");
    			add_location(h4, file$4, 30, 8, 979);
    			set_style(i, "font-size", ".93vw");
    			add_location(i, file$4, 32, 8, 1146);
    			set_style(div0, "color", /*$darkMode*/ ctx[1] ? "#c5c5c5" : "");
    			set_style(div0, "font-size", "1.3vw");
    			add_location(div0, file$4, 28, 4, 873);
    			attr_dev(div1, "class", "container svelte-1ldo26q");
    			set_style(div1, "background", /*$darkMode*/ ctx[1] ? "#383838" : "#cccccc");
    			set_style(div1, "box-shadow", ".39vw .39vw .625vw .156vw " + (/*$darkMode*/ ctx[1] ? "#2a2a2a" : "#6B6B6B"));
    			add_location(div1, file$4, 25, 0, 642);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, t0);
    			append_dev(div0, h4);
    			append_dev(h4, t1);
    			append_dev(div0, t2);
    			append_dev(div0, i);

    			if (!mounted) {
    				dispose = listen_dev(div1, "click", /*increment_pattern*/ ctx[3], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*pattern_index*/ 1 && t1_value !== (t1_value = /*patterns*/ ctx[2][/*pattern_index*/ ctx[0]] + "")) set_data_dev(t1, t1_value);

    			if (dirty & /*$darkMode*/ 2) {
    				set_style(div0, "color", /*$darkMode*/ ctx[1] ? "#c5c5c5" : "");
    			}

    			if (dirty & /*$darkMode*/ 2) {
    				set_style(div1, "background", /*$darkMode*/ ctx[1] ? "#383838" : "#cccccc");
    			}

    			if (dirty & /*$darkMode*/ 2) {
    				set_style(div1, "box-shadow", ".39vw .39vw .625vw .156vw " + (/*$darkMode*/ ctx[1] ? "#2a2a2a" : "#6B6B6B"));
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			mounted = false;
    			dispose();
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
    	let $darkMode;
    	validate_store(darkMode, "darkMode");
    	component_subscribe($$self, darkMode, $$value => $$invalidate(1, $darkMode = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("LEDSelector", slots, []);
    	const { ipcRenderer } = require("electron");
    	let patterns = ["Voltage Mode", "Hue Rotation", "Crazy Colors", "Solid"];
    	let pattern_index = 0;

    	function increment_pattern() {
    		$$invalidate(0, pattern_index = pattern_index + 1);
    		if (pattern_index === patterns.length) $$invalidate(0, pattern_index = 0);
    		ipcRenderer.send("led_select", pattern_index);
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<LEDSelector> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		darkMode,
    		ipcRenderer,
    		patterns,
    		pattern_index,
    		increment_pattern,
    		$darkMode
    	});

    	$$self.$inject_state = $$props => {
    		if ("patterns" in $$props) $$invalidate(2, patterns = $$props.patterns);
    		if ("pattern_index" in $$props) $$invalidate(0, pattern_index = $$props.pattern_index);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [pattern_index, $darkMode, patterns, increment_pattern];
    }

    class LEDSelector extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "LEDSelector",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* SvelteComponents\Snake.svelte generated by Svelte v3.38.2 */
    const file$3 = "SvelteComponents\\Snake.svelte";

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[27] = list[i];
    	return child_ctx;
    }

    function get_each_context_1$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[30] = list[i];
    	return child_ctx;
    }

    // (128:12) {#each row as col}
    function create_each_block_1$2(ctx) {
    	let td;

    	const block = {
    		c: function create() {
    			td = element("td");
    			set_style(td, "background-color", ["inherit", "green", "red"][/*col*/ ctx[30]]);
    			set_style(td, "border-style", /*showDashes*/ ctx[4] ? "dashed" : "inherit");
    			set_style(td, "height", /*pixelSize*/ ctx[5]);
    			set_style(td, "width", /*pixelSize*/ ctx[5]);
    			set_style(td, "border-radius", /*showDashes*/ ctx[4] ? "inherit" : "10px");
    			attr_dev(td, "class", "svelte-a5ovh");
    			add_location(td, file$3, 128, 16, 4605);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, td, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*gameBoard*/ 2) {
    				set_style(td, "background-color", ["inherit", "green", "red"][/*col*/ ctx[30]]);
    			}

    			if (dirty[0] & /*showDashes*/ 16) {
    				set_style(td, "border-style", /*showDashes*/ ctx[4] ? "dashed" : "inherit");
    			}

    			if (dirty[0] & /*pixelSize*/ 32) {
    				set_style(td, "height", /*pixelSize*/ ctx[5]);
    			}

    			if (dirty[0] & /*pixelSize*/ 32) {
    				set_style(td, "width", /*pixelSize*/ ctx[5]);
    			}

    			if (dirty[0] & /*showDashes*/ 16) {
    				set_style(td, "border-radius", /*showDashes*/ ctx[4] ? "inherit" : "10px");
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(td);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1$2.name,
    		type: "each",
    		source: "(128:12) {#each row as col}",
    		ctx
    	});

    	return block;
    }

    // (126:4) {#each gameBoard as row}
    function create_each_block$2(ctx) {
    	let tr;
    	let t;
    	let each_value_1 = /*row*/ ctx[27];
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1$2(get_each_context_1$2(ctx, each_value_1, i));
    	}

    	const block = {
    		c: function create() {
    			tr = element("tr");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t = space();
    			add_location(tr, file$3, 126, 8, 4551);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, tr, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(tr, null);
    			}

    			append_dev(tr, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*gameBoard, showDashes, pixelSize*/ 50) {
    				each_value_1 = /*row*/ ctx[27];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1$2(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_1$2(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(tr, t);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_1.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(tr);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$2.name,
    		type: "each",
    		source: "(126:4) {#each gameBoard as row}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let table;
    	let t0;
    	let br0;
    	let t1;
    	let br1;
    	let t2;
    	let div0;
    	let button0;
    	let t4;
    	let div1;
    	let button1;
    	let t6;
    	let div2;
    	let button2;
    	let t7_value = (/*showDashes*/ ctx[4] ? "Hide Grid" : "Show Grid") + "";
    	let t7;
    	let t8;
    	let input;
    	let t9;
    	let div3;
    	let t10;
    	let t11;
    	let t12;
    	let div4;
    	let t13;
    	let mounted;
    	let dispose;
    	let each_value = /*gameBoard*/ ctx[1];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			table = element("table");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t0 = space();
    			br0 = element("br");
    			t1 = space();
    			br1 = element("br");
    			t2 = space();
    			div0 = element("div");
    			button0 = element("button");
    			button0.textContent = "Close";
    			t4 = space();
    			div1 = element("div");
    			button1 = element("button");
    			button1.textContent = "Reset";
    			t6 = space();
    			div2 = element("div");
    			button2 = element("button");
    			t7 = text(t7_value);
    			t8 = space();
    			input = element("input");
    			t9 = space();
    			div3 = element("div");
    			t10 = text("Score: ");
    			t11 = text(/*targetLength*/ ctx[2]);
    			t12 = space();
    			div4 = element("div");
    			t13 = text(/*status_box*/ ctx[3]);
    			set_style(table, "background-color", "lightgrey");
    			set_style(table, "box-shadow", "3px 5px 10px 10px grey");
    			add_location(table, file$3, 124, 0, 4432);
    			add_location(br0, file$3, 137, 0, 4944);
    			add_location(br1, file$3, 138, 0, 4950);
    			add_location(button0, file$3, 140, 4, 4997);
    			set_style(div0, "display", "inline-block");
    			add_location(div0, file$3, 139, 0, 4956);
    			add_location(button1, file$3, 143, 4, 5112);
    			set_style(div1, "display", "inline-block");
    			add_location(div1, file$3, 142, 0, 5071);
    			add_location(button2, file$3, 146, 4, 5207);
    			set_style(div2, "display", "inline-block");
    			add_location(div2, file$3, 145, 0, 5166);
    			attr_dev(input, "type", "number");
    			attr_dev(input, "max", "25");
    			attr_dev(input, "min", "4");
    			add_location(input, file$3, 148, 0, 5316);
    			set_style(div3, "display", "inline-block");
    			add_location(div3, file$3, 149, 0, 5379);
    			set_style(div4, "display", "inline-block");
    			add_location(div4, file$3, 152, 0, 5451);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, table, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(table, null);
    			}

    			insert_dev(target, t0, anchor);
    			insert_dev(target, br0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, br1, anchor);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, div0, anchor);
    			append_dev(div0, button0);
    			insert_dev(target, t4, anchor);
    			insert_dev(target, div1, anchor);
    			append_dev(div1, button1);
    			insert_dev(target, t6, anchor);
    			insert_dev(target, div2, anchor);
    			append_dev(div2, button2);
    			append_dev(button2, t7);
    			insert_dev(target, t8, anchor);
    			insert_dev(target, input, anchor);
    			set_input_value(input, /*boardSize*/ ctx[0]);
    			insert_dev(target, t9, anchor);
    			insert_dev(target, div3, anchor);
    			append_dev(div3, t10);
    			append_dev(div3, t11);
    			insert_dev(target, t12, anchor);
    			insert_dev(target, div4, anchor);
    			append_dev(div4, t13);

    			if (!mounted) {
    				dispose = [
    					listen_dev(window, "keydown", /*handleKeyboard*/ ctx[8], false, false, false),
    					listen_dev(window, "touchstart", /*handleTouchStart*/ ctx[9], false, false, false),
    					listen_dev(window, "touchend", /*handleTouchEnd*/ ctx[10], false, false, false),
    					listen_dev(button0, "click", /*click_handler*/ ctx[11], false, false, false),
    					listen_dev(button1, "click", /*start_over*/ ctx[7], false, false, false),
    					listen_dev(button2, "click", /*click_handler_1*/ ctx[12], false, false, false),
    					listen_dev(input, "input", /*input_input_handler*/ ctx[13])
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*gameBoard, showDashes, pixelSize*/ 50) {
    				each_value = /*gameBoard*/ ctx[1];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$2(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$2(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(table, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty[0] & /*showDashes*/ 16 && t7_value !== (t7_value = (/*showDashes*/ ctx[4] ? "Hide Grid" : "Show Grid") + "")) set_data_dev(t7, t7_value);

    			if (dirty[0] & /*boardSize*/ 1 && to_number(input.value) !== /*boardSize*/ ctx[0]) {
    				set_input_value(input, /*boardSize*/ ctx[0]);
    			}

    			if (dirty[0] & /*targetLength*/ 4) set_data_dev(t11, /*targetLength*/ ctx[2]);
    			if (dirty[0] & /*status_box*/ 8) set_data_dev(t13, /*status_box*/ ctx[3]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(table);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(br0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(br1);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t4);
    			if (detaching) detach_dev(div1);
    			if (detaching) detach_dev(t6);
    			if (detaching) detach_dev(div2);
    			if (detaching) detach_dev(t8);
    			if (detaching) detach_dev(input);
    			if (detaching) detach_dev(t9);
    			if (detaching) detach_dev(div3);
    			if (detaching) detach_dev(t12);
    			if (detaching) detach_dev(div4);
    			mounted = false;
    			run_all(dispose);
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

    function instance$3($$self, $$props, $$invalidate) {
    	let pixelSize;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Snake", slots, []);
    	const dispatch = createEventDispatcher();
    	let boardSize = 8;

    	let gameBoard,
    		appleLocation,
    		targetLength,
    		currentLength,
    		timeout,
    		loopLen,
    		direction,
    		status_box;

    	const presses = [];

    	function start_over() {
    		headLocation.x = 1;
    		headLocation.y = 1;
    		$$invalidate(2, targetLength = 3);
    		currentLength = 0;
    		segments.length = 0;
    		loopLen = 500;
    		$$invalidate(1, gameBoard = Array(boardSize).fill().map(() => Array(boardSize).fill(0)));
    		appleLocation = makeApple();
    		direction = "Right";
    		clearTimeout(timeout);
    		animation_loop();
    		$$invalidate(3, status_box = "");
    	}

    	const headLocation = { "x": 3, "y": 3 };
    	const segments = [];
    	const appleEquality = (a1, a2) => a1.x === a2.x && a1.y === a2.y;

    	function makeApple() {
    		if (currentLength >= boardSize * boardSize - 1) {
    			$$invalidate(3, status_box = "You win or something...");
    			return;
    		}

    		let app = {
    			"x": Math.floor(Math.random() * boardSize),
    			"y": Math.floor(Math.random() * boardSize)
    		};

    		while (gameBoard[app.x][app.y] !== 0) {
    			app = {
    				"x": Math.floor(Math.random() * boardSize),
    				"y": Math.floor(Math.random() * boardSize)
    			};
    		}

    		$$invalidate(1, gameBoard[app.x][app.y] = 2, gameBoard);
    		return app;
    	}

    	start_over();

    	function animation_loop() {
    		direction = presses.length > 0 ? presses.shift() : direction;
    		headLocation.y += (direction === "Right") - (direction === "Left");
    		headLocation.x += (direction === "Down") - (direction === "Up");

    		if (headLocation.x >= 0 && headLocation.x < boardSize && headLocation.y >= 0 && headLocation.y < boardSize && gameBoard[headLocation.x][headLocation.y] !== 1) {
    			if (appleEquality(headLocation, appleLocation)) {
    				appleLocation = makeApple();
    				loopLen = Math.max(200, loopLen / 1.025);
    				$$invalidate(2, targetLength += 3);
    			}

    			segments.push(JSON.parse(JSON.stringify(headLocation)));
    			$$invalidate(1, gameBoard[headLocation.x][headLocation.y] = 1, gameBoard);
    			currentLength++;

    			if (currentLength > targetLength) {
    				const tailLocation = segments.shift();
    				$$invalidate(1, gameBoard[tailLocation.x][tailLocation.y] = 0, gameBoard);
    				currentLength--;
    			}

    			if (currentLength >= boardSize * boardSize - 1) {
    				$$invalidate(3, status_box = "You win or something...");
    			} else timeout = setTimeout(animation_loop, loopLen);
    		} else {
    			$$invalidate(3, status_box = "You lose lol. Score: " + targetLength);
    		}
    	}

    	function handleKeyboard(e) {
    		doInput(e.key.substring(5));
    	}

    	function doInput(new_d) {
    		const opposites = {
    			"Up": "Down",
    			"Down": "Up",
    			"Right": "Left",
    			"Left": "Right"
    		};

    		if (!(new_d in opposites)) return;
    		let last_d = direction;
    		if (presses.length > 0) last_d = presses.last();

    		//Cannot be the same direction as the previous commanded, cannot be in an opposite direction.
    		if (new_d === last_d) return;

    		if (new_d === opposites[last_d]) return;
    		presses.push(new_d);
    		while (presses.length > 2) presses.shift();
    	}

    	let start;

    	function handleTouchStart(e) {
    		start = [e.changedTouches[0].clientX, e.changedTouches[0].clientY];
    	}

    	function handleTouchEnd(e) {
    		const end = [e.changedTouches[0].clientX, e.changedTouches[0].clientY];
    		const deltaX = end[0] - start[0];
    		const deltaY = end[1] - start[1];
    		const angle = Math.atan2(-deltaY, deltaX) / Math.PI * 180;
    		if (45 > angle && angle > -45) doInput("Right");
    		if (135 > angle && angle > 45) doInput("Up");
    		if (-45 > angle && angle > -135) doInput("Down");
    		if (-135 > angle || angle > 135) doInput("Left");
    	}

    	let showDashes = true;
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Snake> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => dispatch("closeOverlay");
    	const click_handler_1 = () => $$invalidate(4, showDashes = !showDashes);

    	function input_input_handler() {
    		boardSize = to_number(this.value);
    		$$invalidate(0, boardSize);
    	}

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		dispatch,
    		boardSize,
    		gameBoard,
    		appleLocation,
    		targetLength,
    		currentLength,
    		timeout,
    		loopLen,
    		direction,
    		status_box,
    		presses,
    		start_over,
    		headLocation,
    		segments,
    		appleEquality,
    		makeApple,
    		animation_loop,
    		handleKeyboard,
    		doInput,
    		start,
    		handleTouchStart,
    		handleTouchEnd,
    		showDashes,
    		pixelSize
    	});

    	$$self.$inject_state = $$props => {
    		if ("boardSize" in $$props) $$invalidate(0, boardSize = $$props.boardSize);
    		if ("gameBoard" in $$props) $$invalidate(1, gameBoard = $$props.gameBoard);
    		if ("appleLocation" in $$props) appleLocation = $$props.appleLocation;
    		if ("targetLength" in $$props) $$invalidate(2, targetLength = $$props.targetLength);
    		if ("currentLength" in $$props) currentLength = $$props.currentLength;
    		if ("timeout" in $$props) timeout = $$props.timeout;
    		if ("loopLen" in $$props) loopLen = $$props.loopLen;
    		if ("direction" in $$props) direction = $$props.direction;
    		if ("status_box" in $$props) $$invalidate(3, status_box = $$props.status_box);
    		if ("start" in $$props) start = $$props.start;
    		if ("showDashes" in $$props) $$invalidate(4, showDashes = $$props.showDashes);
    		if ("pixelSize" in $$props) $$invalidate(5, pixelSize = $$props.pixelSize);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty[0] & /*boardSize*/ 1) {
    			start_over();
    		}

    		if ($$self.$$.dirty[0] & /*boardSize*/ 1) {
    			$$invalidate(5, pixelSize = (40 / boardSize).toFixed(2) + "vw");
    		}
    	};

    	return [
    		boardSize,
    		gameBoard,
    		targetLength,
    		status_box,
    		showDashes,
    		pixelSize,
    		dispatch,
    		start_over,
    		handleKeyboard,
    		handleTouchStart,
    		handleTouchEnd,
    		click_handler,
    		click_handler_1,
    		input_input_handler
    	];
    }

    class Snake extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {}, [-1, -1]);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Snake",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* SvelteComponents\Clock.svelte generated by Svelte v3.38.2 */
    const file$2 = "SvelteComponents\\Clock.svelte";

    function create_fragment$2(ctx) {
    	let div;
    	let t_value = /*time*/ ctx[0].toLocaleTimeString() + "";
    	let t;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t = text(t_value);
    			set_style(div, "text-align", "center");
    			set_style(div, "font-size", "3vw");
    			set_style(div, "margin-top", "1.2vw");
    			set_style(div, "font-weight", "bolder");
    			set_style(div, "color", /*$darkMode*/ ctx[1] ? "#c5c5c5" : "");
    			add_location(div, file$2, 15, 0, 444);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*time*/ 1 && t_value !== (t_value = /*time*/ ctx[0].toLocaleTimeString() + "")) set_data_dev(t, t_value);

    			if (dirty & /*$darkMode*/ 2) {
    				set_style(div, "color", /*$darkMode*/ ctx[1] ? "#c5c5c5" : "");
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
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

    function instance$2($$self, $$props, $$invalidate) {
    	let $timeOffset;
    	let $darkMode;
    	validate_store(timeOffset, "timeOffset");
    	component_subscribe($$self, timeOffset, $$value => $$invalidate(2, $timeOffset = $$value));
    	validate_store(darkMode, "darkMode");
    	component_subscribe($$self, darkMode, $$value => $$invalidate(1, $darkMode = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Clock", slots, []);
    	let time = new Date(new Date().getTime() + $timeOffset * 60 * 60 * 1000);

    	onMount(() => {
    		const interval = setInterval(
    			() => {
    				$$invalidate(0, time = new Date(new Date().getTime() + $timeOffset * 60 * 60 * 1000));
    			},
    			330
    		);

    		return () => {
    			clearInterval(interval);
    		};
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Clock> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		onMount,
    		darkMode,
    		timeOffset,
    		time,
    		$timeOffset,
    		$darkMode
    	});

    	$$self.$inject_state = $$props => {
    		if ("time" in $$props) $$invalidate(0, time = $$props.time);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [time, $darkMode];
    }

    class Clock extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Clock",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* SvelteComponents\C4.svelte generated by Svelte v3.38.2 */

    const { console: console_1 } = globals;
    const file$1 = "SvelteComponents\\C4.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[11] = list[i];
    	child_ctx[13] = i;
    	return child_ctx;
    }

    function get_each_context_1$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[14] = list[i];
    	child_ctx[16] = i;
    	return child_ctx;
    }

    // (103:20) {#if col > 0}
    function create_if_block$1(ctx) {
    	let div;
    	let div_intro;
    	let div_outro;
    	let current;

    	const block = {
    		c: function create() {
    			div = element("div");
    			set_style(div, "background-color", ["", "blue", "red", "darkblue", "darkred"][/*col*/ ctx[14]]);
    			set_style(div, "height", "100%");
    			set_style(div, "width", "100%");
    			set_style(div, "border-radius", /*pixelSize*/ ctx[2] / 2 + "vw");
    			add_location(div, file$1, 103, 24, 4012);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (!current || dirty & /*gameBoard*/ 1) {
    				set_style(div, "background-color", ["", "blue", "red", "darkblue", "darkred"][/*col*/ ctx[14]]);
    			}

    			if (!current || dirty & /*pixelSize*/ 4) {
    				set_style(div, "border-radius", /*pixelSize*/ ctx[2] / 2 + "vw");
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (div_outro) div_outro.end(1);

    				if (!div_intro) div_intro = create_in_transition(div, fly, {
    					duration: Math.log((/*i*/ ctx[13] + 1) * 50) * 150,
    					y: -(/*i*/ ctx[13] + 1) * 60,
    					easing: bounceOut
    				});

    				div_intro.start();
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (div_intro) div_intro.invalidate();

    			div_outro = create_out_transition(div, fly, {
    				duration: 1500,
    				x: 1500 * (Math.random() - 0.5),
    				y: 1500 * (Math.random() - 0.5),
    				easing: sineIn
    			});

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (detaching && div_outro) div_outro.end();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(103:20) {#if col > 0}",
    		ctx
    	});

    	return block;
    }

    // (100:12) {#each row as col, j}
    function create_each_block_1$1(ctx) {
    	let td;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block = /*col*/ ctx[14] > 0 && create_if_block$1(ctx);

    	function click_handler() {
    		return /*click_handler*/ ctx[6](/*j*/ ctx[16]);
    	}

    	const block = {
    		c: function create() {
    			td = element("td");
    			if (if_block) if_block.c();
    			set_style(td, "height", /*pixelSize*/ ctx[2] + "vw");
    			set_style(td, "width", /*pixelSize*/ ctx[2] + "vw");
    			attr_dev(td, "class", "svelte-h2qk5l");
    			add_location(td, file$1, 100, 16, 3837);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, td, anchor);
    			if (if_block) if_block.m(td, null);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(td, "click", click_handler, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (/*col*/ ctx[14] > 0) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*gameBoard*/ 1) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$1(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(td, null);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}

    			if (!current || dirty & /*pixelSize*/ 4) {
    				set_style(td, "height", /*pixelSize*/ ctx[2] + "vw");
    			}

    			if (!current || dirty & /*pixelSize*/ 4) {
    				set_style(td, "width", /*pixelSize*/ ctx[2] + "vw");
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
    			if (detaching) detach_dev(td);
    			if (if_block) if_block.d();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1$1.name,
    		type: "each",
    		source: "(100:12) {#each row as col, j}",
    		ctx
    	});

    	return block;
    }

    // (98:4) {#each gameBoard as row, i}
    function create_each_block$1(ctx) {
    	let tr;
    	let t;
    	let current;
    	let each_value_1 = /*row*/ ctx[11];
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1$1(get_each_context_1$1(ctx, each_value_1, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			tr = element("tr");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t = space();
    			add_location(tr, file$1, 98, 8, 3780);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, tr, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(tr, null);
    			}

    			append_dev(tr, t);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*pixelSize, handleClick, gameBoard, Math, sineIn*/ 37) {
    				each_value_1 = /*row*/ ctx[11];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1$1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block_1$1(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(tr, t);
    					}
    				}

    				group_outros();

    				for (i = each_value_1.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value_1.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(tr);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(98:4) {#each gameBoard as row, i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let table;
    	let t0;
    	let br0;
    	let t1;
    	let br1;
    	let t2;
    	let div0;
    	let button0;
    	let t4;
    	let div1;
    	let button1;
    	let t6;
    	let div2;
    	let t7;
    	let current;
    	let mounted;
    	let dispose;
    	let each_value = /*gameBoard*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			table = element("table");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t0 = space();
    			br0 = element("br");
    			t1 = space();
    			br1 = element("br");
    			t2 = space();
    			div0 = element("div");
    			button0 = element("button");
    			button0.textContent = "Close";
    			t4 = space();
    			div1 = element("div");
    			button1 = element("button");
    			button1.textContent = "Reset";
    			t6 = space();
    			div2 = element("div");
    			t7 = text(/*status_box*/ ctx[1]);
    			set_style(table, "background-color", "lightgrey");
    			set_style(table, "box-shadow", "3px 5px 10px 10px grey");
    			add_location(table, file$1, 96, 0, 3658);
    			add_location(br0, file$1, 115, 0, 4585);
    			add_location(br1, file$1, 116, 0, 4591);
    			add_location(button0, file$1, 118, 4, 4638);
    			set_style(div0, "display", "inline-block");
    			add_location(div0, file$1, 117, 0, 4597);
    			add_location(button1, file$1, 121, 4, 4753);
    			set_style(div1, "display", "inline-block");
    			add_location(div1, file$1, 120, 0, 4712);
    			set_style(div2, "display", "inline-block");
    			add_location(div2, file$1, 123, 0, 4807);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, table, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(table, null);
    			}

    			insert_dev(target, t0, anchor);
    			insert_dev(target, br0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, br1, anchor);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, div0, anchor);
    			append_dev(div0, button0);
    			insert_dev(target, t4, anchor);
    			insert_dev(target, div1, anchor);
    			append_dev(div1, button1);
    			insert_dev(target, t6, anchor);
    			insert_dev(target, div2, anchor);
    			append_dev(div2, t7);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*click_handler_1*/ ctx[7], false, false, false),
    					listen_dev(button1, "click", /*start_over*/ ctx[4], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*gameBoard, pixelSize, handleClick, Math, sineIn*/ 37) {
    				each_value = /*gameBoard*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(table, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}

    			if (!current || dirty & /*status_box*/ 2) set_data_dev(t7, /*status_box*/ ctx[1]);
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(table);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(br0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(br1);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t4);
    			if (detaching) detach_dev(div1);
    			if (detaching) detach_dev(t6);
    			if (detaching) detach_dev(div2);
    			mounted = false;
    			run_all(dispose);
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
    	let pixelSize;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("C4", slots, []);
    	const dispatch = createEventDispatcher();
    	let gameBoard, status_box, currentTurn = false, win = false;

    	function start_over() {
    		$$invalidate(0, gameBoard = Array(6).fill(undefined).map(() => Array(7).fill(0)));
    		$$invalidate(1, status_box = (currentTurn ? "Player 2" : "Player 1") + " turn");
    		win = false;
    	}

    	start_over();

    	function handleClick(col) {
    		if (win) return start_over();
    		console.log(currentTurn ? "Player 2" : "Player 1", " clicked the box at row ", col);
    		let yloc = gameBoard.findIndex(e => e[col] !== 0) - 1;
    		if (yloc === -2) yloc = 5;
    		if (yloc === -1) return;
    		console.log(yloc);
    		$$invalidate(0, gameBoard[yloc][col] = currentTurn + 1, gameBoard);
    		currentTurn = !currentTurn;
    		$$invalidate(1, status_box = (currentTurn ? "Player 2" : "Player 1") + " turn");
    		checkForWins(1);
    		checkForWins(2);
    	}

    	function checkForWins(player) {
    		//Horizontal win
    		for (const col of gameBoard) {
    			for (let i = 0; i < 4; i++) {
    				if (player === col[i] && player === col[i + 1] && player === col[i + 2] && player === col[i + 3]) {
    					$$invalidate(1, status_box = (player - 1 ? "Player 2" : "Player 1") + " wins!");
    					col[i] = col[i + 1] = col[i + 2] = col[i + 3] = player + 2;
    					return win = true;
    				}
    			}
    		}

    		for (let i = 0; i < 7; i++) {
    			for (let j = 0; j < 3; j++) {
    				if (player === gameBoard[j][i] && player === gameBoard[j + 1][i] && player === gameBoard[j + 2][i] && player === gameBoard[j + 3][i]) {
    					$$invalidate(1, status_box = (player - 1 ? "Player 2" : "Player 1") + " wins!");
    					$$invalidate(0, gameBoard[j][i] = $$invalidate(0, gameBoard[j + 1][i] = $$invalidate(0, gameBoard[j + 2][i] = $$invalidate(0, gameBoard[j + 3][i] = player + 2, gameBoard), gameBoard), gameBoard), gameBoard);
    					return win = true;
    				}
    			}
    		}

    		// Down and to the left diagonal
    		for (let i = 0; i < 4; i++) {
    			for (let j = 0; j < 3; j++) {
    				if (player === gameBoard[j][i] && player === gameBoard[j + 1][i + 1] && player === gameBoard[j + 2][i + 2] && player === gameBoard[j + 3][i + 3]) {
    					$$invalidate(1, status_box = (player - 1 ? "Player 2" : "Player 1") + " wins!");
    					$$invalidate(0, gameBoard[j][i] = $$invalidate(0, gameBoard[j + 1][i + 1] = $$invalidate(0, gameBoard[j + 2][i + 2] = $$invalidate(0, gameBoard[j + 3][i + 3] = player + 2, gameBoard), gameBoard), gameBoard), gameBoard);
    					return win = true;
    				}
    			}
    		}

    		for (let i = 0; i < 4; i++) {
    			for (let j = 0; j < 3; j++) {
    				if (player === gameBoard[j][i + 3] && player === gameBoard[j + 1][i + 2] && player === gameBoard[j + 2][i + 1] && player === gameBoard[j + 3][i]) {
    					$$invalidate(1, status_box = (player - 1 ? "Player 2" : "Player 1") + " wins!");
    					$$invalidate(0, gameBoard[j][i + 3] = $$invalidate(0, gameBoard[j + 1][i + 2] = $$invalidate(0, gameBoard[j + 2][i + 1] = $$invalidate(0, gameBoard[j + 3][i] = player + 2, gameBoard), gameBoard), gameBoard), gameBoard);
    					return win = true;
    				}
    			}
    		}
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<C4> was created with unknown prop '${key}'`);
    	});

    	const click_handler = j => handleClick(j);
    	const click_handler_1 = () => dispatch("closeOverlay");

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		fly,
    		bounceOut,
    		sineIn,
    		dispatch,
    		gameBoard,
    		status_box,
    		currentTurn,
    		win,
    		start_over,
    		handleClick,
    		checkForWins,
    		pixelSize
    	});

    	$$self.$inject_state = $$props => {
    		if ("gameBoard" in $$props) $$invalidate(0, gameBoard = $$props.gameBoard);
    		if ("status_box" in $$props) $$invalidate(1, status_box = $$props.status_box);
    		if ("currentTurn" in $$props) currentTurn = $$props.currentTurn;
    		if ("win" in $$props) win = $$props.win;
    		if ("pixelSize" in $$props) $$invalidate(2, pixelSize = $$props.pixelSize);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$invalidate(2, pixelSize = (40 / 7).toFixed(2));

    	return [
    		gameBoard,
    		status_box,
    		pixelSize,
    		dispatch,
    		start_over,
    		handleClick,
    		click_handler,
    		click_handler_1
    	];
    }

    class C4 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "C4",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* App.svelte generated by Svelte v3.38.2 */

    const { console: console_2 } = globals;
    const file = "App.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[52] = list[i];
    	child_ctx[54] = i;
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[55] = list[i];
    	return child_ctx;
    }

    // (115:0) <Overlay bind:shown={errOverlay}>
    function create_default_slot_6(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text(/*err*/ ctx[8]);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*err*/ 256) set_data_dev(t, /*err*/ ctx[8]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_6.name,
    		type: "slot",
    		source: "(115:0) <Overlay bind:shown={errOverlay}>",
    		ctx
    	});

    	return block;
    }

    // (127:8) {:else }
    function create_else_block(ctx) {
    	let i;

    	const block = {
    		c: function create() {
    			i = element("i");
    			i.textContent = "No Ports Found...";
    			add_location(i, file, 127, 12, 4722);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, i, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(i);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(127:8) {:else }",
    		ctx
    	});

    	return block;
    }

    // (123:8) {#if availablePorts.length !== 0}
    function create_if_block_6(ctx) {
    	let each_1_anchor;
    	let each_value_1 = /*availablePorts*/ ctx[14];
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
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
    			if (dirty[0] & /*portName, availablePorts*/ 24576) {
    				each_value_1 = /*availablePorts*/ ctx[14];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_1.length;
    			}
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_6.name,
    		type: "if",
    		source: "(123:8) {#if availablePorts.length !== 0}",
    		ctx
    	});

    	return block;
    }

    // (124:12) {#each availablePorts as port}
    function create_each_block_1(ctx) {
    	let div;
    	let t_value = /*port*/ ctx[55] + "";
    	let t;
    	let mounted;
    	let dispose;

    	function click_handler() {
    		return /*click_handler*/ ctx[28](/*port*/ ctx[55]);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			t = text(t_value);
    			add_location(div, file, 124, 16, 4619);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t);

    			if (!mounted) {
    				dispose = listen_dev(div, "click", click_handler, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty[0] & /*availablePorts*/ 16384 && t_value !== (t_value = /*port*/ ctx[55] + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(124:12) {#each availablePorts as port}",
    		ctx
    	});

    	return block;
    }

    // (119:0) <Overlay bind:shown={showOverlay} closable={false}>
    function create_default_slot_5(ctx) {
    	let h1;
    	let t1;
    	let div0;
    	let t3;
    	let div1;
    	let t4;
    	let input0;
    	let t5;
    	let input1;
    	let t6;
    	let input2;
    	let t7;
    	let input3;
    	let mounted;
    	let dispose;

    	function select_block_type(ctx, dirty) {
    		if (/*availablePorts*/ ctx[14].length !== 0) return create_if_block_6;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "Error: Unable to find port.";
    			t1 = space();
    			div0 = element("div");
    			div0.textContent = "Ports found:";
    			t3 = space();
    			div1 = element("div");
    			if_block.c();
    			t4 = space();
    			input0 = element("input");
    			t5 = space();
    			input1 = element("input");
    			t6 = space();
    			input2 = element("input");
    			t7 = space();
    			input3 = element("input");
    			add_location(h1, file, 119, 4, 4438);
    			add_location(div0, file, 120, 4, 4480);
    			add_location(div1, file, 121, 4, 4509);
    			set_style(input0, "padding", "10px");
    			set_style(input0, "font-size", "20px");
    			attr_dev(input0, "type", "button");
    			input0.value = "Add 'COM'";
    			add_location(input0, file, 130, 4, 4779);
    			set_style(input1, "padding", "10px");
    			set_style(input1, "font-size", "20px");
    			attr_dev(input1, "type", "text");
    			attr_dev(input1, "id", "portsSelect");
    			add_location(input1, file, 135, 4, 4964);
    			set_style(input2, "padding", "10px");
    			set_style(input2, "font-size", "20px");
    			attr_dev(input2, "type", "button");
    			input2.value = "Submit";
    			add_location(input2, file, 140, 4, 5121);
    			set_style(input3, "padding", "10px");
    			set_style(input3, "font-size", "20px");
    			attr_dev(input3, "type", "button");
    			input3.value = "Refresh";
    			add_location(input3, file, 148, 4, 5353);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div0, anchor);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, div1, anchor);
    			if_block.m(div1, null);
    			insert_dev(target, t4, anchor);
    			insert_dev(target, input0, anchor);
    			insert_dev(target, t5, anchor);
    			insert_dev(target, input1, anchor);
    			set_input_value(input1, /*portName*/ ctx[13]);
    			insert_dev(target, t6, anchor);
    			insert_dev(target, input2, anchor);
    			insert_dev(target, t7, anchor);
    			insert_dev(target, input3, anchor);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "click", /*click_handler_1*/ ctx[29], false, false, false),
    					listen_dev(input1, "input", /*input1_input_handler*/ ctx[30]),
    					listen_dev(input2, "click", /*click_handler_2*/ ctx[31], false, false, false),
    					listen_dev(input3, "click", /*click_handler_3*/ ctx[32], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(div1, null);
    				}
    			}

    			if (dirty[0] & /*portName*/ 8192 && input1.value !== /*portName*/ ctx[13]) {
    				set_input_value(input1, /*portName*/ ctx[13]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(div1);
    			if_block.d();
    			if (detaching) detach_dev(t4);
    			if (detaching) detach_dev(input0);
    			if (detaching) detach_dev(t5);
    			if (detaching) detach_dev(input1);
    			if (detaching) detach_dev(t6);
    			if (detaching) detach_dev(input2);
    			if (detaching) detach_dev(t7);
    			if (detaching) detach_dev(input3);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_5.name,
    		type: "slot",
    		source: "(119:0) <Overlay bind:shown={showOverlay} closable={false}>",
    		ctx
    	});

    	return block;
    }

    // (159:0) <Message          bind:shown={messageShown}          onClose={() => ipcRenderer.send("ready_for_data")}  >
    function create_default_slot_4(ctx) {
    	let html_tag;
    	let html_anchor;

    	const block = {
    		c: function create() {
    			html_anchor = empty();
    			html_tag = new HtmlTag(html_anchor);
    		},
    		m: function mount(target, anchor) {
    			html_tag.m(/*messageContent*/ ctx[11], target, anchor);
    			insert_dev(target, html_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*messageContent*/ 2048) html_tag.p(/*messageContent*/ ctx[11]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(html_anchor);
    			if (detaching) html_tag.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_4.name,
    		type: "slot",
    		source: "(159:0) <Message          bind:shown={messageShown}          onClose={() => ipcRenderer.send(\\\"ready_for_data\\\")}  >",
    		ctx
    	});

    	return block;
    }

    // (165:4) {#if data?.c}
    function create_if_block_5(ctx) {
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
    			if (dirty[0] & /*data, $darkMode, bS*/ 5242881) {
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
    		id: create_if_block_5.name,
    		type: "if",
    		source: "(165:4) {#if data?.c}",
    		ctx
    	});

    	return block;
    }

    // (166:8) {#each data.c as cell, index}
    function create_each_block(ctx) {
    	let div;
    	let t0_value = /*cell*/ ctx[52].toFixed(2) + "";
    	let t0;
    	let t1;
    	let div_style_value;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t0 = text(t0_value);
    			t1 = space();
    			attr_dev(div, "class", "cell");
    			attr_dev(div, "style", div_style_value = "background-color: " + getColor(/*cell*/ ctx[52], /*$darkMode*/ ctx[22]));
    			toggle_class(div, "balancing", /*bS*/ ctx[20][/*index*/ ctx[54]] === "1");
    			add_location(div, file, 166, 12, 5918);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t0);
    			append_dev(div, t1);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*data*/ 1 && t0_value !== (t0_value = /*cell*/ ctx[52].toFixed(2) + "")) set_data_dev(t0, t0_value);

    			if (dirty[0] & /*data, $darkMode*/ 4194305 && div_style_value !== (div_style_value = "background-color: " + getColor(/*cell*/ ctx[52], /*$darkMode*/ ctx[22]))) {
    				attr_dev(div, "style", div_style_value);
    			}

    			if (dirty[0] & /*bS*/ 1048576) {
    				toggle_class(div, "balancing", /*bS*/ ctx[20][/*index*/ ctx[54]] === "1");
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
    		source: "(166:8) {#each data.c as cell, index}",
    		ctx
    	});

    	return block;
    }

    // (177:4) {#if data?.c}
    function create_if_block_4(ctx) {
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
    				value: /*voltage*/ ctx[3],
    				bounds: [50, 90],
    				colorBounds: [65, 90]
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
    				value: /*voltage*/ ctx[3] / /*data*/ ctx[0].c.length,
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
    			if (dirty[0] & /*voltage*/ 8) gauge0_changes.value = /*voltage*/ ctx[3];
    			gauge0.$set(gauge0_changes);
    			const gauge1_changes = {};
    			if (dirty[0] & /*data*/ 1) gauge1_changes.value = Math.min(.../*data*/ ctx[0].c);
    			gauge1.$set(gauge1_changes);
    			const gauge2_changes = {};
    			if (dirty[0] & /*voltage, data*/ 9) gauge2_changes.value = /*voltage*/ ctx[3] / /*data*/ ctx[0].c.length;
    			gauge2.$set(gauge2_changes);
    			const gauge3_changes = {};
    			if (dirty[0] & /*data*/ 1) gauge3_changes.value = Math.max(.../*data*/ ctx[0].c);
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
    		id: create_if_block_4.name,
    		type: "if",
    		source: "(177:4) {#if data?.c}",
    		ctx
    	});

    	return block;
    }

    // (232:4) {#if data}
    function create_if_block_2(ctx) {
    	let div3;
    	let tempgauge;
    	let t0;
    	let div2;
    	let div0;
    	let gauge0;
    	let t1;
    	let div1;
    	let gauge1;
    	let div3_class_value;
    	let t2;
    	let console_1;
    	let t3;
    	let div5;
    	let div4;
    	let gauge2;
    	let t4;
    	let if_block_anchor;
    	let current;

    	tempgauge = new TempGauge({
    			props: { data: /*data*/ ctx[0].t },
    			$$inline: true
    		});

    	gauge0 = new Gauge_1({
    			props: {
    				name: "Amps",
    				value: /*data*/ ctx[0]["pC"],
    				bounds: [-50, 500]
    			},
    			$$inline: true
    		});

    	gauge1 = new Gauge_1({
    			props: {
    				name: "Power (kW)",
    				value: Math.abs(/*data*/ ctx[0]["pC"] * /*voltage*/ ctx[3] / 1000),
    				bounds: [0, 40]
    			},
    			$$inline: true
    		});

    	console_1 = new Console({
    			props: { text: /*chargeConsoleText*/ ctx[6] },
    			$$inline: true
    		});

    	gauge2 = new Gauge_1({
    			props: {
    				name: "12V Voltage",
    				value: /*data*/ ctx[0]["tw"] * /*$twelveCorrectiveFactor*/ ctx[23],
    				bounds: [10, 15]
    			},
    			$$inline: true
    		});

    	let if_block = /*data*/ ctx[0]["CR"] && create_if_block_3(ctx);

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			create_component(tempgauge.$$.fragment);
    			t0 = space();
    			div2 = element("div");
    			div0 = element("div");
    			create_component(gauge0.$$.fragment);
    			t1 = space();
    			div1 = element("div");
    			create_component(gauge1.$$.fragment);
    			t2 = space();
    			create_component(console_1.$$.fragment);
    			t3 = space();
    			div5 = element("div");
    			div4 = element("div");
    			create_component(gauge2.$$.fragment);
    			t4 = space();
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    			set_style(div0, "width", "50%");
    			set_style(div0, "font-weight", "bolder");
    			set_style(div0, "text-align", "center");
    			add_location(div0, file, 235, 16, 8176);
    			set_style(div1, "width", "50%");
    			set_style(div1, "font-weight", "bolder");
    			set_style(div1, "text-align", "center");
    			add_location(div1, file, 241, 16, 8451);
    			set_style(div2, "display", "flex");
    			add_location(div2, file, 234, 12, 8130);
    			attr_dev(div3, "class", div3_class_value = /*$darkMode*/ ctx[22] ? "darkIsland" : "island");
    			add_location(div3, file, 232, 8, 8025);
    			set_style(div4, "width", "33.3%");
    			set_style(div4, "font-weight", "bolder");
    			set_style(div4, "text-align", "center");
    			add_location(div4, file, 251, 12, 8873);
    			set_style(div5, "display", "flex");
    			add_location(div5, file, 250, 8, 8831);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			mount_component(tempgauge, div3, null);
    			append_dev(div3, t0);
    			append_dev(div3, div2);
    			append_dev(div2, div0);
    			mount_component(gauge0, div0, null);
    			append_dev(div2, t1);
    			append_dev(div2, div1);
    			mount_component(gauge1, div1, null);
    			insert_dev(target, t2, anchor);
    			mount_component(console_1, target, anchor);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, div5, anchor);
    			append_dev(div5, div4);
    			mount_component(gauge2, div4, null);
    			insert_dev(target, t4, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const tempgauge_changes = {};
    			if (dirty[0] & /*data*/ 1) tempgauge_changes.data = /*data*/ ctx[0].t;
    			tempgauge.$set(tempgauge_changes);
    			const gauge0_changes = {};
    			if (dirty[0] & /*data*/ 1) gauge0_changes.value = /*data*/ ctx[0]["pC"];
    			gauge0.$set(gauge0_changes);
    			const gauge1_changes = {};
    			if (dirty[0] & /*data, voltage*/ 9) gauge1_changes.value = Math.abs(/*data*/ ctx[0]["pC"] * /*voltage*/ ctx[3] / 1000);
    			gauge1.$set(gauge1_changes);

    			if (!current || dirty[0] & /*$darkMode*/ 4194304 && div3_class_value !== (div3_class_value = /*$darkMode*/ ctx[22] ? "darkIsland" : "island")) {
    				attr_dev(div3, "class", div3_class_value);
    			}

    			const console_1_changes = {};
    			if (dirty[0] & /*chargeConsoleText*/ 64) console_1_changes.text = /*chargeConsoleText*/ ctx[6];
    			console_1.$set(console_1_changes);
    			const gauge2_changes = {};
    			if (dirty[0] & /*data, $twelveCorrectiveFactor*/ 8388609) gauge2_changes.value = /*data*/ ctx[0]["tw"] * /*$twelveCorrectiveFactor*/ ctx[23];
    			gauge2.$set(gauge2_changes);

    			if (/*data*/ ctx[0]["CR"]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty[0] & /*data*/ 1) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block_3(ctx);
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
    			transition_in(tempgauge.$$.fragment, local);
    			transition_in(gauge0.$$.fragment, local);
    			transition_in(gauge1.$$.fragment, local);
    			transition_in(console_1.$$.fragment, local);
    			transition_in(gauge2.$$.fragment, local);
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(tempgauge.$$.fragment, local);
    			transition_out(gauge0.$$.fragment, local);
    			transition_out(gauge1.$$.fragment, local);
    			transition_out(console_1.$$.fragment, local);
    			transition_out(gauge2.$$.fragment, local);
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    			destroy_component(tempgauge);
    			destroy_component(gauge0);
    			destroy_component(gauge1);
    			if (detaching) detach_dev(t2);
    			destroy_component(console_1, detaching);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(div5);
    			destroy_component(gauge2);
    			if (detaching) detach_dev(t4);
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(232:4) {#if data}",
    		ctx
    	});

    	return block;
    }

    // (259:8) {#if data["CR"]}
    function create_if_block_3(ctx) {
    	let div5;
    	let div0;
    	let t0;
    	let t1;
    	let div4;
    	let div1;
    	let gauge0;
    	let t2;
    	let div2;
    	let gauge1;
    	let t3;
    	let div3;
    	let gauge2;
    	let t4;
    	let t5_value = (/*data*/ ctx[0]["lcp"] / 1000).toFixed(1) + "";
    	let t5;
    	let t6;
    	let div5_class_value;
    	let div5_transition;
    	let current;

    	gauge0 = new Gauge_1({
    			props: {
    				name: "AC Voltage",
    				value: /*data*/ ctx[0]["CIV"],
    				bounds: [120, 320],
    				colorBounds: [0, 500]
    			},
    			$$inline: true
    		});

    	gauge1 = new Gauge_1({
    			props: {
    				name: "Temperature",
    				value: /*data*/ ctx[0]["CT"],
    				bounds: [10, 50],
    				colorBounds: [45, 21]
    			},
    			$$inline: true
    		});

    	gauge2 = new Gauge_1({
    			props: {
    				name: "Current",
    				value: /*data*/ ctx[0]["CC"],
    				bounds: [0, 40],
    				colorBounds: [0, 20]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div5 = element("div");
    			div0 = element("div");
    			t0 = text("Charger");
    			t1 = space();
    			div4 = element("div");
    			div1 = element("div");
    			create_component(gauge0.$$.fragment);
    			t2 = space();
    			div2 = element("div");
    			create_component(gauge1.$$.fragment);
    			t3 = space();
    			div3 = element("div");
    			create_component(gauge2.$$.fragment);
    			t4 = text("\r\n                (");
    			t5 = text(t5_value);
    			t6 = text("s)");
    			set_style(div0, "font-size", "20px");
    			set_style(div0, "text-decoration", "underline");
    			set_style(div0, "margin-bottom", "-5px");
    			set_style(div0, "font-weight", "bolder");
    			set_style(div0, "padding", "3px");
    			set_style(div0, "color", /*$darkMode*/ ctx[22] ? "rgb(197, 197, 197)" : "");
    			add_location(div0, file, 260, 16, 9303);
    			set_style(div1, "width", "33.3%");
    			set_style(div1, "font-weight", "bolder");
    			set_style(div1, "text-align", "center");
    			add_location(div1, file, 264, 20, 9585);
    			set_style(div2, "width", "33.3%");
    			set_style(div2, "font-weight", "bolder");
    			set_style(div2, "text-align", "center");
    			add_location(div2, file, 272, 20, 9975);
    			set_style(div3, "width", "33.3%");
    			set_style(div3, "font-weight", "bolder");
    			set_style(div3, "text-align", "center");
    			add_location(div3, file, 280, 20, 10363);
    			set_style(div4, "display", "flex");
    			add_location(div4, file, 263, 16, 9535);
    			attr_dev(div5, "class", div5_class_value = /*$darkMode*/ ctx[22] ? "darkIsland" : "island");
    			add_location(div5, file, 259, 12, 9199);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div5, anchor);
    			append_dev(div5, div0);
    			append_dev(div0, t0);
    			append_dev(div5, t1);
    			append_dev(div5, div4);
    			append_dev(div4, div1);
    			mount_component(gauge0, div1, null);
    			append_dev(div4, t2);
    			append_dev(div4, div2);
    			mount_component(gauge1, div2, null);
    			append_dev(div4, t3);
    			append_dev(div4, div3);
    			mount_component(gauge2, div3, null);
    			append_dev(div5, t4);
    			append_dev(div5, t5);
    			append_dev(div5, t6);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (!current || dirty[0] & /*$darkMode*/ 4194304) {
    				set_style(div0, "color", /*$darkMode*/ ctx[22] ? "rgb(197, 197, 197)" : "");
    			}

    			const gauge0_changes = {};
    			if (dirty[0] & /*data*/ 1) gauge0_changes.value = /*data*/ ctx[0]["CIV"];
    			gauge0.$set(gauge0_changes);
    			const gauge1_changes = {};
    			if (dirty[0] & /*data*/ 1) gauge1_changes.value = /*data*/ ctx[0]["CT"];
    			gauge1.$set(gauge1_changes);
    			const gauge2_changes = {};
    			if (dirty[0] & /*data*/ 1) gauge2_changes.value = /*data*/ ctx[0]["CC"];
    			gauge2.$set(gauge2_changes);
    			if ((!current || dirty[0] & /*data*/ 1) && t5_value !== (t5_value = (/*data*/ ctx[0]["lcp"] / 1000).toFixed(1) + "")) set_data_dev(t5, t5_value);

    			if (!current || dirty[0] & /*$darkMode*/ 4194304 && div5_class_value !== (div5_class_value = /*$darkMode*/ ctx[22] ? "darkIsland" : "island")) {
    				attr_dev(div5, "class", div5_class_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(gauge0.$$.fragment, local);
    			transition_in(gauge1.$$.fragment, local);
    			transition_in(gauge2.$$.fragment, local);

    			add_render_callback(() => {
    				if (!div5_transition) div5_transition = create_bidirectional_transition(div5, fade, { duration: 3000 }, true);
    				div5_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(gauge0.$$.fragment, local);
    			transition_out(gauge1.$$.fragment, local);
    			transition_out(gauge2.$$.fragment, local);
    			if (!div5_transition) div5_transition = create_bidirectional_transition(div5, fade, { duration: 3000 }, false);
    			div5_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div5);
    			destroy_component(gauge0);
    			destroy_component(gauge1);
    			destroy_component(gauge2);
    			if (detaching && div5_transition) div5_transition.end();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(259:8) {#if data[\\\"CR\\\"]}",
    		ctx
    	});

    	return block;
    }

    // (296:4) {#if data}
    function create_if_block_1(ctx) {
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
    			if (dirty[0] & /*data*/ 1) slider_changes.value = /*data*/ ctx[0].f;
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
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(296:4) {#if data}",
    		ctx
    	});

    	return block;
    }

    // (335:0) <Overlay bind:shown={showSnake} closable="{false} ">
    function create_default_slot_3(ctx) {
    	let snake;
    	let current;
    	snake = new Snake({ $$inline: true });
    	snake.$on("closeOverlay", /*closeOverlay_handler*/ ctx[40]);

    	const block = {
    		c: function create() {
    			create_component(snake.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(snake, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(snake.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(snake.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(snake, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_3.name,
    		type: "slot",
    		source: "(335:0) <Overlay bind:shown={showSnake} closable=\\\"{false} \\\">",
    		ctx
    	});

    	return block;
    }

    // (339:0) <Overlay bind:shown={showC4} closable="{false}">
    function create_default_slot_2(ctx) {
    	let c4;
    	let current;
    	c4 = new C4({ $$inline: true });
    	c4.$on("closeOverlay", /*closeOverlay_handler_1*/ ctx[42]);

    	const block = {
    		c: function create() {
    			create_component(c4.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(c4, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(c4.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(c4.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(c4, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_2.name,
    		type: "slot",
    		source: "(339:0) <Overlay bind:shown={showC4} closable=\\\"{false}\\\">",
    		ctx
    	});

    	return block;
    }

    // (343:0) <Overlay bind:shown={showSunset}>
    function create_default_slot_1(ctx) {
    	let t0;
    	let t1_value = /*time*/ ctx[1].toLocaleString() + "";
    	let t1;
    	let t2;
    	let br0;
    	let t3;
    	let t4_value = today_sunrise.toLocaleString() + "";
    	let t4;
    	let t5;
    	let br1;
    	let t6;
    	let t7_value = today_sunset.toLocaleString() + "";
    	let t7;
    	let t8;
    	let br2;
    	let t9;
    	let button0;
    	let t11;
    	let button1;
    	let t13;
    	let button2;
    	let t15;
    	let br3;
    	let t16;
    	let t17;
    	let t18;
    	let t19;
    	let t20;
    	let input0;
    	let t21;
    	let input1;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			t0 = text("Current Time: ");
    			t1 = text(t1_value);
    			t2 = space();
    			br0 = element("br");
    			t3 = text("\r\n    Today's Sunrise: ");
    			t4 = text(t4_value);
    			t5 = space();
    			br1 = element("br");
    			t6 = text("\r\n    Today's Sunset: ");
    			t7 = text(t7_value);
    			t8 = space();
    			br2 = element("br");
    			t9 = space();
    			button0 = element("button");
    			button0.textContent = "Light Mode";
    			t11 = space();
    			button1 = element("button");
    			button1.textContent = "Dark Mode";
    			t13 = space();
    			button2 = element("button");
    			button2.textContent = "Adaptive";
    			t15 = space();
    			br3 = element("br");
    			t16 = text(" Current Mode: ");
    			t17 = text(/*$forceMode*/ ctx[24]);
    			t18 = text("\r\n    Time Offset: ");
    			t19 = text(/*$timeOffset*/ ctx[21]);
    			t20 = text(" Hours\r\n    ");
    			input0 = element("input");
    			t21 = space();
    			input1 = element("input");
    			add_location(br0, file, 343, 42, 12581);
    			add_location(br1, file, 344, 54, 12641);
    			add_location(br2, file, 345, 52, 12699);
    			add_location(button0, file, 346, 4, 12709);
    			add_location(button1, file, 347, 4, 12782);
    			add_location(button2, file, 348, 4, 12853);
    			add_location(br3, file, 349, 4, 12927);
    			attr_dev(input0, "type", "button");
    			input0.value = "+";
    			add_location(input0, file, 351, 4, 13002);
    			attr_dev(input1, "type", "button");
    			input1.value = "-";
    			add_location(input1, file, 352, 4, 13086);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, br0, anchor);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, t4, anchor);
    			insert_dev(target, t5, anchor);
    			insert_dev(target, br1, anchor);
    			insert_dev(target, t6, anchor);
    			insert_dev(target, t7, anchor);
    			insert_dev(target, t8, anchor);
    			insert_dev(target, br2, anchor);
    			insert_dev(target, t9, anchor);
    			insert_dev(target, button0, anchor);
    			insert_dev(target, t11, anchor);
    			insert_dev(target, button1, anchor);
    			insert_dev(target, t13, anchor);
    			insert_dev(target, button2, anchor);
    			insert_dev(target, t15, anchor);
    			insert_dev(target, br3, anchor);
    			insert_dev(target, t16, anchor);
    			insert_dev(target, t17, anchor);
    			insert_dev(target, t18, anchor);
    			insert_dev(target, t19, anchor);
    			insert_dev(target, t20, anchor);
    			insert_dev(target, input0, anchor);
    			insert_dev(target, t21, anchor);
    			insert_dev(target, input1, anchor);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*click_handler_8*/ ctx[44], false, false, false),
    					listen_dev(button1, "click", /*click_handler_9*/ ctx[45], false, false, false),
    					listen_dev(button2, "click", /*click_handler_10*/ ctx[46], false, false, false),
    					listen_dev(input0, "click", /*click_handler_11*/ ctx[47], false, false, false),
    					listen_dev(input1, "click", /*click_handler_12*/ ctx[48], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*time*/ 2 && t1_value !== (t1_value = /*time*/ ctx[1].toLocaleString() + "")) set_data_dev(t1, t1_value);
    			if (dirty[0] & /*$forceMode*/ 16777216) set_data_dev(t17, /*$forceMode*/ ctx[24]);
    			if (dirty[0] & /*$timeOffset*/ 2097152) set_data_dev(t19, /*$timeOffset*/ ctx[21]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(br0);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(t4);
    			if (detaching) detach_dev(t5);
    			if (detaching) detach_dev(br1);
    			if (detaching) detach_dev(t6);
    			if (detaching) detach_dev(t7);
    			if (detaching) detach_dev(t8);
    			if (detaching) detach_dev(br2);
    			if (detaching) detach_dev(t9);
    			if (detaching) detach_dev(button0);
    			if (detaching) detach_dev(t11);
    			if (detaching) detach_dev(button1);
    			if (detaching) detach_dev(t13);
    			if (detaching) detach_dev(button2);
    			if (detaching) detach_dev(t15);
    			if (detaching) detach_dev(br3);
    			if (detaching) detach_dev(t16);
    			if (detaching) detach_dev(t17);
    			if (detaching) detach_dev(t18);
    			if (detaching) detach_dev(t19);
    			if (detaching) detach_dev(t20);
    			if (detaching) detach_dev(input0);
    			if (detaching) detach_dev(t21);
    			if (detaching) detach_dev(input1);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1.name,
    		type: "slot",
    		source: "(343:0) <Overlay bind:shown={showSunset}>",
    		ctx
    	});

    	return block;
    }

    // (356:0) <Overlay bind:shown={showSettings}>
    function create_default_slot(ctx) {
    	let t0;
    	let input;
    	let t1;
    	let br;
    	let t2;
    	let t3_value = (/*data*/ ctx[0]["tw"] * /*$twelveCorrectiveFactor*/ ctx[23]).toFixed(2) + "";
    	let t3;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			t0 = text("Corrective Factor for 12V Sensor: ");
    			input = element("input");
    			t1 = space();
    			br = element("br");
    			t2 = text("\r\n    Current Value: ");
    			t3 = text(t3_value);
    			attr_dev(input, "type", "number");
    			add_location(input, file, 356, 38, 13255);
    			add_location(br, file, 356, 97, 13314);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, input, anchor);
    			set_input_value(input, /*$twelveCorrectiveFactor*/ ctx[23]);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, br, anchor);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, t3, anchor);

    			if (!mounted) {
    				dispose = listen_dev(input, "input", /*input_input_handler*/ ctx[50]);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*$twelveCorrectiveFactor*/ 8388608 && to_number(input.value) !== /*$twelveCorrectiveFactor*/ ctx[23]) {
    				set_input_value(input, /*$twelveCorrectiveFactor*/ ctx[23]);
    			}

    			if (dirty[0] & /*data, $twelveCorrectiveFactor*/ 8388609 && t3_value !== (t3_value = (/*data*/ ctx[0]["tw"] * /*$twelveCorrectiveFactor*/ ctx[23]).toFixed(2) + "")) set_data_dev(t3, t3_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(input);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(br);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(t3);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(356:0) <Overlay bind:shown={showSettings}>",
    		ctx
    	});

    	return block;
    }

    // (361:0) {#if showImage}
    function create_if_block(ctx) {
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
    			add_location(img, file, 362, 8, 13530);
    			attr_dev(div, "id", "photo");
    			set_style(div, "z-index", "5");
    			add_location(div, file, 361, 4, 13427);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, img);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!div_transition) div_transition = create_bidirectional_transition(
    					div,
    					fade,
    					{
    						duration: (/*data*/ ctx[0]?.fake) ? 500 : 3000
    					},
    					true
    				);

    				div_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (!div_transition) div_transition = create_bidirectional_transition(
    				div,
    				fade,
    				{
    					duration: (/*data*/ ctx[0]?.fake) ? 500 : 3000
    				},
    				false
    			);

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
    		id: create_if_block.name,
    		type: "if",
    		source: "(361:0) {#if showImage}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let overlay0;
    	let updating_shown;
    	let t0;
    	let overlay1;
    	let updating_shown_1;
    	let t1;
    	let message;
    	let updating_shown_2;
    	let t2;
    	let div0;
    	let div0_class_value;
    	let t3;
    	let div1;
    	let t4;
    	let div6;
    	let div2;
    	let clock;
    	let t5;
    	let img0;
    	let img0_src_value;
    	let div2_class_value;
    	let t6;
    	let div5;
    	let div3;
    	let t7;
    	let t8;
    	let div4;
    	let t9;
    	let div5_class_value;
    	let t10;
    	let graph;
    	let t11;
    	let div7;
    	let t12;
    	let div8;
    	let div8_class_value;
    	let t13;
    	let div10;
    	let ledselector;
    	let t14;
    	let div9;
    	let button0;
    	let img1;
    	let img1_src_value;
    	let t15;
    	let button1;
    	let img2;
    	let img2_src_value;
    	let t16;
    	let button2;
    	let img3;
    	let img3_src_value;
    	let t17;
    	let button3;
    	let img4;
    	let img4_src_value;
    	let div9_class_value;
    	let t18;
    	let overlay2;
    	let updating_shown_3;
    	let t19;
    	let overlay3;
    	let updating_shown_4;
    	let t20;
    	let overlay4;
    	let updating_shown_5;
    	let t21;
    	let overlay5;
    	let updating_shown_6;
    	let t22;
    	let if_block4_anchor;
    	let current;
    	let mounted;
    	let dispose;

    	function overlay0_shown_binding(value) {
    		/*overlay0_shown_binding*/ ctx[27](value);
    	}

    	let overlay0_props = {
    		$$slots: { default: [create_default_slot_6] },
    		$$scope: { ctx }
    	};

    	if (/*errOverlay*/ ctx[9] !== void 0) {
    		overlay0_props.shown = /*errOverlay*/ ctx[9];
    	}

    	overlay0 = new Overlay({ props: overlay0_props, $$inline: true });
    	binding_callbacks.push(() => bind(overlay0, "shown", overlay0_shown_binding));

    	function overlay1_shown_binding(value) {
    		/*overlay1_shown_binding*/ ctx[33](value);
    	}

    	let overlay1_props = {
    		closable: false,
    		$$slots: { default: [create_default_slot_5] },
    		$$scope: { ctx }
    	};

    	if (/*showOverlay*/ ctx[15] !== void 0) {
    		overlay1_props.shown = /*showOverlay*/ ctx[15];
    	}

    	overlay1 = new Overlay({ props: overlay1_props, $$inline: true });
    	binding_callbacks.push(() => bind(overlay1, "shown", overlay1_shown_binding));

    	function message_shown_binding(value) {
    		/*message_shown_binding*/ ctx[35](value);
    	}

    	let message_props = {
    		onClose: /*func*/ ctx[34],
    		$$slots: { default: [create_default_slot_4] },
    		$$scope: { ctx }
    	};

    	if (/*messageShown*/ ctx[12] !== void 0) {
    		message_props.shown = /*messageShown*/ ctx[12];
    	}

    	message = new Message({ props: message_props, $$inline: true });
    	binding_callbacks.push(() => bind(message, "shown", message_shown_binding));
    	let if_block0 = /*data*/ ctx[0]?.c && create_if_block_5(ctx);
    	let if_block1 = /*data*/ ctx[0]?.c && create_if_block_4(ctx);
    	clock = new Clock({ $$inline: true });

    	graph = new Graph({
    			props: {
    				axisSettings: [
    					{
    						axis: 0,
    						color: /*$darkMode*/ ctx[22] ? "#33f8ff" : "#125256",
    						maxPoints: 35,
    						units: "V",
    						minIs0: false
    					}
    				],
    				datas: /*graphData*/ ctx[7]
    			},
    			$$inline: true
    		});

    	let if_block2 = /*data*/ ctx[0] && create_if_block_2(ctx);
    	let if_block3 = /*data*/ ctx[0] && create_if_block_1(ctx);
    	ledselector = new LEDSelector({ $$inline: true });

    	function overlay2_shown_binding(value) {
    		/*overlay2_shown_binding*/ ctx[41](value);
    	}

    	let overlay2_props = {
    		closable: "" + (false + " "),
    		$$slots: { default: [create_default_slot_3] },
    		$$scope: { ctx }
    	};

    	if (/*showSnake*/ ctx[16] !== void 0) {
    		overlay2_props.shown = /*showSnake*/ ctx[16];
    	}

    	overlay2 = new Overlay({ props: overlay2_props, $$inline: true });
    	binding_callbacks.push(() => bind(overlay2, "shown", overlay2_shown_binding));

    	function overlay3_shown_binding(value) {
    		/*overlay3_shown_binding*/ ctx[43](value);
    	}

    	let overlay3_props = {
    		closable: false,
    		$$slots: { default: [create_default_slot_2] },
    		$$scope: { ctx }
    	};

    	if (/*showC4*/ ctx[17] !== void 0) {
    		overlay3_props.shown = /*showC4*/ ctx[17];
    	}

    	overlay3 = new Overlay({ props: overlay3_props, $$inline: true });
    	binding_callbacks.push(() => bind(overlay3, "shown", overlay3_shown_binding));

    	function overlay4_shown_binding(value) {
    		/*overlay4_shown_binding*/ ctx[49](value);
    	}

    	let overlay4_props = {
    		$$slots: { default: [create_default_slot_1] },
    		$$scope: { ctx }
    	};

    	if (/*showSunset*/ ctx[18] !== void 0) {
    		overlay4_props.shown = /*showSunset*/ ctx[18];
    	}

    	overlay4 = new Overlay({ props: overlay4_props, $$inline: true });
    	binding_callbacks.push(() => bind(overlay4, "shown", overlay4_shown_binding));

    	function overlay5_shown_binding(value) {
    		/*overlay5_shown_binding*/ ctx[51](value);
    	}

    	let overlay5_props = {
    		$$slots: { default: [create_default_slot] },
    		$$scope: { ctx }
    	};

    	if (/*showSettings*/ ctx[19] !== void 0) {
    		overlay5_props.shown = /*showSettings*/ ctx[19];
    	}

    	overlay5 = new Overlay({ props: overlay5_props, $$inline: true });
    	binding_callbacks.push(() => bind(overlay5, "shown", overlay5_shown_binding));
    	let if_block4 = /*showImage*/ ctx[10] && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			create_component(overlay0.$$.fragment);
    			t0 = space();
    			create_component(overlay1.$$.fragment);
    			t1 = space();
    			create_component(message.$$.fragment);
    			t2 = space();
    			div0 = element("div");
    			if (if_block0) if_block0.c();
    			t3 = space();
    			div1 = element("div");
    			if (if_block1) if_block1.c();
    			t4 = space();
    			div6 = element("div");
    			div2 = element("div");
    			create_component(clock.$$.fragment);
    			t5 = space();
    			img0 = element("img");
    			t6 = space();
    			div5 = element("div");
    			div3 = element("div");
    			t7 = text(/*status*/ ctx[4]);
    			t8 = space();
    			div4 = element("div");
    			t9 = text(/*chargeStatus*/ ctx[5]);
    			t10 = space();
    			create_component(graph.$$.fragment);
    			t11 = space();
    			div7 = element("div");
    			if (if_block2) if_block2.c();
    			t12 = space();
    			div8 = element("div");
    			if (if_block3) if_block3.c();
    			t13 = space();
    			div10 = element("div");
    			create_component(ledselector.$$.fragment);
    			t14 = space();
    			div9 = element("div");
    			button0 = element("button");
    			img1 = element("img");
    			t15 = space();
    			button1 = element("button");
    			img2 = element("img");
    			t16 = space();
    			button2 = element("button");
    			img3 = element("img");
    			t17 = space();
    			button3 = element("button");
    			img4 = element("img");
    			t18 = space();
    			create_component(overlay2.$$.fragment);
    			t19 = space();
    			create_component(overlay3.$$.fragment);
    			t20 = space();
    			create_component(overlay4.$$.fragment);
    			t21 = space();
    			create_component(overlay5.$$.fragment);
    			t22 = space();
    			if (if_block4) if_block4.c();
    			if_block4_anchor = empty();
    			attr_dev(div0, "id", "cells");
    			attr_dev(div0, "class", div0_class_value = /*$darkMode*/ ctx[22] ? "darkIsland" : "island");
    			add_location(div0, file, 163, 0, 5784);
    			set_style(div1, "color", "black");
    			set_style(div1, "text-align", "center");
    			set_style(div1, "font-weight", "bolder");
    			add_location(div1, file, 175, 0, 6185);
    			if (img0.src !== (img0_src_value = "./static/export.png")) attr_dev(img0, "src", img0_src_value);
    			attr_dev(img0, "width", "100%");
    			attr_dev(img0, "alt", "car logo");
    			set_style(img0, "transition", "3s ease");
    			set_style(img0, "opacity", /*$darkMode*/ ctx[22] ? "75%" : "");
    			add_location(img0, file, 204, 8, 7175);
    			attr_dev(div2, "class", div2_class_value = /*$darkMode*/ ctx[22] ? "darkIsland" : "island");
    			add_location(div2, file, 201, 4, 7073);

    			set_style(div3, "background-color", /*time*/ ctx[1] - /*lastUpdateDate*/ ctx[2] > new Date(3000)
    			? "red"
    			: "");

    			attr_dev(div3, "class", "statusBox");
    			add_location(div3, file, 209, 8, 7412);
    			attr_dev(div4, "class", "statusBox");
    			add_location(div4, file, 214, 8, 7598);
    			attr_dev(div5, "class", div5_class_value = /*$darkMode*/ ctx[22] ? "darkIsland" : "island");
    			add_location(div5, file, 208, 4, 7351);
    			set_style(div6, "position", "relative");
    			set_style(div6, "text-align", "center");
    			add_location(div6, file, 200, 0, 7014);
    			add_location(div7, file, 230, 0, 7994);
    			attr_dev(div8, "class", div8_class_value = /*$darkMode*/ ctx[22] ? "darkIsland" : "island");
    			add_location(div8, file, 294, 0, 10833);
    			if (img1.src !== (img1_src_value = "./static/snake.svg")) attr_dev(img1, "src", img1_src_value);
    			attr_dev(img1, "alt", "snake");
    			add_location(img1, file, 323, 85, 11640);
    			attr_dev(button0, "class", "but svelte-twt6m2");
    			toggle_class(button0, "dark", /*$darkMode*/ ctx[22]);
    			add_location(button0, file, 323, 8, 11563);
    			if (img2.src !== (img2_src_value = "./static/c4.svg")) attr_dev(img2, "src", img2_src_value);
    			attr_dev(img2, "alt", "c4");
    			add_location(img2, file, 325, 82, 11792);
    			attr_dev(button1, "class", "but svelte-twt6m2");
    			toggle_class(button1, "dark", /*$darkMode*/ ctx[22]);
    			add_location(button1, file, 325, 8, 11718);
    			if (img3.src !== (img3_src_value = "./static/sunset.svg")) attr_dev(img3, "src", img3_src_value);
    			attr_dev(img3, "alt", "sunset");
    			add_location(img3, file, 327, 86, 11935);
    			attr_dev(button2, "class", "but svelte-twt6m2");
    			toggle_class(button2, "dark", /*$darkMode*/ ctx[22]);
    			add_location(button2, file, 327, 8, 11857);
    			if (img4.src !== (img4_src_value = "./static/details.svg")) attr_dev(img4, "src", img4_src_value);
    			attr_dev(img4, "alt", "details");
    			add_location(img4, file, 329, 88, 12170);
    			attr_dev(button3, "class", "but svelte-twt6m2");
    			toggle_class(button3, "dark", /*$darkMode*/ ctx[22]);
    			add_location(button3, file, 329, 8, 12090);
    			attr_dev(div9, "class", div9_class_value = /*$darkMode*/ ctx[22] ? "darkIsland" : "island");
    			add_location(div9, file, 322, 4, 11502);
    			add_location(div10, file, 320, 0, 11471);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(overlay0, target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(overlay1, target, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(message, target, anchor);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, div0, anchor);
    			if (if_block0) if_block0.m(div0, null);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, div1, anchor);
    			if (if_block1) if_block1.m(div1, null);
    			insert_dev(target, t4, anchor);
    			insert_dev(target, div6, anchor);
    			append_dev(div6, div2);
    			mount_component(clock, div2, null);
    			append_dev(div2, t5);
    			append_dev(div2, img0);
    			append_dev(div6, t6);
    			append_dev(div6, div5);
    			append_dev(div5, div3);
    			append_dev(div3, t7);
    			append_dev(div5, t8);
    			append_dev(div5, div4);
    			append_dev(div4, t9);
    			append_dev(div6, t10);
    			mount_component(graph, div6, null);
    			insert_dev(target, t11, anchor);
    			insert_dev(target, div7, anchor);
    			if (if_block2) if_block2.m(div7, null);
    			insert_dev(target, t12, anchor);
    			insert_dev(target, div8, anchor);
    			if (if_block3) if_block3.m(div8, null);
    			insert_dev(target, t13, anchor);
    			insert_dev(target, div10, anchor);
    			mount_component(ledselector, div10, null);
    			append_dev(div10, t14);
    			append_dev(div10, div9);
    			append_dev(div9, button0);
    			append_dev(button0, img1);
    			append_dev(div9, t15);
    			append_dev(div9, button1);
    			append_dev(button1, img2);
    			append_dev(div9, t16);
    			append_dev(div9, button2);
    			append_dev(button2, img3);
    			append_dev(div9, t17);
    			append_dev(div9, button3);
    			append_dev(button3, img4);
    			insert_dev(target, t18, anchor);
    			mount_component(overlay2, target, anchor);
    			insert_dev(target, t19, anchor);
    			mount_component(overlay3, target, anchor);
    			insert_dev(target, t20, anchor);
    			mount_component(overlay4, target, anchor);
    			insert_dev(target, t21, anchor);
    			mount_component(overlay5, target, anchor);
    			insert_dev(target, t22, anchor);
    			if (if_block4) if_block4.m(target, anchor);
    			insert_dev(target, if_block4_anchor, anchor);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*click_handler_4*/ ctx[36], false, false, false),
    					listen_dev(button1, "click", /*click_handler_5*/ ctx[37], false, false, false),
    					listen_dev(button2, "click", /*click_handler_6*/ ctx[38], false, false, false),
    					listen_dev(button3, "click", /*click_handler_7*/ ctx[39], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			const overlay0_changes = {};

    			if (dirty[0] & /*err*/ 256 | dirty[1] & /*$$scope*/ 134217728) {
    				overlay0_changes.$$scope = { dirty, ctx };
    			}

    			if (!updating_shown && dirty[0] & /*errOverlay*/ 512) {
    				updating_shown = true;
    				overlay0_changes.shown = /*errOverlay*/ ctx[9];
    				add_flush_callback(() => updating_shown = false);
    			}

    			overlay0.$set(overlay0_changes);
    			const overlay1_changes = {};

    			if (dirty[0] & /*showOverlay, portName, availablePorts*/ 57344 | dirty[1] & /*$$scope*/ 134217728) {
    				overlay1_changes.$$scope = { dirty, ctx };
    			}

    			if (!updating_shown_1 && dirty[0] & /*showOverlay*/ 32768) {
    				updating_shown_1 = true;
    				overlay1_changes.shown = /*showOverlay*/ ctx[15];
    				add_flush_callback(() => updating_shown_1 = false);
    			}

    			overlay1.$set(overlay1_changes);
    			const message_changes = {};

    			if (dirty[0] & /*messageContent*/ 2048 | dirty[1] & /*$$scope*/ 134217728) {
    				message_changes.$$scope = { dirty, ctx };
    			}

    			if (!updating_shown_2 && dirty[0] & /*messageShown*/ 4096) {
    				updating_shown_2 = true;
    				message_changes.shown = /*messageShown*/ ctx[12];
    				add_flush_callback(() => updating_shown_2 = false);
    			}

    			message.$set(message_changes);

    			if (/*data*/ ctx[0]?.c) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_5(ctx);
    					if_block0.c();
    					if_block0.m(div0, null);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (!current || dirty[0] & /*$darkMode*/ 4194304 && div0_class_value !== (div0_class_value = /*$darkMode*/ ctx[22] ? "darkIsland" : "island")) {
    				attr_dev(div0, "class", div0_class_value);
    			}

    			if (/*data*/ ctx[0]?.c) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);

    					if (dirty[0] & /*data*/ 1) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block_4(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(div1, null);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}

    			if (!current || dirty[0] & /*$darkMode*/ 4194304) {
    				set_style(img0, "opacity", /*$darkMode*/ ctx[22] ? "75%" : "");
    			}

    			if (!current || dirty[0] & /*$darkMode*/ 4194304 && div2_class_value !== (div2_class_value = /*$darkMode*/ ctx[22] ? "darkIsland" : "island")) {
    				attr_dev(div2, "class", div2_class_value);
    			}

    			if (!current || dirty[0] & /*status*/ 16) set_data_dev(t7, /*status*/ ctx[4]);

    			if (!current || dirty[0] & /*time, lastUpdateDate*/ 6) {
    				set_style(div3, "background-color", /*time*/ ctx[1] - /*lastUpdateDate*/ ctx[2] > new Date(3000)
    				? "red"
    				: "");
    			}

    			if (!current || dirty[0] & /*chargeStatus*/ 32) set_data_dev(t9, /*chargeStatus*/ ctx[5]);

    			if (!current || dirty[0] & /*$darkMode*/ 4194304 && div5_class_value !== (div5_class_value = /*$darkMode*/ ctx[22] ? "darkIsland" : "island")) {
    				attr_dev(div5, "class", div5_class_value);
    			}

    			const graph_changes = {};

    			if (dirty[0] & /*$darkMode*/ 4194304) graph_changes.axisSettings = [
    				{
    					axis: 0,
    					color: /*$darkMode*/ ctx[22] ? "#33f8ff" : "#125256",
    					maxPoints: 35,
    					units: "V",
    					minIs0: false
    				}
    			];

    			if (dirty[0] & /*graphData*/ 128) graph_changes.datas = /*graphData*/ ctx[7];
    			graph.$set(graph_changes);

    			if (/*data*/ ctx[0]) {
    				if (if_block2) {
    					if_block2.p(ctx, dirty);

    					if (dirty[0] & /*data*/ 1) {
    						transition_in(if_block2, 1);
    					}
    				} else {
    					if_block2 = create_if_block_2(ctx);
    					if_block2.c();
    					transition_in(if_block2, 1);
    					if_block2.m(div7, null);
    				}
    			} else if (if_block2) {
    				group_outros();

    				transition_out(if_block2, 1, 1, () => {
    					if_block2 = null;
    				});

    				check_outros();
    			}

    			if (/*data*/ ctx[0]) {
    				if (if_block3) {
    					if_block3.p(ctx, dirty);

    					if (dirty[0] & /*data*/ 1) {
    						transition_in(if_block3, 1);
    					}
    				} else {
    					if_block3 = create_if_block_1(ctx);
    					if_block3.c();
    					transition_in(if_block3, 1);
    					if_block3.m(div8, null);
    				}
    			} else if (if_block3) {
    				group_outros();

    				transition_out(if_block3, 1, 1, () => {
    					if_block3 = null;
    				});

    				check_outros();
    			}

    			if (!current || dirty[0] & /*$darkMode*/ 4194304 && div8_class_value !== (div8_class_value = /*$darkMode*/ ctx[22] ? "darkIsland" : "island")) {
    				attr_dev(div8, "class", div8_class_value);
    			}

    			if (dirty[0] & /*$darkMode*/ 4194304) {
    				toggle_class(button0, "dark", /*$darkMode*/ ctx[22]);
    			}

    			if (dirty[0] & /*$darkMode*/ 4194304) {
    				toggle_class(button1, "dark", /*$darkMode*/ ctx[22]);
    			}

    			if (dirty[0] & /*$darkMode*/ 4194304) {
    				toggle_class(button2, "dark", /*$darkMode*/ ctx[22]);
    			}

    			if (dirty[0] & /*$darkMode*/ 4194304) {
    				toggle_class(button3, "dark", /*$darkMode*/ ctx[22]);
    			}

    			if (!current || dirty[0] & /*$darkMode*/ 4194304 && div9_class_value !== (div9_class_value = /*$darkMode*/ ctx[22] ? "darkIsland" : "island")) {
    				attr_dev(div9, "class", div9_class_value);
    			}

    			const overlay2_changes = {};

    			if (dirty[0] & /*showSnake*/ 65536 | dirty[1] & /*$$scope*/ 134217728) {
    				overlay2_changes.$$scope = { dirty, ctx };
    			}

    			if (!updating_shown_3 && dirty[0] & /*showSnake*/ 65536) {
    				updating_shown_3 = true;
    				overlay2_changes.shown = /*showSnake*/ ctx[16];
    				add_flush_callback(() => updating_shown_3 = false);
    			}

    			overlay2.$set(overlay2_changes);
    			const overlay3_changes = {};

    			if (dirty[0] & /*showC4*/ 131072 | dirty[1] & /*$$scope*/ 134217728) {
    				overlay3_changes.$$scope = { dirty, ctx };
    			}

    			if (!updating_shown_4 && dirty[0] & /*showC4*/ 131072) {
    				updating_shown_4 = true;
    				overlay3_changes.shown = /*showC4*/ ctx[17];
    				add_flush_callback(() => updating_shown_4 = false);
    			}

    			overlay3.$set(overlay3_changes);
    			const overlay4_changes = {};

    			if (dirty[0] & /*$timeOffset, $forceMode, time*/ 18874370 | dirty[1] & /*$$scope*/ 134217728) {
    				overlay4_changes.$$scope = { dirty, ctx };
    			}

    			if (!updating_shown_5 && dirty[0] & /*showSunset*/ 262144) {
    				updating_shown_5 = true;
    				overlay4_changes.shown = /*showSunset*/ ctx[18];
    				add_flush_callback(() => updating_shown_5 = false);
    			}

    			overlay4.$set(overlay4_changes);
    			const overlay5_changes = {};

    			if (dirty[0] & /*data, $twelveCorrectiveFactor*/ 8388609 | dirty[1] & /*$$scope*/ 134217728) {
    				overlay5_changes.$$scope = { dirty, ctx };
    			}

    			if (!updating_shown_6 && dirty[0] & /*showSettings*/ 524288) {
    				updating_shown_6 = true;
    				overlay5_changes.shown = /*showSettings*/ ctx[19];
    				add_flush_callback(() => updating_shown_6 = false);
    			}

    			overlay5.$set(overlay5_changes);

    			if (/*showImage*/ ctx[10]) {
    				if (if_block4) {
    					if_block4.p(ctx, dirty);

    					if (dirty[0] & /*showImage*/ 1024) {
    						transition_in(if_block4, 1);
    					}
    				} else {
    					if_block4 = create_if_block(ctx);
    					if_block4.c();
    					transition_in(if_block4, 1);
    					if_block4.m(if_block4_anchor.parentNode, if_block4_anchor);
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
    			transition_in(overlay0.$$.fragment, local);
    			transition_in(overlay1.$$.fragment, local);
    			transition_in(message.$$.fragment, local);
    			transition_in(if_block1);
    			transition_in(clock.$$.fragment, local);
    			transition_in(graph.$$.fragment, local);
    			transition_in(if_block2);
    			transition_in(if_block3);
    			transition_in(ledselector.$$.fragment, local);
    			transition_in(overlay2.$$.fragment, local);
    			transition_in(overlay3.$$.fragment, local);
    			transition_in(overlay4.$$.fragment, local);
    			transition_in(overlay5.$$.fragment, local);
    			transition_in(if_block4);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(overlay0.$$.fragment, local);
    			transition_out(overlay1.$$.fragment, local);
    			transition_out(message.$$.fragment, local);
    			transition_out(if_block1);
    			transition_out(clock.$$.fragment, local);
    			transition_out(graph.$$.fragment, local);
    			transition_out(if_block2);
    			transition_out(if_block3);
    			transition_out(ledselector.$$.fragment, local);
    			transition_out(overlay2.$$.fragment, local);
    			transition_out(overlay3.$$.fragment, local);
    			transition_out(overlay4.$$.fragment, local);
    			transition_out(overlay5.$$.fragment, local);
    			transition_out(if_block4);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(overlay0, detaching);
    			if (detaching) detach_dev(t0);
    			destroy_component(overlay1, detaching);
    			if (detaching) detach_dev(t1);
    			destroy_component(message, detaching);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(div0);
    			if (if_block0) if_block0.d();
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(div1);
    			if (if_block1) if_block1.d();
    			if (detaching) detach_dev(t4);
    			if (detaching) detach_dev(div6);
    			destroy_component(clock);
    			destroy_component(graph);
    			if (detaching) detach_dev(t11);
    			if (detaching) detach_dev(div7);
    			if (if_block2) if_block2.d();
    			if (detaching) detach_dev(t12);
    			if (detaching) detach_dev(div8);
    			if (if_block3) if_block3.d();
    			if (detaching) detach_dev(t13);
    			if (detaching) detach_dev(div10);
    			destroy_component(ledselector);
    			if (detaching) detach_dev(t18);
    			destroy_component(overlay2, detaching);
    			if (detaching) detach_dev(t19);
    			destroy_component(overlay3, detaching);
    			if (detaching) detach_dev(t20);
    			destroy_component(overlay4, detaching);
    			if (detaching) detach_dev(t21);
    			destroy_component(overlay5, detaching);
    			if (detaching) detach_dev(t22);
    			if (if_block4) if_block4.d(detaching);
    			if (detaching) detach_dev(if_block4_anchor);
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
    	let bS;
    	let $timeOffset;
    	let $darkMode;
    	let $twelveCorrectiveFactor;
    	let $forceMode;
    	validate_store(timeOffset, "timeOffset");
    	component_subscribe($$self, timeOffset, $$value => $$invalidate(21, $timeOffset = $$value));
    	validate_store(darkMode, "darkMode");
    	component_subscribe($$self, darkMode, $$value => $$invalidate(22, $darkMode = $$value));
    	validate_store(twelveCorrectiveFactor, "twelveCorrectiveFactor");
    	component_subscribe($$self, twelveCorrectiveFactor, $$value => $$invalidate(23, $twelveCorrectiveFactor = $$value));
    	validate_store(forceMode, "forceMode");
    	component_subscribe($$self, forceMode, $$value => $$invalidate(24, $forceMode = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
    	const { ipcRenderer } = require("electron");
    	let data, time, lastUpdateDate;
    	let voltage = data?.c.reduce((a, b) => a + b);
    	let status = "Waiting for data...";
    	let chargeStatus = "Waiting for charging data...";
    	let chargeConsoleText = "";

    	onMount(() => {
    		const interval = setInterval(
    			() => {
    				$$invalidate(1, time = new Date(new Date().getTime() + $timeOffset * 60 * 60 * 1000));
    			},
    			1000
    		);

    		ipcRenderer.send("ready_for_data");
    		console.log("1) Sent ready");
    		return () => clearInterval(interval);
    	});

    	let graphData = [[]];

    	// let graphData = [[], []];
    	// When adding power back: axis settings here. {axis: 350, color: "black", maxPoints: 35x`, units: "kW", minIs0: true,},
    	let err, errOverlay;

    	ipcRenderer.on("error", (event, _err) => {
    		$$invalidate(8, err = _err);
    		$$invalidate(9, errOverlay = true);
    	});

    	let showImage = true;

    	ipcRenderer.on("data", (event, _data) => {
    		if (_data.s === "normal") {
    			if (showImage) {
    				$$invalidate(10, showImage = false);
    				console.log("2 or 4) Got data");
    			}

    			$$invalidate(3, voltage = _data.c.reduce((a, b) => a + b));

    			if (voltage && _data.hasOwnProperty("pC")) {
    				graphData[0].push(voltage);

    				// graphData[1].push(Math.abs((_data.pC * voltage) / 1000));
    				$$invalidate(7, graphData);
    			}

    			$$invalidate(12, messageShown = false);
    			_data.f = Math.round(_data.f * 100 / 256);
    			$$invalidate(0, data = _data);
    			$$invalidate(4, status = "Got last data " + new Date(new Date().getTime() + $timeOffset * 60 * 60 * 1000).toLocaleTimeString());

    			const options = [
    				"Waiting for plug",
    				"Plugged in, not charging",
    				"Charging paused, balancing cells",
    				"Charging!",
    				"Waiting For Charger"
    			];

    			if (chargeStatus !== options[_data.ch]) {
    				$$invalidate(5, chargeStatus = options[_data.ch]);
    				$$invalidate(6, chargeConsoleText += new Date(new Date().getTime() + $timeOffset * 60 * 60 * 1000).toLocaleTimeString() + " " + chargeStatus + "\n");
    			}

    			$$invalidate(2, lastUpdateDate = new Date(new Date().getTime() + $timeOffset * 60 * 60 * 1000));
    		} else if (_data.s === "bms_error") {
    			console.log("BMS Error: " + _data.error);
    		} else if (_data.s === "log") {
    			console.log(_data.m);
    		}
    	});

    	ipcRenderer.on("select_port", (event, _data) => {
    		$$invalidate(15, showOverlay = true);
    		$$invalidate(14, availablePorts = _data);
    		console.log("2) Selecting port");
    	});

    	let messageContent = "";
    	let messageShown = false;

    	ipcRenderer.on("response", (event, _data) => {
    		$$invalidate(11, messageContent = _data);
    		$$invalidate(12, messageShown = true);
    		console.log("5) Got response.");
    	});

    	function sendPort(portName) {
    		console.log("3) Sending port " + portName);
    		ipcRenderer.send("selected_port", portName);
    		$$invalidate(15, showOverlay = false);
    	}

    	let portName = "";
    	let availablePorts;
    	let showOverlay = false;
    	let showSnake = false;
    	let showC4 = false;
    	let showSunset = false;
    	let showSettings = false;
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_2.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	function overlay0_shown_binding(value) {
    		errOverlay = value;
    		$$invalidate(9, errOverlay);
    	}

    	const click_handler = port => $$invalidate(13, portName = port);
    	const click_handler_1 = () => $$invalidate(13, portName = "COM" + portName);

    	function input1_input_handler() {
    		portName = this.value;
    		$$invalidate(13, portName);
    	}

    	const click_handler_2 = () => {
    		sendPort(portName);
    		$$invalidate(15, showOverlay = false);
    	};

    	const click_handler_3 = () => {
    		$$invalidate(15, showOverlay = false);
    		setTimeout(() => ipcRenderer.send("ready_for_data"), 500);
    	};

    	function overlay1_shown_binding(value) {
    		showOverlay = value;
    		$$invalidate(15, showOverlay);
    	}

    	const func = () => ipcRenderer.send("ready_for_data");

    	function message_shown_binding(value) {
    		messageShown = value;
    		$$invalidate(12, messageShown);
    	}

    	const click_handler_4 = () => $$invalidate(16, showSnake = true);
    	const click_handler_5 = () => $$invalidate(17, showC4 = true);
    	const click_handler_6 = () => $$invalidate(18, showSunset = true);
    	const click_handler_7 = () => $$invalidate(19, showSettings = true);
    	const closeOverlay_handler = () => $$invalidate(16, showSnake = false);

    	function overlay2_shown_binding(value) {
    		showSnake = value;
    		$$invalidate(16, showSnake);
    	}

    	const closeOverlay_handler_1 = () => $$invalidate(17, showC4 = false);

    	function overlay3_shown_binding(value) {
    		showC4 = value;
    		$$invalidate(17, showC4);
    	}

    	const click_handler_8 = () => forceMode.set("Light");
    	const click_handler_9 = () => forceMode.set("Dark");
    	const click_handler_10 = () => forceMode.set("Adaptive");
    	const click_handler_11 = () => timeOffset.update(e => e + 1);
    	const click_handler_12 = () => timeOffset.update(e => e - 1);

    	function overlay4_shown_binding(value) {
    		showSunset = value;
    		$$invalidate(18, showSunset);
    	}

    	function input_input_handler() {
    		$twelveCorrectiveFactor = to_number(this.value);
    		twelveCorrectiveFactor.set($twelveCorrectiveFactor);
    	}

    	function overlay5_shown_binding(value) {
    		showSettings = value;
    		$$invalidate(19, showSettings);
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
    		Message,
    		Console,
    		LEDSelector,
    		Snake,
    		Clock,
    		getColor,
    		darkMode,
    		today_sunset,
    		today_sunrise,
    		forceMode,
    		timeOffset,
    		twelveCorrectiveFactor,
    		C4,
    		ipcRenderer,
    		data,
    		time,
    		lastUpdateDate,
    		voltage,
    		status,
    		chargeStatus,
    		chargeConsoleText,
    		graphData,
    		err,
    		errOverlay,
    		showImage,
    		messageContent,
    		messageShown,
    		sendPort,
    		portName,
    		availablePorts,
    		showOverlay,
    		showSnake,
    		showC4,
    		showSunset,
    		showSettings,
    		bS,
    		$timeOffset,
    		$darkMode,
    		$twelveCorrectiveFactor,
    		$forceMode
    	});

    	$$self.$inject_state = $$props => {
    		if ("data" in $$props) $$invalidate(0, data = $$props.data);
    		if ("time" in $$props) $$invalidate(1, time = $$props.time);
    		if ("lastUpdateDate" in $$props) $$invalidate(2, lastUpdateDate = $$props.lastUpdateDate);
    		if ("voltage" in $$props) $$invalidate(3, voltage = $$props.voltage);
    		if ("status" in $$props) $$invalidate(4, status = $$props.status);
    		if ("chargeStatus" in $$props) $$invalidate(5, chargeStatus = $$props.chargeStatus);
    		if ("chargeConsoleText" in $$props) $$invalidate(6, chargeConsoleText = $$props.chargeConsoleText);
    		if ("graphData" in $$props) $$invalidate(7, graphData = $$props.graphData);
    		if ("err" in $$props) $$invalidate(8, err = $$props.err);
    		if ("errOverlay" in $$props) $$invalidate(9, errOverlay = $$props.errOverlay);
    		if ("showImage" in $$props) $$invalidate(10, showImage = $$props.showImage);
    		if ("messageContent" in $$props) $$invalidate(11, messageContent = $$props.messageContent);
    		if ("messageShown" in $$props) $$invalidate(12, messageShown = $$props.messageShown);
    		if ("portName" in $$props) $$invalidate(13, portName = $$props.portName);
    		if ("availablePorts" in $$props) $$invalidate(14, availablePorts = $$props.availablePorts);
    		if ("showOverlay" in $$props) $$invalidate(15, showOverlay = $$props.showOverlay);
    		if ("showSnake" in $$props) $$invalidate(16, showSnake = $$props.showSnake);
    		if ("showC4" in $$props) $$invalidate(17, showC4 = $$props.showC4);
    		if ("showSunset" in $$props) $$invalidate(18, showSunset = $$props.showSunset);
    		if ("showSettings" in $$props) $$invalidate(19, showSettings = $$props.showSettings);
    		if ("bS" in $$props) $$invalidate(20, bS = $$props.bS);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty[0] & /*data*/ 1) {
    			$$invalidate(20, bS = data?.bS.toString(2).split("").reverse().join(""));
    		}

    		if ($$self.$$.dirty[0] & /*data*/ 1) {
    			setContext("animationDuration", data ? data.i : 1);
    		}
    	};

    	return [
    		data,
    		time,
    		lastUpdateDate,
    		voltage,
    		status,
    		chargeStatus,
    		chargeConsoleText,
    		graphData,
    		err,
    		errOverlay,
    		showImage,
    		messageContent,
    		messageShown,
    		portName,
    		availablePorts,
    		showOverlay,
    		showSnake,
    		showC4,
    		showSunset,
    		showSettings,
    		bS,
    		$timeOffset,
    		$darkMode,
    		$twelveCorrectiveFactor,
    		$forceMode,
    		ipcRenderer,
    		sendPort,
    		overlay0_shown_binding,
    		click_handler,
    		click_handler_1,
    		input1_input_handler,
    		click_handler_2,
    		click_handler_3,
    		overlay1_shown_binding,
    		func,
    		message_shown_binding,
    		click_handler_4,
    		click_handler_5,
    		click_handler_6,
    		click_handler_7,
    		closeOverlay_handler,
    		overlay2_shown_binding,
    		closeOverlay_handler_1,
    		overlay3_shown_binding,
    		click_handler_8,
    		click_handler_9,
    		click_handler_10,
    		click_handler_11,
    		click_handler_12,
    		overlay4_shown_binding,
    		input_input_handler,
    		overlay5_shown_binding
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {}, [-1, -1]);

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
