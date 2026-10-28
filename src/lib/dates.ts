const WEEKDAYS = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const;

const MONTHS = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
] as const;

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function parseIsoDate(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day, 12));
}

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function addDays(value: string, days: number): string {
  const date = parseIsoDate(value);
  date.setUTCDate(date.getUTCDate() + days);
  return toIsoDate(date);
}

function nextWeekday(value: string, weekday: number, forceNextWeek = false) {
  const date = parseIsoDate(value);
  let delta = (weekday - date.getUTCDay() + 7) % 7;
  if (delta === 0) delta = forceNextWeek ? 7 : 0;
  date.setUTCDate(date.getUTCDate() + delta);
  return toIsoDate(date);
}

function endOfWeek(value: string): string {
  const date = parseIsoDate(value);
  const day = date.getUTCDay();
  const delta = day === 0 ? 6 : 7 - day;
  date.setUTCDate(date.getUTCDate() + delta);
  return toIsoDate(date);
}

export function resolveDueDate(
  sentence: string,
  meetingDate: string,
): string | null {
  const text = sentence.toLowerCase();

  if (
    /\b(?:every|weekly|daily|monthly|biweekly)\b/.test(text) &&
    !/\b(?:by|on|before|starting)\b/.test(text)
  ) {
    return null;
  }

  if (/\b(tomorrow)\b/.test(text)) {
    return addDays(meetingDate, 1);
  }

  if (/\b(today|by eod|end of day|tonight)\b/.test(text)) {
    return meetingDate;
  }

  if (/\b(end of week|eow|by friday)\b/.test(text)) {
    return endOfWeek(meetingDate);
  }

  if (/\bnext week\b/.test(text)) {
    return addDays(meetingDate, 7);
  }

  const inDays = text.match(/\bin (\d{1,2}) (?:days|business days)\b/);
  if (inDays) {
    return addDays(meetingDate, Number(inDays[1]));
  }

  const weekdayMatch = text.match(
    /\b(?:(next|this)\s+)?(sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b/,
  );
  if (weekdayMatch) {
    const weekday = WEEKDAYS.indexOf(
      weekdayMatch[2] as (typeof WEEKDAYS)[number],
    );
    return nextWeekday(meetingDate, weekday, weekdayMatch[1] === "next");
  }

  const monthDay = text.match(
    /\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\.?\s+(\d{1,2})(?:st|nd|rd|th)?\b/,
  );
  if (monthDay) {
    const monthName = monthDay[1];
    const month = MONTHS.findIndex((name) => name.startsWith(monthName));
    const base = parseIsoDate(meetingDate);
    const date = new Date(Date.UTC(base.getUTCFullYear(), month, Number(monthDay[2]), 12));
    if (date.getTime() < base.getTime()) {
      date.setUTCFullYear(date.getUTCFullYear() + 1);
    }
    return toIsoDate(date);
  }

  const ordinal = text.match(/\b(?:by|on) the (\d{1,2})(?:st|nd|rd|th)\b/);
  if (ordinal) {
    const base = parseIsoDate(meetingDate);
    const day = Number(ordinal[1]);
    const date = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), day, 12));
    if (date.getTime() < base.getTime()) {
      date.setUTCMonth(date.getUTCMonth() + 1);
    }
    return toIsoDate(date);
  }

  return null;
}

export function formatShortDate(value: string | null): string {
  if (!value) return "No due date";
  const date = parseIsoDate(value);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function formatLongDate(value: string): string {
  const date = parseIsoDate(value);
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function relativeDueLabel(value: string | null, base: string): string {
  if (!value) return "No due date";
  const due = parseIsoDate(value).getTime();
  const start = parseIsoDate(base).getTime();
  const days = Math.round((due - start) / 86_400_000);
  if (days < 0) return "Overdue";
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days <= 7) return `In ${days} days`;
  return formatShortDate(value);
}
