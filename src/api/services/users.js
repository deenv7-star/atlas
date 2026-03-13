/**
 * /api/users — User & profile service
 */

import { base44 } from '@/api/base44Client';

/**
 * Returns the current authenticated user's profile, including
 * organization details.
 */
export async function getCurrentUser() {
  return base44.auth.me();
}

/**
 * Update the current user's profile fields.
 * @param {object} data  e.g. { full_name, phone, profile_image }
 */
export async function updateCurrentUser(data) {
  return base44.auth.updateMe(data);
}

/**
 * Sign up a new user.
 * @param {object} params
 * @param {string} params.email
 * @param {string} params.password
 * @param {string} [params.full_name]
 * @param {string} [params.organization_name]
 */
export async function signUp({ email, password, full_name, organization_name }) {
  return base44.auth.signUp({ email, password, full_name, organization_name });
}

/**
 * Sign in an existing user.
 * @param {object} params
 * @param {string} params.email
 * @param {string} params.password
 */
export async function signIn({ email, password }) {
  return base44.auth.signIn({ email, password });
}

/**
 * Sign out the current user.
 */
export async function signOut() {
  return base44.auth.logout();
}
