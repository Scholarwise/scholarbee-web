'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    BookOpen,
    FileQuestion,
    GraduationCap,
    ClipboardList,
    Users,
    BarChart3,
    TrendingUp,
    Clock
} from 'lucide-react';

interface User {
    id: string;
    email: string;
    user_metadata?: {
        full_name?: string;
    };
}

const statsCards = [
    { title: 'Total Exams', value: '12', change: '+2 this month', icon: ClipboardList, color: 'text-blue-500' },
    { title: 'Question Banks', value: '8', change: '+1 this week', icon: FileQuestion, color: 'text-purple-500' },
    { title: 'Candidates', value: '156', change: '+23 this month', icon: GraduationCap, color: 'text-green-500' },
    { title: 'Subjects', value: '5', change: 'No change', icon: BookOpen, color: 'text-amber-500' },
];

const recentActivity = [
    { action: 'New exam created', item: 'Mid-Term Mathematics', time: '2 hours ago' },
    { action: 'Question bank updated', item: 'Physics MCQs', time: '5 hours ago' },
    { action: 'Candidate enrolled', item: 'John Doe', time: '1 day ago' },
    { action: 'Results published', item: 'Chemistry Final', time: '2 days ago' },
];

export default function DashboardPage() {
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    }, []);

    return (
        <div className="p-6 space-y-6">
            {/* Welcome Section */}
            <div>
                <h1 className="text-2xl font-bold">
                    Welcome back, {user?.user_metadata?.full_name || 'User'}!
                </h1>
                <p className="text-muted-foreground mt-1">
                    Here&apos;s an overview of your exam management platform.
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {statsCards.map((stat) => (
                    <Card key={stat.title}>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                {stat.title}
                            </CardTitle>
                            <stat.icon className={`h-4 w-4 ${stat.color}`} />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stat.value}</div>
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                <TrendingUp className="h-3 w-3" />
                                {stat.change}
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Main Content Grid */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Quick Actions */}
                <Card>
                    <CardHeader>
                        <CardTitle>Quick Actions</CardTitle>
                        <CardDescription>
                            Common tasks to get started
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-3">
                        <a
                            href="/dashboard/exams"
                            className="flex items-center gap-3 p-3 rounded-lg bg-accent hover:bg-accent/80 transition-colors"
                        >
                            <div className="h-10 w-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                                <ClipboardList className="h-5 w-5 text-blue-500" />
                            </div>
                            <div>
                                <p className="font-medium">Create New Exam</p>
                                <p className="text-sm text-muted-foreground">Set up a new examination</p>
                            </div>
                        </a>
                        <a
                            href="/dashboard/question-banks"
                            className="flex items-center gap-3 p-3 rounded-lg bg-accent hover:bg-accent/80 transition-colors"
                        >
                            <div className="h-10 w-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                                <FileQuestion className="h-5 w-5 text-purple-500" />
                            </div>
                            <div>
                                <p className="font-medium">Manage Questions</p>
                                <p className="text-sm text-muted-foreground">Add or edit question banks</p>
                            </div>
                        </a>
                        <a
                            href="/dashboard/candidates"
                            className="flex items-center gap-3 p-3 rounded-lg bg-accent hover:bg-accent/80 transition-colors"
                        >
                            <div className="h-10 w-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                                <Users className="h-5 w-5 text-green-500" />
                            </div>
                            <div>
                                <p className="font-medium">Enroll Candidates</p>
                                <p className="text-sm text-muted-foreground">Add candidates to exams</p>
                            </div>
                        </a>
                        <a
                            href="/dashboard/results"
                            className="flex items-center gap-3 p-3 rounded-lg bg-accent hover:bg-accent/80 transition-colors"
                        >
                            <div className="h-10 w-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                                <BarChart3 className="h-5 w-5 text-amber-500" />
                            </div>
                            <div>
                                <p className="font-medium">View Results</p>
                                <p className="text-sm text-muted-foreground">Check exam performance</p>
                            </div>
                        </a>
                    </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                        <CardDescription>
                            Latest updates in your organization
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {recentActivity.map((activity, index) => (
                                <div
                                    key={index}
                                    className="flex items-start gap-3 pb-4 border-b last:border-0 last:pb-0"
                                >
                                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                                        <Clock className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm">{activity.action}</p>
                                        <p className="text-sm text-primary truncate">{activity.item}</p>
                                        <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
