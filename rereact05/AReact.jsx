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

const isProperty = (key) => key !== 'children'
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
    workInProgressRoot.current = workInProgressRoot.current.alternate;
    workInProgressRoot.current.alternate = null;
  }
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
      Object.keys(fiber.props).filter(isProperty).forEach(key => {
        fiber.stateNode[key] = fiber.props[key];
      })
    }
    if (fiber.return) {
      // 往上查找，直到有一个节点存在 stateNode
      let domParentFiber = fiber.return;
      while (!domParentFiber.stateNode) {
        domParentFiber = domParentFiber.return;
      }
      domParentFiber.stateNode.appendChild(fiber.stateNode);
    }
  }

  // 初始化 children 的 fiber
  let prevSibling = null;
  // mount 阶段 oldFiber 为空，update 阶段为上一次的值
  let oldFiber = fiber.alternate?.child;
  fiber.props.children.forEach((child, index) => {
    let newFiber = null;
    if (!oldFiber) {
      // mount
      newFiber = {
        type: child.type,
        stateNode: null,
        props: child.props,
        return: fiber,
        alternate: null,
        child: null,
        sibling: null,
      }
    } else {
      // update
      newFiber = {
        type: child.type,
        stateNode: oldFiber.stateNode,
        props: child.props,
        return: fiber,
        alternate: oldFiber,
        child: null,
        sibling: null,
      }
    }

    if (oldFiber) {
      oldFiber = oldFiber.sibling;
    }

    if (index === 0) {
      fiber.child = newFiber;
    } else {
      prevSibling.sibling = newFiber;
    }
    prevSibling = newFiber;
  })

  // 返回下一个处理的 fiber
  return getNextFiber(fiber)
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

  const setState = oldHook ? oldHook.dispatch : (action) => {
    hook.queue.push(action);

    // re-render
    workInProgressRoot.current.alternate = {
      stateNode: workInProgressRoot.current.containerInfo,
      props: workInProgressRoot.current.props,
      alternate: workInProgressRoot.current // 重要，交换 alternate
    }
    workInProgress = workInProgressRoot.current.alternate;
    window.requestIdleCallback(workloop);
  };

  currentHookFiber.memorizedState.push(hook);
  currentHookIndex++;

  return [hook.state, setState];
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
}
