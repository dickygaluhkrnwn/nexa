import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

// Mengambil API Key dari environment variable
const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

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
          Kamu adalah Asisten Produktivitas AI yang sangat cerdas. Pengguna memberikan permintaan berupa rencana proyek, rutinitas, atau jadwal harian berikut: 
          
          "${content}"
          
          ${context ? context : ''}
          
          Tugasmu adalah memecah permintaan tersebut menjadi langkah-langkah atau jadwal yang terstruktur. Jika pengguna meminta jadwal harian/rutinitas (misal: jadwal shalat, jadwal belajar), buatkan sub-tugas berdasarkan waktu yang logis. Jangan berhalusinasi menjadi proyek startup jika pengguna hanya meminta jadwal sederhana.
          
          Berikan balasan HANYA dalam format JSON murni. Strukturnya WAJIB persis seperti ini:
          {
            "description": "Deskripsi singkat dan tips strategi untuk menyelesaikan ini (maksimal 3 kalimat).",
            "subTasks": [
              {
                "text": "Nama tugas atau aktivitas (contoh: Shalat Subuh / Analisis Pasar)",
                "time": "HH:MM" 
              }
            ],
            "recommendedDueDate": "YYYY-MM-DD"
          }
          
          - 'subTasks' berisi rincian aktivitas. Isi properti "time" dengan jam (contoh "04:30") HANYA jika konteksnya adalah jadwal harian/rutinitas. Jika proyek biasa, biarkan "time" kosong ("").
          - 'recommendedDueDate' hitung perkiraan waktu penyelesaian logis dari tanggal hari ini. Kosongkan jika ini adalah rutinitas tanpa tenggat akhir.
        `;
        generateParams = [finalPrompt];
        generationConfig = { responseMimeType: "application/json" };
        break;

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

      case "analyze-voice-memo":
        if (!content) return NextResponse.json({ error: "Content is required" }, { status: 400 });
        finalPrompt = `
          Kamu adalah Asisten Notulen cerdas. Pengguna merekam suara mereka (Voice Memo/Transkripsi).
          Teks hasil transkripsi mungkin agak berantakan, tidak ada tanda baca yang tepat, atau banyak kata-kata *filler* (seperti "eh", "em").
          
          Tugasmu:
          1. Rapikan teks tersebut menjadi paragraf yang koheren dan profesional (buang kata-kata *filler*). Ini adalah bagian "Informasi Utama".
          2. Ekstrak setiap tindakan atau tugas yang tersirat dalam rekaman tersebut ke dalam daftar terpisah. Ini adalah bagian "Action Items/To-Do".
          
          Berikan balasan HANYA dalam format JSON murni. Strukturnya WAJIB persis seperti ini:
          {
            "title": "Judul singkat dan merepresentasikan keseluruhan obrolan (Maksimal 6 kata).",
            "summary": "Ringkasan super singkat (1-2 kalimat) dari isi rekaman.",
            "formattedText": "Teks hasil rekaman yang sudah dirapikan ejaan dan susunannya (gunakan HTML dasar seperti <p> jika perlu).",
            "actionItems": [
              "Tugas 1",
              "Tugas 2"
            ]
          }
          
          Transkripsi Suara:
          "${content}"
        `;
        generateParams = [finalPrompt];
        generationConfig = { responseMimeType: "application/json" };
        break;

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

      case "generate-flashcards":
        if (!content) return NextResponse.json({ error: "Content is required" }, { status: 400 });
        finalPrompt = `
          Kamu adalah AI pembuat Flashcard pembelajaran. Baca materi/catatan berikut dan buatkan kartu flashcard tanya-jawab untuk membantu pengguna menghafal konsep-konsep penting di dalamnya.
          
          Berikan balasan HANYA dalam format JSON murni. Strukturnya WAJIB array of objects seperti ini:
          [
            {
              "front": "Pertanyaan, istilah, atau konsep singkat (Sisi Depan)",
              "back": "Jawaban, definisi, atau penjelasan detail (Sisi Belakang)"
            }
          ]
          
          Buatlah antara 5 hingga 10 flashcard tergantung panjang materi. Pastikan jawabannya akurat sesuai teks.
          
          Catatan Materi:
          "${content}"
        `;
        generateParams = [finalPrompt];
        generationConfig = { responseMimeType: "application/json" };
        break;

      // =====================================================================
      // --- FASE 5: RAG ENGINE (CLIENT-SIDE RAG) ---
      // =====================================================================
      case "rag-select-docs":
        if (!userPrompt || !context) return NextResponse.json({ error: "Prompt and context are required" }, { status: 400 });
        
        finalPrompt = `Kamu adalah asisten mesin pencari catatan pintar.
        Pengguna bertanya: "${userPrompt}"
        
        Tugasmu menganalisis daftar catatan di bawah ini (yang berisi ID, Judul, Tanggal, Tag, dan Cuplikan).
        Pilih HINGGA 5 ID catatan yang informasinya PALING MUNGKIN bisa menjawab pertanyaan pengguna atau berhubungan dengan topik yang ditanyakan.
        
        TIPS CERDAS:
        - Jika pengguna bertanya "catatan terbaruku" atau "terakhir kali", perhatikan atribut "Tanggal" dan pilih catatan yang tanggalnya paling baru.
        - Pahami sinonim. Jika pengguna bertanya tentang "bisnis", cari juga tag atau cuplikan yang mengandung "uang", "proyek", "startup".
        
        Balas HANYA dengan array JSON murni berisi string ID catatan. Contoh: ["id_1", "id_2"]. 
        Jika benar-benar tidak ada yang relevan, balas dengan array kosong []. Jangan tambahkan teks apa pun selain JSON.
        
        Daftar Catatan:\n${context}`;
        
        generationConfig = { responseMimeType: "application/json" };
        generateParams = [finalPrompt];
        break;

      case "rag-answer":
        if (!userPrompt || !context) return NextResponse.json({ error: "Prompt and context are required" }, { status: 400 });
        
        finalPrompt = `Kamu adalah Nexa, asisten cerdas pengelola catatan. Jawablah pertanyaan pengguna berikut:
        "${userPrompt}"
        
        Referensi Dokumen Catatan Pengguna:
        \n${context}
        
        Aturan Menjawab:
        1. Gunakan bahasa yang santai, bersahabat, dan langsung ke intinya. Format jawabanmu menggunakan HTML dasar (seperti <strong>, <ul>, <br>) agar rapi.
        2. Jika Referensi Dokumen berisi peringatan "SISTEM: Pengguna tidak memiliki catatan...", jawablah pertanyaannya menggunakan pengetahuan umummu, TAPI katakan dengan jelas bahwa informasi ini tidak ada di dalam catatan mereka.
        3. PENTING: Jika kamu mengutip atau merangkum informasi dari Referensi Dokumen, kamu WAJIB menyertakan tautan ke catatan aslinya menggunakan format: [[Judul Catatan Aslinya]].
        Contoh: "Di catatan [[Ide Usaha 2026]], kamu menyebutkan bahwa..."`;
        
        generateParams = [finalPrompt];
        break;
      // =====================================================================

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

    const delays = [1000, 2000, 4000]; 
    let result;
    let lastError;

    for (let i = 0; i <= delays.length; i++) {
      try {
        result = await model.generateContent(generateParams);
        break; 
      } catch (error: any) {
        lastError = error;
        if (i === delays.length) {
          throw lastError;
        }
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
    const isQuotaError = error?.message?.toLowerCase().includes("quota") || error?.status === 429;
    
    return NextResponse.json(
      { error: error.message || "Failed to generate content" },
      { status: isQuotaError ? 429 : 500 }
    );
  }
}