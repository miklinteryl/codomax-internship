document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('form');
    const titleInput = document.getElementById('title');
    const contentInput = document.getElementById('content');
    const container = document.getElementById('blogs-container');

    // Utility to prevent code injection
    function escapeHtml(str) {
        if (!str) return '';
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    // Function to load blogs onto the homepage
    async function loadBlogs() {
        if (!container) return; // Only run if on index.html

        try {
            const res = await fetch('/api/blogs');
            const blogs = await res.json();

            container.innerHTML = ''; // Clear loading text

            if (blogs.length === 0) {
                container.innerHTML = '<p>No blog posts yet. Go add one!</p>';
                return;
            }

            // Reverse to show newest first, then build the HTML cards
            blogs.slice().reverse().forEach(blog => {
                const article = document.createElement('article');
                article.className = 'blog-card'; // Matches CSS

                const title = document.createElement('h2');
                title.textContent = blog.title;

                const meta = document.createElement('p');
                meta.className = 'blog-date'; // Matches CSS
                meta.textContent = `Published on: ${blog.date}`;

                const content = document.createElement('p');
                content.className = 'blog-content'; // Matches CSS
                content.innerHTML = escapeHtml(blog.content).replace(/\n/g, '<br>');

                article.appendChild(title);
                article.appendChild(meta);
                article.appendChild(content);
                container.appendChild(article);
            });
        } catch (err) {
            console.error('Error:', err);
            container.innerHTML = '<p>Error loading posts.</p>';
        }
    }

    // Run the load function immediately when the page opens
    loadBlogs();

    // Function to handle form submission
    if (form) {
        form.addEventListener('submit', async function (event) {
            event.preventDefault(); // Stop page refresh

            const titleValue = titleInput.value.trim();
            const contentValue = contentInput.value.trim();

            if (!titleValue || !contentValue) {
                alert('Please fill out both the title and content!');
                return;
            }

            try {
                const response = await fetch('/api/blogs', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ title: titleValue, content: contentValue })
                });

                if (response.ok) {
                    const data = await response.json();
                    console.log('Blog uploaded successfully:', data);
                    // Redirect straight to the home page to see the new post
                    window.location.href = 'index.html';
                } else {
                    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                    console.error('Server response:', response.status, errorData);
                    alert(`Error: ${errorData.error || 'Server error saving the post.'}`);
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Could not connect. Make sure your server is running!');
            }
        });
    }
});