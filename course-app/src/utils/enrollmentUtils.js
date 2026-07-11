/**
 * Calculates the remaining time for an enrollment and returns a label and urgency flag.
 * @param {string|Date} endedAt - The expiration date of the enrollment.
 * @returns {{label: string, urgent: boolean}|null} The remaining time label and urgency status.
 */
export function getRemainingTimeLabel(endedAt) {
  if (!endedAt) return null;
  const now = new Date();
  const end = new Date(endedAt);
  const diffMs = end - now;
  if (diffMs <= 0) return null; // already expired

  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffDays >= 1) {
    return { label: `Còn ${diffDays} ngày`, urgent: diffDays < 7 };
  }
  if (diffHours >= 1) {
    const mins = diffMins % 60;
    return { label: `Còn ${diffHours}h${mins > 0 ? ` ${mins}m` : ''}`, urgent: true };
  }
  return { label: `Còn ${diffMins} phút`, urgent: true };
}
