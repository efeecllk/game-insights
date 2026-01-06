/**
 * Dashboard Builder
 * Drag-and-drop custom dashboard creation
 * Redesigned with Obsidian design system
 */

import { useState, useEffect, useMemo, createContext, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
    Sparkles,
    Grid3X3,
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
import { useGameData } from '../hooks/useGameData';
import DataModeIndicator from '../components/ui/DataModeIndicator';
import { IDataProvider } from '../lib/dataProviders';

// Noise texture for Obsidian style
const noiseTexture = `data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E`;

// Animation variants
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.05, delayChildren: 0.1 },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

const cardVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.3 } },
};

// Context to pass data provider to widgets
const DataProviderContext = createContext<{
    dataProvider: IDataProvider;
    hasRealData: boolean;
} | null>(null);

function useDataProviderContext() {
    return useContext(DataProviderContext);
}

// Helper to get metric value from real data or mock
function getMetricValue(metric: MetricType, dataProvider: IDataProvider, hasRealData: boolean): { value: number; change: number } {
    if (!hasRealData) {
        return getMockMetricValue(metric);
    }

    switch (metric) {
        case 'dau':
            return { value: dataProvider.getDAU(), change: 5.2 };
        case 'mau':
            return { value: dataProvider.getMAU(), change: 3.8 };
        case 'arpu':
            return { value: dataProvider.calculateARPU(), change: 2.1 };
        case 'revenue':
            return { value: dataProvider.getTotalRevenue(), change: 8.5 };
        case 'd1_retention':
            return { value: dataProvider.getRetentionDay(1) * 100, change: -1.2 };
        case 'd7_retention':
            return { value: dataProvider.getRetentionDay(7) * 100, change: 0.8 };
        case 'd30_retention':
            return { value: dataProvider.getRetentionDay(30) * 100, change: 1.5 };
        case 'conversion_rate':
            return { value: dataProvider.getPayerConversion() * 100, change: 0.5 };
        default:
            return getMockMetricValue(metric);
    }
}

// Helper to get chart data from real data or mock
function getChartData(metric: MetricType, days: number, dataProvider: IDataProvider, hasRealData: boolean): { date: string; value: number }[] {
    if (!hasRealData) {
        return getMockChartData(metric, days);
    }

    switch (metric) {
        case 'revenue':
            return dataProvider.getRevenueTimeSeries('daily').slice(-days);
        default:
            return getMockChartData(metric, days);
    }
}

// ============================================================================
// Main Page Component
// ============================================================================

