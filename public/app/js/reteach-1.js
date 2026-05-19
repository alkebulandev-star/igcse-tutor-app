/* ════════════════════════════════════════════════════════════════════
   LESSON TEACHER — RE-TEACH COACHING PANEL
   ────────────────────────────────────────────────────────────────────
   When a student gets a question wrong (in the exam centre, embedded
   lesson quiz, or homework chat), this module opens a 1-on-1 coaching
   panel where the AI walks them through it Socratically:

     1. Acknowledge the mistake without judgement
     2. Re-explain the concept using a fresh analogy
     3. Show the worked solution step-by-step with intermediate checks
     4. Ask 1 short follow-up question to confirm understanding
     5. Stay open so the student can chat for as long as they need

   Why this matters: this is the part the competitor tutoring platforms
   charge premium money for — interactive 1-on-1 coaching after every
   mistake, available 24/7. We deliver the same thing in software.

   Public API:
     LTReteach.open({ question, options, correctAnswer, studentAnswer,
                      explanation, subject, board, paperType, container? })
     LTReteach.close()
   ════════════════════════════════════════════════════════════════════ */
(function(){
  if (window.LTReteach) return;
  'use strict';

  function injectStyles(){
    if (document.getElementById('lt-reteach-css')) return;
    var css = [
      '.lt-rt-overlay{position:fixed;inset:0;background:rgba(15,23,42,.55);z-index:2147483645;display:flex;align-items:flex-end;justify-content:center;font-family:var(--pp-sans,system-ui);animation:lt-rt-fade .25s ease}',
      '@keyframes lt-rt-fade{from{opacity:0}to{opacity:1}}',
      '@keyframes lt-rt-slide{from{transform:translateY(40px);opacity:0}to{transform:translateY(0);opacity:1}}',
      '.lt-rt-panel{width:100%;max-width:780px;max-height:88vh;background:#fbf8f1;border-radius:18px 18px 0 0;border:1px solid var(--pp-line,#d8d2bf);border-bottom:none;box-shadow:0 -24px 60px rgba(15,23,42,.35);display:flex;flex-direction:column;color:var(--pp-navy,#142028);animation:lt-rt-slide .3s cubic-bezier(.4,0,.2,1)}',
      '@media(min-width:760px){.lt-rt-overlay{align-items:center;padding:24px}.lt-rt-panel{border-radius:18px;border-bottom:1px solid var(--pp-line,#d8d2bf)}}',
      '.lt-rt-head{display:flex;align-items:center;gap:12px;padding:16px 20px;border-bottom:1px solid var(--pp-line,#d8d2bf);background:#264e36;color:#fbf8f1;border-radius:18px 18px 0 0}',
      '@media(min-width:760px){.lt-rt-head{border-radius:18px 18px 0 0}}',
      '.lt-rt-head .lt-rt-avatar{width:42px;height:42px;background:#fbf8f1;border-radius:50%;flex-shrink:0;padding:3px;box-sizing:border-box}',
      '.lt-rt-head .lt-rt-avatar svg{width:100%;height:100%}',
      '.lt-rt-head .lt-rt-title{font-family:var(--pp-serif,Georgia,serif);font-weight:500;font-size:1.1rem;line-height:1.2}',
      '.lt-rt-head .lt-rt-title small{display:block;font-size:.72rem;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:rgba(251,248,241,.65);margin-top:2px}',
      '.lt-rt-head .lt-rt-close{margin-left:auto;background:transparent;border:1px solid rgba(251,248,241,.3);color:#fbf8f1;padding:6px 12px;border-radius:100px;font-family:inherit;font-weight:700;cursor:pointer;font-size:.82rem;transition:background .15s}',
      '.lt-rt-head .lt-rt-close:hover{background:rgba(251,248,241,.12)}',
      '.lt-rt-context{padding:14px 20px;background:#fff;border-bottom:1px solid var(--pp-line,#d8d2bf);font-size:.86rem;line-height:1.55;color:#3a4250}',
      '.lt-rt-context strong{color:#264e36}',
      '.lt-rt-context .lt-rt-q{color:var(--pp-navy);font-weight:600;margin-bottom:8px;font-family:Georgia,serif;line-height:1.5}',
      '.lt-rt-context .lt-rt-ans{display:flex;flex-wrap:wrap;gap:10px;font-size:.78rem;color:#5b6370;font-family:var(--pp-sans,system-ui)}',
      '.lt-rt-context .lt-rt-ans .lt-pill{padding:4px 10px;border-radius:100px;background:#fef2f2;color:#b91c1c;font-weight:700;border:1px solid #fecaca}',
      '.lt-rt-context .lt-rt-ans .lt-pill.ok{background:#ecfdf5;color:#15803d;border-color:#bbf7d0}',
      '.lt-rt-chat{flex:1;overflow-y:auto;padding:18px 20px;display:flex;flex-direction:column;gap:14px;-webkit-overflow-scrolling:touch}',
      '.lt-rt-msg{display:flex;gap:10px;align-items:flex-start;max-width:92%}',
      '.lt-rt-msg.lt-rt-tutor{align-self:flex-start}',
      '.lt-rt-msg.lt-rt-you{align-self:flex-end;flex-direction:row-reverse}',
      '.lt-rt-msg .lt-rt-mavt{width:32px;height:32px;flex-shrink:0;background:#264e36;border-radius:50%;color:#fbf8f1;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:.78rem;letter-spacing:.04em}',
      '.lt-rt-msg.lt-rt-you .lt-rt-mavt{background:#2a4d6e}',
      '.lt-rt-msg .lt-rt-bub{padding:10px 14px;border-radius:14px;font-size:.92rem;line-height:1.6;background:#fff;border:1px solid var(--pp-line,#d8d2bf);color:var(--pp-navy);font-family:var(--pp-sans,system-ui)}',
      '.lt-rt-msg.lt-rt-tutor .lt-rt-bub{border-left:3px solid #264e36;border-top-left-radius:4px}',
      '.lt-rt-msg.lt-rt-you .lt-rt-bub{background:#264e36;color:#fbf8f1;border-color:#264e36;border-top-right-radius:4px}',
      '.lt-rt-msg .lt-rt-bub strong{color:#264e36}',
      '.lt-rt-msg.lt-rt-you .lt-rt-bub strong{color:#fbf8f1}',
      '.lt-rt-msg .lt-rt-bub p{margin:0 0 .7em}',
      '.lt-rt-msg .lt-rt-bub p:last-child{margin:0}',
      '.lt-rt-typing{display:inline-flex;gap:4px;align-items:center}',
      '.lt-rt-typing span{width:6px;height:6px;background:#264e36;border-radius:50%;animation:lt-rt-dot 1s ease-in-out infinite}',
      '.lt-rt-typing span:nth-child(2){animation-delay:.15s}',
      '.lt-rt-typing span:nth-child(3){animation-delay:.3s}',
      '@keyframes lt-rt-dot{0%,100%{opacity:.3;transform:translateY(0)}50%{opacity:1;transform:translateY(-3px)}}',
      // Quick reply chips
      '.lt-rt-chips{display:flex;gap:8px;flex-wrap:wrap;padding:0 20px 12px}',
      '.lt-rt-chips button{padding:6px 12px;background:#fff;border:1px solid var(--pp-line,#d8d2bf);border-radius:100px;font-family:inherit;font-size:.8rem;font-weight:600;color:var(--pp-navy);cursor:pointer;transition:background .12s,border-color .12s}',
      '.lt-rt-chips button:hover{background:#264e36;color:#fbf8f1;border-color:#264e36}',
      // Compose
      '.lt-rt-compose{padding:14px 20px;border-top:1px solid var(--pp-line,#d8d2bf);background:#fbf8f1;display:flex;gap:8px;align-items:flex-end}',
      '.lt-rt-compose textarea{flex:1;background:#fff;border:1px solid var(--pp-line,#d8d2bf);border-radius:10px;padding:10px 14px;font-family:inherit;font-size:.92rem;line-height:1.5;resize:none;min-height:44px;max-height:140px;color:var(--pp-navy);outline:none;transition:border-color .15s}',
      '.lt-rt-compose textarea:focus{border-color:#264e36}',
      '.lt-rt-compose button{background:#264e36;color:#fbf8f1;border:none;border-radius:10px;padding:0 16px;height:44px;font-family:inherit;font-weight:700;font-size:.9rem;cursor:pointer;transition:transform .12s,background .15s}',
      '.lt-rt-compose button:hover{background:#1f3a2a}',
      '.lt-rt-compose button:active{transform:translateY(1px)}',
      '.lt-rt-compose button[disabled]{opacity:.55;cursor:not-allowed;transform:none}',
      // Dark mode
      'html.dark-mode .lt-rt-panel{background:#0d1117;border-color:rgba(255,255,255,.10);color:#e8edf2}',
      'html.dark-mode .lt-rt-context{background:#131922;border-color:rgba(255,255,255,.10);color:#cbd5e1}',
      'html.dark-mode .lt-rt-context .lt-rt-q{color:#e8edf2}',
      'html.dark-mode .lt-rt-msg .lt-rt-bub{background:#131922;border-color:rgba(255,255,255,.10);color:#e8edf2}',
      'html.dark-mode .lt-rt-compose{background:#0d1117;border-top-color:rgba(255,255,255,.10)}',
      'html.dark-mode .lt-rt-compose textarea{background:#131922;border-color:rgba(255,255,255,.10);color:#e8edf2}'
    ].join('');
    var s = document.createElement('style');
    s.id = 'lt-reteach-css';
    s.textContent = css;
    document.head.appendChild(s);
  }

  var state = null;

  function buildPanel(opts){
    var avatar = '';
    if (window.LTMascot && typeof window.LTMascot.create === 'function'){
      var m = window.LTMascot.create({ size: 36, state: 'explaining' });
      avatar = m.outerHTML;
    } else {
      avatar = '<span class="lt-rt-mavt">LT</span>';
    }
    var overlay = document.createElement('div');
    overlay.className = 'lt-rt-overlay';
    overlay.innerHTML = ''
      + '<div class="lt-rt-panel" role="dialog" aria-label="Lesson Teacher coaching">'
      +   '<header class="lt-rt-head">'
      +     '<span class="lt-rt-avatar">' + avatar + '</span>'
      +     '<div class="lt-rt-title">Re-teach this question'
      +       '<small>1-on-1 coaching · Lesson Teacher</small>'
      +     '</div>'
      +     '<button class="lt-rt-close" type="button">Close</button>'
      +   '</header>'
      +   '<section class="lt-rt-context">'
      +     '<div class="lt-rt-q">' + escapeHTML(opts.question || '(no question text)') + '</div>'
      +     '<div class="lt-rt-ans">'
      +       (opts.studentAnswer ? '<span class="lt-pill">Your answer: ' + escapeHTML(opts.studentAnswer) + '</span>' : '')
      +       (opts.correctAnswer ? '<span class="lt-pill ok">Correct: ' + escapeHTML(opts.correctAnswer) + '</span>' : '')
      +       (opts.subject ? '<span style="padding:4px 10px;background:#f4f0e2;color:#6b4513;border-radius:100px;font-weight:700;border:1px solid #e0c97a">' + escapeHTML(opts.subject) + '</span>' : '')
      +     '</div>'
      +   '</section>'
      +   '<div class="lt-rt-chat" id="lt-rt-chat"></div>'
      +   '<div class="lt-rt-chips" id="lt-rt-chips"></div>'
      +   '<footer class="lt-rt-compose">'
      +     '<textarea id="lt-rt-input" placeholder="Ask anything — \'walk me through it again\', \'why is it not B?\', etc." rows="1"></textarea>'
      +     '<button id="lt-rt-send" type="button">Send</button>'
      +   '</footer>'
      + '</div>';
    return overlay;
  }

  function escapeHTML(s){
    return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }
  function md(s){
    if (window.LTMd && window.LTMd.inline) return window.LTMd.inline(s);
    return escapeHTML(s).replace(/\n/g,'<br>');
  }

  function appendMessage(role, text, isTyping){
    var chat = document.getElementById('lt-rt-chat');
    if (!chat) return null;
    var msg = document.createElement('div');
    msg.className = 'lt-rt-msg ' + (role === 'tutor' ? 'lt-rt-tutor' : 'lt-rt-you');
    var initials = role === 'tutor' ? 'LT' : 'You';
    msg.innerHTML = '<span class="lt-rt-mavt">' + initials + '</span><div class="lt-rt-bub">' + (isTyping ? '<span class="lt-rt-typing"><span></span><span></span><span></span></span>' : md(text)) + '</div>';
    chat.appendChild(msg);
    chat.scrollTop = chat.scrollHeight;
    return msg;
  }

  function buildSystemPrompt(opts){
    var lines = [
      'You are Lesson Teacher — a patient, encouraging 1-on-1 British tutor.',
      'A student just got an exam-style question WRONG. Your job: re-teach so the concept clicks and they never miss it again.',
      '',
      'TONE:',
      '- Warm, encouraging, never condescending. "Good attempt — let\'s unpack this together."',
      '- British English spelling (colour, organise, analyse).',
      '- Conversational, not lecturing.',
      '',
      'STRUCTURE (do these in order, kept SHORT — short paragraphs):',
      '1. Acknowledge their attempt and the specific misconception their wrong answer reveals.',
      '2. Re-explain the underlying concept using a FRESH analogy (not the textbook one — make it stick).',
      '3. Walk through the SOLUTION step-by-step with intermediate "check yourself" moments.',
      '4. End with ONE short follow-up question that probes whether they got it. Wait for their reply before moving on.',
      '',
      'CONSTRAINTS:',
      '- Use **bold** for key terms.',
      '- Never reveal more than one solution step per message in the early exchanges — let the student do some thinking.',
      '- If the student responds with a wrong follow-up, gently redirect — never say "wrong" first.',
      '- 24/7 available — encourage them to come back any time.',
      '',
      'CONTEXT:'
    ];
    if (opts.subject) lines.push('Subject: ' + opts.subject);
    if (opts.board) lines.push('Exam board / paper: ' + opts.board);
    if (opts.paperType) lines.push('Paper type: ' + opts.paperType);
    if (opts.question) lines.push('Question: ' + opts.question);
    if (opts.studentAnswer) lines.push('Student answered: ' + opts.studentAnswer);
    if (opts.correctAnswer) lines.push('Correct answer: ' + opts.correctAnswer);
    if (opts.explanation) lines.push('Mark scheme explanation: ' + opts.explanation);
    return lines.join('\n');
  }

  async function callAI(systemPrompt, history){
    var body = {
      model: 'claude-sonnet-4-6',
      max_tokens: 800,
      system: systemPrompt,
      messages: history
    };
    try {
      var res = await fetch('/api/anthropic', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (res.ok){
        var d = await res.json();
        var t = (d && d.content || []).find(function(b){ return b.type === 'text'; });
        if (t) return t.text;
      }
    } catch(e){}
    // Fallback: OpenAI
    try {
      var msgs2 = [{ role:'system', content: systemPrompt }].concat(history.map(function(m){ return { role: m.role, content: m.content }; }));
      var res2 = await fetch('/api/openai', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ model:'gpt-4o-mini', max_tokens: 800, messages: msgs2 })
      });
      if (res2.ok){
        var d2 = await res2.json();
        if (d2 && d2.choices && d2.choices[0] && d2.choices[0].message) return d2.choices[0].message.content;
      }
    } catch(e){}
    return 'I cannot reach the tutor server right now — please check your internet and try again. (Meanwhile, the correct answer is ' + (state && state.opts && state.opts.correctAnswer ? state.opts.correctAnswer : 'in the explanation above') + '.)';
  }

  async function turn(userText){
    if (!state) return;
    if (userText){
      state.history.push({ role:'user', content: userText });
      appendMessage('you', userText);
    }
    var typingMsg = appendMessage('tutor', '', true);
    var sendBtn = document.getElementById('lt-rt-send');
    if (sendBtn) sendBtn.disabled = true;
    try {
      var reply = await callAI(state.systemPrompt, state.history);
      if (typingMsg) typingMsg.remove();
      state.history.push({ role:'assistant', content: reply });
      appendMessage('tutor', reply);
    } catch(e){
      if (typingMsg) typingMsg.remove();
      appendMessage('tutor', 'Sorry — I lost connection. Try sending again?');
    } finally {
      if (sendBtn) sendBtn.disabled = false;
    }
  }

  function renderChips(){
    var box = document.getElementById('lt-rt-chips');
    if (!box) return;
    var chips = [
      { label: '🔁 Walk through again',       msg: 'Can you walk me through it step by step, slowly?' },
      { label: '🧠 Use a different analogy',  msg: 'Try a different analogy — the textbook one is not landing.' },
      { label: '❓ Why not my answer?',       msg: 'Why is my answer not right? What was I assuming?' },
      { label: '🎯 Give me a similar one',    msg: 'Give me a similar past-paper question to try.' }
    ];
    box.innerHTML = '';
    chips.forEach(function(c){
      var b = document.createElement('button');
      b.type = 'button';
      b.textContent = c.label;
      b.addEventListener('click', function(){ turn(c.msg); });
      box.appendChild(b);
    });
  }

  function close(){
    if (state && state.overlay && state.overlay.parentNode){
      state.overlay.parentNode.removeChild(state.overlay);
    }
    state = null;
    document.removeEventListener('keydown', onKey);
  }
  function onKey(e){ if (e.key === 'Escape') close(); }

  function open(opts){
    injectStyles();
    if (state) close();
    var overlay = buildPanel(opts);
    document.body.appendChild(overlay);
    state = {
      opts: opts,
      overlay: overlay,
      systemPrompt: buildSystemPrompt(opts),
      history: []
    };
    overlay.querySelector('.lt-rt-close').addEventListener('click', close);
    overlay.addEventListener('click', function(e){ if (e.target === overlay) close(); });
    document.addEventListener('keydown', onKey);
    var input = document.getElementById('lt-rt-input');
    var sendBtn = document.getElementById('lt-rt-send');
    sendBtn.addEventListener('click', function(){
      var v = input.value.trim();
      if (!v) return;
      input.value = '';
      turn(v);
    });
    input.addEventListener('keydown', function(e){
      if (e.key === 'Enter' && !e.shiftKey){
        e.preventDefault();
        sendBtn.click();
      }
    });
    renderChips();
    // Kick off the conversation with an opening message
    turn(null);
  }

  window.LTReteach = { open: open, close: close };
})();
