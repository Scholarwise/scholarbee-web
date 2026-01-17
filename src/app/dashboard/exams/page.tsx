'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Search, MoreHorizontal, ChevronRight, ClipboardList, ClipboardPlus } from 'lucide-react';


export default function ExamsPage() {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const [exams, setExams] = useState<any[]>([]);

    React.useEffect(() => {
        const fetchExams = async () => {
            try {
                const token = localStorage.getItem('access_token');
                const headers: any = {};
                if (token) headers['Authorization'] = `Bearer ${token}`;

                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/exams`, { headers });
                if (response.ok) {
                    const data = await response.json();
                    setExams(data);
                } else {
                    console.error('Failed to fetch exams');
                }
            } catch (error) {
                console.error('Error fetching exams:', error);
            }
        };
        fetchExams();
    }, []);

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)] p-8 space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-semibold tracking-tight text-foreground">Exams</h1>
                <p className="text-muted-foreground mt-1 text-sm">
                    Manage and oversee all examinations within your organization.
                </p>
            </div>

            {/* Toolbar */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1 max-w-lg">
                    <div className="relative flex-1">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-8 h-8 bg-background"
                        />
                    </div>
                    <Select defaultValue="all">
                        <SelectTrigger className="w-[140px] h-8 bg-background">
                            <SelectValue placeholder="All Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="closed">Closed</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <Button className="h-8 gap-2" onClick={() => router.push('/dashboard/exams/create')}>
                    <ClipboardPlus className="h-4 w-4" />
                    Create exam
                </Button>
            </div>

            {/* Table */}
            <div className="border rounded-md overflow-hidden bg-card">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow className="hover:bg-transparent border-b border-border/50">
                            <TableHead className="w-[30%] h-10 text-xs font-medium text-muted-foreground pl-4">Name</TableHead>
                            <TableHead className="w-[20%] h-10 text-xs font-medium text-muted-foreground">Organizations</TableHead>
                            <TableHead className="w-[15%] h-10 text-xs font-medium text-muted-foreground">Status</TableHead>
                            <TableHead className="w-[15%] h-10 text-xs font-medium text-muted-foreground">Code</TableHead>
                            <TableHead className="h-10 text-xs font-medium text-muted-foreground">Created ↓</TableHead>
                            <TableHead className="w-[50px] h-10"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {exams.map((exam) => (
                            <TableRow
                                key={exam.id}
                                className="hover:bg-muted/40 border-b border-border/50 last:border-0 h-[53px] cursor-pointer"
                                onClick={() => router.push(`/dashboard/exams/${exam.id}`)}
                            >
                                <TableCell className="py-2 pl-4 align-middle font-medium text-sm text-foreground">
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-muted text-muted-foreground">
                                            <ClipboardList className="h-4 w-4" />
                                        </div>
                                        {exam.name}
                                    </div>
                                </TableCell>
                                <TableCell className="py-2 align-middle text-sm text-foreground">
                                    {exam.org}
                                </TableCell>
                                <TableCell className="py-2 align-middle">
                                    <Badge
                                        variant="secondary"
                                        className={`font-normal text-xs px-2 py-0.5 h-5 rounded-full ${exam.status === 'Active' ? 'bg-green-500/10 text-green-600 hover:bg-green-500/20' :
                                            exam.status === 'Draft' ? 'bg-muted text-muted-foreground hover:bg-muted/80' :
                                                'bg-orange-500/10 text-orange-600 hover:bg-orange-500/20'
                                            }`}
                                    >
                                        {exam.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="py-2 align-middle font-mono text-xs text-muted-foreground">
                                    {exam.code}
                                </TableCell>
                                <TableCell className="py-2 align-middle text-sm text-muted-foreground">
                                    {exam.createdAt}
                                </TableCell>
                                <TableCell className="py-2 align-middle text-right pr-4">
                                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div >
    );
}
