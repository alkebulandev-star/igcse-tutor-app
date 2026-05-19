/* ════════════════════════════════════════════════════════════════
   THEORY-PAPER GENERATOR (canonical)
   ────────────────────────────────────────────────────────────────
   Generates fresh theory / Paper-2 exam papers that match the real
   structure of Cambridge IGCSE, Edexcel IGCSE, Cambridge A-Level,
   Edexcel A-Level, UK SATs (KS2) and 11+ — per subject and per
   syllabus area.

   Architecture:
     1. PAPER_SPEC[board][subject] = canonical structure
        (number of questions, sections, types, topics, marks, time)
     2. buildSystemPrompt(board, subject, lang) reads the spec and
        produces a precise system prompt for the AI.
     3. ExamGen.generate({board, subject, paperType}) runs Anthropic
        first, falls back to OpenAI on error. Returns a normalised
        list of theory questions in the same shape the existing
        startEssayWriting() expects.
     4. The language layer (lang-0.js) wraps the fetch and adds a
        "respond in [language]" instruction — so the same generator
        produces French / Spanish / Mandarin / English papers
        without code changes here.

   Public API:
     ExamGen.generate({board, subject, paperType, count?})
       → Promise<[{type, q, parts?, yr?}, ...]>
     ExamGen.hasSpec(board, subject) → bool
     ExamGen.getSpec(board, subject) → spec object or null

   Lessons + per-question AI continue to use Anthropic primarily
   (LT_SERVER='1' default) with OpenAI as fallback. Translation is
   the only thing that goes exclusively through OpenAI.
   ════════════════════════════════════════════════════════════════ */
