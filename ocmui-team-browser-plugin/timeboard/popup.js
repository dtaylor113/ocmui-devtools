// popup.js (v4.2) — Dynamic member loading from JSON + off-hours highlighting

let members = []; // Will be loaded from members.json

const $rows = document.getElementById("rows");
const $q = document.getElementById("q");
const $footNote = document.getElementById("footNote");
const $refHour = document.getElementById("refHour");
const $refTz = document.getElementById("refTz");

/* Load members from JSON file or Chrome storage */
async function loadMembers() {
  try {
    // First try to load from Chrome storage (for user modifications)
    const stored = await chrome.storage.local.get(['customMembers']);
    if (stored.customMembers && stored.customMembers.length > 0) {
      members = stored.customMembers;
      console.log(`Loaded ${members.length} team members from storage`);
      return;
    }
    
    // Fallback to JSON file
    const response = await fetch('members.json');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    members = await response.json();
    console.log(`Loaded ${members.length} team members from JSON`);
  } catch (error) {
    console.error('Failed to load members:', error);
    // Fallback to empty array - timeboard will show no members
    members = [];
  }
}

/* Save members to Chrome storage */
async function saveMembers() {
  try {
    await chrome.storage.local.set({ customMembers: members });
    console.log(`Saved ${members.length} team members to storage`);
  } catch (error) {
    console.error('Failed to save members:', error);
  }
}

/* Populate TZ dropdown from unique team time zones */
function uniqueTzs() {
  return [...new Set(members.map(m => m.tz))].sort();
}
// TZ dropdown now populated in initialize() after members are loaded

/* Formatting helpers */
function fmtTime(date, tz) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}
function fmtOffset(date, tz) {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      timeZoneName: "shortOffset",
    }).formatToParts(date);
    const tzName = parts.find(p => p.type === "timeZoneName")?.value;
    if (tzName) return tzName;
  } catch {}
  return "";
}
function ymdInTz(date, tz) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit"
  }).formatToParts(date);
  return {
    y: Number(parts.find(p => p.type === "year").value),
    m: Number(parts.find(p => p.type === "month").value),
    d: Number(parts.find(p => p.type === "day").value),
  };
}
function parseGmt(str) {
  const m = /GMT([+-])(\d{1,2})(?::?(\d{2}))?/.exec(str || "");
  if (!m) return 0;
  const sign = m[1] === "-" ? -1 : 1;
  const h = Number(m[2] || 0);
  const mm = Number(m[3] || 0);
  return sign * (h*60 + mm);
}

/* Build the reference instant */
function referenceDate() {
  const mode = currentMode();
  if (mode !== "ref") return new Date();               // NOW: your system time
  const tz = $refTz.value;
  const hour = Number($refHour.value);
  const now = new Date();
  const { y, m, d } = ymdInTz(now, tz);
  const offParts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz, timeZoneName: "shortOffset"
  }).formatToParts(now);
  const off = parseGmt(offParts.find(p => p.type === "timeZoneName")?.value || "GMT+0");
  const utcMin = hour*60 - off;                         // UTC = local - offset
  const H = Math.floor(utcMin/60);
  const MIN = utcMin%60;
  return new Date(Date.UTC(y, m-1, d, H, MIN, 0, 0));
}

/* Compute minutes since midnight for sorting & off-hours */
function minutesSinceMidnight(date, tz) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: tz, hour: "2-digit", minute: "2-digit", hour12: false,
  }).formatToParts(date);
  const hh = Number(parts.find(p => p.type === "hour").value);
  const mm = Number(parts.find(p => p.type === "minute").value);
  return hh*60 + mm;
}
function isOffHours(mins) {
  // before 09:00 (<540) or after 17:00 (>1020)
  return mins < 540 || mins > 1020;
}

function computeRows(filter) {
  const date = referenceDate();
  const q = (filter || "").trim().toLowerCase();
  const rows = members
    .filter(m => {
      if (!q) return true;
      return m.name.toLowerCase().includes(q)
        || m.role.toLowerCase().includes(q)
        || m.tz.toLowerCase().includes(q);
    })
    .map(m => {
      const mins = minutesSinceMidnight(date, m.tz);
      return {
        ...m,
        local: fmtTime(date, m.tz),
        offset: fmtOffset(date, m.tz),
        sortKey: mins,
        off: isOffHours(mins),
      };
    })
    .sort((a,b) => a.sortKey - b.sortKey); // earliest local time first
  return { date, rows };
}

function currentMode() {
  const checked = document.querySelector('input[name="refMode"]:checked');
  return checked?.value || "now";
}

function render() {
  const mode = currentMode();
  const { date, rows } = computeRows($q.value);

  $rows.innerHTML = rows.map(r => `
    <tr>
      <td>${r.name}</td>
      <td class="muted">${r.role}</td>
      <td class="mono">${r.tz}</td>
      <td class="mono ${r.off ? 'warn' : ''}">${r.local}</td>
      <td class="mono">${r.offset}</td>
    </tr>
  `).join("");

  $footNote.innerHTML =
    `Times shown are each teammate's local time at the selected reference. Off-hours (before 9am / after 5pm) are subtly highlighted in red. DST is automatic.`;
}

