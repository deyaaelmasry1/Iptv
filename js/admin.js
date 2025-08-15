document.addEventListener('DOMContentLoaded', async () => {
  const cms = new GitHubCMS();
  const postForm = document.getElementById('post-form');
  const previewBtn = document.getElementById('preview-btn');
  const previewPanel = document.getElementById('preview-panel');
  const postPreview = document.getElementById('post-preview');
  const closePreview = document.getElementById('close-preview');

  // Preview functionality
  previewBtn.addEventListener('click', () => {
    const title = document.getElementById('post-title').value;
    const content = document.getElementById('post-content').value;
    
    if (!title || !content) {
      alert('Please enter both title and content to preview');
      return;
    }
    
    postPreview.innerHTML = `
      <h1>${title}</h1>
      ${marked.parse(content)}
    `;
    previewPanel.classList.remove('hidden');
  });

  closePreview.addEventListener('click', () => {
    previewPanel.classList.add('hidden');
  });

  // Form submission
  postForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const title = document.getElementById('post-title').value;
    const content = document.getElementById('post-content').value;
    
    if (!title || !content) {
      alert('Please fill in all fields');
      return;
    }
    
    try {
      const result = await cms.createPost(title, content);
      if (result.content) {
        alert('Post created successfully!');
        postForm.reset();
      } else {
        throw new Error('Post creation failed');
      }
    } catch (error) {
      console.error('Error creating post:', error);
      alert(`Error: ${error.message}`);
    }
  });
});
