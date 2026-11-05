/**
 * הודעות merged into שיחות (feat/leads-v2, 05.11.2026): one inbox for inquiries and guests.
 * Old links (/messages, the Today "כל המשימות" link, bookmarks) land on the guests view of the inbox.
 * message_logs data is untouched: the inbox reads the same rows and shows them in each guest's thread.
 */
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function MessagesRedirect() {
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  if (!params.get('f')) params.set('f', 'guests');
  return <Navigate to={`${createPageUrl('Leads')}?${params.toString()}`} replace />;
}