/* Member Management Functions */
let editingMemberIndex = -1;

function openManageModal() {
  document.getElementById('manageMembersModal').style.display = 'block';
  renderMembersList();
  clearMemberForm();
}

function closeManageModal() {
  document.getElementById('manageMembersModal').style.display = 'none';
  clearMemberForm();
  editingMemberIndex = -1;
}

function clearMemberForm() {
  document.getElementById('memberName').value = '';
  document.getElementById('memberRole').value = '';
  document.getElementById('memberLocation').value = '';
  document.getElementById('memberTimezone').value = '';
  document.getElementById('saveMember').textContent = 'Save';
  editingMemberIndex = -1;
}

function renderMembersList() {
  const membersList = document.getElementById('membersList');
  membersList.innerHTML = members.map((member, index) => `
    <div class="member-item">
      <div class="member-info">
        <div class="member-name">${member.name}</div>
        <div class="member-details">${member.role} • ${member.tz}</div>
      </div>
      <div class="member-actions">
        <button class="btn btn-secondary btn-small edit-member-btn" data-index="${index}">✏️</button>
        <button class="btn btn-danger btn-small delete-member-btn" data-index="${index}">🗑️</button>
      </div>
    </div>
  `).join('');
  
  // Add event listeners for the edit and delete buttons
  membersList.querySelectorAll('.edit-member-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const index = parseInt(e.target.dataset.index);
      editMember(index);
    });
  });
  
  membersList.querySelectorAll('.delete-member-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const index = parseInt(e.target.dataset.index);
      deleteMember(index);
    });
  });
}

function editMember(index) {
  const member = members[index];
  document.getElementById('memberName').value = member.name;
  document.getElementById('memberRole').value = member.role;
  document.getElementById('memberLocation').value = member.location;
  document.getElementById('memberTimezone').value = member.tz;
  document.getElementById('saveMember').textContent = 'Update';
  editingMemberIndex = index;
}

async function deleteMember(index) {
  if (confirm(`Delete ${members[index].name}?`)) {
    members.splice(index, 1);
    await saveMembers();
    renderMembersList();
    
    // Update timezone dropdown and re-render main view
    const tzs = uniqueTzs();
    $refTz.innerHTML = tzs.map(t => `<option value="${t}">${t}</option>`).join("");
    const ny = "America/New_York";
    $refTz.value = tzs.includes(ny) ? ny : tzs[0];
    render();
  }
}

async function saveMember() {
  const name = document.getElementById('memberName').value.trim();
  const role = document.getElementById('memberRole').value.trim();
  const location = document.getElementById('memberLocation').value.trim();
  const tz = document.getElementById('memberTimezone').value;
  
  if (!name || !role || !location || !tz) {
    alert('Please fill in all fields');
    return;
  }
  
  const memberData = { name, role, location, tz };
  
  if (editingMemberIndex >= 0) {
    // Update existing member
    members[editingMemberIndex] = memberData;
  } else {
    // Add new member
    members.push(memberData);
  }
  
  await saveMembers();
  renderMembersList();
  clearMemberForm();
  
  // Update timezone dropdown and re-render main view
  const tzs = uniqueTzs();
  $refTz.innerHTML = tzs.map(t => `<option value="${t}">${t}</option>`).join("");
  const ny = "America/New_York";
  $refTz.value = tzs.includes(ny) ? ny : tzs[0];
  render();
}

/* Events */
document.querySelectorAll('input[name="refMode"]').forEach(r => r.addEventListener("change", render));
$q.addEventListener("input", render);
$refHour.addEventListener("change", () => { if (currentMode()==="ref") render(); });
$refTz.addEventListener("change", () => { if (currentMode()==="ref") render(); });
setInterval(() => { if (currentMode()==="now") render(); }, 60_000);

// Modal events
document.getElementById('manageMembersBtn').addEventListener('click', openManageModal);
document.getElementById('closeModal').addEventListener('click', closeManageModal);
document.getElementById('cancelEdit').addEventListener('click', clearMemberForm);
document.getElementById('saveMember').addEventListener('click', saveMember);

// Close modal when clicking outside
document.getElementById('manageMembersModal').addEventListener('click', function(e) {
  if (e.target === this) {
    closeManageModal();
  }
});

// Event listeners are now properly attached in renderMembersList()

/* Initialize - Load members then render */
async function initialize() {
  await loadMembers();
  // Populate TZ dropdown after members are loaded
  const tzs = uniqueTzs();
  $refTz.innerHTML = tzs.map(t => `<option value="${t}">${t}</option>`).join("");
  const ny = "America/New_York";
  $refTz.value = tzs.includes(ny) ? ny : tzs[0];
  // Initial render
  render();
}

initialize();
