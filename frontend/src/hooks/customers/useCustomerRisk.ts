"use client";

import { useCallback, useEffect, useState } from "react";

import { getCustomerRisk, type CustomerRiskResult } from "@/lib/risk";

/**
 * Fresh risk for one customer. Refetches when `version` changes
 * (e.g. after a payment changes their balance).
 */
export function useCustomerRisk(customerId: string, version: string) {
  const [result, setResult] = useState<CustomerRiskResult | null>(null);
  const [failed, setFailed] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;

    getCustomerRisk(customerId)
      .then((data) => {
        if (!active) return;
        setResult(data);
        setFailed(false);
      })
      .catch(() => active && setFailed(true));

    return () => {
      active = false;
    };
  }, [customerId, version, reloadKey]);

  const reload = useCallback(() => setReloadKey((key) => key + 1), []);

  return { result, failed, reload };
}
