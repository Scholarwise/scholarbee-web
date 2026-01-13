'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ChevronRight, Mail, KeyRound, Building2, Trash2 } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { fetchWithAuth } from '@/lib/api';

interface User {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    full_name?: string;
    status: 'active' | 'inactive';
    created_at: string;
    organizations: { id: string; name: string; role?: string }[];
}

export default function UserProfilePage() {
    const params = useParams();
    const router = useRouter();
    const userId = params.id as string;

    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        fetchUser();
    }, [userId]);

    const fetchUser = async () => {
        try {
            const token = localStorage.getItem('access_token');
            const response = await fetchWithAuth(
                `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/users/${userId}`
            );
            if (response.ok) {
                const data = await response.json();
                setUser(data);
            }
        } catch (error) {
            console.error('Failed to fetch user:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            const token = localStorage.getItem('access_token');
            const response = await fetchWithAuth(
                `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/users/${userId}`,
                {
                    method: 'DELETE',
                }
            );
            if (response.ok) {
                router.push('/dashboard/users');
            }
        } catch (error) {
            console.error('Failed to delete user:', error);
        } finally {
            setIsDeleting(false);
            setDeleteDialogOpen(false);
        }
    };

    const getInitials = (firstName: string, lastName: string, email: string) => {
        if (firstName || lastName) {
            return ((firstName?.[0] || '') + (lastName?.[0] || '')).toUpperCase();
        }
        return email[0].toUpperCase();
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
        });
    };

    if (isLoading) {
        return (
            <div className="p-6">
                <p className="text-muted-foreground">Loading...</p>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="p-6">
                <p className="text-destructive">User not found</p>
            </div>
        );
    }

    return (
        <div className="p-6">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
                <Link href="/dashboard/users" className="text-primary hover:underline">
                    Users
                </Link>
                <ChevronRight className="h-4 w-4" />
                <span>User profile</span>
            </nav>

            {/* User Header */}
            <div className="flex items-start gap-4 mb-6">
                <Avatar className="h-16 w-16">
                    <AvatarFallback className="bg-primary/10 text-primary text-xl">
                        {getInitials(user.first_name, user.last_name, user.email)}
                    </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                    <h1 className="text-2xl font-semibold">{user.email}</h1>
                    <div className="flex items-center gap-2 mt-2">
                        <Badge variant="secondary" className="font-mono text-xs">
                            {user.id.slice(0, 20)}...
                        </Badge>
                        <Badge variant="outline">{user.email}</Badge>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="details" className="w-full">
                <TabsList className="mb-6">
                    <TabsTrigger value="details">Details</TabsTrigger>
                    <TabsTrigger value="sessions">Sessions</TabsTrigger>
                    <TabsTrigger value="events">Events</TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="space-y-6">
                    {/* User Details Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">User details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-muted-foreground">First Name</p>
                                    <p className="font-medium">{user.first_name || 'Not set'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Last Name</p>
                                    <p className="font-medium">{user.last_name || 'Not set'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Email address</p>
                                    <div className="flex items-center gap-2">
                                        <p className="font-medium">{user.email}</p>
                                        <Badge
                                            variant={user.status === 'active' ? 'default' : 'secondary'}
                                            className="text-xs"
                                        >
                                            {user.status === 'active' ? 'Verified' : 'Not verified'}
                                        </Badge>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Status</p>
                                    <p className="font-medium capitalize flex items-center gap-2">
                                        <span className={`h-2 w-2 rounded-full ${user.status === 'active' ? 'bg-green-500' : 'bg-gray-400'}`} />
                                        {user.status}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Created</p>
                                    <p className="font-medium">{formatDate(user.created_at)}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Preferred language</p>
                                    <p className="font-medium text-muted-foreground">Not set</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">OAuth profile picture</p>
                                    <p className="font-medium text-muted-foreground">None</p>
                                </div>
                            </div>
                            <Separator />
                            <Button variant="outline">Edit details</Button>
                        </CardContent>
                    </Card>

                    {/* Authentication Methods */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Authentication methods</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="border rounded-lg p-4 flex items-center gap-3">
                                <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                                    <KeyRound className="h-5 w-5 text-muted-foreground" />
                                </div>
                                <span className="font-medium">Email + Password</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Organization Memberships */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Organization memberships</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {user.organizations && user.organizations.length > 0 ? (
                                <div className="space-y-2">
                                    {user.organizations.map((org) => (
                                        <div key={org.id} className="border rounded-lg p-4 flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                                <Building2 className="h-5 w-5 text-primary" />
                                            </div>
                                            <div>
                                                <p className="font-medium">{org.name}</p>
                                                {org.role && (
                                                    <p className="text-sm text-muted-foreground">{org.role}</p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="border rounded-lg p-4">
                                    <p className="text-muted-foreground">
                                        This user isn&apos;t a member of any organizations.
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Danger Zone */}
                    <div>
                        <h3 className="text-lg font-semibold text-destructive mb-4">Danger zone</h3>
                        <Card className="border-destructive/20">
                            <CardContent className="pt-6">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="font-medium">Delete user</p>
                                        <p className="text-sm text-muted-foreground">
                                            Deleting this user is permanent and cannot be undone.
                                        </p>
                                    </div>
                                    <Button
                                        variant="outline"
                                        className="text-destructive border-destructive/50 hover:bg-destructive/10"
                                        onClick={() => setDeleteDialogOpen(true)}
                                    >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Delete user
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="sessions">
                    <Card>
                        <CardContent className="py-8 text-center">
                            <p className="text-muted-foreground">No active sessions</p>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="events">
                    <Card>
                        <CardContent className="py-8 text-center">
                            <p className="text-muted-foreground">No events recorded</p>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete user</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this user? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                            {isDeleting ? 'Deleting...' : 'Delete user'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
