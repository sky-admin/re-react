import '../requestIdleCallbackPolyfill.js';

function createElement(type, props, ...children) {
  return {
    type,
    props: {
      ...props,
      children: children.flat().map(child => {
        return typeof child !== 'object' ? createTextElement(child) : child;
      })
    }
  }
}

function createTextElement(text) {
  return {
    type: 'HostText',
    props: {
      nodeValue: text,
      children: [],
    }
  }
}

const isEvent = (key) => key.startsWith('on');
const isProperty = (key) => key !== 'children' && !isEvent(key);
const isGone = (prev, next) => (key) => !(key in next);
const isNew = (prev, next) => (key) => (key in next) && !(key in prev);
const isChanged = (prev, next) => (key) => key in prev && key in next && prev[key] !== next[key];

let workInProgress = null;
let workInProgressRoot = null;
let currentHookFiber = null;
let currentHookIndex = 0;

class AReactDomRoot {
  _internalRoot = null;
  constructor (container) {
    this.container = container;
    this._internalRoot = {
      current: null,
      containerInfo: container,
    }
  }

  render(element) {
    this._internalRoot.current = {
      alternate: {
        stateNode: this._internalRoot.containerInfo,
        props: {
          children: [element]
        }
      }
    }
    workInProgressRoot = this._internalRoot;
    workInProgressRoot.deletions = [];
    workInProgress = workInProgressRoot.current.alternate;

    window.requestIdleCallback(workloop);
    // setTimeout(workloop);
    // this.renderImpl(element, this.container);
  }
}

function workloop() {
  while (workInProgress) {
    workInProgress = performUnitOfWork(workInProgress);
  }

  if (!workInProgress && workInProgressRoot.current.alternate) {
    commitRoot();
  }
}

function commitRoot() {
  workInProgressRoot.deletions.forEach(commitWork);
  commitWork(workInProgressRoot.current.alternate.child);

  workInProgressRoot.current = workInProgressRoot.current.alternate;
  workInProgressRoot.current.alternate = null;
}

function commitWork(fiber) {
  if (!fiber) {
    return;
  }

  let domParentFiber = null;
  if (fiber.return) {
    // 往上查找，直到有一个节点存在 stateNode
    domParentFiber = fiber.return;
    while (!domParentFiber.stateNode) {
      domParentFiber = domParentFiber.return;
    }
  }

  if (fiber.effectTag === 'PLACEMENT' && fiber.stateNode) {
    updateDom(fiber.stateNode, {}, fiber.props);

    // append DOM
    domParentFiber.stateNode.appendChild(fiber.stateNode);
  } else if (fiber.effectTag === 'UPDATE') {
    updateDom(fiber.stateNode, fiber.alternate.props, fiber.props);
  } else if (fiber.effectTag === 'DELETION') {
    commitDeletion(fiber, domParentFiber.stateNode);
  }

  commitWork(fiber.child);
  commitWork(fiber.sibling);
}

function commitDeletion(fiber, parentStateNode) {
  if (fiber.stateNode) {
    parentStateNode.contains(fiber.stateNode) && parentStateNode.removeChild(fiber.stateNode);
  } else {
    commitDeletion(fiber.child, parentStateNode);
  }
}

function updateDom(stateNode, prevProps, nextProps) {
  // remove old or changed event binding
  Object.keys(prevProps).filter(isEvent).filter(key => isGone(prevProps, nextProps)(key) || isChanged(prevProps, nextProps)(key)).forEach(key => {
    const eventName = key.toLowerCase().substring(2);
    stateNode.removeEventListener(eventName, prevProps[key]);
  });

  // remove delete props
  Object.keys(prevProps).filter(isProperty).filter(isGone(prevProps, nextProps)).forEach(key => {
    stateNode[key] = '';
  });

  // set new or changed props
  // 属性绑定
  Object.keys(nextProps).filter(isProperty).filter(key => isNew(prevProps, nextProps)(key) || isChanged(prevProps, nextProps)(key)).forEach(key => {
    stateNode[key] = nextProps[key];
  })

  // add new event binding
  Object.keys(nextProps).filter(isEvent).filter(key => isNew(prevProps, nextProps)(key) || isChanged(prevProps, nextProps)(key)).forEach(key => {
    const eventName = key.toLowerCase().substring(2);
    stateNode.addEventListener(eventName, nextProps[key]);
  })
}

