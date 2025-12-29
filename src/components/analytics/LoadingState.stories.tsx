import type { Meta, StoryObj } from '@storybook/react-vite';
import { LoadingState } from './LoadingState';

const meta: Meta<typeof LoadingState> = {
  title: 'Analytics/LoadingState',
  component: LoadingState,
  parameters: {
    layout: 'fullscreen',
    backgrounds: {
      default: 'light',
      values: [
        { name: 'light', value: '#f9fafb' },
        { name: 'dark', value: '#0f0f23' },
      ],
    },
    docs: {
      description: {
        component: 'A loading indicator that shows the progress of AI data analysis through multiple stages.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    stage: {
      control: 'select',
      options: ['sampling', 'analyzing', 'detecting', 'generating'],
      description: 'Current analysis stage',
    },
    progress: {
      control: { type: 'range', min: 0, max: 100 },
      description: 'Progress percentage (0-100)',
    },
  },
};

export default meta;
type Story = StoryObj<typeof LoadingState>;

export const Default: Story = {
  args: {
    stage: 'sampling',
    progress: 0,
  },
};

export const Sampling: Story = {
  args: {
    stage: 'sampling',
    progress: 15,
  },
};

export const Analyzing: Story = {
  args: {
    stage: 'analyzing',
    progress: 40,
  },
};

export const Detecting: Story = {
  args: {
    stage: 'detecting',
    progress: 65,
  },
};

export const Generating: Story = {
  args: {
    stage: 'generating',
    progress: 90,
  },
};

export const AlmostComplete: Story = {
  args: {
    stage: 'generating',
    progress: 99,
  },
};

export const NoProgress: Story = {
  args: {
    stage: 'analyzing',
    progress: 0,
  },
  parameters: {
    docs: {
      description: {
        story: 'When progress is 0, the progress bar is hidden.',
      },
    },
  },
};
