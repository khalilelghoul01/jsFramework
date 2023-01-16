import { CoreElement } from "./core/framework";

const test = new CoreElement().registerComponent((state, props) => {
  const [name, setName] = state.useState("name", props.name);

  state.addCallback({
    callback: (state, e) => {
      const InputEvent = e as InputEvent;
      setName((oldvalue) => (InputEvent.target as HTMLInputElement).value);
    },
    id: "name",
  });

  return /*html*/ `
      <div>
        <input type="text" value="${name}" oninputevent="name" />
      </div>
    `;
});

const element = new CoreElement().registerComponent((state, props) => {
  const [counter, setCounter] = state.useState("counter", 0);
  state.addCallback({
    callback: (state) => {
      setCounter((oldvalue) => oldvalue + 1);
    },
    id: "Add",
  });

  state.addCallback({
    callback: (state) => {
      setCounter((oldvalue) => oldvalue - 1);
    },
    id: "Sub",
  });

  state.registerComponent({
    component: test,
    id: "test",
    props: {
      name: props.name,
    },
  });

  return /*html*/ `
      <div>
        <button onclickevent="Add" >add</button>
        <h1>${counter}<span>
          ${props.name}
        </span></h1>
        <slot ref="test"></slot>
        <button onclickevent="Sub" >sub</button>
      </div>
    `;
});

const element2 = new CoreElement().registerComponent((state, props) => {
  const [test, setTest] = state.useState("TEST", 0);
  state.registerComponent({
    component: element,
    id: "Compon",
    props: {
      name: props.name,
    },
  });
  state.addCallback({
    callback: (state) => {
      setTest((oldvalue) => oldvalue + 1);
    },
    id: "TEST",
  });
  return /*html*/ `
      <div>
        <h1 onclickevent="TEST" >Hello ${state.state.TEST}</h1>
        <slot ref="Compon"></slot>
      </div>
    `;
});
element2.render({ name: "Lord" }).toString();
element2.attachTo({ element: document.body });
