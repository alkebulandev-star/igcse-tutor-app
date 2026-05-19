
// ══════════════ LANGUAGE MODULE DATA ══════════════
// Internal keys (french, spanish, mandarin, …) stay stable so the speech /
// translation engine, the language picker UI and the AI router keep working
// without refactor. Only the payload (greetings, phrases, cultural tip,
// intro copy) is rewritten for British-curriculum international students.
window.LT_LANGUAGES = {
  french: {
    name:'French', flag:'🇫🇷', color:'#0055A4',
    intro:'French is the most popular A-Level Modern Foreign Language and a key Russell-Group entry subject. It opens up the Sorbonne, Sciences Po and the European Commission — and is widely spoken across 29 countries.',
    greetings:[
      {yor:'Bonjour',           en:'Good morning / Hello',     note:'Until late afternoon'},
      {yor:'Bonsoir',           en:'Good evening',             note:''},
      {yor:'Salut',             en:'Hi (informal)',            note:'Friends only — never with teachers'},
      {yor:'Comment ça va?',    en:'How are you?',             note:'Casual'},
      {yor:'Ça va bien, merci', en:'I am well, thank you',     note:''},
      {yor:'Merci beaucoup',    en:'Thank you very much',      note:''},
      {yor:'S\'il vous plaît',  en:'Please',                   note:'Polite (vous) form'},
      {yor:'Au revoir',         en:'Goodbye',                  note:''},
      {yor:'Enchanté(e)',       en:'Nice to meet you',         note:'Add -e if speaker is female'}
    ],
    phrases:[
      {yor:'Je m\'appelle…',             en:'My name is…'},
      {yor:'Je ne comprends pas',        en:'I don\'t understand'},
      {yor:'Où sont les toilettes?',     en:'Where are the toilets?'},
      {yor:'C\'est combien?',            en:'How much is it?'},
      {yor:'J\'ai besoin d\'aide',       en:'I need help'},
      {yor:'Je voudrais un thé, s\'il vous plaît', en:'I\'d like a tea, please'},
      {yor:'Quelle heure est-il?',       en:'What time is it?'},
      {yor:'Je suis britannique',        en:'I am British'}
    ],
    tip:'Tip: French nouns have gender — le (masculine), la (feminine). Learn the gender with the word, not separately. For Cambridge IGCSE 0520 and A-Level 9716: practise dictées, listen to RFI / France Culture, read Le Monde headlines daily.'
  },
  spanish: {
    name:'Spanish', flag:'🇪🇸', color:'#AA151B',
    intro:'Spanish is the world\'s second most-spoken native language (560M speakers). A British Council survey ranks it the most useful language for the UK post-Brexit. Gateway to UCL\'s Iberian Studies and a future at the EU, UN or in the Premier League sports world.',
    greetings:[
      {yor:'Hola',              en:'Hello',                    note:'Universal'},
      {yor:'Buenos días',       en:'Good morning',             note:''},
      {yor:'Buenas tardes',     en:'Good afternoon',           note:''},
      {yor:'Buenas noches',     en:'Good evening / night',     note:''},
      {yor:'¿Cómo estás?',      en:'How are you?',             note:'Informal (tú)'},
      {yor:'¿Cómo está usted?', en:'How are you?',             note:'Formal (usted)'},
      {yor:'Estoy bien, gracias', en:'I am well, thank you',   note:''},
      {yor:'Por favor',         en:'Please',                   note:''},
      {yor:'Adiós',             en:'Goodbye',                  note:''},
      {yor:'Mucho gusto',       en:'Nice to meet you',         note:''}
    ],
    phrases:[
      {yor:'Me llamo…',                  en:'My name is…'},
      {yor:'No entiendo',                en:'I don\'t understand'},
      {yor:'¿Dónde está…?',              en:'Where is…?'},
      {yor:'¿Cuánto cuesta?',            en:'How much does it cost?'},
      {yor:'Necesito ayuda',             en:'I need help'},
      {yor:'Soy de Inglaterra / Escocia / Gales', en:'I\'m from England / Scotland / Wales'},
      {yor:'Hablo un poco de español',   en:'I speak a little Spanish'},
      {yor:'Hasta luego',                en:'See you later'}
    ],
    tip:'Tip: Spanish is mostly phonetic — read it as you see it. "ñ" sounds like "ny" in canyon, "ll" like "y" in yes (or "j" in some dialects), and "r" is rolled. Cambridge IGCSE 0530 and A-Level 9719 reward precise verb conjugation.'
  },
  mandarin: {
    name:'Mandarin Chinese', flag:'🇨🇳', color:'#DE2910',
    intro:'Mandarin is the most-spoken first language in the world. The British Council\'s Mandarin Excellence Programme funds 5,000 UK pupils a year. A real advantage for Oxbridge, LSE and any business career touching East Asia.',
    greetings:[
      {yor:'Nǐ hǎo (你好)',     en:'Hello',                    note:'Universal'},
      {yor:'Zǎo shang hǎo (早上好)', en:'Good morning',         note:''},
      {yor:'Wǎn shàng hǎo (晚上好)', en:'Good evening',         note:''},
      {yor:'Nǐ hǎo ma? (你好吗)',en:'How are you?',             note:''},
      {yor:'Wǒ hěn hǎo (我很好)',en:'I am very well',           note:''},
      {yor:'Xièxiè (谢谢)',      en:'Thank you',                note:''},
      {yor:'Bù kèqì (不客气)',   en:'You\'re welcome',          note:''},
      {yor:'Qǐng (请)',          en:'Please',                   note:''},
      {yor:'Zàijiàn (再见)',     en:'Goodbye',                  note:'Literally "see again"'}
    ],
    phrases:[
      {yor:'Wǒ jiào… (我叫…)',  en:'My name is…'},
      {yor:'Wǒ bù dǒng (我不懂)',en:'I don\'t understand'},
      {yor:'… zài nǎlǐ? (…在哪里)', en:'Where is…?'},
      {yor:'Duōshǎo qián? (多少钱)',en:'How much money?'},
      {yor:'Qǐng bāng wǒ (请帮我)', en:'Please help me'},
      {yor:'Wǒ shì yīngguó rén (我是英国人)', en:'I am British'},
      {yor:'Wǒ huì shuō yīngyǔ (我会说英语)', en:'I can speak English'}
    ],
    tip:'Tip: Mandarin has 4 tones + a neutral one. Same syllable, different tone = different word: mā (mother) · má (hemp) · mǎ (horse) · mà (scold). Sing the words; don\'t just say them. Cambridge IGCSE 0547 and A-Level 9715 examine pinyin AND character recognition.'
  },
  german: {
    name:'German', flag:'🇩🇪', color:'#000000',
    intro:'Germany offers tuition-free university education at world-class institutions (TU Munich, Heidelberg, Humboldt) for British students who pass the TestDaF / DSH exams. German is also a top-three EU working language and a strong A-Level pick for engineering and STEM students.',
    greetings:[
      {yor:'Hallo',             en:'Hello',                    note:'Universal'},
      {yor:'Guten Morgen',      en:'Good morning',             note:''},
      {yor:'Guten Tag',         en:'Good day',                 note:'Daytime greeting'},
      {yor:'Guten Abend',       en:'Good evening',             note:''},
      {yor:'Wie geht es dir?',  en:'How are you? (informal)',  note:'du form'},
      {yor:'Wie geht es Ihnen?',en:'How are you? (formal)',    note:'Sie form'},
      {yor:'Mir geht es gut',   en:'I am well',                note:''},
      {yor:'Danke schön',       en:'Thank you very much',      note:''},
      {yor:'Bitte',             en:'Please / You\'re welcome', note:'Multi-use'},
      {yor:'Auf Wiedersehen',   en:'Goodbye',                  note:''}
    ],
    phrases:[
      {yor:'Ich heiße…',                 en:'My name is…'},
      {yor:'Ich verstehe nicht',         en:'I don\'t understand'},
      {yor:'Wo ist…?',                   en:'Where is…?'},
      {yor:'Wie viel kostet das?',       en:'How much does it cost?'},
      {yor:'Ich brauche Hilfe',          en:'I need help'},
      {yor:'Ich komme aus England / Schottland', en:'I come from England / Scotland'},
      {yor:'Sprechen Sie Englisch?',     en:'Do you speak English?'},
      {yor:'Ich möchte studieren',       en:'I would like to study'}
    ],
    tip:'Tip: German nouns are always capitalised: das Buch (the book), der Mann (the man), die Frau (the woman). Genders are unpredictable — learn the article with the noun. Cambridge IGCSE 0525 and A-Level 9717 reward grammatical accuracy: cases (Nominativ/Akkusativ/Dativ/Genitiv) decide everything.'
  },
  italian: {
    name:'Italian', flag:'🇮🇹', color:'#008C45',
    intro:'Italian is the fourth most-popular A-Level MFL after French, Spanish and German. It opens up Bocconi, Politecnico di Milano and the world of fashion, art history, opera and Vatican-Latin scholarship.',
    greetings:[
      {yor:'Ciao',              en:'Hi / Bye',                 note:'Informal, both greeting and farewell'},
      {yor:'Buongiorno',        en:'Good morning / day',       note:'Until ≈ 5 pm'},
      {yor:'Buonasera',         en:'Good evening',             note:'From ≈ 5 pm'},
      {yor:'Come stai?',        en:'How are you? (informal)',  note:''},
      {yor:'Come sta?',         en:'How are you? (formal)',    note:''},
      {yor:'Sto bene, grazie',  en:'I\'m well, thank you',     note:''},
      {yor:'Grazie',            en:'Thank you',                note:''},
      {yor:'Prego',             en:'You\'re welcome / Please', note:'Multi-use'},
      {yor:'Arrivederci',       en:'Goodbye',                  note:'Formal/neutral'}
    ],
    phrases:[
      {yor:'Mi chiamo…',                 en:'My name is…'},
      {yor:'Non capisco',                en:'I don\'t understand'},
      {yor:'Dov\'è il bagno?',           en:'Where is the bathroom?'},
      {yor:'Quanto costa?',              en:'How much does it cost?'},
      {yor:'Ho bisogno di aiuto',        en:'I need help'},
      {yor:'Vorrei un caffè, per favore', en:'I\'d like a coffee, please'},
      {yor:'Sono britannico / britannica', en:'I am British (m/f)'}
    ],
    tip:'Tip: Italian is mostly phonetic. Double consonants (gatto, pizza) are pronounced longer — important for meaning. Rolled "r" and clear vowels at the end of every word. Useful for Oxford Modern Languages and any art-history / history of music A-Level pathway.'
  },
  latin: {
    name:'Latin', flag:'🏛️', color:'#7C2D12',
    intro:'Latin is offered at IGCSE (Cambridge 0480) and A-Level (9787) and is highly prized by Oxbridge and the legal profession. It sharpens grammar in every modern European language and is the root of ~60% of English vocabulary.',
    greetings:[
      {yor:'Salve',             en:'Hello (to one person)',    note:'Informal, classical'},
      {yor:'Salvete',           en:'Hello (to many people)',   note:'Plural'},
      {yor:'Ave',               en:'Hail',                     note:'Formal — e.g. Ave Caesar'},
      {yor:'Quid agis?',        en:'How are you doing?',       note:'Literally "what are you doing?"'},
      {yor:'Bene, gratias tibi',en:'Well, thank you',          note:''},
      {yor:'Gratias tibi ago',  en:'I give you thanks',        note:'Formal thanks'},
      {yor:'Quaeso',            en:'Please / I ask',           note:''},
      {yor:'Vale',              en:'Goodbye (to one person)',  note:'Literally "be well"'},
      {yor:'Valete',            en:'Goodbye (to many)',        note:'Plural'}
    ],
    phrases:[
      {yor:'Nomen mihi est…',            en:'My name is…'},
      {yor:'Non intellego',              en:'I don\'t understand'},
      {yor:'Ubi est…?',                  en:'Where is…?'},
      {yor:'Quanti constat?',            en:'How much does it cost?'},
      {yor:'Auxilio mihi opus est',      en:'I need help'},
      {yor:'Veni, vidi, vici',           en:'I came, I saw, I conquered (Caesar)'},
      {yor:'Carpe diem',                 en:'Seize the day (Horace)'},
      {yor:'Cogito, ergo sum',           en:'I think, therefore I am (Descartes)'}
    ],
    tip:'Tip: Latin has five noun declensions and four verb conjugations. Word ORDER matters less than ENDINGS (cases). Master the endings of puella, puer, dominus, civis, manus and you can read 80% of a Cambridge Latin Course text. Don\'t skip Cicero, Virgil and Caesar set-texts.'
  },
  eal: {
    name:'English as an Additional Language (EAL / ESL)', flag:'🇬🇧', color:'#012169',
    intro:'For international students whose first language is not English. Cambridge IGCSE 0511 (English as a Second Language) and IELTS / Pearson PTE prepare you for UK universities. UCAS requires at least IELTS 6.5 for most Russell-Group courses.',
    greetings:[
      {yor:'Good morning',      en:'Hello (before noon)',      note:'Polite, formal'},
      {yor:'Good afternoon',    en:'Hello (12 pm – 5 pm)',     note:''},
      {yor:'Good evening',      en:'Hello (after 5 pm)',       note:''},
      {yor:'How do you do?',    en:'A formal first greeting',  note:'Reply with the same phrase'},
      {yor:'How are you?',      en:'Standard daily greeting',  note:'Reply: I\'m well / fine / good'},
      {yor:'Pleased to meet you', en:'Polite first introduction',note:''},
      {yor:'Thank you very much', en:'Polite thanks',          note:''},
      {yor:'Excuse me',         en:'Polite interruption',      note:'Before asking a question'},
      {yor:'Goodbye / See you',  en:'Farewell',                note:'See you later — informal'}
    ],
    phrases:[
      {yor:'My name is…',                en:'Introducing yourself'},
      {yor:'I don\'t understand. Could you repeat that, please?', en:'Politely asking for clarification'},
      {yor:'Where is the nearest…?',     en:'Asking for directions'},
      {yor:'How much does it cost?',     en:'In a shop'},
      {yor:'I would like to apply to study at…', en:'University application phrase'},
      {yor:'Could you speak more slowly, please?', en:'Listening request'},
      {yor:'I\'m from… and I\'m studying for my IGCSEs / A-Levels', en:'Common conversation starter'}
    ],
    tip:'Tip: British English (not American) is the standard. Spell "colour" not "color", "organise" not "organize", "behaviour" not "behavior", "centre" not "center". Use the past simple ("I went") not the past perfect ("I had gone") in everyday conversation. IELTS Listening uses British / Australian / NZ accents — practise the BBC, not Hollywood.'
  },
  arabic: {
    name:'Arabic', flag:'🇸🇦', color:'#15803d',
    intro:'Arabic is the official language of 22 countries and a fast-growing A-Level option (Cambridge 9680). The UK Foreign Office, BBC Arabic and the Aga Khan Development Network all recruit British students with Arabic skills.',
    greetings:[
      {yor:'As-salāmu ʿalaykum',en:'Peace be upon you',        note:'Universal greeting'},
      {yor:'Wa ʿalaykum as-salām',en:'And upon you peace',     note:'Standard reply'},
      {yor:'Marḥaban',          en:'Hello',                    note:'Neutral'},
      {yor:'Ṣabāḥ al-khayr',    en:'Good morning',             note:''},
      {yor:'Masāʾ al-khayr',    en:'Good evening',             note:''},
      {yor:'Kayfa ḥāluk?',      en:'How are you?',             note:''},
      {yor:'Shukran',           en:'Thank you',                note:''},
      {yor:'Maʿa as-salāmah',   en:'Goodbye',                  note:'"With safety"'}
    ],
    phrases:[
      {yor:'Ismī…',             en:'My name is…'},
      {yor:'Lā afham',          en:'I don\'t understand'},
      {yor:'Ayna…?',            en:'Where is…?'},
      {yor:'Bikam hādhā?',      en:'How much is this?'},
      {yor:'Aḥtāj musāʿadah',   en:'I need help'}
    ],
    tip:'Tip: Arabic is read right-to-left. Start by mastering the 28-letter alphabet — pronunciation follows naturally. Modern Standard Arabic (MSA / fuṣḥā) is what IGCSE and A-Level examine; dialects (Egyptian, Levantine, Gulf) are spoken on the street.'
  },
  portuguese: {
    name:'Portuguese', flag:'🇵🇹', color:'#16a34a',
    intro:'Portuguese is spoken by 260M people across Portugal, Brazil, Angola, Mozambique and Cape Verde. Useful for trade, music, football and study at IST Lisbon or USP São Paulo.',
    greetings:[
      {yor:'Olá',               en:'Hello',                    note:'Universal'},
      {yor:'Bom dia',           en:'Good morning',             note:''},
      {yor:'Boa tarde',         en:'Good afternoon',           note:''},
      {yor:'Boa noite',         en:'Good evening / night',     note:''},
      {yor:'Como estás?',       en:'How are you? (informal)',  note:'Portugal'},
      {yor:'Como vai você?',    en:'How are you?',             note:'Brazil'},
      {yor:'Estou bem',         en:'I am fine',                note:''},
      {yor:'Obrigado / Obrigada',en:'Thank you (m / f speaker)',note:'Gender of speaker matters'},
      {yor:'Por favor',         en:'Please',                   note:''},
      {yor:'Adeus / Tchau',     en:'Goodbye (formal / informal)',note:''}
    ],
    phrases:[
      {yor:'Chamo-me…',                  en:'My name is…'},
      {yor:'Não entendo',                en:'I do not understand'},
      {yor:'Onde fica…?',                en:'Where is…?'},
      {yor:'Quanto custa?',              en:'How much does it cost?'},
      {yor:'Preciso de ajuda',           en:'I need help'}
    ],
    tip:'Tip: Portuguese sounds softer than Spanish. Listen for nasal sounds like "ão" in não and pão. European Portuguese pronounces unstressed vowels much more quietly than Brazilian Portuguese — choose your dialect and stick to it.'
  },
  japanese: {
    name:'Japanese', flag:'🇯🇵', color:'#bc002d',
    intro:'Japanese opens anime, technology, study at Tokyo / Kyoto / Waseda and a careers in robotics, gaming and trade. The Japan Foundation funds JLPT exams for UK students.',
    greetings:[
      {yor:'Konnichiwa (こんにちは)', en:'Hello / good afternoon', note:'Universal daytime greeting'},
      {yor:'Ohayō gozaimasu',  en:'Good morning',              note:'Polite'},
      {yor:'Konbanwa',         en:'Good evening',              note:''},
      {yor:'Genki desu ka?',   en:'How are you?',              note:''},
      {yor:'Genki desu',       en:'I am fine',                 note:''},
      {yor:'Arigatō gozaimasu',en:'Thank you very much',       note:'Polite'},
      {yor:'Onegaishimasu',    en:'Please',                    note:'Request phrase'},
      {yor:'Sayōnara',         en:'Goodbye',                   note:'Formal farewell'}
    ],
    phrases:[
      {yor:'Watashi no namae wa…', en:'My name is…'},
      {yor:'Wakarimasen',           en:'I do not understand'},
      {yor:'… wa doko desu ka?',    en:'Where is…?'},
      {yor:'Ikura desu ka?',        en:'How much is it?'},
      {yor:'Tasukete kudasai',      en:'Please help me'}
    ],
    tip:'Tip: Japanese politeness matters. Start with the polite "-desu" / "-masu" forms before learning casual speech. Learn romaji first, then hiragana (46 characters), then katakana, then start kanji.'
  },
  dutch: {
    name:'Dutch', flag:'🇳🇱', color:'#ae1c28',
    intro:'Dutch is useful for the Netherlands and Flanders. Many British students choose Dutch universities (Amsterdam, Utrecht, Leiden) because most undergraduate programmes are taught in English but everyday life requires Dutch.',
    greetings:[
      {yor:'Hallo',             en:'Hello',                    note:'Universal'},
      {yor:'Goedemorgen',       en:'Good morning',             note:''},
      {yor:'Goedemiddag',       en:'Good afternoon',           note:''},
      {yor:'Goedenavond',       en:'Good evening',             note:''},
      {yor:'Hoe gaat het?',     en:'How are you?',             note:''},
      {yor:'Het gaat goed',     en:'I am fine',                note:''},
      {yor:'Dank je',           en:'Thank you',                note:'Informal'},
      {yor:'Alstublieft',       en:'Please / here you are',    note:'Polite'},
      {yor:'Tot ziens',         en:'Goodbye',                  note:''}
    ],
    phrases:[
      {yor:'Ik heet…',                   en:'My name is…'},
      {yor:'Ik begrijp het niet',        en:'I do not understand'},
      {yor:'Waar is…?',                  en:'Where is…?'},
      {yor:'Hoeveel kost dit?',          en:'How much does this cost?'},
      {yor:'Ik heb hulp nodig',          en:'I need help'}
    ],
    tip:'Tip: Dutch "g" and "ch" are throaty sounds — practise with words like "Scheveningen" (the famous beach). 90% of Dutch people speak excellent English, but using Dutch in shops and cafés is a sign of respect.'
  }
};

