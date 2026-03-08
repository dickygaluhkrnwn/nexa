"use client";

import { ArrowLeft, ShieldCheck, Info, Database, Zap, BrainCircuit, Lock, UserCheck, RefreshCw, Mail } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

// Komponen Reusable untuk setiap Section
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
    { id: "usage", title: "3. Penggunaan Informasi" },
    { id: "thirdparty", title: "4. Pihak Ketiga & AI" },
    { id: "vault", title: "5. Brankas Rahasia" },
    { id: "rights", title: "6. Hak Pengguna" },
    { id: "changes", title: "7. Perubahan Kebijakan" },
    { id: "contact", title: "8. Hubungi Kami" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground pb-24 selection:bg-primary/30">
      
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
      <div className="max-w-[1400px] mx-auto px-4 md:px-8 pt-12 md:pt-20 pb-8 md:pb-12 text-center md:text-left flex flex-col md:flex-row items-center gap-8 border-b border-border/50">
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
      <main className="max-w-[1400px] mx-auto w-full px-4 md:px-8 pt-8 md:pt-12">
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
                Selamat datang di <strong className="text-foreground">Nexa AI Notes</strong> ("Aplikasi", "Kami"). Kami sangat menghargai privasi Anda dan berkomitmen untuk melindungi data pribadi yang Anda bagikan saat menggunakan layanan kami. 
              </p>
              <p>
                Kebijakan Privasi ini menjelaskan bagaimana kami mengumpulkan, menggunakan, menyimpan, dan melindungi informasi Anda dalam sebuah ekosistem yang aman dan transparan.
              </p>
            </PolicySection>

            <PolicySection id="data" icon={<Database className="w-6 h-6 md:w-8 md:h-8 text-emerald-500" />} title="2. Informasi yang Kami Kumpulkan" delay="200ms">
              <p>Saat Anda menggunakan Nexa, kami dapat mengumpulkan informasi berikut:</p>
              <ul className="space-y-4 mt-4">
                <li className="flex items-start gap-3 bg-muted/30 p-4 rounded-2xl border border-border/50">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 mt-2 shrink-0 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                  <p><strong className="text-foreground">Data Akun:</strong> Alamat email, nama profil, dan foto profil Anda (jika mendaftar menggunakan Google atau Email melalui layanan otentikasi Firebase).</p>
                </li>
                <li className="flex items-start gap-3 bg-muted/30 p-4 rounded-2xl border border-border/50">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 mt-2 shrink-0 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                  <p><strong className="text-foreground">Konten Pengguna:</strong> Teks catatan, daftar tugas (To-Do), riwayat kebiasaan (Habit), serta tag yang Anda buat dan simpan di dalam Aplikasi.</p>
                </li>
                <li className="flex items-start gap-3 bg-muted/30 p-4 rounded-2xl border border-border/50">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 mt-2 shrink-0 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                  <p><strong className="text-foreground">Data Media Sementara:</strong> Gambar atau rekaman suara yang Anda unggah untuk fitur OCR dan Transkripsi. Data ini dikirim ke server AI untuk diproses dan <strong className="text-foreground underline decoration-emerald-500 underline-offset-4">tidak kami simpan secara permanen</strong> di server kami.</p>
                </li>
              </ul>
            </PolicySection>

            <PolicySection id="usage" icon={<Zap className="w-6 h-6 md:w-8 md:h-8 text-amber-500" />} title="3. Penggunaan Informasi" delay="300ms">
              <p>Kami menggunakan data yang dikumpulkan semata-mata untuk tujuan berikut:</p>
              <ul className="list-disc pl-6 space-y-2 mt-4 font-medium text-foreground/80">
                <li>Menyediakan, memelihara, dan meningkatkan fungsionalitas Nexa.</li>
                <li>Menyinkronkan data Anda di berbagai perangkat (Cloud Sync) secara seketika.</li>
                <li>Memberikan layanan berbasis AI (merangkum teks, tag otomatis, AI Chat).</li>
              </ul>
              <div className="mt-6 p-5 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-start gap-4">
                <ShieldCheck className="w-6 h-6 text-amber-600 mt-0.5 shrink-0" />
                <p className="font-bold text-amber-700 dark:text-amber-500 text-sm md:text-base leading-relaxed">
                  Kami TIDAK PERNAH dan tidak akan pernah menjual data atau catatan Anda kepada pihak ketiga atau pengiklan. Ruang kerja Anda adalah milik Anda seutuhnya.
                </p>
              </div>
            </PolicySection>

            <PolicySection id="thirdparty" icon={<BrainCircuit className="w-6 h-6 md:w-8 md:h-8 text-purple-500" />} title="4. Pihak Ketiga & Layanan AI" delay="400ms">
              <p>Nexa menggunakan infrastruktur tingkat tinggi dari pihak ketiga untuk beroperasi secara optimal:</p>
              <div className="grid md:grid-cols-2 gap-5 mt-6">
                <div className="bg-background border border-border p-6 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
                  <h3 className="font-extrabold text-foreground mb-3 flex items-center gap-3 text-lg">
                    <div className="p-2 bg-orange-500/10 rounded-xl"><Database className="w-5 h-5 text-orange-500" /></div> Google Firebase
                  </h3>
                  <p className="text-sm md:text-base leading-relaxed">Kami menggunakan Firebase untuk database (Firestore) dan sistem login (Authentication). Data Anda dienkripsi dan disimpan dengan standar keamanan global Google.</p>
                </div>
                <div className="bg-background border border-border p-6 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
                  <h3 className="font-extrabold text-foreground mb-3 flex items-center gap-3 text-lg">
                    <div className="p-2 bg-blue-500/10 rounded-xl"><BrainCircuit className="w-5 h-5 text-blue-500" /></div> Google Gemini AI
                  </h3>
                  <p className="text-sm md:text-base leading-relaxed">Kami mengirimkan data ke Gemini API hanya saat Anda secara eksplisit meminta AI bekerja. Sesuai kebijakan Google, data ini <strong className="text-foreground">tidak digunakan</strong> melatih model dasar mereka.</p>
                </div>
              </div>
            </PolicySection>

            <PolicySection id="vault" icon={<Lock className="w-6 h-6 md:w-8 md:h-8 text-rose-500" />} title="5. Fitur Brankas Rahasia" delay="500ms">
              <p>
                Catatan yang Anda masukkan ke dalam fitur Brankas Rahasia (yang dilindungi PIN) ditandai secara khusus di dalam sistem kami untuk tidak dimunculkan di halaman publik dan dilindungi oleh <em>security rules</em> Firebase yang ketat. 
              </p>
              <div className="mt-6 p-5 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-start gap-4">
                <Info className="w-6 h-6 text-rose-600 mt-0.5 shrink-0" />
                <p className="font-medium text-rose-700 dark:text-rose-400 text-sm md:text-base leading-relaxed">
                  Namun, sebagai langkah pencegahan tambahan karena terhubung cloud pihak ketiga, dihimbau untuk <strong>tidak menyimpan informasi sangat sensitif</strong> (kata sandi perbankan/kartu kredit) di aplikasi ini.
                </p>
              </div>
            </PolicySection>

            <PolicySection id="rights" icon={<UserCheck className="w-6 h-6 md:w-8 md:h-8 text-cyan-500" />} title="6. Hak Pengguna" delay="600ms">
              <p>
                Anda adalah penguasa penuh atas data Anda. Kapan saja, Anda memiliki hak penuh untuk:
              </p>
              <ul className="list-disc pl-6 space-y-3 mt-4 font-medium text-foreground/80">
                <li>Melihat dan mengedit catatan atau tugas Anda secara <em>real-time</em>.</li>
                <li>Menghapus sebagian catatan atau mengekspornya ke format lokal (PDF/Word/TXT).</li>
                <li>Menghapus seluruh akun dan semua data yang terkait secara permanen.</li>
              </ul>
            </PolicySection>

            <PolicySection id="changes" icon={<RefreshCw className="w-6 h-6 md:w-8 md:h-8 text-muted-foreground" />} title="7. Perubahan Kebijakan" delay="700ms">
              <p>
                Nexa akan terus berevolusi. Kami dapat memperbarui Kebijakan Privasi ini dari waktu ke waktu untuk menyesuaikan dengan fitur baru (terutama yang berkaitan dengan kecerdasan buatan) atau regulasi hukum yang berlaku. 
              </p>
              <p className="mt-4">
                Kami akan memberitahu pengguna melalui <em>banner</em> di dalam Aplikasi jika terdapat perubahan yang signifikan terhadap cara kami menangani data Anda.
              </p>
            </PolicySection>

            <PolicySection id="contact" icon={<Mail className="w-6 h-6 md:w-8 md:h-8 text-primary" />} title="8. Hubungi Kami" delay="800ms">
              <p className="mb-6">
                Jika Anda memiliki pertanyaan, kekhawatiran, atau permintaan terkait privasi data Anda, tim kami selalu siap mendengarkan. Hubungi kami melalui:
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <a href="mailto:ikytech.id@gmail.com" className="flex-1 flex items-center gap-4 bg-background hover:bg-muted border border-border p-5 rounded-3xl transition-all shadow-sm hover:shadow-md group">
                  <div className="p-3 bg-primary/10 rounded-2xl group-hover:scale-110 transition-transform">
                    <Mail className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Email Dukungan</p>
                    <p className="font-extrabold text-foreground mt-0.5">ikytech.id@gmail.com</p>
                  </div>
                </a>
                
                <a href="https://nexa-seven-kappa.vercel.app" target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center gap-4 bg-background hover:bg-muted border border-border p-5 rounded-3xl transition-all shadow-sm hover:shadow-md group">
                  <div className="p-3 bg-blue-500/10 rounded-2xl group-hover:scale-110 transition-transform">
                    <Zap className="w-6 h-6 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Website Resmi</p>
                    <p className="font-extrabold text-foreground mt-0.5">Nexa App</p>
                  </div>
                </a>
              </div>
            </PolicySection>

          </div>
        </div>
      </main>

      <div className="mt-20 text-center animate-in fade-in duration-1000 delay-1000">
        <p className="text-sm font-bold text-muted-foreground">
          &copy; {new Date().getFullYear()} IKY Tech. Seluruh Hak Cipta Dilindungi.
        </p>
      </div>
    </div>
  );
}