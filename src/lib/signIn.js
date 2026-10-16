import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';

// Opens the platform's secure sign-in screen, which handles both logging in and
// creating a new account, and returns the visitor to the Matches page.
export const signIn = () => base44.auth.redirectToLogin(createPageUrl('Home'));