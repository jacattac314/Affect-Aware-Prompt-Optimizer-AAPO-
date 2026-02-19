'use strict';

/**
 * Electron preload script.
 *
 * Runs in the renderer context with contextIsolation=true. Exposes a
 * minimal, safe API surface to the web app via contextBridge.
 */

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  /** Platform identifier — lets the React app detect it's running in Electron. */
  platform: process.platform,

  /** App version from package.json. */
  getVersion: () => ipcRenderer.invoke('app:version'),
});
