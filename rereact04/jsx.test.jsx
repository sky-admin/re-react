import { describe, it, expect } from 'vitest'
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
})
