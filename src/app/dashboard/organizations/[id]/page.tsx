'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import {
    ChevronRight,
    CheckCircle2,
    Users,
    Mail,
    Shield,
    FileText
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

interface Organization {
    id: string;
    name: string;
    slug: string;
    created_at: string;
    member_count?: number;
    allow_parent_questions_view?: boolean;
    is_system_org?: boolean;
}

export default function OrganizationDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const orgId = params.id as string;

    const [organization, setOrganization] = useState<Organization | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [name, setName] = useState('');
    const [slug, setSlug] = useState('');
    const [allowParentQuestionsView, setAllowParentQuestionsView] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isSuperAdmin, setIsSuperAdmin] = useState(false);

    useEffect(() => {
        const fetchOrg = async () => {
            try {
                const token = localStorage.getItem('access_token');

                // Check for super_admin role from stored user data or token
                if (token) {
                    try {
                        // First check user data from localStorage
                        const userStr = localStorage.getItem('user');
                        if (userStr) {
                            const user = JSON.parse(userStr);
                            // Check if user has super_admin role in any org
                            if (user.roles && Array.isArray(user.roles)) {
                                const hasSuperAdmin = user.roles.some(
                                    (r: { role_name?: string; name?: string }) =>
                                        r.role_name === 'super_admin' || r.name === 'super_admin'
                                );
                                if (hasSuperAdmin) {
                                    setIsSuperAdmin(true);
                                }
                            }
                        }
                    } catch (e) {
                        console.error('User data parse failed', e);
                    }
                }

                const response = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/organizations/${orgId}`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                if (response.ok) {
                    const data = await response.json();
                    setOrganization(data);
                    setName(data.name);
                    setSlug(data.slug);
                    setAllowParentQuestionsView(data.allow_parent_questions_view || false);
                }
            } catch (error) {
                console.error('Failed to fetch organization:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchOrg();
    }, [orgId]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/organizations/${orgId}`,
                {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        name,
                        slug,
                        allow_parent_questions_view: allowParentQuestionsView
                    })
                }
            );

            if (response.ok) {
                const updatedOrg = await response.json();
                setOrganization(updatedOrg);
                toast.success('Organization updated successfully');
            } else {
                const errorData = await response.json();
                toast.error(errorData.error || 'Failed to update organization');
            }
        } catch (error) {
            console.error('Update failed:', error);
            toast.error('An unexpected error occurred');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this organization? This action cannot be undone.')) return;

        setIsDeleting(true);
        // TODO: Implement delete API call
        // setTimeout(() => router.push('/dashboard/organizations'), 1000);
        setIsDeleting(false);
    };

    if (isLoading) {
        return <div className="p-8 text-center text-muted-foreground">Loading organization...</div>;
    }

    if (!organization) {
        return <div className="p-8 text-center text-destructive">Organization not found</div>;
    }

    return (
        <div className="flex flex-col h-full min-h-[calc(100vh-4rem)]">
            {/* Header Area */}
            <div className="px-8 py-6 w-full max-w-6xl mx-auto">
                <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                    <Link href="/dashboard/organizations" className="hover:text-foreground transition-colors">
                        Organizations
                    </Link>
                    <ChevronRight className="h-4 w-4" />
                    <span className="text-foreground">Organization details</span>
                </nav>

                <div className="flex items-start gap-5">
                    <div className="h-14 w-14 rounded-xl bg-white flex items-center justify-center border border-white/10 text-black font-semibold text-2xl shrink-0">
                        {organization.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="space-y-1">
                        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{organization.name}</h1>
                        <div className="flex items-center gap-3">
                            <Badge variant="outline" className="font-mono text-[10px] text-muted-foreground bg-secondary/50 border-border/40 font-normal px-1.5 py-0 h-5 rounded-md">
                                {organization.id}
                            </Badge>
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-transparent px-0 h-5">
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                                <span>No domain</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs & Content Area */}
            <div className="flex-1 px-8 w-full max-w-6xl mx-auto pb-8">
                <TabsPrimitive.Root defaultValue="settings" className="w-full space-y-6">
                    <TabsPrimitive.List className="flex w-full justify-start border-b border-border/40 space-x-8">
                        {['Settings', 'Users', 'Invites', 'Roles', 'Audit Logs'].map((tab) => (
                            <TabsPrimitive.Trigger
                                key={tab}
                                value={tab.toLowerCase().split(' ')[0]}
                                className={cn(
                                    "relative h-10 px-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                                    "data-[state=active]:text-foreground data-[state=active]:after:absolute data-[state=active]:after:bottom-[-1px] data-[state=active]:after:left-0 data-[state=active]:after:h-[2px] data-[state=active]:after:w-full data-[state=active]:after:bg-primary"
                                )}
                            >
                                {tab}
                            </TabsPrimitive.Trigger>
                        ))}
                    </TabsPrimitive.List>

                    {/* Settings Tab */}
                    <TabsPrimitive.Content value="settings" className="space-y-8 max-w-4xl pt-2 focus-visible:outline-none">
                        <Card className="shadow-sm">
                            <CardHeader className="pb-4">
                                <CardTitle className="text-base font-medium">Organization details</CardTitle>
                            </CardHeader>
                            <Separator className="bg-border/40" />
                            <CardContent className="pt-6 space-y-6">
                                <div className="grid gap-2 max-w-md">
                                    <Label htmlFor="name" className="text-sm font-normal text-muted-foreground">Name</Label>
                                    <Input
                                        id="name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="bg-background border-border/40 focus-visible:ring-primary/50 h-9"
                                    />
                                </div>
                                <div className="grid gap-2 max-w-md">
                                    <Label htmlFor="slug" className="text-sm font-normal text-muted-foreground">Slug</Label>
                                    <Input
                                        id="slug"
                                        value={slug}
                                        onChange={(e) => setSlug(e.target.value)}
                                        className="bg-muted/50 border-border/40 font-mono text-sm text-muted-foreground focus-visible:ring-primary/50 h-9"
                                        disabled
                                    />
                                </div>

                                {isSuperAdmin && !organization.is_system_org && (
                                    <div className="flex flex-row items-center justify-between rounded-lg border border-border/40 p-4 max-w-md">
                                        <div className="space-y-0.5">
                                            <Label className="text-base">Parent Questions</Label>
                                            <div className="text-sm text-muted-foreground">
                                                Allow viewing questions from parent organization
                                            </div>
                                        </div>
                                        <Switch
                                            checked={allowParentQuestionsView}
                                            onCheckedChange={async (checked) => {
                                                setAllowParentQuestionsView(checked);
                                                try {
                                                    const token = localStorage.getItem('access_token');
                                                    const response = await fetch(
                                                        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/organizations/${orgId}`,
                                                        {
                                                            method: 'PUT',
                                                            headers: {
                                                                'Authorization': `Bearer ${token}`,
                                                                'Content-Type': 'application/json'
                                                            },
                                                            body: JSON.stringify({
                                                                allow_parent_questions_view: checked
                                                            })
                                                        }
                                                    );

                                                    if (response.ok) {
                                                        const updatedOrg = await response.json();
                                                        setOrganization(updatedOrg);
                                                        toast.success('Settings updated');
                                                    } else {
                                                        const errorData = await response.json();
                                                        toast.error(errorData.error || 'Failed to update settings');
                                                        // Revert state on error
                                                        setAllowParentQuestionsView(!checked);
                                                    }
                                                } catch (error) {
                                                    console.error('Update failed:', error);
                                                    toast.error('An unexpected error occurred');
                                                    setAllowParentQuestionsView(!checked);
                                                }
                                            }}
                                        />
                                    </div>
                                )}
                            </CardContent>
                            <CardFooter className="py-3 px-6 bg-muted/20 border-t border-border/40 flex justify-between items-center">
                                <div className="text-xs text-muted-foreground">
                                    Last updated on {new Date(organization.created_at).toLocaleDateString()}
                                </div>
                                <Button size="sm" onClick={handleSave} disabled={isSaving} className="h-8">
                                    {isSaving ? 'Saving...' : 'Save changes'}
                                </Button>
                            </CardFooter>
                        </Card>

                    </TabsPrimitive.Content>

                    {/* Placeholder Tabs */}
                    <TabsPrimitive.Content value="users" className="pt-2 focus-visible:outline-none">
                        <div className="flex items-center justify-center p-12 border border-dashed border-border/40 rounded-lg">
                            <span className="text-muted-foreground">Users module coming soon</span>
                        </div>
                    </TabsPrimitive.Content>

                    <TabsPrimitive.Content value="invites" className="pt-2 focus-visible:outline-none">
                        <div className="flex items-center justify-center p-12 border border-dashed border-border/40 rounded-lg">
                            <span className="text-muted-foreground">Invites module coming soon</span>
                        </div>
                    </TabsPrimitive.Content>

                    <TabsPrimitive.Content value="roles" className="pt-2 focus-visible:outline-none">
                        <div className="flex items-center justify-center p-12 border border-dashed border-border/40 rounded-lg">
                            <span className="text-muted-foreground">Roles module coming soon</span>
                        </div>
                    </TabsPrimitive.Content>

                    <TabsPrimitive.Content value="audit" className="pt-2 focus-visible:outline-none">
                        <div className="flex items-center justify-center p-12 border border-dashed border-border/40 rounded-lg">
                            <span className="text-muted-foreground">Audit logs coming soon</span>
                        </div>
                    </TabsPrimitive.Content>
                </TabsPrimitive.Root>
            </div>
        </div>
    );
}
