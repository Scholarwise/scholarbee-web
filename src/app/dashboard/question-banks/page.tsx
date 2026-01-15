'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Search, Filter, MoreHorizontal, FileQuestion, Trash2, Eye, CheckCircle2, Loader2, Plus, X, Sparkles, Bot } from 'lucide-react';
import { CsvUploader } from '@/components/questions/csv-uploader';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Question {
    id: string;
    text: string;
    type: string;
    options: string[] | null;
    correct_answer: string;
    complexity: string;
    topic: string;
    created_at: string;
    organization_id: string;
}

// Row component with hover-expand functionality
function QuestionRow({
    question,
    onDelete,
    onUpdateAnswer,
    onUpdateOptions,
    onUpdateText,
    getOrgContext
}: {
    question: Question;
    onDelete: (id: string) => void;
    onUpdateAnswer: (id: string, newAnswer: string) => void;
    onUpdateOptions: (id: string, newOptions: string[]) => void;
    onUpdateText: (id: string, newText: string) => void;
    getOrgContext: () => string;
}) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isUpdatingAnswer, setIsUpdatingAnswer] = useState(false);
    const [editingOptionIdx, setEditingOptionIdx] = useState<number | null>(null);
    const [editingOptionValue, setEditingOptionValue] = useState('');
    const [isEditingText, setIsEditingText] = useState(false);
    const [editingTextValue, setEditingTextValue] = useState('');
    const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const currentOrgId = getOrgContext();
    const isInherited = question.organization_id !== currentOrgId;

    const handleMouseEnter = () => {
        // Don't expand if dropdown menu is open
        if (isMenuOpen) return;

        // Cancel any pending close
        if (closeTimeoutRef.current) {
            clearTimeout(closeTimeoutRef.current);
            closeTimeoutRef.current = null;
        }
        // Start expand timer if not already expanded
        if (!isExpanded && !hoverTimeoutRef.current) {
            hoverTimeoutRef.current = setTimeout(() => {
                setIsExpanded(true);
                hoverTimeoutRef.current = null;
            }, 1000); // 1 second delay to expand
        }
    };

    const handleMouseLeave = () => {
        // Don't close if dropdown menu or delete dialog is open
        if (isMenuOpen || showDeleteDialog) return;

        // Cancel expand timer if still pending
        if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
            hoverTimeoutRef.current = null;
        }
        // Delay close to allow moving to expanded row
        closeTimeoutRef.current = setTimeout(() => {
            setIsExpanded(false);
            // Clear any editing states
            setEditingOptionIdx(null);
            setIsEditingText(false);
            closeTimeoutRef.current = null;
        }, 100); // 100ms grace period
    };

    const handleMenuOpenChange = (open: boolean) => {
        setIsMenuOpen(open);
        // Cancel any pending hover timeout when menu opens
        if (open && hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
            hoverTimeoutRef.current = null;
        }
    };

    const handleConfirmDelete = async () => {
        if (isInherited) return; // Prevention
        setIsDeleting(true);
        const token = localStorage.getItem('access_token');
        const orgId = getOrgContext();

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/questions/${question.id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'X-Org-Id': orgId
                }
            });

            if (res.ok) {
                toast.success('Question deleted successfully');
                onDelete(question.id);
            } else {
                const data = await res.json().catch(() => ({}));
                toast.error(data.error || 'Failed to delete question');
            }
        } catch (error) {
            console.error('Delete error:', error);
            toast.error('Failed to delete question');
        } finally {
            setIsDeleting(false);
            setShowDeleteDialog(false);
        }
    };

    const handleAnswerClick = async (newAnswer: string) => {
        if (isInherited) return; // Prevention
        // Don't do anything if clicking the already correct answer
        if (newAnswer === question.correct_answer || isUpdatingAnswer) return;

        setIsUpdatingAnswer(true);
        const token = localStorage.getItem('access_token');
        const orgId = getOrgContext();

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/questions/${question.id}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'X-Org-Id': orgId,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ correct_answer: newAnswer })
            });

            if (res.ok) {
                toast.success('Answer updated successfully');
                onUpdateAnswer(question.id, newAnswer);
            } else {
                const data = await res.json().catch(() => ({}));
                toast.error(data.error || 'Failed to update answer');
            }
        } catch (error) {
            console.error('Update error:', error);
            toast.error('Failed to update answer');
        } finally {
            setIsUpdatingAnswer(false);
        }
    };

    const handleOptionClick = (opt: string) => {
        if (isInherited) return; // Prevention
        // Don't trigger if already updating or if it's the correct answer
        if (isUpdatingAnswer || opt === question.correct_answer) return;

        // Use timeout to allow double-click to cancel single-click
        if (clickTimeoutRef.current) {
            clearTimeout(clickTimeoutRef.current);
        }
        clickTimeoutRef.current = setTimeout(() => {
            handleAnswerClick(opt);
            clickTimeoutRef.current = null;
        }, 200);
    };

    const handleOptionDoubleClick = (idx: number, currentValue: string) => {
        if (isInherited) return; // Prevention
        // Cancel any pending single-click
        if (clickTimeoutRef.current) {
            clearTimeout(clickTimeoutRef.current);
            clickTimeoutRef.current = null;
        }
        setEditingOptionIdx(idx);
        setEditingOptionValue(currentValue);
    };

    const handleOptionSave = async () => {
        if (editingOptionIdx === null) return;

        const newOptions = [...options];
        const oldValue = newOptions[editingOptionIdx];

        // Don't save if value unchanged
        if (editingOptionValue.trim() === oldValue) {
            setEditingOptionIdx(null);
            return;
        }

        newOptions[editingOptionIdx] = editingOptionValue.trim();

        setIsUpdatingAnswer(true);
        const token = localStorage.getItem('access_token');
        const orgId = getOrgContext();

        try {
            // If the edited option was the correct answer, update that too
            const wasCorrectAnswer = oldValue === question.correct_answer;
            const body: { options: string[]; correct_answer?: string } = { options: newOptions };
            if (wasCorrectAnswer) {
                body.correct_answer = editingOptionValue.trim();
            }

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/questions/${question.id}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'X-Org-Id': orgId,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            });

            if (res.ok) {
                toast.success('Option updated successfully');
                onUpdateOptions(question.id, newOptions);
                if (wasCorrectAnswer) {
                    onUpdateAnswer(question.id, editingOptionValue.trim());
                }
            } else {
                const data = await res.json().catch(() => ({}));
                toast.error(data.error || 'Failed to update option');
            }
        } catch (error) {
            console.error('Update error:', error);
            toast.error('Failed to update option');
        } finally {
            setIsUpdatingAnswer(false);
            setEditingOptionIdx(null);
        }
    };

    const handleOptionKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleOptionSave();
        } else if (e.key === 'Escape') {
            setEditingOptionIdx(null);
        }
    };

    // Robust parsing of options to handle various API/DB formats
    let parsedOptions: string[] = [];
    const rawOptions = question.options;

    if (Array.isArray(rawOptions) && rawOptions.length > 0) {
        // Handle case where API returns ["A;B;C"] as a single element array
        if (rawOptions.length === 1 && typeof rawOptions[0] === 'string' && (rawOptions[0].includes(';') || rawOptions[0].includes(','))) {
            parsedOptions = rawOptions[0].split(/[;,]/).map(s => s.trim());
        } else {
            parsedOptions = rawOptions;
        }
    } else if (typeof rawOptions === 'string') {
        parsedOptions = (rawOptions as string).split(/[;,]/).map(s => s.trim());
    }

    // Default options for True/False if missing
    if (parsedOptions.length === 0 && question.type === 'TRUE_FALSE') {
        parsedOptions = ['True', 'False'];
    }

    const options = parsedOptions;

    const handleTextDoubleClick = () => {
        if (isInherited) return; // Prevention
        setIsEditingText(true);
        setEditingTextValue(question.text);
    };

    const handleTextSave = async () => {
        if (!isEditingText) return;

        if (editingTextValue.trim() === question.text) {
            setIsEditingText(false);
            return;
        }

        setIsUpdatingAnswer(true);
        const token = localStorage.getItem('access_token');
        const orgId = getOrgContext();

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/questions/${question.id}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'X-Org-Id': orgId,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ text: editingTextValue.trim() })
            });

            if (res.ok) {
                toast.success('Question updated successfully');
                onUpdateText(question.id, editingTextValue.trim());
            } else {
                const data = await res.json().catch(() => ({}));
                toast.error(data.error || 'Failed to update question');
            }
        } catch (error) {
            console.error('Update error:', error);
            toast.error('Failed to update question');
        } finally {
            setIsUpdatingAnswer(false);
            setIsEditingText(false);
        }
    };

    const handleTextKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleTextSave();
        } else if (e.key === 'Escape') {
            setIsEditingText(false);
        }
    };

    return (
        <>
            <TableRow
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                className={cn(
                    "transition-colors",
                    isExpanded && "bg-muted/30"
                )}
            >
                <TableCell className="font-medium max-w-[400px]">
                    {isEditingText ? (
                        <input
                            type="text"
                            value={editingTextValue}
                            onChange={(e) => setEditingTextValue(e.target.value)}
                            onBlur={handleTextSave}
                            onKeyDown={handleTextKeyDown}
                            autoFocus
                            className="w-full px-2 py-1 rounded border border-primary bg-background"
                        />
                    ) : (
                        <div className="flex items-center gap-2">
                            <span
                                className={cn(isExpanded ? "" : "truncate block", !isInherited && "cursor-pointer hover:text-primary")}
                                onDoubleClick={handleTextDoubleClick}
                                title={isInherited ? "Inherited from parent (Read-only)" : "Double-click to edit"}
                            >
                                {question.text}
                            </span>
                            {isInherited && (
                                <Badge variant="secondary" className="text-[10px] h-4 px-1 rounded-sm border-primary/20 bg-primary/5 text-primary">
                                    Inherited
                                </Badge>
                            )}
                        </div>
                    )}
                </TableCell>
                <TableCell>
                    <Badge variant="outline">{question.type}</Badge>
                </TableCell>
                <TableCell>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${question.complexity === 'EASY'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : question.complexity === 'HARD'
                            ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                            : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                        }`}>
                        {question.complexity}
                    </span>
                </TableCell>
                <TableCell>{question.topic}</TableCell>
                <TableCell className="text-right">
                    <DropdownMenu open={isMenuOpen} onOpenChange={handleMenuOpenChange}>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem className="gap-2">
                                <Eye className="h-4 w-4" />
                                View Details
                            </DropdownMenuItem>
                            {!isInherited && (
                                <DropdownMenuItem
                                    className="gap-2 text-destructive focus:text-destructive"
                                    onClick={() => setShowDeleteDialog(true)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                    Delete
                                </DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </TableCell>
            </TableRow>
            {/* Expanded Details Row */}
            {isExpanded && (
                <TableRow
                    className="bg-muted/20 hover:bg-muted/30"
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                >
                    <TableCell colSpan={5} className="py-4">
                        <div className="flex gap-8">
                            {/* Options */}
                            <div className="flex-1 space-y-2">
                                <h4 className="text-xs font-medium text-muted-foreground tracking-wide">
                                    Options
                                    {!isInherited && <span className="font-normal"> (click to set correct, double-click to edit)</span>}
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    {options.length > 0 ? options.map((opt, idx) => (
                                        editingOptionIdx === idx ? (
                                            <input
                                                key={idx}
                                                type="text"
                                                value={editingOptionValue}
                                                onChange={(e) => setEditingOptionValue(e.target.value)}
                                                onBlur={handleOptionSave}
                                                onKeyDown={handleOptionKeyDown}
                                                autoFocus
                                                className="px-3 py-1.5 rounded-md text-sm border border-primary bg-background min-w-[80px]"
                                            />
                                        ) : (
                                            <div
                                                key={idx}
                                                onClick={() => !isInherited && handleOptionClick(opt)}
                                                onDoubleClick={() => !isInherited && handleOptionDoubleClick(idx, opt)}
                                                className={cn(
                                                    "px-3 py-1.5 rounded-md text-sm border transition-all",
                                                    !isInherited && "cursor-pointer",
                                                    opt === question.correct_answer
                                                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                                                        : "bg-muted/50 border-border/50",
                                                    !isInherited && opt !== question.correct_answer && "hover:border-primary/50 hover:bg-primary/5",
                                                    isUpdatingAnswer && "opacity-50 pointer-events-none"
                                                )}
                                            >
                                                {opt === question.correct_answer && (
                                                    <CheckCircle2 className="h-3.5 w-3.5 inline mr-1.5 -mt-0.5" />
                                                )}
                                                {opt}
                                            </div>
                                        )
                                    )) : (
                                        <span className="text-sm text-muted-foreground">No options available</span>
                                    )}
                                    {isUpdatingAnswer && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                                </div>
                            </div>
                            {/* Correct Answer (for non-MCQ/True-False) */}
                            {!['MCQ', 'TRUE_FALSE'].includes(question.type) && question.correct_answer && (
                                <div className="space-y-2">
                                    <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Correct Answer</h4>
                                    <div className="px-3 py-1.5 rounded-md text-sm bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
                                        <CheckCircle2 className="h-3.5 w-3.5 inline mr-1.5 -mt-0.5" />
                                        {question.correct_answer}
                                    </div>
                                </div>
                            )}
                            {/* Inline Actions */}
                            <div className="flex items-end gap-2">
                                <Button variant="outline" size="sm" className="h-8 gap-2">
                                    <Eye className="h-4 w-4" />
                                    Review
                                </Button>
                                {!isInherited && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-8 gap-2 text-destructive border-destructive/30 hover:bg-destructive/10"
                                        onClick={() => setShowDeleteDialog(true)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                        Delete
                                    </Button>
                                )}
                            </div>
                        </div>
                    </TableCell>
                </TableRow>
            )}
            {/* Delete Confirmation Dialog */}
            {!isInherited && (
                <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Delete Question</AlertDialogTitle>
                            <AlertDialogDescription>
                                Are you sure you want to delete this question? This action cannot be undone.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleConfirmDelete}
                                disabled={isDeleting}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                                {isDeleting ? (
                                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Deleting...</>
                                ) : (
                                    'Delete'
                                )}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )}
        </>
    );
}

export default function QuestionBankPage() {
    const [questions, setQuestions] = useState<Question[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [newQuestion, setNewQuestion] = useState({
        text: '',
        type: 'MCQ',
        complexity: 'MEDIUM',
        topic: '',
        options: ['', '', '', ''],
        correct_answer: ''
    });



    const [isGenerating, setIsGenerating] = useState(false);

    const handleAIGenerate = async () => {
        setIsGenerating(true);
        // Simulate AI generation delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Mock data generation based on topic or random
        setNewQuestion({
            text: `What is the primary function of ${newQuestion.topic || 'mitochondria'}?`,
            type: 'MCQ',
            complexity: 'MEDIUM',
            topic: newQuestion.topic || 'Biology',
            options: ['Energy production', 'Protein synthesis', 'Waste removal', 'Cell division'],
            correct_answer: 'Energy production'
        });

        setIsGenerating(false);
        toast.success("Question generated by AI");
    };

    // Bulk Generation State
    const [showBulkDialog, setShowBulkDialog] = useState(false);
    const [isBulkGenerating, setIsBulkGenerating] = useState(false);
    const [bulkTopic, setBulkTopic] = useState('');
    const [bulkCount, setBulkCount] = useState(3);

    const handleBulkGenerate = async () => {
        if (!bulkTopic.trim()) {
            toast.error('Topic is required for bulk generation');
            return;
        }

        setIsBulkGenerating(true);
        const token = localStorage.getItem('access_token');
        const orgId = getOrgContext();

        try {
            const promises = [];
            for (let i = 0; i < bulkCount; i++) {
                // Mock diverse questions based on topic
                const questionTypes = ['MCQ', 'TRUE_FALSE', 'MCQ'];
                const type = questionTypes[i % questionTypes.length];
                const mockQuestion = {
                    text: `Generated Question ${i + 1} about ${bulkTopic}: ${type === 'TRUE_FALSE' ? 'Is this statement true?' : 'Select the best answer.'}`,
                    type: type,
                    complexity: i % 2 === 0 ? 'EASY' : 'MEDIUM',
                    topic: bulkTopic,
                    options: type === 'TRUE_FALSE' ? ['True', 'False'] : ['Option A', 'Option B', 'Option C', 'Option D'],
                    correct_answer: type === 'TRUE_FALSE' ? 'True' : 'Option A'
                };

                promises.push(fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/questions`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'X-Org-Id': orgId,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(mockQuestion)
                }));
            }

            // Simulate a bit of delay for "thinking"
            await new Promise(resolve => setTimeout(resolve, 2000));

            await Promise.all(promises);

            toast.success(`Successfully generated ${bulkCount} questions!`);
            fetchQuestions();
            setShowBulkDialog(false);
            setBulkTopic('');
            setBulkCount(3);
        } catch (error) {
            console.error('Bulk generate error:', error);
            toast.error('Failed to generate questions');
        } finally {
            setIsBulkGenerating(false);
        }
    };

    const getOrgContext = () => {
        const currentOrgData = localStorage.getItem('current_org');
        if (currentOrgData) {
            return JSON.parse(currentOrgData).id;
        }
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        return user.user_metadata?.org_id || '';
    };

    const fetchQuestions = async () => {
        setIsLoading(true);
        const token = localStorage.getItem('access_token');
        const orgId = getOrgContext();

        if (!orgId || !token) {
            setIsLoading(false);
            return;
        }

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/questions`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'X-Org-Id': orgId
                }
            });
            if (res.ok) {
                const data = await res.json();
                setQuestions(data.questions || []);
            }
        } catch (error) {
            console.error('Failed to fetch questions:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = (questionId: string) => {
        setQuestions(prev => prev.filter(q => q.id !== questionId));
    };

    const handleUpdateAnswer = (questionId: string, newAnswer: string) => {
        setQuestions(prev => prev.map(q =>
            q.id === questionId ? { ...q, correct_answer: newAnswer } : q
        ));
    };

    const handleUpdateOptions = (questionId: string, newOptions: string[]) => {
        setQuestions(prev => prev.map(q =>
            q.id === questionId ? { ...q, options: newOptions } : q
        ));
    };

    const handleUpdateText = (questionId: string, newText: string) => {
        setQuestions(prev => prev.map(q =>
            q.id === questionId ? { ...q, text: newText } : q
        ));
    };

    const handleCreateQuestion = async () => {
        if (!newQuestion.text.trim()) {
            toast.error('Question text is required');
            return;
        }

        setIsCreating(true);
        const token = localStorage.getItem('access_token');
        const orgId = getOrgContext();

        try {
            const filteredOptions = newQuestion.options.filter(opt => opt.trim());
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/questions`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'X-Org-Id': orgId,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    text: newQuestion.text.trim(),
                    type: newQuestion.type,
                    complexity: newQuestion.complexity,
                    topic: newQuestion.topic.trim(),
                    options: filteredOptions,
                    correct_answer: newQuestion.correct_answer
                })
            });

            if (res.ok) {
                const data = await res.json();
                toast.success('Question created successfully');
                fetchQuestions();
                setShowCreateDialog(false);
                setNewQuestion({
                    text: '',
                    type: 'MCQ',
                    complexity: 'MEDIUM',
                    topic: '',
                    options: ['', '', '', ''],
                    correct_answer: ''
                });
            } else {
                const data = await res.json().catch(() => ({}));
                toast.error(data.error || 'Failed to create question');
            }
        } catch (error) {
            console.error('Create error:', error);
            toast.error('Failed to create question');
        } finally {
            setIsCreating(false);
        }
    };

    useEffect(() => {
        fetchQuestions();
    }, []);

    const filteredQuestions = questions.filter(q =>
        q.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.topic.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleOpenChange = (open: boolean) => {
        setShowCreateDialog(open);
        if (!open) {
            setNewQuestion({
                text: '',
                type: 'MCQ',
                complexity: 'MEDIUM',
                topic: '',
                options: ['', '', '', ''],
                correct_answer: ''
            });
            setIsGenerating(false);
        }
    };

    return (
        <div className="p-8 space-y-6 flex flex-col h-[calc(100vh-4rem)]">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">Question Bank</h1>
                    <p className="text-sm text-muted-foreground">
                        Manage your question repository.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <CsvUploader onUploadSuccess={fetchQuestions} />
                    <Button className="h-8 gap-2" onClick={() => setShowBulkDialog(true)}>
                        <Bot className="h-4 w-4" />
                        Bulk Generate
                    </Button>
                    <Button className="h-8 gap-2" onClick={() => setShowCreateDialog(true)}>
                        <FileQuestion className="h-4 w-4" />
                        Create Question
                    </Button>
                </div>
            </div>

            {/* Toolbar */}
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center flex-1 gap-2 max-w-sm">
                    <div className="relative flex-1">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search questions or topics..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 h-9"
                        />
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="h-9 gap-2">
                        <Filter className="h-4 w-4" />
                        Filter
                    </Button>
                </div>
            </div>

            {/* Table */}
            <div className="border rounded-md flex-1 bg-card overflow-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[400px]">Question Text</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Complexity</TableHead>
                            <TableHead>Topic</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                    Loading questions...
                                </TableCell>
                            </TableRow>
                        ) : filteredQuestions.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                    No questions found. Import CSV to get started.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredQuestions.map((question) => (
                                <QuestionRow
                                    key={question.id}
                                    question={question}
                                    onDelete={handleDelete}
                                    onUpdateAnswer={handleUpdateAnswer}
                                    onUpdateOptions={handleUpdateOptions}
                                    onUpdateText={handleUpdateText}
                                    getOrgContext={getOrgContext}
                                />
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Bulk Generate Dialog */}
            <Dialog open={showBulkDialog} onOpenChange={setShowBulkDialog}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Bot className="h-5 w-5 text-indigo-500" />
                            Bulk AI Generation
                        </DialogTitle>
                        <DialogDescription>
                            Generate multiple questions at once based on a topic.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="bulk-topic">Topic</Label>
                            <Input
                                id="bulk-topic"
                                placeholder="e.g. World War II, Quantum Physics"
                                value={bulkTopic}
                                onChange={(e) => setBulkTopic(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="bulk-count">Number of Questions ({bulkCount})</Label>
                            <Input
                                id="bulk-count"
                                type="number"
                                min={1}
                                max={10}
                                value={bulkCount}
                                onChange={(e) => setBulkCount(parseInt(e.target.value) || 1)}
                            />
                            <p className="text-[0.8rem] text-muted-foreground">
                                Generate between 1 and 10 questions.
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowBulkDialog(false)} disabled={isBulkGenerating}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleBulkGenerate}
                            disabled={isBulkGenerating || !bulkTopic.trim()}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
                        >
                            {isBulkGenerating ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Sparkles className="h-4 w-4" />
                            )}
                            {isBulkGenerating ? 'Generating...' : 'Generate Questions'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Create Question Dialog */}
            <Dialog open={showCreateDialog} onOpenChange={handleOpenChange}>
                <DialogContent className="sm:max-w-[525px]">
                    <DialogHeader>
                        <div className="flex items-center justify-between pr-8">
                            <DialogTitle>Create Question</DialogTitle>
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-7 gap-1.5 text-indigo-500 border-indigo-200 hover:bg-indigo-50 dark:border-indigo-800 dark:hover:bg-indigo-950/50"
                                onClick={handleAIGenerate}
                                disabled={isGenerating}
                            >
                                {isGenerating ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                    <Sparkles className="h-3.5 w-3.5" />
                                )}
                                {isGenerating ? 'Generating...' : 'Generate with AI'}
                            </Button>
                        </div>
                        <DialogDescription>
                            Add a new question to your question bank.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="question-text">Question Text</Label>
                            <Input
                                id="question-text"
                                placeholder="Enter question text..."
                                value={newQuestion.text}
                                onChange={(e) => setNewQuestion(prev => ({ ...prev, text: e.target.value }))}
                            />
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label>Type</Label>
                                <Select value={newQuestion.type} onValueChange={(v) => setNewQuestion(prev => ({ ...prev, type: v }))}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="MCQ">MCQ</SelectItem>
                                        <SelectItem value="TRUE_FALSE">True/False</SelectItem>
                                        <SelectItem value="SHORT_ANSWER">Short Answer</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Complexity</Label>
                                <Select value={newQuestion.complexity} onValueChange={(v) => setNewQuestion(prev => ({ ...prev, complexity: v }))}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="EASY">Easy</SelectItem>
                                        <SelectItem value="MEDIUM">Medium</SelectItem>
                                        <SelectItem value="HARD">Hard</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="topic">Topic</Label>
                                <Input
                                    id="topic"
                                    placeholder="Topic"
                                    value={newQuestion.topic}
                                    onChange={(e) => setNewQuestion(prev => ({ ...prev, topic: e.target.value }))}
                                />
                            </div>
                        </div>
                        {newQuestion.type === 'MCQ' && (
                            <div className="space-y-2">
                                <Label>Options</Label>
                                {newQuestion.options.map((opt, idx) => (
                                    <div key={idx} className="flex gap-2 items-center">
                                        <Input
                                            placeholder={`Option ${idx + 1}`}
                                            value={opt}
                                            onChange={(e) => {
                                                const newOpts = [...newQuestion.options];
                                                newOpts[idx] = e.target.value;
                                                setNewQuestion(prev => ({ ...prev, options: newOpts }));
                                            }}
                                        />
                                        <Button
                                            variant={newQuestion.correct_answer === opt && opt ? "default" : "outline"}
                                            size="sm"
                                            type="button"
                                            onClick={() => opt && setNewQuestion(prev => ({ ...prev, correct_answer: opt }))}
                                            disabled={!opt}
                                            className="shrink-0"
                                        >
                                            {newQuestion.correct_answer === opt && opt ? <CheckCircle2 className="h-4 w-4" /> : 'Set Correct'}
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                        {newQuestion.type !== 'MCQ' && (
                            <div className="space-y-2">
                                <Label htmlFor="correct-answer">Correct Answer</Label>
                                <Input
                                    id="correct-answer"
                                    placeholder="Enter correct answer..."
                                    value={newQuestion.correct_answer}
                                    onChange={(e) => setNewQuestion(prev => ({ ...prev, correct_answer: e.target.value }))}
                                />
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
                        <Button onClick={handleCreateQuestion} disabled={isCreating}>
                            {isCreating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Create Question
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

