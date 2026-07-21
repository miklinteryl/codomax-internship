const express = require('express');
const app = express();
const port = 3000;

// Middleware to parse data submitted from HTML forms
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// GET Route: This handles requests to the homepage
app.get('/', (req, res) => {
    res.send('Welcome to the Blog Backend Server! This is a GET request.');
});

// GET Route: This could eventually serve your Add Blog HTML page
app.get('/add-blog', (req, res) => {
    res.send('This route will eventually send the add-blog.html file.');
});

// POST Route: This will receive the form data when a user hits "Publish"
app.post('/submit-blog', (req, res) => {
    const blogTitle = req.body.title;
    console.log('New blog submitted with title:', blogTitle);
    
    // Send a response back to the browser
    res.send('Blog post successfully received by the server! (POST request successful)');
});

// Start the server
app.listen(port, () => {
    console.log(`Backend server is running on http://localhost:${port}`);
});