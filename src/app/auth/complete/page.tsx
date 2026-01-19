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
                        const response = await fetch(`${API_BASE_URL}/api/users/me`, {
                            headers: {
                                'Authorization': `Bearer ${tokenData.access_token}`,
                            },
                        });

                        if (response.ok) {
                            const userData = await response.json();

                            // If first_name or last_name is missing, redirect to onboarding
                            if (!userData.first_name || !userData.last_name) {
                                router.push(`/onboarding?redirect_to=${encodeURIComponent(redirectTo)}`);
                                return;
                            }

                            // Update local user data with complete profile
                            localStorage.setItem('user', JSON.stringify({
                                id: userData.id,
                                email: userData.email,
                                first_name: userData.first_name,
                                last_name: userData.last_name,
                            }));
                        }
                    } catch (err) {
                        console.warn('Could not fetch user profile, continuing...', err);
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
