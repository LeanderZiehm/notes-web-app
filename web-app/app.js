const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const app = express();
const PORT = 5007;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Directory to store text files
const FILES_DIR = path.resolve('files');

// Initialize files directory
const initializeFilesDir = async () => {
  try {
    await fs.access(FILES_DIR);
  } catch (error) {
    await fs.mkdir(FILES_DIR, { recursive: true });
  }
};

// Helper function to validate and get safe file path
const getSafeFilePath = (filename) => {
  // Remove any path traversal attempts
  const safeName = path.basename(filename);
  
  // Add .txt extension if not present
  const safeFilename = safeName.endsWith('.txt') ? safeName : `${safeName}.txt`;
  
  // Create full path
  const fullPath = path.join(FILES_DIR, safeFilename);
  
  // Ensure the resolved path is within FILES_DIR
  const resolvedPath = path.resolve(fullPath);
  const resolvedFilesDir = path.resolve(FILES_DIR);
  
  // if (!resolvedPath.startsWith(resolvedFilesDir + path.sep) && resolvedPath !== resolvedFilesDir) {
  //   throw new Error('Invalid file path');
  // }
  
  return { fullPath: resolvedPath, filename: safeFilename };
};

// Get list of all files
app.get('/api/files', async (req, res) => {
  try {
    const files = await fs.readdir(FILES_DIR);
    const fileList = files
      .filter(file => file.endsWith('.txt'))
      .map(file => ({
        name: file.replace('.txt', ''), // Remove .txt for display
        fullName: file, // Keep full name for internal use
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
    const { fullPath } = getSafeFilePath(req.params.filename);
    
    const content = await fs.readFile(fullPath, 'utf8');
    res.json({ content });
  } catch (error) {
    if (error.code === 'ENOENT') {
      res.status(404).json({ error: 'File not found' });
    } else if (error.message === 'Invalid file path') {
      res.status(400).json({ error: 'Invalid file path' });
    } else {
      console.error('Error reading file:', error);
      res.status(500).json({ error: 'Error reading file' });
    }
  }
});

// Save file content
app.post('/api/files/:filename', async (req, res) => {
  try {
    const { content } = req.body;
    const { fullPath, filename } = getSafeFilePath(req.params.filename);
    
    await fs.writeFile(fullPath, content, 'utf8');
    res.json({ 
      success: true, 
      message: 'File saved successfully',
      filename: filename.replace('.txt', '') // Return filename without extension
    });
  } catch (error) {
    if (error.message === 'Invalid file path') {
      res.status(400).json({ error: 'Invalid file path' });
    } else {
      console.error('Error saving file:', error);
      res.status(500).json({ error: 'Error saving file' });
    }
  }
});

// Delete file
app.delete('/api/files/:filename', async (req, res) => {
  try {
    const { fullPath } = getSafeFilePath(req.params.filename);
    
    await fs.unlink(fullPath);
    res.json({ success: true, message: 'File deleted successfully' });
  } catch (error) {
    if (error.code === 'ENOENT') {
      res.status(404).json({ error: 'File not found' });
    } else if (error.message === 'Invalid file path') {
      res.status(400).json({ error: 'Invalid file path' });
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
    
    const { fullPath, filename: safeFilename } = getSafeFilePath(filename);
    
    // Check if file already exists
    try {
      await fs.access(fullPath);
      return res.status(409).json({ error: 'File already exists' });
    } catch (error) {
      // File doesn't exist, which is what we want
    }
    
    await fs.writeFile(fullPath, content, 'utf8');
    res.json({ 
      success: true, 
      message: 'File created successfully',
      filename: safeFilename.replace('.txt', '') // Return filename without extension
    });
  } catch (error) {
    if (error.message === 'Invalid file path') {
      res.status(400).json({ error: 'Invalid file path' });
    } else {
      console.error('Error creating file:', error);
      res.status(500).json({ error: 'Error creating file' });
    }
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
    console.log(`Files will be stored in: ${FILES_DIR}`);
  });
});