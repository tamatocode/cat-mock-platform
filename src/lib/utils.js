/**
 * Generate a UUID v4 string
 */
export function generateId() {
  return crypto.randomUUID?.() ?? 
    'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
}

/**
 * Format seconds into MM:SS or HH:MM:SS
 */
export function formatTime(totalSeconds) {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  
  const pad = (n) => String(n).padStart(2, '0');
  
  if (h > 0) {
    return `${pad(h)}:${pad(m)}:${pad(s)}`;
  }
  return `${pad(m)}:${pad(s)}`;
}

/**
 * Format a timestamp into a human-readable date string
 */
export function formatDate(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Format a timestamp into a relative time string (e.g., "2 hours ago")
 */
export function formatRelativeTime(timestamp) {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return formatDate(timestamp);
}

/**
 * Truncate text to maxLen characters, appending "…" if truncated
 */
export function truncateText(text, maxLen = 80) {
  if (!text) return '';
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen).trimEnd() + '…';
}

/**
 * Merge class names, filtering out falsy values
 */
export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

/**
 * Convert a File object to a base64 data URL string
 */
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Parse comma-separated tags into a trimmed array
 */
export function parseTags(input) {
  if (!input) return [];
  return input
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);
}

/**
 * Section display names
 */
export const SECTION_INFO = {
  VARC: { name: 'Verbal Ability & Reading Comprehension', short: 'VARC', defaultQuestions: 24, defaultTime: 40, color: '#6C63FF' },
  DILR: { name: 'Data Interpretation & Logical Reasoning', short: 'DILR', defaultQuestions: 20, defaultTime: 40, color: '#F59E0B' },
  QA:   { name: 'Quantitative Ability', short: 'QA', defaultQuestions: 22, defaultTime: 40, color: '#22C55E' },
};

export const SECTIONS = ['VARC', 'DILR', 'QA'];
export const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];
export const QUESTION_TYPES = ['MCQ', 'TITA'];
