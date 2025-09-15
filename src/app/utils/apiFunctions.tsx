import dayjs from "dayjs";

export function getMatchStartTime(unix_timestamp: string) {
  const matchStartTime = dayjs(unix_timestamp);

  const hour = matchStartTime.hour() % 12 || 12; // 12-hour format
  const minute = matchStartTime.minute().toString().padStart(2, "0"); // "00", "05", etc.
  const ampm = matchStartTime.format("A"); // "AM" or "PM"

  return { hour, minute };
}

export default function parseTimeCompleted(timeStr: string): Date {
  const now = new Date();

  // Match "5d 11h ago", "2h 44m ago", "9h ago", "55m ago"
  const regex = /(?:(\d+)d)?\s*(?:(\d+)h)?\s*(?:(\d+)m)?/;
  const match = timeStr.match(regex);

  if (match) {
    const days = match[1] ? parseInt(match[1], 10) : 0;
    const hours = match[2] ? parseInt(match[2], 10) : 0;
    const minutes = match[3] ? parseInt(match[3], 10) : 0;

    // total milliseconds difference
    const msDiff = ((days * 24 + hours) * 60 + minutes) * 60 * 1000;

    return new Date(now.getTime() - msDiff);
  }

  return now; // fallback if regex doesn't match
}
