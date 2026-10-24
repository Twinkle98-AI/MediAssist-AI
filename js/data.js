/**
 * MediAssist AI — Educational Data & Knowledge Base
 * 
 * NOTE FOR REVIEWERS & STUDENTS:
 * This file separates medical reference data from UI code.
 * All information here is strictly educational and non-prescriptive.
 */

const EMERGENCY_RED_FLAGS = [
  {
    title: "Chest Pain or Pressure",
    description: "Especially if radiating to the left arm, jaw, neck, or accompanied by sweating or shortness of breath."
  },
  {
    title: "Signs of Stroke (F.A.S.T.)",
    description: "Face drooping, Arm weakness, Speech difficulty — Call emergency services immediately."
  },
  {
    title: "Severe Shortness of Breath",
    description: "Inability to catch breath, blue lips or fingertips, or gasping while resting."
  },
  {
    title: "Sudden Severe Headache",
    description: "A sudden, blinding headache unlike any experienced before ('thunderclap headache')."
  },
  {
    title: "Severe Allergic Reaction (Anaphylaxis)",
    description: "Swelling of the lips, tongue, or throat, hives, or trouble swallowing."
  }
];

const MEDICINE_DATABASE = [
  {
    id: "med-1",
    name: "Paracetamol (Acetaminophen)",
    generic: "Acetaminophen",
    category: "Pain & Fever Relief",
    badge: "Over-the-Counter",
    overview: "Commonly used for mild-to-moderate pain relief (headaches, muscular aches) and reducing fever.",
    howItWorks: "Works primarily in the central nervous system to inhibit prostaglandin synthesis, helping reduce pain perception and regulate body temperature.",
    safetyPoints: [
      "Do NOT exceed 4,000 mg in 24 hours (or lower limit as advised by your doctor).",
      "Avoid combining with other products containing acetaminophen (cold & flu remedies).",
      "High doses or chronic use combined with alcohol can cause severe liver damage."
    ],
    foodInteractions: "Can generally be taken with or without food. Avoid excessive alcohol consumption.",
    storageAdvice: "Store at room temperature (15°C - 25°C) away from moisture and direct heat.",
    questionsForPharmacist: [
      "What is the maximum safe daily dose based on my weight and health history?",
      "Are any of my current prescription medicines duplicate sources of acetaminophen?"
    ]
  },
  {
    id: "med-2",
    name: "Ibuprofen",
    generic: "Ibuprofen (NSAID)",
    category: "Anti-Inflammatory & Pain Relief",
    badge: "Over-the-Counter",
    overview: "A nonsteroidal anti-inflammatory drug (NSAID) used to relieve inflammation, joint pain, menstrual cramps, and dental aches.",
    howItWorks: "Blocks COX enzymes (COX-1 and COX-2) to lower inflammatory chemical production in the body.",
    safetyPoints: [
      "Take with food or milk to reduce the risk of stomach irritation or ulcers.",
      "Caution advised for individuals with high blood pressure, kidney disease, or history of stomach ulcers.",
      "Avoid combining with other NSAIDs (such as naproxen or aspirin) without medical supervision."
    ],
    foodInteractions: "Always take with food, water, or milk. Avoid alcohol which increases gastric bleeding risk.",
    storageAdvice: "Store in a cool, dry place. Keep cap tightly closed.",
    questionsForPharmacist: [
      "Could ibuprofen interfere with my blood pressure medications?",
      "How many days in a row is it safe for me to use this before consulting a doctor?"
    ]
  },
  {
    id: "med-3",
    name: "Amoxicillin",
    generic: "Amoxicillin Trihydrate",
    category: "Antibiotics",
    badge: "Prescription Only",
    overview: "A penicillin-type antibiotic used to treat bacterial infections such as ear, chest, throat, and urinary tract infections.",
    howItWorks: "Inhibits bacterial cell wall synthesis, preventing bacteria from multiplying.",
    safetyPoints: [
      "Must be taken for the FULL prescribed duration, even if you feel completely recovered.",
      "Ineffective against viral illnesses like the common cold, COVID-19, or influenza.",
      "Notify your doctor immediately if you develop a rash, hives, or breathing difficulty."
    ],
    foodInteractions: "Can be taken with or without food. Drinking plenty of water is recommended.",
    storageAdvice: "Store capsules/tablets at room temperature. Liquid suspensions often require refrigeration (check label).",
    questionsForPharmacist: [
      "Should I take a probiotic alongside or spaced apart from this antibiotic?",
      "What should I do if I miss a scheduled dose?"
    ]
  },
  {
    id: "med-4",
    name: "Cetirizine",
    generic: "Cetirizine Hydrochloride",
    category: "Allergy & Antihistamine",
    badge: "Over-the-Counter",
    overview: "A second-generation antihistamine used to relieve seasonal allergy symptoms (hay fever), sneezing, runny nose, and itchy skin hives.",
    howItWorks: "Blocks histamine H1 receptors to reduce allergic responses with lower risk of sedation compared to first-generation antihistamines.",
    safetyPoints: [
      "While less sedating than older allergy medicines, it can still cause mild drowsiness in some people.",
      "Use caution when driving or operating machinery until you know how it affects you.",
      "Inform your doctor if you have kidney or liver impairment."
    ],
    foodInteractions: "May be taken with or without meals. Avoid taking alongside tranquilizers or alcohol.",
    storageAdvice: "Store in a dry room below 30°C. Protect from bright light.",
    questionsForPharmacist: [
      "Is this suitable for daily long-term use during allergy season?",
      "Does this interact with nasal sprays or decongestants I may also be taking?"
    ]
  },
  {
    id: "med-5",
    name: "Metformin",
    generic: "Metformin Hydrochloride",
    category: "Blood Sugar Regulation",
    badge: "Prescription Only",
    overview: "A frontline oral biguanide medicine used to manage blood glucose levels in adults with Type 2 diabetes.",
    howItWorks: "Reduces glucose production in the liver, decreases intestinal absorption, and improves insulin sensitivity in body tissues.",
    safetyPoints: [
      "Usually taken with meals to minimize gastrointestinal side effects (nausea, upset stomach).",
      "Regular monitoring of kidney function and vitamin B12 levels is commonly recommended.",
      "Do not skip meals while taking blood sugar management medication unless advised."
    ],
    foodInteractions: "Take strictly with meals to prevent stomach discomfort. Limit alcohol intake.",
    storageAdvice: "Keep in original container, tightly closed, at room temperature away from excessive moisture.",
    questionsForPharmacist: [
      "What symptoms of low blood sugar (hypoglycemia) should I watch out for?",
      "Should I pause this medication before undergoing imaging scans with contrast dye?"
    ]
  },
  {
    id: "med-6",
    name: "Omeprazole",
    generic: "Omeprazole (PPI)",
    category: "Acid Reducer & GI Health",
    badge: "OTC / Prescription",
    overview: "A proton pump inhibitor (PPI) that decreases stomach acid production to treat acid reflux (GERD) and stomach ulcers.",
    howItWorks: "Selectively and irreversibly inhibits the gastric H+/K+-ATPase enzyme system in stomach parietal cells.",
    safetyPoints: [
      "Best taken 30 to 60 minutes BEFORE breakfast with a full glass of water.",
      "Swallow capsules whole; do not chew or crush delayed-release granules.",
      "Long-term use (months or years) should be periodically evaluated by a healthcare professional."
    ],
    foodInteractions: "Take before the first meal of the day. Avoid trigger foods (caffeine, high spice, fatty foods) for optimal results.",
    storageAdvice: "Store below 25°C in the original moisture-resistant container.",
    questionsForPharmacist: [
      "How soon can I expect symptom relief after beginning this course?",
      "Could this impact absorption of calcium, magnesium, or iron supplements?"
    ]
  }
];

