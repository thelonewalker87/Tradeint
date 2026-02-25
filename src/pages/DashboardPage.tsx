import { performanceMetrics } from '@/data/mockData';
import PerformanceCards from '@/components/PerformanceCards';
import PerformanceCharts from '@/components/PerformanceCharts';
import BehavioralInsights from '@/components/BehavioralInsights';
import NewsSection from '@/components/NewsSection';
import TradeJournalTable from '@/components/TradeJournalTable';

export default function DashboardPage() {
  return (
    <div className="space-y-6 max-w-[1400px]">
      <div>
        <h1 className="text-2xl font-bold mb-1">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Your trading performance at a glance</p>
      </div>

      <PerformanceCards metrics={performanceMetrics} />
      <PerformanceCharts />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <BehavioralInsights />
        <NewsSection />
      </div>

      <TradeJournalTable />
    </div>
  );
}
