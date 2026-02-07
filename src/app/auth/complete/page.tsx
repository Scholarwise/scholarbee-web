'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

function CompleteAuthContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [status, setStatus] = useState('Completing sign in...');

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

        const processToken = async () => {
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

                // Check if user profile is complete (has first_name and last_name)
                setStatus('Checking profile...');

                if (tokenData.access_token) {
                    try {
                        console.log('[auth/complete] Fetching user profile...');
                        const response = await fetch(`${API_BASE_URL}/api/users/me`, {
                            headers: {
                                'Authorization': `Bearer ${tokenData.access_token}`,
                            },
                        });

                        console.log('[auth/complete] Response status:', response.status, response.ok);

                        if (response.ok) {
                            const userData = await response.json();
                            console.log('[auth/complete] User data:', userData);
                            console.log('[auth/complete] first_name:', userData.first_name, '| last_name:', userData.last_name);

                            // If first_name or last_name is missing, redirect to onboarding with Google name pre-fill
                            if (!userData.first_name || !userData.last_name) {
                                console.log('[auth/complete] Profile incomplete, redirecting to onboarding');
                                const params = new URLSearchParams({
                                    redirect_to: redirectTo,
                                    first_name: tokenData.given_name || '',
                                    last_name: tokenData.family_name || '',
                                });
                                router.push(`/onboarding?${params.toString()}`);
                                return;
                            }

                            console.log('[auth/complete] Profile complete, updating localStorage');
                            // Update local user data with complete profile including roles
                            localStorage.setItem('user', JSON.stringify({
                                id: userData.id,
                                email: userData.email,
                                first_name: userData.first_name,
                                last_name: userData.last_name,
                                roles: userData.roles || [],
                            }));
                        } else {
                            console.warn('[auth/complete] Response not ok, status:', response.status);
                        }
                    } catch (err) {
                        console.warn('[auth/complete] Could not fetch user profile, error:', err);
                    }
                }

                // Redirect to the intended destination
                router.push(redirectTo);
            } catch (err) {
                console.error('Token decode error:', err);
                router.push('/login?error=invalid_token');
            }
        };

        processToken();
    }, [router, searchParams]);

    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground">{status}</p>
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
