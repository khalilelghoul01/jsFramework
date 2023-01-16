"use strict";
exports.__esModule = true;
var framework_1 = require("./core/framework");
var test = new framework_1.CoreElement().registerComponent(function (state, props) {
    var _a = state.useState("name", props.name), name = _a[0], setName = _a[1];
    state.addCallback({
        callback: function (state, e) {
            var InputEvent = e;
            setName(function (oldvalue) { return InputEvent.target.value; });
        },
        id: "name"
    });
    return "\n      <div>\n        <input type=\"text\" value=\"".concat(name, "\" oninputevent=\"name\" />\n      </div>\n    ");
});
var element = new framework_1.CoreElement().registerComponent(function (state, props) {
    var _a = state.useState("counter", 0), counter = _a[0], setCounter = _a[1];
    state.addCallback({
        callback: function (state) {
            setCounter(function (oldvalue) { return oldvalue + 1; });
        },
        id: "Add"
    });
    state.addCallback({
        callback: function (state) {
            setCounter(function (oldvalue) { return oldvalue - 1; });
        },
        id: "Sub"
    });
    state.registerComponent({
        component: test,
        id: "test",
        props: {
            name: props.name
        }
    });
    return "\n      <div>\n        <button onclickevent=\"Add\" >add</button>\n        <h1>".concat(counter, "<span>\n          ").concat(props.name, "\n        </span></h1>\n        <slot ref=\"test\"></slot>\n        <button onclickevent=\"Sub\" >sub</button>\n      </div>\n    ");
});
var element2 = new framework_1.CoreElement().registerComponent(function (state, props) {
    var _a = state.useState("TEST", 0), test = _a[0], setTest = _a[1];
    state.registerComponent({
        component: element,
        id: "Compon",
        props: {
            name: props.name
        }
    });
    state.addCallback({
        callback: function (state) {
            setTest(function (oldvalue) { return oldvalue + 1; });
        },
        id: "TEST"
    });
    return "\n      <div>\n        <h1 onclickevent=\"TEST\" >Hello ".concat(state.state.TEST, "</h1>\n        <slot ref=\"Compon\"></slot>\n      </div>\n    ");
});
element2.render({ name: "Lord" }).toString();
element2.attachTo({ element: document.body });
//# sourceMappingURL=index.js.map