import NewsSection from '@/components/NewsSection';

export default function NewsPage() {
  return (
    <div className="space-y-6 max-w-[1400px]">
      <div>
        <h1 className="text-2xl font-bold mb-1">News & Events</h1>
        <p className="text-sm text-muted-foreground">Economic calendar and impact analysis</p>
      </div>
      <NewsSection />
    </div>
  );
}
