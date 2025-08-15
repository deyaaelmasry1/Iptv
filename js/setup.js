document.addEventListener('DOMContentLoaded', () => {
  const steps = document.querySelectorAll('.step');
  const prevBtn = document.getElementById('prev-step');
  const nextBtn = document.getElementById('next-step');
  const stepIndicator = document.getElementById('step-indicator');
  const setupSummary = document.getElementById('setup-summary');
  let currentStep = 0;

  // Initialize steps
  function showStep(stepIndex) {
    steps.forEach((step, index) => {
      step.classList.toggle('active', index === stepIndex);
    });
    
    prevBtn.disabled = stepIndex === 0;
    nextBtn.textContent = stepIndex === steps.length - 1 ? 'Finish Setup' : 'Next';
    stepIndicator.textContent = `Step ${stepIndex + 1} of ${steps.length}`;
    
    if (stepIndex === steps.length - 1) {
      // Show summary on last step
      const username = document.getElementById('github-username').value;
      const repo = document.getElementById('repo-name').value;
      setupSummary.innerHTML = `
        <p><strong>Username:</strong> ${username}</p>
        <p><strong>Repository:</strong> ${repo}</p>
        <p class="mt-2 text-green-600">Your CMS will be configured with these settings.</p>
      `;
    }
  }

  // Validate current step
  function validateStep(stepIndex) {
    if (stepIndex === 0) {
      const username = document.getElementById('github-username').value.trim();
      const repo = document.getElementById('repo-name').value.trim();
      return username.length > 0 && repo.length > 0;
    }
    if (stepIndex === 1) {
      return document.getElementById('github-token').value.trim().length > 0;
    }
    return true;
  }

  // Navigation handlers
  prevBtn.addEventListener('click', () => {
    if (currentStep > 0) {
      currentStep--;
      showStep(currentStep);
    }
  });

  nextBtn.addEventListener('click', () => {
    if (!validateStep(currentStep)) {
      alert('Please fill in all required fields');
      return;
    }

    if (currentStep < steps.length - 1) {
      currentStep++;
      showStep(currentStep);
    } else {
      // Save configuration
      const config = {
        owner: document.getElementById('github-username').value.trim(),
        repo: document.getElementById('repo-name').value.trim(),
        token: document.getElementById('github-token').value.trim()
      };

      // Store in localStorage
      localStorage.setItem('github-cms-config', JSON.stringify(config));
      
      // Redirect to admin dashboard
      window.location.href = '/admin/';
    }
  });

  // Initialize
  showStep(0);
});
