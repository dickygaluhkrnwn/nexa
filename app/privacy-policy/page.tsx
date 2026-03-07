"use client";

import { ArrowLeft, ShieldCheck, Info, Database, Zap, BrainCircuit, Lock, UserCheck, RefreshCw, Mail } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

// Komponen Reusable untuk setiap Section agar desainnya konsisten
const PolicySection = ({ icon, title, children, delay }: { icon: React.ReactNode, title: string, children: React.ReactNode, delay: string }) => (
  <section 
    className={`bg-card border border-border/50 rounded-3xl p-6 md:p-8 shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 fill-mode-backwards`}
    style={{ animationDelay: delay }}
  >
    <div className="flex items-center gap-3 mb-4 border-b border-border/50 pb-4">
      <div className="p-3 bg-primary/10 rounded-2xl shrink-0">
        {icon}
      </div>
      <h2 className="text-xl md:text-2xl font-bold text-foreground tracking-tight">{title}</h2>
    </div>
    <div className="text-sm md:text-base leading-relaxed text-muted-foreground space-y-4">
      {children}
    </div>
  </section>
);

export default function PrivacyPolicyPage() {
  const lastUpdated = "Maret 2026"; // Sesuaikan dengan bulan & tahun rilis

  return (
    <div className="min-h-screen bg-background text-foreground pb-24 selection:bg-primary/30">
      
      {/* Header Dinamis & Sticky */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between h-16 px-4 md:px-8 max-w-4xl mx-auto">
          <Link href="/" className="flex items-center gap-3 group">
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-muted transition-colors group-hover:-translate-x-1 duration-300">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <span className="font-bold text-base md:text-lg tracking-tight">Kembali ke Beranda</span>
          </Link>
          <div className="bg-primary/10 border border-primary/20 text-primary px-3 md:px-4 py-1.5 rounded-full flex items-center gap-2 shadow-sm">
            <ShieldCheck className="w-4 h-4" />
            <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest">Dokumen Legal</span>
          </div>
        </div>
      </header>

      {/* Konten Utama */}
      <main className="max-w-4xl mx-auto w-full p-4 md:p-8 pt-8 md:pt-12">
        
        {/* Hero Title */}
        <div className="text-center mb-12 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-primary to-purple-600 rounded-[2rem] flex items-center justify-center shadow-lg shadow-primary/20 mb-6 transform rotate-3">
            <ShieldCheck className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter mb-4 text-transparent bg-clip-text bg-gradient-to-r from-foreground to-foreground/60">
            Kebijakan Privasi
          </h1>
          <p className="text-muted-foreground font-medium bg-muted inline-block px-4 py-1.5 rounded-full border border-border/50 shadow-sm">
            Terakhir Diperbarui: {lastUpdated}
          </p>
        </div>

        {/* List Section dengan desain Card/Bento yang mewah */}
        <div className="space-y-6 md:space-y-8">
          
          <PolicySection icon={<Info className="w-6 h-6 text-blue-500" />} title="1. Pendahuluan" delay="100ms">
            <p>
              Selamat datang di <strong className="text-foreground">Nexa AI Notes</strong> ("Aplikasi", "Kami"). Kami sangat menghargai privasi Anda dan berkomitmen untuk melindungi data pribadi yang Anda bagikan saat menggunakan layanan kami. 
            </p>
            <p>
              Kebijakan Privasi ini menjelaskan bagaimana kami mengumpulkan, menggunakan, menyimpan, dan melindungi informasi Anda dalam sebuah ekosistem yang aman dan transparan.
            </p>
          </PolicySection>

          <PolicySection icon={<Database className="w-6 h-6 text-emerald-500" />} title="2. Informasi yang Kami Kumpulkan" delay="200ms">
            <p>Saat Anda menggunakan Nexa, kami dapat mengumpulkan informasi berikut:</p>
            <ul className="space-y-3 mt-2">
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0" />
                <p><strong className="text-foreground">Data Akun:</strong> Alamat email, nama profil, dan foto profil Anda (jika mendaftar menggunakan Google atau Email melalui layanan otentikasi Firebase).</p>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0" />
                <p><strong className="text-foreground">Konten Pengguna:</strong> Teks catatan, daftar tugas (To-Do), riwayat kebiasaan (Habit), serta tag yang Anda buat dan simpan di dalam Aplikasi.</p>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0" />
                <p><strong className="text-foreground">Data Media Sementara:</strong> Gambar atau rekaman suara yang Anda unggah untuk fitur OCR dan Transkripsi. Data ini dikirim ke server AI untuk diproses dan <strong className="text-foreground underline decoration-emerald-500 underline-offset-4">tidak kami simpan secara permanen</strong> di server kami.</p>
              </li>
            </ul>
          </PolicySection>

          <PolicySection icon={<Zap className="w-6 h-6 text-amber-500" />} title="3. Penggunaan Informasi" delay="300ms">
            <p>Kami menggunakan data yang dikumpulkan semata-mata untuk tujuan berikut:</p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li>Menyediakan, memelihara, dan meningkatkan fungsionalitas Nexa.</li>
              <li>Menyinkronkan data Anda di berbagai perangkat (Cloud Sync) secara seketika.</li>
              <li>Memberikan layanan berbasis AI (seperti merangkum teks, menebak tag, memproses gambar menjadi teks, dan menjawab pertanyaan berbasis catatan Anda).</li>
            </ul>
            <div className="mt-4 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
              <p className="font-bold text-amber-700 dark:text-amber-500 text-sm">
                Kami TIDAK PERNAH dan tidak akan pernah menjual data atau catatan Anda kepada pihak ketiga atau pengiklan. Ruang kerja Anda adalah milik Anda seutuhnya.
              </p>
            </div>
          </PolicySection>

          <PolicySection icon={<BrainCircuit className="w-6 h-6 text-purple-500" />} title="4. Pihak Ketiga & Layanan AI" delay="400ms">
            <p>Nexa menggunakan infrastruktur tingkat tinggi dari pihak ketiga untuk dapat beroperasi secara optimal:</p>
            <div className="grid md:grid-cols-2 gap-4 mt-4">
              <div className="bg-background border border-border p-4 rounded-2xl shadow-sm">
                <h3 className="font-bold text-foreground mb-2 flex items-center gap-2">
                  <Database className="w-4 h-4 text-orange-500" /> Google Firebase
                </h3>
                <p className="text-sm">Kami menggunakan Firebase untuk database (Firestore) dan sistem login (Authentication). Data Anda dienkripsi dan disimpan dengan standar keamanan global Google.</p>
              </div>
              <div className="bg-background border border-border p-4 rounded-2xl shadow-sm">
                <h3 className="font-bold text-foreground mb-2 flex items-center gap-2">
                  <BrainCircuit className="w-4 h-4 text-blue-500" /> Google Gemini AI
                </h3>
                <p className="text-sm">Kami hanya mengirimkan data ke Gemini API pada saat Anda secara eksplisit meminta AI untuk bekerja. Sesuai kebijakan API Google, data ini <strong className="text-foreground">tidak digunakan</strong> untuk melatih model dasar mereka.</p>
              </div>
            </div>
          </PolicySection>

          <PolicySection icon={<Lock className="w-6 h-6 text-rose-500" />} title="5. Fitur Brankas Rahasia (Secret Vault)" delay="500ms">
            <p>
              Catatan yang Anda masukkan ke dalam fitur Brankas Rahasia (yang dilindungi PIN) ditandai secara khusus di dalam sistem kami untuk tidak dimunculkan di halaman publik dan dilindungi oleh *security rules* Firebase yang ketat. 
            </p>
            <p className="mt-2">
              Namun, sebagai langkah pencegahan tambahan karena aplikasi terhubung dengan komputasi awan pihak ketiga, Anda tetap dihimbau untuk <strong>tidak menyimpan informasi yang sangat sensitif</strong> seperti kata sandi perbankan atau PIN kartu kredit di dalam aplikasi ini.
            </p>
          </PolicySection>

          <PolicySection icon={<UserCheck className="w-6 h-6 text-cyan-500" />} title="6. Hak Pengguna" delay="600ms">
            <p>
              Anda adalah penguasa penuh atas data Anda. Kapan saja, Anda memiliki hak penuh untuk:
            </p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li>Melihat dan mengedit catatan atau tugas Anda secara *real-time*.</li>
              <li>Menghapus sebagian catatan atau mengekspornya ke format lokal (PDF/Word/TXT).</li>
              <li>Menghapus seluruh akun dan semua data yang terkait secara permanen. Jika Anda ingin melakukannya dan butuh bantuan, Anda dapat menghubungi kami.</li>
            </ul>
          </PolicySection>

          <PolicySection icon={<RefreshCw className="w-6 h-6 text-muted-foreground" />} title="7. Perubahan Kebijakan" delay="700ms">
            <p>
              Nexa akan terus berevolusi. Kami dapat memperbarui Kebijakan Privasi ini dari waktu ke waktu untuk menyesuaikan dengan fitur baru (terutama yang berkaitan dengan kecerdasan buatan) atau regulasi hukum yang berlaku. 
            </p>
            <p className="mt-2">
              Kami akan memberitahu pengguna melalui *banner* di dalam Aplikasi jika terdapat perubahan yang signifikan terhadap cara kami menangani data Anda.
            </p>
          </PolicySection>

          <PolicySection icon={<Mail className="w-6 h-6 text-primary" />} title="8. Hubungi Kami" delay="800ms">
            <p className="mb-4">
              Jika Anda memiliki pertanyaan, kekhawatiran, atau permintaan terkait privasi data Anda, tim kami selalu siap mendengarkan. Jangan ragu untuk menghubungi kami melalui:
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a href="mailto:ikytech.id@gmail.com" className="flex items-center gap-3 bg-muted/50 hover:bg-muted border border-border p-4 rounded-2xl transition-colors group">
                <div className="p-2 bg-primary/10 rounded-xl group-hover:scale-110 transition-transform">
                  <Mail className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Email Dukungan</p>
                  <p className="font-medium text-foreground">ikytech.id@gmail.com</p>
                </div>
              </a>
              
              <a href="https://nexa-seven-kappa.vercel.app" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 bg-muted/50 hover:bg-muted border border-border p-4 rounded-2xl transition-colors group">
                <div className="p-2 bg-blue-500/10 rounded-xl group-hover:scale-110 transition-transform">
                  <Zap className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Website Resmi</p>
                  <p className="font-medium text-foreground">nexa-seven-kappa.vercel.app</p>
                </div>
              </a>
            </div>
          </PolicySection>

        </div>
        
        {/* Footer Minimalis */}
        <div className="mt-16 text-center animate-in fade-in duration-1000 delay-1000">
          <p className="text-xs font-medium text-muted-foreground">
            &copy; {new Date().getFullYear()} IKY Tech. Seluruh Hak Cipta Dilindungi.
          </p>
        </div>
      </main>
    </div>
  );
}