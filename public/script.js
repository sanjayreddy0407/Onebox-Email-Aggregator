const API_BASE = 'http://localhost:3000/api';

let currentEmails = [];
let selectedEmailId = null;

// Load emails on page load
document.addEventListener('DOMContentLoaded', () => {
  loadStats();
  loadEmails();
});

// Load statistics
async function loadStats() {
  try {
    const response = await fetch(`${API_BASE}/emails/stats/categories`);
    const data = await response.json();

    if (data.success) {
      const stats = data.data;
      document.getElementById('interestedCount').textContent = stats.interested || 0;
      document.getElementById('meetingCount').textContent = stats.meeting_booked || 0;
      document.getElementById('spamCount').textContent = stats.spam || 0;
      
      const total = Object.values(stats).reduce((sum, count) => sum + count, 0);
      document.getElementById('totalEmails').textContent = total;
    }
  } catch (error) {
    console.error('Failed to load stats:', error);
  }
}

// Load emails with optional filters
async function loadEmails(query = {}) {
  const loading = document.getElementById('loading');
  const emailList = document.getElementById('emailList');
  
  loading.style.display = 'block';
  
  try {
    const params = new URLSearchParams();
    if (query.q) params.append('q', query.q);
    if (query.category) params.append('category', query.category);
    if (query.accountId) params.append('accountId', query.accountId);
    params.append('limit', '100');

    const response = await fetch(`${API_BASE}/emails?${params}`);
    const data = await response.json();

    if (data.success) {
      currentEmails = data.data.emails;
      displayEmails(currentEmails);
    }
  } catch (error) {
    console.error('Failed to load emails:', error);
    emailList.innerHTML = '<div class="loading">Failed to load emails. Please check if the server is running.</div>';
  } finally {
    loading.style.display = 'none';
  }
}

// Display emails in the list
function displayEmails(emails) {
  const emailList = document.getElementById('emailList');
  
  if (emails.length === 0) {
    emailList.innerHTML = '<div class="loading">No emails found</div>';
    return;
  }

  emailList.innerHTML = emails.map(email => `
    <div class="email-item ${email.id === selectedEmailId ? 'active' : ''}" onclick="selectEmail('${email.id}')">
      <div class="email-from">
        <span>${escapeHtml(email.from)}</span>
        <span class="email-category category-${email.category}">${formatCategory(email.category)}</span>
      </div>
      <div class="email-subject">${escapeHtml(email.subject)}</div>
      <div class="email-preview">${escapeHtml(email.body.substring(0, 100))}...</div>
      <div class="email-date">${formatDate(email.date)}</div>
    </div>
  `).join('');
}

// Select and display email details
async function selectEmail(emailId) {
  selectedEmailId = emailId;
  const email = currentEmails.find(e => e.id === emailId);
  
  if (!email) return;

  // Update active state
  displayEmails(currentEmails);

  const emailDetail = document.getElementById('emailDetail');
  emailDetail.innerHTML = `
    <div class="email-detail-header">
      <div class="email-detail-subject">${escapeHtml(email.subject)}</div>
      <div class="email-detail-meta">
        <span class="meta-label">From:</span>
        <span>${escapeHtml(email.from)}</span>
        
        <span class="meta-label">To:</span>
        <span>${escapeHtml(email.to.join(', '))}</span>
        
        <span class="meta-label">Date:</span>
        <span>${formatDate(email.date)}</span>
        
        <span class="meta-label">Category:</span>
        <span class="email-category category-${email.category}">${formatCategory(email.category)}</span>
        
        <span class="meta-label">Account:</span>
        <span>${email.accountId}</span>
      </div>
    </div>
    
    <div class="email-detail-body">
      ${escapeHtml(email.body)}
    </div>
    
    <button onclick="getSuggestedReply('${emailId}')" class="btn btn-success">
      🤖 Get AI Reply Suggestion
    </button>
    
    <div id="replySuggestion"></div>
  `;
}

// Get AI-powered reply suggestion
async function getSuggestedReply(emailId) {
  const replySuggestion = document.getElementById('replySuggestion');
  replySuggestion.innerHTML = '<div class="loading">Generating AI reply suggestion...</div>';

  try {
    const response = await fetch(`${API_BASE}/emails/${emailId}/suggest-reply`, {
      method: 'POST'
    });
    const data = await response.json();

    if (data.success) {
      const suggestion = data.data;
      replySuggestion.innerHTML = `
        <div class="reply-suggestion">
          <h3>💡 AI-Suggested Reply</h3>
          <div class="reply-text">${escapeHtml(suggestion.reply)}</div>
          <div class="confidence">
            Confidence: ${(suggestion.confidence * 100).toFixed(1)}%
          </div>
        </div>
      `;
    } else {
      replySuggestion.innerHTML = `
        <div class="reply-suggestion">
          <h3>❌ Error</h3>
          <p>${data.error}</p>
        </div>
      `;
    }
  } catch (error) {
    console.error('Failed to get reply suggestion:', error);
    replySuggestion.innerHTML = `
      <div class="reply-suggestion">
        <h3>❌ Error</h3>
        <p>Failed to generate reply suggestion. Please try again.</p>
      </div>
    `;
  }
}

// Search emails
function searchEmails() {
  const query = document.getElementById('searchInput').value;
  loadEmails({ q: query });
}

// Apply filters
function applyFilters() {
  const category = document.getElementById('categoryFilter').value;
  const accountId = document.getElementById('accountFilter').value;
  const query = document.getElementById('searchInput').value;

  loadEmails({
    q: query || undefined,
    category: category || undefined,
    accountId: accountId || undefined
  });
}

// Clear filters
function clearFilters() {
  document.getElementById('searchInput').value = '';
  document.getElementById('categoryFilter').value = '';
  document.getElementById('accountFilter').value = '';
  loadEmails();
}

// Utility: Format date
function formatDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now - date);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
}

// Utility: Format category
function formatCategory(category) {
  return category.replace(/_/g, ' ').toUpperCase();
}

// Utility: Escape HTML
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Enable search on Enter key
document.getElementById('searchInput').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    searchEmails();
  }
});

// Refresh stats every 30 seconds
setInterval(loadStats, 30000);

// Refresh emails every 60 seconds
setInterval(() => {
  const query = document.getElementById('searchInput').value;
  const category = document.getElementById('categoryFilter').value;
  const accountId = document.getElementById('accountFilter').value;
  
  loadEmails({
    q: query || undefined,
    category: category || undefined,
    accountId: accountId || undefined
  });
}, 60000);
