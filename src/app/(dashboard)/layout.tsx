import { Sidebar } from "@/components/sidebar";
import { ConversionToastProvider } from "@/components/conversion-toast";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex flex-1 flex-col pl-60">
        {children}
      </div>
      <ConversionToastProvider />
    </div>
  );
}