export function DashboardBuilderPage() {
    const { dataProvider, hasRealData } = useGameData();
    const [dashboards, setDashboards] = useState<Dashboard[]>([]);
    const [selectedDashboard, setSelectedDashboard] = useState<Dashboard | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [showWidgetPicker, setShowWidgetPicker] = useState(false);
    const [selectedWidget, setSelectedWidget] = useState<DashboardWidget | null>(null);
    const [showExportModal, setShowExportModal] = useState(false);

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

    useEffect(() => {
        loadDashboards();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

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
        <DataProviderContext.Provider value={{ dataProvider, hasRealData }}>
            <motion.div
                className="space-y-6 relative"
                initial="hidden"
                animate="visible"
                variants={containerVariants}
            >
                {/* Background decorations */}
                <div className="fixed inset-0 pointer-events-none overflow-hidden">
                    <div className="absolute top-20 right-1/4 w-[500px] h-[500px] bg-[#DA7756]/5 rounded-full blur-3xl" />
                    <div className="absolute bottom-20 left-1/4 w-[400px] h-[400px] bg-[#C15F3C]/5 rounded-full blur-3xl" />
                </div>

                {/* Header */}
                <motion.div
                    className="flex items-center justify-between relative z-10"
                    variants={itemVariants}
                >
                    <div>
                        <div className="flex items-center gap-4">
                            <motion.div
                                className="relative"
                                whileHover={{ scale: 1.05 }}
                                transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-[#DA7756]/30 to-[#C15F3C]/30 blur-xl rounded-full" />
                                <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-[#DA7756]/20 to-[#C15F3C]/20 border border-[#DA7756]/30 flex items-center justify-center">
                                    <Grid3X3 className="w-6 h-6 text-[#DA7756]" />
                                </div>
                            </motion.div>
                            <div>
                                <h1 className="text-3xl font-bold bg-gradient-to-r from-[#DA7756] via-[#C15F3C] to-[#DA7756] bg-clip-text text-transparent">
                                    Dashboard Builder
                                </h1>
                                <p className="text-slate-400 mt-1">Create custom dashboards with drag-and-drop widgets</p>
                            </div>
                            <DataModeIndicator />
                        </div>
                    </div>
                    <div className="flex gap-3">
                        {isEditing && selectedDashboard ? (
                            <>
                                <motion.button
                                    onClick={() => setShowWidgetPicker(true)}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-white/[0.08] text-slate-300 hover:text-white hover:border-[#DA7756]/30 transition-all backdrop-blur-xl"
                                >
                                    <Plus className="w-4 h-4" />
                                    Add Widget
                                </motion.button>
                                <motion.button
                                    onClick={() => setIsEditing(false)}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-white/[0.08] text-slate-300 hover:text-white hover:border-[#DA7756]/30 transition-all backdrop-blur-xl"
                                >
                                    <Eye className="w-4 h-4" />
                                    Preview
                                </motion.button>
                                <motion.button
                                    onClick={handleSaveDashboard}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#DA7756] to-[#C15F3C] text-white hover:from-[#DA7756]/90 hover:to-[#C15F3C]/90 transition-all shadow-lg shadow-[#DA7756]/20"
                                >
                                    <Save className="w-4 h-4" />
                                    Save
                                </motion.button>
                            </>
                        ) : (
                            <>
                                {selectedDashboard && (
                                    <>
                                        <motion.button
                                            onClick={() => setShowExportModal(true)}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-white/[0.08] text-slate-300 hover:text-white hover:border-[#DA7756]/30 transition-all backdrop-blur-xl"
                                        >
                                            <Download className="w-4 h-4" />
                                            Export
                                        </motion.button>
                                        <motion.button
                                            onClick={() => setIsEditing(true)}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-white/[0.08] text-slate-300 hover:text-white hover:border-[#DA7756]/30 transition-all backdrop-blur-xl"
                                        >
                                            <Edit3 className="w-4 h-4" />
                                            Edit
                                        </motion.button>
                                    </>
                                )}
                                <motion.button
                                    onClick={handleCreateDashboard}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#DA7756] to-[#C15F3C] text-white hover:from-[#DA7756]/90 hover:to-[#C15F3C]/90 transition-all shadow-lg shadow-[#DA7756]/20"
                                >
                                    <Plus className="w-4 h-4" />
                                    New Dashboard
                                </motion.button>
                            </>
                        )}
                    </div>
                </motion.div>

                {loading ? (
                    <motion.div
                        className="flex items-center justify-center h-64"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        <div className="relative">
                            <div className="w-12 h-12 rounded-full border-2 border-[#DA7756]/20 border-t-[#DA7756] animate-spin" />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Sparkles className="w-5 h-5 text-[#DA7756]/50" />
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div className="flex gap-6 relative z-10" variants={itemVariants}>
                        {/* Dashboard List Sidebar */}
                        <motion.div
                            className="w-72 flex-shrink-0"
                            variants={cardVariants}
                        >
                            <div
                                className="relative rounded-2xl overflow-hidden"
                                style={{ backgroundImage: `url("${noiseTexture}")` }}
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-slate-900/95 via-slate-900/90 to-slate-950/95 backdrop-blur-xl" />
                                <div className="relative border border-white/[0.06]">
                                    <div className="p-4 border-b border-white/[0.06]">
                                        <div className="flex items-center gap-2">
                                            <LayoutDashboard className="w-4 h-4 text-[#DA7756]" />
                                            <h3 className="text-sm font-semibold text-white">Your Dashboards</h3>
                                        </div>
                                    </div>
                                    <div className="p-2 max-h-[calc(100vh-300px)] overflow-y-auto">
                                        <AnimatePresence>
                                            {dashboards.map((dash, index) => (
                                                <motion.div
                                                    key={dash.id}
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    exit={{ opacity: 0, x: -10 }}
                                                    transition={{ delay: index * 0.03 }}
                                                >
                                                    <DashboardListItem
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
                                                </motion.div>
                                            ))}
                                        </AnimatePresence>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Main Canvas */}
                        <motion.div className="flex-1" variants={cardVariants}>
                            {selectedDashboard ? (
                                <DashboardCanvas
                                    dashboard={selectedDashboard}
                                    isEditing={isEditing}
                                    selectedWidget={selectedWidget}
                                    onSelectWidget={setSelectedWidget}
                                    onDeleteWidget={handleDeleteWidget}
                                />
                            ) : (
                                <motion.div
                                    className="relative rounded-2xl overflow-hidden"
                                    style={{ backgroundImage: `url("${noiseTexture}")` }}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                >
                                    <div className="absolute inset-0 bg-gradient-to-br from-slate-900/95 via-slate-900/90 to-slate-950/95 backdrop-blur-xl" />
                                    <div className="relative p-12 border border-white/[0.06] text-center">
                                        <div className="w-16 h-16 rounded-2xl bg-slate-800/50 border border-white/[0.06] mx-auto mb-4 flex items-center justify-center">
                                            <LayoutDashboard className="w-8 h-8 text-slate-600" />
                                        </div>
                                        <h3 className="text-lg font-semibold text-white mb-2">No dashboard selected</h3>
                                        <p className="text-slate-500 mb-6">Create a new dashboard to get started</p>
                                        <motion.button
                                            onClick={handleCreateDashboard}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#DA7756] to-[#C15F3C] text-white hover:from-[#DA7756]/90 hover:to-[#C15F3C]/90 transition-all shadow-lg shadow-[#DA7756]/20"
                                        >
                                            Create Dashboard
                                        </motion.button>
                                    </div>
                                </motion.div>
                            )}
                        </motion.div>

                        {/* Widget Config Panel */}
                        <AnimatePresence>
                            {isEditing && selectedWidget && (
                                <motion.div
                                    className="w-80 flex-shrink-0"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                                >
                                    <WidgetConfigPanel
                                        widget={selectedWidget}
                                        onUpdate={(updates) => handleUpdateWidget(selectedWidget.id, updates)}
                                        onClose={() => setSelectedWidget(null)}
                                        onDelete={() => handleDeleteWidget(selectedWidget.id)}
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                )}

                {/* Widget Picker Modal */}
                <AnimatePresence>
                    {showWidgetPicker && (
                        <WidgetPicker
                            onSelect={handleAddWidget}
                            onClose={() => setShowWidgetPicker(false)}
                        />
                    )}
                </AnimatePresence>

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
                            value: getMetricValue(w.config.metric || 'dau', dataProvider, hasRealData).value,
                            change: getMetricValue(w.config.metric || 'dau', dataProvider, hasRealData).change,
                        }))}
                />
            </motion.div>
        </DataProviderContext.Provider>
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
        <motion.div
            className={`group relative flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                isSelected
                    ? 'bg-[#DA7756]/10 border border-[#DA7756]/30'
                    : 'hover:bg-white/[0.04] border border-transparent'
            }`}
            onClick={onSelect}
            whileHover={{ x: 2 }}
            whileTap={{ scale: 0.98 }}
        >
            <span className="text-xl">{dashboard.icon}</span>
            <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium truncate ${isSelected ? 'text-[#DA7756]' : 'text-slate-300'}`}>
                    {dashboard.name}
                </p>
                <p className="text-xs text-slate-500">{dashboard.widgets.length} widgets</p>
            </div>
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(!showMenu);
                }}
                className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-white/10 rounded-lg transition-all"
            >
                <MoreVertical className="w-4 h-4 text-slate-400" />
            </button>

            <AnimatePresence>
                {showMenu && (
                    <motion.div
                        className="absolute right-0 top-full mt-1 z-20"
                        initial={{ opacity: 0, scale: 0.95, y: -5 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -5 }}
                        transition={{ duration: 0.15 }}
                    >
                        <div
                            className="relative rounded-xl overflow-hidden shadow-2xl"
                            style={{ backgroundImage: `url("${noiseTexture}")` }}
                        >
                            <div className="absolute inset-0 bg-slate-900/98 backdrop-blur-xl" />
                            <div className="relative border border-white/[0.08] py-1 min-w-36">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDuplicate();
                                        setShowMenu(false);
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-white/[0.06] transition-colors"
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
                                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-rose-400 hover:bg-rose-500/10 transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        Delete
                                    </button>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
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
        <div
            className="relative rounded-2xl overflow-hidden"
            style={{ backgroundImage: `url("${noiseTexture}")` }}
        >
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900/95 via-slate-900/90 to-slate-950/95 backdrop-blur-xl" />
            <div className="relative border border-white/[0.06] p-6">
                {/* Dashboard Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">{dashboard.icon}</span>
                        <div>
                            <h2 className="text-xl font-semibold text-white">{dashboard.name}</h2>
                            {dashboard.description && (
                                <p className="text-sm text-slate-500">{dashboard.description}</p>
                            )}
                        </div>
                    </div>
                    {!isEditing && (
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                            <RefreshCw className="w-4 h-4" />
                            <span>Last updated: just now</span>
                        </div>
                    )}
                </div>

                {/* Widget Grid */}
                <motion.div
                    style={gridStyle}
                    initial="hidden"
                    animate="visible"
                    variants={containerVariants}
                >
                    {sortedWidgets.map((widget, index) => (
                        <motion.div
                            key={widget.id}
                            variants={itemVariants}
                            custom={index}
                        >
                            <WidgetRenderer
                                widget={widget}
                                isEditing={isEditing}
                                isSelected={selectedWidget?.id === widget.id}
                                columns={dashboard.columns}
                                onSelect={() => onSelectWidget(widget)}
                                onDelete={() => onDeleteWidget(widget.id)}
                            />
                        </motion.div>
                    ))}
                </motion.div>

                {/* Empty state */}
                {dashboard.widgets.length === 0 && (
                    <motion.div
                        className="flex flex-col items-center justify-center h-64 text-center"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        <div className="w-16 h-16 rounded-2xl bg-slate-800/50 border border-white/[0.06] mb-4 flex items-center justify-center">
                            <LayoutDashboard className="w-8 h-8 text-slate-600" />
                        </div>
                        <p className="text-slate-400 mb-2">No widgets yet</p>
                        <p className="text-sm text-slate-500">Click "Add Widget" to start building</p>
                    </motion.div>
                )}
            </div>
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
        <motion.div
            style={gridStyle}
            className={`relative rounded-xl border transition-all overflow-hidden ${
                isSelected
                    ? 'border-[#DA7756]/50 ring-2 ring-[#DA7756]/20 bg-[#DA7756]/[0.03]'
                    : isEditing
                    ? 'border-white/[0.08] hover:border-[#DA7756]/30 cursor-pointer bg-white/[0.02]'
                    : 'border-white/[0.06] bg-white/[0.02]'
            }`}
            onClick={isEditing ? onSelect : undefined}
            whileHover={isEditing ? { scale: 1.01 } : {}}
            whileTap={isEditing ? { scale: 0.99 } : {}}
        >
            {/* Edit mode controls */}
            <AnimatePresence>
                {isEditing && (
                    <motion.div
                        className="absolute top-2 right-2 z-10 flex gap-1"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.button
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete();
                            }}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors border border-rose-500/20"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </motion.button>
                    </motion.div>
                )}
            </AnimatePresence>

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
        </motion.div>
    );
}

// ============================================================================
// Widget Components
// ============================================================================

function KPIWidget({ widget }: { widget: DashboardWidget }) {
    const ctx = useDataProviderContext();
    const metric = widget.config.metric || 'dau';
    const data = ctx
        ? getMetricValue(metric, ctx.dataProvider, ctx.hasRealData)
        : getMockMetricValue(metric);
    const format = widget.config.format || METRIC_OPTIONS.find(m => m.value === metric)?.format || 'number';

    const formatValue = (value: number) => {
        if (format === 'currency') return `$${value.toLocaleString()}`;
        if (format === 'percent') return `${value.toFixed(1)}%`;
        return value.toLocaleString();
    };

    return (
        <div className="h-full flex flex-col justify-center">
            <p className="text-sm text-slate-500 mb-1 uppercase tracking-wider text-xs font-medium">
                {widget.config.title || 'Metric'}
            </p>
            <p className="text-3xl font-bold text-white mb-2">{formatValue(data.value)}</p>
            {widget.config.showTrend !== false && (
                <div className={`flex items-center gap-1 text-sm ${data.change >= 0 ? 'text-[#DA7756]' : 'text-rose-400'}`}>
                    {data.change >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    <span className="font-medium">{data.change >= 0 ? '+' : ''}{data.change}%</span>
                    <span className="text-slate-500">vs last period</span>
                </div>
            )}
        </div>
    );
}

function LineChartWidget({ widget }: { widget: DashboardWidget }) {
    const ctx = useDataProviderContext();
    const metric = widget.config.metric || 'dau';
    const data = ctx
        ? getChartData(metric, 14, ctx.dataProvider, ctx.hasRealData)
        : getMockChartData(metric, 14);
    const maxValue = Math.max(...data.map(d => d.value));
    const minValue = Math.min(...data.map(d => d.value));

    return (
        <div className="h-full flex flex-col">
            <p className="text-sm font-medium text-white mb-3">{widget.config.title || 'Line Chart'}</p>
            <div className="flex-1 flex items-end gap-1">
                {data.map((d, i) => {
                    const height = ((d.value - minValue) / (maxValue - minValue)) * 100 || 50;
                    return (
                        <motion.div
                            key={i}
                            initial={{ height: 0 }}
                            animate={{ height: `${Math.max(10, height)}%` }}
                            transition={{ delay: i * 0.03, duration: 0.4 }}
                            className="flex-1 bg-gradient-to-t from-[#DA7756]/40 to-[#DA7756]/10 rounded-t hover:from-[#DA7756]/60 hover:to-[#DA7756]/20 transition-colors cursor-pointer"
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
                        <span className="text-xs text-slate-500 w-20 truncate">{d.label}</span>
                        <div className="flex-1 h-4 bg-white/5 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${d.value}%` }}
                                transition={{ delay: i * 0.1, duration: 0.5 }}
                                className="h-full bg-gradient-to-r from-[#DA7756]/60 to-[#C15F3C]/60 rounded-full"
                            />
                        </div>
                        <span className="text-xs text-slate-400 w-8">{d.value}%</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

function PieChartWidget({ widget }: { widget: DashboardWidget }) {
    const mockData = [
        { label: 'IAP', value: 60, color: '#DA7756' },
        { label: 'Ads', value: 25, color: '#C15F3C' },
        { label: 'Subs', value: 15, color: '#A84E2D' },
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
                                    className="transition-all duration-500"
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
                            <span className="text-slate-400">{d.label}</span>
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
                        <tr className="border-b border-white/[0.08]">
                            <th className="text-left py-2 text-slate-500 font-medium text-xs uppercase tracking-wider">Name</th>
                            <th className="text-right py-2 text-slate-500 font-medium text-xs uppercase tracking-wider">Revenue</th>
                            <th className="text-right py-2 text-slate-500 font-medium text-xs uppercase tracking-wider">Sales</th>
                        </tr>
                    </thead>
                    <tbody>
                        {mockData.map((row) => (
                            <tr key={row.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                                <td className="py-2 text-slate-300">{row.name}</td>
                                <td className="py-2 text-right text-white font-medium">{row.revenue}</td>
                                <td className="py-2 text-right text-slate-400">{row.sales}</td>
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
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${d.percent}%` }}
                            transition={{ delay: i * 0.1, duration: 0.5 }}
                            className="h-6 bg-gradient-to-r from-[#DA7756]/50 to-[#C15F3C]/50 rounded flex items-center justify-end pr-2"
                            style={{ minWidth: '40px' }}
                        >
                            <span className="text-xs text-white font-medium">{d.percent}%</span>
                        </motion.div>
                        <span className="text-xs text-slate-400">{d.label}</span>
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
                            <th className="text-left py-1 text-slate-500"></th>
                            {days.map(d => (
                                <th key={d} className="text-center py-1 text-slate-500 font-medium">{d}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {weeks.map((week, i) => (
                            <tr key={week}>
                                <td className="py-1 text-slate-500 font-medium">{week}</td>
                                {mockRetention[i].map((val, j) => (
                                    <td key={j} className="p-1">
                                        <div
                                            className="rounded text-center py-1 text-white transition-all hover:scale-105"
                                            style={{
                                                backgroundColor: `rgba(218, 119, 86, ${val / 100})`,
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
            <p className="text-slate-300">{widget.config.textContent || widget.config.title || 'Text content'}</p>
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
        <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
        >
            <motion.div
                className="relative rounded-2xl overflow-hidden w-full max-w-2xl"
                style={{ backgroundImage: `url("${noiseTexture}")` }}
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="absolute inset-0 bg-gradient-to-br from-slate-900/98 via-slate-900/95 to-slate-950/98 backdrop-blur-xl" />
                <div className="relative border border-white/[0.08]">
                    <div className="flex items-center justify-between p-6 border-b border-white/[0.08]">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-[#DA7756]/10 border border-[#DA7756]/20 flex items-center justify-center">
                                <Plus className="w-5 h-5 text-[#DA7756]" />
                            </div>
                            <h3 className="text-lg font-semibold text-white">Add Widget</h3>
                        </div>
                        <motion.button
                            onClick={onClose}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5 text-slate-400" />
                        </motion.button>
                    </div>
                    <motion.div
                        className="p-6 grid grid-cols-3 gap-4"
                        initial="hidden"
                        animate="visible"
                        variants={containerVariants}
                    >
                        {widgetTypes.map((type) => {
                            const preset = WIDGET_PRESETS[type];
                            return (
                                <motion.button
                                    key={type}
                                    variants={itemVariants}
                                    onClick={() => onSelect(type)}
                                    whileHover={{ scale: 1.02, y: -2 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="flex flex-col items-center gap-3 p-4 rounded-xl border border-white/[0.08] hover:border-[#DA7756]/30 hover:bg-[#DA7756]/[0.05] transition-all text-center group"
                                >
                                    <span className="text-3xl group-hover:scale-110 transition-transform">{preset.icon}</span>
                                    <div>
                                        <p className="text-white font-medium group-hover:text-[#DA7756] transition-colors">{preset.name}</p>
                                        <p className="text-xs text-slate-500 mt-0.5">{preset.description}</p>
                                    </div>
                                </motion.button>
                            );
                        })}
                    </motion.div>
                </div>
            </motion.div>
        </motion.div>
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
        <div
            className="relative rounded-2xl overflow-hidden"
            style={{ backgroundImage: `url("${noiseTexture}")` }}
        >
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900/95 via-slate-900/90 to-slate-950/95 backdrop-blur-xl" />
            <div className="relative border border-white/[0.06]">
                <div className="flex items-center justify-between p-4 border-b border-white/[0.06]">
                    <div className="flex items-center gap-2">
                        <span className="text-xl">{preset.icon}</span>
                        <h3 className="text-sm font-semibold text-white">{preset.name}</h3>
                    </div>
                    <motion.button
                        onClick={onClose}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                    >
                        <X className="w-4 h-4 text-slate-400" />
                    </motion.button>
                </div>

                <div className="p-4 space-y-4">
                    {/* Title */}
                    <div>
                        <label className="block text-xs text-slate-500 mb-2 uppercase tracking-wider font-medium">Title</label>
                        <input
                            type="text"
                            value={widget.config.title || ''}
                            onChange={(e) => onUpdate({ config: { ...widget.config, title: e.target.value } })}
                            className="w-full px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-sm focus:outline-none focus:border-[#DA7756]/50 focus:ring-1 focus:ring-[#DA7756]/20 transition-all placeholder:text-slate-600"
                            placeholder="Widget title"
                        />
                    </div>

                    {/* Metric selector for applicable widgets */}
                    {['kpi', 'line_chart', 'bar_chart', 'area_chart'].includes(widget.type) && (
                        <div>
                            <label className="block text-xs text-slate-500 mb-2 uppercase tracking-wider font-medium">Metric</label>
                            <select
                                value={widget.config.metric || 'dau'}
                                onChange={(e) => onUpdate({ config: { ...widget.config, metric: e.target.value as MetricType } })}
                                className="w-full px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-sm focus:outline-none focus:border-[#DA7756]/50 focus:ring-1 focus:ring-[#DA7756]/20 transition-all"
                            >
                                {METRIC_OPTIONS.map((opt) => (
                                    <option key={opt.value} value={opt.value} className="bg-slate-900">{opt.label}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Show trend toggle for KPI */}
                    {widget.type === 'kpi' && (
                        <div className="flex items-center justify-between">
                            <label className="text-xs text-slate-500 uppercase tracking-wider font-medium">Show Trend</label>
                            <button
                                onClick={() => onUpdate({ config: { ...widget.config, showTrend: !widget.config.showTrend } })}
                                className={`w-10 h-5 rounded-full transition-colors ${
                                    widget.config.showTrend !== false ? 'bg-[#DA7756]' : 'bg-white/10'
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
                            <label className="block text-xs text-slate-500 mb-2 uppercase tracking-wider font-medium">Content</label>
                            <textarea
                                value={widget.config.textContent || ''}
                                onChange={(e) => onUpdate({ config: { ...widget.config, textContent: e.target.value } })}
                                rows={4}
                                className="w-full px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-sm focus:outline-none focus:border-[#DA7756]/50 focus:ring-1 focus:ring-[#DA7756]/20 transition-all resize-none placeholder:text-slate-600"
                                placeholder="Enter text content..."
                            />
                        </div>
                    )}

                    {/* Size controls */}
                    <div>
                        <label className="block text-xs text-slate-500 mb-2 uppercase tracking-wider font-medium">Size</label>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs text-slate-600 mb-1">Width</label>
                                <input
                                    type="number"
                                    value={widget.position.w}
                                    onChange={(e) => onUpdate({ position: { ...widget.position, w: parseInt(e.target.value) || 1 } })}
                                    min={1}
                                    max={12}
                                    className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-sm focus:outline-none focus:border-[#DA7756]/50 transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-slate-600 mb-1">Height</label>
                                <input
                                    type="number"
                                    value={widget.position.h}
                                    onChange={(e) => onUpdate({ position: { ...widget.position, h: parseInt(e.target.value) || 1 } })}
                                    min={1}
                                    max={10}
                                    className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-sm focus:outline-none focus:border-[#DA7756]/50 transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Delete button */}
                    <motion.button
                        onClick={onDelete}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors text-sm border border-rose-500/20"
                    >
                        <Trash2 className="w-4 h-4" />
                        Delete Widget
                    </motion.button>
                </div>
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
