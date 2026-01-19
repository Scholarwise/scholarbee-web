'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

function CompleteAuthContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        const token = searchParams.get('token');
        const redirectTo = searchParams.get('redirect_to') || '/dashboard';
        const error = searchParams.get('error');
        const message = searchParams.get('message');

        if (error) {
            router.push(`/login?error=${error}`);
            return;
        }

        if (message) {
            router.push(`/login?message=${message}`);
            return;
        }

        if (!token) {
            router.push('/login?error=invalid_token');
            return;
        }

        try {
            // Decode the token (base64 encoded JSON)
            const tokenData = JSON.parse(atob(token));

            // Store tokens if present
            if (tokenData.access_token) {
                localStorage.setItem('access_token', tokenData.access_token);
            }
            if (tokenData.refresh_token) {
                localStorage.setItem('refresh_token', tokenData.refresh_token);
            }
            if (tokenData.user_id && tokenData.email) {
                localStorage.setItem('user', JSON.stringify({
                    id: tokenData.user_id,
                    email: tokenData.email,
                }));
            }

            // Redirect to the intended destination
            router.push(redirectTo);
        } catch (err) {
            console.error('Token decode error:', err);
            router.push('/login?error=invalid_token');
        }
    }, [router, searchParams]);

    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground">Completing sign in...</p>
            </div>
        </div>
    );
}

export default function CompleteAuthPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        }>
            <CompleteAuthContent />
        </Suspense>
    );
}
