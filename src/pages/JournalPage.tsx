import TradeJournalTable from '@/components/TradeJournalTable';

export default function JournalPage() {
  return (
    <div className="space-y-6 max-w-[1400px]">
      <div>
        <h1 className="text-2xl font-bold mb-1">Trade Journal</h1>
        <p className="text-sm text-muted-foreground">Review and analyze your trade history</p>
      </div>
      <TradeJournalTable />
    </div>
  );
}
