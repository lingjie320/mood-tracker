(function () {
  'use strict';

  // ── Storage helpers ──────────────────────────────────────────────────
  const STORAGE_KEY = 'mood_tracker_records';

  function loadRecords() {
    try {
      const raw = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
      // Migrate old format (string) → new format ({mood, note, timestamp})
      const out = {};
      for (const [date, val] of Object.entries(raw)) {
        if (typeof val === 'string') {
          out[date] = { mood: val, note: '', timestamp: 0 };
        } else if (val && typeof val === 'object' && val.mood) {
          out[date] = {
            mood: val.mood,
            note: val.note || '',
            timestamp: val.timestamp || 0,
          };
        }
      }
      return out;
    } catch {
      return {};
    }
  }

  function saveRecords(records) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  }

  function fmtDate(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // ── DOM refs ─────────────────────────────────────────────────────────
  const recordDateInput = document.getElementById('record-date');
  const moodBtns = document.querySelectorAll('.mood-btn');
  const noteField = document.getElementById('note-field');
  const noteLabel = document.getElementById('note-label');
  const noteInput = document.getElementById('record-note');
  const noteCount = document.getElementById('note-count');
  const saveBtn = document.getElementById('save-btn');
  const feedback = document.getElementById('record-feedback');

  const prevMonthBtn = document.getElementById('prev-month');
  const nextMonthBtn = document.getElementById('next-month');
  const calendarTitle = document.getElementById('calendar-title');
  const calendarDays = document.getElementById('calendar-days');

  const startDateInput = document.getElementById('start-date');
  const endDateInput = document.getElementById('end-date');
  const queryBtn = document.getElementById('query-btn');
  const statsResult = document.getElementById('stats-result');

  const showHistoryBtn = document.getElementById('show-history-btn');
  const dayModal = document.getElementById('day-modal');
  const dayModalTitle = document.getElementById('day-modal-title');
  const dayModalBody = document.getElementById('day-modal-body');
  const historyModal = document.getElementById('history-modal');
  const historyList = document.getElementById('history-list');
  const filterBtns = historyModal.querySelectorAll('.filter-btn');

  // ── State ────────────────────────────────────────────────────────────
  let records = loadRecords();
  let viewYear, viewMonth;
  let selectedMood = null;
  let historyFilter = 'all';

  const today = new Date();
  viewYear = today.getFullYear();
  viewMonth = today.getMonth();

  recordDateInput.value = fmtDate(today);

  const firstOfMonth = new Date(viewYear, viewMonth, 1);
  startDateInput.value = fmtDate(firstOfMonth);
  endDateInput.value = fmtDate(today);

  // ── Mood labels ──────────────────────────────────────────────────────
  const CN_MONTHS = ['一月', '二月', '三月', '四月', '五月', '六月',
                     '七月', '八月', '九月', '十月', '十一月', '十二月'];

  const moodInfo = {
    happy:  { label: '开心', emoji: '😊', placeholder: '今天是什么让你开心？' },
    normal: { label: '平常', emoji: '😐', placeholder: '今天有什么想记录的吗？（可留空）' },
    sad:    { label: '伤心', emoji: '😢', placeholder: '今天发生了什么事让你难过？' },
  };

  // ── Record mood ──────────────────────────────────────────────────────
  function updateSelectedBtn() {
    const dateStr = recordDateInput.value;
    const rec = records[dateStr];
    const currentMood = rec ? rec.mood : null;
    moodBtns.forEach(btn => {
      btn.classList.toggle('selected', btn.dataset.mood === currentMood);
    });


  }

  function showNoteField(mood, noteText) {
    noteField.hidden = false;
    noteLabel.textContent = `${moodInfo[mood].emoji} ${moodInfo[mood].label} — 写一句话：`;
    noteInput.placeholder = moodInfo[mood].placeholder;
    noteInput.value = noteText || '';
    noteCount.textContent = noteInput.value.length;
    saveBtn.disabled = false;
  }

  function hideNoteField() {
    noteField.hidden = true;
    noteInput.value = '';
    noteCount.textContent = '0';
    selectedMood = null;
    saveBtn.disabled = true;
  }

  recordDateInput.addEventListener('change', () => {
    selectedMood = null;
    hideNoteField();
    updateSelectedBtn();
    clearFeedback();
  });

  moodBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const dateStr = recordDateInput.value;
      if (!dateStr) {
        showFeedback('请先选择日期', true);
        return;
      }
      const mood = btn.dataset.mood;
      const existing = records[dateStr];
      // Selecting the same mood: keep existing note, just refresh field
      // Selecting a different mood: stage it (not saved until "保存记录")
      if (existing && existing.mood === mood && !selectedMood) {
        selectedMood = mood;
        showNoteField(mood, existing.note);
        return;
      }
      selectedMood = mood;
      const prefill = (existing && existing.mood === mood) ? existing.note : '';
      showNoteField(mood, prefill);
    });
  });

  noteInput.addEventListener('input', () => {
    noteCount.textContent = noteInput.value.length;
  });

  saveBtn.addEventListener('click', () => {
    const dateStr = recordDateInput.value;
    if (!dateStr || !selectedMood) return;
    const note = noteInput.value.trim();
    records[dateStr] = {
      mood: selectedMood,
      note,
      timestamp: Date.now(),
    };
    saveRecords(records);
    showFeedback(`${dateStr} 已保存：${moodInfo[selectedMood].emoji} ${moodInfo[selectedMood].label}`);
    selectedMood = null;
    // Clear the input + reset UI to "no mood staged" state
    noteInput.value = '';
    noteCount.textContent = '0';
    hideNoteField();
    updateSelectedBtn();
    renderCalendar();
    renderStats();
  });

  let feedbackTimer;
  function showFeedback(msg, isError = false) {
    clearTimeout(feedbackTimer);
    feedback.textContent = msg;
    feedback.classList.toggle('error', isError);
    feedback.style.opacity = '1';
    feedbackTimer = setTimeout(() => { feedback.style.opacity = '0'; }, 3000);
  }
  function clearFeedback() {
    clearTimeout(feedbackTimer);
    feedback.textContent = '';
    feedback.style.opacity = '1';
  }

  // ── Calendar ─────────────────────────────────────────────────────────
  function renderCalendar() {
    calendarTitle.textContent = `${viewYear}年${CN_MONTHS[viewMonth]}`;
    calendarDays.innerHTML = '';

    const firstDay = new Date(viewYear, viewMonth, 1);
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const startWeekday = firstDay.getDay();

    const todayStr = fmtDate(new Date());

    for (let i = 0; i < startWeekday; i++) {
      const blank = document.createElement('div');
      blank.className = 'calendar-day empty';
      calendarDays.appendChild(blank);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const rec = records[dateStr];
      const el = document.createElement('div');
      let cls = 'calendar-day';
      if (rec) cls += ` ${rec.mood} has-record`;
      if (dateStr === todayStr) cls += ' today';
      el.className = cls;

      const tip = rec
        ? `${dateStr}：${moodInfo[rec.mood].label}${rec.note ? ' — ' + rec.note : ''}`
        : dateStr;
      el.title = tip;

      const numSpan = document.createElement('span');
      numSpan.textContent = day;
      el.appendChild(numSpan);

      if (rec) {
        const emojiSpan = document.createElement('span');
        emojiSpan.className = 'day-emoji';
        emojiSpan.textContent = moodInfo[rec.mood].emoji;
        el.appendChild(emojiSpan);

        if (rec.note) {
          const noteMark = document.createElement('span');
          noteMark.className = 'note-marker';
          noteMark.textContent = '📝';
          el.appendChild(noteMark);
        }

        el.addEventListener('click', () => openDayModal(dateStr, rec));
      }

      calendarDays.appendChild(el);
    }
  }

  prevMonthBtn.addEventListener('click', () => {
    viewMonth--;
    if (viewMonth < 0) { viewMonth = 11; viewYear--; }
    renderCalendar();
  });

  nextMonthBtn.addEventListener('click', () => {
    viewMonth++;
    if (viewMonth > 11) { viewMonth = 0; viewYear++; }
    renderCalendar();
  });

  // ── Statistics ───────────────────────────────────────────────────────
  function computeStats(startDateStr, endDateStr) {
    const counts = { happy: 0, normal: 0, sad: 0 };
    let totalRecorded = 0;
    const start = new Date(startDateStr + 'T00:00:00');
    const end = new Date(endDateStr + 'T00:00:00');
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const key = fmtDate(d);
      if (records[key]) {
        counts[records[key].mood]++;
        totalRecorded++;
      }
    }
    return { counts, totalRecorded };
  }

  function renderStats() {
    const startDateStr = startDateInput.value;
    const endDateStr = endDateInput.value;

    if (!startDateStr || !endDateStr) {
      statsResult.innerHTML = '<div class="stats-empty">请选择开始和结束日期</div>';
      return;
    }
    if (startDateStr > endDateStr) {
      statsResult.innerHTML = '<div class="stats-empty">开始日期不能晚于结束日期</div>';
      return;
    }

    const { counts, totalRecorded } = computeStats(startDateStr, endDateStr);

    if (totalRecorded === 0) {
      statsResult.innerHTML = '<div class="stats-empty">该时间段内没有记录</div>';
      return;
    }

    const total = counts.happy + counts.normal + counts.sad;
    const pct = (n) => total ? Math.round((n / total) * 100) : 0;

    statsResult.innerHTML = `
      <div class="stats-bar">
        <div class="bar-happy" style="width:${pct(counts.happy)}%"></div>
        <div class="bar-normal" style="width:${pct(counts.normal)}%"></div>
        <div class="bar-sad" style="width:${pct(counts.sad)}%"></div>
      </div>
      <div class="stats-grid">
        <div class="stat-card happy">
          <div class="stat-emoji">😊</div>
          <div class="stat-count">${counts.happy}</div>
          <div class="stat-label">开心 · ${pct(counts.happy)}%</div>
        </div>
        <div class="stat-card normal">
          <div class="stat-emoji">😐</div>
          <div class="stat-count">${counts.normal}</div>
          <div class="stat-label">平常 · ${pct(counts.normal)}%</div>
        </div>
        <div class="stat-card sad">
          <div class="stat-emoji">😢</div>
          <div class="stat-count">${counts.sad}</div>
          <div class="stat-label">伤心 · ${pct(counts.sad)}%</div>
        </div>
      </div>
      <div class="stats-summary">
        ${startDateStr} 至 ${endDateStr}，共记录 <strong>${totalRecorded}</strong> 天
      </div>
    `;
  }

  queryBtn.addEventListener('click', renderStats);
  startDateInput.addEventListener('change', renderStats);
  endDateInput.addEventListener('change', renderStats);

  // ── Modals ───────────────────────────────────────────────────────────
  function openModal(modal) {
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
  }
  function closeModal(modal) {
    modal.hidden = true;
    document.body.style.overflow = '';
  }

  document.querySelectorAll('.modal').forEach(modal => {
    modal.querySelectorAll('[data-close]').forEach(el => {
      el.addEventListener('click', () => closeModal(modal));
    });
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      if (!dayModal.hidden) closeModal(dayModal);
      if (!historyModal.hidden) closeModal(historyModal);
    }
  });

  function openDayModal(dateStr, rec) {
    dayModalTitle.textContent = dateStr;
    const info = moodInfo[rec.mood];
    const time = rec.timestamp
      ? new Date(rec.timestamp).toLocaleString('zh-CN', { hour12: false })
      : '';
    dayModalBody.innerHTML = `
      <div class="day-record ${rec.mood}">
        <div class="day-record-emoji">${info.emoji}</div>
        <div class="day-record-text">
          <div class="day-record-label">${info.label}</div>
          ${rec.note
            ? `<div class="day-record-note">${escapeHtml(rec.note)}</div>`
            : '<div class="day-record-empty">（未填写备注）</div>'}
          ${time ? `<div class="day-record-time">${time}</div>` : ''}
          <div class="day-record-actions">
            <button class="mini-btn danger" id="delete-record-btn">删除</button>
          </div>
        </div>
      </div>
    `;
    openModal(dayModal);
    document.getElementById('delete-record-btn').addEventListener('click', () => {
      if (confirm(`确定删除 ${dateStr} 的记录？`)) {
        delete records[dateStr];
        saveRecords(records);
        closeModal(dayModal);
        renderCalendar();
        renderStats();
        showFeedback(`已删除 ${dateStr} 的记录`);
      }
    });
  }

  // ── History list ─────────────────────────────────────────────────────
  function renderHistory() {
    const dates = Object.keys(records).sort((a, b) => b.localeCompare(a));
    const items = dates
      .map(d => ({ date: d, rec: records[d] }))
      .filter(({ rec }) => {
        if (historyFilter === 'all') return true;
        if (historyFilter === 'noted') return rec.note && rec.note.length > 0;
        return rec.mood === historyFilter;
      });

    if (items.length === 0) {
      historyList.innerHTML = '<div class="history-empty">没有匹配的记录</div>';
      return;
    }

    historyList.innerHTML = items.map(({ date, rec }) => {
      const info = moodInfo[rec.mood];
      const noteHtml = rec.note
        ? `<div class="history-item-note">${escapeHtml(rec.note)}</div>`
        : '<div class="history-item-no-note">（无备注）</div>';
      return `
        <div class="history-item ${rec.mood}">
          <div class="history-item-head">
            <span class="history-item-date">${date}</span>
            <span class="history-item-mood">${info.emoji} ${info.label}</span>
          </div>
          ${noteHtml}
        </div>
      `;
    }).join('');
  }

  showHistoryBtn.addEventListener('click', () => {
    renderHistory();
    openModal(historyModal);
  });

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      historyFilter = btn.dataset.filter;
      renderHistory();
    });
  });

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // ── Init ─────────────────────────────────────────────────────────────
  updateSelectedBtn();
  renderCalendar();
  renderStats();
})();
