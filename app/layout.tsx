import type { Metadata, Viewport } from "next";
import "./globals.css";
import { BottomNav } from "@/components/layout/bottom-nav";
import { Header } from "@/components/layout/header";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/lib/auth-context";
import { ChatWidget } from "@/components/ui/chat-widget";
import { GlobalModal } from "@/components/ui/global-modal"; 
import { Analytics } from "@vercel/analytics/next"; 
import { SettingsProvider } from "@/components/providers/settings-provider"; // <-- Import Settings Provider

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
      {/* Menggunakan font-sans bawaan Tailwind dan efek transisi smooth saat ganti tema/warna */}
      <body className="font-sans antialiased pb-16 md:pb-0 transition-colors duration-300">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {/* Settings Provider membungkus aplikasi untuk mendengarkan perubahan font & aksen warna */}
          <SettingsProvider>
            <AuthProvider>
              <Header />
              <main className="min-h-screen bg-background max-w-lg mx-auto relative">
                {children}
              </main>
              <ChatWidget />
              <BottomNav />
              <GlobalModal /> 
            </AuthProvider>
          </SettingsProvider>
        </ThemeProvider>
        
        <Analytics />
      </body>
    </html>
  );
}