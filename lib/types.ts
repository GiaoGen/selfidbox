/** Shared user type used across client components, navbars, and login page. */
export type AuthUser = {
  id: string;
  email?: string;
  username?: string | null;
};
