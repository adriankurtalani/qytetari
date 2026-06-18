const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

export function isReportNumberParam(value: string): boolean {
  return /^\d+$/.test(value) && Number(value) > 0;
}

/** URL publike e shkurtër: /reports/142 */
export function getReportPublicPath(reportNumber: number): string {
  return `/reports/${reportNumber}`;
}

export function formatReportLabel(reportNumber: number): string {
  return `Raport #${reportNumber}`;
}

export function formatReportShareText(reportNumber: number, title: string): string {
  return `${formatReportLabel(reportNumber)}: ${title}`;
}

export function buildReportShareMessage(reportNumber: number, title: string, origin?: string): string {
  const path = getReportPublicPath(reportNumber);
  const url = origin ? `${origin}${path}` : path;
  return `${formatReportShareText(reportNumber, title)}\n${url}`;
}
