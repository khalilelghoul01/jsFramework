import { html } from "cheerio/lib/api/manipulation";

interface State {
  [key: string]: any;
}

interface Events {
  [key: string]: callback;
}

interface Attributes {
  classes: string[];
  style: {
    [key: string]: string;
  };
  [key: string]: any;
}

type callback = (state: State, e: Event) => void | string;

class ComponentState {
  state: State;
  callbacks = [];
  components: {
    [key: string]: {
      component: CoreElement;
      props: {
        [key: string]: any;
      };
    };
  }[] = [];

  constructor() {
    this.state = {};
  }

  useState(key, value) {
    if (!this.state[key]) {
      this.state[key] = value;
    }
    return [
      this.state[key],
      (value) => {
        if (typeof value === "function") {
          this.state[key] = value(this.state[key]);
        } else {
          this.state[key] = value;
        }
      },
    ];
  }

  registerComponent({
    component,
    id,
    props,
  }: {
    component: CoreElement;
    id: string;
    props: { [key: string]: any };
  }) {
    this.components.push({ [id]: { component, props } });
  }

  getComponent({ id }: { id: string }) {
    const component = this.components.find((c) => c[id]);
    if (!component) return;
    return component[id];
  }

  renderComponent({ id }: { id: string }) {
    const component = this.getComponent({ id });
    if (!component) return;
    return component.component.render(component.props);
  }

  getState() {
    return this.state;
  }

  getStateValue({ key }: { key: string }) {
    return this.state[key];
  }

  addCallback({ callback, id }: { callback: callback; id: string }) {
    // check if callback already exists
    if (this.callbacks.find((c) => c.id === id)) return;
    this.callbacks.push({ callback, id });
  }

  removeCallback({ id }: { id: string }) {
    this.callbacks = this.callbacks.filter((c) => c.id !== id);
  }

  triggerCallback({ id, e }: { id: string; e: Event }) {
    const callback = this.callbacks.find((c) => c.id === id);
    if (!callback) return;
    callback.callback(this, e);
  }
}

export class CoreElement {
  state: ComponentState;
  events: Events;
  attributes: Attributes;
  element: HTMLElement;
  html: string;
  elements: CoreElement[];
  elementsEvents: {
    [key: string]: {
      event: string;
      element: HTMLElement;
    };
  };
  parent: HTMLElement;
  component: (
    state: State,
    props: {
      [key: string]: any;
    }
  ) => string;
  props: {
    [key: string]: any;
  };
  enventList: {
    event: string;
    attribute: string;
  }[];

  constructor() {
    this.state = new ComponentState();
    this.parent = null;
    this.events = {};
    this.attributes = {
      classes: [],
      style: {},
    };
    this.html = "";
    this.element = document.createElement("div");
    this.elements = [];
    this.component = () => {
      return "";
    };
    this.props = {};
    this.elementsEvents = {};
    this.enventList = [
      {
        event: "click",
        attribute: "onclickevent",
      },
      {
        event: "change",
        attribute: "onchangeevent",
      },
      {
        event: "input",
        attribute: "oninputevent",
      },
      {
        event: "submit",
        attribute: "onsubmitevent",
      },
      {
        event: "keydown",
        attribute: "onkeydownevent",
      },

      {
        event: "keyup",
        attribute: "onkeyupevent",
      },
      {
        event: "keypress",
        attribute: "onkeypressevent",
      },
      {
        event: "focus",
        attribute: "onfocusevent",
      },
    ];
  }

  create({ html }: { html: string }) {
    this.html = html.trim();
    for (const key in this.state.state) {
      this.html = this.html.replace(`{{${key}}}`, this.state[key]);
    }
    for (const key in this.props) {
      this.html = this.html.replace(`{{${key}}}`, this.props[key]);
    }
    const div = document.createElement("div");
    div.innerHTML = this.html;
    const element = div.firstElementChild as HTMLElement;
    this.element.replaceWith(element);
    this.element = element;

    return this;
  }

  getEventAttributes() {
    // this.element.querySelectorAll("[onclickevent]").forEach((element) => {
    //   this.elementsEvents[element.getAttribute("onclickevent")] = {
    //     event: "click",
    //     element: element as HTMLElement,
    //   };

    //   element.addEventListener("click", () => {
    //     this.state.triggerCallback({
    //       id: element.getAttribute("onclickevent"),
    //     });
    //     this.render(this.props);
    //   });
    // });

    this.enventList.forEach((event) => {
      this.element
        .querySelectorAll(`[${event.attribute}]`)
        .forEach((element) => {
          this.elementsEvents[element.getAttribute(event.attribute)] = {
            event: event.event,
            element: element as HTMLElement,
          };

          element.addEventListener(event.event, (e) => {
            this.state.triggerCallback({
              id: element.getAttribute(event.attribute),
              e,
            });
            this.render(this.props);
          });
        });
    });
  }

