'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Building2, Users, CheckCircle, ArrowRight, ArrowLeft } from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

const steps = [
    { id: 1, title: 'Organization', icon: Building2 },
    { id: 2, title: 'Team', icon: Users },
    { id: 3, title: 'Get Started', icon: CheckCircle },
];

export default function OnboardingPage() {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);

    const [orgData, setOrgData] = useState({
        name: '',
        slug: '',
        description: '',
    });

    const [invites, setInvites] = useState([
        { email: '', role: 'viewer' },
    ]);

    const handleCreateOrg = async () => {
        if (!orgData.name || !orgData.slug) {
            toast.error('Please fill in organization name and slug');
            return;
        }

        setIsLoading(true);
        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch(`${API_BASE_URL}/api/organizations`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(orgData),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || data.message || 'Failed to create organization');
            }

            localStorage.setItem('current_org', JSON.stringify(data));
            toast.success('Organization created!');
            setCurrentStep(2);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to create organization');
        } finally {
            setIsLoading(false);
        }
    };

    const handleInviteTeam = () => {
        const validInvites = invites.filter(i => i.email.trim());
        if (validInvites.length > 0) {
            toast.success(`${validInvites.length} invitation(s) will be sent`);
        }
        setCurrentStep(3);
    };

    const addInviteField = () => {
        setInvites([...invites, { email: '', role: 'viewer' }]);
    };

    const updateInvite = (index: number, field: 'email' | 'role', value: string) => {
        const updated = [...invites];
        updated[index][field] = value;
        setInvites(updated);
    };

    const goToDashboard = () => {
        router.push('/dashboard');
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8">
            <div className="w-full max-w-2xl">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary flex items-center justify-center">
                        <span className="text-2xl font-bold text-primary-foreground">S</span>
                    </div>
                    <h1 className="text-2xl font-bold">Welcome to ScholarBee</h1>
                    <p className="text-muted-foreground mt-2">Let&apos;s set up your organization</p>
                </div>

                {/* Progress Steps */}
                <div className="flex justify-center mb-8">
                    <div className="flex items-center gap-2">
                        {steps.map((step, index) => (
                            <div key={step.id} className="flex items-center">
                                <div
                                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${currentStep >= step.id
                                            ? 'bg-primary text-primary-foreground'
                                            : 'bg-muted text-muted-foreground'
                                        }`}
                                >
                                    <step.icon className="h-4 w-4" />
                                    <span className="hidden sm:inline">{step.title}</span>
                                </div>
                                {index < steps.length - 1 && (
                                    <div className={`w-8 h-0.5 mx-2 ${currentStep > step.id ? 'bg-primary' : 'bg-border'
                                        }`} />
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Step Content */}
                <Card>
                    {/* Step 1: Organization Details */}
                    {currentStep === 1 && (
                        <>
                            <CardHeader>
                                <CardTitle>Organization Details</CardTitle>
                                <CardDescription>
                                    Set up your organization to manage exams and team members
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="orgName">Organization Name</Label>
                                    <Input
                                        id="orgName"
                                        placeholder="ABC High School"
                                        value={orgData.name}
                                        onChange={(e) => setOrgData({ ...orgData, name: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="slug">URL Slug</Label>
                                    <div className="flex">
                                        <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 bg-muted text-muted-foreground text-sm">
                                            scholarbee.com/
                                        </span>
                                        <Input
                                            id="slug"
                                            placeholder="abc-high-school"
                                            value={orgData.slug}
                                            onChange={(e) => setOrgData({
                                                ...orgData,
                                                slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-')
                                            })}
                                            className="rounded-l-none"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="description">Description (optional)</Label>
                                    <Textarea
                                        id="description"
                                        placeholder="Brief description of your organization"
                                        value={orgData.description}
                                        onChange={(e) => setOrgData({ ...orgData, description: e.target.value })}
                                        rows={3}
                                    />
                                </div>

                                <Button onClick={handleCreateOrg} className="w-full" disabled={isLoading}>
                                    {isLoading ? 'Creating...' : 'Continue'}
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </CardContent>
                        </>
                    )}

                    {/* Step 2: Invite Team */}
                    {currentStep === 2 && (
                        <>
                            <CardHeader>
                                <CardTitle>Invite Team Members</CardTitle>
                                <CardDescription>
                                    Add colleagues to help manage exams (you can skip this for now)
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {invites.map((invite, index) => (
                                    <div key={index} className="flex gap-2">
                                        <Input
                                            type="email"
                                            placeholder="colleague@example.com"
                                            value={invite.email}
                                            onChange={(e) => updateInvite(index, 'email', e.target.value)}
                                            className="flex-1"
                                        />
                                        <select
                                            value={invite.role}
                                            onChange={(e) => updateInvite(index, 'role', e.target.value)}
                                            className="px-3 py-2 rounded-md border bg-background text-foreground"
                                        >
                                            <option value="viewer">Viewer</option>
                                            <option value="exam_manager">Exam Manager</option>
                                            <option value="question_author">Question Author</option>
                                        </select>
                                    </div>
                                ))}

                                <Button variant="outline" onClick={addInviteField} className="w-full">
                                    + Add another
                                </Button>

                                <div className="flex gap-2 pt-4">
                                    <Button variant="outline" onClick={() => setCurrentStep(1)}>
                                        <ArrowLeft className="mr-2 h-4 w-4" />
                                        Back
                                    </Button>
                                    <Button onClick={handleInviteTeam} className="flex-1">
                                        Continue
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </>
                    )}

                    {/* Step 3: Complete */}
                    {currentStep === 3 && (
                        <>
                            <CardHeader className="text-center">
                                <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-green-500/20 flex items-center justify-center">
                                    <CheckCircle className="h-8 w-8 text-green-500" />
                                </div>
                                <CardTitle>You&apos;re all set!</CardTitle>
                                <CardDescription>
                                    Your organization is ready. Start creating exams and managing candidates.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid gap-3">
                                    <div className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                                        <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center">
                                            <Building2 className="h-5 w-5 text-primary" />
                                        </div>
                                        <div>
                                            <p className="font-medium">Create your first exam</p>
                                            <p className="text-sm text-muted-foreground">Set up an assessment for your students</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                                        <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center">
                                            <Users className="h-5 w-5 text-primary" />
                                        </div>
                                        <div>
                                            <p className="font-medium">Build question banks</p>
                                            <p className="text-sm text-muted-foreground">Create reusable question pools</p>
                                        </div>
                                    </div>
                                </div>

                                <Button onClick={goToDashboard} className="w-full">
                                    Go to Dashboard
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </CardContent>
                        </>
                    )}
                </Card>
            </div>
        </div>
    );
}
