var app = (function () {
    'use strict';

    function noop$1() { }
    const identity = x => x;
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
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
    let src_url_equal_anchor;
    function src_url_equal(element_src, url) {
        if (!src_url_equal_anchor) {
            src_url_equal_anchor = document.createElement('a');
        }
        src_url_equal_anchor.href = url;
        return element_src === src_url_equal_anchor.href;
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop$1;
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
    function update_slot_base(slot, slot_definition, ctx, $$scope, slot_changes, get_slot_context_fn) {
        if (slot_changes) {
            const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
            slot.p(slot_context, slot_changes);
        }
    }
    function get_all_dirty_from_scope($$scope) {
        if ($$scope.ctx.length > 32) {
            const dirty = [];
            const length = $$scope.ctx.length / 32;
            for (let i = 0; i < length; i++) {
                dirty[i] = -1;
            }
            return dirty;
        }
        return -1;
    }
    function exclude_internal_props(props) {
        const result = {};
        for (const k in props)
            if (k[0] !== '$')
                result[k] = props[k];
        return result;
    }
    function set_store_value(store, ret, value) {
        store.set(value);
        return ret;
    }

    const is_client = typeof window !== 'undefined';
    let now = is_client
        ? () => window.performance.now()
        : () => Date.now();
    let raf = is_client ? cb => requestAnimationFrame(cb) : noop$1;

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
    function get_root_for_style(node) {
        if (!node)
            return document;
        const root = node.getRootNode ? node.getRootNode() : node.ownerDocument;
        if (root && root.host) {
            return root;
        }
        return node.ownerDocument;
    }
    function append_empty_stylesheet(node) {
        const style_element = element('style');
        append_stylesheet(get_root_for_style(node), style_element);
        return style_element.sheet;
    }
    function append_stylesheet(node, style) {
        append(node.head || node, style);
        return style.sheet;
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        if (node.parentNode) {
            node.parentNode.removeChild(node);
        }
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
    function set_attributes(node, attributes) {
        // @ts-ignore
        const descriptors = Object.getOwnPropertyDescriptors(node.__proto__);
        for (const key in attributes) {
            if (attributes[key] == null) {
                node.removeAttribute(key);
            }
            else if (key === 'style') {
                node.style.cssText = attributes[key];
            }
            else if (key === '__value') {
                node.value = node[key] = attributes[key];
            }
            else if (descriptors[key] && descriptors[key].set) {
                node[key] = attributes[key];
            }
            else {
                attr(node, key, attributes[key]);
            }
        }
    }
    function to_number(value) {
        return value === '' ? null : +value;
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_data(text, data) {
        data = '' + data;
        if (text.wholeText !== data)
            text.data = data;
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function set_style(node, key, value, important) {
        if (value === null) {
            node.style.removeProperty(key);
        }
        else {
            node.style.setProperty(key, value, important ? 'important' : '');
        }
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail, { bubbles = false, cancelable = false } = {}) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, cancelable, detail);
        return e;
    }
    function construct_svelte_component(component, props) {
        return new component(props);
    }

    // we need to store the information for multiple documents because a Svelte application could also contain iframes
    // https://github.com/sveltejs/svelte/issues/3624
    const managed_styles = new Map();
    let active = 0;
    // https://github.com/darkskyapp/string-hash/blob/master/index.js
    function hash(str) {
        let hash = 5381;
        let i = str.length;
        while (i--)
            hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
        return hash >>> 0;
    }
    function create_style_information(doc, node) {
        const info = { stylesheet: append_empty_stylesheet(node), rules: {} };
        managed_styles.set(doc, info);
        return info;
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
        const doc = get_root_for_style(node);
        const { stylesheet, rules } = managed_styles.get(doc) || create_style_information(doc, node);
        if (!rules[name]) {
            rules[name] = true;
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
            managed_styles.forEach(info => {
                const { ownerNode } = info.stylesheet;
                // there is no ownerNode if it runs on jsdom.
                if (ownerNode)
                    detach(ownerNode);
            });
            managed_styles.clear();
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
    /**
     * The `onMount` function schedules a callback to run as soon as the component has been mounted to the DOM.
     * It must be called during the component's initialisation (but doesn't need to live *inside* the component;
     * it can be called from an external module).
     *
     * `onMount` does not run inside a [server-side component](/docs#run-time-server-side-component-api).
     *
     * https://svelte.dev/docs#run-time-svelte-onmount
     */
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    /**
     * Schedules a callback to run immediately after the component has been updated.
     *
     * The first time the callback runs will be after the initial `onMount`
     */
    function afterUpdate(fn) {
        get_current_component().$$.after_update.push(fn);
    }
    /**
     * Schedules a callback to run immediately before the component is unmounted.
     *
     * Out of `onMount`, `beforeUpdate`, `afterUpdate` and `onDestroy`, this is the
     * only one that runs inside a server-side component.
     *
     * https://svelte.dev/docs#run-time-svelte-ondestroy
     */
    function onDestroy(fn) {
        get_current_component().$$.on_destroy.push(fn);
    }
    /**
     * Creates an event dispatcher that can be used to dispatch [component events](/docs#template-syntax-component-directives-on-eventname).
     * Event dispatchers are functions that can take two arguments: `name` and `detail`.
     *
     * Component events created with `createEventDispatcher` create a
     * [CustomEvent](https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent).
     * These events do not [bubble](https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Building_blocks/Events#Event_bubbling_and_capture).
     * The `detail` argument corresponds to the [CustomEvent.detail](https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent/detail)
     * property and can contain any type of data.
     *
     * https://svelte.dev/docs#run-time-svelte-createeventdispatcher
     */
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail, { cancelable = false } = {}) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail, { cancelable });
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
                return !event.defaultPrevented;
            }
            return true;
        };
    }
    // TODO figure out if we still want to support
    // shorthand events, or if we want to implement
    // a real bubbling mechanism
    function bubble(component, event) {
        const callbacks = component.$$.callbacks[event.type];
        if (callbacks) {
            // @ts-ignore
            callbacks.slice().forEach(fn => fn.call(this, event));
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
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            while (flushidx < dirty_components.length) {
                const component = dirty_components[flushidx];
                flushidx++;
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
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
        seen_callbacks.clear();
        set_current_component(saved_component);
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
        else if (callback) {
            callback();
        }
    }
    const null_transition = { duration: 0 };
    function create_in_transition(node, fn, params) {
        const options = { direction: 'in' };
        let config = fn(node, params, options);
        let running = false;
        let animation_name;
        let task;
        let uid = 0;
        function cleanup() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function go() {
            const { delay = 0, duration = 300, easing = identity, tick = noop$1, css } = config || null_transition;
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
                started = true;
                delete_rule(node);
                if (is_function(config)) {
                    config = config(options);
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
        const options = { direction: 'out' };
        let config = fn(node, params, options);
        let running = true;
        let animation_name;
        const group = outros;
        group.r += 1;
        function go() {
            const { delay = 0, duration = 300, easing = identity, tick = noop$1, css } = config || null_transition;
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
                config = config(options);
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
        const options = { direction: 'both' };
        let config = fn(node, params, options);
        let t = intro ? 0 : 1;
        let running_program = null;
        let pending_program = null;
        let animation_name = null;
        function clear_animation() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function init(program, duration) {
            const d = (program.b - t);
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
            const { delay = 0, duration = 300, easing = identity, tick = noop$1, css } = config || null_transition;
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
                        config = config(options);
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

    function get_spread_update(levels, updates) {
        const update = {};
        const to_null_out = {};
        const accounted_for = { $$scope: 1 };
        let i = levels.length;
        while (i--) {
            const o = levels[i];
            const n = updates[i];
            if (n) {
                for (const key in o) {
                    if (!(key in n))
                        to_null_out[key] = 1;
                }
                for (const key in n) {
                    if (!accounted_for[key]) {
                        update[key] = n[key];
                        accounted_for[key] = 1;
                    }
                }
                levels[i] = n;
            }
            else {
                for (const key in o) {
                    accounted_for[key] = 1;
                }
            }
        }
        for (const key in to_null_out) {
            if (!(key in update))
                update[key] = undefined;
        }
        return update;
    }
    function get_spread_object(spread_props) {
        return typeof spread_props === 'object' && spread_props !== null ? spread_props : {};
    }

    function bind(component, name, callback, value) {
        const index = component.$$.props[name];
        if (index !== undefined) {
            component.$$.bound[index] = callback;
            if (value === undefined) {
                callback(component.$$.ctx[index]);
            }
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = component.$$.on_mount.map(run).filter(is_function);
                // if the component was destroyed immediately
                // it will update the `$$.on_destroy` reference to `null`.
                // the destructured on_destroy may still reference to the old array
                if (component.$$.on_destroy) {
                    component.$$.on_destroy.push(...new_on_destroy);
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
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: [],
            // state
            props,
            update: noop$1,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
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
            this.$destroy = noop$1;
        }
        $on(type, callback) {
            if (!is_function(callback)) {
                return noop$1;
            }
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
    function writable(value, start = noop$1) {
        let stop;
        const subscribers = new Set();
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (const subscriber of subscribers) {
                        subscriber[1]();
                        subscriber_queue.push(subscriber, value);
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
        function subscribe(run, invalidate = noop$1) {
            const subscriber = [run, invalidate];
            subscribers.add(subscriber);
            if (subscribers.size === 1) {
                stop = start(set) || noop$1;
            }
            run(value);
            return () => {
                subscribers.delete(subscriber);
                if (subscribers.size === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }
    function derived(stores, fn, initial_value) {
        const single = !Array.isArray(stores);
        const stores_array = single
            ? [stores]
            : stores;
        const auto = fn.length < 2;
        return readable(initial_value, (set) => {
            let inited = false;
            const values = [];
            let pending = 0;
            let cleanup = noop$1;
            const sync = () => {
                if (pending) {
                    return;
                }
                cleanup();
                const result = fn(single ? values[0] : values, set);
                if (auto) {
                    set(result);
                }
                else {
                    cleanup = is_function(result) ? result : noop$1;
                }
            };
            const unsubscribers = stores_array.map((store, i) => subscribe(store, (value) => {
                values[i] = value;
                pending &= ~(1 << i);
                if (inited) {
                    sync();
                }
            }, () => {
                pending |= (1 << i);
            }));
            inited = true;
            sync();
            return function stop() {
                run_all(unsubscribers);
                cleanup();
            };
        });
    }

    function createCommonjsModule(fn) {
      var module = { exports: {} };
    	return fn(module, module.exports), module.exports;
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
            console.log(storable.usedKeys);
            return;
        }
        storable.usedKeys.push(localStorageKey);
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

    const forceMode = storable('forceMode', 'Adaptive');
    const timeOffset = storable('timeOffset', 0);
    const currentTime = derived(timeOffset, ($timeOffset, set) => {
        console.log($timeOffset);
        const update = () => set(new Date(new Date().getTime() + $timeOffset * 1000 * 60 * 60));
        const interval = setInterval(update, 1000);
        update();
        return () => clearInterval(interval);
    });
    const darkMode = derived([currentTime, forceMode], ([$currentTime, $forceMode], set) => {
        let dm;
        if ($forceMode === 'Light') dm = false;
        else if ($forceMode === 'Dark') dm = true;
        else if ($forceMode === 'Adaptive') {
            try {
                const times = suncalc.getTimes($currentTime, 39.1532, -77.0669);
                const today_sunset = times.sunset;
                const today_sunrise = times.sunrise;
                // console.log(today_sunrise);
                // console.log(today_sunset);
                // console.log($currentTime);
                dm = ($currentTime <= today_sunrise || $currentTime > today_sunset);
            } catch (e) {
                dm = false;
            }
        }
        set(dm);
    });
    // darkMode.subscribe((dm) => {
    //     console.log("The dark mode was updated to " + dm);
    //     console.trace()
    // })
    // forceMode.subscribe((dm) => {
    //     console.log("The force mode was updated to " + dm);
    //     console.trace()
    // })
    const twelveCorrectiveFactor = storable('twelveCorrectiveFactor', 1);
    const gForceScale = storable('gForceScale', 1);

    darkMode.subscribe((dm) => document.documentElement.setAttribute('data-theme', dm ? 'dark' : 'light'));
    // forceMode.set('Dark')

    // The issue we are having is that data comes sporadically from the front and back Arduino's.
    // Some pages just need to the current state. But it becomes tricky when we need the history of datapoints (the graphs)
    // We also do not want to rerender everything if something hasn't changed.
    // Compromise - we will compartmentalize by different components.
    const numCells = 21;
    const controllerData = writable({
        speed: 0,
        voltage: 77.7,
        motorCurrent: 450,
        power: 23,
        batteryCurrent: 296,
        accelerometer: {x: 0, y: .2}
    });
    const inverterData = writable({on: false});
    const deviceStatusData = writable({
        lastFrontContact: 0,
        lastBackContact: 0,
        reverse: false,
        ignition: false,
        state: 0,
        twelveVolt: 12.6,
    });
    const temperatureData = writable({}); //Temps, fan
    const BMSData = writable({balanceStatus: 0, cellVoltages: [], lastBMSPing: 0, batteryVoltage: 0});
    const remainingAH = storable('remainingAH', 136);
    const chargerData = writable({
        current: 10,
        inputVoltage: 150,
        outputVoltage: 78,
        temp: 35,
        running: true,
        lastChargerPing: new Date().getTime(),
    });
    const updateDatas = (data) => {
        let lastUpdateTime, updateTime = new Date().getTime(), current, ignore = true, batteryFull = false;
        if (data.id === 'front') {
            deviceStatusData.update(e => {
                lastUpdateTime = e.lastFrontContact;
                e.lastFrontContact = updateTime;
                e.reverse = data.reverse;
                e.ignition = data.ignition;
                // console.log(data.ignition)
                return e;
            });
            controllerData.update((cD) => {
                cD.voltage = data.voltage;
                cD.motorCurrent = data.motorCurrent;
                cD.power = data.power;
                cD.batteryCurrent = data.batteryCurrent;
                cD.accelerometer = data.accelerometer;
                cD.speed = data.speed;
                current = -data.batteryCurrent;
                ignore = current > -10 || !data.ignition;
                return cD;
            });
            inverterData.update((iD) => {
                iD.on = data.inverter;
                return iD;
            });
        } else if (data.s === 'normal') {
            deviceStatusData.update(e => {
                lastUpdateTime = e.lastBackContact;
                e.lastBackContact = updateTime;
                e.state = data.ch;
                e.twelveVolt = data.tw;
                return e;
            });
            temperatureData.update((tD) => {
                tD.batteryTemps = data.bt;
                tD.temps = data.t;
                tD.fan = data.f;
                return tD;
            });
            BMSData.update((bD) => {
                bD.balanceStatus = data.bS;
                bD.cellVoltages = data.c;
                bD.lastBMSPing = data.lbp;
                bD.batteryVoltage = data.c.reduce((a, b) => a + b, 0);
                return bD;
            });
            chargerData.update((cD) => {
                cD.current = data.CC;
                cD.inputVoltage = data.CIV;
                cD.outputVoltage = data.COV;
                cD.temp = data.CT;
                cD.running = data.CR;
                cD.lastChargerPing = data.lcp;
                current = data.CC;
                ignore = !data.CR;
                batteryFull = data.CR && (numCells * 4.15 < cD.outputVoltage);
                return cD;
            });
        }
        if (!ignore && lastUpdateTime) {
            remainingAH.update((rAH) => {
                // console.log('updating remainingAH', rAH.toFixed(3), current.toFixed(0), (updateTime - lastUpdateTime).toFixed(0), 'delta:', (current * (updateTime - lastUpdateTime) / 1000 / 60 / 60))
                if (batteryFull) return 136;
                rAH = rAH + (current * (updateTime - lastUpdateTime) / 1000 / 60 / 60); // Amps * ms = A*ms / 1000 = A*s / 3600 = Ah
                return rAH;
            });
        }
    };

    // remainingAH.set(136);

    var datas = /*#__PURE__*/Object.freeze({
        __proto__: null,
        numCells: numCells,
        controllerData: controllerData,
        inverterData: inverterData,
        deviceStatusData: deviceStatusData,
        temperatureData: temperatureData,
        BMSData: BMSData,
        remainingAH: remainingAH,
        chargerData: chargerData,
        updateDatas: updateDatas
    });

    /* SvelteComponents\GForceMonitor.svelte generated by Svelte v3.55.0 */

    function create_fragment$h(ctx) {
    	let svg;
    	let g;
    	let line0;
    	let line1;
    	let circle;
    	let circle_transform_value;

    	return {
    		c() {
    			svg = svg_element("svg");
    			g = svg_element("g");
    			line0 = svg_element("line");
    			line1 = svg_element("line");
    			circle = svg_element("circle");
    			attr(line0, "x1", "50");
    			attr(line0, "x2", "50");
    			attr(line0, "y1", "10");
    			attr(line0, "y2", "90");
    			attr(line1, "y1", "50");
    			attr(line1, "y2", "50");
    			attr(line1, "x1", "10");
    			attr(line1, "x2", "90");
    			attr(g, "stroke", "grey");
    			attr(g, "stroke-width", "2");
    			attr(circle, "cx", "50");
    			attr(circle, "cy", "50");
    			attr(circle, "r", "10");
    			attr(circle, "fill", "black");
    			attr(circle, "transform", circle_transform_value = "translate(" + /*x*/ ctx[0].toFixed(2) + " " + /*y*/ ctx[1].toFixed(2) + ")");
    			attr(svg, "viewBox", "0 0 100 100");
    			attr(svg, "class", "svelte-1j2tbep");
    		},
    		m(target, anchor) {
    			insert(target, svg, anchor);
    			append(svg, g);
    			append(g, line0);
    			append(g, line1);
    			append(svg, circle);
    		},
    		p(ctx, [dirty]) {
    			if (dirty & /*x, y*/ 3 && circle_transform_value !== (circle_transform_value = "translate(" + /*x*/ ctx[0].toFixed(2) + " " + /*y*/ ctx[1].toFixed(2) + ")")) {
    				attr(circle, "transform", circle_transform_value);
    			}
    		},
    		i: noop$1,
    		o: noop$1,
    		d(detaching) {
    			if (detaching) detach(svg);
    		}
    	};
    }

    function instance$h($$self, $$props, $$invalidate) {
    	let $gForceScale;
    	let $controllerData;
    	component_subscribe($$self, gForceScale, $$value => $$invalidate(2, $gForceScale = $$value));
    	component_subscribe($$self, controllerData, $$value => $$invalidate(3, $controllerData = $$value));
    	let x, y;

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$controllerData, $gForceScale*/ 12) {
    			$$invalidate(0, x = $controllerData.accelerometer.x * 40 / ($gForceScale ? $gForceScale : 1));
    		}

    		if ($$self.$$.dirty & /*$controllerData, $gForceScale*/ 12) {
    			$$invalidate(1, y = $controllerData.accelerometer.y * 40 / ($gForceScale ? $gForceScale : 1));
    		}
    	};

    	return [x, y, $gForceScale, $controllerData];
    }

    class GForceMonitor extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$h, create_fragment$h, safe_not_equal, {});
    	}
    }

    /* screens\Power.svelte generated by Svelte v3.55.0 */

    function create_fragment$g(ctx) {
    	let div7;
    	let div1;
    	let div0;
    	let span0;

    	let t0_value = (/*$deviceStatusData*/ ctx[0].ignition
    	? /*$controllerData*/ ctx[1].speed.toFixed(0)
    	: '0') + "";

    	let t0;
    	let t1;
    	let t2;
    	let div2;
    	let gforcemonitor;
    	let t3;
    	let t4;
    	let t5;
    	let br;
    	let t6_value = /*$deviceStatusData*/ ctx[0].lastFrontContact + "";
    	let t6;
    	let t7;
    	let div4;
    	let div3;
    	let span1;

    	let t8_value = (/*$deviceStatusData*/ ctx[0].ignition
    	? /*$controllerData*/ ctx[1].power.toFixed(1)
    	: ' - ') + "";

    	let t8;
    	let t9;
    	let t10;
    	let div6;
    	let div5;
    	let span2;

    	let t11_value = (/*$deviceStatusData*/ ctx[0].ignition
    	? /*$controllerData*/ ctx[1].motorCurrent.toFixed(0)
    	: ' - ') + "";

    	let t11;
    	let t12;
    	let t13;
    	let current;
    	gforcemonitor = new GForceMonitor({});

    	return {
    		c() {
    			div7 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			span0 = element("span");
    			t0 = text(t0_value);
    			t1 = text("mph");
    			t2 = space();
    			div2 = element("div");
    			create_component(gforcemonitor.$$.fragment);
    			t3 = text("G Force Scale: ");
    			t4 = text(/*$gForceScale*/ ctx[2]);
    			t5 = text("g ");
    			br = element("br");
    			t6 = text(t6_value);
    			t7 = space();
    			div4 = element("div");
    			div3 = element("div");
    			span1 = element("span");
    			t8 = text(t8_value);
    			t9 = text("kW");
    			t10 = space();
    			div6 = element("div");
    			div5 = element("div");
    			span2 = element("span");
    			t11 = text(t11_value);
    			t12 = text("A");
    			t13 = text("Motor Amps");
    			attr(span0, "class", "svelte-bhzeij");
    			attr(div0, "class", "svelte-bhzeij");
    			attr(div1, "class", "svelte-bhzeij");
    			attr(div2, "class", "svelte-bhzeij");
    			attr(span1, "class", "svelte-bhzeij");
    			attr(div3, "class", "svelte-bhzeij");
    			attr(div4, "class", "svelte-bhzeij");
    			attr(span2, "class", "svelte-bhzeij");
    			attr(div5, "class", "svelte-bhzeij");
    			attr(div6, "class", "svelte-bhzeij");
    			attr(div7, "id", "container");
    			attr(div7, "class", "svelte-bhzeij");
    		},
    		m(target, anchor) {
    			insert(target, div7, anchor);
    			append(div7, div1);
    			append(div1, div0);
    			append(div0, span0);
    			append(span0, t0);
    			append(div0, t1);
    			append(div7, t2);
    			append(div7, div2);
    			mount_component(gforcemonitor, div2, null);
    			append(div2, t3);
    			append(div2, t4);
    			append(div2, t5);
    			append(div2, br);
    			append(div2, t6);
    			append(div7, t7);
    			append(div7, div4);
    			append(div4, div3);
    			append(div3, span1);
    			append(span1, t8);
    			append(div3, t9);
    			append(div7, t10);
    			append(div7, div6);
    			append(div6, div5);
    			append(div5, span2);
    			append(span2, t11);
    			append(div5, t12);
    			append(div6, t13);
    			current = true;
    		},
    		p(ctx, [dirty]) {
    			if ((!current || dirty & /*$deviceStatusData, $controllerData*/ 3) && t0_value !== (t0_value = (/*$deviceStatusData*/ ctx[0].ignition
    			? /*$controllerData*/ ctx[1].speed.toFixed(0)
    			: '0') + "")) set_data(t0, t0_value);

    			if (!current || dirty & /*$gForceScale*/ 4) set_data(t4, /*$gForceScale*/ ctx[2]);
    			if ((!current || dirty & /*$deviceStatusData*/ 1) && t6_value !== (t6_value = /*$deviceStatusData*/ ctx[0].lastFrontContact + "")) set_data(t6, t6_value);

    			if ((!current || dirty & /*$deviceStatusData, $controllerData*/ 3) && t8_value !== (t8_value = (/*$deviceStatusData*/ ctx[0].ignition
    			? /*$controllerData*/ ctx[1].power.toFixed(1)
    			: ' - ') + "")) set_data(t8, t8_value);

    			if ((!current || dirty & /*$deviceStatusData, $controllerData*/ 3) && t11_value !== (t11_value = (/*$deviceStatusData*/ ctx[0].ignition
    			? /*$controllerData*/ ctx[1].motorCurrent.toFixed(0)
    			: ' - ') + "")) set_data(t11, t11_value);
    		},
    		i(local) {
    			if (current) return;
    			transition_in(gforcemonitor.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(gforcemonitor.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(div7);
    			destroy_component(gforcemonitor);
    		}
    	};
    }

    function instance$g($$self, $$props, $$invalidate) {
    	let $deviceStatusData;
    	let $controllerData;
    	let $gForceScale;
    	component_subscribe($$self, deviceStatusData, $$value => $$invalidate(0, $deviceStatusData = $$value));
    	component_subscribe($$self, controllerData, $$value => $$invalidate(1, $controllerData = $$value));
    	component_subscribe($$self, gForceScale, $$value => $$invalidate(2, $gForceScale = $$value));
    	return [$deviceStatusData, $controllerData, $gForceScale];
    }

    class Power extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$g, create_fragment$g, safe_not_equal, {});
    	}
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

    /* SvelteComponents\StickyInfo.svelte generated by Svelte v3.55.0 */

    function create_if_block_3$1(ctx) {
    	let div;
    	let t0;
    	let t1_value = ((/*$currentTime*/ ctx[0] - /*$deviceStatusData*/ ctx[2].lastFrontContact) / 1000).toFixed(0) + "";
    	let t1;
    	let t2;

    	return {
    		c() {
    			div = element("div");
    			t0 = text("Error - No Contact with Front Node! (");
    			t1 = text(t1_value);
    			t2 = text("s ago)");
    			set_style(div, "color", "orange");
    			set_style(div, "font-size", "1.4vw");
    			set_style(div, "font-weight", "bolder");
    			set_style(div, "margin-top", "5px");
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);
    			append(div, t0);
    			append(div, t1);
    			append(div, t2);
    		},
    		p(ctx, dirty) {
    			if (dirty & /*$currentTime, $deviceStatusData*/ 5 && t1_value !== (t1_value = ((/*$currentTime*/ ctx[0] - /*$deviceStatusData*/ ctx[2].lastFrontContact) / 1000).toFixed(0) + "")) set_data(t1, t1_value);
    		},
    		d(detaching) {
    			if (detaching) detach(div);
    		}
    	};
    }

    // (66:0) {#if $currentTime > $deviceStatusData.lastFrontContact + 60000}
    function create_if_block_2$1(ctx) {
    	let div;

    	return {
    		c() {
    			div = element("div");
    			div.textContent = "Error - No Contact with Front Node! (a good while ago)";
    			set_style(div, "color", "red");
    			set_style(div, "font-size", "1.4vw");
    			set_style(div, "font-weight", "bolder");
    			set_style(div, "margin-top", "5px");
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);
    		},
    		p: noop$1,
    		d(detaching) {
    			if (detaching) detach(div);
    		}
    	};
    }

    // (80:66) 
    function create_if_block_1$1(ctx) {
    	let div;
    	let t0;
    	let t1_value = ((/*$currentTime*/ ctx[0] - /*$deviceStatusData*/ ctx[2].lastBackContact) / 1000).toFixed(0) + "";
    	let t1;
    	let t2;

    	return {
    		c() {
    			div = element("div");
    			t0 = text("Error - No Contact with Back Node! (");
    			t1 = text(t1_value);
    			t2 = text("s ago)");
    			set_style(div, "color", "orange");
    			set_style(div, "font-size", "1.4vw");
    			set_style(div, "font-weight", "bolder");
    			set_style(div, "margin-top", "5px");
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);
    			append(div, t0);
    			append(div, t1);
    			append(div, t2);
    		},
    		p(ctx, dirty) {
    			if (dirty & /*$currentTime, $deviceStatusData*/ 5 && t1_value !== (t1_value = ((/*$currentTime*/ ctx[0] - /*$deviceStatusData*/ ctx[2].lastBackContact) / 1000).toFixed(0) + "")) set_data(t1, t1_value);
    		},
    		d(detaching) {
    			if (detaching) detach(div);
    		}
    	};
    }

    // (76:0) {#if $currentTime > $deviceStatusData.lastBackContact + 60000}
    function create_if_block$6(ctx) {
    	let div;

    	return {
    		c() {
    			div = element("div");
    			div.textContent = "Error - No Contact with Back Node! (a good while ago)";
    			set_style(div, "color", "red");
    			set_style(div, "font-size", "1.4vw");
    			set_style(div, "font-weight", "bolder");
    			set_style(div, "margin-top", "5px");
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);
    		},
    		p: noop$1,
    		d(detaching) {
    			if (detaching) detach(div);
    		}
    	};
    }

    function create_fragment$f(ctx) {
    	let div0;
    	let t0_value = /*$currentTime*/ ctx[0].toLocaleTimeString() + "";
    	let t0;
    	let t1;
    	let div4;
    	let span0;
    	let t2_value = (/*$remainingAH*/ ctx[1] * 3.7 * 21 * 0.0035).toFixed(0) + "";
    	let t2;
    	let t3;
    	let t4;
    	let span1;
    	let t5_value = (/*$remainingAH*/ ctx[1] / 1.36).toFixed(0) + "";
    	let t5;
    	let t6;
    	let t7;
    	let div3;
    	let div2;
    	let div1;
    	let t8;
    	let t9;
    	let if_block1_anchor;

    	function select_block_type(ctx, dirty) {
    		if (/*$currentTime*/ ctx[0] > /*$deviceStatusData*/ ctx[2].lastFrontContact + 60000) return create_if_block_2$1;
    		if (/*$currentTime*/ ctx[0] > /*$deviceStatusData*/ ctx[2].lastFrontContact + 3000) return create_if_block_3$1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block0 = current_block_type && current_block_type(ctx);

    	function select_block_type_1(ctx, dirty) {
    		if (/*$currentTime*/ ctx[0] > /*$deviceStatusData*/ ctx[2].lastBackContact + 60000) return create_if_block$6;
    		if (/*$currentTime*/ ctx[0] > /*$deviceStatusData*/ ctx[2].lastBackContact + 3000) return create_if_block_1$1;
    	}

    	let current_block_type_1 = select_block_type_1(ctx);
    	let if_block1 = current_block_type_1 && current_block_type_1(ctx);

    	return {
    		c() {
    			div0 = element("div");
    			t0 = text(t0_value);
    			t1 = space();
    			div4 = element("div");
    			span0 = element("span");
    			t2 = text(t2_value);
    			t3 = text("mi");
    			t4 = space();
    			span1 = element("span");
    			t5 = text(t5_value);
    			t6 = text("%");
    			t7 = space();
    			div3 = element("div");
    			div2 = element("div");
    			div1 = element("div");
    			t8 = space();
    			if (if_block0) if_block0.c();
    			t9 = space();
    			if (if_block1) if_block1.c();
    			if_block1_anchor = empty();
    			set_style(div0, "text-align", "center");
    			set_style(div0, "font-size", "3vw");
    			set_style(div0, "font-weight", "bolder");
    			set_style(div0, "margin-top", "5px");
    			set_style(span0, "border-right", "1px grey solid");
    			set_style(span0, "padding-right", "7px");
    			set_style(span0, "display", "inline-block");
    			set_style(span0, "margin-right", "0");
    			attr(span0, "class", "svelte-8k9wrr");
    			attr(span1, "class", "svelte-8k9wrr");
    			attr(div1, "class", "liquid svelte-8k9wrr");
    			set_style(div1, "width", /*$remainingAH*/ ctx[1] / 1.36 + "%");
    			attr(div2, "class", "level svelte-8k9wrr");
    			attr(div3, "class", "pill svelte-8k9wrr");
    			attr(div4, "class", "container svelte-8k9wrr");
    		},
    		m(target, anchor) {
    			insert(target, div0, anchor);
    			append(div0, t0);
    			insert(target, t1, anchor);
    			insert(target, div4, anchor);
    			append(div4, span0);
    			append(span0, t2);
    			append(span0, t3);
    			append(div4, t4);
    			append(div4, span1);
    			append(span1, t5);
    			append(span1, t6);
    			append(div4, t7);
    			append(div4, div3);
    			append(div3, div2);
    			append(div2, div1);
    			insert(target, t8, anchor);
    			if (if_block0) if_block0.m(target, anchor);
    			insert(target, t9, anchor);
    			if (if_block1) if_block1.m(target, anchor);
    			insert(target, if_block1_anchor, anchor);
    		},
    		p(ctx, [dirty]) {
    			if (dirty & /*$currentTime*/ 1 && t0_value !== (t0_value = /*$currentTime*/ ctx[0].toLocaleTimeString() + "")) set_data(t0, t0_value);
    			if (dirty & /*$remainingAH*/ 2 && t2_value !== (t2_value = (/*$remainingAH*/ ctx[1] * 3.7 * 21 * 0.0035).toFixed(0) + "")) set_data(t2, t2_value);
    			if (dirty & /*$remainingAH*/ 2 && t5_value !== (t5_value = (/*$remainingAH*/ ctx[1] / 1.36).toFixed(0) + "")) set_data(t5, t5_value);

    			if (dirty & /*$remainingAH*/ 2) {
    				set_style(div1, "width", /*$remainingAH*/ ctx[1] / 1.36 + "%");
    			}

    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block0) {
    				if_block0.p(ctx, dirty);
    			} else {
    				if (if_block0) if_block0.d(1);
    				if_block0 = current_block_type && current_block_type(ctx);

    				if (if_block0) {
    					if_block0.c();
    					if_block0.m(t9.parentNode, t9);
    				}
    			}

    			if (current_block_type_1 === (current_block_type_1 = select_block_type_1(ctx)) && if_block1) {
    				if_block1.p(ctx, dirty);
    			} else {
    				if (if_block1) if_block1.d(1);
    				if_block1 = current_block_type_1 && current_block_type_1(ctx);

    				if (if_block1) {
    					if_block1.c();
    					if_block1.m(if_block1_anchor.parentNode, if_block1_anchor);
    				}
    			}
    		},
    		i: noop$1,
    		o: noop$1,
    		d(detaching) {
    			if (detaching) detach(div0);
    			if (detaching) detach(t1);
    			if (detaching) detach(div4);
    			if (detaching) detach(t8);

    			if (if_block0) {
    				if_block0.d(detaching);
    			}

    			if (detaching) detach(t9);

    			if (if_block1) {
    				if_block1.d(detaching);
    			}

    			if (detaching) detach(if_block1_anchor);
    		}
    	};
    }

    function instance$f($$self, $$props, $$invalidate) {
    	let $currentTime;
    	let $remainingAH;
    	let $deviceStatusData;
    	component_subscribe($$self, currentTime, $$value => $$invalidate(0, $currentTime = $$value));
    	component_subscribe($$self, remainingAH, $$value => $$invalidate(1, $remainingAH = $$value));
    	component_subscribe($$self, deviceStatusData, $$value => $$invalidate(2, $deviceStatusData = $$value));
    	return [$currentTime, $remainingAH, $deviceStatusData];
    }

    class StickyInfo extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$f, create_fragment$f, safe_not_equal, {});
    	}
    }

    /* SvelteComponents\Inputs\LabeledSwitch.svelte generated by Svelte v3.55.0 */

    function get_each_context$6(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[8] = list[i];
    	return child_ctx;
    }

    // (22:4) {#each options as option}
    function create_each_block$6(ctx) {
    	let button;
    	let t_value = /*option*/ ctx[8] + "";
    	let t;
    	let mounted;
    	let dispose;

    	function click_handler(...args) {
    		return /*click_handler*/ ctx[6](/*option*/ ctx[8], ...args);
    	}

    	return {
    		c() {
    			button = element("button");
    			t = text(t_value);
    			attr(button, "class", "svelte-qndp7t");
    			toggle_class(button, "selected", /*selected*/ ctx[0] === /*option*/ ctx[8]);
    		},
    		m(target, anchor) {
    			insert(target, button, anchor);
    			append(button, t);

    			if (!mounted) {
    				dispose = listen(button, "click", click_handler);
    				mounted = true;
    			}
    		},
    		p(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*options*/ 2 && t_value !== (t_value = /*option*/ ctx[8] + "")) set_data(t, t_value);

    			if (dirty & /*selected, options*/ 3) {
    				toggle_class(button, "selected", /*selected*/ ctx[0] === /*option*/ ctx[8]);
    			}
    		},
    		d(detaching) {
    			if (detaching) detach(button);
    			mounted = false;
    			dispose();
    		}
    	};
    }

    function create_fragment$e(ctx) {
    	let label;
    	let span;
    	let t;
    	let each_value = /*options*/ ctx[1];
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$6(get_each_context$6(ctx, each_value, i));
    	}

    	return {
    		c() {
    			label = element("label");
    			span = element("span");
    			t = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr(span, "class", "slideHighlight svelte-qndp7t");
    			set_style(span, "width", /*width*/ ctx[2] + "px");
    			set_style(span, "left", /*x*/ ctx[3] + "px");
    			attr(label, "class", "parent svelte-qndp7t");
    		},
    		m(target, anchor) {
    			insert(target, label, anchor);
    			append(label, span);
    			append(label, t);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(label, null);
    			}

    			/*label_binding*/ ctx[7](label);
    		},
    		p(ctx, [dirty]) {
    			if (dirty & /*width*/ 4) {
    				set_style(span, "width", /*width*/ ctx[2] + "px");
    			}

    			if (dirty & /*x*/ 8) {
    				set_style(span, "left", /*x*/ ctx[3] + "px");
    			}

    			if (dirty & /*selected, options, width, x, dispatch*/ 47) {
    				each_value = /*options*/ ctx[1];
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$6(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$6(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(label, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop$1,
    		o: noop$1,
    		d(detaching) {
    			if (detaching) detach(label);
    			destroy_each(each_blocks, detaching);
    			/*label_binding*/ ctx[7](null);
    		}
    	};
    }

    function instance$e($$self, $$props, $$invalidate) {
    	let { options = [] } = $$props;
    	let { selected = options[0] } = $$props;
    	const dispatch = createEventDispatcher();
    	let width = 0, x = 0;
    	let parent = null;

    	onMount(() => {
    		setTimeout(
    			() => {
    				const selectedOption = parent.children[1 + options.indexOf(selected)];
    				$$invalidate(2, width = selectedOption.clientWidth);
    				$$invalidate(3, x = selectedOption.getBoundingClientRect().x - parent.getBoundingClientRect().x);
    			},
    			200
    		);
    	});

    	const click_handler = (option, e) => {
    		$$invalidate(0, selected = option);
    		$$invalidate(2, width = e.srcElement.clientWidth);
    		$$invalidate(3, x = e.target.getBoundingClientRect().x - e.target.parentElement.getBoundingClientRect().x);

    		dispatch('change', {
    			value: selected,
    			index: options.indexOf(selected)
    		});
    	};

    	function label_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			parent = $$value;
    			$$invalidate(4, parent);
    		});
    	}

    	$$self.$$set = $$props => {
    		if ('options' in $$props) $$invalidate(1, options = $$props.options);
    		if ('selected' in $$props) $$invalidate(0, selected = $$props.selected);
    	};

    	return [selected, options, width, x, parent, dispatch, click_handler, label_binding];
    }

    class LabeledSwitch extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$e, create_fragment$e, safe_not_equal, { options: 1, selected: 0 });
    	}
    }

    /* SvelteComponents\Overlay.svelte generated by Svelte v3.55.0 */

    function create_fragment$d(ctx) {
    	let div1;
    	let div0;
    	let div0_style_value;
    	let current;
    	let mounted;
    	let dispose;
    	const default_slot_template = /*#slots*/ ctx[5].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[4], null);

    	return {
    		c() {
    			div1 = element("div");
    			div0 = element("div");
    			if (default_slot) default_slot.c();
    			attr(div0, "class", "container svelte-7ffx8d");
    			attr(div0, "style", div0_style_value = "width: " + /*width*/ ctx[2] + "%");
    			attr(div1, "class", "overlay svelte-7ffx8d");
    			set_style(div1, "visibility", /*shown*/ ctx[0] ? 'visible' : 'hidden');
    			toggle_class(div1, "closable", /*closable*/ ctx[1]);
    		},
    		m(target, anchor) {
    			insert(target, div1, anchor);
    			append(div1, div0);

    			if (default_slot) {
    				default_slot.m(div0, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen(window, "keydown", /*handleKeydown*/ ctx[3]),
    					listen(div0, "click", stop_propagation(/*click_handler*/ ctx[6])),
    					listen(div1, "click", /*click_handler_1*/ ctx[7]),
    					listen(div1, "keydown", /*handleKeydown*/ ctx[3])
    				];

    				mounted = true;
    			}
    		},
    		p(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 16)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[4],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[4])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[4], dirty, null),
    						null
    					);
    				}
    			}

    			if (!current || dirty & /*width*/ 4 && div0_style_value !== (div0_style_value = "width: " + /*width*/ ctx[2] + "%")) {
    				attr(div0, "style", div0_style_value);
    			}

    			if (!current || dirty & /*shown*/ 1) {
    				set_style(div1, "visibility", /*shown*/ ctx[0] ? 'visible' : 'hidden');
    			}

    			if (!current || dirty & /*closable*/ 2) {
    				toggle_class(div1, "closable", /*closable*/ ctx[1]);
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(div1);
    			if (default_slot) default_slot.d(detaching);
    			mounted = false;
    			run_all(dispose);
    		}
    	};
    }

    function instance$d($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	let { shown = false } = $$props;
    	let { closable = true } = $$props;
    	let { width = 50 } = $$props;

    	function handleKeydown(e) {
    		if (closable && e.keyCode === 27) $$invalidate(0, shown = false);
    	}

    	function click_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	const click_handler_1 = () => {
    		if (closable) $$invalidate(0, shown = false);
    	};

    	$$self.$$set = $$props => {
    		if ('shown' in $$props) $$invalidate(0, shown = $$props.shown);
    		if ('closable' in $$props) $$invalidate(1, closable = $$props.closable);
    		if ('width' in $$props) $$invalidate(2, width = $$props.width);
    		if ('$$scope' in $$props) $$invalidate(4, $$scope = $$props.$$scope);
    	};

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

    class Overlay extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$d, create_fragment$d, safe_not_equal, { shown: 0, closable: 1, width: 2 });
    	}
    }

    /* SvelteComponents\Games\Snake.svelte generated by Svelte v3.55.0 */

    function get_each_context$5(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[27] = list[i];
    	return child_ctx;
    }

    function get_each_context_1$3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[30] = list[i];
    	return child_ctx;
    }

    // (128:12) {#each row as col}
    function create_each_block_1$3(ctx) {
    	let td;

    	return {
    		c() {
    			td = element("td");
    			set_style(td, "background-color", ['inherit', 'green', 'red'][/*col*/ ctx[30]]);
    			set_style(td, "border-style", /*showDashes*/ ctx[4] ? 'dashed' : 'inherit');
    			set_style(td, "height", /*pixelSize*/ ctx[5]);
    			set_style(td, "width", /*pixelSize*/ ctx[5]);
    			set_style(td, "border-radius", /*showDashes*/ ctx[4] ? 'inherit' : '10px');
    			attr(td, "class", "svelte-a5ovh");
    		},
    		m(target, anchor) {
    			insert(target, td, anchor);
    		},
    		p(ctx, dirty) {
    			if (dirty[0] & /*gameBoard*/ 2) {
    				set_style(td, "background-color", ['inherit', 'green', 'red'][/*col*/ ctx[30]]);
    			}

    			if (dirty[0] & /*showDashes*/ 16) {
    				set_style(td, "border-style", /*showDashes*/ ctx[4] ? 'dashed' : 'inherit');
    			}

    			if (dirty[0] & /*pixelSize*/ 32) {
    				set_style(td, "height", /*pixelSize*/ ctx[5]);
    			}

    			if (dirty[0] & /*pixelSize*/ 32) {
    				set_style(td, "width", /*pixelSize*/ ctx[5]);
    			}

    			if (dirty[0] & /*showDashes*/ 16) {
    				set_style(td, "border-radius", /*showDashes*/ ctx[4] ? 'inherit' : '10px');
    			}
    		},
    		d(detaching) {
    			if (detaching) detach(td);
    		}
    	};
    }

    // (126:4) {#each gameBoard as row}
    function create_each_block$5(ctx) {
    	let tr;
    	let t;
    	let each_value_1 = /*row*/ ctx[27];
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1$3(get_each_context_1$3(ctx, each_value_1, i));
    	}

    	return {
    		c() {
    			tr = element("tr");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t = space();
    		},
    		m(target, anchor) {
    			insert(target, tr, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(tr, null);
    			}

    			append(tr, t);
    		},
    		p(ctx, dirty) {
    			if (dirty[0] & /*gameBoard, showDashes, pixelSize*/ 50) {
    				each_value_1 = /*row*/ ctx[27];
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1$3(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_1$3(child_ctx);
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
    		d(detaching) {
    			if (detaching) detach(tr);
    			destroy_each(each_blocks, detaching);
    		}
    	};
    }

    function create_fragment$c(ctx) {
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
    	let t7_value = (/*showDashes*/ ctx[4] ? 'Hide Grid' : 'Show Grid') + "";
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
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$5(get_each_context$5(ctx, each_value, i));
    	}

    	return {
    		c() {
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
    			set_style(div0, "display", "inline-block");
    			set_style(div1, "display", "inline-block");
    			set_style(div2, "display", "inline-block");
    			attr(input, "type", "number");
    			attr(input, "max", "25");
    			attr(input, "min", "4");
    			set_style(div3, "display", "inline-block");
    			set_style(div4, "display", "inline-block");
    		},
    		m(target, anchor) {
    			insert(target, table, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(table, null);
    			}

    			insert(target, t0, anchor);
    			insert(target, br0, anchor);
    			insert(target, t1, anchor);
    			insert(target, br1, anchor);
    			insert(target, t2, anchor);
    			insert(target, div0, anchor);
    			append(div0, button0);
    			insert(target, t4, anchor);
    			insert(target, div1, anchor);
    			append(div1, button1);
    			insert(target, t6, anchor);
    			insert(target, div2, anchor);
    			append(div2, button2);
    			append(button2, t7);
    			insert(target, t8, anchor);
    			insert(target, input, anchor);
    			set_input_value(input, /*boardSize*/ ctx[0]);
    			insert(target, t9, anchor);
    			insert(target, div3, anchor);
    			append(div3, t10);
    			append(div3, t11);
    			insert(target, t12, anchor);
    			insert(target, div4, anchor);
    			append(div4, t13);

    			if (!mounted) {
    				dispose = [
    					listen(window, "keydown", /*handleKeyboard*/ ctx[8]),
    					listen(window, "touchstart", /*handleTouchStart*/ ctx[9]),
    					listen(window, "touchend", /*handleTouchEnd*/ ctx[10]),
    					listen(button0, "click", /*click_handler*/ ctx[11]),
    					listen(button1, "click", /*start_over*/ ctx[7]),
    					listen(button2, "click", /*click_handler_1*/ ctx[12]),
    					listen(input, "input", /*input_input_handler*/ ctx[13])
    				];

    				mounted = true;
    			}
    		},
    		p(ctx, dirty) {
    			if (dirty[0] & /*gameBoard, showDashes, pixelSize*/ 50) {
    				each_value = /*gameBoard*/ ctx[1];
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$5(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$5(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(table, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty[0] & /*showDashes*/ 16 && t7_value !== (t7_value = (/*showDashes*/ ctx[4] ? 'Hide Grid' : 'Show Grid') + "")) set_data(t7, t7_value);

    			if (dirty[0] & /*boardSize*/ 1 && to_number(input.value) !== /*boardSize*/ ctx[0]) {
    				set_input_value(input, /*boardSize*/ ctx[0]);
    			}

    			if (dirty[0] & /*targetLength*/ 4) set_data(t11, /*targetLength*/ ctx[2]);
    			if (dirty[0] & /*status_box*/ 8) set_data(t13, /*status_box*/ ctx[3]);
    		},
    		i: noop$1,
    		o: noop$1,
    		d(detaching) {
    			if (detaching) detach(table);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach(t0);
    			if (detaching) detach(br0);
    			if (detaching) detach(t1);
    			if (detaching) detach(br1);
    			if (detaching) detach(t2);
    			if (detaching) detach(div0);
    			if (detaching) detach(t4);
    			if (detaching) detach(div1);
    			if (detaching) detach(t6);
    			if (detaching) detach(div2);
    			if (detaching) detach(t8);
    			if (detaching) detach(input);
    			if (detaching) detach(t9);
    			if (detaching) detach(div3);
    			if (detaching) detach(t12);
    			if (detaching) detach(div4);
    			mounted = false;
    			run_all(dispose);
    		}
    	};
    }

    function instance$c($$self, $$props, $$invalidate) {
    	let pixelSize;
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
    		direction = 'Right';
    		clearTimeout(timeout);
    		animation_loop();
    		$$invalidate(3, status_box = '');
    	}

    	const headLocation = { 'x': 3, 'y': 3 };
    	const segments = [];
    	const appleEquality = (a1, a2) => a1.x === a2.x && a1.y === a2.y;

    	function makeApple() {
    		if (currentLength >= boardSize * boardSize - 1) {
    			$$invalidate(3, status_box = 'You win or something...');
    			return;
    		}

    		let app = {
    			'x': Math.floor(Math.random() * boardSize),
    			'y': Math.floor(Math.random() * boardSize)
    		};

    		while (gameBoard[app.x][app.y] !== 0) {
    			app = {
    				'x': Math.floor(Math.random() * boardSize),
    				'y': Math.floor(Math.random() * boardSize)
    			};
    		}

    		$$invalidate(1, gameBoard[app.x][app.y] = 2, gameBoard);
    		return app;
    	}

    	start_over();

    	function animation_loop() {
    		direction = presses.length > 0 ? presses.shift() : direction;
    		headLocation.y += (direction === 'Right') - (direction === 'Left');
    		headLocation.x += (direction === 'Down') - (direction === 'Up');

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
    				$$invalidate(3, status_box = 'You win or something...');
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
    			'Up': 'Down',
    			'Down': 'Up',
    			'Right': 'Left',
    			'Left': 'Right'
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
    		if (45 > angle && angle > -45) doInput('Right');
    		if (135 > angle && angle > 45) doInput('Up');
    		if (-45 > angle && angle > -135) doInput('Down');
    		if (-135 > angle || angle > 135) doInput('Left');
    	}

    	let showDashes = true;
    	const click_handler = () => dispatch('closeOverlay');
    	const click_handler_1 = () => $$invalidate(4, showDashes = !showDashes);

    	function input_input_handler() {
    		boardSize = to_number(this.value);
    		$$invalidate(0, boardSize);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty[0] & /*boardSize*/ 1) {
    			start_over();
    		}

    		if ($$self.$$.dirty[0] & /*boardSize*/ 1) {
    			$$invalidate(5, pixelSize = (40 / boardSize).toFixed(2) + 'vw');
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

    class Snake extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$c, create_fragment$c, safe_not_equal, {}, null, [-1, -1]);
    	}
    }

    /* SvelteComponents\Games\C4.svelte generated by Svelte v3.55.0 */

    function get_each_context$4(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[11] = list[i];
    	child_ctx[13] = i;
    	return child_ctx;
    }

    function get_each_context_1$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[14] = list[i];
    	child_ctx[16] = i;
    	return child_ctx;
    }

    // (103:20) {#if col > 0}
    function create_if_block$5(ctx) {
    	let div;
    	let div_intro;
    	let div_outro;
    	let current;

    	return {
    		c() {
    			div = element("div");
    			set_style(div, "background-color", ['', 'blue', 'red', 'darkblue', 'darkred'][/*col*/ ctx[14]]);
    			set_style(div, "height", "100%");
    			set_style(div, "width", "100%");
    			set_style(div, "border-radius", /*pixelSize*/ ctx[2] / 2 + "vw");
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);
    			current = true;
    		},
    		p(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (!current || dirty & /*gameBoard*/ 1) {
    				set_style(div, "background-color", ['', 'blue', 'red', 'darkblue', 'darkred'][/*col*/ ctx[14]]);
    			}

    			if (!current || dirty & /*pixelSize*/ 4) {
    				set_style(div, "border-radius", /*pixelSize*/ ctx[2] / 2 + "vw");
    			}
    		},
    		i(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (div_outro) div_outro.end(1);

    				div_intro = create_in_transition(div, fly, {
    					duration: Math.log((/*i*/ ctx[13] + 1) * 50) * 150,
    					y: -(/*i*/ ctx[13] + 1) * 60,
    					easing: bounceOut
    				});

    				div_intro.start();
    			});

    			current = true;
    		},
    		o(local) {
    			if (div_intro) div_intro.invalidate();

    			div_outro = create_out_transition(div, fly, {
    				duration: 1500,
    				x: 1500 * (Math.random() - 0.5),
    				y: 1500 * (Math.random() - 0.5),
    				easing: sineIn
    			});

    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(div);
    			if (detaching && div_outro) div_outro.end();
    		}
    	};
    }

    // (100:12) {#each row as col, j}
    function create_each_block_1$2(ctx) {
    	let td;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block = /*col*/ ctx[14] > 0 && create_if_block$5(ctx);

    	function click_handler() {
    		return /*click_handler*/ ctx[6](/*j*/ ctx[16]);
    	}

    	return {
    		c() {
    			td = element("td");
    			if (if_block) if_block.c();
    			set_style(td, "height", /*pixelSize*/ ctx[2] + "vw");
    			set_style(td, "width", /*pixelSize*/ ctx[2] + "vw");
    			attr(td, "class", "svelte-h2qk5l");
    		},
    		m(target, anchor) {
    			insert(target, td, anchor);
    			if (if_block) if_block.m(td, null);
    			current = true;

    			if (!mounted) {
    				dispose = listen(td, "click", click_handler);
    				mounted = true;
    			}
    		},
    		p(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (/*col*/ ctx[14] > 0) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*gameBoard*/ 1) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$5(ctx);
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
    		i(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(td);
    			if (if_block) if_block.d();
    			mounted = false;
    			dispose();
    		}
    	};
    }

    // (98:4) {#each gameBoard as row, i}
    function create_each_block$4(ctx) {
    	let tr;
    	let t;
    	let current;
    	let each_value_1 = /*row*/ ctx[11];
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1$2(get_each_context_1$2(ctx, each_value_1, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	return {
    		c() {
    			tr = element("tr");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t = space();
    		},
    		m(target, anchor) {
    			insert(target, tr, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(tr, null);
    			}

    			append(tr, t);
    			current = true;
    		},
    		p(ctx, dirty) {
    			if (dirty & /*pixelSize, handleClick, gameBoard, Math, sineIn*/ 37) {
    				each_value_1 = /*row*/ ctx[11];
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1$2(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block_1$2(child_ctx);
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
    		i(local) {
    			if (current) return;

    			for (let i = 0; i < each_value_1.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(tr);
    			destroy_each(each_blocks, detaching);
    		}
    	};
    }

    function create_fragment$b(ctx) {
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
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$4(get_each_context$4(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	return {
    		c() {
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
    			set_style(div0, "display", "inline-block");
    			set_style(div1, "display", "inline-block");
    			set_style(div2, "display", "inline-block");
    		},
    		m(target, anchor) {
    			insert(target, table, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(table, null);
    			}

    			insert(target, t0, anchor);
    			insert(target, br0, anchor);
    			insert(target, t1, anchor);
    			insert(target, br1, anchor);
    			insert(target, t2, anchor);
    			insert(target, div0, anchor);
    			append(div0, button0);
    			insert(target, t4, anchor);
    			insert(target, div1, anchor);
    			append(div1, button1);
    			insert(target, t6, anchor);
    			insert(target, div2, anchor);
    			append(div2, t7);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen(button0, "click", /*click_handler_1*/ ctx[7]),
    					listen(button1, "click", /*start_over*/ ctx[4])
    				];

    				mounted = true;
    			}
    		},
    		p(ctx, [dirty]) {
    			if (dirty & /*gameBoard, pixelSize, handleClick, Math, sineIn*/ 37) {
    				each_value = /*gameBoard*/ ctx[0];
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$4(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$4(child_ctx);
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

    			if (!current || dirty & /*status_box*/ 2) set_data(t7, /*status_box*/ ctx[1]);
    		},
    		i(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(table);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach(t0);
    			if (detaching) detach(br0);
    			if (detaching) detach(t1);
    			if (detaching) detach(br1);
    			if (detaching) detach(t2);
    			if (detaching) detach(div0);
    			if (detaching) detach(t4);
    			if (detaching) detach(div1);
    			if (detaching) detach(t6);
    			if (detaching) detach(div2);
    			mounted = false;
    			run_all(dispose);
    		}
    	};
    }

    function instance$b($$self, $$props, $$invalidate) {
    	let pixelSize;
    	const dispatch = createEventDispatcher();
    	let gameBoard, status_box, currentTurn = false, win = false;

    	function start_over() {
    		$$invalidate(0, gameBoard = Array(6).fill(undefined).map(() => Array(7).fill(0)));
    		$$invalidate(1, status_box = (currentTurn ? 'Player 2' : 'Player 1') + ' turn');
    		win = false;
    	}

    	start_over();

    	function handleClick(col) {
    		if (win) return start_over();
    		console.log(currentTurn ? 'Player 2' : 'Player 1', ' clicked the box at row ', col);
    		let yloc = gameBoard.findIndex(e => e[col] !== 0) - 1;
    		if (yloc === -2) yloc = 5;
    		if (yloc === -1) return;
    		console.log(yloc);
    		$$invalidate(0, gameBoard[yloc][col] = currentTurn + 1, gameBoard);
    		currentTurn = !currentTurn;
    		$$invalidate(1, status_box = (currentTurn ? 'Player 2' : 'Player 1') + ' turn');
    		checkForWins(1);
    		checkForWins(2);
    	}

    	function checkForWins(player) {
    		//Horizontal win
    		for (const col of gameBoard) {
    			for (let i = 0; i < 4; i++) {
    				if (player === col[i] && player === col[i + 1] && player === col[i + 2] && player === col[i + 3]) {
    					$$invalidate(1, status_box = (player - 1 ? 'Player 2' : 'Player 1') + ' wins!');
    					col[i] = col[i + 1] = col[i + 2] = col[i + 3] = player + 2;
    					return win = true;
    				}
    			}
    		}

    		for (let i = 0; i < 7; i++) {
    			for (let j = 0; j < 3; j++) {
    				if (player === gameBoard[j][i] && player === gameBoard[j + 1][i] && player === gameBoard[j + 2][i] && player === gameBoard[j + 3][i]) {
    					$$invalidate(1, status_box = (player - 1 ? 'Player 2' : 'Player 1') + ' wins!');
    					$$invalidate(0, gameBoard[j][i] = $$invalidate(0, gameBoard[j + 1][i] = $$invalidate(0, gameBoard[j + 2][i] = $$invalidate(0, gameBoard[j + 3][i] = player + 2, gameBoard), gameBoard), gameBoard), gameBoard);
    					return win = true;
    				}
    			}
    		}

    		// Down and to the left diagonal
    		for (let i = 0; i < 4; i++) {
    			for (let j = 0; j < 3; j++) {
    				if (player === gameBoard[j][i] && player === gameBoard[j + 1][i + 1] && player === gameBoard[j + 2][i + 2] && player === gameBoard[j + 3][i + 3]) {
    					$$invalidate(1, status_box = (player - 1 ? 'Player 2' : 'Player 1') + ' wins!');
    					$$invalidate(0, gameBoard[j][i] = $$invalidate(0, gameBoard[j + 1][i + 1] = $$invalidate(0, gameBoard[j + 2][i + 2] = $$invalidate(0, gameBoard[j + 3][i + 3] = player + 2, gameBoard), gameBoard), gameBoard), gameBoard);
    					return win = true;
    				}
    			}
    		}

    		for (let i = 0; i < 4; i++) {
    			for (let j = 0; j < 3; j++) {
    				if (player === gameBoard[j][i + 3] && player === gameBoard[j + 1][i + 2] && player === gameBoard[j + 2][i + 1] && player === gameBoard[j + 3][i]) {
    					$$invalidate(1, status_box = (player - 1 ? 'Player 2' : 'Player 1') + ' wins!');
    					$$invalidate(0, gameBoard[j][i + 3] = $$invalidate(0, gameBoard[j + 1][i + 2] = $$invalidate(0, gameBoard[j + 2][i + 1] = $$invalidate(0, gameBoard[j + 3][i] = player + 2, gameBoard), gameBoard), gameBoard), gameBoard);
    					return win = true;
    				}
    			}
    		}
    	}

    	const click_handler = j => handleClick(j);
    	const click_handler_1 = () => dispatch('closeOverlay');
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

    class C4 extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$b, create_fragment$b, safe_not_equal, {});
    	}
    }

    /* SvelteComponents\Inputs\ImageButton.svelte generated by Svelte v3.55.0 */

    function create_else_block$1(ctx) {
    	let button;
    	let img;
    	let img_src_value;
    	let mounted;
    	let dispose;

    	return {
    		c() {
    			button = element("button");
    			img = element("img");
    			if (!src_url_equal(img.src, img_src_value = /*src*/ ctx[0])) attr(img, "src", img_src_value);
    			attr(img, "alt", /*src*/ ctx[0]);
    			attr(img, "class", "svelte-12vct0y");
    			button.disabled = /*disabled*/ ctx[1];
    			set_style(button, "padding", "0");
    			set_style(button, "width", /*width*/ ctx[2]);
    			set_style(button, "border-radius", "calc(" + /*width*/ ctx[2] + "/4)");
    			attr(button, "class", "svelte-12vct0y");
    		},
    		m(target, anchor) {
    			insert(target, button, anchor);
    			append(button, img);

    			if (!mounted) {
    				dispose = listen(button, "click", /*click_handler_1*/ ctx[6]);
    				mounted = true;
    			}
    		},
    		p(ctx, dirty) {
    			if (dirty & /*src*/ 1 && !src_url_equal(img.src, img_src_value = /*src*/ ctx[0])) {
    				attr(img, "src", img_src_value);
    			}

    			if (dirty & /*src*/ 1) {
    				attr(img, "alt", /*src*/ ctx[0]);
    			}

    			if (dirty & /*disabled*/ 2) {
    				button.disabled = /*disabled*/ ctx[1];
    			}

    			if (dirty & /*width*/ 4) {
    				set_style(button, "width", /*width*/ ctx[2]);
    			}

    			if (dirty & /*width*/ 4) {
    				set_style(button, "border-radius", "calc(" + /*width*/ ctx[2] + "/4)");
    			}
    		},
    		i: noop$1,
    		o: noop$1,
    		d(detaching) {
    			if (detaching) detach(button);
    			mounted = false;
    			dispose();
    		}
    	};
    }

    // (33:0) {#if src === undefined}
    function create_if_block$4(ctx) {
    	let button;
    	let current;
    	let mounted;
    	let dispose;
    	const default_slot_template = /*#slots*/ ctx[4].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[3], null);

    	return {
    		c() {
    			button = element("button");
    			if (default_slot) default_slot.c();
    			button.disabled = /*disabled*/ ctx[1];
    			set_style(button, "width", /*width*/ ctx[2]);
    			set_style(button, "border-radius", "calc(" + /*width*/ ctx[2] + "/4)");
    			attr(button, "class", "svelte-12vct0y");
    		},
    		m(target, anchor) {
    			insert(target, button, anchor);

    			if (default_slot) {
    				default_slot.m(button, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = listen(button, "click", /*click_handler*/ ctx[5]);
    				mounted = true;
    			}
    		},
    		p(ctx, dirty) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 8)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[3],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[3])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[3], dirty, null),
    						null
    					);
    				}
    			}

    			if (!current || dirty & /*disabled*/ 2) {
    				button.disabled = /*disabled*/ ctx[1];
    			}

    			if (!current || dirty & /*width*/ 4) {
    				set_style(button, "width", /*width*/ ctx[2]);
    			}

    			if (!current || dirty & /*width*/ 4) {
    				set_style(button, "border-radius", "calc(" + /*width*/ ctx[2] + "/4)");
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(button);
    			if (default_slot) default_slot.d(detaching);
    			mounted = false;
    			dispose();
    		}
    	};
    }

    function create_fragment$a(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block$4, create_else_block$1];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*src*/ ctx[0] === undefined) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	return {
    		c() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach(if_block_anchor);
    		}
    	};
    }

    function instance$a($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	let { src } = $$props;
    	let { disabled = false } = $$props;
    	let { width = '40px' } = $$props;

    	function click_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function click_handler_1(event) {
    		bubble.call(this, $$self, event);
    	}

    	$$self.$$set = $$props => {
    		if ('src' in $$props) $$invalidate(0, src = $$props.src);
    		if ('disabled' in $$props) $$invalidate(1, disabled = $$props.disabled);
    		if ('width' in $$props) $$invalidate(2, width = $$props.width);
    		if ('$$scope' in $$props) $$invalidate(3, $$scope = $$props.$$scope);
    	};

    	return [src, disabled, width, $$scope, slots, click_handler, click_handler_1];
    }

    class ImageButton extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$a, create_fragment$a, safe_not_equal, { src: 0, disabled: 1, width: 2 });
    	}
    }

    /* screens\Accessories.svelte generated by Svelte v3.55.0 */

    function create_default_slot_2(ctx) {
    	let snake;
    	let current;
    	snake = new Snake({});
    	snake.$on("closeOverlay", /*closeOverlay_handler*/ ctx[14]);

    	return {
    		c() {
    			create_component(snake.$$.fragment);
    		},
    		m(target, anchor) {
    			mount_component(snake, target, anchor);
    			current = true;
    		},
    		p: noop$1,
    		i(local) {
    			if (current) return;
    			transition_in(snake.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(snake.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			destroy_component(snake, detaching);
    		}
    	};
    }

    // (37:0) <Overlay bind:shown={showC4} closable="{false}">
    function create_default_slot_1(ctx) {
    	let c4;
    	let current;
    	c4 = new C4({});
    	c4.$on("closeOverlay", /*closeOverlay_handler_1*/ ctx[16]);

    	return {
    		c() {
    			create_component(c4.$$.fragment);
    		},
    		m(target, anchor) {
    			mount_component(c4, target, anchor);
    			current = true;
    		},
    		p: noop$1,
    		i(local) {
    			if (current) return;
    			transition_in(c4.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(c4.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			destroy_component(c4, detaching);
    		}
    	};
    }

    // (52:4) {#if $forceMode === 'Adaptive'}
    function create_if_block$3(ctx) {
    	let table;
    	let tr0;
    	let td0;
    	let t1;
    	let td1;
    	let t2_value = suncalc.getTimes(/*$currentTime*/ ctx[7], 39.1532, -77.0669).sunrise.toLocaleTimeString() + "";
    	let t2;
    	let t3;
    	let tr1;
    	let td2;
    	let t5;
    	let td3;
    	let t6_value = suncalc.getTimes(/*$currentTime*/ ctx[7], 39.1532, -77.0669).sunset.toLocaleTimeString() + "";
    	let t6;

    	return {
    		c() {
    			table = element("table");
    			tr0 = element("tr");
    			td0 = element("td");
    			td0.textContent = "Today's Sunrise:";
    			t1 = space();
    			td1 = element("td");
    			t2 = text(t2_value);
    			t3 = space();
    			tr1 = element("tr");
    			td2 = element("td");
    			td2.textContent = "Today's Sunset:";
    			t5 = space();
    			td3 = element("td");
    			t6 = text(t6_value);
    			set_style(table, "font-style", "italic");
    			set_style(table, "margin", "5px");
    		},
    		m(target, anchor) {
    			insert(target, table, anchor);
    			append(table, tr0);
    			append(tr0, td0);
    			append(tr0, t1);
    			append(tr0, td1);
    			append(td1, t2);
    			append(table, t3);
    			append(table, tr1);
    			append(tr1, td2);
    			append(tr1, t5);
    			append(tr1, td3);
    			append(td3, t6);
    		},
    		p(ctx, dirty) {
    			if (dirty & /*$currentTime*/ 128 && t2_value !== (t2_value = suncalc.getTimes(/*$currentTime*/ ctx[7], 39.1532, -77.0669).sunrise.toLocaleTimeString() + "")) set_data(t2, t2_value);
    			if (dirty & /*$currentTime*/ 128 && t6_value !== (t6_value = suncalc.getTimes(/*$currentTime*/ ctx[7], 39.1532, -77.0669).sunset.toLocaleTimeString() + "")) set_data(t6, t6_value);
    		},
    		d(detaching) {
    			if (detaching) detach(table);
    		}
    	};
    }

    // (41:0) <Overlay bind:shown={showSettings}>
    function create_default_slot(ctx) {
    	let h1;
    	let t1;
    	let input0;
    	let t2;
    	let br0;
    	let t3;
    	let t4_value = (/*$deviceStatusData*/ ctx[4].twelveVolt * /*$twelveCorrectiveFactor*/ ctx[3]).toFixed(2) + "";
    	let t4;
    	let t5;
    	let br1;
    	let t6;
    	let input1;
    	let br2;
    	let t7;
    	let h30;
    	let t9;
    	let labeledswitch;
    	let t10;
    	let t11;
    	let h31;
    	let t13;
    	let t14;
    	let t15;
    	let br3;
    	let t16;
    	let input2;
    	let t17;
    	let input3;
    	let current;
    	let mounted;
    	let dispose;

    	labeledswitch = new LabeledSwitch({
    			props: {
    				options: ['Light', 'Dark', 'Adaptive'],
    				selected: /*$forceMode*/ ctx[6]
    			}
    		});

    	labeledswitch.$on("change", /*change_handler_2*/ ctx[20]);
    	let if_block = /*$forceMode*/ ctx[6] === 'Adaptive' && create_if_block$3(ctx);

    	return {
    		c() {
    			h1 = element("h1");
    			h1.textContent = "Settings";
    			t1 = text("\r\n    Corrective Factor for 12V Sensor: ");
    			input0 = element("input");
    			t2 = space();
    			br0 = element("br");
    			t3 = text("\r\n    Current Value: ");
    			t4 = text(t4_value);
    			t5 = space();
    			br1 = element("br");
    			t6 = text("\r\n\r\n    G Force Scale ");
    			input1 = element("input");
    			br2 = element("br");
    			t7 = space();
    			h30 = element("h3");
    			h30.textContent = "Theme";
    			t9 = space();
    			create_component(labeledswitch.$$.fragment);
    			t10 = space();
    			if (if_block) if_block.c();
    			t11 = space();
    			h31 = element("h3");
    			h31.textContent = "Time Offset";
    			t13 = text("\r\n    Current Time Offset: ");
    			t14 = text(/*$timeOffset*/ ctx[8]);
    			t15 = text(" Hours ");
    			br3 = element("br");
    			t16 = space();
    			input2 = element("input");
    			t17 = space();
    			input3 = element("input");
    			attr(input0, "type", "number");
    			attr(input0, "step", "0.01");
    			attr(input1, "type", "number");
    			attr(input1, "step", "0.01");
    			attr(h30, "class", "svelte-1vblf8i");
    			attr(h31, "class", "svelte-1vblf8i");
    			attr(input2, "type", "button");
    			input2.value = "+";
    			attr(input3, "type", "button");
    			input3.value = "-";
    		},
    		m(target, anchor) {
    			insert(target, h1, anchor);
    			insert(target, t1, anchor);
    			insert(target, input0, anchor);
    			set_input_value(input0, /*$twelveCorrectiveFactor*/ ctx[3]);
    			insert(target, t2, anchor);
    			insert(target, br0, anchor);
    			insert(target, t3, anchor);
    			insert(target, t4, anchor);
    			insert(target, t5, anchor);
    			insert(target, br1, anchor);
    			insert(target, t6, anchor);
    			insert(target, input1, anchor);
    			set_input_value(input1, /*$gForceScale*/ ctx[5]);
    			insert(target, br2, anchor);
    			insert(target, t7, anchor);
    			insert(target, h30, anchor);
    			insert(target, t9, anchor);
    			mount_component(labeledswitch, target, anchor);
    			insert(target, t10, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert(target, t11, anchor);
    			insert(target, h31, anchor);
    			insert(target, t13, anchor);
    			insert(target, t14, anchor);
    			insert(target, t15, anchor);
    			insert(target, br3, anchor);
    			insert(target, t16, anchor);
    			insert(target, input2, anchor);
    			insert(target, t17, anchor);
    			insert(target, input3, anchor);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen(input0, "input", /*input0_input_handler*/ ctx[18]),
    					listen(input1, "input", /*input1_input_handler*/ ctx[19]),
    					listen(input2, "click", /*click_handler_3*/ ctx[21]),
    					listen(input3, "click", /*click_handler_4*/ ctx[22])
    				];

    				mounted = true;
    			}
    		},
    		p(ctx, dirty) {
    			if (dirty & /*$twelveCorrectiveFactor*/ 8 && to_number(input0.value) !== /*$twelveCorrectiveFactor*/ ctx[3]) {
    				set_input_value(input0, /*$twelveCorrectiveFactor*/ ctx[3]);
    			}

    			if ((!current || dirty & /*$deviceStatusData, $twelveCorrectiveFactor*/ 24) && t4_value !== (t4_value = (/*$deviceStatusData*/ ctx[4].twelveVolt * /*$twelveCorrectiveFactor*/ ctx[3]).toFixed(2) + "")) set_data(t4, t4_value);

    			if (dirty & /*$gForceScale*/ 32 && to_number(input1.value) !== /*$gForceScale*/ ctx[5]) {
    				set_input_value(input1, /*$gForceScale*/ ctx[5]);
    			}

    			const labeledswitch_changes = {};
    			if (dirty & /*$forceMode*/ 64) labeledswitch_changes.selected = /*$forceMode*/ ctx[6];
    			labeledswitch.$set(labeledswitch_changes);

    			if (/*$forceMode*/ ctx[6] === 'Adaptive') {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$3(ctx);
    					if_block.c();
    					if_block.m(t11.parentNode, t11);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (!current || dirty & /*$timeOffset*/ 256) set_data(t14, /*$timeOffset*/ ctx[8]);
    		},
    		i(local) {
    			if (current) return;
    			transition_in(labeledswitch.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(labeledswitch.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(h1);
    			if (detaching) detach(t1);
    			if (detaching) detach(input0);
    			if (detaching) detach(t2);
    			if (detaching) detach(br0);
    			if (detaching) detach(t3);
    			if (detaching) detach(t4);
    			if (detaching) detach(t5);
    			if (detaching) detach(br1);
    			if (detaching) detach(t6);
    			if (detaching) detach(input1);
    			if (detaching) detach(br2);
    			if (detaching) detach(t7);
    			if (detaching) detach(h30);
    			if (detaching) detach(t9);
    			destroy_component(labeledswitch, detaching);
    			if (detaching) detach(t10);
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach(t11);
    			if (detaching) detach(h31);
    			if (detaching) detach(t13);
    			if (detaching) detach(t14);
    			if (detaching) detach(t15);
    			if (detaching) detach(br3);
    			if (detaching) detach(t16);
    			if (detaching) detach(input2);
    			if (detaching) detach(t17);
    			if (detaching) detach(input3);
    			mounted = false;
    			run_all(dispose);
    		}
    	};
    }

    function create_fragment$9(ctx) {
    	let div;
    	let h1;
    	let t1;
    	let h30;
    	let t3;
    	let labeledswitch0;
    	let t4;
    	let h31;
    	let t6;
    	let labeledswitch1;
    	let t7;
    	let h32;
    	let t9;
    	let imagebutton0;
    	let t10;
    	let imagebutton1;
    	let t11;
    	let imagebutton2;
    	let t12;
    	let overlay0;
    	let updating_shown;
    	let t13;
    	let overlay1;
    	let updating_shown_1;
    	let t14;
    	let overlay2;
    	let updating_shown_2;
    	let current;
    	labeledswitch0 = new LabeledSwitch({ props: { options: ['On', 'Off'] } });
    	labeledswitch0.$on("change", /*change_handler*/ ctx[9]);

    	labeledswitch1 = new LabeledSwitch({
    			props: {
    				options: ['Voltage Mode', 'Hue Rotation', 'Crazy Colors', 'Solid']
    			}
    		});

    	labeledswitch1.$on("change", /*change_handler_1*/ ctx[10]);

    	imagebutton0 = new ImageButton({
    			props: { src: "./static/snake.svg", width: "7vw" }
    		});

    	imagebutton0.$on("click", /*click_handler*/ ctx[11]);

    	imagebutton1 = new ImageButton({
    			props: { src: "./static/c4.svg", width: "7vw" }
    		});

    	imagebutton1.$on("click", /*click_handler_1*/ ctx[12]);

    	imagebutton2 = new ImageButton({
    			props: { src: "./static/gear.svg", width: "7vw" }
    		});

    	imagebutton2.$on("click", /*click_handler_2*/ ctx[13]);

    	function overlay0_shown_binding(value) {
    		/*overlay0_shown_binding*/ ctx[15](value);
    	}

    	let overlay0_props = {
    		closable: "" + (false + " "),
    		$$slots: { default: [create_default_slot_2] },
    		$$scope: { ctx }
    	};

    	if (/*showSnake*/ ctx[0] !== void 0) {
    		overlay0_props.shown = /*showSnake*/ ctx[0];
    	}

    	overlay0 = new Overlay({ props: overlay0_props });
    	binding_callbacks.push(() => bind(overlay0, 'shown', overlay0_shown_binding, /*showSnake*/ ctx[0]));

    	function overlay1_shown_binding(value) {
    		/*overlay1_shown_binding*/ ctx[17](value);
    	}

    	let overlay1_props = {
    		closable: false,
    		$$slots: { default: [create_default_slot_1] },
    		$$scope: { ctx }
    	};

    	if (/*showC4*/ ctx[1] !== void 0) {
    		overlay1_props.shown = /*showC4*/ ctx[1];
    	}

    	overlay1 = new Overlay({ props: overlay1_props });
    	binding_callbacks.push(() => bind(overlay1, 'shown', overlay1_shown_binding, /*showC4*/ ctx[1]));

    	function overlay2_shown_binding(value) {
    		/*overlay2_shown_binding*/ ctx[23](value);
    	}

    	let overlay2_props = {
    		$$slots: { default: [create_default_slot] },
    		$$scope: { ctx }
    	};

    	if (/*showSettings*/ ctx[2] !== void 0) {
    		overlay2_props.shown = /*showSettings*/ ctx[2];
    	}

    	overlay2 = new Overlay({ props: overlay2_props });
    	binding_callbacks.push(() => bind(overlay2, 'shown', overlay2_shown_binding, /*showSettings*/ ctx[2]));

    	return {
    		c() {
    			div = element("div");
    			h1 = element("h1");
    			h1.textContent = "Accessories";
    			t1 = space();
    			h30 = element("h3");
    			h30.textContent = "Inverter";
    			t3 = space();
    			create_component(labeledswitch0.$$.fragment);
    			t4 = space();
    			h31 = element("h3");
    			h31.textContent = "Battery Illumination";
    			t6 = space();
    			create_component(labeledswitch1.$$.fragment);
    			t7 = space();
    			h32 = element("h3");
    			h32.textContent = "Apps";
    			t9 = space();
    			create_component(imagebutton0.$$.fragment);
    			t10 = space();
    			create_component(imagebutton1.$$.fragment);
    			t11 = space();
    			create_component(imagebutton2.$$.fragment);
    			t12 = space();
    			create_component(overlay0.$$.fragment);
    			t13 = space();
    			create_component(overlay1.$$.fragment);
    			t14 = space();
    			create_component(overlay2.$$.fragment);
    			attr(h30, "class", "svelte-1vblf8i");
    			attr(h31, "class", "svelte-1vblf8i");
    			attr(h32, "class", "svelte-1vblf8i");
    			attr(div, "class", "svelte-1vblf8i");
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);
    			append(div, h1);
    			append(div, t1);
    			append(div, h30);
    			append(div, t3);
    			mount_component(labeledswitch0, div, null);
    			append(div, t4);
    			append(div, h31);
    			append(div, t6);
    			mount_component(labeledswitch1, div, null);
    			append(div, t7);
    			append(div, h32);
    			append(div, t9);
    			mount_component(imagebutton0, div, null);
    			append(div, t10);
    			mount_component(imagebutton1, div, null);
    			append(div, t11);
    			mount_component(imagebutton2, div, null);
    			insert(target, t12, anchor);
    			mount_component(overlay0, target, anchor);
    			insert(target, t13, anchor);
    			mount_component(overlay1, target, anchor);
    			insert(target, t14, anchor);
    			mount_component(overlay2, target, anchor);
    			current = true;
    		},
    		p(ctx, [dirty]) {
    			const overlay0_changes = {};

    			if (dirty & /*$$scope, showSnake*/ 16777217) {
    				overlay0_changes.$$scope = { dirty, ctx };
    			}

    			if (!updating_shown && dirty & /*showSnake*/ 1) {
    				updating_shown = true;
    				overlay0_changes.shown = /*showSnake*/ ctx[0];
    				add_flush_callback(() => updating_shown = false);
    			}

    			overlay0.$set(overlay0_changes);
    			const overlay1_changes = {};

    			if (dirty & /*$$scope, showC4*/ 16777218) {
    				overlay1_changes.$$scope = { dirty, ctx };
    			}

    			if (!updating_shown_1 && dirty & /*showC4*/ 2) {
    				updating_shown_1 = true;
    				overlay1_changes.shown = /*showC4*/ ctx[1];
    				add_flush_callback(() => updating_shown_1 = false);
    			}

    			overlay1.$set(overlay1_changes);
    			const overlay2_changes = {};

    			if (dirty & /*$$scope, $timeOffset, $currentTime, $forceMode, $gForceScale, $deviceStatusData, $twelveCorrectiveFactor*/ 16777720) {
    				overlay2_changes.$$scope = { dirty, ctx };
    			}

    			if (!updating_shown_2 && dirty & /*showSettings*/ 4) {
    				updating_shown_2 = true;
    				overlay2_changes.shown = /*showSettings*/ ctx[2];
    				add_flush_callback(() => updating_shown_2 = false);
    			}

    			overlay2.$set(overlay2_changes);
    		},
    		i(local) {
    			if (current) return;
    			transition_in(labeledswitch0.$$.fragment, local);
    			transition_in(labeledswitch1.$$.fragment, local);
    			transition_in(imagebutton0.$$.fragment, local);
    			transition_in(imagebutton1.$$.fragment, local);
    			transition_in(imagebutton2.$$.fragment, local);
    			transition_in(overlay0.$$.fragment, local);
    			transition_in(overlay1.$$.fragment, local);
    			transition_in(overlay2.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(labeledswitch0.$$.fragment, local);
    			transition_out(labeledswitch1.$$.fragment, local);
    			transition_out(imagebutton0.$$.fragment, local);
    			transition_out(imagebutton1.$$.fragment, local);
    			transition_out(imagebutton2.$$.fragment, local);
    			transition_out(overlay0.$$.fragment, local);
    			transition_out(overlay1.$$.fragment, local);
    			transition_out(overlay2.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(div);
    			destroy_component(labeledswitch0);
    			destroy_component(labeledswitch1);
    			destroy_component(imagebutton0);
    			destroy_component(imagebutton1);
    			destroy_component(imagebutton2);
    			if (detaching) detach(t12);
    			destroy_component(overlay0, detaching);
    			if (detaching) detach(t13);
    			destroy_component(overlay1, detaching);
    			if (detaching) detach(t14);
    			destroy_component(overlay2, detaching);
    		}
    	};
    }

    function instance$9($$self, $$props, $$invalidate) {
    	let $twelveCorrectiveFactor;
    	let $deviceStatusData;
    	let $gForceScale;
    	let $forceMode;
    	let $currentTime;
    	let $timeOffset;
    	component_subscribe($$self, twelveCorrectiveFactor, $$value => $$invalidate(3, $twelveCorrectiveFactor = $$value));
    	component_subscribe($$self, deviceStatusData, $$value => $$invalidate(4, $deviceStatusData = $$value));
    	component_subscribe($$self, gForceScale, $$value => $$invalidate(5, $gForceScale = $$value));
    	component_subscribe($$self, forceMode, $$value => $$invalidate(6, $forceMode = $$value));
    	component_subscribe($$self, currentTime, $$value => $$invalidate(7, $currentTime = $$value));
    	component_subscribe($$self, timeOffset, $$value => $$invalidate(8, $timeOffset = $$value));
    	let showSnake = false, showC4 = false, showSettings = false;
    	const change_handler = e => window.communications.send('inverter', !Boolean(e.detail.index));
    	const change_handler_1 = e => window.communications.send('led_select', e.detail.index);
    	const click_handler = () => $$invalidate(0, showSnake = true);
    	const click_handler_1 = () => $$invalidate(1, showC4 = true);
    	const click_handler_2 = () => $$invalidate(2, showSettings = true);
    	const closeOverlay_handler = () => $$invalidate(0, showSnake = false);

    	function overlay0_shown_binding(value) {
    		showSnake = value;
    		$$invalidate(0, showSnake);
    	}

    	const closeOverlay_handler_1 = () => $$invalidate(1, showC4 = false);

    	function overlay1_shown_binding(value) {
    		showC4 = value;
    		$$invalidate(1, showC4);
    	}

    	function input0_input_handler() {
    		$twelveCorrectiveFactor = to_number(this.value);
    		twelveCorrectiveFactor.set($twelveCorrectiveFactor);
    	}

    	function input1_input_handler() {
    		$gForceScale = to_number(this.value);
    		gForceScale.set($gForceScale);
    	}

    	const change_handler_2 = e => set_store_value(forceMode, $forceMode = e.detail.value, $forceMode);
    	const click_handler_3 = () => timeOffset.update(e => e + 1);
    	const click_handler_4 = () => timeOffset.update(e => e - 1);

    	function overlay2_shown_binding(value) {
    		showSettings = value;
    		$$invalidate(2, showSettings);
    	}

    	return [
    		showSnake,
    		showC4,
    		showSettings,
    		$twelveCorrectiveFactor,
    		$deviceStatusData,
    		$gForceScale,
    		$forceMode,
    		$currentTime,
    		$timeOffset,
    		change_handler,
    		change_handler_1,
    		click_handler,
    		click_handler_1,
    		click_handler_2,
    		closeOverlay_handler,
    		overlay0_shown_binding,
    		closeOverlay_handler_1,
    		overlay1_shown_binding,
    		input0_input_handler,
    		input1_input_handler,
    		change_handler_2,
    		click_handler_3,
    		click_handler_4,
    		overlay2_shown_binding
    	];
    }

    class Accessories extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, {});
    	}
    }

    /*!
     * @kurkle/color v0.3.1
     * https://github.com/kurkle/color#readme
     * (c) 2022 Jukka Kurkela
     * Released under the MIT License
     */
    function round(v) {
      return v + 0.5 | 0;
    }
    const lim = (v, l, h) => Math.max(Math.min(v, h), l);
    function p2b(v) {
      return lim(round(v * 2.55), 0, 255);
    }
    function n2b(v) {
      return lim(round(v * 255), 0, 255);
    }
    function b2n(v) {
      return lim(round(v / 2.55) / 100, 0, 1);
    }
    function n2p(v) {
      return lim(round(v * 100), 0, 100);
    }

    const map$1 = {0: 0, 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7, 8: 8, 9: 9, A: 10, B: 11, C: 12, D: 13, E: 14, F: 15, a: 10, b: 11, c: 12, d: 13, e: 14, f: 15};
    const hex = [...'0123456789ABCDEF'];
    const h1 = b => hex[b & 0xF];
    const h2 = b => hex[(b & 0xF0) >> 4] + hex[b & 0xF];
    const eq = b => ((b & 0xF0) >> 4) === (b & 0xF);
    const isShort = v => eq(v.r) && eq(v.g) && eq(v.b) && eq(v.a);
    function hexParse(str) {
      var len = str.length;
      var ret;
      if (str[0] === '#') {
        if (len === 4 || len === 5) {
          ret = {
            r: 255 & map$1[str[1]] * 17,
            g: 255 & map$1[str[2]] * 17,
            b: 255 & map$1[str[3]] * 17,
            a: len === 5 ? map$1[str[4]] * 17 : 255
          };
        } else if (len === 7 || len === 9) {
          ret = {
            r: map$1[str[1]] << 4 | map$1[str[2]],
            g: map$1[str[3]] << 4 | map$1[str[4]],
            b: map$1[str[5]] << 4 | map$1[str[6]],
            a: len === 9 ? (map$1[str[7]] << 4 | map$1[str[8]]) : 255
          };
        }
      }
      return ret;
    }
    const alpha = (a, f) => a < 255 ? f(a) : '';
    function hexString(v) {
      var f = isShort(v) ? h1 : h2;
      return v
        ? '#' + f(v.r) + f(v.g) + f(v.b) + alpha(v.a, f)
        : undefined;
    }

    const HUE_RE = /^(hsla?|hwb|hsv)\(\s*([-+.e\d]+)(?:deg)?[\s,]+([-+.e\d]+)%[\s,]+([-+.e\d]+)%(?:[\s,]+([-+.e\d]+)(%)?)?\s*\)$/;
    function hsl2rgbn(h, s, l) {
      const a = s * Math.min(l, 1 - l);
      const f = (n, k = (n + h / 30) % 12) => l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return [f(0), f(8), f(4)];
    }
    function hsv2rgbn(h, s, v) {
      const f = (n, k = (n + h / 60) % 6) => v - v * s * Math.max(Math.min(k, 4 - k, 1), 0);
      return [f(5), f(3), f(1)];
    }
    function hwb2rgbn(h, w, b) {
      const rgb = hsl2rgbn(h, 1, 0.5);
      let i;
      if (w + b > 1) {
        i = 1 / (w + b);
        w *= i;
        b *= i;
      }
      for (i = 0; i < 3; i++) {
        rgb[i] *= 1 - w - b;
        rgb[i] += w;
      }
      return rgb;
    }
    function hueValue(r, g, b, d, max) {
      if (r === max) {
        return ((g - b) / d) + (g < b ? 6 : 0);
      }
      if (g === max) {
        return (b - r) / d + 2;
      }
      return (r - g) / d + 4;
    }
    function rgb2hsl(v) {
      const range = 255;
      const r = v.r / range;
      const g = v.g / range;
      const b = v.b / range;
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const l = (max + min) / 2;
      let h, s, d;
      if (max !== min) {
        d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        h = hueValue(r, g, b, d, max);
        h = h * 60 + 0.5;
      }
      return [h | 0, s || 0, l];
    }
    function calln(f, a, b, c) {
      return (
        Array.isArray(a)
          ? f(a[0], a[1], a[2])
          : f(a, b, c)
      ).map(n2b);
    }
    function hsl2rgb(h, s, l) {
      return calln(hsl2rgbn, h, s, l);
    }
    function hwb2rgb(h, w, b) {
      return calln(hwb2rgbn, h, w, b);
    }
    function hsv2rgb(h, s, v) {
      return calln(hsv2rgbn, h, s, v);
    }
    function hue(h) {
      return (h % 360 + 360) % 360;
    }
    function hueParse(str) {
      const m = HUE_RE.exec(str);
      let a = 255;
      let v;
      if (!m) {
        return;
      }
      if (m[5] !== v) {
        a = m[6] ? p2b(+m[5]) : n2b(+m[5]);
      }
      const h = hue(+m[2]);
      const p1 = +m[3] / 100;
      const p2 = +m[4] / 100;
      if (m[1] === 'hwb') {
        v = hwb2rgb(h, p1, p2);
      } else if (m[1] === 'hsv') {
        v = hsv2rgb(h, p1, p2);
      } else {
        v = hsl2rgb(h, p1, p2);
      }
      return {
        r: v[0],
        g: v[1],
        b: v[2],
        a: a
      };
    }
    function rotate(v, deg) {
      var h = rgb2hsl(v);
      h[0] = hue(h[0] + deg);
      h = hsl2rgb(h);
      v.r = h[0];
      v.g = h[1];
      v.b = h[2];
    }
    function hslString(v) {
      if (!v) {
        return;
      }
      const a = rgb2hsl(v);
      const h = a[0];
      const s = n2p(a[1]);
      const l = n2p(a[2]);
      return v.a < 255
        ? `hsla(${h}, ${s}%, ${l}%, ${b2n(v.a)})`
        : `hsl(${h}, ${s}%, ${l}%)`;
    }

    const map$2 = {
      x: 'dark',
      Z: 'light',
      Y: 're',
      X: 'blu',
      W: 'gr',
      V: 'medium',
      U: 'slate',
      A: 'ee',
      T: 'ol',
      S: 'or',
      B: 'ra',
      C: 'lateg',
      D: 'ights',
      R: 'in',
      Q: 'turquois',
      E: 'hi',
      P: 'ro',
      O: 'al',
      N: 'le',
      M: 'de',
      L: 'yello',
      F: 'en',
      K: 'ch',
      G: 'arks',
      H: 'ea',
      I: 'ightg',
      J: 'wh'
    };
    const names$1 = {
      OiceXe: 'f0f8ff',
      antiquewEte: 'faebd7',
      aqua: 'ffff',
      aquamarRe: '7fffd4',
      azuY: 'f0ffff',
      beige: 'f5f5dc',
      bisque: 'ffe4c4',
      black: '0',
      blanKedOmond: 'ffebcd',
      Xe: 'ff',
      XeviTet: '8a2be2',
      bPwn: 'a52a2a',
      burlywood: 'deb887',
      caMtXe: '5f9ea0',
      KartYuse: '7fff00',
      KocTate: 'd2691e',
      cSO: 'ff7f50',
      cSnflowerXe: '6495ed',
      cSnsilk: 'fff8dc',
      crimson: 'dc143c',
      cyan: 'ffff',
      xXe: '8b',
      xcyan: '8b8b',
      xgTMnPd: 'b8860b',
      xWay: 'a9a9a9',
      xgYF: '6400',
      xgYy: 'a9a9a9',
      xkhaki: 'bdb76b',
      xmagFta: '8b008b',
      xTivegYF: '556b2f',
      xSange: 'ff8c00',
      xScEd: '9932cc',
      xYd: '8b0000',
      xsOmon: 'e9967a',
      xsHgYF: '8fbc8f',
      xUXe: '483d8b',
      xUWay: '2f4f4f',
      xUgYy: '2f4f4f',
      xQe: 'ced1',
      xviTet: '9400d3',
      dAppRk: 'ff1493',
      dApskyXe: 'bfff',
      dimWay: '696969',
      dimgYy: '696969',
      dodgerXe: '1e90ff',
      fiYbrick: 'b22222',
      flSOwEte: 'fffaf0',
      foYstWAn: '228b22',
      fuKsia: 'ff00ff',
      gaRsbSo: 'dcdcdc',
      ghostwEte: 'f8f8ff',
      gTd: 'ffd700',
      gTMnPd: 'daa520',
      Way: '808080',
      gYF: '8000',
      gYFLw: 'adff2f',
      gYy: '808080',
      honeyMw: 'f0fff0',
      hotpRk: 'ff69b4',
      RdianYd: 'cd5c5c',
      Rdigo: '4b0082',
      ivSy: 'fffff0',
      khaki: 'f0e68c',
      lavFMr: 'e6e6fa',
      lavFMrXsh: 'fff0f5',
      lawngYF: '7cfc00',
      NmoncEffon: 'fffacd',
      ZXe: 'add8e6',
      ZcSO: 'f08080',
      Zcyan: 'e0ffff',
      ZgTMnPdLw: 'fafad2',
      ZWay: 'd3d3d3',
      ZgYF: '90ee90',
      ZgYy: 'd3d3d3',
      ZpRk: 'ffb6c1',
      ZsOmon: 'ffa07a',
      ZsHgYF: '20b2aa',
      ZskyXe: '87cefa',
      ZUWay: '778899',
      ZUgYy: '778899',
      ZstAlXe: 'b0c4de',
      ZLw: 'ffffe0',
      lime: 'ff00',
      limegYF: '32cd32',
      lRF: 'faf0e6',
      magFta: 'ff00ff',
      maPon: '800000',
      VaquamarRe: '66cdaa',
      VXe: 'cd',
      VScEd: 'ba55d3',
      VpurpN: '9370db',
      VsHgYF: '3cb371',
      VUXe: '7b68ee',
      VsprRggYF: 'fa9a',
      VQe: '48d1cc',
      VviTetYd: 'c71585',
      midnightXe: '191970',
      mRtcYam: 'f5fffa',
      mistyPse: 'ffe4e1',
      moccasR: 'ffe4b5',
      navajowEte: 'ffdead',
      navy: '80',
      Tdlace: 'fdf5e6',
      Tive: '808000',
      TivedBb: '6b8e23',
      Sange: 'ffa500',
      SangeYd: 'ff4500',
      ScEd: 'da70d6',
      pOegTMnPd: 'eee8aa',
      pOegYF: '98fb98',
      pOeQe: 'afeeee',
      pOeviTetYd: 'db7093',
      papayawEp: 'ffefd5',
      pHKpuff: 'ffdab9',
      peru: 'cd853f',
      pRk: 'ffc0cb',
      plum: 'dda0dd',
      powMrXe: 'b0e0e6',
      purpN: '800080',
      YbeccapurpN: '663399',
      Yd: 'ff0000',
      Psybrown: 'bc8f8f',
      PyOXe: '4169e1',
      saddNbPwn: '8b4513',
      sOmon: 'fa8072',
      sandybPwn: 'f4a460',
      sHgYF: '2e8b57',
      sHshell: 'fff5ee',
      siFna: 'a0522d',
      silver: 'c0c0c0',
      skyXe: '87ceeb',
      UXe: '6a5acd',
      UWay: '708090',
      UgYy: '708090',
      snow: 'fffafa',
      sprRggYF: 'ff7f',
      stAlXe: '4682b4',
      tan: 'd2b48c',
      teO: '8080',
      tEstN: 'd8bfd8',
      tomato: 'ff6347',
      Qe: '40e0d0',
      viTet: 'ee82ee',
      JHt: 'f5deb3',
      wEte: 'ffffff',
      wEtesmoke: 'f5f5f5',
      Lw: 'ffff00',
      LwgYF: '9acd32'
    };
    function unpack() {
      const unpacked = {};
      const keys = Object.keys(names$1);
      const tkeys = Object.keys(map$2);
      let i, j, k, ok, nk;
      for (i = 0; i < keys.length; i++) {
        ok = nk = keys[i];
        for (j = 0; j < tkeys.length; j++) {
          k = tkeys[j];
          nk = nk.replace(k, map$2[k]);
        }
        k = parseInt(names$1[ok], 16);
        unpacked[nk] = [k >> 16 & 0xFF, k >> 8 & 0xFF, k & 0xFF];
      }
      return unpacked;
    }

    let names;
    function nameParse(str) {
      if (!names) {
        names = unpack();
        names.transparent = [0, 0, 0, 0];
      }
      const a = names[str.toLowerCase()];
      return a && {
        r: a[0],
        g: a[1],
        b: a[2],
        a: a.length === 4 ? a[3] : 255
      };
    }

    const RGB_RE = /^rgba?\(\s*([-+.\d]+)(%)?[\s,]+([-+.e\d]+)(%)?[\s,]+([-+.e\d]+)(%)?(?:[\s,/]+([-+.e\d]+)(%)?)?\s*\)$/;
    function rgbParse(str) {
      const m = RGB_RE.exec(str);
      let a = 255;
      let r, g, b;
      if (!m) {
        return;
      }
      if (m[7] !== r) {
        const v = +m[7];
        a = m[8] ? p2b(v) : lim(v * 255, 0, 255);
      }
      r = +m[1];
      g = +m[3];
      b = +m[5];
      r = 255 & (m[2] ? p2b(r) : lim(r, 0, 255));
      g = 255 & (m[4] ? p2b(g) : lim(g, 0, 255));
      b = 255 & (m[6] ? p2b(b) : lim(b, 0, 255));
      return {
        r: r,
        g: g,
        b: b,
        a: a
      };
    }
    function rgbString(v) {
      return v && (
        v.a < 255
          ? `rgba(${v.r}, ${v.g}, ${v.b}, ${b2n(v.a)})`
          : `rgb(${v.r}, ${v.g}, ${v.b})`
      );
    }

    const to = v => v <= 0.0031308 ? v * 12.92 : Math.pow(v, 1.0 / 2.4) * 1.055 - 0.055;
    const from = v => v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    function interpolate$1(rgb1, rgb2, t) {
      const r = from(b2n(rgb1.r));
      const g = from(b2n(rgb1.g));
      const b = from(b2n(rgb1.b));
      return {
        r: n2b(to(r + t * (from(b2n(rgb2.r)) - r))),
        g: n2b(to(g + t * (from(b2n(rgb2.g)) - g))),
        b: n2b(to(b + t * (from(b2n(rgb2.b)) - b))),
        a: rgb1.a + t * (rgb2.a - rgb1.a)
      };
    }

    function modHSL(v, i, ratio) {
      if (v) {
        let tmp = rgb2hsl(v);
        tmp[i] = Math.max(0, Math.min(tmp[i] + tmp[i] * ratio, i === 0 ? 360 : 1));
        tmp = hsl2rgb(tmp);
        v.r = tmp[0];
        v.g = tmp[1];
        v.b = tmp[2];
      }
    }
    function clone$1(v, proto) {
      return v ? Object.assign(proto || {}, v) : v;
    }
    function fromObject(input) {
      var v = {r: 0, g: 0, b: 0, a: 255};
      if (Array.isArray(input)) {
        if (input.length >= 3) {
          v = {r: input[0], g: input[1], b: input[2], a: 255};
          if (input.length > 3) {
            v.a = n2b(input[3]);
          }
        }
      } else {
        v = clone$1(input, {r: 0, g: 0, b: 0, a: 1});
        v.a = n2b(v.a);
      }
      return v;
    }
    function functionParse(str) {
      if (str.charAt(0) === 'r') {
        return rgbParse(str);
      }
      return hueParse(str);
    }
    class Color {
      constructor(input) {
        if (input instanceof Color) {
          return input;
        }
        const type = typeof input;
        let v;
        if (type === 'object') {
          v = fromObject(input);
        } else if (type === 'string') {
          v = hexParse(input) || nameParse(input) || functionParse(input);
        }
        this._rgb = v;
        this._valid = !!v;
      }
      get valid() {
        return this._valid;
      }
      get rgb() {
        var v = clone$1(this._rgb);
        if (v) {
          v.a = b2n(v.a);
        }
        return v;
      }
      set rgb(obj) {
        this._rgb = fromObject(obj);
      }
      rgbString() {
        return this._valid ? rgbString(this._rgb) : undefined;
      }
      hexString() {
        return this._valid ? hexString(this._rgb) : undefined;
      }
      hslString() {
        return this._valid ? hslString(this._rgb) : undefined;
      }
      mix(color, weight) {
        if (color) {
          const c1 = this.rgb;
          const c2 = color.rgb;
          let w2;
          const p = weight === w2 ? 0.5 : weight;
          const w = 2 * p - 1;
          const a = c1.a - c2.a;
          const w1 = ((w * a === -1 ? w : (w + a) / (1 + w * a)) + 1) / 2.0;
          w2 = 1 - w1;
          c1.r = 0xFF & w1 * c1.r + w2 * c2.r + 0.5;
          c1.g = 0xFF & w1 * c1.g + w2 * c2.g + 0.5;
          c1.b = 0xFF & w1 * c1.b + w2 * c2.b + 0.5;
          c1.a = p * c1.a + (1 - p) * c2.a;
          this.rgb = c1;
        }
        return this;
      }
      interpolate(color, t) {
        if (color) {
          this._rgb = interpolate$1(this._rgb, color._rgb, t);
        }
        return this;
      }
      clone() {
        return new Color(this.rgb);
      }
      alpha(a) {
        this._rgb.a = n2b(a);
        return this;
      }
      clearer(ratio) {
        const rgb = this._rgb;
        rgb.a *= 1 - ratio;
        return this;
      }
      greyscale() {
        const rgb = this._rgb;
        const val = round(rgb.r * 0.3 + rgb.g * 0.59 + rgb.b * 0.11);
        rgb.r = rgb.g = rgb.b = val;
        return this;
      }
      opaquer(ratio) {
        const rgb = this._rgb;
        rgb.a *= 1 + ratio;
        return this;
      }
      negate() {
        const v = this._rgb;
        v.r = 255 - v.r;
        v.g = 255 - v.g;
        v.b = 255 - v.b;
        return this;
      }
      lighten(ratio) {
        modHSL(this._rgb, 2, ratio);
        return this;
      }
      darken(ratio) {
        modHSL(this._rgb, 2, -ratio);
        return this;
      }
      saturate(ratio) {
        modHSL(this._rgb, 1, ratio);
        return this;
      }
      desaturate(ratio) {
        modHSL(this._rgb, 1, -ratio);
        return this;
      }
      rotate(deg) {
        rotate(this._rgb, deg);
        return this;
      }
    }

    /*!
     * Chart.js v4.1.1
     * https://www.chartjs.org
     * (c) 2022 Chart.js Contributors
     * Released under the MIT License
     */

    /**
     * @namespace Chart.helpers
     */ /**
     * An empty function that can be used, for example, for optional callback.
     */ function noop() {
    /* noop */ }
    /**
     * Returns a unique id, sequentially generated from a global variable.
     */ const uid = (()=>{
        let id = 0;
        return ()=>id++;
    })();
    /**
     * Returns true if `value` is neither null nor undefined, else returns false.
     * @param value - The value to test.
     * @since 2.7.0
     */ function isNullOrUndef(value) {
        return value === null || typeof value === 'undefined';
    }
    /**
     * Returns true if `value` is an array (including typed arrays), else returns false.
     * @param value - The value to test.
     * @function
     */ function isArray(value) {
        if (Array.isArray && Array.isArray(value)) {
            return true;
        }
        const type = Object.prototype.toString.call(value);
        if (type.slice(0, 7) === '[object' && type.slice(-6) === 'Array]') {
            return true;
        }
        return false;
    }
    /**
     * Returns true if `value` is an object (excluding null), else returns false.
     * @param value - The value to test.
     * @since 2.7.0
     */ function isObject(value) {
        return value !== null && Object.prototype.toString.call(value) === '[object Object]';
    }
    /**
     * Returns true if `value` is a finite number, else returns false
     * @param value  - The value to test.
     */ function isNumberFinite(value) {
        return (typeof value === 'number' || value instanceof Number) && isFinite(+value);
    }
    /**
     * Returns `value` if finite, else returns `defaultValue`.
     * @param value - The value to return if defined.
     * @param defaultValue - The value to return if `value` is not finite.
     */ function finiteOrDefault(value, defaultValue) {
        return isNumberFinite(value) ? value : defaultValue;
    }
    /**
     * Returns `value` if defined, else returns `defaultValue`.
     * @param value - The value to return if defined.
     * @param defaultValue - The value to return if `value` is undefined.
     */ function valueOrDefault(value, defaultValue) {
        return typeof value === 'undefined' ? defaultValue : value;
    }
    const toPercentage = (value, dimension)=>typeof value === 'string' && value.endsWith('%') ? parseFloat(value) / 100 : +value / dimension;
    const toDimension = (value, dimension)=>typeof value === 'string' && value.endsWith('%') ? parseFloat(value) / 100 * dimension : +value;
    /**
     * Calls `fn` with the given `args` in the scope defined by `thisArg` and returns the
     * value returned by `fn`. If `fn` is not a function, this method returns undefined.
     * @param fn - The function to call.
     * @param args - The arguments with which `fn` should be called.
     * @param [thisArg] - The value of `this` provided for the call to `fn`.
     */ function callback(fn, args, thisArg) {
        if (fn && typeof fn.call === 'function') {
            return fn.apply(thisArg, args);
        }
    }
    function each(loopable, fn, thisArg, reverse) {
        let i, len, keys;
        if (isArray(loopable)) {
            len = loopable.length;
            if (reverse) {
                for(i = len - 1; i >= 0; i--){
                    fn.call(thisArg, loopable[i], i);
                }
            } else {
                for(i = 0; i < len; i++){
                    fn.call(thisArg, loopable[i], i);
                }
            }
        } else if (isObject(loopable)) {
            keys = Object.keys(loopable);
            len = keys.length;
            for(i = 0; i < len; i++){
                fn.call(thisArg, loopable[keys[i]], keys[i]);
            }
        }
    }
    /**
     * Returns true if the `a0` and `a1` arrays have the same content, else returns false.
     * @param a0 - The array to compare
     * @param a1 - The array to compare
     * @private
     */ function _elementsEqual(a0, a1) {
        let i, ilen, v0, v1;
        if (!a0 || !a1 || a0.length !== a1.length) {
            return false;
        }
        for(i = 0, ilen = a0.length; i < ilen; ++i){
            v0 = a0[i];
            v1 = a1[i];
            if (v0.datasetIndex !== v1.datasetIndex || v0.index !== v1.index) {
                return false;
            }
        }
        return true;
    }
    /**
     * Returns a deep copy of `source` without keeping references on objects and arrays.
     * @param source - The value to clone.
     */ function clone(source) {
        if (isArray(source)) {
            return source.map(clone);
        }
        if (isObject(source)) {
            const target = Object.create(null);
            const keys = Object.keys(source);
            const klen = keys.length;
            let k = 0;
            for(; k < klen; ++k){
                target[keys[k]] = clone(source[keys[k]]);
            }
            return target;
        }
        return source;
    }
    function isValidKey(key) {
        return [
            '__proto__',
            'prototype',
            'constructor'
        ].indexOf(key) === -1;
    }
    /**
     * The default merger when Chart.helpers.merge is called without merger option.
     * Note(SB): also used by mergeConfig and mergeScaleConfig as fallback.
     * @private
     */ function _merger(key, target, source, options) {
        if (!isValidKey(key)) {
            return;
        }
        const tval = target[key];
        const sval = source[key];
        if (isObject(tval) && isObject(sval)) {
            // eslint-disable-next-line @typescript-eslint/no-use-before-define
            merge(tval, sval, options);
        } else {
            target[key] = clone(sval);
        }
    }
    function merge(target, source, options) {
        const sources = isArray(source) ? source : [
            source
        ];
        const ilen = sources.length;
        if (!isObject(target)) {
            return target;
        }
        options = options || {};
        const merger = options.merger || _merger;
        let current;
        for(let i = 0; i < ilen; ++i){
            current = sources[i];
            if (!isObject(current)) {
                continue;
            }
            const keys = Object.keys(current);
            for(let k = 0, klen = keys.length; k < klen; ++k){
                merger(keys[k], target, current, options);
            }
        }
        return target;
    }
    function mergeIf(target, source) {
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        return merge(target, source, {
            merger: _mergerIf
        });
    }
    /**
     * Merges source[key] in target[key] only if target[key] is undefined.
     * @private
     */ function _mergerIf(key, target, source) {
        if (!isValidKey(key)) {
            return;
        }
        const tval = target[key];
        const sval = source[key];
        if (isObject(tval) && isObject(sval)) {
            mergeIf(tval, sval);
        } else if (!Object.prototype.hasOwnProperty.call(target, key)) {
            target[key] = clone(sval);
        }
    }
    // resolveObjectKey resolver cache
    const keyResolvers = {
        // Chart.helpers.core resolveObjectKey should resolve empty key to root object
        '': (v)=>v,
        // default resolvers
        x: (o)=>o.x,
        y: (o)=>o.y
    };
    /**
     * @private
     */ function _splitKey(key) {
        const parts = key.split('.');
        const keys = [];
        let tmp = '';
        for (const part of parts){
            tmp += part;
            if (tmp.endsWith('\\')) {
                tmp = tmp.slice(0, -1) + '.';
            } else {
                keys.push(tmp);
                tmp = '';
            }
        }
        return keys;
    }
    function _getKeyResolver(key) {
        const keys = _splitKey(key);
        return (obj)=>{
            for (const k of keys){
                if (k === '') {
                    break;
                }
                obj = obj && obj[k];
            }
            return obj;
        };
    }
    function resolveObjectKey(obj, key) {
        const resolver = keyResolvers[key] || (keyResolvers[key] = _getKeyResolver(key));
        return resolver(obj);
    }
    /**
     * @private
     */ function _capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
    const defined = (value)=>typeof value !== 'undefined';
    const isFunction = (value)=>typeof value === 'function';
    // Adapted from https://stackoverflow.com/questions/31128855/comparing-ecma6-sets-for-equality#31129384
    const setsEqual = (a, b)=>{
        if (a.size !== b.size) {
            return false;
        }
        for (const item of a){
            if (!b.has(item)) {
                return false;
            }
        }
        return true;
    };
    /**
     * @param e - The event
     * @private
     */ function _isClickEvent(e) {
        return e.type === 'mouseup' || e.type === 'click' || e.type === 'contextmenu';
    }

    /**
     * @alias Chart.helpers.math
     * @namespace
     */ const PI = Math.PI;
    const TAU = 2 * PI;
    const PITAU = TAU + PI;
    const INFINITY = Number.POSITIVE_INFINITY;
    const RAD_PER_DEG = PI / 180;
    const HALF_PI = PI / 2;
    const QUARTER_PI = PI / 4;
    const TWO_THIRDS_PI = PI * 2 / 3;
    const log10 = Math.log10;
    const sign = Math.sign;
    function almostEquals(x, y, epsilon) {
        return Math.abs(x - y) < epsilon;
    }
    /**
     * Implementation of the nice number algorithm used in determining where axis labels will go
     */ function niceNum(range) {
        const roundedRange = Math.round(range);
        range = almostEquals(range, roundedRange, range / 1000) ? roundedRange : range;
        const niceRange = Math.pow(10, Math.floor(log10(range)));
        const fraction = range / niceRange;
        const niceFraction = fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 5 ? 5 : 10;
        return niceFraction * niceRange;
    }
    /**
     * Returns an array of factors sorted from 1 to sqrt(value)
     * @private
     */ function _factorize(value) {
        const result = [];
        const sqrt = Math.sqrt(value);
        let i;
        for(i = 1; i < sqrt; i++){
            if (value % i === 0) {
                result.push(i);
                result.push(value / i);
            }
        }
        if (sqrt === (sqrt | 0)) {
            result.push(sqrt);
        }
        result.sort((a, b)=>a - b).pop();
        return result;
    }
    function isNumber(n) {
        return !isNaN(parseFloat(n)) && isFinite(n);
    }
    function almostWhole(x, epsilon) {
        const rounded = Math.round(x);
        return rounded - epsilon <= x && rounded + epsilon >= x;
    }
    /**
     * @private
     */ function _setMinAndMaxByKey(array, target, property) {
        let i, ilen, value;
        for(i = 0, ilen = array.length; i < ilen; i++){
            value = array[i][property];
            if (!isNaN(value)) {
                target.min = Math.min(target.min, value);
                target.max = Math.max(target.max, value);
            }
        }
    }
    function toRadians(degrees) {
        return degrees * (PI / 180);
    }
    function toDegrees(radians) {
        return radians * (180 / PI);
    }
    /**
     * Returns the number of decimal places
     * i.e. the number of digits after the decimal point, of the value of this Number.
     * @param x - A number.
     * @returns The number of decimal places.
     * @private
     */ function _decimalPlaces(x) {
        if (!isNumberFinite(x)) {
            return;
        }
        let e = 1;
        let p = 0;
        while(Math.round(x * e) / e !== x){
            e *= 10;
            p++;
        }
        return p;
    }
    // Gets the angle from vertical upright to the point about a centre.
    function getAngleFromPoint(centrePoint, anglePoint) {
        const distanceFromXCenter = anglePoint.x - centrePoint.x;
        const distanceFromYCenter = anglePoint.y - centrePoint.y;
        const radialDistanceFromCenter = Math.sqrt(distanceFromXCenter * distanceFromXCenter + distanceFromYCenter * distanceFromYCenter);
        let angle = Math.atan2(distanceFromYCenter, distanceFromXCenter);
        if (angle < -0.5 * PI) {
            angle += TAU; // make sure the returned angle is in the range of (-PI/2, 3PI/2]
        }
        return {
            angle,
            distance: radialDistanceFromCenter
        };
    }
    function distanceBetweenPoints(pt1, pt2) {
        return Math.sqrt(Math.pow(pt2.x - pt1.x, 2) + Math.pow(pt2.y - pt1.y, 2));
    }
    /**
     * Shortest distance between angles, in either direction.
     * @private
     */ function _angleDiff(a, b) {
        return (a - b + PITAU) % TAU - PI;
    }
    /**
     * Normalize angle to be between 0 and 2*PI
     * @private
     */ function _normalizeAngle(a) {
        return (a % TAU + TAU) % TAU;
    }
    /**
     * @private
     */ function _angleBetween(angle, start, end, sameAngleIsFullCircle) {
        const a = _normalizeAngle(angle);
        const s = _normalizeAngle(start);
        const e = _normalizeAngle(end);
        const angleToStart = _normalizeAngle(s - a);
        const angleToEnd = _normalizeAngle(e - a);
        const startToAngle = _normalizeAngle(a - s);
        const endToAngle = _normalizeAngle(a - e);
        return a === s || a === e || sameAngleIsFullCircle && s === e || angleToStart > angleToEnd && startToAngle < endToAngle;
    }
    /**
     * Limit `value` between `min` and `max`
     * @param value
     * @param min
     * @param max
     * @private
     */ function _limitValue(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }
    /**
     * @param {number} value
     * @private
     */ function _int16Range(value) {
        return _limitValue(value, -32768, 32767);
    }
    /**
     * @param value
     * @param start
     * @param end
     * @param [epsilon]
     * @private
     */ function _isBetween(value, start, end, epsilon = 1e-6) {
        return value >= Math.min(start, end) - epsilon && value <= Math.max(start, end) + epsilon;
    }

    function _lookup(table, value, cmp) {
        cmp = cmp || ((index)=>table[index] < value);
        let hi = table.length - 1;
        let lo = 0;
        let mid;
        while(hi - lo > 1){
            mid = lo + hi >> 1;
            if (cmp(mid)) {
                lo = mid;
            } else {
                hi = mid;
            }
        }
        return {
            lo,
            hi
        };
    }
    /**
     * Binary search
     * @param table - the table search. must be sorted!
     * @param key - property name for the value in each entry
     * @param value - value to find
     * @param last - lookup last index
     * @private
     */ const _lookupByKey = (table, key, value, last)=>_lookup(table, value, last ? (index)=>{
            const ti = table[index][key];
            return ti < value || ti === value && table[index + 1][key] === value;
        } : (index)=>table[index][key] < value);
    /**
     * Reverse binary search
     * @param table - the table search. must be sorted!
     * @param key - property name for the value in each entry
     * @param value - value to find
     * @private
     */ const _rlookupByKey = (table, key, value)=>_lookup(table, value, (index)=>table[index][key] >= value);
    /**
     * Return subset of `values` between `min` and `max` inclusive.
     * Values are assumed to be in sorted order.
     * @param values - sorted array of values
     * @param min - min value
     * @param max - max value
     */ function _filterBetween(values, min, max) {
        let start = 0;
        let end = values.length;
        while(start < end && values[start] < min){
            start++;
        }
        while(end > start && values[end - 1] > max){
            end--;
        }
        return start > 0 || end < values.length ? values.slice(start, end) : values;
    }
    const arrayEvents = [
        'push',
        'pop',
        'shift',
        'splice',
        'unshift'
    ];
    function listenArrayEvents(array, listener) {
        if (array._chartjs) {
            array._chartjs.listeners.push(listener);
            return;
        }
        Object.defineProperty(array, '_chartjs', {
            configurable: true,
            enumerable: false,
            value: {
                listeners: [
                    listener
                ]
            }
        });
        arrayEvents.forEach((key)=>{
            const method = '_onData' + _capitalize(key);
            const base = array[key];
            Object.defineProperty(array, key, {
                configurable: true,
                enumerable: false,
                value (...args) {
                    const res = base.apply(this, args);
                    array._chartjs.listeners.forEach((object)=>{
                        if (typeof object[method] === 'function') {
                            object[method](...args);
                        }
                    });
                    return res;
                }
            });
        });
    }
    function unlistenArrayEvents(array, listener) {
        const stub = array._chartjs;
        if (!stub) {
            return;
        }
        const listeners = stub.listeners;
        const index = listeners.indexOf(listener);
        if (index !== -1) {
            listeners.splice(index, 1);
        }
        if (listeners.length > 0) {
            return;
        }
        arrayEvents.forEach((key)=>{
            delete array[key];
        });
        delete array._chartjs;
    }
    /**
     * @param items
     */ function _arrayUnique(items) {
        const set = new Set();
        let i, ilen;
        for(i = 0, ilen = items.length; i < ilen; ++i){
            set.add(items[i]);
        }
        if (set.size === ilen) {
            return items;
        }
        return Array.from(set);
    }
    /**
    * Request animation polyfill
    */ const requestAnimFrame = function() {
        if (typeof window === 'undefined') {
            return function(callback) {
                return callback();
            };
        }
        return window.requestAnimationFrame;
    }();
    /**
     * Throttles calling `fn` once per animation frame
     * Latest arguments are used on the actual call
     */ function throttled(fn, thisArg) {
        let argsToUse = [];
        let ticking = false;
        return function(...args) {
            // Save the args for use later
            argsToUse = args;
            if (!ticking) {
                ticking = true;
                requestAnimFrame.call(window, ()=>{
                    ticking = false;
                    fn.apply(thisArg, argsToUse);
                });
            }
        };
    }
    /**
     * Debounces calling `fn` for `delay` ms
     */ function debounce(fn, delay) {
        let timeout;
        return function(...args) {
            if (delay) {
                clearTimeout(timeout);
                timeout = setTimeout(fn, delay, args);
            } else {
                fn.apply(this, args);
            }
            return delay;
        };
    }
    /**
     * Converts 'start' to 'left', 'end' to 'right' and others to 'center'
     * @private
     */ const _toLeftRightCenter = (align)=>align === 'start' ? 'left' : align === 'end' ? 'right' : 'center';
    /**
     * Returns `start`, `end` or `(start + end) / 2` depending on `align`. Defaults to `center`
     * @private
     */ const _alignStartEnd = (align, start, end)=>align === 'start' ? start : align === 'end' ? end : (start + end) / 2;
    /**
     * Returns `left`, `right` or `(left + right) / 2` depending on `align`. Defaults to `left`
     * @private
     */ const _textX = (align, left, right, rtl)=>{
        const check = rtl ? 'left' : 'right';
        return align === check ? right : align === 'center' ? (left + right) / 2 : left;
    };
    /**
     * Return start and count of visible points.
     * @private
     */ function _getStartAndCountOfVisiblePoints(meta, points, animationsDisabled) {
        const pointCount = points.length;
        let start = 0;
        let count = pointCount;
        if (meta._sorted) {
            const { iScale , _parsed  } = meta;
            const axis = iScale.axis;
            const { min , max , minDefined , maxDefined  } = iScale.getUserBounds();
            if (minDefined) {
                start = _limitValue(Math.min(// @ts-expect-error Need to type _parsed
                _lookupByKey(_parsed, iScale.axis, min).lo, // @ts-expect-error Need to fix types on _lookupByKey
                animationsDisabled ? pointCount : _lookupByKey(points, axis, iScale.getPixelForValue(min)).lo), 0, pointCount - 1);
            }
            if (maxDefined) {
                count = _limitValue(Math.max(// @ts-expect-error Need to type _parsed
                _lookupByKey(_parsed, iScale.axis, max, true).hi + 1, // @ts-expect-error Need to fix types on _lookupByKey
                animationsDisabled ? 0 : _lookupByKey(points, axis, iScale.getPixelForValue(max), true).hi + 1), start, pointCount) - start;
            } else {
                count = pointCount - start;
            }
        }
        return {
            start,
            count
        };
    }
    /**
     * Checks if the scale ranges have changed.
     * @param {object} meta - dataset meta.
     * @returns {boolean}
     * @private
     */ function _scaleRangesChanged(meta) {
        const { xScale , yScale , _scaleRanges  } = meta;
        const newRanges = {
            xmin: xScale.min,
            xmax: xScale.max,
            ymin: yScale.min,
            ymax: yScale.max
        };
        if (!_scaleRanges) {
            meta._scaleRanges = newRanges;
            return true;
        }
        const changed = _scaleRanges.xmin !== xScale.min || _scaleRanges.xmax !== xScale.max || _scaleRanges.ymin !== yScale.min || _scaleRanges.ymax !== yScale.max;
        Object.assign(_scaleRanges, newRanges);
        return changed;
    }

    const atEdge = (t)=>t === 0 || t === 1;
    const elasticIn = (t, s, p)=>-(Math.pow(2, 10 * (t -= 1)) * Math.sin((t - s) * TAU / p));
    const elasticOut = (t, s, p)=>Math.pow(2, -10 * t) * Math.sin((t - s) * TAU / p) + 1;
    /**
     * Easing functions adapted from Robert Penner's easing equations.
     * @namespace Chart.helpers.easing.effects
     * @see http://www.robertpenner.com/easing/
     */ const effects = {
        linear: (t)=>t,
        easeInQuad: (t)=>t * t,
        easeOutQuad: (t)=>-t * (t - 2),
        easeInOutQuad: (t)=>(t /= 0.5) < 1 ? 0.5 * t * t : -0.5 * (--t * (t - 2) - 1),
        easeInCubic: (t)=>t * t * t,
        easeOutCubic: (t)=>(t -= 1) * t * t + 1,
        easeInOutCubic: (t)=>(t /= 0.5) < 1 ? 0.5 * t * t * t : 0.5 * ((t -= 2) * t * t + 2),
        easeInQuart: (t)=>t * t * t * t,
        easeOutQuart: (t)=>-((t -= 1) * t * t * t - 1),
        easeInOutQuart: (t)=>(t /= 0.5) < 1 ? 0.5 * t * t * t * t : -0.5 * ((t -= 2) * t * t * t - 2),
        easeInQuint: (t)=>t * t * t * t * t,
        easeOutQuint: (t)=>(t -= 1) * t * t * t * t + 1,
        easeInOutQuint: (t)=>(t /= 0.5) < 1 ? 0.5 * t * t * t * t * t : 0.5 * ((t -= 2) * t * t * t * t + 2),
        easeInSine: (t)=>-Math.cos(t * HALF_PI) + 1,
        easeOutSine: (t)=>Math.sin(t * HALF_PI),
        easeInOutSine: (t)=>-0.5 * (Math.cos(PI * t) - 1),
        easeInExpo: (t)=>t === 0 ? 0 : Math.pow(2, 10 * (t - 1)),
        easeOutExpo: (t)=>t === 1 ? 1 : -Math.pow(2, -10 * t) + 1,
        easeInOutExpo: (t)=>atEdge(t) ? t : t < 0.5 ? 0.5 * Math.pow(2, 10 * (t * 2 - 1)) : 0.5 * (-Math.pow(2, -10 * (t * 2 - 1)) + 2),
        easeInCirc: (t)=>t >= 1 ? t : -(Math.sqrt(1 - t * t) - 1),
        easeOutCirc: (t)=>Math.sqrt(1 - (t -= 1) * t),
        easeInOutCirc: (t)=>(t /= 0.5) < 1 ? -0.5 * (Math.sqrt(1 - t * t) - 1) : 0.5 * (Math.sqrt(1 - (t -= 2) * t) + 1),
        easeInElastic: (t)=>atEdge(t) ? t : elasticIn(t, 0.075, 0.3),
        easeOutElastic: (t)=>atEdge(t) ? t : elasticOut(t, 0.075, 0.3),
        easeInOutElastic (t) {
            const s = 0.1125;
            const p = 0.45;
            return atEdge(t) ? t : t < 0.5 ? 0.5 * elasticIn(t * 2, s, p) : 0.5 + 0.5 * elasticOut(t * 2 - 1, s, p);
        },
        easeInBack (t) {
            const s = 1.70158;
            return t * t * ((s + 1) * t - s);
        },
        easeOutBack (t) {
            const s = 1.70158;
            return (t -= 1) * t * ((s + 1) * t + s) + 1;
        },
        easeInOutBack (t) {
            let s = 1.70158;
            if ((t /= 0.5) < 1) {
                return 0.5 * (t * t * (((s *= 1.525) + 1) * t - s));
            }
            return 0.5 * ((t -= 2) * t * (((s *= 1.525) + 1) * t + s) + 2);
        },
        easeInBounce: (t)=>1 - effects.easeOutBounce(1 - t),
        easeOutBounce (t) {
            const m = 7.5625;
            const d = 2.75;
            if (t < 1 / d) {
                return m * t * t;
            }
            if (t < 2 / d) {
                return m * (t -= 1.5 / d) * t + 0.75;
            }
            if (t < 2.5 / d) {
                return m * (t -= 2.25 / d) * t + 0.9375;
            }
            return m * (t -= 2.625 / d) * t + 0.984375;
        },
        easeInOutBounce: (t)=>t < 0.5 ? effects.easeInBounce(t * 2) * 0.5 : effects.easeOutBounce(t * 2 - 1) * 0.5 + 0.5
    };

    function isPatternOrGradient(value) {
        if (value && typeof value === 'object') {
            const type = value.toString();
            return type === '[object CanvasPattern]' || type === '[object CanvasGradient]';
        }
        return false;
    }
    function color(value) {
        return isPatternOrGradient(value) ? value : new Color(value);
    }
    function getHoverColor(value) {
        return isPatternOrGradient(value) ? value : new Color(value).saturate(0.5).darken(0.1).hexString();
    }

    const numbers = [
        'x',
        'y',
        'borderWidth',
        'radius',
        'tension'
    ];
    const colors = [
        'color',
        'borderColor',
        'backgroundColor'
    ];
    function applyAnimationsDefaults(defaults) {
        defaults.set('animation', {
            delay: undefined,
            duration: 1000,
            easing: 'easeOutQuart',
            fn: undefined,
            from: undefined,
            loop: undefined,
            to: undefined,
            type: undefined
        });
        defaults.describe('animation', {
            _fallback: false,
            _indexable: false,
            _scriptable: (name)=>name !== 'onProgress' && name !== 'onComplete' && name !== 'fn'
        });
        defaults.set('animations', {
            colors: {
                type: 'color',
                properties: colors
            },
            numbers: {
                type: 'number',
                properties: numbers
            }
        });
        defaults.describe('animations', {
            _fallback: 'animation'
        });
        defaults.set('transitions', {
            active: {
                animation: {
                    duration: 400
                }
            },
            resize: {
                animation: {
                    duration: 0
                }
            },
            show: {
                animations: {
                    colors: {
                        from: 'transparent'
                    },
                    visible: {
                        type: 'boolean',
                        duration: 0
                    }
                }
            },
            hide: {
                animations: {
                    colors: {
                        to: 'transparent'
                    },
                    visible: {
                        type: 'boolean',
                        easing: 'linear',
                        fn: (v)=>v | 0
                    }
                }
            }
        });
    }

    function applyLayoutsDefaults(defaults) {
        defaults.set('layout', {
            autoPadding: true,
            padding: {
                top: 0,
                right: 0,
                bottom: 0,
                left: 0
            }
        });
    }

    const intlCache = new Map();
    function getNumberFormat(locale, options) {
        options = options || {};
        const cacheKey = locale + JSON.stringify(options);
        let formatter = intlCache.get(cacheKey);
        if (!formatter) {
            formatter = new Intl.NumberFormat(locale, options);
            intlCache.set(cacheKey, formatter);
        }
        return formatter;
    }
    function formatNumber(num, locale, options) {
        return getNumberFormat(locale, options).format(num);
    }

    const formatters = {
     values (value) {
            return isArray(value) ?  value : '' + value;
        },
     numeric (tickValue, index, ticks) {
            if (tickValue === 0) {
                return '0';
            }
            const locale = this.chart.options.locale;
            let notation;
            let delta = tickValue;
            if (ticks.length > 1) {
                const maxTick = Math.max(Math.abs(ticks[0].value), Math.abs(ticks[ticks.length - 1].value));
                if (maxTick < 1e-4 || maxTick > 1e+15) {
                    notation = 'scientific';
                }
                delta = calculateDelta(tickValue, ticks);
            }
            const logDelta = log10(Math.abs(delta));
            const numDecimal = Math.max(Math.min(-1 * Math.floor(logDelta), 20), 0);
            const options = {
                notation,
                minimumFractionDigits: numDecimal,
                maximumFractionDigits: numDecimal
            };
            Object.assign(options, this.options.ticks.format);
            return formatNumber(tickValue, locale, options);
        },
     logarithmic (tickValue, index, ticks) {
            if (tickValue === 0) {
                return '0';
            }
            const remain = ticks[index].significand || tickValue / Math.pow(10, Math.floor(log10(tickValue)));
            if ([
                1,
                2,
                3,
                5,
                10,
                15
            ].includes(remain) || index > 0.8 * ticks.length) {
                return formatters.numeric.call(this, tickValue, index, ticks);
            }
            return '';
        }
    };
    function calculateDelta(tickValue, ticks) {
        let delta = ticks.length > 3 ? ticks[2].value - ticks[1].value : ticks[1].value - ticks[0].value;
        if (Math.abs(delta) >= 1 && tickValue !== Math.floor(tickValue)) {
            delta = tickValue - Math.floor(tickValue);
        }
        return delta;
    }
     var Ticks = {
        formatters
    };

    function applyScaleDefaults(defaults) {
        defaults.set('scale', {
            display: true,
            offset: false,
            reverse: false,
            beginAtZero: false,
     bounds: 'ticks',
     grace: 0,
            grid: {
                display: true,
                lineWidth: 1,
                drawOnChartArea: true,
                drawTicks: true,
                tickLength: 8,
                tickWidth: (_ctx, options)=>options.lineWidth,
                tickColor: (_ctx, options)=>options.color,
                offset: false
            },
            border: {
                display: true,
                dash: [],
                dashOffset: 0.0,
                width: 1
            },
            title: {
                display: false,
                text: '',
                padding: {
                    top: 4,
                    bottom: 4
                }
            },
            ticks: {
                minRotation: 0,
                maxRotation: 50,
                mirror: false,
                textStrokeWidth: 0,
                textStrokeColor: '',
                padding: 3,
                display: true,
                autoSkip: true,
                autoSkipPadding: 3,
                labelOffset: 0,
                callback: Ticks.formatters.values,
                minor: {},
                major: {},
                align: 'center',
                crossAlign: 'near',
                showLabelBackdrop: false,
                backdropColor: 'rgba(255, 255, 255, 0.75)',
                backdropPadding: 2
            }
        });
        defaults.route('scale.ticks', 'color', '', 'color');
        defaults.route('scale.grid', 'color', '', 'borderColor');
        defaults.route('scale.border', 'color', '', 'borderColor');
        defaults.route('scale.title', 'color', '', 'color');
        defaults.describe('scale', {
            _fallback: false,
            _scriptable: (name)=>!name.startsWith('before') && !name.startsWith('after') && name !== 'callback' && name !== 'parser',
            _indexable: (name)=>name !== 'borderDash' && name !== 'tickBorderDash' && name !== 'dash'
        });
        defaults.describe('scales', {
            _fallback: 'scale'
        });
        defaults.describe('scale.ticks', {
            _scriptable: (name)=>name !== 'backdropPadding' && name !== 'callback',
            _indexable: (name)=>name !== 'backdropPadding'
        });
    }

    const overrides = Object.create(null);
    const descriptors = Object.create(null);
     function getScope$1(node, key) {
        if (!key) {
            return node;
        }
        const keys = key.split('.');
        for(let i = 0, n = keys.length; i < n; ++i){
            const k = keys[i];
            node = node[k] || (node[k] = Object.create(null));
        }
        return node;
    }
    function set(root, scope, values) {
        if (typeof scope === 'string') {
            return merge(getScope$1(root, scope), values);
        }
        return merge(getScope$1(root, ''), scope);
    }
     class Defaults {
        constructor(_descriptors, _appliers){
            this.animation = undefined;
            this.backgroundColor = 'rgba(0,0,0,0.1)';
            this.borderColor = 'rgba(0,0,0,0.1)';
            this.color = '#666';
            this.datasets = {};
            this.devicePixelRatio = (context)=>context.chart.platform.getDevicePixelRatio();
            this.elements = {};
            this.events = [
                'mousemove',
                'mouseout',
                'click',
                'touchstart',
                'touchmove'
            ];
            this.font = {
                family: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
                size: 12,
                style: 'normal',
                lineHeight: 1.2,
                weight: null
            };
            this.hover = {};
            this.hoverBackgroundColor = (ctx, options)=>getHoverColor(options.backgroundColor);
            this.hoverBorderColor = (ctx, options)=>getHoverColor(options.borderColor);
            this.hoverColor = (ctx, options)=>getHoverColor(options.color);
            this.indexAxis = 'x';
            this.interaction = {
                mode: 'nearest',
                intersect: true,
                includeInvisible: false
            };
            this.maintainAspectRatio = true;
            this.onHover = null;
            this.onClick = null;
            this.parsing = true;
            this.plugins = {};
            this.responsive = true;
            this.scale = undefined;
            this.scales = {};
            this.showLine = true;
            this.drawActiveElementsOnTop = true;
            this.describe(_descriptors);
            this.apply(_appliers);
        }
     set(scope, values) {
            return set(this, scope, values);
        }
     get(scope) {
            return getScope$1(this, scope);
        }
     describe(scope, values) {
            return set(descriptors, scope, values);
        }
        override(scope, values) {
            return set(overrides, scope, values);
        }
     route(scope, name, targetScope, targetName) {
            const scopeObject = getScope$1(this, scope);
            const targetScopeObject = getScope$1(this, targetScope);
            const privateName = '_' + name;
            Object.defineProperties(scopeObject, {
                [privateName]: {
                    value: scopeObject[name],
                    writable: true
                },
                [name]: {
                    enumerable: true,
                    get () {
                        const local = this[privateName];
                        const target = targetScopeObject[targetName];
                        if (isObject(local)) {
                            return Object.assign({}, target, local);
                        }
                        return valueOrDefault(local, target);
                    },
                    set (value) {
                        this[privateName] = value;
                    }
                }
            });
        }
        apply(appliers) {
            appliers.forEach((apply)=>apply(this));
        }
    }
    var defaults = /* #__PURE__ */ new Defaults({
        _scriptable: (name)=>!name.startsWith('on'),
        _indexable: (name)=>name !== 'events',
        hover: {
            _fallback: 'interaction'
        },
        interaction: {
            _scriptable: false,
            _indexable: false
        }
    }, [
        applyAnimationsDefaults,
        applyLayoutsDefaults,
        applyScaleDefaults
    ]);

    function toFontString(font) {
        if (!font || isNullOrUndef(font.size) || isNullOrUndef(font.family)) {
            return null;
        }
        return (font.style ? font.style + ' ' : '') + (font.weight ? font.weight + ' ' : '') + font.size + 'px ' + font.family;
    }
     function _measureText(ctx, data, gc, longest, string) {
        let textWidth = data[string];
        if (!textWidth) {
            textWidth = data[string] = ctx.measureText(string).width;
            gc.push(string);
        }
        if (textWidth > longest) {
            longest = textWidth;
        }
        return longest;
    }
     function _longestText(ctx, font, arrayOfThings, cache) {
        cache = cache || {};
        let data = cache.data = cache.data || {};
        let gc = cache.garbageCollect = cache.garbageCollect || [];
        if (cache.font !== font) {
            data = cache.data = {};
            gc = cache.garbageCollect = [];
            cache.font = font;
        }
        ctx.save();
        ctx.font = font;
        let longest = 0;
        const ilen = arrayOfThings.length;
        let i, j, jlen, thing, nestedThing;
        for(i = 0; i < ilen; i++){
            thing = arrayOfThings[i];
            if (thing !== undefined && thing !== null && isArray(thing) !== true) {
                longest = _measureText(ctx, data, gc, longest, thing);
            } else if (isArray(thing)) {
                for(j = 0, jlen = thing.length; j < jlen; j++){
                    nestedThing = thing[j];
                    if (nestedThing !== undefined && nestedThing !== null && !isArray(nestedThing)) {
                        longest = _measureText(ctx, data, gc, longest, nestedThing);
                    }
                }
            }
        }
        ctx.restore();
        const gcLen = gc.length / 2;
        if (gcLen > arrayOfThings.length) {
            for(i = 0; i < gcLen; i++){
                delete data[gc[i]];
            }
            gc.splice(0, gcLen);
        }
        return longest;
    }
     function _alignPixel(chart, pixel, width) {
        const devicePixelRatio = chart.currentDevicePixelRatio;
        const halfWidth = width !== 0 ? Math.max(width / 2, 0.5) : 0;
        return Math.round((pixel - halfWidth) * devicePixelRatio) / devicePixelRatio + halfWidth;
    }
     function clearCanvas(canvas, ctx) {
        ctx = ctx || canvas.getContext('2d');
        ctx.save();
        ctx.resetTransform();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.restore();
    }
    function drawPoint(ctx, options, x, y) {
        drawPointLegend(ctx, options, x, y, null);
    }
    function drawPointLegend(ctx, options, x, y, w) {
        let type, xOffset, yOffset, size, cornerRadius, width, xOffsetW, yOffsetW;
        const style = options.pointStyle;
        const rotation = options.rotation;
        const radius = options.radius;
        let rad = (rotation || 0) * RAD_PER_DEG;
        if (style && typeof style === 'object') {
            type = style.toString();
            if (type === '[object HTMLImageElement]' || type === '[object HTMLCanvasElement]') {
                ctx.save();
                ctx.translate(x, y);
                ctx.rotate(rad);
                ctx.drawImage(style, -style.width / 2, -style.height / 2, style.width, style.height);
                ctx.restore();
                return;
            }
        }
        if (isNaN(radius) || radius <= 0) {
            return;
        }
        ctx.beginPath();
        switch(style){
            default:
                if (w) {
                    ctx.ellipse(x, y, w / 2, radius, 0, 0, TAU);
                } else {
                    ctx.arc(x, y, radius, 0, TAU);
                }
                ctx.closePath();
                break;
            case 'triangle':
                width = w ? w / 2 : radius;
                ctx.moveTo(x + Math.sin(rad) * width, y - Math.cos(rad) * radius);
                rad += TWO_THIRDS_PI;
                ctx.lineTo(x + Math.sin(rad) * width, y - Math.cos(rad) * radius);
                rad += TWO_THIRDS_PI;
                ctx.lineTo(x + Math.sin(rad) * width, y - Math.cos(rad) * radius);
                ctx.closePath();
                break;
            case 'rectRounded':
                cornerRadius = radius * 0.516;
                size = radius - cornerRadius;
                xOffset = Math.cos(rad + QUARTER_PI) * size;
                xOffsetW = Math.cos(rad + QUARTER_PI) * (w ? w / 2 - cornerRadius : size);
                yOffset = Math.sin(rad + QUARTER_PI) * size;
                yOffsetW = Math.sin(rad + QUARTER_PI) * (w ? w / 2 - cornerRadius : size);
                ctx.arc(x - xOffsetW, y - yOffset, cornerRadius, rad - PI, rad - HALF_PI);
                ctx.arc(x + yOffsetW, y - xOffset, cornerRadius, rad - HALF_PI, rad);
                ctx.arc(x + xOffsetW, y + yOffset, cornerRadius, rad, rad + HALF_PI);
                ctx.arc(x - yOffsetW, y + xOffset, cornerRadius, rad + HALF_PI, rad + PI);
                ctx.closePath();
                break;
            case 'rect':
                if (!rotation) {
                    size = Math.SQRT1_2 * radius;
                    width = w ? w / 2 : size;
                    ctx.rect(x - width, y - size, 2 * width, 2 * size);
                    break;
                }
                rad += QUARTER_PI;
             case 'rectRot':
                xOffsetW = Math.cos(rad) * (w ? w / 2 : radius);
                xOffset = Math.cos(rad) * radius;
                yOffset = Math.sin(rad) * radius;
                yOffsetW = Math.sin(rad) * (w ? w / 2 : radius);
                ctx.moveTo(x - xOffsetW, y - yOffset);
                ctx.lineTo(x + yOffsetW, y - xOffset);
                ctx.lineTo(x + xOffsetW, y + yOffset);
                ctx.lineTo(x - yOffsetW, y + xOffset);
                ctx.closePath();
                break;
            case 'crossRot':
                rad += QUARTER_PI;
             case 'cross':
                xOffsetW = Math.cos(rad) * (w ? w / 2 : radius);
                xOffset = Math.cos(rad) * radius;
                yOffset = Math.sin(rad) * radius;
                yOffsetW = Math.sin(rad) * (w ? w / 2 : radius);
                ctx.moveTo(x - xOffsetW, y - yOffset);
                ctx.lineTo(x + xOffsetW, y + yOffset);
                ctx.moveTo(x + yOffsetW, y - xOffset);
                ctx.lineTo(x - yOffsetW, y + xOffset);
                break;
            case 'star':
                xOffsetW = Math.cos(rad) * (w ? w / 2 : radius);
                xOffset = Math.cos(rad) * radius;
                yOffset = Math.sin(rad) * radius;
                yOffsetW = Math.sin(rad) * (w ? w / 2 : radius);
                ctx.moveTo(x - xOffsetW, y - yOffset);
                ctx.lineTo(x + xOffsetW, y + yOffset);
                ctx.moveTo(x + yOffsetW, y - xOffset);
                ctx.lineTo(x - yOffsetW, y + xOffset);
                rad += QUARTER_PI;
                xOffsetW = Math.cos(rad) * (w ? w / 2 : radius);
                xOffset = Math.cos(rad) * radius;
                yOffset = Math.sin(rad) * radius;
                yOffsetW = Math.sin(rad) * (w ? w / 2 : radius);
                ctx.moveTo(x - xOffsetW, y - yOffset);
                ctx.lineTo(x + xOffsetW, y + yOffset);
                ctx.moveTo(x + yOffsetW, y - xOffset);
                ctx.lineTo(x - yOffsetW, y + xOffset);
                break;
            case 'line':
                xOffset = w ? w / 2 : Math.cos(rad) * radius;
                yOffset = Math.sin(rad) * radius;
                ctx.moveTo(x - xOffset, y - yOffset);
                ctx.lineTo(x + xOffset, y + yOffset);
                break;
            case 'dash':
                ctx.moveTo(x, y);
                ctx.lineTo(x + Math.cos(rad) * (w ? w / 2 : radius), y + Math.sin(rad) * radius);
                break;
            case false:
                ctx.closePath();
                break;
        }
        ctx.fill();
        if (options.borderWidth > 0) {
            ctx.stroke();
        }
    }
     function _isPointInArea(point, area, margin) {
        margin = margin || 0.5;
        return !area || point && point.x > area.left - margin && point.x < area.right + margin && point.y > area.top - margin && point.y < area.bottom + margin;
    }
    function clipArea(ctx, area) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(area.left, area.top, area.right - area.left, area.bottom - area.top);
        ctx.clip();
    }
    function unclipArea(ctx) {
        ctx.restore();
    }
     function _steppedLineTo(ctx, previous, target, flip, mode) {
        if (!previous) {
            return ctx.lineTo(target.x, target.y);
        }
        if (mode === 'middle') {
            const midpoint = (previous.x + target.x) / 2.0;
            ctx.lineTo(midpoint, previous.y);
            ctx.lineTo(midpoint, target.y);
        } else if (mode === 'after' !== !!flip) {
            ctx.lineTo(previous.x, target.y);
        } else {
            ctx.lineTo(target.x, previous.y);
        }
        ctx.lineTo(target.x, target.y);
    }
     function _bezierCurveTo(ctx, previous, target, flip) {
        if (!previous) {
            return ctx.lineTo(target.x, target.y);
        }
        ctx.bezierCurveTo(flip ? previous.cp1x : previous.cp2x, flip ? previous.cp1y : previous.cp2y, flip ? target.cp2x : target.cp1x, flip ? target.cp2y : target.cp1y, target.x, target.y);
    }
     function renderText(ctx, text, x, y, font, opts = {}) {
        const lines = isArray(text) ? text : [
            text
        ];
        const stroke = opts.strokeWidth > 0 && opts.strokeColor !== '';
        let i, line;
        ctx.save();
        ctx.font = font.string;
        setRenderOpts(ctx, opts);
        for(i = 0; i < lines.length; ++i){
            line = lines[i];
            if (opts.backdrop) {
                drawBackdrop(ctx, opts.backdrop);
            }
            if (stroke) {
                if (opts.strokeColor) {
                    ctx.strokeStyle = opts.strokeColor;
                }
                if (!isNullOrUndef(opts.strokeWidth)) {
                    ctx.lineWidth = opts.strokeWidth;
                }
                ctx.strokeText(line, x, y, opts.maxWidth);
            }
            ctx.fillText(line, x, y, opts.maxWidth);
            decorateText(ctx, x, y, line, opts);
            y += font.lineHeight;
        }
        ctx.restore();
    }
    function setRenderOpts(ctx, opts) {
        if (opts.translation) {
            ctx.translate(opts.translation[0], opts.translation[1]);
        }
        if (!isNullOrUndef(opts.rotation)) {
            ctx.rotate(opts.rotation);
        }
        if (opts.color) {
            ctx.fillStyle = opts.color;
        }
        if (opts.textAlign) {
            ctx.textAlign = opts.textAlign;
        }
        if (opts.textBaseline) {
            ctx.textBaseline = opts.textBaseline;
        }
    }
    function decorateText(ctx, x, y, line, opts) {
        if (opts.strikethrough || opts.underline) {
     const metrics = ctx.measureText(line);
            const left = x - metrics.actualBoundingBoxLeft;
            const right = x + metrics.actualBoundingBoxRight;
            const top = y - metrics.actualBoundingBoxAscent;
            const bottom = y + metrics.actualBoundingBoxDescent;
            const yDecoration = opts.strikethrough ? (top + bottom) / 2 : bottom;
            ctx.strokeStyle = ctx.fillStyle;
            ctx.beginPath();
            ctx.lineWidth = opts.decorationWidth || 2;
            ctx.moveTo(left, yDecoration);
            ctx.lineTo(right, yDecoration);
            ctx.stroke();
        }
    }
    function drawBackdrop(ctx, opts) {
        const oldColor = ctx.fillStyle;
        ctx.fillStyle = opts.color;
        ctx.fillRect(opts.left, opts.top, opts.width, opts.height);
        ctx.fillStyle = oldColor;
    }
     function addRoundedRectPath(ctx, rect) {
        const { x , y , w , h , radius  } = rect;
        ctx.arc(x + radius.topLeft, y + radius.topLeft, radius.topLeft, -HALF_PI, PI, true);
        ctx.lineTo(x, y + h - radius.bottomLeft);
        ctx.arc(x + radius.bottomLeft, y + h - radius.bottomLeft, radius.bottomLeft, PI, HALF_PI, true);
        ctx.lineTo(x + w - radius.bottomRight, y + h);
        ctx.arc(x + w - radius.bottomRight, y + h - radius.bottomRight, radius.bottomRight, HALF_PI, 0, true);
        ctx.lineTo(x + w, y + radius.topRight);
        ctx.arc(x + w - radius.topRight, y + radius.topRight, radius.topRight, 0, -HALF_PI, true);
        ctx.lineTo(x + radius.topLeft, y);
    }

    const LINE_HEIGHT = /^(normal|(\d+(?:\.\d+)?)(px|em|%)?)$/;
    const FONT_STYLE = /^(normal|italic|initial|inherit|unset|(oblique( -?[0-9]?[0-9]deg)?))$/;
    /**
     * @alias Chart.helpers.options
     * @namespace
     */ /**
     * Converts the given line height `value` in pixels for a specific font `size`.
     * @param value - The lineHeight to parse (eg. 1.6, '14px', '75%', '1.6em').
     * @param size - The font size (in pixels) used to resolve relative `value`.
     * @returns The effective line height in pixels (size * 1.2 if value is invalid).
     * @see https://developer.mozilla.org/en-US/docs/Web/CSS/line-height
     * @since 2.7.0
     */ function toLineHeight(value, size) {
        const matches = ('' + value).match(LINE_HEIGHT);
        if (!matches || matches[1] === 'normal') {
            return size * 1.2;
        }
        value = +matches[2];
        switch(matches[3]){
            case 'px':
                return value;
            case '%':
                value /= 100;
                break;
        }
        return size * value;
    }
    const numberOrZero = (v)=>+v || 0;
    function _readValueToProps(value, props) {
        const ret = {};
        const objProps = isObject(props);
        const keys = objProps ? Object.keys(props) : props;
        const read = isObject(value) ? objProps ? (prop)=>valueOrDefault(value[prop], value[props[prop]]) : (prop)=>value[prop] : ()=>value;
        for (const prop of keys){
            ret[prop] = numberOrZero(read(prop));
        }
        return ret;
    }
    /**
     * Converts the given value into a TRBL object.
     * @param value - If a number, set the value to all TRBL component,
     *  else, if an object, use defined properties and sets undefined ones to 0.
     *  x / y are shorthands for same value for left/right and top/bottom.
     * @returns The padding values (top, right, bottom, left)
     * @since 3.0.0
     */ function toTRBL(value) {
        return _readValueToProps(value, {
            top: 'y',
            right: 'x',
            bottom: 'y',
            left: 'x'
        });
    }
    /**
     * Converts the given value into a TRBL corners object (similar with css border-radius).
     * @param value - If a number, set the value to all TRBL corner components,
     *  else, if an object, use defined properties and sets undefined ones to 0.
     * @returns The TRBL corner values (topLeft, topRight, bottomLeft, bottomRight)
     * @since 3.0.0
     */ function toTRBLCorners(value) {
        return _readValueToProps(value, [
            'topLeft',
            'topRight',
            'bottomLeft',
            'bottomRight'
        ]);
    }
    /**
     * Converts the given value into a padding object with pre-computed width/height.
     * @param value - If a number, set the value to all TRBL component,
     *  else, if an object, use defined properties and sets undefined ones to 0.
     *  x / y are shorthands for same value for left/right and top/bottom.
     * @returns The padding values (top, right, bottom, left, width, height)
     * @since 2.7.0
     */ function toPadding(value) {
        const obj = toTRBL(value);
        obj.width = obj.left + obj.right;
        obj.height = obj.top + obj.bottom;
        return obj;
    }
    /**
     * Parses font options and returns the font object.
     * @param options - A object that contains font options to be parsed.
     * @param fallback - A object that contains fallback font options.
     * @return The font object.
     * @private
     */ function toFont(options, fallback) {
        options = options || {};
        fallback = fallback || defaults.font;
        let size = valueOrDefault(options.size, fallback.size);
        if (typeof size === 'string') {
            size = parseInt(size, 10);
        }
        let style = valueOrDefault(options.style, fallback.style);
        if (style && !('' + style).match(FONT_STYLE)) {
            console.warn('Invalid font style specified: "' + style + '"');
            style = undefined;
        }
        const font = {
            family: valueOrDefault(options.family, fallback.family),
            lineHeight: toLineHeight(valueOrDefault(options.lineHeight, fallback.lineHeight), size),
            size,
            style,
            weight: valueOrDefault(options.weight, fallback.weight),
            string: ''
        };
        font.string = toFontString(font);
        return font;
    }
    /**
     * Evaluates the given `inputs` sequentially and returns the first defined value.
     * @param inputs - An array of values, falling back to the last value.
     * @param context - If defined and the current value is a function, the value
     * is called with `context` as first argument and the result becomes the new input.
     * @param index - If defined and the current value is an array, the value
     * at `index` become the new input.
     * @param info - object to return information about resolution in
     * @param info.cacheable - Will be set to `false` if option is not cacheable.
     * @since 2.7.0
     */ function resolve(inputs, context, index, info) {
        let cacheable = true;
        let i, ilen, value;
        for(i = 0, ilen = inputs.length; i < ilen; ++i){
            value = inputs[i];
            if (value === undefined) {
                continue;
            }
            if (context !== undefined && typeof value === 'function') {
                value = value(context);
                cacheable = false;
            }
            if (index !== undefined && isArray(value)) {
                value = value[index % value.length];
                cacheable = false;
            }
            if (value !== undefined) {
                if (info && !cacheable) {
                    info.cacheable = false;
                }
                return value;
            }
        }
    }
    /**
     * @param minmax
     * @param grace
     * @param beginAtZero
     * @private
     */ function _addGrace(minmax, grace, beginAtZero) {
        const { min , max  } = minmax;
        const change = toDimension(grace, (max - min) / 2);
        const keepZero = (value, add)=>beginAtZero && value === 0 ? 0 : value + add;
        return {
            min: keepZero(min, -Math.abs(change)),
            max: keepZero(max, change)
        };
    }
    function createContext(parentContext, context) {
        return Object.assign(Object.create(parentContext), context);
    }

    function _createResolver(scopes, prefixes = [
        ''
    ], rootScopes = scopes, fallback, getTarget = ()=>scopes[0]) {
        if (!defined(fallback)) {
            fallback = _resolve('_fallback', scopes);
        }
        const cache = {
            [Symbol.toStringTag]: 'Object',
            _cacheable: true,
            _scopes: scopes,
            _rootScopes: rootScopes,
            _fallback: fallback,
            _getTarget: getTarget,
            override: (scope)=>_createResolver([
                    scope,
                    ...scopes
                ], prefixes, rootScopes, fallback)
        };
        return new Proxy(cache, {
     deleteProperty (target, prop) {
                delete target[prop];
                delete target._keys;
                delete scopes[0][prop];
                return true;
            },
     get (target, prop) {
                return _cached(target, prop, ()=>_resolveWithPrefixes(prop, prefixes, scopes, target));
            },
     getOwnPropertyDescriptor (target, prop) {
                return Reflect.getOwnPropertyDescriptor(target._scopes[0], prop);
            },
     getPrototypeOf () {
                return Reflect.getPrototypeOf(scopes[0]);
            },
     has (target, prop) {
                return getKeysFromAllScopes(target).includes(prop);
            },
     ownKeys (target) {
                return getKeysFromAllScopes(target);
            },
     set (target, prop, value) {
                const storage = target._storage || (target._storage = getTarget());
                target[prop] = storage[prop] = value;
                delete target._keys;
                return true;
            }
        });
    }
     function _attachContext(proxy, context, subProxy, descriptorDefaults) {
        const cache = {
            _cacheable: false,
            _proxy: proxy,
            _context: context,
            _subProxy: subProxy,
            _stack: new Set(),
            _descriptors: _descriptors(proxy, descriptorDefaults),
            setContext: (ctx)=>_attachContext(proxy, ctx, subProxy, descriptorDefaults),
            override: (scope)=>_attachContext(proxy.override(scope), context, subProxy, descriptorDefaults)
        };
        return new Proxy(cache, {
     deleteProperty (target, prop) {
                delete target[prop];
                delete proxy[prop];
                return true;
            },
     get (target, prop, receiver) {
                return _cached(target, prop, ()=>_resolveWithContext(target, prop, receiver));
            },
     getOwnPropertyDescriptor (target, prop) {
                return target._descriptors.allKeys ? Reflect.has(proxy, prop) ? {
                    enumerable: true,
                    configurable: true
                } : undefined : Reflect.getOwnPropertyDescriptor(proxy, prop);
            },
     getPrototypeOf () {
                return Reflect.getPrototypeOf(proxy);
            },
     has (target, prop) {
                return Reflect.has(proxy, prop);
            },
     ownKeys () {
                return Reflect.ownKeys(proxy);
            },
     set (target, prop, value) {
                proxy[prop] = value;
                delete target[prop];
                return true;
            }
        });
    }
     function _descriptors(proxy, defaults = {
        scriptable: true,
        indexable: true
    }) {
        const { _scriptable =defaults.scriptable , _indexable =defaults.indexable , _allKeys =defaults.allKeys  } = proxy;
        return {
            allKeys: _allKeys,
            scriptable: _scriptable,
            indexable: _indexable,
            isScriptable: isFunction(_scriptable) ? _scriptable : ()=>_scriptable,
            isIndexable: isFunction(_indexable) ? _indexable : ()=>_indexable
        };
    }
    const readKey = (prefix, name)=>prefix ? prefix + _capitalize(name) : name;
    const needsSubResolver = (prop, value)=>isObject(value) && prop !== 'adapters' && (Object.getPrototypeOf(value) === null || value.constructor === Object);
    function _cached(target, prop, resolve) {
        if (Object.prototype.hasOwnProperty.call(target, prop)) {
            return target[prop];
        }
        const value = resolve();
        target[prop] = value;
        return value;
    }
    function _resolveWithContext(target, prop, receiver) {
        const { _proxy , _context , _subProxy , _descriptors: descriptors  } = target;
        let value = _proxy[prop];
        if (isFunction(value) && descriptors.isScriptable(prop)) {
            value = _resolveScriptable(prop, value, target, receiver);
        }
        if (isArray(value) && value.length) {
            value = _resolveArray(prop, value, target, descriptors.isIndexable);
        }
        if (needsSubResolver(prop, value)) {
            value = _attachContext(value, _context, _subProxy && _subProxy[prop], descriptors);
        }
        return value;
    }
    function _resolveScriptable(prop, value, target, receiver) {
        const { _proxy , _context , _subProxy , _stack  } = target;
        if (_stack.has(prop)) {
            throw new Error('Recursion detected: ' + Array.from(_stack).join('->') + '->' + prop);
        }
        _stack.add(prop);
        value = value(_context, _subProxy || receiver);
        _stack.delete(prop);
        if (needsSubResolver(prop, value)) {
            value = createSubResolver(_proxy._scopes, _proxy, prop, value);
        }
        return value;
    }
    function _resolveArray(prop, value, target, isIndexable) {
        const { _proxy , _context , _subProxy , _descriptors: descriptors  } = target;
        if (defined(_context.index) && isIndexable(prop)) {
            value = value[_context.index % value.length];
        } else if (isObject(value[0])) {
            const arr = value;
            const scopes = _proxy._scopes.filter((s)=>s !== arr);
            value = [];
            for (const item of arr){
                const resolver = createSubResolver(scopes, _proxy, prop, item);
                value.push(_attachContext(resolver, _context, _subProxy && _subProxy[prop], descriptors));
            }
        }
        return value;
    }
    function resolveFallback(fallback, prop, value) {
        return isFunction(fallback) ? fallback(prop, value) : fallback;
    }
    const getScope = (key, parent)=>key === true ? parent : typeof key === 'string' ? resolveObjectKey(parent, key) : undefined;
    function addScopes(set, parentScopes, key, parentFallback, value) {
        for (const parent of parentScopes){
            const scope = getScope(key, parent);
            if (scope) {
                set.add(scope);
                const fallback = resolveFallback(scope._fallback, key, value);
                if (defined(fallback) && fallback !== key && fallback !== parentFallback) {
                    return fallback;
                }
            } else if (scope === false && defined(parentFallback) && key !== parentFallback) {
                return null;
            }
        }
        return false;
    }
    function createSubResolver(parentScopes, resolver, prop, value) {
        const rootScopes = resolver._rootScopes;
        const fallback = resolveFallback(resolver._fallback, prop, value);
        const allScopes = [
            ...parentScopes,
            ...rootScopes
        ];
        const set = new Set();
        set.add(value);
        let key = addScopesFromKey(set, allScopes, prop, fallback || prop, value);
        if (key === null) {
            return false;
        }
        if (defined(fallback) && fallback !== prop) {
            key = addScopesFromKey(set, allScopes, fallback, key, value);
            if (key === null) {
                return false;
            }
        }
        return _createResolver(Array.from(set), [
            ''
        ], rootScopes, fallback, ()=>subGetTarget(resolver, prop, value));
    }
    function addScopesFromKey(set, allScopes, key, fallback, item) {
        while(key){
            key = addScopes(set, allScopes, key, fallback, item);
        }
        return key;
    }
    function subGetTarget(resolver, prop, value) {
        const parent = resolver._getTarget();
        if (!(prop in parent)) {
            parent[prop] = {};
        }
        const target = parent[prop];
        if (isArray(target) && isObject(value)) {
            return value;
        }
        return target || {};
    }
    function _resolveWithPrefixes(prop, prefixes, scopes, proxy) {
        let value;
        for (const prefix of prefixes){
            value = _resolve(readKey(prefix, prop), scopes);
            if (defined(value)) {
                return needsSubResolver(prop, value) ? createSubResolver(scopes, proxy, prop, value) : value;
            }
        }
    }
    function _resolve(key, scopes) {
        for (const scope of scopes){
            if (!scope) {
                continue;
            }
            const value = scope[key];
            if (defined(value)) {
                return value;
            }
        }
    }
    function getKeysFromAllScopes(target) {
        let keys = target._keys;
        if (!keys) {
            keys = target._keys = resolveKeysFromAllScopes(target._scopes);
        }
        return keys;
    }
    function resolveKeysFromAllScopes(scopes) {
        const set = new Set();
        for (const scope of scopes){
            for (const key of Object.keys(scope).filter((k)=>!k.startsWith('_'))){
                set.add(key);
            }
        }
        return Array.from(set);
    }
    function _parseObjectDataRadialScale(meta, data, start, count) {
        const { iScale  } = meta;
        const { key ='r'  } = this._parsing;
        const parsed = new Array(count);
        let i, ilen, index, item;
        for(i = 0, ilen = count; i < ilen; ++i){
            index = i + start;
            item = data[index];
            parsed[i] = {
                r: iScale.parse(resolveObjectKey(item, key), index)
            };
        }
        return parsed;
    }

    const EPSILON = Number.EPSILON || 1e-14;
    const getPoint = (points, i)=>i < points.length && !points[i].skip && points[i];
    const getValueAxis = (indexAxis)=>indexAxis === 'x' ? 'y' : 'x';
    function splineCurve(firstPoint, middlePoint, afterPoint, t) {
        // Props to Rob Spencer at scaled innovation for his post on splining between points
        // http://scaledinnovation.com/analytics/splines/aboutSplines.html
        // This function must also respect "skipped" points
        const previous = firstPoint.skip ? middlePoint : firstPoint;
        const current = middlePoint;
        const next = afterPoint.skip ? middlePoint : afterPoint;
        const d01 = distanceBetweenPoints(current, previous);
        const d12 = distanceBetweenPoints(next, current);
        let s01 = d01 / (d01 + d12);
        let s12 = d12 / (d01 + d12);
        // If all points are the same, s01 & s02 will be inf
        s01 = isNaN(s01) ? 0 : s01;
        s12 = isNaN(s12) ? 0 : s12;
        const fa = t * s01; // scaling factor for triangle Ta
        const fb = t * s12;
        return {
            previous: {
                x: current.x - fa * (next.x - previous.x),
                y: current.y - fa * (next.y - previous.y)
            },
            next: {
                x: current.x + fb * (next.x - previous.x),
                y: current.y + fb * (next.y - previous.y)
            }
        };
    }
    /**
     * Adjust tangents to ensure monotonic properties
     */ function monotoneAdjust(points, deltaK, mK) {
        const pointsLen = points.length;
        let alphaK, betaK, tauK, squaredMagnitude, pointCurrent;
        let pointAfter = getPoint(points, 0);
        for(let i = 0; i < pointsLen - 1; ++i){
            pointCurrent = pointAfter;
            pointAfter = getPoint(points, i + 1);
            if (!pointCurrent || !pointAfter) {
                continue;
            }
            if (almostEquals(deltaK[i], 0, EPSILON)) {
                mK[i] = mK[i + 1] = 0;
                continue;
            }
            alphaK = mK[i] / deltaK[i];
            betaK = mK[i + 1] / deltaK[i];
            squaredMagnitude = Math.pow(alphaK, 2) + Math.pow(betaK, 2);
            if (squaredMagnitude <= 9) {
                continue;
            }
            tauK = 3 / Math.sqrt(squaredMagnitude);
            mK[i] = alphaK * tauK * deltaK[i];
            mK[i + 1] = betaK * tauK * deltaK[i];
        }
    }
    function monotoneCompute(points, mK, indexAxis = 'x') {
        const valueAxis = getValueAxis(indexAxis);
        const pointsLen = points.length;
        let delta, pointBefore, pointCurrent;
        let pointAfter = getPoint(points, 0);
        for(let i = 0; i < pointsLen; ++i){
            pointBefore = pointCurrent;
            pointCurrent = pointAfter;
            pointAfter = getPoint(points, i + 1);
            if (!pointCurrent) {
                continue;
            }
            const iPixel = pointCurrent[indexAxis];
            const vPixel = pointCurrent[valueAxis];
            if (pointBefore) {
                delta = (iPixel - pointBefore[indexAxis]) / 3;
                pointCurrent[`cp1${indexAxis}`] = iPixel - delta;
                pointCurrent[`cp1${valueAxis}`] = vPixel - delta * mK[i];
            }
            if (pointAfter) {
                delta = (pointAfter[indexAxis] - iPixel) / 3;
                pointCurrent[`cp2${indexAxis}`] = iPixel + delta;
                pointCurrent[`cp2${valueAxis}`] = vPixel + delta * mK[i];
            }
        }
    }
    /**
     * This function calculates Bézier control points in a similar way than |splineCurve|,
     * but preserves monotonicity of the provided data and ensures no local extremums are added
     * between the dataset discrete points due to the interpolation.
     * See : https://en.wikipedia.org/wiki/Monotone_cubic_interpolation
     */ function splineCurveMonotone(points, indexAxis = 'x') {
        const valueAxis = getValueAxis(indexAxis);
        const pointsLen = points.length;
        const deltaK = Array(pointsLen).fill(0);
        const mK = Array(pointsLen);
        // Calculate slopes (deltaK) and initialize tangents (mK)
        let i, pointBefore, pointCurrent;
        let pointAfter = getPoint(points, 0);
        for(i = 0; i < pointsLen; ++i){
            pointBefore = pointCurrent;
            pointCurrent = pointAfter;
            pointAfter = getPoint(points, i + 1);
            if (!pointCurrent) {
                continue;
            }
            if (pointAfter) {
                const slopeDelta = pointAfter[indexAxis] - pointCurrent[indexAxis];
                // In the case of two points that appear at the same x pixel, slopeDeltaX is 0
                deltaK[i] = slopeDelta !== 0 ? (pointAfter[valueAxis] - pointCurrent[valueAxis]) / slopeDelta : 0;
            }
            mK[i] = !pointBefore ? deltaK[i] : !pointAfter ? deltaK[i - 1] : sign(deltaK[i - 1]) !== sign(deltaK[i]) ? 0 : (deltaK[i - 1] + deltaK[i]) / 2;
        }
        monotoneAdjust(points, deltaK, mK);
        monotoneCompute(points, mK, indexAxis);
    }
    function capControlPoint(pt, min, max) {
        return Math.max(Math.min(pt, max), min);
    }
    function capBezierPoints(points, area) {
        let i, ilen, point, inArea, inAreaPrev;
        let inAreaNext = _isPointInArea(points[0], area);
        for(i = 0, ilen = points.length; i < ilen; ++i){
            inAreaPrev = inArea;
            inArea = inAreaNext;
            inAreaNext = i < ilen - 1 && _isPointInArea(points[i + 1], area);
            if (!inArea) {
                continue;
            }
            point = points[i];
            if (inAreaPrev) {
                point.cp1x = capControlPoint(point.cp1x, area.left, area.right);
                point.cp1y = capControlPoint(point.cp1y, area.top, area.bottom);
            }
            if (inAreaNext) {
                point.cp2x = capControlPoint(point.cp2x, area.left, area.right);
                point.cp2y = capControlPoint(point.cp2y, area.top, area.bottom);
            }
        }
    }
    /**
     * @private
     */ function _updateBezierControlPoints(points, options, area, loop, indexAxis) {
        let i, ilen, point, controlPoints;
        // Only consider points that are drawn in case the spanGaps option is used
        if (options.spanGaps) {
            points = points.filter((pt)=>!pt.skip);
        }
        if (options.cubicInterpolationMode === 'monotone') {
            splineCurveMonotone(points, indexAxis);
        } else {
            let prev = loop ? points[points.length - 1] : points[0];
            for(i = 0, ilen = points.length; i < ilen; ++i){
                point = points[i];
                controlPoints = splineCurve(prev, point, points[Math.min(i + 1, ilen - (loop ? 0 : 1)) % ilen], options.tension);
                point.cp1x = controlPoints.previous.x;
                point.cp1y = controlPoints.previous.y;
                point.cp2x = controlPoints.next.x;
                point.cp2y = controlPoints.next.y;
                prev = point;
            }
        }
        if (options.capBezierPoints) {
            capBezierPoints(points, area);
        }
    }

    /**
     * Note: typedefs are auto-exported, so use a made-up `dom` namespace where
     * necessary to avoid duplicates with `export * from './helpers`; see
     * https://github.com/microsoft/TypeScript/issues/46011
     * @typedef { import('../core/core.controller.js').default } dom.Chart
     * @typedef { import('../../types').ChartEvent } ChartEvent
     */ /**
     * @private
     */ function _isDomSupported() {
        return typeof window !== 'undefined' && typeof document !== 'undefined';
    }
    /**
     * @private
     */ function _getParentNode(domNode) {
        let parent = domNode.parentNode;
        if (parent && parent.toString() === '[object ShadowRoot]') {
            parent = parent.host;
        }
        return parent;
    }
    /**
     * convert max-width/max-height values that may be percentages into a number
     * @private
     */ function parseMaxStyle(styleValue, node, parentProperty) {
        let valueInPixels;
        if (typeof styleValue === 'string') {
            valueInPixels = parseInt(styleValue, 10);
            if (styleValue.indexOf('%') !== -1) {
                // percentage * size in dimension
                valueInPixels = valueInPixels / 100 * node.parentNode[parentProperty];
            }
        } else {
            valueInPixels = styleValue;
        }
        return valueInPixels;
    }
    const getComputedStyle$1 = (element)=>element.ownerDocument.defaultView.getComputedStyle(element, null);
    function getStyle(el, property) {
        return getComputedStyle$1(el).getPropertyValue(property);
    }
    const positions = [
        'top',
        'right',
        'bottom',
        'left'
    ];
    function getPositionedStyle(styles, style, suffix) {
        const result = {};
        suffix = suffix ? '-' + suffix : '';
        for(let i = 0; i < 4; i++){
            const pos = positions[i];
            result[pos] = parseFloat(styles[style + '-' + pos + suffix]) || 0;
        }
        result.width = result.left + result.right;
        result.height = result.top + result.bottom;
        return result;
    }
    const useOffsetPos = (x, y, target)=>(x > 0 || y > 0) && (!target || !target.shadowRoot);
    /**
     * @param e
     * @param canvas
     * @returns Canvas position
     */ function getCanvasPosition(e, canvas) {
        const touches = e.touches;
        const source = touches && touches.length ? touches[0] : e;
        const { offsetX , offsetY  } = source;
        let box = false;
        let x, y;
        if (useOffsetPos(offsetX, offsetY, e.target)) {
            x = offsetX;
            y = offsetY;
        } else {
            const rect = canvas.getBoundingClientRect();
            x = source.clientX - rect.left;
            y = source.clientY - rect.top;
            box = true;
        }
        return {
            x,
            y,
            box
        };
    }
    /**
     * Gets an event's x, y coordinates, relative to the chart area
     * @param event
     * @param chart
     * @returns x and y coordinates of the event
     */ function getRelativePosition(event, chart) {
        if ('native' in event) {
            return event;
        }
        const { canvas , currentDevicePixelRatio  } = chart;
        const style = getComputedStyle$1(canvas);
        const borderBox = style.boxSizing === 'border-box';
        const paddings = getPositionedStyle(style, 'padding');
        const borders = getPositionedStyle(style, 'border', 'width');
        const { x , y , box  } = getCanvasPosition(event, canvas);
        const xOffset = paddings.left + (box && borders.left);
        const yOffset = paddings.top + (box && borders.top);
        let { width , height  } = chart;
        if (borderBox) {
            width -= paddings.width + borders.width;
            height -= paddings.height + borders.height;
        }
        return {
            x: Math.round((x - xOffset) / width * canvas.width / currentDevicePixelRatio),
            y: Math.round((y - yOffset) / height * canvas.height / currentDevicePixelRatio)
        };
    }
    function getContainerSize(canvas, width, height) {
        let maxWidth, maxHeight;
        if (width === undefined || height === undefined) {
            const container = _getParentNode(canvas);
            if (!container) {
                width = canvas.clientWidth;
                height = canvas.clientHeight;
            } else {
                const rect = container.getBoundingClientRect(); // this is the border box of the container
                const containerStyle = getComputedStyle$1(container);
                const containerBorder = getPositionedStyle(containerStyle, 'border', 'width');
                const containerPadding = getPositionedStyle(containerStyle, 'padding');
                width = rect.width - containerPadding.width - containerBorder.width;
                height = rect.height - containerPadding.height - containerBorder.height;
                maxWidth = parseMaxStyle(containerStyle.maxWidth, container, 'clientWidth');
                maxHeight = parseMaxStyle(containerStyle.maxHeight, container, 'clientHeight');
            }
        }
        return {
            width,
            height,
            maxWidth: maxWidth || INFINITY,
            maxHeight: maxHeight || INFINITY
        };
    }
    const round1 = (v)=>Math.round(v * 10) / 10;
    // eslint-disable-next-line complexity
    function getMaximumSize(canvas, bbWidth, bbHeight, aspectRatio) {
        const style = getComputedStyle$1(canvas);
        const margins = getPositionedStyle(style, 'margin');
        const maxWidth = parseMaxStyle(style.maxWidth, canvas, 'clientWidth') || INFINITY;
        const maxHeight = parseMaxStyle(style.maxHeight, canvas, 'clientHeight') || INFINITY;
        const containerSize = getContainerSize(canvas, bbWidth, bbHeight);
        let { width , height  } = containerSize;
        if (style.boxSizing === 'content-box') {
            const borders = getPositionedStyle(style, 'border', 'width');
            const paddings = getPositionedStyle(style, 'padding');
            width -= paddings.width + borders.width;
            height -= paddings.height + borders.height;
        }
        width = Math.max(0, width - margins.width);
        height = Math.max(0, aspectRatio ? width / aspectRatio : height - margins.height);
        width = round1(Math.min(width, maxWidth, containerSize.maxWidth));
        height = round1(Math.min(height, maxHeight, containerSize.maxHeight));
        if (width && !height) {
            // https://github.com/chartjs/Chart.js/issues/4659
            // If the canvas has width, but no height, default to aspectRatio of 2 (canvas default)
            height = round1(width / 2);
        }
        const maintainHeight = bbWidth !== undefined || bbHeight !== undefined;
        if (maintainHeight && aspectRatio && containerSize.height && height > containerSize.height) {
            height = containerSize.height;
            width = round1(Math.floor(height * aspectRatio));
        }
        return {
            width,
            height
        };
    }
    /**
     * @param chart
     * @param forceRatio
     * @param forceStyle
     * @returns True if the canvas context size or transformation has changed.
     */ function retinaScale(chart, forceRatio, forceStyle) {
        const pixelRatio = forceRatio || 1;
        const deviceHeight = Math.floor(chart.height * pixelRatio);
        const deviceWidth = Math.floor(chart.width * pixelRatio);
        chart.height = Math.floor(chart.height);
        chart.width = Math.floor(chart.width);
        const canvas = chart.canvas;
        // If no style has been set on the canvas, the render size is used as display size,
        // making the chart visually bigger, so let's enforce it to the "correct" values.
        // See https://github.com/chartjs/Chart.js/issues/3575
        if (canvas.style && (forceStyle || !canvas.style.height && !canvas.style.width)) {
            canvas.style.height = `${chart.height}px`;
            canvas.style.width = `${chart.width}px`;
        }
        if (chart.currentDevicePixelRatio !== pixelRatio || canvas.height !== deviceHeight || canvas.width !== deviceWidth) {
            chart.currentDevicePixelRatio = pixelRatio;
            canvas.height = deviceHeight;
            canvas.width = deviceWidth;
            chart.ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
            return true;
        }
        return false;
    }
    /**
     * Detects support for options object argument in addEventListener.
     * https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener#Safely_detecting_option_support
     * @private
     */ const supportsEventListenerOptions = function() {
        let passiveSupported = false;
        try {
            const options = {
                get passive () {
                    passiveSupported = true;
                    return false;
                }
            };
            window.addEventListener('test', null, options);
            window.removeEventListener('test', null, options);
        } catch (e) {
        // continue regardless of error
        }
        return passiveSupported;
    }();
    /**
     * The "used" size is the final value of a dimension property after all calculations have
     * been performed. This method uses the computed style of `element` but returns undefined
     * if the computed style is not expressed in pixels. That can happen in some cases where
     * `element` has a size relative to its parent and this last one is not yet displayed,
     * for example because of `display: none` on a parent node.
     * @see https://developer.mozilla.org/en-US/docs/Web/CSS/used_value
     * @returns Size in pixels or undefined if unknown.
     */ function readUsedSize(element, property) {
        const value = getStyle(element, property);
        const matches = value && value.match(/^(\d+)(\.\d+)?px$/);
        return matches ? +matches[1] : undefined;
    }

    /**
     * @private
     */ function _pointInLine(p1, p2, t, mode) {
        return {
            x: p1.x + t * (p2.x - p1.x),
            y: p1.y + t * (p2.y - p1.y)
        };
    }
    /**
     * @private
     */ function _steppedInterpolation(p1, p2, t, mode) {
        return {
            x: p1.x + t * (p2.x - p1.x),
            y: mode === 'middle' ? t < 0.5 ? p1.y : p2.y : mode === 'after' ? t < 1 ? p1.y : p2.y : t > 0 ? p2.y : p1.y
        };
    }
    /**
     * @private
     */ function _bezierInterpolation(p1, p2, t, mode) {
        const cp1 = {
            x: p1.cp2x,
            y: p1.cp2y
        };
        const cp2 = {
            x: p2.cp1x,
            y: p2.cp1y
        };
        const a = _pointInLine(p1, cp1, t);
        const b = _pointInLine(cp1, cp2, t);
        const c = _pointInLine(cp2, p2, t);
        const d = _pointInLine(a, b, t);
        const e = _pointInLine(b, c, t);
        return _pointInLine(d, e, t);
    }

    const getRightToLeftAdapter = function(rectX, width) {
        return {
            x (x) {
                return rectX + rectX + width - x;
            },
            setWidth (w) {
                width = w;
            },
            textAlign (align) {
                if (align === 'center') {
                    return align;
                }
                return align === 'right' ? 'left' : 'right';
            },
            xPlus (x, value) {
                return x - value;
            },
            leftForLtr (x, itemWidth) {
                return x - itemWidth;
            }
        };
    };
    const getLeftToRightAdapter = function() {
        return {
            x (x) {
                return x;
            },
            setWidth (w) {},
            textAlign (align) {
                return align;
            },
            xPlus (x, value) {
                return x + value;
            },
            leftForLtr (x, _itemWidth) {
                return x;
            }
        };
    };
    function getRtlAdapter(rtl, rectX, width) {
        return rtl ? getRightToLeftAdapter(rectX, width) : getLeftToRightAdapter();
    }
    function overrideTextDirection(ctx, direction) {
        let style, original;
        if (direction === 'ltr' || direction === 'rtl') {
            style = ctx.canvas.style;
            original = [
                style.getPropertyValue('direction'),
                style.getPropertyPriority('direction')
            ];
            style.setProperty('direction', direction, 'important');
            ctx.prevTextDirection = original;
        }
    }
    function restoreTextDirection(ctx, original) {
        if (original !== undefined) {
            delete ctx.prevTextDirection;
            ctx.canvas.style.setProperty('direction', original[0], original[1]);
        }
    }

    function propertyFn(property) {
        if (property === 'angle') {
            return {
                between: _angleBetween,
                compare: _angleDiff,
                normalize: _normalizeAngle
            };
        }
        return {
            between: _isBetween,
            compare: (a, b)=>a - b,
            normalize: (x)=>x
        };
    }
    function normalizeSegment({ start , end , count , loop , style  }) {
        return {
            start: start % count,
            end: end % count,
            loop: loop && (end - start + 1) % count === 0,
            style
        };
    }
    function getSegment(segment, points, bounds) {
        const { property , start: startBound , end: endBound  } = bounds;
        const { between , normalize  } = propertyFn(property);
        const count = points.length;
        let { start , end , loop  } = segment;
        let i, ilen;
        if (loop) {
            start += count;
            end += count;
            for(i = 0, ilen = count; i < ilen; ++i){
                if (!between(normalize(points[start % count][property]), startBound, endBound)) {
                    break;
                }
                start--;
                end--;
            }
            start %= count;
            end %= count;
        }
        if (end < start) {
            end += count;
        }
        return {
            start,
            end,
            loop,
            style: segment.style
        };
    }
     function _boundSegment(segment, points, bounds) {
        if (!bounds) {
            return [
                segment
            ];
        }
        const { property , start: startBound , end: endBound  } = bounds;
        const count = points.length;
        const { compare , between , normalize  } = propertyFn(property);
        const { start , end , loop , style  } = getSegment(segment, points, bounds);
        const result = [];
        let inside = false;
        let subStart = null;
        let value, point, prevValue;
        const startIsBefore = ()=>between(startBound, prevValue, value) && compare(startBound, prevValue) !== 0;
        const endIsBefore = ()=>compare(endBound, value) === 0 || between(endBound, prevValue, value);
        const shouldStart = ()=>inside || startIsBefore();
        const shouldStop = ()=>!inside || endIsBefore();
        for(let i = start, prev = start; i <= end; ++i){
            point = points[i % count];
            if (point.skip) {
                continue;
            }
            value = normalize(point[property]);
            if (value === prevValue) {
                continue;
            }
            inside = between(value, startBound, endBound);
            if (subStart === null && shouldStart()) {
                subStart = compare(value, startBound) === 0 ? i : prev;
            }
            if (subStart !== null && shouldStop()) {
                result.push(normalizeSegment({
                    start: subStart,
                    end: i,
                    loop,
                    count,
                    style
                }));
                subStart = null;
            }
            prev = i;
            prevValue = value;
        }
        if (subStart !== null) {
            result.push(normalizeSegment({
                start: subStart,
                end,
                loop,
                count,
                style
            }));
        }
        return result;
    }
     function _boundSegments(line, bounds) {
        const result = [];
        const segments = line.segments;
        for(let i = 0; i < segments.length; i++){
            const sub = _boundSegment(segments[i], line.points, bounds);
            if (sub.length) {
                result.push(...sub);
            }
        }
        return result;
    }
     function findStartAndEnd(points, count, loop, spanGaps) {
        let start = 0;
        let end = count - 1;
        if (loop && !spanGaps) {
            while(start < count && !points[start].skip){
                start++;
            }
        }
        while(start < count && points[start].skip){
            start++;
        }
        start %= count;
        if (loop) {
            end += start;
        }
        while(end > start && points[end % count].skip){
            end--;
        }
        end %= count;
        return {
            start,
            end
        };
    }
     function solidSegments(points, start, max, loop) {
        const count = points.length;
        const result = [];
        let last = start;
        let prev = points[start];
        let end;
        for(end = start + 1; end <= max; ++end){
            const cur = points[end % count];
            if (cur.skip || cur.stop) {
                if (!prev.skip) {
                    loop = false;
                    result.push({
                        start: start % count,
                        end: (end - 1) % count,
                        loop
                    });
                    start = last = cur.stop ? end : null;
                }
            } else {
                last = end;
                if (prev.skip) {
                    start = end;
                }
            }
            prev = cur;
        }
        if (last !== null) {
            result.push({
                start: start % count,
                end: last % count,
                loop
            });
        }
        return result;
    }
     function _computeSegments(line, segmentOptions) {
        const points = line.points;
        const spanGaps = line.options.spanGaps;
        const count = points.length;
        if (!count) {
            return [];
        }
        const loop = !!line._loop;
        const { start , end  } = findStartAndEnd(points, count, loop, spanGaps);
        if (spanGaps === true) {
            return splitByStyles(line, [
                {
                    start,
                    end,
                    loop
                }
            ], points, segmentOptions);
        }
        const max = end < start ? end + count : end;
        const completeLoop = !!line._fullLoop && start === 0 && end === count - 1;
        return splitByStyles(line, solidSegments(points, start, max, completeLoop), points, segmentOptions);
    }
     function splitByStyles(line, segments, points, segmentOptions) {
        if (!segmentOptions || !segmentOptions.setContext || !points) {
            return segments;
        }
        return doSplitByStyles(line, segments, points, segmentOptions);
    }
     function doSplitByStyles(line, segments, points, segmentOptions) {
        const chartContext = line._chart.getContext();
        const baseStyle = readStyle(line.options);
        const { _datasetIndex: datasetIndex , options: { spanGaps  }  } = line;
        const count = points.length;
        const result = [];
        let prevStyle = baseStyle;
        let start = segments[0].start;
        let i = start;
        function addStyle(s, e, l, st) {
            const dir = spanGaps ? -1 : 1;
            if (s === e) {
                return;
            }
            s += count;
            while(points[s % count].skip){
                s -= dir;
            }
            while(points[e % count].skip){
                e += dir;
            }
            if (s % count !== e % count) {
                result.push({
                    start: s % count,
                    end: e % count,
                    loop: l,
                    style: st
                });
                prevStyle = st;
                start = e % count;
            }
        }
        for (const segment of segments){
            start = spanGaps ? start : segment.start;
            let prev = points[start % count];
            let style;
            for(i = start + 1; i <= segment.end; i++){
                const pt = points[i % count];
                style = readStyle(segmentOptions.setContext(createContext(chartContext, {
                    type: 'segment',
                    p0: prev,
                    p1: pt,
                    p0DataIndex: (i - 1) % count,
                    p1DataIndex: i % count,
                    datasetIndex
                })));
                if (styleChanged(style, prevStyle)) {
                    addStyle(start, i - 1, segment.loop, prevStyle);
                }
                prev = pt;
                prevStyle = style;
            }
            if (start < i - 1) {
                addStyle(start, i - 1, segment.loop, prevStyle);
            }
        }
        return result;
    }
    function readStyle(options) {
        return {
            backgroundColor: options.backgroundColor,
            borderCapStyle: options.borderCapStyle,
            borderDash: options.borderDash,
            borderDashOffset: options.borderDashOffset,
            borderJoinStyle: options.borderJoinStyle,
            borderWidth: options.borderWidth,
            borderColor: options.borderColor
        };
    }
    function styleChanged(style, prevStyle) {
        return prevStyle && JSON.stringify(style) !== JSON.stringify(prevStyle);
    }

    /*!
     * Chart.js v4.1.1
     * https://www.chartjs.org
     * (c) 2022 Chart.js Contributors
     * Released under the MIT License
     */

    class Animator {
        constructor(){
            this._request = null;
            this._charts = new Map();
            this._running = false;
            this._lastDate = undefined;
        }
     _notify(chart, anims, date, type) {
            const callbacks = anims.listeners[type];
            const numSteps = anims.duration;
            callbacks.forEach((fn)=>fn({
                    chart,
                    initial: anims.initial,
                    numSteps,
                    currentStep: Math.min(date - anims.start, numSteps)
                }));
        }
     _refresh() {
            if (this._request) {
                return;
            }
            this._running = true;
            this._request = requestAnimFrame.call(window, ()=>{
                this._update();
                this._request = null;
                if (this._running) {
                    this._refresh();
                }
            });
        }
     _update(date = Date.now()) {
            let remaining = 0;
            this._charts.forEach((anims, chart)=>{
                if (!anims.running || !anims.items.length) {
                    return;
                }
                const items = anims.items;
                let i = items.length - 1;
                let draw = false;
                let item;
                for(; i >= 0; --i){
                    item = items[i];
                    if (item._active) {
                        if (item._total > anims.duration) {
                            anims.duration = item._total;
                        }
                        item.tick(date);
                        draw = true;
                    } else {
                        items[i] = items[items.length - 1];
                        items.pop();
                    }
                }
                if (draw) {
                    chart.draw();
                    this._notify(chart, anims, date, 'progress');
                }
                if (!items.length) {
                    anims.running = false;
                    this._notify(chart, anims, date, 'complete');
                    anims.initial = false;
                }
                remaining += items.length;
            });
            this._lastDate = date;
            if (remaining === 0) {
                this._running = false;
            }
        }
     _getAnims(chart) {
            const charts = this._charts;
            let anims = charts.get(chart);
            if (!anims) {
                anims = {
                    running: false,
                    initial: true,
                    items: [],
                    listeners: {
                        complete: [],
                        progress: []
                    }
                };
                charts.set(chart, anims);
            }
            return anims;
        }
     listen(chart, event, cb) {
            this._getAnims(chart).listeners[event].push(cb);
        }
     add(chart, items) {
            if (!items || !items.length) {
                return;
            }
            this._getAnims(chart).items.push(...items);
        }
     has(chart) {
            return this._getAnims(chart).items.length > 0;
        }
     start(chart) {
            const anims = this._charts.get(chart);
            if (!anims) {
                return;
            }
            anims.running = true;
            anims.start = Date.now();
            anims.duration = anims.items.reduce((acc, cur)=>Math.max(acc, cur._duration), 0);
            this._refresh();
        }
        running(chart) {
            if (!this._running) {
                return false;
            }
            const anims = this._charts.get(chart);
            if (!anims || !anims.running || !anims.items.length) {
                return false;
            }
            return true;
        }
     stop(chart) {
            const anims = this._charts.get(chart);
            if (!anims || !anims.items.length) {
                return;
            }
            const items = anims.items;
            let i = items.length - 1;
            for(; i >= 0; --i){
                items[i].cancel();
            }
            anims.items = [];
            this._notify(chart, anims, Date.now(), 'complete');
        }
     remove(chart) {
            return this._charts.delete(chart);
        }
    }
    var animator = /* #__PURE__ */ new Animator();

    const transparent = 'transparent';
    const interpolators = {
        boolean (from, to, factor) {
            return factor > 0.5 ? to : from;
        },
     color (from, to, factor) {
            const c0 = color(from || transparent);
            const c1 = c0.valid && color(to || transparent);
            return c1 && c1.valid ? c1.mix(c0, factor).hexString() : to;
        },
        number (from, to, factor) {
            return from + (to - from) * factor;
        }
    };
    class Animation {
        constructor(cfg, target, prop, to){
            const currentValue = target[prop];
            to = resolve([
                cfg.to,
                to,
                currentValue,
                cfg.from
            ]);
            const from = resolve([
                cfg.from,
                currentValue,
                to
            ]);
            this._active = true;
            this._fn = cfg.fn || interpolators[cfg.type || typeof from];
            this._easing = effects[cfg.easing] || effects.linear;
            this._start = Math.floor(Date.now() + (cfg.delay || 0));
            this._duration = this._total = Math.floor(cfg.duration);
            this._loop = !!cfg.loop;
            this._target = target;
            this._prop = prop;
            this._from = from;
            this._to = to;
            this._promises = undefined;
        }
        active() {
            return this._active;
        }
        update(cfg, to, date) {
            if (this._active) {
                this._notify(false);
                const currentValue = this._target[this._prop];
                const elapsed = date - this._start;
                const remain = this._duration - elapsed;
                this._start = date;
                this._duration = Math.floor(Math.max(remain, cfg.duration));
                this._total += elapsed;
                this._loop = !!cfg.loop;
                this._to = resolve([
                    cfg.to,
                    to,
                    currentValue,
                    cfg.from
                ]);
                this._from = resolve([
                    cfg.from,
                    currentValue,
                    to
                ]);
            }
        }
        cancel() {
            if (this._active) {
                this.tick(Date.now());
                this._active = false;
                this._notify(false);
            }
        }
        tick(date) {
            const elapsed = date - this._start;
            const duration = this._duration;
            const prop = this._prop;
            const from = this._from;
            const loop = this._loop;
            const to = this._to;
            let factor;
            this._active = from !== to && (loop || elapsed < duration);
            if (!this._active) {
                this._target[prop] = to;
                this._notify(true);
                return;
            }
            if (elapsed < 0) {
                this._target[prop] = from;
                return;
            }
            factor = elapsed / duration % 2;
            factor = loop && factor > 1 ? 2 - factor : factor;
            factor = this._easing(Math.min(1, Math.max(0, factor)));
            this._target[prop] = this._fn(from, to, factor);
        }
        wait() {
            const promises = this._promises || (this._promises = []);
            return new Promise((res, rej)=>{
                promises.push({
                    res,
                    rej
                });
            });
        }
        _notify(resolved) {
            const method = resolved ? 'res' : 'rej';
            const promises = this._promises || [];
            for(let i = 0; i < promises.length; i++){
                promises[i][method]();
            }
        }
    }

    class Animations {
        constructor(chart, config){
            this._chart = chart;
            this._properties = new Map();
            this.configure(config);
        }
        configure(config) {
            if (!isObject(config)) {
                return;
            }
            const animationOptions = Object.keys(defaults.animation);
            const animatedProps = this._properties;
            Object.getOwnPropertyNames(config).forEach((key)=>{
                const cfg = config[key];
                if (!isObject(cfg)) {
                    return;
                }
                const resolved = {};
                for (const option of animationOptions){
                    resolved[option] = cfg[option];
                }
                (isArray(cfg.properties) && cfg.properties || [
                    key
                ]).forEach((prop)=>{
                    if (prop === key || !animatedProps.has(prop)) {
                        animatedProps.set(prop, resolved);
                    }
                });
            });
        }
     _animateOptions(target, values) {
            const newOptions = values.options;
            const options = resolveTargetOptions(target, newOptions);
            if (!options) {
                return [];
            }
            const animations = this._createAnimations(options, newOptions);
            if (newOptions.$shared) {
                awaitAll(target.options.$animations, newOptions).then(()=>{
                    target.options = newOptions;
                }, ()=>{
                });
            }
            return animations;
        }
     _createAnimations(target, values) {
            const animatedProps = this._properties;
            const animations = [];
            const running = target.$animations || (target.$animations = {});
            const props = Object.keys(values);
            const date = Date.now();
            let i;
            for(i = props.length - 1; i >= 0; --i){
                const prop = props[i];
                if (prop.charAt(0) === '$') {
                    continue;
                }
                if (prop === 'options') {
                    animations.push(...this._animateOptions(target, values));
                    continue;
                }
                const value = values[prop];
                let animation = running[prop];
                const cfg = animatedProps.get(prop);
                if (animation) {
                    if (cfg && animation.active()) {
                        animation.update(cfg, value, date);
                        continue;
                    } else {
                        animation.cancel();
                    }
                }
                if (!cfg || !cfg.duration) {
                    target[prop] = value;
                    continue;
                }
                running[prop] = animation = new Animation(cfg, target, prop, value);
                animations.push(animation);
            }
            return animations;
        }
     update(target, values) {
            if (this._properties.size === 0) {
                Object.assign(target, values);
                return;
            }
            const animations = this._createAnimations(target, values);
            if (animations.length) {
                animator.add(this._chart, animations);
                return true;
            }
        }
    }
    function awaitAll(animations, properties) {
        const running = [];
        const keys = Object.keys(properties);
        for(let i = 0; i < keys.length; i++){
            const anim = animations[keys[i]];
            if (anim && anim.active()) {
                running.push(anim.wait());
            }
        }
        return Promise.all(running);
    }
    function resolveTargetOptions(target, newOptions) {
        if (!newOptions) {
            return;
        }
        let options = target.options;
        if (!options) {
            target.options = newOptions;
            return;
        }
        if (options.$shared) {
            target.options = options = Object.assign({}, options, {
                $shared: false,
                $animations: {}
            });
        }
        return options;
    }

    function scaleClip(scale, allowedOverflow) {
        const opts = scale && scale.options || {};
        const reverse = opts.reverse;
        const min = opts.min === undefined ? allowedOverflow : 0;
        const max = opts.max === undefined ? allowedOverflow : 0;
        return {
            start: reverse ? max : min,
            end: reverse ? min : max
        };
    }
    function defaultClip(xScale, yScale, allowedOverflow) {
        if (allowedOverflow === false) {
            return false;
        }
        const x = scaleClip(xScale, allowedOverflow);
        const y = scaleClip(yScale, allowedOverflow);
        return {
            top: y.end,
            right: x.end,
            bottom: y.start,
            left: x.start
        };
    }
    function toClip(value) {
        let t, r, b, l;
        if (isObject(value)) {
            t = value.top;
            r = value.right;
            b = value.bottom;
            l = value.left;
        } else {
            t = r = b = l = value;
        }
        return {
            top: t,
            right: r,
            bottom: b,
            left: l,
            disabled: value === false
        };
    }
    function getSortedDatasetIndices(chart, filterVisible) {
        const keys = [];
        const metasets = chart._getSortedDatasetMetas(filterVisible);
        let i, ilen;
        for(i = 0, ilen = metasets.length; i < ilen; ++i){
            keys.push(metasets[i].index);
        }
        return keys;
    }
    function applyStack(stack, value, dsIndex, options = {}) {
        const keys = stack.keys;
        const singleMode = options.mode === 'single';
        let i, ilen, datasetIndex, otherValue;
        if (value === null) {
            return;
        }
        for(i = 0, ilen = keys.length; i < ilen; ++i){
            datasetIndex = +keys[i];
            if (datasetIndex === dsIndex) {
                if (options.all) {
                    continue;
                }
                break;
            }
            otherValue = stack.values[datasetIndex];
            if (isNumberFinite(otherValue) && (singleMode || value === 0 || sign(value) === sign(otherValue))) {
                value += otherValue;
            }
        }
        return value;
    }
    function convertObjectDataToArray(data) {
        const keys = Object.keys(data);
        const adata = new Array(keys.length);
        let i, ilen, key;
        for(i = 0, ilen = keys.length; i < ilen; ++i){
            key = keys[i];
            adata[i] = {
                x: key,
                y: data[key]
            };
        }
        return adata;
    }
    function isStacked(scale, meta) {
        const stacked = scale && scale.options.stacked;
        return stacked || stacked === undefined && meta.stack !== undefined;
    }
    function getStackKey(indexScale, valueScale, meta) {
        return `${indexScale.id}.${valueScale.id}.${meta.stack || meta.type}`;
    }
    function getUserBounds(scale) {
        const { min , max , minDefined , maxDefined  } = scale.getUserBounds();
        return {
            min: minDefined ? min : Number.NEGATIVE_INFINITY,
            max: maxDefined ? max : Number.POSITIVE_INFINITY
        };
    }
    function getOrCreateStack(stacks, stackKey, indexValue) {
        const subStack = stacks[stackKey] || (stacks[stackKey] = {});
        return subStack[indexValue] || (subStack[indexValue] = {});
    }
    function getLastIndexInStack(stack, vScale, positive, type) {
        for (const meta of vScale.getMatchingVisibleMetas(type).reverse()){
            const value = stack[meta.index];
            if (positive && value > 0 || !positive && value < 0) {
                return meta.index;
            }
        }
        return null;
    }
    function updateStacks(controller, parsed) {
        const { chart , _cachedMeta: meta  } = controller;
        const stacks = chart._stacks || (chart._stacks = {});
        const { iScale , vScale , index: datasetIndex  } = meta;
        const iAxis = iScale.axis;
        const vAxis = vScale.axis;
        const key = getStackKey(iScale, vScale, meta);
        const ilen = parsed.length;
        let stack;
        for(let i = 0; i < ilen; ++i){
            const item = parsed[i];
            const { [iAxis]: index , [vAxis]: value  } = item;
            const itemStacks = item._stacks || (item._stacks = {});
            stack = itemStacks[vAxis] = getOrCreateStack(stacks, key, index);
            stack[datasetIndex] = value;
            stack._top = getLastIndexInStack(stack, vScale, true, meta.type);
            stack._bottom = getLastIndexInStack(stack, vScale, false, meta.type);
            const visualValues = stack._visualValues || (stack._visualValues = {});
            visualValues[datasetIndex] = value;
        }
    }
    function getFirstScaleId(chart, axis) {
        const scales = chart.scales;
        return Object.keys(scales).filter((key)=>scales[key].axis === axis).shift();
    }
    function createDatasetContext(parent, index) {
        return createContext(parent, {
            active: false,
            dataset: undefined,
            datasetIndex: index,
            index,
            mode: 'default',
            type: 'dataset'
        });
    }
    function createDataContext(parent, index, element) {
        return createContext(parent, {
            active: false,
            dataIndex: index,
            parsed: undefined,
            raw: undefined,
            element,
            index,
            mode: 'default',
            type: 'data'
        });
    }
    function clearStacks(meta, items) {
        const datasetIndex = meta.controller.index;
        const axis = meta.vScale && meta.vScale.axis;
        if (!axis) {
            return;
        }
        items = items || meta._parsed;
        for (const parsed of items){
            const stacks = parsed._stacks;
            if (!stacks || stacks[axis] === undefined || stacks[axis][datasetIndex] === undefined) {
                return;
            }
            delete stacks[axis][datasetIndex];
            if (stacks[axis]._visualValues !== undefined && stacks[axis]._visualValues[datasetIndex] !== undefined) {
                delete stacks[axis]._visualValues[datasetIndex];
            }
        }
    }
    const isDirectUpdateMode = (mode)=>mode === 'reset' || mode === 'none';
    const cloneIfNotShared = (cached, shared)=>shared ? cached : Object.assign({}, cached);
    const createStack = (canStack, meta, chart)=>canStack && !meta.hidden && meta._stacked && {
            keys: getSortedDatasetIndices(chart, true),
            values: null
        };
    class DatasetController {
     static defaults = {};
     static datasetElementType = null;
     static dataElementType = null;
     constructor(chart, datasetIndex){
            this.chart = chart;
            this._ctx = chart.ctx;
            this.index = datasetIndex;
            this._cachedDataOpts = {};
            this._cachedMeta = this.getMeta();
            this._type = this._cachedMeta.type;
            this.options = undefined;
             this._parsing = false;
            this._data = undefined;
            this._objectData = undefined;
            this._sharedOptions = undefined;
            this._drawStart = undefined;
            this._drawCount = undefined;
            this.enableOptionSharing = false;
            this.supportsDecimation = false;
            this.$context = undefined;
            this._syncList = [];
            this.datasetElementType = new.target.datasetElementType;
            this.dataElementType = new.target.dataElementType;
            this.initialize();
        }
        initialize() {
            const meta = this._cachedMeta;
            this.configure();
            this.linkScales();
            meta._stacked = isStacked(meta.vScale, meta);
            this.addElements();
            if (this.options.fill && !this.chart.isPluginEnabled('filler')) {
                console.warn("Tried to use the 'fill' option without the 'Filler' plugin enabled. Please import and register the 'Filler' plugin and make sure it is not disabled in the options");
            }
        }
        updateIndex(datasetIndex) {
            if (this.index !== datasetIndex) {
                clearStacks(this._cachedMeta);
            }
            this.index = datasetIndex;
        }
        linkScales() {
            const chart = this.chart;
            const meta = this._cachedMeta;
            const dataset = this.getDataset();
            const chooseId = (axis, x, y, r)=>axis === 'x' ? x : axis === 'r' ? r : y;
            const xid = meta.xAxisID = valueOrDefault(dataset.xAxisID, getFirstScaleId(chart, 'x'));
            const yid = meta.yAxisID = valueOrDefault(dataset.yAxisID, getFirstScaleId(chart, 'y'));
            const rid = meta.rAxisID = valueOrDefault(dataset.rAxisID, getFirstScaleId(chart, 'r'));
            const indexAxis = meta.indexAxis;
            const iid = meta.iAxisID = chooseId(indexAxis, xid, yid, rid);
            const vid = meta.vAxisID = chooseId(indexAxis, yid, xid, rid);
            meta.xScale = this.getScaleForId(xid);
            meta.yScale = this.getScaleForId(yid);
            meta.rScale = this.getScaleForId(rid);
            meta.iScale = this.getScaleForId(iid);
            meta.vScale = this.getScaleForId(vid);
        }
        getDataset() {
            return this.chart.data.datasets[this.index];
        }
        getMeta() {
            return this.chart.getDatasetMeta(this.index);
        }
     getScaleForId(scaleID) {
            return this.chart.scales[scaleID];
        }
     _getOtherScale(scale) {
            const meta = this._cachedMeta;
            return scale === meta.iScale ? meta.vScale : meta.iScale;
        }
        reset() {
            this._update('reset');
        }
     _destroy() {
            const meta = this._cachedMeta;
            if (this._data) {
                unlistenArrayEvents(this._data, this);
            }
            if (meta._stacked) {
                clearStacks(meta);
            }
        }
     _dataCheck() {
            const dataset = this.getDataset();
            const data = dataset.data || (dataset.data = []);
            const _data = this._data;
            if (isObject(data)) {
                this._data = convertObjectDataToArray(data);
            } else if (_data !== data) {
                if (_data) {
                    unlistenArrayEvents(_data, this);
                    const meta = this._cachedMeta;
                    clearStacks(meta);
                    meta._parsed = [];
                }
                if (data && Object.isExtensible(data)) {
                    listenArrayEvents(data, this);
                }
                this._syncList = [];
                this._data = data;
            }
        }
        addElements() {
            const meta = this._cachedMeta;
            this._dataCheck();
            if (this.datasetElementType) {
                meta.dataset = new this.datasetElementType();
            }
        }
        buildOrUpdateElements(resetNewElements) {
            const meta = this._cachedMeta;
            const dataset = this.getDataset();
            let stackChanged = false;
            this._dataCheck();
            const oldStacked = meta._stacked;
            meta._stacked = isStacked(meta.vScale, meta);
            if (meta.stack !== dataset.stack) {
                stackChanged = true;
                clearStacks(meta);
                meta.stack = dataset.stack;
            }
            this._resyncElements(resetNewElements);
            if (stackChanged || oldStacked !== meta._stacked) {
                updateStacks(this, meta._parsed);
            }
        }
     configure() {
            const config = this.chart.config;
            const scopeKeys = config.datasetScopeKeys(this._type);
            const scopes = config.getOptionScopes(this.getDataset(), scopeKeys, true);
            this.options = config.createResolver(scopes, this.getContext());
            this._parsing = this.options.parsing;
            this._cachedDataOpts = {};
        }
     parse(start, count) {
            const { _cachedMeta: meta , _data: data  } = this;
            const { iScale , _stacked  } = meta;
            const iAxis = iScale.axis;
            let sorted = start === 0 && count === data.length ? true : meta._sorted;
            let prev = start > 0 && meta._parsed[start - 1];
            let i, cur, parsed;
            if (this._parsing === false) {
                meta._parsed = data;
                meta._sorted = true;
                parsed = data;
            } else {
                if (isArray(data[start])) {
                    parsed = this.parseArrayData(meta, data, start, count);
                } else if (isObject(data[start])) {
                    parsed = this.parseObjectData(meta, data, start, count);
                } else {
                    parsed = this.parsePrimitiveData(meta, data, start, count);
                }
                const isNotInOrderComparedToPrev = ()=>cur[iAxis] === null || prev && cur[iAxis] < prev[iAxis];
                for(i = 0; i < count; ++i){
                    meta._parsed[i + start] = cur = parsed[i];
                    if (sorted) {
                        if (isNotInOrderComparedToPrev()) {
                            sorted = false;
                        }
                        prev = cur;
                    }
                }
                meta._sorted = sorted;
            }
            if (_stacked) {
                updateStacks(this, parsed);
            }
        }
     parsePrimitiveData(meta, data, start, count) {
            const { iScale , vScale  } = meta;
            const iAxis = iScale.axis;
            const vAxis = vScale.axis;
            const labels = iScale.getLabels();
            const singleScale = iScale === vScale;
            const parsed = new Array(count);
            let i, ilen, index;
            for(i = 0, ilen = count; i < ilen; ++i){
                index = i + start;
                parsed[i] = {
                    [iAxis]: singleScale || iScale.parse(labels[index], index),
                    [vAxis]: vScale.parse(data[index], index)
                };
            }
            return parsed;
        }
     parseArrayData(meta, data, start, count) {
            const { xScale , yScale  } = meta;
            const parsed = new Array(count);
            let i, ilen, index, item;
            for(i = 0, ilen = count; i < ilen; ++i){
                index = i + start;
                item = data[index];
                parsed[i] = {
                    x: xScale.parse(item[0], index),
                    y: yScale.parse(item[1], index)
                };
            }
            return parsed;
        }
     parseObjectData(meta, data, start, count) {
            const { xScale , yScale  } = meta;
            const { xAxisKey ='x' , yAxisKey ='y'  } = this._parsing;
            const parsed = new Array(count);
            let i, ilen, index, item;
            for(i = 0, ilen = count; i < ilen; ++i){
                index = i + start;
                item = data[index];
                parsed[i] = {
                    x: xScale.parse(resolveObjectKey(item, xAxisKey), index),
                    y: yScale.parse(resolveObjectKey(item, yAxisKey), index)
                };
            }
            return parsed;
        }
     getParsed(index) {
            return this._cachedMeta._parsed[index];
        }
     getDataElement(index) {
            return this._cachedMeta.data[index];
        }
     applyStack(scale, parsed, mode) {
            const chart = this.chart;
            const meta = this._cachedMeta;
            const value = parsed[scale.axis];
            const stack = {
                keys: getSortedDatasetIndices(chart, true),
                values: parsed._stacks[scale.axis]._visualValues
            };
            return applyStack(stack, value, meta.index, {
                mode
            });
        }
     updateRangeFromParsed(range, scale, parsed, stack) {
            const parsedValue = parsed[scale.axis];
            let value = parsedValue === null ? NaN : parsedValue;
            const values = stack && parsed._stacks[scale.axis];
            if (stack && values) {
                stack.values = values;
                value = applyStack(stack, parsedValue, this._cachedMeta.index);
            }
            range.min = Math.min(range.min, value);
            range.max = Math.max(range.max, value);
        }
     getMinMax(scale, canStack) {
            const meta = this._cachedMeta;
            const _parsed = meta._parsed;
            const sorted = meta._sorted && scale === meta.iScale;
            const ilen = _parsed.length;
            const otherScale = this._getOtherScale(scale);
            const stack = createStack(canStack, meta, this.chart);
            const range = {
                min: Number.POSITIVE_INFINITY,
                max: Number.NEGATIVE_INFINITY
            };
            const { min: otherMin , max: otherMax  } = getUserBounds(otherScale);
            let i, parsed;
            function _skip() {
                parsed = _parsed[i];
                const otherValue = parsed[otherScale.axis];
                return !isNumberFinite(parsed[scale.axis]) || otherMin > otherValue || otherMax < otherValue;
            }
            for(i = 0; i < ilen; ++i){
                if (_skip()) {
                    continue;
                }
                this.updateRangeFromParsed(range, scale, parsed, stack);
                if (sorted) {
                    break;
                }
            }
            if (sorted) {
                for(i = ilen - 1; i >= 0; --i){
                    if (_skip()) {
                        continue;
                    }
                    this.updateRangeFromParsed(range, scale, parsed, stack);
                    break;
                }
            }
            return range;
        }
        getAllParsedValues(scale) {
            const parsed = this._cachedMeta._parsed;
            const values = [];
            let i, ilen, value;
            for(i = 0, ilen = parsed.length; i < ilen; ++i){
                value = parsed[i][scale.axis];
                if (isNumberFinite(value)) {
                    values.push(value);
                }
            }
            return values;
        }
     getMaxOverflow() {
            return false;
        }
     getLabelAndValue(index) {
            const meta = this._cachedMeta;
            const iScale = meta.iScale;
            const vScale = meta.vScale;
            const parsed = this.getParsed(index);
            return {
                label: iScale ? '' + iScale.getLabelForValue(parsed[iScale.axis]) : '',
                value: vScale ? '' + vScale.getLabelForValue(parsed[vScale.axis]) : ''
            };
        }
     _update(mode) {
            const meta = this._cachedMeta;
            this.update(mode || 'default');
            meta._clip = toClip(valueOrDefault(this.options.clip, defaultClip(meta.xScale, meta.yScale, this.getMaxOverflow())));
        }
     update(mode) {}
        draw() {
            const ctx = this._ctx;
            const chart = this.chart;
            const meta = this._cachedMeta;
            const elements = meta.data || [];
            const area = chart.chartArea;
            const active = [];
            const start = this._drawStart || 0;
            const count = this._drawCount || elements.length - start;
            const drawActiveElementsOnTop = this.options.drawActiveElementsOnTop;
            let i;
            if (meta.dataset) {
                meta.dataset.draw(ctx, area, start, count);
            }
            for(i = start; i < start + count; ++i){
                const element = elements[i];
                if (element.hidden) {
                    continue;
                }
                if (element.active && drawActiveElementsOnTop) {
                    active.push(element);
                } else {
                    element.draw(ctx, area);
                }
            }
            for(i = 0; i < active.length; ++i){
                active[i].draw(ctx, area);
            }
        }
     getStyle(index, active) {
            const mode = active ? 'active' : 'default';
            return index === undefined && this._cachedMeta.dataset ? this.resolveDatasetElementOptions(mode) : this.resolveDataElementOptions(index || 0, mode);
        }
     getContext(index, active, mode) {
            const dataset = this.getDataset();
            let context;
            if (index >= 0 && index < this._cachedMeta.data.length) {
                const element = this._cachedMeta.data[index];
                context = element.$context || (element.$context = createDataContext(this.getContext(), index, element));
                context.parsed = this.getParsed(index);
                context.raw = dataset.data[index];
                context.index = context.dataIndex = index;
            } else {
                context = this.$context || (this.$context = createDatasetContext(this.chart.getContext(), this.index));
                context.dataset = dataset;
                context.index = context.datasetIndex = this.index;
            }
            context.active = !!active;
            context.mode = mode;
            return context;
        }
     resolveDatasetElementOptions(mode) {
            return this._resolveElementOptions(this.datasetElementType.id, mode);
        }
     resolveDataElementOptions(index, mode) {
            return this._resolveElementOptions(this.dataElementType.id, mode, index);
        }
     _resolveElementOptions(elementType, mode = 'default', index) {
            const active = mode === 'active';
            const cache = this._cachedDataOpts;
            const cacheKey = elementType + '-' + mode;
            const cached = cache[cacheKey];
            const sharing = this.enableOptionSharing && defined(index);
            if (cached) {
                return cloneIfNotShared(cached, sharing);
            }
            const config = this.chart.config;
            const scopeKeys = config.datasetElementScopeKeys(this._type, elementType);
            const prefixes = active ? [
                `${elementType}Hover`,
                'hover',
                elementType,
                ''
            ] : [
                elementType,
                ''
            ];
            const scopes = config.getOptionScopes(this.getDataset(), scopeKeys);
            const names = Object.keys(defaults.elements[elementType]);
            const context = ()=>this.getContext(index, active, mode);
            const values = config.resolveNamedOptions(scopes, names, context, prefixes);
            if (values.$shared) {
                values.$shared = sharing;
                cache[cacheKey] = Object.freeze(cloneIfNotShared(values, sharing));
            }
            return values;
        }
     _resolveAnimations(index, transition, active) {
            const chart = this.chart;
            const cache = this._cachedDataOpts;
            const cacheKey = `animation-${transition}`;
            const cached = cache[cacheKey];
            if (cached) {
                return cached;
            }
            let options;
            if (chart.options.animation !== false) {
                const config = this.chart.config;
                const scopeKeys = config.datasetAnimationScopeKeys(this._type, transition);
                const scopes = config.getOptionScopes(this.getDataset(), scopeKeys);
                options = config.createResolver(scopes, this.getContext(index, active, transition));
            }
            const animations = new Animations(chart, options && options.animations);
            if (options && options._cacheable) {
                cache[cacheKey] = Object.freeze(animations);
            }
            return animations;
        }
     getSharedOptions(options) {
            if (!options.$shared) {
                return;
            }
            return this._sharedOptions || (this._sharedOptions = Object.assign({}, options));
        }
     includeOptions(mode, sharedOptions) {
            return !sharedOptions || isDirectUpdateMode(mode) || this.chart._animationsDisabled;
        }
     _getSharedOptions(start, mode) {
            const firstOpts = this.resolveDataElementOptions(start, mode);
            const previouslySharedOptions = this._sharedOptions;
            const sharedOptions = this.getSharedOptions(firstOpts);
            const includeOptions = this.includeOptions(mode, sharedOptions) || sharedOptions !== previouslySharedOptions;
            this.updateSharedOptions(sharedOptions, mode, firstOpts);
            return {
                sharedOptions,
                includeOptions
            };
        }
     updateElement(element, index, properties, mode) {
            if (isDirectUpdateMode(mode)) {
                Object.assign(element, properties);
            } else {
                this._resolveAnimations(index, mode).update(element, properties);
            }
        }
     updateSharedOptions(sharedOptions, mode, newOptions) {
            if (sharedOptions && !isDirectUpdateMode(mode)) {
                this._resolveAnimations(undefined, mode).update(sharedOptions, newOptions);
            }
        }
     _setStyle(element, index, mode, active) {
            element.active = active;
            const options = this.getStyle(index, active);
            this._resolveAnimations(index, mode, active).update(element, {
                options: !active && this.getSharedOptions(options) || options
            });
        }
        removeHoverStyle(element, datasetIndex, index) {
            this._setStyle(element, index, 'active', false);
        }
        setHoverStyle(element, datasetIndex, index) {
            this._setStyle(element, index, 'active', true);
        }
     _removeDatasetHoverStyle() {
            const element = this._cachedMeta.dataset;
            if (element) {
                this._setStyle(element, undefined, 'active', false);
            }
        }
     _setDatasetHoverStyle() {
            const element = this._cachedMeta.dataset;
            if (element) {
                this._setStyle(element, undefined, 'active', true);
            }
        }
     _resyncElements(resetNewElements) {
            const data = this._data;
            const elements = this._cachedMeta.data;
            for (const [method, arg1, arg2] of this._syncList){
                this[method](arg1, arg2);
            }
            this._syncList = [];
            const numMeta = elements.length;
            const numData = data.length;
            const count = Math.min(numData, numMeta);
            if (count) {
                this.parse(0, count);
            }
            if (numData > numMeta) {
                this._insertElements(numMeta, numData - numMeta, resetNewElements);
            } else if (numData < numMeta) {
                this._removeElements(numData, numMeta - numData);
            }
        }
     _insertElements(start, count, resetNewElements = true) {
            const meta = this._cachedMeta;
            const data = meta.data;
            const end = start + count;
            let i;
            const move = (arr)=>{
                arr.length += count;
                for(i = arr.length - 1; i >= end; i--){
                    arr[i] = arr[i - count];
                }
            };
            move(data);
            for(i = start; i < end; ++i){
                data[i] = new this.dataElementType();
            }
            if (this._parsing) {
                move(meta._parsed);
            }
            this.parse(start, count);
            if (resetNewElements) {
                this.updateElements(data, start, count, 'reset');
            }
        }
        updateElements(element, start, count, mode) {}
     _removeElements(start, count) {
            const meta = this._cachedMeta;
            if (this._parsing) {
                const removed = meta._parsed.splice(start, count);
                if (meta._stacked) {
                    clearStacks(meta, removed);
                }
            }
            meta.data.splice(start, count);
        }
     _sync(args) {
            if (this._parsing) {
                this._syncList.push(args);
            } else {
                const [method, arg1, arg2] = args;
                this[method](arg1, arg2);
            }
            this.chart._dataChanges.push([
                this.index,
                ...args
            ]);
        }
        _onDataPush() {
            const count = arguments.length;
            this._sync([
                '_insertElements',
                this.getDataset().data.length - count,
                count
            ]);
        }
        _onDataPop() {
            this._sync([
                '_removeElements',
                this._cachedMeta.data.length - 1,
                1
            ]);
        }
        _onDataShift() {
            this._sync([
                '_removeElements',
                0,
                1
            ]);
        }
        _onDataSplice(start, count) {
            if (count) {
                this._sync([
                    '_removeElements',
                    start,
                    count
                ]);
            }
            const newCount = arguments.length - 2;
            if (newCount) {
                this._sync([
                    '_insertElements',
                    start,
                    newCount
                ]);
            }
        }
        _onDataUnshift() {
            this._sync([
                '_insertElements',
                0,
                arguments.length
            ]);
        }
    }

    function getAllScaleValues(scale, type) {
        if (!scale._cache.$bar) {
            const visibleMetas = scale.getMatchingVisibleMetas(type);
            let values = [];
            for(let i = 0, ilen = visibleMetas.length; i < ilen; i++){
                values = values.concat(visibleMetas[i].controller.getAllParsedValues(scale));
            }
            scale._cache.$bar = _arrayUnique(values.sort((a, b)=>a - b));
        }
        return scale._cache.$bar;
    }
     function computeMinSampleSize(meta) {
        const scale = meta.iScale;
        const values = getAllScaleValues(scale, meta.type);
        let min = scale._length;
        let i, ilen, curr, prev;
        const updateMinAndPrev = ()=>{
            if (curr === 32767 || curr === -32768) {
                return;
            }
            if (defined(prev)) {
                min = Math.min(min, Math.abs(curr - prev) || min);
            }
            prev = curr;
        };
        for(i = 0, ilen = values.length; i < ilen; ++i){
            curr = scale.getPixelForValue(values[i]);
            updateMinAndPrev();
        }
        prev = undefined;
        for(i = 0, ilen = scale.ticks.length; i < ilen; ++i){
            curr = scale.getPixelForTick(i);
            updateMinAndPrev();
        }
        return min;
    }
     function computeFitCategoryTraits(index, ruler, options, stackCount) {
        const thickness = options.barThickness;
        let size, ratio;
        if (isNullOrUndef(thickness)) {
            size = ruler.min * options.categoryPercentage;
            ratio = options.barPercentage;
        } else {
            size = thickness * stackCount;
            ratio = 1;
        }
        return {
            chunk: size / stackCount,
            ratio,
            start: ruler.pixels[index] - size / 2
        };
    }
     function computeFlexCategoryTraits(index, ruler, options, stackCount) {
        const pixels = ruler.pixels;
        const curr = pixels[index];
        let prev = index > 0 ? pixels[index - 1] : null;
        let next = index < pixels.length - 1 ? pixels[index + 1] : null;
        const percent = options.categoryPercentage;
        if (prev === null) {
            prev = curr - (next === null ? ruler.end - ruler.start : next - curr);
        }
        if (next === null) {
            next = curr + curr - prev;
        }
        const start = curr - (curr - Math.min(prev, next)) / 2 * percent;
        const size = Math.abs(next - prev) / 2 * percent;
        return {
            chunk: size / stackCount,
            ratio: options.barPercentage,
            start
        };
    }
    function parseFloatBar(entry, item, vScale, i) {
        const startValue = vScale.parse(entry[0], i);
        const endValue = vScale.parse(entry[1], i);
        const min = Math.min(startValue, endValue);
        const max = Math.max(startValue, endValue);
        let barStart = min;
        let barEnd = max;
        if (Math.abs(min) > Math.abs(max)) {
            barStart = max;
            barEnd = min;
        }
        item[vScale.axis] = barEnd;
        item._custom = {
            barStart,
            barEnd,
            start: startValue,
            end: endValue,
            min,
            max
        };
    }
    function parseValue(entry, item, vScale, i) {
        if (isArray(entry)) {
            parseFloatBar(entry, item, vScale, i);
        } else {
            item[vScale.axis] = vScale.parse(entry, i);
        }
        return item;
    }
    function parseArrayOrPrimitive(meta, data, start, count) {
        const iScale = meta.iScale;
        const vScale = meta.vScale;
        const labels = iScale.getLabels();
        const singleScale = iScale === vScale;
        const parsed = [];
        let i, ilen, item, entry;
        for(i = start, ilen = start + count; i < ilen; ++i){
            entry = data[i];
            item = {};
            item[iScale.axis] = singleScale || iScale.parse(labels[i], i);
            parsed.push(parseValue(entry, item, vScale, i));
        }
        return parsed;
    }
    function isFloatBar(custom) {
        return custom && custom.barStart !== undefined && custom.barEnd !== undefined;
    }
    function barSign(size, vScale, actualBase) {
        if (size !== 0) {
            return sign(size);
        }
        return (vScale.isHorizontal() ? 1 : -1) * (vScale.min >= actualBase ? 1 : -1);
    }
    function borderProps(properties) {
        let reverse, start, end, top, bottom;
        if (properties.horizontal) {
            reverse = properties.base > properties.x;
            start = 'left';
            end = 'right';
        } else {
            reverse = properties.base < properties.y;
            start = 'bottom';
            end = 'top';
        }
        if (reverse) {
            top = 'end';
            bottom = 'start';
        } else {
            top = 'start';
            bottom = 'end';
        }
        return {
            start,
            end,
            reverse,
            top,
            bottom
        };
    }
    function setBorderSkipped(properties, options, stack, index) {
        let edge = options.borderSkipped;
        const res = {};
        if (!edge) {
            properties.borderSkipped = res;
            return;
        }
        if (edge === true) {
            properties.borderSkipped = {
                top: true,
                right: true,
                bottom: true,
                left: true
            };
            return;
        }
        const { start , end , reverse , top , bottom  } = borderProps(properties);
        if (edge === 'middle' && stack) {
            properties.enableBorderRadius = true;
            if ((stack._top || 0) === index) {
                edge = top;
            } else if ((stack._bottom || 0) === index) {
                edge = bottom;
            } else {
                res[parseEdge(bottom, start, end, reverse)] = true;
                edge = top;
            }
        }
        res[parseEdge(edge, start, end, reverse)] = true;
        properties.borderSkipped = res;
    }
    function parseEdge(edge, a, b, reverse) {
        if (reverse) {
            edge = swap(edge, a, b);
            edge = startEnd(edge, b, a);
        } else {
            edge = startEnd(edge, a, b);
        }
        return edge;
    }
    function swap(orig, v1, v2) {
        return orig === v1 ? v2 : orig === v2 ? v1 : orig;
    }
    function startEnd(v, start, end) {
        return v === 'start' ? start : v === 'end' ? end : v;
    }
    function setInflateAmount(properties, { inflateAmount  }, ratio) {
        properties.inflateAmount = inflateAmount === 'auto' ? ratio === 1 ? 0.33 : 0 : inflateAmount;
    }
    class BarController extends DatasetController {
        static id = 'bar';
     static defaults = {
            datasetElementType: false,
            dataElementType: 'bar',
            categoryPercentage: 0.8,
            barPercentage: 0.9,
            grouped: true,
            animations: {
                numbers: {
                    type: 'number',
                    properties: [
                        'x',
                        'y',
                        'base',
                        'width',
                        'height'
                    ]
                }
            }
        };
     static overrides = {
            scales: {
                _index_: {
                    type: 'category',
                    offset: true,
                    grid: {
                        offset: true
                    }
                },
                _value_: {
                    type: 'linear',
                    beginAtZero: true
                }
            }
        };
     parsePrimitiveData(meta, data, start, count) {
            return parseArrayOrPrimitive(meta, data, start, count);
        }
     parseArrayData(meta, data, start, count) {
            return parseArrayOrPrimitive(meta, data, start, count);
        }
     parseObjectData(meta, data, start, count) {
            const { iScale , vScale  } = meta;
            const { xAxisKey ='x' , yAxisKey ='y'  } = this._parsing;
            const iAxisKey = iScale.axis === 'x' ? xAxisKey : yAxisKey;
            const vAxisKey = vScale.axis === 'x' ? xAxisKey : yAxisKey;
            const parsed = [];
            let i, ilen, item, obj;
            for(i = start, ilen = start + count; i < ilen; ++i){
                obj = data[i];
                item = {};
                item[iScale.axis] = iScale.parse(resolveObjectKey(obj, iAxisKey), i);
                parsed.push(parseValue(resolveObjectKey(obj, vAxisKey), item, vScale, i));
            }
            return parsed;
        }
     updateRangeFromParsed(range, scale, parsed, stack) {
            super.updateRangeFromParsed(range, scale, parsed, stack);
            const custom = parsed._custom;
            if (custom && scale === this._cachedMeta.vScale) {
                range.min = Math.min(range.min, custom.min);
                range.max = Math.max(range.max, custom.max);
            }
        }
     getMaxOverflow() {
            return 0;
        }
     getLabelAndValue(index) {
            const meta = this._cachedMeta;
            const { iScale , vScale  } = meta;
            const parsed = this.getParsed(index);
            const custom = parsed._custom;
            const value = isFloatBar(custom) ? '[' + custom.start + ', ' + custom.end + ']' : '' + vScale.getLabelForValue(parsed[vScale.axis]);
            return {
                label: '' + iScale.getLabelForValue(parsed[iScale.axis]),
                value
            };
        }
        initialize() {
            this.enableOptionSharing = true;
            super.initialize();
            const meta = this._cachedMeta;
            meta.stack = this.getDataset().stack;
        }
        update(mode) {
            const meta = this._cachedMeta;
            this.updateElements(meta.data, 0, meta.data.length, mode);
        }
        updateElements(bars, start, count, mode) {
            const reset = mode === 'reset';
            const { index , _cachedMeta: { vScale  }  } = this;
            const base = vScale.getBasePixel();
            const horizontal = vScale.isHorizontal();
            const ruler = this._getRuler();
            const { sharedOptions , includeOptions  } = this._getSharedOptions(start, mode);
            for(let i = start; i < start + count; i++){
                const parsed = this.getParsed(i);
                const vpixels = reset || isNullOrUndef(parsed[vScale.axis]) ? {
                    base,
                    head: base
                } : this._calculateBarValuePixels(i);
                const ipixels = this._calculateBarIndexPixels(i, ruler);
                const stack = (parsed._stacks || {})[vScale.axis];
                const properties = {
                    horizontal,
                    base: vpixels.base,
                    enableBorderRadius: !stack || isFloatBar(parsed._custom) || index === stack._top || index === stack._bottom,
                    x: horizontal ? vpixels.head : ipixels.center,
                    y: horizontal ? ipixels.center : vpixels.head,
                    height: horizontal ? ipixels.size : Math.abs(vpixels.size),
                    width: horizontal ? Math.abs(vpixels.size) : ipixels.size
                };
                if (includeOptions) {
                    properties.options = sharedOptions || this.resolveDataElementOptions(i, bars[i].active ? 'active' : mode);
                }
                const options = properties.options || bars[i].options;
                setBorderSkipped(properties, options, stack, index);
                setInflateAmount(properties, options, ruler.ratio);
                this.updateElement(bars[i], i, properties, mode);
            }
        }
     _getStacks(last, dataIndex) {
            const { iScale  } = this._cachedMeta;
            const metasets = iScale.getMatchingVisibleMetas(this._type).filter((meta)=>meta.controller.options.grouped);
            const stacked = iScale.options.stacked;
            const stacks = [];
            const skipNull = (meta)=>{
                const parsed = meta.controller.getParsed(dataIndex);
                const val = parsed && parsed[meta.vScale.axis];
                if (isNullOrUndef(val) || isNaN(val)) {
                    return true;
                }
            };
            for (const meta of metasets){
                if (dataIndex !== undefined && skipNull(meta)) {
                    continue;
                }
                if (stacked === false || stacks.indexOf(meta.stack) === -1 || stacked === undefined && meta.stack === undefined) {
                    stacks.push(meta.stack);
                }
                if (meta.index === last) {
                    break;
                }
            }
            if (!stacks.length) {
                stacks.push(undefined);
            }
            return stacks;
        }
     _getStackCount(index) {
            return this._getStacks(undefined, index).length;
        }
     _getStackIndex(datasetIndex, name, dataIndex) {
            const stacks = this._getStacks(datasetIndex, dataIndex);
            const index = name !== undefined ? stacks.indexOf(name) : -1;
            return index === -1 ? stacks.length - 1 : index;
        }
     _getRuler() {
            const opts = this.options;
            const meta = this._cachedMeta;
            const iScale = meta.iScale;
            const pixels = [];
            let i, ilen;
            for(i = 0, ilen = meta.data.length; i < ilen; ++i){
                pixels.push(iScale.getPixelForValue(this.getParsed(i)[iScale.axis], i));
            }
            const barThickness = opts.barThickness;
            const min = barThickness || computeMinSampleSize(meta);
            return {
                min,
                pixels,
                start: iScale._startPixel,
                end: iScale._endPixel,
                stackCount: this._getStackCount(),
                scale: iScale,
                grouped: opts.grouped,
                ratio: barThickness ? 1 : opts.categoryPercentage * opts.barPercentage
            };
        }
     _calculateBarValuePixels(index) {
            const { _cachedMeta: { vScale , _stacked , index: datasetIndex  } , options: { base: baseValue , minBarLength  }  } = this;
            const actualBase = baseValue || 0;
            const parsed = this.getParsed(index);
            const custom = parsed._custom;
            const floating = isFloatBar(custom);
            let value = parsed[vScale.axis];
            let start = 0;
            let length = _stacked ? this.applyStack(vScale, parsed, _stacked) : value;
            let head, size;
            if (length !== value) {
                start = length - value;
                length = value;
            }
            if (floating) {
                value = custom.barStart;
                length = custom.barEnd - custom.barStart;
                if (value !== 0 && sign(value) !== sign(custom.barEnd)) {
                    start = 0;
                }
                start += value;
            }
            const startValue = !isNullOrUndef(baseValue) && !floating ? baseValue : start;
            let base = vScale.getPixelForValue(startValue);
            if (this.chart.getDataVisibility(index)) {
                head = vScale.getPixelForValue(start + length);
            } else {
                head = base;
            }
            size = head - base;
            if (Math.abs(size) < minBarLength) {
                size = barSign(size, vScale, actualBase) * minBarLength;
                if (value === actualBase) {
                    base -= size / 2;
                }
                const startPixel = vScale.getPixelForDecimal(0);
                const endPixel = vScale.getPixelForDecimal(1);
                const min = Math.min(startPixel, endPixel);
                const max = Math.max(startPixel, endPixel);
                base = Math.max(Math.min(base, max), min);
                head = base + size;
                if (_stacked && !floating) {
                    parsed._stacks[vScale.axis]._visualValues[datasetIndex] = vScale.getValueForPixel(head) - vScale.getValueForPixel(base);
                }
            }
            if (base === vScale.getPixelForValue(actualBase)) {
                const halfGrid = sign(size) * vScale.getLineWidthForValue(actualBase) / 2;
                base += halfGrid;
                size -= halfGrid;
            }
            return {
                size,
                base,
                head,
                center: head + size / 2
            };
        }
     _calculateBarIndexPixels(index, ruler) {
            const scale = ruler.scale;
            const options = this.options;
            const skipNull = options.skipNull;
            const maxBarThickness = valueOrDefault(options.maxBarThickness, Infinity);
            let center, size;
            if (ruler.grouped) {
                const stackCount = skipNull ? this._getStackCount(index) : ruler.stackCount;
                const range = options.barThickness === 'flex' ? computeFlexCategoryTraits(index, ruler, options, stackCount) : computeFitCategoryTraits(index, ruler, options, stackCount);
                const stackIndex = this._getStackIndex(this.index, this._cachedMeta.stack, skipNull ? index : undefined);
                center = range.start + range.chunk * stackIndex + range.chunk / 2;
                size = Math.min(maxBarThickness, range.chunk * range.ratio);
            } else {
                center = scale.getPixelForValue(this.getParsed(index)[scale.axis], index);
                size = Math.min(maxBarThickness, ruler.min * ruler.ratio);
            }
            return {
                base: center - size / 2,
                head: center + size / 2,
                center,
                size
            };
        }
        draw() {
            const meta = this._cachedMeta;
            const vScale = meta.vScale;
            const rects = meta.data;
            const ilen = rects.length;
            let i = 0;
            for(; i < ilen; ++i){
                if (this.getParsed(i)[vScale.axis] !== null) {
                    rects[i].draw(this._ctx);
                }
            }
        }
    }

    class BubbleController extends DatasetController {
        static id = 'bubble';
     static defaults = {
            datasetElementType: false,
            dataElementType: 'point',
            animations: {
                numbers: {
                    type: 'number',
                    properties: [
                        'x',
                        'y',
                        'borderWidth',
                        'radius'
                    ]
                }
            }
        };
     static overrides = {
            scales: {
                x: {
                    type: 'linear'
                },
                y: {
                    type: 'linear'
                }
            }
        };
        initialize() {
            this.enableOptionSharing = true;
            super.initialize();
        }
     parsePrimitiveData(meta, data, start, count) {
            const parsed = super.parsePrimitiveData(meta, data, start, count);
            for(let i = 0; i < parsed.length; i++){
                parsed[i]._custom = this.resolveDataElementOptions(i + start).radius;
            }
            return parsed;
        }
     parseArrayData(meta, data, start, count) {
            const parsed = super.parseArrayData(meta, data, start, count);
            for(let i = 0; i < parsed.length; i++){
                const item = data[start + i];
                parsed[i]._custom = valueOrDefault(item[2], this.resolveDataElementOptions(i + start).radius);
            }
            return parsed;
        }
     parseObjectData(meta, data, start, count) {
            const parsed = super.parseObjectData(meta, data, start, count);
            for(let i = 0; i < parsed.length; i++){
                const item = data[start + i];
                parsed[i]._custom = valueOrDefault(item && item.r && +item.r, this.resolveDataElementOptions(i + start).radius);
            }
            return parsed;
        }
     getMaxOverflow() {
            const data = this._cachedMeta.data;
            let max = 0;
            for(let i = data.length - 1; i >= 0; --i){
                max = Math.max(max, data[i].size(this.resolveDataElementOptions(i)) / 2);
            }
            return max > 0 && max;
        }
     getLabelAndValue(index) {
            const meta = this._cachedMeta;
            const labels = this.chart.data.labels || [];
            const { xScale , yScale  } = meta;
            const parsed = this.getParsed(index);
            const x = xScale.getLabelForValue(parsed.x);
            const y = yScale.getLabelForValue(parsed.y);
            const r = parsed._custom;
            return {
                label: labels[index] || '',
                value: '(' + x + ', ' + y + (r ? ', ' + r : '') + ')'
            };
        }
        update(mode) {
            const points = this._cachedMeta.data;
            this.updateElements(points, 0, points.length, mode);
        }
        updateElements(points, start, count, mode) {
            const reset = mode === 'reset';
            const { iScale , vScale  } = this._cachedMeta;
            const { sharedOptions , includeOptions  } = this._getSharedOptions(start, mode);
            const iAxis = iScale.axis;
            const vAxis = vScale.axis;
            for(let i = start; i < start + count; i++){
                const point = points[i];
                const parsed = !reset && this.getParsed(i);
                const properties = {};
                const iPixel = properties[iAxis] = reset ? iScale.getPixelForDecimal(0.5) : iScale.getPixelForValue(parsed[iAxis]);
                const vPixel = properties[vAxis] = reset ? vScale.getBasePixel() : vScale.getPixelForValue(parsed[vAxis]);
                properties.skip = isNaN(iPixel) || isNaN(vPixel);
                if (includeOptions) {
                    properties.options = sharedOptions || this.resolveDataElementOptions(i, point.active ? 'active' : mode);
                    if (reset) {
                        properties.options.radius = 0;
                    }
                }
                this.updateElement(point, i, properties, mode);
            }
        }
     resolveDataElementOptions(index, mode) {
            const parsed = this.getParsed(index);
            let values = super.resolveDataElementOptions(index, mode);
            if (values.$shared) {
                values = Object.assign({}, values, {
                    $shared: false
                });
            }
            const radius = values.radius;
            if (mode !== 'active') {
                values.radius = 0;
            }
            values.radius += valueOrDefault(parsed && parsed._custom, radius);
            return values;
        }
    }

    function getRatioAndOffset(rotation, circumference, cutout) {
        let ratioX = 1;
        let ratioY = 1;
        let offsetX = 0;
        let offsetY = 0;
        if (circumference < TAU) {
            const startAngle = rotation;
            const endAngle = startAngle + circumference;
            const startX = Math.cos(startAngle);
            const startY = Math.sin(startAngle);
            const endX = Math.cos(endAngle);
            const endY = Math.sin(endAngle);
            const calcMax = (angle, a, b)=>_angleBetween(angle, startAngle, endAngle, true) ? 1 : Math.max(a, a * cutout, b, b * cutout);
            const calcMin = (angle, a, b)=>_angleBetween(angle, startAngle, endAngle, true) ? -1 : Math.min(a, a * cutout, b, b * cutout);
            const maxX = calcMax(0, startX, endX);
            const maxY = calcMax(HALF_PI, startY, endY);
            const minX = calcMin(PI, startX, endX);
            const minY = calcMin(PI + HALF_PI, startY, endY);
            ratioX = (maxX - minX) / 2;
            ratioY = (maxY - minY) / 2;
            offsetX = -(maxX + minX) / 2;
            offsetY = -(maxY + minY) / 2;
        }
        return {
            ratioX,
            ratioY,
            offsetX,
            offsetY
        };
    }
    class DoughnutController extends DatasetController {
        static id = 'doughnut';
     static defaults = {
            datasetElementType: false,
            dataElementType: 'arc',
            animation: {
                animateRotate: true,
                animateScale: false
            },
            animations: {
                numbers: {
                    type: 'number',
                    properties: [
                        'circumference',
                        'endAngle',
                        'innerRadius',
                        'outerRadius',
                        'startAngle',
                        'x',
                        'y',
                        'offset',
                        'borderWidth',
                        'spacing'
                    ]
                }
            },
            cutout: '50%',
            rotation: 0,
            circumference: 360,
            radius: '100%',
            spacing: 0,
            indexAxis: 'r'
        };
        static descriptors = {
            _scriptable: (name)=>name !== 'spacing',
            _indexable: (name)=>name !== 'spacing'
        };
     static overrides = {
            aspectRatio: 1,
            plugins: {
                legend: {
                    labels: {
                        generateLabels (chart) {
                            const data = chart.data;
                            if (data.labels.length && data.datasets.length) {
                                const { labels: { pointStyle , color  }  } = chart.legend.options;
                                return data.labels.map((label, i)=>{
                                    const meta = chart.getDatasetMeta(0);
                                    const style = meta.controller.getStyle(i);
                                    return {
                                        text: label,
                                        fillStyle: style.backgroundColor,
                                        strokeStyle: style.borderColor,
                                        fontColor: color,
                                        lineWidth: style.borderWidth,
                                        pointStyle: pointStyle,
                                        hidden: !chart.getDataVisibility(i),
                                        index: i
                                    };
                                });
                            }
                            return [];
                        }
                    },
                    onClick (e, legendItem, legend) {
                        legend.chart.toggleDataVisibility(legendItem.index);
                        legend.chart.update();
                    }
                }
            }
        };
        constructor(chart, datasetIndex){
            super(chart, datasetIndex);
            this.enableOptionSharing = true;
            this.innerRadius = undefined;
            this.outerRadius = undefined;
            this.offsetX = undefined;
            this.offsetY = undefined;
        }
        linkScales() {}
     parse(start, count) {
            const data = this.getDataset().data;
            const meta = this._cachedMeta;
            if (this._parsing === false) {
                meta._parsed = data;
            } else {
                let getter = (i)=>+data[i];
                if (isObject(data[start])) {
                    const { key ='value'  } = this._parsing;
                    getter = (i)=>+resolveObjectKey(data[i], key);
                }
                let i, ilen;
                for(i = start, ilen = start + count; i < ilen; ++i){
                    meta._parsed[i] = getter(i);
                }
            }
        }
     _getRotation() {
            return toRadians(this.options.rotation - 90);
        }
     _getCircumference() {
            return toRadians(this.options.circumference);
        }
     _getRotationExtents() {
            let min = TAU;
            let max = -TAU;
            for(let i = 0; i < this.chart.data.datasets.length; ++i){
                if (this.chart.isDatasetVisible(i) && this.chart.getDatasetMeta(i).type === this._type) {
                    const controller = this.chart.getDatasetMeta(i).controller;
                    const rotation = controller._getRotation();
                    const circumference = controller._getCircumference();
                    min = Math.min(min, rotation);
                    max = Math.max(max, rotation + circumference);
                }
            }
            return {
                rotation: min,
                circumference: max - min
            };
        }
     update(mode) {
            const chart = this.chart;
            const { chartArea  } = chart;
            const meta = this._cachedMeta;
            const arcs = meta.data;
            const spacing = this.getMaxBorderWidth() + this.getMaxOffset(arcs) + this.options.spacing;
            const maxSize = Math.max((Math.min(chartArea.width, chartArea.height) - spacing) / 2, 0);
            const cutout = Math.min(toPercentage(this.options.cutout, maxSize), 1);
            const chartWeight = this._getRingWeight(this.index);
            const { circumference , rotation  } = this._getRotationExtents();
            const { ratioX , ratioY , offsetX , offsetY  } = getRatioAndOffset(rotation, circumference, cutout);
            const maxWidth = (chartArea.width - spacing) / ratioX;
            const maxHeight = (chartArea.height - spacing) / ratioY;
            const maxRadius = Math.max(Math.min(maxWidth, maxHeight) / 2, 0);
            const outerRadius = toDimension(this.options.radius, maxRadius);
            const innerRadius = Math.max(outerRadius * cutout, 0);
            const radiusLength = (outerRadius - innerRadius) / this._getVisibleDatasetWeightTotal();
            this.offsetX = offsetX * outerRadius;
            this.offsetY = offsetY * outerRadius;
            meta.total = this.calculateTotal();
            this.outerRadius = outerRadius - radiusLength * this._getRingWeightOffset(this.index);
            this.innerRadius = Math.max(this.outerRadius - radiusLength * chartWeight, 0);
            this.updateElements(arcs, 0, arcs.length, mode);
        }
     _circumference(i, reset) {
            const opts = this.options;
            const meta = this._cachedMeta;
            const circumference = this._getCircumference();
            if (reset && opts.animation.animateRotate || !this.chart.getDataVisibility(i) || meta._parsed[i] === null || meta.data[i].hidden) {
                return 0;
            }
            return this.calculateCircumference(meta._parsed[i] * circumference / TAU);
        }
        updateElements(arcs, start, count, mode) {
            const reset = mode === 'reset';
            const chart = this.chart;
            const chartArea = chart.chartArea;
            const opts = chart.options;
            const animationOpts = opts.animation;
            const centerX = (chartArea.left + chartArea.right) / 2;
            const centerY = (chartArea.top + chartArea.bottom) / 2;
            const animateScale = reset && animationOpts.animateScale;
            const innerRadius = animateScale ? 0 : this.innerRadius;
            const outerRadius = animateScale ? 0 : this.outerRadius;
            const { sharedOptions , includeOptions  } = this._getSharedOptions(start, mode);
            let startAngle = this._getRotation();
            let i;
            for(i = 0; i < start; ++i){
                startAngle += this._circumference(i, reset);
            }
            for(i = start; i < start + count; ++i){
                const circumference = this._circumference(i, reset);
                const arc = arcs[i];
                const properties = {
                    x: centerX + this.offsetX,
                    y: centerY + this.offsetY,
                    startAngle,
                    endAngle: startAngle + circumference,
                    circumference,
                    outerRadius,
                    innerRadius
                };
                if (includeOptions) {
                    properties.options = sharedOptions || this.resolveDataElementOptions(i, arc.active ? 'active' : mode);
                }
                startAngle += circumference;
                this.updateElement(arc, i, properties, mode);
            }
        }
        calculateTotal() {
            const meta = this._cachedMeta;
            const metaData = meta.data;
            let total = 0;
            let i;
            for(i = 0; i < metaData.length; i++){
                const value = meta._parsed[i];
                if (value !== null && !isNaN(value) && this.chart.getDataVisibility(i) && !metaData[i].hidden) {
                    total += Math.abs(value);
                }
            }
            return total;
        }
        calculateCircumference(value) {
            const total = this._cachedMeta.total;
            if (total > 0 && !isNaN(value)) {
                return TAU * (Math.abs(value) / total);
            }
            return 0;
        }
        getLabelAndValue(index) {
            const meta = this._cachedMeta;
            const chart = this.chart;
            const labels = chart.data.labels || [];
            const value = formatNumber(meta._parsed[index], chart.options.locale);
            return {
                label: labels[index] || '',
                value
            };
        }
        getMaxBorderWidth(arcs) {
            let max = 0;
            const chart = this.chart;
            let i, ilen, meta, controller, options;
            if (!arcs) {
                for(i = 0, ilen = chart.data.datasets.length; i < ilen; ++i){
                    if (chart.isDatasetVisible(i)) {
                        meta = chart.getDatasetMeta(i);
                        arcs = meta.data;
                        controller = meta.controller;
                        break;
                    }
                }
            }
            if (!arcs) {
                return 0;
            }
            for(i = 0, ilen = arcs.length; i < ilen; ++i){
                options = controller.resolveDataElementOptions(i);
                if (options.borderAlign !== 'inner') {
                    max = Math.max(max, options.borderWidth || 0, options.hoverBorderWidth || 0);
                }
            }
            return max;
        }
        getMaxOffset(arcs) {
            let max = 0;
            for(let i = 0, ilen = arcs.length; i < ilen; ++i){
                const options = this.resolveDataElementOptions(i);
                max = Math.max(max, options.offset || 0, options.hoverOffset || 0);
            }
            return max;
        }
     _getRingWeightOffset(datasetIndex) {
            let ringWeightOffset = 0;
            for(let i = 0; i < datasetIndex; ++i){
                if (this.chart.isDatasetVisible(i)) {
                    ringWeightOffset += this._getRingWeight(i);
                }
            }
            return ringWeightOffset;
        }
     _getRingWeight(datasetIndex) {
            return Math.max(valueOrDefault(this.chart.data.datasets[datasetIndex].weight, 1), 0);
        }
     _getVisibleDatasetWeightTotal() {
            return this._getRingWeightOffset(this.chart.data.datasets.length) || 1;
        }
    }

    class LineController extends DatasetController {
        static id = 'line';
     static defaults = {
            datasetElementType: 'line',
            dataElementType: 'point',
            showLine: true,
            spanGaps: false
        };
     static overrides = {
            scales: {
                _index_: {
                    type: 'category'
                },
                _value_: {
                    type: 'linear'
                }
            }
        };
        initialize() {
            this.enableOptionSharing = true;
            this.supportsDecimation = true;
            super.initialize();
        }
        update(mode) {
            const meta = this._cachedMeta;
            const { dataset: line , data: points = [] , _dataset  } = meta;
            const animationsDisabled = this.chart._animationsDisabled;
            let { start , count  } = _getStartAndCountOfVisiblePoints(meta, points, animationsDisabled);
            this._drawStart = start;
            this._drawCount = count;
            if (_scaleRangesChanged(meta)) {
                start = 0;
                count = points.length;
            }
            line._chart = this.chart;
            line._datasetIndex = this.index;
            line._decimated = !!_dataset._decimated;
            line.points = points;
            const options = this.resolveDatasetElementOptions(mode);
            if (!this.options.showLine) {
                options.borderWidth = 0;
            }
            options.segment = this.options.segment;
            this.updateElement(line, undefined, {
                animated: !animationsDisabled,
                options
            }, mode);
            this.updateElements(points, start, count, mode);
        }
        updateElements(points, start, count, mode) {
            const reset = mode === 'reset';
            const { iScale , vScale , _stacked , _dataset  } = this._cachedMeta;
            const { sharedOptions , includeOptions  } = this._getSharedOptions(start, mode);
            const iAxis = iScale.axis;
            const vAxis = vScale.axis;
            const { spanGaps , segment  } = this.options;
            const maxGapLength = isNumber(spanGaps) ? spanGaps : Number.POSITIVE_INFINITY;
            const directUpdate = this.chart._animationsDisabled || reset || mode === 'none';
            const end = start + count;
            const pointsCount = points.length;
            let prevParsed = start > 0 && this.getParsed(start - 1);
            for(let i = 0; i < pointsCount; ++i){
                const point = points[i];
                const properties = directUpdate ? point : {};
                if (i < start || i >= end) {
                    properties.skip = true;
                    continue;
                }
                const parsed = this.getParsed(i);
                const nullData = isNullOrUndef(parsed[vAxis]);
                const iPixel = properties[iAxis] = iScale.getPixelForValue(parsed[iAxis], i);
                const vPixel = properties[vAxis] = reset || nullData ? vScale.getBasePixel() : vScale.getPixelForValue(_stacked ? this.applyStack(vScale, parsed, _stacked) : parsed[vAxis], i);
                properties.skip = isNaN(iPixel) || isNaN(vPixel) || nullData;
                properties.stop = i > 0 && Math.abs(parsed[iAxis] - prevParsed[iAxis]) > maxGapLength;
                if (segment) {
                    properties.parsed = parsed;
                    properties.raw = _dataset.data[i];
                }
                if (includeOptions) {
                    properties.options = sharedOptions || this.resolveDataElementOptions(i, point.active ? 'active' : mode);
                }
                if (!directUpdate) {
                    this.updateElement(point, i, properties, mode);
                }
                prevParsed = parsed;
            }
        }
     getMaxOverflow() {
            const meta = this._cachedMeta;
            const dataset = meta.dataset;
            const border = dataset.options && dataset.options.borderWidth || 0;
            const data = meta.data || [];
            if (!data.length) {
                return border;
            }
            const firstPoint = data[0].size(this.resolveDataElementOptions(0));
            const lastPoint = data[data.length - 1].size(this.resolveDataElementOptions(data.length - 1));
            return Math.max(border, firstPoint, lastPoint) / 2;
        }
        draw() {
            const meta = this._cachedMeta;
            meta.dataset.updateControlPoints(this.chart.chartArea, meta.iScale.axis);
            super.draw();
        }
    }

    class PolarAreaController extends DatasetController {
        static id = 'polarArea';
     static defaults = {
            dataElementType: 'arc',
            animation: {
                animateRotate: true,
                animateScale: true
            },
            animations: {
                numbers: {
                    type: 'number',
                    properties: [
                        'x',
                        'y',
                        'startAngle',
                        'endAngle',
                        'innerRadius',
                        'outerRadius'
                    ]
                }
            },
            indexAxis: 'r',
            startAngle: 0
        };
     static overrides = {
            aspectRatio: 1,
            plugins: {
                legend: {
                    labels: {
                        generateLabels (chart) {
                            const data = chart.data;
                            if (data.labels.length && data.datasets.length) {
                                const { labels: { pointStyle , color  }  } = chart.legend.options;
                                return data.labels.map((label, i)=>{
                                    const meta = chart.getDatasetMeta(0);
                                    const style = meta.controller.getStyle(i);
                                    return {
                                        text: label,
                                        fillStyle: style.backgroundColor,
                                        strokeStyle: style.borderColor,
                                        fontColor: color,
                                        lineWidth: style.borderWidth,
                                        pointStyle: pointStyle,
                                        hidden: !chart.getDataVisibility(i),
                                        index: i
                                    };
                                });
                            }
                            return [];
                        }
                    },
                    onClick (e, legendItem, legend) {
                        legend.chart.toggleDataVisibility(legendItem.index);
                        legend.chart.update();
                    }
                }
            },
            scales: {
                r: {
                    type: 'radialLinear',
                    angleLines: {
                        display: false
                    },
                    beginAtZero: true,
                    grid: {
                        circular: true
                    },
                    pointLabels: {
                        display: false
                    },
                    startAngle: 0
                }
            }
        };
        constructor(chart, datasetIndex){
            super(chart, datasetIndex);
            this.innerRadius = undefined;
            this.outerRadius = undefined;
        }
        getLabelAndValue(index) {
            const meta = this._cachedMeta;
            const chart = this.chart;
            const labels = chart.data.labels || [];
            const value = formatNumber(meta._parsed[index].r, chart.options.locale);
            return {
                label: labels[index] || '',
                value
            };
        }
        parseObjectData(meta, data, start, count) {
            return _parseObjectDataRadialScale.bind(this)(meta, data, start, count);
        }
        update(mode) {
            const arcs = this._cachedMeta.data;
            this._updateRadius();
            this.updateElements(arcs, 0, arcs.length, mode);
        }
     getMinMax() {
            const meta = this._cachedMeta;
            const range = {
                min: Number.POSITIVE_INFINITY,
                max: Number.NEGATIVE_INFINITY
            };
            meta.data.forEach((element, index)=>{
                const parsed = this.getParsed(index).r;
                if (!isNaN(parsed) && this.chart.getDataVisibility(index)) {
                    if (parsed < range.min) {
                        range.min = parsed;
                    }
                    if (parsed > range.max) {
                        range.max = parsed;
                    }
                }
            });
            return range;
        }
     _updateRadius() {
            const chart = this.chart;
            const chartArea = chart.chartArea;
            const opts = chart.options;
            const minSize = Math.min(chartArea.right - chartArea.left, chartArea.bottom - chartArea.top);
            const outerRadius = Math.max(minSize / 2, 0);
            const innerRadius = Math.max(opts.cutoutPercentage ? outerRadius / 100 * opts.cutoutPercentage : 1, 0);
            const radiusLength = (outerRadius - innerRadius) / chart.getVisibleDatasetCount();
            this.outerRadius = outerRadius - radiusLength * this.index;
            this.innerRadius = this.outerRadius - radiusLength;
        }
        updateElements(arcs, start, count, mode) {
            const reset = mode === 'reset';
            const chart = this.chart;
            const opts = chart.options;
            const animationOpts = opts.animation;
            const scale = this._cachedMeta.rScale;
            const centerX = scale.xCenter;
            const centerY = scale.yCenter;
            const datasetStartAngle = scale.getIndexAngle(0) - 0.5 * PI;
            let angle = datasetStartAngle;
            let i;
            const defaultAngle = 360 / this.countVisibleElements();
            for(i = 0; i < start; ++i){
                angle += this._computeAngle(i, mode, defaultAngle);
            }
            for(i = start; i < start + count; i++){
                const arc = arcs[i];
                let startAngle = angle;
                let endAngle = angle + this._computeAngle(i, mode, defaultAngle);
                let outerRadius = chart.getDataVisibility(i) ? scale.getDistanceFromCenterForValue(this.getParsed(i).r) : 0;
                angle = endAngle;
                if (reset) {
                    if (animationOpts.animateScale) {
                        outerRadius = 0;
                    }
                    if (animationOpts.animateRotate) {
                        startAngle = endAngle = datasetStartAngle;
                    }
                }
                const properties = {
                    x: centerX,
                    y: centerY,
                    innerRadius: 0,
                    outerRadius,
                    startAngle,
                    endAngle,
                    options: this.resolveDataElementOptions(i, arc.active ? 'active' : mode)
                };
                this.updateElement(arc, i, properties, mode);
            }
        }
        countVisibleElements() {
            const meta = this._cachedMeta;
            let count = 0;
            meta.data.forEach((element, index)=>{
                if (!isNaN(this.getParsed(index).r) && this.chart.getDataVisibility(index)) {
                    count++;
                }
            });
            return count;
        }
     _computeAngle(index, mode, defaultAngle) {
            return this.chart.getDataVisibility(index) ? toRadians(this.resolveDataElementOptions(index, mode).angle || defaultAngle) : 0;
        }
    }

    class PieController extends DoughnutController {
        static id = 'pie';
     static defaults = {
            cutout: 0,
            rotation: 0,
            circumference: 360,
            radius: '100%'
        };
    }

    class RadarController extends DatasetController {
        static id = 'radar';
     static defaults = {
            datasetElementType: 'line',
            dataElementType: 'point',
            indexAxis: 'r',
            showLine: true,
            elements: {
                line: {
                    fill: 'start'
                }
            }
        };
     static overrides = {
            aspectRatio: 1,
            scales: {
                r: {
                    type: 'radialLinear'
                }
            }
        };
     getLabelAndValue(index) {
            const vScale = this._cachedMeta.vScale;
            const parsed = this.getParsed(index);
            return {
                label: vScale.getLabels()[index],
                value: '' + vScale.getLabelForValue(parsed[vScale.axis])
            };
        }
        parseObjectData(meta, data, start, count) {
            return _parseObjectDataRadialScale.bind(this)(meta, data, start, count);
        }
        update(mode) {
            const meta = this._cachedMeta;
            const line = meta.dataset;
            const points = meta.data || [];
            const labels = meta.iScale.getLabels();
            line.points = points;
            if (mode !== 'resize') {
                const options = this.resolveDatasetElementOptions(mode);
                if (!this.options.showLine) {
                    options.borderWidth = 0;
                }
                const properties = {
                    _loop: true,
                    _fullLoop: labels.length === points.length,
                    options
                };
                this.updateElement(line, undefined, properties, mode);
            }
            this.updateElements(points, 0, points.length, mode);
        }
        updateElements(points, start, count, mode) {
            const scale = this._cachedMeta.rScale;
            const reset = mode === 'reset';
            for(let i = start; i < start + count; i++){
                const point = points[i];
                const options = this.resolveDataElementOptions(i, point.active ? 'active' : mode);
                const pointPosition = scale.getPointPositionForValue(i, this.getParsed(i).r);
                const x = reset ? scale.xCenter : pointPosition.x;
                const y = reset ? scale.yCenter : pointPosition.y;
                const properties = {
                    x,
                    y,
                    angle: pointPosition.angle,
                    skip: isNaN(x) || isNaN(y),
                    options
                };
                this.updateElement(point, i, properties, mode);
            }
        }
    }

    class ScatterController extends DatasetController {
        static id = 'scatter';
     static defaults = {
            datasetElementType: false,
            dataElementType: 'point',
            showLine: false,
            fill: false
        };
     static overrides = {
            interaction: {
                mode: 'point'
            },
            scales: {
                x: {
                    type: 'linear'
                },
                y: {
                    type: 'linear'
                }
            }
        };
     getLabelAndValue(index) {
            const meta = this._cachedMeta;
            const labels = this.chart.data.labels || [];
            const { xScale , yScale  } = meta;
            const parsed = this.getParsed(index);
            const x = xScale.getLabelForValue(parsed.x);
            const y = yScale.getLabelForValue(parsed.y);
            return {
                label: labels[index] || '',
                value: '(' + x + ', ' + y + ')'
            };
        }
        update(mode) {
            const meta = this._cachedMeta;
            const { data: points = []  } = meta;
            const animationsDisabled = this.chart._animationsDisabled;
            let { start , count  } = _getStartAndCountOfVisiblePoints(meta, points, animationsDisabled);
            this._drawStart = start;
            this._drawCount = count;
            if (_scaleRangesChanged(meta)) {
                start = 0;
                count = points.length;
            }
            if (this.options.showLine) {
                const { dataset: line , _dataset  } = meta;
                line._chart = this.chart;
                line._datasetIndex = this.index;
                line._decimated = !!_dataset._decimated;
                line.points = points;
                const options = this.resolveDatasetElementOptions(mode);
                options.segment = this.options.segment;
                this.updateElement(line, undefined, {
                    animated: !animationsDisabled,
                    options
                }, mode);
            }
            this.updateElements(points, start, count, mode);
        }
        addElements() {
            const { showLine  } = this.options;
            if (!this.datasetElementType && showLine) {
                this.datasetElementType = this.chart.registry.getElement('line');
            }
            super.addElements();
        }
        updateElements(points, start, count, mode) {
            const reset = mode === 'reset';
            const { iScale , vScale , _stacked , _dataset  } = this._cachedMeta;
            const firstOpts = this.resolveDataElementOptions(start, mode);
            const sharedOptions = this.getSharedOptions(firstOpts);
            const includeOptions = this.includeOptions(mode, sharedOptions);
            const iAxis = iScale.axis;
            const vAxis = vScale.axis;
            const { spanGaps , segment  } = this.options;
            const maxGapLength = isNumber(spanGaps) ? spanGaps : Number.POSITIVE_INFINITY;
            const directUpdate = this.chart._animationsDisabled || reset || mode === 'none';
            let prevParsed = start > 0 && this.getParsed(start - 1);
            for(let i = start; i < start + count; ++i){
                const point = points[i];
                const parsed = this.getParsed(i);
                const properties = directUpdate ? point : {};
                const nullData = isNullOrUndef(parsed[vAxis]);
                const iPixel = properties[iAxis] = iScale.getPixelForValue(parsed[iAxis], i);
                const vPixel = properties[vAxis] = reset || nullData ? vScale.getBasePixel() : vScale.getPixelForValue(_stacked ? this.applyStack(vScale, parsed, _stacked) : parsed[vAxis], i);
                properties.skip = isNaN(iPixel) || isNaN(vPixel) || nullData;
                properties.stop = i > 0 && Math.abs(parsed[iAxis] - prevParsed[iAxis]) > maxGapLength;
                if (segment) {
                    properties.parsed = parsed;
                    properties.raw = _dataset.data[i];
                }
                if (includeOptions) {
                    properties.options = sharedOptions || this.resolveDataElementOptions(i, point.active ? 'active' : mode);
                }
                if (!directUpdate) {
                    this.updateElement(point, i, properties, mode);
                }
                prevParsed = parsed;
            }
            this.updateSharedOptions(sharedOptions, mode, firstOpts);
        }
     getMaxOverflow() {
            const meta = this._cachedMeta;
            const data = meta.data || [];
            if (!this.options.showLine) {
                let max = 0;
                for(let i = data.length - 1; i >= 0; --i){
                    max = Math.max(max, data[i].size(this.resolveDataElementOptions(i)) / 2);
                }
                return max > 0 && max;
            }
            const dataset = meta.dataset;
            const border = dataset.options && dataset.options.borderWidth || 0;
            if (!data.length) {
                return border;
            }
            const firstPoint = data[0].size(this.resolveDataElementOptions(0));
            const lastPoint = data[data.length - 1].size(this.resolveDataElementOptions(data.length - 1));
            return Math.max(border, firstPoint, lastPoint) / 2;
        }
    }

    var controllers = /*#__PURE__*/Object.freeze({
    __proto__: null,
    BarController: BarController,
    BubbleController: BubbleController,
    DoughnutController: DoughnutController,
    LineController: LineController,
    PolarAreaController: PolarAreaController,
    PieController: PieController,
    RadarController: RadarController,
    ScatterController: ScatterController
    });

    /**
     * @namespace Chart._adapters
     * @since 2.8.0
     * @private
     */ function abstract() {
        throw new Error('This method is not implemented: Check that a complete date adapter is provided.');
    }
    /**
     * Date adapter (current used by the time scale)
     * @namespace Chart._adapters._date
     * @memberof Chart._adapters
     * @private
     */ class DateAdapterBase {
        /**
       * Override default date adapter methods.
       * Accepts type parameter to define options type.
       * @example
       * Chart._adapters._date.override<{myAdapterOption: string}>({
       *   init() {
       *     console.log(this.options.myAdapterOption);
       *   }
       * })
       */ static override(members) {
            Object.assign(DateAdapterBase.prototype, members);
        }
        constructor(options){
            this.options = options || {};
        }
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        init() {}
        formats() {
            return abstract();
        }
        parse() {
            return abstract();
        }
        format() {
            return abstract();
        }
        add() {
            return abstract();
        }
        diff() {
            return abstract();
        }
        startOf() {
            return abstract();
        }
        endOf() {
            return abstract();
        }
    }
    var adapters = {
        _date: DateAdapterBase
    };

    function binarySearch(metaset, axis, value, intersect) {
        const { controller , data , _sorted  } = metaset;
        const iScale = controller._cachedMeta.iScale;
        if (iScale && axis === iScale.axis && axis !== 'r' && _sorted && data.length) {
            const lookupMethod = iScale._reversePixels ? _rlookupByKey : _lookupByKey;
            if (!intersect) {
                return lookupMethod(data, axis, value);
            } else if (controller._sharedOptions) {
                const el = data[0];
                const range = typeof el.getRange === 'function' && el.getRange(axis);
                if (range) {
                    const start = lookupMethod(data, axis, value - range);
                    const end = lookupMethod(data, axis, value + range);
                    return {
                        lo: start.lo,
                        hi: end.hi
                    };
                }
            }
        }
        return {
            lo: 0,
            hi: data.length - 1
        };
    }
     function evaluateInteractionItems(chart, axis, position, handler, intersect) {
        const metasets = chart.getSortedVisibleDatasetMetas();
        const value = position[axis];
        for(let i = 0, ilen = metasets.length; i < ilen; ++i){
            const { index , data  } = metasets[i];
            const { lo , hi  } = binarySearch(metasets[i], axis, value, intersect);
            for(let j = lo; j <= hi; ++j){
                const element = data[j];
                if (!element.skip) {
                    handler(element, index, j);
                }
            }
        }
    }
     function getDistanceMetricForAxis(axis) {
        const useX = axis.indexOf('x') !== -1;
        const useY = axis.indexOf('y') !== -1;
        return function(pt1, pt2) {
            const deltaX = useX ? Math.abs(pt1.x - pt2.x) : 0;
            const deltaY = useY ? Math.abs(pt1.y - pt2.y) : 0;
            return Math.sqrt(Math.pow(deltaX, 2) + Math.pow(deltaY, 2));
        };
    }
     function getIntersectItems(chart, position, axis, useFinalPosition, includeInvisible) {
        const items = [];
        if (!includeInvisible && !chart.isPointInArea(position)) {
            return items;
        }
        const evaluationFunc = function(element, datasetIndex, index) {
            if (!includeInvisible && !_isPointInArea(element, chart.chartArea, 0)) {
                return;
            }
            if (element.inRange(position.x, position.y, useFinalPosition)) {
                items.push({
                    element,
                    datasetIndex,
                    index
                });
            }
        };
        evaluateInteractionItems(chart, axis, position, evaluationFunc, true);
        return items;
    }
     function getNearestRadialItems(chart, position, axis, useFinalPosition) {
        let items = [];
        function evaluationFunc(element, datasetIndex, index) {
            const { startAngle , endAngle  } = element.getProps([
                'startAngle',
                'endAngle'
            ], useFinalPosition);
            const { angle  } = getAngleFromPoint(element, {
                x: position.x,
                y: position.y
            });
            if (_angleBetween(angle, startAngle, endAngle)) {
                items.push({
                    element,
                    datasetIndex,
                    index
                });
            }
        }
        evaluateInteractionItems(chart, axis, position, evaluationFunc);
        return items;
    }
     function getNearestCartesianItems(chart, position, axis, intersect, useFinalPosition, includeInvisible) {
        let items = [];
        const distanceMetric = getDistanceMetricForAxis(axis);
        let minDistance = Number.POSITIVE_INFINITY;
        function evaluationFunc(element, datasetIndex, index) {
            const inRange = element.inRange(position.x, position.y, useFinalPosition);
            if (intersect && !inRange) {
                return;
            }
            const center = element.getCenterPoint(useFinalPosition);
            const pointInArea = !!includeInvisible || chart.isPointInArea(center);
            if (!pointInArea && !inRange) {
                return;
            }
            const distance = distanceMetric(position, center);
            if (distance < minDistance) {
                items = [
                    {
                        element,
                        datasetIndex,
                        index
                    }
                ];
                minDistance = distance;
            } else if (distance === minDistance) {
                items.push({
                    element,
                    datasetIndex,
                    index
                });
            }
        }
        evaluateInteractionItems(chart, axis, position, evaluationFunc);
        return items;
    }
     function getNearestItems(chart, position, axis, intersect, useFinalPosition, includeInvisible) {
        if (!includeInvisible && !chart.isPointInArea(position)) {
            return [];
        }
        return axis === 'r' && !intersect ? getNearestRadialItems(chart, position, axis, useFinalPosition) : getNearestCartesianItems(chart, position, axis, intersect, useFinalPosition, includeInvisible);
    }
     function getAxisItems(chart, position, axis, intersect, useFinalPosition) {
        const items = [];
        const rangeMethod = axis === 'x' ? 'inXRange' : 'inYRange';
        let intersectsItem = false;
        evaluateInteractionItems(chart, axis, position, (element, datasetIndex, index)=>{
            if (element[rangeMethod](position[axis], useFinalPosition)) {
                items.push({
                    element,
                    datasetIndex,
                    index
                });
                intersectsItem = intersectsItem || element.inRange(position.x, position.y, useFinalPosition);
            }
        });
        if (intersect && !intersectsItem) {
            return [];
        }
        return items;
    }
     var Interaction = {
        evaluateInteractionItems,
        modes: {
     index (chart, e, options, useFinalPosition) {
                const position = getRelativePosition(e, chart);
                const axis = options.axis || 'x';
                const includeInvisible = options.includeInvisible || false;
                const items = options.intersect ? getIntersectItems(chart, position, axis, useFinalPosition, includeInvisible) : getNearestItems(chart, position, axis, false, useFinalPosition, includeInvisible);
                const elements = [];
                if (!items.length) {
                    return [];
                }
                chart.getSortedVisibleDatasetMetas().forEach((meta)=>{
                    const index = items[0].index;
                    const element = meta.data[index];
                    if (element && !element.skip) {
                        elements.push({
                            element,
                            datasetIndex: meta.index,
                            index
                        });
                    }
                });
                return elements;
            },
     dataset (chart, e, options, useFinalPosition) {
                const position = getRelativePosition(e, chart);
                const axis = options.axis || 'xy';
                const includeInvisible = options.includeInvisible || false;
                let items = options.intersect ? getIntersectItems(chart, position, axis, useFinalPosition, includeInvisible) : getNearestItems(chart, position, axis, false, useFinalPosition, includeInvisible);
                if (items.length > 0) {
                    const datasetIndex = items[0].datasetIndex;
                    const data = chart.getDatasetMeta(datasetIndex).data;
                    items = [];
                    for(let i = 0; i < data.length; ++i){
                        items.push({
                            element: data[i],
                            datasetIndex,
                            index: i
                        });
                    }
                }
                return items;
            },
     point (chart, e, options, useFinalPosition) {
                const position = getRelativePosition(e, chart);
                const axis = options.axis || 'xy';
                const includeInvisible = options.includeInvisible || false;
                return getIntersectItems(chart, position, axis, useFinalPosition, includeInvisible);
            },
     nearest (chart, e, options, useFinalPosition) {
                const position = getRelativePosition(e, chart);
                const axis = options.axis || 'xy';
                const includeInvisible = options.includeInvisible || false;
                return getNearestItems(chart, position, axis, options.intersect, useFinalPosition, includeInvisible);
            },
     x (chart, e, options, useFinalPosition) {
                const position = getRelativePosition(e, chart);
                return getAxisItems(chart, position, 'x', options.intersect, useFinalPosition);
            },
     y (chart, e, options, useFinalPosition) {
                const position = getRelativePosition(e, chart);
                return getAxisItems(chart, position, 'y', options.intersect, useFinalPosition);
            }
        }
    };

    const STATIC_POSITIONS = [
        'left',
        'top',
        'right',
        'bottom'
    ];
    function filterByPosition(array, position) {
        return array.filter((v)=>v.pos === position);
    }
    function filterDynamicPositionByAxis(array, axis) {
        return array.filter((v)=>STATIC_POSITIONS.indexOf(v.pos) === -1 && v.box.axis === axis);
    }
    function sortByWeight(array, reverse) {
        return array.sort((a, b)=>{
            const v0 = reverse ? b : a;
            const v1 = reverse ? a : b;
            return v0.weight === v1.weight ? v0.index - v1.index : v0.weight - v1.weight;
        });
    }
    function wrapBoxes(boxes) {
        const layoutBoxes = [];
        let i, ilen, box, pos, stack, stackWeight;
        for(i = 0, ilen = (boxes || []).length; i < ilen; ++i){
            box = boxes[i];
            ({ position: pos , options: { stack , stackWeight =1  }  } = box);
            layoutBoxes.push({
                index: i,
                box,
                pos,
                horizontal: box.isHorizontal(),
                weight: box.weight,
                stack: stack && pos + stack,
                stackWeight
            });
        }
        return layoutBoxes;
    }
    function buildStacks(layouts) {
        const stacks = {};
        for (const wrap of layouts){
            const { stack , pos , stackWeight  } = wrap;
            if (!stack || !STATIC_POSITIONS.includes(pos)) {
                continue;
            }
            const _stack = stacks[stack] || (stacks[stack] = {
                count: 0,
                placed: 0,
                weight: 0,
                size: 0
            });
            _stack.count++;
            _stack.weight += stackWeight;
        }
        return stacks;
    }
     function setLayoutDims(layouts, params) {
        const stacks = buildStacks(layouts);
        const { vBoxMaxWidth , hBoxMaxHeight  } = params;
        let i, ilen, layout;
        for(i = 0, ilen = layouts.length; i < ilen; ++i){
            layout = layouts[i];
            const { fullSize  } = layout.box;
            const stack = stacks[layout.stack];
            const factor = stack && layout.stackWeight / stack.weight;
            if (layout.horizontal) {
                layout.width = factor ? factor * vBoxMaxWidth : fullSize && params.availableWidth;
                layout.height = hBoxMaxHeight;
            } else {
                layout.width = vBoxMaxWidth;
                layout.height = factor ? factor * hBoxMaxHeight : fullSize && params.availableHeight;
            }
        }
        return stacks;
    }
    function buildLayoutBoxes(boxes) {
        const layoutBoxes = wrapBoxes(boxes);
        const fullSize = sortByWeight(layoutBoxes.filter((wrap)=>wrap.box.fullSize), true);
        const left = sortByWeight(filterByPosition(layoutBoxes, 'left'), true);
        const right = sortByWeight(filterByPosition(layoutBoxes, 'right'));
        const top = sortByWeight(filterByPosition(layoutBoxes, 'top'), true);
        const bottom = sortByWeight(filterByPosition(layoutBoxes, 'bottom'));
        const centerHorizontal = filterDynamicPositionByAxis(layoutBoxes, 'x');
        const centerVertical = filterDynamicPositionByAxis(layoutBoxes, 'y');
        return {
            fullSize,
            leftAndTop: left.concat(top),
            rightAndBottom: right.concat(centerVertical).concat(bottom).concat(centerHorizontal),
            chartArea: filterByPosition(layoutBoxes, 'chartArea'),
            vertical: left.concat(right).concat(centerVertical),
            horizontal: top.concat(bottom).concat(centerHorizontal)
        };
    }
    function getCombinedMax(maxPadding, chartArea, a, b) {
        return Math.max(maxPadding[a], chartArea[a]) + Math.max(maxPadding[b], chartArea[b]);
    }
    function updateMaxPadding(maxPadding, boxPadding) {
        maxPadding.top = Math.max(maxPadding.top, boxPadding.top);
        maxPadding.left = Math.max(maxPadding.left, boxPadding.left);
        maxPadding.bottom = Math.max(maxPadding.bottom, boxPadding.bottom);
        maxPadding.right = Math.max(maxPadding.right, boxPadding.right);
    }
    function updateDims(chartArea, params, layout, stacks) {
        const { pos , box  } = layout;
        const maxPadding = chartArea.maxPadding;
        if (!isObject(pos)) {
            if (layout.size) {
                chartArea[pos] -= layout.size;
            }
            const stack = stacks[layout.stack] || {
                size: 0,
                count: 1
            };
            stack.size = Math.max(stack.size, layout.horizontal ? box.height : box.width);
            layout.size = stack.size / stack.count;
            chartArea[pos] += layout.size;
        }
        if (box.getPadding) {
            updateMaxPadding(maxPadding, box.getPadding());
        }
        const newWidth = Math.max(0, params.outerWidth - getCombinedMax(maxPadding, chartArea, 'left', 'right'));
        const newHeight = Math.max(0, params.outerHeight - getCombinedMax(maxPadding, chartArea, 'top', 'bottom'));
        const widthChanged = newWidth !== chartArea.w;
        const heightChanged = newHeight !== chartArea.h;
        chartArea.w = newWidth;
        chartArea.h = newHeight;
        return layout.horizontal ? {
            same: widthChanged,
            other: heightChanged
        } : {
            same: heightChanged,
            other: widthChanged
        };
    }
    function handleMaxPadding(chartArea) {
        const maxPadding = chartArea.maxPadding;
        function updatePos(pos) {
            const change = Math.max(maxPadding[pos] - chartArea[pos], 0);
            chartArea[pos] += change;
            return change;
        }
        chartArea.y += updatePos('top');
        chartArea.x += updatePos('left');
        updatePos('right');
        updatePos('bottom');
    }
    function getMargins(horizontal, chartArea) {
        const maxPadding = chartArea.maxPadding;
        function marginForPositions(positions) {
            const margin = {
                left: 0,
                top: 0,
                right: 0,
                bottom: 0
            };
            positions.forEach((pos)=>{
                margin[pos] = Math.max(chartArea[pos], maxPadding[pos]);
            });
            return margin;
        }
        return horizontal ? marginForPositions([
            'left',
            'right'
        ]) : marginForPositions([
            'top',
            'bottom'
        ]);
    }
    function fitBoxes(boxes, chartArea, params, stacks) {
        const refitBoxes = [];
        let i, ilen, layout, box, refit, changed;
        for(i = 0, ilen = boxes.length, refit = 0; i < ilen; ++i){
            layout = boxes[i];
            box = layout.box;
            box.update(layout.width || chartArea.w, layout.height || chartArea.h, getMargins(layout.horizontal, chartArea));
            const { same , other  } = updateDims(chartArea, params, layout, stacks);
            refit |= same && refitBoxes.length;
            changed = changed || other;
            if (!box.fullSize) {
                refitBoxes.push(layout);
            }
        }
        return refit && fitBoxes(refitBoxes, chartArea, params, stacks) || changed;
    }
    function setBoxDims(box, left, top, width, height) {
        box.top = top;
        box.left = left;
        box.right = left + width;
        box.bottom = top + height;
        box.width = width;
        box.height = height;
    }
    function placeBoxes(boxes, chartArea, params, stacks) {
        const userPadding = params.padding;
        let { x , y  } = chartArea;
        for (const layout of boxes){
            const box = layout.box;
            const stack = stacks[layout.stack] || {
                count: 1,
                placed: 0,
                weight: 1
            };
            const weight = layout.stackWeight / stack.weight || 1;
            if (layout.horizontal) {
                const width = chartArea.w * weight;
                const height = stack.size || box.height;
                if (defined(stack.start)) {
                    y = stack.start;
                }
                if (box.fullSize) {
                    setBoxDims(box, userPadding.left, y, params.outerWidth - userPadding.right - userPadding.left, height);
                } else {
                    setBoxDims(box, chartArea.left + stack.placed, y, width, height);
                }
                stack.start = y;
                stack.placed += width;
                y = box.bottom;
            } else {
                const height1 = chartArea.h * weight;
                const width1 = stack.size || box.width;
                if (defined(stack.start)) {
                    x = stack.start;
                }
                if (box.fullSize) {
                    setBoxDims(box, x, userPadding.top, width1, params.outerHeight - userPadding.bottom - userPadding.top);
                } else {
                    setBoxDims(box, x, chartArea.top + stack.placed, width1, height1);
                }
                stack.start = x;
                stack.placed += height1;
                x = box.right;
            }
        }
        chartArea.x = x;
        chartArea.y = y;
    }
    var layouts = {
     addBox (chart, item) {
            if (!chart.boxes) {
                chart.boxes = [];
            }
            item.fullSize = item.fullSize || false;
            item.position = item.position || 'top';
            item.weight = item.weight || 0;
            item._layers = item._layers || function() {
                return [
                    {
                        z: 0,
                        draw (chartArea) {
                            item.draw(chartArea);
                        }
                    }
                ];
            };
            chart.boxes.push(item);
        },
     removeBox (chart, layoutItem) {
            const index = chart.boxes ? chart.boxes.indexOf(layoutItem) : -1;
            if (index !== -1) {
                chart.boxes.splice(index, 1);
            }
        },
     configure (chart, item, options) {
            item.fullSize = options.fullSize;
            item.position = options.position;
            item.weight = options.weight;
        },
     update (chart, width, height, minPadding) {
            if (!chart) {
                return;
            }
            const padding = toPadding(chart.options.layout.padding);
            const availableWidth = Math.max(width - padding.width, 0);
            const availableHeight = Math.max(height - padding.height, 0);
            const boxes = buildLayoutBoxes(chart.boxes);
            const verticalBoxes = boxes.vertical;
            const horizontalBoxes = boxes.horizontal;
            each(chart.boxes, (box)=>{
                if (typeof box.beforeLayout === 'function') {
                    box.beforeLayout();
                }
            });
            const visibleVerticalBoxCount = verticalBoxes.reduce((total, wrap)=>wrap.box.options && wrap.box.options.display === false ? total : total + 1, 0) || 1;
            const params = Object.freeze({
                outerWidth: width,
                outerHeight: height,
                padding,
                availableWidth,
                availableHeight,
                vBoxMaxWidth: availableWidth / 2 / visibleVerticalBoxCount,
                hBoxMaxHeight: availableHeight / 2
            });
            const maxPadding = Object.assign({}, padding);
            updateMaxPadding(maxPadding, toPadding(minPadding));
            const chartArea = Object.assign({
                maxPadding,
                w: availableWidth,
                h: availableHeight,
                x: padding.left,
                y: padding.top
            }, padding);
            const stacks = setLayoutDims(verticalBoxes.concat(horizontalBoxes), params);
            fitBoxes(boxes.fullSize, chartArea, params, stacks);
            fitBoxes(verticalBoxes, chartArea, params, stacks);
            if (fitBoxes(horizontalBoxes, chartArea, params, stacks)) {
                fitBoxes(verticalBoxes, chartArea, params, stacks);
            }
            handleMaxPadding(chartArea);
            placeBoxes(boxes.leftAndTop, chartArea, params, stacks);
            chartArea.x += chartArea.w;
            chartArea.y += chartArea.h;
            placeBoxes(boxes.rightAndBottom, chartArea, params, stacks);
            chart.chartArea = {
                left: chartArea.left,
                top: chartArea.top,
                right: chartArea.left + chartArea.w,
                bottom: chartArea.top + chartArea.h,
                height: chartArea.h,
                width: chartArea.w
            };
            each(boxes.chartArea, (layout)=>{
                const box = layout.box;
                Object.assign(box, chart.chartArea);
                box.update(chartArea.w, chartArea.h, {
                    left: 0,
                    top: 0,
                    right: 0,
                    bottom: 0
                });
            });
        }
    };

    class BasePlatform {
     acquireContext(canvas, aspectRatio) {}
     releaseContext(context) {
            return false;
        }
     addEventListener(chart, type, listener) {}
     removeEventListener(chart, type, listener) {}
     getDevicePixelRatio() {
            return 1;
        }
     getMaximumSize(element, width, height, aspectRatio) {
            width = Math.max(0, width || element.width);
            height = height || element.height;
            return {
                width,
                height: Math.max(0, aspectRatio ? Math.floor(width / aspectRatio) : height)
            };
        }
     isAttached(canvas) {
            return true;
        }
     updateConfig(config) {
        }
    }

    class BasicPlatform extends BasePlatform {
        acquireContext(item) {
            return item && item.getContext && item.getContext('2d') || null;
        }
        updateConfig(config) {
            config.options.animation = false;
        }
    }

    const EXPANDO_KEY = '$chartjs';
     const EVENT_TYPES = {
        touchstart: 'mousedown',
        touchmove: 'mousemove',
        touchend: 'mouseup',
        pointerenter: 'mouseenter',
        pointerdown: 'mousedown',
        pointermove: 'mousemove',
        pointerup: 'mouseup',
        pointerleave: 'mouseout',
        pointerout: 'mouseout'
    };
    const isNullOrEmpty = (value)=>value === null || value === '';
     function initCanvas(canvas, aspectRatio) {
        const style = canvas.style;
        const renderHeight = canvas.getAttribute('height');
        const renderWidth = canvas.getAttribute('width');
        canvas[EXPANDO_KEY] = {
            initial: {
                height: renderHeight,
                width: renderWidth,
                style: {
                    display: style.display,
                    height: style.height,
                    width: style.width
                }
            }
        };
        style.display = style.display || 'block';
        style.boxSizing = style.boxSizing || 'border-box';
        if (isNullOrEmpty(renderWidth)) {
            const displayWidth = readUsedSize(canvas, 'width');
            if (displayWidth !== undefined) {
                canvas.width = displayWidth;
            }
        }
        if (isNullOrEmpty(renderHeight)) {
            if (canvas.style.height === '') {
                canvas.height = canvas.width / (aspectRatio || 2);
            } else {
                const displayHeight = readUsedSize(canvas, 'height');
                if (displayHeight !== undefined) {
                    canvas.height = displayHeight;
                }
            }
        }
        return canvas;
    }
    const eventListenerOptions = supportsEventListenerOptions ? {
        passive: true
    } : false;
    function addListener(node, type, listener) {
        node.addEventListener(type, listener, eventListenerOptions);
    }
    function removeListener(chart, type, listener) {
        chart.canvas.removeEventListener(type, listener, eventListenerOptions);
    }
    function fromNativeEvent(event, chart) {
        const type = EVENT_TYPES[event.type] || event.type;
        const { x , y  } = getRelativePosition(event, chart);
        return {
            type,
            chart,
            native: event,
            x: x !== undefined ? x : null,
            y: y !== undefined ? y : null
        };
    }
    function nodeListContains(nodeList, canvas) {
        for (const node of nodeList){
            if (node === canvas || node.contains(canvas)) {
                return true;
            }
        }
    }
    function createAttachObserver(chart, type, listener) {
        const canvas = chart.canvas;
        const observer = new MutationObserver((entries)=>{
            let trigger = false;
            for (const entry of entries){
                trigger = trigger || nodeListContains(entry.addedNodes, canvas);
                trigger = trigger && !nodeListContains(entry.removedNodes, canvas);
            }
            if (trigger) {
                listener();
            }
        });
        observer.observe(document, {
            childList: true,
            subtree: true
        });
        return observer;
    }
    function createDetachObserver(chart, type, listener) {
        const canvas = chart.canvas;
        const observer = new MutationObserver((entries)=>{
            let trigger = false;
            for (const entry of entries){
                trigger = trigger || nodeListContains(entry.removedNodes, canvas);
                trigger = trigger && !nodeListContains(entry.addedNodes, canvas);
            }
            if (trigger) {
                listener();
            }
        });
        observer.observe(document, {
            childList: true,
            subtree: true
        });
        return observer;
    }
    const drpListeningCharts = new Map();
    let oldDevicePixelRatio = 0;
    function onWindowResize() {
        const dpr = window.devicePixelRatio;
        if (dpr === oldDevicePixelRatio) {
            return;
        }
        oldDevicePixelRatio = dpr;
        drpListeningCharts.forEach((resize, chart)=>{
            if (chart.currentDevicePixelRatio !== dpr) {
                resize();
            }
        });
    }
    function listenDevicePixelRatioChanges(chart, resize) {
        if (!drpListeningCharts.size) {
            window.addEventListener('resize', onWindowResize);
        }
        drpListeningCharts.set(chart, resize);
    }
    function unlistenDevicePixelRatioChanges(chart) {
        drpListeningCharts.delete(chart);
        if (!drpListeningCharts.size) {
            window.removeEventListener('resize', onWindowResize);
        }
    }
    function createResizeObserver(chart, type, listener) {
        const canvas = chart.canvas;
        const container = canvas && _getParentNode(canvas);
        if (!container) {
            return;
        }
        const resize = throttled((width, height)=>{
            const w = container.clientWidth;
            listener(width, height);
            if (w < container.clientWidth) {
                listener();
            }
        }, window);
        const observer = new ResizeObserver((entries)=>{
            const entry = entries[0];
            const width = entry.contentRect.width;
            const height = entry.contentRect.height;
            if (width === 0 && height === 0) {
                return;
            }
            resize(width, height);
        });
        observer.observe(container);
        listenDevicePixelRatioChanges(chart, resize);
        return observer;
    }
    function releaseObserver(chart, type, observer) {
        if (observer) {
            observer.disconnect();
        }
        if (type === 'resize') {
            unlistenDevicePixelRatioChanges(chart);
        }
    }
    function createProxyAndListen(chart, type, listener) {
        const canvas = chart.canvas;
        const proxy = throttled((event)=>{
            if (chart.ctx !== null) {
                listener(fromNativeEvent(event, chart));
            }
        }, chart);
        addListener(canvas, type, proxy);
        return proxy;
    }
     class DomPlatform extends BasePlatform {
     acquireContext(canvas, aspectRatio) {
            const context = canvas && canvas.getContext && canvas.getContext('2d');
            if (context && context.canvas === canvas) {
                initCanvas(canvas, aspectRatio);
                return context;
            }
            return null;
        }
     releaseContext(context) {
            const canvas = context.canvas;
            if (!canvas[EXPANDO_KEY]) {
                return false;
            }
            const initial = canvas[EXPANDO_KEY].initial;
            [
                'height',
                'width'
            ].forEach((prop)=>{
                const value = initial[prop];
                if (isNullOrUndef(value)) {
                    canvas.removeAttribute(prop);
                } else {
                    canvas.setAttribute(prop, value);
                }
            });
            const style = initial.style || {};
            Object.keys(style).forEach((key)=>{
                canvas.style[key] = style[key];
            });
            canvas.width = canvas.width;
            delete canvas[EXPANDO_KEY];
            return true;
        }
     addEventListener(chart, type, listener) {
            this.removeEventListener(chart, type);
            const proxies = chart.$proxies || (chart.$proxies = {});
            const handlers = {
                attach: createAttachObserver,
                detach: createDetachObserver,
                resize: createResizeObserver
            };
            const handler = handlers[type] || createProxyAndListen;
            proxies[type] = handler(chart, type, listener);
        }
     removeEventListener(chart, type) {
            const proxies = chart.$proxies || (chart.$proxies = {});
            const proxy = proxies[type];
            if (!proxy) {
                return;
            }
            const handlers = {
                attach: releaseObserver,
                detach: releaseObserver,
                resize: releaseObserver
            };
            const handler = handlers[type] || removeListener;
            handler(chart, type, proxy);
            proxies[type] = undefined;
        }
        getDevicePixelRatio() {
            return window.devicePixelRatio;
        }
     getMaximumSize(canvas, width, height, aspectRatio) {
            return getMaximumSize(canvas, width, height, aspectRatio);
        }
     isAttached(canvas) {
            const container = _getParentNode(canvas);
            return !!(container && container.isConnected);
        }
    }

    function _detectPlatform(canvas) {
        if (!_isDomSupported() || typeof OffscreenCanvas !== 'undefined' && canvas instanceof OffscreenCanvas) {
            return BasicPlatform;
        }
        return DomPlatform;
    }

    class Element$1 {
        static defaults = {};
        static defaultRoutes = undefined;
        active = false;
        tooltipPosition(useFinalPosition) {
            const { x , y  } = this.getProps([
                'x',
                'y'
            ], useFinalPosition);
            return {
                x,
                y
            };
        }
        hasValue() {
            return isNumber(this.x) && isNumber(this.y);
        }
        getProps(props, final) {
            const anims = this.$animations;
            if (!final || !anims) {
                // let's not create an object, if not needed
                return this;
            }
            const ret = {};
            props.forEach((prop)=>{
                ret[prop] = anims[prop] && anims[prop].active() ? anims[prop]._to : this[prop];
            });
            return ret;
        }
    }

    function autoSkip(scale, ticks) {
        const tickOpts = scale.options.ticks;
        const determinedMaxTicks = determineMaxTicks(scale);
        const ticksLimit = Math.min(tickOpts.maxTicksLimit || determinedMaxTicks, determinedMaxTicks);
        const majorIndices = tickOpts.major.enabled ? getMajorIndices(ticks) : [];
        const numMajorIndices = majorIndices.length;
        const first = majorIndices[0];
        const last = majorIndices[numMajorIndices - 1];
        const newTicks = [];
        if (numMajorIndices > ticksLimit) {
            skipMajors(ticks, newTicks, majorIndices, numMajorIndices / ticksLimit);
            return newTicks;
        }
        const spacing = calculateSpacing(majorIndices, ticks, ticksLimit);
        if (numMajorIndices > 0) {
            let i, ilen;
            const avgMajorSpacing = numMajorIndices > 1 ? Math.round((last - first) / (numMajorIndices - 1)) : null;
            skip(ticks, newTicks, spacing, isNullOrUndef(avgMajorSpacing) ? 0 : first - avgMajorSpacing, first);
            for(i = 0, ilen = numMajorIndices - 1; i < ilen; i++){
                skip(ticks, newTicks, spacing, majorIndices[i], majorIndices[i + 1]);
            }
            skip(ticks, newTicks, spacing, last, isNullOrUndef(avgMajorSpacing) ? ticks.length : last + avgMajorSpacing);
            return newTicks;
        }
        skip(ticks, newTicks, spacing);
        return newTicks;
    }
    function determineMaxTicks(scale) {
        const offset = scale.options.offset;
        const tickLength = scale._tickSize();
        const maxScale = scale._length / tickLength + (offset ? 0 : 1);
        const maxChart = scale._maxLength / tickLength;
        return Math.floor(Math.min(maxScale, maxChart));
    }
     function calculateSpacing(majorIndices, ticks, ticksLimit) {
        const evenMajorSpacing = getEvenSpacing(majorIndices);
        const spacing = ticks.length / ticksLimit;
        if (!evenMajorSpacing) {
            return Math.max(spacing, 1);
        }
        const factors = _factorize(evenMajorSpacing);
        for(let i = 0, ilen = factors.length - 1; i < ilen; i++){
            const factor = factors[i];
            if (factor > spacing) {
                return factor;
            }
        }
        return Math.max(spacing, 1);
    }
     function getMajorIndices(ticks) {
        const result = [];
        let i, ilen;
        for(i = 0, ilen = ticks.length; i < ilen; i++){
            if (ticks[i].major) {
                result.push(i);
            }
        }
        return result;
    }
     function skipMajors(ticks, newTicks, majorIndices, spacing) {
        let count = 0;
        let next = majorIndices[0];
        let i;
        spacing = Math.ceil(spacing);
        for(i = 0; i < ticks.length; i++){
            if (i === next) {
                newTicks.push(ticks[i]);
                count++;
                next = majorIndices[count * spacing];
            }
        }
    }
     function skip(ticks, newTicks, spacing, majorStart, majorEnd) {
        const start = valueOrDefault(majorStart, 0);
        const end = Math.min(valueOrDefault(majorEnd, ticks.length), ticks.length);
        let count = 0;
        let length, i, next;
        spacing = Math.ceil(spacing);
        if (majorEnd) {
            length = majorEnd - majorStart;
            spacing = length / Math.floor(length / spacing);
        }
        next = start;
        while(next < 0){
            count++;
            next = Math.round(start + count * spacing);
        }
        for(i = Math.max(start, 0); i < end; i++){
            if (i === next) {
                newTicks.push(ticks[i]);
                count++;
                next = Math.round(start + count * spacing);
            }
        }
    }
     function getEvenSpacing(arr) {
        const len = arr.length;
        let i, diff;
        if (len < 2) {
            return false;
        }
        for(diff = arr[0], i = 1; i < len; ++i){
            if (arr[i] - arr[i - 1] !== diff) {
                return false;
            }
        }
        return diff;
    }

    const reverseAlign = (align)=>align === 'left' ? 'right' : align === 'right' ? 'left' : align;
    const offsetFromEdge = (scale, edge, offset)=>edge === 'top' || edge === 'left' ? scale[edge] + offset : scale[edge] - offset;
     function sample(arr, numItems) {
        const result = [];
        const increment = arr.length / numItems;
        const len = arr.length;
        let i = 0;
        for(; i < len; i += increment){
            result.push(arr[Math.floor(i)]);
        }
        return result;
    }
     function getPixelForGridLine(scale, index, offsetGridLines) {
        const length = scale.ticks.length;
        const validIndex = Math.min(index, length - 1);
        const start = scale._startPixel;
        const end = scale._endPixel;
        const epsilon = 1e-6;
        let lineValue = scale.getPixelForTick(validIndex);
        let offset;
        if (offsetGridLines) {
            if (length === 1) {
                offset = Math.max(lineValue - start, end - lineValue);
            } else if (index === 0) {
                offset = (scale.getPixelForTick(1) - lineValue) / 2;
            } else {
                offset = (lineValue - scale.getPixelForTick(validIndex - 1)) / 2;
            }
            lineValue += validIndex < index ? offset : -offset;
            if (lineValue < start - epsilon || lineValue > end + epsilon) {
                return;
            }
        }
        return lineValue;
    }
     function garbageCollect(caches, length) {
        each(caches, (cache)=>{
            const gc = cache.gc;
            const gcLen = gc.length / 2;
            let i;
            if (gcLen > length) {
                for(i = 0; i < gcLen; ++i){
                    delete cache.data[gc[i]];
                }
                gc.splice(0, gcLen);
            }
        });
    }
     function getTickMarkLength(options) {
        return options.drawTicks ? options.tickLength : 0;
    }
     function getTitleHeight(options, fallback) {
        if (!options.display) {
            return 0;
        }
        const font = toFont(options.font, fallback);
        const padding = toPadding(options.padding);
        const lines = isArray(options.text) ? options.text.length : 1;
        return lines * font.lineHeight + padding.height;
    }
    function createScaleContext(parent, scale) {
        return createContext(parent, {
            scale,
            type: 'scale'
        });
    }
    function createTickContext(parent, index, tick) {
        return createContext(parent, {
            tick,
            index,
            type: 'tick'
        });
    }
    function titleAlign(align, position, reverse) {
        let ret = _toLeftRightCenter(align);
        if (reverse && position !== 'right' || !reverse && position === 'right') {
            ret = reverseAlign(ret);
        }
        return ret;
    }
    function titleArgs(scale, offset, position, align) {
        const { top , left , bottom , right , chart  } = scale;
        const { chartArea , scales  } = chart;
        let rotation = 0;
        let maxWidth, titleX, titleY;
        const height = bottom - top;
        const width = right - left;
        if (scale.isHorizontal()) {
            titleX = _alignStartEnd(align, left, right);
            if (isObject(position)) {
                const positionAxisID = Object.keys(position)[0];
                const value = position[positionAxisID];
                titleY = scales[positionAxisID].getPixelForValue(value) + height - offset;
            } else if (position === 'center') {
                titleY = (chartArea.bottom + chartArea.top) / 2 + height - offset;
            } else {
                titleY = offsetFromEdge(scale, position, offset);
            }
            maxWidth = right - left;
        } else {
            if (isObject(position)) {
                const positionAxisID1 = Object.keys(position)[0];
                const value1 = position[positionAxisID1];
                titleX = scales[positionAxisID1].getPixelForValue(value1) - width + offset;
            } else if (position === 'center') {
                titleX = (chartArea.left + chartArea.right) / 2 - width + offset;
            } else {
                titleX = offsetFromEdge(scale, position, offset);
            }
            titleY = _alignStartEnd(align, bottom, top);
            rotation = position === 'left' ? -HALF_PI : HALF_PI;
        }
        return {
            titleX,
            titleY,
            maxWidth,
            rotation
        };
    }
    class Scale extends Element$1 {
        constructor(cfg){
            super();
             this.id = cfg.id;
             this.type = cfg.type;
             this.options = undefined;
             this.ctx = cfg.ctx;
             this.chart = cfg.chart;
             this.top = undefined;
             this.bottom = undefined;
             this.left = undefined;
             this.right = undefined;
             this.width = undefined;
             this.height = undefined;
            this._margins = {
                left: 0,
                right: 0,
                top: 0,
                bottom: 0
            };
             this.maxWidth = undefined;
             this.maxHeight = undefined;
             this.paddingTop = undefined;
             this.paddingBottom = undefined;
             this.paddingLeft = undefined;
             this.paddingRight = undefined;
             this.axis = undefined;
             this.labelRotation = undefined;
            this.min = undefined;
            this.max = undefined;
            this._range = undefined;
             this.ticks = [];
             this._gridLineItems = null;
             this._labelItems = null;
             this._labelSizes = null;
            this._length = 0;
            this._maxLength = 0;
            this._longestTextCache = {};
             this._startPixel = undefined;
             this._endPixel = undefined;
            this._reversePixels = false;
            this._userMax = undefined;
            this._userMin = undefined;
            this._suggestedMax = undefined;
            this._suggestedMin = undefined;
            this._ticksLength = 0;
            this._borderValue = 0;
            this._cache = {};
            this._dataLimitsCached = false;
            this.$context = undefined;
        }
     init(options) {
            this.options = options.setContext(this.getContext());
            this.axis = options.axis;
            this._userMin = this.parse(options.min);
            this._userMax = this.parse(options.max);
            this._suggestedMin = this.parse(options.suggestedMin);
            this._suggestedMax = this.parse(options.suggestedMax);
        }
     parse(raw, index) {
            return raw;
        }
     getUserBounds() {
            let { _userMin , _userMax , _suggestedMin , _suggestedMax  } = this;
            _userMin = finiteOrDefault(_userMin, Number.POSITIVE_INFINITY);
            _userMax = finiteOrDefault(_userMax, Number.NEGATIVE_INFINITY);
            _suggestedMin = finiteOrDefault(_suggestedMin, Number.POSITIVE_INFINITY);
            _suggestedMax = finiteOrDefault(_suggestedMax, Number.NEGATIVE_INFINITY);
            return {
                min: finiteOrDefault(_userMin, _suggestedMin),
                max: finiteOrDefault(_userMax, _suggestedMax),
                minDefined: isNumberFinite(_userMin),
                maxDefined: isNumberFinite(_userMax)
            };
        }
     getMinMax(canStack) {
            let { min , max , minDefined , maxDefined  } = this.getUserBounds();
            let range;
            if (minDefined && maxDefined) {
                return {
                    min,
                    max
                };
            }
            const metas = this.getMatchingVisibleMetas();
            for(let i = 0, ilen = metas.length; i < ilen; ++i){
                range = metas[i].controller.getMinMax(this, canStack);
                if (!minDefined) {
                    min = Math.min(min, range.min);
                }
                if (!maxDefined) {
                    max = Math.max(max, range.max);
                }
            }
            min = maxDefined && min > max ? max : min;
            max = minDefined && min > max ? min : max;
            return {
                min: finiteOrDefault(min, finiteOrDefault(max, min)),
                max: finiteOrDefault(max, finiteOrDefault(min, max))
            };
        }
     getPadding() {
            return {
                left: this.paddingLeft || 0,
                top: this.paddingTop || 0,
                right: this.paddingRight || 0,
                bottom: this.paddingBottom || 0
            };
        }
     getTicks() {
            return this.ticks;
        }
     getLabels() {
            const data = this.chart.data;
            return this.options.labels || (this.isHorizontal() ? data.xLabels : data.yLabels) || data.labels || [];
        }
     getLabelItems(chartArea = this.chart.chartArea) {
            const items = this._labelItems || (this._labelItems = this._computeLabelItems(chartArea));
            return items;
        }
        beforeLayout() {
            this._cache = {};
            this._dataLimitsCached = false;
        }
        beforeUpdate() {
            callback(this.options.beforeUpdate, [
                this
            ]);
        }
     update(maxWidth, maxHeight, margins) {
            const { beginAtZero , grace , ticks: tickOpts  } = this.options;
            const sampleSize = tickOpts.sampleSize;
            this.beforeUpdate();
            this.maxWidth = maxWidth;
            this.maxHeight = maxHeight;
            this._margins = margins = Object.assign({
                left: 0,
                right: 0,
                top: 0,
                bottom: 0
            }, margins);
            this.ticks = null;
            this._labelSizes = null;
            this._gridLineItems = null;
            this._labelItems = null;
            this.beforeSetDimensions();
            this.setDimensions();
            this.afterSetDimensions();
            this._maxLength = this.isHorizontal() ? this.width + margins.left + margins.right : this.height + margins.top + margins.bottom;
            if (!this._dataLimitsCached) {
                this.beforeDataLimits();
                this.determineDataLimits();
                this.afterDataLimits();
                this._range = _addGrace(this, grace, beginAtZero);
                this._dataLimitsCached = true;
            }
            this.beforeBuildTicks();
            this.ticks = this.buildTicks() || [];
            this.afterBuildTicks();
            const samplingEnabled = sampleSize < this.ticks.length;
            this._convertTicksToLabels(samplingEnabled ? sample(this.ticks, sampleSize) : this.ticks);
            this.configure();
            this.beforeCalculateLabelRotation();
            this.calculateLabelRotation();
            this.afterCalculateLabelRotation();
            if (tickOpts.display && (tickOpts.autoSkip || tickOpts.source === 'auto')) {
                this.ticks = autoSkip(this, this.ticks);
                this._labelSizes = null;
                this.afterAutoSkip();
            }
            if (samplingEnabled) {
                this._convertTicksToLabels(this.ticks);
            }
            this.beforeFit();
            this.fit();
            this.afterFit();
            this.afterUpdate();
        }
     configure() {
            let reversePixels = this.options.reverse;
            let startPixel, endPixel;
            if (this.isHorizontal()) {
                startPixel = this.left;
                endPixel = this.right;
            } else {
                startPixel = this.top;
                endPixel = this.bottom;
                reversePixels = !reversePixels;
            }
            this._startPixel = startPixel;
            this._endPixel = endPixel;
            this._reversePixels = reversePixels;
            this._length = endPixel - startPixel;
            this._alignToPixels = this.options.alignToPixels;
        }
        afterUpdate() {
            callback(this.options.afterUpdate, [
                this
            ]);
        }
        beforeSetDimensions() {
            callback(this.options.beforeSetDimensions, [
                this
            ]);
        }
        setDimensions() {
            if (this.isHorizontal()) {
                this.width = this.maxWidth;
                this.left = 0;
                this.right = this.width;
            } else {
                this.height = this.maxHeight;
                this.top = 0;
                this.bottom = this.height;
            }
            this.paddingLeft = 0;
            this.paddingTop = 0;
            this.paddingRight = 0;
            this.paddingBottom = 0;
        }
        afterSetDimensions() {
            callback(this.options.afterSetDimensions, [
                this
            ]);
        }
        _callHooks(name) {
            this.chart.notifyPlugins(name, this.getContext());
            callback(this.options[name], [
                this
            ]);
        }
        beforeDataLimits() {
            this._callHooks('beforeDataLimits');
        }
        determineDataLimits() {}
        afterDataLimits() {
            this._callHooks('afterDataLimits');
        }
        beforeBuildTicks() {
            this._callHooks('beforeBuildTicks');
        }
     buildTicks() {
            return [];
        }
        afterBuildTicks() {
            this._callHooks('afterBuildTicks');
        }
        beforeTickToLabelConversion() {
            callback(this.options.beforeTickToLabelConversion, [
                this
            ]);
        }
     generateTickLabels(ticks) {
            const tickOpts = this.options.ticks;
            let i, ilen, tick;
            for(i = 0, ilen = ticks.length; i < ilen; i++){
                tick = ticks[i];
                tick.label = callback(tickOpts.callback, [
                    tick.value,
                    i,
                    ticks
                ], this);
            }
        }
        afterTickToLabelConversion() {
            callback(this.options.afterTickToLabelConversion, [
                this
            ]);
        }
        beforeCalculateLabelRotation() {
            callback(this.options.beforeCalculateLabelRotation, [
                this
            ]);
        }
        calculateLabelRotation() {
            const options = this.options;
            const tickOpts = options.ticks;
            const numTicks = this.ticks.length;
            const minRotation = tickOpts.minRotation || 0;
            const maxRotation = tickOpts.maxRotation;
            let labelRotation = minRotation;
            let tickWidth, maxHeight, maxLabelDiagonal;
            if (!this._isVisible() || !tickOpts.display || minRotation >= maxRotation || numTicks <= 1 || !this.isHorizontal()) {
                this.labelRotation = minRotation;
                return;
            }
            const labelSizes = this._getLabelSizes();
            const maxLabelWidth = labelSizes.widest.width;
            const maxLabelHeight = labelSizes.highest.height;
            const maxWidth = _limitValue(this.chart.width - maxLabelWidth, 0, this.maxWidth);
            tickWidth = options.offset ? this.maxWidth / numTicks : maxWidth / (numTicks - 1);
            if (maxLabelWidth + 6 > tickWidth) {
                tickWidth = maxWidth / (numTicks - (options.offset ? 0.5 : 1));
                maxHeight = this.maxHeight - getTickMarkLength(options.grid) - tickOpts.padding - getTitleHeight(options.title, this.chart.options.font);
                maxLabelDiagonal = Math.sqrt(maxLabelWidth * maxLabelWidth + maxLabelHeight * maxLabelHeight);
                labelRotation = toDegrees(Math.min(Math.asin(_limitValue((labelSizes.highest.height + 6) / tickWidth, -1, 1)), Math.asin(_limitValue(maxHeight / maxLabelDiagonal, -1, 1)) - Math.asin(_limitValue(maxLabelHeight / maxLabelDiagonal, -1, 1))));
                labelRotation = Math.max(minRotation, Math.min(maxRotation, labelRotation));
            }
            this.labelRotation = labelRotation;
        }
        afterCalculateLabelRotation() {
            callback(this.options.afterCalculateLabelRotation, [
                this
            ]);
        }
        afterAutoSkip() {}
        beforeFit() {
            callback(this.options.beforeFit, [
                this
            ]);
        }
        fit() {
            const minSize = {
                width: 0,
                height: 0
            };
            const { chart , options: { ticks: tickOpts , title: titleOpts , grid: gridOpts  }  } = this;
            const display = this._isVisible();
            const isHorizontal = this.isHorizontal();
            if (display) {
                const titleHeight = getTitleHeight(titleOpts, chart.options.font);
                if (isHorizontal) {
                    minSize.width = this.maxWidth;
                    minSize.height = getTickMarkLength(gridOpts) + titleHeight;
                } else {
                    minSize.height = this.maxHeight;
                    minSize.width = getTickMarkLength(gridOpts) + titleHeight;
                }
                if (tickOpts.display && this.ticks.length) {
                    const { first , last , widest , highest  } = this._getLabelSizes();
                    const tickPadding = tickOpts.padding * 2;
                    const angleRadians = toRadians(this.labelRotation);
                    const cos = Math.cos(angleRadians);
                    const sin = Math.sin(angleRadians);
                    if (isHorizontal) {
                        const labelHeight = tickOpts.mirror ? 0 : sin * widest.width + cos * highest.height;
                        minSize.height = Math.min(this.maxHeight, minSize.height + labelHeight + tickPadding);
                    } else {
                        const labelWidth = tickOpts.mirror ? 0 : cos * widest.width + sin * highest.height;
                        minSize.width = Math.min(this.maxWidth, minSize.width + labelWidth + tickPadding);
                    }
                    this._calculatePadding(first, last, sin, cos);
                }
            }
            this._handleMargins();
            if (isHorizontal) {
                this.width = this._length = chart.width - this._margins.left - this._margins.right;
                this.height = minSize.height;
            } else {
                this.width = minSize.width;
                this.height = this._length = chart.height - this._margins.top - this._margins.bottom;
            }
        }
        _calculatePadding(first, last, sin, cos) {
            const { ticks: { align , padding  } , position  } = this.options;
            const isRotated = this.labelRotation !== 0;
            const labelsBelowTicks = position !== 'top' && this.axis === 'x';
            if (this.isHorizontal()) {
                const offsetLeft = this.getPixelForTick(0) - this.left;
                const offsetRight = this.right - this.getPixelForTick(this.ticks.length - 1);
                let paddingLeft = 0;
                let paddingRight = 0;
                if (isRotated) {
                    if (labelsBelowTicks) {
                        paddingLeft = cos * first.width;
                        paddingRight = sin * last.height;
                    } else {
                        paddingLeft = sin * first.height;
                        paddingRight = cos * last.width;
                    }
                } else if (align === 'start') {
                    paddingRight = last.width;
                } else if (align === 'end') {
                    paddingLeft = first.width;
                } else if (align !== 'inner') {
                    paddingLeft = first.width / 2;
                    paddingRight = last.width / 2;
                }
                this.paddingLeft = Math.max((paddingLeft - offsetLeft + padding) * this.width / (this.width - offsetLeft), 0);
                this.paddingRight = Math.max((paddingRight - offsetRight + padding) * this.width / (this.width - offsetRight), 0);
            } else {
                let paddingTop = last.height / 2;
                let paddingBottom = first.height / 2;
                if (align === 'start') {
                    paddingTop = 0;
                    paddingBottom = first.height;
                } else if (align === 'end') {
                    paddingTop = last.height;
                    paddingBottom = 0;
                }
                this.paddingTop = paddingTop + padding;
                this.paddingBottom = paddingBottom + padding;
            }
        }
     _handleMargins() {
            if (this._margins) {
                this._margins.left = Math.max(this.paddingLeft, this._margins.left);
                this._margins.top = Math.max(this.paddingTop, this._margins.top);
                this._margins.right = Math.max(this.paddingRight, this._margins.right);
                this._margins.bottom = Math.max(this.paddingBottom, this._margins.bottom);
            }
        }
        afterFit() {
            callback(this.options.afterFit, [
                this
            ]);
        }
     isHorizontal() {
            const { axis , position  } = this.options;
            return position === 'top' || position === 'bottom' || axis === 'x';
        }
     isFullSize() {
            return this.options.fullSize;
        }
     _convertTicksToLabels(ticks) {
            this.beforeTickToLabelConversion();
            this.generateTickLabels(ticks);
            let i, ilen;
            for(i = 0, ilen = ticks.length; i < ilen; i++){
                if (isNullOrUndef(ticks[i].label)) {
                    ticks.splice(i, 1);
                    ilen--;
                    i--;
                }
            }
            this.afterTickToLabelConversion();
        }
     _getLabelSizes() {
            let labelSizes = this._labelSizes;
            if (!labelSizes) {
                const sampleSize = this.options.ticks.sampleSize;
                let ticks = this.ticks;
                if (sampleSize < ticks.length) {
                    ticks = sample(ticks, sampleSize);
                }
                this._labelSizes = labelSizes = this._computeLabelSizes(ticks, ticks.length);
            }
            return labelSizes;
        }
     _computeLabelSizes(ticks, length) {
            const { ctx , _longestTextCache: caches  } = this;
            const widths = [];
            const heights = [];
            let widestLabelSize = 0;
            let highestLabelSize = 0;
            let i, j, jlen, label, tickFont, fontString, cache, lineHeight, width, height, nestedLabel;
            for(i = 0; i < length; ++i){
                label = ticks[i].label;
                tickFont = this._resolveTickFontOptions(i);
                ctx.font = fontString = tickFont.string;
                cache = caches[fontString] = caches[fontString] || {
                    data: {},
                    gc: []
                };
                lineHeight = tickFont.lineHeight;
                width = height = 0;
                if (!isNullOrUndef(label) && !isArray(label)) {
                    width = _measureText(ctx, cache.data, cache.gc, width, label);
                    height = lineHeight;
                } else if (isArray(label)) {
                    for(j = 0, jlen = label.length; j < jlen; ++j){
                        nestedLabel = label[j];
                        if (!isNullOrUndef(nestedLabel) && !isArray(nestedLabel)) {
                            width = _measureText(ctx, cache.data, cache.gc, width, nestedLabel);
                            height += lineHeight;
                        }
                    }
                }
                widths.push(width);
                heights.push(height);
                widestLabelSize = Math.max(width, widestLabelSize);
                highestLabelSize = Math.max(height, highestLabelSize);
            }
            garbageCollect(caches, length);
            const widest = widths.indexOf(widestLabelSize);
            const highest = heights.indexOf(highestLabelSize);
            const valueAt = (idx)=>({
                    width: widths[idx] || 0,
                    height: heights[idx] || 0
                });
            return {
                first: valueAt(0),
                last: valueAt(length - 1),
                widest: valueAt(widest),
                highest: valueAt(highest),
                widths,
                heights
            };
        }
     getLabelForValue(value) {
            return value;
        }
     getPixelForValue(value, index) {
            return NaN;
        }
     getValueForPixel(pixel) {}
     getPixelForTick(index) {
            const ticks = this.ticks;
            if (index < 0 || index > ticks.length - 1) {
                return null;
            }
            return this.getPixelForValue(ticks[index].value);
        }
     getPixelForDecimal(decimal) {
            if (this._reversePixels) {
                decimal = 1 - decimal;
            }
            const pixel = this._startPixel + decimal * this._length;
            return _int16Range(this._alignToPixels ? _alignPixel(this.chart, pixel, 0) : pixel);
        }
     getDecimalForPixel(pixel) {
            const decimal = (pixel - this._startPixel) / this._length;
            return this._reversePixels ? 1 - decimal : decimal;
        }
     getBasePixel() {
            return this.getPixelForValue(this.getBaseValue());
        }
     getBaseValue() {
            const { min , max  } = this;
            return min < 0 && max < 0 ? max : min > 0 && max > 0 ? min : 0;
        }
     getContext(index) {
            const ticks = this.ticks || [];
            if (index >= 0 && index < ticks.length) {
                const tick = ticks[index];
                return tick.$context || (tick.$context = createTickContext(this.getContext(), index, tick));
            }
            return this.$context || (this.$context = createScaleContext(this.chart.getContext(), this));
        }
     _tickSize() {
            const optionTicks = this.options.ticks;
            const rot = toRadians(this.labelRotation);
            const cos = Math.abs(Math.cos(rot));
            const sin = Math.abs(Math.sin(rot));
            const labelSizes = this._getLabelSizes();
            const padding = optionTicks.autoSkipPadding || 0;
            const w = labelSizes ? labelSizes.widest.width + padding : 0;
            const h = labelSizes ? labelSizes.highest.height + padding : 0;
            return this.isHorizontal() ? h * cos > w * sin ? w / cos : h / sin : h * sin < w * cos ? h / cos : w / sin;
        }
     _isVisible() {
            const display = this.options.display;
            if (display !== 'auto') {
                return !!display;
            }
            return this.getMatchingVisibleMetas().length > 0;
        }
     _computeGridLineItems(chartArea) {
            const axis = this.axis;
            const chart = this.chart;
            const options = this.options;
            const { grid , position , border  } = options;
            const offset = grid.offset;
            const isHorizontal = this.isHorizontal();
            const ticks = this.ticks;
            const ticksLength = ticks.length + (offset ? 1 : 0);
            const tl = getTickMarkLength(grid);
            const items = [];
            const borderOpts = border.setContext(this.getContext());
            const axisWidth = borderOpts.display ? borderOpts.width : 0;
            const axisHalfWidth = axisWidth / 2;
            const alignBorderValue = function(pixel) {
                return _alignPixel(chart, pixel, axisWidth);
            };
            let borderValue, i, lineValue, alignedLineValue;
            let tx1, ty1, tx2, ty2, x1, y1, x2, y2;
            if (position === 'top') {
                borderValue = alignBorderValue(this.bottom);
                ty1 = this.bottom - tl;
                ty2 = borderValue - axisHalfWidth;
                y1 = alignBorderValue(chartArea.top) + axisHalfWidth;
                y2 = chartArea.bottom;
            } else if (position === 'bottom') {
                borderValue = alignBorderValue(this.top);
                y1 = chartArea.top;
                y2 = alignBorderValue(chartArea.bottom) - axisHalfWidth;
                ty1 = borderValue + axisHalfWidth;
                ty2 = this.top + tl;
            } else if (position === 'left') {
                borderValue = alignBorderValue(this.right);
                tx1 = this.right - tl;
                tx2 = borderValue - axisHalfWidth;
                x1 = alignBorderValue(chartArea.left) + axisHalfWidth;
                x2 = chartArea.right;
            } else if (position === 'right') {
                borderValue = alignBorderValue(this.left);
                x1 = chartArea.left;
                x2 = alignBorderValue(chartArea.right) - axisHalfWidth;
                tx1 = borderValue + axisHalfWidth;
                tx2 = this.left + tl;
            } else if (axis === 'x') {
                if (position === 'center') {
                    borderValue = alignBorderValue((chartArea.top + chartArea.bottom) / 2 + 0.5);
                } else if (isObject(position)) {
                    const positionAxisID = Object.keys(position)[0];
                    const value = position[positionAxisID];
                    borderValue = alignBorderValue(this.chart.scales[positionAxisID].getPixelForValue(value));
                }
                y1 = chartArea.top;
                y2 = chartArea.bottom;
                ty1 = borderValue + axisHalfWidth;
                ty2 = ty1 + tl;
            } else if (axis === 'y') {
                if (position === 'center') {
                    borderValue = alignBorderValue((chartArea.left + chartArea.right) / 2);
                } else if (isObject(position)) {
                    const positionAxisID1 = Object.keys(position)[0];
                    const value1 = position[positionAxisID1];
                    borderValue = alignBorderValue(this.chart.scales[positionAxisID1].getPixelForValue(value1));
                }
                tx1 = borderValue - axisHalfWidth;
                tx2 = tx1 - tl;
                x1 = chartArea.left;
                x2 = chartArea.right;
            }
            const limit = valueOrDefault(options.ticks.maxTicksLimit, ticksLength);
            const step = Math.max(1, Math.ceil(ticksLength / limit));
            for(i = 0; i < ticksLength; i += step){
                const context = this.getContext(i);
                const optsAtIndex = grid.setContext(context);
                const optsAtIndexBorder = border.setContext(context);
                const lineWidth = optsAtIndex.lineWidth;
                const lineColor = optsAtIndex.color;
                const borderDash = optsAtIndexBorder.dash || [];
                const borderDashOffset = optsAtIndexBorder.dashOffset;
                const tickWidth = optsAtIndex.tickWidth;
                const tickColor = optsAtIndex.tickColor;
                const tickBorderDash = optsAtIndex.tickBorderDash || [];
                const tickBorderDashOffset = optsAtIndex.tickBorderDashOffset;
                lineValue = getPixelForGridLine(this, i, offset);
                if (lineValue === undefined) {
                    continue;
                }
                alignedLineValue = _alignPixel(chart, lineValue, lineWidth);
                if (isHorizontal) {
                    tx1 = tx2 = x1 = x2 = alignedLineValue;
                } else {
                    ty1 = ty2 = y1 = y2 = alignedLineValue;
                }
                items.push({
                    tx1,
                    ty1,
                    tx2,
                    ty2,
                    x1,
                    y1,
                    x2,
                    y2,
                    width: lineWidth,
                    color: lineColor,
                    borderDash,
                    borderDashOffset,
                    tickWidth,
                    tickColor,
                    tickBorderDash,
                    tickBorderDashOffset
                });
            }
            this._ticksLength = ticksLength;
            this._borderValue = borderValue;
            return items;
        }
     _computeLabelItems(chartArea) {
            const axis = this.axis;
            const options = this.options;
            const { position , ticks: optionTicks  } = options;
            const isHorizontal = this.isHorizontal();
            const ticks = this.ticks;
            const { align , crossAlign , padding , mirror  } = optionTicks;
            const tl = getTickMarkLength(options.grid);
            const tickAndPadding = tl + padding;
            const hTickAndPadding = mirror ? -padding : tickAndPadding;
            const rotation = -toRadians(this.labelRotation);
            const items = [];
            let i, ilen, tick, label, x, y, textAlign, pixel, font, lineHeight, lineCount, textOffset;
            let textBaseline = 'middle';
            if (position === 'top') {
                y = this.bottom - hTickAndPadding;
                textAlign = this._getXAxisLabelAlignment();
            } else if (position === 'bottom') {
                y = this.top + hTickAndPadding;
                textAlign = this._getXAxisLabelAlignment();
            } else if (position === 'left') {
                const ret = this._getYAxisLabelAlignment(tl);
                textAlign = ret.textAlign;
                x = ret.x;
            } else if (position === 'right') {
                const ret1 = this._getYAxisLabelAlignment(tl);
                textAlign = ret1.textAlign;
                x = ret1.x;
            } else if (axis === 'x') {
                if (position === 'center') {
                    y = (chartArea.top + chartArea.bottom) / 2 + tickAndPadding;
                } else if (isObject(position)) {
                    const positionAxisID = Object.keys(position)[0];
                    const value = position[positionAxisID];
                    y = this.chart.scales[positionAxisID].getPixelForValue(value) + tickAndPadding;
                }
                textAlign = this._getXAxisLabelAlignment();
            } else if (axis === 'y') {
                if (position === 'center') {
                    x = (chartArea.left + chartArea.right) / 2 - tickAndPadding;
                } else if (isObject(position)) {
                    const positionAxisID1 = Object.keys(position)[0];
                    const value1 = position[positionAxisID1];
                    x = this.chart.scales[positionAxisID1].getPixelForValue(value1);
                }
                textAlign = this._getYAxisLabelAlignment(tl).textAlign;
            }
            if (axis === 'y') {
                if (align === 'start') {
                    textBaseline = 'top';
                } else if (align === 'end') {
                    textBaseline = 'bottom';
                }
            }
            const labelSizes = this._getLabelSizes();
            for(i = 0, ilen = ticks.length; i < ilen; ++i){
                tick = ticks[i];
                label = tick.label;
                const optsAtIndex = optionTicks.setContext(this.getContext(i));
                pixel = this.getPixelForTick(i) + optionTicks.labelOffset;
                font = this._resolveTickFontOptions(i);
                lineHeight = font.lineHeight;
                lineCount = isArray(label) ? label.length : 1;
                const halfCount = lineCount / 2;
                const color = optsAtIndex.color;
                const strokeColor = optsAtIndex.textStrokeColor;
                const strokeWidth = optsAtIndex.textStrokeWidth;
                let tickTextAlign = textAlign;
                if (isHorizontal) {
                    x = pixel;
                    if (textAlign === 'inner') {
                        if (i === ilen - 1) {
                            tickTextAlign = !this.options.reverse ? 'right' : 'left';
                        } else if (i === 0) {
                            tickTextAlign = !this.options.reverse ? 'left' : 'right';
                        } else {
                            tickTextAlign = 'center';
                        }
                    }
                    if (position === 'top') {
                        if (crossAlign === 'near' || rotation !== 0) {
                            textOffset = -lineCount * lineHeight + lineHeight / 2;
                        } else if (crossAlign === 'center') {
                            textOffset = -labelSizes.highest.height / 2 - halfCount * lineHeight + lineHeight;
                        } else {
                            textOffset = -labelSizes.highest.height + lineHeight / 2;
                        }
                    } else {
                        if (crossAlign === 'near' || rotation !== 0) {
                            textOffset = lineHeight / 2;
                        } else if (crossAlign === 'center') {
                            textOffset = labelSizes.highest.height / 2 - halfCount * lineHeight;
                        } else {
                            textOffset = labelSizes.highest.height - lineCount * lineHeight;
                        }
                    }
                    if (mirror) {
                        textOffset *= -1;
                    }
                    if (rotation !== 0 && !optsAtIndex.showLabelBackdrop) {
                        x += lineHeight / 2 * Math.sin(rotation);
                    }
                } else {
                    y = pixel;
                    textOffset = (1 - lineCount) * lineHeight / 2;
                }
                let backdrop;
                if (optsAtIndex.showLabelBackdrop) {
                    const labelPadding = toPadding(optsAtIndex.backdropPadding);
                    const height = labelSizes.heights[i];
                    const width = labelSizes.widths[i];
                    let top = textOffset - labelPadding.top;
                    let left = 0 - labelPadding.left;
                    switch(textBaseline){
                        case 'middle':
                            top -= height / 2;
                            break;
                        case 'bottom':
                            top -= height;
                            break;
                    }
                    switch(textAlign){
                        case 'center':
                            left -= width / 2;
                            break;
                        case 'right':
                            left -= width;
                            break;
                    }
                    backdrop = {
                        left,
                        top,
                        width: width + labelPadding.width,
                        height: height + labelPadding.height,
                        color: optsAtIndex.backdropColor
                    };
                }
                items.push({
                    label,
                    font,
                    textOffset,
                    options: {
                        rotation,
                        color,
                        strokeColor,
                        strokeWidth,
                        textAlign: tickTextAlign,
                        textBaseline,
                        translation: [
                            x,
                            y
                        ],
                        backdrop
                    }
                });
            }
            return items;
        }
        _getXAxisLabelAlignment() {
            const { position , ticks  } = this.options;
            const rotation = -toRadians(this.labelRotation);
            if (rotation) {
                return position === 'top' ? 'left' : 'right';
            }
            let align = 'center';
            if (ticks.align === 'start') {
                align = 'left';
            } else if (ticks.align === 'end') {
                align = 'right';
            } else if (ticks.align === 'inner') {
                align = 'inner';
            }
            return align;
        }
        _getYAxisLabelAlignment(tl) {
            const { position , ticks: { crossAlign , mirror , padding  }  } = this.options;
            const labelSizes = this._getLabelSizes();
            const tickAndPadding = tl + padding;
            const widest = labelSizes.widest.width;
            let textAlign;
            let x;
            if (position === 'left') {
                if (mirror) {
                    x = this.right + padding;
                    if (crossAlign === 'near') {
                        textAlign = 'left';
                    } else if (crossAlign === 'center') {
                        textAlign = 'center';
                        x += widest / 2;
                    } else {
                        textAlign = 'right';
                        x += widest;
                    }
                } else {
                    x = this.right - tickAndPadding;
                    if (crossAlign === 'near') {
                        textAlign = 'right';
                    } else if (crossAlign === 'center') {
                        textAlign = 'center';
                        x -= widest / 2;
                    } else {
                        textAlign = 'left';
                        x = this.left;
                    }
                }
            } else if (position === 'right') {
                if (mirror) {
                    x = this.left + padding;
                    if (crossAlign === 'near') {
                        textAlign = 'right';
                    } else if (crossAlign === 'center') {
                        textAlign = 'center';
                        x -= widest / 2;
                    } else {
                        textAlign = 'left';
                        x -= widest;
                    }
                } else {
                    x = this.left + tickAndPadding;
                    if (crossAlign === 'near') {
                        textAlign = 'left';
                    } else if (crossAlign === 'center') {
                        textAlign = 'center';
                        x += widest / 2;
                    } else {
                        textAlign = 'right';
                        x = this.right;
                    }
                }
            } else {
                textAlign = 'right';
            }
            return {
                textAlign,
                x
            };
        }
     _computeLabelArea() {
            if (this.options.ticks.mirror) {
                return;
            }
            const chart = this.chart;
            const position = this.options.position;
            if (position === 'left' || position === 'right') {
                return {
                    top: 0,
                    left: this.left,
                    bottom: chart.height,
                    right: this.right
                };
            }
            if (position === 'top' || position === 'bottom') {
                return {
                    top: this.top,
                    left: 0,
                    bottom: this.bottom,
                    right: chart.width
                };
            }
        }
     drawBackground() {
            const { ctx , options: { backgroundColor  } , left , top , width , height  } = this;
            if (backgroundColor) {
                ctx.save();
                ctx.fillStyle = backgroundColor;
                ctx.fillRect(left, top, width, height);
                ctx.restore();
            }
        }
        getLineWidthForValue(value) {
            const grid = this.options.grid;
            if (!this._isVisible() || !grid.display) {
                return 0;
            }
            const ticks = this.ticks;
            const index = ticks.findIndex((t)=>t.value === value);
            if (index >= 0) {
                const opts = grid.setContext(this.getContext(index));
                return opts.lineWidth;
            }
            return 0;
        }
     drawGrid(chartArea) {
            const grid = this.options.grid;
            const ctx = this.ctx;
            const items = this._gridLineItems || (this._gridLineItems = this._computeGridLineItems(chartArea));
            let i, ilen;
            const drawLine = (p1, p2, style)=>{
                if (!style.width || !style.color) {
                    return;
                }
                ctx.save();
                ctx.lineWidth = style.width;
                ctx.strokeStyle = style.color;
                ctx.setLineDash(style.borderDash || []);
                ctx.lineDashOffset = style.borderDashOffset;
                ctx.beginPath();
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);
                ctx.stroke();
                ctx.restore();
            };
            if (grid.display) {
                for(i = 0, ilen = items.length; i < ilen; ++i){
                    const item = items[i];
                    if (grid.drawOnChartArea) {
                        drawLine({
                            x: item.x1,
                            y: item.y1
                        }, {
                            x: item.x2,
                            y: item.y2
                        }, item);
                    }
                    if (grid.drawTicks) {
                        drawLine({
                            x: item.tx1,
                            y: item.ty1
                        }, {
                            x: item.tx2,
                            y: item.ty2
                        }, {
                            color: item.tickColor,
                            width: item.tickWidth,
                            borderDash: item.tickBorderDash,
                            borderDashOffset: item.tickBorderDashOffset
                        });
                    }
                }
            }
        }
     drawBorder() {
            const { chart , ctx , options: { border , grid  }  } = this;
            const borderOpts = border.setContext(this.getContext());
            const axisWidth = border.display ? borderOpts.width : 0;
            if (!axisWidth) {
                return;
            }
            const lastLineWidth = grid.setContext(this.getContext(0)).lineWidth;
            const borderValue = this._borderValue;
            let x1, x2, y1, y2;
            if (this.isHorizontal()) {
                x1 = _alignPixel(chart, this.left, axisWidth) - axisWidth / 2;
                x2 = _alignPixel(chart, this.right, lastLineWidth) + lastLineWidth / 2;
                y1 = y2 = borderValue;
            } else {
                y1 = _alignPixel(chart, this.top, axisWidth) - axisWidth / 2;
                y2 = _alignPixel(chart, this.bottom, lastLineWidth) + lastLineWidth / 2;
                x1 = x2 = borderValue;
            }
            ctx.save();
            ctx.lineWidth = borderOpts.width;
            ctx.strokeStyle = borderOpts.color;
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
            ctx.restore();
        }
     drawLabels(chartArea) {
            const optionTicks = this.options.ticks;
            if (!optionTicks.display) {
                return;
            }
            const ctx = this.ctx;
            const area = this._computeLabelArea();
            if (area) {
                clipArea(ctx, area);
            }
            const items = this.getLabelItems(chartArea);
            for (const item of items){
                const renderTextOptions = item.options;
                const tickFont = item.font;
                const label = item.label;
                const y = item.textOffset;
                renderText(ctx, label, 0, y, tickFont, renderTextOptions);
            }
            if (area) {
                unclipArea(ctx);
            }
        }
     drawTitle() {
            const { ctx , options: { position , title , reverse  }  } = this;
            if (!title.display) {
                return;
            }
            const font = toFont(title.font);
            const padding = toPadding(title.padding);
            const align = title.align;
            let offset = font.lineHeight / 2;
            if (position === 'bottom' || position === 'center' || isObject(position)) {
                offset += padding.bottom;
                if (isArray(title.text)) {
                    offset += font.lineHeight * (title.text.length - 1);
                }
            } else {
                offset += padding.top;
            }
            const { titleX , titleY , maxWidth , rotation  } = titleArgs(this, offset, position, align);
            renderText(ctx, title.text, 0, 0, font, {
                color: title.color,
                maxWidth,
                rotation,
                textAlign: titleAlign(align, position, reverse),
                textBaseline: 'middle',
                translation: [
                    titleX,
                    titleY
                ]
            });
        }
        draw(chartArea) {
            if (!this._isVisible()) {
                return;
            }
            this.drawBackground();
            this.drawGrid(chartArea);
            this.drawBorder();
            this.drawTitle();
            this.drawLabels(chartArea);
        }
     _layers() {
            const opts = this.options;
            const tz = opts.ticks && opts.ticks.z || 0;
            const gz = valueOrDefault(opts.grid && opts.grid.z, -1);
            const bz = valueOrDefault(opts.border && opts.border.z, 0);
            if (!this._isVisible() || this.draw !== Scale.prototype.draw) {
                return [
                    {
                        z: tz,
                        draw: (chartArea)=>{
                            this.draw(chartArea);
                        }
                    }
                ];
            }
            return [
                {
                    z: gz,
                    draw: (chartArea)=>{
                        this.drawBackground();
                        this.drawGrid(chartArea);
                        this.drawTitle();
                    }
                },
                {
                    z: bz,
                    draw: ()=>{
                        this.drawBorder();
                    }
                },
                {
                    z: tz,
                    draw: (chartArea)=>{
                        this.drawLabels(chartArea);
                    }
                }
            ];
        }
     getMatchingVisibleMetas(type) {
            const metas = this.chart.getSortedVisibleDatasetMetas();
            const axisID = this.axis + 'AxisID';
            const result = [];
            let i, ilen;
            for(i = 0, ilen = metas.length; i < ilen; ++i){
                const meta = metas[i];
                if (meta[axisID] === this.id && (!type || meta.type === type)) {
                    result.push(meta);
                }
            }
            return result;
        }
     _resolveTickFontOptions(index) {
            const opts = this.options.ticks.setContext(this.getContext(index));
            return toFont(opts.font);
        }
     _maxDigits() {
            const fontSize = this._resolveTickFontOptions(0).lineHeight;
            return (this.isHorizontal() ? this.width : this.height) / fontSize;
        }
    }

    class TypedRegistry {
        constructor(type, scope, override){
            this.type = type;
            this.scope = scope;
            this.override = override;
            this.items = Object.create(null);
        }
        isForType(type) {
            return Object.prototype.isPrototypeOf.call(this.type.prototype, type.prototype);
        }
     register(item) {
            const proto = Object.getPrototypeOf(item);
            let parentScope;
            if (isIChartComponent(proto)) {
                parentScope = this.register(proto);
            }
            const items = this.items;
            const id = item.id;
            const scope = this.scope + '.' + id;
            if (!id) {
                throw new Error('class does not have id: ' + item);
            }
            if (id in items) {
                return scope;
            }
            items[id] = item;
            registerDefaults(item, scope, parentScope);
            if (this.override) {
                defaults.override(item.id, item.overrides);
            }
            return scope;
        }
     get(id) {
            return this.items[id];
        }
     unregister(item) {
            const items = this.items;
            const id = item.id;
            const scope = this.scope;
            if (id in items) {
                delete items[id];
            }
            if (scope && id in defaults[scope]) {
                delete defaults[scope][id];
                if (this.override) {
                    delete overrides[id];
                }
            }
        }
    }
    function registerDefaults(item, scope, parentScope) {
        const itemDefaults = merge(Object.create(null), [
            parentScope ? defaults.get(parentScope) : {},
            defaults.get(scope),
            item.defaults
        ]);
        defaults.set(scope, itemDefaults);
        if (item.defaultRoutes) {
            routeDefaults(scope, item.defaultRoutes);
        }
        if (item.descriptors) {
            defaults.describe(scope, item.descriptors);
        }
    }
    function routeDefaults(scope, routes) {
        Object.keys(routes).forEach((property)=>{
            const propertyParts = property.split('.');
            const sourceName = propertyParts.pop();
            const sourceScope = [
                scope
            ].concat(propertyParts).join('.');
            const parts = routes[property].split('.');
            const targetName = parts.pop();
            const targetScope = parts.join('.');
            defaults.route(sourceScope, sourceName, targetScope, targetName);
        });
    }
    function isIChartComponent(proto) {
        return 'id' in proto && 'defaults' in proto;
    }

    class Registry {
        constructor(){
            this.controllers = new TypedRegistry(DatasetController, 'datasets', true);
            this.elements = new TypedRegistry(Element$1, 'elements');
            this.plugins = new TypedRegistry(Object, 'plugins');
            this.scales = new TypedRegistry(Scale, 'scales');
            this._typedRegistries = [
                this.controllers,
                this.scales,
                this.elements
            ];
        }
     add(...args) {
            this._each('register', args);
        }
        remove(...args) {
            this._each('unregister', args);
        }
     addControllers(...args) {
            this._each('register', args, this.controllers);
        }
     addElements(...args) {
            this._each('register', args, this.elements);
        }
     addPlugins(...args) {
            this._each('register', args, this.plugins);
        }
     addScales(...args) {
            this._each('register', args, this.scales);
        }
     getController(id) {
            return this._get(id, this.controllers, 'controller');
        }
     getElement(id) {
            return this._get(id, this.elements, 'element');
        }
     getPlugin(id) {
            return this._get(id, this.plugins, 'plugin');
        }
     getScale(id) {
            return this._get(id, this.scales, 'scale');
        }
     removeControllers(...args) {
            this._each('unregister', args, this.controllers);
        }
     removeElements(...args) {
            this._each('unregister', args, this.elements);
        }
     removePlugins(...args) {
            this._each('unregister', args, this.plugins);
        }
     removeScales(...args) {
            this._each('unregister', args, this.scales);
        }
     _each(method, args, typedRegistry) {
            [
                ...args
            ].forEach((arg)=>{
                const reg = typedRegistry || this._getRegistryForType(arg);
                if (typedRegistry || reg.isForType(arg) || reg === this.plugins && arg.id) {
                    this._exec(method, reg, arg);
                } else {
                    each(arg, (item)=>{
                        const itemReg = typedRegistry || this._getRegistryForType(item);
                        this._exec(method, itemReg, item);
                    });
                }
            });
        }
     _exec(method, registry, component) {
            const camelMethod = _capitalize(method);
            callback(component['before' + camelMethod], [], component);
            registry[method](component);
            callback(component['after' + camelMethod], [], component);
        }
     _getRegistryForType(type) {
            for(let i = 0; i < this._typedRegistries.length; i++){
                const reg = this._typedRegistries[i];
                if (reg.isForType(type)) {
                    return reg;
                }
            }
            return this.plugins;
        }
     _get(id, typedRegistry, type) {
            const item = typedRegistry.get(id);
            if (item === undefined) {
                throw new Error('"' + id + '" is not a registered ' + type + '.');
            }
            return item;
        }
    }
    var registry = /* #__PURE__ */ new Registry();

    class PluginService {
        constructor(){
            this._init = [];
        }
     notify(chart, hook, args, filter) {
            if (hook === 'beforeInit') {
                this._init = this._createDescriptors(chart, true);
                this._notify(this._init, chart, 'install');
            }
            const descriptors = filter ? this._descriptors(chart).filter(filter) : this._descriptors(chart);
            const result = this._notify(descriptors, chart, hook, args);
            if (hook === 'afterDestroy') {
                this._notify(descriptors, chart, 'stop');
                this._notify(this._init, chart, 'uninstall');
            }
            return result;
        }
     _notify(descriptors, chart, hook, args) {
            args = args || {};
            for (const descriptor of descriptors){
                const plugin = descriptor.plugin;
                const method = plugin[hook];
                const params = [
                    chart,
                    args,
                    descriptor.options
                ];
                if (callback(method, params, plugin) === false && args.cancelable) {
                    return false;
                }
            }
            return true;
        }
        invalidate() {
            if (!isNullOrUndef(this._cache)) {
                this._oldCache = this._cache;
                this._cache = undefined;
            }
        }
     _descriptors(chart) {
            if (this._cache) {
                return this._cache;
            }
            const descriptors = this._cache = this._createDescriptors(chart);
            this._notifyStateChanges(chart);
            return descriptors;
        }
        _createDescriptors(chart, all) {
            const config = chart && chart.config;
            const options = valueOrDefault(config.options && config.options.plugins, {});
            const plugins = allPlugins(config);
            return options === false && !all ? [] : createDescriptors(chart, plugins, options, all);
        }
     _notifyStateChanges(chart) {
            const previousDescriptors = this._oldCache || [];
            const descriptors = this._cache;
            const diff = (a, b)=>a.filter((x)=>!b.some((y)=>x.plugin.id === y.plugin.id));
            this._notify(diff(previousDescriptors, descriptors), chart, 'stop');
            this._notify(diff(descriptors, previousDescriptors), chart, 'start');
        }
    }
     function allPlugins(config) {
        const localIds = {};
        const plugins = [];
        const keys = Object.keys(registry.plugins.items);
        for(let i = 0; i < keys.length; i++){
            plugins.push(registry.getPlugin(keys[i]));
        }
        const local = config.plugins || [];
        for(let i1 = 0; i1 < local.length; i1++){
            const plugin = local[i1];
            if (plugins.indexOf(plugin) === -1) {
                plugins.push(plugin);
                localIds[plugin.id] = true;
            }
        }
        return {
            plugins,
            localIds
        };
    }
    function getOpts(options, all) {
        if (!all && options === false) {
            return null;
        }
        if (options === true) {
            return {};
        }
        return options;
    }
    function createDescriptors(chart, { plugins , localIds  }, options, all) {
        const result = [];
        const context = chart.getContext();
        for (const plugin of plugins){
            const id = plugin.id;
            const opts = getOpts(options[id], all);
            if (opts === null) {
                continue;
            }
            result.push({
                plugin,
                options: pluginOpts(chart.config, {
                    plugin,
                    local: localIds[id]
                }, opts, context)
            });
        }
        return result;
    }
    function pluginOpts(config, { plugin , local  }, opts, context) {
        const keys = config.pluginScopeKeys(plugin);
        const scopes = config.getOptionScopes(opts, keys);
        if (local && plugin.defaults) {
            scopes.push(plugin.defaults);
        }
        return config.createResolver(scopes, context, [
            ''
        ], {
            scriptable: false,
            indexable: false,
            allKeys: true
        });
    }

    function getIndexAxis(type, options) {
        const datasetDefaults = defaults.datasets[type] || {};
        const datasetOptions = (options.datasets || {})[type] || {};
        return datasetOptions.indexAxis || options.indexAxis || datasetDefaults.indexAxis || 'x';
    }
    function getAxisFromDefaultScaleID(id, indexAxis) {
        let axis = id;
        if (id === '_index_') {
            axis = indexAxis;
        } else if (id === '_value_') {
            axis = indexAxis === 'x' ? 'y' : 'x';
        }
        return axis;
    }
    function getDefaultScaleIDFromAxis(axis, indexAxis) {
        return axis === indexAxis ? '_index_' : '_value_';
    }
    function axisFromPosition(position) {
        if (position === 'top' || position === 'bottom') {
            return 'x';
        }
        if (position === 'left' || position === 'right') {
            return 'y';
        }
    }
    function determineAxis(id, scaleOptions) {
        if (id === 'x' || id === 'y' || id === 'r') {
            return id;
        }
        id = scaleOptions.axis || axisFromPosition(scaleOptions.position) || id.length > 1 && determineAxis(id[0].toLowerCase(), scaleOptions);
        if (id) {
            return id;
        }
        throw new Error(`Cannot determine type of '${name}' axis. Please provide 'axis' or 'position' option.`);
    }
    function mergeScaleConfig(config, options) {
        const chartDefaults = overrides[config.type] || {
            scales: {}
        };
        const configScales = options.scales || {};
        const chartIndexAxis = getIndexAxis(config.type, options);
        const scales = Object.create(null);
        Object.keys(configScales).forEach((id)=>{
            const scaleConf = configScales[id];
            if (!isObject(scaleConf)) {
                return console.error(`Invalid scale configuration for scale: ${id}`);
            }
            if (scaleConf._proxy) {
                return console.warn(`Ignoring resolver passed as options for scale: ${id}`);
            }
            const axis = determineAxis(id, scaleConf);
            const defaultId = getDefaultScaleIDFromAxis(axis, chartIndexAxis);
            const defaultScaleOptions = chartDefaults.scales || {};
            scales[id] = mergeIf(Object.create(null), [
                {
                    axis
                },
                scaleConf,
                defaultScaleOptions[axis],
                defaultScaleOptions[defaultId]
            ]);
        });
        config.data.datasets.forEach((dataset)=>{
            const type = dataset.type || config.type;
            const indexAxis = dataset.indexAxis || getIndexAxis(type, options);
            const datasetDefaults = overrides[type] || {};
            const defaultScaleOptions = datasetDefaults.scales || {};
            Object.keys(defaultScaleOptions).forEach((defaultID)=>{
                const axis = getAxisFromDefaultScaleID(defaultID, indexAxis);
                const id = dataset[axis + 'AxisID'] || axis;
                scales[id] = scales[id] || Object.create(null);
                mergeIf(scales[id], [
                    {
                        axis
                    },
                    configScales[id],
                    defaultScaleOptions[defaultID]
                ]);
            });
        });
        Object.keys(scales).forEach((key)=>{
            const scale = scales[key];
            mergeIf(scale, [
                defaults.scales[scale.type],
                defaults.scale
            ]);
        });
        return scales;
    }
    function initOptions(config) {
        const options = config.options || (config.options = {});
        options.plugins = valueOrDefault(options.plugins, {});
        options.scales = mergeScaleConfig(config, options);
    }
    function initData(data) {
        data = data || {};
        data.datasets = data.datasets || [];
        data.labels = data.labels || [];
        return data;
    }
    function initConfig(config) {
        config = config || {};
        config.data = initData(config.data);
        initOptions(config);
        return config;
    }
    const keyCache = new Map();
    const keysCached = new Set();
    function cachedKeys(cacheKey, generate) {
        let keys = keyCache.get(cacheKey);
        if (!keys) {
            keys = generate();
            keyCache.set(cacheKey, keys);
            keysCached.add(keys);
        }
        return keys;
    }
    const addIfFound = (set, obj, key)=>{
        const opts = resolveObjectKey(obj, key);
        if (opts !== undefined) {
            set.add(opts);
        }
    };
    class Config {
        constructor(config){
            this._config = initConfig(config);
            this._scopeCache = new Map();
            this._resolverCache = new Map();
        }
        get platform() {
            return this._config.platform;
        }
        get type() {
            return this._config.type;
        }
        set type(type) {
            this._config.type = type;
        }
        get data() {
            return this._config.data;
        }
        set data(data) {
            this._config.data = initData(data);
        }
        get options() {
            return this._config.options;
        }
        set options(options) {
            this._config.options = options;
        }
        get plugins() {
            return this._config.plugins;
        }
        update() {
            const config = this._config;
            this.clearCache();
            initOptions(config);
        }
        clearCache() {
            this._scopeCache.clear();
            this._resolverCache.clear();
        }
     datasetScopeKeys(datasetType) {
            return cachedKeys(datasetType, ()=>[
                    [
                        `datasets.${datasetType}`,
                        ''
                    ]
                ]);
        }
     datasetAnimationScopeKeys(datasetType, transition) {
            return cachedKeys(`${datasetType}.transition.${transition}`, ()=>[
                    [
                        `datasets.${datasetType}.transitions.${transition}`,
                        `transitions.${transition}`
                    ],
                    [
                        `datasets.${datasetType}`,
                        ''
                    ]
                ]);
        }
     datasetElementScopeKeys(datasetType, elementType) {
            return cachedKeys(`${datasetType}-${elementType}`, ()=>[
                    [
                        `datasets.${datasetType}.elements.${elementType}`,
                        `datasets.${datasetType}`,
                        `elements.${elementType}`,
                        ''
                    ]
                ]);
        }
     pluginScopeKeys(plugin) {
            const id = plugin.id;
            const type = this.type;
            return cachedKeys(`${type}-plugin-${id}`, ()=>[
                    [
                        `plugins.${id}`,
                        ...plugin.additionalOptionScopes || []
                    ]
                ]);
        }
     _cachedScopes(mainScope, resetCache) {
            const _scopeCache = this._scopeCache;
            let cache = _scopeCache.get(mainScope);
            if (!cache || resetCache) {
                cache = new Map();
                _scopeCache.set(mainScope, cache);
            }
            return cache;
        }
     getOptionScopes(mainScope, keyLists, resetCache) {
            const { options , type  } = this;
            const cache = this._cachedScopes(mainScope, resetCache);
            const cached = cache.get(keyLists);
            if (cached) {
                return cached;
            }
            const scopes = new Set();
            keyLists.forEach((keys)=>{
                if (mainScope) {
                    scopes.add(mainScope);
                    keys.forEach((key)=>addIfFound(scopes, mainScope, key));
                }
                keys.forEach((key)=>addIfFound(scopes, options, key));
                keys.forEach((key)=>addIfFound(scopes, overrides[type] || {}, key));
                keys.forEach((key)=>addIfFound(scopes, defaults, key));
                keys.forEach((key)=>addIfFound(scopes, descriptors, key));
            });
            const array = Array.from(scopes);
            if (array.length === 0) {
                array.push(Object.create(null));
            }
            if (keysCached.has(keyLists)) {
                cache.set(keyLists, array);
            }
            return array;
        }
     chartOptionScopes() {
            const { options , type  } = this;
            return [
                options,
                overrides[type] || {},
                defaults.datasets[type] || {},
                {
                    type
                },
                defaults,
                descriptors
            ];
        }
     resolveNamedOptions(scopes, names, context, prefixes = [
            ''
        ]) {
            const result = {
                $shared: true
            };
            const { resolver , subPrefixes  } = getResolver(this._resolverCache, scopes, prefixes);
            let options = resolver;
            if (needContext(resolver, names)) {
                result.$shared = false;
                context = isFunction(context) ? context() : context;
                const subResolver = this.createResolver(scopes, context, subPrefixes);
                options = _attachContext(resolver, context, subResolver);
            }
            for (const prop of names){
                result[prop] = options[prop];
            }
            return result;
        }
     createResolver(scopes, context, prefixes = [
            ''
        ], descriptorDefaults) {
            const { resolver  } = getResolver(this._resolverCache, scopes, prefixes);
            return isObject(context) ? _attachContext(resolver, context, undefined, descriptorDefaults) : resolver;
        }
    }
    function getResolver(resolverCache, scopes, prefixes) {
        let cache = resolverCache.get(scopes);
        if (!cache) {
            cache = new Map();
            resolverCache.set(scopes, cache);
        }
        const cacheKey = prefixes.join();
        let cached = cache.get(cacheKey);
        if (!cached) {
            const resolver = _createResolver(scopes, prefixes);
            cached = {
                resolver,
                subPrefixes: prefixes.filter((p)=>!p.toLowerCase().includes('hover'))
            };
            cache.set(cacheKey, cached);
        }
        return cached;
    }
    const hasFunction = (value)=>isObject(value) && Object.getOwnPropertyNames(value).reduce((acc, key)=>acc || isFunction(value[key]), false);
    function needContext(proxy, names) {
        const { isScriptable , isIndexable  } = _descriptors(proxy);
        for (const prop of names){
            const scriptable = isScriptable(prop);
            const indexable = isIndexable(prop);
            const value = (indexable || scriptable) && proxy[prop];
            if (scriptable && (isFunction(value) || hasFunction(value)) || indexable && isArray(value)) {
                return true;
            }
        }
        return false;
    }

    var version = "4.1.1";

    const KNOWN_POSITIONS = [
        'top',
        'bottom',
        'left',
        'right',
        'chartArea'
    ];
    function positionIsHorizontal(position, axis) {
        return position === 'top' || position === 'bottom' || KNOWN_POSITIONS.indexOf(position) === -1 && axis === 'x';
    }
    function compare2Level(l1, l2) {
        return function(a, b) {
            return a[l1] === b[l1] ? a[l2] - b[l2] : a[l1] - b[l1];
        };
    }
    function onAnimationsComplete(context) {
        const chart = context.chart;
        const animationOptions = chart.options.animation;
        chart.notifyPlugins('afterRender');
        callback(animationOptions && animationOptions.onComplete, [
            context
        ], chart);
    }
    function onAnimationProgress(context) {
        const chart = context.chart;
        const animationOptions = chart.options.animation;
        callback(animationOptions && animationOptions.onProgress, [
            context
        ], chart);
    }
     function getCanvas(item) {
        if (_isDomSupported() && typeof item === 'string') {
            item = document.getElementById(item);
        } else if (item && item.length) {
            item = item[0];
        }
        if (item && item.canvas) {
            item = item.canvas;
        }
        return item;
    }
    const instances = {};
    const getChart = (key)=>{
        const canvas = getCanvas(key);
        return Object.values(instances).filter((c)=>c.canvas === canvas).pop();
    };
    function moveNumericKeys(obj, start, move) {
        const keys = Object.keys(obj);
        for (const key of keys){
            const intKey = +key;
            if (intKey >= start) {
                const value = obj[key];
                delete obj[key];
                if (move > 0 || intKey > start) {
                    obj[intKey + move] = value;
                }
            }
        }
    }
     function determineLastEvent(e, lastEvent, inChartArea, isClick) {
        if (!inChartArea || e.type === 'mouseout') {
            return null;
        }
        if (isClick) {
            return lastEvent;
        }
        return e;
    }
    function getDatasetArea(meta) {
        const { xScale , yScale  } = meta;
        if (xScale && yScale) {
            return {
                left: xScale.left,
                right: xScale.right,
                top: yScale.top,
                bottom: yScale.bottom
            };
        }
    }
    class Chart$1 {
        static defaults = defaults;
        static instances = instances;
        static overrides = overrides;
        static registry = registry;
        static version = version;
        static getChart = getChart;
        static register(...items) {
            registry.add(...items);
            invalidatePlugins();
        }
        static unregister(...items) {
            registry.remove(...items);
            invalidatePlugins();
        }
        constructor(item, userConfig){
            const config = this.config = new Config(userConfig);
            const initialCanvas = getCanvas(item);
            const existingChart = getChart(initialCanvas);
            if (existingChart) {
                throw new Error('Canvas is already in use. Chart with ID \'' + existingChart.id + '\'' + ' must be destroyed before the canvas with ID \'' + existingChart.canvas.id + '\' can be reused.');
            }
            const options = config.createResolver(config.chartOptionScopes(), this.getContext());
            this.platform = new (config.platform || _detectPlatform(initialCanvas))();
            this.platform.updateConfig(config);
            const context = this.platform.acquireContext(initialCanvas, options.aspectRatio);
            const canvas = context && context.canvas;
            const height = canvas && canvas.height;
            const width = canvas && canvas.width;
            this.id = uid();
            this.ctx = context;
            this.canvas = canvas;
            this.width = width;
            this.height = height;
            this._options = options;
            this._aspectRatio = this.aspectRatio;
            this._layers = [];
            this._metasets = [];
            this._stacks = undefined;
            this.boxes = [];
            this.currentDevicePixelRatio = undefined;
            this.chartArea = undefined;
            this._active = [];
            this._lastEvent = undefined;
            this._listeners = {};
             this._responsiveListeners = undefined;
            this._sortedMetasets = [];
            this.scales = {};
            this._plugins = new PluginService();
            this.$proxies = {};
            this._hiddenIndices = {};
            this.attached = false;
            this._animationsDisabled = undefined;
            this.$context = undefined;
            this._doResize = debounce((mode)=>this.update(mode), options.resizeDelay || 0);
            this._dataChanges = [];
            instances[this.id] = this;
            if (!context || !canvas) {
                console.error("Failed to create chart: can't acquire context from the given item");
                return;
            }
            animator.listen(this, 'complete', onAnimationsComplete);
            animator.listen(this, 'progress', onAnimationProgress);
            this._initialize();
            if (this.attached) {
                this.update();
            }
        }
        get aspectRatio() {
            const { options: { aspectRatio , maintainAspectRatio  } , width , height , _aspectRatio  } = this;
            if (!isNullOrUndef(aspectRatio)) {
                return aspectRatio;
            }
            if (maintainAspectRatio && _aspectRatio) {
                return _aspectRatio;
            }
            return height ? width / height : null;
        }
        get data() {
            return this.config.data;
        }
        set data(data) {
            this.config.data = data;
        }
        get options() {
            return this._options;
        }
        set options(options) {
            this.config.options = options;
        }
        get registry() {
            return registry;
        }
     _initialize() {
            this.notifyPlugins('beforeInit');
            if (this.options.responsive) {
                this.resize();
            } else {
                retinaScale(this, this.options.devicePixelRatio);
            }
            this.bindEvents();
            this.notifyPlugins('afterInit');
            return this;
        }
        clear() {
            clearCanvas(this.canvas, this.ctx);
            return this;
        }
        stop() {
            animator.stop(this);
            return this;
        }
     resize(width, height) {
            if (!animator.running(this)) {
                this._resize(width, height);
            } else {
                this._resizeBeforeDraw = {
                    width,
                    height
                };
            }
        }
        _resize(width, height) {
            const options = this.options;
            const canvas = this.canvas;
            const aspectRatio = options.maintainAspectRatio && this.aspectRatio;
            const newSize = this.platform.getMaximumSize(canvas, width, height, aspectRatio);
            const newRatio = options.devicePixelRatio || this.platform.getDevicePixelRatio();
            const mode = this.width ? 'resize' : 'attach';
            this.width = newSize.width;
            this.height = newSize.height;
            this._aspectRatio = this.aspectRatio;
            if (!retinaScale(this, newRatio, true)) {
                return;
            }
            this.notifyPlugins('resize', {
                size: newSize
            });
            callback(options.onResize, [
                this,
                newSize
            ], this);
            if (this.attached) {
                if (this._doResize(mode)) {
                    this.render();
                }
            }
        }
        ensureScalesHaveIDs() {
            const options = this.options;
            const scalesOptions = options.scales || {};
            each(scalesOptions, (axisOptions, axisID)=>{
                axisOptions.id = axisID;
            });
        }
     buildOrUpdateScales() {
            const options = this.options;
            const scaleOpts = options.scales;
            const scales = this.scales;
            const updated = Object.keys(scales).reduce((obj, id)=>{
                obj[id] = false;
                return obj;
            }, {});
            let items = [];
            if (scaleOpts) {
                items = items.concat(Object.keys(scaleOpts).map((id)=>{
                    const scaleOptions = scaleOpts[id];
                    const axis = determineAxis(id, scaleOptions);
                    const isRadial = axis === 'r';
                    const isHorizontal = axis === 'x';
                    return {
                        options: scaleOptions,
                        dposition: isRadial ? 'chartArea' : isHorizontal ? 'bottom' : 'left',
                        dtype: isRadial ? 'radialLinear' : isHorizontal ? 'category' : 'linear'
                    };
                }));
            }
            each(items, (item)=>{
                const scaleOptions = item.options;
                const id = scaleOptions.id;
                const axis = determineAxis(id, scaleOptions);
                const scaleType = valueOrDefault(scaleOptions.type, item.dtype);
                if (scaleOptions.position === undefined || positionIsHorizontal(scaleOptions.position, axis) !== positionIsHorizontal(item.dposition)) {
                    scaleOptions.position = item.dposition;
                }
                updated[id] = true;
                let scale = null;
                if (id in scales && scales[id].type === scaleType) {
                    scale = scales[id];
                } else {
                    const scaleClass = registry.getScale(scaleType);
                    scale = new scaleClass({
                        id,
                        type: scaleType,
                        ctx: this.ctx,
                        chart: this
                    });
                    scales[scale.id] = scale;
                }
                scale.init(scaleOptions, options);
            });
            each(updated, (hasUpdated, id)=>{
                if (!hasUpdated) {
                    delete scales[id];
                }
            });
            each(scales, (scale)=>{
                layouts.configure(this, scale, scale.options);
                layouts.addBox(this, scale);
            });
        }
     _updateMetasets() {
            const metasets = this._metasets;
            const numData = this.data.datasets.length;
            const numMeta = metasets.length;
            metasets.sort((a, b)=>a.index - b.index);
            if (numMeta > numData) {
                for(let i = numData; i < numMeta; ++i){
                    this._destroyDatasetMeta(i);
                }
                metasets.splice(numData, numMeta - numData);
            }
            this._sortedMetasets = metasets.slice(0).sort(compare2Level('order', 'index'));
        }
     _removeUnreferencedMetasets() {
            const { _metasets: metasets , data: { datasets  }  } = this;
            if (metasets.length > datasets.length) {
                delete this._stacks;
            }
            metasets.forEach((meta, index)=>{
                if (datasets.filter((x)=>x === meta._dataset).length === 0) {
                    this._destroyDatasetMeta(index);
                }
            });
        }
        buildOrUpdateControllers() {
            const newControllers = [];
            const datasets = this.data.datasets;
            let i, ilen;
            this._removeUnreferencedMetasets();
            for(i = 0, ilen = datasets.length; i < ilen; i++){
                const dataset = datasets[i];
                let meta = this.getDatasetMeta(i);
                const type = dataset.type || this.config.type;
                if (meta.type && meta.type !== type) {
                    this._destroyDatasetMeta(i);
                    meta = this.getDatasetMeta(i);
                }
                meta.type = type;
                meta.indexAxis = dataset.indexAxis || getIndexAxis(type, this.options);
                meta.order = dataset.order || 0;
                meta.index = i;
                meta.label = '' + dataset.label;
                meta.visible = this.isDatasetVisible(i);
                if (meta.controller) {
                    meta.controller.updateIndex(i);
                    meta.controller.linkScales();
                } else {
                    const ControllerClass = registry.getController(type);
                    const { datasetElementType , dataElementType  } = defaults.datasets[type];
                    Object.assign(ControllerClass, {
                        dataElementType: registry.getElement(dataElementType),
                        datasetElementType: datasetElementType && registry.getElement(datasetElementType)
                    });
                    meta.controller = new ControllerClass(this, i);
                    newControllers.push(meta.controller);
                }
            }
            this._updateMetasets();
            return newControllers;
        }
     _resetElements() {
            each(this.data.datasets, (dataset, datasetIndex)=>{
                this.getDatasetMeta(datasetIndex).controller.reset();
            }, this);
        }
     reset() {
            this._resetElements();
            this.notifyPlugins('reset');
        }
        update(mode) {
            const config = this.config;
            config.update();
            const options = this._options = config.createResolver(config.chartOptionScopes(), this.getContext());
            const animsDisabled = this._animationsDisabled = !options.animation;
            this._updateScales();
            this._checkEventBindings();
            this._updateHiddenIndices();
            this._plugins.invalidate();
            if (this.notifyPlugins('beforeUpdate', {
                mode,
                cancelable: true
            }) === false) {
                return;
            }
            const newControllers = this.buildOrUpdateControllers();
            this.notifyPlugins('beforeElementsUpdate');
            let minPadding = 0;
            for(let i = 0, ilen = this.data.datasets.length; i < ilen; i++){
                const { controller  } = this.getDatasetMeta(i);
                const reset = !animsDisabled && newControllers.indexOf(controller) === -1;
                controller.buildOrUpdateElements(reset);
                minPadding = Math.max(+controller.getMaxOverflow(), minPadding);
            }
            minPadding = this._minPadding = options.layout.autoPadding ? minPadding : 0;
            this._updateLayout(minPadding);
            if (!animsDisabled) {
                each(newControllers, (controller)=>{
                    controller.reset();
                });
            }
            this._updateDatasets(mode);
            this.notifyPlugins('afterUpdate', {
                mode
            });
            this._layers.sort(compare2Level('z', '_idx'));
            const { _active , _lastEvent  } = this;
            if (_lastEvent) {
                this._eventHandler(_lastEvent, true);
            } else if (_active.length) {
                this._updateHoverStyles(_active, _active, true);
            }
            this.render();
        }
     _updateScales() {
            each(this.scales, (scale)=>{
                layouts.removeBox(this, scale);
            });
            this.ensureScalesHaveIDs();
            this.buildOrUpdateScales();
        }
     _checkEventBindings() {
            const options = this.options;
            const existingEvents = new Set(Object.keys(this._listeners));
            const newEvents = new Set(options.events);
            if (!setsEqual(existingEvents, newEvents) || !!this._responsiveListeners !== options.responsive) {
                this.unbindEvents();
                this.bindEvents();
            }
        }
     _updateHiddenIndices() {
            const { _hiddenIndices  } = this;
            const changes = this._getUniformDataChanges() || [];
            for (const { method , start , count  } of changes){
                const move = method === '_removeElements' ? -count : count;
                moveNumericKeys(_hiddenIndices, start, move);
            }
        }
     _getUniformDataChanges() {
            const _dataChanges = this._dataChanges;
            if (!_dataChanges || !_dataChanges.length) {
                return;
            }
            this._dataChanges = [];
            const datasetCount = this.data.datasets.length;
            const makeSet = (idx)=>new Set(_dataChanges.filter((c)=>c[0] === idx).map((c, i)=>i + ',' + c.splice(1).join(',')));
            const changeSet = makeSet(0);
            for(let i = 1; i < datasetCount; i++){
                if (!setsEqual(changeSet, makeSet(i))) {
                    return;
                }
            }
            return Array.from(changeSet).map((c)=>c.split(',')).map((a)=>({
                    method: a[1],
                    start: +a[2],
                    count: +a[3]
                }));
        }
     _updateLayout(minPadding) {
            if (this.notifyPlugins('beforeLayout', {
                cancelable: true
            }) === false) {
                return;
            }
            layouts.update(this, this.width, this.height, minPadding);
            const area = this.chartArea;
            const noArea = area.width <= 0 || area.height <= 0;
            this._layers = [];
            each(this.boxes, (box)=>{
                if (noArea && box.position === 'chartArea') {
                    return;
                }
                if (box.configure) {
                    box.configure();
                }
                this._layers.push(...box._layers());
            }, this);
            this._layers.forEach((item, index)=>{
                item._idx = index;
            });
            this.notifyPlugins('afterLayout');
        }
     _updateDatasets(mode) {
            if (this.notifyPlugins('beforeDatasetsUpdate', {
                mode,
                cancelable: true
            }) === false) {
                return;
            }
            for(let i = 0, ilen = this.data.datasets.length; i < ilen; ++i){
                this.getDatasetMeta(i).controller.configure();
            }
            for(let i1 = 0, ilen1 = this.data.datasets.length; i1 < ilen1; ++i1){
                this._updateDataset(i1, isFunction(mode) ? mode({
                    datasetIndex: i1
                }) : mode);
            }
            this.notifyPlugins('afterDatasetsUpdate', {
                mode
            });
        }
     _updateDataset(index, mode) {
            const meta = this.getDatasetMeta(index);
            const args = {
                meta,
                index,
                mode,
                cancelable: true
            };
            if (this.notifyPlugins('beforeDatasetUpdate', args) === false) {
                return;
            }
            meta.controller._update(mode);
            args.cancelable = false;
            this.notifyPlugins('afterDatasetUpdate', args);
        }
        render() {
            if (this.notifyPlugins('beforeRender', {
                cancelable: true
            }) === false) {
                return;
            }
            if (animator.has(this)) {
                if (this.attached && !animator.running(this)) {
                    animator.start(this);
                }
            } else {
                this.draw();
                onAnimationsComplete({
                    chart: this
                });
            }
        }
        draw() {
            let i;
            if (this._resizeBeforeDraw) {
                const { width , height  } = this._resizeBeforeDraw;
                this._resize(width, height);
                this._resizeBeforeDraw = null;
            }
            this.clear();
            if (this.width <= 0 || this.height <= 0) {
                return;
            }
            if (this.notifyPlugins('beforeDraw', {
                cancelable: true
            }) === false) {
                return;
            }
            const layers = this._layers;
            for(i = 0; i < layers.length && layers[i].z <= 0; ++i){
                layers[i].draw(this.chartArea);
            }
            this._drawDatasets();
            for(; i < layers.length; ++i){
                layers[i].draw(this.chartArea);
            }
            this.notifyPlugins('afterDraw');
        }
     _getSortedDatasetMetas(filterVisible) {
            const metasets = this._sortedMetasets;
            const result = [];
            let i, ilen;
            for(i = 0, ilen = metasets.length; i < ilen; ++i){
                const meta = metasets[i];
                if (!filterVisible || meta.visible) {
                    result.push(meta);
                }
            }
            return result;
        }
     getSortedVisibleDatasetMetas() {
            return this._getSortedDatasetMetas(true);
        }
     _drawDatasets() {
            if (this.notifyPlugins('beforeDatasetsDraw', {
                cancelable: true
            }) === false) {
                return;
            }
            const metasets = this.getSortedVisibleDatasetMetas();
            for(let i = metasets.length - 1; i >= 0; --i){
                this._drawDataset(metasets[i]);
            }
            this.notifyPlugins('afterDatasetsDraw');
        }
     _drawDataset(meta) {
            const ctx = this.ctx;
            const clip = meta._clip;
            const useClip = !clip.disabled;
            const area = getDatasetArea(meta) || this.chartArea;
            const args = {
                meta,
                index: meta.index,
                cancelable: true
            };
            if (this.notifyPlugins('beforeDatasetDraw', args) === false) {
                return;
            }
            if (useClip) {
                clipArea(ctx, {
                    left: clip.left === false ? 0 : area.left - clip.left,
                    right: clip.right === false ? this.width : area.right + clip.right,
                    top: clip.top === false ? 0 : area.top - clip.top,
                    bottom: clip.bottom === false ? this.height : area.bottom + clip.bottom
                });
            }
            meta.controller.draw();
            if (useClip) {
                unclipArea(ctx);
            }
            args.cancelable = false;
            this.notifyPlugins('afterDatasetDraw', args);
        }
     isPointInArea(point) {
            return _isPointInArea(point, this.chartArea, this._minPadding);
        }
        getElementsAtEventForMode(e, mode, options, useFinalPosition) {
            const method = Interaction.modes[mode];
            if (typeof method === 'function') {
                return method(this, e, options, useFinalPosition);
            }
            return [];
        }
        getDatasetMeta(datasetIndex) {
            const dataset = this.data.datasets[datasetIndex];
            const metasets = this._metasets;
            let meta = metasets.filter((x)=>x && x._dataset === dataset).pop();
            if (!meta) {
                meta = {
                    type: null,
                    data: [],
                    dataset: null,
                    controller: null,
                    hidden: null,
                    xAxisID: null,
                    yAxisID: null,
                    order: dataset && dataset.order || 0,
                    index: datasetIndex,
                    _dataset: dataset,
                    _parsed: [],
                    _sorted: false
                };
                metasets.push(meta);
            }
            return meta;
        }
        getContext() {
            return this.$context || (this.$context = createContext(null, {
                chart: this,
                type: 'chart'
            }));
        }
        getVisibleDatasetCount() {
            return this.getSortedVisibleDatasetMetas().length;
        }
        isDatasetVisible(datasetIndex) {
            const dataset = this.data.datasets[datasetIndex];
            if (!dataset) {
                return false;
            }
            const meta = this.getDatasetMeta(datasetIndex);
            return typeof meta.hidden === 'boolean' ? !meta.hidden : !dataset.hidden;
        }
        setDatasetVisibility(datasetIndex, visible) {
            const meta = this.getDatasetMeta(datasetIndex);
            meta.hidden = !visible;
        }
        toggleDataVisibility(index) {
            this._hiddenIndices[index] = !this._hiddenIndices[index];
        }
        getDataVisibility(index) {
            return !this._hiddenIndices[index];
        }
     _updateVisibility(datasetIndex, dataIndex, visible) {
            const mode = visible ? 'show' : 'hide';
            const meta = this.getDatasetMeta(datasetIndex);
            const anims = meta.controller._resolveAnimations(undefined, mode);
            if (defined(dataIndex)) {
                meta.data[dataIndex].hidden = !visible;
                this.update();
            } else {
                this.setDatasetVisibility(datasetIndex, visible);
                anims.update(meta, {
                    visible
                });
                this.update((ctx)=>ctx.datasetIndex === datasetIndex ? mode : undefined);
            }
        }
        hide(datasetIndex, dataIndex) {
            this._updateVisibility(datasetIndex, dataIndex, false);
        }
        show(datasetIndex, dataIndex) {
            this._updateVisibility(datasetIndex, dataIndex, true);
        }
     _destroyDatasetMeta(datasetIndex) {
            const meta = this._metasets[datasetIndex];
            if (meta && meta.controller) {
                meta.controller._destroy();
            }
            delete this._metasets[datasetIndex];
        }
        _stop() {
            let i, ilen;
            this.stop();
            animator.remove(this);
            for(i = 0, ilen = this.data.datasets.length; i < ilen; ++i){
                this._destroyDatasetMeta(i);
            }
        }
        destroy() {
            this.notifyPlugins('beforeDestroy');
            const { canvas , ctx  } = this;
            this._stop();
            this.config.clearCache();
            if (canvas) {
                this.unbindEvents();
                clearCanvas(canvas, ctx);
                this.platform.releaseContext(ctx);
                this.canvas = null;
                this.ctx = null;
            }
            delete instances[this.id];
            this.notifyPlugins('afterDestroy');
        }
        toBase64Image(...args) {
            return this.canvas.toDataURL(...args);
        }
     bindEvents() {
            this.bindUserEvents();
            if (this.options.responsive) {
                this.bindResponsiveEvents();
            } else {
                this.attached = true;
            }
        }
     bindUserEvents() {
            const listeners = this._listeners;
            const platform = this.platform;
            const _add = (type, listener)=>{
                platform.addEventListener(this, type, listener);
                listeners[type] = listener;
            };
            const listener = (e, x, y)=>{
                e.offsetX = x;
                e.offsetY = y;
                this._eventHandler(e);
            };
            each(this.options.events, (type)=>_add(type, listener));
        }
     bindResponsiveEvents() {
            if (!this._responsiveListeners) {
                this._responsiveListeners = {};
            }
            const listeners = this._responsiveListeners;
            const platform = this.platform;
            const _add = (type, listener)=>{
                platform.addEventListener(this, type, listener);
                listeners[type] = listener;
            };
            const _remove = (type, listener)=>{
                if (listeners[type]) {
                    platform.removeEventListener(this, type, listener);
                    delete listeners[type];
                }
            };
            const listener = (width, height)=>{
                if (this.canvas) {
                    this.resize(width, height);
                }
            };
            let detached;
            const attached = ()=>{
                _remove('attach', attached);
                this.attached = true;
                this.resize();
                _add('resize', listener);
                _add('detach', detached);
            };
            detached = ()=>{
                this.attached = false;
                _remove('resize', listener);
                this._stop();
                this._resize(0, 0);
                _add('attach', attached);
            };
            if (platform.isAttached(this.canvas)) {
                attached();
            } else {
                detached();
            }
        }
     unbindEvents() {
            each(this._listeners, (listener, type)=>{
                this.platform.removeEventListener(this, type, listener);
            });
            this._listeners = {};
            each(this._responsiveListeners, (listener, type)=>{
                this.platform.removeEventListener(this, type, listener);
            });
            this._responsiveListeners = undefined;
        }
        updateHoverStyle(items, mode, enabled) {
            const prefix = enabled ? 'set' : 'remove';
            let meta, item, i, ilen;
            if (mode === 'dataset') {
                meta = this.getDatasetMeta(items[0].datasetIndex);
                meta.controller['_' + prefix + 'DatasetHoverStyle']();
            }
            for(i = 0, ilen = items.length; i < ilen; ++i){
                item = items[i];
                const controller = item && this.getDatasetMeta(item.datasetIndex).controller;
                if (controller) {
                    controller[prefix + 'HoverStyle'](item.element, item.datasetIndex, item.index);
                }
            }
        }
     getActiveElements() {
            return this._active || [];
        }
     setActiveElements(activeElements) {
            const lastActive = this._active || [];
            const active = activeElements.map(({ datasetIndex , index  })=>{
                const meta = this.getDatasetMeta(datasetIndex);
                if (!meta) {
                    throw new Error('No dataset found at index ' + datasetIndex);
                }
                return {
                    datasetIndex,
                    element: meta.data[index],
                    index
                };
            });
            const changed = !_elementsEqual(active, lastActive);
            if (changed) {
                this._active = active;
                this._lastEvent = null;
                this._updateHoverStyles(active, lastActive);
            }
        }
     notifyPlugins(hook, args, filter) {
            return this._plugins.notify(this, hook, args, filter);
        }
     isPluginEnabled(pluginId) {
            return this._plugins._cache.filter((p)=>p.plugin.id === pluginId).length === 1;
        }
     _updateHoverStyles(active, lastActive, replay) {
            const hoverOptions = this.options.hover;
            const diff = (a, b)=>a.filter((x)=>!b.some((y)=>x.datasetIndex === y.datasetIndex && x.index === y.index));
            const deactivated = diff(lastActive, active);
            const activated = replay ? active : diff(active, lastActive);
            if (deactivated.length) {
                this.updateHoverStyle(deactivated, hoverOptions.mode, false);
            }
            if (activated.length && hoverOptions.mode) {
                this.updateHoverStyle(activated, hoverOptions.mode, true);
            }
        }
     _eventHandler(e, replay) {
            const args = {
                event: e,
                replay,
                cancelable: true,
                inChartArea: this.isPointInArea(e)
            };
            const eventFilter = (plugin)=>(plugin.options.events || this.options.events).includes(e.native.type);
            if (this.notifyPlugins('beforeEvent', args, eventFilter) === false) {
                return;
            }
            const changed = this._handleEvent(e, replay, args.inChartArea);
            args.cancelable = false;
            this.notifyPlugins('afterEvent', args, eventFilter);
            if (changed || args.changed) {
                this.render();
            }
            return this;
        }
     _handleEvent(e, replay, inChartArea) {
            const { _active: lastActive = [] , options  } = this;
            const useFinalPosition = replay;
            const active = this._getActiveElements(e, lastActive, inChartArea, useFinalPosition);
            const isClick = _isClickEvent(e);
            const lastEvent = determineLastEvent(e, this._lastEvent, inChartArea, isClick);
            if (inChartArea) {
                this._lastEvent = null;
                callback(options.onHover, [
                    e,
                    active,
                    this
                ], this);
                if (isClick) {
                    callback(options.onClick, [
                        e,
                        active,
                        this
                    ], this);
                }
            }
            const changed = !_elementsEqual(active, lastActive);
            if (changed || replay) {
                this._active = active;
                this._updateHoverStyles(active, lastActive, replay);
            }
            this._lastEvent = lastEvent;
            return changed;
        }
     _getActiveElements(e, lastActive, inChartArea, useFinalPosition) {
            if (e.type === 'mouseout') {
                return [];
            }
            if (!inChartArea) {
                return lastActive;
            }
            const hoverOptions = this.options.hover;
            return this.getElementsAtEventForMode(e, hoverOptions.mode, hoverOptions, useFinalPosition);
        }
    }
    function invalidatePlugins() {
        return each(Chart$1.instances, (chart)=>chart._plugins.invalidate());
    }

    function clipArc(ctx, element, endAngle) {
        const { startAngle , pixelMargin , x , y , outerRadius , innerRadius  } = element;
        let angleMargin = pixelMargin / outerRadius;
        // Draw an inner border by clipping the arc and drawing a double-width border
        // Enlarge the clipping arc by 0.33 pixels to eliminate glitches between borders
        ctx.beginPath();
        ctx.arc(x, y, outerRadius, startAngle - angleMargin, endAngle + angleMargin);
        if (innerRadius > pixelMargin) {
            angleMargin = pixelMargin / innerRadius;
            ctx.arc(x, y, innerRadius, endAngle + angleMargin, startAngle - angleMargin, true);
        } else {
            ctx.arc(x, y, pixelMargin, endAngle + HALF_PI, startAngle - HALF_PI);
        }
        ctx.closePath();
        ctx.clip();
    }
    function toRadiusCorners(value) {
        return _readValueToProps(value, [
            'outerStart',
            'outerEnd',
            'innerStart',
            'innerEnd'
        ]);
    }
    /**
     * Parse border radius from the provided options
     */ function parseBorderRadius$1(arc, innerRadius, outerRadius, angleDelta) {
        const o = toRadiusCorners(arc.options.borderRadius);
        const halfThickness = (outerRadius - innerRadius) / 2;
        const innerLimit = Math.min(halfThickness, angleDelta * innerRadius / 2);
        // Outer limits are complicated. We want to compute the available angular distance at
        // a radius of outerRadius - borderRadius because for small angular distances, this term limits.
        // We compute at r = outerRadius - borderRadius because this circle defines the center of the border corners.
        //
        // If the borderRadius is large, that value can become negative.
        // This causes the outer borders to lose their radius entirely, which is rather unexpected. To solve that, if borderRadius > outerRadius
        // we know that the thickness term will dominate and compute the limits at that point
        const computeOuterLimit = (val)=>{
            const outerArcLimit = (outerRadius - Math.min(halfThickness, val)) * angleDelta / 2;
            return _limitValue(val, 0, Math.min(halfThickness, outerArcLimit));
        };
        return {
            outerStart: computeOuterLimit(o.outerStart),
            outerEnd: computeOuterLimit(o.outerEnd),
            innerStart: _limitValue(o.innerStart, 0, innerLimit),
            innerEnd: _limitValue(o.innerEnd, 0, innerLimit)
        };
    }
    /**
     * Convert (r, 𝜃) to (x, y)
     */ function rThetaToXY(r, theta, x, y) {
        return {
            x: x + r * Math.cos(theta),
            y: y + r * Math.sin(theta)
        };
    }
    /**
     * Path the arc, respecting border radius by separating into left and right halves.
     *
     *   Start      End
     *
     *    1--->a--->2    Outer
     *   /           \
     *   8           3
     *   |           |
     *   |           |
     *   7           4
     *   \           /
     *    6<---b<---5    Inner
     */ function pathArc(ctx, element, offset, spacing, end, circular) {
        const { x , y , startAngle: start , pixelMargin , innerRadius: innerR  } = element;
        const outerRadius = Math.max(element.outerRadius + spacing + offset - pixelMargin, 0);
        const innerRadius = innerR > 0 ? innerR + spacing + offset + pixelMargin : 0;
        let spacingOffset = 0;
        const alpha = end - start;
        if (spacing) {
            // When spacing is present, it is the same for all items
            // So we adjust the start and end angle of the arc such that
            // the distance is the same as it would be without the spacing
            const noSpacingInnerRadius = innerR > 0 ? innerR - spacing : 0;
            const noSpacingOuterRadius = outerRadius > 0 ? outerRadius - spacing : 0;
            const avNogSpacingRadius = (noSpacingInnerRadius + noSpacingOuterRadius) / 2;
            const adjustedAngle = avNogSpacingRadius !== 0 ? alpha * avNogSpacingRadius / (avNogSpacingRadius + spacing) : alpha;
            spacingOffset = (alpha - adjustedAngle) / 2;
        }
        const beta = Math.max(0.001, alpha * outerRadius - offset / PI) / outerRadius;
        const angleOffset = (alpha - beta) / 2;
        const startAngle = start + angleOffset + spacingOffset;
        const endAngle = end - angleOffset - spacingOffset;
        const { outerStart , outerEnd , innerStart , innerEnd  } = parseBorderRadius$1(element, innerRadius, outerRadius, endAngle - startAngle);
        const outerStartAdjustedRadius = outerRadius - outerStart;
        const outerEndAdjustedRadius = outerRadius - outerEnd;
        const outerStartAdjustedAngle = startAngle + outerStart / outerStartAdjustedRadius;
        const outerEndAdjustedAngle = endAngle - outerEnd / outerEndAdjustedRadius;
        const innerStartAdjustedRadius = innerRadius + innerStart;
        const innerEndAdjustedRadius = innerRadius + innerEnd;
        const innerStartAdjustedAngle = startAngle + innerStart / innerStartAdjustedRadius;
        const innerEndAdjustedAngle = endAngle - innerEnd / innerEndAdjustedRadius;
        ctx.beginPath();
        if (circular) {
            // The first arc segments from point 1 to point a to point 2
            const outerMidAdjustedAngle = (outerStartAdjustedAngle + outerEndAdjustedAngle) / 2;
            ctx.arc(x, y, outerRadius, outerStartAdjustedAngle, outerMidAdjustedAngle);
            ctx.arc(x, y, outerRadius, outerMidAdjustedAngle, outerEndAdjustedAngle);
            // The corner segment from point 2 to point 3
            if (outerEnd > 0) {
                const pCenter = rThetaToXY(outerEndAdjustedRadius, outerEndAdjustedAngle, x, y);
                ctx.arc(pCenter.x, pCenter.y, outerEnd, outerEndAdjustedAngle, endAngle + HALF_PI);
            }
            // The line from point 3 to point 4
            const p4 = rThetaToXY(innerEndAdjustedRadius, endAngle, x, y);
            ctx.lineTo(p4.x, p4.y);
            // The corner segment from point 4 to point 5
            if (innerEnd > 0) {
                const pCenter1 = rThetaToXY(innerEndAdjustedRadius, innerEndAdjustedAngle, x, y);
                ctx.arc(pCenter1.x, pCenter1.y, innerEnd, endAngle + HALF_PI, innerEndAdjustedAngle + Math.PI);
            }
            // The inner arc from point 5 to point b to point 6
            const innerMidAdjustedAngle = (endAngle - innerEnd / innerRadius + (startAngle + innerStart / innerRadius)) / 2;
            ctx.arc(x, y, innerRadius, endAngle - innerEnd / innerRadius, innerMidAdjustedAngle, true);
            ctx.arc(x, y, innerRadius, innerMidAdjustedAngle, startAngle + innerStart / innerRadius, true);
            // The corner segment from point 6 to point 7
            if (innerStart > 0) {
                const pCenter2 = rThetaToXY(innerStartAdjustedRadius, innerStartAdjustedAngle, x, y);
                ctx.arc(pCenter2.x, pCenter2.y, innerStart, innerStartAdjustedAngle + Math.PI, startAngle - HALF_PI);
            }
            // The line from point 7 to point 8
            const p8 = rThetaToXY(outerStartAdjustedRadius, startAngle, x, y);
            ctx.lineTo(p8.x, p8.y);
            // The corner segment from point 8 to point 1
            if (outerStart > 0) {
                const pCenter3 = rThetaToXY(outerStartAdjustedRadius, outerStartAdjustedAngle, x, y);
                ctx.arc(pCenter3.x, pCenter3.y, outerStart, startAngle - HALF_PI, outerStartAdjustedAngle);
            }
        } else {
            ctx.moveTo(x, y);
            const outerStartX = Math.cos(outerStartAdjustedAngle) * outerRadius + x;
            const outerStartY = Math.sin(outerStartAdjustedAngle) * outerRadius + y;
            ctx.lineTo(outerStartX, outerStartY);
            const outerEndX = Math.cos(outerEndAdjustedAngle) * outerRadius + x;
            const outerEndY = Math.sin(outerEndAdjustedAngle) * outerRadius + y;
            ctx.lineTo(outerEndX, outerEndY);
        }
        ctx.closePath();
    }
    function drawArc(ctx, element, offset, spacing, circular) {
        const { fullCircles , startAngle , circumference  } = element;
        let endAngle = element.endAngle;
        if (fullCircles) {
            pathArc(ctx, element, offset, spacing, endAngle, circular);
            for(let i = 0; i < fullCircles; ++i){
                ctx.fill();
            }
            if (!isNaN(circumference)) {
                endAngle = startAngle + (circumference % TAU || TAU);
            }
        }
        pathArc(ctx, element, offset, spacing, endAngle, circular);
        ctx.fill();
        return endAngle;
    }
    function drawBorder(ctx, element, offset, spacing, circular) {
        const { fullCircles , startAngle , circumference , options  } = element;
        const { borderWidth , borderJoinStyle  } = options;
        const inner = options.borderAlign === 'inner';
        if (!borderWidth) {
            return;
        }
        if (inner) {
            ctx.lineWidth = borderWidth * 2;
            ctx.lineJoin = borderJoinStyle || 'round';
        } else {
            ctx.lineWidth = borderWidth;
            ctx.lineJoin = borderJoinStyle || 'bevel';
        }
        let endAngle = element.endAngle;
        if (fullCircles) {
            pathArc(ctx, element, offset, spacing, endAngle, circular);
            for(let i = 0; i < fullCircles; ++i){
                ctx.stroke();
            }
            if (!isNaN(circumference)) {
                endAngle = startAngle + (circumference % TAU || TAU);
            }
        }
        if (inner) {
            clipArc(ctx, element, endAngle);
        }
        if (!fullCircles) {
            pathArc(ctx, element, offset, spacing, endAngle, circular);
            ctx.stroke();
        }
    }
    class ArcElement extends Element$1 {
        static id = 'arc';
        static defaults = {
            borderAlign: 'center',
            borderColor: '#fff',
            borderJoinStyle: undefined,
            borderRadius: 0,
            borderWidth: 2,
            offset: 0,
            spacing: 0,
            angle: undefined,
            circular: true
        };
        static defaultRoutes = {
            backgroundColor: 'backgroundColor'
        };
        constructor(cfg){
            super();
            this.options = undefined;
            this.circumference = undefined;
            this.startAngle = undefined;
            this.endAngle = undefined;
            this.innerRadius = undefined;
            this.outerRadius = undefined;
            this.pixelMargin = 0;
            this.fullCircles = 0;
            if (cfg) {
                Object.assign(this, cfg);
            }
        }
        inRange(chartX, chartY, useFinalPosition) {
            const point = this.getProps([
                'x',
                'y'
            ], useFinalPosition);
            const { angle , distance  } = getAngleFromPoint(point, {
                x: chartX,
                y: chartY
            });
            const { startAngle , endAngle , innerRadius , outerRadius , circumference  } = this.getProps([
                'startAngle',
                'endAngle',
                'innerRadius',
                'outerRadius',
                'circumference'
            ], useFinalPosition);
            const rAdjust = this.options.spacing / 2;
            const _circumference = valueOrDefault(circumference, endAngle - startAngle);
            const betweenAngles = _circumference >= TAU || _angleBetween(angle, startAngle, endAngle);
            const withinRadius = _isBetween(distance, innerRadius + rAdjust, outerRadius + rAdjust);
            return betweenAngles && withinRadius;
        }
        getCenterPoint(useFinalPosition) {
            const { x , y , startAngle , endAngle , innerRadius , outerRadius  } = this.getProps([
                'x',
                'y',
                'startAngle',
                'endAngle',
                'innerRadius',
                'outerRadius',
                'circumference'
            ], useFinalPosition);
            const { offset , spacing  } = this.options;
            const halfAngle = (startAngle + endAngle) / 2;
            const halfRadius = (innerRadius + outerRadius + spacing + offset) / 2;
            return {
                x: x + Math.cos(halfAngle) * halfRadius,
                y: y + Math.sin(halfAngle) * halfRadius
            };
        }
        tooltipPosition(useFinalPosition) {
            return this.getCenterPoint(useFinalPosition);
        }
        draw(ctx) {
            const { options , circumference  } = this;
            const offset = (options.offset || 0) / 4;
            const spacing = (options.spacing || 0) / 2;
            const circular = options.circular;
            this.pixelMargin = options.borderAlign === 'inner' ? 0.33 : 0;
            this.fullCircles = circumference > TAU ? Math.floor(circumference / TAU) : 0;
            if (circumference === 0 || this.innerRadius < 0 || this.outerRadius < 0) {
                return;
            }
            ctx.save();
            const halfAngle = (this.startAngle + this.endAngle) / 2;
            ctx.translate(Math.cos(halfAngle) * offset, Math.sin(halfAngle) * offset);
            const fix = 1 - Math.sin(Math.min(PI, circumference || 0));
            const radiusOffset = offset * fix;
            ctx.fillStyle = options.backgroundColor;
            ctx.strokeStyle = options.borderColor;
            drawArc(ctx, this, radiusOffset, spacing, circular);
            drawBorder(ctx, this, radiusOffset, spacing, circular);
            ctx.restore();
        }
    }

    function setStyle(ctx, options, style = options) {
        ctx.lineCap = valueOrDefault(style.borderCapStyle, options.borderCapStyle);
        ctx.setLineDash(valueOrDefault(style.borderDash, options.borderDash));
        ctx.lineDashOffset = valueOrDefault(style.borderDashOffset, options.borderDashOffset);
        ctx.lineJoin = valueOrDefault(style.borderJoinStyle, options.borderJoinStyle);
        ctx.lineWidth = valueOrDefault(style.borderWidth, options.borderWidth);
        ctx.strokeStyle = valueOrDefault(style.borderColor, options.borderColor);
    }
    function lineTo(ctx, previous, target) {
        ctx.lineTo(target.x, target.y);
    }
    function getLineMethod(options) {
        if (options.stepped) {
            return _steppedLineTo;
        }
        if (options.tension || options.cubicInterpolationMode === 'monotone') {
            return _bezierCurveTo;
        }
        return lineTo;
    }
    function pathVars(points, segment, params = {}) {
        const count = points.length;
        const { start: paramsStart = 0 , end: paramsEnd = count - 1  } = params;
        const { start: segmentStart , end: segmentEnd  } = segment;
        const start = Math.max(paramsStart, segmentStart);
        const end = Math.min(paramsEnd, segmentEnd);
        const outside = paramsStart < segmentStart && paramsEnd < segmentStart || paramsStart > segmentEnd && paramsEnd > segmentEnd;
        return {
            count,
            start,
            loop: segment.loop,
            ilen: end < start && !outside ? count + end - start : end - start
        };
    }
     function pathSegment(ctx, line, segment, params) {
        const { points , options  } = line;
        const { count , start , loop , ilen  } = pathVars(points, segment, params);
        const lineMethod = getLineMethod(options);
        let { move =true , reverse  } = params || {};
        let i, point, prev;
        for(i = 0; i <= ilen; ++i){
            point = points[(start + (reverse ? ilen - i : i)) % count];
            if (point.skip) {
                continue;
            } else if (move) {
                ctx.moveTo(point.x, point.y);
                move = false;
            } else {
                lineMethod(ctx, prev, point, reverse, options.stepped);
            }
            prev = point;
        }
        if (loop) {
            point = points[(start + (reverse ? ilen : 0)) % count];
            lineMethod(ctx, prev, point, reverse, options.stepped);
        }
        return !!loop;
    }
     function fastPathSegment(ctx, line, segment, params) {
        const points = line.points;
        const { count , start , ilen  } = pathVars(points, segment, params);
        const { move =true , reverse  } = params || {};
        let avgX = 0;
        let countX = 0;
        let i, point, prevX, minY, maxY, lastY;
        const pointIndex = (index)=>(start + (reverse ? ilen - index : index)) % count;
        const drawX = ()=>{
            if (minY !== maxY) {
                ctx.lineTo(avgX, maxY);
                ctx.lineTo(avgX, minY);
                ctx.lineTo(avgX, lastY);
            }
        };
        if (move) {
            point = points[pointIndex(0)];
            ctx.moveTo(point.x, point.y);
        }
        for(i = 0; i <= ilen; ++i){
            point = points[pointIndex(i)];
            if (point.skip) {
                continue;
            }
            const x = point.x;
            const y = point.y;
            const truncX = x | 0;
            if (truncX === prevX) {
                if (y < minY) {
                    minY = y;
                } else if (y > maxY) {
                    maxY = y;
                }
                avgX = (countX * avgX + x) / ++countX;
            } else {
                drawX();
                ctx.lineTo(x, y);
                prevX = truncX;
                countX = 0;
                minY = maxY = y;
            }
            lastY = y;
        }
        drawX();
    }
     function _getSegmentMethod(line) {
        const opts = line.options;
        const borderDash = opts.borderDash && opts.borderDash.length;
        const useFastPath = !line._decimated && !line._loop && !opts.tension && opts.cubicInterpolationMode !== 'monotone' && !opts.stepped && !borderDash;
        return useFastPath ? fastPathSegment : pathSegment;
    }
     function _getInterpolationMethod(options) {
        if (options.stepped) {
            return _steppedInterpolation;
        }
        if (options.tension || options.cubicInterpolationMode === 'monotone') {
            return _bezierInterpolation;
        }
        return _pointInLine;
    }
    function strokePathWithCache(ctx, line, start, count) {
        let path = line._path;
        if (!path) {
            path = line._path = new Path2D();
            if (line.path(path, start, count)) {
                path.closePath();
            }
        }
        setStyle(ctx, line.options);
        ctx.stroke(path);
    }
    function strokePathDirect(ctx, line, start, count) {
        const { segments , options  } = line;
        const segmentMethod = _getSegmentMethod(line);
        for (const segment of segments){
            setStyle(ctx, options, segment.style);
            ctx.beginPath();
            if (segmentMethod(ctx, line, segment, {
                start,
                end: start + count - 1
            })) {
                ctx.closePath();
            }
            ctx.stroke();
        }
    }
    const usePath2D = typeof Path2D === 'function';
    function draw(ctx, line, start, count) {
        if (usePath2D && !line.options.segment) {
            strokePathWithCache(ctx, line, start, count);
        } else {
            strokePathDirect(ctx, line, start, count);
        }
    }
    class LineElement extends Element$1 {
        static id = 'line';
     static defaults = {
            borderCapStyle: 'butt',
            borderDash: [],
            borderDashOffset: 0,
            borderJoinStyle: 'miter',
            borderWidth: 3,
            capBezierPoints: true,
            cubicInterpolationMode: 'default',
            fill: false,
            spanGaps: false,
            stepped: false,
            tension: 0
        };
     static defaultRoutes = {
            backgroundColor: 'backgroundColor',
            borderColor: 'borderColor'
        };
        static descriptors = {
            _scriptable: true,
            _indexable: (name)=>name !== 'borderDash' && name !== 'fill'
        };
        constructor(cfg){
            super();
            this.animated = true;
            this.options = undefined;
            this._chart = undefined;
            this._loop = undefined;
            this._fullLoop = undefined;
            this._path = undefined;
            this._points = undefined;
            this._segments = undefined;
            this._decimated = false;
            this._pointsUpdated = false;
            this._datasetIndex = undefined;
            if (cfg) {
                Object.assign(this, cfg);
            }
        }
        updateControlPoints(chartArea, indexAxis) {
            const options = this.options;
            if ((options.tension || options.cubicInterpolationMode === 'monotone') && !options.stepped && !this._pointsUpdated) {
                const loop = options.spanGaps ? this._loop : this._fullLoop;
                _updateBezierControlPoints(this._points, options, chartArea, loop, indexAxis);
                this._pointsUpdated = true;
            }
        }
        set points(points) {
            this._points = points;
            delete this._segments;
            delete this._path;
            this._pointsUpdated = false;
        }
        get points() {
            return this._points;
        }
        get segments() {
            return this._segments || (this._segments = _computeSegments(this, this.options.segment));
        }
     first() {
            const segments = this.segments;
            const points = this.points;
            return segments.length && points[segments[0].start];
        }
     last() {
            const segments = this.segments;
            const points = this.points;
            const count = segments.length;
            return count && points[segments[count - 1].end];
        }
     interpolate(point, property) {
            const options = this.options;
            const value = point[property];
            const points = this.points;
            const segments = _boundSegments(this, {
                property,
                start: value,
                end: value
            });
            if (!segments.length) {
                return;
            }
            const result = [];
            const _interpolate = _getInterpolationMethod(options);
            let i, ilen;
            for(i = 0, ilen = segments.length; i < ilen; ++i){
                const { start , end  } = segments[i];
                const p1 = points[start];
                const p2 = points[end];
                if (p1 === p2) {
                    result.push(p1);
                    continue;
                }
                const t = Math.abs((value - p1[property]) / (p2[property] - p1[property]));
                const interpolated = _interpolate(p1, p2, t, options.stepped);
                interpolated[property] = point[property];
                result.push(interpolated);
            }
            return result.length === 1 ? result[0] : result;
        }
     pathSegment(ctx, segment, params) {
            const segmentMethod = _getSegmentMethod(this);
            return segmentMethod(ctx, this, segment, params);
        }
     path(ctx, start, count) {
            const segments = this.segments;
            const segmentMethod = _getSegmentMethod(this);
            let loop = this._loop;
            start = start || 0;
            count = count || this.points.length - start;
            for (const segment of segments){
                loop &= segmentMethod(ctx, this, segment, {
                    start,
                    end: start + count - 1
                });
            }
            return !!loop;
        }
     draw(ctx, chartArea, start, count) {
            const options = this.options || {};
            const points = this.points || [];
            if (points.length && options.borderWidth) {
                ctx.save();
                draw(ctx, this, start, count);
                ctx.restore();
            }
            if (this.animated) {
                this._pointsUpdated = false;
                this._path = undefined;
            }
        }
    }

    function inRange$1(el, pos, axis, useFinalPosition) {
        const options = el.options;
        const { [axis]: value  } = el.getProps([
            axis
        ], useFinalPosition);
        return Math.abs(pos - value) < options.radius + options.hitRadius;
    }
    class PointElement extends Element$1 {
        static id = 'point';
        /**
       * @type {any}
       */ static defaults = {
            borderWidth: 1,
            hitRadius: 1,
            hoverBorderWidth: 1,
            hoverRadius: 4,
            pointStyle: 'circle',
            radius: 3,
            rotation: 0
        };
        /**
       * @type {any}
       */ static defaultRoutes = {
            backgroundColor: 'backgroundColor',
            borderColor: 'borderColor'
        };
        constructor(cfg){
            super();
            this.options = undefined;
            this.parsed = undefined;
            this.skip = undefined;
            this.stop = undefined;
            if (cfg) {
                Object.assign(this, cfg);
            }
        }
        inRange(mouseX, mouseY, useFinalPosition) {
            const options = this.options;
            const { x , y  } = this.getProps([
                'x',
                'y'
            ], useFinalPosition);
            return Math.pow(mouseX - x, 2) + Math.pow(mouseY - y, 2) < Math.pow(options.hitRadius + options.radius, 2);
        }
        inXRange(mouseX, useFinalPosition) {
            return inRange$1(this, mouseX, 'x', useFinalPosition);
        }
        inYRange(mouseY, useFinalPosition) {
            return inRange$1(this, mouseY, 'y', useFinalPosition);
        }
        getCenterPoint(useFinalPosition) {
            const { x , y  } = this.getProps([
                'x',
                'y'
            ], useFinalPosition);
            return {
                x,
                y
            };
        }
        size(options) {
            options = options || this.options || {};
            let radius = options.radius || 0;
            radius = Math.max(radius, radius && options.hoverRadius || 0);
            const borderWidth = radius && options.borderWidth || 0;
            return (radius + borderWidth) * 2;
        }
        draw(ctx, area) {
            const options = this.options;
            if (this.skip || options.radius < 0.1 || !_isPointInArea(this, area, this.size(options) / 2)) {
                return;
            }
            ctx.strokeStyle = options.borderColor;
            ctx.lineWidth = options.borderWidth;
            ctx.fillStyle = options.backgroundColor;
            drawPoint(ctx, options, this.x, this.y);
        }
        getRange() {
            const options = this.options || {};
            // @ts-expect-error Fallbacks should never be hit in practice
            return options.radius + options.hitRadius;
        }
    }

    function getBarBounds(bar, useFinalPosition) {
        const { x , y , base , width , height  } =  bar.getProps([
            'x',
            'y',
            'base',
            'width',
            'height'
        ], useFinalPosition);
        let left, right, top, bottom, half;
        if (bar.horizontal) {
            half = height / 2;
            left = Math.min(x, base);
            right = Math.max(x, base);
            top = y - half;
            bottom = y + half;
        } else {
            half = width / 2;
            left = x - half;
            right = x + half;
            top = Math.min(y, base);
            bottom = Math.max(y, base);
        }
        return {
            left,
            top,
            right,
            bottom
        };
    }
    function skipOrLimit(skip, value, min, max) {
        return skip ? 0 : _limitValue(value, min, max);
    }
    function parseBorderWidth(bar, maxW, maxH) {
        const value = bar.options.borderWidth;
        const skip = bar.borderSkipped;
        const o = toTRBL(value);
        return {
            t: skipOrLimit(skip.top, o.top, 0, maxH),
            r: skipOrLimit(skip.right, o.right, 0, maxW),
            b: skipOrLimit(skip.bottom, o.bottom, 0, maxH),
            l: skipOrLimit(skip.left, o.left, 0, maxW)
        };
    }
    function parseBorderRadius(bar, maxW, maxH) {
        const { enableBorderRadius  } = bar.getProps([
            'enableBorderRadius'
        ]);
        const value = bar.options.borderRadius;
        const o = toTRBLCorners(value);
        const maxR = Math.min(maxW, maxH);
        const skip = bar.borderSkipped;
        const enableBorder = enableBorderRadius || isObject(value);
        return {
            topLeft: skipOrLimit(!enableBorder || skip.top || skip.left, o.topLeft, 0, maxR),
            topRight: skipOrLimit(!enableBorder || skip.top || skip.right, o.topRight, 0, maxR),
            bottomLeft: skipOrLimit(!enableBorder || skip.bottom || skip.left, o.bottomLeft, 0, maxR),
            bottomRight: skipOrLimit(!enableBorder || skip.bottom || skip.right, o.bottomRight, 0, maxR)
        };
    }
    function boundingRects(bar) {
        const bounds = getBarBounds(bar);
        const width = bounds.right - bounds.left;
        const height = bounds.bottom - bounds.top;
        const border = parseBorderWidth(bar, width / 2, height / 2);
        const radius = parseBorderRadius(bar, width / 2, height / 2);
        return {
            outer: {
                x: bounds.left,
                y: bounds.top,
                w: width,
                h: height,
                radius
            },
            inner: {
                x: bounds.left + border.l,
                y: bounds.top + border.t,
                w: width - border.l - border.r,
                h: height - border.t - border.b,
                radius: {
                    topLeft: Math.max(0, radius.topLeft - Math.max(border.t, border.l)),
                    topRight: Math.max(0, radius.topRight - Math.max(border.t, border.r)),
                    bottomLeft: Math.max(0, radius.bottomLeft - Math.max(border.b, border.l)),
                    bottomRight: Math.max(0, radius.bottomRight - Math.max(border.b, border.r))
                }
            }
        };
    }
    function inRange(bar, x, y, useFinalPosition) {
        const skipX = x === null;
        const skipY = y === null;
        const skipBoth = skipX && skipY;
        const bounds = bar && !skipBoth && getBarBounds(bar, useFinalPosition);
        return bounds && (skipX || _isBetween(x, bounds.left, bounds.right)) && (skipY || _isBetween(y, bounds.top, bounds.bottom));
    }
    function hasRadius(radius) {
        return radius.topLeft || radius.topRight || radius.bottomLeft || radius.bottomRight;
    }
     function addNormalRectPath(ctx, rect) {
        ctx.rect(rect.x, rect.y, rect.w, rect.h);
    }
    function inflateRect(rect, amount, refRect = {}) {
        const x = rect.x !== refRect.x ? -amount : 0;
        const y = rect.y !== refRect.y ? -amount : 0;
        const w = (rect.x + rect.w !== refRect.x + refRect.w ? amount : 0) - x;
        const h = (rect.y + rect.h !== refRect.y + refRect.h ? amount : 0) - y;
        return {
            x: rect.x + x,
            y: rect.y + y,
            w: rect.w + w,
            h: rect.h + h,
            radius: rect.radius
        };
    }
    class BarElement extends Element$1 {
        static id = 'bar';
     static defaults = {
            borderSkipped: 'start',
            borderWidth: 0,
            borderRadius: 0,
            inflateAmount: 'auto',
            pointStyle: undefined
        };
     static defaultRoutes = {
            backgroundColor: 'backgroundColor',
            borderColor: 'borderColor'
        };
        constructor(cfg){
            super();
            this.options = undefined;
            this.horizontal = undefined;
            this.base = undefined;
            this.width = undefined;
            this.height = undefined;
            this.inflateAmount = undefined;
            if (cfg) {
                Object.assign(this, cfg);
            }
        }
        draw(ctx) {
            const { inflateAmount , options: { borderColor , backgroundColor  }  } = this;
            const { inner , outer  } = boundingRects(this);
            const addRectPath = hasRadius(outer.radius) ? addRoundedRectPath : addNormalRectPath;
            ctx.save();
            if (outer.w !== inner.w || outer.h !== inner.h) {
                ctx.beginPath();
                addRectPath(ctx, inflateRect(outer, inflateAmount, inner));
                ctx.clip();
                addRectPath(ctx, inflateRect(inner, -inflateAmount, outer));
                ctx.fillStyle = borderColor;
                ctx.fill('evenodd');
            }
            ctx.beginPath();
            addRectPath(ctx, inflateRect(inner, inflateAmount));
            ctx.fillStyle = backgroundColor;
            ctx.fill();
            ctx.restore();
        }
        inRange(mouseX, mouseY, useFinalPosition) {
            return inRange(this, mouseX, mouseY, useFinalPosition);
        }
        inXRange(mouseX, useFinalPosition) {
            return inRange(this, mouseX, null, useFinalPosition);
        }
        inYRange(mouseY, useFinalPosition) {
            return inRange(this, null, mouseY, useFinalPosition);
        }
        getCenterPoint(useFinalPosition) {
            const { x , y , base , horizontal  } =  this.getProps([
                'x',
                'y',
                'base',
                'horizontal'
            ], useFinalPosition);
            return {
                x: horizontal ? (x + base) / 2 : x,
                y: horizontal ? y : (y + base) / 2
            };
        }
        getRange(axis) {
            return axis === 'x' ? this.width / 2 : this.height / 2;
        }
    }

    var elements = /*#__PURE__*/Object.freeze({
    __proto__: null,
    ArcElement: ArcElement,
    LineElement: LineElement,
    PointElement: PointElement,
    BarElement: BarElement
    });

    const BORDER_COLORS = [
        'rgb(54, 162, 235)',
        'rgb(255, 99, 132)',
        'rgb(255, 159, 64)',
        'rgb(255, 205, 86)',
        'rgb(75, 192, 192)',
        'rgb(153, 102, 255)',
        'rgb(201, 203, 207)' // grey
    ];
    // Border colors with 50% transparency
    const BACKGROUND_COLORS = /* #__PURE__ */ BORDER_COLORS.map((color)=>color.replace('rgb(', 'rgba(').replace(')', ', 0.5)'));
    function getBorderColor(i) {
        return BORDER_COLORS[i % BORDER_COLORS.length];
    }
    function getBackgroundColor(i) {
        return BACKGROUND_COLORS[i % BACKGROUND_COLORS.length];
    }
    function colorizeDefaultDataset(dataset, i) {
        dataset.borderColor = getBorderColor(i);
        dataset.backgroundColor = getBackgroundColor(i);
        return ++i;
    }
    function colorizeDoughnutDataset(dataset, i) {
        dataset.backgroundColor = dataset.data.map(()=>getBorderColor(i++));
        return i;
    }
    function colorizePolarAreaDataset(dataset, i) {
        dataset.backgroundColor = dataset.data.map(()=>getBackgroundColor(i++));
        return i;
    }
    function getColorizer(chart) {
        let i = 0;
        return (dataset, datasetIndex)=>{
            const controller = chart.getDatasetMeta(datasetIndex).controller;
            if (controller instanceof DoughnutController) {
                i = colorizeDoughnutDataset(dataset, i);
            } else if (controller instanceof PolarAreaController) {
                i = colorizePolarAreaDataset(dataset, i);
            } else if (controller) {
                i = colorizeDefaultDataset(dataset, i);
            }
        };
    }
    function containsColorsDefinitions(descriptors) {
        let k;
        for(k in descriptors){
            if (descriptors[k].borderColor || descriptors[k].backgroundColor) {
                return true;
            }
        }
        return false;
    }
    var plugin_colors = {
        id: 'colors',
        defaults: {
            enabled: true,
            forceOverride: false
        },
        beforeLayout (chart, _args, options) {
            if (!options.enabled) {
                return;
            }
            const { options: { elements  } , data: { datasets  }  } = chart.config;
            if (!options.forceOverride && (containsColorsDefinitions(datasets) || elements && containsColorsDefinitions(elements))) {
                return;
            }
            const colorizer = getColorizer(chart);
            datasets.forEach(colorizer);
        }
    };

    function lttbDecimation(data, start, count, availableWidth, options) {
     const samples = options.samples || availableWidth;
        if (samples >= count) {
            return data.slice(start, start + count);
        }
        const decimated = [];
        const bucketWidth = (count - 2) / (samples - 2);
        let sampledIndex = 0;
        const endIndex = start + count - 1;
        let a = start;
        let i, maxAreaPoint, maxArea, area, nextA;
        decimated[sampledIndex++] = data[a];
        for(i = 0; i < samples - 2; i++){
            let avgX = 0;
            let avgY = 0;
            let j;
            const avgRangeStart = Math.floor((i + 1) * bucketWidth) + 1 + start;
            const avgRangeEnd = Math.min(Math.floor((i + 2) * bucketWidth) + 1, count) + start;
            const avgRangeLength = avgRangeEnd - avgRangeStart;
            for(j = avgRangeStart; j < avgRangeEnd; j++){
                avgX += data[j].x;
                avgY += data[j].y;
            }
            avgX /= avgRangeLength;
            avgY /= avgRangeLength;
            const rangeOffs = Math.floor(i * bucketWidth) + 1 + start;
            const rangeTo = Math.min(Math.floor((i + 1) * bucketWidth) + 1, count) + start;
            const { x: pointAx , y: pointAy  } = data[a];
            maxArea = area = -1;
            for(j = rangeOffs; j < rangeTo; j++){
                area = 0.5 * Math.abs((pointAx - avgX) * (data[j].y - pointAy) - (pointAx - data[j].x) * (avgY - pointAy));
                if (area > maxArea) {
                    maxArea = area;
                    maxAreaPoint = data[j];
                    nextA = j;
                }
            }
            decimated[sampledIndex++] = maxAreaPoint;
            a = nextA;
        }
        decimated[sampledIndex++] = data[endIndex];
        return decimated;
    }
    function minMaxDecimation(data, start, count, availableWidth) {
        let avgX = 0;
        let countX = 0;
        let i, point, x, y, prevX, minIndex, maxIndex, startIndex, minY, maxY;
        const decimated = [];
        const endIndex = start + count - 1;
        const xMin = data[start].x;
        const xMax = data[endIndex].x;
        const dx = xMax - xMin;
        for(i = start; i < start + count; ++i){
            point = data[i];
            x = (point.x - xMin) / dx * availableWidth;
            y = point.y;
            const truncX = x | 0;
            if (truncX === prevX) {
                if (y < minY) {
                    minY = y;
                    minIndex = i;
                } else if (y > maxY) {
                    maxY = y;
                    maxIndex = i;
                }
                avgX = (countX * avgX + point.x) / ++countX;
            } else {
                const lastIndex = i - 1;
                if (!isNullOrUndef(minIndex) && !isNullOrUndef(maxIndex)) {
                    const intermediateIndex1 = Math.min(minIndex, maxIndex);
                    const intermediateIndex2 = Math.max(minIndex, maxIndex);
                    if (intermediateIndex1 !== startIndex && intermediateIndex1 !== lastIndex) {
                        decimated.push({
                            ...data[intermediateIndex1],
                            x: avgX
                        });
                    }
                    if (intermediateIndex2 !== startIndex && intermediateIndex2 !== lastIndex) {
                        decimated.push({
                            ...data[intermediateIndex2],
                            x: avgX
                        });
                    }
                }
                if (i > 0 && lastIndex !== startIndex) {
                    decimated.push(data[lastIndex]);
                }
                decimated.push(point);
                prevX = truncX;
                countX = 0;
                minY = maxY = y;
                minIndex = maxIndex = startIndex = i;
            }
        }
        return decimated;
    }
    function cleanDecimatedDataset(dataset) {
        if (dataset._decimated) {
            const data = dataset._data;
            delete dataset._decimated;
            delete dataset._data;
            Object.defineProperty(dataset, 'data', {
                value: data
            });
        }
    }
    function cleanDecimatedData(chart) {
        chart.data.datasets.forEach((dataset)=>{
            cleanDecimatedDataset(dataset);
        });
    }
    function getStartAndCountOfVisiblePointsSimplified(meta, points) {
        const pointCount = points.length;
        let start = 0;
        let count;
        const { iScale  } = meta;
        const { min , max , minDefined , maxDefined  } = iScale.getUserBounds();
        if (minDefined) {
            start = _limitValue(_lookupByKey(points, iScale.axis, min).lo, 0, pointCount - 1);
        }
        if (maxDefined) {
            count = _limitValue(_lookupByKey(points, iScale.axis, max).hi + 1, start, pointCount) - start;
        } else {
            count = pointCount - start;
        }
        return {
            start,
            count
        };
    }
    var plugin_decimation = {
        id: 'decimation',
        defaults: {
            algorithm: 'min-max',
            enabled: false
        },
        beforeElementsUpdate: (chart, args, options)=>{
            if (!options.enabled) {
                cleanDecimatedData(chart);
                return;
            }
            const availableWidth = chart.width;
            chart.data.datasets.forEach((dataset, datasetIndex)=>{
                const { _data , indexAxis  } = dataset;
                const meta = chart.getDatasetMeta(datasetIndex);
                const data = _data || dataset.data;
                if (resolve([
                    indexAxis,
                    chart.options.indexAxis
                ]) === 'y') {
                    return;
                }
                if (!meta.controller.supportsDecimation) {
                    return;
                }
                const xAxis = chart.scales[meta.xAxisID];
                if (xAxis.type !== 'linear' && xAxis.type !== 'time') {
                    return;
                }
                if (chart.options.parsing) {
                    return;
                }
                let { start , count  } = getStartAndCountOfVisiblePointsSimplified(meta, data);
                const threshold = options.threshold || 4 * availableWidth;
                if (count <= threshold) {
                    cleanDecimatedDataset(dataset);
                    return;
                }
                if (isNullOrUndef(_data)) {
                    dataset._data = data;
                    delete dataset.data;
                    Object.defineProperty(dataset, 'data', {
                        configurable: true,
                        enumerable: true,
                        get: function() {
                            return this._decimated;
                        },
                        set: function(d) {
                            this._data = d;
                        }
                    });
                }
                let decimated;
                switch(options.algorithm){
                    case 'lttb':
                        decimated = lttbDecimation(data, start, count, availableWidth, options);
                        break;
                    case 'min-max':
                        decimated = minMaxDecimation(data, start, count, availableWidth);
                        break;
                    default:
                        throw new Error(`Unsupported decimation algorithm '${options.algorithm}'`);
                }
                dataset._decimated = decimated;
            });
        },
        destroy (chart) {
            cleanDecimatedData(chart);
        }
    };

    function _segments(line, target, property) {
        const segments = line.segments;
        const points = line.points;
        const tpoints = target.points;
        const parts = [];
        for (const segment of segments){
            let { start , end  } = segment;
            end = _findSegmentEnd(start, end, points);
            const bounds = _getBounds(property, points[start], points[end], segment.loop);
            if (!target.segments) {
                parts.push({
                    source: segment,
                    target: bounds,
                    start: points[start],
                    end: points[end]
                });
                continue;
            }
            const targetSegments = _boundSegments(target, bounds);
            for (const tgt of targetSegments){
                const subBounds = _getBounds(property, tpoints[tgt.start], tpoints[tgt.end], tgt.loop);
                const fillSources = _boundSegment(segment, points, subBounds);
                for (const fillSource of fillSources){
                    parts.push({
                        source: fillSource,
                        target: tgt,
                        start: {
                            [property]: _getEdge(bounds, subBounds, 'start', Math.max)
                        },
                        end: {
                            [property]: _getEdge(bounds, subBounds, 'end', Math.min)
                        }
                    });
                }
            }
        }
        return parts;
    }
    function _getBounds(property, first, last, loop) {
        if (loop) {
            return;
        }
        let start = first[property];
        let end = last[property];
        if (property === 'angle') {
            start = _normalizeAngle(start);
            end = _normalizeAngle(end);
        }
        return {
            property,
            start,
            end
        };
    }
    function _pointsFromSegments(boundary, line) {
        const { x =null , y =null  } = boundary || {};
        const linePoints = line.points;
        const points = [];
        line.segments.forEach(({ start , end  })=>{
            end = _findSegmentEnd(start, end, linePoints);
            const first = linePoints[start];
            const last = linePoints[end];
            if (y !== null) {
                points.push({
                    x: first.x,
                    y
                });
                points.push({
                    x: last.x,
                    y
                });
            } else if (x !== null) {
                points.push({
                    x,
                    y: first.y
                });
                points.push({
                    x,
                    y: last.y
                });
            }
        });
        return points;
    }
    function _findSegmentEnd(start, end, points) {
        for(; end > start; end--){
            const point = points[end];
            if (!isNaN(point.x) && !isNaN(point.y)) {
                break;
            }
        }
        return end;
    }
    function _getEdge(a, b, prop, fn) {
        if (a && b) {
            return fn(a[prop], b[prop]);
        }
        return a ? a[prop] : b ? b[prop] : 0;
    }

    function _createBoundaryLine(boundary, line) {
        let points = [];
        let _loop = false;
        if (isArray(boundary)) {
            _loop = true;
            points = boundary;
        } else {
            points = _pointsFromSegments(boundary, line);
        }
        return points.length ? new LineElement({
            points,
            options: {
                tension: 0
            },
            _loop,
            _fullLoop: _loop
        }) : null;
    }
    function _shouldApplyFill(source) {
        return source && source.fill !== false;
    }

    function _resolveTarget(sources, index, propagate) {
        const source = sources[index];
        let fill = source.fill;
        const visited = [
            index
        ];
        let target;
        if (!propagate) {
            return fill;
        }
        while(fill !== false && visited.indexOf(fill) === -1){
            if (!isNumberFinite(fill)) {
                return fill;
            }
            target = sources[fill];
            if (!target) {
                return false;
            }
            if (target.visible) {
                return fill;
            }
            visited.push(fill);
            fill = target.fill;
        }
        return false;
    }
     function _decodeFill(line, index, count) {
         const fill = parseFillOption(line);
        if (isObject(fill)) {
            return isNaN(fill.value) ? false : fill;
        }
        let target = parseFloat(fill);
        if (isNumberFinite(target) && Math.floor(target) === target) {
            return decodeTargetIndex(fill[0], index, target, count);
        }
        return [
            'origin',
            'start',
            'end',
            'stack',
            'shape'
        ].indexOf(fill) >= 0 && fill;
    }
    function decodeTargetIndex(firstCh, index, target, count) {
        if (firstCh === '-' || firstCh === '+') {
            target = index + target;
        }
        if (target === index || target < 0 || target >= count) {
            return false;
        }
        return target;
    }
     function _getTargetPixel(fill, scale) {
        let pixel = null;
        if (fill === 'start') {
            pixel = scale.bottom;
        } else if (fill === 'end') {
            pixel = scale.top;
        } else if (isObject(fill)) {
            pixel = scale.getPixelForValue(fill.value);
        } else if (scale.getBasePixel) {
            pixel = scale.getBasePixel();
        }
        return pixel;
    }
     function _getTargetValue(fill, scale, startValue) {
        let value;
        if (fill === 'start') {
            value = startValue;
        } else if (fill === 'end') {
            value = scale.options.reverse ? scale.min : scale.max;
        } else if (isObject(fill)) {
            value = fill.value;
        } else {
            value = scale.getBaseValue();
        }
        return value;
    }
     function parseFillOption(line) {
        const options = line.options;
        const fillOption = options.fill;
        let fill = valueOrDefault(fillOption && fillOption.target, fillOption);
        if (fill === undefined) {
            fill = !!options.backgroundColor;
        }
        if (fill === false || fill === null) {
            return false;
        }
        if (fill === true) {
            return 'origin';
        }
        return fill;
    }

    function _buildStackLine(source) {
        const { scale , index , line  } = source;
        const points = [];
        const segments = line.segments;
        const sourcePoints = line.points;
        const linesBelow = getLinesBelow(scale, index);
        linesBelow.push(_createBoundaryLine({
            x: null,
            y: scale.bottom
        }, line));
        for(let i = 0; i < segments.length; i++){
            const segment = segments[i];
            for(let j = segment.start; j <= segment.end; j++){
                addPointsBelow(points, sourcePoints[j], linesBelow);
            }
        }
        return new LineElement({
            points,
            options: {}
        });
    }
     function getLinesBelow(scale, index) {
        const below = [];
        const metas = scale.getMatchingVisibleMetas('line');
        for(let i = 0; i < metas.length; i++){
            const meta = metas[i];
            if (meta.index === index) {
                break;
            }
            if (!meta.hidden) {
                below.unshift(meta.dataset);
            }
        }
        return below;
    }
     function addPointsBelow(points, sourcePoint, linesBelow) {
        const postponed = [];
        for(let j = 0; j < linesBelow.length; j++){
            const line = linesBelow[j];
            const { first , last , point  } = findPoint(line, sourcePoint, 'x');
            if (!point || first && last) {
                continue;
            }
            if (first) {
                postponed.unshift(point);
            } else {
                points.push(point);
                if (!last) {
                    break;
                }
            }
        }
        points.push(...postponed);
    }
     function findPoint(line, sourcePoint, property) {
        const point = line.interpolate(sourcePoint, property);
        if (!point) {
            return {};
        }
        const pointValue = point[property];
        const segments = line.segments;
        const linePoints = line.points;
        let first = false;
        let last = false;
        for(let i = 0; i < segments.length; i++){
            const segment = segments[i];
            const firstValue = linePoints[segment.start][property];
            const lastValue = linePoints[segment.end][property];
            if (_isBetween(pointValue, firstValue, lastValue)) {
                first = pointValue === firstValue;
                last = pointValue === lastValue;
                break;
            }
        }
        return {
            first,
            last,
            point
        };
    }

    class simpleArc {
        constructor(opts){
            this.x = opts.x;
            this.y = opts.y;
            this.radius = opts.radius;
        }
        pathSegment(ctx, bounds, opts) {
            const { x , y , radius  } = this;
            bounds = bounds || {
                start: 0,
                end: TAU
            };
            ctx.arc(x, y, radius, bounds.end, bounds.start, true);
            return !opts.bounds;
        }
        interpolate(point) {
            const { x , y , radius  } = this;
            const angle = point.angle;
            return {
                x: x + Math.cos(angle) * radius,
                y: y + Math.sin(angle) * radius,
                angle
            };
        }
    }

    function _getTarget(source) {
        const { chart , fill , line  } = source;
        if (isNumberFinite(fill)) {
            return getLineByIndex(chart, fill);
        }
        if (fill === 'stack') {
            return _buildStackLine(source);
        }
        if (fill === 'shape') {
            return true;
        }
        const boundary = computeBoundary(source);
        if (boundary instanceof simpleArc) {
            return boundary;
        }
        return _createBoundaryLine(boundary, line);
    }
     function getLineByIndex(chart, index) {
        const meta = chart.getDatasetMeta(index);
        const visible = meta && chart.isDatasetVisible(index);
        return visible ? meta.dataset : null;
    }
    function computeBoundary(source) {
        const scale = source.scale || {};
        if (scale.getPointPositionForValue) {
            return computeCircularBoundary(source);
        }
        return computeLinearBoundary(source);
    }
    function computeLinearBoundary(source) {
        const { scale ={} , fill  } = source;
        const pixel = _getTargetPixel(fill, scale);
        if (isNumberFinite(pixel)) {
            const horizontal = scale.isHorizontal();
            return {
                x: horizontal ? pixel : null,
                y: horizontal ? null : pixel
            };
        }
        return null;
    }
    function computeCircularBoundary(source) {
        const { scale , fill  } = source;
        const options = scale.options;
        const length = scale.getLabels().length;
        const start = options.reverse ? scale.max : scale.min;
        const value = _getTargetValue(fill, scale, start);
        const target = [];
        if (options.grid.circular) {
            const center = scale.getPointPositionForValue(0, start);
            return new simpleArc({
                x: center.x,
                y: center.y,
                radius: scale.getDistanceFromCenterForValue(value)
            });
        }
        for(let i = 0; i < length; ++i){
            target.push(scale.getPointPositionForValue(i, value));
        }
        return target;
    }

    function _drawfill(ctx, source, area) {
        const target = _getTarget(source);
        const { line , scale , axis  } = source;
        const lineOpts = line.options;
        const fillOption = lineOpts.fill;
        const color = lineOpts.backgroundColor;
        const { above =color , below =color  } = fillOption || {};
        if (target && line.points.length) {
            clipArea(ctx, area);
            doFill(ctx, {
                line,
                target,
                above,
                below,
                area,
                scale,
                axis
            });
            unclipArea(ctx);
        }
    }
    function doFill(ctx, cfg) {
        const { line , target , above , below , area , scale  } = cfg;
        const property = line._loop ? 'angle' : cfg.axis;
        ctx.save();
        if (property === 'x' && below !== above) {
            clipVertical(ctx, target, area.top);
            fill(ctx, {
                line,
                target,
                color: above,
                scale,
                property
            });
            ctx.restore();
            ctx.save();
            clipVertical(ctx, target, area.bottom);
        }
        fill(ctx, {
            line,
            target,
            color: below,
            scale,
            property
        });
        ctx.restore();
    }
    function clipVertical(ctx, target, clipY) {
        const { segments , points  } = target;
        let first = true;
        let lineLoop = false;
        ctx.beginPath();
        for (const segment of segments){
            const { start , end  } = segment;
            const firstPoint = points[start];
            const lastPoint = points[_findSegmentEnd(start, end, points)];
            if (first) {
                ctx.moveTo(firstPoint.x, firstPoint.y);
                first = false;
            } else {
                ctx.lineTo(firstPoint.x, clipY);
                ctx.lineTo(firstPoint.x, firstPoint.y);
            }
            lineLoop = !!target.pathSegment(ctx, segment, {
                move: lineLoop
            });
            if (lineLoop) {
                ctx.closePath();
            } else {
                ctx.lineTo(lastPoint.x, clipY);
            }
        }
        ctx.lineTo(target.first().x, clipY);
        ctx.closePath();
        ctx.clip();
    }
    function fill(ctx, cfg) {
        const { line , target , property , color , scale  } = cfg;
        const segments = _segments(line, target, property);
        for (const { source: src , target: tgt , start , end  } of segments){
            const { style: { backgroundColor =color  } = {}  } = src;
            const notShape = target !== true;
            ctx.save();
            ctx.fillStyle = backgroundColor;
            clipBounds(ctx, scale, notShape && _getBounds(property, start, end));
            ctx.beginPath();
            const lineLoop = !!line.pathSegment(ctx, src);
            let loop;
            if (notShape) {
                if (lineLoop) {
                    ctx.closePath();
                } else {
                    interpolatedLineTo(ctx, target, end, property);
                }
                const targetLoop = !!target.pathSegment(ctx, tgt, {
                    move: lineLoop,
                    reverse: true
                });
                loop = lineLoop && targetLoop;
                if (!loop) {
                    interpolatedLineTo(ctx, target, start, property);
                }
            }
            ctx.closePath();
            ctx.fill(loop ? 'evenodd' : 'nonzero');
            ctx.restore();
        }
    }
    function clipBounds(ctx, scale, bounds) {
        const { top , bottom  } = scale.chart.chartArea;
        const { property , start , end  } = bounds || {};
        if (property === 'x') {
            ctx.beginPath();
            ctx.rect(start, top, end - start, bottom - top);
            ctx.clip();
        }
    }
    function interpolatedLineTo(ctx, target, point, property) {
        const interpolatedPoint = target.interpolate(point, property);
        if (interpolatedPoint) {
            ctx.lineTo(interpolatedPoint.x, interpolatedPoint.y);
        }
    }

    var index = {
        id: 'filler',
        afterDatasetsUpdate (chart, _args, options) {
            const count = (chart.data.datasets || []).length;
            const sources = [];
            let meta, i, line, source;
            for(i = 0; i < count; ++i){
                meta = chart.getDatasetMeta(i);
                line = meta.dataset;
                source = null;
                if (line && line.options && line instanceof LineElement) {
                    source = {
                        visible: chart.isDatasetVisible(i),
                        index: i,
                        fill: _decodeFill(line, i, count),
                        chart,
                        axis: meta.controller.options.indexAxis,
                        scale: meta.vScale,
                        line
                    };
                }
                meta.$filler = source;
                sources.push(source);
            }
            for(i = 0; i < count; ++i){
                source = sources[i];
                if (!source || source.fill === false) {
                    continue;
                }
                source.fill = _resolveTarget(sources, i, options.propagate);
            }
        },
        beforeDraw (chart, _args, options) {
            const draw = options.drawTime === 'beforeDraw';
            const metasets = chart.getSortedVisibleDatasetMetas();
            const area = chart.chartArea;
            for(let i = metasets.length - 1; i >= 0; --i){
                const source = metasets[i].$filler;
                if (!source) {
                    continue;
                }
                source.line.updateControlPoints(area, source.axis);
                if (draw && source.fill) {
                    _drawfill(chart.ctx, source, area);
                }
            }
        },
        beforeDatasetsDraw (chart, _args, options) {
            if (options.drawTime !== 'beforeDatasetsDraw') {
                return;
            }
            const metasets = chart.getSortedVisibleDatasetMetas();
            for(let i = metasets.length - 1; i >= 0; --i){
                const source = metasets[i].$filler;
                if (_shouldApplyFill(source)) {
                    _drawfill(chart.ctx, source, chart.chartArea);
                }
            }
        },
        beforeDatasetDraw (chart, args, options) {
            const source = args.meta.$filler;
            if (!_shouldApplyFill(source) || options.drawTime !== 'beforeDatasetDraw') {
                return;
            }
            _drawfill(chart.ctx, source, chart.chartArea);
        },
        defaults: {
            propagate: true,
            drawTime: 'beforeDatasetDraw'
        }
    };

    const getBoxSize = (labelOpts, fontSize)=>{
        let { boxHeight =fontSize , boxWidth =fontSize  } = labelOpts;
        if (labelOpts.usePointStyle) {
            boxHeight = Math.min(boxHeight, fontSize);
            boxWidth = labelOpts.pointStyleWidth || Math.min(boxWidth, fontSize);
        }
        return {
            boxWidth,
            boxHeight,
            itemHeight: Math.max(fontSize, boxHeight)
        };
    };
    const itemsEqual = (a, b)=>a !== null && b !== null && a.datasetIndex === b.datasetIndex && a.index === b.index;
    class Legend extends Element$1 {
     constructor(config){
            super();
            this._added = false;
            this.legendHitBoxes = [];
     this._hoveredItem = null;
            this.doughnutMode = false;
            this.chart = config.chart;
            this.options = config.options;
            this.ctx = config.ctx;
            this.legendItems = undefined;
            this.columnSizes = undefined;
            this.lineWidths = undefined;
            this.maxHeight = undefined;
            this.maxWidth = undefined;
            this.top = undefined;
            this.bottom = undefined;
            this.left = undefined;
            this.right = undefined;
            this.height = undefined;
            this.width = undefined;
            this._margins = undefined;
            this.position = undefined;
            this.weight = undefined;
            this.fullSize = undefined;
        }
        update(maxWidth, maxHeight, margins) {
            this.maxWidth = maxWidth;
            this.maxHeight = maxHeight;
            this._margins = margins;
            this.setDimensions();
            this.buildLabels();
            this.fit();
        }
        setDimensions() {
            if (this.isHorizontal()) {
                this.width = this.maxWidth;
                this.left = this._margins.left;
                this.right = this.width;
            } else {
                this.height = this.maxHeight;
                this.top = this._margins.top;
                this.bottom = this.height;
            }
        }
        buildLabels() {
            const labelOpts = this.options.labels || {};
            let legendItems = callback(labelOpts.generateLabels, [
                this.chart
            ], this) || [];
            if (labelOpts.filter) {
                legendItems = legendItems.filter((item)=>labelOpts.filter(item, this.chart.data));
            }
            if (labelOpts.sort) {
                legendItems = legendItems.sort((a, b)=>labelOpts.sort(a, b, this.chart.data));
            }
            if (this.options.reverse) {
                legendItems.reverse();
            }
            this.legendItems = legendItems;
        }
        fit() {
            const { options , ctx  } = this;
            if (!options.display) {
                this.width = this.height = 0;
                return;
            }
            const labelOpts = options.labels;
            const labelFont = toFont(labelOpts.font);
            const fontSize = labelFont.size;
            const titleHeight = this._computeTitleHeight();
            const { boxWidth , itemHeight  } = getBoxSize(labelOpts, fontSize);
            let width, height;
            ctx.font = labelFont.string;
            if (this.isHorizontal()) {
                width = this.maxWidth;
                height = this._fitRows(titleHeight, fontSize, boxWidth, itemHeight) + 10;
            } else {
                height = this.maxHeight;
                width = this._fitCols(titleHeight, labelFont, boxWidth, itemHeight) + 10;
            }
            this.width = Math.min(width, options.maxWidth || this.maxWidth);
            this.height = Math.min(height, options.maxHeight || this.maxHeight);
        }
     _fitRows(titleHeight, fontSize, boxWidth, itemHeight) {
            const { ctx , maxWidth , options: { labels: { padding  }  }  } = this;
            const hitboxes = this.legendHitBoxes = [];
            const lineWidths = this.lineWidths = [
                0
            ];
            const lineHeight = itemHeight + padding;
            let totalHeight = titleHeight;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            let row = -1;
            let top = -lineHeight;
            this.legendItems.forEach((legendItem, i)=>{
                const itemWidth = boxWidth + fontSize / 2 + ctx.measureText(legendItem.text).width;
                if (i === 0 || lineWidths[lineWidths.length - 1] + itemWidth + 2 * padding > maxWidth) {
                    totalHeight += lineHeight;
                    lineWidths[lineWidths.length - (i > 0 ? 0 : 1)] = 0;
                    top += lineHeight;
                    row++;
                }
                hitboxes[i] = {
                    left: 0,
                    top,
                    row,
                    width: itemWidth,
                    height: itemHeight
                };
                lineWidths[lineWidths.length - 1] += itemWidth + padding;
            });
            return totalHeight;
        }
        _fitCols(titleHeight, labelFont, boxWidth, _itemHeight) {
            const { ctx , maxHeight , options: { labels: { padding  }  }  } = this;
            const hitboxes = this.legendHitBoxes = [];
            const columnSizes = this.columnSizes = [];
            const heightLimit = maxHeight - titleHeight;
            let totalWidth = padding;
            let currentColWidth = 0;
            let currentColHeight = 0;
            let left = 0;
            let col = 0;
            this.legendItems.forEach((legendItem, i)=>{
                const { itemWidth , itemHeight  } = calculateItemSize(boxWidth, labelFont, ctx, legendItem, _itemHeight);
                if (i > 0 && currentColHeight + itemHeight + 2 * padding > heightLimit) {
                    totalWidth += currentColWidth + padding;
                    columnSizes.push({
                        width: currentColWidth,
                        height: currentColHeight
                    });
                    left += currentColWidth + padding;
                    col++;
                    currentColWidth = currentColHeight = 0;
                }
                hitboxes[i] = {
                    left,
                    top: currentColHeight,
                    col,
                    width: itemWidth,
                    height: itemHeight
                };
                currentColWidth = Math.max(currentColWidth, itemWidth);
                currentColHeight += itemHeight + padding;
            });
            totalWidth += currentColWidth;
            columnSizes.push({
                width: currentColWidth,
                height: currentColHeight
            });
            return totalWidth;
        }
        adjustHitBoxes() {
            if (!this.options.display) {
                return;
            }
            const titleHeight = this._computeTitleHeight();
            const { legendHitBoxes: hitboxes , options: { align , labels: { padding  } , rtl  }  } = this;
            const rtlHelper = getRtlAdapter(rtl, this.left, this.width);
            if (this.isHorizontal()) {
                let row = 0;
                let left = _alignStartEnd(align, this.left + padding, this.right - this.lineWidths[row]);
                for (const hitbox of hitboxes){
                    if (row !== hitbox.row) {
                        row = hitbox.row;
                        left = _alignStartEnd(align, this.left + padding, this.right - this.lineWidths[row]);
                    }
                    hitbox.top += this.top + titleHeight + padding;
                    hitbox.left = rtlHelper.leftForLtr(rtlHelper.x(left), hitbox.width);
                    left += hitbox.width + padding;
                }
            } else {
                let col = 0;
                let top = _alignStartEnd(align, this.top + titleHeight + padding, this.bottom - this.columnSizes[col].height);
                for (const hitbox1 of hitboxes){
                    if (hitbox1.col !== col) {
                        col = hitbox1.col;
                        top = _alignStartEnd(align, this.top + titleHeight + padding, this.bottom - this.columnSizes[col].height);
                    }
                    hitbox1.top = top;
                    hitbox1.left += this.left + padding;
                    hitbox1.left = rtlHelper.leftForLtr(rtlHelper.x(hitbox1.left), hitbox1.width);
                    top += hitbox1.height + padding;
                }
            }
        }
        isHorizontal() {
            return this.options.position === 'top' || this.options.position === 'bottom';
        }
        draw() {
            if (this.options.display) {
                const ctx = this.ctx;
                clipArea(ctx, this);
                this._draw();
                unclipArea(ctx);
            }
        }
     _draw() {
            const { options: opts , columnSizes , lineWidths , ctx  } = this;
            const { align , labels: labelOpts  } = opts;
            const defaultColor = defaults.color;
            const rtlHelper = getRtlAdapter(opts.rtl, this.left, this.width);
            const labelFont = toFont(labelOpts.font);
            const { padding  } = labelOpts;
            const fontSize = labelFont.size;
            const halfFontSize = fontSize / 2;
            let cursor;
            this.drawTitle();
            ctx.textAlign = rtlHelper.textAlign('left');
            ctx.textBaseline = 'middle';
            ctx.lineWidth = 0.5;
            ctx.font = labelFont.string;
            const { boxWidth , boxHeight , itemHeight  } = getBoxSize(labelOpts, fontSize);
            const drawLegendBox = function(x, y, legendItem) {
                if (isNaN(boxWidth) || boxWidth <= 0 || isNaN(boxHeight) || boxHeight < 0) {
                    return;
                }
                ctx.save();
                const lineWidth = valueOrDefault(legendItem.lineWidth, 1);
                ctx.fillStyle = valueOrDefault(legendItem.fillStyle, defaultColor);
                ctx.lineCap = valueOrDefault(legendItem.lineCap, 'butt');
                ctx.lineDashOffset = valueOrDefault(legendItem.lineDashOffset, 0);
                ctx.lineJoin = valueOrDefault(legendItem.lineJoin, 'miter');
                ctx.lineWidth = lineWidth;
                ctx.strokeStyle = valueOrDefault(legendItem.strokeStyle, defaultColor);
                ctx.setLineDash(valueOrDefault(legendItem.lineDash, []));
                if (labelOpts.usePointStyle) {
                    const drawOptions = {
                        radius: boxHeight * Math.SQRT2 / 2,
                        pointStyle: legendItem.pointStyle,
                        rotation: legendItem.rotation,
                        borderWidth: lineWidth
                    };
                    const centerX = rtlHelper.xPlus(x, boxWidth / 2);
                    const centerY = y + halfFontSize;
                    drawPointLegend(ctx, drawOptions, centerX, centerY, labelOpts.pointStyleWidth && boxWidth);
                } else {
                    const yBoxTop = y + Math.max((fontSize - boxHeight) / 2, 0);
                    const xBoxLeft = rtlHelper.leftForLtr(x, boxWidth);
                    const borderRadius = toTRBLCorners(legendItem.borderRadius);
                    ctx.beginPath();
                    if (Object.values(borderRadius).some((v)=>v !== 0)) {
                        addRoundedRectPath(ctx, {
                            x: xBoxLeft,
                            y: yBoxTop,
                            w: boxWidth,
                            h: boxHeight,
                            radius: borderRadius
                        });
                    } else {
                        ctx.rect(xBoxLeft, yBoxTop, boxWidth, boxHeight);
                    }
                    ctx.fill();
                    if (lineWidth !== 0) {
                        ctx.stroke();
                    }
                }
                ctx.restore();
            };
            const fillText = function(x, y, legendItem) {
                renderText(ctx, legendItem.text, x, y + itemHeight / 2, labelFont, {
                    strikethrough: legendItem.hidden,
                    textAlign: rtlHelper.textAlign(legendItem.textAlign)
                });
            };
            const isHorizontal = this.isHorizontal();
            const titleHeight = this._computeTitleHeight();
            if (isHorizontal) {
                cursor = {
                    x: _alignStartEnd(align, this.left + padding, this.right - lineWidths[0]),
                    y: this.top + padding + titleHeight,
                    line: 0
                };
            } else {
                cursor = {
                    x: this.left + padding,
                    y: _alignStartEnd(align, this.top + titleHeight + padding, this.bottom - columnSizes[0].height),
                    line: 0
                };
            }
            overrideTextDirection(this.ctx, opts.textDirection);
            const lineHeight = itemHeight + padding;
            this.legendItems.forEach((legendItem, i)=>{
                ctx.strokeStyle = legendItem.fontColor;
                ctx.fillStyle = legendItem.fontColor;
                const textWidth = ctx.measureText(legendItem.text).width;
                const textAlign = rtlHelper.textAlign(legendItem.textAlign || (legendItem.textAlign = labelOpts.textAlign));
                const width = boxWidth + halfFontSize + textWidth;
                let x = cursor.x;
                let y = cursor.y;
                rtlHelper.setWidth(this.width);
                if (isHorizontal) {
                    if (i > 0 && x + width + padding > this.right) {
                        y = cursor.y += lineHeight;
                        cursor.line++;
                        x = cursor.x = _alignStartEnd(align, this.left + padding, this.right - lineWidths[cursor.line]);
                    }
                } else if (i > 0 && y + lineHeight > this.bottom) {
                    x = cursor.x = x + columnSizes[cursor.line].width + padding;
                    cursor.line++;
                    y = cursor.y = _alignStartEnd(align, this.top + titleHeight + padding, this.bottom - columnSizes[cursor.line].height);
                }
                const realX = rtlHelper.x(x);
                drawLegendBox(realX, y, legendItem);
                x = _textX(textAlign, x + boxWidth + halfFontSize, isHorizontal ? x + width : this.right, opts.rtl);
                fillText(rtlHelper.x(x), y, legendItem);
                if (isHorizontal) {
                    cursor.x += width + padding;
                } else if (typeof legendItem.text !== 'string') {
                    const fontLineHeight = labelFont.lineHeight;
                    cursor.y += calculateLegendItemHeight(legendItem, fontLineHeight);
                } else {
                    cursor.y += lineHeight;
                }
            });
            restoreTextDirection(this.ctx, opts.textDirection);
        }
     drawTitle() {
            const opts = this.options;
            const titleOpts = opts.title;
            const titleFont = toFont(titleOpts.font);
            const titlePadding = toPadding(titleOpts.padding);
            if (!titleOpts.display) {
                return;
            }
            const rtlHelper = getRtlAdapter(opts.rtl, this.left, this.width);
            const ctx = this.ctx;
            const position = titleOpts.position;
            const halfFontSize = titleFont.size / 2;
            const topPaddingPlusHalfFontSize = titlePadding.top + halfFontSize;
            let y;
            let left = this.left;
            let maxWidth = this.width;
            if (this.isHorizontal()) {
                maxWidth = Math.max(...this.lineWidths);
                y = this.top + topPaddingPlusHalfFontSize;
                left = _alignStartEnd(opts.align, left, this.right - maxWidth);
            } else {
                const maxHeight = this.columnSizes.reduce((acc, size)=>Math.max(acc, size.height), 0);
                y = topPaddingPlusHalfFontSize + _alignStartEnd(opts.align, this.top, this.bottom - maxHeight - opts.labels.padding - this._computeTitleHeight());
            }
            const x = _alignStartEnd(position, left, left + maxWidth);
            ctx.textAlign = rtlHelper.textAlign(_toLeftRightCenter(position));
            ctx.textBaseline = 'middle';
            ctx.strokeStyle = titleOpts.color;
            ctx.fillStyle = titleOpts.color;
            ctx.font = titleFont.string;
            renderText(ctx, titleOpts.text, x, y, titleFont);
        }
     _computeTitleHeight() {
            const titleOpts = this.options.title;
            const titleFont = toFont(titleOpts.font);
            const titlePadding = toPadding(titleOpts.padding);
            return titleOpts.display ? titleFont.lineHeight + titlePadding.height : 0;
        }
     _getLegendItemAt(x, y) {
            let i, hitBox, lh;
            if (_isBetween(x, this.left, this.right) && _isBetween(y, this.top, this.bottom)) {
                lh = this.legendHitBoxes;
                for(i = 0; i < lh.length; ++i){
                    hitBox = lh[i];
                    if (_isBetween(x, hitBox.left, hitBox.left + hitBox.width) && _isBetween(y, hitBox.top, hitBox.top + hitBox.height)) {
                        return this.legendItems[i];
                    }
                }
            }
            return null;
        }
     handleEvent(e) {
            const opts = this.options;
            if (!isListened(e.type, opts)) {
                return;
            }
            const hoveredItem = this._getLegendItemAt(e.x, e.y);
            if (e.type === 'mousemove' || e.type === 'mouseout') {
                const previous = this._hoveredItem;
                const sameItem = itemsEqual(previous, hoveredItem);
                if (previous && !sameItem) {
                    callback(opts.onLeave, [
                        e,
                        previous,
                        this
                    ], this);
                }
                this._hoveredItem = hoveredItem;
                if (hoveredItem && !sameItem) {
                    callback(opts.onHover, [
                        e,
                        hoveredItem,
                        this
                    ], this);
                }
            } else if (hoveredItem) {
                callback(opts.onClick, [
                    e,
                    hoveredItem,
                    this
                ], this);
            }
        }
    }
    function calculateItemSize(boxWidth, labelFont, ctx, legendItem, _itemHeight) {
        const itemWidth = calculateItemWidth(legendItem, boxWidth, labelFont, ctx);
        const itemHeight = calculateItemHeight(_itemHeight, legendItem, labelFont.lineHeight);
        return {
            itemWidth,
            itemHeight
        };
    }
    function calculateItemWidth(legendItem, boxWidth, labelFont, ctx) {
        let legendItemText = legendItem.text;
        if (legendItemText && typeof legendItemText !== 'string') {
            legendItemText = legendItemText.reduce((a, b)=>a.length > b.length ? a : b);
        }
        return boxWidth + labelFont.size / 2 + ctx.measureText(legendItemText).width;
    }
    function calculateItemHeight(_itemHeight, legendItem, fontLineHeight) {
        let itemHeight = _itemHeight;
        if (typeof legendItem.text !== 'string') {
            itemHeight = calculateLegendItemHeight(legendItem, fontLineHeight);
        }
        return itemHeight;
    }
    function calculateLegendItemHeight(legendItem, fontLineHeight) {
        const labelHeight = legendItem.text ? legendItem.text.length + 0.5 : 0;
        return fontLineHeight * labelHeight;
    }
    function isListened(type, opts) {
        if ((type === 'mousemove' || type === 'mouseout') && (opts.onHover || opts.onLeave)) {
            return true;
        }
        if (opts.onClick && (type === 'click' || type === 'mouseup')) {
            return true;
        }
        return false;
    }
    var plugin_legend = {
        id: 'legend',
     _element: Legend,
        start (chart, _args, options) {
            const legend = chart.legend = new Legend({
                ctx: chart.ctx,
                options,
                chart
            });
            layouts.configure(chart, legend, options);
            layouts.addBox(chart, legend);
        },
        stop (chart) {
            layouts.removeBox(chart, chart.legend);
            delete chart.legend;
        },
        beforeUpdate (chart, _args, options) {
            const legend = chart.legend;
            layouts.configure(chart, legend, options);
            legend.options = options;
        },
        afterUpdate (chart) {
            const legend = chart.legend;
            legend.buildLabels();
            legend.adjustHitBoxes();
        },
        afterEvent (chart, args) {
            if (!args.replay) {
                chart.legend.handleEvent(args.event);
            }
        },
        defaults: {
            display: true,
            position: 'top',
            align: 'center',
            fullSize: true,
            reverse: false,
            weight: 1000,
            onClick (e, legendItem, legend) {
                const index = legendItem.datasetIndex;
                const ci = legend.chart;
                if (ci.isDatasetVisible(index)) {
                    ci.hide(index);
                    legendItem.hidden = true;
                } else {
                    ci.show(index);
                    legendItem.hidden = false;
                }
            },
            onHover: null,
            onLeave: null,
            labels: {
                color: (ctx)=>ctx.chart.options.color,
                boxWidth: 40,
                padding: 10,
                generateLabels (chart) {
                    const datasets = chart.data.datasets;
                    const { labels: { usePointStyle , pointStyle , textAlign , color , useBorderRadius , borderRadius  }  } = chart.legend.options;
                    return chart._getSortedDatasetMetas().map((meta)=>{
                        const style = meta.controller.getStyle(usePointStyle ? 0 : undefined);
                        const borderWidth = toPadding(style.borderWidth);
                        return {
                            text: datasets[meta.index].label,
                            fillStyle: style.backgroundColor,
                            fontColor: color,
                            hidden: !meta.visible,
                            lineCap: style.borderCapStyle,
                            lineDash: style.borderDash,
                            lineDashOffset: style.borderDashOffset,
                            lineJoin: style.borderJoinStyle,
                            lineWidth: (borderWidth.width + borderWidth.height) / 4,
                            strokeStyle: style.borderColor,
                            pointStyle: pointStyle || style.pointStyle,
                            rotation: style.rotation,
                            textAlign: textAlign || style.textAlign,
                            borderRadius: useBorderRadius && (borderRadius || style.borderRadius),
                            datasetIndex: meta.index
                        };
                    }, this);
                }
            },
            title: {
                color: (ctx)=>ctx.chart.options.color,
                display: false,
                position: 'center',
                text: ''
            }
        },
        descriptors: {
            _scriptable: (name)=>!name.startsWith('on'),
            labels: {
                _scriptable: (name)=>![
                        'generateLabels',
                        'filter',
                        'sort'
                    ].includes(name)
            }
        }
    };

    class Title extends Element$1 {
     constructor(config){
            super();
            this.chart = config.chart;
            this.options = config.options;
            this.ctx = config.ctx;
            this._padding = undefined;
            this.top = undefined;
            this.bottom = undefined;
            this.left = undefined;
            this.right = undefined;
            this.width = undefined;
            this.height = undefined;
            this.position = undefined;
            this.weight = undefined;
            this.fullSize = undefined;
        }
        update(maxWidth, maxHeight) {
            const opts = this.options;
            this.left = 0;
            this.top = 0;
            if (!opts.display) {
                this.width = this.height = this.right = this.bottom = 0;
                return;
            }
            this.width = this.right = maxWidth;
            this.height = this.bottom = maxHeight;
            const lineCount = isArray(opts.text) ? opts.text.length : 1;
            this._padding = toPadding(opts.padding);
            const textSize = lineCount * toFont(opts.font).lineHeight + this._padding.height;
            if (this.isHorizontal()) {
                this.height = textSize;
            } else {
                this.width = textSize;
            }
        }
        isHorizontal() {
            const pos = this.options.position;
            return pos === 'top' || pos === 'bottom';
        }
        _drawArgs(offset) {
            const { top , left , bottom , right , options  } = this;
            const align = options.align;
            let rotation = 0;
            let maxWidth, titleX, titleY;
            if (this.isHorizontal()) {
                titleX = _alignStartEnd(align, left, right);
                titleY = top + offset;
                maxWidth = right - left;
            } else {
                if (options.position === 'left') {
                    titleX = left + offset;
                    titleY = _alignStartEnd(align, bottom, top);
                    rotation = PI * -0.5;
                } else {
                    titleX = right - offset;
                    titleY = _alignStartEnd(align, top, bottom);
                    rotation = PI * 0.5;
                }
                maxWidth = bottom - top;
            }
            return {
                titleX,
                titleY,
                maxWidth,
                rotation
            };
        }
        draw() {
            const ctx = this.ctx;
            const opts = this.options;
            if (!opts.display) {
                return;
            }
            const fontOpts = toFont(opts.font);
            const lineHeight = fontOpts.lineHeight;
            const offset = lineHeight / 2 + this._padding.top;
            const { titleX , titleY , maxWidth , rotation  } = this._drawArgs(offset);
            renderText(ctx, opts.text, 0, 0, fontOpts, {
                color: opts.color,
                maxWidth,
                rotation,
                textAlign: _toLeftRightCenter(opts.align),
                textBaseline: 'middle',
                translation: [
                    titleX,
                    titleY
                ]
            });
        }
    }
    function createTitle(chart, titleOpts) {
        const title = new Title({
            ctx: chart.ctx,
            options: titleOpts,
            chart
        });
        layouts.configure(chart, title, titleOpts);
        layouts.addBox(chart, title);
        chart.titleBlock = title;
    }
    var plugin_title = {
        id: 'title',
     _element: Title,
        start (chart, _args, options) {
            createTitle(chart, options);
        },
        stop (chart) {
            const titleBlock = chart.titleBlock;
            layouts.removeBox(chart, titleBlock);
            delete chart.titleBlock;
        },
        beforeUpdate (chart, _args, options) {
            const title = chart.titleBlock;
            layouts.configure(chart, title, options);
            title.options = options;
        },
        defaults: {
            align: 'center',
            display: false,
            font: {
                weight: 'bold'
            },
            fullSize: true,
            padding: 10,
            position: 'top',
            text: '',
            weight: 2000
        },
        defaultRoutes: {
            color: 'color'
        },
        descriptors: {
            _scriptable: true,
            _indexable: false
        }
    };

    const map = new WeakMap();
    var plugin_subtitle = {
        id: 'subtitle',
        start (chart, _args, options) {
            const title = new Title({
                ctx: chart.ctx,
                options,
                chart
            });
            layouts.configure(chart, title, options);
            layouts.addBox(chart, title);
            map.set(chart, title);
        },
        stop (chart) {
            layouts.removeBox(chart, map.get(chart));
            map.delete(chart);
        },
        beforeUpdate (chart, _args, options) {
            const title = map.get(chart);
            layouts.configure(chart, title, options);
            title.options = options;
        },
        defaults: {
            align: 'center',
            display: false,
            font: {
                weight: 'normal'
            },
            fullSize: true,
            padding: 0,
            position: 'top',
            text: '',
            weight: 1500
        },
        defaultRoutes: {
            color: 'color'
        },
        descriptors: {
            _scriptable: true,
            _indexable: false
        }
    };

    const positioners = {
     average (items) {
            if (!items.length) {
                return false;
            }
            let i, len;
            let x = 0;
            let y = 0;
            let count = 0;
            for(i = 0, len = items.length; i < len; ++i){
                const el = items[i].element;
                if (el && el.hasValue()) {
                    const pos = el.tooltipPosition();
                    x += pos.x;
                    y += pos.y;
                    ++count;
                }
            }
            return {
                x: x / count,
                y: y / count
            };
        },
     nearest (items, eventPosition) {
            if (!items.length) {
                return false;
            }
            let x = eventPosition.x;
            let y = eventPosition.y;
            let minDistance = Number.POSITIVE_INFINITY;
            let i, len, nearestElement;
            for(i = 0, len = items.length; i < len; ++i){
                const el = items[i].element;
                if (el && el.hasValue()) {
                    const center = el.getCenterPoint();
                    const d = distanceBetweenPoints(eventPosition, center);
                    if (d < minDistance) {
                        minDistance = d;
                        nearestElement = el;
                    }
                }
            }
            if (nearestElement) {
                const tp = nearestElement.tooltipPosition();
                x = tp.x;
                y = tp.y;
            }
            return {
                x,
                y
            };
        }
    };
    function pushOrConcat(base, toPush) {
        if (toPush) {
            if (isArray(toPush)) {
                Array.prototype.push.apply(base, toPush);
            } else {
                base.push(toPush);
            }
        }
        return base;
    }
     function splitNewlines(str) {
        if ((typeof str === 'string' || str instanceof String) && str.indexOf('\n') > -1) {
            return str.split('\n');
        }
        return str;
    }
     function createTooltipItem(chart, item) {
        const { element , datasetIndex , index  } = item;
        const controller = chart.getDatasetMeta(datasetIndex).controller;
        const { label , value  } = controller.getLabelAndValue(index);
        return {
            chart,
            label,
            parsed: controller.getParsed(index),
            raw: chart.data.datasets[datasetIndex].data[index],
            formattedValue: value,
            dataset: controller.getDataset(),
            dataIndex: index,
            datasetIndex,
            element
        };
    }
     function getTooltipSize(tooltip, options) {
        const ctx = tooltip.chart.ctx;
        const { body , footer , title  } = tooltip;
        const { boxWidth , boxHeight  } = options;
        const bodyFont = toFont(options.bodyFont);
        const titleFont = toFont(options.titleFont);
        const footerFont = toFont(options.footerFont);
        const titleLineCount = title.length;
        const footerLineCount = footer.length;
        const bodyLineItemCount = body.length;
        const padding = toPadding(options.padding);
        let height = padding.height;
        let width = 0;
        let combinedBodyLength = body.reduce((count, bodyItem)=>count + bodyItem.before.length + bodyItem.lines.length + bodyItem.after.length, 0);
        combinedBodyLength += tooltip.beforeBody.length + tooltip.afterBody.length;
        if (titleLineCount) {
            height += titleLineCount * titleFont.lineHeight + (titleLineCount - 1) * options.titleSpacing + options.titleMarginBottom;
        }
        if (combinedBodyLength) {
            const bodyLineHeight = options.displayColors ? Math.max(boxHeight, bodyFont.lineHeight) : bodyFont.lineHeight;
            height += bodyLineItemCount * bodyLineHeight + (combinedBodyLength - bodyLineItemCount) * bodyFont.lineHeight + (combinedBodyLength - 1) * options.bodySpacing;
        }
        if (footerLineCount) {
            height += options.footerMarginTop + footerLineCount * footerFont.lineHeight + (footerLineCount - 1) * options.footerSpacing;
        }
        let widthPadding = 0;
        const maxLineWidth = function(line) {
            width = Math.max(width, ctx.measureText(line).width + widthPadding);
        };
        ctx.save();
        ctx.font = titleFont.string;
        each(tooltip.title, maxLineWidth);
        ctx.font = bodyFont.string;
        each(tooltip.beforeBody.concat(tooltip.afterBody), maxLineWidth);
        widthPadding = options.displayColors ? boxWidth + 2 + options.boxPadding : 0;
        each(body, (bodyItem)=>{
            each(bodyItem.before, maxLineWidth);
            each(bodyItem.lines, maxLineWidth);
            each(bodyItem.after, maxLineWidth);
        });
        widthPadding = 0;
        ctx.font = footerFont.string;
        each(tooltip.footer, maxLineWidth);
        ctx.restore();
        width += padding.width;
        return {
            width,
            height
        };
    }
    function determineYAlign(chart, size) {
        const { y , height  } = size;
        if (y < height / 2) {
            return 'top';
        } else if (y > chart.height - height / 2) {
            return 'bottom';
        }
        return 'center';
    }
    function doesNotFitWithAlign(xAlign, chart, options, size) {
        const { x , width  } = size;
        const caret = options.caretSize + options.caretPadding;
        if (xAlign === 'left' && x + width + caret > chart.width) {
            return true;
        }
        if (xAlign === 'right' && x - width - caret < 0) {
            return true;
        }
    }
    function determineXAlign(chart, options, size, yAlign) {
        const { x , width  } = size;
        const { width: chartWidth , chartArea: { left , right  }  } = chart;
        let xAlign = 'center';
        if (yAlign === 'center') {
            xAlign = x <= (left + right) / 2 ? 'left' : 'right';
        } else if (x <= width / 2) {
            xAlign = 'left';
        } else if (x >= chartWidth - width / 2) {
            xAlign = 'right';
        }
        if (doesNotFitWithAlign(xAlign, chart, options, size)) {
            xAlign = 'center';
        }
        return xAlign;
    }
     function determineAlignment(chart, options, size) {
        const yAlign = size.yAlign || options.yAlign || determineYAlign(chart, size);
        return {
            xAlign: size.xAlign || options.xAlign || determineXAlign(chart, options, size, yAlign),
            yAlign
        };
    }
    function alignX(size, xAlign) {
        let { x , width  } = size;
        if (xAlign === 'right') {
            x -= width;
        } else if (xAlign === 'center') {
            x -= width / 2;
        }
        return x;
    }
    function alignY(size, yAlign, paddingAndSize) {
        let { y , height  } = size;
        if (yAlign === 'top') {
            y += paddingAndSize;
        } else if (yAlign === 'bottom') {
            y -= height + paddingAndSize;
        } else {
            y -= height / 2;
        }
        return y;
    }
     function getBackgroundPoint(options, size, alignment, chart) {
        const { caretSize , caretPadding , cornerRadius  } = options;
        const { xAlign , yAlign  } = alignment;
        const paddingAndSize = caretSize + caretPadding;
        const { topLeft , topRight , bottomLeft , bottomRight  } = toTRBLCorners(cornerRadius);
        let x = alignX(size, xAlign);
        const y = alignY(size, yAlign, paddingAndSize);
        if (yAlign === 'center') {
            if (xAlign === 'left') {
                x += paddingAndSize;
            } else if (xAlign === 'right') {
                x -= paddingAndSize;
            }
        } else if (xAlign === 'left') {
            x -= Math.max(topLeft, bottomLeft) + caretSize;
        } else if (xAlign === 'right') {
            x += Math.max(topRight, bottomRight) + caretSize;
        }
        return {
            x: _limitValue(x, 0, chart.width - size.width),
            y: _limitValue(y, 0, chart.height - size.height)
        };
    }
    function getAlignedX(tooltip, align, options) {
        const padding = toPadding(options.padding);
        return align === 'center' ? tooltip.x + tooltip.width / 2 : align === 'right' ? tooltip.x + tooltip.width - padding.right : tooltip.x + padding.left;
    }
     function getBeforeAfterBodyLines(callback) {
        return pushOrConcat([], splitNewlines(callback));
    }
    function createTooltipContext(parent, tooltip, tooltipItems) {
        return createContext(parent, {
            tooltip,
            tooltipItems,
            type: 'tooltip'
        });
    }
    function overrideCallbacks(callbacks, context) {
        const override = context && context.dataset && context.dataset.tooltip && context.dataset.tooltip.callbacks;
        return override ? callbacks.override(override) : callbacks;
    }
    const defaultCallbacks = {
        beforeTitle: noop,
        title (tooltipItems) {
            if (tooltipItems.length > 0) {
                const item = tooltipItems[0];
                const labels = item.chart.data.labels;
                const labelCount = labels ? labels.length : 0;
                if (this && this.options && this.options.mode === 'dataset') {
                    return item.dataset.label || '';
                } else if (item.label) {
                    return item.label;
                } else if (labelCount > 0 && item.dataIndex < labelCount) {
                    return labels[item.dataIndex];
                }
            }
            return '';
        },
        afterTitle: noop,
        beforeBody: noop,
        beforeLabel: noop,
        label (tooltipItem) {
            if (this && this.options && this.options.mode === 'dataset') {
                return tooltipItem.label + ': ' + tooltipItem.formattedValue || tooltipItem.formattedValue;
            }
            let label = tooltipItem.dataset.label || '';
            if (label) {
                label += ': ';
            }
            const value = tooltipItem.formattedValue;
            if (!isNullOrUndef(value)) {
                label += value;
            }
            return label;
        },
        labelColor (tooltipItem) {
            const meta = tooltipItem.chart.getDatasetMeta(tooltipItem.datasetIndex);
            const options = meta.controller.getStyle(tooltipItem.dataIndex);
            return {
                borderColor: options.borderColor,
                backgroundColor: options.backgroundColor,
                borderWidth: options.borderWidth,
                borderDash: options.borderDash,
                borderDashOffset: options.borderDashOffset,
                borderRadius: 0
            };
        },
        labelTextColor () {
            return this.options.bodyColor;
        },
        labelPointStyle (tooltipItem) {
            const meta = tooltipItem.chart.getDatasetMeta(tooltipItem.datasetIndex);
            const options = meta.controller.getStyle(tooltipItem.dataIndex);
            return {
                pointStyle: options.pointStyle,
                rotation: options.rotation
            };
        },
        afterLabel: noop,
        afterBody: noop,
        beforeFooter: noop,
        footer: noop,
        afterFooter: noop
    };
     function invokeCallbackWithFallback(callbacks, name, ctx, arg) {
        const result = callbacks[name].call(ctx, arg);
        if (typeof result === 'undefined') {
            return defaultCallbacks[name].call(ctx, arg);
        }
        return result;
    }
    class Tooltip extends Element$1 {
     static positioners = positioners;
        constructor(config){
            super();
            this.opacity = 0;
            this._active = [];
            this._eventPosition = undefined;
            this._size = undefined;
            this._cachedAnimations = undefined;
            this._tooltipItems = [];
            this.$animations = undefined;
            this.$context = undefined;
            this.chart = config.chart;
            this.options = config.options;
            this.dataPoints = undefined;
            this.title = undefined;
            this.beforeBody = undefined;
            this.body = undefined;
            this.afterBody = undefined;
            this.footer = undefined;
            this.xAlign = undefined;
            this.yAlign = undefined;
            this.x = undefined;
            this.y = undefined;
            this.height = undefined;
            this.width = undefined;
            this.caretX = undefined;
            this.caretY = undefined;
            this.labelColors = undefined;
            this.labelPointStyles = undefined;
            this.labelTextColors = undefined;
        }
        initialize(options) {
            this.options = options;
            this._cachedAnimations = undefined;
            this.$context = undefined;
        }
     _resolveAnimations() {
            const cached = this._cachedAnimations;
            if (cached) {
                return cached;
            }
            const chart = this.chart;
            const options = this.options.setContext(this.getContext());
            const opts = options.enabled && chart.options.animation && options.animations;
            const animations = new Animations(this.chart, opts);
            if (opts._cacheable) {
                this._cachedAnimations = Object.freeze(animations);
            }
            return animations;
        }
     getContext() {
            return this.$context || (this.$context = createTooltipContext(this.chart.getContext(), this, this._tooltipItems));
        }
        getTitle(context, options) {
            const { callbacks  } = options;
            const beforeTitle = invokeCallbackWithFallback(callbacks, 'beforeTitle', this, context);
            const title = invokeCallbackWithFallback(callbacks, 'title', this, context);
            const afterTitle = invokeCallbackWithFallback(callbacks, 'afterTitle', this, context);
            let lines = [];
            lines = pushOrConcat(lines, splitNewlines(beforeTitle));
            lines = pushOrConcat(lines, splitNewlines(title));
            lines = pushOrConcat(lines, splitNewlines(afterTitle));
            return lines;
        }
        getBeforeBody(tooltipItems, options) {
            return getBeforeAfterBodyLines(invokeCallbackWithFallback(options.callbacks, 'beforeBody', this, tooltipItems));
        }
        getBody(tooltipItems, options) {
            const { callbacks  } = options;
            const bodyItems = [];
            each(tooltipItems, (context)=>{
                const bodyItem = {
                    before: [],
                    lines: [],
                    after: []
                };
                const scoped = overrideCallbacks(callbacks, context);
                pushOrConcat(bodyItem.before, splitNewlines(invokeCallbackWithFallback(scoped, 'beforeLabel', this, context)));
                pushOrConcat(bodyItem.lines, invokeCallbackWithFallback(scoped, 'label', this, context));
                pushOrConcat(bodyItem.after, splitNewlines(invokeCallbackWithFallback(scoped, 'afterLabel', this, context)));
                bodyItems.push(bodyItem);
            });
            return bodyItems;
        }
        getAfterBody(tooltipItems, options) {
            return getBeforeAfterBodyLines(invokeCallbackWithFallback(options.callbacks, 'afterBody', this, tooltipItems));
        }
        getFooter(tooltipItems, options) {
            const { callbacks  } = options;
            const beforeFooter = invokeCallbackWithFallback(callbacks, 'beforeFooter', this, tooltipItems);
            const footer = invokeCallbackWithFallback(callbacks, 'footer', this, tooltipItems);
            const afterFooter = invokeCallbackWithFallback(callbacks, 'afterFooter', this, tooltipItems);
            let lines = [];
            lines = pushOrConcat(lines, splitNewlines(beforeFooter));
            lines = pushOrConcat(lines, splitNewlines(footer));
            lines = pushOrConcat(lines, splitNewlines(afterFooter));
            return lines;
        }
     _createItems(options) {
            const active = this._active;
            const data = this.chart.data;
            const labelColors = [];
            const labelPointStyles = [];
            const labelTextColors = [];
            let tooltipItems = [];
            let i, len;
            for(i = 0, len = active.length; i < len; ++i){
                tooltipItems.push(createTooltipItem(this.chart, active[i]));
            }
            if (options.filter) {
                tooltipItems = tooltipItems.filter((element, index, array)=>options.filter(element, index, array, data));
            }
            if (options.itemSort) {
                tooltipItems = tooltipItems.sort((a, b)=>options.itemSort(a, b, data));
            }
            each(tooltipItems, (context)=>{
                const scoped = overrideCallbacks(options.callbacks, context);
                labelColors.push(invokeCallbackWithFallback(scoped, 'labelColor', this, context));
                labelPointStyles.push(invokeCallbackWithFallback(scoped, 'labelPointStyle', this, context));
                labelTextColors.push(invokeCallbackWithFallback(scoped, 'labelTextColor', this, context));
            });
            this.labelColors = labelColors;
            this.labelPointStyles = labelPointStyles;
            this.labelTextColors = labelTextColors;
            this.dataPoints = tooltipItems;
            return tooltipItems;
        }
        update(changed, replay) {
            const options = this.options.setContext(this.getContext());
            const active = this._active;
            let properties;
            let tooltipItems = [];
            if (!active.length) {
                if (this.opacity !== 0) {
                    properties = {
                        opacity: 0
                    };
                }
            } else {
                const position = positioners[options.position].call(this, active, this._eventPosition);
                tooltipItems = this._createItems(options);
                this.title = this.getTitle(tooltipItems, options);
                this.beforeBody = this.getBeforeBody(tooltipItems, options);
                this.body = this.getBody(tooltipItems, options);
                this.afterBody = this.getAfterBody(tooltipItems, options);
                this.footer = this.getFooter(tooltipItems, options);
                const size = this._size = getTooltipSize(this, options);
                const positionAndSize = Object.assign({}, position, size);
                const alignment = determineAlignment(this.chart, options, positionAndSize);
                const backgroundPoint = getBackgroundPoint(options, positionAndSize, alignment, this.chart);
                this.xAlign = alignment.xAlign;
                this.yAlign = alignment.yAlign;
                properties = {
                    opacity: 1,
                    x: backgroundPoint.x,
                    y: backgroundPoint.y,
                    width: size.width,
                    height: size.height,
                    caretX: position.x,
                    caretY: position.y
                };
            }
            this._tooltipItems = tooltipItems;
            this.$context = undefined;
            if (properties) {
                this._resolveAnimations().update(this, properties);
            }
            if (changed && options.external) {
                options.external.call(this, {
                    chart: this.chart,
                    tooltip: this,
                    replay
                });
            }
        }
        drawCaret(tooltipPoint, ctx, size, options) {
            const caretPosition = this.getCaretPosition(tooltipPoint, size, options);
            ctx.lineTo(caretPosition.x1, caretPosition.y1);
            ctx.lineTo(caretPosition.x2, caretPosition.y2);
            ctx.lineTo(caretPosition.x3, caretPosition.y3);
        }
        getCaretPosition(tooltipPoint, size, options) {
            const { xAlign , yAlign  } = this;
            const { caretSize , cornerRadius  } = options;
            const { topLeft , topRight , bottomLeft , bottomRight  } = toTRBLCorners(cornerRadius);
            const { x: ptX , y: ptY  } = tooltipPoint;
            const { width , height  } = size;
            let x1, x2, x3, y1, y2, y3;
            if (yAlign === 'center') {
                y2 = ptY + height / 2;
                if (xAlign === 'left') {
                    x1 = ptX;
                    x2 = x1 - caretSize;
                    y1 = y2 + caretSize;
                    y3 = y2 - caretSize;
                } else {
                    x1 = ptX + width;
                    x2 = x1 + caretSize;
                    y1 = y2 - caretSize;
                    y3 = y2 + caretSize;
                }
                x3 = x1;
            } else {
                if (xAlign === 'left') {
                    x2 = ptX + Math.max(topLeft, bottomLeft) + caretSize;
                } else if (xAlign === 'right') {
                    x2 = ptX + width - Math.max(topRight, bottomRight) - caretSize;
                } else {
                    x2 = this.caretX;
                }
                if (yAlign === 'top') {
                    y1 = ptY;
                    y2 = y1 - caretSize;
                    x1 = x2 - caretSize;
                    x3 = x2 + caretSize;
                } else {
                    y1 = ptY + height;
                    y2 = y1 + caretSize;
                    x1 = x2 + caretSize;
                    x3 = x2 - caretSize;
                }
                y3 = y1;
            }
            return {
                x1,
                x2,
                x3,
                y1,
                y2,
                y3
            };
        }
        drawTitle(pt, ctx, options) {
            const title = this.title;
            const length = title.length;
            let titleFont, titleSpacing, i;
            if (length) {
                const rtlHelper = getRtlAdapter(options.rtl, this.x, this.width);
                pt.x = getAlignedX(this, options.titleAlign, options);
                ctx.textAlign = rtlHelper.textAlign(options.titleAlign);
                ctx.textBaseline = 'middle';
                titleFont = toFont(options.titleFont);
                titleSpacing = options.titleSpacing;
                ctx.fillStyle = options.titleColor;
                ctx.font = titleFont.string;
                for(i = 0; i < length; ++i){
                    ctx.fillText(title[i], rtlHelper.x(pt.x), pt.y + titleFont.lineHeight / 2);
                    pt.y += titleFont.lineHeight + titleSpacing;
                    if (i + 1 === length) {
                        pt.y += options.titleMarginBottom - titleSpacing;
                    }
                }
            }
        }
     _drawColorBox(ctx, pt, i, rtlHelper, options) {
            const labelColors = this.labelColors[i];
            const labelPointStyle = this.labelPointStyles[i];
            const { boxHeight , boxWidth , boxPadding  } = options;
            const bodyFont = toFont(options.bodyFont);
            const colorX = getAlignedX(this, 'left', options);
            const rtlColorX = rtlHelper.x(colorX);
            const yOffSet = boxHeight < bodyFont.lineHeight ? (bodyFont.lineHeight - boxHeight) / 2 : 0;
            const colorY = pt.y + yOffSet;
            if (options.usePointStyle) {
                const drawOptions = {
                    radius: Math.min(boxWidth, boxHeight) / 2,
                    pointStyle: labelPointStyle.pointStyle,
                    rotation: labelPointStyle.rotation,
                    borderWidth: 1
                };
                const centerX = rtlHelper.leftForLtr(rtlColorX, boxWidth) + boxWidth / 2;
                const centerY = colorY + boxHeight / 2;
                ctx.strokeStyle = options.multiKeyBackground;
                ctx.fillStyle = options.multiKeyBackground;
                drawPoint(ctx, drawOptions, centerX, centerY);
                ctx.strokeStyle = labelColors.borderColor;
                ctx.fillStyle = labelColors.backgroundColor;
                drawPoint(ctx, drawOptions, centerX, centerY);
            } else {
                ctx.lineWidth = isObject(labelColors.borderWidth) ? Math.max(...Object.values(labelColors.borderWidth)) : labelColors.borderWidth || 1;
                ctx.strokeStyle = labelColors.borderColor;
                ctx.setLineDash(labelColors.borderDash || []);
                ctx.lineDashOffset = labelColors.borderDashOffset || 0;
                const outerX = rtlHelper.leftForLtr(rtlColorX, boxWidth - boxPadding);
                const innerX = rtlHelper.leftForLtr(rtlHelper.xPlus(rtlColorX, 1), boxWidth - boxPadding - 2);
                const borderRadius = toTRBLCorners(labelColors.borderRadius);
                if (Object.values(borderRadius).some((v)=>v !== 0)) {
                    ctx.beginPath();
                    ctx.fillStyle = options.multiKeyBackground;
                    addRoundedRectPath(ctx, {
                        x: outerX,
                        y: colorY,
                        w: boxWidth,
                        h: boxHeight,
                        radius: borderRadius
                    });
                    ctx.fill();
                    ctx.stroke();
                    ctx.fillStyle = labelColors.backgroundColor;
                    ctx.beginPath();
                    addRoundedRectPath(ctx, {
                        x: innerX,
                        y: colorY + 1,
                        w: boxWidth - 2,
                        h: boxHeight - 2,
                        radius: borderRadius
                    });
                    ctx.fill();
                } else {
                    ctx.fillStyle = options.multiKeyBackground;
                    ctx.fillRect(outerX, colorY, boxWidth, boxHeight);
                    ctx.strokeRect(outerX, colorY, boxWidth, boxHeight);
                    ctx.fillStyle = labelColors.backgroundColor;
                    ctx.fillRect(innerX, colorY + 1, boxWidth - 2, boxHeight - 2);
                }
            }
            ctx.fillStyle = this.labelTextColors[i];
        }
        drawBody(pt, ctx, options) {
            const { body  } = this;
            const { bodySpacing , bodyAlign , displayColors , boxHeight , boxWidth , boxPadding  } = options;
            const bodyFont = toFont(options.bodyFont);
            let bodyLineHeight = bodyFont.lineHeight;
            let xLinePadding = 0;
            const rtlHelper = getRtlAdapter(options.rtl, this.x, this.width);
            const fillLineOfText = function(line) {
                ctx.fillText(line, rtlHelper.x(pt.x + xLinePadding), pt.y + bodyLineHeight / 2);
                pt.y += bodyLineHeight + bodySpacing;
            };
            const bodyAlignForCalculation = rtlHelper.textAlign(bodyAlign);
            let bodyItem, textColor, lines, i, j, ilen, jlen;
            ctx.textAlign = bodyAlign;
            ctx.textBaseline = 'middle';
            ctx.font = bodyFont.string;
            pt.x = getAlignedX(this, bodyAlignForCalculation, options);
            ctx.fillStyle = options.bodyColor;
            each(this.beforeBody, fillLineOfText);
            xLinePadding = displayColors && bodyAlignForCalculation !== 'right' ? bodyAlign === 'center' ? boxWidth / 2 + boxPadding : boxWidth + 2 + boxPadding : 0;
            for(i = 0, ilen = body.length; i < ilen; ++i){
                bodyItem = body[i];
                textColor = this.labelTextColors[i];
                ctx.fillStyle = textColor;
                each(bodyItem.before, fillLineOfText);
                lines = bodyItem.lines;
                if (displayColors && lines.length) {
                    this._drawColorBox(ctx, pt, i, rtlHelper, options);
                    bodyLineHeight = Math.max(bodyFont.lineHeight, boxHeight);
                }
                for(j = 0, jlen = lines.length; j < jlen; ++j){
                    fillLineOfText(lines[j]);
                    bodyLineHeight = bodyFont.lineHeight;
                }
                each(bodyItem.after, fillLineOfText);
            }
            xLinePadding = 0;
            bodyLineHeight = bodyFont.lineHeight;
            each(this.afterBody, fillLineOfText);
            pt.y -= bodySpacing;
        }
        drawFooter(pt, ctx, options) {
            const footer = this.footer;
            const length = footer.length;
            let footerFont, i;
            if (length) {
                const rtlHelper = getRtlAdapter(options.rtl, this.x, this.width);
                pt.x = getAlignedX(this, options.footerAlign, options);
                pt.y += options.footerMarginTop;
                ctx.textAlign = rtlHelper.textAlign(options.footerAlign);
                ctx.textBaseline = 'middle';
                footerFont = toFont(options.footerFont);
                ctx.fillStyle = options.footerColor;
                ctx.font = footerFont.string;
                for(i = 0; i < length; ++i){
                    ctx.fillText(footer[i], rtlHelper.x(pt.x), pt.y + footerFont.lineHeight / 2);
                    pt.y += footerFont.lineHeight + options.footerSpacing;
                }
            }
        }
        drawBackground(pt, ctx, tooltipSize, options) {
            const { xAlign , yAlign  } = this;
            const { x , y  } = pt;
            const { width , height  } = tooltipSize;
            const { topLeft , topRight , bottomLeft , bottomRight  } = toTRBLCorners(options.cornerRadius);
            ctx.fillStyle = options.backgroundColor;
            ctx.strokeStyle = options.borderColor;
            ctx.lineWidth = options.borderWidth;
            ctx.beginPath();
            ctx.moveTo(x + topLeft, y);
            if (yAlign === 'top') {
                this.drawCaret(pt, ctx, tooltipSize, options);
            }
            ctx.lineTo(x + width - topRight, y);
            ctx.quadraticCurveTo(x + width, y, x + width, y + topRight);
            if (yAlign === 'center' && xAlign === 'right') {
                this.drawCaret(pt, ctx, tooltipSize, options);
            }
            ctx.lineTo(x + width, y + height - bottomRight);
            ctx.quadraticCurveTo(x + width, y + height, x + width - bottomRight, y + height);
            if (yAlign === 'bottom') {
                this.drawCaret(pt, ctx, tooltipSize, options);
            }
            ctx.lineTo(x + bottomLeft, y + height);
            ctx.quadraticCurveTo(x, y + height, x, y + height - bottomLeft);
            if (yAlign === 'center' && xAlign === 'left') {
                this.drawCaret(pt, ctx, tooltipSize, options);
            }
            ctx.lineTo(x, y + topLeft);
            ctx.quadraticCurveTo(x, y, x + topLeft, y);
            ctx.closePath();
            ctx.fill();
            if (options.borderWidth > 0) {
                ctx.stroke();
            }
        }
     _updateAnimationTarget(options) {
            const chart = this.chart;
            const anims = this.$animations;
            const animX = anims && anims.x;
            const animY = anims && anims.y;
            if (animX || animY) {
                const position = positioners[options.position].call(this, this._active, this._eventPosition);
                if (!position) {
                    return;
                }
                const size = this._size = getTooltipSize(this, options);
                const positionAndSize = Object.assign({}, position, this._size);
                const alignment = determineAlignment(chart, options, positionAndSize);
                const point = getBackgroundPoint(options, positionAndSize, alignment, chart);
                if (animX._to !== point.x || animY._to !== point.y) {
                    this.xAlign = alignment.xAlign;
                    this.yAlign = alignment.yAlign;
                    this.width = size.width;
                    this.height = size.height;
                    this.caretX = position.x;
                    this.caretY = position.y;
                    this._resolveAnimations().update(this, point);
                }
            }
        }
     _willRender() {
            return !!this.opacity;
        }
        draw(ctx) {
            const options = this.options.setContext(this.getContext());
            let opacity = this.opacity;
            if (!opacity) {
                return;
            }
            this._updateAnimationTarget(options);
            const tooltipSize = {
                width: this.width,
                height: this.height
            };
            const pt = {
                x: this.x,
                y: this.y
            };
            opacity = Math.abs(opacity) < 1e-3 ? 0 : opacity;
            const padding = toPadding(options.padding);
            const hasTooltipContent = this.title.length || this.beforeBody.length || this.body.length || this.afterBody.length || this.footer.length;
            if (options.enabled && hasTooltipContent) {
                ctx.save();
                ctx.globalAlpha = opacity;
                this.drawBackground(pt, ctx, tooltipSize, options);
                overrideTextDirection(ctx, options.textDirection);
                pt.y += padding.top;
                this.drawTitle(pt, ctx, options);
                this.drawBody(pt, ctx, options);
                this.drawFooter(pt, ctx, options);
                restoreTextDirection(ctx, options.textDirection);
                ctx.restore();
            }
        }
     getActiveElements() {
            return this._active || [];
        }
     setActiveElements(activeElements, eventPosition) {
            const lastActive = this._active;
            const active = activeElements.map(({ datasetIndex , index  })=>{
                const meta = this.chart.getDatasetMeta(datasetIndex);
                if (!meta) {
                    throw new Error('Cannot find a dataset at index ' + datasetIndex);
                }
                return {
                    datasetIndex,
                    element: meta.data[index],
                    index
                };
            });
            const changed = !_elementsEqual(lastActive, active);
            const positionChanged = this._positionChanged(active, eventPosition);
            if (changed || positionChanged) {
                this._active = active;
                this._eventPosition = eventPosition;
                this._ignoreReplayEvents = true;
                this.update(true);
            }
        }
     handleEvent(e, replay, inChartArea = true) {
            if (replay && this._ignoreReplayEvents) {
                return false;
            }
            this._ignoreReplayEvents = false;
            const options = this.options;
            const lastActive = this._active || [];
            const active = this._getActiveElements(e, lastActive, replay, inChartArea);
            const positionChanged = this._positionChanged(active, e);
            const changed = replay || !_elementsEqual(active, lastActive) || positionChanged;
            if (changed) {
                this._active = active;
                if (options.enabled || options.external) {
                    this._eventPosition = {
                        x: e.x,
                        y: e.y
                    };
                    this.update(true, replay);
                }
            }
            return changed;
        }
     _getActiveElements(e, lastActive, replay, inChartArea) {
            const options = this.options;
            if (e.type === 'mouseout') {
                return [];
            }
            if (!inChartArea) {
                return lastActive;
            }
            const active = this.chart.getElementsAtEventForMode(e, options.mode, options, replay);
            if (options.reverse) {
                active.reverse();
            }
            return active;
        }
     _positionChanged(active, e) {
            const { caretX , caretY , options  } = this;
            const position = positioners[options.position].call(this, active, e);
            return position !== false && (caretX !== position.x || caretY !== position.y);
        }
    }
    var plugin_tooltip = {
        id: 'tooltip',
        _element: Tooltip,
        positioners,
        afterInit (chart, _args, options) {
            if (options) {
                chart.tooltip = new Tooltip({
                    chart,
                    options
                });
            }
        },
        beforeUpdate (chart, _args, options) {
            if (chart.tooltip) {
                chart.tooltip.initialize(options);
            }
        },
        reset (chart, _args, options) {
            if (chart.tooltip) {
                chart.tooltip.initialize(options);
            }
        },
        afterDraw (chart) {
            const tooltip = chart.tooltip;
            if (tooltip && tooltip._willRender()) {
                const args = {
                    tooltip
                };
                if (chart.notifyPlugins('beforeTooltipDraw', {
                    ...args,
                    cancelable: true
                }) === false) {
                    return;
                }
                tooltip.draw(chart.ctx);
                chart.notifyPlugins('afterTooltipDraw', args);
            }
        },
        afterEvent (chart, args) {
            if (chart.tooltip) {
                const useFinalPosition = args.replay;
                if (chart.tooltip.handleEvent(args.event, useFinalPosition, args.inChartArea)) {
                    args.changed = true;
                }
            }
        },
        defaults: {
            enabled: true,
            external: null,
            position: 'average',
            backgroundColor: 'rgba(0,0,0,0.8)',
            titleColor: '#fff',
            titleFont: {
                weight: 'bold'
            },
            titleSpacing: 2,
            titleMarginBottom: 6,
            titleAlign: 'left',
            bodyColor: '#fff',
            bodySpacing: 2,
            bodyFont: {},
            bodyAlign: 'left',
            footerColor: '#fff',
            footerSpacing: 2,
            footerMarginTop: 6,
            footerFont: {
                weight: 'bold'
            },
            footerAlign: 'left',
            padding: 6,
            caretPadding: 2,
            caretSize: 5,
            cornerRadius: 6,
            boxHeight: (ctx, opts)=>opts.bodyFont.size,
            boxWidth: (ctx, opts)=>opts.bodyFont.size,
            multiKeyBackground: '#fff',
            displayColors: true,
            boxPadding: 0,
            borderColor: 'rgba(0,0,0,0)',
            borderWidth: 0,
            animation: {
                duration: 400,
                easing: 'easeOutQuart'
            },
            animations: {
                numbers: {
                    type: 'number',
                    properties: [
                        'x',
                        'y',
                        'width',
                        'height',
                        'caretX',
                        'caretY'
                    ]
                },
                opacity: {
                    easing: 'linear',
                    duration: 200
                }
            },
            callbacks: defaultCallbacks
        },
        defaultRoutes: {
            bodyFont: 'font',
            footerFont: 'font',
            titleFont: 'font'
        },
        descriptors: {
            _scriptable: (name)=>name !== 'filter' && name !== 'itemSort' && name !== 'external',
            _indexable: false,
            callbacks: {
                _scriptable: false,
                _indexable: false
            },
            animation: {
                _fallback: false
            },
            animations: {
                _fallback: 'animation'
            }
        },
        additionalOptionScopes: [
            'interaction'
        ]
    };

    var plugins = /*#__PURE__*/Object.freeze({
    __proto__: null,
    Colors: plugin_colors,
    Decimation: plugin_decimation,
    Filler: index,
    Legend: plugin_legend,
    SubTitle: plugin_subtitle,
    Title: plugin_title,
    Tooltip: plugin_tooltip
    });

    const addIfString = (labels, raw, index, addedLabels)=>{
        if (typeof raw === 'string') {
            index = labels.push(raw) - 1;
            addedLabels.unshift({
                index,
                label: raw
            });
        } else if (isNaN(raw)) {
            index = null;
        }
        return index;
    };
    function findOrAddLabel(labels, raw, index, addedLabels) {
        const first = labels.indexOf(raw);
        if (first === -1) {
            return addIfString(labels, raw, index, addedLabels);
        }
        const last = labels.lastIndexOf(raw);
        return first !== last ? index : first;
    }
    const validIndex = (index, max)=>index === null ? null : _limitValue(Math.round(index), 0, max);
    function _getLabelForValue(value) {
        const labels = this.getLabels();
        if (value >= 0 && value < labels.length) {
            return labels[value];
        }
        return value;
    }
    class CategoryScale extends Scale {
        static id = 'category';
     static defaults = {
            ticks: {
                callback: _getLabelForValue
            }
        };
        constructor(cfg){
            super(cfg);
             this._startValue = undefined;
            this._valueRange = 0;
            this._addedLabels = [];
        }
        init(scaleOptions) {
            const added = this._addedLabels;
            if (added.length) {
                const labels = this.getLabels();
                for (const { index , label  } of added){
                    if (labels[index] === label) {
                        labels.splice(index, 1);
                    }
                }
                this._addedLabels = [];
            }
            super.init(scaleOptions);
        }
        parse(raw, index) {
            if (isNullOrUndef(raw)) {
                return null;
            }
            const labels = this.getLabels();
            index = isFinite(index) && labels[index] === raw ? index : findOrAddLabel(labels, raw, valueOrDefault(index, raw), this._addedLabels);
            return validIndex(index, labels.length - 1);
        }
        determineDataLimits() {
            const { minDefined , maxDefined  } = this.getUserBounds();
            let { min , max  } = this.getMinMax(true);
            if (this.options.bounds === 'ticks') {
                if (!minDefined) {
                    min = 0;
                }
                if (!maxDefined) {
                    max = this.getLabels().length - 1;
                }
            }
            this.min = min;
            this.max = max;
        }
        buildTicks() {
            const min = this.min;
            const max = this.max;
            const offset = this.options.offset;
            const ticks = [];
            let labels = this.getLabels();
            labels = min === 0 && max === labels.length - 1 ? labels : labels.slice(min, max + 1);
            this._valueRange = Math.max(labels.length - (offset ? 0 : 1), 1);
            this._startValue = this.min - (offset ? 0.5 : 0);
            for(let value = min; value <= max; value++){
                ticks.push({
                    value
                });
            }
            return ticks;
        }
        getLabelForValue(value) {
            return _getLabelForValue.call(this, value);
        }
     configure() {
            super.configure();
            if (!this.isHorizontal()) {
                this._reversePixels = !this._reversePixels;
            }
        }
        getPixelForValue(value) {
            if (typeof value !== 'number') {
                value = this.parse(value);
            }
            return value === null ? NaN : this.getPixelForDecimal((value - this._startValue) / this._valueRange);
        }
        getPixelForTick(index) {
            const ticks = this.ticks;
            if (index < 0 || index > ticks.length - 1) {
                return null;
            }
            return this.getPixelForValue(ticks[index].value);
        }
        getValueForPixel(pixel) {
            return Math.round(this._startValue + this.getDecimalForPixel(pixel) * this._valueRange);
        }
        getBasePixel() {
            return this.bottom;
        }
    }

    function generateTicks$1(generationOptions, dataRange) {
        const ticks = [];
        const MIN_SPACING = 1e-14;
        const { bounds , step , min , max , precision , count , maxTicks , maxDigits , includeBounds  } = generationOptions;
        const unit = step || 1;
        const maxSpaces = maxTicks - 1;
        const { min: rmin , max: rmax  } = dataRange;
        const minDefined = !isNullOrUndef(min);
        const maxDefined = !isNullOrUndef(max);
        const countDefined = !isNullOrUndef(count);
        const minSpacing = (rmax - rmin) / (maxDigits + 1);
        let spacing = niceNum((rmax - rmin) / maxSpaces / unit) * unit;
        let factor, niceMin, niceMax, numSpaces;
        if (spacing < MIN_SPACING && !minDefined && !maxDefined) {
            return [
                {
                    value: rmin
                },
                {
                    value: rmax
                }
            ];
        }
        numSpaces = Math.ceil(rmax / spacing) - Math.floor(rmin / spacing);
        if (numSpaces > maxSpaces) {
            spacing = niceNum(numSpaces * spacing / maxSpaces / unit) * unit;
        }
        if (!isNullOrUndef(precision)) {
            factor = Math.pow(10, precision);
            spacing = Math.ceil(spacing * factor) / factor;
        }
        if (bounds === 'ticks') {
            niceMin = Math.floor(rmin / spacing) * spacing;
            niceMax = Math.ceil(rmax / spacing) * spacing;
        } else {
            niceMin = rmin;
            niceMax = rmax;
        }
        if (minDefined && maxDefined && step && almostWhole((max - min) / step, spacing / 1000)) {
            numSpaces = Math.round(Math.min((max - min) / spacing, maxTicks));
            spacing = (max - min) / numSpaces;
            niceMin = min;
            niceMax = max;
        } else if (countDefined) {
            niceMin = minDefined ? min : niceMin;
            niceMax = maxDefined ? max : niceMax;
            numSpaces = count - 1;
            spacing = (niceMax - niceMin) / numSpaces;
        } else {
            numSpaces = (niceMax - niceMin) / spacing;
            if (almostEquals(numSpaces, Math.round(numSpaces), spacing / 1000)) {
                numSpaces = Math.round(numSpaces);
            } else {
                numSpaces = Math.ceil(numSpaces);
            }
        }
        const decimalPlaces = Math.max(_decimalPlaces(spacing), _decimalPlaces(niceMin));
        factor = Math.pow(10, isNullOrUndef(precision) ? decimalPlaces : precision);
        niceMin = Math.round(niceMin * factor) / factor;
        niceMax = Math.round(niceMax * factor) / factor;
        let j = 0;
        if (minDefined) {
            if (includeBounds && niceMin !== min) {
                ticks.push({
                    value: min
                });
                if (niceMin < min) {
                    j++;
                }
                if (almostEquals(Math.round((niceMin + j * spacing) * factor) / factor, min, relativeLabelSize(min, minSpacing, generationOptions))) {
                    j++;
                }
            } else if (niceMin < min) {
                j++;
            }
        }
        for(; j < numSpaces; ++j){
            ticks.push({
                value: Math.round((niceMin + j * spacing) * factor) / factor
            });
        }
        if (maxDefined && includeBounds && niceMax !== max) {
            if (ticks.length && almostEquals(ticks[ticks.length - 1].value, max, relativeLabelSize(max, minSpacing, generationOptions))) {
                ticks[ticks.length - 1].value = max;
            } else {
                ticks.push({
                    value: max
                });
            }
        } else if (!maxDefined || niceMax === max) {
            ticks.push({
                value: niceMax
            });
        }
        return ticks;
    }
    function relativeLabelSize(value, minSpacing, { horizontal , minRotation  }) {
        const rad = toRadians(minRotation);
        const ratio = (horizontal ? Math.sin(rad) : Math.cos(rad)) || 0.001;
        const length = 0.75 * minSpacing * ('' + value).length;
        return Math.min(minSpacing / ratio, length);
    }
    class LinearScaleBase extends Scale {
        constructor(cfg){
            super(cfg);
             this.start = undefined;
             this.end = undefined;
             this._startValue = undefined;
             this._endValue = undefined;
            this._valueRange = 0;
        }
        parse(raw, index) {
            if (isNullOrUndef(raw)) {
                return null;
            }
            if ((typeof raw === 'number' || raw instanceof Number) && !isFinite(+raw)) {
                return null;
            }
            return +raw;
        }
        handleTickRangeOptions() {
            const { beginAtZero  } = this.options;
            const { minDefined , maxDefined  } = this.getUserBounds();
            let { min , max  } = this;
            const setMin = (v)=>min = minDefined ? min : v;
            const setMax = (v)=>max = maxDefined ? max : v;
            if (beginAtZero) {
                const minSign = sign(min);
                const maxSign = sign(max);
                if (minSign < 0 && maxSign < 0) {
                    setMax(0);
                } else if (minSign > 0 && maxSign > 0) {
                    setMin(0);
                }
            }
            if (min === max) {
                let offset = max === 0 ? 1 : Math.abs(max * 0.05);
                setMax(max + offset);
                if (!beginAtZero) {
                    setMin(min - offset);
                }
            }
            this.min = min;
            this.max = max;
        }
        getTickLimit() {
            const tickOpts = this.options.ticks;
            let { maxTicksLimit , stepSize  } = tickOpts;
            let maxTicks;
            if (stepSize) {
                maxTicks = Math.ceil(this.max / stepSize) - Math.floor(this.min / stepSize) + 1;
                if (maxTicks > 1000) {
                    console.warn(`scales.${this.id}.ticks.stepSize: ${stepSize} would result generating up to ${maxTicks} ticks. Limiting to 1000.`);
                    maxTicks = 1000;
                }
            } else {
                maxTicks = this.computeTickLimit();
                maxTicksLimit = maxTicksLimit || 11;
            }
            if (maxTicksLimit) {
                maxTicks = Math.min(maxTicksLimit, maxTicks);
            }
            return maxTicks;
        }
     computeTickLimit() {
            return Number.POSITIVE_INFINITY;
        }
        buildTicks() {
            const opts = this.options;
            const tickOpts = opts.ticks;
            let maxTicks = this.getTickLimit();
            maxTicks = Math.max(2, maxTicks);
            const numericGeneratorOptions = {
                maxTicks,
                bounds: opts.bounds,
                min: opts.min,
                max: opts.max,
                precision: tickOpts.precision,
                step: tickOpts.stepSize,
                count: tickOpts.count,
                maxDigits: this._maxDigits(),
                horizontal: this.isHorizontal(),
                minRotation: tickOpts.minRotation || 0,
                includeBounds: tickOpts.includeBounds !== false
            };
            const dataRange = this._range || this;
            const ticks = generateTicks$1(numericGeneratorOptions, dataRange);
            if (opts.bounds === 'ticks') {
                _setMinAndMaxByKey(ticks, this, 'value');
            }
            if (opts.reverse) {
                ticks.reverse();
                this.start = this.max;
                this.end = this.min;
            } else {
                this.start = this.min;
                this.end = this.max;
            }
            return ticks;
        }
     configure() {
            const ticks = this.ticks;
            let start = this.min;
            let end = this.max;
            super.configure();
            if (this.options.offset && ticks.length) {
                const offset = (end - start) / Math.max(ticks.length - 1, 1) / 2;
                start -= offset;
                end += offset;
            }
            this._startValue = start;
            this._endValue = end;
            this._valueRange = end - start;
        }
        getLabelForValue(value) {
            return formatNumber(value, this.chart.options.locale, this.options.ticks.format);
        }
    }

    class LinearScale extends LinearScaleBase {
        static id = 'linear';
     static defaults = {
            ticks: {
                callback: Ticks.formatters.numeric
            }
        };
        determineDataLimits() {
            const { min , max  } = this.getMinMax(true);
            this.min = isNumberFinite(min) ? min : 0;
            this.max = isNumberFinite(max) ? max : 1;
            this.handleTickRangeOptions();
        }
     computeTickLimit() {
            const horizontal = this.isHorizontal();
            const length = horizontal ? this.width : this.height;
            const minRotation = toRadians(this.options.ticks.minRotation);
            const ratio = (horizontal ? Math.sin(minRotation) : Math.cos(minRotation)) || 0.001;
            const tickFont = this._resolveTickFontOptions(0);
            return Math.ceil(length / Math.min(40, tickFont.lineHeight / ratio));
        }
        getPixelForValue(value) {
            return value === null ? NaN : this.getPixelForDecimal((value - this._startValue) / this._valueRange);
        }
        getValueForPixel(pixel) {
            return this._startValue + this.getDecimalForPixel(pixel) * this._valueRange;
        }
    }

    const log10Floor = (v)=>Math.floor(log10(v));
    const changeExponent = (v, m)=>Math.pow(10, log10Floor(v) + m);
    function isMajor(tickVal) {
        const remain = tickVal / Math.pow(10, log10Floor(tickVal));
        return remain === 1;
    }
    function steps(min, max, rangeExp) {
        const rangeStep = Math.pow(10, rangeExp);
        const start = Math.floor(min / rangeStep);
        const end = Math.ceil(max / rangeStep);
        return end - start;
    }
    function startExp(min, max) {
        const range = max - min;
        let rangeExp = log10Floor(range);
        while(steps(min, max, rangeExp) > 10){
            rangeExp++;
        }
        while(steps(min, max, rangeExp) < 10){
            rangeExp--;
        }
        return Math.min(rangeExp, log10Floor(min));
    }
     function generateTicks(generationOptions, { min , max  }) {
        min = finiteOrDefault(generationOptions.min, min);
        const ticks = [];
        const minExp = log10Floor(min);
        let exp = startExp(min, max);
        let precision = exp < 0 ? Math.pow(10, Math.abs(exp)) : 1;
        const stepSize = Math.pow(10, exp);
        const base = minExp > exp ? Math.pow(10, minExp) : 0;
        const start = Math.round((min - base) * precision) / precision;
        const offset = Math.floor((min - base) / stepSize / 10) * stepSize * 10;
        let significand = Math.floor((start - offset) / Math.pow(10, exp));
        let value = finiteOrDefault(generationOptions.min, Math.round((base + offset + significand * Math.pow(10, exp)) * precision) / precision);
        while(value < max){
            ticks.push({
                value,
                major: isMajor(value),
                significand
            });
            if (significand >= 10) {
                significand = significand < 15 ? 15 : 20;
            } else {
                significand++;
            }
            if (significand >= 20) {
                exp++;
                significand = 2;
                precision = exp >= 0 ? 1 : precision;
            }
            value = Math.round((base + offset + significand * Math.pow(10, exp)) * precision) / precision;
        }
        const lastTick = finiteOrDefault(generationOptions.max, value);
        ticks.push({
            value: lastTick,
            major: isMajor(lastTick),
            significand
        });
        return ticks;
    }
    class LogarithmicScale extends Scale {
        static id = 'logarithmic';
     static defaults = {
            ticks: {
                callback: Ticks.formatters.logarithmic,
                major: {
                    enabled: true
                }
            }
        };
        constructor(cfg){
            super(cfg);
             this.start = undefined;
             this.end = undefined;
             this._startValue = undefined;
            this._valueRange = 0;
        }
        parse(raw, index) {
            const value = LinearScaleBase.prototype.parse.apply(this, [
                raw,
                index
            ]);
            if (value === 0) {
                this._zero = true;
                return undefined;
            }
            return isNumberFinite(value) && value > 0 ? value : null;
        }
        determineDataLimits() {
            const { min , max  } = this.getMinMax(true);
            this.min = isNumberFinite(min) ? Math.max(0, min) : null;
            this.max = isNumberFinite(max) ? Math.max(0, max) : null;
            if (this.options.beginAtZero) {
                this._zero = true;
            }
            if (this._zero && this.min !== this._suggestedMin && !isNumberFinite(this._userMin)) {
                this.min = min === changeExponent(this.min, 0) ? changeExponent(this.min, -1) : changeExponent(this.min, 0);
            }
            this.handleTickRangeOptions();
        }
        handleTickRangeOptions() {
            const { minDefined , maxDefined  } = this.getUserBounds();
            let min = this.min;
            let max = this.max;
            const setMin = (v)=>min = minDefined ? min : v;
            const setMax = (v)=>max = maxDefined ? max : v;
            if (min === max) {
                if (min <= 0) {
                    setMin(1);
                    setMax(10);
                } else {
                    setMin(changeExponent(min, -1));
                    setMax(changeExponent(max, +1));
                }
            }
            if (min <= 0) {
                setMin(changeExponent(max, -1));
            }
            if (max <= 0) {
                setMax(changeExponent(min, +1));
            }
            this.min = min;
            this.max = max;
        }
        buildTicks() {
            const opts = this.options;
            const generationOptions = {
                min: this._userMin,
                max: this._userMax
            };
            const ticks = generateTicks(generationOptions, this);
            if (opts.bounds === 'ticks') {
                _setMinAndMaxByKey(ticks, this, 'value');
            }
            if (opts.reverse) {
                ticks.reverse();
                this.start = this.max;
                this.end = this.min;
            } else {
                this.start = this.min;
                this.end = this.max;
            }
            return ticks;
        }
     getLabelForValue(value) {
            return value === undefined ? '0' : formatNumber(value, this.chart.options.locale, this.options.ticks.format);
        }
     configure() {
            const start = this.min;
            super.configure();
            this._startValue = log10(start);
            this._valueRange = log10(this.max) - log10(start);
        }
        getPixelForValue(value) {
            if (value === undefined || value === 0) {
                value = this.min;
            }
            if (value === null || isNaN(value)) {
                return NaN;
            }
            return this.getPixelForDecimal(value === this.min ? 0 : (log10(value) - this._startValue) / this._valueRange);
        }
        getValueForPixel(pixel) {
            const decimal = this.getDecimalForPixel(pixel);
            return Math.pow(10, this._startValue + decimal * this._valueRange);
        }
    }

    function getTickBackdropHeight(opts) {
        const tickOpts = opts.ticks;
        if (tickOpts.display && opts.display) {
            const padding = toPadding(tickOpts.backdropPadding);
            return valueOrDefault(tickOpts.font && tickOpts.font.size, defaults.font.size) + padding.height;
        }
        return 0;
    }
    function measureLabelSize(ctx, font, label) {
        label = isArray(label) ? label : [
            label
        ];
        return {
            w: _longestText(ctx, font.string, label),
            h: label.length * font.lineHeight
        };
    }
    function determineLimits(angle, pos, size, min, max) {
        if (angle === min || angle === max) {
            return {
                start: pos - size / 2,
                end: pos + size / 2
            };
        } else if (angle < min || angle > max) {
            return {
                start: pos - size,
                end: pos
            };
        }
        return {
            start: pos,
            end: pos + size
        };
    }
     function fitWithPointLabels(scale) {
        const orig = {
            l: scale.left + scale._padding.left,
            r: scale.right - scale._padding.right,
            t: scale.top + scale._padding.top,
            b: scale.bottom - scale._padding.bottom
        };
        const limits = Object.assign({}, orig);
        const labelSizes = [];
        const padding = [];
        const valueCount = scale._pointLabels.length;
        const pointLabelOpts = scale.options.pointLabels;
        const additionalAngle = pointLabelOpts.centerPointLabels ? PI / valueCount : 0;
        for(let i = 0; i < valueCount; i++){
            const opts = pointLabelOpts.setContext(scale.getPointLabelContext(i));
            padding[i] = opts.padding;
            const pointPosition = scale.getPointPosition(i, scale.drawingArea + padding[i], additionalAngle);
            const plFont = toFont(opts.font);
            const textSize = measureLabelSize(scale.ctx, plFont, scale._pointLabels[i]);
            labelSizes[i] = textSize;
            const angleRadians = _normalizeAngle(scale.getIndexAngle(i) + additionalAngle);
            const angle = Math.round(toDegrees(angleRadians));
            const hLimits = determineLimits(angle, pointPosition.x, textSize.w, 0, 180);
            const vLimits = determineLimits(angle, pointPosition.y, textSize.h, 90, 270);
            updateLimits(limits, orig, angleRadians, hLimits, vLimits);
        }
        scale.setCenterPoint(orig.l - limits.l, limits.r - orig.r, orig.t - limits.t, limits.b - orig.b);
        scale._pointLabelItems = buildPointLabelItems(scale, labelSizes, padding);
    }
    function updateLimits(limits, orig, angle, hLimits, vLimits) {
        const sin = Math.abs(Math.sin(angle));
        const cos = Math.abs(Math.cos(angle));
        let x = 0;
        let y = 0;
        if (hLimits.start < orig.l) {
            x = (orig.l - hLimits.start) / sin;
            limits.l = Math.min(limits.l, orig.l - x);
        } else if (hLimits.end > orig.r) {
            x = (hLimits.end - orig.r) / sin;
            limits.r = Math.max(limits.r, orig.r + x);
        }
        if (vLimits.start < orig.t) {
            y = (orig.t - vLimits.start) / cos;
            limits.t = Math.min(limits.t, orig.t - y);
        } else if (vLimits.end > orig.b) {
            y = (vLimits.end - orig.b) / cos;
            limits.b = Math.max(limits.b, orig.b + y);
        }
    }
    function buildPointLabelItems(scale, labelSizes, padding) {
        const items = [];
        const valueCount = scale._pointLabels.length;
        const opts = scale.options;
        const extra = getTickBackdropHeight(opts) / 2;
        const outerDistance = scale.drawingArea;
        const additionalAngle = opts.pointLabels.centerPointLabels ? PI / valueCount : 0;
        for(let i = 0; i < valueCount; i++){
            const pointLabelPosition = scale.getPointPosition(i, outerDistance + extra + padding[i], additionalAngle);
            const angle = Math.round(toDegrees(_normalizeAngle(pointLabelPosition.angle + HALF_PI)));
            const size = labelSizes[i];
            const y = yForAngle(pointLabelPosition.y, size.h, angle);
            const textAlign = getTextAlignForAngle(angle);
            const left = leftForTextAlign(pointLabelPosition.x, size.w, textAlign);
            items.push({
                x: pointLabelPosition.x,
                y,
                textAlign,
                left,
                top: y,
                right: left + size.w,
                bottom: y + size.h
            });
        }
        return items;
    }
    function getTextAlignForAngle(angle) {
        if (angle === 0 || angle === 180) {
            return 'center';
        } else if (angle < 180) {
            return 'left';
        }
        return 'right';
    }
    function leftForTextAlign(x, w, align) {
        if (align === 'right') {
            x -= w;
        } else if (align === 'center') {
            x -= w / 2;
        }
        return x;
    }
    function yForAngle(y, h, angle) {
        if (angle === 90 || angle === 270) {
            y -= h / 2;
        } else if (angle > 270 || angle < 90) {
            y -= h;
        }
        return y;
    }
    function drawPointLabels(scale, labelCount) {
        const { ctx , options: { pointLabels  }  } = scale;
        for(let i = labelCount - 1; i >= 0; i--){
            const optsAtIndex = pointLabels.setContext(scale.getPointLabelContext(i));
            const plFont = toFont(optsAtIndex.font);
            const { x , y , textAlign , left , top , right , bottom  } = scale._pointLabelItems[i];
            const { backdropColor  } = optsAtIndex;
            if (!isNullOrUndef(backdropColor)) {
                const borderRadius = toTRBLCorners(optsAtIndex.borderRadius);
                const padding = toPadding(optsAtIndex.backdropPadding);
                ctx.fillStyle = backdropColor;
                const backdropLeft = left - padding.left;
                const backdropTop = top - padding.top;
                const backdropWidth = right - left + padding.width;
                const backdropHeight = bottom - top + padding.height;
                if (Object.values(borderRadius).some((v)=>v !== 0)) {
                    ctx.beginPath();
                    addRoundedRectPath(ctx, {
                        x: backdropLeft,
                        y: backdropTop,
                        w: backdropWidth,
                        h: backdropHeight,
                        radius: borderRadius
                    });
                    ctx.fill();
                } else {
                    ctx.fillRect(backdropLeft, backdropTop, backdropWidth, backdropHeight);
                }
            }
            renderText(ctx, scale._pointLabels[i], x, y + plFont.lineHeight / 2, plFont, {
                color: optsAtIndex.color,
                textAlign: textAlign,
                textBaseline: 'middle'
            });
        }
    }
    function pathRadiusLine(scale, radius, circular, labelCount) {
        const { ctx  } = scale;
        if (circular) {
            ctx.arc(scale.xCenter, scale.yCenter, radius, 0, TAU);
        } else {
            let pointPosition = scale.getPointPosition(0, radius);
            ctx.moveTo(pointPosition.x, pointPosition.y);
            for(let i = 1; i < labelCount; i++){
                pointPosition = scale.getPointPosition(i, radius);
                ctx.lineTo(pointPosition.x, pointPosition.y);
            }
        }
    }
    function drawRadiusLine(scale, gridLineOpts, radius, labelCount, borderOpts) {
        const ctx = scale.ctx;
        const circular = gridLineOpts.circular;
        const { color , lineWidth  } = gridLineOpts;
        if (!circular && !labelCount || !color || !lineWidth || radius < 0) {
            return;
        }
        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
        ctx.setLineDash(borderOpts.dash);
        ctx.lineDashOffset = borderOpts.dashOffset;
        ctx.beginPath();
        pathRadiusLine(scale, radius, circular, labelCount);
        ctx.closePath();
        ctx.stroke();
        ctx.restore();
    }
    function createPointLabelContext(parent, index, label) {
        return createContext(parent, {
            label,
            index,
            type: 'pointLabel'
        });
    }
    class RadialLinearScale extends LinearScaleBase {
        static id = 'radialLinear';
     static defaults = {
            display: true,
            animate: true,
            position: 'chartArea',
            angleLines: {
                display: true,
                lineWidth: 1,
                borderDash: [],
                borderDashOffset: 0.0
            },
            grid: {
                circular: false
            },
            startAngle: 0,
            ticks: {
                showLabelBackdrop: true,
                callback: Ticks.formatters.numeric
            },
            pointLabels: {
                backdropColor: undefined,
                backdropPadding: 2,
                display: true,
                font: {
                    size: 10
                },
                callback (label) {
                    return label;
                },
                padding: 5,
                centerPointLabels: false
            }
        };
        static defaultRoutes = {
            'angleLines.color': 'borderColor',
            'pointLabels.color': 'color',
            'ticks.color': 'color'
        };
        static descriptors = {
            angleLines: {
                _fallback: 'grid'
            }
        };
        constructor(cfg){
            super(cfg);
             this.xCenter = undefined;
             this.yCenter = undefined;
             this.drawingArea = undefined;
             this._pointLabels = [];
            this._pointLabelItems = [];
        }
        setDimensions() {
            const padding = this._padding = toPadding(getTickBackdropHeight(this.options) / 2);
            const w = this.width = this.maxWidth - padding.width;
            const h = this.height = this.maxHeight - padding.height;
            this.xCenter = Math.floor(this.left + w / 2 + padding.left);
            this.yCenter = Math.floor(this.top + h / 2 + padding.top);
            this.drawingArea = Math.floor(Math.min(w, h) / 2);
        }
        determineDataLimits() {
            const { min , max  } = this.getMinMax(false);
            this.min = isNumberFinite(min) && !isNaN(min) ? min : 0;
            this.max = isNumberFinite(max) && !isNaN(max) ? max : 0;
            this.handleTickRangeOptions();
        }
     computeTickLimit() {
            return Math.ceil(this.drawingArea / getTickBackdropHeight(this.options));
        }
        generateTickLabels(ticks) {
            LinearScaleBase.prototype.generateTickLabels.call(this, ticks);
            this._pointLabels = this.getLabels().map((value, index)=>{
                const label = callback(this.options.pointLabels.callback, [
                    value,
                    index
                ], this);
                return label || label === 0 ? label : '';
            }).filter((v, i)=>this.chart.getDataVisibility(i));
        }
        fit() {
            const opts = this.options;
            if (opts.display && opts.pointLabels.display) {
                fitWithPointLabels(this);
            } else {
                this.setCenterPoint(0, 0, 0, 0);
            }
        }
        setCenterPoint(leftMovement, rightMovement, topMovement, bottomMovement) {
            this.xCenter += Math.floor((leftMovement - rightMovement) / 2);
            this.yCenter += Math.floor((topMovement - bottomMovement) / 2);
            this.drawingArea -= Math.min(this.drawingArea / 2, Math.max(leftMovement, rightMovement, topMovement, bottomMovement));
        }
        getIndexAngle(index) {
            const angleMultiplier = TAU / (this._pointLabels.length || 1);
            const startAngle = this.options.startAngle || 0;
            return _normalizeAngle(index * angleMultiplier + toRadians(startAngle));
        }
        getDistanceFromCenterForValue(value) {
            if (isNullOrUndef(value)) {
                return NaN;
            }
            const scalingFactor = this.drawingArea / (this.max - this.min);
            if (this.options.reverse) {
                return (this.max - value) * scalingFactor;
            }
            return (value - this.min) * scalingFactor;
        }
        getValueForDistanceFromCenter(distance) {
            if (isNullOrUndef(distance)) {
                return NaN;
            }
            const scaledDistance = distance / (this.drawingArea / (this.max - this.min));
            return this.options.reverse ? this.max - scaledDistance : this.min + scaledDistance;
        }
        getPointLabelContext(index) {
            const pointLabels = this._pointLabels || [];
            if (index >= 0 && index < pointLabels.length) {
                const pointLabel = pointLabels[index];
                return createPointLabelContext(this.getContext(), index, pointLabel);
            }
        }
        getPointPosition(index, distanceFromCenter, additionalAngle = 0) {
            const angle = this.getIndexAngle(index) - HALF_PI + additionalAngle;
            return {
                x: Math.cos(angle) * distanceFromCenter + this.xCenter,
                y: Math.sin(angle) * distanceFromCenter + this.yCenter,
                angle
            };
        }
        getPointPositionForValue(index, value) {
            return this.getPointPosition(index, this.getDistanceFromCenterForValue(value));
        }
        getBasePosition(index) {
            return this.getPointPositionForValue(index || 0, this.getBaseValue());
        }
        getPointLabelPosition(index) {
            const { left , top , right , bottom  } = this._pointLabelItems[index];
            return {
                left,
                top,
                right,
                bottom
            };
        }
     drawBackground() {
            const { backgroundColor , grid: { circular  }  } = this.options;
            if (backgroundColor) {
                const ctx = this.ctx;
                ctx.save();
                ctx.beginPath();
                pathRadiusLine(this, this.getDistanceFromCenterForValue(this._endValue), circular, this._pointLabels.length);
                ctx.closePath();
                ctx.fillStyle = backgroundColor;
                ctx.fill();
                ctx.restore();
            }
        }
     drawGrid() {
            const ctx = this.ctx;
            const opts = this.options;
            const { angleLines , grid , border  } = opts;
            const labelCount = this._pointLabels.length;
            let i, offset, position;
            if (opts.pointLabels.display) {
                drawPointLabels(this, labelCount);
            }
            if (grid.display) {
                this.ticks.forEach((tick, index)=>{
                    if (index !== 0) {
                        offset = this.getDistanceFromCenterForValue(tick.value);
                        const context = this.getContext(index);
                        const optsAtIndex = grid.setContext(context);
                        const optsAtIndexBorder = border.setContext(context);
                        drawRadiusLine(this, optsAtIndex, offset, labelCount, optsAtIndexBorder);
                    }
                });
            }
            if (angleLines.display) {
                ctx.save();
                for(i = labelCount - 1; i >= 0; i--){
                    const optsAtIndex = angleLines.setContext(this.getPointLabelContext(i));
                    const { color , lineWidth  } = optsAtIndex;
                    if (!lineWidth || !color) {
                        continue;
                    }
                    ctx.lineWidth = lineWidth;
                    ctx.strokeStyle = color;
                    ctx.setLineDash(optsAtIndex.borderDash);
                    ctx.lineDashOffset = optsAtIndex.borderDashOffset;
                    offset = this.getDistanceFromCenterForValue(opts.ticks.reverse ? this.min : this.max);
                    position = this.getPointPosition(i, offset);
                    ctx.beginPath();
                    ctx.moveTo(this.xCenter, this.yCenter);
                    ctx.lineTo(position.x, position.y);
                    ctx.stroke();
                }
                ctx.restore();
            }
        }
     drawBorder() {}
     drawLabels() {
            const ctx = this.ctx;
            const opts = this.options;
            const tickOpts = opts.ticks;
            if (!tickOpts.display) {
                return;
            }
            const startAngle = this.getIndexAngle(0);
            let offset, width;
            ctx.save();
            ctx.translate(this.xCenter, this.yCenter);
            ctx.rotate(startAngle);
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            this.ticks.forEach((tick, index)=>{
                if (index === 0 && !opts.reverse) {
                    return;
                }
                const optsAtIndex = tickOpts.setContext(this.getContext(index));
                const tickFont = toFont(optsAtIndex.font);
                offset = this.getDistanceFromCenterForValue(this.ticks[index].value);
                if (optsAtIndex.showLabelBackdrop) {
                    ctx.font = tickFont.string;
                    width = ctx.measureText(tick.label).width;
                    ctx.fillStyle = optsAtIndex.backdropColor;
                    const padding = toPadding(optsAtIndex.backdropPadding);
                    ctx.fillRect(-width / 2 - padding.left, -offset - tickFont.size / 2 - padding.top, width + padding.width, tickFont.size + padding.height);
                }
                renderText(ctx, tick.label, 0, -offset, tickFont, {
                    color: optsAtIndex.color
                });
            });
            ctx.restore();
        }
     drawTitle() {}
    }

    const INTERVALS = {
        millisecond: {
            common: true,
            size: 1,
            steps: 1000
        },
        second: {
            common: true,
            size: 1000,
            steps: 60
        },
        minute: {
            common: true,
            size: 60000,
            steps: 60
        },
        hour: {
            common: true,
            size: 3600000,
            steps: 24
        },
        day: {
            common: true,
            size: 86400000,
            steps: 30
        },
        week: {
            common: false,
            size: 604800000,
            steps: 4
        },
        month: {
            common: true,
            size: 2.628e9,
            steps: 12
        },
        quarter: {
            common: false,
            size: 7.884e9,
            steps: 4
        },
        year: {
            common: true,
            size: 3.154e10
        }
    };
     const UNITS =  /* #__PURE__ */ Object.keys(INTERVALS);
     function sorter(a, b) {
        return a - b;
    }
     function parse(scale, input) {
        if (isNullOrUndef(input)) {
            return null;
        }
        const adapter = scale._adapter;
        const { parser , round , isoWeekday  } = scale._parseOpts;
        let value = input;
        if (typeof parser === 'function') {
            value = parser(value);
        }
        if (!isNumberFinite(value)) {
            value = typeof parser === 'string' ? adapter.parse(value,  parser) : adapter.parse(value);
        }
        if (value === null) {
            return null;
        }
        if (round) {
            value = round === 'week' && (isNumber(isoWeekday) || isoWeekday === true) ? adapter.startOf(value, 'isoWeek', isoWeekday) : adapter.startOf(value, round);
        }
        return +value;
    }
     function determineUnitForAutoTicks(minUnit, min, max, capacity) {
        const ilen = UNITS.length;
        for(let i = UNITS.indexOf(minUnit); i < ilen - 1; ++i){
            const interval = INTERVALS[UNITS[i]];
            const factor = interval.steps ? interval.steps : Number.MAX_SAFE_INTEGER;
            if (interval.common && Math.ceil((max - min) / (factor * interval.size)) <= capacity) {
                return UNITS[i];
            }
        }
        return UNITS[ilen - 1];
    }
     function determineUnitForFormatting(scale, numTicks, minUnit, min, max) {
        for(let i = UNITS.length - 1; i >= UNITS.indexOf(minUnit); i--){
            const unit = UNITS[i];
            if (INTERVALS[unit].common && scale._adapter.diff(max, min, unit) >= numTicks - 1) {
                return unit;
            }
        }
        return UNITS[minUnit ? UNITS.indexOf(minUnit) : 0];
    }
     function determineMajorUnit(unit) {
        for(let i = UNITS.indexOf(unit) + 1, ilen = UNITS.length; i < ilen; ++i){
            if (INTERVALS[UNITS[i]].common) {
                return UNITS[i];
            }
        }
    }
     function addTick(ticks, time, timestamps) {
        if (!timestamps) {
            ticks[time] = true;
        } else if (timestamps.length) {
            const { lo , hi  } = _lookup(timestamps, time);
            const timestamp = timestamps[lo] >= time ? timestamps[lo] : timestamps[hi];
            ticks[timestamp] = true;
        }
    }
     function setMajorTicks(scale, ticks, map, majorUnit) {
        const adapter = scale._adapter;
        const first = +adapter.startOf(ticks[0].value, majorUnit);
        const last = ticks[ticks.length - 1].value;
        let major, index;
        for(major = first; major <= last; major = +adapter.add(major, 1, majorUnit)){
            index = map[major];
            if (index >= 0) {
                ticks[index].major = true;
            }
        }
        return ticks;
    }
     function ticksFromTimestamps(scale, values, majorUnit) {
        const ticks = [];
         const map = {};
        const ilen = values.length;
        let i, value;
        for(i = 0; i < ilen; ++i){
            value = values[i];
            map[value] = i;
            ticks.push({
                value,
                major: false
            });
        }
        return ilen === 0 || !majorUnit ? ticks : setMajorTicks(scale, ticks, map, majorUnit);
    }
    class TimeScale extends Scale {
        static id = 'time';
     static defaults = {
     bounds: 'data',
            adapters: {},
            time: {
                parser: false,
                unit: false,
                round: false,
                isoWeekday: false,
                minUnit: 'millisecond',
                displayFormats: {}
            },
            ticks: {
     source: 'auto',
                callback: false,
                major: {
                    enabled: false
                }
            }
        };
     constructor(props){
            super(props);
             this._cache = {
                data: [],
                labels: [],
                all: []
            };
             this._unit = 'day';
             this._majorUnit = undefined;
            this._offsets = {};
            this._normalized = false;
            this._parseOpts = undefined;
        }
        init(scaleOpts, opts = {}) {
            const time = scaleOpts.time || (scaleOpts.time = {});
             const adapter = this._adapter = new adapters._date(scaleOpts.adapters.date);
            adapter.init(opts);
            mergeIf(time.displayFormats, adapter.formats());
            this._parseOpts = {
                parser: time.parser,
                round: time.round,
                isoWeekday: time.isoWeekday
            };
            super.init(scaleOpts);
            this._normalized = opts.normalized;
        }
     parse(raw, index) {
            if (raw === undefined) {
                return null;
            }
            return parse(this, raw);
        }
        beforeLayout() {
            super.beforeLayout();
            this._cache = {
                data: [],
                labels: [],
                all: []
            };
        }
        determineDataLimits() {
            const options = this.options;
            const adapter = this._adapter;
            const unit = options.time.unit || 'day';
            let { min , max , minDefined , maxDefined  } = this.getUserBounds();
     function _applyBounds(bounds) {
                if (!minDefined && !isNaN(bounds.min)) {
                    min = Math.min(min, bounds.min);
                }
                if (!maxDefined && !isNaN(bounds.max)) {
                    max = Math.max(max, bounds.max);
                }
            }
            if (!minDefined || !maxDefined) {
                _applyBounds(this._getLabelBounds());
                if (options.bounds !== 'ticks' || options.ticks.source !== 'labels') {
                    _applyBounds(this.getMinMax(false));
                }
            }
            min = isNumberFinite(min) && !isNaN(min) ? min : +adapter.startOf(Date.now(), unit);
            max = isNumberFinite(max) && !isNaN(max) ? max : +adapter.endOf(Date.now(), unit) + 1;
            this.min = Math.min(min, max - 1);
            this.max = Math.max(min + 1, max);
        }
     _getLabelBounds() {
            const arr = this.getLabelTimestamps();
            let min = Number.POSITIVE_INFINITY;
            let max = Number.NEGATIVE_INFINITY;
            if (arr.length) {
                min = arr[0];
                max = arr[arr.length - 1];
            }
            return {
                min,
                max
            };
        }
     buildTicks() {
            const options = this.options;
            const timeOpts = options.time;
            const tickOpts = options.ticks;
            const timestamps = tickOpts.source === 'labels' ? this.getLabelTimestamps() : this._generate();
            if (options.bounds === 'ticks' && timestamps.length) {
                this.min = this._userMin || timestamps[0];
                this.max = this._userMax || timestamps[timestamps.length - 1];
            }
            const min = this.min;
            const max = this.max;
            const ticks = _filterBetween(timestamps, min, max);
            this._unit = timeOpts.unit || (tickOpts.autoSkip ? determineUnitForAutoTicks(timeOpts.minUnit, this.min, this.max, this._getLabelCapacity(min)) : determineUnitForFormatting(this, ticks.length, timeOpts.minUnit, this.min, this.max));
            this._majorUnit = !tickOpts.major.enabled || this._unit === 'year' ? undefined : determineMajorUnit(this._unit);
            this.initOffsets(timestamps);
            if (options.reverse) {
                ticks.reverse();
            }
            return ticksFromTimestamps(this, ticks, this._majorUnit);
        }
        afterAutoSkip() {
            if (this.options.offsetAfterAutoskip) {
                this.initOffsets(this.ticks.map((tick)=>+tick.value));
            }
        }
     initOffsets(timestamps = []) {
            let start = 0;
            let end = 0;
            let first, last;
            if (this.options.offset && timestamps.length) {
                first = this.getDecimalForValue(timestamps[0]);
                if (timestamps.length === 1) {
                    start = 1 - first;
                } else {
                    start = (this.getDecimalForValue(timestamps[1]) - first) / 2;
                }
                last = this.getDecimalForValue(timestamps[timestamps.length - 1]);
                if (timestamps.length === 1) {
                    end = last;
                } else {
                    end = (last - this.getDecimalForValue(timestamps[timestamps.length - 2])) / 2;
                }
            }
            const limit = timestamps.length < 3 ? 0.5 : 0.25;
            start = _limitValue(start, 0, limit);
            end = _limitValue(end, 0, limit);
            this._offsets = {
                start,
                end,
                factor: 1 / (start + 1 + end)
            };
        }
     _generate() {
            const adapter = this._adapter;
            const min = this.min;
            const max = this.max;
            const options = this.options;
            const timeOpts = options.time;
            const minor = timeOpts.unit || determineUnitForAutoTicks(timeOpts.minUnit, min, max, this._getLabelCapacity(min));
            const stepSize = valueOrDefault(options.ticks.stepSize, 1);
            const weekday = minor === 'week' ? timeOpts.isoWeekday : false;
            const hasWeekday = isNumber(weekday) || weekday === true;
            const ticks = {};
            let first = min;
            let time, count;
            if (hasWeekday) {
                first = +adapter.startOf(first, 'isoWeek', weekday);
            }
            first = +adapter.startOf(first, hasWeekday ? 'day' : minor);
            if (adapter.diff(max, min, minor) > 100000 * stepSize) {
                throw new Error(min + ' and ' + max + ' are too far apart with stepSize of ' + stepSize + ' ' + minor);
            }
            const timestamps = options.ticks.source === 'data' && this.getDataTimestamps();
            for(time = first, count = 0; time < max; time = +adapter.add(time, stepSize, minor), count++){
                addTick(ticks, time, timestamps);
            }
            if (time === max || options.bounds === 'ticks' || count === 1) {
                addTick(ticks, time, timestamps);
            }
            return Object.keys(ticks).sort((a, b)=>a - b).map((x)=>+x);
        }
     getLabelForValue(value) {
            const adapter = this._adapter;
            const timeOpts = this.options.time;
            if (timeOpts.tooltipFormat) {
                return adapter.format(value, timeOpts.tooltipFormat);
            }
            return adapter.format(value, timeOpts.displayFormats.datetime);
        }
     _tickFormatFunction(time, index, ticks, format) {
            const options = this.options;
            const formatter = options.ticks.callback;
            if (formatter) {
                return callback(formatter, [
                    time,
                    index,
                    ticks
                ], this);
            }
            const formats = options.time.displayFormats;
            const unit = this._unit;
            const majorUnit = this._majorUnit;
            const minorFormat = unit && formats[unit];
            const majorFormat = majorUnit && formats[majorUnit];
            const tick = ticks[index];
            const major = majorUnit && majorFormat && tick && tick.major;
            return this._adapter.format(time, format || (major ? majorFormat : minorFormat));
        }
     generateTickLabels(ticks) {
            let i, ilen, tick;
            for(i = 0, ilen = ticks.length; i < ilen; ++i){
                tick = ticks[i];
                tick.label = this._tickFormatFunction(tick.value, i, ticks);
            }
        }
     getDecimalForValue(value) {
            return value === null ? NaN : (value - this.min) / (this.max - this.min);
        }
     getPixelForValue(value) {
            const offsets = this._offsets;
            const pos = this.getDecimalForValue(value);
            return this.getPixelForDecimal((offsets.start + pos) * offsets.factor);
        }
     getValueForPixel(pixel) {
            const offsets = this._offsets;
            const pos = this.getDecimalForPixel(pixel) / offsets.factor - offsets.end;
            return this.min + pos * (this.max - this.min);
        }
     _getLabelSize(label) {
            const ticksOpts = this.options.ticks;
            const tickLabelWidth = this.ctx.measureText(label).width;
            const angle = toRadians(this.isHorizontal() ? ticksOpts.maxRotation : ticksOpts.minRotation);
            const cosRotation = Math.cos(angle);
            const sinRotation = Math.sin(angle);
            const tickFontSize = this._resolveTickFontOptions(0).size;
            return {
                w: tickLabelWidth * cosRotation + tickFontSize * sinRotation,
                h: tickLabelWidth * sinRotation + tickFontSize * cosRotation
            };
        }
     _getLabelCapacity(exampleTime) {
            const timeOpts = this.options.time;
            const displayFormats = timeOpts.displayFormats;
            const format = displayFormats[timeOpts.unit] || displayFormats.millisecond;
            const exampleLabel = this._tickFormatFunction(exampleTime, 0, ticksFromTimestamps(this, [
                exampleTime
            ], this._majorUnit), format);
            const size = this._getLabelSize(exampleLabel);
            const capacity = Math.floor(this.isHorizontal() ? this.width / size.w : this.height / size.h) - 1;
            return capacity > 0 ? capacity : 1;
        }
     getDataTimestamps() {
            let timestamps = this._cache.data || [];
            let i, ilen;
            if (timestamps.length) {
                return timestamps;
            }
            const metas = this.getMatchingVisibleMetas();
            if (this._normalized && metas.length) {
                return this._cache.data = metas[0].controller.getAllParsedValues(this);
            }
            for(i = 0, ilen = metas.length; i < ilen; ++i){
                timestamps = timestamps.concat(metas[i].controller.getAllParsedValues(this));
            }
            return this._cache.data = this.normalize(timestamps);
        }
     getLabelTimestamps() {
            const timestamps = this._cache.labels || [];
            let i, ilen;
            if (timestamps.length) {
                return timestamps;
            }
            const labels = this.getLabels();
            for(i = 0, ilen = labels.length; i < ilen; ++i){
                timestamps.push(parse(this, labels[i]));
            }
            return this._cache.labels = this._normalized ? timestamps : this.normalize(timestamps);
        }
     normalize(values) {
            return _arrayUnique(values.sort(sorter));
        }
    }

    function interpolate(table, val, reverse) {
        let lo = 0;
        let hi = table.length - 1;
        let prevSource, nextSource, prevTarget, nextTarget;
        if (reverse) {
            if (val >= table[lo].pos && val <= table[hi].pos) {
                ({ lo , hi  } = _lookupByKey(table, 'pos', val));
            }
            ({ pos: prevSource , time: prevTarget  } = table[lo]);
            ({ pos: nextSource , time: nextTarget  } = table[hi]);
        } else {
            if (val >= table[lo].time && val <= table[hi].time) {
                ({ lo , hi  } = _lookupByKey(table, 'time', val));
            }
            ({ time: prevSource , pos: prevTarget  } = table[lo]);
            ({ time: nextSource , pos: nextTarget  } = table[hi]);
        }
        const span = nextSource - prevSource;
        return span ? prevTarget + (nextTarget - prevTarget) * (val - prevSource) / span : prevTarget;
    }
    class TimeSeriesScale extends TimeScale {
        static id = 'timeseries';
     static defaults = TimeScale.defaults;
     constructor(props){
            super(props);
             this._table = [];
             this._minPos = undefined;
             this._tableRange = undefined;
        }
     initOffsets() {
            const timestamps = this._getTimestampsForTable();
            const table = this._table = this.buildLookupTable(timestamps);
            this._minPos = interpolate(table, this.min);
            this._tableRange = interpolate(table, this.max) - this._minPos;
            super.initOffsets(timestamps);
        }
     buildLookupTable(timestamps) {
            const { min , max  } = this;
            const items = [];
            const table = [];
            let i, ilen, prev, curr, next;
            for(i = 0, ilen = timestamps.length; i < ilen; ++i){
                curr = timestamps[i];
                if (curr >= min && curr <= max) {
                    items.push(curr);
                }
            }
            if (items.length < 2) {
                return [
                    {
                        time: min,
                        pos: 0
                    },
                    {
                        time: max,
                        pos: 1
                    }
                ];
            }
            for(i = 0, ilen = items.length; i < ilen; ++i){
                next = items[i + 1];
                prev = items[i - 1];
                curr = items[i];
                if (Math.round((next + prev) / 2) !== curr) {
                    table.push({
                        time: curr,
                        pos: i / (ilen - 1)
                    });
                }
            }
            return table;
        }
     _getTimestampsForTable() {
            let timestamps = this._cache.all || [];
            if (timestamps.length) {
                return timestamps;
            }
            const data = this.getDataTimestamps();
            const label = this.getLabelTimestamps();
            if (data.length && label.length) {
                timestamps = this.normalize(data.concat(label));
            } else {
                timestamps = data.length ? data : label;
            }
            timestamps = this._cache.all = timestamps;
            return timestamps;
        }
     getDecimalForValue(value) {
            return (interpolate(this._table, value) - this._minPos) / this._tableRange;
        }
     getValueForPixel(pixel) {
            const offsets = this._offsets;
            const decimal = this.getDecimalForPixel(pixel) / offsets.factor - offsets.end;
            return interpolate(this._table, decimal * this._tableRange + this._minPos, true);
        }
    }

    var scales = /*#__PURE__*/Object.freeze({
    __proto__: null,
    CategoryScale: CategoryScale,
    LinearScale: LinearScale,
    LogarithmicScale: LogarithmicScale,
    RadialLinearScale: RadialLinearScale,
    TimeScale: TimeScale,
    TimeSeriesScale: TimeSeriesScale
    });

    const registerables = [
        controllers,
        elements,
        plugins,
        scales
    ];

    const eventPrefix = /^on/;
    const events = [];
    Object.keys(globalThis).forEach(key => {
        if (eventPrefix.test(key)) {
            events.push(key.replace(eventPrefix, ''));
        }
    });
    function useForwardEvents(getRef) {
        const component = current_component;
        const destructors = [];
        function forward(e) {
            bubble(component, e);
        }
        onMount(() => {
            const ref = getRef();
            events.forEach(ref instanceof Element
                ? event => destructors.push(listen(ref, event, forward))
                : event => destructors.push(ref.$on(event, forward)));
        });
        onDestroy(() => {
            while (destructors.length) {
                destructors.pop()();
            }
        });
    }

    /* node_modules\svelte-chartjs\Chart.svelte generated by Svelte v3.55.0 */

    function create_fragment$8(ctx) {
    	let canvas;
    	let canvas_levels = [/*props*/ ctx[1]];
    	let canvas_data = {};

    	for (let i = 0; i < canvas_levels.length; i += 1) {
    		canvas_data = assign(canvas_data, canvas_levels[i]);
    	}

    	return {
    		c() {
    			canvas = element("canvas");
    			set_attributes(canvas, canvas_data);
    		},
    		m(target, anchor) {
    			insert(target, canvas, anchor);
    			/*canvas_binding*/ ctx[8](canvas);
    		},
    		p(ctx, [dirty]) {
    			set_attributes(canvas, canvas_data = get_spread_update(canvas_levels, [/*props*/ ctx[1]]));
    		},
    		i: noop$1,
    		o: noop$1,
    		d(detaching) {
    			if (detaching) detach(canvas);
    			/*canvas_binding*/ ctx[8](null);
    		}
    	};
    }

    function clean(props) {
    	// eslint-disable-next-line @typescript-eslint/no-unused-vars
    	let { data, type, options, plugins, children, $$scope, $$slots, ...rest } = props;

    	return rest;
    }

    function instance$8($$self, $$props, $$invalidate) {
    	let { type } = $$props;
    	let { data = { datasets: [] } } = $$props;
    	let { options = {} } = $$props;
    	let { plugins = [] } = $$props;
    	let { updateMode = undefined } = $$props;
    	let { chart = null } = $$props;
    	let canvasRef;
    	let props = clean($$props);

    	onMount(() => {
    		$$invalidate(2, chart = new Chart$1(canvasRef, { type, data, options, plugins }));
    	});

    	afterUpdate(() => {
    		if (!chart) return;
    		$$invalidate(2, chart.data = data, chart);
    		Object.assign(chart.options, options);
    		chart.update(updateMode);
    	});

    	onDestroy(() => {
    		if (chart) chart.destroy();
    		$$invalidate(2, chart = null);
    	});

    	useForwardEvents(() => canvasRef);

    	function canvas_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			canvasRef = $$value;
    			$$invalidate(0, canvasRef);
    		});
    	}

    	$$self.$$set = $$new_props => {
    		$$invalidate(9, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
    		if ('type' in $$new_props) $$invalidate(3, type = $$new_props.type);
    		if ('data' in $$new_props) $$invalidate(4, data = $$new_props.data);
    		if ('options' in $$new_props) $$invalidate(5, options = $$new_props.options);
    		if ('plugins' in $$new_props) $$invalidate(6, plugins = $$new_props.plugins);
    		if ('updateMode' in $$new_props) $$invalidate(7, updateMode = $$new_props.updateMode);
    		if ('chart' in $$new_props) $$invalidate(2, chart = $$new_props.chart);
    	};

    	$$props = exclude_internal_props($$props);

    	return [
    		canvasRef,
    		props,
    		chart,
    		type,
    		data,
    		options,
    		plugins,
    		updateMode,
    		canvas_binding
    	];
    }

    class Chart extends SvelteComponent {
    	constructor(options) {
    		super();

    		init(this, options, instance$8, create_fragment$8, safe_not_equal, {
    			type: 3,
    			data: 4,
    			options: 5,
    			plugins: 6,
    			updateMode: 7,
    			chart: 2
    		});
    	}
    }

    /* node_modules\svelte-chartjs\Line.svelte generated by Svelte v3.55.0 */

    function create_fragment$7(ctx) {
    	let chart_1;
    	let updating_chart;
    	let current;
    	const chart_1_spread_levels = [{ type: "line" }, /*props*/ ctx[1]];

    	function chart_1_chart_binding(value) {
    		/*chart_1_chart_binding*/ ctx[4](value);
    	}

    	let chart_1_props = {};

    	for (let i = 0; i < chart_1_spread_levels.length; i += 1) {
    		chart_1_props = assign(chart_1_props, chart_1_spread_levels[i]);
    	}

    	if (/*chart*/ ctx[0] !== void 0) {
    		chart_1_props.chart = /*chart*/ ctx[0];
    	}

    	chart_1 = new Chart({ props: chart_1_props });
    	/*chart_1_binding*/ ctx[3](chart_1);
    	binding_callbacks.push(() => bind(chart_1, 'chart', chart_1_chart_binding, /*chart*/ ctx[0]));

    	return {
    		c() {
    			create_component(chart_1.$$.fragment);
    		},
    		m(target, anchor) {
    			mount_component(chart_1, target, anchor);
    			current = true;
    		},
    		p(ctx, [dirty]) {
    			const chart_1_changes = (dirty & /*props*/ 2)
    			? get_spread_update(chart_1_spread_levels, [chart_1_spread_levels[0], get_spread_object(/*props*/ ctx[1])])
    			: {};

    			if (!updating_chart && dirty & /*chart*/ 1) {
    				updating_chart = true;
    				chart_1_changes.chart = /*chart*/ ctx[0];
    				add_flush_callback(() => updating_chart = false);
    			}

    			chart_1.$set(chart_1_changes);
    		},
    		i(local) {
    			if (current) return;
    			transition_in(chart_1.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(chart_1.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			/*chart_1_binding*/ ctx[3](null);
    			destroy_component(chart_1, detaching);
    		}
    	};
    }

    function instance$7($$self, $$props, $$invalidate) {
    	Chart$1.register(LineController);
    	let { chart = null } = $$props;
    	let props;
    	let baseChartRef;
    	useForwardEvents(() => baseChartRef);

    	function chart_1_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			baseChartRef = $$value;
    			$$invalidate(2, baseChartRef);
    		});
    	}

    	function chart_1_chart_binding(value) {
    		chart = value;
    		$$invalidate(0, chart);
    	}

    	$$self.$$set = $$new_props => {
    		$$invalidate(5, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
    		if ('chart' in $$new_props) $$invalidate(0, chart = $$new_props.chart);
    	};

    	$$self.$$.update = () => {
    		$$invalidate(1, props = $$props);
    	};

    	$$props = exclude_internal_props($$props);
    	return [chart, props, baseChartRef, chart_1_binding, chart_1_chart_binding];
    }

    class Line extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, { chart: 0 });
    	}
    }

    Chart$1.register(...registerables);
    Chart$1;

    /* SvelteComponents\CellViewer.svelte generated by Svelte v3.55.0 */

    function get_each_context$3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[4] = list[i];
    	child_ctx[6] = i;
    	return child_ctx;
    }

    // (29:8) {#if showing === i}
    function create_if_block$2(ctx) {
    	let g;
    	let text0;
    	let t0_value = /*cellVoltage*/ ctx[4].toFixed(2) + "";
    	let t0;
    	let t1;
    	let text0_y_value;
    	let text1;
    	let t2;
    	let t3;
    	let text1_y_value;
    	let g_outro;
    	let current;

    	return {
    		c() {
    			g = svg_element("g");
    			text0 = svg_element("text");
    			t0 = text(t0_value);
    			t1 = text("V\r\n                ");
    			text1 = svg_element("text");
    			t2 = text("#");
    			t3 = text(/*i*/ ctx[6]);
    			attr(text0, "x", /*i*/ ctx[6] * (180 / 20) + 10);
    			attr(text0, "y", text0_y_value = 20 - (/*cellVoltage*/ ctx[4] - /*median*/ ctx[1]) * 50 + (/*cellVoltage*/ ctx[4] < /*median*/ ctx[1] ? 6 : -5));
    			set_style(text0, "font-size", "4px");
    			set_style(text0, "font-family", "'Metropolis', monospace");
    			set_style(text0, "text-anchor", "middle");
    			attr(text1, "x", /*i*/ ctx[6] * (180 / 20) + 10);
    			attr(text1, "y", text1_y_value = 20 - (/*cellVoltage*/ ctx[4] - /*median*/ ctx[1]) * 50 + (/*cellVoltage*/ ctx[4] < /*median*/ ctx[1] ? 10 : -9));
    			set_style(text1, "font-size", "4px");
    			set_style(text1, "font-family", "'Metropolis', monospace");
    			set_style(text1, "text-anchor", "middle");
    			set_style(text1, "font-weight", "bold");
    		},
    		m(target, anchor) {
    			insert(target, g, anchor);
    			append(g, text0);
    			append(text0, t0);
    			append(text0, t1);
    			append(g, text1);
    			append(text1, t2);
    			append(text1, t3);
    			current = true;
    		},
    		p(ctx, dirty) {
    			if ((!current || dirty & /*$BMSData*/ 1) && t0_value !== (t0_value = /*cellVoltage*/ ctx[4].toFixed(2) + "")) set_data(t0, t0_value);

    			if (!current || dirty & /*$BMSData, median*/ 3 && text0_y_value !== (text0_y_value = 20 - (/*cellVoltage*/ ctx[4] - /*median*/ ctx[1]) * 50 + (/*cellVoltage*/ ctx[4] < /*median*/ ctx[1] ? 6 : -5))) {
    				attr(text0, "y", text0_y_value);
    			}

    			if (!current || dirty & /*$BMSData, median*/ 3 && text1_y_value !== (text1_y_value = 20 - (/*cellVoltage*/ ctx[4] - /*median*/ ctx[1]) * 50 + (/*cellVoltage*/ ctx[4] < /*median*/ ctx[1] ? 10 : -9))) {
    				attr(text1, "y", text1_y_value);
    			}
    		},
    		i(local) {
    			if (current) return;
    			if (g_outro) g_outro.end(1);
    			current = true;
    		},
    		o(local) {
    			g_outro = create_out_transition(g, fade, { duration: 2000 });
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(g);
    			if (detaching && g_outro) g_outro.end();
    		}
    	};
    }

    // (28:4) {#each $BMSData.cellVoltages as cellVoltage, i}
    function create_each_block$3(ctx) {
    	let line;
    	let line_y__value_1;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block = /*showing*/ ctx[2] === /*i*/ ctx[6] && create_if_block$2(ctx);

    	function click_handler() {
    		return /*click_handler*/ ctx[3](/*i*/ ctx[6]);
    	}

    	return {
    		c() {
    			if (if_block) if_block.c();
    			line = svg_element("line");
    			attr(line, "x1", /*i*/ ctx[6] * (180 / 20) + 10);
    			attr(line, "x2", /*i*/ ctx[6] * (180 / 20) + 10);
    			attr(line, "y1", 20);
    			attr(line, "y2", line_y__value_1 = 20 - (/*cellVoltage*/ ctx[4] - /*median*/ ctx[1]) * 50);
    			attr(line, "class", "pt svelte-1r60etb");
    		},
    		m(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert(target, line, anchor);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen(line, "click", click_handler),
    					listen(line, "keydown", keydown_handler)
    				];

    				mounted = true;
    			}
    		},
    		p(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (/*showing*/ ctx[2] === /*i*/ ctx[6]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*showing*/ 4) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$2(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(line.parentNode, line);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}

    			if (!current || dirty & /*$BMSData, median*/ 3 && line_y__value_1 !== (line_y__value_1 = 20 - (/*cellVoltage*/ ctx[4] - /*median*/ ctx[1]) * 50)) {
    				attr(line, "y2", line_y__value_1);
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach(line);
    			mounted = false;
    			run_all(dispose);
    		}
    	};
    }

    function create_fragment$6(ctx) {
    	let svg;
    	let line;
    	let current;
    	let each_value = /*$BMSData*/ ctx[0].cellVoltages;
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$3(get_each_context$3(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	return {
    		c() {
    			svg = svg_element("svg");
    			line = svg_element("line");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr(line, "x1", "0");
    			attr(line, "x2", "200");
    			attr(line, "y1", "20");
    			attr(line, "y2", "20");
    			attr(line, "class", "bar svelte-1r60etb");
    			attr(line, "style", "");
    			attr(svg, "viewBox", "0 0 200 40");
    			set_style(svg, "height", "100%");
    			set_style(svg, "width", "100%");
    		},
    		m(target, anchor) {
    			insert(target, svg, anchor);
    			append(svg, line);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(svg, null);
    			}

    			current = true;
    		},
    		p(ctx, [dirty]) {
    			if (dirty & /*$BMSData, median, showing, setTimeout*/ 7) {
    				each_value = /*$BMSData*/ ctx[0].cellVoltages;
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$3(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$3(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(svg, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(svg);
    			destroy_each(each_blocks, detaching);
    		}
    	};
    }

    const keydown_handler = () => {
    	
    };

    function instance$6($$self, $$props, $$invalidate) {
    	let $BMSData;
    	component_subscribe($$self, BMSData, $$value => $$invalidate(0, $BMSData = $$value));
    	let median;
    	let showing = -1;

    	const click_handler = i => {
    		$$invalidate(2, showing = i);
    		setTimeout(() => $$invalidate(2, showing = -1), 1000);
    	};

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$BMSData*/ 1) {
    			$$invalidate(1, median = $BMSData.cellVoltages.length
    			? $BMSData.cellVoltages[Math.floor($BMSData.cellVoltages.length / 2)]
    			: null);
    		}
    	};

    	return [$BMSData, median, showing, click_handler];
    }

    class CellViewer extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {});
    	}
    }

    /* SvelteComponents\BatteryIndicator.svelte generated by Svelte v3.55.0 */

    function create_fragment$5(ctx) {
    	let div5;
    	let div1;
    	let t0;
    	let div0;
    	let t1_value = /*percent*/ ctx[0].toFixed(0) + "";
    	let t1;
    	let t2;
    	let t3;
    	let div4;
    	let div3;
    	let div2;

    	return {
    		c() {
    			div5 = element("div");
    			div1 = element("div");
    			t0 = text("Battery\r\n        ");
    			div0 = element("div");
    			t1 = text(t1_value);
    			t2 = text("%");
    			t3 = space();
    			div4 = element("div");
    			div3 = element("div");
    			div2 = element("div");
    			set_style(div0, "font-size", "2.5rem");
    			set_style(div0, "padding-top", "5px");
    			attr(div1, "class", "battery_text");
    			attr(div2, "class", "liquid svelte-1jd2q42");

    			set_style(div2, "height", (/*percent*/ ctx[0] > 99.9
    			? /*percent*/ ctx[0] + 3
    			: /*percent*/ ctx[0]) + "%");

    			toggle_class(div2, "gradient-color-red", /*percent*/ ctx[0] <= 20);
    			toggle_class(div2, "gradient-color-orange", /*percent*/ ctx[0] > 20 && /*percent*/ ctx[0] <= 40);
    			toggle_class(div2, "gradient-color-yellow", /*percent*/ ctx[0] <= 80 && /*percent*/ ctx[0] > 40);
    			toggle_class(div2, "gradient-color-green", /*percent*/ ctx[0] > 80);
    			attr(div3, "class", "level svelte-1jd2q42");
    			attr(div4, "class", "pill svelte-1jd2q42");
    			attr(div5, "class", "card svelte-1jd2q42");
    		},
    		m(target, anchor) {
    			insert(target, div5, anchor);
    			append(div5, div1);
    			append(div1, t0);
    			append(div1, div0);
    			append(div0, t1);
    			append(div0, t2);
    			append(div5, t3);
    			append(div5, div4);
    			append(div4, div3);
    			append(div3, div2);
    		},
    		p(ctx, [dirty]) {
    			if (dirty & /*percent*/ 1 && t1_value !== (t1_value = /*percent*/ ctx[0].toFixed(0) + "")) set_data(t1, t1_value);

    			if (dirty & /*percent*/ 1) {
    				set_style(div2, "height", (/*percent*/ ctx[0] > 99.9
    				? /*percent*/ ctx[0] + 3
    				: /*percent*/ ctx[0]) + "%");
    			}

    			if (dirty & /*percent*/ 1) {
    				toggle_class(div2, "gradient-color-red", /*percent*/ ctx[0] <= 20);
    			}

    			if (dirty & /*percent*/ 1) {
    				toggle_class(div2, "gradient-color-orange", /*percent*/ ctx[0] > 20 && /*percent*/ ctx[0] <= 40);
    			}

    			if (dirty & /*percent*/ 1) {
    				toggle_class(div2, "gradient-color-yellow", /*percent*/ ctx[0] <= 80 && /*percent*/ ctx[0] > 40);
    			}

    			if (dirty & /*percent*/ 1) {
    				toggle_class(div2, "gradient-color-green", /*percent*/ ctx[0] > 80);
    			}
    		},
    		i: noop$1,
    		o: noop$1,
    		d(detaching) {
    			if (detaching) detach(div5);
    		}
    	};
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let $remainingAH;
    	component_subscribe($$self, remainingAH, $$value => $$invalidate(1, $remainingAH = $$value));
    	let percent;

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$remainingAH*/ 2) {
    			$$invalidate(0, percent = $remainingAH / 1.36);
    		}
    	};

    	return [percent, $remainingAH];
    }

    class BatteryIndicator extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});
    	}
    }

    /* screens\Battery.svelte generated by Svelte v3.55.0 */

    function create_fragment$4(ctx) {
    	let div0;
    	let line;
    	let t0;
    	let div1;
    	let batteryindicator;
    	let t1;
    	let div3;
    	let div2;
    	let img0;
    	let img0_src_value;
    	let t2;
    	let table;
    	let tr0;
    	let td0;
    	let t3;
    	let td1;

    	let t4_value = (/*$chargerData*/ ctx[1].running
    	? /*$chargerData*/ ctx[1].inputVoltage.toFixed(0)
    	: ' - ') + "";

    	let t4;
    	let t5;
    	let t6;
    	let tr1;
    	let td2;
    	let t7;
    	let td3;

    	let t8_value = (/*$chargerData*/ ctx[1].running
    	? /*$chargerData*/ ctx[1].outputVoltage.toFixed(1)
    	: ' - ') + "";

    	let t8;
    	let t9;
    	let t10;
    	let tr2;
    	let td4;
    	let t11;
    	let td5;

    	let t12_value = (/*$chargerData*/ ctx[1].running
    	? /*$chargerData*/ ctx[1].current.toFixed(1)
    	: ' - ') + "";

    	let t12;
    	let t13;
    	let t14;
    	let tr3;
    	let td6;
    	let t15;
    	let td7;

    	let t16_value = (/*$chargerData*/ ctx[1].running
    	? /*$chargerData*/ ctx[1].temp.toFixed(1)
    	: ' - ') + "";

    	let t16;
    	let t17;
    	let t18;
    	let div4;
    	let cellviewer;
    	let current;

    	line = new Line({
    			props: {
    				data: /*data*/ ctx[0],
    				options: /*options*/ ctx[2]
    			}
    		});

    	batteryindicator = new BatteryIndicator({});
    	cellviewer = new CellViewer({});

    	return {
    		c() {
    			div0 = element("div");
    			create_component(line.$$.fragment);
    			t0 = space();
    			div1 = element("div");
    			create_component(batteryindicator.$$.fragment);
    			t1 = space();
    			div3 = element("div");
    			div2 = element("div");
    			img0 = element("img");
    			t2 = space();
    			table = element("table");
    			tr0 = element("tr");
    			td0 = element("td");
    			td0.innerHTML = `<img src="./static/outlet.svg" alt="outlet" class="svelte-u3d0fd"/>`;
    			t3 = space();
    			td1 = element("td");
    			t4 = text(t4_value);
    			t5 = text(" V");
    			t6 = space();
    			tr1 = element("tr");
    			td2 = element("td");
    			td2.innerHTML = `<img src="./static/battery.svg" alt="batt" class="svelte-u3d0fd"/>`;
    			t7 = space();
    			td3 = element("td");
    			t8 = text(t8_value);
    			t9 = text(" V");
    			t10 = space();
    			tr2 = element("tr");
    			td4 = element("td");
    			td4.innerHTML = `<img src="./static/battery.svg" alt="batt" class="svelte-u3d0fd"/>`;
    			t11 = space();
    			td5 = element("td");
    			t12 = text(t12_value);
    			t13 = text(" A");
    			t14 = space();
    			tr3 = element("tr");
    			td6 = element("td");
    			td6.innerHTML = `<img src="./static/temp.svg" alt="temp" class="svelte-u3d0fd"/>`;
    			t15 = space();
    			td7 = element("td");
    			t16 = text(t16_value);
    			t17 = text(" C");
    			t18 = space();
    			div4 = element("div");
    			create_component(cellviewer.$$.fragment);
    			set_style(div0, "position", "absolute");
    			set_style(div0, "top", "25vh");
    			set_style(div0, "left", "26.5vw");
    			set_style(div0, "width", "50vw");
    			set_style(div0, "height", "50vh");
    			set_style(div1, "position", "absolute");
    			set_style(div1, "top", "25vh");
    			set_style(div1, "left", "2vw");
    			set_style(div1, "width", "17vw");
    			set_style(div1, "height", "50vh");
    			if (!src_url_equal(img0.src, img0_src_value = "./static/charger.svg")) attr(img0, "src", img0_src_value);
    			attr(img0, "alt", "charger");
    			set_style(img0, "height", "16vh");
    			set_style(div2, "display", "flex");
    			set_style(div2, "justify-content", "center");
    			set_style(div2, "height", "20vh");
    			set_style(div2, "transition", "opacity 1s linear");
    			set_style(div2, "opacity", (/*$chargerData*/ ctx[1].running ? 100 : 50) + "%");
    			attr(td0, "class", "svelte-u3d0fd");
    			attr(td1, "class", "svelte-u3d0fd");
    			attr(td2, "class", "svelte-u3d0fd");
    			attr(td3, "class", "svelte-u3d0fd");
    			attr(td4, "class", "svelte-u3d0fd");
    			attr(td5, "class", "svelte-u3d0fd");
    			attr(td6, "class", "svelte-u3d0fd");
    			attr(td7, "class", "svelte-u3d0fd");
    			attr(table, "class", "svelte-u3d0fd");
    			set_style(div3, "position", "absolute");
    			set_style(div3, "top", "2vw");
    			set_style(div3, "right", "2vw");
    			set_style(div4, "position", "absolute");
    			set_style(div4, "bottom", "0");
    			set_style(div4, "width", "100vw");
    			set_style(div4, "height", "20vw");
    		},
    		m(target, anchor) {
    			insert(target, div0, anchor);
    			mount_component(line, div0, null);
    			insert(target, t0, anchor);
    			insert(target, div1, anchor);
    			mount_component(batteryindicator, div1, null);
    			insert(target, t1, anchor);
    			insert(target, div3, anchor);
    			append(div3, div2);
    			append(div2, img0);
    			append(div3, t2);
    			append(div3, table);
    			append(table, tr0);
    			append(tr0, td0);
    			append(tr0, t3);
    			append(tr0, td1);
    			append(td1, t4);
    			append(td1, t5);
    			append(table, t6);
    			append(table, tr1);
    			append(tr1, td2);
    			append(tr1, t7);
    			append(tr1, td3);
    			append(td3, t8);
    			append(td3, t9);
    			append(table, t10);
    			append(table, tr2);
    			append(tr2, td4);
    			append(tr2, t11);
    			append(tr2, td5);
    			append(td5, t12);
    			append(td5, t13);
    			append(table, t14);
    			append(table, tr3);
    			append(tr3, td6);
    			append(tr3, t15);
    			append(tr3, td7);
    			append(td7, t16);
    			append(td7, t17);
    			insert(target, t18, anchor);
    			insert(target, div4, anchor);
    			mount_component(cellviewer, div4, null);
    			current = true;
    		},
    		p(ctx, [dirty]) {
    			const line_changes = {};
    			if (dirty & /*data*/ 1) line_changes.data = /*data*/ ctx[0];
    			line.$set(line_changes);

    			if (!current || dirty & /*$chargerData*/ 2) {
    				set_style(div2, "opacity", (/*$chargerData*/ ctx[1].running ? 100 : 50) + "%");
    			}

    			if ((!current || dirty & /*$chargerData*/ 2) && t4_value !== (t4_value = (/*$chargerData*/ ctx[1].running
    			? /*$chargerData*/ ctx[1].inputVoltage.toFixed(0)
    			: ' - ') + "")) set_data(t4, t4_value);

    			if ((!current || dirty & /*$chargerData*/ 2) && t8_value !== (t8_value = (/*$chargerData*/ ctx[1].running
    			? /*$chargerData*/ ctx[1].outputVoltage.toFixed(1)
    			: ' - ') + "")) set_data(t8, t8_value);

    			if ((!current || dirty & /*$chargerData*/ 2) && t12_value !== (t12_value = (/*$chargerData*/ ctx[1].running
    			? /*$chargerData*/ ctx[1].current.toFixed(1)
    			: ' - ') + "")) set_data(t12, t12_value);

    			if ((!current || dirty & /*$chargerData*/ 2) && t16_value !== (t16_value = (/*$chargerData*/ ctx[1].running
    			? /*$chargerData*/ ctx[1].temp.toFixed(1)
    			: ' - ') + "")) set_data(t16, t16_value);
    		},
    		i(local) {
    			if (current) return;
    			transition_in(line.$$.fragment, local);
    			transition_in(batteryindicator.$$.fragment, local);
    			transition_in(cellviewer.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(line.$$.fragment, local);
    			transition_out(batteryindicator.$$.fragment, local);
    			transition_out(cellviewer.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(div0);
    			destroy_component(line);
    			if (detaching) detach(t0);
    			if (detaching) detach(div1);
    			destroy_component(batteryindicator);
    			if (detaching) detach(t1);
    			if (detaching) detach(div3);
    			if (detaching) detach(t18);
    			if (detaching) detach(div4);
    			destroy_component(cellviewer);
    		}
    	};
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let $remainingAH;
    	let $BMSData;
    	let $chargerData;
    	component_subscribe($$self, remainingAH, $$value => $$invalidate(3, $remainingAH = $$value));
    	component_subscribe($$self, BMSData, $$value => $$invalidate(4, $BMSData = $$value));
    	component_subscribe($$self, chargerData, $$value => $$invalidate(1, $chargerData = $$value));

    	let { data = {
    		labels: [],
    		datasets: [
    			{
    				label: 'Voltage',
    				fill: true,
    				lineTension: 0.3,
    				backgroundColor: 'rgba(225, 204,230, .3)',
    				borderColor: 'rgb(205, 130, 158)',
    				pointBorderColor: 'transparent',
    				pointBackgroundColor: 'transparent',
    				data: [],
    				yAxisID: 'y'
    			},
    			{
    				label: 'Miles Remaining',
    				fill: true,
    				lineTension: 0.3,
    				backgroundColor: 'rgba(184, 185, 210, .3)',
    				borderColor: 'rgb(35, 26, 136)',
    				pointBorderColor: 'transparent',
    				pointBackgroundColor: 'transparent',
    				data: [],
    				yAxisID: 'y1'
    			}
    		]
    	} } = $$props;

    	const options = {
    		responsive: true,
    		scales: {
    			y: {
    				type: 'linear',
    				display: true,
    				position: 'left',
    				title: { display: true, text: 'Voltage' }
    			},
    			y1: {
    				type: 'linear',
    				display: true,
    				position: 'right',
    				title: { display: true, text: 'Miles Remaining' },
    				grid: { drawOnChartArea: false }
    			}
    		}
    	};

    	setInterval(
    		() => {
    			data.datasets[0].data.push($BMSData.batteryVoltage);
    			data.datasets[1].data.push($remainingAH * 3.7 * 21 * 0.0035);

    			const str = new Date().toLocaleString('en-US', {
    				hour: 'numeric',
    				minute: 'numeric',
    				hour12: true
    			});

    			data.labels.push(str.substring(0, str.length - 3));

    			if (data.datasets[0].data.length > 60) {
    				data.datasets[0].data.shift();
    				data.datasets[1].data.shift();
    				data.labels.shift();
    			}

    			$$invalidate(0, data);
    		},
    		60000
    	);

    	$$self.$$set = $$props => {
    		if ('data' in $$props) $$invalidate(0, data = $$props.data);
    	};

    	return [data, $chargerData, options];
    }

    class Battery extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { data: 0 });
    	}
    }

    /* SvelteComponents\ObjectViewer.svelte generated by Svelte v3.55.0 */

    function get_each_context_1$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[13] = list[i][0];
    	child_ctx[10] = list[i][1];
    	return child_ctx;
    }

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[10] = list[i];
    	child_ctx[11] = list;
    	child_ctx[12] = i;
    	return child_ctx;
    }

    // (50:35) 
    function create_if_block_4(ctx) {
    	let div;
    	let t;
    	let if_block1_anchor;
    	let current;
    	let mounted;
    	let dispose;

    	function select_block_type_2(ctx, dirty) {
    		if (/*expanded*/ ctx[1]) return create_if_block_6;
    		return create_else_block_1;
    	}

    	let current_block_type = select_block_type_2(ctx);
    	let if_block0 = current_block_type(ctx);
    	let if_block1 = /*expanded*/ ctx[1] && create_if_block_5(ctx);

    	return {
    		c() {
    			div = element("div");
    			if_block0.c();
    			t = space();
    			if (if_block1) if_block1.c();
    			if_block1_anchor = empty();
    			set_style(div, "cursor", "pointer");
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);
    			if_block0.m(div, null);
    			insert(target, t, anchor);
    			if (if_block1) if_block1.m(target, anchor);
    			insert(target, if_block1_anchor, anchor);
    			current = true;

    			if (!mounted) {
    				dispose = listen(div, "click", /*click_handler_1*/ ctx[9]);
    				mounted = true;
    			}
    		},
    		p(ctx, dirty) {
    			if (current_block_type === (current_block_type = select_block_type_2(ctx)) && if_block0) {
    				if_block0.p(ctx, dirty);
    			} else {
    				if_block0.d(1);
    				if_block0 = current_block_type(ctx);

    				if (if_block0) {
    					if_block0.c();
    					if_block0.m(div, null);
    				}
    			}

    			if (/*expanded*/ ctx[1]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);

    					if (dirty & /*expanded*/ 2) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block_5(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(if_block1_anchor.parentNode, if_block1_anchor);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(if_block1);
    			current = true;
    		},
    		o(local) {
    			transition_out(if_block1);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(div);
    			if_block0.d();
    			if (detaching) detach(t);
    			if (if_block1) if_block1.d(detaching);
    			if (detaching) detach(if_block1_anchor);
    			mounted = false;
    			dispose();
    		}
    	};
    }

    // (39:31) 
    function create_if_block_1(ctx) {
    	let div;
    	let t;
    	let if_block1_anchor;
    	let current;
    	let mounted;
    	let dispose;

    	function select_block_type_1(ctx, dirty) {
    		if (/*expanded*/ ctx[1]) return create_if_block_3;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type_1(ctx);
    	let if_block0 = current_block_type(ctx);
    	let if_block1 = /*expanded*/ ctx[1] && create_if_block_2(ctx);

    	return {
    		c() {
    			div = element("div");
    			if_block0.c();
    			t = space();
    			if (if_block1) if_block1.c();
    			if_block1_anchor = empty();
    			set_style(div, "cursor", "pointer");
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);
    			if_block0.m(div, null);
    			insert(target, t, anchor);
    			if (if_block1) if_block1.m(target, anchor);
    			insert(target, if_block1_anchor, anchor);
    			current = true;

    			if (!mounted) {
    				dispose = listen(div, "click", /*click_handler*/ ctx[4]);
    				mounted = true;
    			}
    		},
    		p(ctx, dirty) {
    			if (current_block_type === (current_block_type = select_block_type_1(ctx)) && if_block0) {
    				if_block0.p(ctx, dirty);
    			} else {
    				if_block0.d(1);
    				if_block0 = current_block_type(ctx);

    				if (if_block0) {
    					if_block0.c();
    					if_block0.m(div, null);
    				}
    			}

    			if (/*expanded*/ ctx[1]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);

    					if (dirty & /*expanded*/ 2) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block_2(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(if_block1_anchor.parentNode, if_block1_anchor);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(if_block1);
    			current = true;
    		},
    		o(local) {
    			transition_out(if_block1);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(div);
    			if_block0.d();
    			if (detaching) detach(t);
    			if (if_block1) if_block1.d(detaching);
    			if (detaching) detach(if_block1_anchor);
    			mounted = false;
    			dispose();
    		}
    	};
    }

    // (35:0) {#if ['number', 'string', 'boolean'].includes(typeof value) || value == null}
    function create_if_block$1(ctx) {
    	let span;
    	let t;

    	return {
    		c() {
    			span = element("span");
    			t = text(/*value*/ ctx[0]);
    			attr(span, "class", "svelte-1oe0ppu");
    		},
    		m(target, anchor) {
    			insert(target, span, anchor);
    			append(span, t);
    		},
    		p(ctx, dirty) {
    			if (dirty & /*value*/ 1) set_data(t, /*value*/ ctx[0]);
    		},
    		i: noop$1,
    		o: noop$1,
    		d(detaching) {
    			if (detaching) detach(span);
    		}
    	};
    }

    // (53:8) {:else}
    function create_else_block_1(ctx) {
    	let t0;
    	let t1;
    	let t2;
    	let t3_value = Object.keys(/*value*/ ctx[0]).length + "";
    	let t3;
    	let t4;
    	let t5_value = '{' + Object.entries(/*value*/ ctx[0]).map(/*func*/ ctx[8]).join() + '}' + "";
    	let t5;

    	return {
    		c() {
    			t0 = text("▶ ");
    			t1 = text(/*name*/ ctx[2]);
    			t2 = text("(");
    			t3 = text(t3_value);
    			t4 = text(")\r\n            ");
    			t5 = text(t5_value);
    		},
    		m(target, anchor) {
    			insert(target, t0, anchor);
    			insert(target, t1, anchor);
    			insert(target, t2, anchor);
    			insert(target, t3, anchor);
    			insert(target, t4, anchor);
    			insert(target, t5, anchor);
    		},
    		p(ctx, dirty) {
    			if (dirty & /*name*/ 4) set_data(t1, /*name*/ ctx[2]);
    			if (dirty & /*value*/ 1 && t3_value !== (t3_value = Object.keys(/*value*/ ctx[0]).length + "")) set_data(t3, t3_value);
    			if (dirty & /*value*/ 1 && t5_value !== (t5_value = '{' + Object.entries(/*value*/ ctx[0]).map(/*func*/ ctx[8]).join() + '}' + "")) set_data(t5, t5_value);
    		},
    		d(detaching) {
    			if (detaching) detach(t0);
    			if (detaching) detach(t1);
    			if (detaching) detach(t2);
    			if (detaching) detach(t3);
    			if (detaching) detach(t4);
    			if (detaching) detach(t5);
    		}
    	};
    }

    // (52:8) {#if expanded}
    function create_if_block_6(ctx) {
    	let t0;
    	let t1;
    	let t2;
    	let t3_value = Object.keys(/*value*/ ctx[0]).length + "";
    	let t3;
    	let t4;

    	return {
    		c() {
    			t0 = text("▼ ");
    			t1 = text(/*name*/ ctx[2]);
    			t2 = text("(");
    			t3 = text(t3_value);
    			t4 = text(")");
    		},
    		m(target, anchor) {
    			insert(target, t0, anchor);
    			insert(target, t1, anchor);
    			insert(target, t2, anchor);
    			insert(target, t3, anchor);
    			insert(target, t4, anchor);
    		},
    		p(ctx, dirty) {
    			if (dirty & /*name*/ 4) set_data(t1, /*name*/ ctx[2]);
    			if (dirty & /*value*/ 1 && t3_value !== (t3_value = Object.keys(/*value*/ ctx[0]).length + "")) set_data(t3, t3_value);
    		},
    		d(detaching) {
    			if (detaching) detach(t0);
    			if (detaching) detach(t1);
    			if (detaching) detach(t2);
    			if (detaching) detach(t3);
    			if (detaching) detach(t4);
    		}
    	};
    }

    // (57:4) {#if expanded}
    function create_if_block_5(ctx) {
    	let table;
    	let current;
    	let each_value_1 = Object.entries(/*value*/ ctx[0]);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1$1(get_each_context_1$1(ctx, each_value_1, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	return {
    		c() {
    			table = element("table");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			set_style(table, "border-collapse", "collapse");
    		},
    		m(target, anchor) {
    			insert(target, table, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(table, null);
    			}

    			current = true;
    		},
    		p(ctx, dirty) {
    			if (dirty & /*value, Object*/ 1) {
    				each_value_1 = Object.entries(/*value*/ ctx[0]);
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
    						each_blocks[i].m(table, null);
    					}
    				}

    				group_outros();

    				for (i = each_value_1.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i(local) {
    			if (current) return;

    			for (let i = 0; i < each_value_1.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(table);
    			destroy_each(each_blocks, detaching);
    		}
    	};
    }

    // (59:12) {#each Object.entries(value) as [key, val]}
    function create_each_block_1$1(ctx) {
    	let tr;
    	let td0;
    	let objectviewer0;
    	let t0;
    	let td1;
    	let objectviewer1;
    	let t1;
    	let current;
    	objectviewer0 = new ObjectViewer({ props: { value: /*key*/ ctx[13] } });

    	objectviewer1 = new ObjectViewer({
    			props: { value: /*value*/ ctx[0][/*key*/ ctx[13]] }
    		});

    	return {
    		c() {
    			tr = element("tr");
    			td0 = element("td");
    			create_component(objectviewer0.$$.fragment);
    			t0 = space();
    			td1 = element("td");
    			create_component(objectviewer1.$$.fragment);
    			t1 = space();
    			attr(td0, "class", "svelte-1oe0ppu");
    			attr(td1, "class", "svelte-1oe0ppu");
    		},
    		m(target, anchor) {
    			insert(target, tr, anchor);
    			append(tr, td0);
    			mount_component(objectviewer0, td0, null);
    			append(tr, t0);
    			append(tr, td1);
    			mount_component(objectviewer1, td1, null);
    			append(tr, t1);
    			current = true;
    		},
    		p(ctx, dirty) {
    			const objectviewer0_changes = {};
    			if (dirty & /*value*/ 1) objectviewer0_changes.value = /*key*/ ctx[13];
    			objectviewer0.$set(objectviewer0_changes);
    			const objectviewer1_changes = {};
    			if (dirty & /*value*/ 1) objectviewer1_changes.value = /*value*/ ctx[0][/*key*/ ctx[13]];
    			objectviewer1.$set(objectviewer1_changes);
    		},
    		i(local) {
    			if (current) return;
    			transition_in(objectviewer0.$$.fragment, local);
    			transition_in(objectviewer1.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(objectviewer0.$$.fragment, local);
    			transition_out(objectviewer1.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(tr);
    			destroy_component(objectviewer0);
    			destroy_component(objectviewer1);
    		}
    	};
    }

    // (42:8) {:else}
    function create_else_block(ctx) {
    	let t0;
    	let t1_value = /*value*/ ctx[0].length + "";
    	let t1;
    	let t2;
    	let t3_value = /*value*/ ctx[0].join(', ') + "";
    	let t3;
    	let t4;

    	return {
    		c() {
    			t0 = text("▶ Array(");
    			t1 = text(t1_value);
    			t2 = text(") [");
    			t3 = text(t3_value);
    			t4 = text("]");
    		},
    		m(target, anchor) {
    			insert(target, t0, anchor);
    			insert(target, t1, anchor);
    			insert(target, t2, anchor);
    			insert(target, t3, anchor);
    			insert(target, t4, anchor);
    		},
    		p(ctx, dirty) {
    			if (dirty & /*value*/ 1 && t1_value !== (t1_value = /*value*/ ctx[0].length + "")) set_data(t1, t1_value);
    			if (dirty & /*value*/ 1 && t3_value !== (t3_value = /*value*/ ctx[0].join(', ') + "")) set_data(t3, t3_value);
    		},
    		d(detaching) {
    			if (detaching) detach(t0);
    			if (detaching) detach(t1);
    			if (detaching) detach(t2);
    			if (detaching) detach(t3);
    			if (detaching) detach(t4);
    		}
    	};
    }

    // (41:8) {#if expanded}
    function create_if_block_3(ctx) {
    	let t0;
    	let t1_value = /*value*/ ctx[0].length + "";
    	let t1;
    	let t2;

    	return {
    		c() {
    			t0 = text("▼ Array(");
    			t1 = text(t1_value);
    			t2 = text(")");
    		},
    		m(target, anchor) {
    			insert(target, t0, anchor);
    			insert(target, t1, anchor);
    			insert(target, t2, anchor);
    		},
    		p(ctx, dirty) {
    			if (dirty & /*value*/ 1 && t1_value !== (t1_value = /*value*/ ctx[0].length + "")) set_data(t1, t1_value);
    		},
    		d(detaching) {
    			if (detaching) detach(t0);
    			if (detaching) detach(t1);
    			if (detaching) detach(t2);
    		}
    	};
    }

    // (45:4) {#if expanded}
    function create_if_block_2(ctx) {
    	let each_1_anchor;
    	let current;
    	let each_value = /*value*/ ctx[0];
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	return {
    		c() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert(target, each_1_anchor, anchor);
    			current = true;
    		},
    		p(ctx, dirty) {
    			if (dirty & /*value*/ 1) {
    				each_value = /*value*/ ctx[0];
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$2(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$2(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach(each_1_anchor);
    		}
    	};
    }

    // (46:8) {#each value as val}
    function create_each_block$2(ctx) {
    	let objectviewer;
    	let updating_value;
    	let current;

    	function objectviewer_value_binding(value) {
    		/*objectviewer_value_binding*/ ctx[5](value, /*val*/ ctx[10], /*each_value*/ ctx[11], /*val_index*/ ctx[12]);
    	}

    	let objectviewer_props = {};

    	if (/*val*/ ctx[10] !== void 0) {
    		objectviewer_props.value = /*val*/ ctx[10];
    	}

    	objectviewer = new ObjectViewer({ props: objectviewer_props });
    	binding_callbacks.push(() => bind(objectviewer, 'value', objectviewer_value_binding, /*val*/ ctx[10]));
    	objectviewer.$on("edit", /*edit_handler*/ ctx[6]);
    	objectviewer.$on("done", /*done_handler*/ ctx[7]);

    	return {
    		c() {
    			create_component(objectviewer.$$.fragment);
    		},
    		m(target, anchor) {
    			mount_component(objectviewer, target, anchor);
    			current = true;
    		},
    		p(new_ctx, dirty) {
    			ctx = new_ctx;
    			const objectviewer_changes = {};

    			if (!updating_value && dirty & /*value*/ 1) {
    				updating_value = true;
    				objectviewer_changes.value = /*val*/ ctx[10];
    				add_flush_callback(() => updating_value = false);
    			}

    			objectviewer.$set(objectviewer_changes);
    		},
    		i(local) {
    			if (current) return;
    			transition_in(objectviewer.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(objectviewer.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			destroy_component(objectviewer, detaching);
    		}
    	};
    }

    function create_fragment$3(ctx) {
    	let show_if;
    	let show_if_1;
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block$1, create_if_block_1, create_if_block_4];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (dirty & /*value*/ 1) show_if = null;
    		if (dirty & /*value*/ 1) show_if_1 = null;
    		if (show_if == null) show_if = !!(['number', 'string', 'boolean'].includes(typeof /*value*/ ctx[0]) || /*value*/ ctx[0] == null);
    		if (show_if) return 0;
    		if (show_if_1 == null) show_if_1 = !!Array.isArray(/*value*/ ctx[0]);
    		if (show_if_1) return 1;
    		if (typeof /*value*/ ctx[0] == 'object') return 2;
    		return -1;
    	}

    	if (~(current_block_type_index = select_block_type(ctx, -1))) {
    		if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	}

    	return {
    		c() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m(target, anchor) {
    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].m(target, anchor);
    			}

    			insert(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx, dirty);

    			if (current_block_type_index === previous_block_index) {
    				if (~current_block_type_index) {
    					if_blocks[current_block_type_index].p(ctx, dirty);
    				}
    			} else {
    				if (if_block) {
    					group_outros();

    					transition_out(if_blocks[previous_block_index], 1, 1, () => {
    						if_blocks[previous_block_index] = null;
    					});

    					check_outros();
    				}

    				if (~current_block_type_index) {
    					if_block = if_blocks[current_block_type_index];

    					if (!if_block) {
    						if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    						if_block.c();
    					} else {
    						if_block.p(ctx, dirty);
    					}

    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				} else {
    					if_block = null;
    				}
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d(detaching) {
    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].d(detaching);
    			}

    			if (detaching) detach(if_block_anchor);
    		}
    	};
    }

    function shorten(str) {
    	if (typeof str !== 'string') {
    		str = String(str);
    	}

    	const maxLen = 11;
    	if (str.length > maxLen) return str.substring(0, maxLen - 3) + '...';
    	return str;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let unsub;
    	let { value } = $$props;
    	let { name = "Object" } = $$props;
    	let { expanded = false } = $$props;
    	const click_handler = () => $$invalidate(1, expanded = !expanded);

    	function objectviewer_value_binding(value$1, val, each_value, val_index) {
    		each_value[val_index] = value$1;
    		($$invalidate(0, value), $$invalidate(3, unsub));
    	}

    	function edit_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function done_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	const func = e => shorten(e[0]) + ':' + shorten(e[1]);
    	const click_handler_1 = () => $$invalidate(1, expanded = !expanded);

    	$$self.$$set = $$props => {
    		if ('value' in $$props) $$invalidate(0, value = $$props.value);
    		if ('name' in $$props) $$invalidate(2, name = $$props.name);
    		if ('expanded' in $$props) $$invalidate(1, expanded = $$props.expanded);
    	};

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*value, unsub*/ 9) {
    			if (typeof value == 'object' && 'subscribe' in value) {
    				if (unsub) unsub();

    				$$invalidate(3, unsub = value.subscribe(v => {
    					$$invalidate(0, value = v);
    				}));
    			}
    		}
    	};

    	return [
    		value,
    		expanded,
    		name,
    		unsub,
    		click_handler,
    		objectviewer_value_binding,
    		edit_handler,
    		done_handler,
    		func,
    		click_handler_1
    	];
    }

    class ObjectViewer extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { value: 0, name: 2, expanded: 1 });
    	}
    }

    /* SvelteComponents\Console.svelte generated by Svelte v3.55.0 */

    function create_fragment$2(ctx) {
    	let textarea_1;

    	return {
    		c() {
    			textarea_1 = element("textarea");
    			textarea_1.readOnly = true;
    			textarea_1.value = /*text*/ ctx[0];
    			attr(textarea_1, "class", "svelte-2el1nj");
    		},
    		m(target, anchor) {
    			insert(target, textarea_1, anchor);
    			/*textarea_1_binding*/ ctx[2](textarea_1);
    		},
    		p(ctx, [dirty]) {
    			if (dirty & /*text*/ 1) {
    				textarea_1.value = /*text*/ ctx[0];
    			}
    		},
    		i: noop$1,
    		o: noop$1,
    		d(detaching) {
    			if (detaching) detach(textarea_1);
    			/*textarea_1_binding*/ ctx[2](null);
    		}
    	};
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { text } = $$props;
    	let textarea;

    	function textarea_1_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			textarea = $$value;
    			($$invalidate(1, textarea), $$invalidate(0, text));
    		});
    	}

    	$$self.$$set = $$props => {
    		if ('text' in $$props) $$invalidate(0, text = $$props.text);
    	};

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*text, textarea*/ 3) {
    			if (text && textarea) {
    				$$invalidate(1, textarea.scrollTop = textarea.scrollHeight, textarea);
    			}
    		}
    	};

    	return [text, textarea, textarea_1_binding];
    }

    class Console extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { text: 0 });
    	}
    }

    /* screens\Raw.svelte generated by Svelte v3.55.0 */

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[4] = list[i][0];
    	child_ctx[5] = list[i][1];
    	return child_ctx;
    }

    // (22:4) {#each data_sources as [k, v]}
    function create_each_block$1(ctx) {
    	let objectviewer;
    	let current;

    	objectviewer = new ObjectViewer({
    			props: { name: /*k*/ ctx[4], value: /*v*/ ctx[5] }
    		});

    	return {
    		c() {
    			create_component(objectviewer.$$.fragment);
    		},
    		m(target, anchor) {
    			mount_component(objectviewer, target, anchor);
    			current = true;
    		},
    		p: noop$1,
    		i(local) {
    			if (current) return;
    			transition_in(objectviewer.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(objectviewer.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			destroy_component(objectviewer, detaching);
    		}
    	};
    }

    function create_fragment$1(ctx) {
    	let div;
    	let h10;
    	let t1;
    	let t2;
    	let h11;
    	let t4;
    	let console;
    	let current;
    	let each_value = /*data_sources*/ ctx[1];
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	console = new Console({
    			props: { text: /*console_string*/ ctx[0] }
    		});

    	return {
    		c() {
    			div = element("div");
    			h10 = element("h1");
    			h10.textContent = "Raw Data";
    			t1 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t2 = space();
    			h11 = element("h1");
    			h11.textContent = "Log";
    			t4 = space();
    			create_component(console.$$.fragment);
    			set_style(div, "padding", "2vw");
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);
    			append(div, h10);
    			append(div, t1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			append(div, t2);
    			append(div, h11);
    			append(div, t4);
    			mount_component(console, div, null);
    			current = true;
    		},
    		p(ctx, [dirty]) {
    			if (dirty & /*data_sources*/ 2) {
    				each_value = /*data_sources*/ ctx[1];
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
    						each_blocks[i].m(div, t2);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}

    			const console_changes = {};
    			if (dirty & /*console_string*/ 1) console_changes.text = /*console_string*/ ctx[0];
    			console.$set(console_changes);
    		},
    		i(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			transition_in(console.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			transition_out(console.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(div);
    			destroy_each(each_blocks, detaching);
    			destroy_component(console);
    		}
    	};
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let $deviceStatusData;
    	component_subscribe($$self, deviceStatusData, $$value => $$invalidate(2, $deviceStatusData = $$value));
    	let data_sources = Object.entries(datas).filter(([k, v]) => typeof v === 'object' && 'subscribe' in v);

    	// If we notice deviceStatusData.status change, then we will add that to the console string
    	let console_string = "";

    	const options = [
    		"Waiting for plug",
    		"Plugged in, not charging",
    		"Charging paused, balancing cells",
    		"Charging!",
    		"Waiting For Charger"
    	];

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$deviceStatusData, console_string*/ 5) {
    			if (typeof $deviceStatusData.state === "number") {
    				$$invalidate(0, console_string += options[$deviceStatusData.state] + "\n");
    			}
    		}
    	};

    	return [console_string, data_sources, $deviceStatusData];
    }

    class Raw extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});
    	}
    }

    /* App.svelte generated by Svelte v3.55.0 */

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[5] = list[i];
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[8] = list[i];
    	return child_ctx;
    }

    // (98:0) {#if scrolling}
    function create_if_block(ctx) {
    	let div;
    	let h5;
    	let t1;
    	let div_transition;
    	let current;
    	let each_value_1 = /*screens*/ ctx[2];
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	return {
    		c() {
    			div = element("div");
    			h5 = element("h5");
    			h5.textContent = "screens";
    			t1 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr(h5, "class", "svelte-1sywr4u");
    			attr(div, "class", "scrollMenu svelte-1sywr4u");
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);
    			append(div, h5);
    			append(div, t1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			current = true;
    		},
    		p(ctx, dirty) {
    			if (dirty & /*screens, selectedPage*/ 6) {
    				each_value_1 = /*screens*/ ctx[2];
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_1.length;
    			}
    		},
    		i(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!div_transition) div_transition = create_bidirectional_transition(div, fly, { x: 200 }, true);
    				div_transition.run(1);
    			});

    			current = true;
    		},
    		o(local) {
    			if (!div_transition) div_transition = create_bidirectional_transition(div, fly, { x: 200 }, false);
    			div_transition.run(0);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(div);
    			destroy_each(each_blocks, detaching);
    			if (detaching && div_transition) div_transition.end();
    		}
    	};
    }

    // (101:8) {#each screens as s}
    function create_each_block_1(ctx) {
    	let h2;
    	let a;
    	let t0_value = /*s*/ ctx[8].name + "";
    	let t0;
    	let t1;

    	return {
    		c() {
    			h2 = element("h2");
    			a = element("a");
    			t0 = text(t0_value);
    			t1 = space();
    			attr(a, "href", "#" + /*s*/ ctx[8].name);

    			set_style(a, "color", /*s*/ ctx[8] === /*selectedPage*/ ctx[1]
    			? 'var(--font-color)'
    			: 'var(--font-muted-color)');

    			set_style(a, "transition", "color 0.5s");
    			set_style(a, "text-decoration", "none");
    			attr(h2, "class", "svelte-1sywr4u");
    		},
    		m(target, anchor) {
    			insert(target, h2, anchor);
    			append(h2, a);
    			append(a, t0);
    			append(h2, t1);
    		},
    		p(ctx, dirty) {
    			if (dirty & /*selectedPage*/ 2) {
    				set_style(a, "color", /*s*/ ctx[8] === /*selectedPage*/ ctx[1]
    				? 'var(--font-color)'
    				: 'var(--font-muted-color)');
    			}
    		},
    		d(detaching) {
    			if (detaching) detach(h2);
    		}
    	};
    }

    // (113:4) {#each screens as screen}
    function create_each_block(ctx) {
    	let div;
    	let switch_instance;
    	let t;
    	let current;
    	var switch_value = /*screen*/ ctx[5];

    	function switch_props(ctx) {
    		return {};
    	}

    	if (switch_value) {
    		switch_instance = construct_svelte_component(switch_value, switch_props());
    	}

    	return {
    		c() {
    			div = element("div");
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			t = space();
    			set_style(div, "height", "100vh");
    			set_style(div, "width", "100vw");
    			set_style(div, "scroll-snap-align", "start");
    			set_style(div, "position", "relative");
    			attr(div, "id", /*screen*/ ctx[5].name);
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);
    			if (switch_instance) mount_component(switch_instance, div, null);
    			append(div, t);
    			current = true;
    		},
    		p(ctx, dirty) {
    			if (switch_value !== (switch_value = /*screen*/ ctx[5])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = construct_svelte_component(switch_value, switch_props());
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, div, t);
    				} else {
    					switch_instance = null;
    				}
    			}
    		},
    		i(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(div);
    			if (switch_instance) destroy_component(switch_instance);
    		}
    	};
    }

    function create_fragment(ctx) {
    	let t0;
    	let div0;
    	let stickyinfo;
    	let t1;
    	let div1;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block = /*scrolling*/ ctx[0] && create_if_block(ctx);
    	stickyinfo = new StickyInfo({});
    	let each_value = /*screens*/ ctx[2];
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	return {
    		c() {
    			if (if_block) if_block.c();
    			t0 = space();
    			div0 = element("div");
    			create_component(stickyinfo.$$.fragment);
    			t1 = space();
    			div1 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			set_style(div0, "position", "fixed");
    			set_style(div0, "top", "0");
    			set_style(div0, "left", "50%");
    			set_style(div0, "transform", "translate(-50%, 0)");
    			set_style(div0, "z-index", "5");
    			attr(div1, "class", "window svelte-1sywr4u");
    		},
    		m(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert(target, t0, anchor);
    			insert(target, div0, anchor);
    			mount_component(stickyinfo, div0, null);
    			insert(target, t1, anchor);
    			insert(target, div1, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div1, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = listen(div1, "scroll", /*scroll*/ ctx[3]);
    				mounted = true;
    			}
    		},
    		p(ctx, [dirty]) {
    			if (/*scrolling*/ ctx[0]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*scrolling*/ 1) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(t0.parentNode, t0);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}

    			if (dirty & /*screens*/ 4) {
    				each_value = /*screens*/ ctx[2];
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div1, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(if_block);
    			transition_in(stickyinfo.$$.fragment, local);

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o(local) {
    			transition_out(if_block);
    			transition_out(stickyinfo.$$.fragment, local);
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach(t0);
    			if (detaching) detach(div0);
    			destroy_component(stickyinfo);
    			if (detaching) detach(t1);
    			if (detaching) detach(div1);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			dispose();
    		}
    	};
    }

    function instance($$self, $$props, $$invalidate) {
    	try {
    		console.log(`This app is using Chrome (v${window.versions.chrome()}), Node.js (v${window.versions.node()}), and Electron (v${window.versions.electron()})`);
    	} catch(e) {
    		console.log("This app is running with just svelte");
    	}

    	window.communications.on("data", (event, d) => {
    		// console.log("Received data from main process", d);
    		updateDatas(d);
    	});

    	const screens = [Power, Battery, Accessories, Raw];

    	// const screens = [Power];
    	// Every time the user scrolls, the function will be called.
    	// The variable scrolling should be true if we scrolled in the last second.
    	let scrolling = false;

    	let scrollTimeout = null;
    	let selectedPage = screens[0];

    	function scroll(e) {
    		$$invalidate(0, scrolling = true);
    		if (scrollTimeout) clearTimeout(scrollTimeout);
    		scrollTimeout = setTimeout(() => $$invalidate(0, scrolling = false), 650);
    		$$invalidate(1, selectedPage = screens[Math.round(e.target.scrollTop / (e.target.scrollHeight / screens.length))]);
    	}

    	onMount(() => {
    		window.communications.send("ready");
    	});

    	return [scrolling, selectedPage, screens, scroll];
    }

    class App extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance, create_fragment, safe_not_equal, {});
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    	}
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
