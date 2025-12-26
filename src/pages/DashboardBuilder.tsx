/**
 * Dashboard Builder
 * Drag-and-drop custom dashboard creation
 * Phase 6: Polish, Power & Production
 */

import { useState, useEffect, useMemo } from 'react';
import {
    LayoutDashboard,
    Plus,
    Save,
    Eye,
    Edit3,
    Trash2,
    Copy,
    TrendingUp,
    TrendingDown,
    MoreVertical,
    X,
    RefreshCw,
    Download,
} from 'lucide-react';
import { ExportModal } from '../components/ExportModal';
import {
    Dashboard,
    DashboardWidget,
    WidgetType,
    MetricType,
    getAllDashboards,
    saveDashboard,
    deleteDashboard,
    createDashboard,
    createWidget,
    duplicateDashboard,
    initializeDefaultDashboards,
    WIDGET_PRESETS,
    METRIC_OPTIONS,
    getMockMetricValue,
    getMockChartData,
} from '../lib/dashboardStore';

// ============================================================================
// Main Page Component
// ============================================================================

export function DashboardBuilderPage() {
    const [dashboards, setDashboards] = useState<Dashboard[]>([]);
    const [selectedDashboard, setSelectedDashboard] = useState<Dashboard | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [showWidgetPicker, setShowWidgetPicker] = useState(false);
    const [selectedWidget, setSelectedWidget] = useState<DashboardWidget | null>(null);
    const [showExportModal, setShowExportModal] = useState(false);

    useEffect(() => {
        loadDashboards();
    }, []);

    async function loadDashboards() {
        setLoading(true);
        await initializeDefaultDashboards();
        const all = await getAllDashboards();
        setDashboards(all);
        if (all.length > 0 && !selectedDashboard) {
            setSelectedDashboard(all[0]);
        }
        setLoading(false);
    }

    async function handleSaveDashboard() {
        if (!selectedDashboard) return;
        await saveDashboard(selectedDashboard);
        await loadDashboards();
        setIsEditing(false);
    }

    async function handleCreateDashboard() {
        const newDash = createDashboard('New Dashboard');
        await saveDashboard(newDash);
        await loadDashboards();
        setSelectedDashboard(newDash);
        setIsEditing(true);
    }

    async function handleDeleteDashboard(id: string) {
        await deleteDashboard(id);
        await loadDashboards();
        if (selectedDashboard?.id === id) {
            const remaining = dashboards.filter(d => d.id !== id);
            setSelectedDashboard(remaining[0] || null);
        }
    }

    async function handleDuplicateDashboard(id: string) {
        const original = dashboards.find(d => d.id === id);
        if (!original) return;
        const duplicate = await duplicateDashboard(id, `${original.name} (Copy)`);
        if (duplicate) {
            await loadDashboards();
            setSelectedDashboard(duplicate);
        }
    }

    function handleAddWidget(type: WidgetType) {
        if (!selectedDashboard) return;

        const preset = WIDGET_PRESETS[type];
        const newWidget = createWidget(type, {
            x: 0,
            y: getNextY(selectedDashboard.widgets),
            w: preset.defaultSize.w,
            h: preset.defaultSize.h,
        }, {
            title: preset.name,
        });

        setSelectedDashboard({
            ...selectedDashboard,
            widgets: [...selectedDashboard.widgets, newWidget],
        });
        setShowWidgetPicker(false);
        setSelectedWidget(newWidget);
    }

    function handleUpdateWidget(widgetId: string, updates: Partial<DashboardWidget>) {
        if (!selectedDashboard) return;

        setSelectedDashboard({
            ...selectedDashboard,
            widgets: selectedDashboard.widgets.map(w =>
                w.id === widgetId ? { ...w, ...updates } : w
            ),
        });
    }

    function handleDeleteWidget(widgetId: string) {
        if (!selectedDashboard) return;

        setSelectedDashboard({
            ...selectedDashboard,
            widgets: selectedDashboard.widgets.filter(w => w.id !== widgetId),
        });
        if (selectedWidget?.id === widgetId) {
            setSelectedWidget(null);
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                        <LayoutDashboard className="w-7 h-7 text-accent-primary" />
                        Dashboard Builder
                    </h1>
                    <p className="text-zinc-500 mt-1">Create custom dashboards with drag-and-drop widgets</p>
                </div>
                <div className="flex gap-3">
                    {isEditing && selectedDashboard ? (
                        <>
                            <button
                                onClick={() => setShowWidgetPicker(true)}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-bg-card border border-white/10 text-zinc-300 hover:bg-bg-card-hover transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                                Add Widget
                            </button>
                            <button
                                onClick={() => setIsEditing(false)}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-bg-card border border-white/10 text-zinc-300 hover:bg-bg-card-hover transition-colors"
                            >
                                <Eye className="w-4 h-4" />
                                Preview
                            </button>
                            <button
                                onClick={handleSaveDashboard}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent-primary text-white hover:bg-accent-primary/90 transition-colors"
                            >
                                <Save className="w-4 h-4" />
                                Save
                            </button>
                        </>
                    ) : (
                        <>
                            {selectedDashboard && (
                                <>
                                    <button
                                        onClick={() => setShowExportModal(true)}
                                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-bg-card border border-white/10 text-zinc-300 hover:bg-bg-card-hover transition-colors"
                                    >
                                        <Download className="w-4 h-4" />
                                        Export
                                    </button>
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-bg-card border border-white/10 text-zinc-300 hover:bg-bg-card-hover transition-colors"
                                    >
                                        <Edit3 className="w-4 h-4" />
                                        Edit
                                    </button>
                                </>
                            )}
                            <button
                                onClick={handleCreateDashboard}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent-primary text-white hover:bg-accent-primary/90 transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                                New Dashboard
                            </button>
                        </>
                    )}
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-primary"></div>
                </div>
            ) : (
                <div className="flex gap-6">
                    {/* Dashboard List Sidebar */}
                    <div className="w-64 flex-shrink-0">
                        <div className="bg-bg-card rounded-card border border-white/[0.06] overflow-hidden">
                            <div className="p-4 border-b border-white/[0.06]">
                                <h3 className="text-sm font-medium text-white">Dashboards</h3>
                            </div>
                            <div className="p-2">
                                {dashboards.map((dash) => (
                                    <DashboardListItem
                                        key={dash.id}
                                        dashboard={dash}
                                        isSelected={selectedDashboard?.id === dash.id}
                                        onSelect={() => {
                                            setSelectedDashboard(dash);
                                            setIsEditing(false);
                                            setSelectedWidget(null);
                                        }}
                                        onDelete={() => handleDeleteDashboard(dash.id)}
                                        onDuplicate={() => handleDuplicateDashboard(dash.id)}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Main Canvas */}
                    <div className="flex-1">
                        {selectedDashboard ? (
                            <DashboardCanvas
                                dashboard={selectedDashboard}
                                isEditing={isEditing}
                                selectedWidget={selectedWidget}
                                onSelectWidget={setSelectedWidget}
                                onDeleteWidget={handleDeleteWidget}
                            />
                        ) : (
                            <div className="bg-bg-card rounded-card p-12 border border-white/[0.06] text-center">
                                <LayoutDashboard className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-white mb-2">No dashboard selected</h3>
                                <p className="text-zinc-500 mb-4">Create a new dashboard to get started</p>
                                <button
                                    onClick={handleCreateDashboard}
                                    className="px-4 py-2 rounded-xl bg-accent-primary text-white hover:bg-accent-primary/90 transition-colors"
                                >
                                    Create Dashboard
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Widget Config Panel */}
                    {isEditing && selectedWidget && (
                        <div className="w-80 flex-shrink-0">
                            <WidgetConfigPanel
                                widget={selectedWidget}
                                onUpdate={(updates) => handleUpdateWidget(selectedWidget.id, updates)}
                                onClose={() => setSelectedWidget(null)}
                                onDelete={() => handleDeleteWidget(selectedWidget.id)}
                            />
                        </div>
                    )}
                </div>
            )}

            {/* Widget Picker Modal */}
            {showWidgetPicker && (
                <WidgetPicker
                    onSelect={handleAddWidget}
                    onClose={() => setShowWidgetPicker(false)}
                />
            )}

            {/* Export Modal */}
            <ExportModal
                isOpen={showExportModal}
                onClose={() => setShowExportModal(false)}
                title={selectedDashboard?.name || 'Dashboard'}
                description={selectedDashboard?.description}
                dashboardId={selectedDashboard?.id}
                metrics={selectedDashboard?.widgets
                    .filter(w => w.type === 'kpi')
                    .map(w => ({
                        label: w.config.title || 'Metric',
                        value: getMockMetricValue(w.config.metric || 'dau').value,
                        change: getMockMetricValue(w.config.metric || 'dau').change,
                    }))}
            />
        </div>
    );
}

// ============================================================================
// Dashboard List Item
// ============================================================================

function DashboardListItem({
    dashboard,
    isSelected,
    onSelect,
    onDelete,
    onDuplicate,
}: {
    dashboard: Dashboard;
    isSelected: boolean;
    onSelect: () => void;
    onDelete: () => void;
    onDuplicate: () => void;
}) {
    const [showMenu, setShowMenu] = useState(false);

    return (
        <div
            className={`group relative flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                isSelected
                    ? 'bg-accent-primary/10 text-white'
                    : 'hover:bg-white/5 text-zinc-400'
            }`}
            onClick={onSelect}
        >
            <span className="text-xl">{dashboard.icon}</span>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{dashboard.name}</p>
                <p className="text-xs text-zinc-500">{dashboard.widgets.length} widgets</p>
            </div>
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(!showMenu);
                }}
                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/10 rounded transition-all"
            >
                <MoreVertical className="w-4 h-4" />
            </button>

            {showMenu && (
                <div className="absolute right-0 top-full mt-1 z-10 bg-bg-elevated rounded-xl border border-white/10 shadow-xl py-1 min-w-32">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onDuplicate();
                            setShowMenu(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-zinc-300 hover:bg-white/5 transition-colors"
                    >
                        <Copy className="w-4 h-4" />
                        Duplicate
                    </button>
                    {!dashboard.isDefault && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete();
                                setShowMenu(false);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-white/5 transition-colors"
                        >
                            <Trash2 className="w-4 h-4" />
                            Delete
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

// ============================================================================
// Dashboard Canvas
// ============================================================================

function DashboardCanvas({
    dashboard,
    isEditing,
    selectedWidget,
    onSelectWidget,
    onDeleteWidget,
}: {
    dashboard: Dashboard;
    isEditing: boolean;
    selectedWidget: DashboardWidget | null;
    onSelectWidget: (widget: DashboardWidget | null) => void;
    onDeleteWidget: (widgetId: string) => void;
}) {
    const gridStyle = {
        display: 'grid',
        gridTemplateColumns: `repeat(${dashboard.columns}, 1fr)`,
        gap: '16px',
        minHeight: '600px',
    };

    // Sort widgets by position for proper rendering
    const sortedWidgets = useMemo(() => {
        return [...dashboard.widgets].sort((a, b) => {
            if (a.position.y !== b.position.y) return a.position.y - b.position.y;
            return a.position.x - b.position.x;
        });
    }, [dashboard.widgets]);

    return (
        <div className="bg-bg-card rounded-card border border-white/[0.06] p-6">
            {/* Dashboard Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <span className="text-2xl">{dashboard.icon}</span>
                    <div>
                        <h2 className="text-xl font-semibold text-white">{dashboard.name}</h2>
                        {dashboard.description && (
                            <p className="text-sm text-zinc-500">{dashboard.description}</p>
                        )}
                    </div>
                </div>
                {!isEditing && (
                    <div className="flex items-center gap-2 text-sm text-zinc-500">
                        <RefreshCw className="w-4 h-4" />
                        <span>Last updated: just now</span>
                    </div>
                )}
            </div>

            {/* Widget Grid */}
            <div style={gridStyle}>
                {sortedWidgets.map((widget) => (
                    <WidgetRenderer
                        key={widget.id}
                        widget={widget}
                        isEditing={isEditing}
                        isSelected={selectedWidget?.id === widget.id}
                        columns={dashboard.columns}
                        onSelect={() => onSelectWidget(widget)}
                        onDelete={() => onDeleteWidget(widget.id)}
                    />
                ))}
            </div>

            {/* Empty state */}
            {dashboard.widgets.length === 0 && (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                    <LayoutDashboard className="w-12 h-12 text-zinc-600 mb-4" />
                    <p className="text-zinc-400 mb-2">No widgets yet</p>
                    <p className="text-sm text-zinc-500">Click "Add Widget" to start building</p>
                </div>
            )}
        </div>
    );
}

// ============================================================================
// Widget Renderer
// ============================================================================

function WidgetRenderer({
    widget,
    isEditing,
    isSelected,
    columns,
    onSelect,
    onDelete,
}: {
    widget: DashboardWidget;
    isEditing: boolean;
    isSelected: boolean;
    columns: number;
    onSelect: () => void;
    onDelete: () => void;
}) {
    const gridStyle = {
        gridColumn: `span ${Math.min(widget.position.w, columns)}`,
        gridRow: `span ${widget.position.h}`,
    };

    return (
        <div
            style={gridStyle}
            className={`relative bg-white/[0.02] rounded-xl border transition-all ${
                isSelected
                    ? 'border-accent-primary ring-2 ring-accent-primary/20'
                    : isEditing
                    ? 'border-white/10 hover:border-white/20 cursor-pointer'
                    : 'border-white/[0.06]'
            }`}
            onClick={isEditing ? onSelect : undefined}
        >
            {/* Edit mode controls */}
            {isEditing && (
                <div className="absolute top-2 right-2 z-10 flex gap-1">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete();
                        }}
                        className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                </div>
            )}

            {/* Widget content */}
            <div className="p-4 h-full">
                {widget.type === 'kpi' && <KPIWidget widget={widget} />}
                {widget.type === 'line_chart' && <LineChartWidget widget={widget} />}
                {widget.type === 'bar_chart' && <BarChartWidget widget={widget} />}
                {widget.type === 'pie_chart' && <PieChartWidget widget={widget} />}
                {widget.type === 'area_chart' && <AreaChartWidget widget={widget} />}
                {widget.type === 'table' && <TableWidget widget={widget} />}
                {widget.type === 'funnel' && <FunnelWidget widget={widget} />}
                {widget.type === 'cohort' && <CohortWidget widget={widget} />}
                {widget.type === 'text' && <TextWidget widget={widget} />}
            </div>
        </div>
    );
}

// ============================================================================
// Widget Components
// ============================================================================

function KPIWidget({ widget }: { widget: DashboardWidget }) {
    const metric = widget.config.metric || 'dau';
    const data = getMockMetricValue(metric);
    const format = widget.config.format || METRIC_OPTIONS.find(m => m.value === metric)?.format || 'number';

    const formatValue = (value: number) => {
        if (format === 'currency') return `$${value.toLocaleString()}`;
        if (format === 'percent') return `${value.toFixed(1)}%`;
        return value.toLocaleString();
    };

    return (
        <div className="h-full flex flex-col justify-center">
            <p className="text-sm text-zinc-500 mb-1">{widget.config.title || 'Metric'}</p>
            <p className="text-3xl font-bold text-white mb-2">{formatValue(data.value)}</p>
            {widget.config.showTrend !== false && (
                <div className={`flex items-center gap-1 text-sm ${data.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {data.change >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    <span>{data.change >= 0 ? '+' : ''}{data.change}%</span>
                    <span className="text-zinc-500">vs last period</span>
                </div>
            )}
        </div>
    );
}

function LineChartWidget({ widget }: { widget: DashboardWidget }) {
    const data = getMockChartData(widget.config.metric || 'dau', 14);
    const maxValue = Math.max(...data.map(d => d.value));
    const minValue = Math.min(...data.map(d => d.value));

    return (
        <div className="h-full flex flex-col">
            <p className="text-sm font-medium text-white mb-3">{widget.config.title || 'Line Chart'}</p>
            <div className="flex-1 flex items-end gap-1">
                {data.map((d, i) => {
                    const height = ((d.value - minValue) / (maxValue - minValue)) * 100 || 50;
                    return (
                        <div
                            key={i}
                            className="flex-1 bg-accent-primary/20 rounded-t transition-all hover:bg-accent-primary/40"
                            style={{ height: `${Math.max(10, height)}%` }}
                            title={`${d.date}: ${d.value.toLocaleString()}`}
                        />
                    );
                })}
            </div>
        </div>
    );
}

function BarChartWidget({ widget }: { widget: DashboardWidget }) {
    const mockData = [
        { label: 'Category A', value: 65 },
        { label: 'Category B', value: 45 },
        { label: 'Category C', value: 30 },
        { label: 'Category D', value: 20 },
    ];

    return (
        <div className="h-full flex flex-col">
            <p className="text-sm font-medium text-white mb-3">{widget.config.title || 'Bar Chart'}</p>
            <div className="flex-1 flex flex-col gap-2 justify-center">
                {mockData.map((d, i) => (
                    <div key={i} className="flex items-center gap-2">
                        <span className="text-xs text-zinc-500 w-20 truncate">{d.label}</span>
                        <div className="flex-1 h-4 bg-white/5 rounded overflow-hidden">
                            <div
                                className="h-full bg-accent-primary/60 rounded"
                                style={{ width: `${d.value}%` }}
                            />
                        </div>
                        <span className="text-xs text-zinc-400 w-8">{d.value}%</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

function PieChartWidget({ widget }: { widget: DashboardWidget }) {
    const mockData = [
        { label: 'IAP', value: 60, color: '#8b5cf6' },
        { label: 'Ads', value: 25, color: '#6366f1' },
        { label: 'Subs', value: 15, color: '#ec4899' },
    ];

    return (
        <div className="h-full flex flex-col">
            <p className="text-sm font-medium text-white mb-3">{widget.config.title || 'Pie Chart'}</p>
            <div className="flex-1 flex items-center gap-4">
                <div className="relative w-24 h-24">
                    <svg viewBox="0 0 32 32" className="w-full h-full -rotate-90">
                        {mockData.reduce((acc, d, i) => {
                            const offset = acc.offset;
                            const circumference = Math.PI * 2 * 10;
                            const strokeDasharray = `${(d.value / 100) * circumference} ${circumference}`;
                            acc.elements.push(
                                <circle
                                    key={i}
                                    cx="16"
                                    cy="16"
                                    r="10"
                                    fill="transparent"
                                    stroke={d.color}
                                    strokeWidth="6"
                                    strokeDasharray={strokeDasharray}
                                    strokeDashoffset={-offset}
                                />
                            );
                            acc.offset += (d.value / 100) * circumference;
                            return acc;
                        }, { elements: [] as JSX.Element[], offset: 0 }).elements}
                    </svg>
                </div>
                <div className="flex-1 space-y-2">
                    {mockData.map((d, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                            <span className="text-zinc-400">{d.label}</span>
                            <span className="text-white font-medium ml-auto">{d.value}%</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function AreaChartWidget({ widget }: { widget: DashboardWidget }) {
    return <LineChartWidget widget={widget} />;
}

function TableWidget({ widget }: { widget: DashboardWidget }) {
    const mockData = [
        { id: 1, name: 'Starter Pack', revenue: '$1,249', sales: 312 },
        { id: 2, name: 'Premium Bundle', revenue: '$890', sales: 89 },
        { id: 3, name: 'Coin Pack', revenue: '$567', sales: 567 },
    ];

    return (
        <div className="h-full flex flex-col">
            <p className="text-sm font-medium text-white mb-3">{widget.config.title || 'Table'}</p>
            <div className="flex-1 overflow-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-white/10">
                            <th className="text-left py-2 text-zinc-500 font-medium">Name</th>
                            <th className="text-right py-2 text-zinc-500 font-medium">Revenue</th>
                            <th className="text-right py-2 text-zinc-500 font-medium">Sales</th>
                        </tr>
                    </thead>
                    <tbody>
                        {mockData.map((row) => (
                            <tr key={row.id} className="border-b border-white/5">
                                <td className="py-2 text-zinc-300">{row.name}</td>
                                <td className="py-2 text-right text-white">{row.revenue}</td>
                                <td className="py-2 text-right text-zinc-400">{row.sales}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function FunnelWidget({ widget }: { widget: DashboardWidget }) {
    const mockData = [
        { label: 'Impressions', value: 10000, percent: 100 },
        { label: 'Installs', value: 2500, percent: 25 },
        { label: 'Registrations', value: 1500, percent: 15 },
        { label: 'Purchases', value: 300, percent: 3 },
    ];

    return (
        <div className="h-full flex flex-col">
            <p className="text-sm font-medium text-white mb-3">{widget.config.title || 'Funnel'}</p>
            <div className="flex-1 flex flex-col justify-center gap-2">
                {mockData.map((d, i) => (
                    <div key={i} className="flex items-center gap-2">
                        <div
                            className="h-6 bg-accent-primary/40 rounded flex items-center justify-end pr-2"
                            style={{ width: `${d.percent}%`, minWidth: '40px' }}
                        >
                            <span className="text-xs text-white font-medium">{d.percent}%</span>
                        </div>
                        <span className="text-xs text-zinc-400">{d.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

function CohortWidget({ widget }: { widget: DashboardWidget }) {
    const weeks = ['W1', 'W2', 'W3', 'W4', 'W5'];
    const days = ['D0', 'D1', 'D3', 'D7', 'D14', 'D30'];
    const mockRetention = [
        [100, 42, 32, 18, 12, 8],
        [100, 45, 35, 20, 14, 10],
        [100, 40, 30, 17, 11, 7],
        [100, 44, 33, 19, 13, 9],
        [100, 41, 31, 18, 12, 8],
    ];

    return (
        <div className="h-full flex flex-col">
            <p className="text-sm font-medium text-white mb-3">{widget.config.title || 'Cohort Heatmap'}</p>
            <div className="flex-1 overflow-auto">
                <table className="w-full text-xs">
                    <thead>
                        <tr>
                            <th className="text-left py-1 text-zinc-500"></th>
                            {days.map(d => (
                                <th key={d} className="text-center py-1 text-zinc-500 font-medium">{d}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {weeks.map((week, i) => (
                            <tr key={week}>
                                <td className="py-1 text-zinc-500 font-medium">{week}</td>
                                {mockRetention[i].map((val, j) => (
                                    <td key={j} className="p-1">
                                        <div
                                            className="rounded text-center py-1 text-white"
                                            style={{
                                                backgroundColor: `rgba(139, 92, 246, ${val / 100})`,
                                            }}
                                        >
                                            {val}%
                                        </div>
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function TextWidget({ widget }: { widget: DashboardWidget }) {
    return (
        <div className="h-full flex items-center">
            <p className="text-zinc-300">{widget.config.textContent || widget.config.title || 'Text content'}</p>
        </div>
    );
}

// ============================================================================
// Widget Picker Modal
// ============================================================================

function WidgetPicker({
    onSelect,
    onClose,
}: {
    onSelect: (type: WidgetType) => void;
    onClose: () => void;
}) {
    const widgetTypes: WidgetType[] = ['kpi', 'line_chart', 'bar_chart', 'pie_chart', 'area_chart', 'table', 'funnel', 'cohort', 'text'];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-bg-elevated rounded-2xl border border-white/10 shadow-2xl w-full max-w-2xl">
                <div className="flex items-center justify-between p-6 border-b border-white/10">
                    <h3 className="text-lg font-semibold text-white">Add Widget</h3>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                        <X className="w-5 h-5 text-zinc-400" />
                    </button>
                </div>
                <div className="p-6 grid grid-cols-3 gap-4">
                    {widgetTypes.map((type) => {
                        const preset = WIDGET_PRESETS[type];
                        return (
                            <button
                                key={type}
                                onClick={() => onSelect(type)}
                                className="flex flex-col items-center gap-3 p-4 rounded-xl border border-white/10 hover:border-accent-primary hover:bg-accent-primary/5 transition-all text-center"
                            >
                                <span className="text-3xl">{preset.icon}</span>
                                <div>
                                    <p className="text-white font-medium">{preset.name}</p>
                                    <p className="text-xs text-zinc-500">{preset.description}</p>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

// ============================================================================
// Widget Config Panel
// ============================================================================

function WidgetConfigPanel({
    widget,
    onUpdate,
    onClose,
    onDelete,
}: {
    widget: DashboardWidget;
    onUpdate: (updates: Partial<DashboardWidget>) => void;
    onClose: () => void;
    onDelete: () => void;
}) {
    const preset = WIDGET_PRESETS[widget.type];

    return (
        <div className="bg-bg-card rounded-card border border-white/[0.06] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-white/[0.06]">
                <div className="flex items-center gap-2">
                    <span className="text-xl">{preset.icon}</span>
                    <h3 className="text-sm font-medium text-white">{preset.name}</h3>
                </div>
                <button onClick={onClose} className="p-1 hover:bg-white/10 rounded transition-colors">
                    <X className="w-4 h-4 text-zinc-400" />
                </button>
            </div>

            <div className="p-4 space-y-4">
                {/* Title */}
                <div>
                    <label className="block text-xs text-zinc-500 mb-1">Title</label>
                    <input
                        type="text"
                        value={widget.config.title || ''}
                        onChange={(e) => onUpdate({ config: { ...widget.config, title: e.target.value } })}
                        className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-accent-primary"
                        placeholder="Widget title"
                    />
                </div>

                {/* Metric selector for applicable widgets */}
                {['kpi', 'line_chart', 'bar_chart', 'area_chart'].includes(widget.type) && (
                    <div>
                        <label className="block text-xs text-zinc-500 mb-1">Metric</label>
                        <select
                            value={widget.config.metric || 'dau'}
                            onChange={(e) => onUpdate({ config: { ...widget.config, metric: e.target.value as MetricType } })}
                            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-accent-primary"
                        >
                            {METRIC_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>
                )}

                {/* Show trend toggle for KPI */}
                {widget.type === 'kpi' && (
                    <div className="flex items-center justify-between">
                        <label className="text-xs text-zinc-500">Show Trend</label>
                        <button
                            onClick={() => onUpdate({ config: { ...widget.config, showTrend: !widget.config.showTrend } })}
                            className={`w-10 h-5 rounded-full transition-colors ${
                                widget.config.showTrend !== false ? 'bg-accent-primary' : 'bg-white/10'
                            }`}
                        >
                            <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                                widget.config.showTrend !== false ? 'translate-x-5' : 'translate-x-0.5'
                            }`} />
                        </button>
                    </div>
                )}

                {/* Text content for text widget */}
                {widget.type === 'text' && (
                    <div>
                        <label className="block text-xs text-zinc-500 mb-1">Content</label>
                        <textarea
                            value={widget.config.textContent || ''}
                            onChange={(e) => onUpdate({ config: { ...widget.config, textContent: e.target.value } })}
                            rows={4}
                            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-accent-primary resize-none"
                            placeholder="Enter text content..."
                        />
                    </div>
                )}

                {/* Size controls */}
                <div>
                    <label className="block text-xs text-zinc-500 mb-2">Size</label>
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="block text-xs text-zinc-600 mb-1">Width</label>
                            <input
                                type="number"
                                value={widget.position.w}
                                onChange={(e) => onUpdate({ position: { ...widget.position, w: parseInt(e.target.value) || 1 } })}
                                min={1}
                                max={12}
                                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-accent-primary"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-zinc-600 mb-1">Height</label>
                            <input
                                type="number"
                                value={widget.position.h}
                                onChange={(e) => onUpdate({ position: { ...widget.position, h: parseInt(e.target.value) || 1 } })}
                                min={1}
                                max={10}
                                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-accent-primary"
                            />
                        </div>
                    </div>
                </div>

                {/* Delete button */}
                <button
                    onClick={onDelete}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors text-sm"
                >
                    <Trash2 className="w-4 h-4" />
                    Delete Widget
                </button>
            </div>
        </div>
    );
}

// ============================================================================
// Helper Functions
// ============================================================================

function getNextY(widgets: DashboardWidget[]): number {
    if (widgets.length === 0) return 0;
    return Math.max(...widgets.map(w => w.position.y + w.position.h));
}

export default DashboardBuilderPage;
