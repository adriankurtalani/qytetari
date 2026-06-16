import type { ReportStatus } from './types';

export const APP_NAME = 'Zëri i Qytetarit';
export const APP_DESCRIPTION =
  'Platforma digjitale për raportim, dokumentim dhe ndjekje të problemeve në jetën e përditshme.';

export const KOSOVO_CITIES = [
  'Prishtinë',
  'Prizren',
  'Pejë',
  'Gjakovë',
  'Ferizaj',
  'Gjilan',
  'Mitrovicë',
  'Podujevë',
  'Vushtrri',
  'Suharekë',
  'Rahovec',
  'Drenas',
  'Lipjan',
  'Kamenicë',
  'Malishevë',
  'Skenderaj',
  'Viti',
  'Deçan',
  'Istog',
  'Klinë',
  'Dragash',
  'Shtime',
  'Obiliq',
  'Fushë Kosovë',
  'Kaçanik',
  'Hani i Elezit',
  'Junik',
  'Mamushë',
  'Partesh',
  'Ranillug',
  'Graçanicë',
  'Zveçan',
  'Zubin Potok',
  'Leposaviq',
] as const;

export const REPORT_STATUS_LABELS: Record<ReportStatus, string> = {
  pending_review: 'Në Pritje të Rishikimit',
  approved: 'Aprovuar',
  rejected: 'Refuzuar',
  in_progress: 'Në Proces',
  waiting_for_response: 'Në Pritje të Përgjigjes',
  resolved: 'Zgjidhur',
};

export const REPORT_STATUS_COLORS: Record<ReportStatus, string> = {
  pending_review: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  in_progress: 'bg-blue-100 text-blue-800',
  waiting_for_response: 'bg-purple-100 text-purple-800',
  resolved: 'bg-emerald-100 text-emerald-800',
};

/** Statuses visible on public feed, map, and search */
export const PUBLIC_REPORT_STATUSES: ReportStatus[] = [
  'approved',
  'in_progress',
  'waiting_for_response',
  'resolved',
];

/** Ordered workflow for admin status picker */
export const WORKFLOW_STATUSES: ReportStatus[] = [
  'pending_review',
  'approved',
  'in_progress',
  'waiting_for_response',
  'resolved',
  'rejected',
];

export const MODERATION_MESSAGE =
  'Raportimi juaj është duke u konfirmuar nga ekipi ynë. Do të vendoset nëse do të publikohet publikisht brenda 10-20 minutave.';

export const DEFAULT_MAP_CENTER: [number, number] = [42.6629, 21.1655]; // Prishtina
export const DEFAULT_MAP_ZOOM = 13;

/** Approximate center coordinates for each Kosovo city */
export const CITY_COORDINATES: Record<string, [number, number]> = {
  Prishtinë: [42.6629, 21.1655],
  Prizren: [42.2139, 20.7397],
  Pejë: [42.6598, 20.2883],
  Gjakovë: [42.3803, 20.4308],
  Ferizaj: [42.3702, 21.1553],
  Gjilan: [42.4637, 21.4698],
  Mitrovicë: [42.8833, 20.8667],
  Podujevë: [42.9111, 21.1928],
  Vushtrri: [42.8231, 20.9675],
  Suharekë: [42.3586, 20.8253],
  Rahovec: [42.3994, 20.6547],
  Drenas: [42.6258, 20.8939],
  Lipjan: [42.5236, 21.1258],
  Kamenicë: [42.5781, 21.5772],
  Malishevë: [42.4828, 20.7458],
  Skenderaj: [42.7456, 20.7897],
  Viti: [42.3214, 21.3583],
  Deçan: [42.5400, 20.2883],
  Istog: [42.7808, 20.4878],
  Klinë: [42.6197, 20.5778],
  Dragash: [42.0628, 20.6533],
  Shtime: [42.4331, 21.0397],
  Obiliq: [42.6869, 21.0703],
  'Fushë Kosovë': [42.6378, 21.1000],
  Kaçanik: [42.2319, 21.2594],
  'Hani i Elezit': [42.1500, 21.2967],
  Junik: [42.4769, 20.2778],
  Mamushë: [42.2178, 20.7283],
  Partesh: [42.4014, 21.4336],
  Ranillug: [42.4922, 21.6019],
  Graçanicë: [42.6011, 21.1953],
  Zveçan: [42.9075, 20.8403],
  'Zubin Potok': [42.9144, 20.6897],
  Leposaviq: [43.1039, 20.8039],
};

export const MAX_PHOTOS_PER_REPORT = 6;
export const MAX_PHOTO_SIZE_MB = 5;

/** Recommended upload dimensions for report photos (mobile-first). */
export const PHOTO_UPLOAD_GUIDE = {
  /** Ideal aspect ratio for consistent feed/detail layout */
  aspectRatio: '4:3' as const,
  /** Recommended width × height in pixels */
  recommendedPx: { width: 1200, height: 900 },
  /** Portrait alternative (common on phones) */
  portraitPx: { width: 1080, height: 1440 },
  /** Minimum longest edge before quality loss on large screens */
  minLongEdgePx: 800,
  /** Max width served in detail/lightbox */
  displayMaxWidthPx: 1200,
};
