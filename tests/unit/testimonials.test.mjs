import test from 'node:test';
import assert from 'node:assert/strict';
import { BETA_TESTIMONIALS, visibleTestimonials } from '../../src/config/testimonials.js';

test('ships empty: no testimonial is published before a real one exists', () => {
  assert.equal(BETA_TESTIMONIALS.length, 0);
  assert.deepEqual(visibleTestimonials(), []);
});

test('only complete, consented quotes render', () => {
  const ok = { quote: 'סוף סוף אני רואה את כל ההזמנות במקום אחד.', name: 'רונית ל.', role: 'בעלת מתחם', consent: true };
  assert.deepEqual(visibleTestimonials([ok]), [ok]);
  assert.deepEqual(visibleTestimonials([{ ...ok, consent: false }]), []);
  assert.deepEqual(visibleTestimonials([{ ...ok, consent: 'yes' }]), []);
  assert.deepEqual(visibleTestimonials([{ ...ok, quote: '   ' }]), []);
  assert.deepEqual(visibleTestimonials([{ ...ok, quote: 'מעולה' }]), []);
  assert.deepEqual(visibleTestimonials([{ ...ok, name: '' }]), []);
  assert.deepEqual(visibleTestimonials([{ ...ok, role: undefined }]), []);
  assert.deepEqual(visibleTestimonials(null), []);
});
