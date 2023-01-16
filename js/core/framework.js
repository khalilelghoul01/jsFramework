"use strict";
exports.__esModule = true;
exports.CoreElement = void 0;
var ComponentState = (function () {
    function ComponentState() {
        this.callbacks = [];
        this.components = [];
        this.state = {};
    }
    ComponentState.prototype.useState = function (key, value) {
        var _this = this;
        if (!this.state[key]) {
            this.state[key] = value;
        }
        return [
            this.state[key],
            function (value) {
                if (typeof value === "function") {
                    _this.state[key] = value(_this.state[key]);
                }
                else {
                    _this.state[key] = value;
                }
            },
        ];
    };
    ComponentState.prototype.registerComponent = function (_a) {
        var _b;
        var component = _a.component, id = _a.id, props = _a.props;
        this.components.push((_b = {}, _b[id] = { component: component, props: props }, _b));
    };
    ComponentState.prototype.getComponent = function (_a) {
        var id = _a.id;
        var component = this.components.find(function (c) { return c[id]; });
        if (!component)
            return;
        return component[id];
    };
    ComponentState.prototype.renderComponent = function (_a) {
        var id = _a.id;
        var component = this.getComponent({ id: id });
        if (!component)
            return;
        return component.component.render(component.props);
    };
    ComponentState.prototype.getState = function () {
        return this.state;
    };
    ComponentState.prototype.getStateValue = function (_a) {
        var key = _a.key;
        return this.state[key];
    };
    ComponentState.prototype.addCallback = function (_a) {
        var callback = _a.callback, id = _a.id;
        if (this.callbacks.find(function (c) { return c.id === id; }))
            return;
        this.callbacks.push({ callback: callback, id: id });
    };
    ComponentState.prototype.removeCallback = function (_a) {
        var id = _a.id;
        this.callbacks = this.callbacks.filter(function (c) { return c.id !== id; });
    };
    ComponentState.prototype.triggerCallback = function (_a) {
        var id = _a.id, e = _a.e;
        var callback = this.callbacks.find(function (c) { return c.id === id; });
        if (!callback)
            return;
        callback.callback(this, e);
    };
    return ComponentState;
}());
var CoreElement = (function () {
    function CoreElement() {
        this.state = new ComponentState();
        this.parent = null;
        this.events = {};
        this.attributes = {
            classes: [],
            style: {}
        };
        this.html = "";
        this.element = document.createElement("div");
        this.elements = [];
        this.component = function () {
            return "";
        };
        this.props = {};
        this.elementsEvents = {};
        this.enventList = [
            {
                event: "click",
                attribute: "onclickevent"
            },
            {
                event: "change",
                attribute: "onchangeevent"
            },
            {
                event: "input",
                attribute: "oninputevent"
            },
            {
                event: "submit",
                attribute: "onsubmitevent"
            },
            {
                event: "keydown",
                attribute: "onkeydownevent"
            },
            {
                event: "keyup",
                attribute: "onkeyupevent"
            },
            {
                event: "keypress",
                attribute: "onkeypressevent"
            },
            {
                event: "focus",
                attribute: "onfocusevent"
            },
        ];
    }
    CoreElement.prototype.create = function (_a) {
        var html = _a.html;
        this.html = html.trim();
        for (var key in this.state.state) {
            this.html = this.html.replace("{{".concat(key, "}}"), this.state[key]);
        }
        for (var key in this.props) {
            this.html = this.html.replace("{{".concat(key, "}}"), this.props[key]);
        }
        var div = document.createElement("div");
        div.innerHTML = this.html;
        var element = div.firstElementChild;
        this.element.replaceWith(element);
        this.element = element;
        return this;
    };
    CoreElement.prototype.getEventAttributes = function () {
        var _this = this;
        this.enventList.forEach(function (event) {
            _this.element
                .querySelectorAll("[".concat(event.attribute, "]"))
                .forEach(function (element) {
                _this.elementsEvents[element.getAttribute(event.attribute)] = {
                    event: event.event,
                    element: element
                };
                element.addEventListener(event.event, function (e) {
                    _this.state.triggerCallback({
                        id: element.getAttribute(event.attribute),
                        e: e
                    });
                    _this.render(_this.props);
                });
            });
        });
    };
    CoreElement.prototype.removeEventAttributes = function () {
        for (var key in this.elementsEvents) {
            this.elementsEvents[key].element.removeEventListener(this.elementsEvents[key].event, function () { });
        }
    };
    CoreElement.prototype.getSlots = function () {
        var _this = this;
        this.element.querySelectorAll("slot").forEach(function (slot) {
            var ref = slot.getAttribute("ref");
            if (!ref)
                return;
            var element = _this.state.getComponent({ id: ref });
            if (!element)
                return;
            element.component.render(element.props);
            slot.replaceWith(element.component.element);
        });
    };
    CoreElement.prototype.addEvent = function (_a) {
        var event = _a.event, callback = _a.callback;
        this.events[event] = callback;
        return this;
    };
    CoreElement.prototype.removeEvent = function (_a) {
        var event = _a.event;
        delete this.events[event];
        return this;
    };
    CoreElement.prototype.loadEvents = function () {
        var _this = this;
        var _loop_1 = function (event_1) {
            this_1.element.addEventListener(event_1, function (e) {
                _this.events[event_1](_this.state, e);
            });
        };
        var this_1 = this;
        for (var event_1 in this.events) {
            _loop_1(event_1);
        }
        return this;
    };
    CoreElement.prototype.addAttribute = function (_a) {
        var attribute = _a.attribute, value = _a.value;
        this.attributes[attribute] = value;
        return this;
    };
    CoreElement.prototype.removeAttribute = function (_a) {
        var attribute = _a.attribute;
        delete this.attributes[attribute];
        return this;
    };
    CoreElement.prototype.loadAttributes = function () {
        var _a;
        for (var attribute in this.attributes) {
            if (attribute === "classes") {
                if (this.element.classList.length > 0)
                    (_a = this.element.classList).add.apply(_a, this.attributes.classes);
            }
            else if (attribute === "style") {
                for (var style in this.attributes.style) {
                    this.element.style[style] = this.attributes.style[style];
                }
            }
            else {
                if (this.attributes[attribute] === undefined)
                    continue;
                this.element.setAttribute(attribute, this.attributes[attribute]);
            }
        }
        return this;
    };
    CoreElement.prototype.addClass = function (_a) {
        var className = _a.className;
        this.attributes.classes.push(className);
        return this;
    };
    CoreElement.prototype.removeClass = function (_a) {
        var className = _a.className;
        this.attributes.classes = this.attributes.classes.filter(function (c) { return c !== className; });
        return this;
    };
    CoreElement.prototype.addStyle = function (_a) {
        var style = _a.style, value = _a.value;
        this.attributes.style[style] = value;
        return this;
    };
    CoreElement.prototype.removeStyle = function (_a) {
        var style = _a.style;
        delete this.attributes.style[style];
        return this;
    };
    CoreElement.prototype.addElement = function (_a) {
        var element = _a.element;
        this.elements.push(element);
        return this;
    };
    CoreElement.prototype.removeElement = function (_a) {
        var element = _a.element;
        this.elements = this.elements.filter(function (e) { return e !== element; });
        return this;
    };
    CoreElement.prototype.loadElements = function () {
        for (var _i = 0, _a = this.elements; _i < _a.length; _i++) {
            var element = _a[_i];
            this.element.appendChild(element.element);
        }
        return this;
    };
    CoreElement.prototype.onClick = function (_a) {
        var callback = _a.callback;
        this.addEvent({ event: "click", callback: callback });
        return this;
    };
    CoreElement.prototype.onHover = function (_a) {
        var callback = _a.callback;
        this.addEvent({ event: "hover", callback: callback });
        return this;
    };
    CoreElement.prototype.onInput = function (_a) {
        var callback = _a.callback;
        this.addEvent({ event: "input", callback: callback });
        return this;
    };
    CoreElement.prototype.onKeydown = function (_a) {
        var callback = _a.callback;
        this.addEvent({ event: "keydown", callback: callback });
        return this;
    };
    CoreElement.prototype.onKeyup = function (_a) {
        var callback = _a.callback;
        this.addEvent({ event: "keyup", callback: callback });
        return this;
    };
    CoreElement.prototype.onKeypress = function (_a) {
        var callback = _a.callback;
        this.addEvent({ event: "keypress", callback: callback });
        return this;
    };
    CoreElement.prototype.onScroll = function (_a) {
        var callback = _a.callback;
        this.addEvent({ event: "scroll", callback: callback });
        return this;
    };
    CoreElement.prototype.onResize = function (_a) {
        var callback = _a.callback;
        this.addEvent({ event: "resize", callback: callback });
        return this;
    };
    CoreElement.prototype.attachTo = function (_a) {
        var element = _a.element;
        this.parent = element;
        element.appendChild(this.element);
        return this;
    };
    CoreElement.prototype.attachAndReplace = function (_a) {
        var element = _a.element;
        this.parent = element;
        element.replaceWith(this.element);
        return this;
    };
    CoreElement.prototype.render = function (props) {
        if (props === void 0) { props = {}; }
        this.removeEventAttributes();
        this.props = props;
        if (this.component) {
            this.html = this.component(this.state, this.props);
            this.create({ html: this.html });
        }
        else {
            this.create({ html: this.html });
        }
        this.getEventAttributes();
        this.getSlots();
        this.loadAttributes();
        this.loadEvents();
        this.loadElements();
        return this;
    };
    CoreElement.generate = function (component) {
        return new CoreElement().create({ html: component() });
    };
    CoreElement.prototype.registerComponent = function (component) {
        this.component = component;
        return this;
    };
    CoreElement.prototype.toString = function () {
        return this.element;
    };
    return CoreElement;
}());
exports.CoreElement = CoreElement;
//# sourceMappingURL=framework.js.map