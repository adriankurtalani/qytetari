'use client';

import dynamic from 'next/dynamic';

const SingleReportMap = dynamic(() => import('./SingleReportMap'), {
  ssr: false,
  loading: () => <div className="h-80 bg-gray-100 animate-pulse rounded-xl" />,
});

interface ReportMapWrapperProps {
  latitude: number;
  longitude: number;
  title?: string;
}

export function ReportMapWrapper({ latitude, longitude, title }: ReportMapWrapperProps) {
  return <SingleReportMap latitude={latitude} longitude={longitude} title={title} />;
}
