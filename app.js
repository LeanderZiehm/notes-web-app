const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Data file path
const DATA_FILE = 'notes.json';

// Initialize data structure
const initializeData = async () => {
  try {
    await fs.access(DATA_FILE);
  } catch (error) {
    // File doesn't exist, create it
    const initialData = {
      lines: [],
      nextId: 1
    };
    await fs.writeFile(DATA_FILE, JSON.stringify(initialData, null, 2));
  }
};

// Read data from JSON file
const readData = async () => {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading data:', error);
    return { lines: [], nextId: 1 };
  }
};

// Write data to JSON file
const writeData = async (data) => {
  try {
    await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error writing data:', error);
  }
};

// Get all lines
app.get('/api/lines', async (req, res) => {
  const data = await readData();
  res.json(data.lines);
});

// Add new line
app.post('/api/lines', async (req, res) => {
  const { content } = req.body;
  const data = await readData();
  
  const newLine = {
    id: data.nextId++,
    content: content,
    createdAt: new Date().toISOString(),
    editedAt: new Date().toISOString(),
    tags: extractTags(content)
  };
  
  data.lines.push(newLine);
  await writeData(data);
  res.json(newLine);
});

// Update line
app.put('/api/lines/:id', async (req, res) => {
  const { id } = req.params;
  const { content } = req.body;
  const data = await readData();
  
  const lineIndex = data.lines.findIndex(line => line.id === parseInt(id));
  if (lineIndex === -1) {
    return res.status(404).json({ error: 'Line not found' });
  }
  
  data.lines[lineIndex].content = content;
  data.lines[lineIndex].editedAt = new Date().toISOString();
  data.lines[lineIndex].tags = extractTags(content);
  
  await writeData(data);
  res.json(data.lines[lineIndex]);
});

// Delete line
app.delete('/api/lines/:id', async (req, res) => {
  const { id } = req.params;
  const data = await readData();
  
  const lineIndex = data.lines.findIndex(line => line.id === parseInt(id));
  if (lineIndex === -1) {
    return res.status(404).json({ error: 'Line not found' });
  }
  
  data.lines.splice(lineIndex, 1);
  await writeData(data);
  res.json({ success: true });
});

// Get analytics
app.get('/api/analytics', async (req, res) => {
  const data = await readData();
  const wordCount = {};
  const tagCount = {};
  
  data.lines.forEach(line => {
    // Count words
    const words = line.content.toLowerCase().match(/\b\w+\b/g) || [];
    words.forEach(word => {
      wordCount[word] = (wordCount[word] || 0) + 1;
    });
    
    // Count tags
    line.tags.forEach(tag => {
      tagCount[tag] = (tagCount[tag] || 0) + 1;
    });
  });
  
  res.json({
    totalLines: data.lines.length,
    wordCount: Object.entries(wordCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 50), // Top 50 words
    tagCount,
    totalWords: Object.values(wordCount).reduce((sum, count) => sum + count, 0)
  });
});

// Get lines by tag
app.get('/api/tags/:tag', async (req, res) => {
  const { tag } = req.params;
  const data = await readData();
  
  const taggedLines = data.lines.filter(line => 
    line.tags.includes(tag.toLowerCase())
  );
  
  res.json(taggedLines);
});

// Extract tags from content
function extractTags(content) {
  const tagRegex = /#(\w+)/g;
  const tags = [];
  let match;
  
  while ((match = tagRegex.exec(content)) !== null) {
    tags.push(match[1].toLowerCase());
  }
  
  return [...new Set(tags)]; // Remove duplicates
}

// Serve the main HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Initialize data and start server
initializeData().then(() => {
  app.listen(PORT, () => {
    console.log(`Text Editor server running on http://localhost:${PORT}`);
  });
});