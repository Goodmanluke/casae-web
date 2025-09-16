import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { cmaBaseline, cmaAdjust, cmaPdf, getRentEstimate } from "../lib/api";
import { supabase } from "../lib/supabase";
import Navigation from "../components/Navigation";
import InvestmentCalculators from "../components/InvestmentCalculators";
import { useSubscription } from "../hooks/useSubscription";
import { useUsageLimit } from "../hooks/useUsageLimit";

// Import CMA components
import {
  AddressTab,
  ConditionTab,
  BaselineTab,
  AdjustmentsTab,
  ResultsTab,
  ProgressIndicator,
  TabNavigation,
  UsageDisplay,
  SaveModal
} from "../components/CMA";

type Tab = "address" | "condition" | "baseline" | "adjustments" | "result" | "calculators";
type ConditionInputMode = "simple" | "advanced";
type PropertyCondition = {
  overall: "Excellent" | "Good" | "Fair" | "Poor";
  roof?: "Excellent" | "Good" | "Fair" | "Poor";
  windows?: "Excellent" | "Good" | "Fair" | "Poor";
  siding?: "Excellent" | "Good" | "Fair" | "Poor";
  kitchen?: "Excellent" | "Good" | "Fair" | "Poor";
  bathrooms?: "Excellent" | "Good" | "Fair" | "Poor";
  flooring?: "Excellent" | "Good" | "Fair" | "Poor";
  interior?: "Excellent" | "Good" | "Fair" | "Poor";
};

