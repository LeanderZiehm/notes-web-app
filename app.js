const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Directory to store text files
const FILES_DIR = 'files';

// Initialize files directory
const initializeFilesDir = async () => {
  try {
    await fs.access(FILES_DIR);
  } catch (error) {
    await fs.mkdir(FILES_DIR, { recursive: true });
  }
};

// Get list of all files
app.get('/api/files', async (req, res) => {
  try {
    const files = await fs.readdir(FILES_DIR);
    const fileList = files
      .filter(file => file.endsWith('.txt'))
      .map(file => ({
        name: file,
        displayName: file.replace('.txt', '')
      }));
    res.json(fileList);
  } catch (error) {
    console.error('Error reading files:', error);
    res.status(500).json({ error: 'Error reading files' });
  }
});

// Get file content
app.get('/api/files/:filename', async (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(FILES_DIR, filename);
    
    // Security check - ensure file is within FILES_DIR
    if (!filePath.startsWith(path.resolve(FILES_DIR))) {
      return res.status(400).json({ error: 'Invalid file path' });
    }
    
    const content = await fs.readFile(filePath, 'utf8');
    res.json({ content });
  } catch (error) {
    if (error.code === 'ENOENT') {
      res.status(404).json({ error: 'File not found' });
    } else {
      console.error('Error reading file:', error);
      res.status(500).json({ error: 'Error reading file' });
    }
  }
});

// Save file content
app.post('/api/files/:filename', async (req, res) => {
  try {
    const filename = req.params.filename;
    const { content } = req.body;
    
    // Ensure filename ends with .txt
    const safeFilename = filename.endsWith('.txt') ? filename : `${filename}.txt`;
    const filePath = path.join(FILES_DIR, safeFilename);
    
    // Security check - ensure file is within FILES_DIR
    if (!filePath.startsWith(path.resolve(FILES_DIR))) {
      return res.status(400).json({ error: 'Invalid file path' });
    }
    
    await fs.writeFile(filePath, content, 'utf8');
    res.json({ 
      success: true, 
      message: 'File saved successfully',
      filename: safeFilename
    });
  } catch (error) {
    console.error('Error saving file:', error);
    res.status(500).json({ error: 'Error saving file' });
  }
});

// Delete file
app.delete('/api/files/:filename', async (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(FILES_DIR, filename);
    
    // Security check - ensure file is within FILES_DIR
    if (!filePath.startsWith(path.resolve(FILES_DIR))) {
      return res.status(400).json({ error: 'Invalid file path' });
    }
    
    await fs.unlink(filePath);
    res.json({ success: true, message: 'File deleted successfully' });
  } catch (error) {
    if (error.code === 'ENOENT') {
      res.status(404).json({ error: 'File not found' });
    } else {
      console.error('Error deleting file:', error);
      res.status(500).json({ error: 'Error deleting file' });
    }
  }
});

// Create new file
app.post('/api/files', async (req, res) => {
  try {
    const { filename, content = '' } = req.body;
    
    if (!filename) {
      return res.status(400).json({ error: 'Filename is required' });
    }
    
    // Ensure filename ends with .txt
    const safeFilename = filename.endsWith('.txt') ? filename : `${filename}.txt`;
    const filePath = path.join(FILES_DIR, safeFilename);
    
    // Security check - ensure file is within FILES_DIR
    if (!filePath.startsWith(path.resolve(FILES_DIR))) {
      return res.status(400).json({ error: 'Invalid file path' });
    }
    
    // Check if file already exists
    try {
      await fs.access(filePath);
      return res.status(409).json({ error: 'File already exists' });
    } catch (error) {
      // File doesn't exist, which is what we want
    }
    
    await fs.writeFile(filePath, content, 'utf8');
    res.json({ 
      success: true, 
      message: 'File created successfully',
      filename: safeFilename
    });
  } catch (error) {
    console.error('Error creating file:', error);
    res.status(500).json({ error: 'Error creating file' });
  }
});

// Serve the main HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Initialize and start server
initializeFilesDir().then(() => {
  app.listen(PORT, () => {
    console.log(`Text Editor server running on http://localhost:${PORT}`);
    console.log(`Files will be stored in: ${path.resolve(FILES_DIR)}`);
  });
});