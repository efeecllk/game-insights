import type { Meta, StoryObj } from '@storybook/react';
import { Users, DollarSign, TrendingUp, Activity, Gamepad2, Clock } from 'lucide-react';
import { KPICard } from './KPICard';

const meta: Meta<typeof KPICard> = {
  title: 'UI/KPICard',
  component: KPICard,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A card component for displaying Key Performance Indicators with icons and change indicators.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    icon: {
      control: false,
      description: 'Lucide icon component to display',
    },
    label: {
      control: 'text',
      description: 'Label text for the KPI',
    },
    value: {
      control: 'text',
      description: 'The main value to display',
    },
    change: {
      control: 'number',
      description: 'Percentage change value',
    },
    changeType: {
      control: 'select',
      options: ['up', 'down', 'neutral'],
      description: 'Direction of change',
    },
  },
};

export default meta;
type Story = StoryObj<typeof KPICard>;

export const Default: Story = {
  args: {
    icon: Users,
    label: 'Daily Active Users',
    value: '12,847',
    change: 12.5,
    changeType: 'up',
  },
};

export const Revenue: Story = {
  args: {
    icon: DollarSign,
    label: 'Revenue',
    value: '$45,231',
    change: 8.3,
    changeType: 'up',
  },
};

export const NegativeChange: Story = {
  args: {
    icon: TrendingUp,
    label: 'Retention D7',
    value: '23.4%',
    change: -5.2,
    changeType: 'down',
  },
};

export const NeutralChange: Story = {
  args: {
    icon: Activity,
    label: 'Sessions',
    value: '89,432',
    change: 0,
    changeType: 'neutral',
  },
};

export const NoChange: Story = {
  args: {
    icon: Gamepad2,
    label: 'Total Players',
    value: '1.2M',
  },
};

export const LongValue: Story = {
  args: {
    icon: Clock,
    label: 'Average Session Duration',
    value: '12m 34s',
    change: 15.7,
    changeType: 'up',
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="grid grid-cols-3 gap-4 max-w-4xl">
      <KPICard
        icon={Users}
        label="Daily Active Users"
        value="12,847"
        change={12.5}
        changeType="up"
      />
      <KPICard
        icon={DollarSign}
        label="Revenue"
        value="$45,231"
        change={8.3}
        changeType="up"
      />
      <KPICard
        icon={TrendingUp}
        label="Retention D7"
        value="23.4%"
        change={-5.2}
        changeType="down"
      />
      <KPICard
        icon={Activity}
        label="Sessions"
        value="89,432"
        change={0}
        changeType="neutral"
      />
      <KPICard
        icon={Gamepad2}
        label="Total Players"
        value="1.2M"
        changeType="neutral"
      />
      <KPICard
        icon={Clock}
        label="Avg Session"
        value="12m 34s"
        change={15.7}
        changeType="up"
      />
    </div>
  ),
};
