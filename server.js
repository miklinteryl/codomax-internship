const express = require('express');
const app = express();
const port = 3000;

// Serve all static files (HTML, CSS, JS) from the current folder
app.use(express.static(__dirname));

// Middleware to parse JSON data sent from the frontend
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Temporary database (Array)
let blogPosts = [];

// API Route: Get all blogs
app.get('/api/blogs', (req, res) => {
    res.json(blogPosts);
});

// API Route: Add a new blog
app.post('/api/blogs', (req, res) => {
    const { title, content } = req.body;

    // Validate required fields
    if (!title || !content) {
        return res.status(400).json({ error: 'Title and content are required.' });
    }

    if (typeof title !== 'string' || typeof content !== 'string') {
        return res.status(400).json({ error: 'Title and content must be text.' });
    }

    const newBlog = {
        id: Date.now(),
        title: title.trim(),
        content: content.trim(),
        date: new Date().toLocaleDateString()
    };

    blogPosts.push(newBlog);
    console.log('Server saved a new blog:', newBlog.title);

    res.status(201).json({ message: 'Blog post created successfully!', blog: newBlog });
});

// API Route: Get single blog by id
app.get('/api/blogs/:id', (req, res) => {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid blog id.' });

    const blog = blogPosts.find(b => b.id === id);
    if (!blog) return res.status(404).json({ error: 'Blog not found.' });

    res.json(blog);
});

// API Route: Update a blog by id
app.put('/api/blogs/:id', (req, res) => {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid blog id.' });

    const { title, content } = req.body;
    if (!title || !content) return res.status(400).json({ error: 'Title and content are required.' });
    if (typeof title !== 'string' || typeof content !== 'string') return res.status(400).json({ error: 'Title and content must be text.' });

    const idx = blogPosts.findIndex(b => b.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Blog not found.' });

    blogPosts[idx] = {
        ...blogPosts[idx],
        title: title.trim(),
        content: content.trim(),
        date: new Date().toLocaleDateString()
    };

    console.log('Server updated blog:', blogPosts[idx].title);
    res.json({ message: 'Blog updated successfully!', blog: blogPosts[idx] });
});

// Start server
app.listen(port, () => {
    console.log(`Backend server is running on http://localhost:${port}`);
});