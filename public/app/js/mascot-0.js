/* ════════════════════════════════════════════════════════════════════
   LESSON TEACHER — MASCOT (Paperclip + Graduation Cap)
   ────────────────────────────────────────────────────────────────────
   A custom SVG mascot that replaces the generic 👩‍🏫 emoji used as
   the AI tutor avatar across welcome, chat, lesson loader, kids zone
   and the floating Ask-Tutor pill.

   Six expression states: idle · thinking · explaining ·
   encouraging · surprised · typing.

   Public API:
     LTMascot.render(el, opts?)         — replace el's contents with mascot
     LTMascot.create(opts?) → Element   — return a new mascot element
     LTMascot.setState(el, state)       — change a mounted mascot's state
     LTMascot.setAll(state)             — set state on every mascot on page
     LTMascot.replaceEmoji(root?)       — auto-swap every 👩‍🏫 for a mascot
     LTMascot.wrapAIBubble(el)          — add the animated halo + mini mascot
                                          onto an AI message bubble
     LTMascot.mountLoader(parent,msg)   — replace a loader element with the
                                          mascot+message+spinner combo
     LTMascot.mountButton(opts) → btn   — mascot-shaped floating action button
   Opts: { state, size, animated, halo }
   ════════════════════════════════════════════════════════════════════ */
