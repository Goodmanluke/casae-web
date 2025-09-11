import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

export interface UsageRecord {
  id: string;
  user_id: string;
  feature: string;
  used_count: number;
  period_start: string;
  period_end: string;
  created_at: string;
  updated_at: string;
}

export interface UsageLimits {
  premium_cma_limit: number;
  pro_cma_limit: number;
}

const USAGE_LIMITS: UsageLimits = {
  premium_cma_limit: 50,
  pro_cma_limit: 100,
};

export function useUsageLimit(
  userId: string | undefined,
  planId: string | null
) {
  const [usageRecord, setUsageRecord] = useState<UsageRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setUsageRecord(null);
      setLoading(false);
      return;
    }

    loadUsageRecord();
  }, [userId]);

  const getCurrentPeriod = () => {
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59
    );

    return {
      start: periodStart.toISOString(),
      end: periodEnd.toISOString(),
    };
  };

  const loadUsageRecord = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);

      const period = getCurrentPeriod();

      const { data, error } = await supabase
        .from("user_usage")
        .select("*")
        .eq("user_id", userId)
        .eq("feature", "cma")
        .eq("period_start", period.start)
        .maybeSingle();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      if (!data) {
        const { data: newRecord, error: insertError } = await supabase
          .from("user_usage")
          .insert({
            user_id: userId,
            feature: "cma",
            used_count: 0,
            period_start: period.start,
            period_end: period.end,
          })
          .select()
          .single();

        if (insertError) throw insertError;
        setUsageRecord(newRecord);
      } else {
        setUsageRecord(data);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load usage record"
      );
    } finally {
      setLoading(false);
    }
  };

  const incrementUsage = async (): Promise<boolean> => {
    if (!userId || !usageRecord) {
      throw new Error("User ID or usage record not available");
    }

    try {
      const { data, error } = await supabase
        .from("user_usage")
        .update({
          used_count: usageRecord.used_count + 1,
          updated_at: new Date().toISOString(),
        })
        .eq("id", usageRecord.id)
        .select()
        .single();

      if (error) throw error;

      setUsageRecord(data);
      return true;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to increment usage"
      );
      return false;
    }
  };

  const checkUsageLimit = (): {
    canUse: boolean;
    usedCount: number;
    limit: number;
    remaining: number;
  } => {
    const usedCount = usageRecord?.used_count || 0;

    let limit = 0;
    if (planId === process.env.NEXT_PUBLIC_STRIPE_PRO_PLAN_ID) {
      limit = USAGE_LIMITS.pro_cma_limit;
    } else if (planId === process.env.NEXT_PUBLIC_STRIPE_PLAN_ID) {
      limit = USAGE_LIMITS.premium_cma_limit;
    } else {
      limit = 0;
    }

    const remaining = Math.max(0, limit - usedCount);
    const canUse = usedCount < limit;

    return {
      canUse,
      usedCount,
      limit,
      remaining,
    };
  };

  const resetUsageForNewPeriod = async () => {
    if (!userId) return;

    const period = getCurrentPeriod();
    const currentPeriodStart = usageRecord?.period_start;

    if (currentPeriodStart && currentPeriodStart !== period.start) {
      await loadUsageRecord();
    }
  };

  return {
    usageRecord,
    loading,
    error,
    checkUsageLimit,
    incrementUsage,
    resetUsageForNewPeriod,
    refresh: loadUsageRecord,
  };
}
