/**
 * Upload Zone Component - Drag & Drop file upload
 */

import { useState, useCallback, DragEvent, ChangeEvent } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { parseFile, ParseResult } from '../../lib/fileParser';

interface UploadZoneProps {
    onFileLoaded: (result: ParseResult, file: File) => void;
    isLoading?: boolean;
}

export function UploadZone({ onFileLoaded, isLoading }: UploadZoneProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fileName, setFileName] = useState<string | null>(null);

    const handleFile = useCallback(async (file: File) => {
        setError(null);
        setFileName(file.name);

        // Validate file type
        const validTypes = ['text/csv', 'application/json', 'text/plain'];
        const extension = file.name.split('.').pop()?.toLowerCase();

        if (!validTypes.includes(file.type) && !['csv', 'json'].includes(extension || '')) {
            setError('Please upload a CSV or JSON file');
            return;
        }

        // Validate file size (max 50MB)
        if (file.size > 50 * 1024 * 1024) {
            setError('File size must be less than 50MB');
            return;
        }

        try {
            const result = await parseFile(file);

            if (result.errors.length > 0 && result.data.length === 0) {
                setError(result.errors[0]);
                return;
            }

            onFileLoaded(result, file);
        } catch (err) {
            setError('Failed to parse file');
        }
    }, [onFileLoaded]);

    const handleDragOver = (e: DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
    };

    const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleFile(file);
    };

    return (
        <div className="w-full">
            <label
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`
          relative flex flex-col items-center justify-center
          w-full h-64 p-6
          border-2 border-dashed rounded-card
          cursor-pointer transition-all duration-200
          ${isDragging
                        ? 'border-accent-primary bg-accent-primary/10'
                        : 'border-white/[0.1] bg-bg-card hover:border-accent-primary/50 hover:bg-bg-card-hover'
                    }
          ${error ? 'border-red-500/50' : ''}
          ${isLoading ? 'pointer-events-none opacity-60' : ''}
        `}
            >
                <input
                    type="file"
                    accept=".csv,.json"
                    onChange={handleInputChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={isLoading}
                />

                <div className="flex flex-col items-center gap-4 text-center">
                    {isLoading ? (
                        <>
                            <Loader2 className="w-12 h-12 text-accent-primary animate-spin" />
                            <p className="text-zinc-400">Analyzing your data...</p>
                        </>
                    ) : error ? (
                        <>
                            <AlertCircle className="w-12 h-12 text-red-500" />
                            <div>
                                <p className="text-red-500 font-medium">{error}</p>
                                <p className="text-zinc-500 text-sm mt-1">Click or drop to try again</p>
                            </div>
                        </>
                    ) : fileName ? (
                        <>
                            <CheckCircle className="w-12 h-12 text-green-500" />
                            <div>
                                <p className="text-white font-medium">{fileName}</p>
                                <p className="text-zinc-500 text-sm mt-1">File loaded successfully</p>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="w-16 h-16 rounded-2xl bg-accent-primary/10 flex items-center justify-center">
                                <Upload className="w-8 h-8 text-accent-primary" />
                            </div>
                            <div>
                                <p className="text-white font-medium">
                                    Drag & drop your data file here
                                </p>
                                <p className="text-zinc-500 text-sm mt-1">
                                    or click to browse
                                </p>
                            </div>
                            <div className="flex items-center gap-4 mt-2">
                                <div className="flex items-center gap-2 text-xs text-zinc-500">
                                    <FileText className="w-4 h-4" />
                                    CSV
                                </div>
                                <div className="flex items-center gap-2 text-xs text-zinc-500">
                                    <FileText className="w-4 h-4" />
                                    JSON
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </label>
        </div>
    );
}

export default UploadZone;
