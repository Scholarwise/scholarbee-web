'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Search, UserPlus, Mail, ChevronRight } from 'lucide-react';
import { CreateUserDialog } from '@/components/users/create-user-dialog';
import { InviteUserDialog } from '@/components/users/invite-user-dialog';

interface User {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    full_name?: string;
    organizations: { id: string; name: string }[];
    status: 'active' | 'inactive';
    sign_in_count: number;
    last_sign_in: string | null;
    created_at: string;
}

interface Invitation {
    id: string;
    email: string;
    org_name: string;
    created_at: string;
    expires_at: string;
}

export default function UsersPage() {
    const router = useRouter();
    const [users, setUsers] = useState<User[]>([]);
    const [invitations, setInvitations] = useState<Invitation[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [isLoading, setIsLoading] = useState(true);
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [inviteDialogOpen, setInviteDialogOpen] = useState(false);

    const fetchUsers = async () => {
        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/users`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (response.ok) {
                const data = await response.json();
                setUsers(Array.isArray(data) ? data : data.users || []);
            }
        } catch (error) {
            console.error('Failed to fetch users:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchInvitations = async () => {
        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/invitations`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (response.ok) {
                const data = await response.json();
                setInvitations(Array.isArray(data) ? data : data.invitations || []);
            }
        } catch (error) {
            console.error('Failed to fetch invitations:', error);
        }
    };

    useEffect(() => {
        fetchUsers();
        fetchInvitations();
    }, []);

    const filteredUsers = users.filter((user) => {
        const matchesSearch =
            user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (user.first_name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
            (user.last_name?.toLowerCase() || '').includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const getInitials = (name: string, email: string) => {
        if (name) {
            return name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2);
        }
        return email[0].toUpperCase();
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return '-';
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

    return (
        <div className="p-6">
            <h1 className="text-2xl font-semibold mb-6">Users</h1>

            <Tabs defaultValue="users" className="w-full">
                <TabsList className="mb-4">
                    <TabsTrigger value="users">Users</TabsTrigger>
                    <TabsTrigger value="invitations">Invitations</TabsTrigger>
                </TabsList>

                <TabsContent value="users" className="space-y-4">
                    {/* Search and filters */}
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2 flex-1 max-w-md">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-[130px]">
                                    <SelectValue placeholder="+ Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="inactive">Inactive</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <Button onClick={() => setCreateDialogOpen(true)}>
                            <UserPlus className="h-4 w-4 mr-2" />
                            Create user
                        </Button>
                    </div>

                    {/* Users table */}
                    <div className="border rounded-lg">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Organizations</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Sign-in count</TableHead>
                                    <TableHead>Last sign-in</TableHead>
                                    <TableHead>Created ↓</TableHead>
                                    <TableHead></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center py-8">
                                            Loading...
                                        </TableCell>
                                    </TableRow>
                                ) : filteredUsers.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center py-8">
                                            No users found
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredUsers.map((user) => (
                                        <TableRow
                                            key={user.id}
                                            className="cursor-pointer hover:bg-muted/50"
                                            onClick={() => router.push(`/dashboard/users/${user.id}`)}
                                        >
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-8 w-8 rounded-full">
                                                        <AvatarFallback className="rounded-full">
                                                            {user.first_name?.[0]}{user.last_name?.[0]}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    {user.first_name} {user.last_name}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {user.organizations?.length > 0 ? (
                                                    <span className="text-primary">
                                                        {user.organizations.map((o) => o.name).join(', ')}
                                                    </span>
                                                ) : (
                                                    <span className="text-muted-foreground">None</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={user.status === 'active' ? 'success' : 'secondary'}
                                                    className="capitalize"
                                                >
                                                    {user.status || 'inactive'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>{user.sign_in_count || 0}</TableCell>
                                            <TableCell>{formatDate(user.last_sign_in)}</TableCell>
                                            <TableCell>{formatDate(user.created_at)}</TableCell>
                                            <TableCell>
                                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </TabsContent>

                <TabsContent value="invitations" className="space-y-4">
                    {/* Search and invite button */}
                    <div className="flex items-center justify-between gap-4">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by email"
                                className="pl-9"
                            />
                        </div>
                        <Button onClick={() => setInviteDialogOpen(true)}>
                            <Mail className="h-4 w-4 mr-2" />
                            Invite user
                        </Button>
                    </div>

                    {/* Invitations list */}
                    <div className="border rounded-lg p-8">
                        {invitations.length === 0 ? (
                            <div className="flex flex-col items-center justify-center text-center py-8">
                                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
                                    <Mail className="h-6 w-6 text-muted-foreground" />
                                </div>
                                <p className="text-muted-foreground">
                                    No invitations have been created in this environment
                                </p>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Organization</TableHead>
                                        <TableHead>Created</TableHead>
                                        <TableHead>Expires</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {invitations.map((inv) => (
                                        <TableRow key={inv.id}>
                                            <TableCell>{inv.email}</TableCell>
                                            <TableCell>{inv.org_name}</TableCell>
                                            <TableCell>{formatDate(inv.created_at)}</TableCell>
                                            <TableCell>{formatDate(inv.expires_at)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </div>
                </TabsContent>
            </Tabs>

            <CreateUserDialog
                open={createDialogOpen}
                onOpenChange={setCreateDialogOpen}
                onSuccess={() => {
                    fetchUsers();
                    setCreateDialogOpen(false);
                }}
            />

            <InviteUserDialog
                open={inviteDialogOpen}
                onOpenChange={setInviteDialogOpen}
                onSuccess={() => {
                    fetchInvitations();
                    setInviteDialogOpen(false);
                }}
            />
        </div>
    );
}
