'use client';

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, MoreHorizontal } from 'lucide-react';

export default function RolesPage() {
    const [searchQuery, setSearchQuery] = useState('');

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

                    <TabsContent value="permissions" className="h-full p-8 border-none m-0">
                        <div>
                            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Permissions</h1>
                            <p className="text-muted-foreground mt-1 text-sm">
                                View all system permissions available for key resources.
                            </p>
                            <div className="mt-8">
                                <p className="text-muted-foreground">Permissions content goes here...</p>
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
