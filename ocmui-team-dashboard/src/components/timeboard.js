/**
 * Team Timeboard Component
 * 
 * Provides timezone display functionality for team members
 * Based on the original timeboard from the browser extension
 */

import { showNotification } from '../utils/ui.js';

/**
 * Create and show the timeboard modal
 */
export function openTimeboardModal() {
    console.log('🕐 Opening Team Timeboard modal...');
    
    // Create modal HTML
    const modalHtml = createTimeboardModalHTML();
    
    // Add modal to page
    const existingModal = document.getElementById('timeboardModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    const modalElement = document.createElement('div');
    modalElement.innerHTML = modalHtml;
    document.body.appendChild(modalElement.firstElementChild);
    
    // Show modal
    const modal = document.getElementById('timeboardModal');
    modal.style.display = 'flex';
    
    // Load timeboard script and initialize
    loadTimeboardScript().then(() => {
        if (window.initializeTimeboard) {
            window.initializeTimeboard();
        }
    }).catch(error => {
        console.error('❌ Failed to load timeboard:', error);
        showNotification('Failed to load timeboard', 'error');
    });
    
    // Add close event listeners
    setupTimeboardModalEvents();
}

/**
 * Close and cleanup the timeboard modal
 */
export function closeTimeboardModal() {
    console.log('🕐 Closing Team Timeboard modal...');
    
    // Cleanup timeboard events
    if (window.cleanupTimeboardEvents) {
        window.cleanupTimeboardEvents();
    }
    
    // Remove modal
    const modal = document.getElementById('timeboardModal');
    if (modal) {
        modal.remove();
    }
}

/**
 * Create the timeboard modal HTML structure
 */
function createTimeboardModalHTML() {
    return `
        <div id="timeboardModal" class="timeboard-modal-backdrop" style="display: none;">
            <div class="timeboard-modal-content">
                <div class="timeboard-modal-header">
                    <h1>🕐 OCMUI Team Timeboard</h1>
                    <button class="timeboard-close-btn" id="timeboardModalClose">&times;</button>
                </div>
                
                <div class="timeboard-controls">
                    <input id="timeboard-q" type="search" placeholder="Filter by name, role, or timezone…" />

                    <div class="timeboard-pill">
                        <label><input type="radio" name="refMode" value="now" checked/> Now</label>
                        <label><input type="radio" name="refMode" value="ref"/> Reference</label>
                    </div>

                    <div class="timeboard-ctrl" id="timeboard-refTimeWrap" title="Reference time (9am–5pm)">
                        <label for="timeboard-refHour">Time:</label>
                        <select id="timeboard-refHour">
                            <option value="9">9:00</option>
                            <option value="10">10:00</option>
                            <option value="11">11:00</option>
                            <option value="12">12:00</option>
                            <option value="13">1:00</option>
                            <option value="14">2:00</option>
                            <option value="15">3:00</option>
                            <option value="16">4:00</option>
                            <option value="17">5:00</option>
                        </select>
                    </div>

                    <div class="timeboard-ctrl" id="timeboard-refTzWrap" title="Reference timezone (from team tzs)">
                        <label for="timeboard-refTz">TZ:</label>
                        <select id="timeboard-refTz"></select>
                    </div>
                    
                    <button id="timeboard-manageMembersBtn" class="timeboard-manage-btn" title="Manage Team Members">👥</button>
                </div>

                <main class="timeboard-main">
                    <table id="timeboard-grid" class="timeboard-table">
                        <thead>
                            <tr>
                                <th style="width:28%;">Name</th>
                                <th style="width:16%;">Role</th>
                                <th style="width:28%;">IANA TZ</th>
                                <th style="width:14%;">Local Time</th>
                                <th style="width:14%;">Offset</th>
                            </tr>
                        </thead>
                        <tbody id="timeboard-rows"></tbody>
                    </table>
                    <footer id="timeboard-footNote" class="timeboard-note"></footer>
                </main>

                <!-- Manage Members Modal -->
                <div id="timeboard-manageMembersModal" class="timeboard-sub-modal">
                    <div class="timeboard-sub-modal-content">
                        <div class="timeboard-sub-modal-header">
                            <h2 class="timeboard-sub-modal-title">Manage Team Members</h2>
                            <button class="timeboard-close-btn" id="timeboard-closeModal">&times;</button>
                        </div>
                        <div class="timeboard-sub-modal-body">
                            <!-- Add/Edit Member Form -->
                            <div class="timeboard-member-form">
                                <div class="timeboard-form-group">
                                    <label for="timeboard-memberName">Name</label>
                                    <input type="text" id="timeboard-memberName" placeholder="Enter name">
                                </div>
                                <div class="timeboard-form-group">
                                    <label for="timeboard-memberRole">Role</label>
                                    <input type="text" id="timeboard-memberRole" placeholder="Enter role">
                                </div>
                                <div class="timeboard-form-group">
                                    <label for="timeboard-memberLocation">Location</label>
                                    <input type="text" id="timeboard-memberLocation" placeholder="Enter location description">
                                </div>
                                <div class="timeboard-form-group">
                                    <label for="timeboard-memberTimezone">Timezone (IANA)</label>
                                    <select id="timeboard-memberTimezone">
                                        <option value="">Select timezone...</option>
                                        <option value="America/Los_Angeles">America/Los_Angeles (Pacific)</option>
                                        <option value="America/Denver">America/Denver (Mountain)</option>
                                        <option value="America/Chicago">America/Chicago (Central)</option>
                                        <option value="America/New_York">America/New_York (Eastern)</option>
                                        <option value="Europe/London">Europe/London (UK)</option>
                                        <option value="Europe/Amsterdam">Europe/Amsterdam (Netherlands)</option>
                                        <option value="Europe/Berlin">Europe/Berlin (Germany)</option>
                                        <option value="Europe/Rome">Europe/Rome (Italy)</option>
                                        <option value="Europe/Prague">Europe/Prague (Czech Republic)</option>
                                        <option value="Asia/Jerusalem">Asia/Jerusalem (Israel)</option>
                                        <option value="Asia/Singapore">Asia/Singapore (Singapore)</option>
                                        <option value="Asia/Tokyo">Asia/Tokyo (Japan)</option>
                                        <option value="Australia/Sydney">Australia/Sydney (Australia)</option>
                                    </select>
                                </div>
                                <div class="timeboard-btn-group">
                                    <button class="timeboard-btn timeboard-btn-secondary" id="timeboard-cancelEdit">Cancel</button>
                                    <button class="timeboard-btn timeboard-btn-primary" id="timeboard-saveMember">Save</button>
                                </div>
                            </div>
                            
                            <!-- Members List -->
                            <h3 style="font-size: 12px; margin: 0 0 8px 0; color: #666;">Current Members</h3>
                            <div class="timeboard-members-list" id="timeboard-membersList">
                                <!-- Dynamic content will be inserted here -->
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

/**
 * Setup event listeners for the timeboard modal
 */
function setupTimeboardModalEvents() {
    // Close modal events
    document.getElementById('timeboardModalClose')?.addEventListener('click', closeTimeboardModal);
    
    // Close when clicking outside
    document.getElementById('timeboardModal')?.addEventListener('click', function(e) {
        if (e.target === this) {
            closeTimeboardModal();
        }
    });
    
    // ESC key to close
    const escHandler = function(e) {
        if (e.key === 'Escape') {
            closeTimeboardModal();
            document.removeEventListener('keydown', escHandler);
        }
    };
    document.addEventListener('keydown', escHandler);
}

/**
 * Dynamically load the timeboard script
 */
async function loadTimeboardScript() {
    return new Promise((resolve, reject) => {
        // Check if already loaded
        if (window.initializeTimeboard) {
            resolve();
            return;
        }
        
        const script = document.createElement('script');
        script.src = '/timeboard/timeboard.js';
        script.type = 'module';
        
        script.onload = () => {
            console.log('✅ Timeboard script loaded successfully');
            resolve();
        };
        
        script.onerror = () => {
            console.error('❌ Failed to load timeboard script');
            reject(new Error('Failed to load timeboard script'));
        };
        
        document.head.appendChild(script);
    });
}
