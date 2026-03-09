"use client";

import { ArrowLeft, ShieldCheck, Info, Database, Zap, BrainCircuit, Lock, UserCheck, RefreshCw, Mail, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const PolicySection = ({ id, icon, title, children, delay }: { id: string, icon: React.ReactNode, title: string, children: React.ReactNode, delay: string }) => (
  <section 
    id={id}
    className={`bg-card border border-border/50 rounded-[2rem] p-6 md:p-10 shadow-sm hover:shadow-lg hover:border-primary/30 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 fill-mode-backwards scroll-mt-24`}
    style={{ animationDelay: delay }}
  >
    <div className="flex items-center gap-4 mb-6 border-b border-border/50 pb-5">
      <div className="p-3.5 bg-primary/10 rounded-2xl shrink-0">
        {icon}
      </div>
      <h2 className="text-xl md:text-3xl font-extrabold text-foreground tracking-tight">{title}</h2>
    </div>
    <div className="text-base md:text-lg leading-relaxed text-muted-foreground space-y-5">
      {children}
    </div>
  </section>
);

export default function PrivacyPolicyPage() {
  const lastUpdated = "Maret 2026"; 

  const tocItems = [
    { id: "intro", title: "1. Pendahuluan" },
    { id: "data", title: "2. Informasi yang Kami Kumpulkan" },
    { id: "sensitive", title: "3. Penanganan Data Sensitif" },
    { id: "usage", title: "4. Penggunaan Informasi" },
    { id: "thirdparty", title: "5. Pihak Ketiga & AI" },
    { id: "children", title: "6. Privasi Anak-Anak" },
    { id: "rights", title: "7. Hak & Penghapusan Data" },
    { id: "contact", title: "8. Hubungi Kami" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground pb-24 selection:bg-primary/30 relative">
      
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-bl from-primary/5 via-purple-500/5 to-transparent rounded-bl-full pointer-events-none z-0" />

      {/* Header Dinamis & Sticky */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between h-16 px-4 md:px-8 max-w-[1400px] mx-auto">
          <Link href="/" className="flex items-center gap-3 group">
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-muted transition-colors group-hover:-translate-x-1 duration-300">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <span className="font-bold text-base md:text-lg tracking-tight">Kembali ke Beranda</span>
          </Link>
          <div className="bg-primary/10 border border-primary/20 text-primary px-4 py-1.5 rounded-full flex items-center gap-2 shadow-sm">
            <ShieldCheck className="w-4 h-4" />
            <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest">Dokumen Legal</span>
          </div>
        </div>
      </header>

      {/* Hero Title */}
      <div className="max-w-[1400px] mx-auto px-4 md:px-8 pt-12 md:pt-20 pb-8 md:pb-12 text-center md:text-left flex flex-col md:flex-row items-center gap-8 border-b border-border/50 relative z-10">
        <div className="w-24 h-24 md:w-32 md:h-32 shrink-0 bg-gradient-to-br from-primary to-purple-600 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-primary/20 transform rotate-3">
          <ShieldCheck className="w-12 h-12 md:w-16 md:h-16 text-white" />
        </div>
        <div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter mb-4 text-transparent bg-clip-text bg-gradient-to-r from-foreground to-foreground/60">
            Kebijakan Privasi
          </h1>
          <p className="text-muted-foreground font-bold uppercase tracking-widest text-xs md:text-sm bg-muted inline-block px-4 py-2 rounded-lg border border-border shadow-sm">
            Terakhir Diperbarui: {lastUpdated}
          </p>
        </div>
      </div>

      {/* Split Layout (Desktop) */}
      <main className="max-w-[1400px] mx-auto w-full px-4 md:px-8 pt-8 md:pt-12 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* Sidebar Navigasi (Hanya Desktop) */}
          <div className="hidden lg:block lg:col-span-4 xl:col-span-3 sticky top-24">
            <div className="bg-card border border-border/50 rounded-[2rem] p-6 shadow-sm">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">Daftar Isi</h3>
              <nav className="flex flex-col gap-1.5">
                {tocItems.map((item) => (
                  <a 
                    key={item.id} 
                    href={`#${item.id}`}
                    className="px-4 py-2.5 rounded-xl text-sm font-semibold text-foreground/70 hover:text-primary hover:bg-primary/5 transition-all"
                  >
                    {item.title}
                  </a>
                ))}
              </nav>
            </div>
          </div>

          {/* Konten Utama Section */}
          <div className="lg:col-span-8 xl:col-span-9 space-y-8 md:space-y-12">
            
            <PolicySection id="intro" icon={<Info className="w-6 h-6 md:w-8 md:h-8 text-blue-500" />} title="1. Pendahuluan" delay="100ms">
              <p>
                Selamat datang di <strong className="text-foreground">Nexa AI Notes</strong> ("Aplikasi", "Kami"). Kami berkomitmen penuh untuk melindungi privasi dan keamanan data Anda sesuai dengan standar perlindungan data yang ditetapkan oleh Google Play Store.
              </p>
              <p>
                Kebijakan Privasi ini menjelaskan secara transparan mengenai data apa saja yang kami kumpulkan, bagaimana data tersebut digunakan, dan hak Anda untuk mengendalikan atau menghapus data tersebut.
              </p>
            </PolicySection>

            <PolicySection id="data" icon={<Database className="w-6 h-6 md:w-8 md:h-8 text-emerald-500" />} title="2. Informasi yang Kami Kumpulkan" delay="200ms">
              <p>Agar aplikasi dapat berfungsi, kami mengumpulkan jenis data berikut secara terbatas:</p>
              <ul className="space-y-4 mt-4">
                <li className="flex items-start gap-3 bg-muted/30 p-4 rounded-2xl border border-border/50">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 mt-2 shrink-0 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                  <p><strong className="text-foreground">Data Akun Terautentikasi:</strong> Jika Anda mendaftar melalui Email atau Google, kami menyimpan alamat email, ID Pengguna (UID) anonim, dan nama profil yang Anda berikan.</p>
                </li>
                <li className="flex items-start gap-3 bg-muted/30 p-4 rounded-2xl border border-border/50">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 mt-2 shrink-0 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                  <p><strong className="text-foreground">Konten Buatan Pengguna:</strong> Teks catatan, daftar tugas, data <em>habit tracker</em>, dan folder/tag yang Anda buat secara sengaja di dalam aplikasi. Data ini disinkronkan ke <em>cloud database</em> kami untuk memungkinkan Anda mengaksesnya dari berbagai perangkat.</p>
                </li>
              </ul>
            </PolicySection>

            <PolicySection id="sensitive" icon={<Lock className="w-6 h-6 md:w-8 md:h-8 text-rose-500" />} title="3. Penanganan Data Sensitif & Perangkat" delay="300ms">
              <p>
                Aplikasi Nexa <strong>TIDAK mengakses, mengumpulkan, atau membagikan</strong> data sensitif perangkat Anda seperti daftar kontak, lokasi fisik (GPS), atau file sistem di luar ruang lingkup aplikasi.
              </p>
              <div className="mt-6 p-5 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex flex-col md:flex-row items-start md:items-center gap-4">
                <Lock className="w-8 h-8 text-rose-600 shrink-0" />
                <p className="font-medium text-rose-700 dark:text-rose-400 text-sm md:text-base leading-relaxed">
                  <strong>Penggunaan Kamera dan Mikrofon:</strong> Akses ke Kamera dan Mikrofon (jika Anda izinkan) HANYA digunakan secara langsung saat Anda mengaktifkan fitur <em>Scan Image to Text (OCR)</em> atau <em>Voice Dictation</em>. Media yang ditangkap diproses sementara oleh AI dan <strong>TIDAK PERNAH disimpan secara permanen</strong> di server kami.
                </p>
              </div>
            </PolicySection>

            <PolicySection id="usage" icon={<Zap className="w-6 h-6 md:w-8 md:h-8 text-amber-500" />} title="4. Penggunaan Informasi" delay="400ms">
              <p>Informasi yang terkumpul digunakan HANYA untuk operasional internal aplikasi, yaitu:</p>
              <ul className="list-disc pl-6 space-y-2 mt-4 font-medium text-foreground/80">
                <li>Menyediakan fungsionalitas inti pencatatan dan sinkronisasi lintas perangkat.</li>
                <li>Memberikan layanan analisis konten menggunakan AI (Ringkasan, <em>Flashcards</em>, Chat).</li>
                <li>Meningkatkan pengalaman pengguna tanpa melibatkan <em>tracking</em> iklan pihak ketiga.</li>
              </ul>
              <div className="mt-6 p-5 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-start gap-4">
                <ShieldCheck className="w-6 h-6 text-amber-600 mt-0.5 shrink-0" />
                <p className="font-bold text-amber-700 dark:text-amber-500 text-sm md:text-base leading-relaxed">
                  Kami TIDAK PERNAH dan tidak akan pernah menjual, menyewakan, atau menukar data pribadi maupun catatan Anda kepada pengiklan atau pihak ketiga mana pun.
                </p>
              </div>
            </PolicySection>

            <PolicySection id="thirdparty" icon={<BrainCircuit className="w-6 h-6 md:w-8 md:h-8 text-purple-500" />} title="5. Pihak Ketiga & AI" delay="500ms">
              <p>Untuk beroperasi dengan aman dan cerdas, Nexa menggunakan layanan infrastruktur ternama:</p>
              <div className="grid md:grid-cols-2 gap-5 mt-6">
                <div className="bg-background border border-border p-6 rounded-3xl shadow-sm">
                  <h3 className="font-extrabold text-foreground mb-3 flex items-center gap-3 text-lg">
                    <div className="p-2 bg-orange-500/10 rounded-xl"><Database className="w-5 h-5 text-orange-500" /></div> Firebase (Google)
                  </h3>
                  <p className="text-sm md:text-base leading-relaxed">Digunakan untuk penyimpanan data (Firestore) dan otentikasi. Data diamankan menggunakan enkripsi standar industri dari infrastruktur Google Cloud.</p>
                </div>
                <div className="bg-background border border-border p-6 rounded-3xl shadow-sm">
                  <h3 className="font-extrabold text-foreground mb-3 flex items-center gap-3 text-lg">
                    <div className="p-2 bg-blue-500/10 rounded-xl"><BrainCircuit className="w-5 h-5 text-blue-500" /></div> Gemini AI API
                  </h3>
                  <p className="text-sm md:text-base leading-relaxed">Catatan Anda dikirimkan secara aman ke API Gemini hanya ketika Anda menekan tombol AI. Berdasarkan SLA Google Enterprise, data ini <strong>tidak dikumpulkan atau digunakan</strong> untuk melatih model dasar Google.</p>
                </div>
              </div>
            </PolicySection>

            <PolicySection id="children" icon={<AlertTriangle className="w-6 h-6 md:w-8 md:h-8 text-yellow-500" />} title="6. Privasi Anak-Anak" delay="600ms">
              <p>
                Layanan kami ditujukan untuk audiens umum dan tidak dirancang secara spesifik untuk anak-anak di bawah usia 13 tahun (atau batas usia minimum yang berlaku di wilayah hukum terkait). 
              </p>
              <p className="mt-4">
                Kami tidak mengumpulkan informasi identitas pribadi dari anak-anak secara sengaja. Jika Anda adalah orang tua atau wali dan menyadari bahwa anak Anda telah memberikan data pribadi kepada kami, silakan hubungi kami untuk segera melakukan penghapusan data tersebut dari server.
              </p>
            </PolicySection>

            <PolicySection id="rights" icon={<UserCheck className="w-6 h-6 md:w-8 md:h-8 text-cyan-500" />} title="7. Hak & Penghapusan Data" delay="700ms">
              <p>
                Anda memegang kendali absolut atas data Anda (<em>Right to be Forgotten</em>). Di dalam Aplikasi Nexa, Anda dapat:
              </p>
              <ul className="list-disc pl-6 space-y-3 mt-4 font-medium text-foreground/80 mb-6">
                <li>Menghapus satuan catatan, tugas, atau kebiasaan secara langsung melalui antarmuka aplikasi.</li>
                <li><strong>Menghapus Akun Sepenuhnya:</strong> Anda dapat menghapus akun Anda dan seluruh data yang melekat padanya melalui menu "Pengaturan Profil" dan memilih opsi "Hapus Akun Permanen" (jika tersedia) atau dengan menghubungi tim dukungan kami.</li>
              </ul>
              <p className="p-4 bg-muted/50 rounded-2xl border border-border/50 text-sm">
                *Penghapusan data dari sistem kami bersifat final dan tidak dapat dipulihkan kembali.
              </p>
            </PolicySection>

            <PolicySection id="contact" icon={<Mail className="w-6 h-6 md:w-8 md:h-8 text-primary" />} title="8. Hubungi Kami" delay="800ms">
              <p className="mb-6">
                Jika Anda memiliki pertanyaan tentang kebijakan ini, permohonan penghapusan data, atau kekhawatiran tentang keamanan aplikasi, jangan ragu untuk menghubungi pengembang utama kami:
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <a href="mailto:ikytech.id@gmail.com" className="flex-1 flex items-center gap-4 bg-background hover:bg-muted border border-border p-5 rounded-3xl transition-all shadow-sm hover:shadow-md group">
                  <div className="p-3 bg-primary/10 rounded-2xl group-hover:scale-110 transition-transform">
                    <Mail className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Email Pengembang</p>
                    <p className="font-extrabold text-foreground mt-0.5">ikytech.id@gmail.com</p>
                  </div>
                </a>
                
                <a href="https://nexa-seven-kappa.vercel.app" target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center gap-4 bg-background hover:bg-muted border border-border p-5 rounded-3xl transition-all shadow-sm hover:shadow-md group">
                  <div className="p-3 bg-blue-500/10 rounded-2xl group-hover:scale-110 transition-transform">
                    <Zap className="w-6 h-6 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Website Resmi</p>
                    <p className="font-extrabold text-foreground mt-0.5">Nexa AI Notes</p>
                  </div>
                </a>
              </div>
            </PolicySection>

          </div>
        </div>
      </main>

      <div className="mt-20 text-center animate-in fade-in duration-1000 delay-1000 relative z-10">
        <p className="text-sm font-bold text-muted-foreground">
          &copy; {new Date().getFullYear()} IKY Tech. Seluruh Hak Cipta Dilindungi.
        </p>
      </div>
    </div>
  );
}