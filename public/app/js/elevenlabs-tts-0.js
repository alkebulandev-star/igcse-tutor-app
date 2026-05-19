/* ElevenLabs TTS shim — overrides window.speechSynthesis so every existing
   speak() call routes through the /api/elevenlabs Vercel serverless proxy.
   The ElevenLabs API key lives only in Vercel env vars (ELEVENLABS_API_KEY).
   No keys are ever read or stored on the client. */
(function () {
  if (window.__ELEVEN_TTS_INSTALLED__) return;
  window.__ELEVEN_TTS_INSTALLED__ = true;

  var ENDPOINT = '/api/elevenlabs';
  var VOICE_ID = 'QrjqRcZWGRzghe6ZPmh2'; // British accent
  window.ELEVEN_VOICE_ID = VOICE_ID;

  var currentAudio = null;
  var currentCtl = null;
  var cache = new Map(); // text -> objectURL
  var audioUnlocked = false;
  var pendingPlay = null; // {url, onend} retried on next gesture
  var playSeq = 0;

  function unlockAudio() {
    if (audioUnlocked) return;
    try {
      var s = new Audio();
      s.muted = true;
      s.src = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA=';
      var p = s.play();
      if (p && p.then) p.then(function () { audioUnlocked = true; }).catch(function () {});
      else audioUnlocked = true;
    } catch (e) {}
  }
  ['click', 'touchstart', 'keydown', 'pointerdown'].forEach(function (ev) {
    window.addEventListener(ev, function () {
      unlockAudio();
      if (pendingPlay) {
        var pp = pendingPlay; pendingPlay = null;
        hideTapToHearBtn();
        actuallyPlay(pp.url, pp.onend);
      }
    }, { capture: true, once: false });
  });

  function stop() {
    try { if (currentCtl) currentCtl.abort(); } catch (e) {}
    currentCtl = null;
    if (currentAudio) {
      try { currentAudio.pause(); } catch (e) {}
      currentAudio.src = '';
      currentAudio = null;
    }
  }

  // ── Diagnostic pill — visible ONLY when ?diag=1 in URL ────────
  // Shows the most recent TTS attempt: language, status, blocked flag.
  // Tells the user what's happening so they can copy what they see.
  var DIAG = (function(){
    try { return /[?&]diag=1\b/.test(location.search); } catch(e){ return false; }
  })();
  function diag(msg, color){
    if (!DIAG) return;
    try { console.log('[TTS-DIAG]', msg); } catch(e){}
    var pill = document.getElementById('lt-tts-diag');
    if (!pill){
      pill = document.createElement('div');
      pill.id = 'lt-tts-diag';
      pill.setAttribute('data-no-translate', '1');
      pill.style.cssText = 'position:fixed;top:60px;left:8px;z-index:2147483641;background:#0f172a;color:#e2e8f0;border:1px solid rgba(255,255,255,.15);border-radius:8px;padding:8px 12px;font:600 .72rem ui-monospace,monospace;max-width:320px;line-height:1.45;box-shadow:0 8px 24px rgba(0,0,0,.4);pointer-events:none;';
      document.body.appendChild(pill);
    }
    pill.style.borderLeft = '3px solid ' + (color || '#3b82f6');
    pill.textContent = msg;
  }

  async function fetchAudio(text) {
    var lang = (window.LTLang && typeof window.LTLang.elevenLanguageCode === 'function')
      ? window.LTLang.elevenLanguageCode() : '';
    var cacheKey = (lang || 'en') + '|' + text;
    if (cache.has(cacheKey)) {
      try { console.log('[ElevenLabs] cache hit'); } catch(e){}
      diag('CACHE HIT (' + (lang||'en') + '): ' + text.slice(0,40), '#10b981');
      return cache.get(cacheKey);
    }
    currentCtl = new AbortController();
    try { console.log('[ElevenLabs] fetching audio (' + (lang||'en') + ') for:', text.slice(0, 60) + (text.length > 60 ? '…' : '')); } catch(e){}
    diag('FETCH (' + (lang||'en') + '): ' + text.slice(0,40), '#3b82f6');
    var body = { text: text, voiceId: VOICE_ID };
    if (lang && lang !== 'en') body.languageCode = lang;
    // Allow a user-pasted key (preview/dev) — the /api/elevenlabs handler
    // honours xi-api-key header when present, otherwise falls back to the
    // server-side ELEVENLABS_API_KEY env var.
    var headers = { 'content-type': 'application/json' };
    try {
      var userKey = localStorage.getItem('ELEVENLABS_API_KEY');
      if (userKey) headers['x-eleven-key'] = userKey.trim();
    } catch(_){}
    var resp;
    try {
      resp = await fetch(ENDPOINT, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(body),
        signal: currentCtl.signal,
      });
    } catch (netErr) {
      diag('NETWORK ERROR: ' + (netErr && netErr.message), '#ef4444');
      throw netErr;
    }
    if (!resp.ok) {
      var detail = '';
      try { detail = await resp.text(); } catch (e) {}
      try { console.error('[ElevenLabs] fetch failed:', resp.status, detail); } catch(e){}
      diag('HTTP ' + resp.status + ': ' + detail.slice(0,80), '#ef4444');
      throw new Error('TTS ' + resp.status + ' ' + detail);
    }
    var blob = await resp.blob();
    var url = URL.createObjectURL(blob);
    diag('OK ' + blob.size + ' bytes (' + (lang||'en') + ')', '#10b981');
    if (cache.size > 80) {
      var firstKey = cache.keys().next().value;
      try { URL.revokeObjectURL(cache.get(firstKey)); } catch (e) {}
      cache.delete(firstKey);
    }
    cache.set(cacheKey, url);
    return url;
  }

  function showTapToHearBtn() {
    if (document.getElementById('lt-tap-hear')) return;
    var btn = document.createElement('button');
    btn.id = 'lt-tap-hear';
    btn.setAttribute('data-no-translate', '1');
    btn.style.cssText = [
      'position:fixed', 'bottom:30px', 'left:50%', 'transform:translateX(-50%)',
      'z-index:2147483640',
      'background:linear-gradient(135deg,#10b981,#3b82f6)',
      'color:#fff', 'border:0',
      'padding:14px 28px',
      'border-radius:100px',
      'font-family:"Plus Jakarta Sans",system-ui,sans-serif',
      'font-size:1rem', 'font-weight:800',
      'cursor:pointer',
      'box-shadow:0 12px 32px rgba(0,0,0,.45)',
      'display:flex', 'align-items:center', 'gap:10px',
      'animation:ltPulse 1.3s ease-in-out infinite',
      'max-width:90vw'
    ].join(';');
    btn.innerHTML = '🔊 <span>Tap to hear narration</span>';
    if (!document.getElementById('lt-tap-hear-css')){
      var styleTag = document.createElement('style');
      styleTag.id = 'lt-tap-hear-css';
      styleTag.textContent = '@keyframes ltPulse{0%,100%{transform:translateX(-50%) scale(1);box-shadow:0 12px 32px rgba(0,0,0,.45)}50%{transform:translateX(-50%) scale(1.04);box-shadow:0 16px 40px rgba(16,185,129,.55)}}';
      document.head.appendChild(styleTag);
    }
    btn.onclick = function() {
      hideTapToHearBtn();
    };
    document.body.appendChild(btn);
  }
  function hideTapToHearBtn() {
    var b = document.getElementById('lt-tap-hear');
    if (b) b.remove();
  }
  function actuallyPlay(url, onend) {
    try { if (currentAudio) { currentAudio.pause(); currentAudio.src = ''; } } catch (e) {}
    var a = new Audio(url);
    currentAudio = a;
    a.onended = function () { if (typeof onend === 'function') try { onend(null); } catch (e) {} };
    a.onerror = function () { if (typeof onend === 'function') try { onend({ error: 'audio element error' }); } catch (e) {} };
    var pr = a.play();
    if (pr && pr.then) {
      pr.then(function() { hideTapToHearBtn(); diag('PLAYING', '#10b981'); }).catch(function (err) {
        console.warn('[ElevenLabs] audio.play() blocked:', err && err.message || err);
        diag('AUTOPLAY BLOCKED — Tap-to-hear shown', '#f59e0b');
        pendingPlay = { url: url, onend: onend };
        showTapToHearBtn();
        if (typeof onend === 'function') try { onend({ error: 'autoplay-blocked', blocked: true }); } catch (e) {}
      });
    } else {
      hideTapToHearBtn();
    }
  }

  // Fallback: native browser TTS — runs the REAL speak/cancel/getVoices that
  // we captured before installing the shim. Browsers load voices async, so we
  // retry once the voiceschanged event fires.
  function pickBritishVoice(voices){
    if (!voices || !voices.length) return null;
    return voices.find(function(v){ return v.lang === 'en-GB' && /serena|kate|fiona|emily|karen|martha|amy|alice|daniel|premium|enhanced|neural/i.test(v.name); })
        || voices.find(function(v){ return v.lang === 'en-GB'; })
        || voices.find(function(v){ return v.lang && v.lang.toLowerCase().indexOf('en-gb') === 0; })
        || voices.find(function(v){ return v.lang && v.lang.indexOf('en') === 0; })
        || voices[0];
  }
  function nativeFallbackSpeak(text, onend){
    var nat   = window.__nativeSpeechSynth__;
    var Ut    = window.__nativeUtter__;
    var speak = window.__nativeSpeak__;       // un-shimmed function ref
    var getV  = window.__nativeGetVoices__;
    var cancel= window.__nativeCancel__;
    if (!nat || !Ut || !speak){
      if (typeof onend === 'function') try { onend({ error:'no-tts' }); } catch(e){}
      return;
    }
    try { if (cancel) cancel.call(nat); } catch(e){}

    function doSpeak(){
      var u = new Ut(text);
      u.volume = 1; u.rate = 0.97; u.pitch = 1; u.lang = 'en-GB';
      try {
        var voices = (getV ? getV.call(nat) : []) || [];
        var pick = pickBritishVoice(voices);
        if (pick) u.voice = pick;
      } catch(e){}
      u.onend = function(){ if (typeof onend === 'function') try { onend(null); } catch(e){} };
      u.onerror = function(){ if (typeof onend === 'function') try { onend({ error:'native-tts-error' }); } catch(e){} };
      try { speak.call(nat, u); diag('NATIVE en-GB speaking', '#10b981'); }
      catch(e){ if (typeof onend === 'function') try { onend({ error:String(e) }); } catch(_){} }
    }

    // Voices may not be loaded on first call — wait once for voiceschanged
    var voices = (getV ? getV.call(nat) : []) || [];
    if (!voices.length && typeof nat.addEventListener === 'function'){
      var fired = false;
      var on = function(){ if (fired) return; fired = true; try { nat.removeEventListener('voiceschanged', on); } catch(e){} doSpeak(); };
      try { nat.addEventListener('voiceschanged', on); } catch(e){}
      setTimeout(on, 600); // fallback if event never fires
    } else {
      doSpeak();
    }
  }

  async function play(text, onend) {
    var seq = ++playSeq;
    stop();
    try {
      var url = await fetchAudio(text);
      if (seq !== playSeq) return;
      actuallyPlay(url, onend);
    } catch (e) {
      if (e && e.name === 'AbortError') return;
      console.warn('[ElevenLabs] TTS failed:', e && e.message || e);
      diag('TTS UNAVAILABLE — set ELEVENLABS_API_KEY on Vercel', '#ef4444');
      showTTSDownToast();
      if (typeof onend === 'function') try { onend({ error:'eleven-down', message: e && e.message || String(e) }); } catch(_){}
    }
  }
  // Minimal toast that explains why audio didn't play — surfaces once
  // per page load so it doesn't repeat after every retry.
  var ttsToastShown = false;
  function showTTSDownToast(){
    if (ttsToastShown) return; ttsToastShown = true;
    var t = document.createElement('div');
    t.style.cssText = 'position:fixed;left:50%;bottom:90px;transform:translateX(-50%);z-index:2147483647;background:#0b141a;color:#fbf8f1;padding:12px 18px;border-radius:10px;border:1px solid rgba(255,255,255,.18);font:600 .82rem/1.4 -apple-system,system-ui,sans-serif;box-shadow:0 16px 40px rgba(0,0,0,.4);max-width:340px;text-align:center';
    t.innerHTML = '🔊 British voice unavailable<br><span style="font-weight:400;font-size:.74rem;opacity:.85">Set <code style="background:rgba(255,255,255,.08);padding:1px 5px;border-radius:3px">ELEVENLABS_API_KEY</code> in Vercel env vars, then redeploy.</span>';
    document.body.appendChild(t);
    setTimeout(function(){ try { t.style.transition='opacity .4s'; t.style.opacity='0'; setTimeout(function(){ t.remove(); }, 500); } catch(_){} }, 6000);
  }

  // Override SpeechSynthesisUtterance to be a plain text holder
  function ShimUtter(text) {
    this.text = text || '';
    this.lang = ''; this.rate = 1; this.pitch = 1; this.volume = 1; this.voice = null;
    this.onend = null; this.onerror = null; this.onstart = null;
  }
  // ── Preserve the REAL browser speech synthesis BEFORE we replace anything ──
  // Capture method REFERENCES too — once we reassign window.speechSynthesis.speak,
  // the saved object points at the shim, so we'd recurse infinitely on fallback.
  window.__nativeSpeechSynth__ = window.speechSynthesis || null;
  window.__nativeUtter__ = window.SpeechSynthesisUtterance || null;
  if (window.speechSynthesis){
    window.__nativeSpeak__     = window.speechSynthesis.speak;
    window.__nativeCancel__    = window.speechSynthesis.cancel;
    window.__nativeGetVoices__ = window.speechSynthesis.getVoices;
    // Warm up the voice list — Chrome/Safari load it async on first call
    try { window.speechSynthesis.getVoices(); } catch(e){}
    try { window.speechSynthesis.addEventListener && window.speechSynthesis.addEventListener('voiceschanged', function(){ /* no-op, just triggers load */ }); } catch(e){}
  }

  window.SpeechSynthesisUtterance = ShimUtter;

  if (window.speechSynthesis) {
    window.speechSynthesis.speak = function (utter) {
      var t = (utter && utter.text) || '';
      if (!t) return;
      if (typeof utter.onstart === 'function') { try { utter.onstart(); } catch (e) {} }
      play(t, function(errFlag){
        if (errFlag && typeof utter.onerror === 'function') { try { utter.onerror(errFlag); } catch (e) {} }
        if (typeof utter.onend === 'function') { try { utter.onend(errFlag); } catch (e) {} }
      });
    };
    window.speechSynthesis.cancel = function () { stop(); };
    // Return the real voice list so any caller that filters by language works
    window.speechSynthesis.getVoices = function () {
      try { return (window.__nativeGetVoices__ && window.__nativeGetVoices__.call(window.__nativeSpeechSynth__)) || []; }
      catch(e){ return []; }
    };
  }

  window.elevenSpeak = function (text, onend) { play(String(text || ''), onend); };
  window.elevenStop = stop;
})();
