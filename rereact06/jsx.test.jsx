import { describe, it, expect, vi } from 'vitest'
import AReact from './AReact.jsx'
const act = AReact.act

function sleep(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  })
}

describe('ReReact JSX', () => {
  it('should render JSX', async () => {
    const container = document.createElement('div');
    const element = (
      <div id="foo">
        <div id="bar"></div>
        <button></button>
      </div>
    );
    console.log(element);
    const root = AReact.createRoot(container);
    await act(() => {
      root.render(element);
    });
    expect(container.innerHTML).toBe('<div id="foo"><div id="bar"></div><button></button></div>')
  })

  it('should render JSX with text', async () => {
    const container = document.createElement('div');
    const element = (
      <div id="foo">
        <div id="bar">Hello</div>
        <button>Add</button>
      </div>
    );
    console.log(JSON.stringify(element));
    const root = AReact.createRoot(container);
    await act(() => {
      root.render(element);
    })
    expect(container.innerHTML).toBe('<div id="foo"><div id="bar">Hello</div><button>Add</button></div>')
  })

  it('should render JSX with different props', async () => {
    const container = document.createElement('div');
    const element = (
      <div id="foo" className="bar">
        <button></button>
      </div>
    );
    console.log(element);
    const root = AReact.createRoot(container);
    await act(() => {
      root.render(element);
    })
    expect(container.innerHTML).toBe('<div id="foo" class="bar"><button></button></div>')
  })
})

describe('ReReact Concurrent', () => {
  it('should render in async', async function () {
    const container = document.createElement('div');
    const element = (
      <div id="foo">
        <div id="bar"></div>
        <button></button>
      </div>
    );
    console.log(element);
    const root = AReact.createRoot(container);
    await act(() => {
      root.render(element);
      expect(container.innerHTML).toBe('')
    })
    expect(container.innerHTML).toBe('<div id="foo"><div id="bar"></div><button></button></div>')
  })
})

describe('Function Component', () => {
  it('should render Function Component', async function () {
    const container = document.createElement('div');
    function App() {
      return (
        <div id="foo">
          <div id="bar"></div>
          <button></button>
        </div>
      );
    }
    const root = AReact.createRoot(container);
    await act(() => {
      root.render(<App />);
      expect(container.innerHTML).toBe('')
    })
    expect(container.innerHTML).toBe('<div id="foo"><div id="bar"></div><button></button></div>')
  })

  it('should render nested Function Component', async function () {
    const container = document.createElement('div');
    function App(props) {
      return (
        <div id="foo">
          <div id="bar">{props.title}</div>
          <button></button>
          {props.children}
        </div>
      );
    }
    const root = AReact.createRoot(container);
    await act(() => {
      root.render(
        <App title='main title'>
          <App title='sub title'/>
        </App>
      );
      expect(container.innerHTML).toBe('')
    })
    expect(container.innerHTML).toBe('<div id="foo"><div id="bar">main title</div><button></button><div id="foo"><div id="bar">sub title</div><button></button></div></div>')
  })
})

describe('Hooks', () => {
  it('should support useState', async function () {
    const container = document.createElement('div');
    const globalObject = {};

    function App() {
      const [count, setCount] = AReact.useState(100);
      globalObject.count = count;
      globalObject.setCount = setCount;

      return (<div>{count}</div>)
    }

    const root = AReact.createRoot(container);
    await act(() => {
      root.render(<App/>);
    });

    await act(() => {
      globalObject.setCount((count) => count + 1);
    });

    expect(globalObject.count).toBe(101)
  })

  it('should support useState pass value', async function () {
    const container = document.createElement('div');
    const globalObject = {};

    function App() {
      const [count, setCount] = AReact.useState(100);
      globalObject.count = count;
      globalObject.setCount = setCount;

      return (<div>{count}</div>)
    }

    const root = AReact.createRoot(container);
    await act(() => {
      root.render(<App/>);
    });

    await act(() => {
      globalObject.setCount(102);
    });

    expect(globalObject.count).toBe(102)
  })

  it('should support useReducer', async function () {
    const container = document.createElement('div');
    const globalObject = {};

    function reducer(state, action) {
      switch (action.type) {
        case 'add': return state + 1;
        case 'sub': return state - 1;
      }
    }

    function App() {
      const [count, dispatch] = AReact.useReducer(reducer, 100);
      globalObject.count = count;
      globalObject.dispatch = dispatch;

      return (<div>{count}</div>)
    }

    const root = AReact.createRoot(container);
    await act(() => {
      root.render(<App/>);
    });

    await act(() => {
      globalObject.dispatch({ type: 'add' });
      globalObject.dispatch({ type: 'add' });
    });

    expect(globalObject.count).toBe(102)
  })
})

describe('Event binding', () => {
  it('should support event binding', async function () {
    const container = document.createElement('div');
    const globalObject = {
      increase: (count) => count + 1,
    };

    const increaseSpy = vi.spyOn(globalObject, 'increase');

    function App() {
      const [count, setCount] = AReact.useState(100);
      return (
        <div>
          {count}
          <button onClick={() => setCount(globalObject.increase)}></button>
        </div>
      );
    }

    const root = AReact.createRoot(container);
    await act(() => {
      root.render(<App/>);
    });

    expect(increaseSpy).not.toBeCalled();
    await act(() => {
      container.querySelectorAll('button')[0].click();
      container.querySelectorAll('button')[0].click();
    });

    expect(increaseSpy).toBeCalledTimes(2);
  })
})