function performUnitOfWork(fiber) {
  // 处理当前fiber：创建 DOM，设置 props,插入当前dom到parent
  const isFunctionComponent = fiber.type instanceof Function;
  if (isFunctionComponent) {
    // 函数式组件，对hook作记录
    currentHookFiber = fiber;
    currentHookFiber.memorizedState = [];
    currentHookIndex = 0;

    fiber.props.children = [fiber.type(fiber.props)]
  } else {
    if (!fiber.stateNode) {
      fiber.stateNode = fiber.type === 'HostText' ? document.createTextNode('') : document.createElement(fiber.type);
    }
  }

  reconcilerChildren(fiber, fiber.props.children);

  // 返回下一个处理的 fiber
  return getNextFiber(fiber)
}

function reconcilerChildren(fiber, children) {
  // 遍历 children，比较当前fiber和oldFiber，然后在 fiber 上添加 effectTag

  // 初始化 children 的 fiber
  let prevSibling = null;
  // mount 阶段 oldFiber 为空，update 阶段为上一次的值
  let oldFiber = fiber.alternate?.child;

  // 特殊处理一种场景：新老fiber长度不一致的时候，比如oldFiber是 [1,2,3] newFiber是 [1,2]
  let index = 0;
  while(index < fiber.props.children.length || oldFiber) {
    const child = fiber.props.children[index];
    let newFiber = null;

    // 有新有老，type都一样，是update阶段
    let sameType = oldFiber && child && child.type === oldFiber.type;

    if (child && !sameType) {
      // mount/placement 有子节点但没有老的，新的初始化
      newFiber = {
        type: child.type,
        stateNode: null,
        props: child.props,
        return: fiber,
        alternate: null,
        child: null,
        sibling: null,
        effectTag: 'PLACEMENT',
      }
    } else if (sameType) {
      // update
      newFiber = {
        type: child.type,
        stateNode: oldFiber.stateNode,
        props: child.props,
        return: fiber,
        alternate: oldFiber,
        child: null,
        sibling: null,
        effectTag: 'UPDATE',
      }
    } else if (!sameType && oldFiber) {
      // delete
      oldFiber.effectTag = 'DELETION';
      workInProgressRoot.deletions.push(oldFiber);
    }

    if (oldFiber) {
      oldFiber = oldFiber.sibling;
    }

    if (index === 0) {
      fiber.child = newFiber;
    } else {
      prevSibling && (prevSibling.sibling = newFiber);
    }
    prevSibling = newFiber;
    index++;
  }
}

function getNextFiber(fiber)  {
  // 遍历顺序：
  // 先遍历 child
  // 然后是sibling
  // 然后是return并查找下一个sibling
  if (fiber.child) {
    return fiber.child
  }

  let nextFiber = fiber;
  while (nextFiber) {
    if (nextFiber.sibling) {
      return nextFiber.sibling;
    } else {
      nextFiber = nextFiber.return;
    }
  }
  return null;
}

function createRoot(container) {
  return new AReactDomRoot(container);
}

function useState(initialState) {
  const oldHook = currentHookFiber.alternate?.memorizedState?.[currentHookIndex];

  const hook = {
    state: oldHook ? oldHook.state : initialState,
    queue: [],
    dispatch: oldHook ? oldHook.dispatch : null,
  }

  const actions = oldHook ? oldHook.queue : [];
  actions.forEach(action => {
    hook.state = typeof action === 'function' ? action(hook.state) : action;
  })

  const setState = (action) => {
    hook.queue.push(action);

    // re-render
    workInProgressRoot.current.alternate = {
      stateNode: workInProgressRoot.containerInfo,
      props: workInProgressRoot.current.props,
      alternate: workInProgressRoot.current // 重要，交换 alternate
    }
    workInProgress = workInProgressRoot.current.alternate;
    workInProgressRoot.deletions = [];
    window.requestIdleCallback(workloop);
  };

  currentHookFiber.memorizedState.push(hook);
  currentHookIndex++;

  return [hook.state, setState];
}

function useReducer(reducer, initialState) {
  const [state, setState] = useState(initialState);
  const dispatch = (action) => {
    // reducer = (oldState, action) => newState
    setState((state) => reducer(state, action));
  }

  return [state, dispatch];
}

function act(callback) {
  callback();
  return new Promise((resolve) => {
    function loop() {
      if (workInProgress) {
        window.requestIdleCallback(loop);
      } else {
        resolve();
      }
    }
    loop();
  })
}

export default {
  createElement,
  createRoot,
  act,
  useState,
  useReducer,
}
