document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('form');
    const titleInput = document.getElementById('title');
    const contentInput = document.getElementById('content');
    const container = document.getElementById('blogs-container');

    const params = new URLSearchParams(window.location.search);
    const editId = params.get('id');

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

                const actions = document.createElement('div');
                actions.className = 'blog-actions';

                const editLink = document.createElement('a');
                editLink.href = `add-blog.html?id=${blog.id}`;
                editLink.textContent = 'Edit';
                editLink.className = 'edit-button';

                const deleteBtn = document.createElement('button');
                deleteBtn.type = 'button';
                deleteBtn.textContent = 'Delete';
                deleteBtn.className = 'delete-button';
                deleteBtn.addEventListener('click', async (e) => {
                    e.preventDefault();
                    if (!confirm('Are you sure you want to delete this post?')) return;
                    try {
                        const res = await fetch(`/api/blogs/${blog.id}`, { method: 'DELETE' });
                        if (res.ok) {
                            // Refresh the list after successful deletion
                            await loadBlogs();
                        } else {
                            const err = await res.json().catch(() => ({ error: 'Unknown error' }));
                            alert(`Delete failed: ${err.error || res.status}`);
                        }
                    } catch (err) {
                        console.error('Delete error', err);
                        alert('Could not delete post. Is the server running?');
                    }
                });

                actions.appendChild(editLink);
                actions.appendChild(deleteBtn);

                article.appendChild(title);
                article.appendChild(meta);
                article.appendChild(content);
                article.appendChild(actions);
                container.appendChild(article);
            });
        } catch (err) {
            console.error('Error:', err);
            container.innerHTML = '<p>Error loading posts.</p>';
        }
    }

    // Run the load function immediately when the page opens
    loadBlogs();

    // Function to handle form submission (and edit mode)
    if (form) {
        // If editing, load existing blog into form
        if (editId) {
            (async () => {
                try {
                    const res = await fetch(`/api/blogs/${editId}`);
                    if (res.ok) {
                        const blog = await res.json();
                        titleInput.value = blog.title || '';
                        contentInput.value = blog.content || '';
                        const submitButton = form.querySelector('button[type="submit"]');
                        if (submitButton) submitButton.textContent = 'Save Changes';

                        // Add a delete button to the form when editing
                        let deleteButton = form.querySelector('button.delete-button');
                        if (!deleteButton) {
                            deleteButton = document.createElement('button');
                            deleteButton.type = 'button';
                            deleteButton.textContent = 'Delete Post';
                            deleteButton.className = 'delete-button';
                            deleteButton.style.marginLeft = '8px';
                            deleteButton.addEventListener('click', async () => {
                                if (!confirm('Are you sure you want to delete this post?')) return;
                                try {
                                    const resDel = await fetch(`/api/blogs/${editId}`, { method: 'DELETE' });
                                    if (resDel.ok) {
                                        window.location.href = 'index.html';
                                    } else {
                                        const err = await resDel.json().catch(() => ({ error: 'Unknown error' }));
                                        alert(`Delete failed: ${err.error || resDel.status}`);
                                    }
                                } catch (err) {
                                    console.error('Delete error:', err);
                                    alert('Could not delete the post. Is the server running?');
                                }
                            });

                            if (submitButton && submitButton.parentNode) {
                                submitButton.parentNode.appendChild(deleteButton);
                            } else {
                                form.appendChild(deleteButton);
                            }
                        }
                    } else {
                        console.error('Failed to load blog for editing', res.status);
                        alert('Could not load the blog to edit.');
                    }
                } catch (err) {
                    console.error('Error loading blog:', err);
                    alert('Could not load the blog to edit. Is the server running?');
                }
            })();
        }

        form.addEventListener('submit', async function (event) {
            event.preventDefault(); // Stop page refresh

            const titleValue = titleInput.value.trim();
            const contentValue = contentInput.value.trim();

            if (!titleValue || !contentValue) {
                alert('Please fill out both the title and content!');
                return;
            }

            try {
                if (editId) {
                    // Update existing blog
                    const response = await fetch(`/api/blogs/${editId}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ title: titleValue, content: contentValue })
                    });

                    if (response.ok) {
                        const data = await response.json();
                        console.log('Blog updated successfully:', data);
                        window.location.href = 'index.html';
                    } else {
                        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                        console.error('Server response:', response.status, errorData);
                        alert(`Error: ${errorData.error || 'Server error updating the post.'}`);
                    }
                } else {
                    // Create new blog
                    const response = await fetch('/api/blogs', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ title: titleValue, content: contentValue })
                    });

                    if (response.ok) {
                        const data = await response.json();
                        console.log('Blog uploaded successfully:', data);
                        window.location.href = 'index.html';
                    } else {
                        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                        console.error('Server response:', response.status, errorData);
                        alert(`Error: ${errorData.error || 'Server error saving the post.'}`);
                    }
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Could not connect. Make sure your server is running!');
            }
        });
    }
});