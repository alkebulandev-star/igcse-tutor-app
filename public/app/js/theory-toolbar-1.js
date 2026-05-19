/* ════════════════════════════════════════════════════════════════════
   LESSON TEACHER — COMPACT THEORY TOOLBAR (mobile-first)
   ────────────────────────────────────────────────────────────────────
   The legacy theory writing screen has 7 rows of toolbars (text format,
   math symbols, list markers, plan, AI, view, plus a subject toolkit
   strip above). On phones the student couldn't see the answer sheet at
   all. This module:

     1. Watches for the theory writing screen becoming visible.
     2. Injects a sticky 4-button mini strip at the top of the answer pane:
            [Question ▾]  [parts (a)(b)(c)]  [🛠 Tools]  [💡 Suggest]
     3. Opens a categorised bottom-sheet popover with every tool from
        the original toolbar (Format / Math / Insert / Subject).
     4. Falls back to the existing handlers (insertFmtMark, addBlock,
        toggleTool, togglePlan, togglePlan, etc.) so nothing else changes.

   Result: on mobile the writing sheet stays the dominant element. The
   tools are one tap away.
   ════════════════════════════════════════════════════════════════════ */
(function(){
  if (window.LTTheoryBar) return;
  'use strict';

  function buildMiniBar(answerPane){
    if (!answerPane || answerPane.querySelector('.lt-mini-toolbar')) return;
    var bar = document.createElement('div');
    bar.className = 'lt-mini-toolbar';
    bar.innerHTML = ''
      + '<button class="lmt-btn" type="button" data-act="question" title="Show question"><span>📄 Question</span></button>'
      + '<button class="lmt-btn" type="button" data-act="rough" title="Rough work / planning">📝 Rough</button>'
      + '<button class="lmt-btn lmt-tools" type="button" data-act="tools">🛠 Tools</button>'
      + '<button class="lmt-btn" type="button" data-act="suggest">💡 Suggest</button>';
    answerPane.insertBefore(bar, answerPane.firstChild);
    bar.addEventListener('click', function(e){
      var btn = e.target.closest('.lmt-btn');
      if (!btn) return;
      var act = btn.dataset.act;
      if (act === 'question'){ if (typeof window.toggleQuestionPanel === 'function') window.toggleQuestionPanel(); }
      else if (act === 'rough'){ if (typeof window.togglePlan === 'function') window.togglePlan(); else { var p = document.querySelector('#pg-essay .tap-plan'); if (p) p.classList.toggle('tap-plan-open'); } }
      else if (act === 'tools'){ openToolsSheet(); }
      else if (act === 'suggest'){ if (typeof window.toggleGhost === 'function') window.toggleGhost(); btn.classList.toggle('on'); }
    });
  }

  function openToolsSheet(){
    closeToolsSheet();
    var bd = document.createElement('div');
    bd.className = 'lt-tools-backdrop';
    bd.id = 'lt-tools-backdrop';
    document.body.appendChild(bd);

    var sheet = document.createElement('div');
    sheet.className = 'lt-tools-sheet';
    sheet.id = 'lt-tools-sheet';
    var formatBlocks = section('Format', [
      { ico:'B',  label:'Bold',       fn:function(){ call('insertFmtMark','bold'); } },
      { ico:'I',  label:'Italic',     fn:function(){ call('insertFmtMark','italic'); } },
      { ico:'U',  label:'Underline',  fn:function(){ call('insertFmtMark','underline'); } },
      { ico:'🖊', label:'Highlight',  fn:function(){ call('insertFmtMark','highlight'); } }
    ]);
    var mathBlocks = section('Maths', [
      { ico:'x²', label:'Superscript',fn:function(){ call('insertSubSup','sup'); } },
      { ico:'H₂', label:'Subscript',  fn:function(){ call('insertSubSup','sub'); } },
      { ico:'Ω',  label:'Symbols',    fn:function(){ call('toggleSymbolPicker'); } },
      { ico:'🧮', label:'Calculator', fn:function(){ call('toggleTool','toolCalc'); } }
    ]);
    var listBlocks = section('List', [
      { ico:'•',  label:'Bullet',     fn:function(){ call('insertListMarker','bullet'); } },
      { ico:'1.', label:'Numbered',   fn:function(){ call('insertListMarker','number'); } },
      { ico:'(a)',label:'Cambridge',  fn:function(){ call('insertListMarker','letter'); } }
    ]);
    var insertBlocks = section('Insert block', [
      { ico:'✍️', label:'Write',      fn:function(){ call('addBlock','free'); } },
      { ico:'•',  label:'Points',     fn:function(){ call('addBlock','point'); } },
      { ico:'🔢', label:'Steps',      fn:function(){ call('addBlock','steps'); } },
      { ico:'📖', label:'Definition', fn:function(){ call('addBlock','def'); } },
      { ico:'💡', label:'Explanation',fn:function(){ call('addBlock','exp'); } },
      { ico:'✏️', label:'Example',    fn:function(){ call('addBlock','eg'); } },
      { ico:'⊞',  label:'Table',      fn:function(){ call('addBlock','table'); } },
      { ico:'⚡', label:'Equation',   fn:function(){ call('addBlock','equation'); } },
      { ico:'🖼', label:'Diagram',    fn:function(){ call('addBlock','diagram'); } },
      { ico:'📖', label:'Quote',      fn:function(){ call('addBlock','quote'); } }
    ]);
    sheet.innerHTML =
      '<header class="lt-tools-sheet-hdr">' +
        '<h3>Writing tools<small>Format · maths · insert · subject</small></h3>' +
        '<button class="lt-close" type="button">Done</button>' +
      '</header>' +
      '<div class="lt-tools-sheet-body">' +
        formatBlocks + mathBlocks + listBlocks + insertBlocks +
      '</div>';
    document.body.appendChild(sheet);
    requestAnimationFrame(function(){ sheet.classList.add('open'); bd.classList.add('open'); });
    sheet.querySelector('.lt-close').addEventListener('click', closeToolsSheet);
    bd.addEventListener('click', closeToolsSheet);
    sheet.querySelectorAll('[data-fn]').forEach(function(b){
      b.addEventListener('click', function(){
        var fn = _registry[b.dataset.fn];
        try { fn && fn(); } catch(e){ console.error(e); }
        closeToolsSheet();
      });
    });
  }
  function closeToolsSheet(){
    var s = document.getElementById('lt-tools-sheet');
    var b = document.getElementById('lt-tools-backdrop');
    if (s){ s.classList.remove('open'); setTimeout(function(){ if (s.parentNode) s.parentNode.removeChild(s); }, 250); }
    if (b){ b.classList.remove('open'); setTimeout(function(){ if (b.parentNode) b.parentNode.removeChild(b); }, 250); }
    _registry = {};
  }

  var _registry = {};
  var _nextId = 0;
  function section(title, items){
    var inner = items.map(function(it){
      var id = 'fn' + (++_nextId);
      _registry[id] = it.fn;
      return '<button type="button" data-fn="'+id+'"><span class="ico">'+it.ico+'</span><span>'+it.label+'</span></button>';
    }).join('');
    return '<section class="lt-tools-section"><h4>'+title+'</h4><div class="lt-tools-grid">'+inner+'</div></section>';
  }
  function call(fnName){
    var args = Array.prototype.slice.call(arguments, 1);
    var fn = window[fnName];
    if (typeof fn === 'function') try { return fn.apply(window, args); } catch(e){ console.error('['+fnName+']', e); }
  }

  // Auto-watch: re-insert mini-toolbar whenever the theory writing screen
  // becomes visible. Listen to the existing engine via interval (cheap).
  function ensureInjected(){
    var pane = document.querySelector('#pg-essay .theory-answer-pane');
    if (pane && pane.offsetParent && !pane.querySelector('.lt-mini-toolbar')){
      buildMiniBar(pane);
    }
  }
  setInterval(ensureInjected, 800);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ensureInjected);
  else ensureInjected();

  window.LTTheoryBar = { open: openToolsSheet, close: closeToolsSheet };
})();
