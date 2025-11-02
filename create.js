document.addEventListener('DOMContentLoaded', async () => {
  await checkAuthentication();
  initializeApp();
});

async function checkAuthentication() {
  try {
    const { data: { user } } = await window.AUTH.getCurrentUser();
    if (!user) {
      window.location.href = 'auth.html';
      return;
    }
    
    const storedUser = window.AUTH.getStoredUser();
    if (!storedUser) {
      localStorage.setItem('currentUser', JSON.stringify({
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name
      }));
    }
    
    document.getElementById('user-email').textContent = user.email;
    
    document.getElementById('logout-btn').addEventListener('click', async () => {
      try {
        await window.AUTH.signOut();
        window.location.href = 'auth.html';
      } catch (error) {
        showToast('Logout failed: ' + error.message, 'danger');
      }
    });
    
    return user;
  } catch (error) {
    window.location.href = 'auth.html';
  }
}

function initializeApp() {
  function showToast(msg, kind = 'info') {
    const t = document.createElement('div');
    t.className = 'toast ' + kind;
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.classList.add('visible'), 20);
    setTimeout(() => {
      t.classList.remove('visible');
      setTimeout(() => t.remove(), 300);
    }, 3000);
  }

  const modeManualBtn = document.getElementById('mode-manual');
  const modeJsonBtn = document.getElementById('mode-json');
  const manualSection = document.getElementById('manual-section');
  const jsonSection = document.getElementById('json-section');
  const fileInput = document.getElementById('file-input');
  const fileNameDisplay = document.getElementById('file-name');
  const questionsContainer = document.getElementById('questions-container');
  const addQuestionBtn = document.getElementById('add-question');
  const examTitleInput = document.getElementById('exam-title');
  const examDurationInput = document.getElementById('exam-duration');
  const saveBtn = document.getElementById('save-btn');
  const previewBtn = document.getElementById('preview-btn');
  const linkArea = document.getElementById('link-area');
  const shareLink = document.getElementById('share-link');
  const copyBtn = document.getElementById('copy-btn');
  const shortenStatus = document.getElementById('shorten-status');
  const examsList = document.getElementById('exams-list');
  const deleteAllBtn = document.getElementById('delete-all-btn');
  const deleteModal = document.getElementById('delete-modal');
  const confirmDelete = document.getElementById('confirm-delete');
  const cancelDelete = document.getElementById('cancel-delete');

  let currentMode = 'manual';
  let uploadedQuestions = null;

  modeManualBtn.addEventListener('click', () => {
    currentMode = 'manual';
    manualSection.style.display = 'block';
    jsonSection.style.display = 'none';
    modeManualBtn.classList.add('active-mode');
    modeJsonBtn.classList.remove('active-mode');
  });

  modeJsonBtn.addEventListener('click', () => {
    currentMode = 'json';
    manualSection.style.display = 'none';
    jsonSection.style.display = 'block';
    modeJsonBtn.classList.add('active-mode');
    modeManualBtn.classList.remove('active-mode');
  });

  function addQuestionForm(index) {
    const qDiv = document.createElement('div');
    qDiv.className = 'question-form';
    qDiv.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-top:16px;">
        <strong>Question ${index + 1}</strong>
        <button type="button" class="btn ghost small remove-q">Remove</button>
      </div>
      <textarea placeholder="Enter question..." rows="2" class="q-text"></textarea>
      <label style="margin-top:10px;">Options (one per line)</label>
      <textarea placeholder="Option A\nOption B\nOption C\nOption D" rows="4" class="q-options"></textarea>
      <label style="margin-top:10px;">Correct Answer</label>
      <div class="radio-group" data-index="${index}"></div>
      <label style="margin-top:10px;">Explanation (optional)</label>
      <textarea placeholder="Why is this correct?" rows="2" class="q-explanation"></textarea>
      <hr style="margin:16px 0; border-color:#f0e6ff;"/>
    `;
    questionsContainer.appendChild(qDiv);

    const optionsTextarea = qDiv.querySelector('.q-options');
    const radioGroup = qDiv.querySelector('.radio-group');

    optionsTextarea.addEventListener('input', () => {
      const options = optionsTextarea.value
        .split('\n')
        .map(opt => opt.trim())
        .filter(opt => opt);
      radioGroup.innerHTML = '';
      options.forEach(opt => {
        const label = document.createElement('label');
        label.style.display = 'block';
        label.style.margin = '6px 0';
        label.innerHTML = `<input type="radio" name="correct-${index}" value="${escapeHtml(opt)}"> ${escapeHtml(opt)}`;
        radioGroup.appendChild(label);
      });
    });

    qDiv.querySelector('.remove-q').addEventListener('click', () => qDiv.remove());
  }

  addQuestionForm(0);

  addQuestionBtn.addEventListener('click', () => {
    const index = document.querySelectorAll('.question-form').length;
    addQuestionForm(index);
  });

  fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) {
      fileNameDisplay.textContent = 'No file chosen';
      uploadedQuestions = null;
      return;
    }
    
    fileNameDisplay.textContent = file.name;
    
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (!Array.isArray(parsed)) throw new Error('Must be an array');
      for (const q of parsed) {
        if (!q.question || !Array.isArray(q.options) || !q.answer) throw new Error('Invalid format');
      }
      uploadedQuestions = parsed;
      showToast(`Loaded ${parsed.length} questions from JSON.`, 'success');
    } catch (err) {
      showToast('Invalid JSON: ' + err.message, 'danger');
      fileInput.value = '';
      fileNameDisplay.textContent = 'No file chosen';
      uploadedQuestions = null;
    }
  });

  async function shortenUrl(longUrl) {
    try {
      const response = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(longUrl)}`);
      if (!response.ok) throw new Error('TinyURL failed');
      return await response.text();
    } catch (e) {
      return longUrl;
    }
  }

  saveBtn.addEventListener('click', async () => {
    if (!window.SUPABASE) {
      showToast('Supabase not configured. Check config.js.', 'danger');
      return;
    }

    const user = window.AUTH.getStoredUser();
    if (!user) {
      showToast('Please login again.', 'danger');
      window.location.href = 'auth.html';
      return;
    }

    const title = examTitleInput.value.trim() || 'Untitled Exam';
    const duration = parseInt(examDurationInput.value) || 30;
    let questions = [];

    if (currentMode === 'manual') {
      const forms = document.querySelectorAll('.question-form');
      for (const form of forms) {
        const qText = form.querySelector('.q-text').value.trim();
        const optionsRaw = form.querySelector('.q-options').value;
        const explanation = form.querySelector('.q-explanation').value.trim();
        const correctRadio = form.querySelector('input[type="radio"]:checked');

        if (!qText || !optionsRaw.trim()) {
          showToast('Fill all questions and options.', 'warn');
          return;
        }

        const options = optionsRaw.split('\n').map(opt => opt.trim()).filter(opt => opt);
        if (options.length < 2) {
          showToast('Each question needs ≥2 options.', 'warn');
          return;
        }

        const correctAnswer = correctRadio ? correctRadio.value : options[0];
        questions.push({
          question: qText,
          options: options,
          answer: correctAnswer,
          explanation: explanation || 'No explanation.',
          question_image: null,
          explanation_image: null
        });
      }
      if (questions.length === 0) {
        showToast('Add at least one question.', 'warn');
        return;
      }
    } else {
      if (!uploadedQuestions) {
        showToast('Upload a valid JSON file.', 'warn');
        return;
      }
      questions = uploadedQuestions;
    }

    const { data, error } = await window.SUPABASE
      .from('exams')
      .insert([{ 
        title, 
        duration_minutes: duration, 
        questions,
        teacher_id: user.id 
      }])
      .select()
      .single();

    if (error) {
      showToast('Save failed: ' + (error.message || 'Unknown error'), 'danger');
      return;
    }

    const longUrl = `${window.location.origin}${window.location.pathname.replace(/\/[^/]*$/, '')}/exam.html?id=${data.id}`;
    shortenStatus.textContent = 'Shortening link...';
    const shortUrl = await shortenUrl(longUrl);

    shareLink.value = shortUrl;
    linkArea.style.display = 'block';
    shortenStatus.textContent = shortUrl === longUrl ? 'Used long URL' : 'Short link ready!';
    copyBtn.textContent = 'Copy Link';

    fetchExams();
  });

  copyBtn.addEventListener('click', async () => {
    await navigator.clipboard.writeText(shareLink.value);
    copyBtn.textContent = 'Copied!';
    setTimeout(() => copyBtn.textContent = 'Copy Link', 1500);
  });

  previewBtn.addEventListener('click', () => {
    let questions = [];
    if (currentMode === 'manual') {
      const forms = document.querySelectorAll('.question-form');
      for (const form of forms) {
        const qText = form.querySelector('.q-text').value.trim();
        const optionsRaw = form.querySelector('.q-options').value;
        const explanation = form.querySelector('.q-explanation').value.trim();
        const correctRadio = form.querySelector('input[type="radio"]:checked');
        if (!qText || !optionsRaw.trim()) continue;
        const options = optionsRaw.split('\n').map(opt => opt.trim()).filter(opt => opt);
        const correctAnswer = correctRadio ? correctRadio.value : options[0];
        questions.push({
          question: qText,
          options: options,
          answer: correctAnswer,
          explanation: explanation || 'No explanation.',
          question_image: null,
          explanation_image: null
        });
      }
      if (questions.length === 0) {
        showToast('Add a question to preview.', 'warn');
        return;
      }
    } else {
      if (!uploadedQuestions) {
        showToast('Upload JSON or switch to manual.', 'warn');
        return;
      }
      questions = uploadedQuestions;
    }

    const payload = { title: examTitleInput.value.trim() || 'Preview', duration: parseInt(examDurationInput.value) || 30, questions };
    const encoded = encodeURIComponent(btoa(unescape(encodeURIComponent(JSON.stringify(payload)))));
    window.open(`${window.location.origin}${window.location.pathname.replace(/\/[^/]*$/, '')}/exam.html?data=${encoded}`, '_blank');
  });

  async function fetchExams() {
    if (!window.SUPABASE) {
      examsList.innerHTML = '<div class="muted">Supabase not available.</div>';
      return;
    }

    const user = window.AUTH.getStoredUser();
    if (!user) return;

    const { data, error } = await window.SUPABASE
      .from('exams')
      .select('*')
      .eq('teacher_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    examsList.innerHTML = error ? `<div class="muted">Load failed.</div>` :
      (data.length === 0 ? `<div class="muted">No exams yet. Create your first exam above!</div>` :
        data.map(ex => `
          <div class="exam-row" style="display: flex; justify-content: space-between; align-items: center; padding: 12px; border-bottom: 1px solid #f0e6ff;">
            <div>
              <strong>${escapeHtml(ex.title)}</strong>
              <div class="muted">Q: ${ex.questions.length} • ${ex.duration_minutes} min • ${new Date(ex.created_at).toLocaleDateString()}</div>
            </div>
            <div style="display: flex; gap: 8px;">
              <button class="btn small" data-id="${ex.id}">Copy Link</button>
              <button class="btn red small delete-exam" data-id="${ex.id}">Delete</button>
            </div>
          </div>
        `).join(''));

    examsList.querySelectorAll('[data-id]').forEach(btn => {
      if (btn.classList.contains('delete-exam')) {
        btn.addEventListener('click', async (e) => {
          const id = e.target.dataset.id;
          if (confirm('Are you sure you want to delete this exam? All associated results will also be deleted.')) {
            await deleteExam(id);
          }
        });
      } else {
        btn.addEventListener('click', async (e) => {
          const id = e.target.dataset.id;
          const link = `${window.location.origin}${window.location.pathname.replace(/\/[^/]*$/, '')}/exam.html?id=${id}`;
          await navigator.clipboard.writeText(link);
          e.target.textContent = 'Copied!';
          setTimeout(() => e.target.textContent = 'Copy Link', 1500);
        });
      }
    });
  }

  async function deleteExam(examId) {
    const { error } = await window.SUPABASE
      .from('exams')
      .delete()
      .eq('id', examId);

    if (error) {
      showToast('Delete failed: ' + error.message, 'danger');
    } else {
      showToast('Exam deleted successfully', 'success');
      fetchExams();
    }
  }

  async function deleteAllExams() {
    const user = window.AUTH.getStoredUser();
    if (!user) return;

    const { error } = await window.SUPABASE
      .from('exams')
      .delete()
      .eq('teacher_id', user.id);

    if (error) {
      showToast('Delete failed: ' + error.message, 'danger');
    } else {
      showToast('All exams deleted successfully', 'success');
      fetchExams();
    }
  }

  deleteAllBtn.addEventListener('click', () => {
    deleteModal.style.display = 'flex';
  });

  confirmDelete.addEventListener('click', async () => {
    deleteModal.style.display = 'none';
    await deleteAllExams();
  });

  cancelDelete.addEventListener('click', () => {
    deleteModal.style.display = 'none';
  });

  deleteModal.addEventListener('click', (e) => {
    if (e.target === deleteModal) {
      deleteModal.style.display = 'none';
    }
  });

  function escapeHtml(s) {
    return (s || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  fetchExams();
}