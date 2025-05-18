"use client";

import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

interface URLParamsProps {
  setCampaignId: (id: string) => void;
  setUserId: (id: string) => void;
  // setScore: (score: number) => void;
}

export default function URLParams({ setCampaignId, setUserId }: URLParamsProps) {
  const searchParams = useSearchParams();

  useEffect(() => {
    const campaignId = searchParams.get("campaign_id") || "";
    const userId = searchParams.get("user_id") || "";
    // const score = parseInt(searchParams.get("score") || "0", 10);

    if (campaignId) {
      console.log("Fetched campaign_id:", campaignId);
      setCampaignId(campaignId);
    }

    if (userId) {
      console.log("Fetched user_id:", userId);
      setUserId(userId);
    }

    // if (!isNaN(score)) {
    //   console.log("Fetched score:", score);
    //   setScore(score);
    // }
  }, [searchParams, setCampaignId, setUserId]);

  return null; // No UI, only setting state
}
