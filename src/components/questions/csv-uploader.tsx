'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Upload, ArrowLeft, FileSpreadsheet, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface ParsedQuestion {
    text: string;
    type: string;
    options: string;
    correct_answer: string;
    complexity: string;
    topic: string;
}

function parseCSV(csvText: string): ParsedQuestion[] {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) return [];

    // Skip header row
    const dataLines = lines.slice(1);
    const questions: ParsedQuestion[] = [];

    for (const line of dataLines) {
        // Simple CSV parsing (handles quoted fields with commas)
        const fields: string[] = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                fields.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        fields.push(current.trim());

        if (fields.length >= 6) {
            questions.push({
                text: fields[0],
                type: fields[1],
                options: fields[2],
                correct_answer: fields[3],
                complexity: fields[4],
                topic: fields[5]
            });
        }
    }

    return questions;
}

export function CsvUploader({ onUploadSuccess }: { onUploadSuccess?: () => void }) {
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [step, setStep] = useState<'select' | 'preview'>('select');
    const [parsedQuestions, setParsedQuestions] = useState<ParsedQuestion[]>([]);
    const [parseError, setParseError] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            setFile(selectedFile);
            setParseError(null);

            // Parse CSV immediately
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const csvText = event.target?.result as string;
                    const questions = parseCSV(csvText);
                    if (questions.length === 0) {
                        setParseError('No valid questions found in CSV. Please check the format.');
                    } else {
                        setParsedQuestions(questions);
                        setStep('preview');
                    }
                } catch {
                    setParseError('Failed to parse CSV file.');
                }
            };
            reader.onerror = () => {
                setParseError('Failed to read file.');
            };
            reader.readAsText(selectedFile);
        }
    };

    const handleBack = () => {
        setStep('select');
        setFile(null);
        setParsedQuestions([]);
        setParseError(null);
    };

    const handleClose = () => {
        setIsOpen(false);
        // Reset state after dialog closes
        setTimeout(() => {
            setStep('select');
            setFile(null);
            setParsedQuestions([]);
            setParseError(null);
        }, 200);
    };

    const handleUpload = async () => {
        if (parsedQuestions.length === 0) return;

        setIsUploading(true);

        const token = localStorage.getItem('access_token');
        const currentOrgData = localStorage.getItem('current_org');
        let orgId = '';

        try {
            if (currentOrgData) {
                const org = JSON.parse(currentOrgData);
                orgId = org.id;
            } else {
                const user = JSON.parse(localStorage.getItem('user') || '{}');
                orgId = user.user_metadata?.org_id || '';
            }
        } catch (e) {
            console.error(e);
        }

        if (!orgId) {
            toast.error('Organization context missing');
            setIsUploading(false);
            return;
        }

        // Transform parsed questions to API format
        const questionsPayload = parsedQuestions.map(q => ({
            question_text: q.text,
            question_type: q.type.toLowerCase(),
            options: q.options ? q.options.split('|').map(opt => opt.trim()) : null,
            correct_answer: q.correct_answer,
            difficulty: q.complexity.toLowerCase(),
            topic: q.topic,
        }));

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/questions/upload`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'X-Org-Id': orgId
                },
                body: JSON.stringify({ questions: questionsPayload }),
            });

            if (response.ok) {
                const result = await response.json();
                toast.success(`Uploaded ${result.success}/${result.total} questions successfully!`);
                handleClose();
                if (onUploadSuccess) onUploadSuccess();
            } else {
                const error = await response.json();
                toast.error(error.error || 'Upload failed');
            }
        } catch (error) {
            console.error('Upload error:', error);
            toast.error('Failed to upload file');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => open ? setIsOpen(true) : handleClose()}>
            <DialogTrigger asChild>
                <Button className="h-8 gap-2">
                    <Upload className="h-4 w-4" />
                    Import CSV
                </Button>
            </DialogTrigger>
            <DialogContent className={step === 'preview' ? 'sm:max-w-4xl' : 'sm:max-w-[425px]'}>
                {step === 'select' ? (
                    <>
                        <DialogHeader>
                            <DialogTitle>Import Questions</DialogTitle>
                            <DialogDescription>
                                Upload a CSV file containing your questions.
                                <br />
                                <span className="text-xs text-muted-foreground">
                                    Format: text, type, options, correct_answer, complexity, topic
                                </span>
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid w-full max-w-sm items-center gap-1.5">
                                <Label htmlFor="csv-file">CSV File</Label>
                                <Input id="csv-file" type="file" accept=".csv" onChange={handleFileChange} />
                            </div>
                            {parseError && (
                                <div className="flex items-center gap-2 text-sm text-destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    {parseError}
                                </div>
                            )}
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={handleClose}>Cancel</Button>
                        </DialogFooter>
                    </>
                ) : (
                    <>
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <FileSpreadsheet className="h-5 w-5 text-primary" />
                                Review Questions
                            </DialogTitle>
                            <DialogDescription>
                                {parsedQuestions.length} question{parsedQuestions.length !== 1 ? 's' : ''} found in <span className="font-medium text-foreground">{file?.name}</span>. Review before uploading.
                            </DialogDescription>
                        </DialogHeader>
                        <ScrollArea className="h-[400px] rounded-md border">
                            <Table>
                                <TableHeader className="sticky top-0 bg-background z-10">
                                    <TableRow>
                                        <TableHead className="w-12">#</TableHead>
                                        <TableHead className="min-w-[300px]">Question</TableHead>
                                        <TableHead className="w-24">Type</TableHead>
                                        <TableHead className="w-24">Complexity</TableHead>
                                        <TableHead className="w-32">Topic</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {parsedQuestions.map((q, index) => (
                                        <TableRow key={index}>
                                            <TableCell className="text-muted-foreground font-mono text-xs">
                                                {index + 1}
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                <span className="line-clamp-2">{q.text}</span>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="text-xs">
                                                    {q.type}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <span className={`text-xs font-medium px-2 py-1 rounded-full ${q.complexity.toUpperCase() === 'EASY'
                                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                    : q.complexity.toUpperCase() === 'HARD'
                                                        ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                                        : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                                                    }`}>
                                                    {q.complexity}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {q.topic}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </ScrollArea>
                        <DialogFooter className="flex-col sm:flex-row gap-2">
                            <Button variant="outline" onClick={handleBack} className="gap-2">
                                <ArrowLeft className="h-4 w-4" />
                                Back
                            </Button>
                            <Button onClick={handleUpload} disabled={isUploading} className="gap-2">
                                <Upload className="h-4 w-4" />
                                {isUploading ? 'Uploading...' : `Upload ${parsedQuestions.length} Questions`}
                            </Button>
                        </DialogFooter>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