export default function CMA() {
  const { query } = useRouter();

  // Core state
  const [address, setAddress] = useState("");
  const [tab, setTab] = useState<Tab>("address");
  const [userId, setUserId] = useState<string | undefined>(undefined);

  // Workflow state
  const [conditionMode, setConditionMode] = useState<ConditionInputMode>("simple");
  const [propertyCondition, setPropertyCondition] = useState<PropertyCondition>({
    overall: "Good"
  });
  const [addressConfirmed, setAddressConfirmed] = useState(false);
  const [conditionCompleted, setConditionCompleted] = useState(false);
  const [baselineCompleted, setBaselineCompleted] = useState(false);

  // Data state
  const [baselineData, setBaselineData] = useState<any>(null);
  const [adjustedData, setAdjustedData] = useState<any>(null);
  const [monthlyRent, setMonthlyRent] = useState<number | null>(null);
  const [adjustedMonthlyRent, setAdjustedMonthlyRent] = useState<number | null>(null);

  // Legacy adjustment inputs (for planned changes tab)
  const [condition, setCondition] = useState<"Poor" | "Fair" | "Good" | "Excellent">("Good");
  const [renovations, setRenovations] = useState<string[]>([]);
  const [addBeds, setAddBeds] = useState<number>(0);
  const [addBaths, setAddBaths] = useState<number>(0);
  const [addSqft, setAddSqft] = useState<number>(0);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveModalMessage, setSaveModalMessage] = useState("");
  const [saveModalType, setSaveModalType] = useState<"success" | "error" | "login">("success");

  // Subscription & usage hooks
  const {
    subscription,
    loading: subscriptionLoading,
    isPremium,
    isPro,
  } = useSubscription(userId);
  const {
    usageRecord,
    loading: usageLoading,
    checkUsageLimit,
    incrementUsage,
  } = useUsageLimit(userId, subscription?.plan_id || null);

  // Helper functions
  const getPlanName = () => {
    if (isPro) return "Pro";
    if (isPremium) return "Premium";
    return "Free";
  };

  const safeCheckUsageLimit = () => {
    try {
      return checkUsageLimit();
    } catch (error) {
      console.warn("Error checking usage limit:", error);
      return { canUse: false, usedCount: 0, limit: 0, remaining: 0 };
    }
  };

  // URL parameter handling
  useEffect(() => {
    if (typeof query.address === "string" && query.address.trim().length > 0) {
      setAddress(query.address);
      setAddressConfirmed(true);
      setTab("condition");
    }
    if (typeof query.tab === "string" && 
        ["address", "condition", "baseline", "adjustments", "result", "calculators"].includes(query.tab)) {
      setTab(query.tab as Tab);
    }
  }, [query.address, query.tab]);

  // Get user ID
  useEffect(() => {
    const getUserId = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUserId(session?.user?.id);
    };
    getUserId();
  }, []);

  // Auto-run baseline CMA after condition is completed
  useEffect(() => {
    if (
      conditionCompleted &&
      !baselineCompleted &&
      addressConfirmed &&
      address.trim().length > 0 &&
      userId &&
      !subscriptionLoading &&
      !usageLoading &&
      (subscription || isPremium || isPro) &&
      !baselineData
    ) {
      runBaselineCMA();
    }
  }, [
    conditionCompleted,
    baselineCompleted,
    addressConfirmed,
    address,
    userId,
    subscriptionLoading,
    usageLoading,
    subscription,
    isPremium,
    isPro,
    baselineData
  ]);

  const runBaselineCMA = async () => {
    if (!address.trim()) return;

    if (!userId) {
      setError("Please log in to use the CMA feature.");
      return;
    }

    if (!subscription && !isPremium && !isPro) {
      setError("You need an active Premium or Pro subscription to use the CMA feature.");
      return;
    }

    const usageCheck = safeCheckUsageLimit();
    if (!usageCheck.canUse) {
      setError(`You have reached your monthly CMA limit of ${usageCheck.limit} for your ${getPlanName()} plan.`);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const conditionForAPI = conditionMode === "simple" 
        ? propertyCondition.overall 
        : propertyCondition.overall;

      const data = await cmaBaseline({ 
        subject: { 
          address: address.trim(),
          condition: conditionForAPI
        } 
      } as any);
      
      setBaselineData(data);
      setBaselineCompleted(true);

      if (userId) {
        await incrementUsage();
      }

      // Get rent estimate
      if (data.subject) {
        const propertyDetails = {
          bedrooms: data.subject.beds,
          bathrooms: data.subject.baths,
          squareFootage: data.subject.sqft,
          propertyType: data.subject.property_type,
        };
        getRentEstimate(address.trim(), propertyDetails)
          .then((r) => setMonthlyRent(r?.monthly_rent ?? null))
          .catch(() => setMonthlyRent(null));
      }

      setTab("baseline");
    } catch (err: any) {
      console.error("Baseline failed:", err);
      setError(err?.message ?? "Failed to fetch baseline");
    } finally {
      setLoading(false);
    }
  };

  const applyAdjustments = async () => {
    if (!baselineData) return;
    setLoading(true);
    setError(null);
    try {
      const data = await cmaAdjust({
        cma_run_id: baselineData.cma_run_id,
        condition,
        renovations,
        add_beds: addBeds,
        add_baths: addBaths,
        add_sqft: addSqft,
      });
      setAdjustedData(data);

      if (data.subject?.address) {
        try {
          const adjustedPropertyDetails = {
            bedrooms: data.subject.beds,
            bathrooms: data.subject.baths,
            squareFootage: data.subject.sqft,
            propertyType: data.subject.property_type,
          };
          const rentData = await getRentEstimate(
            data.subject.address,
            adjustedPropertyDetails
          );
          setAdjustedMonthlyRent(rentData?.monthly_rent ?? null);
        } catch (rentErr) {
          console.warn("Failed to fetch adjusted rent estimate:", rentErr);
          setAdjustedMonthlyRent(null);
        }
      }

      setTab("result");
    } catch (err: any) {
      console.error("Adjust failed:", err);
      setError(err?.message ?? "Failed to apply adjustments");
    } finally {
      setLoading(false);
    }
  };

  const toggleRenovation = (renovation: string) => {
    setRenovations((prev) =>
      prev.includes(renovation)
        ? prev.filter((r) => r !== renovation)
        : [...prev, renovation]
    );
  };

  const downloadPdf = async (useAdjusted: boolean = false) => {
    if (!baselineData) return;
    try {
      await cmaPdf(baselineData.cma_run_id, { adjusted: useAdjusted });
    } catch (err) {
      console.error("PDF failed:", err);
      setSaveModalType("error");
      setSaveModalMessage("Could not start PDF download. Please try again.");
      setShowSaveModal(true);
    }
  };

  const saveProperty = async () => {
    if (!baselineData) return;
    setSaving(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user?.id;
      if (!userId) {
        setSaveModalType("login");
        setSaveModalMessage("Please login to save properties.");
        setShowSaveModal(true);
        return;
      }
      const s = baselineData.subject || {};
      const { error } = await supabase.from("properties").insert([
        {
          user_id: userId,
          address: s.address,
          raw_price: baselineData.estimate,
          beds: s.beds ?? null,
          baths: s.baths ?? null,
          living_sqft: s.sqft ?? null,
          lot_size: s.lot_sqft ?? null,
          year_built: s.year_built ?? null,
          condition_rating: s.condition ?? null,
          sale_date: null,
        },
      ]);
      if (error) throw error;
      setSaved(true);
      setSaveModalType("success");
      setSaveModalMessage("Property saved successfully!");
      setShowSaveModal(true);
    } catch (e: any) {
      console.error(e);
      setSaveModalType("error");
      setSaveModalMessage(e?.message || "Failed to save property");
      setShowSaveModal(true);
    } finally {
      setSaving(false);
    }
  };

  // Event handlers
  const handleAddressContinue = () => {
    setAddressConfirmed(true);
    setTab("condition");
  };

  const handleAddressChange = () => {
    setAddressConfirmed(false);
    setConditionCompleted(false);
    setBaselineCompleted(false);
    setBaselineData(null);
    setAdjustedData(null);
  };

  const handleConditionContinue = () => {
    setConditionCompleted(true);
    // Auto-run baseline CMA will be triggered by useEffect
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-cyan-900 to-slate-900">
      <Navigation />

      <div className="max-w-6xl mx-auto px-4 py-8 text-white">
        {/* Progress indicator */}
        <ProgressIndicator
          currentTab={tab}
          addressConfirmed={addressConfirmed}
          conditionCompleted={conditionCompleted}
          baselineCompleted={baselineCompleted}
        />

        {/* Usage Display */}
        <UsageDisplay
          userId={userId}
          subscriptionLoading={subscriptionLoading}
          usageLoading={usageLoading}
          subscription={subscription}
          safeCheckUsageLimit={safeCheckUsageLimit}
          getPlanName={getPlanName}
        />

        {/* Subscription Required Message */}
        {userId &&
          !subscriptionLoading &&
          !subscription &&
          !isPremium &&
          !isPro && (
            <div className="mb-6 rounded-xl bg-orange-500/20 p-4 border border-orange-400/30">
              <div className="font-semibold text-orange-200">
                Subscription Required
              </div>
              <div className="opacity-90 text-orange-100">
                You need an active Premium or Pro subscription to use the CMA
                feature.{" "}
                <a href="/dashboard" className="underline hover:no-underline">
                  Upgrade your plan
                </a>{" "}
                to get started.
              </div>
            </div>
          )}

        {/* Loading / Error */}
        {loading && (
          <div className="mb-6 rounded-xl bg-white/10 p-4 border border-white/10">
            Analyzing property...
          </div>
        )}
        {error && (
          <div className="mb-6 rounded-xl bg-red-500/20 p-4 border border-red-400/30">
            <div className="font-semibold">Error</div>
            <div className="opacity-90">{error}</div>
          </div>
        )}

        {/* Tab Navigation */}
        <TabNavigation
          currentTab={tab}
          setTab={setTab}
          addressConfirmed={addressConfirmed}
          conditionCompleted={conditionCompleted}
          baselineCompleted={baselineCompleted}
        />

        {/* Tab Content */}
        {tab === "address" && (
          <AddressTab
            address={address}
            setAddress={setAddress}
            onContinue={handleAddressContinue}
            onAddressChange={handleAddressChange}
          />
        )}

        {tab === "condition" && (
          <ConditionTab
            conditionMode={conditionMode}
            setConditionMode={setConditionMode}
            propertyCondition={propertyCondition}
            setPropertyCondition={setPropertyCondition}
            onContinue={handleConditionContinue}
          />
        )}

        {tab === "baseline" && baselineData && (
          <BaselineTab
            baselineData={baselineData}
            monthlyRent={monthlyRent}
            onDownloadPdf={() => downloadPdf(false)}
            onSaveProperty={saveProperty}
            onMakeAdjustments={() => setTab("adjustments")}
            saved={saved}
            saving={saving}
          />
        )}

        {tab === "adjustments" && (
          <AdjustmentsTab
            condition={condition}
            setCondition={setCondition}
            renovations={renovations}
            toggleRenovation={toggleRenovation}
            addBeds={addBeds}
            setAddBeds={setAddBeds}
            addBaths={addBaths}
            setAddBaths={setAddBaths}
            addSqft={addSqft}
            setAddSqft={setAddSqft}
            onApplyAdjustments={applyAdjustments}
            loading={loading}
          />
        )}

        {tab === "result" && adjustedData && (
          <ResultsTab
            baselineData={baselineData}
            adjustedData={adjustedData}
            monthlyRent={monthlyRent}
            adjustedMonthlyRent={adjustedMonthlyRent}
            onDownloadPdf={() => downloadPdf(true)}
            onGoToCalculators={() => setTab("calculators")}
          />
        )}

        {tab === "calculators" && (
          <InvestmentCalculators
            baselineData={baselineData}
            adjustedData={adjustedData}
            monthlyRent={monthlyRent}
            adjustedMonthlyRent={adjustedMonthlyRent}
          />
        )}

        {/* Initial state - only show on address tab if no address confirmed */}
        {tab === "address" && !addressConfirmed && !baselineData && !loading && !error && (
          <div className="rounded-xl bg-white/10 p-6 border border-white/10 text-center mt-6">
            <div className="text-lg font-semibold mb-2">Welcome to CMA Analysis</div>
            <div className="opacity-80">
              Follow the step-by-step process to get comprehensive property analysis and investment insights.
            </div>
          </div>
        )}
      </div>

      {/* Save Modal */}
      <SaveModal
        showModal={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        modalType={saveModalType}
        message={saveModalMessage}
      />
    </div>
  );
}
