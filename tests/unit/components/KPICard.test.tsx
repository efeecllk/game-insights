/**
 * KPICard Component Tests
 * Phase 7: Testing & Quality Assurance
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Users, DollarSign, TrendingUp } from 'lucide-react';
import { KPICard } from '../../../src/components/ui/KPICard';

describe('KPICard', () => {
    it('should render label and value', () => {
        render(
            <KPICard
                icon={Users}
                label="Total Users"
                value="1,234"
                changeType="neutral"
            />
        );

        expect(screen.getByText('Total Users')).toBeInTheDocument();
        expect(screen.getByText('1,234')).toBeInTheDocument();
    });

    it('should render numeric value', () => {
        render(
            <KPICard
                icon={DollarSign}
                label="Revenue"
                value={5000}
                changeType="up"
            />
        );

        expect(screen.getByText('5000')).toBeInTheDocument();
    });

    it('should display positive change with plus sign', () => {
        render(
            <KPICard
                icon={TrendingUp}
                label="Growth"
                value="100"
                change={15}
                changeType="up"
            />
        );

        expect(screen.getByText('+15%')).toBeInTheDocument();
    });

    it('should display negative change', () => {
        render(
            <KPICard
                icon={TrendingUp}
                label="Decline"
                value="50"
                change={-10}
                changeType="down"
            />
        );

        expect(screen.getByText('-10%')).toBeInTheDocument();
    });

    it('should display neutral change', () => {
        render(
            <KPICard
                icon={TrendingUp}
                label="Stable"
                value="100"
                change={0}
                changeType="neutral"
            />
        );

        expect(screen.getByText('0%')).toBeInTheDocument();
    });

    it('should not display change badge when change is undefined', () => {
        render(
            <KPICard
                icon={Users}
                label="Users"
                value="100"
                changeType="neutral"
            />
        );

        // Should not find any percentage text
        expect(screen.queryByText(/%$/)).not.toBeInTheDocument();
    });

    it('should apply correct styling for up change', () => {
        render(
            <KPICard
                icon={TrendingUp}
                label="Test"
                value="100"
                change={10}
                changeType="up"
            />
        );

        const badge = screen.getByText('+10%');
        // Badge container should have success theme styles
        expect(badge.parentElement).toHaveClass('text-th-success');
        expect(badge.parentElement).toHaveClass('bg-th-success-muted');
    });

    it('should apply correct styling for down change', () => {
        render(
            <KPICard
                icon={TrendingUp}
                label="Test"
                value="100"
                change={-5}
                changeType="down"
            />
        );

        const badge = screen.getByText('-5%');
        // Badge container should have error theme styles
        expect(badge.parentElement).toHaveClass('text-th-error');
        expect(badge.parentElement).toHaveClass('bg-th-error-muted');
    });

    it('should apply correct styling for neutral change', () => {
        render(
            <KPICard
                icon={TrendingUp}
                label="Test"
                value="100"
                change={0}
                changeType="neutral"
            />
        );

        const badge = screen.getByText('0%');
        // Badge container should have muted theme styles
        expect(badge.parentElement).toHaveClass('text-th-text-muted');
        expect(badge.parentElement).toHaveClass('bg-th-bg-elevated');
    });

    it('should render the icon', () => {
        render(
            <KPICard
                icon={TrendingUp}
                label="Test"
                value="100"
                changeType="neutral"
            />
        );

        // Icon container should exist with proper styling
        const iconContainer = document.querySelector('.bg-th-accent-primary-muted');
        expect(iconContainer).toBeInTheDocument();
    });
});
