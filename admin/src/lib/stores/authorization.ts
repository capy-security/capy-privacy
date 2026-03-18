import { writable, derived, get } from 'svelte/store';
import { browser } from '$app/environment';
import { jwtDecode } from 'jwt-decode';
// User status types
export type UserStatus = 'valid' | 'expired' | 'invalid';

// Profile extracted from JWT token
export interface UserProfile {
    id: string;
    email: string;
    display_name: string;
    role: number; // 0, 1, 2 - maps to admin, user, etc.
    expires_at: Date;
}

// User model
export interface User {
    status: UserStatus;
    authenticated: boolean;
    token: string | null;
    profile: UserProfile | null;
}

// JWT payload structure
interface JWTPayload {
    sub?: string;
    email?: string;
    display_name?: string;
    role?: number;
    exp?: number;
    iat?: number;
    [key: string]: unknown;
}

const STORAGE_KEY = 'auth_user';

// Empty user state
const emptyUser: User = {
    status: 'invalid',
    authenticated: false,
    token: null,
    profile: null,
};

/**
 * Decode JWT token and extract profile
 */
function decodeToken(token: string): UserProfile | null {
    try {
        const decoded = jwtDecode<JWTPayload>(token);

        if (!decoded.exp) {
            return null;
        }

        return {
            id: decoded.sub || '',
            email: decoded.email || '',
            display_name: decoded.display_name || decoded.sub || '',
            role: decoded.role ?? 0,
            expires_at: new Date(decoded.exp * 1000),
        };
    } catch (error) {
        console.error('[authorization] Failed to decode token:', error);
        return null;
    }
}

/**
 * Check if token is expired
 */
function isTokenExpired(expiresAt: Date): boolean {
    const now = new Date();
    const bufferMs = 30 * 1000; // 30 second buffer
    return expiresAt.getTime() <= (now.getTime() + bufferMs);
}

/**
 * Validate token and determine status
 */
function validateToken(user: User): UserStatus {
    if (!user.token || !user.profile) {
        return 'invalid';
    }

    if (isTokenExpired(user.profile.expires_at)) {
        return 'expired';
    }

    return 'valid';
}

/**
 * Load user from localStorage
 */
function loadUser(): User {
    if (!browser) return emptyUser;

    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            const user = JSON.parse(stored) as User;

            // Reconstruct profile with Date object
            if (user.token && user.profile) {
                user.profile.expires_at = new Date(user.profile.expires_at);

                // Re-decode token to ensure profile is up to date
                const profile = decodeToken(user.token);
                if (profile) {
                    user.profile = profile;
                } else {
                    return emptyUser;
                }
            }

            // Validate token status
            user.status = validateToken(user);
            user.authenticated = user.status === 'valid';

            return user;
        }
    } catch (error) {
        console.error('[authorization] Failed to load user:', error);
    }

    return emptyUser;
}

/**
 * Save user to localStorage
 */
function saveUser(user: User): void {
    if (!browser) return;

    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } catch (error) {
        console.error('[authorization] Failed to save user:', error);
    }
}

/**
 * Create authentication store
 */
function createAuthStore() {
    const baseStore = writable<User>(loadUser());

    // Derived store that validates token on each access (read-only, doesn't update baseStore)
    // const validatedStore = derived(baseStore, (user) => {
    //     if (user.authenticated && user.token && user.profile) {
    //         const status = validateToken(user);
    //         // Return updated status without triggering baseStore update to avoid infinite loop
    //         // The status will be updated when explicitly needed via checkTokenValidity()
    //         if (status !== user.status) {
    //             return {
    //                 ...user,
    //                 status,
    //                 authenticated: status === 'valid',
    //             };
    //         }
    //     }
    //     return user;
    // });

    return {
        // subscribe: validatedStore.subscribe,
        subscribe: baseStore.subscribe,

        /**
         * Persist session after a successful token mutation (e.g. login on the login page).
         */
        applyToken(token: string): void {
            try {
                const profile = decodeToken(token);
                if (!profile) {
                    throw new Error('Failed to decode token');
                }
                const newUser: User = {
                    status: 'valid',
                    authenticated: true,
                    token,
                    profile,
                };
                baseStore.set(newUser);
                saveUser(newUser);
            } catch {
                baseStore.set(emptyUser);
                saveUser(emptyUser);
                throw new Error('Failed to establish session');
            }
        },

        /**
         * Logout function
         */
        logout: (): void => {
            baseStore.set(emptyUser);
            saveUser(emptyUser);
        },

        /**
         * Update token validity - check if not expired or invalid
         */
        checkTokenValidity: (): void => {
            const currentUser = get(baseStore);
            if (currentUser.token && currentUser.profile) {
                const status = validateToken(currentUser);
                const updatedUser: User = {
                    ...currentUser,
                    status,
                    authenticated: status === 'valid',
                };

                baseStore.set(updatedUser);
                saveUser(updatedUser);
            } else if (currentUser.authenticated) {
                // Token missing but user marked as authenticated - invalidate
                baseStore.set(emptyUser);
                saveUser(emptyUser);
            }
        },
    };
}

export const authorizationStore = createAuthStore();

