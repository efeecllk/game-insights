import type { Meta, StoryObj } from '@storybook/react-vite';
import { FolderUploadPreview } from './FolderUploadPreview';

// Mock function for story actions
const mockFn = () => {};

const meta: Meta<typeof FolderUploadPreview> = {
    title: 'Upload/FolderUploadPreview',
    component: FolderUploadPreview,
    parameters: {
        layout: 'padded',
        docs: {
            description: {
                component: 'Preview component for folder uploads showing files, merge options, and import progress.',
            },
        },
        chromatic: { viewports: [320, 768, 1200] },
    },
    tags: ['autodocs'],
    decorators: [
        (Story) => (
            <div className="bg-bg-darkest p-4">
                <Story />
            </div>
        ),
    ],
    args: {
        onMergeStrategyChange: mockFn,
        onImport: mockFn,
        onCancel: mockFn,
    },
};

export default meta;
type Story = StoryObj<typeof FolderUploadPreview>;

const sampleFiles = [
    { name: 'data_2024_01.csv', format: 'csv' as const, size: 1024000 },
    { name: 'data_2024_02.csv', format: 'csv' as const, size: 980000 },
    { name: 'data_2024_03.csv', format: 'csv' as const, size: 1120000 },
    { name: 'events.json', format: 'json' as const, size: 512000 },
    { name: 'users.xlsx', format: 'xlsx' as const, size: 2048000 },
];

export const Default: Story = {
    args: {
        files: sampleFiles,
        unsupportedFiles: [],
        totalSize: 5684000,
        isImporting: false,
        mergeStrategy: 'auto',
    },
};

export const WithUnsupportedFiles: Story = {
    args: {
        files: sampleFiles.slice(0, 3),
        unsupportedFiles: ['readme.txt', 'notes.doc', 'image.png'],
        totalSize: 3124000,
        isImporting: false,
        mergeStrategy: 'auto',
    },
};

export const Importing: Story = {
    args: {
        files: sampleFiles,
        unsupportedFiles: [],
        totalSize: 5684000,
        isImporting: true,
        progress: {
            currentFile: 'data_2024_02.csv',
            currentIndex: 1,
            totalFiles: 5,
            completedFiles: 1,
            failedFiles: 0,
            percentage: 40,
        },
        mergeStrategy: 'merge',
    },
};

export const MergeStrategy: Story = {
    args: {
        files: sampleFiles.slice(0, 3),
        unsupportedFiles: [],
        totalSize: 3124000,
        isImporting: false,
        mergeStrategy: 'merge',
    },
};

export const SeparateStrategy: Story = {
    args: {
        files: sampleFiles.slice(0, 3),
        unsupportedFiles: [],
        totalSize: 3124000,
        isImporting: false,
        mergeStrategy: 'separate',
    },
};

export const ManyFiles: Story = {
    args: {
        files: Array.from({ length: 25 }, (_, i) => ({
            name: `data_file_${i + 1}.csv`,
            format: 'csv' as const,
            size: 500000 + Math.random() * 500000,
        })),
        unsupportedFiles: [],
        totalSize: 15000000,
        isImporting: false,
        mergeStrategy: 'auto',
    },
};

export const WithColumnCompatibility: Story = {
    args: {
        files: sampleFiles.slice(0, 3),
        unsupportedFiles: [],
        totalSize: 3124000,
        isImporting: false,
        mergeStrategy: 'auto',
        columnCompatibility: {
            commonColumns: ['user_id', 'timestamp', 'event', 'revenue'],
            allColumns: ['user_id', 'timestamp', 'event', 'revenue', 'platform', 'country'],
            uniqueToFiles: {
                'data_2024_03.csv': ['platform', 'country'],
            },
            isFullyCompatible: false,
        },
    },
};

export const FullyCompatible: Story = {
    args: {
        files: sampleFiles.slice(0, 3),
        unsupportedFiles: [],
        totalSize: 3124000,
        isImporting: false,
        mergeStrategy: 'merge',
        columnCompatibility: {
            commonColumns: ['user_id', 'timestamp', 'event', 'revenue'],
            allColumns: ['user_id', 'timestamp', 'event', 'revenue'],
            uniqueToFiles: {},
            isFullyCompatible: true,
        },
    },
};
