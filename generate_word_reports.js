const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, ImageRun, Table, TableRow, TableCell, WidthType, BorderStyle } = require("docx");
const fs = require("fs");
const path = require("path");

const ARTIFACT_DIR = "C:\\Users\\Jens Weil\\.gemini\\antigravity\\brain\\f5fb6556-9965-45b8-9afe-bdb698923939";
const OUTPUT_DIR = "c:\\Git\\Enzy\\Reports";

if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR);

function getPath(fileName) {
    const latestFile = fs.readdirSync(ARTIFACT_DIR)
        .filter(f => f.startsWith(fileName.split('_')[0]) && f.endsWith('.png'))
        .sort((a, b) => b.localeCompare(a))[0]; // Simplistic latest file pick
    
    // Exact match fallback for diagrams
    const exactMatch = fs.readdirSync(ARTIFACT_DIR).find(f => f.startsWith(fileName.split('.')[0]) && f.endsWith('.png'));
    
    const target = exactMatch || latestFile;
    return target ? path.join(ARTIFACT_DIR, target) : null;
}

function addImage(fileName, width = 500) {
    const filePath = getPath(fileName);
    if (!filePath || !fs.existsSync(filePath)) {
        return [new Paragraph({ text: `[MISSING IMAGE: ${fileName}]`, spacing: { before: 200, after: 200 } })];
    }
    const dimensions = { width, height: (width / 16) * 9 }; // Aspect ratio approx
    return [
        new Paragraph({
            children: [new ImageRun({ data: fs.readFileSync(filePath), transformation: dimensions })],
            alignment: AlignmentType.CENTER,
            spacing: { before: 200, after: 200 },
        })
    ];
}

// --- 1. KRAVDOKUMENT ---
const generateKrav = () => {
    const doc = new Document({
        sections: [{
            children: [
                new Paragraph({ text: "Kravspecifikation: Enzymatica Web Portal", heading: HeadingLevel.TITLE, alignment: AlignmentType.CENTER }),
                new Paragraph({ text: "Datum: 2024-04-21 | Version: 2.0 (Utökad)", alignment: AlignmentType.CENTER, spacing: { after: 400 } }),

                new Paragraph({ text: "1. Introduktion", heading: HeadingLevel.HEADING_1 }),
                new Paragraph("Detta dokument fastställer de formella kraven för Enzymatika Web Portal. Syftet är att skapa en centraliserad hub för investerare, partners och anställda som kombinerar extrem prestanda med hög säkerhet."),

                new Paragraph({ text: "2. Personas (Detaljerade)", heading: HeadingLevel.HEADING_1 }),
                new Paragraph({ text: "2.1 Besökare (Oinloggad)", heading: HeadingLevel.HEADING_2 }),
                new Paragraph("Besökaren är ofta en potentiell investerare som kräver en snabb och professionell första anblick. Kravet är ett hinder-fritt gränssnitt som ändå skyddas av Site Lock för att förhindra obehörig crawlning."),
                
                new Paragraph({ text: "2.2 Inloggade Roller", heading: HeadingLevel.HEADING_2 }),
                new Table({
                    rows: [
                        new TableRow({ children: [new TableCell({ children: [new Paragraph("Roll")] }), new TableCell({ children: [new Paragraph("Primärt Ansvar")] })] }),
                        new TableRow({ children: [new TableCell({ children: [new Paragraph("Medlem")] }), new TableCell({ children: [new Paragraph("Konsumtion av djuplodande nyheter och finansiell analys.")] })] }),
                        new TableRow({ children: [new TableCell({ children: [new Paragraph("Partner")] }), new TableCell({ children: [new Paragraph("Strategisk informationshämtning.")] })] }),
                        new TableRow({ children: [new TableCell({ children: [new Paragraph("Redaktör")] }), new TableCell({ children: [new Paragraph("Innehållsproduktion och mediehantering.")] })] }),
                        new TableRow({ children: [new TableCell({ children: [new Paragraph("Admin")] }), new TableCell({ children: [new Paragraph("Global konfiguration, säkerhet och integrationer.")] })] }),
                    ], width: { size: 100, type: WidthType.PERCENTAGE }
                }),

                new Paragraph({ text: "3. Funktionella Krav & Use Cases", heading: HeadingLevel.HEADING_1, spacing: { before: 400 } }),
                new Paragraph({ text: "UC-1.1: Sajtupplåsning", heading: HeadingLevel.HEADING_2 }),
                new Paragraph("Systemet ska dölja allt innehåll bakom en Site Lock-skärm om flaggan 'siteLockActive' är sann. Besökaren måste ange en 4-siffrig kod som valideras mot settings.json."),
                ...addImage("v_sitelock_input"),

                new Paragraph({ text: "UC-2.1: Avancerad Teknisk Analys", heading: HeadingLevel.HEADING_2 }),
                new Paragraph("Medlemmar ska kunna växla mellan linjediagram och OHLC (Candlestick). Systemet ska tillhandahålla rörliga medelvärden (MA30, MA100) beräknade på server-proxied data."),
                ...addImage("m_chart_analysis_pro"),

                new Paragraph({ text: "4. Kvalitetskrav (Icke-funktionella)", heading: HeadingLevel.HEADING_1, spacing: { before: 400 } }),
                new Paragraph({ children: [new TextRun({ text: "• Prestanda: ", bold: true }), new TextRun("Time-to-Interactive ska understiga 1.2 sekunder på 4G-uppkoppling via JSON-caching.")] }),
                new Paragraph({ children: [new TextRun({ text: "• Tillförlitlighet: ", bold: true }), new TextRun("Social Media inlägg ska köas och loggas med ID och status för att garantera spårbarhet.")] }),
            ]
        }]
    });
    return doc;
};

