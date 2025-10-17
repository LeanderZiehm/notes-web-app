Welcome to `notes-everywhere`
With every I mean:
web-app: link to be added
chrome extension link to be added notes-everywhere
cli: pip install cli-notes-everywhere  package to be pushed

TODO:
Android app

Maybe in the comming years:
IOS App







# Advanced Text Editor

A self-hosted, web-based text editor with timestamped lines, tag-based organization, and comprehensive analytics. Built with Node.js, Express, and vanilla JavaScript.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node.js](https://img.shields.io/badge/node.js-18%2B-green.svg)
![Express](https://img.shields.io/badge/express-4.18%2B-lightgrey.svg)

## 🚀 Features

### 📝 Core Editor
- **Line-based editing** with automatic text wrapping
- **Timestamped lines** - Track creation and modification times
- **JSON-based storage** - All data persists in a local JSON file
- **Real-time editing** - Click any line to edit instantly
- **Keyboard shortcuts** - `Ctrl+Enter` for new line, `Escape` to cancel editing
- **Line numbers** - Visual line numbering like traditional code editors

### 🏷️ Tag System
- **Hashtag support** - Use `#todo`, `#note`, `#important`, `#done` tags
- **Color-coded lines** - Different background colors for different tags
- **Tag-based filtering** - Browse and filter content by tags
- **Auto-detection** - Tags are automatically extracted and highlighted

### 📊 Analytics Dashboard
- **Word frequency analysis** - See most commonly used words
- **Tag usage statistics** - Track how often you use each tag
- **Line count metrics** - Total lines, words, and unique words
- **Usage insights** - Understand your writing patterns

### 📋 Organization Tools
- **To-Do List tab** - Dedicated view for all `#todo` tagged items
- **Tag browser** - Explore content organized by tags
- **Search functionality** - Filter todos and content easily
- **Metadata display** - Hover over lines to see timestamps

## 🛠️ Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Quick Setup

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/advanced-text-editor.git
cd advanced-text-editor
```

2. **Install dependencies**
```bash
npm install
```

3. **Start the server**
```bash
npm start
```

4. **Open in browser**
```
http://localhost:3000
```

### Development Mode
For auto-restart on file changes:
```bash
npm run dev
```

## 📁 Project Structure

```
advanced-text-editor/
├── app.js              # Express server and API routes
├── package.json        # Node.js dependencies and scripts
├── notes.json          # Data storage (auto-created)
├── public/
│   └── index.html      # Frontend application
└── README.md           # This file
```

## 🎯 Usage

### Creating Content
1. Click the **+** button or press `Ctrl+Enter` to create a new line
2. Click any line to edit it
3. Press `Enter` to save and create a new line
4. Press `Escape` to cancel editing

### Using Tags
Add hashtags anywhere in your text to organize content:
- `#todo` - Creates todo items with orange accent
- `#done` - Marks completed items with green accent and strikethrough
- `#note` - General notes with blue accent
- `#important` - Important items with red accent

### Navigation
- **Editor Tab** - Main editing interface
- **To-Do List Tab** - View all todo items
- **Analytics Tab** - Word frequency and usage statistics
- **Tags Tab** - Browse content by tags

### Keyboard Shortcuts
- `Ctrl+Enter` - Add new line
- `Enter` - Save current line and add new line
- `Escape` - Cancel editing
- `Ctrl+Delete` - Delete current line (with confirmation)

## 🔧 API Endpoints

The application provides a RESTful API:

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/lines` | Get all lines |
| POST | `/api/lines` | Create new line |
| PUT | `/api/lines/:id` | Update line |
| DELETE | `/api/lines/:id` | Delete line |
| GET | `/api/analytics` | Get word/tag analytics |
| GET | `/api/tags/:tag` | Get lines by tag |

## 💾 Data Storage

All data is stored in `notes.json` with the following structure:

```json
{
  "lines": [
    {
      "id": 1,
      "content": "My first note #todo",
      "createdAt": "2024-01-01T12:00:00.000Z",
      "editedAt": "2024-01-01T12:00:00.000Z",
      "tags": ["todo"]
    }
  ],
  "nextId": 2
}
```

## 🎨 Customization

### Themes
The editor uses a dark theme inspired by VS Code. You can customize colors by modifying the CSS variables in `public/index.html`.

### Adding New Tags
To add new tag types:
1. Add CSS class in the `<style>` section
2. Update the `getLineClass()` function in JavaScript
3. Tags are automatically detected by the `#tagname` pattern

### Custom Shortcuts
Modify the keyboard event handlers in the JavaScript section to add custom shortcuts.

## 🔒 Security Notes

- This is designed for self-hosted use
- No authentication is implemented
- Data is stored locally in JSON format
- Consider adding authentication for multi-user scenarios

## 🐛 Troubleshooting

### Common Issues

**Server won't start**
- Check if port 3000 is available
- Ensure Node.js is installed correctly
- Verify all dependencies are installed

**Data not saving**
- Check file permissions in the project directory
- Ensure the server has write access to create `notes.json`

**Tags not working**
- Ensure hashtags are properly formatted (`#tagname`)
- Tags are case-insensitive and auto-detected

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by Sublime Text and VS Code
- Built with Express.js and vanilla JavaScript
- Dark theme inspired by popular code editors

## 📧 Support

If you encounter any issues or have questions:
- Open an issue on GitHub
- Check the troubleshooting section above
- Review the API documentation

---

**Made with ❤️ for better note-taking and organization**
