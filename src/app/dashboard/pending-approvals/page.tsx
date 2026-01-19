'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Loader2, UserCheck, UserX, Clock, RefreshCw } from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

interface PendingRequest {
    id: string;
    user_id: string;
    email: string;
    first_name: string;
    last_name: string;
    full_name: string;
    requested_at: string;
}

export default function PendingApprovalsPage() {
    const router = useRouter();
    const [requests, setRequests] = useState<PendingRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);

    const fetchRequests = async () => {
        const token = localStorage.getItem('access_token');
        if (!token) {
            router.push('/login');
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/api/users/pending`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.status === 403) {
                toast.error('Access denied. Super admin privileges required.');
                router.push('/dashboard');
                return;
            }

            if (!response.ok) {
                throw new Error('Failed to fetch pending requests');
            }

            const data = await response.json();
            setRequests(data);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to load pending requests');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const handleApprove = async (userId: string) => {
        const token = localStorage.getItem('access_token');
        if (!token) return;

        setProcessingId(userId);

        try {
            const response = await fetch(`${API_BASE_URL}/api/users/${userId}/approve`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to approve user');
            }

            toast.success('User approved successfully');
            setRequests(requests.filter(r => r.user_id !== userId));
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to approve user');
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async (userId: string) => {
        const token = localStorage.getItem('access_token');
        if (!token) return;

        setProcessingId(userId);

        try {
            const response = await fetch(`${API_BASE_URL}/api/users/${userId}/reject`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ reason: 'Rejected by admin' }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to reject user');
            }

            toast.success('User rejected');
            setRequests(requests.filter(r => r.user_id !== userId));
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to reject user');
        } finally {
            setProcessingId(null);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Pending Approvals</h1>
                    <p className="text-muted-foreground">
                        Review and approve admin registration requests
                    </p>
                </div>
                <Button variant="outline" size="sm" onClick={fetchRequests}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                </Button>
            </div>

            {requests.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <Clock className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium mb-2">No Pending Requests</h3>
                        <p className="text-muted-foreground text-center">
                            There are no admin registration requests waiting for approval.
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4">
                    {requests.map((request) => (
                        <Card key={request.id}>
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <CardTitle className="text-lg">
                                            {request.full_name || 'Unknown User'}
                                        </CardTitle>
                                        <CardDescription>{request.email}</CardDescription>
                                    </div>
                                    <Badge variant="secondary" className="ml-2">
                                        Pending
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between">
                                    <p className="text-sm text-muted-foreground">
                                        Requested: {formatDate(request.requested_at)}
                                    </p>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleReject(request.user_id)}
                                            disabled={processingId === request.user_id}
                                        >
                                            {processingId === request.user_id ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <>
                                                    <UserX className="h-4 w-4 mr-1" />
                                                    Reject
                                                </>
                                            )}
                                        </Button>
                                        <Button
                                            size="sm"
                                            onClick={() => handleApprove(request.user_id)}
                                            disabled={processingId === request.user_id}
                                        >
                                            {processingId === request.user_id ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <>
                                                    <UserCheck className="h-4 w-4 mr-1" />
                                                    Approve
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
