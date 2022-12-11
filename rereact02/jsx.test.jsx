import { describe, it, expect } from 'vitest'
import AReact from './AReact.jsx'

describe('ReReact JSX', () => {
  it('should render JSX', () => {
    const container = document.createElement('div');
    const element = (
      <div id="foo">
        <div id="bar"></div>
        <button></button>
      </div>
    );
    console.log(element);
    const root = AReact.createRoot(container);
    root.render(element);
    expect(container.innerHTML).toBe('<div id="foo"><div id="bar"></div><button></button></div>')
  })

  it('should render JSX with text', () => {
    const container = document.createElement('div');
    const element = (
      <div id="foo">
        <div id="bar">Hello</div>
        <button>Add</button>
      </div>
    );
    console.log(JSON.stringify(element));
    const root = AReact.createRoot(container);
    root.render(element);
    expect(container.innerHTML).toBe('<div id="foo"><div id="bar">Hello</div><button>Add</button></div>')
  })

  it('should render JSX with different props', () => {
    const container = document.createElement('div');
    const element = (
      <div id="foo" className="bar">
        <button></button>
      </div>
    );
    console.log(element);
    const root = AReact.createRoot(container);
    root.render(element);
    expect(container.innerHTML).toBe('<div id="foo" class="bar"><button></button></div>')
  })
})
