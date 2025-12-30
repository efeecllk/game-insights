import type { Meta, StoryObj } from '@storybook/react-vite';
import { RetentionCurve } from './RetentionCurve';
import type { RetentionData } from '../../types';

const meta: Meta<typeof RetentionCurve> = {
    title: 'Charts/RetentionCurve',
    component: RetentionCurve,
    parameters: {
        layout: 'padded',
        docs: {
            description: {
                component: 'A line chart showing user retention over time with optional benchmark comparison.',
            },
        },
        chromatic: { viewports: [320, 768, 1200] },
    },
    tags: ['autodocs'],
    decorators: [
        (Story) => (
            <div className="bg-bg-darkest p-4" style={{ height: '400px', width: '100%' }}>
                <Story />
            </div>
        ),
    ],
};

export default meta;
type Story = StoryObj<typeof RetentionCurve>;

const defaultData: RetentionData = {
    days: ['D0', 'D1', 'D3', 'D7', 'D14', 'D30'],
    values: [100, 42, 28, 18, 12, 8],
    benchmark: [100, 45, 30, 20, 14, 10],
};

export const Default: Story = {
    args: {
        data: defaultData,
    },
};

export const WithoutBenchmark: Story = {
    args: {
        data: {
            days: ['D0', 'D1', 'D3', 'D7', 'D14', 'D30'],
            values: [100, 45, 32, 22, 15, 11],
        },
    },
};

export const HighRetention: Story = {
    args: {
        data: {
            days: ['D0', 'D1', 'D3', 'D7', 'D14', 'D30'],
            values: [100, 75, 60, 50, 42, 35],
            benchmark: [100, 45, 30, 20, 14, 10],
        },
    },
};

export const LowRetention: Story = {
    args: {
        data: {
            days: ['D0', 'D1', 'D3', 'D7', 'D14', 'D30'],
            values: [100, 25, 12, 5, 2, 1],
            benchmark: [100, 45, 30, 20, 14, 10],
        },
    },
};

export const ExtendedPeriod: Story = {
    args: {
        data: {
            days: ['D0', 'D1', 'D3', 'D7', 'D14', 'D30', 'D60', 'D90'],
            values: [100, 42, 28, 18, 12, 8, 5, 3],
            benchmark: [100, 45, 30, 20, 14, 10, 7, 5],
        },
    },
};

export const ShortPeriod: Story = {
    args: {
        data: {
            days: ['D0', 'D1', 'D3', 'D7'],
            values: [100, 50, 35, 25],
        },
    },
};

export const NoLegend: Story = {
    args: {
        data: defaultData,
        config: {
            showLegend: false,
        },
    },
};
