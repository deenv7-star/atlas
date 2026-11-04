/** What atlas is doing while a tool runs, said plainly (same lines as the text brain, loop.js). */
import { PERSONA } from '../../../supabase/functions/_shared/brain/persona.js'; // she/we: one switch (ATLAS_PERSON)

const LINES = PERSONA.tools;
export const statusLine = (name) => LINES[name] || PERSONA.checking;

/** The caption under the face for each state. */
export const STATE_LINE = {
  idle: 'כאן בשבילכם', ...PERSONA.states, ended: 'השיחה הסתיימה', error: 'משהו השתבש',
};
/** Face mood per state (AtlasFace moods). */
export const STATE_MOOD = {
  idle: 'neutral', connecting: 'thinking', listening: 'attentive', hearing: 'attentive',
  thinking: 'thinking', speaking: 'happy', ended: 'neutral', error: 'concerned',
};
