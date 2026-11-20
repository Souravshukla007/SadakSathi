import { SignJWT, jwtVerify } from 'jose';

let key: Uint8Array | undefined;

/** Checked on first use, not at import: `next build` loads every route in production mode without secrets. */
function secretKey(): Uint8Array {
    if (!key) {
        const secret = process.env.JWT_SECRET;
        if (!secret && process.env.NODE_ENV === 'production') throw new Error('JWT_SECRET must be set in production');
        key = new TextEncoder().encode(secret || 'fallback-secret-key-for-development');
    }
    return key;
}

/** id + role (role is a hint for the edge proxy; APIs re-read it from the DB) + tv (tokenVersion). */
export type TokenPayload = { id: string; role: string; tv: number };

export async function signToken(payload: TokenPayload) {
    return await new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('7d') // 7 days expiration
        .sign(secretKey());
}

export async function verifyToken(token: string) {
    const k = secretKey(); // a missing secret is a server error, not "logged out"
    try {
        const { payload } = await jwtVerify(token, k);
        return payload;
    } catch {
        return null;
    }
}
