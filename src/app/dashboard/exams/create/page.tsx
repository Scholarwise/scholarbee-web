'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useOrganizations } from '@/contexts/organizations-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { ChevronLeft, ChevronRight, Check, Calendar, Clock, Plus, X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

const steps = [
    { id: 1, title: 'Basic Details', description: 'Enter the main information for the exam' },
    { id: 2, title: 'Settings', description: 'Configure duration and attempts' },
    { id: 3, title: 'Scheduling', description: 'Add exam date and time slots' },
    { id: 4, title: 'Review', description: 'Review and confirm details' },
];

export default function CreateExamPage() {
    const router = useRouter();
    // Use organizations from context (cached)
    const { organizations } = useOrganizations();

    const [currentStep, setCurrentStep] = useState(1);
    const [isSystemUser, setIsSystemUser] = useState(false);
    const [userOrgName, setUserOrgName] = useState('');

    const [formData, setFormData] = useState({
        title: '',
        code: '',
        organization: '',
        description: '',
        duration: 60,
        passingPercentage: 50,
        maxAttempts: 1,
        status: 'draft',
    });

    // Scheduling slots state
    interface ExamSlot {
        date: string;
        startTime: string;
        endTime: string;
    }
    const [slots, setSlots] = useState<ExamSlot[]>([]);
    const [newSlotDate, setNewSlotDate] = useState('');
    const [newSlotStart, setNewSlotStart] = useState('09:00');
    const [newSlotEnd, setNewSlotEnd] = useState('11:00');

    React.useEffect(() => {
        const userData = localStorage.getItem('user');
        const currentOrgData = localStorage.getItem('current_org');

        if (userData) {
            try {
                const user = JSON.parse(userData);
                const metadata = user.user_metadata || {};
                const globalRole = metadata.role || '';
                const email = user.email || '';

                // Default to user's home org
                let targetOrgSlug = metadata.org_slug || 'abc-school';
                let targetOrgName = metadata.org_name || 'ABC School';

                // Check global admin status
                const isGlobalAdmin = globalRole === 'super_admin' || targetOrgSlug === 'system' || email.endsWith('@scholarbee.com');

                // If user has explicitly switched organizations, respect that context
                if (currentOrgData) {
                    const currentOrg = JSON.parse(currentOrgData);
                    targetOrgSlug = currentOrg.slug;
                    targetOrgName = currentOrg.name;
                }

                // Determine effective system context
                // Only treat as system user if they are a global admin AND in the system org context
                const isSystemContext = targetOrgSlug === 'system';
                const canSelectOrg = isGlobalAdmin && isSystemContext;

                setIsSystemUser(canSelectOrg);
                setUserOrgName(targetOrgName);

                if (!canSelectOrg) {
                    setFormData(prev => ({ ...prev, organization: targetOrgSlug }));
                } else {
                    // If in system mode and creating new, default to 'system'
                    setFormData(prev => ({ ...prev, organization: 'system' }));
                }
            } catch (e) {
                console.error('Failed to parse user/org data', e);
            }
        }
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSelectChange = (name: string, value: string) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Slot management functions
    const addSlot = () => {
        if (!newSlotDate) {
            toast.error('Please select a date');
            return;
        }
        if (newSlotStart >= newSlotEnd) {
            toast.error('End time must be after start time');
            return;
        }
        // Check for duplicate slot
        const exists = slots.some(
            s => s.date === newSlotDate && s.startTime === newSlotStart
        );
        if (exists) {
            toast.error('This slot already exists');
            return;
        }
        setSlots(prev => [...prev, { date: newSlotDate, startTime: newSlotStart, endTime: newSlotEnd }]);
        // Reset inputs for next slot
        setNewSlotStart('09:00');
        setNewSlotEnd('11:00');
    };

    const removeSlot = (index: number) => {
        setSlots(prev => prev.filter((_, i) => i !== index));
    };

    // Format date for display
    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr + 'T00:00:00');
        return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    };

    const handleNext = () => {
        if (currentStep < steps.length) {
            setCurrentStep(prev => prev + 1);
        }
    };

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep(prev => prev - 1);
        } else {
            router.back();
        }
    };

    const handleSubmit = async () => {
        try {
            const token = localStorage.getItem('access_token');
            if (!token) {
                toast.error('Authentication error: No login token found');
                return;
            }

            const payload = {
                title: formData.title,
                code: formData.code,
                organization: formData.organization,
                description: formData.description,
                duration: Number(formData.duration),
                passingPercentage: Number(formData.passingPercentage),
                maxAttempts: Number(formData.maxAttempts),
                status: formData.status,
                slots: slots,
            };

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/exams`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                toast.success('Exam created successfully');
                router.push('/dashboard/exams');
            } else {
                const error = await response.json();
                console.error('Failed to create exam:', error);
                toast.error(error.error || 'Failed to create exam');
            }
        } catch (err) {
            console.error('Error submitting form:', err);
            toast.error('Details submission failed');
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)] p-8 max-w-4xl mx-auto w-full space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-semibold tracking-tight text-foreground">Create New Exam</h1>
                <p className="text-muted-foreground mt-1 text-sm">
                    Follow the steps below to setup a new examination.
                </p>
            </div>

            {/* Stepper */}
            <div className="flex items-center justify-between relative mb-8">
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-muted -z-10" />
                {steps.map((step) => {
                    const isActive = step.id === currentStep;
                    const isCompleted = step.id < currentStep;

                    return (
                        <div key={step.id} className="flex flex-col items-center gap-2 bg-background px-4 z-10">
                            <div
                                className={`flex items-center justify-center w-8 h-8 rounded-full border-2 text-sm font-semibold transition-colors ${isActive
                                    ? 'border-primary bg-primary text-primary-foreground'
                                    : isCompleted
                                        ? 'border-primary bg-background text-primary'
                                        : 'border-muted-foreground/30 text-muted-foreground'
                                    }`}
                            >
                                {isCompleted ? <Check className="h-4 w-4" /> : step.id}
                            </div>
                            <span className={`text-xs font-medium ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                                {step.title}
                            </span>
                        </div>
                    );
                })}
            </div>

            {/* Content Card */}
            <Card className="flex-1 flex flex-col border-border/50 shadow-sm">
                <CardHeader>
                    <CardTitle>{steps[currentStep - 1].title}</CardTitle>
                    <CardDescription>{steps[currentStep - 1].description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 pt-4">

                    {/* Step 1: Basic Details */}
                    {currentStep === 1 && (
                        <div className="flex flex-col gap-6">
                            <div className="grid gap-2">
                                <Label htmlFor="title">Exam Title</Label>
                                <Input
                                    id="title"
                                    name="title"
                                    placeholder="e.g. Mid-Term Mathematics"
                                    value={formData.title}
                                    onChange={handleInputChange}
                                    className="h-8"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="code">Exam Code</Label>
                                    <Input
                                        id="code"
                                        name="code"
                                        placeholder="e.g. MATH-101"
                                        value={formData.code}
                                        onChange={handleInputChange}
                                        className="h-8"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="organization">Organization</Label>
                                    {isSystemUser ? (
                                        <Select
                                            value={formData.organization}
                                            onValueChange={(val) => handleSelectChange('organization', val)}
                                        >
                                            <SelectTrigger id="organization" className="h-8">
                                                <SelectValue placeholder="Select Organization" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="system">System</SelectItem>
                                                {organizations
                                                    .filter(org => org.slug !== 'system')
                                                    .map(org => (
                                                        <SelectItem key={org.id} value={org.slug}>
                                                            {org.name}
                                                        </SelectItem>
                                                    ))}
                                            </SelectContent>
                                        </Select>
                                    ) : (
                                        <Input
                                            id="organization"
                                            value={userOrgName || formData.organization}
                                            disabled
                                            className="h-8 bg-muted text-muted-foreground"
                                        />
                                    )}
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    name="description"
                                    placeholder="Enter exam description and instructions..."
                                    className="min-h-[120px] resize-none"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                />
                            </div>
                        </div>
                    )}

                    {/* Step 2: Settings */}
                    {
                        currentStep === 2 && (
                            <div className="flex flex-col gap-6 max-w-lg">
                                <div className="grid gap-2">
                                    <Label htmlFor="duration">Duration (minutes)</Label>
                                    <Input
                                        id="duration"
                                        name="duration"
                                        type="number"
                                        value={formData.duration}
                                        onChange={handleInputChange}
                                        className="h-8"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="passingPercentage">Passing Percentage (%)</Label>
                                    <Input
                                        id="passingPercentage"
                                        name="passingPercentage"
                                        type="number"
                                        max="100"
                                        value={formData.passingPercentage}
                                        onChange={handleInputChange}
                                        className="h-8"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="maxAttempts">Max Attempts</Label>
                                    <Input
                                        id="maxAttempts"
                                        name="maxAttempts"
                                        type="number"
                                        value={formData.maxAttempts}
                                        onChange={handleInputChange}
                                        className="h-8"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="status">Initial Status</Label>
                                    <Select
                                        value={formData.status}
                                        onValueChange={(val) => handleSelectChange('status', val)}
                                    >
                                        <SelectTrigger id="status" className="h-8">
                                            <SelectValue placeholder="Select Status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="draft">Draft</SelectItem>
                                            <SelectItem value="active">Active</SelectItem>
                                            <SelectItem value="closed">Closed</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        )
                    }

                    {/* Step 3: Scheduling */}
                    {
                        currentStep === 3 && (
                            <div className="flex flex-col gap-6">
                                {/* Add new slot form */}
                                <div className="grid gap-4 p-4 border rounded-md bg-muted/10">
                                    <div className="flex items-center gap-2 text-sm font-medium">
                                        <Calendar className="h-4 w-4" />
                                        Add Time Slot
                                    </div>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="slotDate">Date</Label>
                                            <Input
                                                id="slotDate"
                                                type="date"
                                                value={newSlotDate}
                                                onChange={(e) => setNewSlotDate(e.target.value)}
                                                className="h-8"
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="slotStart">Start Time</Label>
                                            <Input
                                                id="slotStart"
                                                type="time"
                                                value={newSlotStart}
                                                onChange={(e) => setNewSlotStart(e.target.value)}
                                                className="h-8"
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="slotEnd">End Time</Label>
                                            <Input
                                                id="slotEnd"
                                                type="time"
                                                value={newSlotEnd}
                                                onChange={(e) => setNewSlotEnd(e.target.value)}
                                                className="h-8"
                                            />
                                        </div>
                                    </div>
                                    <Button type="button" variant="outline" onClick={addSlot} className="w-fit h-8">
                                        <Plus className="mr-2 h-4 w-4" />
                                        Add Slot
                                    </Button>
                                </div>

                                {/* Display added slots */}
                                {slots.length > 0 ? (
                                    <div className="space-y-3">
                                        <div className="text-sm font-medium text-muted-foreground">
                                            Scheduled Slots ({slots.length})
                                        </div>
                                        <div className="grid gap-2">
                                            {slots.map((slot, index) => (
                                                <div
                                                    key={index}
                                                    className="flex items-center justify-between p-3 border rounded-md bg-background hover:bg-muted/20 transition-colors"
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className="flex items-center gap-2 text-sm">
                                                            <Calendar className="h-4 w-4 text-muted-foreground" />
                                                            <span className="font-medium">{formatDate(slot.date)}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                            <Clock className="h-4 w-4" />
                                                            <span>{slot.startTime} - {slot.endTime}</span>
                                                        </div>
                                                    </div>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => removeSlot(index)}
                                                        className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center p-8 border border-dashed rounded-md text-muted-foreground">
                                        <Calendar className="h-8 w-8 mb-2 opacity-50" />
                                        <p className="text-sm">No slots added yet</p>
                                        <p className="text-xs">Add dates and times when this exam will be available</p>
                                    </div>
                                )}
                            </div>
                        )
                    }

                    {/* Step 4: Review */}
                    {
                        currentStep === 4 && (
                            <div className="flex flex-col gap-6">
                                <div className="grid gap-4 p-4 border rounded-md bg-muted/20">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <span className="text-xs text-muted-foreground font-medium uppercase">Title</span>
                                            <p className="text-sm font-medium">{formData.title || '-'}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-xs text-muted-foreground font-medium uppercase">Code</span>
                                            <p className="text-sm font-mono">{formData.code || '-'}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-xs text-muted-foreground font-medium uppercase">Organization</span>
                                            <p className="text-sm">{formData.organization === 'abc-school' ? 'ABC School' : formData.organization === 'system' ? 'System' : '-'}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-xs text-muted-foreground font-medium uppercase">Status</span>
                                            <p className="text-sm capitalize">{formData.status}</p>
                                        </div>
                                    </div>
                                    <div className="space-y-1 pt-2 border-t">
                                        <span className="text-xs text-muted-foreground font-medium uppercase">Description</span>
                                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{formData.description || '-'}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    <div className="p-3 border rounded-md bg-muted/10 text-center">
                                        <span className="text-xs text-muted-foreground font-medium uppercase">Duration</span>
                                        <p className="text-lg font-semibold mt-1">{formData.duration} <span className="text-xs font-normal">min</span></p>
                                    </div>
                                    <div className="p-3 border rounded-md bg-muted/10 text-center">
                                        <span className="text-xs text-muted-foreground font-medium uppercase">Passing Score</span>
                                        <p className="text-lg font-semibold mt-1">{formData.passingPercentage}<span className="text-xs font-normal">%</span></p>
                                    </div>
                                    <div className="p-3 border rounded-md bg-muted/10 text-center">
                                        <span className="text-xs text-muted-foreground font-medium uppercase">Attempts</span>
                                        <p className="text-lg font-semibold mt-1">{formData.maxAttempts}</p>
                                    </div>
                                </div>

                                {/* Scheduled Slots */}
                                {slots.length > 0 && (
                                    <div className="space-y-2">
                                        <span className="text-xs text-muted-foreground font-medium uppercase">Scheduled Slots ({slots.length})</span>
                                        <div className="grid gap-2 max-h-32 overflow-y-auto">
                                            {slots.map((slot, idx) => (
                                                <div key={idx} className="flex items-center gap-4 text-sm p-2 border rounded bg-muted/10">
                                                    <span className="font-medium">{formatDate(slot.date)}</span>
                                                    <span className="text-muted-foreground">{slot.startTime} - {slot.endTime}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )
                    }

                </CardContent >
                <CardFooter className="flex justify-between border-t bg-muted/10 py-4">
                    <Button variant="outline" onClick={handleBack} className="h-8">
                        <ChevronLeft className="mr-2 h-4 w-4" />
                        Back
                    </Button>
                    {currentStep === 4 ? (
                        <Button onClick={handleSubmit} className="h-8">
                            Create Exam
                            <Check className="ml-2 h-4 w-4" />
                        </Button>
                    ) : (
                        <Button onClick={handleNext} className="h-8">
                            Next Step
                            <ChevronRight className="ml-2 h-4 w-4" />
                        </Button>
                    )}
                </CardFooter>
            </Card >
        </div >
    );
}
