import type { Meta, StoryObj } from '@storybook/react-vite';
import { UploadZone } from './UploadZone';

// Mock function for story actions
const mockFn = () => {};

const meta: Meta<typeof UploadZone> = {
    title: 'Upload/UploadZone',
    component: UploadZone,
    parameters: {
        layout: 'padded',
        docs: {
            description: {
                component: 'Multi-mode upload component supporting file, folder, URL, and paste imports.',
            },
        },
        chromatic: { viewports: [320, 768, 1200] },
    },
    tags: ['autodocs'],
    decorators: [
        (Story) => (
            <div className="bg-bg-darkest p-4 min-h-[500px]">
                <Story />
            </div>
        ),
    ],
    args: {
        onFileLoaded: mockFn,
        onFolderLoaded: mockFn,
    },
};

export default meta;
type Story = StoryObj<typeof UploadZone>;

export const Default: Story = {
    args: {},
};

export const Loading: Story = {
    args: {
        isLoading: true,
    },
};
