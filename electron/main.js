'use strict';

const { app, BrowserWindow, session } = require('electron');
const path = require('path');

const FRONTEND_BUILD = path.join(__dirname, '..', 'frontend', 'build', 'index.html');
const DEV_URL = 'http://localhost:3000';
const isDev = process.env.NODE_ENV !== 'production';

/**
 * Creates the main application window.
 * In development it loads the React dev server; in production it loads
 * the built frontend/build/index.html.
 */
function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: 'AAPO — Affect-Aware Prompt Optimizer',
    backgroundColor: '#0f0f1a',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      // Allow camera access in the renderer.
      webSecurity: !isDev,
    },
  });

  // Grant camera permissions automatically (user already approved at OS level).
  session.defaultSession.setPermissionRequestHandler((_webContents, permission, callback) => {
    if (permission === 'media') {
      callback(true);
    } else {
      callback(false);
    }
  });

  if (isDev) {
    win.loadURL(DEV_URL);
    win.webContents.openDevTools();
  } else {
    win.loadFile(FRONTEND_BUILD);
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    // macOS: re-create window when dock icon is clicked with no open windows.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  // Quit on all platforms (macOS behaviour overridden above).
  app.quit();
});
