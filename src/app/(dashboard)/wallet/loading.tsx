import { Skel, SkelPage, SkelHeader } from "@/components/ui/skel";

/** Skeleton de Wallet: panel central de balance. */
export default function WalletLoading() {
  return (
    <SkelPage>
      <SkelHeader icon title={70} />
      <main className="flex flex-1 flex-col items-center px-4 py-10 md:px-8">
        <div className="w-full max-w-sm rounded-2xl p-8 text-center" style={{ border: "1px solid var(--color-border)", background: "var(--color-surface-raised)" }}>
          <Skel w={44} h={44} r={12} style={{ margin: "0 auto" }} />
          <Skel w={100} h={11} r={5} style={{ margin: "18px auto 0" }} />
          <Skel w={180} h={40} r={10} style={{ margin: "14px auto 0" }} />
          <Skel h={40} r={10} style={{ marginTop: 24 }} />
        </div>
        <div className="mt-8 w-full max-w-sm space-y-2.5">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skel key={i} h={44} r={10} />
          ))}
        </div>
      </main>
    </SkelPage>
  );
}
