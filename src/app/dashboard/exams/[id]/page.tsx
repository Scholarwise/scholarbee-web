'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { ArrowLeft, ClipboardList, Calendar, Clock, Users, Settings, Trash2 } from 'lucide-react';

interface ExamSlot {
    id: string;
    slot_date: string;
    start_time: string;
    end_time: string;
    max_candidates?: number;
}

interface Exam {
    id: string;
    title: string;
    code: string;
    description: string;
    status: string;
    duration: number;
    passingPercentage: number;
    maxAttempts: number;
    createdAt: string;
    organization?: { name: string };
    slots?: ExamSlot[];
}

export default function ExamDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [exam, setExam] = useState<Exam | null>(null);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        const fetchExam = async () => {
            try {
                const token = localStorage.getItem('access_token');
                const headers: Record<string, string> = {};
                if (token) headers['Authorization'] = `Bearer ${token}`;

                const response = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/exams/${params.id}`,
                    { headers }
                );

                if (response.ok) {
                    const data = await response.json();
                    setExam(data);
                } else {
                    console.error('Failed to fetch exam');
                }
            } catch (error) {
                console.error('Error fetching exam:', error);
            } finally {
                setLoading(false);
            }
        };

        if (params.id) {
            fetchExam();
        }
    }, [params.id]);

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr + 'T00:00:00');
        return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    };

    const getStatusColor = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'active':
                return 'bg-green-500/10 text-green-600';
            case 'draft':
                return 'bg-muted text-muted-foreground';
            case 'closed':
                return 'bg-orange-500/10 text-orange-600';
            default:
                return 'bg-muted text-muted-foreground';
        }
    };

    const handleDelete = async () => {
        setDeleting(true);
        try {
            const token = localStorage.getItem('access_token');
            const headers: Record<string, string> = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/exams/${params.id}`,
                { method: 'DELETE', headers }
            );

            if (response.ok) {
                toast.success('Exam deleted successfully');
                router.push('/dashboard/exams');
            } else {
                const data = await response.json();
                toast.error(data.error || 'Failed to delete exam');
            }
        } catch (error) {
            console.error('Error deleting exam:', error);
            toast.error('Failed to delete exam');
        } finally {
            setDeleting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
                <div className="text-muted-foreground">Loading exam details...</div>
            </div>
        );
    }

    if (!exam) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] gap-4">
                <div className="text-muted-foreground">Exam not found</div>
                <Button variant="outline" onClick={() => router.back()}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Go back
                </Button>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)] p-8 space-y-6">
            {/* Back button and header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="flex-1">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-muted">
                            <ClipboardList className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-semibold tracking-tight">{exam.title}</h1>
                            <p className="text-sm text-muted-foreground font-mono">{exam.code}</p>
                        </div>
                    </div>
                </div>
                <Badge className={`${getStatusColor(exam.status)} font-normal`}>
                    {exam.status}
                </Badge>
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm" className="h-8">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Delete Exam</AlertDialogTitle>
                            <AlertDialogDescription>
                                Are you sure you want to delete &quot;{exam.title}&quot;? This will also delete all scheduled slots. This action cannot be undone.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleDelete}
                                disabled={deleting}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                                {deleting ? 'Deleting...' : 'Delete'}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>

            {/* Content */}
            <div className="grid grid-cols-3 gap-6 flex-1 overflow-auto">
                {/* Main info */}
                <div className="col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Description</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                {exam.description || 'No description provided'}
                            </p>
                        </CardContent>
                    </Card>

                    {/* Scheduled Slots */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                Scheduled Slots
                            </CardTitle>
                            <CardDescription>
                                Time slots when this exam is available
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {exam.slots && exam.slots.length > 0 ? (
                                <div className="space-y-2">
                                    {exam.slots.map((slot, idx) => (
                                        <div
                                            key={slot.id || idx}
                                            className="flex items-center gap-4 p-3 border rounded-md bg-muted/10"
                                        >
                                            <div className="flex items-center gap-2">
                                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                                <span className="font-medium text-sm">{formatDate(slot.slot_date)}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <Clock className="h-4 w-4" />
                                                <span className="text-sm">{slot.start_time} - {slot.end_time}</span>
                                            </div>
                                            {slot.max_candidates && (
                                                <div className="flex items-center gap-2 text-muted-foreground ml-auto">
                                                    <Users className="h-4 w-4" />
                                                    <span className="text-sm">Max {slot.max_candidates}</span>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center p-8 border border-dashed rounded-md text-muted-foreground">
                                    <Calendar className="h-8 w-8 mb-2 opacity-50" />
                                    <p className="text-sm">No slots scheduled</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar - Settings */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Settings className="h-4 w-4" />
                                Exam Settings
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between items-center py-2 border-b">
                                <span className="text-sm text-muted-foreground">Duration</span>
                                <span className="text-sm font-medium">{exam.duration} min</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b">
                                <span className="text-sm text-muted-foreground">Passing Score</span>
                                <span className="text-sm font-medium">{exam.passingPercentage}%</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b">
                                <span className="text-sm text-muted-foreground">Max Attempts</span>
                                <span className="text-sm font-medium">{exam.maxAttempts}</span>
                            </div>
                            <div className="flex justify-between items-center py-2">
                                <span className="text-sm text-muted-foreground">Created</span>
                                <span className="text-sm font-medium">
                                    {new Date(exam.createdAt).toLocaleDateString()}
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
