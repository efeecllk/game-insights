import type { Meta, StoryObj } from '@storybook/react-vite';
import { FunnelChart } from './FunnelChart';
import type { FunnelStep } from '../../types';

const meta: Meta<typeof FunnelChart> = {
    title: 'Charts/FunnelChart',
    component: FunnelChart,
    parameters: {
        layout: 'padded',
        docs: {
            description: {
                component: 'A funnel chart for visualizing conversion/progression funnels with drop-off indicators.',
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
type Story = StoryObj<typeof FunnelChart>;

const defaultData: FunnelStep[] = [
    { name: 'Install', value: 100000, percentage: 100 },
    { name: 'Tutorial Start', value: 85000, percentage: 85, dropOff: 15 },
    { name: 'Tutorial Complete', value: 65000, percentage: 65, dropOff: 20 },
    { name: 'First Purchase', value: 8000, percentage: 8, dropOff: 57 },
    { name: 'Repeat Purchase', value: 3200, percentage: 3.2, dropOff: 4.8 },
];

export const Default: Story = {
    args: {
        data: defaultData,
    },
};

export const OnboardingFunnel: Story = {
    args: {
        data: [
            { name: 'App Open', value: 50000, percentage: 100 },
            { name: 'Sign Up Started', value: 35000, percentage: 70, dropOff: 30 },
            { name: 'Email Verified', value: 28000, percentage: 56, dropOff: 14 },
            { name: 'Profile Complete', value: 22000, percentage: 44, dropOff: 12 },
            { name: 'First Action', value: 18000, percentage: 36, dropOff: 8 },
        ],
    },
};

export const PurchaseFunnel: Story = {
    args: {
        data: [
            { name: 'View Store', value: 100000, percentage: 100 },
            { name: 'Add to Cart', value: 25000, percentage: 25, dropOff: 75 },
            { name: 'Begin Checkout', value: 15000, percentage: 15, dropOff: 10 },
            { name: 'Complete Purchase', value: 8000, percentage: 8, dropOff: 7 },
        ],
    },
};

export const HighConversion: Story = {
    args: {
        data: [
            { name: 'Step 1', value: 10000, percentage: 100 },
            { name: 'Step 2', value: 9500, percentage: 95, dropOff: 5 },
            { name: 'Step 3', value: 9000, percentage: 90, dropOff: 5 },
            { name: 'Step 4', value: 8700, percentage: 87, dropOff: 3 },
        ],
    },
};

export const Empty: Story = {
    args: {
        data: [],
    },
};

export const SingleStep: Story = {
    args: {
        data: [
            { name: 'Only Step', value: 1000, percentage: 100 },
        ],
    },
};