(function(){
'use strict';

// ─── Paper specifications ─────────────────────────────────────
// Each spec describes: how many questions, what sections, what
// topic areas to draw from, which question types are valid, time
// allocation, and any board-specific quirks.

var IGCSE_GENERIC = {
  board: 'Cambridge IGCSE',
  paperLabel: 'Paper 2 — Extended (Structured)',
  duration: 105,           // minutes total
  questionsToShow: 6,
  questionsToAnswer: 6,
  marksPerQuestion: 10,
  notes: [
    'Cambridge IGCSE Extended tier — grades A*–G or 9–1.',
    'Paper 2 is structured-answer style. Each question has parts (a), (b), (c) with [marks] indicated, e.g. [3].',
    'Use British English throughout (colour, organise, analyse, programme, centre).',
    'AO breakdown: AO1 (knowledge & understanding), AO2 (application), AO3 (analysis & evaluation).',
    'Mark schemes accept named alternatives (A1, M1 in maths) and use ecf (error carried forward).'
  ]
};

var IGCSE_ENG_LANG = {
  board:'Cambridge IGCSE', subject:'English Language (0500)', paperLabel:'Paper 2 — Directed Writing & Composition',
  duration: 120,
  questionsToShow: 2, questionsToAnswer: 2,
  marksPerQuestion: 40,
  essayTypes: ['Letter (formal/informal)', 'Article', 'Speech', 'Report', 'Review', 'Descriptive composition', 'Narrative composition', 'Argumentative composition'],
  wordCount: '150–250 words for directed writing; 350–450 words for composition',
  notes: [
    'Section 1 — Directed Writing: respond to one or two given texts (35 marks).',
    'Section 2 — Composition: choose 1 of 4 titles (25 marks: 13 content + 12 style/accuracy).',
    'Use British English spelling and punctuation. Reference international settings where natural.',
    'Mark scheme bands: W1 (style and accuracy) and C1 (content and structure).',
    'AO1: Read and understand; AO2: Analyse, evaluate; AO3: Communicate; AO4: Use accurate Standard English.'
  ]
};

var IGCSE_ENG_LIT = {
  board:'Cambridge IGCSE', subject:'English Literature (0475)', paperLabel:'Paper 2 — Drama (Open Text)',
  duration: 90,
  questionsToShow: 6, questionsToAnswer: 2,
  marksPerQuestion: 25,
  notes: [
    'Two essays of equal weight (25 marks each). One on a drama text (extract-based or general).',
    'Set texts rotate by session — phrase questions to apply to ANY studied text (Shakespeare; Priestley; Williams; Miller; Friel).',
    'Use the wording: "any ONE play you have studied", "any TWO poems from your selection".',
    'Word count: a sustained essay (~500–800 words).',
    'AO1: Knowledge of text; AO2: Understanding meanings; AO3: Personal response; AO4: Literary methods.'
  ]
};

var IGCSE_MATH = {
  board:'Cambridge IGCSE', subject:'Mathematics (0580)', paperLabel:'Paper 4 — Extended (Structured)',
  duration: 150,
  questionsToShow: 11, questionsToAnswer: 11,
  marksPerQuestion: 12,
  syllabusAreas: [
    'Number (HCF/LCM, surds, indices, standard form, ratio, proportion, percentages, compound interest)',
    'Algebra & graphs (linear, quadratic, simultaneous, inequalities, indices, factorising, algebraic fractions)',
    'Functions (composite, inverse, transformations of graphs)',
    'Coordinate geometry (gradient, perpendicular lines, distance, midpoint, equation of a line)',
    'Geometry (angles, polygons, congruence, similarity, circle theorems, Pythagoras)',
    'Mensuration (perimeter, area, volume, surface area of prisms, cylinders, cones, spheres, frustums)',
    'Trigonometry (right-angled, sine rule, cosine rule, area = ½ab sin C, 3-D)',
    'Vectors and transformations (translation, rotation, reflection, enlargement; vector geometry)',
    'Probability (tree diagrams, conditional, sets)',
    'Statistics (cumulative frequency, histograms with unequal widths, box-and-whisker)',
    'Differentiation (powers of x, gradient, tangent, normal, stationary points — Extended only)'
  ],
  notes: [
    'Calculator paper. Show ALL working — method marks (M1) are awarded even when the final answer is wrong.',
    'Numbers may have non-integer answers; give 3 significant figures or 1 d.p. as instructed.',
    'Use British examples: £ amounts, London, Manchester, named characters (Oliver, Amelia, Harry, Sophia).',
    'Mark allocations like [3] sit at the end of each part; total each question to ≈ 10–14 marks.',
    'Diagrams are NOT drawn to scale unless stated. Use π = 3.142 or the calculator value.'
  ]
};

var IGCSE_BIO = {
  board:'Cambridge IGCSE', subject:'Biology (0610)', paperLabel:'Paper 4 — Extended Theory',
  duration: 75,
  questionsToShow: 6, questionsToAnswer: 6,
  marksPerQuestion: 13,
  syllabusAreas: [
    'Characteristics and classification of living organisms (binomial, dichotomous keys, kingdoms)',
    'Organisation of the organism (cells, tissues, organs; specialised cells)',
    'Movement into and out of cells (diffusion, osmosis, active transport; water potential)',
    'Biological molecules (carbohydrates, proteins, lipids, DNA; food tests)',
    'Enzymes (specificity, temperature, pH, denaturation; lock-and-key)',
    'Plant nutrition (photosynthesis, limiting factors, leaf structure)',
    'Human nutrition (balanced diet, digestion, absorption, assimilation)',
    'Transport (in plants — xylem/phloem; in humans — heart, blood, double circulation)',
    'Diseases & immunity (pathogens, antibodies, vaccination, antibiotics, transmission)',
    'Gas exchange and respiration (alveoli, aerobic, anaerobic; oxygen debt)',
    'Excretion (kidney, ultrafiltration, ADH, dialysis vs transplant)',
    'Coordination and response (nervous system, hormones, homeostasis, tropisms)',
    'Reproduction (asexual, sexual, flowering plants, human reproductive system, menstrual cycle)',
    'Inheritance (chromosomes, mitosis, meiosis, monohybrid crosses, codominance, sex linkage)',
    'Variation and selection (natural selection, evolution, antibiotic resistance)',
    'Organisms and their environment (food webs, energy flow, nutrient cycles, eutrophication)',
    'Human influences on ecosystems (deforestation, pollution, conservation, sustainable resources)',
    'Biotechnology and genetic modification (yeast, bacteria, insulin, GM crops, PCR)'
  ],
  notes: [
    'At least ONE question must include a "draw and label" diagram or graph-interpretation part.',
    'Use ecf (error carried forward) for calculations.',
    'Use British/international examples for ecology — UK woodland, North Sea, Lake District; mangroves only if internationally relevant.',
    'For genetics, use Punnett squares with letters specified by the question.',
    'For health, reference UK NHS context, immunisation schedule, and global examples (malaria, TB).'
  ]
};

var IGCSE_CHM = {
  board:'Cambridge IGCSE', subject:'Chemistry (0620)', paperLabel:'Paper 4 — Extended Theory',
  duration: 75,
  questionsToShow: 6, questionsToAnswer: 6,
  marksPerQuestion: 13,
  syllabusAreas: [
    'States of matter (kinetic theory, changes of state, diffusion)',
    'Atoms, elements and compounds (atomic structure, isotopes, electronic configuration)',
    'Bonding (ionic, covalent, metallic; giant lattices vs simple molecules)',
    'Stoichiometry (relative formula mass, mole calculations, % yield, % purity, gas volumes at rtp)',
    'Electrochemistry (electrolysis of molten and aqueous; electroplating; fuel cells; hydrogen)',
    'Energetics (exothermic/endothermic; bond energies; ΔH from energy profiles)',
    'Rates of reaction (concentration, temperature, surface area, catalysts; collision theory)',
    'Reversible reactions and equilibrium (dynamic equilibrium, Le Chatelier; Haber, Contact)',
    'Acids, bases and salts (strong/weak, pH, neutralisation, preparation, titration)',
    'Periodic Table (groups 1, 7, 0; transition metals; trends)',
    'Metals (reactivity series, extraction of iron in blast furnace, aluminium by electrolysis)',
    'Chemistry of the environment (water purification, air pollution, climate change, ozone)',
    'Organic chemistry (alkanes, alkenes, alcohols, carboxylic acids, esters; fractional distillation of crude oil)',
    'Polymers (addition vs condensation; PET, nylon; biodegradability)',
    'Experimental techniques (titration, paper chromatography, separating mixtures)'
  ],
  notes: [
    'Equations must be balanced with state symbols (s), (l), (g), (aq).',
    'Mole calculations require working: n = m/Mr, n = cV, n = pV/RT (extended).',
    'Use the IGCSE Periodic Table values (e.g. Ar(Cl)=35.5, Mr(CaCO₃)=100).',
    'Give answers to 3 significant figures unless otherwise stated.',
    'Practical questions may ask "describe a test for…" — give reagent + observation + conclusion.'
  ]
};

var IGCSE_PHY = {
  board:'Cambridge IGCSE', subject:'Physics (0625)', paperLabel:'Paper 4 — Extended Theory',
  duration: 75,
  questionsToShow: 6, questionsToAnswer: 6,
  marksPerQuestion: 13,
  syllabusAreas: [
    'Motion, forces and energy (distance, speed, velocity, acceleration; F=ma; momentum, p=mv; KE=½mv²; GPE=mgh)',
    'Thermal physics (thermal expansion; specific heat capacity; latent heat; gas laws pV=nRT proxy)',
    'Waves (transverse/longitudinal; reflection, refraction, diffraction; n = sin i / sin r; total internal reflection)',
    'Sound (audible range; speed of sound; pitch & loudness)',
    'Light (lenses; ray diagrams; dispersion; EM spectrum)',
    'Electricity and magnetism (charge; current I=Q/t; V=IR; power P=IV=I²R; series/parallel; capacitance qualitative)',
    'Electromagnetic induction (Faraday\'s law; transformers Vp/Vs = Np/Ns; National Grid step-up/step-down)',
    'Atomic physics (alpha, beta, gamma; half-life; nuclear equations; fission; fusion)',
    'Space physics (solar system; orbits; cosmology, red-shift, Big Bang qualitative)'
  ],
  notes: [
    'Use SI units throughout. Give answers to 3 sig figs.',
    'g = 9.81 N/kg (or 10 N/kg if the question states so).',
    'Show formula, substitution, answer with unit — that earns full marks.',
    'Diagrams required for ray diagrams, circuits, and force vectors.',
    'Use British examples: National Grid, Hinkley Point C, BBC transmitter, Met Office, ARM/Rolls-Royce contexts.'
  ]
};

var IGCSE_GEO = {
  board:'Cambridge IGCSE', subject:'Geography (0460)', paperLabel:'Paper 2 — Geographical Skills',
  duration: 90,
  questionsToShow: 3, questionsToAnswer: 3,
  marksPerQuestion: 20,
  syllabusAreas: [
    'Population and settlement (population dynamics, migration, urban-rural, settlement hierarchy)',
    'The natural environment (plate tectonics, earthquakes, volcanoes, rivers, coasts, weather, climate, ecosystems)',
    'Economic development (development indicators, food production, industry, tourism, energy, water, environmental risks)',
    'Geographical skills (OS maps 1:25 000 and 1:50 000; six-figure grid references; cross-sections; choropleth and isoline maps)'
  ],
  notes: [
    'Include AT LEAST one map question with grid references and a sketch element.',
    'Use British/international case studies: Boscastle floods (2004), Cumbria floods, Eyjafjallajökull eruption (2010), Dharavi (Mumbai), Curitiba.',
    'Data-response questions: describe trends THEN explain; quote data with units.',
    'Reference UK and international examples — London growth, Lake District tourism, Sahel migration, China one-child legacy.'
  ]
};

var IGCSE_HIS = {
  board:'Cambridge IGCSE', subject:'History (0470)', paperLabel:'Paper 2 — 20th-Century Source-Based',
  duration: 120,
  questionsToShow: 6, questionsToAnswer: 6,
  marksPerQuestion: 8,
  syllabusAreas: [
    'Were the peace treaties of 1919–23 fair? (Treaty of Versailles)',
    'To what extent was the League of Nations a success?',
    'Why had international peace collapsed by 1939?',
    'Who was to blame for the Cold War? (Yalta, Potsdam, Berlin Blockade)',
    'How effectively did the USA contain the spread of Communism? (Korea, Cuba, Vietnam)',
    'How secure was the USSR\'s control over Eastern Europe, 1948–c.1989?',
    'Depth Study A: Germany 1918–45 (Weimar, Nazi rise, life under the Nazis)',
    'Depth Study B: Russia 1905–41 (Tsarism, 1917 revolutions, Stalin)',
    'Depth Study C: USA 1919–41 (Roaring 20s, Depression, New Deal)'
  ],
  notes: [
    'Source-based: candidates are given an extract or cartoon; questions probe purpose, reliability and inference.',
    'Question 6 is the "How far do you agree" essay (8 marks) — balanced sources + own knowledge.',
    'Use precise dates, named figures, and statistics (e.g. 6 million unemployed Germany 1932).',
    'British perspective is welcomed but not required — international comparisons strengthen answers.'
  ]
};

var IGCSE_ECO = {
  board:'Cambridge IGCSE', subject:'Economics (0455)', paperLabel:'Paper 2 — Structured Questions',
  duration: 135,
  questionsToShow: 5, questionsToAnswer: 4,
  marksPerQuestion: 30,
  syllabusAreas: [
    'The basic economic problem (scarcity, opportunity cost, factors of production, PPC)',
    'The allocation of resources (demand, supply, equilibrium, elasticity PED & PES)',
    'Microeconomic decision makers (households, banks, workers and trade unions, firms; economies of scale)',
    'Government and the macroeconomy (objectives, fiscal policy, monetary policy, supply-side policies)',
    'Economic development (HDI, poverty, population, sustainability)',
    'International trade and globalisation (specialisation, exchange rates, balance of payments, protectionism)'
  ],
  notes: [
    'Q1 has compulsory data response with up to 6 parts; Q2–5 are structured essays with parts (a)(b)(c)(d).',
    'Diagrams (demand/supply, PPC, AD/AS) earn marks — label axes and curves clearly.',
    'Use UK and international examples: Bank of England, HM Treasury, OECD, IMF, WTO.',
    'Numerical parts may ask for elasticity or growth-rate calculations to 2 d.p.'
  ]
};

var IGCSE_BUS = {
  board:'Cambridge IGCSE', subject:'Business Studies (0450)', paperLabel:'Paper 2 — Case Study',
  duration: 90,
  questionsToShow: 4, questionsToAnswer: 4,
  marksPerQuestion: 20,
  syllabusAreas: [
    'Understanding business activity (purpose, classification, enterprise, size, growth, types of business org)',
    'People in business (motivation, organisation, recruitment, communication)',
    'Marketing (market research, marketing mix — 4 Ps, marketing strategy)',
    'Operations management (production methods, productivity, quality, location)',
    'Financial information and decisions (sources of finance, cash flow, income statements, ratios)',
    'External influences (economy, environment, ethics, government, international trade)'
  ],
  notes: [
    'Paper 2 is a single case study with 4 questions of escalating depth.',
    'Q4 typically asks for a justified recommendation — apply concepts, use case-study data, consider counter-arguments.',
    'Use British and international examples: Tesco, John Lewis Partnership, Unilever, Burberry, Dyson, Rolls-Royce.'
  ]
};

var IGCSE_CS = {
  board:'Cambridge IGCSE', subject:'Computer Science (0478)', paperLabel:'Paper 2 — Algorithms, Programming & Logic',
  duration: 105,
  questionsToShow: 6, questionsToAnswer: 6,
  marksPerQuestion: 12,
  syllabusAreas: [
    'Algorithm design (pseudocode, flowcharts, trace tables)',
    'Programming concepts (sequence, selection, iteration, subroutines, arrays, file handling)',
    'Databases (single-table, field types, queries)',
    'Boolean logic (AND, OR, NOT, NAND, NOR, XOR; truth tables; logic circuits)',
    'Data representation (binary, hex, ASCII, Unicode; sound, images, compression)',
    'Data transmission (parallel, serial, USB; error checking — parity, checksum, ARQ)',
    'Hardware (CPU, von Neumann, RAM/ROM, secondary storage)',
    'System software (operating systems, utility programs)',
    'Security (threats, biometrics, encryption — symmetric/asymmetric, SSL/TLS)',
    'Ethics (computer-related laws, copyright, environmental impact)'
  ],
  notes: [
    'Use Cambridge IGCSE pseudocode style: INPUT, OUTPUT, IF…THEN…ENDIF, FOR…NEXT, WHILE…ENDWHILE, declare arrays as Array[1:n].',
    'Trace tables: one column per variable + an OUTPUT column.',
    'Boolean expressions in standard form: X = ((A AND NOT B) OR (B AND C)).',
    'For programming, candidates may answer in Python, Visual Basic or Java — be language-agnostic in marking.'
  ]
};

var IGCSE_FR = {
  board:'Cambridge IGCSE', subject:'French (0520)', paperLabel:'Paper 4 — Writing',
  duration: 60,
  questionsToShow: 3, questionsToAnswer: 3,
  marksPerQuestion: 15,
  notes: [
    'Q1: short form-filling/email (5 marks).',
    'Q2: directed writing 80–90 words (15 marks).',
    'Q3: composition 130–140 words on one of two topics (25 marks).',
    'Topics rotate: school, family, holidays, environment, technology, world of work.',
    'Marking: communication (C), language quality (Q), accuracy of grammar/vocab.'
  ]
};

// ─── A-Level specs ─────────────────────────────────────────────
var ALEVEL_GENERIC = {
  board: 'Cambridge International A-Level',
  paperLabel: 'Paper 3 — A2 Structured',
  duration: 120,
  questionsToShow: 8,
  questionsToAnswer: 8,
  marksPerQuestion: 10,
  notes: [
    'Cambridge International A-Level — grades A*–E.',
    'AS units (Papers 1 & 2) sit in Year 12; A2 units (Papers 3 onwards) in Year 13.',
    'AO breakdown: AO1 (knowledge), AO2 (application), AO3 (analysis & evaluation).',
    'Use British English. Show ALL working in maths/science. Use SI units.'
  ]
};

var ALEVEL_MATH = {
  board:'Cambridge International A-Level', subject:'Mathematics (9709)', paperLabel:'Paper 3 — Pure Mathematics 3',
  duration: 110,
  questionsToShow: 10, questionsToAnswer: 10,
  marksPerQuestion: 7,
  syllabusAreas: [
    'Algebra (modulus function, polynomial division, partial fractions, binomial expansion for non-integer n)',
    'Logarithmic and exponential functions (laws of logs, modelling exponential growth/decay)',
    'Trigonometry (sec, cosec, cot; double-angle and addition formulae; Rcos(θ ± α) form; equations)',
    'Differentiation (product, quotient, chain; implicit; parametric; second derivatives)',
    'Integration (by substitution, by parts, partial fractions, trig identities; volumes of revolution)',
    'Numerical solution of equations (iteration x_{n+1} = F(x_n); convergence; Newton-Raphson)',
    'Vectors (3-D vector equations of lines and planes; angle between lines; scalar product)',
    'Differential equations (first-order separable; modelling rates of change)',
    'Complex numbers (Cartesian, polar, exponential forms; loci on Argand diagram)'
  ],
  notes: [
    'Calculator paper. ALL working must be shown — answer-only earns 0 marks even when correct.',
    'Method marks (M1) earned for valid approach; accuracy marks (A1) for correct value.',
    'Give exact answers (in surd or e form) where possible; otherwise 3 sig figs.',
    'Use British/international contexts for modelling questions: National Grid load, BBC viewing figures, FTSE returns.'
  ]
};

var ALEVEL_FMATH = {
  board:'Cambridge International A-Level', subject:'Further Mathematics (9231)', paperLabel:'Paper 1 — Further Pure 1',
  duration: 120,
  questionsToShow: 8, questionsToAnswer: 8,
  marksPerQuestion: 9,
  syllabusAreas: [
    'Roots of polynomial equations (sum and product; substitution)',
    'Rational functions (asymptotes; sketching; oblique asymptotes)',
    'Summation of series (method of differences; ∑r, ∑r², ∑r³)',
    'Matrices and linear spaces (determinant, inverse 3×3; transformations; eigenvalues)',
    'Polar coordinates (curves; area = ½∫r² dθ)',
    'Vectors (3-D lines, planes; shortest distance between skew lines)',
    'Proof by induction',
    'Hyperbolic functions (sinh, cosh, tanh; identities; calculus)'
  ],
  notes: ['Rigour matters — full algebraic working, no shortcuts. Justify each step.']
};

var ALEVEL_PHY = {
  board:'Cambridge International A-Level', subject:'Physics (9702)', paperLabel:'Paper 4 — A2 Structured',
  duration: 120,
  questionsToShow: 8, questionsToAnswer: 8,
  marksPerQuestion: 12,
  syllabusAreas: [
    'Motion in a circle (ω, v=rω, a=v²/r, centripetal force)',
    'Gravitational fields (Newton\'s law, g, GPE = −GMm/r, orbits)',
    'Oscillations (SHM, a = −ω²x, energy in SHM, damping, resonance)',
    'Thermal physics (Boltzmann pV=NkT; internal energy; first law of thermodynamics; specific heat)',
    'Electric and magnetic fields (E = V/d, F = QvB sin θ, Hall effect; flux Φ, EMF = −dΦ/dt)',
    'Capacitance (RC discharge; Q=Q₀e^(−t/RC); energy ½CV²)',
    'Quantum physics (photoelectric effect; de Broglie; line spectra; energy levels)',
    'Nuclear physics (mass defect; binding energy; radioactive decay law N = N₀e^(−λt))',
    'Medical physics (X-rays, ultrasound, MRI, PET)',
    'Astronomy and cosmology (stellar luminosity; Hubble\'s law; standard candles)'
  ],
  notes: [
    'Always start with the equation in symbols, then substitute, then evaluate with units.',
    'Use 3 sig figs unless otherwise stated. Constants supplied on the data sheet.',
    'Diagrams clearly labelled — field lines, ray diagrams, circuits.',
    'Reference British/international science: Diamond Light Source, JET tokamak, Square Kilometre Array, CERN.'
  ]
};

var ALEVEL_CHM = {
  board:'Cambridge International A-Level', subject:'Chemistry (9701)', paperLabel:'Paper 4 — A2 Structured',
  duration: 120,
  questionsToShow: 8, questionsToAnswer: 8,
  marksPerQuestion: 12,
  syllabusAreas: [
    'Chemical energetics (Hess; Born-Haber; lattice energy; entropy ΔS; ΔG = ΔH − TΔS)',
    'Electrochemistry (standard electrode potentials; E°cell; Nernst equation qualitative)',
    'Equilibria (Kc, Kp; Kw, pH of weak acids; buffers; solubility product Ksp)',
    'Reaction kinetics (orders, rate equations, half-life for 1st-order, Arrhenius)',
    'Periodic table — Period 3 and Group 17',
    'Transition elements (d-block, complex ions, colour, catalysis, redox titrations)',
    'Organic chemistry — arenes, carbonyls, carboxylic acids and derivatives, amines, amino acids, polymers',
    'Spectroscopy (mass spec, IR, NMR — chemical shift, splitting)',
    'Analytical separations (TLC, GC, electrophoresis)'
  ],
  notes: [
    'Calculations: show units, sig figs, and balanced equations.',
    'Organic mechanisms: use curly arrows from bond/lone pair to atom — full mechanism for full marks.',
    'NMR splitting: n+1 rule; integration ratios; reference TMS.',
    'Buffer calculations: pH = pKa + log([A⁻]/[HA]); show full working.'
  ]
};

var ALEVEL_BIO = {
  board:'Cambridge International A-Level', subject:'Biology (9700)', paperLabel:'Paper 4 — A2 Structured',
  duration: 120,
  questionsToShow: 8, questionsToAnswer: 8,
  marksPerQuestion: 12,
  syllabusAreas: [
    'Energy and respiration (glycolysis, link reaction, Krebs cycle, oxidative phosphorylation; chemiosmosis)',
    'Photosynthesis (light-dependent, light-independent; limiting factors)',
    'Homeostasis (kidney ultrastructure; ADH; blood glucose, insulin/glucagon; plant control — auxin, abscisic acid)',
    'Coordination (neurones, synaptic transmission, neurotransmitters; muscle — sliding filament)',
    'Inheritance (test crosses, dihybrid, codominance, sex linkage; chi-squared test)',
    'Selection and evolution (Hardy-Weinberg; speciation; gene flow)',
    'Classification, biodiversity and conservation (taxonomy; Simpson\'s index; conservation strategies)',
    'Genetic technology (PCR, gel electrophoresis, microarrays, CRISPR-Cas9; ethics)'
  ],
  notes: [
    'Diagrams expected for cell structures (e.g. nephron, neurone) — label fully.',
    'Statistical questions: state the test, calculate value, compare to critical, conclude.',
    'For genetics: show parental gametes, F1, F2 in a clear Punnett square or branching diagram.'
  ]
};

var ALEVEL_HIS = {
  board:'Cambridge International A-Level', subject:'History (9489)', paperLabel:'Paper 3 — Interpretations',
  duration: 90,
  questionsToShow: 2, questionsToAnswer: 1,
  marksPerQuestion: 40,
  syllabusAreas: [
    'European option: The origins of the First World War, 1870–1914',
    'European option: The Cold War, 1945–1991',
    'American option: The origins of the American Civil War, c.1846–1861',
    'International option: The League of Nations and the United Nations 1919–c.1980',
    'British option: The transformation of Britain c.1851–1964'
  ],
  notes: [
    'Two interpretations from historians are provided; candidate selects ONE question.',
    'Compare the interpretations, explain their context, and reach a substantiated judgement.',
    'Cite historians (e.g. AJP Taylor, Fritz Fischer, Eric Hobsbawm, Niall Ferguson) and primary evidence.'
  ]
};

var ALEVEL_ECO = {
  board:'Cambridge International A-Level', subject:'Economics (9708)', paperLabel:'Paper 4 — A2 Data Response & Essay',
  duration: 135,
  questionsToShow: 3, questionsToAnswer: 2,
  marksPerQuestion: 30,
  syllabusAreas: [
    'The price system and microeconomy (cost curves; perfect competition; monopoly; oligopoly; market failure)',
    'Government microeconomic intervention (taxes, subsidies, price controls, tradable permits)',
    'The macroeconomy (Keynesian vs classical; ISLM-style analysis; multiplier; accelerator)',
    'Government macroeconomic intervention (fiscal, monetary, supply-side; Phillips curve)',
    'International economics (trade theory; exchange rates; current account; globalisation)'
  ],
  notes: [
    'Section A: compulsory data-response with diagrams; Section B: choose 1 essay of 2.',
    'Diagrams must label axes, curves, equilibrium points, and shifts with arrows.',
    'Reference contemporary UK/international policy: Bank of England base rate, OBR forecasts, IMF Article IV.'
  ]
};

// SATs (Year 6 / KS2)
var SATS_ENG = {
  board:'UK SATs (KS2)', subject:'English Reading', paperLabel:'KS2 Reading',
  duration: 60,
  questionsToShow: 0, questionsToAnswer: 0,
  marksPerQuestion: 0,
  notes: [
    'Year 6 (age 10–11). Three short texts (fiction, non-fiction, poetry) with mixed-format questions.',
    'Questions: multiple choice; short answers; longer 3-mark inference and justification questions.',
    'British setting — UK schools, towns, landmarks. Vocabulary at Year 6 reading age.'
  ]
};

var SATS_MATH = {
  board:'UK SATs (KS2)', subject:'Mathematics — Reasoning', paperLabel:'KS2 Maths Paper 2/3 (Reasoning)',
  duration: 40,
  questionsToShow: 25, questionsToAnswer: 25,
  marksPerQuestion: 1.6,
  syllabusAreas: [
    'Number — place value, four operations, fractions, decimals, percentages',
    'Measurement — length, mass, capacity, time, money (£), area, volume',
    'Geometry — properties of shapes, position and direction',
    'Statistics — pie charts, line graphs, mean',
    'Ratio and proportion (Year 6)',
    'Algebra (Year 6: simple equations, formulae)'
  ],
  notes: [
    'No calculator for Paper 1 (arithmetic). Calculator NOT allowed for any KS2 SATs paper.',
    'Use British context: £ amounts, m/km, kg/g, ml/l, named children (Oliver, Amelia).',
    'Word problems should be solvable in 1–2 steps; some 2-mark questions require multi-step.'
  ]
};

// 11+ (Year 6 → secondary selection)
var ELEVENPLUS_VR = {
  board:'11+', subject:'Verbal Reasoning', paperLabel:'11+ Verbal Reasoning (CEM / GL)',
  duration: 45,
  questionsToShow: 40, questionsToAnswer: 40,
  marksPerQuestion: 1,
  syllabusAreas: [
    'Synonyms and antonyms',
    'Analogies (A is to B as C is to ?)',
    'Word codes and cipher questions',
    'Letter-series and number-letter sequences',
    'Cloze passages and odd-one-out',
    'Logic problems (small grid deductions)'
  ],
  notes: [
    'Year 5/6 vocabulary level. UK-based names and places.',
    'GL Assessment uses standardised, predictable formats; CEM is more variable and time-pressured.',
    'No calculator. Strict timing — approximately 1 minute per question.'
  ]
};

var ELEVENPLUS_NVR = {
  board:'11+', subject:'Non-Verbal Reasoning', paperLabel:'11+ Non-Verbal Reasoning',
  duration: 45,
  questionsToShow: 40, questionsToAnswer: 40,
  marksPerQuestion: 1,
  notes: [
    'Pattern, sequence and odd-one-out questions presented as shapes/grids.',
    'Use British exam-board conventions (CEM, GL, ISEB Common Pre-Test).',
    'Questions text-described here as figure (a)…(e) where pupils select the missing image.'
  ]
};

// Edexcel International GCSE — mirrors Cambridge but with a few subject quirks.
function fromCambridge(spec, overrides){
  var out = Object.assign({}, spec, overrides || {});
  out.board = 'Edexcel International GCSE';
  return out;
}

var EDXIGCSE_SPECS = {
  eng: fromCambridge(IGCSE_ENG_LANG, { paperLabel:'Edexcel IGCSE English Lang A — Paper 2', subject:'English Language A (4EA1)' }),
  mth: fromCambridge(IGCSE_MATH, { paperLabel:'Edexcel IGCSE Maths A — Paper 4H', subject:'Mathematics A (4MA1) — Higher' }),
  bio: fromCambridge(IGCSE_BIO, { paperLabel:'Edexcel IGCSE Biology — Paper 2B', subject:'Biology (4BI1)' }),
  chm: fromCambridge(IGCSE_CHM, { paperLabel:'Edexcel IGCSE Chemistry — Paper 2C', subject:'Chemistry (4CH1)' }),
  phy: fromCambridge(IGCSE_PHY, { paperLabel:'Edexcel IGCSE Physics — Paper 2P', subject:'Physics (4PH1)' }),
  geo: fromCambridge(IGCSE_GEO, { paperLabel:'Edexcel IGCSE Geography — Paper 2', subject:'Geography (4GE1)' }),
  his: fromCambridge(IGCSE_HIS, { paperLabel:'Edexcel IGCSE History — Paper 2', subject:'History (4HI1)' }),
  eco: fromCambridge(IGCSE_ECO, { paperLabel:'Edexcel IGCSE Economics — Paper 2', subject:'Economics (4EC1)' }),
  bus: fromCambridge(IGCSE_BUS, { paperLabel:'Edexcel IGCSE Business — Paper 2', subject:'Business (4BS1)' }),
  cmp: fromCambridge(IGCSE_CS, { paperLabel:'Edexcel IGCSE ICT — Paper 2', subject:'ICT (4IT1)' })
};

var EDXALEVEL_SPECS = (function(){
  function asEdx(spec, overrides){
    var out = Object.assign({}, spec, overrides || {});
    out.board = 'Edexcel International A-Level';
    return out;
  }
  return {
    mth: asEdx(ALEVEL_MATH, { paperLabel:'Edexcel IAL Maths — Pure 3 (P3)', subject:'Pure Mathematics 3 (WMA13)' }),
    fmth: asEdx(ALEVEL_FMATH, { paperLabel:'Edexcel IAL Further Maths — FP1', subject:'Further Pure 1 (WFM01)' }),
    phy: asEdx(ALEVEL_PHY, { paperLabel:'Edexcel IAL Physics — Unit 4', subject:'Physics Unit 4 (WPH14)' }),
    chm: asEdx(ALEVEL_CHM, { paperLabel:'Edexcel IAL Chemistry — Unit 4', subject:'Chemistry Unit 4 (WCH14)' }),
    bio: asEdx(ALEVEL_BIO, { paperLabel:'Edexcel IAL Biology — Unit 4', subject:'Biology Unit 4 (WBI14)' }),
    his: asEdx(ALEVEL_HIS, { paperLabel:'Edexcel IAL History — Paper 3', subject:'History (WHI03)' }),
    eco: asEdx(ALEVEL_ECO, { paperLabel:'Edexcel IAL Economics — Unit 4', subject:'Economics Unit 4 (WEC04)' })
  };
})();

// ─── Registry ─────────────────────────────────────────────────
// Lookup keyed by board + subjectKey-prefix (e.g. 'eng', 'mth', 'bio')
var REGISTRY = {
  IGCSE: {
    eng:  IGCSE_ENG_LANG,
    lit:  IGCSE_ENG_LIT,
    mth:  IGCSE_MATH,
    bio:  IGCSE_BIO,
    chm:  IGCSE_CHM,
    phy:  IGCSE_PHY,
    geo:  IGCSE_GEO,
    his:  IGCSE_HIS,
    eco:  IGCSE_ECO,
    bus:  IGCSE_BUS,
    cmp:  IGCSE_CS,
    fre:  IGCSE_FR
  },
  EDXIGCSE: EDXIGCSE_SPECS,
  ALEVEL: {
    mth:  ALEVEL_MATH,
    fmth: ALEVEL_FMATH,
    phy:  ALEVEL_PHY,
    chm:  ALEVEL_CHM,
    bio:  ALEVEL_BIO,
    his:  ALEVEL_HIS,
    eco:  ALEVEL_ECO
  },
  EDXALEVEL: EDXALEVEL_SPECS,
  SATS: {
    eng: SATS_ENG,
    mth: SATS_MATH
  },
  ELEVENPLUS: {
    eng: { board:'11+', subject:'English Comprehension', paperLabel:'11+ English', duration: 45, questionsToShow: 30, questionsToAnswer: 30, marksPerQuestion:1, notes:['Year 5/6 vocabulary. UK contexts. Comprehension + grammar + punctuation.'] },
    mth: { board:'11+', subject:'Mathematics', paperLabel:'11+ Maths', duration: 45, questionsToShow: 30, questionsToAnswer: 30, marksPerQuestion:1, syllabusAreas:['Number, four operations, fractions, decimals, percentages','Algebra (Year 6 level)','Geometry & measure','Data handling and probability'], notes:['No calculator. UK contexts (£, km, °C).'] },
    vr: ELEVENPLUS_VR,
    nvr: ELEVENPLUS_NVR
  }
};

// Generic fallback for any subject not in the registry — board-aware.
function genericSpec(board, subjectKey, subjectName){
  var bg = (board === 'ALEVEL' || board === 'EDXALEVEL') ? ALEVEL_GENERIC : IGCSE_GENERIC;
  return Object.assign({}, bg, {
    subject: subjectName || subjectKey,
    syllabusAreas: ['Use the official Cambridge/Edexcel syllabus topics for ' + (subjectName || subjectKey) + ' at the appropriate key stage.'],
    notes: bg.notes.concat([
      'No board-specific spec is registered for this subject. Generate questions following the structure of the current Cambridge/Edexcel ' + (subjectName || subjectKey) + ' syllabus.'
    ])
  });
}

// ─── Subject key normalisation ────────────────────────────────
// The site uses keys like 'eng-s2', 'mth-s3', 'bio-p1'. Strip the
// suffix to get the base subject prefix.
function normaliseSubjectKey(rawKey){
  if (!rawKey) return '';
  return String(rawKey).toLowerCase().replace(/-[a-z0-9]+$/, '');
}

function normaliseBoard(b){
  var raw = String(b||'').toLowerCase();
  if (raw === 'igcse' || raw === 'cambridge' || raw === 'cie') return 'IGCSE';
  if (raw === 'edxigcse' || raw === 'edexcel_igcse' || raw === 'pearson_igcse') return 'EDXIGCSE';
  if (raw === 'alevel' || raw === 'a-level' || raw === 'cambridge_alevel') return 'ALEVEL';
  if (raw === 'edxalevel' || raw === 'edexcel_alevel') return 'EDXALEVEL';
  if (raw === 'sats' || raw === 'ks2') return 'SATS';
  if (raw === '11+' || raw === 'elevenplus' || raw === 'eleven_plus') return 'ELEVENPLUS';
  return raw.toUpperCase().replace(/[^A-Z]/g,'');
}

// ─── Public API ────────────────────────────────────────────────
var ExamGen = {
  hasSpec: function(board, subject){
    var b = normaliseBoard(board);
    var s = normaliseSubjectKey(subject);
    return !!(REGISTRY[b] && REGISTRY[b][s]);
  },
  getSpec: function(board, subject){
    var b = normaliseBoard(board);
    var s = normaliseSubjectKey(subject);
    if (REGISTRY[b] && REGISTRY[b][s]) return REGISTRY[b][s];
    return null;
  },
  // Returns [{ type:'...', q:'...', yr:'2024 (AI)' }, ...]
  generate: async function(opts){
    opts = opts || {};
    var board = normaliseBoard(opts.board || 'IGCSE');
    var subjectKey = normaliseSubjectKey(opts.subject || 'eng');
    var subjectName = opts.subjectName || subjectKey;

    var spec = (REGISTRY[board] && REGISTRY[board][subjectKey]) || genericSpec(board, subjectKey, subjectName);
    var count = opts.count || spec.questionsToShow || 5;

    var system = buildSystemPrompt(spec, subjectName, count);
    var user = 'Generate ' + count + ' theory/structured questions for a ' + spec.board + ' ' + (spec.subject || subjectName) + ' paper. Output ONLY the JSON array. No preamble.';

    // Try Anthropic primary, OpenAI fallback. Lessons + this generator
    // both use Anthropic primarily. Translation is the only thing that
    // exclusively goes through OpenAI.
    var raw = await callAI(system, user);
    var arr = parseJSON(raw);
    if (!arr || !arr.length){
      // Retry once with a simpler instruction
      try {
        raw = await callAI(system + '\n\nIf JSON parsing failed before, ensure you output valid, parseable JSON now.', user);
        arr = parseJSON(raw);
      } catch(e){}
    }
    if (!arr || !arr.length){
      throw new Error('Could not generate paper from AI response.');
    }
    // Normalise to the existing topic shape — preserve mark scheme,
    // exemplar answer and examiner tip so the UI can surface them.
    return arr.map(function(item, i){
      return {
        type: item.type || ('Question ' + (i + 1)),
        q: item.q || item.question || '',
        parts: item.parts || null,
        scheme: item.scheme || item.mark_scheme || null,
        exemplar: item.exemplar || item.model_answer || '',
        examiner_tip: item.examiner_tip || item.tip || '',
        yr: item.yr || (new Date().getFullYear() + ' (AI)')
      };
    });
  }
};

// ─── Prompt construction ──────────────────────────────────────
function buildSystemPrompt(spec, subjectName, count){
  var lines = [
    'You are a senior ' + spec.board + ' Chief Examiner generating a fresh structured paper for ' + (spec.subject || subjectName) + '.',
    'You are writing for the British Curriculum (Cambridge IGCSE · Cambridge International A-Level · Edexcel International · National Curriculum · UK SATs · 11+) serving international students worldwide.',
    'Use British English spelling throughout (colour, organise, analyse, behaviour, programme, centre, metre, litre, neighbour, defence).',
    '',
    '═══ COPYRIGHT / ORIGINALITY (critical) ═══',
    'You MUST NOT reproduce any specific Cambridge or Edexcel past-paper question verbatim. Past papers and their mark schemes are © Cambridge Assessment International Education / Pearson Edexcel.',
    'Instead, write ORIGINAL questions that match the past-paper STYLE, REGISTER, COMMAND-WORD CHOICE, MARK-SCHEME LOGIC and DIFFICULTY profile. Think "questions a real examiner could plausibly set next year".',
    'Reuse the structural template (stem + (a)(b)(c) parts, marks in square brackets, data tables, source materials) but ALWAYS use fresh contexts, fresh numbers, fresh names and fresh scenarios.',
    '',
    '═══ MARK-SCHEME ALIGNMENT ═══',
    'Align each answer to the official Assessment Objectives: AO1 (knowledge & understanding) · AO2 (application) · AO3 (analysis, evaluation, synthesis).',
    'For multi-mark questions, provide marking points so each mark is earned for a specific stated idea ("1 mark for X; 1 mark for Y; 1 mark for evaluation Z").',
    'Use Cambridge command words exactly as the syllabus defines them: Define, State, Identify, Describe, Explain, Suggest, Compare, Contrast, Calculate, Show that, Justify, Evaluate, Discuss, Analyse, Sketch.',
    '',
    'PAPER STRUCTURE:',
    '- Number of questions to generate: ' + count,
    '- Marks per question: ' + spec.marksPerQuestion,
    '- Questions candidates will answer: ' + (spec.questionsToAnswer || count) + ' of ' + (spec.questionsToShow || count),
    '- Total time: ' + spec.duration + ' minutes',
    ''
  ];
  if (spec.essayTypes){
    lines.push('ESSAY/WRITING TYPES (each question must use a different type):');
    spec.essayTypes.forEach(function(t){ lines.push('  • ' + t); });
    lines.push('');
    if (spec.wordCount) lines.push('Word count expected: ' + spec.wordCount);
    lines.push('');
  }
  if (spec.syllabusAreas && spec.syllabusAreas.length){
    lines.push('SYLLABUS AREAS — draw questions from these. Spread across different areas; do NOT clump in one topic:');
    spec.syllabusAreas.forEach(function(a, i){ lines.push('  ' + (i+1) + '. ' + a); });
    lines.push('');
  }
  if (spec.notes && spec.notes.length){
    lines.push('BOARD-SPECIFIC GUIDANCE:');
    spec.notes.forEach(function(n){ lines.push('  • ' + n); });
    lines.push('');
  }
  lines.push('OUTPUT FORMAT — JSON array, no preamble, no code fences.');
  lines.push('Each item: {');
  lines.push('  "type": "<question type or topic area>",');
  lines.push('  "q": "<full question text including parts (a)(b)(c), with [marks] in square brackets at end of each part>",');
  lines.push('  "parts": [optional array of {label, text, marks}],');
  lines.push('  "scheme": [array of marking points e.g. "1 mark for stating Newton\'s third law", "1 mark for correctly identifying action-reaction pair"],');
  lines.push('  "exemplar": "<a model answer that would gain full marks — 2-3 sentences for short questions, longer for essays>",');
  lines.push('  "examiner_tip": "<one-line note on common errors the examiner sees>"');
  lines.push('}');
  lines.push('');
  lines.push('EXAMPLE (IGCSE English Paper 2, composition):');
  lines.push('[{"type":"Argumentative","q":"\'Online learning will never fully replace the classroom.\' Write an article for your school magazine arguing for or against this view. Your article should be 350–450 words. [40]","scheme":["W1 25 marks for content & structure: clear thesis, balanced argument, evidence","W2 15 marks for style & accuracy: register, spelling, varied sentence structure"],"exemplar":"A well-structured article with a clear thesis stated in the introduction…","examiner_tip":"Top-band candidates concede a counter-argument before refuting it."}]');
  lines.push('');
  lines.push('EXAMPLE (IGCSE Mathematics Extended, 1 structured question):');
  lines.push('[{"type":"Algebra & graphs","q":"(a) Solve the simultaneous equations: 3x + 2y = 16 and 5x − y = 14. [3] (b) A shop sells T-shirts for £8.50 each and hoodies for £22 each. On Saturday it sold 24 items for a total of £303. How many of each did it sell? [4]"}]');
  lines.push('');
  lines.push('CRITICAL: Output ONLY the JSON array. No explanation, no introduction, no closing remarks.');
  return lines.join('\n');
}

// ─── AI call with primary→fallback ────────────────────────────
async function callAI(system, user){
  var body = {
    model: 'claude-sonnet-4-6',
    max_tokens: 3500,
    system: system,
    messages: [{ role:'user', content: user }]
  };
  // Try Anthropic first
  try {
    var res = await fetch('/api/anthropic', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify(body)
    });
    if (res.ok){
      var d = await res.json();
      var t = pluckText(d);
      if (t) return t;
    }
  } catch(e){
    console.warn('[ExamGen] anthropic failed, falling back to openai', e);
  }
  // Fallback OpenAI
  try {
    var res2 = await fetch('/api/openai', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify(body)
    });
    if (res2.ok){
      var d2 = await res2.json();
      var t2 = pluckText(d2);
      if (t2) return t2;
    }
  } catch(e){
    console.warn('[ExamGen] openai also failed', e);
  }
  throw new Error('Both AI providers failed.');
}

function pluckText(data){
  if (!data) return '';
  if (data.content && data.content[0] && data.content[0].text) return data.content[0].text;
  if (typeof data.content === 'string') return data.content;
  if (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) return data.choices[0].message.content;
  return '';
}

// Extract JSON array from raw text (handles markdown fences, prose preamble)
function parseJSON(text){
  if (!text) return null;
  var s = String(text).trim();
  s = s.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/\s*```\s*$/, '').trim();
  var first = s.indexOf('[');
  if (first < 0) return null;
  var depth = 0, end = -1;
  for (var i = first; i < s.length; i++){
    if (s[i] === '[') depth++;
    else if (s[i] === ']'){ depth--; if (depth === 0){ end = i; break; } }
  }
  if (end < 0) return null;
  var slice = s.slice(first, end + 1);
  // Tolerant cleanup
  slice = slice
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/,(\s*[}\]])/g, '$1');
  try {
    var parsed = JSON.parse(slice);
    if (Array.isArray(parsed)) return parsed;
  } catch(e){
    console.warn('[ExamGen] JSON parse failed', e);
  }
  return null;
}

window.ExamGen = ExamGen;

})();
