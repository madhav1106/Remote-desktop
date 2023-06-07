const { app, BrowserWindow, desktopCapturer, ipcMain} = require('electron');
const path = require('path');
const url = require('url');
const robot = require("@jitsi/robotjs");
const { screen } = require('electron')

let screenSize, mouseDirection = ''
const createWindow = () => {
    mainWindow = new BrowserWindow({
        show: false,
        width: 1366,
        height: 600,
        webPreferences:{
            preload: path.join(__dirname, 'preload.js'),
            enableRemoteModule: true
        }
    })

    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'index.html'),
        protocol: 'file',
        slashes: true
    }))
    
    mainWindow.once('ready-to-show', () => {
        displays = screen.getAllDisplays()

        mainWindow.show()
        mainWindow.setPosition(0,0)

        desktopCapturer.getSources({
            types: ['screen']
        }).then(sources => {
            screenSize = displays.filter(display => `${display.id}` === sources[0].display_id)[0].size
            // screenSize = sources[0].thumbnail.getSize()
            mainWindow.webContents.send('SET_SOURCE', sources[0].id)
            
        })
    })

    mainWindow.webContents.openDevTools();
}

app.on('ready', () => {
    createWindow()
})

ipcMain.on('mouse_move', (e, {clientX, clientY, clientWidth, clientHeight}) => {
    const {width, height} = screenSize

    const hostX = clientX * width / clientWidth
    const hostY = clientY * height / clientHeight

    robot.moveMouse(hostX, hostY)
})

ipcMain.on('mouse_click', (e, data) => {
    if(data) {
        robot.mouseClick(data.button, data.double)
    }
})

ipcMain.on('mouse_scroll', (e, {deltaX, deltaY}) => {
    robot.scrollMouse(deltaX, deltaY)
})

ipcMain.on('mouse_drag', (e, {direction, clientX, clientY, clientWidth, clientHeight}) => {
    if(direction != mouseDirection) {
        mouseDirection = direction
        robot.mouseToggle(direction)
    }
    const {width, height} = screenSize

    const hostX = clientX * width / clientWidth
    const hostY = clientY * height / clientHeight

    robot.dragMouse(hostX, hostY)
})

ipcMain.on('key_press', (e, keys) => {
    try {
        // if(key[1] && (key[0].toLowerCase() !== key[1].toLowerCase())) {
        if(keys[1].length > 0 && (keys[0].toLowerCase() !== keys[1][0].toLowerCase())) {
            robot.keyToggle(keys[0], "down", keys[1])
            robot.keyToggle(keys[0], "up", keys[1])
            // robot.keyTap(keys[0], keys[1])
        } else if(keys[1].length == 0) {
            robot.keyTap(keys[0])
        }
    } catch(e) {
        console.error(e)
    }
})