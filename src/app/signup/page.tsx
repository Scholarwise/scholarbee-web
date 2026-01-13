'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Building2, UserPlus } from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export default function SignupPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [signupType, setSignupType] = useState<'new-tenant' | 'existing-tenant'>('new-tenant');

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        firstName: '',
        lastName: '',
        orgName: '',
        orgSlug: '',
        tenantCode: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.password !== formData.confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        if (formData.password.length < 8) {
            toast.error('Password must be at least 8 characters');
            return;
        }

        setIsLoading(true);

        try {
            const registerResponse = await fetch(`${API_BASE_URL}/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: formData.email,
                    password: formData.password,
                    data: {
                        first_name: formData.firstName,
                        last_name: formData.lastName,
                        signup_type: signupType,
                        ...(signupType === 'new-tenant' && {
                            org_name: formData.orgName,
                            org_slug: formData.orgSlug,
                        }),
                        ...(signupType === 'existing-tenant' && {
                            tenant_code: formData.tenantCode,
                        }),
                    },
                }),
            });

            const data = await registerResponse.json();

            if (!registerResponse.ok) {
                throw new Error(data.error || data.msg || 'Registration failed');
            }

            localStorage.setItem('pending_email', formData.email);
            localStorage.setItem('signup_type', signupType);
            localStorage.setItem('signup_data', JSON.stringify({
                org_name: formData.orgName,
                org_slug: formData.orgSlug,
                first_name: formData.firstName,
                last_name: formData.lastName,
            }));

            toast.success('Check your email for a verification code!');
            router.push(`/verify-email?email=${encodeURIComponent(formData.email)}`);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Registration failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8">
            <Card className="w-full max-w-lg">
                <CardHeader className="space-y-1 text-center">
                    <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary flex items-center justify-center">
                        <span className="text-2xl font-bold text-primary-foreground">S</span>
                    </div>
                    <CardTitle className="text-2xl font-bold">Create your account</CardTitle>
                    <CardDescription>
                        Get started with ScholarBee Assessment Platform
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs value={signupType} onValueChange={(v) => setSignupType(v as 'new-tenant' | 'existing-tenant')}>
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="new-tenant">
                                <Building2 className="mr-2 h-4 w-4" />
                                New Organization
                            </TabsTrigger>
                            <TabsTrigger value="existing-tenant">
                                <UserPlus className="mr-2 h-4 w-4" />
                                Join Existing
                            </TabsTrigger>
                        </TabsList>

                        <form onSubmit={handleSubmit}>
                            <div className="mt-6 space-y-4">
                                <TabsContent value="new-tenant" className="mt-0 space-y-4">
                                    <div className="rounded-lg border bg-card p-4">
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="orgName">Organization Name</Label>
                                                <Input
                                                    id="orgName"
                                                    type="text"
                                                    placeholder="Acme University"
                                                    value={formData.orgName}
                                                    onChange={(e) => setFormData({ ...formData, orgName: e.target.value })}
                                                    required={signupType === 'new-tenant'}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="orgSlug">Organization URL Slug</Label>
                                                <div className="flex">
                                                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 bg-muted text-muted-foreground text-sm">
                                                        scholarbee.com/
                                                    </span>
                                                    <Input
                                                        id="orgSlug"
                                                        type="text"
                                                        placeholder="acme-university"
                                                        value={formData.orgSlug}
                                                        onChange={(e) => setFormData({
                                                            ...formData,
                                                            orgSlug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-')
                                                        })}
                                                        required={signupType === 'new-tenant'}
                                                        className="rounded-l-none"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        You will be the administrator of this organization
                                    </p>
                                </TabsContent>

                                <TabsContent value="existing-tenant" className="mt-0 space-y-4">
                                    <div className="rounded-lg border bg-card p-4">
                                        <h3 className="text-sm font-medium mb-3">Organization Invite</h3>
                                        <div className="space-y-2">
                                            <Label htmlFor="tenantCode">Invitation Code or Organization Slug</Label>
                                            <Input
                                                id="tenantCode"
                                                type="text"
                                                placeholder="Enter invite code or org slug"
                                                value={formData.tenantCode}
                                                onChange={(e) => setFormData({ ...formData, tenantCode: e.target.value })}
                                                required={signupType === 'existing-tenant'}
                                            />
                                        </div>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Contact your organization admin for the invite code
                                    </p>
                                </TabsContent>

                                <Separator className="my-4" />

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="firstName">First Name</Label>
                                        <Input
                                            id="firstName"
                                            placeholder="John"
                                            value={formData.firstName}
                                            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="lastName">Last Name</Label>
                                        <Input
                                            id="lastName"
                                            placeholder="Doe"
                                            value={formData.lastName}
                                            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="name@example.com"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="password">Password</Label>
                                        <Input
                                            id="password"
                                            type="password"
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="confirmPassword">Confirm Password</Label>
                                        <Input
                                            id="confirmPassword"
                                            type="password"
                                            value={formData.confirmPassword}
                                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>

                                <Button type="submit" className="w-full" disabled={isLoading}>
                                    {isLoading ? 'Creating account...' : 'Create account'}
                                </Button>
                            </div>
                        </form>
                    </Tabs>

                    <div className="mt-6 text-center text-sm text-muted-foreground">
                        Already have an account?{' '}
                        <Link href="/login" className="text-primary hover:underline font-medium">
                            Sign in
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
