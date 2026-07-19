import { Skel, SkelPage, SkelHeader } from "@/components/ui/skel";

/** Skeleton de Leaderboard: podio + métricas + ranking. */
export default function LeaderboardLoading() {
  return (
    <SkelPage>
      <SkelHeader icon title={100} />
      <main className="flex flex-1 flex-col items-center px-4 py-10 md:px-8">
        {/* Podio */}
        <div className="flex items-end justify-center gap-4">
          <Skel w={72} h={110} r={12} />
          <Skel w={80} h={150} r={12} />
          <Skel w={72} h={90} r={12} />
        </div>
        {/* Métricas */}
        <div className="mt-12 grid w-full max-w-lg grid-cols-2 gap-3">
          <Skel h={72} r={12} />
          <Skel h={72} r={12} />
        </div>
        {/* Ranking */}
        <div className="stagger mt-10 w-full max-w-lg space-y-2.5">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skel key={i} h={50} r={10} />
          ))}
        </div>
      </main>
    </SkelPage>
  );
}
