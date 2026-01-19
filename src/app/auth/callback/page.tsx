'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
const ADMIN_DOMAIN = 'myndloop.com';

function CallbackContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        const handleCallback = async () => {
            try {
                // Get the session from Supabase (it handles the OAuth callback internally)
                const { data: { session }, error } = await supabase.auth.getSession();

                if (error || !session) {
                    console.error('Auth callback error:', error);
                    router.push('/login?error=auth_failed');
                    return;
                }

                const user = session.user;
                const email = user.email || '';
                const emailDomain = email.split('@')[1]?.toLowerCase();
                const isAdminDomain = emailDomain === ADMIN_DOMAIN;

                // Store tokens
                localStorage.setItem('access_token', session.access_token);
                localStorage.setItem('refresh_token', session.refresh_token);
                localStorage.setItem('user', JSON.stringify(user));

                // If @myndloop.com user, register them as pending admin
                if (isAdminDomain) {
                    try {
                        // Call our API to register/sync the OAuth user
                        const response = await fetch(`${API_BASE_URL}/api/auth/oauth-sync`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${session.access_token}`,
                            },
                            body: JSON.stringify({
                                user_id: user.id,
                                email: user.email,
                                first_name: user.user_metadata?.full_name?.split(' ')[0] || user.user_metadata?.name?.split(' ')[0] || '',
                                last_name: user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || '',
                                is_admin_domain: true,
                            }),
                        });

                        const data = await response.json();

                        if (data.pending_approval) {
                            // User needs approval
                            router.push('/admin/signup?pending=true');
                            return;
                        }

                        if (data.status === 'pending') {
                            router.push('/admin/signup?pending=true');
                            return;
                        }
                    } catch (err) {
                        console.error('OAuth sync error:', err);
                    }
                }

                // Redirect to dashboard
                router.push('/dashboard');
            } catch (err) {
                console.error('Callback error:', err);
                router.push('/login?error=auth_failed');
            }
        };

        handleCallback();
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

export default function AuthCallbackPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        }>
            <CallbackContent />
        </Suspense>
    );
}
