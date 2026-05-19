/* ════════════════════════════════════════════════════════════════════
   LESSON TEACHER — MONTHLY PARENT REPORT GENERATOR
   ────────────────────────────────────────────────────────────────────
   Reads the locally-persisted progress (_sessionProgress, lt_progress_v2)
   and asks the AI to write a warm, parent-friendly monthly progress
   report — same thing the £80/month tutoring platforms send out. Then
   offers print / copy / email-share.

   Public API:
     LTParentReport.open()  — opens the report modal
     LTParentReport.close()
   ════════════════════════════════════════════════════════════════════ */
(function(){
  if (window.LTParentReport) return;
  'use strict';

  function injectStyles(){
    if (document.getElementById('lt-prep-css')) return;
    var css = [
      '.lt-prep-overlay{position:fixed;inset:0;background:rgba(15,23,42,.55);z-index:2147483645;display:flex;align-items:center;justify-content:center;padding:20px;font-family:var(--pp-sans,system-ui)}',
      '.lt-prep-panel{width:100%;max-width:780px;max-height:90vh;background:#fbf8f1;border-radius:14px;border:1px solid var(--pp-line,#d8d2bf);display:flex;flex-direction:column;color:var(--pp-navy,#142028);overflow:hidden;box-shadow:0 24px 60px rgba(15,23,42,.35)}',
      '.lt-prep-head{padding:18px 22px;border-bottom:1px solid var(--pp-line,#d8d2bf);background:#264e36;color:#fbf8f1;display:flex;align-items:center;gap:14px}',
      '.lt-prep-head h2{margin:0;font-family:var(--pp-serif,Georgia,serif);font-weight:500;font-size:1.3rem}',
      '.lt-prep-head h2 small{display:block;font-size:.72rem;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:rgba(251,248,241,.7);margin-top:2px}',
      '.lt-prep-head .lt-prep-close{margin-left:auto;background:transparent;border:1px solid rgba(251,248,241,.3);color:#fbf8f1;padding:6px 14px;border-radius:100px;font-family:inherit;font-weight:700;cursor:pointer;font-size:.82rem}',
      '.lt-prep-head .lt-prep-close:hover{background:rgba(251,248,241,.12)}',
      '.lt-prep-body{flex:1;overflow-y:auto;padding:24px 26px;font-size:.96rem;line-height:1.65;color:var(--pp-navy)}',
      '.lt-prep-body h3{font-family:var(--pp-serif,Georgia,serif);font-size:1.15rem;font-weight:500;color:#264e36;margin:18px 0 8px}',
      '.lt-prep-body h3:first-child{margin-top:0}',
      '.lt-prep-body strong{color:#264e36}',
      '.lt-prep-body ul{padding-left:22px;margin:8px 0}',
      '.lt-prep-body li{margin-bottom:5px}',
      '.lt-prep-stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px;margin:0 0 18px}',
      '.lt-prep-stat{background:#fff;border:1px solid var(--pp-line,#d8d2bf);border-radius:8px;padding:12px 14px}',
      '.lt-prep-stat .ls-label{font-size:.7rem;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#5b6370}',
      '.lt-prep-stat .ls-value{font-family:var(--pp-serif,Georgia,serif);font-size:1.6rem;font-weight:500;color:#264e36;line-height:1.1;margin-top:4px}',
      '.lt-prep-foot{padding:14px 22px;border-top:1px solid var(--pp-line,#d8d2bf);background:#fbf8f1;display:flex;gap:8px;flex-wrap:wrap;align-items:center}',
      '.lt-prep-foot button{background:#264e36;color:#fbf8f1;border:none;padding:8px 16px;border-radius:8px;font-family:inherit;font-weight:700;cursor:pointer;font-size:.86rem}',
      '.lt-prep-foot button.alt{background:#fff;color:#264e36;border:1px solid #264e36}',
      '.lt-prep-typing{display:flex;align-items:center;gap:10px;color:#264e36;font-weight:700;padding:30px 0}',
      '.lt-prep-typing span{width:8px;height:8px;background:#264e36;border-radius:50%;animation:lt-prep-dot 1s ease-in-out infinite}',
      '.lt-prep-typing span:nth-child(2){animation-delay:.15s}',
      '.lt-prep-typing span:nth-child(3){animation-delay:.3s}',
      '@keyframes lt-prep-dot{0%,100%{opacity:.3;transform:translateY(0)}50%{opacity:1;transform:translateY(-3px)}}',
      'html.dark-mode .lt-prep-panel{background:#0d1117;border-color:rgba(255,255,255,.10);color:#e8edf2}',
      'html.dark-mode .lt-prep-body{color:#e8edf2}',
      'html.dark-mode .lt-prep-stat{background:#131922;border-color:rgba(255,255,255,.10)}',
      'html.dark-mode .lt-prep-foot{background:#0d1117;border-top-color:rgba(255,255,255,.10)}'
    ].join('');
    var s = document.createElement('style');
    s.id = 'lt-prep-css';
    s.textContent = css;
    document.head.appendChild(s);
  }

  // Pull progress from localStorage (single source of truth across reloads)
  function gatherProgress(){
    var prog = {};
    try {
      var raw = localStorage.getItem('lt_progress_v2');
      if (raw) prog = JSON.parse(raw) || {};
    } catch(e){}
    var quiz = prog.quizResults || [];
    var exams = prog.examResults || [];
    var topics = prog.topicsCompletedList || [];
    var sessions = prog.dailySessions || [];
    var since = Date.now() - 30 * 24 * 60 * 60 * 1000;
    function recent(arr){ return arr.filter(function(r){ try { return new Date(r.date).getTime() >= since; } catch(_){ return false; } }); }
    var rQuiz = recent(quiz), rExam = recent(exams), rTopic = recent(topics), rSess = recent(sessions);
    var avgQuiz = rQuiz.length ? Math.round(rQuiz.reduce(function(a,r){ return a + (r.correct/Math.max(1,r.total)); }, 0) / rQuiz.length * 100) : null;
    var avgExam = rExam.length ? Math.round(rExam.reduce(function(a,r){ return a + (r.score||0); }, 0) / rExam.length) : null;
    var subjectCounts = {};
    rTopic.forEach(function(t){ if (t.subj) subjectCounts[t.subj] = (subjectCounts[t.subj]||0) + 1; });
    var weakTopics = rQuiz.filter(function(r){ return (r.correct/Math.max(1,r.total)) < 0.55; }).slice(-6).map(function(r){ return r.subj + ' — ' + r.topic; });
    var strongTopics = rQuiz.filter(function(r){ return (r.correct/Math.max(1,r.total)) >= 0.85; }).slice(-6).map(function(r){ return r.subj + ' — ' + r.topic; });
    return {
      name: prog.name || (window._sessionProgress && window._sessionProgress.name) || 'Your child',
      cls: prog.cls || (window._sessionProgress && window._sessionProgress.cls) || '',
      stream: prog.stream || '',
      xp: prog.xp || 0,
      streak: prog.streak || 0,
      lessons: rTopic.length,
      quizCount: rQuiz.length,
      examCount: rExam.length,
      avgQuiz: avgQuiz,
      avgExam: avgExam,
      sessionsCount: rSess.length,
      subjectCounts: subjectCounts,
      weakTopics: weakTopics,
      strongTopics: strongTopics,
      sinceDate: new Date(since).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}),
      asOfDate: new Date().toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'})
    };
  }

  function buildPrompt(p){
    return 'You are writing a MONTHLY PROGRESS REPORT for a parent — same warm, professional tone the head of a British prep school would use.\n\n'
      + 'STRUCTURE — use these exact h3 headings (## Heading) in this order:\n'
      + '1. ## Summary  — 2-3 sentences capturing the month\'s arc (effort, mood, where they are now).\n'
      + '2. ## What\'s working  — 3 bullet points naming specific subjects/topics where progress is strong.\n'
      + '3. ## Areas to focus on next month  — 2-3 bullets naming specific weak topics with a one-line action for each.\n'
      + '4. ## Recommended weekly plan  — a short paragraph: 4-5 specific things to do at home (e.g. 20 mins of past-paper Maths on Tuesdays).\n'
      + '5. ## A note for the student  — 1-2 encouraging sentences addressed TO the student by name.\n\n'
      + 'TONE: warm, professional, British English, specific (use the actual numbers below). Never patronising. Address the parent as "you" in body, address the student by name in the final note.\n\n'
      + 'STUDENT DATA (for the past 30 days, since ' + p.sinceDate + '):\n'
      + '- Name: ' + p.name + '\n'
      + (p.cls ? '- Year group: ' + p.cls + '\n' : '')
      + '- Lessons completed: ' + p.lessons + '\n'
      + '- Quizzes taken: ' + p.quizCount + (p.avgQuiz != null ? ' (avg score ' + p.avgQuiz + '%)' : '') + '\n'
      + '- Exam papers attempted: ' + p.examCount + (p.avgExam != null ? ' (avg score ' + p.avgExam + '%)' : '') + '\n'
      + '- Active study days: ' + p.sessionsCount + '\n'
      + '- Total XP: ' + p.xp + '   Streak: ' + p.streak + ' days\n'
      + '- Subjects studied (lesson counts): ' + (Object.keys(p.subjectCounts).length ? Object.keys(p.subjectCounts).map(function(k){ return k + '(' + p.subjectCounts[k] + ')'; }).join(', ') : 'none yet') + '\n'
      + '- Strong topics: ' + (p.strongTopics.length ? p.strongTopics.join(' · ') : 'none recorded yet') + '\n'
      + '- Weak topics: ' + (p.weakTopics.length ? p.weakTopics.join(' · ') : 'none flagged yet') + '\n\n'
      + 'Write the report now. Use **bold** for key terms. Keep it under 350 words total.';
  }

  function mdReportToHTML(md){
    if (!md) return '';
    // Convert ## headings + bullets + bold
    var lines = md.split('\n');
    var out = [], inList = false;
    lines.forEach(function(ln){
      var trimmed = ln.trim();
      if (/^##\s+/.test(trimmed)){
        if (inList){ out.push('</ul>'); inList = false; }
        out.push('<h3>' + trimmed.replace(/^##\s+/,'') + '</h3>');
      } else if (/^[-*]\s+/.test(trimmed)){
        if (!inList){ out.push('<ul>'); inList = true; }
        out.push('<li>' + trimmed.replace(/^[-*]\s+/,'') + '</li>');
      } else if (trimmed === ''){
        if (inList){ out.push('</ul>'); inList = false; }
      } else {
        if (inList){ out.push('</ul>'); inList = false; }
        out.push('<p>' + trimmed + '</p>');
      }
    });
    if (inList) out.push('</ul>');
    var html = out.join('\n');
    // Bold
    html = html.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>');
    return html;
  }

  async function fetchReport(prompt){
    try {
      var res = await fetch('/api/anthropic', {
        method:'POST', headers:{'content-type':'application/json'},
        body: JSON.stringify({ model:'claude-sonnet-4-6', max_tokens: 900, system:'You write progress reports for parents of British curriculum students.', messages:[{role:'user', content: prompt}] })
      });
      if (res.ok){
        var d = await res.json();
        var t = (d && d.content || []).find(function(b){ return b.type === 'text'; });
        if (t) return t.text;
      }
    } catch(e){}
    try {
      var res2 = await fetch('/api/openai', {
        method:'POST', headers:{'content-type':'application/json'},
        body: JSON.stringify({ model:'gpt-4o-mini', max_tokens: 900, messages:[{role:'system', content:'You write parent progress reports.'},{role:'user', content: prompt}] })
      });
      if (res2.ok){
        var d2 = await res2.json();
        if (d2 && d2.choices && d2.choices[0]) return d2.choices[0].message.content;
      }
    } catch(e){}
    return '## Summary\nWe could not reach the report server. Please check your internet and try again.\n';
  }

  function open(){
    injectStyles();
    var p = gatherProgress();
    var overlay = document.createElement('div');
    overlay.className = 'lt-prep-overlay';
    overlay.innerHTML = ''
      + '<div class="lt-prep-panel" role="dialog" aria-label="Monthly progress report">'
      +   '<header class="lt-prep-head">'
      +     '<span style="font-size:1.8rem">📑</span>'
      +     '<h2>Monthly Progress Report<small>For the parent / guardian of ' + escapeHTML(p.name) + ' · as of ' + escapeHTML(p.asOfDate) + '</small></h2>'
      +     '<button class="lt-prep-close" type="button">Close</button>'
      +   '</header>'
      +   '<div class="lt-prep-body" id="lt-prep-body">'
      +     '<div class="lt-prep-stats">'
      +       statBlock('Lessons', p.lessons)
      +       statBlock('Quizzes', p.quizCount)
      +       statBlock('Avg quiz', p.avgQuiz != null ? p.avgQuiz + '%' : '—')
      +       statBlock('Exams', p.examCount)
      +       statBlock('Avg exam', p.avgExam != null ? p.avgExam + '%' : '—')
      +       statBlock('Streak', p.streak + ' days')
      +     '</div>'
      +     '<div class="lt-prep-typing"><span></span><span></span><span></span>Writing your child\'s report…</div>'
      +   '</div>'
      +   '<footer class="lt-prep-foot">'
      +     '<button id="lt-prep-print">🖨️ Print</button>'
      +     '<button id="lt-prep-copy" class="alt">📋 Copy</button>'
      +     '<button id="lt-prep-email" class="alt">📧 Email this</button>'
      +     '<span style="margin-left:auto;font-size:.78rem;color:#5b6370">Generated by Lesson Teacher · Monthly · auto-sent on request</span>'
      +   '</footer>'
      + '</div>';
    overlay.addEventListener('click', function(e){ if (e.target === overlay) close(); });
    overlay.querySelector('.lt-prep-close').onclick = close;
    document.body.appendChild(overlay);
    window._ltPrepOverlay = overlay;

    // Generate the report
    var body = overlay.querySelector('#lt-prep-body');
    var statsHTML = body.innerHTML.split('<div class="lt-prep-typing">')[0];
    fetchReport(buildPrompt(p)).then(function(md){
      var html = mdReportToHTML(md);
      body.innerHTML = statsHTML + html;
      var printBtn = overlay.querySelector('#lt-prep-print');
      var copyBtn  = overlay.querySelector('#lt-prep-copy');
      var emailBtn = overlay.querySelector('#lt-prep-email');
      printBtn.onclick = function(){
        var w = window.open('', '_blank');
        if (!w) return;
        w.document.write('<title>Monthly Progress Report — ' + escapeHTML(p.name) + '</title><style>body{font-family:Georgia,serif;color:#142028;max-width:680px;margin:40px auto;padding:0 24px;line-height:1.6}h1{font-size:1.6rem;color:#264e36}h3{color:#264e36;margin-top:1.4em}strong{color:#264e36}.stat-row{display:flex;gap:14px;flex-wrap:wrap;font-size:.86rem;color:#5b6370;border-bottom:1px solid #d8d2bf;padding-bottom:10px;margin-bottom:18px}</style>');
        w.document.write('<h1>Monthly Progress Report — ' + escapeHTML(p.name) + '</h1>');
        w.document.write('<div class="stat-row">' + p.asOfDate + '  ·  ' + p.lessons + ' lessons · ' + p.quizCount + ' quizzes · ' + (p.avgQuiz != null ? p.avgQuiz + '% avg quiz' : '') + '</div>');
        w.document.write(html);
        w.document.close();
        w.print();
      };
      copyBtn.onclick = function(){
        var plain = body.innerText.trim();
        navigator.clipboard && navigator.clipboard.writeText(plain);
        copyBtn.textContent = '✓ Copied!';
        setTimeout(function(){ copyBtn.textContent = '📋 Copy'; }, 1600);
      };
      emailBtn.onclick = function(){
        var subj = encodeURIComponent('Monthly Progress Report — ' + p.name + ' · ' + p.asOfDate);
        var bd = encodeURIComponent(body.innerText.trim());
        window.location.href = 'mailto:?subject=' + subj + '&body=' + bd;
      };
    });
  }
  function escapeHTML(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  function statBlock(label, value){
    return '<div class="lt-prep-stat"><div class="ls-label">' + label + '</div><div class="ls-value">' + value + '</div></div>';
  }
  function close(){
    var ov = window._ltPrepOverlay;
    if (ov && ov.parentNode) ov.parentNode.removeChild(ov);
    window._ltPrepOverlay = null;
  }

  window.LTParentReport = { open: open, close: close };
})();
