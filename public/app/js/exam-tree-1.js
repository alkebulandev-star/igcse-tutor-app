/* ════════════════════════════════════════════════════════════════════
   LESSON TEACHER — CURRICULUM TREE
   ────────────────────────────────────────────────────────────────────
   A four-layer hierarchy that mirrors how British exam boards actually
   structure their qualifications:

       Curriculum   ─→   Board       ─→   Subject       ─→   Paper
       GCSE              AQA              Biology            Paper 1 (MCQ)
       IGCSE             Cambridge        Biology (0610)     Paper 2 (Theory)
       A-Level           Edexcel          Physics (9702)     Paper 3 (Practical)
       KS1/KS2/KS3       Cambridge Int.   Maths (0580)       Paper 6 (Alt-to-pract)
       SATs / 11+        OCR

   GCSE, IGCSE and A-Level are kept SEPARATE — they target different
   audiences (UK domestic vs international vs sixth-form) and the paper
   structure / mark scheme conventions differ even within the same subject.

   Each Paper object carries:
     - code         : human-readable paper code (e.g. "0610/12")
     - title        : the paper's name
     - type         : 'mcq' | 'theory' | 'practical' | 'essay' | 'alt-pract'
     - duration     : minutes
     - marks        : total marks available
     - sections     : optional array of {label, marks, type}
     - command      : Cambridge command words this paper uses
     - calculator   : 'allowed' | 'forbidden' | 'graphical'
     - assessmentObjectives: ['AO1', 'AO2', 'AO3', ...]
     - notes        : free text — anything else marking-relevant

   The tree's job is purely descriptive — it tells the rest of the app
   "here is what paper X looks like". The UI / marking engines read these
   fields and adapt.
   ════════════════════════════════════════════════════════════════════ */
