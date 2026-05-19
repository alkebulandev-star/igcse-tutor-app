/* ════════════════════════════════════════════════════════════════════
   LESSON TEACHER — CURRICULUM TREE NAVIGATOR + PAPER-TYPE TOOLS
   ────────────────────────────────────────────────────────────────────
   Renders a four-level navigator (Curriculum → Board → Subject → Paper)
   into the existing #pg-exam step-0 slot, and provides paper-type
   specific UI helpers that the exam-room can mount when a question
   loads.

   This module does NOT replace the existing exam engine. It feeds the
   user's selection into the same ec* state (currentExam, currentExamSubj
   etc.) so all the marking + AI generation continues to work.
   ════════════════════════════════════════════════════════════════════ */
(function(){
  if (window.LTExamUI) return;
  if (!window.LTExamTree){ console.warn('[ExamUI] LTExamTree missing — load exam-tree-1.js first.'); return; }
  'use strict';

  var TREE = window.LTExamTree;

  // ─── CSS ───────────────────────────────────────────────────────────
  function injectStyles(){
    if (document.getElementById('lt-exam-tree-css')) return;
    var css = [
      // Outer wrapper
      '.lt-tree{font-family:var(--pp-sans,system-ui);color:var(--pp-navy,#142028);max-width:1100px;margin:0 auto;padding:8px}',
      '.lt-tree-head{margin-bottom:22px;padding:0 4px}',
      '.lt-tree-eyebrow{font-size:.7rem;font-weight:800;letter-spacing:.18em;color:#264e36;text-transform:uppercase;margin-bottom:6px}',
      '.lt-tree-title{font-family:var(--pp-serif,Georgia,serif);font-weight:500;font-size:1.7rem;line-height:1.15;margin:0 0 6px;color:var(--pp-navy,#142028)}',
      '.lt-tree-sub{font-size:.92rem;color:#5b6370;max-width:640px;line-height:1.55}',
      '.lt-tree-stats{display:inline-flex;gap:14px;margin-top:14px;flex-wrap:wrap;font-size:.78rem}',
      '.lt-tree-stats span{padding:6px 12px;background:#fff;border:1px solid var(--pp-line,#d8d2bf);border-radius:100px;color:var(--pp-navy);font-weight:700}',
      '.lt-tree-stats strong{color:#264e36;margin-right:5px}',
      // Curriculum cards
      '.lt-tree-curr-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px;margin-bottom:24px}',
      '.lt-curr-card{background:#fff;border:1px solid var(--pp-line,#d8d2bf);border-left:4px solid #264e36;border-radius:8px;padding:18px;cursor:pointer;transition:transform .15s,box-shadow .15s,border-color .15s;text-align:left;display:flex;flex-direction:column;gap:6px;font-family:inherit}',
      '.lt-curr-card:hover{transform:translateY(-2px);box-shadow:0 12px 24px rgba(15,23,42,.12);border-left-color:#1a3a26}',
      '.lt-curr-card.active{background:#264e36;border-color:#264e36;color:#fbf8f1}',
      '.lt-curr-card.active *{color:inherit !important}',
      '.lt-curr-card .lc-label{font-family:var(--pp-serif,Georgia,serif);font-size:1.4rem;font-weight:500;letter-spacing:-.01em}',
      '.lt-curr-card .lc-audience{font-size:.74rem;color:#5b6370;letter-spacing:.04em;text-transform:uppercase;font-weight:700}',
      '.lt-curr-card .lc-tag{font-size:.86rem;color:#3a4250;line-height:1.5;margin-top:6px}',
      '.lt-curr-card .lc-count{margin-top:auto;padding-top:10px;font-size:.72rem;color:#8a5a14;font-weight:700;letter-spacing:.06em;text-transform:uppercase}',
      // Boards row (inside a curriculum)
      '.lt-tree-boards{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:14px;margin-bottom:8px}',
      '.lt-board-card{background:#fbf8f1;border:1px solid var(--pp-line,#d8d2bf);border-radius:8px;padding:16px;cursor:pointer;transition:transform .15s,background .15s;text-align:left;font-family:inherit;display:flex;flex-direction:column;gap:4px}',
      '.lt-board-card:hover{transform:translateY(-2px);background:#fff}',
      '.lt-board-card .lb-code{font-size:.72rem;color:#8a5a14;font-weight:800;letter-spacing:.08em;text-transform:uppercase}',
      '.lt-board-card .lb-name{font-family:var(--pp-serif,Georgia,serif);font-size:1.15rem;font-weight:500;color:var(--pp-navy)}',
      '.lt-board-card .lb-org{font-size:.78rem;color:#5b6370;margin-top:2px}',
      '.lt-board-card .lb-count{margin-top:8px;font-size:.7rem;color:#264e36;font-weight:700;letter-spacing:.04em;text-transform:uppercase}',
      // Subject grid (inside a board)
      '.lt-tree-subj{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:10px}',
      '.lt-subj-tile{background:#fff;border:1px solid var(--pp-line,#d8d2bf);border-radius:6px;padding:12px 14px;cursor:pointer;font-family:inherit;text-align:left;display:flex;flex-direction:column;gap:2px;transition:background .12s,border-color .12s;color:var(--pp-navy)}',
      '.lt-subj-tile:hover{background:#fbf8f1;border-color:#264e36}',
      '.lt-subj-tile .ls-code{font-size:.68rem;font-weight:800;color:#8a5a14;letter-spacing:.08em;text-transform:uppercase}',
      '.lt-subj-tile .ls-name{font-family:var(--pp-serif,Georgia,serif);font-size:1.04rem;font-weight:500}',
      '.lt-subj-tile .ls-papers{font-size:.72rem;color:#5b6370;margin-top:4px}',
      // Paper list (inside a subject)
      '.lt-tree-papers{display:flex;flex-direction:column;gap:10px}',
      '.lt-paper-row{display:flex;gap:14px;align-items:center;padding:14px 16px;background:#fff;border:1px solid var(--pp-line,#d8d2bf);border-radius:6px;cursor:pointer;font-family:inherit;text-align:left;transition:border-color .12s,box-shadow .12s;color:var(--pp-navy)}',
      '.lt-paper-row:hover{border-color:#264e36;box-shadow:0 6px 14px rgba(38,78,54,.08)}',
      '.lt-paper-type-chip{flex-shrink:0;padding:5px 10px;border-radius:100px;font-size:.62rem;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#fff;width:118px;text-align:center}',
      '.lt-paper-type-chip.t-mcq{background:#2a4d6e}',
      '.lt-paper-type-chip.t-theory{background:#264e36}',
      '.lt-paper-type-chip.t-essay{background:#7c2d12}',
      '.lt-paper-type-chip.t-practical{background:#a16207}',
      '.lt-paper-type-chip.t-alt-pract{background:#a16207}',
      '.lt-paper-info{flex:1;min-width:0}',
      '.lt-paper-info .lp-title{font-weight:700;font-size:.98rem;color:var(--pp-navy);margin-bottom:2px}',
      '.lt-paper-info .lp-meta{font-size:.78rem;color:#5b6370;display:flex;gap:14px;flex-wrap:wrap}',
      '.lt-paper-info .lp-meta strong{color:var(--pp-navy);font-weight:700}',
      '.lt-paper-go{flex-shrink:0;color:#264e36;font-weight:700;font-size:.84rem;letter-spacing:.04em}',
      // Breadcrumb
      '.lt-bcrumb{display:flex;gap:8px;align-items:center;font-size:.82rem;font-weight:700;color:#5b6370;margin-bottom:18px;flex-wrap:wrap}',
      '.lt-bcrumb .lt-bc-chip{padding:5px 12px;background:#fff;border:1px solid var(--pp-line,#d8d2bf);border-radius:100px;cursor:pointer;font-family:inherit;font-weight:700;color:var(--pp-navy);transition:background .12s,border-color .12s}',
      '.lt-bcrumb .lt-bc-chip:hover{background:#fbf8f1;border-color:#264e36}',
      '.lt-bcrumb .lt-bc-sep{color:#9ca3af;font-weight:400}',
      '.lt-bcrumb .lt-bc-now{color:#264e36;font-weight:800}',
      // Year cards for KS levels
      '.lt-year-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px}',
      '.lt-year-card{background:#fbf8f1;border:1px solid var(--pp-line,#d8d2bf);border-radius:6px;padding:18px 16px;text-align:left;font-family:inherit;cursor:pointer;color:var(--pp-navy);transition:background .12s,border-color .12s}',
      '.lt-year-card:hover{background:#fff;border-color:#264e36}',
      '.lt-year-card .ly-num{font-family:var(--pp-serif,Georgia,serif);font-size:1.7rem;font-weight:500}',
      '.lt-year-card .ly-sub{font-size:.78rem;color:#5b6370;margin-top:2px}',
      // Paper-type tool dock (used inside the exam room)
      '.lt-tool-dock{position:sticky;top:0;background:#fbf8f1;border-bottom:1px solid var(--pp-line,#d8d2bf);padding:10px 16px;display:flex;gap:8px;flex-wrap:wrap;align-items:center;z-index:5;font-family:var(--pp-sans,system-ui);font-size:.84rem}',
      '.lt-tool-dock .lt-tool{display:inline-flex;align-items:center;gap:6px;padding:6px 11px;background:#fff;border:1px solid var(--pp-line,#d8d2bf);border-radius:100px;font-weight:600;color:var(--pp-navy);cursor:pointer;transition:background .12s}',
      '.lt-tool-dock .lt-tool:hover{background:#f0ede3}',
      '.lt-tool-dock .lt-tool.on{background:#264e36;color:#fbf8f1;border-color:#264e36}',
      '.lt-tool-dock .lt-tool-chip{padding:6px 11px;background:rgba(38,78,54,.08);border-radius:100px;font-weight:700;color:#264e36;font-size:.78rem}',
      // Word counter widget
      '.lt-word-counter{display:inline-flex;align-items:center;gap:5px;padding:6px 12px;background:#fff;border:1px solid var(--pp-line,#d8d2bf);border-radius:100px;font-size:.78rem;font-weight:700;color:var(--pp-navy)}',
      '.lt-word-counter strong{color:#264e36;font-size:.92rem}',
      '.lt-word-counter.over strong{color:#b91c1c}',
      // Confidence selector (MCQ)
      '.lt-conf{display:flex;gap:6px;align-items:center;font-size:.78rem;color:#5b6370;font-weight:600}',
      '.lt-conf button{padding:4px 10px;border:1px solid var(--pp-line,#d8d2bf);background:#fff;color:var(--pp-navy);border-radius:6px;cursor:pointer;font-family:inherit;font-weight:600}',
      '.lt-conf button.on{background:#264e36;color:#fbf8f1;border-color:#264e36}',
      // Dark-mode hooks
      'html.dark-mode .lt-curr-card,html.dark-mode .lt-subj-tile,html.dark-mode .lt-paper-row,html.dark-mode .lt-year-card{background:#131922;border-color:rgba(255,255,255,.10);color:#e8edf2}',
      'html.dark-mode .lt-board-card{background:#0d1117;border-color:rgba(255,255,255,.10)}',
      'html.dark-mode .lt-bcrumb .lt-bc-chip{background:#131922;border-color:rgba(255,255,255,.10);color:#e8edf2}',
      'html.dark-mode .lt-tool-dock{background:#0d1117;border-bottom-color:rgba(255,255,255,.10)}',
      'html.dark-mode .lt-tool-dock .lt-tool{background:#131922;border-color:rgba(255,255,255,.10);color:#e8edf2}'
    ].join('');
    var s = document.createElement('style');
    s.id = 'lt-exam-tree-css';
    s.textContent = css;
    document.head.appendChild(s);
  }

  // ─── State ─────────────────────────────────────────────────────────
  var state = {
    curriculumKey: null,
    boardCode: null,
    subjectKey: null,
    paperCode: null
  };

  function findCurriculum(k){ return TREE.CURRICULA.find(function(c){ return c.key === k; }); }
  function findBoard(c, code){ return c && c.boards.find(function(b){ return b.code === code; }); }

  // ─── Renderers ─────────────────────────────────────────────────────
  function renderRoot(container){
    var t = TREE.totals();
    container.innerHTML = ''
      + '<div class="lt-tree">'
      +   '<div class="lt-tree-head">'
      +     '<div class="lt-tree-eyebrow">Exam Centre</div>'
      +     '<h1 class="lt-tree-title">Pick your curriculum.</h1>'
      +     '<p class="lt-tree-sub">Lesson Teacher keeps GCSE, IGCSE and A-Level fully separate — each board\'s real paper structure, mark scheme conventions and command words are reproduced as they appear in the exam hall.</p>'
      +     '<div class="lt-tree-stats">'
      +       '<span><strong>' + t.curricula + '</strong> curricula</span>'
      +       '<span><strong>' + t.boards + '</strong> exam boards</span>'
      +       '<span><strong>' + t.subjects + '</strong> subject specs</span>'
      +       '<span><strong>' + t.papers + '</strong> papers</span>'
      +     '</div>'
      +   '</div>'
      +   '<div class="lt-tree-curr-grid" id="lt-curr-grid"></div>'
      + '</div>';
    var grid = container.querySelector('#lt-curr-grid');
    TREE.CURRICULA.forEach(function(c){
      var paperTotal = 0, boardCount = c.boards.length;
      c.boards.forEach(function(b){
        if (b.subjects){
          Object.keys(b.subjects).forEach(function(sk){ paperTotal += (b.subjects[sk].papers || []).length; });
        } else if (b.years){
          paperTotal += b.years.length * Object.keys(b.subjects || KS_SUBJECTS).length;
        }
      });
      var card = document.createElement('button');
      card.className = 'lt-curr-card';
      card.innerHTML = ''
        + '<div class="lc-audience">' + c.audience + '</div>'
        + '<div class="lc-label">' + c.label + '</div>'
        + '<div class="lc-tag">' + c.tagline + '</div>'
        + '<div class="lc-count">' + boardCount + ' boards · ' + (paperTotal || 'curriculum-aligned') + (paperTotal ? ' papers' : '') + '</div>';
      card.addEventListener('click', function(){
        state.curriculumKey = c.key;
        state.boardCode = null; state.subjectKey = null; state.paperCode = null;
        renderBoards(container, c);
      });
      grid.appendChild(card);
    });
  }

  function renderBoards(container, c){
    container.innerHTML = ''
      + '<div class="lt-tree">'
      +   '<div class="lt-bcrumb">'
      +     '<button class="lt-bc-chip" id="lt-bc-root">← Curricula</button>'
      +     '<span class="lt-bc-sep">/</span><span class="lt-bc-now">' + c.label + '</span>'
      +   '</div>'
      +   '<div class="lt-tree-head">'
      +     '<div class="lt-tree-eyebrow">' + c.audience + '</div>'
      +     '<h1 class="lt-tree-title">' + c.label + ' — choose your exam board.</h1>'
      +     '<p class="lt-tree-sub">Different boards have different paper structures, mark schemes and command words. Pick yours below.</p>'
      +   '</div>'
      +   '<div class="lt-tree-boards" id="lt-boards-grid"></div>'
      + '</div>';
    container.querySelector('#lt-bc-root').onclick = function(){ renderRoot(container); };
    var grid = container.querySelector('#lt-boards-grid');
    c.boards.forEach(function(b){
      var subjCount = b.subjects ? Object.keys(b.subjects).length : 0;
      var card = document.createElement('button');
      card.className = 'lt-board-card';
      card.innerHTML = ''
        + '<div class="lb-code">' + b.code + '</div>'
        + '<div class="lb-name">' + b.name + '</div>'
        + '<div class="lb-org">' + (b.organisation || '') + '</div>'
        + '<div class="lb-count">' + subjCount + ' subjects · grades ' + (b.grades || '') + '</div>';
      card.addEventListener('click', function(){
        state.boardCode = b.code;
        if (b.years && b.years.length){
          renderYearBoard(container, c, b);
        } else {
          renderSubjects(container, c, b);
        }
      });
      grid.appendChild(card);
    });
  }

  function renderSubjects(container, c, b){
    container.innerHTML = ''
      + '<div class="lt-tree">'
      +   '<div class="lt-bcrumb">'
      +     '<button class="lt-bc-chip" id="lt-bc-root">← Curricula</button>'
      +     '<span class="lt-bc-sep">/</span><button class="lt-bc-chip" id="lt-bc-curr">' + c.label + '</button>'
      +     '<span class="lt-bc-sep">/</span><span class="lt-bc-now">' + b.name + '</span>'
      +   '</div>'
      +   '<div class="lt-tree-head">'
      +     '<div class="lt-tree-eyebrow">' + b.name + ' · ' + (b.organisation || '') + '</div>'
      +     '<h1 class="lt-tree-title">Pick a subject.</h1>'
      +     '<p class="lt-tree-sub">Each subject has its own paper structure. Tap a subject to see every paper, with marks, duration and tools.</p>'
      +   '</div>'
      +   '<div class="lt-tree-subj" id="lt-subj-grid"></div>'
      + '</div>';
    container.querySelector('#lt-bc-root').onclick = function(){ renderRoot(container); };
    container.querySelector('#lt-bc-curr').onclick = function(){ renderBoards(container, c); };
    var grid = container.querySelector('#lt-subj-grid');
    Object.keys(b.subjects).forEach(function(sk){
      var s = b.subjects[sk];
      var paperCount = (s.papers || []).length;
      var tile = document.createElement('button');
      tile.className = 'lt-subj-tile';
      tile.innerHTML = ''
        + '<div class="ls-code">' + (s.code || '') + '</div>'
        + '<div class="ls-name">' + s.name + '</div>'
        + '<div class="ls-papers">' + paperCount + ' paper' + (paperCount === 1 ? '' : 's') + '</div>';
      tile.addEventListener('click', function(){
        state.subjectKey = sk;
        renderPapers(container, c, b, sk, s);
      });
      grid.appendChild(tile);
    });
  }

  function renderPapers(container, c, b, sk, s){
    container.innerHTML = ''
      + '<div class="lt-tree">'
      +   '<div class="lt-bcrumb">'
      +     '<button class="lt-bc-chip" id="lt-bc-root">← Curricula</button>'
      +     '<span class="lt-bc-sep">/</span><button class="lt-bc-chip" id="lt-bc-curr">' + c.label + '</button>'
      +     '<span class="lt-bc-sep">/</span><button class="lt-bc-chip" id="lt-bc-board">' + b.name + '</button>'
      +     '<span class="lt-bc-sep">/</span><span class="lt-bc-now">' + s.name + '</span>'
      +   '</div>'
      +   '<div class="lt-tree-head">'
      +     '<div class="lt-tree-eyebrow">' + b.name + ' · ' + (s.code || '') + '</div>'
      +     '<h1 class="lt-tree-title">' + s.name + ' — choose a paper.</h1>'
      +     '<p class="lt-tree-sub">Each paper reproduces the real exam environment: correct duration, mark allocation, calculator rules and command words.</p>'
      +   '</div>'
      +   '<div class="lt-tree-papers" id="lt-papers-list"></div>'
      + '</div>';
    container.querySelector('#lt-bc-root').onclick = function(){ renderRoot(container); };
    container.querySelector('#lt-bc-curr').onclick = function(){ renderBoards(container, c); };
    container.querySelector('#lt-bc-board').onclick = function(){ renderSubjects(container, c, b); };
    var list = container.querySelector('#lt-papers-list');
    (s.papers || []).forEach(function(p){
      var meta = TREE.paperTypeMeta(p.type);
      var calc = p.calculator === 'forbidden' ? 'No calculator' : p.calculator === 'graphical' ? 'Graphical calculator' : 'Calculator allowed';
      var row = document.createElement('button');
      row.className = 'lt-paper-row';
      row.innerHTML = ''
        + '<div class="lt-paper-type-chip t-' + p.type + '">' + meta.label + '</div>'
        + '<div class="lt-paper-info">'
        +   '<div class="lp-title">' + p.title + ' <span style="color:#8a5a14;font-size:.78rem">(' + p.code + ')</span></div>'
        +   '<div class="lp-meta">'
        +     '<span><strong>' + p.duration + ' min</strong></span>'
        +     '<span><strong>' + p.marks + ' marks</strong></span>'
        +     '<span>' + calc + '</span>'
        +     (p.assessmentObjectives && p.assessmentObjectives.length ? '<span>' + p.assessmentObjectives.join(' · ') + '</span>' : '')
        +   '</div>'
        + '</div>'
        + '<div class="lt-paper-go">Open exam →</div>';
      row.addEventListener('click', function(){
        state.paperCode = p.code;
        launchPaper(c, b, sk, s, p);
      });
      list.appendChild(row);
    });
  }

  function renderYearBoard(container, c, b){
    container.innerHTML = ''
      + '<div class="lt-tree">'
      +   '<div class="lt-bcrumb">'
      +     '<button class="lt-bc-chip" id="lt-bc-root">← Curricula</button>'
      +     '<span class="lt-bc-sep">/</span><button class="lt-bc-chip" id="lt-bc-curr">' + c.label + '</button>'
      +     '<span class="lt-bc-sep">/</span><span class="lt-bc-now">' + b.name + '</span>'
      +   '</div>'
      +   '<div class="lt-tree-head">'
      +     '<div class="lt-tree-eyebrow">' + b.organisation + '</div>'
      +     '<h1 class="lt-tree-title">' + b.name + ' — choose a year.</h1>'
      +     '<p class="lt-tree-sub">' + c.tagline + '</p>'
      +   '</div>'
      +   '<div class="lt-year-grid" id="lt-years-grid"></div>'
      + '</div>';
    container.querySelector('#lt-bc-root').onclick = function(){ renderRoot(container); };
    container.querySelector('#lt-bc-curr').onclick = function(){ renderBoards(container, c); };
    var grid = container.querySelector('#lt-years-grid');
    b.years.forEach(function(yr){
      var card = document.createElement('button');
      card.className = 'lt-year-card';
      card.innerHTML = ''
        + '<div class="ly-num">' + yr.label + '</div>'
        + '<div class="ly-sub">' + yr.weeks + ' weeks of weekly topics</div>';
      card.addEventListener('click', function(){
        // KS levels feed the existing classroom engine, not the exam engine
        try {
          if (typeof window.goTo === 'function') window.goTo('pg-classroom');
        } catch(e){}
      });
      grid.appendChild(card);
    });
  }

  // ─── Launch — handoff to existing exam engine with paper metadata ──
  function launchPaper(c, b, sk, s, p){
    // Cache the chosen paper so the question engine / marking layer can
    // consult the spec (calculator rules, command words, AOs, etc.)
    window._currentPaper = {
      curriculum: c.key, curriculumLabel: c.label,
      board: b.code, boardName: b.name, boardOrg: b.organisation,
      subjectKey: sk, subjectName: s.name, subjectCode: s.code,
      paperCode: p.code, paperTitle: p.title, paperType: p.type,
      duration: p.duration, marks: p.marks,
      calculator: p.calculator || 'allowed',
      commandWords: p.command || [],
      assessmentObjectives: p.assessmentObjectives || [],
      sections: p.sections || null,
      notes: p.notes || ''
    };
    // Bridge to the existing exam centre — set its globals so the
    // generation + marking continue to work.
    var examKey = 'igcse';
    if (c.key === 'alevel') examKey = b.code === 'EDX' ? 'edxalevel' : 'alevel';
    else if (c.key === 'igcse') examKey = b.code === 'EDX' ? 'edxigcse' : 'igcse';
    else if (c.key === 'gcse') examKey = b.code === 'EDX' ? 'edxigcse' : 'igcse';
    window.currentExam = examKey;
    window.currentExamSubj = sk;
    window.currentExamSubjName = s.name;
    window.currentExamYear = 0; // any year
    // Make sure the existing engine knows the subject — it builds the
    // paper grid and stores per-subject state.
    if (typeof window.ecPickSubject === 'function'){
      try { window.ecPickSubject(sk, s.name); } catch(_){}
    }
    // Map paper type to the existing engine's paper number:
    //   1 = MCQ, 2 = theory/essay/practical, 3 = practice (open-ended)
    var paperNum = 3;
    if (p.type === 'mcq') paperNum = 1;
    else if (p.type === 'theory' || p.type === 'essay' || p.type === 'practical' || p.type === 'alt-pract') paperNum = 2;
    if (typeof window.ecStartPaper === 'function'){
      try { window.ecStartPaper(paperNum); } catch(e){
        console.error('[ExamTree] ecStartPaper failed', e);
        alert('Could not launch the exam: ' + (e && e.message || e));
      }
    } else {
      alert('Exam engine not ready — please refresh the page.');
    }
  }

  // ─── Public mount point ────────────────────────────────────────────
  function mount(container){
    injectStyles();
    if (!container) return;
    renderRoot(container);
  }

  // ─── Paper-type tools (used inside the exam room) ──────────────────
  // These are mounted by the question UI when a question is shown.
  var Tools = {
    // Word counter — call attach(el) to bind to a contenteditable / textarea.
    // Returns a removable badge.
    wordCounter: function(target, opts){
      opts = opts || {};
      var badge = document.createElement('span');
      badge.className = 'lt-word-counter';
      badge.innerHTML = '<span>Words:</span><strong>0</strong>' + (opts.target ? '<span style="color:#9ca3af;margin-left:4px">/ ' + opts.target + '</span>' : '');
      var update = function(){
        var txt = target.value !== undefined ? target.value : target.textContent || '';
        var words = (txt.match(/\b[\w'-]+\b/g) || []).length;
        badge.querySelector('strong').textContent = words;
        if (opts.target && words > opts.target * 1.2) badge.classList.add('over');
        else badge.classList.remove('over');
      };
      target.addEventListener('input', update);
      update();
      return badge;
    },
    // Confidence picker for MCQ — Low / Medium / High
    confidence: function(onChange){
      var box = document.createElement('span');
      box.className = 'lt-conf';
      box.innerHTML = '<span>Confidence:</span>'
        + '<button data-v="low">Low</button>'
        + '<button data-v="med">Medium</button>'
        + '<button data-v="high">High</button>';
      box.addEventListener('click', function(e){
        if (e.target.tagName !== 'BUTTON') return;
        box.querySelectorAll('button').forEach(function(b){ b.classList.remove('on'); });
        e.target.classList.add('on');
        if (typeof onChange === 'function') onChange(e.target.dataset.v);
      });
      return box;
    },
    // Formula sheet — simple modal with common A-Level/IGCSE formulae
    formulaSheet: function(subjectKey){
      var sheets = {
        mth: ['(a + b)² = a² + 2ab + b²','(a − b)² = a² − 2ab + b²','sin²θ + cos²θ = 1','tan θ = sinθ / cosθ','d/dx (xⁿ) = nx^(n−1)','∫ xⁿ dx = x^(n+1)/(n+1) + C','Quadratic: x = (−b ± √(b²−4ac)) / 2a','Arc length = rθ (θ in radians)'],
        phy: ['F = ma','W = Fd','KE = ½mv²','PE = mgh','P = IV','V = IR','c = fλ','E = mc²','F = mv²/r','f = 1/T'],
        chm: ['n = m / Mᵣ','pV = nRT','pH = −log₁₀[H⁺]','ΔH = qmcΔT','Avogadro: 6.022 × 10²³ /mol','Ideal gas: pV = nRT'],
        bio: ['Magnification = image / actual size','Surface area : volume — SA = 6L², V = L³','Rate of reaction = ΔConcentration / time','Genotype × Phenotype Punnett square']
      };
      var lines = sheets[subjectKey] || ['No subject-specific formula sheet — calculate from first principles.'];
      var dlg = document.createElement('div');
      dlg.style.cssText = 'position:fixed;inset:0;background:rgba(15,23,42,.55);z-index:2147483646;display:flex;align-items:center;justify-content:center;padding:20px;font-family:var(--pp-sans,system-ui)';
      dlg.innerHTML = '<div style="background:#fbf8f1;color:var(--pp-navy,#142028);padding:24px;border-radius:12px;max-width:520px;width:100%;max-height:80vh;overflow:auto;border:2px solid #264e36">'
        + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px"><h3 style="margin:0;font-family:var(--pp-serif,Georgia,serif);font-weight:500">📐 Formula Sheet</h3><button onclick="this.closest(\'[style*=fixed]\').remove()" style="background:#264e36;color:#fbf8f1;border:none;padding:6px 14px;border-radius:6px;font-weight:700;cursor:pointer;font-family:inherit">Close</button></div>'
        + '<ul style="margin:0;padding-left:20px;line-height:2;font-family:ui-monospace,Menlo,monospace;font-size:.92rem">' + lines.map(function(l){ return '<li>' + l + '</li>'; }).join('') + '</ul>'
        + '<div style="margin-top:14px;font-size:.78rem;color:#5b6370">Formula sheets vary by board — these are the most commonly tested results.</div>'
        + '</div>';
      dlg.addEventListener('click', function(e){ if (e.target === dlg) dlg.remove(); });
      document.body.appendChild(dlg);
    },
    // Calculator simulator — simple desktop calc (subset)
    calculator: function(){
      var dlg = document.createElement('div');
      dlg.style.cssText = 'position:fixed;right:20px;bottom:96px;background:#fbf8f1;border:2px solid #264e36;border-radius:12px;padding:14px;z-index:2147483645;width:260px;font-family:ui-monospace,Menlo,monospace;box-shadow:0 24px 60px rgba(15,23,42,.3)';
      var keys = ['7','8','9','÷','4','5','6','×','1','2','3','−','0','.','=','+'];
      dlg.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px"><strong style="color:#264e36">Calculator</strong><button onclick="this.closest(\'[style*=fixed]\').remove()" style="background:transparent;border:none;color:#264e36;font-size:1.1rem;cursor:pointer">✕</button></div>'
        + '<input id="lt-calc-display" type="text" readonly value="0" style="width:100%;background:#fff;border:1px solid #d8d2bf;padding:8px;border-radius:6px;text-align:right;font-size:1.1rem;font-family:inherit;color:#142028;margin-bottom:8px">'
        + '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px">'
        +   keys.map(function(k){ return '<button data-k="' + k + '" style="padding:10px;background:' + (['÷','×','−','+','='].indexOf(k)>=0 ? '#264e36;color:#fbf8f1' : '#fff;color:#142028') + ';border:1px solid #d8d2bf;border-radius:6px;font-family:inherit;font-size:1rem;font-weight:700;cursor:pointer">' + k + '</button>'; }).join('')
        + '</div>';
      var expr = '';
      var disp = dlg.querySelector('#lt-calc-display');
      dlg.addEventListener('click', function(e){
        if (e.target.tagName !== 'BUTTON' || !e.target.dataset.k) return;
        var k = e.target.dataset.k;
        if (k === '='){
          try {
            var safe = expr.replace(/×/g,'*').replace(/÷/g,'/').replace(/−/g,'-');
            if (!/^[0-9+\-*/.() ]+$/.test(safe)) throw 0;
            var r = Function('"use strict"; return (' + safe + ')')();
            disp.value = String(r);
            expr = String(r);
          } catch(_){ disp.value = 'Error'; expr = ''; }
        } else {
          expr += k;
          disp.value = expr;
        }
      });
      document.body.appendChild(dlg);
      return dlg;
    },
    // Mount a tool dock above a question, showing the right tools for the paper type.
    mountDock: function(container, paperMeta){
      if (!container || !paperMeta) return null;
      injectStyles();
      var typeMeta = TREE.paperTypeMeta(paperMeta.paperType || paperMeta.type);
      var tools = typeMeta.tools || [];
      var dock = document.createElement('div');
      dock.className = 'lt-tool-dock';
      // Board + duration chip
      dock.innerHTML = ''
        + '<span class="lt-tool-chip">' + (paperMeta.boardName || '') + (paperMeta.paperCode ? ' · ' + paperMeta.paperCode : '') + '</span>'
        + '<span class="lt-tool-chip">' + typeMeta.label + ' · ' + (paperMeta.duration || '?') + ' min · ' + (paperMeta.marks || '?') + ' marks</span>'
        + '<span class="lt-tool-chip">' + (paperMeta.calculator === 'forbidden' ? '🚫 No calculator' : paperMeta.calculator === 'graphical' ? '📈 Graphical only' : '🧮 Calculator allowed') + '</span>';
      if (tools.indexOf('calculator') >= 0 && paperMeta.calculator !== 'forbidden'){
        var b = document.createElement('button'); b.className = 'lt-tool'; b.innerHTML = '🧮 Calculator';
        b.onclick = function(){ Tools.calculator(); };
        dock.appendChild(b);
      }
      if (tools.indexOf('formulaSheet') >= 0){
        var b2 = document.createElement('button'); b2.className = 'lt-tool'; b2.innerHTML = '📐 Formula sheet';
        b2.onclick = function(){ Tools.formulaSheet(paperMeta.subjectKey); };
        dock.appendChild(b2);
      }
      if (paperMeta.commandWords && paperMeta.commandWords.length){
        var b3 = document.createElement('button'); b3.className = 'lt-tool'; b3.innerHTML = '🗒️ Command words';
        b3.onclick = function(){
          var cw = paperMeta.commandWords.map(function(c){ return c.charAt(0).toUpperCase() + c.slice(1); }).join(' · ');
          alert('This paper uses these command words:\n\n' + cw + '\n\nTip: a Define answer differs from an Explain — read the verb carefully before writing.');
        };
        dock.appendChild(b3);
      }
      container.insertBefore(dock, container.firstChild);
      return dock;
    }
  };

  // ─── Public API ────────────────────────────────────────────────────
  window.LTExamUI = {
    mount: mount,
    Tools: Tools,
    state: state
  };
})();
