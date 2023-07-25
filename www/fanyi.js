function delaySend(fast) {
  const _t = fast ? 500 : 1000
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve()
    }, _t)
  })
}

const socket = new WebSocket('ws://localhost:8000');

const fanyiMap = {}
function wfanyi(childNodes, fast) {
  (function setNodeMap(childNodes) {
    for (let n of childNodes) {
      if (n.nodeType === 3) {
        if (n.nodeValue && n.nodeValue.replace(/\\(.)/g, '').trim()) {
          const key = Math.random().toString(16).substr(2) + '-' + Math.random().toString(16).substr(2)
          fanyiMap[key] = n
        }
      } else if (n.nodeType === 1 && !n.classList.contains('ts') && !n.classList.contains('signature')) {
        if (!['PRE', 'IMG', 'CODE', 'VIDEO', 'AUDIO'].includes(n.tagName) && n.childNodes?.length) {
          if (n.tagName === 'A') {
            n.parentNode.tagName.startsWith('H') && setNodeMap(n.childNodes)
          } else {
            setNodeMap(n.childNodes)
          }
        }
      }
    }
  })(childNodes)
  
  let n = 0
  async function sendValue() {
    for (let key in fanyiMap) {
      await delaySend(fast)
      console.log('key', key)
      socket.send(JSON.stringify({
        key,
        value: fanyiMap[key].nodeValue,
        fast: true
      }))
    }
  }
  sendValue()
}


// Connection opened
socket.addEventListener('open', function (event) {
  socket.send('Hello Server!');
});

// Listen for messages
socket.addEventListener('message', function (event) {
  var {key, value} = JSON.parse(event.data)
  if (value) fanyiMap[key].nodeValue = value
});
wfanyi($0.childNodes, 1)