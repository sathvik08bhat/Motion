const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');

// Load environment variables from .env.local
require('dotenv').config({ path: path.join(__dirname, '.env.local') });

// Secure AI Proxy
ipcMain.handle('ai-call', async (event, { messages, config }) => {
  console.log('[Main Process] AI Call received');
  const apiKey = process.env.AI_API_KEY;
  if (!apiKey) {
    console.error('[Main Process] AI_API_KEY missing!');
    throw new Error('AI_API_KEY is not configured in the main process.');
  }

  try {
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/openai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: config?.model || 'gemini-1.5-flash',
        messages: messages,
        temperature: config?.temperature || 0.7,
        max_tokens: config?.max_tokens || 2048
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'AI request failed');
    }

    return await response.json();
  } catch (error) {
    console.error('Secure AI Call Error:', error);
    throw error;
  }
});

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    backgroundColor: '#000000',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'), // Optional but recommended
    },
    title: "Motion"
  });

  if (isDev) {
    win.loadURL('http://localhost:5174');
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(__dirname, 'out', 'index.html'));
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