// --- 2. SAD (Software Architecture Document) ---
const generateSAD = () => {
    const doc = new Document({
        sections: [{
            children: [
                new Paragraph({ text: "Software Architecture Document (SAD)", heading: HeadingLevel.TITLE, alignment: AlignmentType.CENTER }),
                new Paragraph({ text: "Enzymatica Portal v2.0", alignment: AlignmentType.CENTER, spacing: { after: 400 } }),

                new Paragraph({ text: "1. Arkitekturell Överblick", heading: HeadingLevel.HEADING_1 }),
                new Paragraph("Systemet är uppbyggt som en distribuerad tjänst med Next.js som central nav. Arkitekturen prioriterar data-lokalitet genom en hybrid-lagringsmodell."),
                ...addImage("diag_system_arch"),

                new Paragraph({ text: "2. Hybrid Datastrategi", heading: HeadingLevel.HEADING_1, spacing: { before: 400 } }),
                new Paragraph("För att uppnå extrem läshastighet lagras artiklar och grundinställningar i lokala JSON-filer. Detta gör att vi kan använda filsystemets I/O-prestanda istället för traditionella SQL-anrop för statiskt innehåll."),
                ...addImage("diag_hybrid_data"),

                new Paragraph({ text: "3. Säkerhet & RBAC", heading: HeadingLevel.HEADING_1, spacing: { before: 400 } }),
                new Paragraph("Säkerheten hanteras i tre lager: 1. Edge-validering av JWT, 2. Middleware-baserad rollkontroll mot Supabase, och 3. Databas-nivå RLS (Row Level Security)."),
                ...addImage("diag_auth_flow"),

                new Paragraph({ text: "4. Social Media Integration Engine", heading: HeadingLevel.HEADING_1, spacing: { before: 400 } }),
                new Paragraph("Vår SoMe-motor hanterar automatisk token-exchange (User-to-Page token) och stödjer 5 olika plattformar (FB, IG, LI, TT, X)."),
                ...addImage("diag_social_flow"),

                new Paragraph({ text: "5. Finansiell Proxy & Analys", heading: HeadingLevel.HEADING_1, spacing: { before: 400 } }),
                new Paragraph("Eftersom Next.js körs på servern kan vi dölja API-nycklar till finansiella leverantörer genom en proxy-rutt (`/api/stock`), vilket förhindrar CORS-problem och skyddar vår data."),
                ...addImage("diag_stock_flow"),
            ]
        }]
    });
    return doc;
};

// --- 3. ANVÄNDARMANUAL ---
const generateManual = () => {
    const doc = new Document({
        sections: [{
            children: [
                new Paragraph({ text: "Användarmanual & Testguide", heading: HeadingLevel.TITLE, alignment: AlignmentType.CENTER }),
                new Paragraph({ text: "Enzymatica Portal v2.0", alignment: AlignmentType.CENTER, spacing: { after: 400 } }),

                new Paragraph({ text: "1. Komma igång", heading: HeadingLevel.HEADING_1 }),
                new Paragraph("Denna manual är avsedd för samtliga roller. Se inloggningsuppgifter nedan för testning."),
                
                new Paragraph({ text: "2. Administratörens Vy", heading: HeadingLevel.HEADING_1, spacing: { before: 400 } }),
                new Paragraph("Administratören styr sajtens själ. Här kan du ändra logotyp, färger och säkerhetsnivå."),
                ...addImage("a_settings_branding"),
                ...addImage("a_settings_security"),

                new Paragraph({ text: "3. Redaktörens Vy", heading: HeadingLevel.HEADING_1, spacing: { before: 400 } }),
                new Paragraph("Skapa rörliga artiklar med bilder och formaters text via den inbyggda editorn."),
                ...addImage("r_editor_tiptap"),
                ...addImage("r_media_picker_search"),

                new Paragraph({ text: "4. Medlemmens Vy", heading: HeadingLevel.HEADING_1, spacing: { before: 400 } }),
                ...addImage("m_chart_analysis_pro"),
                ...addImage("m_share_instructions_fb"),
            ]
        }]
    });
    return doc;
};

async function run() {
    const krav = generateKrav();
    const sad = generateSAD();
    const manual = generateManual();

    fs.writeFileSync(path.join(OUTPUT_DIR, "ENZY_Kravdokument.docx"), await Packer.toBuffer(krav));
    fs.writeFileSync(path.join(OUTPUT_DIR, "ENZY_SAD.docx"), await Packer.toBuffer(sad));
    fs.writeFileSync(path.join(OUTPUT_DIR, "ENZY_UserManual.docx"), await Packer.toBuffer(manual));

    console.log("Klart! Samtliga rapporter har genererats i 'Reports/' katalogen.");
}

run().catch(console.error);
