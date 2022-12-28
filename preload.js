const {contextBridge, ipcRenderer} = require('electron')

contextBridge.exposeInMainWorld('versions', {
    node: () => process.versions.node,
    chrome: () => process.versions.chrome,
    electron: () => process.versions.electron,
    send: (c, d) => ipcRenderer.send(c, d),
    // we can also expose variables, not just functions
})

contextBridge.exposeInMainWorld('communications', {
    send: (c, d) => ipcRenderer.send(c, d),
    on: (c, f) => ipcRenderer.on(c, f),
    // we can also expose variables, not just functions
})