const SUGGESTED_APPOINTMENT_QUESTIONS = {
  general: [
    "What could be the most likely causes of the symptoms I am experiencing?",
    "Are there any diagnostic tests or screenings you recommend today?",
    "Are there non-pharmacological or lifestyle modifications that could help?",
    "What warning signs or symptoms should prompt me to contact your office or seek urgent care?",
    "When should we schedule a follow-up consultation to evaluate my progress?"
  ],
  medication: [
    "What is the specific goal of each newly prescribed medication?",
    "What are common or serious side effects I should be watchful for?",
    "How long will I need to remain on this medication?",
    "Are there any specific food, vitamin, or OTC interactions I must avoid?"
  ],
  lifestyle: [
    "What physical activity levels or dietary habits do you recommend for my situation?",
    "How does stress or sleep quality impact the condition we discussed?",
    "Are there community or wellness resources that you would recommend?"
  ]
};

const AI_EDUCATIONAL_TOPICS = [
  {
    keywords: ["dehydration", "water", "thirst", "fluid", "dry mouth"],
    title: "Hydration & Signs of Mild Dehydration",
    summary: "Hydration is essential for temperature regulation, joint lubrication, and organ function.",
    details: [
      "**Common Signs of Mild Dehydration**: Thirst, dry mouth, dark yellow or amber urine, mild headache, and feeling fatigued.",
      "**Daily Fluid Guidelines**: While general advice suggests around 2 to 2.5 liters of fluid daily, individual needs vary significantly based on activity, climate, and health conditions.",
      "**Hydration Tips**: Keep a reusable water bottle handy, eat water-rich fruits (cucumbers, melons, oranges), and monitor urine color (pale straw color indicates healthy hydration).",
      "**When to Seek Immediate Care**: Inability to keep fluids down, extreme dizziness upon standing, confusion, or absence of urination for over 8 hours."
    ],
    suggestedFollowUp: "Ask your doctor: 'What is an appropriate daily fluid intake for my specific kidney and cardiac profile?'"
  },
  {
    keywords: ["blood test", "fasting", "lab", "prep", "routine test", "cholesterol test"],
    title: "Preparing for Common Blood Tests",
    summary: "Proper preparation ensures test results are accurate and minimizes the need for repeat blood draws.",
    details: [
      "**Fasting Requirements**: Some tests (like lipid panels and fasting blood glucose) require 8 to 12 hours of fasting. Clarify with your clinic whether you can take regular prescription medicines.",
      "**Drink Plenty of Plain Water**: Staying well-hydrated makes veins plumper and easier for phlebotomists to locate, reducing discomfort.",
      "**Avoid Strenuous Exercise**: Intensive workouts right before testing can temporarily alter kidney enzyme and electrolyte levels.",
      "**Dress Comfortably**: Wear short sleeves or loose clothing that easily rolls above your elbows."
    ],
    suggestedFollowUp: "Ask your clinic: 'Should I take my morning blood pressure or thyroid medications with water prior to the draw?'"
  },
  {
    keywords: ["cold", "flu", "influenza", "fever", "cough", "runny nose", "difference"],
    title: "Cold vs. Flu: Understanding the Distinctions",
    summary: "While both are contagious respiratory viral infections, they typically exhibit distinct patterns of onset and severity.",
    details: [
      "**Onset Speed**: Common colds usually develop gradually over several days. The flu typically hits abruptly within hours.",
      "**Fever & Chills**: Rare with standard colds; very common and often higher (100°F–102°F or higher) with influenza.",
      "**Body Aches & Fatigue**: Mild in colds; deep, exhausting muscular aches and profound fatigue are hallmark signs of flu.",
      "**General Care**: Rest, adequate fluids, and warm saline rinses. Note that antibiotics do NOT treat viral colds or flu.",
      "**Red Flag Signs**: Shortness of breath, chest pressure, persistent high fever, or confusion necessitate immediate medical evaluation."
    ],
    suggestedFollowUp: "Ask your doctor: 'Are antiviral prescription medications appropriate for my symptoms and timeline?'"
  },
  {
    keywords: ["sleep", "insomnia", "tired", "rest", "circadian", "sleep hygiene"],
    title: "Evidence-Based Sleep Hygiene Essentials",
    summary: "Consistent sleep practices support immune defense, cognitive sharpness, and cardiovascular wellbeing.",
    details: [
      "**Consistent Schedule**: Go to bed and wake up at approximately the same time every day, including weekends.",
      "**Light Management**: Maximize morning natural sunlight exposure. Limit blue light screens (phones, laptops) 60 minutes before bed.",
      "**Bedroom Environment**: Keep your bedroom cool (around 18°C / 65°F), dark, and quiet.",
      "**Wind-Down Routine**: Practice 15–30 minutes of low-stimulation activities like reading, gentle stretching, or breathing exercises.",
      "**Avoid Late Stimulants**: Refrain from caffeine at least 6–8 hours prior to bed and avoid heavy meals late in the evening."
    ],
    suggestedFollowUp: "Ask your doctor: 'Could my persistent daytime fatigue warrant a sleep study or screening for sleep apnea?'"
  },
  {
    keywords: ["blood pressure", "hypertension", "systolic", "diastolic", "reading", "mmhg"],
    title: "Understanding Blood Pressure Readings",
    summary: "Blood pressure measures the force circulating blood exerts against arterial walls.",
    details: [
      "**Two Key Numbers**: Systolic (top number, pressure when the heart beats) over Diastolic (bottom number, pressure when the heart rests between beats).",
      "**General Reference Categories (AHA Guidelines)**: Normal is typically less than 120/80 mmHg. Elevated is 120-129 / <80. Stage 1 Hypertension is 130-139 / 80-89.",
      "**Home Measurement Tips**: Rest quietly for 5 minutes before reading. Keep feet flat on the floor, support your arm at heart level, and avoid caffeine/smoking for 30 minutes prior.",
      "**Hypertensive Crisis**: Readings exceeding 180/120 mmHg, particularly if accompanied by chest pain, headache, or shortness of breath, require emergency medical intervention."
    ],
    suggestedFollowUp: "Ask your doctor: 'What is my personal target blood pressure range considering my individual risk factors?'"
  },
  {
    keywords: ["pulse oximeter", "oxygen", "spo2", "pulse", "saturation"],
    title: "How Pulse Oximeters Work & What SpO2 Means",
    summary: "A pulse oximeter is a non-invasive device estimating the oxygen saturation of your red blood cells.",
    details: [
      "**Light Absorption Principle**: The device shines infrared and red light through your fingertip to measure how much light oxygenated versus deoxygenated hemoglobin absorbs.",
      "**Typical Values**: For most healthy individuals, normal SpO2 readings fall between 95% and 100%.",
      "**Factors That Affect Accuracy**: Cold fingers, dark nail polish, artificial nails, severe hand tremors, or bright ambient light can cause erroneous readings.",
      "**Clinical Caution**: Never rely solely on a home device. If you feel short of breath or dizzy, seek prompt medical attention regardless of the number."
    ],
    suggestedFollowUp: "Ask your doctor: 'What baseline oxygen level is expected for me, especially if I have asthma or COPD?'"
  }
];

