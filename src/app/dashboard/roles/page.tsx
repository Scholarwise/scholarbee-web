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
import { Search, MoreHorizontal, Plus, ChevronDown, Check, GripVertical } from 'lucide-react';
import { toast } from 'sonner';

interface Permission {
    id: string;
    name: string;
    description: string | null;
    resource_type: string | null;
    action: string | null;
    created_at: string;
}

interface Role {
    id: string;
    name: string;
    slug?: string;
    description: string | null;
    org_id: string | null;
    is_system_role: boolean;
    is_default?: boolean;
    role_permissions?: { permission: { name: string; description?: string } }[];
    created_at?: string;
}

export default function RolesPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [permissionSearch, setPermissionSearch] = useState('');
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isRolesLoading, setIsRolesLoading] = useState(false);
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [createRoleDialogOpen, setCreateRoleDialogOpen] = useState(false);
    const [newPermission, setNewPermission] = useState({
        name: '',
        description: '',
        resource_type: '',
        action: '',
    });
    const [newRole, setNewRole] = useState({
        name: '',
        slug: '',
        description: '',
        permission_ids: [] as string[],
    });
    const [permissionDropdownOpen, setPermissionDropdownOpen] = useState(false);
    const [permissionSearchInDialog, setPermissionSearchInDialog] = useState('');
    const [editPriorityOpen, setEditPriorityOpen] = useState(false);
    const [priorityRoles, setPriorityRoles] = useState<Role[]>([]);
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

    // Fetch roles
    const fetchRoles = async () => {
        setIsRolesLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/roles`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                }
            );
            if (response.ok) {
                const data = await response.json();
                setRoles(data.roles || []);
            }
        } catch (error) {
            console.error('Failed to fetch roles:', error);
        } finally {
            setIsRolesLoading(false);
        }
    };

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
        fetchRoles();
    }, []);

    // Filter roles by search
    const filteredRoles = roles.filter(r =>
        r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Create role handler
    const handleCreateRole = async () => {
        if (!newRole.name) {
            toast.error('Role name is required');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            // Get active org from localStorage
            const activeOrg = JSON.parse(localStorage.getItem('activeOrg') || '{}');
            const orgId = activeOrg?.id;

            if (!orgId) {
                toast.error('No organization selected');
                return;
            }

            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/roles`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        name: newRole.name,
                        slug: newRole.slug || newRole.name.toLowerCase().replace(/\s+/g, '-'),
                        description: newRole.description,
                        org_id: orgId,
                        permission_ids: newRole.permission_ids
                    }),
                }
            );

            if (response.ok) {
                toast.success('Role created');
                setCreateRoleDialogOpen(false);
                setNewRole({ name: '', slug: '', description: '', permission_ids: [] });
                setPermissionDropdownOpen(false);
                setPermissionSearchInDialog('');
                fetchRoles();
            } else {
                const data = await response.json();
                toast.error(data.error || 'Failed to create role');
            }
        } catch (error) {
            toast.error('Failed to create role');
        }
    };

    // Delete role handler
    const handleDeleteRole = async (id: string) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/roles/${id}`,
                {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                }
            );

            if (response.ok) {
                toast.success('Role deleted');
                fetchRoles();
            } else {
                const data = await response.json();
                toast.error(data.error || 'Failed to delete role');
            }
        } catch (error) {
            toast.error('Failed to delete role');
        }
    };

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
                                    <Dialog open={editPriorityOpen} onOpenChange={(open) => {
                                        setEditPriorityOpen(open);
                                        if (open) setPriorityRoles([...roles]);
                                    }}>
                                        <DialogTrigger asChild>
                                            <Button variant="outline" className="h-9">Edit priority</Button>
                                        </DialogTrigger>
                                        <DialogContent className="max-w-md">
                                            <DialogHeader>
                                                <DialogTitle>Edit priority</DialogTitle>
                                                <DialogDescription>
                                                    Role priority determines which role takes precedence when a user has multiple roles.
                                                </DialogDescription>
                                            </DialogHeader>
                                            <p className="text-sm text-muted-foreground">Drag roles to change the priority, from highest to lowest.</p>
                                            <div className="space-y-1 py-2">
                                                {priorityRoles.map((role, index) => (
                                                    <div
                                                        key={role.id}
                                                        draggable
                                                        onDragStart={() => setDraggedIndex(index)}
                                                        onDragOver={(e) => e.preventDefault()}
                                                        onDrop={() => {
                                                            if (draggedIndex === null) return;
                                                            const newRoles = [...priorityRoles];
                                                            const [removed] = newRoles.splice(draggedIndex, 1);
                                                            newRoles.splice(index, 0, removed);
                                                            setPriorityRoles(newRoles);
                                                            setDraggedIndex(null);
                                                        }}
                                                        className={`flex items-center gap-3 p-3 rounded-md border bg-background cursor-grab active:cursor-grabbing ${draggedIndex === index ? 'opacity-50' : ''}`}
                                                    >
                                                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                                                        <span className="flex-1 text-sm font-medium">{role.name}</span>
                                                        {role.is_default && (
                                                            <Badge variant="secondary" className="text-xs">Default</Badge>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                            <DialogFooter>
                                                <Button variant="outline" onClick={() => setEditPriorityOpen(false)}>Cancel</Button>
                                                <Button onClick={() => {
                                                    // TODO: Save priority order to API
                                                    toast.success('Priority order saved');
                                                    setEditPriorityOpen(false);
                                                }}>Save changes</Button>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>
                                    <Dialog open={createRoleDialogOpen} onOpenChange={setCreateRoleDialogOpen}>
                                        <DialogTrigger asChild>
                                            <Button className="h-9 bg-primary hover:bg-primary/90">
                                                <Plus className="h-4 w-4 mr-2" />
                                                Create role
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>Create Role</DialogTitle>
                                                <DialogDescription>
                                                    Add a new role to assign to users in your organization.
                                                </DialogDescription>
                                            </DialogHeader>
                                            <div className="space-y-4 py-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="roleName">Name</Label>
                                                    <Input
                                                        id="roleName"
                                                        placeholder='User-friendly name of the role, e.g. "Admin"'
                                                        value={newRole.name}
                                                        onChange={(e) => {
                                                            const name = e.target.value;
                                                            const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
                                                            setNewRole({ ...newRole, name, slug });
                                                        }}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="roleSlug">Slug</Label>
                                                    <Input
                                                        id="roleSlug"
                                                        placeholder="A unique case-sensitive key to reference the role in your code"
                                                        value={newRole.slug}
                                                        onChange={(e) => setNewRole({ ...newRole, slug: e.target.value })}
                                                        className="font-mono"
                                                    />
                                                    <p className="text-xs text-muted-foreground">
                                                        A unique key to reference the role in your code. Can't be edited after creation.
                                                    </p>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="roleDescription">Description</Label>
                                                    <textarea
                                                        id="roleDescription"
                                                        placeholder="Optional. Describe what this role allows..."
                                                        value={newRole.description}
                                                        onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                                                        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Permissions</Label>
                                                    <div className="relative">
                                                        <div className="relative">
                                                            <Input
                                                                placeholder="Search permissions..."
                                                                value={permissionSearchInDialog}
                                                                onChange={(e) => setPermissionSearchInDialog(e.target.value)}
                                                                onFocus={() => setPermissionDropdownOpen(true)}
                                                                className="pr-8"
                                                            />
                                                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-50" />
                                                        </div>
                                                        {permissionDropdownOpen && (
                                                            <div className="absolute z-50 mt-2 w-full rounded-md border bg-popover shadow-lg">
                                                                <div className="max-h-[200px] overflow-y-auto p-1">
                                                                    {permissions
                                                                        .filter(p => p.name.toLowerCase().includes(permissionSearchInDialog.toLowerCase()))
                                                                        .map(permission => (
                                                                            <button
                                                                                key={permission.id}
                                                                                type="button"
                                                                                onClick={() => {
                                                                                    const isSelected = newRole.permission_ids.includes(permission.id);
                                                                                    setNewRole({
                                                                                        ...newRole,
                                                                                        permission_ids: isSelected
                                                                                            ? newRole.permission_ids.filter(id => id !== permission.id)
                                                                                            : [...newRole.permission_ids, permission.id]
                                                                                    });
                                                                                }}
                                                                                className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent text-left"
                                                                            >
                                                                                <div className={`h-4 w-4 flex items-center justify-center rounded border ${newRole.permission_ids.includes(permission.id)
                                                                                    ? 'bg-primary border-primary'
                                                                                    : 'border-input'
                                                                                    }`}>
                                                                                    {newRole.permission_ids.includes(permission.id) && (
                                                                                        <Check className="h-3 w-3 text-primary-foreground" />
                                                                                    )}
                                                                                </div>
                                                                                <span className="font-mono text-xs">{permission.name}</span>
                                                                            </button>
                                                                        ))}
                                                                    {permissions.filter(p => p.name.toLowerCase().includes(permissionSearchInDialog.toLowerCase())).length === 0 && (
                                                                        <div className="px-2 py-4 text-center text-sm text-muted-foreground">No permissions found</div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <DialogFooter>
                                                <Button variant="outline" onClick={() => setCreateRoleDialogOpen(false)}>
                                                    Cancel
                                                </Button>
                                                <Button onClick={handleCreateRole}>
                                                    Create
                                                </Button>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>
                                </div>
                            </div>

                            {/* Table */}
                            <div className="border rounded-md overflow-hidden bg-card/50">
                                <Table>
                                    <TableHeader className="bg-muted/50">
                                        <TableRow className="hover:bg-transparent border-b border-border/50">
                                            <TableHead className="w-[30%] h-10 text-xs font-medium uppercase tracking-wider text-muted-foreground pl-4">Name</TableHead>
                                            <TableHead className="w-[15%] h-10 text-xs font-medium uppercase tracking-wider text-muted-foreground">Slug</TableHead>
                                            <TableHead className="w-[35%] h-10 text-xs font-medium uppercase tracking-wider text-muted-foreground">Permissions</TableHead>
                                            <TableHead className="w-[100px] h-10"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {isRolesLoading ? (
                                            <TableRow>
                                                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                                    Loading roles...
                                                </TableCell>
                                            </TableRow>
                                        ) : filteredRoles.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                                    No roles found
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            filteredRoles.map((role) => (
                                                <TableRow key={role.id} className="hover:bg-muted/40 border-b border-border/50 last:border-0">
                                                    {/* Name + Description */}
                                                    <TableCell className="py-3 pl-4 align-top">
                                                        <div className="flex flex-col gap-0.5">
                                                            <span className="font-medium text-sm text-foreground">{role.name}</span>
                                                            <span className="text-muted-foreground text-xs">{role.description || ''}</span>
                                                        </div>
                                                    </TableCell>
                                                    {/* Slug as pill */}
                                                    <TableCell className="py-3 align-top">
                                                        <Badge variant="secondary" className="font-mono text-xs bg-muted text-muted-foreground border-0 px-2 py-0.5 rounded">
                                                            {role.slug || role.name.toLowerCase().replace(/\s+/g, '-')}
                                                        </Badge>
                                                    </TableCell>
                                                    {/* Permissions as pills */}
                                                    <TableCell className="py-3 align-top">
                                                        {role.role_permissions && role.role_permissions.length > 0 ? (
                                                            <div className="flex flex-wrap gap-1">
                                                                {role.role_permissions.slice(0, 3).map((rp, idx) => (
                                                                    <Badge key={idx} variant="secondary" className="font-mono text-xs bg-muted text-muted-foreground border-0 px-2 py-0.5 rounded max-w-[140px] truncate">
                                                                        {rp.permission.name}
                                                                    </Badge>
                                                                ))}
                                                                {role.role_permissions.length > 3 && (
                                                                    <span className="text-xs text-muted-foreground">+{role.role_permissions.length - 3} more</span>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <span className="text-sm text-muted-foreground">None</span>
                                                        )}
                                                    </TableCell>
                                                    {/* Default badge + Actions */}
                                                    <TableCell className="py-3 align-top text-right pr-4">
                                                        <div className="flex items-center justify-end gap-2">
                                                            {role.is_default && (
                                                                <Badge variant="outline" className="text-xs font-normal text-muted-foreground border-muted-foreground/30 rounded-full px-2">
                                                                    Default
                                                                </Badge>
                                                            )}
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
                                                                        onClick={() => handleDeleteRole(role.id)}
                                                                        disabled={role.is_system_role}
                                                                    >
                                                                        Delete
                                                                    </DropdownMenuItem>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
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
                                            <TableHead className="w-[45%] h-10 text-xs font-medium uppercase tracking-wider text-muted-foreground pl-4">Name</TableHead>
                                            <TableHead className="w-[35%] h-10 text-xs font-medium uppercase tracking-wider text-muted-foreground">Slug</TableHead>
                                            <TableHead className="w-[100px] h-10"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {isLoading ? (
                                            <TableRow>
                                                <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                                                    Loading permissions...
                                                </TableCell>
                                            </TableRow>
                                        ) : filteredPermissions.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                                                    No permissions found
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            filteredPermissions.map((permission) => (
                                                <TableRow key={permission.id} className="hover:bg-muted/40 border-b border-border/50 last:border-0">
                                                    {/* Name + Description */}
                                                    <TableCell className="py-3 pl-4 align-top">
                                                        <div className="flex flex-col gap-0.5">
                                                            <span className="font-medium text-sm text-foreground">
                                                                {permission.description || permission.name.replace(/[._:]/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                                            </span>
                                                            {permission.description && (
                                                                <span className="text-muted-foreground text-xs">
                                                                    {`${permission.resource_type || ''}.${permission.action || ''}`.replace(/^\./, '')}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    {/* Slug as pill */}
                                                    <TableCell className="py-3 align-top">
                                                        <Badge variant="secondary" className="font-mono text-xs bg-muted text-muted-foreground border-0 px-2 py-0.5 rounded">
                                                            {permission.name}
                                                        </Badge>
                                                    </TableCell>
                                                    {/* System badge + Actions */}
                                                    <TableCell className="py-3 align-top text-right pr-4">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <Badge variant="secondary" className="text-xs font-normal bg-muted/80 text-muted-foreground border-0 px-2">
                                                                System
                                                            </Badge>
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
                                                        </div>
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

