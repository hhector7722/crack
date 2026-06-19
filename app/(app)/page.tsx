"use client";

import { HomeDashboard } from "@/components/home-dashboard";
import { useRefreshKey } from "./layout";

export default function HomePage() {
  const refreshKey = useRefreshKey();
  return <HomeDashboard refreshKey={refreshKey} />;
}
