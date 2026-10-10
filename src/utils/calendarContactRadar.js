/**
 * Calendar Contact Radar Utility
 * Intelligent cross-referencing engine that detects meeting contacts from Google Calendar
 * and identifies individuals not currently tracked in Clients, Project 100, Pipeline, or Campaigns.
 */

// Common internal/agency keywords or personal calendar entries to ignore
const NOISE_KEYWORDS = [
  'internal', 'training', 'agency meeting', 'unit meeting', 'agency briefing',
  'townhall', 'town hall', 'cpf', 'iras', 'dentist', 'dental', 'clinic', 'doctor',
  'gym', 'workout', 'fitness', 'physio', 'flight', 'birthday', 'bday', 'leave',
  'annual leave', 'medical leave', 'mc', 'holiday', 'public holiday', 'blockout',
  'busy', 'focus time', 'standup', 'weekly sync', 'all hands', 'dinner with family',
  'haircut', 'car servicing', 'service car', 'inspection'
];

const NOISE_REGEX = new RegExp(`\\b(${NOISE_KEYWORDS.join('|')})\\b`, 'i');

/**
 * Normalizes strings for robust fuzzy comparison (lowercase, trimmed, stripped punctuation)
 */
export function normalizeContactString(str) {
  if (!str || typeof str !== 'string') return '';
  return str
    .toLowerCase()
    .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extracts candidate name from meeting summaries (e.g. "Coffee with Amanda Teo", "Lunch w/ Marcus", "Meeting - David Lim")
 */
export function extractNameFromSummary(summary) {
  if (!summary || typeof summary !== 'string') return null;
  const trimmed = summary.trim();

  // If matches general noise, don't try extracting personal names
  if (NOISE_REGEX.test(trimmed)) return null;

  // Patterns with "with" or "w/"
  const withMatch = trimmed.match(/(?:coffee|lunch|dinner|meeting|catch\s*up|chat|call|zoom|discussion|intro(?:duction)?)\s+(?:with|w\/)\s+([A-Z\u00C0-\u017F][A-Za-z\u00C0-\u017F'.\s-]+?)(?:\s*(?:@|at|-|\(|–|\||$))/i);
  if (withMatch && withMatch[1]) {
    const candidate = withMatch[1].trim();
    if (isValidCandidateName(candidate)) return cleanExtractedName(candidate);
  }

  // Patterns like "Catch up - Amanda Teo" or "Intro - Amanda Teo (Ref from Kevin)"
  const dashMatch = trimmed.match(/(?:coffee|lunch|meeting|catch\s*up|intro(?:duction)?|consultation|review|reviewing|chat)\s*(?:-|–|:)\s*([A-Z\u00C0-\u017F][A-Za-z\u00C0-\u017F'.\s-]+?)(?:\s*(?:@|at|\(|–|\||$))/i);
  if (dashMatch && dashMatch[1]) {
    const candidate = dashMatch[1].trim();
    if (isValidCandidateName(candidate)) return cleanExtractedName(candidate);
  }

  // Patterns like "Amanda Teo / Financial Review" or "Amanda Teo - Insurance Portfolio"
  const prefixMatch = trimmed.match(/^([A-Z\u00C0-\u017F][A-Za-z\u00C0-\u017F'.\s-]+?)\s*(?:-|–|:|\/)\s*(?:financial|portfolio|policy|review|insurance|fna|wealth|intro|catch\s*up|meeting|discussion)/i);
  if (prefixMatch && prefixMatch[1]) {
    const candidate = prefixMatch[1].trim();
    if (isValidCandidateName(candidate)) return cleanExtractedName(candidate);
  }

  // Patterns like "Amanda Teo <> Pieter" or "Pieter & Amanda Teo"
  const meetWithMe = trimmed.match(/(?:[A-Za-z\s]+?)\s*(?:<>|&|\/)\s*([A-Z\u00C0-\u017F][A-Za-z\u00C0-\u017F'.\s-]+?)(?:\s*(?:@|at|\(|$))/i);
  if (meetWithMe && meetWithMe[1]) {
    const candidate = meetWithMe[1].trim();
    if (isValidCandidateName(candidate)) return cleanExtractedName(candidate);
  }

  return null;
}

/**
 * Validates that candidate string looks like a human name and not generic words
 */
function isValidCandidateName(name) {
  if (!name || name.length < 2 || name.length > 40) return false;
  const lower = name.toLowerCase();
  const blacklisted = ['team', 'agency', 'client', 'prospect', 'discussion', 'meeting', 'review', 'session', 'zoom', 'call', 'branch', 'hub', 'office'];
  if (blacklisted.some(b => lower === b || lower.startsWith(b + ' ') || lower.endsWith(' ' + b))) {
    return false;
  }
  // Must contain letters
  return /[a-zA-Z]/.test(name);
}

/**
 * Strips residual tags, brackets, and extra spaces
 */
function cleanExtractedName(name) {
  return name
    .replace(/\s*\([^)]*\)/g, '') // remove (brackets)
    .replace(/\s*\[[^\]]*\]/g, '') // remove [brackets]
    .replace(/^(mr|mrs|ms|mdm|dr)\.?\s+/i, '') // strip title prefix
    .trim();
}

/**
 * Attempts to derive a clean display name from an email address (e.g. "marcus.tan92@gmail.com" -> "Marcus Tan")
 */
export function deriveNameFromEmail(email) {
  if (!email || typeof email !== 'string') return '';
  const localPart = email.split('@')[0];
  if (!localPart) return '';

  // Replace dots, underscores, dashes with spaces and remove trailing numbers
  const cleaned = localPart
    .replace(/[0-9]+/g, '')
    .replace(/[._-]+/g, ' ')
    .trim();

  if (cleaned.length < 2) return email;

  // Capitalize words
  return cleaned
    .split(' ')
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Checks whether a candidate contact matches an existing CRM record
 */
export function isContactInCrm(candidate, { clients = [], project100Contacts = [], pipelineCases = [], initiatives = [], crmTasks = [] }) {
  const candNameNorm = normalizeContactString(candidate.name);
  const candEmail = (candidate.email || '').toLowerCase().trim();

  // 1. Check Clients
  for (const c of clients) {
    if (candEmail && c.email && c.email.toLowerCase().trim() === candEmail) {
      return { matched: true, type: 'client', entity: c };
    }
    const cNameNorm = normalizeContactString(c.fullName);
    const cPrefNorm = normalizeContactString(c.preferredName);
    if (candNameNorm && cNameNorm && (candNameNorm === cNameNorm || candNameNorm === cPrefNorm)) {
      return { matched: true, type: 'client', entity: c };
    }
    if (candNameNorm.length >= 4 && cNameNorm.length >= 4) {
      if (cNameNorm.includes(candNameNorm) || candNameNorm.includes(cNameNorm)) {
        return { matched: true, type: 'client', entity: c };
      }
    }
  }

  // 2. Check Project 100 Contacts
  for (const p of project100Contacts) {
    if (candEmail && p.email && p.email.toLowerCase().trim() === candEmail) {
      return { matched: true, type: 'project100', entity: p };
    }
    const pNameNorm = normalizeContactString(p.fullName);
    if (candNameNorm && pNameNorm && candNameNorm === pNameNorm) {
      return { matched: true, type: 'project100', entity: p };
    }
    if (candNameNorm.length >= 4 && pNameNorm.length >= 4) {
      if (pNameNorm.includes(candNameNorm) || candNameNorm.includes(pNameNorm)) {
        return { matched: true, type: 'project100', entity: p };
      }
    }
  }

  // 3. Check Pipeline Cases
  for (const pc of pipelineCases) {
    const pcNameNorm = normalizeContactString(pc.clientName);
    if (candNameNorm && pcNameNorm && (candNameNorm === pcNameNorm || pcNameNorm.includes(candNameNorm))) {
      return { matched: true, type: 'pipeline', entity: pc };
    }
  }

  // 4. Check Initiatives / Special Project Leads
  for (const init of initiatives) {
    const leads = init.leads || [];
    for (const lead of leads) {
      if (candEmail && lead.email && lead.email.toLowerCase().trim() === candEmail) {
        return { matched: true, type: 'initiative', entity: lead };
      }
      const leadNameNorm = normalizeContactString(lead.fullName || lead.name);
      if (candNameNorm && leadNameNorm && candNameNorm === leadNameNorm) {
        return { matched: true, type: 'initiative', entity: lead };
      }
    }
  }

  return { matched: false };
}

/**
 * Main detection engine:
 * Evaluates Google Events and CRM Tasks, identifying all unique unmatched attendees and contacts.
 */
export function detectUnmatchedContacts({
  googleEvents = [],
  crmTasks = [],
  clients = [],
  project100Contacts = [],
  pipelineCases = [],
  initiatives = [],
  ignoredList = [],
  advisorEmail = ''
}) {
  const unmatchedMap = new Map();
  const normalizedIgnored = (ignoredList || []).map(i => normalizeContactString(i));
  const normalizedAdvisorEmail = (advisorEmail || '').toLowerCase().trim();

  // Helper to check if string or email is ignored
  const isIgnored = (str, email) => {
    if (email && normalizedAdvisorEmail && email.toLowerCase().trim() === normalizedAdvisorEmail) return true;
    if (email && ignoredList.some(ig => ig.toLowerCase().trim() === email.toLowerCase().trim())) return true;
    const norm = normalizeContactString(str);
    if (norm && normalizedIgnored.includes(norm)) return true;
    return false;
  };

  // Set of Google event IDs already mapped to explicit CRM tasks with a known client or prospect
  const linkedGoogleEventIds = new Set();
  crmTasks.forEach(t => {
    if (t.googleEventId && (t.clientId || t.prospectId)) {
      linkedGoogleEventIds.add(t.googleEventId);
    }
  });

  googleEvents.forEach(event => {
    // If this Google Event is already explicitly linked to a known client or prospect in crmTasks, skip
    if (linkedGoogleEventIds.has(event.id)) return;

    const summary = event.summary || '';
    const description = event.description || '';
    const location = event.location || '';
    const attendees = event.attendees || [];

    // Parse event date and time
    const startObj = event.start?.dateTime ? new Date(event.start.dateTime) : (event.start?.date ? new Date(event.start.date) : null);
    const endObj = event.end?.dateTime ? new Date(event.end.dateTime) : null;
    const dateStr = startObj ? startObj.toISOString().split('T')[0] : '';
    const timeStr = startObj && event.start?.dateTime ? startObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : '';
    const endTimeStr = endObj ? endObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : '';

    let foundCandidate = false;

    // 1. Process explicit attendees
    for (const att of attendees) {
      if (att.self) continue;
      const attEmail = (att.email || '').toLowerCase().trim();
      if (!attEmail) continue;

      // Filter out calendar resources and advisor email
      if (attEmail.includes('resource.calendar.google.com') || attEmail.includes('group.calendar.google.com')) continue;
      if (normalizedAdvisorEmail && attEmail === normalizedAdvisorEmail) continue;
      if (isIgnored(att.displayName, attEmail)) continue;

      const candidateName = att.displayName && att.displayName.trim() ? cleanExtractedName(att.displayName) : deriveNameFromEmail(attEmail);

      const check = isContactInCrm(
        { name: candidateName, email: attEmail },
        { clients, project100Contacts, pipelineCases, initiatives, crmTasks }
      );

      if (!check.matched) {
        foundCandidate = true;
        const key = attEmail || normalizeContactString(candidateName);
        if (!unmatchedMap.has(key)) {
          unmatchedMap.set(key, {
            id: `unmatched-${event.id}-${attEmail || key}`,
            name: candidateName,
            email: attEmail,
            source: 'attendee',
            firstSeenDate: dateStr,
            events: []
          });
        }
        unmatchedMap.get(key).events.push({
          eventId: event.id,
          summary,
          date: dateStr,
          time: timeStr,
          endTime: endTimeStr,
          location,
          description
        });
      }
    }

    // 2. If no unmatched attendee was found, try extracting from the Event Summary (Title)
    if (!foundCandidate) {
      const extractedName = extractNameFromSummary(summary);
      if (extractedName && !isIgnored(extractedName, null)) {
        const check = isContactInCrm(
          { name: extractedName, email: null },
          { clients, project100Contacts, pipelineCases, initiatives, crmTasks }
        );

        if (!check.matched) {
          const key = normalizeContactString(extractedName);
          if (!unmatchedMap.has(key)) {
            unmatchedMap.set(key, {
              id: `unmatched-${event.id}-${key}`,
              name: extractedName,
              email: null,
              source: 'summary_title',
              firstSeenDate: dateStr,
              events: []
            });
          }
          unmatchedMap.get(key).events.push({
            eventId: event.id,
            summary,
            date: dateStr,
            time: timeStr,
            endTime: endTimeStr,
            location,
            description
          });
        }
      }
    }
  });

  // Return list sorted chronologically by earliest meeting date
  return Array.from(unmatchedMap.values()).sort((a, b) => {
    return (a.firstSeenDate || '').localeCompare(b.firstSeenDate || '');
  });
}
