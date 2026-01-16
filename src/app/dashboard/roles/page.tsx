'use client';

import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Search, MoreHorizontal, Plus } from 'lucide-react';
import { toast } from 'sonner';

interface Permission {
    id: string;
    name: string;
    description: string | null;
    resource_type: string | null;
    action: string | null;
    created_at: string;
}

export default function RolesPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [permissionSearch, setPermissionSearch] = useState('');
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [newPermission, setNewPermission] = useState({
        name: '',
        description: '',
        resource_type: '',
        action: '',
    });

    const roles = [
        {
            id: '1',
            name: 'Member',
            description: 'The default user role',
            slug: 'member',
            permissions: [],
            isSystem: true
        },
        {
            id: '2',
            name: 'Admin',
            description: 'Access to manage all available resources',
            slug: 'admin',
            permissions: [],
            isSystem: true
        },
    ];

    // Fetch permissions
    const fetchPermissions = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/permissions`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                }
            );
            if (response.ok) {
                const data = await response.json();
                setPermissions(data.permissions || []);
            }
        } catch (error) {
            console.error('Failed to fetch permissions:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchPermissions();
    }, []);

    // Filter permissions by search
    const filteredPermissions = permissions.filter(p =>
        p.name.toLowerCase().includes(permissionSearch.toLowerCase()) ||
        p.description?.toLowerCase().includes(permissionSearch.toLowerCase())
    );

    // Create permission handler
    const handleCreatePermission = async () => {
        if (!newPermission.name) {
            toast.error('Permission name is required');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/permissions`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(newPermission),
                }
            );

            if (response.ok) {
                toast.success('Permission created');
                setCreateDialogOpen(false);
                setNewPermission({ name: '', description: '', resource_type: '', action: '' });
                fetchPermissions();
            } else {
                const data = await response.json();
                toast.error(data.error || 'Failed to create permission');
            }
        } catch (error) {
            toast.error('Failed to create permission');
        }
    };

    // Delete permission handler
    const handleDeletePermission = async (id: string) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/permissions/${id}`,
                {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                }
            );

            if (response.ok) {
                toast.success('Permission deleted');
                fetchPermissions();
            } else {
                toast.error('Failed to delete permission');
            }
        } catch (error) {
            toast.error('Failed to delete permission');
        }
    };

    return (
        <div className="flex h-[calc(100vh-4rem)]">
            {/* Left Sidebar - Navigation */}
            <Tabs defaultValue="roles" className="flex flex-row flex-1" orientation="vertical">
                <div className="w-64 bg-background py-6">
                    <div className="px-4 mb-2">
                        <h2 className="text-sm font-semibold text-foreground px-2">Roles & Permissions</h2>
                        <div className="mt-2 space-y-1">
                            <TabsList className="flex flex-col w-full h-auto bg-transparent p-0 space-y-1">
                                <TabsTrigger
                                    value="roles"
                                    className="w-full justify-start h-8 px-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 data-[state=active]:bg-accent data-[state=active]:text-foreground data-[state=active]:shadow-none rounded-md transition-colors"
                                >
                                    Roles
                                </TabsTrigger>
                                <TabsTrigger
                                    value="permissions"
                                    className="w-full justify-start h-8 px-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 data-[state=active]:bg-accent data-[state=active]:text-foreground data-[state=active]:shadow-none rounded-md transition-colors"
                                >
                                    Permissions
                                </TabsTrigger>
                                <TabsTrigger
                                    value="configuration"
                                    className="w-full justify-start h-8 px-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 data-[state=active]:bg-accent data-[state=active]:text-foreground data-[state=active]:shadow-none rounded-md transition-colors"
                                >
                                    Configuration
                                </TabsTrigger>
                            </TabsList>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 overflow-auto bg-background">
                    <TabsContent value="roles" className="h-full p-0 border-none m-0 data-[state=active]:flex flex-col">
                        <div className="p-8 max-w-6xl space-y-8">
                            {/* Header */}
                            <div>
                                <h1 className="text-2xl font-semibold tracking-tight text-foreground">Roles</h1>
                                <p className="text-muted-foreground mt-1 text-sm">
                                    Define and manage roles that can be assigned to users within your applications.
                                </p>
                            </div>

                            {/* Toolbar */}
                            <div className="flex items-center justify-between gap-4">
                                <div className="relative flex-1 max-w-xl">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search roles..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-9 h-10 bg-muted/20 border-input/50 focus-visible:bg-background transition-colors"
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button variant="outline" className="h-9">
                                        Edit priority
                                    </Button>
                                    <Button className="h-9 bg-primary hover:bg-primary/90">
                                        Create role
                                    </Button>
                                </div>
                            </div>

                            {/* Table */}
                            <div className="border rounded-md overflow-hidden bg-card/50">
                                <Table>
                                    <TableHeader className="bg-muted/50">
                                        <TableRow className="hover:bg-transparent border-b border-border/50">
                                            <TableHead className="w-[30%] h-10 text-xs font-medium uppercase tracking-wider text-muted-foreground pl-4">Name</TableHead>
                                            <TableHead className="w-[20%] h-10 text-xs font-medium uppercase tracking-wider text-muted-foreground">Slug</TableHead>
                                            <TableHead className="h-10 text-xs font-medium uppercase tracking-wider text-muted-foreground">Permissions</TableHead>
                                            <TableHead className="w-[100px] h-10"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {roles.map((role) => (
                                            <TableRow key={role.id} className="hover:bg-muted/40 border-b border-border/50 last:border-0 h-[53px]">
                                                <TableCell className="py-2 pl-4 align-middle">
                                                    <div className="flex flex-col gap-0.5">
                                                        <span className="font-medium text-sm text-foreground leading-tight">{role.name}</span>
                                                        <span className="text-muted-foreground text-[11px] leading-tight">{role.description}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-2 align-middle">
                                                    <Badge variant="secondary" className="font-mono text-[11px] rounded-sm bg-secondary/50 text-foreground border-transparent px-1.5 py-0.5 font-medium">
                                                        {role.slug}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="py-2 align-middle">
                                                    <span className="text-sm text-muted-foreground">None</span>
                                                </TableCell>
                                                <TableCell className="py-2 align-middle text-right pr-4">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Badge variant="outline" className="text-xs font-normal text-muted-foreground h-6 border-muted-foreground/30">
                                                            Default
                                                        </Badge>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                            <span className="sr-only">Actions</span>
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    </TabsContent>

                    {/* Permissions Tab */}
                    <TabsContent value="permissions" className="h-full p-0 border-none m-0 data-[state=active]:flex flex-col">
                        <div className="p-8 max-w-6xl space-y-8">
                            {/* Header */}
                            <div>
                                <h1 className="text-2xl font-semibold tracking-tight text-foreground">Permissions</h1>
                                <p className="text-muted-foreground mt-1 text-sm">
                                    Define and manage permissions that can gate features within your applications.
                                </p>
                            </div>

                            {/* Toolbar */}
                            <div className="flex items-center justify-between gap-4">
                                <div className="relative flex-1 max-w-xl">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search permissions..."
                                        value={permissionSearch}
                                        onChange={(e) => setPermissionSearch(e.target.value)}
                                        className="pl-9 h-10 bg-muted/20 border-input/50 focus-visible:bg-background transition-colors"
                                    />
                                </div>
                                <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button className="h-9 bg-primary hover:bg-primary/90">
                                            <Plus className="h-4 w-4 mr-2" />
                                            Create permission
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Create Permission</DialogTitle>
                                            <DialogDescription>
                                                Add a new permission to gate features in your applications.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="space-y-4 py-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="name">Name (Slug)</Label>
                                                <Input
                                                    id="name"
                                                    placeholder="e.g., user.read or org:manage"
                                                    value={newPermission.name}
                                                    onChange={(e) => setNewPermission({ ...newPermission, name: e.target.value })}
                                                />
                                                <p className="text-xs text-muted-foreground">
                                                    Use format: resource.action or resource:action
                                                </p>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="description">Description</Label>
                                                <Input
                                                    id="description"
                                                    placeholder="What does this permission allow?"
                                                    value={newPermission.description}
                                                    onChange={(e) => setNewPermission({ ...newPermission, description: e.target.value })}
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="resource_type">Resource Type</Label>
                                                    <Input
                                                        id="resource_type"
                                                        placeholder="e.g., user, org, exam"
                                                        value={newPermission.resource_type}
                                                        onChange={(e) => setNewPermission({ ...newPermission, resource_type: e.target.value })}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="action">Action</Label>
                                                    <Input
                                                        id="action"
                                                        placeholder="e.g., read, write, delete"
                                                        value={newPermission.action}
                                                        onChange={(e) => setNewPermission({ ...newPermission, action: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                                                Cancel
                                            </Button>
                                            <Button onClick={handleCreatePermission}>
                                                Create
                                            </Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            </div>

                            {/* Table */}
                            <div className="border rounded-md overflow-hidden bg-card/50">
                                <Table>
                                    <TableHeader className="bg-muted/50">
                                        <TableRow className="hover:bg-transparent border-b border-border/50">
                                            <TableHead className="w-[40%] h-10 text-xs font-medium uppercase tracking-wider text-muted-foreground pl-4">Name</TableHead>
                                            <TableHead className="w-[30%] h-10 text-xs font-medium uppercase tracking-wider text-muted-foreground">Slug</TableHead>
                                            <TableHead className="w-[15%] h-10 text-xs font-medium uppercase tracking-wider text-muted-foreground"></TableHead>
                                            <TableHead className="w-[80px] h-10"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {isLoading ? (
                                            <TableRow>
                                                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                                    Loading permissions...
                                                </TableCell>
                                            </TableRow>
                                        ) : filteredPermissions.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                                    No permissions found
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            filteredPermissions.map((permission) => (
                                                <TableRow key={permission.id} className="hover:bg-muted/40 border-b border-border/50 last:border-0 h-[53px]">
                                                    <TableCell className="py-2 pl-4 align-middle">
                                                        <div className="flex flex-col gap-0.5">
                                                            <span className="font-medium text-sm text-foreground leading-tight capitalize">
                                                                {permission.description || permission.name.replace(/[._:]/g, ' ')}
                                                            </span>
                                                            <span className="text-muted-foreground text-[11px] leading-tight">
                                                                {permission.description ? '' : `${permission.resource_type || 'N/A'} → ${permission.action || 'N/A'}`}
                                                            </span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="py-2 align-middle">
                                                        <Badge variant="secondary" className="font-mono text-[11px] rounded-sm bg-secondary/50 text-foreground border-transparent px-1.5 py-0.5 font-medium">
                                                            {permission.name}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="py-2 align-middle">
                                                        <Badge variant="outline" className="text-xs font-normal text-muted-foreground h-6 border-muted-foreground/30">
                                                            System
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="py-2 align-middle text-right pr-4">
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                                                                    <MoreHorizontal className="h-4 w-4" />
                                                                    <span className="sr-only">Actions</span>
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuItem
                                                                    className="text-destructive focus:text-destructive"
                                                                    onClick={() => handleDeletePermission(permission.id)}
                                                                >
                                                                    Delete
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="configuration" className="h-full p-8 border-none m-0">
                        <div>
                            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Configuration</h1>
                            <p className="text-muted-foreground mt-1 text-sm">
                                Manage global settings for roles and permissions.
                            </p>
                            <div className="mt-8">
                                <p className="text-muted-foreground">Configuration content goes here...</p>
                            </div>
                        </div>
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    );
}

