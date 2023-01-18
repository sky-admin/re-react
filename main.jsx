import AReact from './rereact06/AReact.jsx'

// let oldSetCount;

function App() {
  const [count, setCount] = AReact.useState(2);

  // console.log(Object.is(oldSetCount, setCount));
  // oldSetCount = setCount;

  return (
    <div>
      {count}
      <button onClick={() => setCount((count) => count + 1)}>+</button>
      <button onClick={() => setCount((count) => count - 1)}>-</button>
      <ul>
        {Array(count)
          .fill(1)
          .map((val, index) => (
            <li>{index}</li>
          ))}
      </ul>
    </div>
  );
}

const appDom = document.querySelector('#app')
const root = AReact.createRoot(appDom);
root.render(<App />);
