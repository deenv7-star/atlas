/**
 * /ai-assistant: "שאלו את atlas". A calm, centred 720px column (version A).
 * Everything real lives in src/assistant/: the snapshot (facts.js), the first insight and one-tap
 * questions (insights.js), streaming to the ai-chat edge function (api.js) and the shared UI (ui.jsx).
 */
import React, { useEffect } from 'react';
import { Conversation } from '@/assistant/ui';
import { AtlasFace } from '@/components/mascot/AtlasFace.jsx';
import { useAssistantFacts } from '@/assistant/useAssistant';

export default function AIAssistantPage({ user, orgId: orgIdProp }) {
  const orgId = orgIdProp ?? user?.organization_id ?? user?.org_id ?? null;
  const { facts, loading } = useAssistantFacts(orgId);
  useEffect(() => { // lets CSS move the help button out of the composer's corner on phones
    document.documentElement.setAttribute('data-assistant-page', '');
    return () => document.documentElement.removeAttribute('data-assistant-page');
  }, []);
  return (
    <div className="px-0 pt-2 lg:pt-4">
      <Conversation
        facts={facts}
        loading={loading}
        page="/ai-assistant"
        variant="page"
        autoFocus
        header={({ clear, hasThread }) => (
          <header className={`as-head${hasThread ? ' has-thread' : ''}`}>
            <AtlasFace live size={48} className="as-head-face" />
            <div className="as-head-txt">
              <h1>שאלו את atlas</h1>
              <p>תשובות מההזמנות, הכסף והלידים שלכם.</p>
            </div>
            {hasThread ? <button type="button" className="as-new" onClick={clear}>שיחה חדשה</button> : null}
          </header>
        )}
      />
    </div>
  );
}
