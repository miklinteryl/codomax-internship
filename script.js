document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('form');
    const titleInput = document.getElementById('title');
    const contentInput = document.getElementById('content');
    const container = document.getElementById('blogs-container');

    const params = new URLSearchParams(window.location.search);
    const editId = params.get('id');
    const toastContainer = document.getElementById('toast-container');

    function showToast(message, type = 'success') {
        if (!toastContainer) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;

        toastContainer.appendChild(toast);

        requestAnimationFrame(() => {
            toast.classList.add('show');
        });

        window.setTimeout(() => {
            toast.classList.remove('show');
            toast.classList.add('hide');
            window.setTimeout(() => toast.remove(), 300);
        }, 3200);
    }

    function escapeHtml(str) {
        if (!str) return '';
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    function renderBlogs(blogs) {
        if (!container) return;

        const fragment = document.createDocumentFragment();

        if (!Array.isArray(blogs) || blogs.length === 0) {
            const emptyState = document.createElement('p');
            emptyState.textContent = 'No blog posts yet. Go add one!';
            fragment.appendChild(emptyState);
            container.replaceChildren(fragment);
            return;
        }

        blogs.slice().reverse().forEach((blog) => {
            fragment.appendChild(createBlogCard(blog));
        });

        container.replaceChildren(fragment);
    }

    function createBlogCard(blog) {
        const article = document.createElement('article');
        article.className = 'blog-card';

        const title = document.createElement('h2');
        title.textContent = blog.title;

        const meta = document.createElement('p');
        meta.className = 'blog-date';
        meta.textContent = `Published on: ${blog.date}`;

        const content = document.createElement('p');
        content.className = 'blog-content';
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
        deleteBtn.addEventListener('click', async (event) => {
            event.preventDefault();
            if (!confirm('Are you sure you want to delete this post?')) return;

            try {
                const response = await fetch(`/api/blogs/${blog.id}`, { method: 'DELETE' });
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                    throw new Error(errorData.error || 'Delete failed');
                }

                await loadBlogs();
                showToast('Blog deleted successfully.', 'success');
            } catch (error) {
                console.error('Delete error:', error);
                showToast(error.message || 'Could not delete post. Is the server running?', 'error');
            }
        });

        actions.append(editLink, deleteBtn);
        article.append(title, meta, content, actions);

        return article;
    }

    async function loadBlogs() {
        if (!container) return;

        container.innerHTML = '<p>Loading blog posts...</p>';

        try {
            const response = await fetch('/api/blogs');
            if (!response.ok) {
                throw new Error(`Failed to load posts (${response.status})`);
            }

            const blogs = await response.json();
            renderBlogs(blogs);
        } catch (error) {
            console.error('Error loading posts:', error);
            container.innerHTML = '<p>Error loading posts.</p>';
        }
    }

    async function deleteBlog(id) {
        const response = await fetch(`/api/blogs/${id}`, { method: 'DELETE' });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            throw new Error(errorData.error || 'Delete failed');
        }

        return response.json().catch(() => ({}));
    }

    loadBlogs();

    if (!form || !titleInput || !contentInput) return;

    const submitButton = form.querySelector('button[type="submit"]');
    let isSubmitting = false;

    function setSubmittingState(submitting) {
        isSubmitting = submitting;
        const buttons = form.querySelectorAll('button');
        buttons.forEach((button) => {
            button.disabled = submitting;
        });

        if (submitButton) {
            submitButton.textContent = submitting
                ? (editId ? 'Saving...' : 'Publishing...')
                : (editId ? 'Save Changes' : 'Publish Blog');
        }
    }

    if (editId) {
        (async () => {
            try {
                const response = await fetch(`/api/blogs/${editId}`);
                if (!response.ok) {
                    throw new Error(`Failed to load blog (${response.status})`);
                }

                const blog = await response.json();
                titleInput.value = blog.title || '';
                contentInput.value = blog.content || '';

                if (submitButton) {
                    submitButton.textContent = 'Save Changes';
                }

                let deleteButton = form.querySelector('button.delete-button');
                if (!deleteButton) {
                    deleteButton = document.createElement('button');
                    deleteButton.type = 'button';
                    deleteButton.textContent = 'Delete Post';
                    deleteButton.className = 'delete-button';
                    deleteButton.addEventListener('click', async () => {
                        if (!confirm('Are you sure you want to delete this post?')) return;

                        try {
                            await deleteBlog(editId);
                            showToast('Blog deleted successfully.', 'success');
                            window.location.assign('index.html');
                        } catch (error) {
                            console.error('Delete error:', error);
                            showToast(error.message || 'Could not delete the post. Is the server running?', 'error');
                        }
                    });

                    if (submitButton && submitButton.parentNode) {
                        submitButton.parentNode.appendChild(deleteButton);
                    } else {
                        form.appendChild(deleteButton);
                    }
                }
            } catch (error) {
                console.error('Error loading blog:', error);
                alert('Could not load the blog to edit. Is the server running?');
            }
        })();
    }

    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        if (isSubmitting) return;

        const titleValue = titleInput.value.trim();
        const contentValue = contentInput.value.trim();

        if (!titleValue || !contentValue) {
            alert('Please fill out both the title and content!');
            return;
        }

        setSubmittingState(true);

        try {
            let response;
            if (editId) {
                response = await fetch(`/api/blogs/${editId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ title: titleValue, content: contentValue })
                });
            } else {
                response = await fetch('/api/blogs', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ title: titleValue, content: contentValue })
                });
            }

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                throw new Error(errorData.error || (editId ? 'Server error updating the post.' : 'Server error saving the post.'));
            }

            if (editId) {
                showToast('Blog updated successfully.', 'success');
            } else {
                showToast('Blog created successfully.', 'success');
            }
            window.location.assign('index.html');
        } catch (error) {
            console.error('Form error:', error);
            showToast(error.message || 'Could not connect. Make sure your server is running!', 'error');
            setSubmittingState(false);
        }
    });
});