const PROTOTYPE_EXPLANATION = {
  badge: "NVIDIA AI Integration",
  headline: "How MediAssist AI Works & Server-Side NVIDIA AI Integration",
  clientSideMessage: "MediAssist AI connects via a secure local Node.js backend to NVIDIA NIM AI to provide general health education and doctor visit preparation. Chat questions are transmitted to the AI provider to generate answers, while personal planner data (symptoms, appointments, medications) remains stored in your browser.",
  realWorldSteps: [
    {
      step: 1,
      title: "Secure Backend Gateway (Node.js & Express)",
      description: "Your browser connects only to your local server. Private NVIDIA API keys are securely stored in server environment variables (.env) and are never exposed to browser JavaScript."
    },
    {
      step: 2,
      title: "Zero-Latency Emergency Guardrails",
      description: "The backend validates inputs and pre-screens for critical emergency signs (chest pain, stroke signs), immediately returning emergency hotline guidance (911 / 112) without delay."
    },
    {
      step: 3,
      title: "NVIDIA NIM AI Processing",
      description: "General health education questions are transmitted to NVIDIA NIM under strict clinical system instructions to explain health concepts in plain language without diagnosing or prescribing."
    },
    {
      step: 4,
      title: "Privacy & Zero Unnecessary Data Storage",
      description: "Responses are delivered back with non-diagnostic disclaimers. The backend does not record, log, or persist user medical questions to any database or disk."
    }
  ]
};
