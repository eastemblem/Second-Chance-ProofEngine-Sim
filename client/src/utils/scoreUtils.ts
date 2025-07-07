// Import score badges
import Badge01 from "@/assets/badges/score/Badge_01.svg";
import Badge02 from "@/assets/badges/score/Badge_02.svg";
import Badge03 from "@/assets/badges/score/Badge_03.svg";
import Badge04 from "@/assets/badges/score/Badge_04.svg";
import Badge05 from "@/assets/badges/score/Badge_05.svg";
import Badge06 from "@/assets/badges/score/Badge_06.svg";
import Badge07 from "@/assets/badges/score/Badge_07.svg";
import Badge09 from "@/assets/badges/score/Badge_09.svg";

export const getScoreBadge = (score: number): string | null => {
  const badges = {
    1: Badge01,
    2: Badge02,
    3: Badge03,
    4: Badge04,
    5: Badge05,
    6: Badge06,
    7: Badge07,
    8: Badge07, // Using Badge07 for level 8
    9: Badge09,
  };

  const scoreBadgeMapping = {
    10: 1, 20: 2, 30: 3, 40: 4, 50: 5,
    60: 6, 70: 7, 80: 8, 90: 9, 100: 9
  };

  // Find the appropriate badge level
  for (const [threshold, level] of Object.entries(scoreBadgeMapping)) {
    if (score <= parseInt(threshold)) {
      return badges[level as keyof typeof badges] || null;
    }
  }

  return badges[9]; // Default to highest badge
};

export const calculateBadgeNumber = (score: number): number => {
  return score >= 91 ? 9 : Math.ceil((score - 10) / 10) + 1;
};

export const getMilestoneText = (score: number): string => {
  if (score >= 91) {
    return "Leader in Validation";
  } else if (score >= 80) {
    return "Investor Match Ready";
  } else {
    return "ProofScaler Candidate";
  }
};

export const getDimensionColor = (dimension: string): string => {
  const colors = {
    desirability: "bg-green-500",
    feasibility: "bg-blue-500",
    viability: "bg-orange-500",
    traction: "bg-yellow-500",
    readiness: "bg-red-500",
  };
  
  return colors[dimension as keyof typeof colors] || "bg-gray-500";
};