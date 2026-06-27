import { Sidebar } from "@/components/sidebar";
import { ConversionToastProvider } from "@/components/conversion-toast";
import { BalanceBar } from "@/components/balance-bar";
import { SpendLimitBar } from "@/components/spend-limit-bar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col md:pl-60">
        <SpendLimitBar />
        <BalanceBar />
        {children}
      </div>
      <ConversionToastProvider />
    </div>
  );
}
