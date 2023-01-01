const {contextBridge, ipcRenderer} = require('electron')

contextBridge.exposeInMainWorld('versions', {
    node: () => process.versions.node,
    chrome: () => process.versions.chrome,
    electron: () => process.versions.electron,
    // we can also expose variables, not just functions
})

contextBridge.exposeInMainWorld('communications', {
    send: (c, d) => ipcRenderer.send(c, d),
    on: (c, f) => ipcRenderer.on(c, f),
    // we can also expose variables, not just functions
})

contextBridge.exposeInMainWorld('fileWriter', {
    open: () => ipcRenderer.send('file_open'),
    write: (data) => ipcRenderer.send('file_write', data)
})