(function(){
  if (window.LTExamTree) return;
  'use strict';

  // ─── PAPER TEMPLATES (re-used across subjects) ────────────────────
  // Each builder returns a fresh Paper object so consumers can mutate
  // without poisoning other subjects.
  function p(code, title, type, duration, marks, extras){
    return Object.assign({ code, title, type, duration, marks }, extras || {});
  }

  // ─── CAMBRIDGE IGCSE ────────────────────────────────────────────
  // Sciences typically: P1 = MCQ (40Q), P2/P3 = Theory, P5 = Practical,
  // P6 = Alternative to Practical. Maths Extended: P2 (Non-calc) + P4 (Calc).
  var CIE_IGCSE = {
    code: 'CIE',
    name: 'Cambridge IGCSE',
    organisation: 'Cambridge Assessment International Education',
    grades: 'A* – G  (9–1 also available)',
    subjects: {
      bio: { code:'0610', name:'Biology', papers:[
        p('0610/12','Paper 1 — Multiple Choice (Core)',     'mcq',       45,  40, { command:['identify','state','suggest'], calculator:'allowed', assessmentObjectives:['AO1','AO2','AO3'] }),
        p('0610/22','Paper 2 — Multiple Choice (Extended)', 'mcq',       45,  40, { command:['identify','state','suggest','explain'], calculator:'allowed', assessmentObjectives:['AO1','AO2','AO3'] }),
        p('0610/32','Paper 3 — Theory (Core)',              'theory',    75,  80, { sections:[{label:'Section A',marks:80,type:'short-answer'}], command:['define','state','describe','explain','suggest','calculate'], calculator:'allowed', assessmentObjectives:['AO1','AO2','AO3'] }),
        p('0610/42','Paper 4 — Theory (Extended)',          'theory',    75,  80, { command:['define','state','describe','explain','suggest','calculate','compare'], calculator:'allowed', assessmentObjectives:['AO1','AO2','AO3'] }),
        p('0610/52','Paper 5 — Practical Test',             'practical', 75,  40, { command:['record','observe','plot','draw','calculate'], calculator:'allowed', assessmentObjectives:['AO3'], notes:'Hands-on practical — recorded results, accuracy of measurement and observation, conclusions.' }),
        p('0610/62','Paper 6 — Alternative to Practical',   'alt-pract', 60,  40, { command:['record','interpret','plot','calculate','suggest'], calculator:'allowed', assessmentObjectives:['AO3'], notes:'Paper version of the practical — students interpret data/diagrams from experiments they did not perform.' })
      ]},
      chm: { code:'0620', name:'Chemistry', papers:[
        p('0620/12','Paper 1 — Multiple Choice (Core)',     'mcq',       45,  40, { calculator:'allowed' }),
        p('0620/22','Paper 2 — Multiple Choice (Extended)', 'mcq',       45,  40, { calculator:'allowed' }),
        p('0620/32','Paper 3 — Theory (Core)',              'theory',    75,  80, { calculator:'allowed' }),
        p('0620/42','Paper 4 — Theory (Extended)',          'theory',    75,  80, { calculator:'allowed' }),
        p('0620/52','Paper 5 — Practical Test',             'practical', 75,  40, { calculator:'allowed' }),
        p('0620/62','Paper 6 — Alternative to Practical',   'alt-pract', 60,  40, { calculator:'allowed' })
      ]},
      phy: { code:'0625', name:'Physics', papers:[
        p('0625/12','Paper 1 — Multiple Choice (Core)',     'mcq',       45,  40, { calculator:'allowed' }),
        p('0625/22','Paper 2 — Multiple Choice (Extended)', 'mcq',       45,  40, { calculator:'allowed' }),
        p('0625/32','Paper 3 — Theory (Core)',              'theory',    75,  80, { calculator:'allowed' }),
        p('0625/42','Paper 4 — Theory (Extended)',          'theory',    75,  80, { calculator:'allowed' }),
        p('0625/52','Paper 5 — Practical Test',             'practical', 75,  40, { calculator:'allowed' }),
        p('0625/62','Paper 6 — Alternative to Practical',   'alt-pract', 60,  40, { calculator:'allowed' })
      ]},
      mth: { code:'0580', name:'Mathematics (Extended)', papers:[
        p('0580/22','Paper 2 — Non-Calculator (Extended)',  'theory',   105,  70, { calculator:'forbidden', command:['calculate','solve','simplify','factorise','show that','draw','sketch'], assessmentObjectives:['AO1','AO2'] }),
        p('0580/42','Paper 4 — Calculator (Extended)',      'theory',   150, 130, { calculator:'allowed',   command:['calculate','solve','prove','show that','find','interpret'], assessmentObjectives:['AO1','AO2'] })
      ]},
      eng: { code:'0500', name:'English Language', papers:[
        p('0500/11','Paper 1 — Reading',                    'theory',   120,  80, { command:['identify','explain','analyse','comment on'], assessmentObjectives:['R1','R2','R3','R4','R5'], notes:'Reading passages → directed writing → summary.' }),
        p('0500/21','Paper 2 — Directed Writing & Composition','essay', 120,  80, { command:['write','argue','describe','narrate'], assessmentObjectives:['W1','W2','W3','W4','W5'], notes:'Section A directed writing 350-450w; Section B composition 350-450w.' })
      ]},
      lit: { code:'0475', name:'English Literature', papers:[
        p('0475/11','Paper 1 — Poetry & Prose',             'essay',    105,  50, { command:['discuss','analyse','explore','comment on'] }),
        p('0475/21','Paper 2 — Drama (Open Text)',          'essay',     75,  25, { command:['discuss','analyse','explore'] })
      ]},
      cmp: { code:'0478', name:'Computer Science', papers:[
        p('0478/12','Paper 1 — Theory of Computer Science', 'theory',    105, 75, { calculator:'allowed' }),
        p('0478/22','Paper 2 — Algorithms, Programming & Logic','theory',105, 75, { calculator:'allowed' })
      ]},
      ict: { code:'0417', name:'ICT', papers:[
        p('0417/12','Paper 1 — Written',                    'theory',    105, 80, {}),
        p('0417/21','Paper 2 — Practical: Documents & Data','practical', 150, 80, {}),
        p('0417/31','Paper 3 — Practical: Presentations & Web','practical',150,80, {})
      ]},
      geo: { code:'0460', name:'Geography', papers:[
        p('0460/11','Paper 1 — Geographical Themes',        'theory',     90, 75, {}),
        p('0460/21','Paper 2 — Geographical Skills',        'theory',     90, 60, {}),
        p('0460/41','Paper 4 — Alternative to Coursework',  'theory',     90, 60, {})
      ]},
      his: { code:'0470', name:'History', papers:[
        p('0470/11','Paper 1 — 20th Century / 19th Century','essay',     120, 60, {}),
        p('0470/21','Paper 2 — Source-Based',               'theory',    120, 50, { notes:'Six source-based questions on a chosen depth study.' })
      ]},
      eco: { code:'0455', name:'Economics', papers:[
        p('0455/11','Paper 1 — Multiple Choice',            'mcq',        45, 30, {}),
        p('0455/22','Paper 2 — Structured Questions',       'theory',    135, 90, {})
      ]},
      bus: { code:'0450', name:'Business Studies', papers:[
        p('0450/12','Paper 1 — Short Answer & Data Response','theory',    90, 80, {}),
        p('0450/22','Paper 2 — Case Study',                 'theory',     90, 80, { notes:'Pre-released case study released ahead of the exam window.' })
      ]},
      acc: { code:'0452', name:'Accounting', papers:[
        p('0452/12','Paper 1 — Multiple Choice & Short',    'theory',     105, 90, {}),
        p('0452/22','Paper 2 — Structured Questions',       'theory',     105, 90, {})
      ]},
      glp: { code:'0457', name:'Global Perspectives', papers:[
        p('0457/13','Paper 1 — Written',                    'essay',      105, 60, {}),
      ]},
      fre: { code:'0520', name:'French (Foreign Language)', papers:[
        p('0520/11','Paper 1 — Listening',                  'mcq',        50,  45, {}),
        p('0520/21','Paper 2 — Reading',                    'theory',     75,  45, {}),
        p('0520/31','Paper 3 — Speaking (Internal)',        'theory',     12,  40, { notes:'Coursework — recorded and moderated.' }),
        p('0520/41','Paper 4 — Writing',                    'theory',     75,  50, {})
      ]}
    }
  };

  // ─── EDEXCEL INTERNATIONAL GCSE (IGCSE) ─────────────────────────
  var EDX_IGCSE = {
    code: 'EDX',
    name: 'Edexcel International GCSE',
    organisation: 'Pearson Edexcel',
    grades: '9 – 1',
    subjects: {
      bio: { code:'4BI1', name:'Biology', papers:[
        p('4BI1/1B','Paper 1 — Biology Theory',  'theory', 120, 110, { calculator:'allowed', command:['describe','explain','calculate','predict','suggest'], notes:'No multiple choice; long structured questions covering all topics.' }),
        p('4BI1/2B','Paper 2 — Biology Theory',  'theory',  75,  70, { calculator:'allowed', notes:'Shorter follow-up paper — applies biology to less familiar contexts.' })
      ]},
      chm: { code:'4CH1', name:'Chemistry', papers:[
        p('4CH1/1C','Paper 1 — Chemistry Theory','theory', 120, 110, { calculator:'allowed' }),
        p('4CH1/2C','Paper 2 — Chemistry Theory','theory',  75,  70, { calculator:'allowed' })
      ]},
      phy: { code:'4PH1', name:'Physics', papers:[
        p('4PH1/1P','Paper 1 — Physics Theory',  'theory', 120, 110, { calculator:'allowed' }),
        p('4PH1/2P','Paper 2 — Physics Theory',  'theory',  75,  70, { calculator:'allowed' })
      ]},
      mth: { code:'4MA1', name:'Mathematics A (Higher)', papers:[
        p('4MA1/1H','Paper 1H — Higher',         'theory', 120, 100, { calculator:'allowed', command:['calculate','solve','prove','show that','find'] }),
        p('4MA1/2H','Paper 2H — Higher',         'theory', 120, 100, { calculator:'allowed' })
      ]},
      eng: { code:'4EA1', name:'English Language A', papers:[
        p('4EA1/1','Paper 1 — Non-Fiction & Writing','essay', 135, 90, { command:['analyse','evaluate','comment on','compare'], notes:'Section A non-fiction analysis + transactional writing.' }),
        p('4EA1/2','Paper 2 — Poetry, Prose, Modern Drama','essay', 90, 60, {})
      ]}
    }
  };

  // ─── AQA GCSE (UK domestic) ─────────────────────────────────────
  // AQA papers use ASSESSMENT OBJECTIVES heavily and feature 6-mark
  // "extended writing" QER (Quality of Extended Response) questions.
  var AQA_GCSE = {
    code: 'AQA',
    name: 'AQA GCSE',
    organisation: 'AQA',
    grades: '9 – 1',
    subjects: {
      bio: { code:'8461', name:'Biology', papers:[
        p('8461/1H','Paper 1 (Higher) — Cell Biology, Organisation, Infection & Response, Bioenergetics','theory', 105, 100, { calculator:'allowed', command:['describe','explain','evaluate','compare','calculate','identify'], assessmentObjectives:['AO1','AO2','AO3'], notes:'Includes 6-mark Quality of Extended Response question.' }),
        p('8461/2H','Paper 2 (Higher) — Homeostasis, Inheritance, Ecology','theory', 105, 100, { calculator:'allowed' })
      ]},
      chm: { code:'8462', name:'Chemistry', papers:[
        p('8462/1H','Paper 1 (Higher) — Atomic Structure, Bonding, Quantitative, Chemical Changes, Energy','theory', 105, 100, { calculator:'allowed' }),
        p('8462/2H','Paper 2 (Higher) — Rate, Equilibria, Organic, Analysis, Atmosphere, Resources','theory', 105, 100, { calculator:'allowed' })
      ]},
      phy: { code:'8463', name:'Physics', papers:[
        p('8463/1H','Paper 1 (Higher) — Energy, Electricity, Particle Model, Atomic Structure','theory', 105, 100, { calculator:'allowed' }),
        p('8463/2H','Paper 2 (Higher) — Forces, Waves, Magnetism, Space','theory', 105, 100, { calculator:'allowed' })
      ]},
      mth: { code:'8300', name:'Mathematics', papers:[
        p('8300/1H','Paper 1 (Higher) — Non-Calculator','theory', 90, 80, { calculator:'forbidden' }),
        p('8300/2H','Paper 2 (Higher) — Calculator',    'theory', 90, 80, { calculator:'allowed' }),
        p('8300/3H','Paper 3 (Higher) — Calculator',    'theory', 90, 80, { calculator:'allowed' })
      ]},
      eng: { code:'8700', name:'English Language', papers:[
        p('8700/1','Paper 1 — Explorations in Creative Reading & Writing','essay', 105, 80, { command:['identify','analyse','evaluate','compare'] }),
        p('8700/2','Paper 2 — Writers\' Viewpoints & Perspectives','essay',     105, 80, {})
      ]},
      lit: { code:'8702', name:'English Literature', papers:[
        p('8702/1','Paper 1 — Shakespeare & 19th Century Novel','essay', 105, 64, {}),
        p('8702/2','Paper 2 — Modern Texts & Poetry','essay', 135, 96, {})
      ]},
      his: { code:'8145', name:'History', papers:[
        p('8145/1','Paper 1 — Understanding the Modern World','essay', 120, 84, {}),
        p('8145/2','Paper 2 — Shaping the Nation',         'essay', 120, 84, {})
      ]}
    }
  };

  // ─── OCR GCSE ────────────────────────────────────────────────────
  var OCR_GCSE = {
    code: 'OCR',
    name: 'OCR GCSE',
    organisation: 'OCR (Oxford, Cambridge and RSA)',
    grades: '9 – 1',
    subjects: {
      mth: { code:'J560', name:'Mathematics', papers:[
        p('J560/04','Paper 4 (Higher) — No Calculator','theory', 90, 100, { calculator:'forbidden' }),
        p('J560/05','Paper 5 (Higher) — Calculator',   'theory', 90, 100, { calculator:'allowed' }),
        p('J560/06','Paper 6 (Higher) — Calculator',   'theory', 90, 100, { calculator:'allowed' })
      ]},
      bio: { code:'J257', name:'Biology (Gateway)', papers:[
        p('J257/03','Paper 3 — Cells & Life',     'theory', 105, 90, { calculator:'allowed' }),
        p('J257/04','Paper 4 — Disease & Ecology','theory', 105, 90, { calculator:'allowed' })
      ]},
      cmp: { code:'J277', name:'Computer Science', papers:[
        p('J277/01','Paper 1 — Computer Systems',                  'theory', 90, 80, {}),
        p('J277/02','Paper 2 — Computational Thinking & Programming','theory',90, 80, {})
      ]}
    }
  };

  // ─── CAMBRIDGE INTERNATIONAL A-LEVEL ────────────────────────────
  var CIE_ALEVEL = {
    code: 'CIE',
    name: 'Cambridge International A-Level',
    organisation: 'Cambridge Assessment International Education',
    grades: 'A* – E',
    subjects: {
      mth: { code:'9709', name:'Mathematics', papers:[
        p('9709/12','Paper 1 — Pure Mathematics 1', 'theory', 110, 75, { calculator:'allowed', notes:'AS-level: algebra, functions, trigonometry, calculus, vectors.' }),
        p('9709/22','Paper 2 — Pure Mathematics 2', 'theory',  75, 50, { calculator:'allowed' }),
        p('9709/32','Paper 3 — Pure Mathematics 3', 'theory', 110, 75, { calculator:'allowed' }),
        p('9709/42','Paper 4 — Mechanics',          'theory',  75, 50, { calculator:'allowed' }),
        p('9709/52','Paper 5 — Probability & Statistics 1','theory', 75, 50, { calculator:'allowed' }),
        p('9709/62','Paper 6 — Probability & Statistics 2','theory', 75, 50, { calculator:'allowed' })
      ]},
      phy: { code:'9702', name:'Physics', papers:[
        p('9702/12','Paper 1 — Multiple Choice (AS)',       'mcq',       60, 40, { calculator:'allowed' }),
        p('9702/22','Paper 2 — AS Structured Questions',    'theory',    75, 60, { calculator:'allowed' }),
        p('9702/32','Paper 3 — Advanced Practical Skills 1','practical', 120, 40, { calculator:'allowed', notes:'Hands-on practical assessment.' }),
        p('9702/42','Paper 4 — A2 Structured Questions',    'theory',    120, 100, { calculator:'allowed' }),
        p('9702/52','Paper 5 — Planning, Analysis & Evaluation','theory', 75, 30, { calculator:'allowed' })
      ]},
      chm: { code:'9701', name:'Chemistry', papers:[
        p('9701/12','Paper 1 — Multiple Choice (AS)',       'mcq',       60, 40, {}),
        p('9701/22','Paper 2 — AS Structured Questions',    'theory',    75, 60, {}),
        p('9701/32','Paper 3 — Advanced Practical Skills',  'practical', 120, 40, {}),
        p('9701/42','Paper 4 — A2 Structured Questions',    'theory',    120, 100, {}),
        p('9701/52','Paper 5 — Planning, Analysis & Evaluation','theory', 75, 30, {})
      ]},
      bio: { code:'9700', name:'Biology', papers:[
        p('9700/12','Paper 1 — Multiple Choice (AS)',       'mcq',       60, 40, {}),
        p('9700/22','Paper 2 — AS Structured Questions',    'theory',    75, 60, {}),
        p('9700/32','Paper 3 — Advanced Practical Skills',  'practical', 120, 40, {}),
        p('9700/42','Paper 4 — A2 Structured Questions',    'theory',    120, 100, {}),
        p('9700/52','Paper 5 — Planning, Analysis & Evaluation','theory', 75, 30, {})
      ]},
      cmp: { code:'9618', name:'Computer Science', papers:[
        p('9618/12','Paper 1 — Theory Fundamentals',        'theory', 90, 75, {}),
        p('9618/22','Paper 2 — Fundamental Problem-Solving & Programming','theory', 120, 75, { calculator:'allowed' }),
        p('9618/32','Paper 3 — Advanced Theory',            'theory', 90, 75, {}),
        p('9618/42','Paper 4 — Practical',                  'practical', 150, 75, {})
      ]},
      eco: { code:'9708', name:'Economics', papers:[
        p('9708/12','Paper 1 — Multiple Choice (AS)',       'mcq',       60, 30, {}),
        p('9708/22','Paper 2 — Data Response & Essays (AS)','essay',    105, 60, {}),
        p('9708/32','Paper 3 — Multiple Choice (A2)',       'mcq',       60, 30, {}),
        p('9708/42','Paper 4 — Data Response & Essays (A2)','essay',    135, 70, {})
      ]},
      lit: { code:'9695', name:'English Literature', papers:[
        p('9695/12','Paper 1 — Drama & Poetry (AS)',        'essay', 120, 50, {}),
        p('9695/22','Paper 2 — Prose & Unseen (AS)',        'essay', 120, 50, {}),
        p('9695/32','Paper 3 — Shakespeare & Drama (A2)',   'essay', 120, 50, {}),
        p('9695/42','Paper 4 — Pre/Post 1900 Poetry & Prose (A2)','essay', 120, 50, {})
      ]}
    }
  };

  // ─── EDEXCEL INTERNATIONAL A-LEVEL ──────────────────────────────
  var EDX_ALEVEL = {
    code: 'EDX',
    name: 'Edexcel International A-Level',
    organisation: 'Pearson Edexcel',
    grades: 'A* – E',
    subjects: {
      mth: { code:'YMA01', name:'Mathematics', papers:[
        p('YMA01/01','Paper 1 — Pure Mathematics 1', 'theory', 105, 75, { calculator:'allowed' }),
        p('YMA01/02','Paper 2 — Pure Mathematics 2', 'theory', 105, 75, { calculator:'allowed' }),
        p('YMA01/03','Paper 3 — Pure Mathematics 3', 'theory', 105, 75, { calculator:'allowed' }),
        p('YMA01/04','Paper 4 — Pure Mathematics 4', 'theory', 105, 75, { calculator:'allowed' })
      ]},
      phy: { code:'YPH01', name:'Physics', papers:[
        p('YPH01/01','Unit 1 — Mechanics & Materials',  'theory', 90, 80, { calculator:'allowed' }),
        p('YPH01/02','Unit 2 — Waves & Electricity',    'theory', 90, 80, { calculator:'allowed' }),
        p('YPH01/03','Unit 3 — Practical Skills (AS)',  'practical', 80, 50, { calculator:'allowed' }),
        p('YPH01/04','Unit 4 — Further Mechanics, Fields & Particles','theory', 105, 90, { calculator:'allowed' }),
        p('YPH01/05','Unit 5 — Thermodynamics, Radiation, Oscillations','theory', 105, 90, { calculator:'allowed' }),
        p('YPH01/06','Unit 6 — Practical Skills (A2)',  'practical', 80, 50, { calculator:'allowed' })
      ]}
    }
  };

  // ─── AQA A-LEVEL (UK domestic) ──────────────────────────────────
  var AQA_ALEVEL = {
    code: 'AQA',
    name: 'AQA A-Level',
    organisation: 'AQA',
    grades: 'A* – E',
    subjects: {
      mth: { code:'7357', name:'Mathematics', papers:[
        p('7357/1','Paper 1 — Pure Mathematics',          'theory', 120, 100, { calculator:'allowed' }),
        p('7357/2','Paper 2 — Pure & Mechanics',          'theory', 120, 100, { calculator:'allowed' }),
        p('7357/3','Paper 3 — Pure & Statistics',         'theory', 120, 100, { calculator:'allowed' })
      ]},
      phy: { code:'7408', name:'Physics', papers:[
        p('7408/1','Paper 1 — Mechanics, Materials, Waves, Electricity','theory', 120, 85, { calculator:'allowed' }),
        p('7408/2','Paper 2 — Thermal, Nuclear, Fields',  'theory', 120, 85, { calculator:'allowed' }),
        p('7408/3','Paper 3 — Practical & Option',        'practical', 120, 80, {})
      ]},
      bio: { code:'7402', name:'Biology', papers:[
        p('7402/1','Paper 1 — Biological Molecules, Cells, Exchange','theory', 120, 91, {}),
        p('7402/2','Paper 2 — Energy, Environment, Inheritance','theory', 120, 91, {}),
        p('7402/3','Paper 3 — Essay & Synoptic',          'essay',    120, 78, {})
      ]}
    }
  };

  // ─── KEY STAGES (UK primary / lower secondary) ──────────────────
  // KS1 = Years 1-2 (ages 5-7), KS2 = Years 3-6 (ages 7-11), KS3 = Years
  // 7-9 (ages 11-14). These produce "year cards" with weekly topics that
  // hook into the existing lesson engine rather than the exam engine.
  var KS_SUBJECTS = {
    mth: { name:'Mathematics' },
    eng: { name:'English' },
    sci: { name:'Science' }
  };
  function ks(name, yearStart, yearEnd){
    var yrs = [];
    for (var y = yearStart; y <= yearEnd; y++){
      yrs.push({ year: y, label: 'Year ' + y, weeks: 12 });
    }
    return { code:'NC', name: name, organisation:'UK National Curriculum', years: yrs, subjects: KS_SUBJECTS };
  }
  var KS1 = ks('KS1 (National Curriculum)', 1, 2);
  var KS2 = ks('KS2 (National Curriculum)', 3, 6);
  var KS3 = ks('KS3 (National Curriculum)', 7, 9);

  // ─── CURRICULA — TOP LEVEL ──────────────────────────────────────
  var CURRICULA = [
    {
      key: 'igcse',
      label: 'IGCSE',
      audience: 'International students · Years 10-11',
      tagline: 'Cambridge & Edexcel International GCSE — the most popular international school-leaving qualification.',
      boards: [CIE_IGCSE, EDX_IGCSE]
    },
    {
      key: 'alevel',
      label: 'A-Level',
      audience: 'Sixth form · Years 12-13',
      tagline: 'Pre-university qualification — required for UK and international university entry.',
      boards: [CIE_ALEVEL, EDX_ALEVEL, AQA_ALEVEL]
    },
    {
      key: 'gcse',
      label: 'GCSE',
      audience: 'UK schools · Years 10-11',
      tagline: 'UK domestic GCSE — covered by AQA, OCR and Edexcel boards.',
      boards: [AQA_GCSE, OCR_GCSE]
    },
    {
      key: 'ks3',
      label: 'KS3',
      audience: 'Years 7-9 (ages 11-14)',
      tagline: 'Lower secondary — builds the foundations for GCSE/IGCSE.',
      boards: [KS3]
    },
    {
      key: 'ks2',
      label: 'KS2',
      audience: 'Years 3-6 (ages 7-11)',
      tagline: 'Upper primary — SATs at the end of Year 6.',
      boards: [KS2]
    },
    {
      key: 'ks1',
      label: 'KS1',
      audience: 'Years 1-2 (ages 5-7)',
      tagline: 'Early primary — phonics, reading, number sense.',
      boards: [KS1]
    }
  ];

  // ─── PAPER-TYPE METADATA (used by the UI engines) ──────────────
  // Each paper type defines which tools the question UI should render.
  // The exam-room code uses this to decide whether to show a calculator,
  // a word counter, a data table, etc.
  var PAPER_TYPES = {
    'mcq':       { label:'Multiple Choice',     tools:['bubbles','timer','autoMark','confidence'],                ui:'mcq' },
    'theory':    { label:'Theory / Structured', tools:['workingArea','formulaSheet','wordCount','equationEditor','calculator','annotate'], ui:'theory' },
    'essay':     { label:'Essay / Composition', tools:['wordCount','paragraphHelper','citation','highlight','outline'], ui:'essay' },
    'practical': { label:'Practical / Data',    tools:['dataTable','chartPlot','workingArea','calculator','observationLog'], ui:'practical' },
    'alt-pract': { label:'Alternative to Practical', tools:['dataTable','chartPlot','workingArea','calculator'], ui:'practical' }
  };

  // ─── Public API ─────────────────────────────────────────────────
  window.LTExamTree = {
    CURRICULA: CURRICULA,
    PAPER_TYPES: PAPER_TYPES,
    // Look up the metadata for a paper-type so the UI can adapt
    paperTypeMeta: function(t){ return PAPER_TYPES[t] || PAPER_TYPES['theory']; },
    // Walk the tree to find a specific paper
    findPaper: function(curriculumKey, boardCode, subjectKey, paperCode){
      var c = CURRICULA.find(function(c){ return c.key === curriculumKey; });
      if (!c) return null;
      var b = c.boards.find(function(b){ return b.code === boardCode; });
      if (!b) return null;
      var subj = b.subjects && b.subjects[subjectKey];
      if (!subj) return null;
      var pap = subj.papers && subj.papers.find(function(p){ return p.code === paperCode; });
      return pap ? { curriculum: c, board: b, subject: subj, paper: pap } : null;
    },
    // Quick stats for the navigator splash screen
    totals: function(){
      var subjects = 0, papers = 0, boards = 0;
      CURRICULA.forEach(function(c){
        c.boards.forEach(function(b){
          boards++;
          if (b.subjects){
            Object.keys(b.subjects).forEach(function(sk){
              subjects++;
              papers += (b.subjects[sk].papers || []).length;
            });
          }
        });
      });
      return { curricula: CURRICULA.length, boards: boards, subjects: subjects, papers: papers };
    }
  };
})();
