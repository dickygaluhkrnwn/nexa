import type { Metadata, Viewport } from "next";
import "./globals.css";
import { BottomNav } from "@/components/layout/bottom-nav";
import { Header } from "@/components/layout/header";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/lib/auth-context";
import { ChatWidget } from "@/components/ui/chat-widget";
import { GlobalModal } from "@/components/ui/global-modal"; 
import { Analytics } from "@vercel/analytics/next"; 
import { SettingsProvider } from "@/components/providers/settings-provider";

export const metadata: Metadata = {
  title: "Nexa - Super Note AI",
  description: "Aplikasi pencatatan produktivitas cerdas",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#09090b",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className="font-sans antialiased transition-colors duration-300">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SettingsProvider>
            <AuthProvider>
              {/* Wrapper Flex: Mengatur layout navigasi kiri & konten kanan di desktop */}
              <div className="flex min-h-screen bg-background text-foreground relative">
                
                {/* Navigasi: Otomatis jadi Sidebar di Desktop dan Bottom Nav di Mobile */}
                <BottomNav />
                
                {/* Main Content Area: Padding bottom di mobile, margin left di desktop (hanya selebar ikon) */}
                <div className="flex-1 flex flex-col min-w-0 transition-all duration-300 pb-16 md:pb-0 md:ml-20">
                  <Header />
                  <main className="flex-1 w-full max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 relative">
                    {children}
                  </main>
                </div>
                
              </div>

              <ChatWidget />
              <GlobalModal /> 
            </AuthProvider>
          </SettingsProvider>
        </ThemeProvider>
        
        <Analytics />
      </body>
    </html>
  );
}