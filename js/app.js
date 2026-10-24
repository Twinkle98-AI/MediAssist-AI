/**
 * MediAssist AI — Application Logic
 * 
 * NOTE FOR BEGINNERS & REVIEWERS:
 * This script handles all interactive behavior:
 * 1. AI Health Assistant simulation (non-diagnostic, educational)
 * 2. Symptom Organizer and clinical communication notes
 * 3. Healthcare Appointment Planner & Question Builder
 * 4. Medicine Information search & daily dose tracker
 * 5. Comprehensive Health Summary with print/PDF support
 * 6. LocalStorage persistence (100% private in-browser storage)
 */

(function () {
  'use strict';

  // =========================================================================
  // 1. STATE MANAGEMENT & LOCAL STORAGE
  // =========================================================================
  const STORAGE_KEY = 'mediassist_ai_patient_data_v1';

  let appState = {
    patientName: '',
    symptoms: [],
    appointments: [],
    selectedQuestionsForCurrentForm: [],
    myMeds: [],
    chatHistory: []
  };

  // Load persisted state from the user's browser localStorage
  function loadState() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        appState = { ...appState, ...parsed };
      }
    } catch (err) {
      console.warn('Could not load stored data from localStorage:', err);
    }
  }

  // Save current state back to browser localStorage
  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
    } catch (err) {
      console.warn('Could not save data to localStorage:', err);
    }
    // Automatically update the Unified Health Summary whenever state changes
    renderHealthSummary();
  }

  // =========================================================================
  // 2. TOAST NOTIFICATION & CLIPBOARD HELPERS
  // =========================================================================
  function showToast(message, icon = '✓') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }

  // Safe clipboard helper with automatic fallback for older browsers or restricted contexts
  function copyTextSafely(text, successMessage = 'Copied to clipboard!') {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(() => {
        showToast(successMessage);
      }).catch(() => {
        fallbackCopyText(text, successMessage);
      });
    } else {
      fallbackCopyText(text, successMessage);
    }
  }

  function fallbackCopyText(text, successMessage) {
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-9999px';
      textArea.style.top = '-9999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textArea);
      if (success) {
        showToast(successMessage);
      } else {
        showToast('Text selected — press Ctrl+C to copy', 'ℹ️');
      }
    } catch (err) {
      showToast('Could not copy automatically', '⚠️');
    }
  }

  // =========================================================================
  // 3. AI HEALTH ASSISTANT LOGIC
  // =========================================================================
  function initAiAssistant() {
    const chatForm = document.getElementById('chatForm');
    const chatInput = document.getElementById('chatInput');
    const chatMessages = document.getElementById('chatMessages');
    const typingIndicator = document.getElementById('typingIndicator');
    const promptChipsList = document.getElementById('promptChipsList');
    const resetChatBtn = document.getElementById('resetChatBtn');
    const exportChatBtn = document.getElementById('exportChatBtn');

    // Populate suggested prompt chips in the left sidebar
    if (promptChipsList && typeof AI_EDUCATIONAL_TOPICS !== 'undefined') {
      promptChipsList.innerHTML = '';
      AI_EDUCATIONAL_TOPICS.forEach(topic => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'prompt-chip-btn';
        btn.innerHTML = `
          <span>${topic.title}</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
        `;
        btn.addEventListener('click', () => {
          handleUserChatQuery(topic.title);
        });
        promptChipsList.appendChild(btn);
      });
    }

    // Handle form submission
    if (chatForm) {
      chatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const query = chatInput.value.trim();
        if (!query) return;
        chatInput.value = '';
        handleUserChatQuery(query);
      });
    }

    // Reset conversation
    if (resetChatBtn) {
      resetChatBtn.addEventListener('click', () => {
        chatMessages.innerHTML = `
          <div class="message-row assistant-row">
            <div class="message-avatar ai-avatar">AI</div>
            <div>
              <div class="message-bubble">
                Conversation refreshed. Ask a general health question, test preparation query, or click any topic on the left.
              </div>
              <span class="message-disclaimer-pill">Educational Only &bull; Non-Diagnostic</span>
              <span class="message-time">Just now</span>
            </div>
          </div>
          <div class="typing-indicator" id="typingIndicator">
            <span class="typing-dot"></span>
            <span class="typing-dot"></span>
            <span class="typing-dot"></span>
          </div>
        `;
        showToast('Chat history cleared');
      });
    }

    // Export conversation notes
    if (exportChatBtn) {
      exportChatBtn.addEventListener('click', () => {
        const textNotes = Array.from(chatMessages.querySelectorAll('.message-bubble'))
          .map(b => b.innerText.trim())
          .join('\n\n---\n\n');
        
        copyTextSafely(textNotes, 'Chat notes copied to clipboard!');
      });
    }

    // Check backend connection and AI configuration status honestly (Requirement 11)
    checkBackendStatus();
  }

  // Check backend server status and honest AI connection state
  async function checkBackendStatus() {
    const statusPill = document.getElementById('chatStatusPill');
    if (!statusPill) return;

    try {
      const res = await fetch('/api/status', { method: 'GET' });
      if (!res.ok) throw new Error('Status check non-200');
      const data = await res.json();

      if (data.configured) {
        statusPill.innerHTML = `
          <span style="display:inline-block; width:6px; height:6px; border-radius:50%; background:#10b981;"></span>
          Online &bull; ${escapeHtml(data.provider || 'AI')} Connected
        `;
        statusPill.title = `Connected to live ${data.provider} (${data.model || ''})`;
      } else {
        statusPill.innerHTML = `
          <span style="display:inline-block; width:6px; height:6px; border-radius:50%; background:#f59e0b;"></span>
          Server Active &bull; No API Key (.env)
        `;
        statusPill.title = 'Backend running. Add GEMINI_API_KEY in .env for live AI responses.';
      }
    } catch (err) {
      // Backend not running (e.g. running via python or direct file)
      statusPill.innerHTML = `
        <span style="display:inline-block; width:6px; height:6px; border-radius:50%; background:#0284c7;"></span>
        Local Knowledge Base Mode
      `;
      statusPill.title = 'Running client-side without backend server.';
    }
  }

  // Helper to append assistant responses to the chat stream
  function appendAssistantMessage(htmlContent, disclaimerText) {
    const chatMessages = document.getElementById('chatMessages');
    const typingIndicator = document.getElementById('typingIndicator');
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const aiRow = document.createElement('div');
    aiRow.className = 'message-row assistant-row';
    aiRow.innerHTML = `
      <div class="message-avatar ai-avatar">AI</div>
      <div>
        <div class="message-bubble">${htmlContent}</div>
        <span class="message-disclaimer-pill">${escapeHtml(disclaimerText)}</span>
        <span class="message-time">${timeStr}</span>
      </div>
    `;
    chatMessages.insertBefore(aiRow, typingIndicator);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  // Handle a user query in the chat (calls Node.js backend POST /api/chat)
  async function handleUserChatQuery(userText) {
    const chatMessages = document.getElementById('chatMessages');
    const typingIndicator = document.getElementById('typingIndicator');
    const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Append User Message to UI
    const userRow = document.createElement('div');
    userRow.className = 'message-row user-row';
    userRow.innerHTML = `
      <div class="message-avatar user-avatar">You</div>
      <div>
        <div class="message-bubble">${escapeHtml(userText)}</div>
        <span class="message-time">${currentTime}</span>
      </div>
    `;
    chatMessages.insertBefore(userRow, typingIndicator);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    // Show typing simulation
    if (typingIndicator) {
      typingIndicator.style.display = 'flex';
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    try {
      // Call secure Node.js Express backend
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: userText })
      });

      const data = await response.json().catch(() => ({}));

      if (typingIndicator) typingIndicator.style.display = 'none';

      // 1. Backend Emergency Red Flag Intercept
      if (data && data.emergency) {
        const emergencyHtml = formatMarkdownToHtml(data.reply);
        appendAssistantMessage(emergencyHtml, data.disclaimer || 'CRITICAL EMERGENCY ALERT • Seek Immediate Care');
        return;
      }

      // 2. Real AI Provider Response
      if (response.ok && data && data.ok && data.reply) {
        const aiHtml = formatMarkdownToHtml(data.reply);
        const disclaimer = data.disclaimer || `${data.provider || 'AI'} • Non-Diagnostic • Consult a Physician`;
        appendAssistantMessage(aiHtml, disclaimer);
        return;
      }

      // 3. Backend Running but AI API Key Not Configured (Requirement 11)
      if (data && data.error === 'AI_NOT_CONFIGURED') {
        const fallback = generateEducationalResponse(userText);
        const noticeBubble = `
          <div style="background: var(--amber-50); border: 1px solid #fde68a; border-radius: var(--radius-sm); padding: 0.5rem 0.75rem; margin-bottom: 0.65rem; font-size: 0.8rem; color: #92400e;">
            ⚙️ <strong>Backend Notice:</strong> Backend is running, but no <code>GEMINI_API_KEY</code> is configured in <code>.env</code> yet. Showing educational reference guide.
          </div>
          ${fallback.html}
        `;
        appendAssistantMessage(noticeBubble, 'Local Knowledge Base • AI Key Not Configured in .env');
        return;
      }

      // 4. Rate Limit (429) or Other AI Service Error
      if (data && (data.error === 'AI_SERVICE_ERROR' || !response.ok)) {
        const fallback = generateEducationalResponse(userText);
        const errorNotice = `
          <div style="background: var(--amber-50); border: 1px solid #fde68a; border-radius: var(--radius-sm); padding: 0.5rem 0.75rem; margin-bottom: 0.65rem; font-size: 0.8rem; color: #92400e;">
            ℹ️ <strong>AI Service Notice:</strong> ${escapeHtml(data.message || 'AI service temporarily unavailable.')}
          </div>
          ${fallback.html}
        `;
        appendAssistantMessage(errorNotice, 'Educational Reference • Service Notice');
        return;
      }

      // 5. Default fallback
      const fallback = generateEducationalResponse(userText);
      appendAssistantMessage(fallback.html, fallback.disclaimer);

    } catch (err) {
      // Offline / Direct File Opening Fallback (Ensures site never breaks)
      console.warn('Backend /api/chat unreachable, falling back to local knowledge base:', err);
      if (typingIndicator) typingIndicator.style.display = 'none';

      const fallback = generateEducationalResponse(userText);
      appendAssistantMessage(fallback.html, fallback.disclaimer);
    }
  }


  // Intelligent Educational Response Generator
  function generateEducationalResponse(query) {
    const q = query.toLowerCase();

    // 1. EMERGENCY RED FLAG CHECK
    const redFlagWords = ['chest pain', 'heart attack', 'cant breathe', "can't breathe", 'stroke', 'bleeding heavily', 'seizure', 'passed out', 'suicide', 'anaphylaxis'];
    const isEmergency = redFlagWords.some(w => q.includes(w));

    if (isEmergency) {
      return {
        html: `
          <div style="color: #b91c1c; font-weight: 700; margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.4rem;">
            🚨 URGENT MEDICAL WARNING:
          </div>
          <p>The symptoms or terms you mentioned (<strong>"${escapeHtml(query)}"</strong>) can indicate a critical, life-threatening emergency.</p>
          <p style="margin: 0.5rem 0; font-weight: 600;">Do NOT delay or rely on online tools. Please take immediate action:</p>
          <ul style="padding-left: 1.25rem; margin-bottom: 0.75rem;">
            <li><strong>Call 911</strong> (US/Canada), <strong>112</strong> (Europe/India), or <strong>999</strong> (UK) immediately.</li>
            <li>Alert someone nearby so you are not alone.</li>
            <li>If experiencing chest pressure radiating to the arm, sit upright and rest quietly while emergency personnel arrive.</li>
          </ul>
        `,
        disclaimer: 'CRITICAL EMERGENCY ALERT &bull; Seek Immediate Care'
      };
    }

    // 2. MATCH AGAINST TOPICS DATABASE
    if (typeof AI_EDUCATIONAL_TOPICS !== 'undefined') {
      for (const topic of AI_EDUCATIONAL_TOPICS) {
        const matchesKeyword = topic.keywords.some(k => q.includes(k));
        const matchesTitle = q.includes(topic.title.toLowerCase());
        
        if (matchesKeyword || matchesTitle) {
          const bulletsHtml = topic.details.map(d => {
            const formatted = d.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
            return `<li style="margin-bottom: 0.35rem;">${formatted}</li>`;
          }).join('');

          return {
            html: `
              <h4 style="color: var(--teal-800); margin-bottom: 0.4rem;">${topic.title}</h4>
              <p style="margin-bottom: 0.5rem;">${topic.summary}</p>
              <ul style="padding-left: 1.25rem; margin-bottom: 0.75rem;">${bulletsHtml}</ul>
              <div style="background: var(--teal-50); border: 1px solid var(--teal-200); border-radius: var(--radius-sm); padding: 0.5rem 0.75rem; font-size: 0.825rem; color: var(--teal-900);">
                💡 <strong>Suggested Doctor Question:</strong> ${topic.suggestedFollowUp}
              </div>
            `,
            disclaimer: 'Educational Information &bull; Non-Diagnostic'
          };
        }
      }
    }

    // 3. MEDICINE RELATED QUERY CHECK
    if (typeof MEDICINE_DATABASE !== 'undefined') {
      const matchedMed = MEDICINE_DATABASE.find(m => 
        q.includes(m.name.toLowerCase()) || q.includes(m.generic.toLowerCase())
      );
      if (matchedMed) {
        return {
          html: `
            <h4 style="color: var(--teal-800); margin-bottom: 0.3rem;">Educational Drug Reference: ${matchedMed.name}</h4>
            <p><strong>Class:</strong> ${matchedMed.category} (${matchedMed.badge})</p>
            <p style="margin: 0.4rem 0;">${matchedMed.overview}</p>
            <div style="background: var(--amber-50); border-left: 3px solid var(--amber-500); padding: 0.5rem; border-radius: 4px; font-size: 0.8rem; margin: 0.5rem 0;">
              <strong>Key Safety Points:</strong>
              <ul style="padding-left: 1rem; margin-top: 0.25rem;">
                ${matchedMed.safetyPoints.map(p => `<li>${p}</li>`).join('')}
              </ul>
            </div>
            <p style="font-size: 0.825rem;">You can explore the full monograph in the <strong>Medicine Guide</strong> section below.</p>
          `,
          disclaimer: 'Educational Drug Fact &bull; Consult Pharmacist'
        };
      }
    }

    // 4. FALLBACK GENERAL HEALTH RESPONSE
    return {
      html: `
        <h4 style="color: var(--slate-900); margin-bottom: 0.35rem;">General Health Guidance on "${escapeHtml(query)}"</h4>
        <p style="margin-bottom: 0.5rem;">
          In this educational prototype, detailed custom queries are structured to promote doctor-patient communication rather than automated diagnosing.
        </p>
        <p style="margin-bottom: 0.5rem;">
          To prepare a discussion about this topic with your clinician:
        </p>
        <ul style="padding-left: 1.25rem; margin-bottom: 0.65rem;">
          <li>Log when you first noticed questions or symptoms related to this in the <strong>Symptom Organizer</strong>.</li>
          <li>Write down specific triggers, severity changes, and duration.</li>
          <li>Add a prioritized question in the <strong>Appointment Planner</strong> so your physician addresses it thoroughly.</li>
        </ul>
        <p style="font-size: 0.8rem; color: var(--slate-500);">
          <em>Tip: Click any of the suggested topics on the left sidebar (such as Dehydration, Blood Test Prep, or Blood Pressure readings) to view deep educational guides.</em>
        </p>
      `,
      disclaimer: 'Prototype Response &bull; General Guidance'
    };
  }

  // =========================================================================
  // 4. SYMPTOM ORGANIZER LOGIC
  // =========================================================================
  function initSymptomOrganizer() {
    const symptomForm = document.getElementById('symptomForm');
    const symptomNameInput = document.getElementById('symptomName');
    const symptomLocation = document.getElementById('symptomLocation');
    const symptomDuration = document.getElementById('symptomDuration');
    const symptomSeverity = document.getElementById('symptomSeverity');
    const severityLabelText = document.getElementById('severityLabelText');
    const symptomTriggers = document.getElementById('symptomTriggers');
    const quickChips = document.querySelectorAll('#quickSymptomChips .chip');
    const copySymptomSheetBtn = document.getElementById('copySymptomSheetBtn');

    // Severity Slider Dynamic Visual Cue
    if (symptomSeverity && severityLabelText) {
      symptomSeverity.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        let category = 'Mild';
        let color = '#059669';

        if (val >= 4 && val <= 6) {
          category = 'Moderate';
          color = '#d97706';
        } else if (val >= 7 && val <= 8) {
          category = 'Severe';
          color = '#dc2626';
        } else if (val >= 9) {
          category = 'Critical / Urgent Attention';
          color = '#991b1b';
        }

        severityLabelText.textContent = `Level ${val} • ${category}`;
        severityLabelText.style.color = color;
      });
    }

    // Quick Chips Autofill
    quickChips.forEach(chip => {
      chip.addEventListener('click', () => {
        quickChips.forEach(c => c.classList.remove('selected'));
        chip.classList.add('selected');
        const symptom = chip.getAttribute('data-symptom');
        if (symptomNameInput) {
          symptomNameInput.value = symptom;
          symptomNameInput.focus();
        }
      });
    });

    // Handle Form Submit
    if (symptomForm) {
      symptomForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = symptomNameInput.value.trim();
        const duration = symptomDuration.value.trim();
        if (!name || !duration) return;

        const newSymptom = {
          id: 'symp_' + Date.now(),
          name: name,
          location: symptomLocation.value,
          duration: duration,
          severity: parseInt(symptomSeverity.value, 10),
          triggers: symptomTriggers.value.trim(),
          addedAt: new Date().toLocaleDateString()
        };

        appState.symptoms.push(newSymptom);
        saveState();
        renderSymptomsList();

        // Reset form
        symptomForm.reset();
        symptomSeverity.value = 4;
        severityLabelText.textContent = 'Level 4 • Moderate';
        severityLabelText.style.color = 'var(--teal-700)';
        quickChips.forEach(c => c.classList.remove('selected'));

        showToast('Symptom organized & added to sheet!');
      });
    }

    // Copy Symptom Sheet
    if (copySymptomSheetBtn) {
      copySymptomSheetBtn.addEventListener('click', () => {
        if (appState.symptoms.length === 0) {
          showToast('No symptoms to copy yet', 'ℹ️');
          return;
        }

        const formatted = appState.symptoms.map((s, idx) => {
          let str = `${idx + 1}. ${s.name} (${s.location})\n   - Duration: ${s.duration}\n   - Severity Rating: ${s.severity}/10`;
          if (s.triggers) str += `\n   - Context / Notes: ${s.triggers}`;
          return str;
        }).join('\n\n');

        const header = "DOCTOR'S CONSULTATION SYMPTOM SUMMARY\nPrepared via MediAssist AI (Non-Diagnostic Patient Notes)\n=======================================================\n\n";

        copyTextSafely(header + formatted, 'Symptom notes copied to clipboard!');
      });
    }

    renderSymptomsList();
  }

  // Render Active Symptoms
  function renderSymptomsList() {
    const container = document.getElementById('activeSymptomsContainer');
    const prepBox = document.getElementById('prepSummaryBox');
    const bulletList = document.getElementById('prepBulletList');
    if (!container) return;

    if (appState.symptoms.length === 0) {
      container.innerHTML = `
        <div class="empty-state-notice">
          <div class="empty-state-icon">📋</div>
          <p><strong>No symptoms recorded yet.</strong></p>
          <p style="font-size: 0.8rem;">Add symptoms on the left to structure your timeline and severity for your doctor.</p>
        </div>
      `;
      if (prepBox) prepBox.style.display = 'none';
      return;
    }

    container.innerHTML = '';
    appState.symptoms.forEach(symp => {
      let badgeClass = 'badge-teal';
      let sevText = 'Mild';
      if (symp.severity >= 4 && symp.severity <= 6) {
        badgeClass = 'badge-amber';
        sevText = 'Moderate';
      } else if (symp.severity >= 7) {
        badgeClass = 'badge-prototype';
        sevText = 'Severe';
      }

      const itemCard = document.createElement('div');
      itemCard.className = 'symptom-item-card';
      itemCard.innerHTML = `
        <div class="symptom-main-info" style="flex: 1;">
          <h4>
            ${escapeHtml(symp.name)}
            <span class="badge ${badgeClass}">${symp.severity}/10 &bull; ${sevText}</span>
          </h4>
          <div class="symptom-meta-row">
            <span>📍 ${escapeHtml(symp.location)}</span>
            <span>⏱️ ${escapeHtml(symp.duration)}</span>
          </div>
          ${symp.triggers ? `<div class="symptom-notes-text"><strong>Context:</strong> ${escapeHtml(symp.triggers)}</div>` : ''}
        </div>
        <button type="button" class="delete-item-btn" title="Remove symptom" data-id="${symp.id}">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
        </button>
      `;

      itemCard.querySelector('.delete-item-btn').addEventListener('click', () => {
        deleteSymptom(symp.id);
      });

      container.appendChild(itemCard);
    });

    // Populate the clinical bullet summary preview
    if (prepBox && bulletList) {
      prepBox.style.display = 'block';
      bulletList.innerHTML = appState.symptoms.map(s => `
        <li>
          <strong>${escapeHtml(s.name)}</strong>: ${escapeHtml(s.location)} | Duration: ${escapeHtml(s.duration)} | Reported severity: ${s.severity}/10${s.triggers ? ` | Notes: ${escapeHtml(s.triggers)}` : ''}
        </li>
      `).join('');
    }
  }

  function deleteSymptom(id) {
    appState.symptoms = appState.symptoms.filter(s => s.id !== id);
    saveState();
    renderSymptomsList();
    showToast('Symptom removed');
  }

  // =========================================================================
  // 5. APPOINTMENT PLANNER LOGIC
  // =========================================================================
  function initAppointmentPlanner() {
    const form = document.getElementById('appointmentForm');
    const questionsCloud = document.getElementById('suggestedQuestionsCloud');
    const customQuestionInput = document.getElementById('customQuestionInput');
    const addCustomQuestionBtn = document.getElementById('addCustomQuestionBtn');

    // Populate suggested questions from database
    if (questionsCloud && typeof SUGGESTED_APPOINTMENT_QUESTIONS !== 'undefined') {
      questionsCloud.innerHTML = '';
      const pool = [
        ...SUGGESTED_APPOINTMENT_QUESTIONS.general.slice(0, 3),
        ...SUGGESTED_APPOINTMENT_QUESTIONS.medication.slice(0, 2),
        ...SUGGESTED_APPOINTMENT_QUESTIONS.lifestyle.slice(0, 1)
      ];

      pool.forEach(qText => {
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'chip';
        chip.textContent = qText;
        chip.addEventListener('click', () => {
          addQuestionToCurrentSelection(qText);
        });
        questionsCloud.appendChild(chip);
      });
    }

    // Add Custom Question
    if (addCustomQuestionBtn && customQuestionInput) {
      addCustomQuestionBtn.addEventListener('click', () => {
        const val = customQuestionInput.value.trim();
        if (val) {
          addQuestionToCurrentSelection(val);
          customQuestionInput.value = '';
        }
      });

      customQuestionInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          addCustomQuestionBtn.click();
        }
      });
    }

    // Handle Appointment Save
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const doctorName = document.getElementById('doctorName').value.trim();
        const clinicName = document.getElementById('clinicName').value.trim();
        const specialty = document.getElementById('doctorSpecialty').value;
        const dateTime = document.getElementById('appointmentDateTime').value;
        const purpose = document.getElementById('visitPurpose').value.trim();

        if (!doctorName || !dateTime || !purpose) return;

        const checklistItems = [
          { label: 'Government Photo ID & Insurance Card', checked: document.getElementById('chkId').checked },
          { label: 'Current Medications & Supplement Bottles', checked: document.getElementById('chkMeds').checked },
          { label: 'Previous Lab Reports or Diagnostic Scans', checked: document.getElementById('chkRecords').checked },
          { label: 'Printed MediAssist Question & Symptom Sheet', checked: document.getElementById('chkQuestions').checked }
        ];

        const newAppointment = {
          id: 'appt_' + Date.now(),
          doctor: doctorName,
          clinic: clinicName || 'Local Medical Clinic',
          specialty: specialty,
          dateTime: dateTime,
          purpose: purpose,
          questions: [...appState.selectedQuestionsForCurrentForm],
          checklist: checklistItems,
          createdAt: new Date().toLocaleDateString()
        };

        appState.appointments.push(newAppointment);
        appState.selectedQuestionsForCurrentForm = [];
        saveState();
        renderSelectedQuestionsList();
        renderAppointmentsList();

        form.reset();
        showToast('Appointment plan created & saved!');
      });
    }

    renderSelectedQuestionsList();
    renderAppointmentsList();
  }

  function addQuestionToCurrentSelection(questionText) {
    if (!appState.selectedQuestionsForCurrentForm.includes(questionText)) {
      appState.selectedQuestionsForCurrentForm.push(questionText);
      renderSelectedQuestionsList();
      showToast('Question attached to visit');
    } else {
      showToast('Question already added', 'ℹ️');
    }
  }

  function removeQuestionFromSelection(idx) {
    appState.selectedQuestionsForCurrentForm.splice(idx, 1);
    renderSelectedQuestionsList();
  }

  function renderSelectedQuestionsList() {
    const list = document.getElementById('selectedQuestionsList');
    const badge = document.getElementById('questionCountBadge');
    if (!list) return;

    badge.textContent = appState.selectedQuestionsForCurrentForm.length;

    if (appState.selectedQuestionsForCurrentForm.length === 0) {
      list.innerHTML = `<span style="font-size: 0.8rem; color: var(--slate-400);">No questions added yet. Pick from above or type your own.</span>`;
      return;
    }

    list.innerHTML = '';
    appState.selectedQuestionsForCurrentForm.forEach((q, idx) => {
      const row = document.createElement('div');
      row.style.cssText = 'display: flex; justify-content: space-between; align-items: center; background: #fff; padding: 0.4rem 0.65rem; border: 1px solid var(--slate-200); border-radius: var(--radius-sm); font-size: 0.825rem;';
      row.innerHTML = `
        <span style="color: var(--slate-800);">${idx + 1}. ${escapeHtml(q)}</span>
        <button type="button" style="background: none; border: none; color: var(--rose-600); cursor: pointer; padding: 0 0.25rem; font-weight: 700;">&times;</button>
      `;
      row.querySelector('button').addEventListener('click', () => {
        removeQuestionFromSelection(idx);
      });
      list.appendChild(row);
    });
  }

  function renderAppointmentsList() {
    const container = document.getElementById('appointmentsCardContainer');
    const counterBadge = document.getElementById('appointmentCounterBadge');
    if (!container) return;

    counterBadge.textContent = `${appState.appointments.length} Planned`;

    if (appState.appointments.length === 0) {
      container.innerHTML = `
        <div class="empty-state-notice" style="padding: 1.5rem 1rem;">
          <div class="empty-state-icon" style="font-size: 2rem;">🗓️</div>
          <p><strong>No visits planned yet.</strong></p>
          <p style="font-size: 0.8rem;">Schedule an appointment on the left to prepare questions and checklists.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = '';
    appState.appointments.forEach(appt => {
      const dateObj = new Date(appt.dateTime);
      const formattedDate = isNaN(dateObj) ? appt.dateTime : dateObj.toLocaleString([], {
        weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
      });

      const card = document.createElement('div');
      card.className = 'appointment-card';
      card.innerHTML = `
        <div class="appointment-top">
          <div>
            <h4 class="doctor-name-title">${escapeHtml(appt.doctor)}</h4>
            <span class="badge badge-teal" style="margin-top: 0.2rem;">${escapeHtml(appt.specialty)}</span>
          </div>
          <button type="button" class="delete-item-btn" title="Cancel plan" data-id="${appt.id}">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
          </button>
        </div>

        <div class="appointment-detail-row">
          <div class="appointment-detail-item">
            <span>🏥</span> <span>${escapeHtml(appt.clinic)}</span>
          </div>
          <div class="appointment-detail-item">
            <span>📅</span> <span>${formattedDate}</span>
          </div>
        </div>

        <div style="font-size: 0.85rem; color: var(--slate-700);">
          <strong>Goal:</strong> ${escapeHtml(appt.purpose)}
        </div>

        ${appt.questions && appt.questions.length > 0 ? `
          <div class="prep-questions-preview">
            <h5>Prepared Questions (${appt.questions.length}):</h5>
            <ul>
              ${appt.questions.map(q => `<li>${escapeHtml(q)}</li>`).join('')}
            </ul>
          </div>
        ` : ''}
      `;

      card.querySelector('.delete-item-btn').addEventListener('click', () => {
        deleteAppointment(appt.id);
      });

      container.appendChild(card);
    });
  }

  function deleteAppointment(id) {
    appState.appointments = appState.appointments.filter(a => a.id !== id);
    saveState();
    renderAppointmentsList();
    showToast('Appointment plan removed');
  }

  // =========================================================================
  // 6. MEDICINE INFORMATION & TRACKER LOGIC
  // =========================================================================
  let currentMedCategoryFilter = 'all';

  function initMedicineGuide() {
    const grid = document.getElementById('medicineGridContainer');
    const searchInput = document.getElementById('medicineSearchInput');
    const filterBtns = document.querySelectorAll('#medCategoryFilters .filter-btn');
    const toggleAddMedBtn = document.getElementById('toggleAddMedFormBtn');
    const addMedWrap = document.getElementById('addMedFormWrap');
    const cancelAddMedBtn = document.getElementById('cancelAddMedBtn');
    const personalMedForm = document.getElementById('personalMedForm');

    // Category filters
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentMedCategoryFilter = btn.getAttribute('data-category');
        renderMedicineCards();
      });
    });

    // Search input
    if (searchInput) {
      searchInput.addEventListener('input', () => {
        renderMedicineCards();
      });
    }

    // Toggle Add Personal Med Subform
    if (toggleAddMedBtn && addMedWrap) {
      toggleAddMedBtn.addEventListener('click', () => {
        const isHidden = addMedWrap.style.display === 'none';
        addMedWrap.style.display = isHidden ? 'block' : 'none';
      });
    }

    if (cancelAddMedBtn && addMedWrap) {
      cancelAddMedBtn.addEventListener('click', () => {
        addMedWrap.style.display = 'none';
      });
    }

    // Save Personal Medication
    if (personalMedForm) {
      personalMedForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('trackMedName').value.trim();
        const dose = document.getElementById('trackMedDose').value.trim();
        const time = document.getElementById('trackMedTime').value.trim();
        const instructions = document.getElementById('trackMedInstructions').value.trim();

        if (!name || !dose) return;

        const newMed = {
          id: 'med_' + Date.now(),
          name: name,
          dose: dose,
          time: time,
          instructions: instructions,
          takenToday: false
        };

        appState.myMeds.push(newMed);
        saveState();
        renderMyMedsList();

        personalMedForm.reset();
        addMedWrap.style.display = 'none';
        showToast('Medication added to your daily schedule!');
      });
    }

    renderMedicineCards();
    renderMyMedsList();
  }

  function renderMedicineCards() {
    const grid = document.getElementById('medicineGridContainer');
    const searchInput = document.getElementById('medicineSearchInput');
    if (!grid || typeof MEDICINE_DATABASE === 'undefined') return;

    const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';

    const filtered = MEDICINE_DATABASE.filter(med => {
      const matchCat = (currentMedCategoryFilter === 'all') || (med.category === currentMedCategoryFilter);
      const matchSearch = (!searchTerm) ||
        med.name.toLowerCase().includes(searchTerm) ||
        med.generic.toLowerCase().includes(searchTerm) ||
        med.overview.toLowerCase().includes(searchTerm);
      return matchCat && matchSearch;
    });

    if (filtered.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 3rem 1rem; color: var(--slate-500);">
          <div style="font-size: 2rem; margin-bottom: 0.5rem;">🔍</div>
          <p>No medicines matched your search or category filter.</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = '';
    filtered.forEach(med => {
      const card = document.createElement('div');
      card.className = 'med-card';
      card.innerHTML = `
        <div>
          <div class="med-card-top">
            <div>
              <h4 class="med-name">${escapeHtml(med.name)}</h4>
              <div class="med-generic">Generic: ${escapeHtml(med.generic)}</div>
            </div>
            <span class="med-category-badge">${escapeHtml(med.badge)}</span>
          </div>

          <p class="med-overview">${escapeHtml(med.overview)}</p>

          <div class="med-safety-box">
            <strong>Key Safety Reminder:</strong>
            <div style="margin-top: 0.25rem;">${escapeHtml(med.safetyPoints[0])}</div>
          </div>

          <div class="med-expandable-details" id="details_${med.id}">
            <div style="margin-bottom: 0.65rem;">
              <strong>How It Works in Body:</strong>
              <p style="margin-top: 0.15rem;">${escapeHtml(med.howItWorks)}</p>
            </div>
            <div style="margin-bottom: 0.65rem;">
              <strong>Food & Alcohol Interactions:</strong>
              <p style="margin-top: 0.15rem;">${escapeHtml(med.foodInteractions)}</p>
            </div>
            <div style="margin-bottom: 0.65rem;">
              <strong>Storage Guidelines:</strong>
              <p style="margin-top: 0.15rem;">${escapeHtml(med.storageAdvice)}</p>
            </div>
            <div>
              <strong>Questions for Your Pharmacist:</strong>
              <ul style="padding-left: 1.15rem; margin-top: 0.25rem;">
                ${med.questionsForPharmacist.map(q => `<li>${escapeHtml(q)}</li>`).join('')}
              </ul>
            </div>
          </div>
        </div>

        <button type="button" class="expand-details-btn" data-target="details_${med.id}">
          <span>View Full Safety Monograph & Pharmacist Qs</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
        </button>
      `;

      const expandBtn = card.querySelector('.expand-details-btn');
      const detailsBlock = card.querySelector(`#details_${med.id}`);

      expandBtn.addEventListener('click', () => {
        const isOpen = detailsBlock.classList.contains('open');
        if (isOpen) {
          detailsBlock.classList.remove('open');
          expandBtn.querySelector('span').textContent = 'View Full Safety Monograph & Pharmacist Qs';
          expandBtn.querySelector('svg').style.transform = 'rotate(0deg)';
        } else {
          detailsBlock.classList.add('open');
          expandBtn.querySelector('span').textContent = 'Hide Detailed Monograph';
          expandBtn.querySelector('svg').style.transform = 'rotate(180deg)';
        }
      });

      grid.appendChild(card);
    });
  }

  function renderMyMedsList() {
    const container = document.getElementById('myMedsContainer');
    if (!container) return;

    if (appState.myMeds.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 2rem 1rem; color: var(--slate-400);">
          <p>No medications currently tracked. Click "Add Medication to Tracker" above to keep a daily log.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = '';
    appState.myMeds.forEach(med => {
      const item = document.createElement('div');
      item.className = 'my-med-item';
      item.innerHTML = `
        <div class="my-med-top">
          <strong style="color: var(--slate-900);">${escapeHtml(med.name)}</strong>
          <button type="button" class="delete-item-btn" title="Delete med">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
          </button>
        </div>
        <div style="font-size: 0.8rem; color: var(--slate-600);">
          <span>💊 ${escapeHtml(med.dose)}</span> &bull; <span>⏰ ${escapeHtml(med.time)}</span>
        </div>
        ${med.instructions ? `<div style="font-size: 0.775rem; color: var(--slate-500); font-style: italic;">Note: ${escapeHtml(med.instructions)}</div>` : ''}
        <div style="margin-top: 0.4rem; padding-top: 0.4rem; border-top: 1px dashed var(--slate-200);">
          <label class="dose-checkbox-label">
            <input type="checkbox" class="med-dose-checkbox" ${med.takenToday ? 'checked' : ''}>
            <span style="${med.takenToday ? 'color: var(--emerald-600); font-weight: 700;' : ''}">${med.takenToday ? '✓ Taken Today' : 'Mark as Taken Today'}</span>
          </label>
        </div>
      `;

      item.querySelector('.delete-item-btn').addEventListener('click', () => {
        appState.myMeds = appState.myMeds.filter(m => m.id !== med.id);
        saveState();
        renderMyMedsList();
        showToast('Medication removed from tracker');
      });

      item.querySelector('.med-dose-checkbox').addEventListener('change', (e) => {
        med.takenToday = e.target.checked;
        saveState();
        renderMyMedsList();
        showToast(med.takenToday ? `Marked ${med.name} as taken today!` : `Reset ${med.name} status`);
      });

      container.appendChild(item);
    });
  }

  // =========================================================================
  // 7. COMPREHENSIVE HEALTH SUMMARY (DOCTOR VISIT PREP SHEET)
  // =========================================================================
  function initHealthSummary() {
    const printBtn = document.getElementById('printSummaryBtn');
    const copyBtn = document.getElementById('copyAllSummaryBtn');
    const clearBtn = document.getElementById('clearAllDataBtn');
    const patientInput = document.getElementById('patientDisplayName');

    if (patientInput) {
      patientInput.value = appState.patientName || '';
      patientInput.addEventListener('input', (e) => {
        appState.patientName = e.target.value.trim();
        saveState();
      });
    }

    if (printBtn) {
      printBtn.addEventListener('click', () => {
        window.print();
      });
    }

    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        copyCompleteSummaryToClipboard();
      });
    }

    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        const confirmed = window.confirm(
          "Are you sure you want to clear all your stored symptoms, appointments, and medication logs from this browser? This action cannot be undone."
        );
        if (confirmed) {
          localStorage.removeItem(STORAGE_KEY);
          appState = {
            patientName: '',
            symptoms: [],
            appointments: [],
            selectedQuestionsForCurrentForm: [],
            myMeds: [],
            chatHistory: []
          };
          if (patientInput) patientInput.value = '';
          renderSymptomsList();
          renderAppointmentsList();
          renderMyMedsList();
          renderHealthSummary();
          showToast('All browser-stored data has been wiped');
        }
      });
    }

    renderHealthSummary();
  }

  function renderHealthSummary() {
    const reportDate = document.getElementById('summaryReportDate');
    const sympBox = document.getElementById('summarySymptomsContent');
    const apptBox = document.getElementById('summaryAppointmentContent');
    const qBox = document.getElementById('summaryQuestionsContent');
    const medsBox = document.getElementById('summaryMedsContent');

    if (reportDate) {
      reportDate.textContent = new Date().toLocaleDateString(undefined, {
        year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
      });
    }

    const patientSubtitle = document.getElementById('reportPatientSubtitle');
    if (patientSubtitle) {
      if (appState.patientName) {
        patientSubtitle.innerHTML = `Patient: <strong>${escapeHtml(appState.patientName)}</strong> &bull; Pre-visit dossier compiled for clinical discussion`;
      } else {
        patientSubtitle.textContent = 'Comprehensive pre-visit dossier compiled for clinical discussion';
      }
    }

    // 1. Symptoms Section
    if (sympBox) {
      if (appState.symptoms.length === 0) {
        sympBox.innerHTML = `<p class="report-empty-note">No symptoms currently recorded. Add symptoms in the Symptom Organizer section above.</p>`;
      } else {
        sympBox.innerHTML = `
          <ul class="report-list">
            ${appState.symptoms.map(s => `
              <li>
                <strong>${escapeHtml(s.name)}</strong> (Location: ${escapeHtml(s.location)})<br>
                Onset/Duration: ${escapeHtml(s.duration)} | Reported Severity: <strong>${s.severity}/10</strong>
                ${s.triggers ? `<br><em>Context: ${escapeHtml(s.triggers)}</em>` : ''}
              </li>
            `).join('')}
          </ul>
        `;
      }
    }

    // 2. Upcoming Appointment Section
    if (apptBox) {
      if (appState.appointments.length === 0) {
        apptBox.innerHTML = `<p class="report-empty-note">No appointment scheduled. Plan your visit in the Appointment Planner section above.</p>`;
      } else {
        const nextAppt = appState.appointments[0];
        const dateStr = new Date(nextAppt.dateTime).toLocaleString([], {
          weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
        apptBox.innerHTML = `
          <div style="font-size: 0.885rem; line-height: 1.6; color: var(--slate-800);">
            <div><strong>Doctor:</strong> ${escapeHtml(nextAppt.doctor)} (${escapeHtml(nextAppt.specialty)})</div>
            <div><strong>Location:</strong> ${escapeHtml(nextAppt.clinic)}</div>
            <div><strong>Scheduled:</strong> ${dateStr}</div>
            <div><strong>Primary Reason:</strong> ${escapeHtml(nextAppt.purpose)}</div>
          </div>
        `;
      }
    }

    // 3. Prepared Questions Section
    if (qBox) {
      // Gather questions from active appointments or forms
      const allQuestions = [];
      appState.appointments.forEach(a => {
        if (a.questions) allQuestions.push(...a.questions);
      });

      if (allQuestions.length === 0) {
        qBox.innerHTML = `<p class="report-empty-note">No specific questions selected yet. Add questions in the Appointment Planner above.</p>`;
      } else {
        const uniqueQs = Array.from(new Set(allQuestions));
        qBox.innerHTML = `
          <ul class="report-list">
            ${uniqueQs.map(q => `<li>${escapeHtml(q)}</li>`).join('')}
          </ul>
        `;
      }
    }

    // 4. Medications Section
    if (medsBox) {
      if (appState.myMeds.length === 0) {
        medsBox.innerHTML = `<p class="report-empty-note">No medications tracked. Add to your tracker in the Medicine Guide section above.</p>`;
      } else {
        medsBox.innerHTML = `
          <ul class="report-list">
            ${appState.myMeds.map(m => `
              <li>
                <strong>${escapeHtml(m.name)}</strong>: ${escapeHtml(m.dose)} (${escapeHtml(m.time)})
                ${m.instructions ? ` - <em>${escapeHtml(m.instructions)}</em>` : ''}
              </li>
            `).join('')}
          </ul>
        `;
      }
    }
  }

  function copyCompleteSummaryToClipboard() {
    const patient = appState.patientName ? `Patient: ${appState.patientName}\n` : '';
    const date = `Date: ${new Date().toLocaleDateString()}\n`;
    let text = `=======================================================\nMEDIASSIST AI — PATIENT CLINICAL PREPARATION DOSSIER\n${patient}${date}=======================================================\n\n`;

    text += "1. ACTIVE SYMPTOMS & CHIEF COMPLAINTS:\n";
    if (appState.symptoms.length === 0) {
      text += "   (No active symptoms recorded)\n";
    } else {
      appState.symptoms.forEach((s, idx) => {
        text += `   ${idx + 1}. ${s.name} (${s.location})\n      Duration: ${s.duration} | Severity: ${s.severity}/10\n`;
        if (s.triggers) text += `      Context/Notes: ${s.triggers}\n`;
      });
    }
    text += "\n";

    text += "2. APPOINTMENT DETAILS:\n";
    if (appState.appointments.length === 0) {
      text += "   (No upcoming appointment scheduled)\n";
    } else {
      const a = appState.appointments[0];
      text += `   Doctor: ${a.doctor} (${a.specialty})\n   Clinic: ${a.clinic}\n   Date/Time: ${a.dateTime}\n   Reason: ${a.purpose}\n`;
    }
    text += "\n";

    text += "3. QUESTIONS PREPARED FOR DOCTOR:\n";
    const allQs = [];
    appState.appointments.forEach(a => { if (a.questions) allQs.push(...a.questions); });
    if (allQs.length === 0) {
      text += "   (No questions selected)\n";
    } else {
      Array.from(new Set(allQs)).forEach((q, idx) => {
        text += `   ${idx + 1}. ${q}\n`;
      });
    }
    text += "\n";

    text += "4. ACTIVE MEDICATIONS:\n";
    if (appState.myMeds.length === 0) {
      text += "   (No active medications tracked)\n";
    } else {
      appState.myMeds.forEach((m, idx) => {
        text += `   ${idx + 1}. ${m.name} - ${m.dose} (${m.time})\n`;
      });
    }
    text += "\n=======================================================\nNOTE: Prepared by patient for clinical dialogue. Does not replace physician diagnosis.\n";

    copyTextSafely(text, 'Comprehensive report copied to clipboard!');
  }

  // =========================================================================
  // 8. MODALS & NAVIGATION LOGIC
  // =========================================================================
  function initModalsAndNav() {
    // Prototype Transparency Modal
    const protoModal = document.getElementById('prototypeModal');
    const openProtoBtn = document.getElementById('explainPrototypeBtn');
    const openProtoLink = document.getElementById('learnAiArchitectureLink');
    const closeProtoBtn = document.getElementById('closePrototypeModalBtn');
    const ackProtoBtn = document.getElementById('ackPrototypeModalBtn');
    const footerProtoLink = document.getElementById('footerProtoLink');

    function openPrototypeModal() {
      if (protoModal) protoModal.classList.add('open');
    }
    function closePrototypeModal() {
      if (protoModal) protoModal.classList.remove('open');
    }

    if (openProtoBtn) openProtoBtn.addEventListener('click', openPrototypeModal);
    if (openProtoLink) openProtoLink.addEventListener('click', openPrototypeModal);
    if (footerProtoLink) footerProtoLink.addEventListener('click', openPrototypeModal);
    if (closeProtoBtn) closeProtoBtn.addEventListener('click', closePrototypeModal);
    if (ackProtoBtn) ackProtoBtn.addEventListener('click', closePrototypeModal);

    // Emergency Red Flags Modal
    const emergencyModal = document.getElementById('emergencyModal');
    const openEmergBtn = document.getElementById('openEmergencyModalBtn');
    const closeEmergBtn = document.getElementById('closeEmergencyModalBtn');
    const ackEmergBtn = document.getElementById('ackEmergencyModalBtn');
    const footerRedFlagsLink = document.getElementById('footerRedFlagsLink');
    const redFlagsContainer = document.getElementById('emergencyRedFlagsList');

    // Populate emergency list from EMERGENCY_RED_FLAGS in data.js
    if (redFlagsContainer && typeof EMERGENCY_RED_FLAGS !== 'undefined') {
      redFlagsContainer.innerHTML = EMERGENCY_RED_FLAGS.map(rf => `
        <div style="background: var(--rose-50); border-left: 3px solid var(--rose-500); padding: 0.65rem 0.85rem; border-radius: 4px;">
          <strong style="color: var(--rose-700); font-size: 0.885rem;">${escapeHtml(rf.title)}</strong>
          <p style="font-size: 0.8rem; color: #881337; margin-top: 0.2rem;">${escapeHtml(rf.description)}</p>
        </div>
      `).join('');
    }

    function openEmergencyModal() {
      if (emergencyModal) emergencyModal.classList.add('open');
    }
    function closeEmergencyModal() {
      if (emergencyModal) emergencyModal.classList.remove('open');
    }

    if (openEmergBtn) openEmergBtn.addEventListener('click', openEmergencyModal);
    if (footerRedFlagsLink) footerRedFlagsLink.addEventListener('click', openEmergencyModal);
    if (closeEmergBtn) closeEmergBtn.addEventListener('click', closeEmergencyModal);
    if (ackEmergBtn) ackEmergBtn.addEventListener('click', closeEmergencyModal);

    // Privacy Guarantee Footer Link
    const footerPrivacyLink = document.getElementById('footerPrivacyLink');
    if (footerPrivacyLink) {
      footerPrivacyLink.addEventListener('click', () => {
        alert(
          "MediAssist AI Privacy & Data Notice:\n\n" +
          "1. Local Patient Planner: All recorded symptoms, doctor appointments, and medication logs remain stored in your browser's localStorage.\n" +
          "2. AI Chat Queries: General health education questions entered in the chat are securely transmitted to the server-side NVIDIA AI provider to generate answers. The server does not store or log your health queries.\n" +
          "3. Instant Deletion: You can permanently wipe all local records at any time using the 'Clear Stored Data' button."
        );
      });
    }

    // Close modals on backdrop click
    [protoModal, emergencyModal].forEach(modal => {
      if (modal) {
        modal.addEventListener('click', (e) => {
          if (e.target === modal) modal.classList.remove('open');
        });
      }
    });

    // Mobile Hamburger Menu
    const mobileToggle = document.getElementById('mobileMenuToggle');
    const navMenu = document.getElementById('navMenu');
    if (mobileToggle && navMenu) {
      mobileToggle.addEventListener('click', () => {
        navMenu.classList.toggle('open');
      });

      // Close menu when link is clicked
      navMenu.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
          navMenu.classList.remove('open');
        });
      });
    }

    // Active nav highlighting on scroll
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');

    window.addEventListener('scroll', () => {
      let current = '';
      const scrollPos = window.scrollY + 120;

      sections.forEach(sec => {
        if (scrollPos >= sec.offsetTop && scrollPos < sec.offsetTop + sec.offsetHeight) {
          current = sec.getAttribute('id');
        }
      });

      navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${current}`) {
          link.classList.add('active');
        }
      });
    });
  }

  // =========================================================================
  // 9. UTILITY FUNCTIONS
  // =========================================================================
  function escapeHtml(string) {
    if (typeof string !== 'string') return '';
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return string.replace(/[&<>"']/g, (m) => map[m]);
  }

  // Safe markdown to HTML formatter for AI educational responses
  function formatMarkdownToHtml(text) {
    if (!text || typeof text !== 'string') return '';

    // First escape HTML entities to prevent XSS
    let escaped = escapeHtml(text);

    // Format headers
    escaped = escaped.replace(/^### (.*$)/gim, '<h4 style="color:var(--teal-800); margin:0.6rem 0 0.35rem 0; font-size:0.95rem; font-weight:700;">$1</h4>');
    escaped = escaped.replace(/^## (.*$)/gim, '<h3 style="color:var(--teal-900); margin:0.75rem 0 0.4rem 0; font-size:1.05rem; font-weight:700;">$1</h3>');
    escaped = escaped.replace(/^# (.*$)/gim, '<h2 style="color:var(--teal-900); margin:0.85rem 0 0.45rem 0; font-size:1.15rem; font-weight:700;">$1</h2>');

    // Bold (**text**)
    escaped = escaped.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // Inline code (`text`)
    escaped = escaped.replace(/`([^`]+)`/g, '<code style="background:var(--slate-100); padding:2px 5px; border-radius:4px; font-size:0.825rem;">$1</code>');

    // Lists & paragraphs
    const lines = escaped.split('\n');
    let inList = false;
    const formatted = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        if (!inList) {
          inList = true;
          formatted.push('<ul style="padding-left: 1.25rem; margin: 0.35rem 0 0.6rem 0;">');
        }
        formatted.push(`<li style="margin-bottom: 0.25rem;">${trimmed.substring(2)}</li>`);
      } else {
        if (inList) {
          inList = false;
          formatted.push('</ul>');
        }
        if (trimmed.length > 0) {
          // If already wrapped in a heading tag, don't wrap in <p>
          if (trimmed.startsWith('<h2') || trimmed.startsWith('<h3') || trimmed.startsWith('<h4')) {
            formatted.push(trimmed);
          } else {
            formatted.push(`<p style="margin-bottom: 0.45rem;">${trimmed}</p>`);
          }
        }
      }
    }

    if (inList) {
      formatted.push('</ul>');
    }

    return formatted.join('');
  }


  // =========================================================================
  // 10. INITIALIZATION ENTRY POINT
  // =========================================================================
  document.addEventListener('DOMContentLoaded', () => {
    loadState();
    initAiAssistant();
    initSymptomOrganizer();
    initAppointmentPlanner();
    initMedicineGuide();
    initHealthSummary();
    initModalsAndNav();
    console.log('MediAssist AI Initialized successfully. All features active.');
  });

})();