(function(){
  if (window.LTMascot) return;
  'use strict';

  // ─── One-time CSS injection ───────────────────────────────────────
  function injectStyles(){
    if (document.getElementById('lt-mascot-css')) return;
    var css = [
      // Wrapper -----------------------------------------------------------
      '.lt-mascot{display:inline-block;line-height:0;vertical-align:middle;position:relative;flex-shrink:0}',
      '.lt-mascot svg{display:block;width:100%;height:100%;overflow:visible}',
      // Idle bob -----------------------------------------------------------
      '.lt-mascot.animated .lt-m-body{animation:lt-m-bob 4.2s ease-in-out infinite;transform-origin:110px 130px}',
      '@keyframes lt-m-bob{0%,100%{transform:translateY(0) rotate(-1.4deg)}50%{transform:translateY(-4px) rotate(1.4deg)}}',
      // Tassel sway --------------------------------------------------------
      '.lt-mascot.animated .lt-m-tassel{transform-origin:158px 36px;animation:lt-m-tassel 3.3s ease-in-out infinite}',
      '@keyframes lt-m-tassel{0%,100%{transform:rotate(-4deg)}50%{transform:rotate(8deg)}}',
      // Blink --------------------------------------------------------------
      '.lt-mascot.animated .lt-m-eyelid{transform-box:fill-box;transform-origin:center;animation:lt-m-blink 4.8s ease-in-out infinite}',
      '@keyframes lt-m-blink{0%,93%,100%{transform:scaleY(0)}95%,97%{transform:scaleY(1)}}',
      // Hover bounce -------------------------------------------------------
      '.lt-mascot.clickable{cursor:pointer;transition:transform .25s cubic-bezier(.4,0,.2,1)}',
      '.lt-mascot.clickable:hover{transform:translateY(-3px) scale(1.06)}',
      '.lt-mascot.clickable:active{transform:translateY(-1px) scale(1.02)}',
      // Default-hidden state-specific elements
      '.lt-mascot .lt-m-bulb,.lt-mascot .lt-m-dots,.lt-mascot .lt-m-confetti,.lt-mascot .lt-m-omouth,.lt-mascot .lt-m-bigsmile,.lt-mascot .lt-m-eye-squint{display:none}',
      // State: thinking — bulb pulse + brows raise
      '.lt-mascot[data-state="thinking"] .lt-m-bulb{display:block;animation:lt-m-bulb 1.4s ease-in-out infinite}',
      '@keyframes lt-m-bulb{0%,100%{opacity:.45;transform:translateY(0) scale(.93)}50%{opacity:1;transform:translateY(-3px) scale(1.1)}}',
      '.lt-mascot[data-state="thinking"] .lt-m-brow-l{transform:translateY(-3px) rotate(-10deg)}',
      '.lt-mascot[data-state="thinking"] .lt-m-brow-r{transform:translateY(2px) rotate(8deg)}',
      '.lt-mascot[data-state="thinking"] .lt-m-pupil-l{transform:translate(2px,-3px)}',
      '.lt-mascot[data-state="thinking"] .lt-m-pupil-r{transform:translate(3px,-3px)}',
      // State: surprised — pop + O mouth + wide eyes
      '.lt-mascot[data-state="surprised"] .lt-m-body{animation:lt-m-pop 1.4s ease-in-out infinite}',
      '@keyframes lt-m-pop{0%,100%{transform:scale(1)}30%{transform:scale(1.08)}60%{transform:scale(.96)}}',
      '.lt-mascot[data-state="surprised"] .lt-m-smile{display:none}',
      '.lt-mascot[data-state="surprised"] .lt-m-omouth{display:block}',
      '.lt-mascot[data-state="surprised"] .lt-m-eye{transform:scale(1.15);transform-box:fill-box;transform-origin:center}',
      // State: encouraging — squint eyes + big smile + confetti
      '.lt-mascot[data-state="encouraging"] .lt-m-eye,.lt-mascot[data-state="encouraging"] .lt-m-pupil-wrap{display:none}',
      '.lt-mascot[data-state="encouraging"] .lt-m-eye-squint{display:block}',
      '.lt-mascot[data-state="encouraging"] .lt-m-smile{display:none}',
      '.lt-mascot[data-state="encouraging"] .lt-m-bigsmile{display:block}',
      '.lt-mascot[data-state="encouraging"] .lt-m-confetti{display:block;animation:lt-m-confetti 1.6s ease-out infinite}',
      '@keyframes lt-m-confetti{0%{transform:translateY(0) rotate(0);opacity:1}100%{transform:translateY(-32px) rotate(220deg);opacity:0}}',
      // State: explaining — talking mouth + slight nod
      '.lt-mascot[data-state="explaining"] .lt-m-smile{animation:lt-m-talk 0.45s ease-in-out infinite}',
      '@keyframes lt-m-talk{0%,100%{transform:scaleY(1)}50%{transform:scaleY(.4) translateY(2px)}}',
      // State: typing — three dots
      '.lt-mascot[data-state="typing"] .lt-m-smile{display:none}',
      '.lt-mascot[data-state="typing"] .lt-m-dots{display:block}',
      '.lt-mascot[data-state="typing"] .lt-m-dot1{animation:lt-m-dot 1s ease-in-out infinite}',
      '.lt-mascot[data-state="typing"] .lt-m-dot2{animation:lt-m-dot 1s .15s ease-in-out infinite}',
      '.lt-mascot[data-state="typing"] .lt-m-dot3{animation:lt-m-dot 1s .3s ease-in-out infinite}',
      '@keyframes lt-m-dot{0%,100%{opacity:.3;transform:translateY(0)}50%{opacity:1;transform:translateY(-3px)}}',
      // Smooth transitions
      '.lt-mascot .lt-m-pupil-wrap,.lt-mascot .lt-m-brow-l,.lt-mascot .lt-m-brow-r,.lt-mascot .lt-m-eye{transition:transform .35s cubic-bezier(.4,0,.2,1)}',
      // ── Halo ring (lesson AI bubble) ─────────────────────────────────
      '.lt-halo{position:relative;display:inline-flex;align-items:center;justify-content:center;border-radius:50%}',
      '.lt-halo::before,.lt-halo::after{content:"";position:absolute;inset:-6px;border-radius:50%;border:2px solid transparent;pointer-events:none}',
      '.lt-halo::before{border-top-color:#264e36;border-right-color:#264e36;animation:lt-halo-spin 2.4s linear infinite}',
      '.lt-halo::after{inset:-12px;border-bottom-color:rgba(38,78,54,.4);border-left-color:rgba(38,78,54,.4);animation:lt-halo-spin 3.6s linear infinite reverse}',
      '@keyframes lt-halo-spin{to{transform:rotate(360deg)}}',
      '.lt-halo[data-quiet="1"]::before,.lt-halo[data-quiet="1"]::after{animation-play-state:paused;opacity:.35}',
      // ── AI bubble decoration ────────────────────────────────────────
      '.lt-ai-wrap{position:relative;padding-left:64px}',
      '.lt-ai-wrap > .lt-ai-avatar{position:absolute;left:-4px;top:-4px;width:54px;height:54px;display:flex;align-items:center;justify-content:center}',
      // ── Loader ───────────────────────────────────────────────────────
      '.lt-mascot-loader{display:flex;flex-direction:column;align-items:center;gap:14px;padding:32px 18px;font-family:"Plus Jakarta Sans",system-ui,sans-serif;color:#1a2530}',
      '.lt-mascot-loader .lt-mascot{filter:drop-shadow(0 8px 18px rgba(38,78,54,.18))}',
      '.lt-mascot-loader .lt-loader-msg{font-weight:700;font-size:1rem;text-align:center;color:#264e36;max-width:320px;line-height:1.45}',
      '.lt-mascot-loader .lt-loader-sub{font-size:.78rem;color:#64748b;font-weight:500;letter-spacing:.04em;text-transform:uppercase}',
      '.lt-mascot-loader .lt-loader-bar{width:160px;height:4px;background:rgba(38,78,54,.12);border-radius:99px;overflow:hidden;position:relative}',
      '.lt-mascot-loader .lt-loader-bar::after{content:"";position:absolute;left:-40%;top:0;width:40%;height:100%;background:linear-gradient(90deg,transparent,#264e36,transparent);animation:lt-loader-bar 1.4s ease-in-out infinite}',
      '@keyframes lt-loader-bar{to{left:100%}}',
      // ── Floating mascot button (Ask Tutor) ───────────────────────────
      '.lt-mascot-fab{position:fixed;right:20px;bottom:24px;z-index:2147483640;display:flex;align-items:center;gap:10px;padding:10px 18px 10px 10px;background:#ffffff;color:#1a2530;border:1.5px solid rgba(38,78,54,.18);border-radius:100px;box-shadow:0 14px 36px rgba(15,23,42,.18),0 2px 6px rgba(15,23,42,.08);cursor:pointer;font-family:"Plus Jakarta Sans",system-ui,sans-serif;font-weight:700;font-size:.92rem;transition:transform .25s cubic-bezier(.4,0,.2,1),box-shadow .25s;-webkit-tap-highlight-color:transparent}',
      '.lt-mascot-fab:hover{transform:translateY(-3px);box-shadow:0 22px 48px rgba(15,23,42,.22),0 4px 10px rgba(15,23,42,.1)}',
      '.lt-mascot-fab:active{transform:translateY(-1px)}',
      '.lt-mascot-fab .lt-mascot{width:42px;height:42px;background:linear-gradient(135deg,#f0fdf4,#dcfce7);border-radius:50%;padding:3px;box-sizing:border-box;box-shadow:inset 0 0 0 1.5px rgba(38,78,54,.15)}',
      '.lt-mascot-fab .lt-fab-dot{width:8px;height:8px;border-radius:50%;background:#22c55e;box-shadow:0 0 0 3px rgba(34,197,94,.25);animation:lt-fab-pulse 1.8s ease-in-out infinite;margin-left:auto}',
      '@keyframes lt-fab-pulse{0%,100%{box-shadow:0 0 0 3px rgba(34,197,94,.25)}50%{box-shadow:0 0 0 6px rgba(34,197,94,.05)}}',
      // Drag affordance — a small grip dock on the left, draggable like a
      // vintage Windows title bar. Cursor flips between grab / grabbing.
      '.lt-mascot-fab .lt-fab-grip{display:flex;flex-direction:column;justify-content:center;align-items:center;padding:0 6px 0 2px;cursor:grab;border-right:1px solid rgba(15,23,42,.08);margin-right:8px;height:32px;gap:3px}',
      '.lt-mascot-fab .lt-fab-grip span{width:14px;height:2px;border-radius:1px;background:rgba(15,23,42,.35)}',
      '.lt-mascot-fab.lt-dragging{cursor:grabbing;opacity:.92;transform:none;transition:none;box-shadow:0 24px 60px rgba(15,23,42,.32),0 6px 14px rgba(15,23,42,.18)}',
      '.lt-mascot-fab.lt-dragging .lt-fab-grip{cursor:grabbing}',
      // When user has dragged, anchor the pill via top/left instead of right/bottom
      '.lt-mascot-fab.lt-positioned{right:auto;bottom:auto}',
      '@media(max-width:640px){.lt-mascot-fab{padding:8px 14px 8px 8px;font-size:.84rem}.lt-mascot-fab .lt-mascot{width:36px;height:36px}.lt-mascot-fab .lt-fab-grip{height:26px}}'
    ].join('');
    var s = document.createElement('style');
    s.id = 'lt-mascot-css';
    s.textContent = css;
    document.head.appendChild(s);
  }

  // ─── SVG markup ───────────────────────────────────────────────────
  // viewBox 0 0 220 250 — wider room so the paperclip body extends well below
  // the face (visible as body/legs) and the cap sits cleanly on top.
  function svg(){
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 250" aria-hidden="true">'
      + '<defs>'
        + '<linearGradient id="lt-m-silver" x1="0%" y1="0%" x2="100%" y2="100%">'
          +   '<stop offset="0%" stop-color="#e4e7ec"/>'
          +   '<stop offset="50%" stop-color="#a8aeb8"/>'
          +   '<stop offset="100%" stop-color="#6b7380"/>'
        + '</linearGradient>'
        + '<linearGradient id="lt-m-silver-dark" x1="0%" y1="0%" x2="100%" y2="100%">'
          +   '<stop offset="0%" stop-color="#3b4250"/>'
          +   '<stop offset="100%" stop-color="#1f2530"/>'
        + '</linearGradient>'
        + '<linearGradient id="lt-m-face" x1="0%" y1="0%" x2="0%" y2="100%">'
          +   '<stop offset="0%" stop-color="#fdf3e0"/>'
          +   '<stop offset="100%" stop-color="#f5d8a8"/>'
        + '</linearGradient>'
        + '<radialGradient id="lt-m-glow" cx="50%" cy="40%" r="55%">'
          +   '<stop offset="0%" stop-color="#fff" stop-opacity=".55"/>'
          +   '<stop offset="100%" stop-color="#fff" stop-opacity="0"/>'
        + '</radialGradient>'
      + '</defs>'
      // Ground shadow
      + '<ellipse cx="110" cy="234" rx="64" ry="7" fill="rgba(15,23,42,.22)"/>'
      // ─── Body group (animated) ───────────────────────────────────
      + '<g class="lt-m-body">'
        // ─── 1. FACE OVAL (drawn first, sits inside the paperclip frame)
        + '<ellipse cx="110" cy="138" rx="52" ry="62" fill="url(#lt-m-face)" stroke="#b88a2e" stroke-width="1.6"/>'
        + '<ellipse cx="110" cy="120" rx="44" ry="32" fill="url(#lt-m-glow)"/>'
        // ─── 2. PAPERCLIP — full silhouette wraps around the face like
        //   a frame. Outer wire as a thick navy outline + silver gradient.
        + '<path d="M44 222 L44 90 Q44 48 86 48 L134 48 Q176 48 176 90 L176 220" fill="none" stroke="#0b141a" stroke-width="22" stroke-linecap="round" stroke-linejoin="round"/>'
        + '<path d="M44 222 L44 90 Q44 48 86 48 L134 48 Q176 48 176 90 L176 220" fill="none" stroke="url(#lt-m-silver)" stroke-width="15" stroke-linecap="round" stroke-linejoin="round"/>'
        // Bright top highlight on outer wire
        + '<path d="M48 84 Q50 56 76 50" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round" opacity=".82"/>'
        // ─── 3. SECOND PAPERCLIP WIRE (inner, smaller ∩, asymmetric)
        + '<path d="M70 222 L70 108 Q70 84 92 84 L128 84 Q150 84 150 108 L150 200" fill="none" stroke="#0b141a" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"/>'
        + '<path d="M70 222 L70 108 Q70 84 92 84 L128 84 Q150 84 150 108 L150 200" fill="none" stroke="url(#lt-m-silver)" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"/>'
        + '<path d="M73 102 Q74 86 90 84" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" opacity=".7"/>'
        // ─── Eyes ─────────────────────────────────────────────────
        + '<g>'
          + '<ellipse class="lt-m-eye" cx="96" cy="134" rx="10.5" ry="12" fill="#ffffff" stroke="#1a2530" stroke-width="1.4"/>'
          + '<ellipse class="lt-m-eye" cx="124" cy="134" rx="10.5" ry="12" fill="#ffffff" stroke="#1a2530" stroke-width="1.4"/>'
          // Pupils
          + '<g class="lt-m-pupil-wrap lt-m-pupil-l" style="transform-origin:96px 136px">'
            + '<ellipse cx="96" cy="136" rx="5" ry="6.5" fill="#0b141a"/>'
            + '<circle cx="98" cy="133" r="2" fill="#ffffff"/>'
          + '</g>'
          + '<g class="lt-m-pupil-wrap lt-m-pupil-r" style="transform-origin:124px 136px">'
            + '<ellipse cx="124" cy="136" rx="5" ry="6.5" fill="#0b141a"/>'
            + '<circle cx="126" cy="133" r="2" fill="#ffffff"/>'
          + '</g>'
          // Eyelids for blinking
          + '<rect class="lt-m-eyelid" x="85" y="122" width="22" height="28" rx="11" fill="#fde68a" stroke="#b8923a" stroke-width="1.2"/>'
          + '<rect class="lt-m-eyelid" x="113" y="122" width="22" height="28" rx="11" fill="#fde68a" stroke="#b8923a" stroke-width="1.2"/>'
          // Squint arcs (encouraging)
          + '<path class="lt-m-eye-squint" d="M85 140 Q96 128 107 140" stroke="#1a2530" stroke-width="3" fill="none" stroke-linecap="round"/>'
          + '<path class="lt-m-eye-squint" d="M113 140 Q124 128 135 140" stroke="#1a2530" stroke-width="3" fill="none" stroke-linecap="round"/>'
        + '</g>'
        // Eyebrows
        + '<path class="lt-m-brow-l" d="M85 120 Q95 116 107 120" stroke="#1a2530" stroke-width="3" fill="none" stroke-linecap="round" style="transform-origin:96px 120px"/>'
        + '<path class="lt-m-brow-r" d="M113 120 Q124 116 135 120" stroke="#1a2530" stroke-width="3" fill="none" stroke-linecap="round" style="transform-origin:124px 120px"/>'
        // Mouth — smile (default), bigsmile (encouraging), O (surprised)
        + '<path class="lt-m-smile" d="M98 162 Q110 174 122 162" stroke="#1a2530" stroke-width="3" fill="none" stroke-linecap="round" style="transform-origin:110px 164px"/>'
        + '<path class="lt-m-bigsmile" d="M90 158 Q110 184 130 158 Q121 172 110 172 Q99 172 90 158 Z" fill="#7a2025" stroke="#1a2530" stroke-width="2"/>'
        + '<ellipse class="lt-m-omouth" cx="110" cy="166" rx="6" ry="8" fill="#3c1518"/>'
        // Cheek dots
        + '<circle cx="84" cy="158" r="4.6" fill="#f9a8d4" opacity=".8"/>'
        + '<circle cx="136" cy="158" r="4.6" fill="#f9a8d4" opacity=".8"/>'
        // Typing dots (under mouth)
        + '<g class="lt-m-dots">'
          + '<circle class="lt-m-dot1" cx="98" cy="168" r="2.5" fill="#1a2530"/>'
          + '<circle class="lt-m-dot2" cx="110" cy="168" r="2.5" fill="#1a2530"/>'
          + '<circle class="lt-m-dot3" cx="122" cy="168" r="2.5" fill="#1a2530"/>'
        + '</g>'
        // ─── Graduation cap (mortarboard) ────────────────────────
        + '<g>'
          // Back of board
          + '<path d="M40 46 L110 22 L180 46 L110 70 Z" fill="#0b141a"/>'
          // Top highlight band
          + '<path d="M52 46 L110 26 L168 46 L110 66 Z" fill="#1f2a36"/>'
          // Strap under cap
          + '<rect x="76" y="46" width="68" height="8" rx="2" fill="#0b141a"/>'
          + '<path d="M78 52 Q110 60 142 52" stroke="#1a2530" stroke-width="2" fill="none"/>'
          // Button on top centre
          + '<circle cx="110" cy="36" r="3.6" fill="#264e36"/>'
          + '<circle cx="110" cy="36" r="1.6" fill="#10b981" opacity=".7"/>'
          // Tassel from top-right
          + '<g class="lt-m-tassel">'
            + '<path d="M158 36 Q166 50 167 70" stroke="#fbbf24" stroke-width="2.6" fill="none" stroke-linecap="round"/>'
            + '<circle cx="167" cy="72" r="5.5" fill="#fbbf24"/>'
            + '<line x1="167" y1="68" x2="167" y2="79" stroke="#b45309" stroke-width="1.6" stroke-linecap="round"/>'
            + '<line x1="163" y1="72" x2="171" y2="74" stroke="#b45309" stroke-width="1.4" stroke-linecap="round"/>'
          + '</g>'
        + '</g>'
        // Thinking — light bulb top-right
        + '<g class="lt-m-bulb">'
          + '<circle cx="184" cy="30" r="11" fill="#fef08a" stroke="#ca8a04" stroke-width="1.5"/>'
          + '<rect x="179" y="40" width="10" height="4" rx="1" fill="#a98843"/>'
          + '<rect x="180" y="44" width="8" height="2" rx="1" fill="#78350f"/>'
          + '<path d="M180 16 L183 22" stroke="#fbbf24" stroke-width="2" stroke-linecap="round"/>'
          + '<path d="M192 16 L189 22" stroke="#fbbf24" stroke-width="2" stroke-linecap="round"/>'
          + '<path d="M200 28 L194 30" stroke="#fbbf24" stroke-width="2" stroke-linecap="round"/>'
        + '</g>'
        // Encouraging — confetti
        + '<g class="lt-m-confetti">'
          + '<rect x="44" y="38" width="3" height="9" rx="1.5" fill="#264e36" transform="rotate(20 45 42)"/>'
          + '<rect x="172" y="40" width="3" height="9" rx="1.5" fill="#7a2025" transform="rotate(-22 173 44)"/>'
          + '<rect x="62" y="28" width="3" height="7" rx="1.5" fill="#2a4d6e" transform="rotate(40 63 31)"/>'
          + '<rect x="156" y="30" width="3" height="7" rx="1.5" fill="#fbbf24" transform="rotate(-40 157 33)"/>'
          + '<circle cx="35" cy="56" r="2.4" fill="#22c55e"/>'
          + '<circle cx="185" cy="58" r="2.4" fill="#f59e0b"/>'
        + '</g>'
      + '</g>'
      + '</svg>';
  }

  // ─── Public API ───────────────────────────────────────────────────
  function create(opts){
    opts = opts || {};
    injectStyles();
    var size = opts.size || 64;
    var state = opts.state || 'idle';
    var animated = opts.animated !== false;
    var wrap = document.createElement('span');
    wrap.className = 'lt-mascot' + (animated ? ' animated' : '') + (opts.clickable ? ' clickable' : '');
    wrap.setAttribute('data-state', state);
    wrap.setAttribute('role', 'img');
    wrap.setAttribute('aria-label', 'Lesson Teacher mascot');
    wrap.style.width = size + 'px';
    wrap.style.height = size + 'px';
    wrap.innerHTML = svg();
    return wrap;
  }

  function render(el, opts){
    if (!el) return null;
    var m = create(opts);
    el.innerHTML = '';
    el.appendChild(m);
    return m;
  }

  function setState(el, state){
    if (!el) return;
    var m = el.classList && el.classList.contains('lt-mascot') ? el : el.querySelector && el.querySelector('.lt-mascot');
    if (m) m.setAttribute('data-state', state);
  }

  function setAll(state){
    document.querySelectorAll('.lt-mascot').forEach(function(m){ m.setAttribute('data-state', state); });
  }

  // Replace stand-alone 👩‍🏫 text nodes with a sized mascot. Idempotent.
  function replaceEmoji(root){
    injectStyles();
    root = root || document.body;
    var EMOJI = '👩‍🏫';
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: function(n){
        if (!n.nodeValue || n.nodeValue.indexOf(EMOJI) < 0) return NodeFilter.FILTER_REJECT;
        var p = n.parentNode;
        if (!p) return NodeFilter.FILTER_REJECT;
        if (p.closest && p.closest('.lt-mascot,script,style,textarea,input,[contenteditable]')) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    var nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(function(node){
      var parts = node.nodeValue.split(EMOJI);
      var frag = document.createDocumentFragment();
      parts.forEach(function(text, i){
        if (text) frag.appendChild(document.createTextNode(text));
        if (i < parts.length - 1){
          var fs = 16;
          try { fs = parseFloat(getComputedStyle(node.parentNode).fontSize) || 16; } catch(e){}
          // Use bigger multiplier than before so the mascot reads well
          var size = Math.max(28, Math.round(fs * 1.9));
          var m = create({ size: size, state: 'idle' });
          m.style.verticalAlign = '-.35em';
          m.style.marginRight = '4px';
          frag.appendChild(m);
        }
      });
      node.parentNode.replaceChild(frag, node);
    });
  }

  // Wrap an AI bubble element with the halo ring + a tiny mascot avatar.
  // Idempotent — call multiple times safely.
  function wrapAIBubble(el){
    if (!el || el.dataset.ltHaloed === '1') return;
    el.dataset.ltHaloed = '1';
    el.classList.add('lt-ai-wrap');
    var avt = document.createElement('span');
    avt.className = 'lt-ai-avatar';
    var halo = document.createElement('span');
    halo.className = 'lt-halo lt-halo-host';
    halo.style.cssText = 'width:48px;height:48px;background:#fff;box-shadow:0 4px 14px rgba(38,78,54,.15)';
    halo.appendChild(create({ size: 40, state: 'idle' }));
    avt.appendChild(halo);
    el.appendChild(avt);
  }

  // Mount a loader UI in the given parent — mascot + message + bar.
  function mountLoader(parent, opts){
    if (!parent) return null;
    opts = opts || {};
    injectStyles();
    var wrap = document.createElement('div');
    wrap.className = 'lt-mascot-loader';
    var m = create({ size: opts.size || 110, state: opts.state || 'thinking' });
    wrap.appendChild(m);
    if (opts.message){
      var msg = document.createElement('div');
      msg.className = 'lt-loader-msg';
      msg.textContent = opts.message;
      wrap.appendChild(msg);
    }
    if (opts.sub){
      var sub = document.createElement('div');
      sub.className = 'lt-loader-sub';
      sub.textContent = opts.sub;
      wrap.appendChild(sub);
    }
    var bar = document.createElement('div');
    bar.className = 'lt-loader-bar';
    wrap.appendChild(bar);
    parent.innerHTML = '';
    parent.appendChild(wrap);
    return wrap;
  }

  // Build a floating action button — mascot avatar + label, draggable
  // by its left grip handle (like a vintage Windows title bar). Position
  // persists in localStorage under opts.persistKey (default 'lt-fab-pos').
  function mountButton(opts){
    opts = opts || {};
    injectStyles();
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'lt-mascot-fab';
    btn.setAttribute('data-no-translate', '1');
    // Drag grip
    var grip = document.createElement('span');
    grip.className = 'lt-fab-grip';
    grip.title = 'Drag me';
    grip.setAttribute('aria-label', 'Drag the AI tutor pill to reposition');
    grip.innerHTML = '<span></span><span></span><span></span><span></span>';
    btn.appendChild(grip);
    // Mascot avatar + label
    btn.appendChild(create({ size: 42, state: 'idle' }));
    var lbl = document.createElement('span');
    lbl.textContent = opts.label || 'Ask Tutor';
    btn.appendChild(lbl);
    if (opts.dot !== false){
      var dot = document.createElement('span');
      dot.className = 'lt-fab-dot';
      btn.appendChild(dot);
    }
    // Click — only fires if the user didn't drag (movement under threshold)
    var moved = false;
    if (typeof opts.onClick === 'function'){
      btn.addEventListener('click', function(e){
        if (moved) { moved = false; e.preventDefault(); e.stopPropagation(); return; }
        try { btn.querySelector('.lt-mascot').setAttribute('data-state', 'encouraging'); } catch(_){ }
        setTimeout(function(){ try { btn.querySelector('.lt-mascot').setAttribute('data-state','idle'); } catch(_){ } }, 800);
        opts.onClick(e);
      });
    }
    // ─── Drag handling ─────────────────────────────────────────────
    var PERSIST_KEY = opts.persistKey || 'lt-fab-pos';
    function clampToViewport(x, y){
      var r = btn.getBoundingClientRect();
      var w = r.width || 200, h = r.height || 56;
      var maxX = window.innerWidth  - w - 6;
      var maxY = window.innerHeight - h - 6;
      return { x: Math.max(6, Math.min(maxX, x)), y: Math.max(6, Math.min(maxY, y)) };
    }
    function applyPos(x, y){
      var p = clampToViewport(x, y);
      btn.classList.add('lt-positioned');
      btn.style.left = p.x + 'px';
      btn.style.top  = p.y + 'px';
    }
    // Restore last saved position
    try {
      var raw = localStorage.getItem(PERSIST_KEY);
      if (raw){
        var saved = JSON.parse(raw);
        if (saved && typeof saved.x === 'number' && typeof saved.y === 'number'){
          // Defer until DOM measured
          setTimeout(function(){ applyPos(saved.x, saved.y); }, 0);
        }
      }
    } catch(e){}
    // Keep inside viewport on resize
    window.addEventListener('resize', function(){
      if (!btn.classList.contains('lt-positioned')) return;
      var r = btn.getBoundingClientRect();
      applyPos(r.left, r.top);
    });

    var drag = null;
    function onPointerDown(e){
      // Only start drag from the grip — the rest of the button is clickable
      if (!grip.contains(e.target) && e.target !== grip) return;
      e.preventDefault();
      var r = btn.getBoundingClientRect();
      drag = {
        startX: e.clientX, startY: e.clientY,
        baseLeft: r.left, baseTop: r.top,
        pointerId: e.pointerId
      };
      moved = false;
      btn.classList.add('lt-dragging');
      try { grip.setPointerCapture(e.pointerId); } catch(_){}
      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', onPointerUp, { once: true });
      window.addEventListener('pointercancel', onPointerUp, { once: true });
    }
    function onPointerMove(e){
      if (!drag) return;
      var dx = e.clientX - drag.startX;
      var dy = e.clientY - drag.startY;
      if (Math.abs(dx) + Math.abs(dy) > 4) moved = true;
      applyPos(drag.baseLeft + dx, drag.baseTop + dy);
    }
    function onPointerUp(e){
      if (!drag) return;
      window.removeEventListener('pointermove', onPointerMove);
      btn.classList.remove('lt-dragging');
      // Persist final position
      try {
        var r = btn.getBoundingClientRect();
        localStorage.setItem(PERSIST_KEY, JSON.stringify({ x: Math.round(r.left), y: Math.round(r.top) }));
      } catch(e){}
      drag = null;
      // Brief encouraging blink after a successful drag
      if (moved){
        try { btn.querySelector('.lt-mascot').setAttribute('data-state','encouraging'); } catch(_){}
        setTimeout(function(){ try { btn.querySelector('.lt-mascot').setAttribute('data-state','idle'); } catch(_){} }, 700);
      }
    }
    grip.addEventListener('pointerdown', onPointerDown);
    // Double-click the grip = reset to default position
    grip.addEventListener('dblclick', function(){
      btn.classList.remove('lt-positioned');
      btn.style.left = btn.style.top = '';
      try { localStorage.removeItem(PERSIST_KEY); } catch(e){}
    });
    return btn;
  }

  // ─── Auto-bootstrap ────────────────────────────────────────────────
  function boot(){
    injectStyles();
    replaceEmoji(document.body);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
  window.addEventListener('lt-page-change', function(){ try { replaceEmoji(document.body); } catch(e){} });
  setInterval(function(){ try { replaceEmoji(document.body); } catch(e){} }, 1500);

  // ─── Hook AI events ────────────────────────────────────────────────
  var inFlight = 0;
  var origFetch = window.fetch;
  if (typeof origFetch === 'function'){
    window.fetch = function(url, opts){
      var u = (typeof url === 'string') ? url : (url && url.url) || '';
      var isAI = (u.indexOf('/api/anthropic') === 0 || u.indexOf('/api/openai') === 0);
      if (isAI){
        inFlight++;
        if (inFlight === 1) setAll('thinking');
      }
      var p = origFetch.apply(this, arguments);
      if (isAI){
        p.then(function(){
          inFlight = Math.max(0, inFlight - 1);
          if (inFlight === 0){
            setAll('explaining');
            setTimeout(function(){ if (inFlight === 0) setAll('idle'); }, 1600);
          }
        }, function(){
          inFlight = Math.max(0, inFlight - 1);
          if (inFlight === 0){
            setAll('surprised');
            setTimeout(function(){ if (inFlight === 0) setAll('idle'); }, 1600);
          }
        });
      }
      return p;
    };
  }

  // Public surface
  window.LTMascot = {
    create: create,
    render: render,
    setState: setState,
    setAll: setAll,
    replaceEmoji: replaceEmoji,
    wrapAIBubble: wrapAIBubble,
    mountLoader: mountLoader,
    mountButton: mountButton
  };
})();
