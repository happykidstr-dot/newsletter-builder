'use client';
import { SignInButton, UserButton, useUser } from '@clerk/nextjs';

export function AuthBar() {
  const { isSignedIn, isLoaded } = useUser();

  if (!isLoaded) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, right: 0, zIndex: 99999,
      padding: '8px 16px',
      display: 'flex', alignItems: 'center', gap: 10,
    }}>
      {!isSignedIn ? (
        <SignInButton>
          <button style={{
            padding: '8px 20px', borderRadius: 8,
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            color: '#fff', border: 'none', fontWeight: 700,
            fontSize: 13, cursor: 'pointer',
            boxShadow: '0 2px 10px rgba(99,102,241,0.3)',
          }}>
            Giriş Yap
          </button>
        </SignInButton>
      ) : (
        <UserButton
          appearance={{
            elements: {
              avatarBox: { width: 36, height: 36 },
            },
          }}
        />
      )}
    </div>
  );
}
