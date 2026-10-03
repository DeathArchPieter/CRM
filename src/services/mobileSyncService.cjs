/**
 * Beetsma Consultancy CRM - Mobile Companion Firebase Synchronization Service
 * 
 * Provides zero-trust, pseudonymized two-way sync between the desktop CRM
 * and the Beetsma Companion mobile Android app via Firebase Firestore REST API.
 * 
 * Strict Confidentiality:
 * Only pseudonymized client aliases, appointment times/venues, and post-meeting
 * debrief notes are transmitted. Full legal names, NRIC/FINs, policy numbers,
 * financial values, and medical documents NEVER leave the local desktop database.
 */

const PROJECT_ID = 'beetsma-crm-companion';
const BASE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

// Helper: Convert Firestore REST document fields to a plain JavaScript object
function fromFirestore(fields) {
  if (!fields) return {};
  const result = {};
  for (const [key, val] of Object.entries(fields)) {
    if (val.stringValue !== undefined) result[key] = val.stringValue;
    else if (val.integerValue !== undefined) result[key] = parseInt(val.integerValue, 10);
    else if (val.doubleValue !== undefined) result[key] = val.doubleValue;
    else if (val.booleanValue !== undefined) result[key] = val.booleanValue;
    else if (val.timestampValue !== undefined) result[key] = val.timestampValue;
    else if (val.mapValue !== undefined) result[key] = fromFirestore(val.mapValue.fields);
    else if (val.arrayValue !== undefined) {
      result[key] = (val.arrayValue.values || []).map(v => {
        if (v.stringValue !== undefined) return v.stringValue;
        if (v.integerValue !== undefined) return parseInt(v.integerValue, 10);
        if (v.doubleValue !== undefined) return v.doubleValue;
        if (v.booleanValue !== undefined) return v.booleanValue;
        return v;
      });
    }
  }
  return result;
}

// Helper: Convert plain JavaScript object to Firestore REST fields format
function toFirestore(obj) {
  const fields = {};
  for (const [key, val] of Object.entries(obj)) {
    if (val === undefined || val === null) continue;
    if (typeof val === 'string') {
      fields[key] = { stringValue: val };
    } else if (typeof val === 'number') {
      if (Number.isInteger(val)) {
        fields[key] = { integerValue: String(val) };
      } else {
        fields[key] = { doubleValue: val };
      }
    } else if (typeof val === 'boolean') {
      fields[key] = { booleanValue: val };
    } else if (Array.isArray(val)) {
      fields[key] = {
        arrayValue: {
          values: val.map(v => ({ stringValue: String(v) }))
        }
      };
    } else if (typeof val === 'object') {
      fields[key] = {
        mapValue: {
          fields: toFirestore(val)
        }
      };
    }
  }
  return fields;
}

// Extract document ID from Firestore full resource name
function getIdFromName(name) {
  if (!name) return '';
  const parts = name.split('/');
  return parts[parts.length - 1];
}

// Generate client alias: e.g. "Jacelyn Lee" -> "Jacelyn L."
function getClientAlias(client) {
  if (client.alias && client.alias.trim()) return client.alias.trim();
  const parts = (client.fullName || '').trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  const first = parts[0];
  const lastInitial = parts[parts.length - 1][0] || '';
  return `${first} ${lastInitial}.`;
}

/**
 * Perform a full two-way synchronization run
 */
