/**
 * Clean drawings of the channel screens (not screenshots), one per step, with the exact place to tap ringed.
 * Button names are the platforms' English labels from their help pages (checked 05.11.2026); the Hebrew
 * interface may show translated labels, which the step text says.
 */
import React from 'react';

const Hot = ({ children, tag = 'span', className = '', label = 'כאן' }) => {
  const T = tag;
  return (
    <T className={`chm-hot ${className}`}>
      {children}
      <b className="chm-tap" dir="rtl">{label}</b>
    </T>
  );
};
const Line = ({ w = '60%' }) => <span className="chm-line" style={{ width: w }} />;
const Bar = ({ url }) => (
  <div className="chm-bar"><span className="chm-dots"><i /><i /><i /></span><span className="chm-url" dir="ltr">{url}</span></div>
);
const Grid = ({ n = 21, busy = [3, 4, 5, 12, 13] }) => (
  <div className="chm-grid">{Array.from({ length: n }, (_, i) => <span key={i} className={busy.includes(i) ? 'is-busy' : ''} />)}</div>
);

function Modal({ title, children }) {
  return (
    <div className="chm-modal"><p className="chm-h">{title}</p>{children}</div>
  );
}

const SCREENS = {
  'a-open': () => (<>
    <Bar url="airbnb.com/hosting/calendar" />
    <div className="chm-tabs" dir="ltr"><span>Today</span><Hot className="is-tab">Calendar</Hot><span>Listings</span><span>Messages</span></div>
    <div className="chm-body" dir="ltr"><span className="chm-chip">▾ My listing</span><Grid /></div>
  </>),
  'a-avail': () => (<>
    <Bar url="airbnb.com/hosting/calendar" />
    <div className="chm-split" dir="ltr">
      <Grid n={15} busy={[2, 3, 9]} />
      <div className="chm-side"><span>Pricing</span><Hot className="is-row">Availability</Hot></div>
    </div>
  </>),
  'a-connect': () => (<>
    <Bar url="airbnb.com/hosting/calendar" />
    <div className="chm-body" dir="ltr">
      <p className="chm-h">Availability</p>
      <span className="chm-row">Trip length</span><span className="chm-row">Advance notice</span>
      <p className="chm-h chm-mt">Connect calendars</p>
      <Hot className="is-btn">Connect to another website</Hot>
    </div>
  </>),
  'a-copy': () => (<>
    <Bar url="airbnb.com/hosting/calendar" />
    <div className="chm-body" dir="ltr">
      <Modal title="Connect to another website">
        <span className="chm-lbl">Airbnb calendar link</span>
        <div className="chm-field-row"><span className="chm-field is-link">https://www.airbnb.com/calendar/ical/….ics</span><Hot className="is-btn is-sm">Copy</Hot></div>
        <span className="chm-lbl chm-dim">Calendar address (URL)</span><span className="chm-field chm-dim" />
      </Modal>
    </div>
  </>),
  'a-import': () => (<>
    <Bar url="airbnb.com/hosting/calendar" />
    <div className="chm-body" dir="ltr">
      <Modal title="Connect to another website">
        <span className="chm-lbl">Calendar address (URL)</span>
        <Hot className="is-field" label="הדביקו">https://…/ical-export?t=…</Hot>
        <span className="chm-lbl">Calendar name</span><span className="chm-field">atlas</span>
        <span className="chm-btn">Add calendar</span>
      </Modal>
    </div>
  </>),
  'b-open': () => (<>
    <Bar url="admin.booking.com" />
    <div className="chm-nav" dir="ltr"><span>Home</span><Hot className="is-tab is-dark">Rates &amp; Availability</Hot><span>Reservations</span></div>
    <div className="chm-body" dir="ltr">
      <div className="chm-menu"><span>Calendar</span><Hot className="is-row">Sync calendars</Hot><span>Rate plans</span></div>
    </div>
  </>),
  'b-add': () => (<>
    <Bar url="admin.booking.com/…/sync" />
    <div className="chm-body" dir="ltr">
      <p className="chm-h">Sync calendars</p>
      <div className="chm-unit"><span>Room 1</span><Hot className="is-btn is-sm">Add calendar connection</Hot></div>
      <div className="chm-unit chm-dim"><span>Room 2</span><span className="chm-btn is-sm">Add calendar connection</span></div>
    </div>
  </>),
  'b-skip': () => (<>
    <Bar url="admin.booking.com/…/sync" />
    <div className="chm-body" dir="ltr">
      <Modal title="Import calendar">
        <span className="chm-lbl chm-dim">Calendar link</span><span className="chm-field chm-dim" />
        <div className="chm-foot"><Hot className="is-link">Skip to export</Hot><span className="chm-btn chm-dim">Next step</span></div>
      </Modal>
    </div>
  </>),
  'b-copy': () => (<>
    <Bar url="admin.booking.com/…/sync" />
    <div className="chm-body" dir="ltr">
      <Modal title="Export calendar">
        <span className="chm-lbl">Name</span><span className="chm-field">atlas</span>
        <div className="chm-field-row"><span className="chm-field is-link">https://ical.booking.com/v1/export?t=…</span><Hot className="is-btn is-sm">Copy link</Hot></div>
      </Modal>
    </div>
  </>),
  'b-import': () => (<>
    <Bar url="admin.booking.com/…/sync" />
    <div className="chm-body" dir="ltr">
      <Modal title="Import calendar">
        <span className="chm-lbl">Calendar link</span>
        <Hot className="is-field" label="הדביקו">https://…/ical-export?t=…</Hot>
        <span className="chm-lbl">Name</span><span className="chm-field">atlas</span>
        <div className="chm-foot"><span className="chm-link">Skip to export</span><span className="chm-btn">Next step</span></div>
      </Modal>
    </div>
  </>),
  'o-copy': () => (<>
    <Bar url="…/calendar/settings" />
    <div className="chm-body" dir="ltr">
      <p className="chm-h">Export calendar · iCal</p><Line w="70%" />
      <div className="chm-field-row"><span className="chm-field is-link">https://…/calendar.ics</span><Hot className="is-btn is-sm">Copy</Hot></div>
    </div>
  </>),
  'o-import': () => (<>
    <Bar url="…/calendar/settings" />
    <div className="chm-body" dir="ltr">
      <p className="chm-h">Import calendar · iCal</p>
      <Hot className="is-field" label="הדביקו">https://…/ical-export?t=…</Hot>
      <span className="chm-btn">Save</span>
    </div>
  </>),
};

export default function ScreenMock({ id, caption }) {
  const S = SCREENS[id];
  if (!S) return null;
  return (
    <figure className="chm" aria-hidden="false">
      <div className="chm-frame" role="img" aria-label={caption || 'איור של המסך בערוץ'}><S /></div>
      <figcaption className="chm-cap">איור להמחשה. אצלכם הכפתורים יכולים להופיע גם בעברית.</figcaption>
    </figure>
  );
}
