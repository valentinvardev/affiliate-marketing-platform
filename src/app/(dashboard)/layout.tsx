import { Sidebar } from "@/components/sidebar";
import { ConversionToastProvider } from "@/components/conversion-toast";
import { BalanceBar } from "@/components/balance-bar";
import { SpendLimitBar } from "@/components/spend-limit-bar";
import { AssistantWidget } from "@/components/assistant-widget";
import { I18nProvider } from "@/components/i18n-provider";
import { getLang } from "@/lib/i18n-server";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const lang = await getLang();
  return (
    <I18nProvider lang={lang}>
      <div className="flex min-h-screen">
        <Sidebar />
        {/* safe-top reserva la franja del status bar en la app instalada. Va con
            el color de la BalanceBar (la barra de más arriba) para que la franja
            se vea continua con ella y no como un bloque pegado encima. */}
        <div
          className="safe-top safe-x flex min-w-0 flex-1 flex-col md:pl-60"
          style={{ background: "var(--color-surface)" }}
        >
          <SpendLimitBar />
          <BalanceBar />
          {children}
        </div>
        <ConversionToastProvider />
        <AssistantWidget />
      </div>
    </I18nProvider>
  );
}
