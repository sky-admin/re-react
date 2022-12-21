import '../requestIdleCallbackPolyfill.js';

function createElement(type, props, ...children) {
  return {
    type,
    props: {
      ...props,
      children: children.map(child => {
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
}

function performUnitOfWork(fiber) {
  // 处理当前fiber：创建 DOM，设置 props,插入当前dom到parent
  if (!fiber.stateNode) {
    fiber.stateNode = fiber.type === 'HostText' ? document.createTextNode('') : document.createElement(fiber.type);
    Object.keys(fiber.props).filter(isProperty).forEach(key => {
      fiber.stateNode[key] = fiber.props[key];
    })
  }
  if (fiber.return) {
    fiber.return.stateNode.appendChild(fiber.stateNode);
  }

  // 初始化 children 的 fiber
  let prevSibling = null;
  fiber.props.children.forEach((child, index) => {
    const newFiber = {
      type: child.type,
      stateNode: null,
      props: child.props,
      return: fiber,
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

export default {
  createElement,
  createRoot,
}
