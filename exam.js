document.addEventListener('DOMContentLoaded', async () => {
  await checkUserType();

  const confirmModal = document.getElementById('confirm-modal');
  const confirmYes = document.getElementById('confirm-yes');
  const confirmNo = document.getElementById('confirm-no');

  const urlParams = new URLSearchParams(location.search);
  const examId = urlParams.get('id');
  const encodedData = urlParams.get('data');
  const examTitleEl = document.getElementById('exam-title');
  const startBtn = document.getElementById('start-btn');
  const nameInput = document.getElementById('student-name');
  const quizArea = document.getElementById('quiz-area');
  const entryArea = document.getElementById('entry-area');
  const quizContainer = document.getElementById('quiz-container');
  const submitBtn = document.getElementById('submit-btn');
  const downloadBtn = document.getElementById('download-btn');
  const timerOverlay = document.getElementById('timer-overlay');
  const resultContainer = document.getElementById('result-container');
  const cheatingOverlay = document.getElementById('cheating-overlay');

  let examPayload = null;
  let questions = [];
  let durationMinutes = 30;
  let selectedAnswers = [];
  let cheatingAttempts = 0;
  let cheatingActive = false;
  let countdownInterval = null;
  let totalSeconds = 0;
  let studentName = '';
  let examStartedAt = null;
  let teacherId = null;

  async function checkUserType() {
    try {
      const { data: { user } } = await window.AUTH.getCurrentUser();
      if (user) {
        window.location.href = 'index.html';
      }
    } catch (error) {}
  }

  if (encodedData) {
    try {
      const decodedData = decodeURIComponent(encodedData);
      const jsonString = atob(decodedData);
      examPayload = JSON.parse(jsonString);
      loadExamFromPayload();
    } catch (error) {
      examTitleEl.textContent = 'Invalid preview data';
      entryArea.innerHTML = '<p>Could not load preview exam.</p>';
      return;
    }
  } else if (examId) {
    await loadExamFromDatabase(examId);
  } else {
    examTitleEl.textContent = 'Missing exam data';
    entryArea.innerHTML = '<p>Invalid or missing exam link.</p>';
    return;
  }

  async function loadExamFromDatabase(examId) {
    if (!window.SUPABASE) {
      examTitleEl.textContent = 'Database not configured';
      entryArea.innerHTML = '<p>System configuration error.</p>';
      return;
    }

    try {
      const { data, error } = await window.SUPABASE
        .from('exams')
        .select('*')
        .eq('id', examId)
        .single();
      
      if (error || !data) {
        examTitleEl.textContent = 'Exam not found';
        entryArea.innerHTML = '<p>The requested exam could not be found. Please check the link and try again.</p>';
        return;
      }
      
      examPayload = {
        title: data.title,
        duration: data.duration_minutes,
        questions: data.questions
      };
      teacherId = data.teacher_id;
      
      loadExamFromPayload();
    } catch (error) {
      examTitleEl.textContent = 'Error loading exam';
      entryArea.innerHTML = '<p>An unexpected error occurred while loading the exam.</p>';
    }
  }

  function loadExamFromPayload() {
    examTitleEl.textContent = examPayload.title || 'Exam';
    questions = examPayload.questions || [];
    durationMinutes = parseInt(examPayload.duration) || 30;
    selectedAnswers = new Array(questions.length);

    const meta = document.createElement('div');
    meta.className = 'muted';
    meta.innerHTML = `Questions: ${questions.length} • Duration: ${durationMinutes} minutes`;
    examTitleEl.parentNode.insertBefore(meta, examTitleEl.nextSibling);
  }

  function renderQuestions(){
    quizContainer.innerHTML = '';
    questions.forEach((q, idx) => {
      const qDiv = document.createElement('div');
      qDiv.className = 'question';
      let imgHTML = '';
      if (q.question_image) imgHTML = `<img src="${q.question_image}" class="question-image" alt="qimg">`;
      qDiv.innerHTML = `<p><strong>Q${idx+1}:</strong> ${escapeHtml(q.question)}</p>${imgHTML}`;
      q.options.forEach(opt => {
        const optDiv = document.createElement('div');
        optDiv.className = 'option';
        optDiv.tabIndex = 0;
        optDiv.textContent = opt;
        optDiv.addEventListener('click', () => {
          if (!cheatingActive) return;
          selectedAnswers[idx] = opt;
          Array.from(qDiv.getElementsByClassName('option')).forEach(o=>o.classList.remove('selected'));
          optDiv.classList.add('selected');
        });
        qDiv.appendChild(optDiv);
      });
      const expDiv = document.createElement('div');
      expDiv.className = 'explanation';
      expDiv.style.display = 'none';
      qDiv.appendChild(expDiv);
      quizContainer.appendChild(qDiv);
    });
  }

  function formatTime(s){
    const m = Math.floor(s/60).toString().padStart(2,'0');
    const sec = (s%60).toString().padStart(2,'0');
    return `${m}:${sec}`;
  }

  function startTimer() {
    totalSeconds = durationMinutes * 60;
    timerOverlay.style.display = 'flex';
    timerOverlay.textContent = formatTime(totalSeconds);
    countdownInterval = setInterval(()=> {
      if (totalSeconds <= 0) {
        clearInterval(countdownInterval);
        timerOverlay.textContent = "Time's Up!";
        timerOverlay.style.color = '#e74c3c';
        finishExam(true);
      } else {
        timerOverlay.textContent = formatTime(totalSeconds);
        totalSeconds--;
      }
    }, 1000);
  }

  function showToast(msg, kind = 'warn', persist = false) {
    let t = document.createElement('div');
    t.className = 'toast ' + kind;
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.classList.add('visible'), 20);
    if (!persist) {
      setTimeout(() => {
        t.classList.remove('visible');
        setTimeout(() => t.remove(), 300);
      }, 3000);
    }
  }

  function showCheatingOverlay(message, persist = false) {
    cheatingOverlay.textContent = message;
    cheatingOverlay.classList.remove('hidden');
    cheatingOverlay.style.display = 'flex';
    if (!persist) {
      setTimeout(() => {
        cheatingOverlay.classList.add('hidden');
        cheatingOverlay.style.display = 'none';
      }, 2000);
    } else {
      cheatingOverlay.style.backgroundColor = 'rgba(255,0,0,0.9)';
      cheatingOverlay.style.color = 'white';
      cheatingOverlay.style.fontSize = '28px';
      cheatingOverlay.style.justifyContent = 'center';
      cheatingOverlay.style.alignItems = 'center';
      cheatingOverlay.style.zIndex = 99999;
    }
  }

  function setupCheatingDetection() {
    function flagCheat(reason) {
      if (!cheatingActive) return;
      cheatingAttempts++;
      if (cheatingAttempts < 3) {
        showToast(`Cheating detected: ${reason}. Warning ${cheatingAttempts}/3`, 'warn');
        showCheatingOverlay(`Cheating detected (${cheatingAttempts}/3)`, false);
      } else {
        showCheatingOverlay(`Cheating detected! Attempt #${cheatingAttempts}. Exam submitted.`, true);
        finishExam(true);
      }
    }

    document.addEventListener('visibilitychange', () => {  
      if (document.hidden) flagCheat('Tab switched or minimized');  
    });  

    window.addEventListener('blur', () => {  
      flagCheat('Window lost focus');  
    });  

    document.addEventListener('keydown', (e) => {  
      if (!cheatingActive) return;  
      const allowedKeys = [9, 13, 32, 37, 38, 39, 40, 8, 46];
      if (allowedKeys.includes(e.keyCode)) return;  
      flagCheat('Key pressed');  
      e.preventDefault();  
    });  

    document.addEventListener('contextmenu', (e) => {  
      e.preventDefault();  
      flagCheat('Right-click');  
    });  

    document.addEventListener('copy', (e) => {  
      e.preventDefault();  
      flagCheat('Copy attempt');  
    });  

    document.addEventListener('paste', (e) => {  
      e.preventDefault();  
      flagCheat('Paste attempt');  
    });  

    const target = document.getElementById('main-container');  
    const io = new IntersectionObserver(entries => {  
      entries.forEach(ent => {  
        if (ent.intersectionRatio === 0) {  
          flagCheat('Exam container hidden');  
        }  
      });  
    }, { threshold: 0 });  
    io.observe(target);
  }

  async function finishExam(isAuto = false) {
    cheatingActive = false;
    if (countdownInterval) clearInterval(countdownInterval);

    let correct = 0;  
    const quizDivs = document.getElementsByClassName('question');  
    for (let i = 0; i < questions.length; i++) {  
      const q = questions[i];  
      const options = quizDivs[i].getElementsByClassName('option');  
      const expDiv = quizDivs[i].getElementsByClassName('explanation')[0];  
      for (let o of options) {  
        o.classList.remove('correct', 'wrong', 'selected');  
        if (o.textContent === q.answer) {  
          o.classList.add('correct');  
          if (selectedAnswers[i] === q.answer) correct++;  
        } else if (o.textContent === selectedAnswers[i]) {  
          o.classList.add('wrong');  
        }  
      }  
      expDiv.style.display = 'block';  
      let explanationHTML = `<strong>Explanation:</strong> ${escapeHtml(q.explanation || 'No explanation provided.')}`;  
      if (q.explanation_image) explanationHTML += `<br><img src="${q.explanation_image}" style="max-width:100%; margin-top:8px;">`;  
      expDiv.innerHTML = explanationHTML;  
    }  

    const percent = Math.round((correct / questions.length) * 100);  
    let rating = '';  
    if (percent === 100) rating = "Perfect! You're a genius!";  
    else if (percent >= 95) rating = "Outstanding!";  
    else if (percent >= 90) rating = "Excellent work!";  
    else if (percent >= 85) rating = "Very impressive!";  
    else if (percent >= 80) rating = "Great job!";  
    else if (percent >= 75) rating = "Well done!";  
    else if (percent >= 70) rating = "Good effort!";  
    else if (percent >= 65) rating = "You're getting there!";  
    else if (percent >= 60) rating = "Fair try!";  
    else if (percent >= 55) rating = "Needs improvement!";  
    else if (percent >= 50) rating = "Just made it!";  
    else rating = "Keep practicing!";  

    resultContainer.innerHTML = `  
      <div class="result-card">  
        <h3>Student: <span>${escapeHtml(studentName)}</span></h3>  
        <p>Score: <strong>${correct}/${questions.length}</strong> (${percent}%)</p>  
        <p>${rating}</p>  
        <p class="muted">Cheating attempts: ${cheatingAttempts}</p>  
      </div>  
    `;  
    submitBtn.disabled = true;  
    downloadBtn.style.display = 'inline-block';  

    if (window.SUPABASE && examId && teacherId) {  
      try {  
        await window.SUPABASE.from('results').insert([{  
          exam_id: examId,  
          teacher_id: teacherId,
          student_name: studentName,  
          score: correct,  
          total_questions: questions.length,  
          percent: percent,  
          rating: rating,  
          answers: selectedAnswers,  
          cheating_attempts: cheatingAttempts,  
          started_at: examStartedAt?.toISOString(),  
          finished_at: new Date().toISOString()  
        }]);  
      } catch (e) {}  
    }
  }

  downloadBtn.addEventListener('click', () => {
    const cleanContent = document.createElement('div');
    cleanContent.style.padding = '20px';
    cleanContent.style.fontFamily = 'Inter, Arial, sans-serif';
    cleanContent.style.maxWidth = '800px';
    cleanContent.style.margin = '0 auto';

    let correct = 0;
    questions.forEach((q, i) => {
      if (selectedAnswers[i] === q.answer) correct++;
    });
    const percent = Math.round((correct / questions.length) * 100);

    cleanContent.innerHTML = `  
      <div style="text-align:center; margin-bottom:30px; border-bottom:2px solid #8e44ad; padding-bottom:20px;">  
        <h1 style="color:#8e44ad; margin:0;">${escapeHtml(examPayload.title)}</h1>  
        <h2 style="color:#6c3483; margin:10px 0;">Exam Result</h2>  
        <p style="font-size:18px; margin:10px 0;">  
          Student: <strong>${escapeHtml(studentName)}</strong>  
        </p>  
        <p style="font-size:20px; color:#2ecc71;">  
          Score: ${correct}/${questions.length} (${percent}%)  
        </p>  
        ${cheatingAttempts > 0 ?   
          `<p style="color:#e74c3c; font-weight:bold;">Cheating attempts: ${cheatingAttempts}</p>` : ''}  
      </div>  
    `;  

    const questionsHtml = questions.map((q, idx) => {  
      const userAnswer = selectedAnswers[idx] || 'Not answered';  
      const isCorrect = userAnswer === q.answer;  
      return `  
        <div style="margin-bottom:25px; padding-bottom:15px; border-bottom:1px solid #eee;">  
          <p style="font-weight:bold; margin:0 0 10px 0;">  
            Q${idx + 1}: ${escapeHtml(q.question)}  
          </p>  
          <p style="margin:8px 0; color:${isCorrect ? '#27ae60' : '#e74c3c'};">  
            <strong>Your Answer:</strong> ${escapeHtml(userAnswer)}   
            ${isCorrect ? '✅' : '❌'}  
          </p>  
          <p style="margin:8px 0;">  
            <strong>Correct Answer:</strong> ${escapeHtml(q.answer)}  
          </p>  
          <p style="margin:8px 0; color:#555;">  
            <strong>Explanation:</strong> ${escapeHtml(q.explanation || 'No explanation provided.')}  
          </p>  
          ${q.explanation_image ?   
            `<img src="${q.explanation_image}" style="max-width:100%; margin-top:8px; border-radius:4px;">` : ''}  
        </div>  
      `;  
    }).join('');  

    cleanContent.innerHTML += questionsHtml;  

    const opt = {  
      margin: 10,  
      filename: `${examPayload.title.replace(/\s+/g, '_')}_Result_${studentName.replace(/\s+/g, '_')}.pdf`,  
      image: { type: 'jpeg', quality: 0.98 },  
      html2canvas: { scale: 2 },  
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }  
    };  

    html2pdf().set(opt).from(cleanContent).save();
  });

  startBtn.addEventListener('click', async () => {
    const name = nameInput.value.trim();
    if (!name) { showToast('Please enter your name', 'warn'); return; }
    studentName = name;
    entryArea.style.display = 'none';
    quizArea.style.display = 'block';
    renderQuestions();
    showToast('Exam starts in 5 seconds', 'info');
    setTimeout(() => {
      examStartedAt = new Date();
      cheatingActive = true;
      setupCheatingDetection();
      startTimer();
      showToast('Exam started — Good luck!', 'success');
    }, 5000);
  });

  submitBtn.addEventListener('click', (e) => {
    e.preventDefault();
    confirmModal.style.display = 'flex';
  });

  confirmYes.addEventListener('click', () => {
    confirmModal.style.display = 'none';
    finishExam(false);
  });

  confirmNo.addEventListener('click', () => {
    confirmModal.style.display = 'none';
  });

  confirmModal.addEventListener('click', (e) => {
    if (e.target === confirmModal) {
      confirmModal.style.display = 'none';
    }
  });

  function escapeHtml(s){ 
    return (s||'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); 
  }
});
