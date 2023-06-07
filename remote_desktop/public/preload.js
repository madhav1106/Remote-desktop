const { ipcRenderer, contextBridge } = require('electron')

contextBridge.exposeInMainWorld('electronAPI',{
    getScreen: (callback) => ipcRenderer.on('SET_SOURCE', callback),
    mouseMove: ({clientX, clientY, clientWidth, clientHeight}) => ipcRenderer.send('mouse_move', {clientX, clientY, clientWidth, clientHeight}),
    mouseClick: (button) => ipcRenderer.send('mouse_click', button),
    mouseScroll: ({deltaX, deltaY}) => ipcRenderer.send('mouse_scroll', {deltaX, deltaY}),
    mouseDrag: ({direction, clientX, clientY, clientWidth, clientHeight}) => ipcRenderer.send('mouse_drag', {direction, clientX, clientY, clientWidth, clientHeight}),
    keyPress: (key) => ipcRenderer.send('key_press', key)
})