  removeEventAttributes() {
    for (const key in this.elementsEvents) {
      this.elementsEvents[key].element.removeEventListener(
        this.elementsEvents[key].event,
        () => {}
      );
    }
  }

  getSlots() {
    this.element.querySelectorAll("slot").forEach((slot) => {
      const ref = slot.getAttribute("ref");
      if (!ref) return;
      const element = this.state.getComponent({ id: ref });
      if (!element) return;
      element.component.render(element.props);
      slot.replaceWith(element.component.element);
    });
  }

  addEvent({ event, callback }: { event: string; callback: callback }) {
    this.events[event] = callback;
    return this;
  }

  removeEvent({ event }: { event: string }) {
    delete this.events[event];
    return this;
  }

  loadEvents() {
    for (const event in this.events) {
      this.element.addEventListener(event, (e) => {
        this.events[event](this.state, e);
      });
    }
    return this;
  }

  addAttribute({ attribute, value }: { attribute: string; value: any }) {
    this.attributes[attribute] = value;
    return this;
  }

  removeAttribute({ attribute }: { attribute: string }) {
    delete this.attributes[attribute];
    return this;
  }

  loadAttributes() {
    for (const attribute in this.attributes) {
      if (attribute === "classes") {
        if (this.element.classList.length > 0)
          this.element.classList.add(...this.attributes.classes);
      } else if (attribute === "style") {
        for (const style in this.attributes.style) {
          this.element.style[style] = this.attributes.style[style];
        }
      } else {
        if (this.attributes[attribute] === undefined) continue;
        this.element.setAttribute(attribute, this.attributes[attribute]);
      }
    }
    return this;
  }

  addClass({ className }: { className: string }) {
    this.attributes.classes.push(className);
    return this;
  }

  removeClass({ className }: { className: string }) {
    this.attributes.classes = this.attributes.classes.filter(
      (c) => c !== className
    );
    return this;
  }

  addStyle({ style, value }: { style: string; value: string }) {
    this.attributes.style[style] = value;
    return this;
  }

  removeStyle({ style }: { style: string }) {
    delete this.attributes.style[style];
    return this;
  }

  addElement({ element }: { element: CoreElement }) {
    this.elements.push(element);
    return this;
  }

  removeElement({ element }: { element: CoreElement }) {
    this.elements = this.elements.filter((e) => e !== element);
    return this;
  }

  loadElements() {
    for (const element of this.elements) {
      this.element.appendChild(element.element);
    }
    return this;
  }

  onClick({ callback }: { callback: callback }) {
    this.addEvent({ event: "click", callback });
    return this;
  }

  onHover({ callback }: { callback: callback }) {
    this.addEvent({ event: "hover", callback });
    return this;
  }

  onInput({ callback }: { callback: callback }) {
    this.addEvent({ event: "input", callback });
    return this;
  }

  onKeydown({ callback }: { callback: callback }) {
    this.addEvent({ event: "keydown", callback });
    return this;
  }

  onKeyup({ callback }: { callback: callback }) {
    this.addEvent({ event: "keyup", callback });
    return this;
  }

  onKeypress({ callback }: { callback: callback }) {
    this.addEvent({ event: "keypress", callback });
    return this;
  }

  onScroll({ callback }: { callback: callback }) {
    this.addEvent({ event: "scroll", callback });
    return this;
  }

  onResize({ callback }: { callback: callback }) {
    this.addEvent({ event: "resize", callback });
    return this;
  }

  attachTo({ element }: { element: HTMLElement }) {
    this.parent = element;
    element.appendChild(this.element);
    return this;
  }

  attachAndReplace({ element }: { element: HTMLElement }) {
    this.parent = element;
    element.replaceWith(this.element);
    return this;
  }

  render(props: { [key: string]: any } = {}) {
    this.removeEventAttributes();
    this.props = props;
    if (this.component) {
      this.html = this.component(this.state, this.props);
      this.create({ html: this.html });
    } else {
      this.create({ html: this.html });
    }
    this.getEventAttributes();
    this.getSlots();
    this.loadAttributes();
    this.loadEvents();
    this.loadElements();
    return this;
  }

  static generate(component: () => string) {
    return new CoreElement().create({ html: component() });
  }

  registerComponent(
    component: (state: ComponentState, props: { [key: string]: any }) => string
  ) {
    this.component = component;
    return this;
  }

  toString() {
    return this.element;
  }
}