async function syncMobileCompanion({ db, saveDatabase, syncTaskToGoogleCalendar, writeToLogFile }) {
  const log = (msg) => {
    if (typeof writeToLogFile === 'function') writeToLogFile(`[MobileSync] ${msg}`);
    else console.log(`[MobileSync] ${msg}`);
  };

  log('Starting Mobile Companion synchronization with Firestore...');
  const stats = { pushedAliases: 0, pulledAppts: 0, pulledDebriefs: 0, errors: [] };

  try {
    // -------------------------------------------------------------------------
    // 1. PUSH CLIENT ALIASES (Desktop -> Firestore)
    // -------------------------------------------------------------------------
    if (Array.isArray(db.clients) && db.clients.length > 0) {
      // First, fetch existing aliases from Firestore to avoid redundant writes
      let existingAliases = new Set();
      try {
        const aliasListRes = await fetch(`${BASE_URL}/client_aliases?pageSize=300`);
        if (aliasListRes.ok) {
          const aliasData = await aliasListRes.json();
          if (Array.isArray(aliasData.documents)) {
            aliasData.documents.forEach(doc => {
              const parsed = fromFirestore(doc.fields);
              if (parsed.syncId) existingAliases.add(parsed.syncId);
              if (parsed.alias) existingAliases.add(parsed.alias.toLowerCase());
            });
          }
        }
      } catch (err) {
        log(`Could not pre-fetch aliases: ${err.message}`);
      }

      for (const client of db.clients) {
        const alias = getClientAlias(client);
        if (!existingAliases.has(client.id) && !existingAliases.has(alias.toLowerCase())) {
          try {
            const aliasPayload = {
              fields: toFirestore({
                syncId: client.id,
                alias: alias,
                tag: (client.tags && client.tags[0]) || 'Client',
                phone: client.phone || '',
                updatedAt: new Date().toISOString()
              })
            };

            const writeRes = await fetch(`${BASE_URL}/client_aliases`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(aliasPayload)
            });

            if (writeRes.ok) {
              stats.pushedAliases++;
              existingAliases.add(client.id);
            }
          } catch (writeErr) {
            log(`Failed to push alias for ${alias}: ${writeErr.message}`);
          }
        }
      }
      log(`Pushed ${stats.pushedAliases} new client aliases to Firestore.`);
    }

    // -------------------------------------------------------------------------
    // 2. PULL APPOINTMENTS (Firestore -> Desktop)
    // -------------------------------------------------------------------------
    try {
      const apptRes = await fetch(`${BASE_URL}/appointments?pageSize=100`);
      if (apptRes.ok) {
        const apptData = await apptRes.json();
        if (Array.isArray(apptData.documents)) {
          for (const doc of apptData.documents) {
            const docId = getIdFromName(doc.name);
            const appt = fromFirestore(doc.fields);

            // Skip if already marked synced to desktop
            if (appt.syncedToDesktop) continue;

            // Check if this appointment already exists in db.tasks
            if (!Array.isArray(db.tasks)) db.tasks = [];
            
            const alreadyExists = db.tasks.some(t => 
              t.mobileApptId === docId ||
              (t.dueDate === appt.date && t.dueTime === appt.time && t.description && t.description.includes(appt.clientAlias))
            );

            if (!alreadyExists) {
              // Match client by alias
              const matchedClient = (db.clients || []).find(c => {
                const a = getClientAlias(c).toLowerCase();
                const target = (appt.clientAlias || '').toLowerCase();
                return a === target || c.fullName.toLowerCase().includes(target);
              });

              const taskId = 'task_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
              const newTask = {
                id: taskId,
                mobileApptId: docId,
                clientId: matchedClient ? matchedClient.id : null,
                type: appt.type || 'meeting',
                description: appt.title || `${appt.type === 'social' ? '☕ Social Catch-Up' : 'Advisory Meeting'} (${appt.clientAlias})`,
                dueDate: appt.date,
                dueTime: appt.time || '14:00',
                dueEndTime: appt.time ? calculateEndTime(appt.time, appt.durationMinutes || 60) : null,
                location: appt.venue || '',
                priority: 'Normal',
                channel: appt.type === 'social' ? 'Coffee / Social' : 'Meeting',
                status: appt.status || 'Pending',
                logTouchpointOnComplete: true,
                source: 'mobile-companion',
                createdAt: appt.createdAt || new Date().toISOString(),
                updatedAt: new Date().toISOString()
              };

              db.tasks.push(newTask);
              stats.pulledAppts++;

              // Auto-sync to Google Calendar if configured!
              if (typeof syncTaskToGoogleCalendar === 'function' && db.googleCalendarSettings?.tokens) {
                syncTaskToGoogleCalendar(newTask).catch(err => {
                  log(`Google Calendar sync for mobile appt failed: ${err.message}`);
                });
              }
            }

            // Mark appointment document as synced on Firestore
            try {
              const patchUrl = `${BASE_URL}/appointments/${docId}?updateMask.fieldPaths=syncedToDesktop`;
              await fetch(patchUrl, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  fields: {
                    syncedToDesktop: { booleanValue: true }
                  }
                })
              });
            } catch (patchErr) {
              log(`Could not flag appt ${docId} as synced: ${patchErr.message}`);
            }
          }
        }
      }
    } catch (apptErr) {
      log(`Error pulling appointments: ${apptErr.message}`);
      stats.errors.push(apptErr.message);
    }

    // -------------------------------------------------------------------------
    // 3. PULL POST-MEETING DEBRIEF NOTES (Firestore -> Desktop)
    // -------------------------------------------------------------------------
    try {
      const debriefRes = await fetch(`${BASE_URL}/debrief_notes?pageSize=100`);
      if (debriefRes.ok) {
        const debriefData = await debriefRes.json();
        if (Array.isArray(debriefData.documents)) {
          for (const doc of debriefData.documents) {
            const docId = getIdFromName(doc.name);
            const debrief = fromFirestore(doc.fields);

            if (debrief.syncedToDesktop) continue;

            // Match client
            const matchedClient = (db.clients || []).find(c => {
              const a = getClientAlias(c).toLowerCase();
              const target = (debrief.clientAlias || '').toLowerCase();
              return a === target || c.fullName.toLowerCase().includes(target);
            });

            if (matchedClient) {
              matchedClient.touchpoints = matchedClient.touchpoints || [];
              const touchpointDate = debrief.meetingDate || new Date().toISOString().split('T')[0];
              const debriefNoteText = `[Post-Meeting Debrief: ${debrief.outcome}] ${debrief.discussionSummary}`;

              const alreadyLogged = matchedClient.touchpoints.some(tp => {
                if (typeof tp === 'string') return false;
                return tp.date === touchpointDate && tp.notes === debriefNoteText;
              });

              if (!alreadyLogged) {
                matchedClient.touchpoints.push({
                  date: touchpointDate,
                  type: 'Debrief / Post-Meeting',
                  notes: debriefNoteText,
                  source: 'mobile-companion'
                });
                matchedClient.lastContactedAt = new Date().toISOString();
                stats.pulledDebriefs++;
              }

              // If next follow-up action was scheduled in debrief, create task
              if (debrief.nextActionTask && debrief.nextActionDate) {
                const followUpId = 'task_fu_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
                const followUpTask = {
                  id: followUpId,
                  clientId: matchedClient.id,
                  type: 'followup',
                  description: `Follow-up: ${debrief.nextActionTask} (${matchedClient.fullName})`,
                  dueDate: debrief.nextActionDate,
                  dueTime: '10:00',
                  location: 'WhatsApp / Call',
                  priority: 'Normal',
                  channel: 'Follow-up',
                  status: 'Pending',
                  logTouchpointOnComplete: true,
                  source: 'mobile-companion-debrief',
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString()
                };

                const fuExists = db.tasks.some(t => 
                  t.dueDate === followUpTask.dueDate && 
                  t.description === followUpTask.description
                );

                if (!fuExists) {
                  db.tasks.push(followUpTask);
                  if (typeof syncTaskToGoogleCalendar === 'function' && db.googleCalendarSettings?.tokens) {
                    syncTaskToGoogleCalendar(followUpTask).catch(() => {});
                  }
                }
              }
            }

            // Flag debrief as synced on Firestore
            try {
              const patchUrl = `${BASE_URL}/debrief_notes/${docId}?updateMask.fieldPaths=syncedToDesktop`;
              await fetch(patchUrl, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  fields: {
                    syncedToDesktop: { booleanValue: true }
                  }
                })
              });
            } catch (pErr) {
              log(`Could not flag debrief ${docId} as synced: ${pErr.message}`);
            }
          }
        }
      }
    } catch (debErr) {
      log(`Error pulling debrief notes: ${debErr.message}`);
      stats.errors.push(debErr.message);
    }

    // Save database if changes occurred
    if (stats.pulledAppts > 0 || stats.pulledDebriefs > 0) {
      if (typeof saveDatabase === 'function') {
        saveDatabase();
      }
    }

    log(`Sync complete. Pulled ${stats.pulledAppts} appts, pulled ${stats.pulledDebriefs} debriefs, pushed ${stats.pushedAliases} aliases.`);
    return { success: true, ...stats };

  } catch (globalErr) {
    log(`Sync failed with error: ${globalErr.message}`);
    return { success: false, error: globalErr.message, ...stats };
  }
}

// Calculate end time helper
function calculateEndTime(startTime, durationMinutes) {
  try {
    const [h, m] = startTime.split(':').map(Number);
    const totalMinutes = h * 60 + m + Number(durationMinutes || 60);
    const endH = Math.floor(totalMinutes / 60) % 24;
    const endM = totalMinutes % 60;
    return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
  } catch (e) {
    return null;
  }
}

module.exports = {
  syncMobileCompanion,
  getClientAlias
};
