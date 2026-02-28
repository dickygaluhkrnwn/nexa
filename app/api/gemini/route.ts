import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

// Mengambil API Key dari environment variable
const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error("GEMINI_API_KEY is not set in environment variables");
}

const genAI = new GoogleGenerativeAI(apiKey || "");

export async function POST(req: Request) {
  try {
    if (!apiKey) {
      return NextResponse.json(
        { error: "API key not configured" },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { action, content, prompt: userPrompt, context, imageBase64, mimeType } = body;

    if (!action) {
      return NextResponse.json({ error: "Action is required" }, { status: 400 });
    }

    let finalPrompt = "";
    let generateParams: any[] = []; 
    let generationConfig: any = undefined; // Konfigurasi opsional

    // Logika berdasarkan aksi yang diminta
    switch (action) {
      case "auto-tag":
        if (!content) return NextResponse.json({ error: "Content is required" }, { status: 400 });
        finalPrompt = `
          Baca catatan berikut dan berikan maksimal 3 tag/kategori yang paling relevan.
          Format balasan harus HANYA berupa kata-kata yang dipisahkan koma, tanpa simbol hashtag (#), tanpa penjelasan tambahan.
          Contoh balasan: Ide, Pekerjaan, Prioritas Tinggi
          
          Catatan:
          "${content}"
        `;
        generateParams = [finalPrompt];
        break;

      case "summarize":
        if (!content) return NextResponse.json({ error: "Content is required" }, { status: 400 });
        finalPrompt = `
          Buatlah ringkasan singkat dan padat (maksimal 3 kalimat) dari catatan berikut.
          Fokus pada poin utama atau tindakan yang harus dilakukan.
          
          Catatan:
          "${content}"
        `;
        generateParams = [finalPrompt];
        break;

      case "auto-format":
        if (!content) return NextResponse.json({ error: "Content is required" }, { status: 400 });
        finalPrompt = `
          Tugasmu adalah merapikan teks mentah/acak berikut menjadi struktur yang sangat profesional, rapi, dan mudah dibaca.
          Gunakan tag HTML dasar (seperti <h2>, <h3>, <p>, <ul>, <li>, <strong>, <em>) untuk menstrukturkannya.
          Jangan mengubah makna asli, cukup perbaiki ejaan, tanda baca, tata bahasa, dan buat susunannya lebih logis (misalnya memisahkan paragraf panjang, membuat bullet points untuk daftar).
          PENTING: Output HANYA berupa kode HTML murni tanpa bungkus markdown block (jangan gunakan \`\`\`html ... \`\`\`).
          
          Teks mentah:
          "${content}"
        `;
        generateParams = [finalPrompt];
        break;

      case "mindmap":
        if (!content) return NextResponse.json({ error: "Content is required" }, { status: 400 });
        finalPrompt = `
          Buatlah diagram (peta konsep) berformat sintaks Mermaid.js dari catatan berikut.
          PENTING: 
          - Output HANYA berupa kode Mermaid murni.
          - Jangan gunakan markdown block (\`\`\`mermaid ... \`\`\`).
          - Pastikan sintaksnya valid agar tidak error saat di-render.
          - Gunakan format 'mindmap' atau 'graph LR' untuk hierarkinya.
          - Hindari karakter khusus (seperti kutip atau titik dua) di dalam teks node agar tidak merusak render.
          
          Catatan:
          "${content}"
        `;
        generateParams = [finalPrompt];
        break;

      case "project-breakdown":
        if (!content) return NextResponse.json({ error: "Content is required" }, { status: 400 });
        finalPrompt = `
          Kamu adalah Manajer Proyek AI profesional tingkat lanjut. Pengguna ingin mengerjakan proyek/tugas dengan judul: "${content}".
          ${context ? context : ''}
          
          Tugasmu adalah menganalisis proyek tersebut dan memecahnya menjadi langkah-langkah eksekusi yang praktis dan terstruktur.
          
          Berikan balasan HANYA dalam format JSON. Strukturnya WAJIB persis seperti ini:
          {
            "description": "Deskripsi singkat dan tips strategi untuk menyelesaikan proyek ini (maksimal 3 kalimat).",
            "subTasks": [
              "Langkah 1: ...",
              "Langkah 2: ...",
              "Langkah 3: ..."
            ],
            "recommendedDueDate": "YYYY-MM-DD"
          }
          
          - 'subTasks' berisi 5 hingga 12 rincian sub-tugas yang spesifik dan langsung bisa dieksekusi.
          - 'recommendedDueDate' hitung perkiraan waktu penyelesaian logis dari tanggal hari ini dan kembalikan wujud tanggalnya.
        `;
        generateParams = [finalPrompt];
        
        // Memaksa model untuk membalas dengan struktur JSON Murni
        generationConfig = { responseMimeType: "application/json" };
        break;

      // --- TAMBAHAN FITUR AI WEEKLY REVIEW ---
      case "weekly-review":
        if (!content) return NextResponse.json({ error: "Content is required" }, { status: 400 });
        finalPrompt = `
          Kamu adalah Pelatih Produktivitas (Productivity Coach) AI yang suportif dan tajam analisanya.
          Pengguna memberikan daftar tugas mereka selama seminggu terakhir beserta statusnya (Selesai atau Terlewat/Belum).
          
          Tugasmu:
          1. Analisis performa mingguan mereka secara keseluruhan.
          2. Berikan apresiasi jika banyak yang selesai, atau dorongan semangat jika banyak yang terlewat.
          3. Cari tahu pola atau jenis tugas apa yang berhasil mereka kerjakan dan apa yang diabaikan.
          4. Berikan saran praktis untuk minggu depan.
          
          Berikan balasan HANYA dalam format JSON murni. Strukturnya WAJIB persis seperti ini:
          {
            "title": "Judul review yang menarik (misal: 'Minggu yang Luar Biasa!' atau 'Waktunya Bangkit!')",
            "summary": "Ringkasan evaluasi 2-3 kalimat yang personal dan memotivasi.",
            "insights": [
              "Poin wawasan 1 (misal: Kamu luar biasa dalam menyelesaikan tugas desain)",
              "Poin wawasan 2"
            ],
            "focusNextWeek": [
              "Saran prioritas 1 untuk minggu depan",
              "Saran prioritas 2"
            ],
            "grade": "A/B/C/D"
          }
          
          Data Tugas Minggu Ini:
          "${content}"
        `;
        generateParams = [finalPrompt];
        generationConfig = { responseMimeType: "application/json" };
        break;
      // -----------------------------------------

      case "chat":
        if (!userPrompt) return NextResponse.json({ error: "Prompt is required for chat" }, { status: 400 });
        finalPrompt = `
          Kamu adalah "Nexa", asisten AI cerdas, ramah, dan proaktif di aplikasi pencatatan "Super Note AI".
          Tugas utamamu adalah membantu pengguna menjawab pertanyaan BERDASARKAN catatan yang mereka miliki.
          Jawablah dengan bahasa Indonesia yang santai, ringkas, dan jelas.
          Jika jawaban tidak ada di dalam catatan mereka, gunakan pengetahuan umummu tetapi beri tahu mereka bahwa info tersebut tidak ada di catatan.
          
          Berikut adalah daftar catatan milik pengguna sebagai konteksmu:
          ${context || "Pengguna belum memiliki catatan."}
          
          Pertanyaan/Perintah Pengguna:
          "${userPrompt}"
        `;
        generateParams = [finalPrompt];
        break;

      case "ocr":
        if (!imageBase64) return NextResponse.json({ error: "Image Base64 is required for OCR" }, { status: 400 });
        finalPrompt = `Ekstrak seluruh teks yang ada di gambar ini dengan sangat akurat. 
        PENTING: Outputkan hasilnya dalam format HTML dasar (seperti <p>, <br>, <strong>, <ul>, <li>) agar bisa langsung dimasukkan ke Text Editor.
        JANGAN sertakan awalan \`\`\`html atau akhiran \`\`\`. Hanya berikan elemen HTML-nya saja.`;
        
        const imagePart = {
          inlineData: {
            data: imageBase64,
            mimeType: mimeType || "image/jpeg",
          },
        };
        generateParams = [finalPrompt, imagePart];
        break;

      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        );
    }

    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      ...(generationConfig && { generationConfig })
    });

    // ==========================================
    // SISTEM RETRY: EXPONENTIAL BACKOFF (DIPERCEPAT)
    // ==========================================
    // Mengurangi waktu tunggu agar cepat gagal jika terkena limit.
    // Total antrean hanya 7 detik (1s + 2s + 4s). 
    // Jika gagal, user akan langsung mendapat alert untuk berdonasi.
    const delays = [1000, 2000, 4000]; 
    let result;
    let lastError;

    for (let i = 0; i <= delays.length; i++) {
      try {
        result = await model.generateContent(generateParams);
        break; // Jika berhasil, keluar dari loop
      } catch (error: any) {
        lastError = error;
        // Jika sudah mencapai batas percobaan terakhir, lemparkan error
        if (i === delays.length) {
          throw lastError;
        }
        // Tunggu (delay) sebelum mencoba kembali tanpa memberi tahu user
        await new Promise(resolve => setTimeout(resolve, delays[i]));
      }
    }

    if (!result) {
      throw lastError || new Error("Gagal mengambil data dari AI setelah beberapa kali percobaan.");
    }

    const responseText = result.response.text();
    return NextResponse.json({ result: responseText.trim() });

  } catch (error: any) {
    console.error("Error generating AI content:", error);
    // Mengoper kode 429 secara spesifik agar bisa ditangkap oleh hooks use-gemini
    const isQuotaError = error?.message?.toLowerCase().includes("quota") || error?.status === 429;
    
    return NextResponse.json(
      { error: error.message || "Failed to generate content" },
      { status: isQuotaError ? 429 : 500 }
    );
  }
}