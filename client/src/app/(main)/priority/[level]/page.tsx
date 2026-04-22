import { notFound } from "next/navigation";
import { PriorityView } from "@/components/Priority/priority-view";

const LEVEL_MAP = {
  urgent: "URGENT",
  high: "HIGH",
  medium: "MEDIUM",
  low: "LOW",
  backlog: "BACKLOG",
} as const;

type LevelParam = keyof typeof LEVEL_MAP;

export function generateMetadata({ params }: { params: { level: string } }) {
  const level = params.level.toLowerCase() as LevelParam;
  const priority = LEVEL_MAP[level];

  if (!priority) {
    return {
      title: "Priority | Longi Project Management",
    };
  }

  const readable = priority.charAt(0) + priority.slice(1).toLowerCase();
  return {
    title: `${readable} Priority Tasks`,
    description: `Tasks tracked under ${readable.toLowerCase()} priority.`,
  };
}

export default function PriorityLevelPage({ params }: { params: { level: string } }) {
  const level = params.level.toLowerCase() as LevelParam;
  const priority = LEVEL_MAP[level];

  if (!priority) {
    notFound();
  }

  return <PriorityView priority={priority} />;
}
