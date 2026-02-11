import { useState, useRef, useCallback } from "react";
import { firebaseEnabled } from "./firebase";
import { useAuth } from "./hooks/useAuth";
import { usePlans } from "./hooks/usePlans";
import { usePipelines } from "./hooks/usePipelines";
import { useDate } from "./hooks/useDate";
import { useCustomTypes } from "./hooks/useCustomTypes";
import { useLocation } from "./hooks/useLocation";
import PlanSidebar from "./components/PlanSidebar";
import PlanEditor from "./components/PlanEditor";
import CalendarView from "./components/CalendarView";
import DailyView from "./components/DailyView";
import ImportModal from "./components/ImportModal";
import ExportModal from "./components/ExportModal";
import LocationModal from "./components/LocationModal";
import GitHubSettingsModal from "./components/GitHubSettingsModal";
import { loadSettings, saveSettings, githubGet, githubPut } from "./utils/githubSync";

export default function App() {
  const authCtx = useAuth(); // null when no AuthProvider
  const user = authCtx?.user || null;
  const logout = authCtx?.logout || null;

  const {
    plans, loading, activePlan, activePlanId,
    setActivePlanId,
    createPlan, updatePlan, deletePlan, updateRoutineBlocks,
    getPlanForDate, mergePlans,
  } = usePlans(user?.uid || null);

  const {
    selectedDate, setSelectedDate,
    today,
    viewYear, viewMonth,
    prevMonth, nextMonth, goToday,
    setViewYearMonth,
  } = useDate();

  const { customTypes, customTypeColors, addCustomType, removeCustomType, mergeCustomTypes } = useCustomTypes();
  const { location, setLocation, hasLocation, detecting, geoFailed } = useLocation();
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [ghSettings, setGhSettings] = useState(() => loadSettings());
  const [showGitHubSettings, setShowGitHubSettings] = useState(false);
  const [syncing, setSyncing] = useState(null);
  const [syncError, setSyncError] = useState(null);

  const {
    sections: pipelineSections,
    addSection, updateSection, deleteSection, reorderSections,
    toggleCollapse, addItem, updateItem, deleteItem, moveItem, reorderItems, mergeSections,
  } = usePipelines(user?.uid || null);

  const fileRef = useRef(null);
  const [editingPlan, setEditingPlan] = useState(null);
  const [showNewPlan, setShowNewPlan] = useState(false);
  const [view, setView] = useState("daily");
  const [highlightDate, setHighlightDate] = useState(null);
  const [importFile, setImportFile] = useState(null);
  const [showExport, setShowExport] = useState(false);

  const handleImportConfirm = useCallback((newPlans, newTypes, newPipelines) => {
    if (newPlans.length > 0) mergePlans(newPlans);
    if (newTypes.length > 0) mergeCustomTypes(newTypes);
    if (newPipelines && newPipelines.length > 0) mergeSections(newPipelines);
    setImportFile(null);
  }, [mergePlans, mergeCustomTypes, mergeSections]);

  // Navigate to a plan's start date (used by calendar legend chips + sidebar)
  const navigateToPlan = useCallback((plan) => {
    if (!plan.startDate) return;
    setActivePlanId(plan.id);
    setSelectedDate(plan.startDate);
    const d = new Date(plan.startDate + "T00:00:00");
    setViewYearMonth(d.getFullYear(), d.getMonth());
    setHighlightDate(plan.startDate);
    setTimeout(() => setHighlightDate(null), 1500);
  }, [setViewYearMonth, setSelectedDate, setActivePlanId]);

  const handlePlanSelect = useCallback((planId) => {
    const plan = plans.find((p) => p.id === planId);
    if (plan?.startDate) {
      navigateToPlan(plan);
    } else {
      setActivePlanId(planId);
    }
  }, [plans, navigateToPlan, setActivePlanId]);

  const handleSelectDate = useCallback((dateISO) => {
    setSelectedDate(dateISO);
    const plan = getPlanForDate(dateISO);
    if (plan) setActivePlanId(plan.id);
    setView("daily");
  }, [setSelectedDate, getPlanForDate, setActivePlanId]);

  const handleSelectDay = useCallback((dateISO) => {
    setSelectedDate(dateISO);
    const plan = getPlanForDate(dateISO);
    if (plan) setActivePlanId(plan.id);
  }, [setSelectedDate, getPlanForDate, setActivePlanId]);

  const handleBackToCalendar = useCallback(() => {
    setView("calendar");
  }, []);

  const handleGhSave = useCallback((s) => {
    saveSettings(s);
    setGhSettings(s);
    setShowGitHubSettings(false);
  }, []);

  const handlePush = useCallback(async () => {
    if (!ghSettings) { setShowGitHubSettings(true); return; }
    setSyncing("push"); setSyncError(null);
    try {
      const existing = await githubGet(ghSettings);
      const json = { version: 2, plans, customTypes, pipelines: pipelineSections };
      await githubPut(ghSettings, json, existing?.sha || null);
    } catch (e) { setSyncError(e.message); }
    setSyncing(null);
  }, [ghSettings, plans, customTypes, pipelineSections]);

  const handlePull = useCallback(async () => {
    if (!ghSettings) { setShowGitHubSettings(true); return; }
    setSyncing("pull"); setSyncError(null);
    try {
      const result = await githubGet(ghSettings);
      if (!result) throw new Error("File not found in repo");
      const { content: data } = result;
      handleImportConfirm(data.plans || [], data.customTypes || [], data.pipelines || []);
    } catch (e) { setSyncError(e.message); }
    setSyncing(null);
  }, [ghSettings, handleImportConfirm]);

  const datePlanResolved = getPlanForDate(selectedDate);
  const dailyPlan = (activePlan && datePlanResolved?.id === activePlan.id)
    ? activePlan
    : datePlanResolved;

  const handleUpdateBlocks = useCallback((dayKey, blocks) => {
    if (!dailyPlan) return;
    updateRoutineBlocks(dailyPlan.id, dayKey, blocks);
  }, [dailyPlan, updateRoutineBlocks]);

  if (loading) return <div className="loading">loading plans...</div>;

  return (
    <div className="app">
      <header className="app-header">
        <div>
          <div className="header-subtitle">ENTRYPOINT V2</div>
          <h1 className="header-title">Lock-In</h1>
          <div className="header-quote">"While enjoying every single day on the way."</div>
        </div>
        <div className="header-actions">
          <button className="header-btn" onClick={handlePush} disabled={!!syncing} title="Push to GitHub">
            {syncing === "push" ? "Pushing..." : "Push"}
          </button>
          <button className="header-btn" onClick={handlePull} disabled={!!syncing} title="Pull from GitHub">
            {syncing === "pull" ? "Pulling..." : "Pull"}
          </button>
          <button className="header-btn" onClick={() => setShowGitHubSettings(true)} title="GitHub Settings">GH</button>
          <button className="header-btn" onClick={() => setShowExport(true)} title="Export">Export</button>
          <button className="header-btn" onClick={() => fileRef.current?.click()} title="Import">Import</button>
          <input ref={fileRef} type="file" accept=".json" hidden onChange={(e) => {
            if (e.target.files[0]) setImportFile(e.target.files[0]);
            e.target.value = "";
          }} />
          {logout && <button className="logout-btn" onClick={logout}>Logout</button>}
        </div>
      </header>
      {syncError && <div className="sync-error">{syncError}</div>}

      <PlanSidebar
        plans={plans}
        activePlanId={activePlan?.id}
        onSelect={handlePlanSelect}
        onCreate={() => setShowNewPlan(true)}
        onEdit={setEditingPlan}
        onDelete={deletePlan}
      />

      {view === "calendar" ? (
        <CalendarView
          viewYear={viewYear}
          viewMonth={viewMonth}
          selectedDate={selectedDate}
          today={today}
          plans={plans}
          highlightDate={highlightDate}
          onPrevMonth={prevMonth}
          onNextMonth={nextMonth}
          onGoToday={() => handleSelectDate(today)}
          onSelectDate={handleSelectDate}
          onPlanClick={navigateToPlan}
        />
      ) : (
        <DailyView
          date={selectedDate}
          plan={dailyPlan}
          location={location}
          onOpenLocation={() => setShowLocationModal(true)}
          onUpdateBlocks={handleUpdateBlocks}
          onSelectDate={handleSelectDay}
          onMonth={handleBackToCalendar}
          customTypes={customTypes}
          customTypeColors={customTypeColors}
          onAddCustomType={addCustomType}
          onRemoveCustomType={removeCustomType}
          pipelineSections={pipelineSections}
          onAddSection={addSection}
          onUpdateSection={updateSection}
          onDeleteSection={deleteSection}
          onToggleCollapse={toggleCollapse}
          onAddItem={addItem}
          onUpdateItem={updateItem}
          onDeleteItem={deleteItem}
          onMoveItem={moveItem}
          onReorderItems={reorderItems}
        />
      )}

      {showNewPlan && (
        <PlanEditor
          plan={null}
          plans={plans}
          onSave={(data) => { createPlan(data); setShowNewPlan(false); }}
          onClose={() => setShowNewPlan(false)}
        />
      )}
      {editingPlan && (
        <PlanEditor
          plan={editingPlan}
          plans={plans}
          onSave={(data) => { updatePlan(editingPlan.id, data); setEditingPlan(null); }}
          onClose={() => setEditingPlan(null)}
        />
      )}
      {showExport && (
        <ExportModal
          plans={plans}
          customTypes={customTypes}
          pipelineSections={pipelineSections}
          onClose={() => setShowExport(false)}
        />
      )}
      {importFile && (
        <ImportModal
          file={importFile}
          existingPlans={plans}
          existingCustomTypes={customTypes}
          existingPipelines={pipelineSections}
          onConfirm={handleImportConfirm}
          onClose={() => setImportFile(null)}
        />
      )}
      {showGitHubSettings && (
        <GitHubSettingsModal
          settings={ghSettings}
          onSave={handleGhSave}
          onClose={() => setShowGitHubSettings(false)}
        />
      )}
      {((!hasLocation && geoFailed) || showLocationModal) && (
        <LocationModal
          onSave={(loc) => { setLocation(loc); setShowLocationModal(false); }}
          onClose={hasLocation ? () => setShowLocationModal(false) : undefined}
        />
      )}
    </div>
  );
}
