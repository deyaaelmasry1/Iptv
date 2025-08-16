document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const postForm = document.getElementById('post-form');
  const submitBtn = document.getElementById('submit-btn');
  const statusMessage = document.getElementById('status-message');
  const titleInput = document.getElementById('post-title');
  const contentInput = document.getElementById('post-content');
  const slugInput = document.getElementById('post-slug');
  const postsTable = document.getElementById('posts-table');
  const editForm = document.getElementById('edit-form');
  
  // Check if we're on the posts list page
  if (postsTable) {
    loadPostsList();
  }
  
  // Check if we're on the edit page
  if (editForm) {
    const urlParams = new URLSearchParams(window.location.search);
    const slug = urlParams.get('slug');
    
    if (slug) {
      loadPostForEditing(slug);
    }
    
    setupEditForm();
  }

  // Toast Notification Functions
  const showToast = (message, type = 'success') => {
    const toast = document.createElement('div');
    toast.className = `fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 text-white ${
      type === 'success' ? 'bg-green-500' : 'bg-red-500'
    } animate-fade-in`;
    
    toast.innerHTML = `
      <div class="flex items-center">
        <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'} mr-2"></i>
        <span>${message}</span>
      </div>
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.classList.replace('animate-fade-in', 'animate-fade-out');
      setTimeout(() => toast.remove(), 300);
    }, 5000);
  };

  // Form Validation
  const validateForm = () => {
    let isValid = true;
    
    if (!titleInput?.value.trim()) {
      titleInput?.classList.add('border-red-500');
      isValid = false;
    }
    
    if (!contentInput?.value.trim()) {
      contentInput?.classList.add('border-red-500');
      isValid = false;
    }
    
    if (slugInput && !slugInput.value.trim()) {
      slugInput.classList.add('border-red-500');
      isValid = false;
    }
    
    return isValid;
  };

  // Clear Validation Styles
  const clearValidation = () => {
    [titleInput, contentInput, slugInput].forEach(input => {
      if (input) {
        input.classList.remove('border-red-500');
        input.addEventListener('input', () => {
          if (input.value.trim()) input.classList.remove('border-red-500');
        });
      }
    });
  };

  // Load posts for the admin list
  async function loadPostsList() {
    try {
      const response = await fetch('/admin/posts/index.json');
      const posts = await response.json();
      
      const tbody = postsTable.querySelector('tbody');
      tbody.innerHTML = '';
      
      posts.forEach(post => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td class="px-4 py-2">${post.title}</td>
          <td class="px-4 py-2">${post.slug}</td>
          <td class="px-4 py-2">${new Date(post.date).toLocaleDateString()}</td>
          <td class="px-4 py-2">
            <a href="/admin/posts/edit.html?slug=${post.slug}" class="text-blue-500 hover:text-blue-700 mr-3">
              <i class="fas fa-edit"></i> Edit
            </a>
            <button class="text-red-500 hover:text-red-700 delete-btn" data-slug="${post.slug}">
              <i class="fas fa-trash"></i> Delete
            </button>
          </td>
        `;
        tbody.appendChild(row);
      });
      
      // Add delete event listeners
      document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', async function() {
          const slug = this.getAttribute('data-slug');
          if (confirm(`Are you sure you want to delete "${slug}"?`)) {
            await deletePost(slug);
            loadPostsList(); // Refresh the list
          }
        });
      });
      
    } catch (error) {
      console.error('Error loading posts:', error);
      showToast('Failed to load posts', 'error');
    }
  }
  
  // Load a single post for editing
  async function loadPostForEditing(slug) {
    try {
      const response = await fetch(`/posts/${slug}.json`);
      const post = await response.json();
      
      titleInput.value = post.title;
      slugInput.value = post.slug;
      contentInput.value = post.content;
      
    } catch (error) {
      console.error('Error loading post:', error);
      showToast('Failed to load post for editing', 'error');
    }
  }
  
  // Setup edit form submission
  function setupEditForm() {
    editForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearValidation();
      
      if (!validateForm()) {
        showToast('Please fill in all required fields', 'error');
        return;
      }
      
      const postData = {
        title: titleInput.value.trim(),
        slug: slugInput.value.trim(),
        content: contentInput.value.trim(),
        date: new Date().toISOString()
      };
      
      try {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `
          <span class="flex items-center">
            <i class="fas fa-spinner fa-spin mr-2"></i>
            Saving...
          </span>
        `;
        
        // Get original slug from URL
        const urlParams = new URLSearchParams(window.location.search);
        const originalSlug = urlParams.get('slug');
        
        await savePost(postData, originalSlug);
        showToast('Post saved successfully!');
        
        // Redirect to posts list after a short delay
        setTimeout(() => {
          window.location.href = '/admin/posts/index.html';
        }, 1500);
        
      } catch (error) {
        console.error('Error saving post:', error);
        showToast(error.message || 'Failed to save post', 'error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Save Post';
      }
    });
  }
  
  // Save post (create or update)
  async function savePost(postData, originalSlug = null) {
    try {
      // First save the post content
      const postResponse = await fetch(`/posts/${postData.slug}.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postData)
      });
      
      if (!postResponse.ok) throw new Error('Failed to save post content');
      
      // Then update the posts index
      const indexResponse = await fetch('/admin/posts/index.json');
      let posts = await indexResponse.json();
      
      if (originalSlug && originalSlug !== postData.slug) {
        // If slug changed, remove old entry and delete old file
        posts = posts.filter(p => p.slug !== originalSlug);
        await fetch(`/posts/${originalSlug}.json`, { method: 'DELETE' });
      } else if (!originalSlug) {
        // New post - check if slug already exists
        if (posts.some(p => p.slug === postData.slug)) {
          throw new Error('A post with this slug already exists');
        }
      }
      
      // Update or add the post in index
      const existingIndex = posts.findIndex(p => p.slug === postData.slug);
      if (existingIndex >= 0) {
        posts[existingIndex] = postData;
      } else {
        posts.push(postData);
      }
      
      // Save updated index
      const saveIndexResponse = await fetch('/admin/posts/index.json', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(posts)
      });
      
      if (!saveIndexResponse.ok) throw new Error('Failed to update posts index');
      
    } catch (error) {
      throw error;
    }
  }
  
  // Delete a post
  async function deletePost(slug) {
    try {
      // Delete the post file
      const deleteResponse = await fetch(`/posts/${slug}.json`, {
        method: 'DELETE'
      });
      
      if (!deleteResponse.ok) throw new Error('Failed to delete post file');
      
      // Update the index
      const indexResponse = await fetch('/admin/posts/index.json');
      let posts = await indexResponse.json();
      
      posts = posts.filter(p => p.slug !== slug);
      
      const saveIndexResponse = await fetch('/admin/posts/index.json', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(posts)
      });
      
      if (!saveIndexResponse.ok) throw new Error('Failed to update posts index');
      
      showToast('Post deleted successfully');
      
    } catch (error) {
      console.error('Error deleting post:', error);
      showToast('Failed to delete post', 'error');
      throw error;
    }
  }

  // Initialize
  clearValidation();
  if (postForm) {
    postForm.addEventListener('submit', handleSubmit);
  }
});