function langOpen(key){
  const d = window.LT_LANGUAGES[key];
  if(!d) return;
  const container = document.getElementById('langContent');
  container.style.display = 'block';
  container.innerHTML = `
    <div style="background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:24px;padding:40px;backdrop-filter:blur(10px);">

      <div style="display:flex;align-items:center;gap:14px;margin-bottom:20px;">
        <span style="font-size:2rem;">${d.flag}</span>
        <div>
          <h2 style="font-family:'Bricolage Grotesque',sans-serif;font-size:1.8rem;font-weight:900;margin:0;color:#fff;">${d.name}</h2>
          <div style="color:rgba(255,255,255,.6);font-size:.85rem;">Beginner module · IGCSE / A-Level aligned</div>
        </div>
      </div>

      <p style="color:rgba(255,255,255,.85);font-size:1rem;line-height:1.7;margin:0 0 30px;">${d.intro}</p>

      <h3 style="color:#fbbf24;font-family:'Bricolage Grotesque',sans-serif;font-size:1.1rem;font-weight:800;margin:0 0 16px;text-transform:uppercase;letter-spacing:.05em;">Greetings</h3>
      <div style="display:grid;gap:12px;margin-bottom:30px;">
        ${d.greetings.map(g=>`
          <div style="background:rgba(255,255,255,.04);border-left:3px solid ${d.color};padding:14px 18px;border-radius:0 12px 12px 0;">
            <div style="display:flex;justify-content:space-between;align-items:baseline;gap:12px;margin-bottom:4px;flex-wrap:wrap;">
              <div style="font-size:1.05rem;font-weight:700;color:#fff;">${g.yor}</div>
              <div style="color:rgba(255,255,255,.7);font-size:.9rem;">${g.en}</div>
            </div>
            ${g.note?`<div style="color:rgba(255,255,255,.5);font-size:.75rem;font-style:italic;">${g.note}</div>`:''}
          </div>
        `).join('')}
      </div>

      <h3 style="color:#fbbf24;font-family:'Bricolage Grotesque',sans-serif;font-size:1.1rem;font-weight:800;margin:0 0 16px;text-transform:uppercase;letter-spacing:.05em;">Useful Phrases</h3>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:12px;margin-bottom:30px;">
        ${d.phrases.map(p=>`
          <div style="background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);padding:16px;border-radius:12px;">
            <div style="font-size:1rem;font-weight:700;color:#fff;margin-bottom:4px;">${p.yor}</div>
            <div style="color:rgba(255,255,255,.65);font-size:.85rem;">${p.en}</div>
          </div>
        `).join('')}
      </div>

      <div style="background:linear-gradient(135deg,${d.color}22,${d.color}11);border:1px solid ${d.color}55;border-radius:16px;padding:18px 20px;color:#fff;font-size:.9rem;line-height:1.6;">
        💡 ${d.tip}
      </div>

      <button onclick="document.getElementById('langContent').style.display='none';window.scrollTo({top:0,behavior:'smooth'})" style="margin-top:24px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.15);color:#fff;padding:10px 22px;border-radius:100px;font-weight:700;font-size:.85rem;cursor:pointer;">← Back to language picker</button>
    </div>
  `;
  window.scrollTo({top:container.offsetTop-40,behavior:'smooth'});
}
