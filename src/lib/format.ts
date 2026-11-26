// A fixed timezone keeps server-rendered and client-hydrated output identical
// regardless of where the server or the browser happens to be running.
const TZ = "Pacific/Port_Moresby";

export function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-AU", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false, timeZone: TZ,
  });
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-AU", { day: "2-digit", month: "short", year: "numeric", timeZone: TZ });
}

export function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: TZ });
}

export function relativeTime(iso: string, now: Date = new Date()) {
  const mins = Math.round((now.getTime() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return `${Math.round(days / 30)}mo ago`;
}

export function slaRemaining(slaDueIso: string, now: Date = new Date()) {
  const hours = (new Date(slaDueIso).getTime() - now.getTime()) / 3600000;
  const abs = Math.abs(hours);
  const label = abs >= 24 ? `${Math.round(abs / 24)}d` : `${Math.round(abs)}h`;
  return { breached: hours < 0, label, hours };
}
