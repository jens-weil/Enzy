const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, ImageRun, Table, TableRow, TableCell, WidthType } = require("docx");
const fs = require("fs");
const path = require("path");

const docName = "Enzymatica_SAD.docx";

const createDoc = () => {
    const doc = new Document({
        sections: [{
            properties: {},
            children: [
                new Paragraph({
                    text: "Software Architecture Document (SAD)",
                    heading: HeadingLevel.TITLE,
                    alignment: AlignmentType.CENTER,
                }),
                new Paragraph({
                    text: "Enzymatica Portal v2.0",
                    heading: HeadingLevel.HEADING_1,
                    alignment: AlignmentType.CENTER,
                }),
                new Paragraph({
                    text: `Version: 1.0 | Status: Slutförd | Datum: ${new Date().toLocaleDateString("sv-SE")}`,
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 600 },
                }),

                // 1. Övergripande Systemarkitektur
                new Paragraph({ text: "1. Övergripande Systemarkitektur", heading: HeadingLevel.HEADING_1 }),
                new Paragraph({ text: "Enzymatica Web Portal är byggd på en modern, serverless-ready arkitektur baserad på Next.js. Systemet är designat för hög prestanda, varumärkesflexibilitet och robust integration med sociala medier.", spacing: { before: 200 } }),
                
                new Paragraph({ text: "Teknikstack:", heading: HeadingLevel.HEADING_2 }),
                new Table({
                    rows: [
                        new TableRow({ children: [new TableCell({ children: [new Paragraph("Komponent")] }), new TableCell({ children: [new Paragraph("Teknik")] })] }),
                        new TableRow({ children: [new TableCell({ children: [new Paragraph("Framework")] }), new TableCell({ children: [new Paragraph("Next.js 14+ (App Router)")] })] }),
                        new TableRow({ children: [new TableCell({ children: [new Paragraph("Språk")] }), new TableCell({ children: [new Paragraph("TypeScript")] })] }),
                        new TableRow({ children: [new TableCell({ children: [new Paragraph("Frontend UI")] }), new TableCell({ children: [new Paragraph("React, Tailwind CSS, Framer Motion")] })] }),
                        new TableRow({ children: [new TableCell({ children: [new Paragraph("Säkerhet / Auth")] }), new TableCell({ children: [new Paragraph("Supabase Auth (JWT)")] })] }),
                        new TableRow({ children: [new TableCell({ children: [new Paragraph("Huvuddatabas")] }), new TableCell({ children: [new Paragraph("Supabase (PostgreSQL)")] })] }),
                        new TableRow({ children: [new TableCell({ children: [new Paragraph("Innehållslagring")] }), new TableCell({ children: [new Paragraph("Hybrid: PostgreSQL + Lokal JSON (data/articles.json)")] })] }),
                    ],
                    width: { size: 100, type: WidthType.PERCENTAGE },
                }),

                // 2. Logisk Vy (Logical View)
                new Paragraph({ text: "2. Logisk Vy & Lagerarkitektur", heading: HeadingLevel.HEADING_1, spacing: { before: 400 } }),
                new Paragraph({ text: "Systemet är uppdelat i fyra tydliga lager för att separera ansvarsområden:" }),
                new Paragraph({ children: [new TextRun({ text: "• Presentationslager: ", bold: true }), new TextRun("Server- och Klientkomponenter i Next.js som hanterar UI och branding-injektion.")], bullet: { level: 0 } }),
                new Paragraph({ children: [new TextRun({ text: "• Logiklager (API): ", bold: true }), new TextRun("API Routes som hanterar affärslogik, t.ex. beräkning av aktie-indikatorer och social media-automation.")], bullet: { level: 0 } }),
                new Paragraph({ children: [new TextRun({ text: "• Integrationslager: ", bold: true }), new TextRun("Fristående bibliotek (/lib) för kommunikation med Facebook Graph API, Brevo och Yahoo Finance.")], bullet: { level: 0 } }),
                new Paragraph({ children: [new TextRun({ text: "• Datalager: ", bold: true }), new TextRun("Hanterar hybridlagring mellan SQL och det lokala filsystemet för maximal prestanda vid läsning av statiskt innehåll.")], bullet: { level: 0 } }),

                // 3. Datavy (Data View)
                new Paragraph({ text: "3. Datastrategi & Persistens", heading: HeadingLevel.HEADING_1, spacing: { before: 400 } }),
                new Paragraph({ text: "Valet av hybridlagring är ett strategiskt beslut för att optimera hastighet och underhåll:" }),
                new Paragraph({ children: [new TextRun({ text: "JSON-lagring (data/): ", bold: true }), new TextRun("Används för artiklar och globala inställningar. Detta möjliggör extremt snabb läsning (I/O) och enkel versionshantering av innehåll.")], bullet: { level: 0 } }),
                new Paragraph({ children: [new TextRun({ text: "PostgreSQL (Supabase): ", bold: true }), new TextRun("Används för dynamisk data såsom användarprofiler, delas-statistik och rollbaserad säkerhet.")], bullet: { level: 0 } }),

                // 4. Integrationsvy
                new Paragraph({ text: "4. Externa Integrationer", heading: HeadingLevel.HEADING_1, spacing: { before: 400 } }),
                new Paragraph({ text: "Systemet agerar som en central 'hub' för flera externa tjänster:" }),
                new Paragraph({ children: [new TextRun({ text: "• Facebook Automation: ", bold: true }), new TextRun("Använder Graph API med en auto-exchange strategi för att omvandla korta användar-tokens till permanenta Page Access Tokens.")], bullet: { level: 0 } }),
                new Paragraph({ children: [new TextRun({ text: "• Finansiell Data: ", bold: true }), new TextRun("Systemet aggregerar rådata från Yahoo Finance och applicerar en klient-baserad beräkningsmotor för Moving Averages (MA30/100).")], bullet: { level: 0 } }),
                ...addImage("admin_settings_social_all_1776764515956.png"),

                // 5. Säkerhetsarkitektur
                new Paragraph({ text: "5. Säkerhetsarkitektur", heading: HeadingLevel.HEADING_1, spacing: { before: 400 } }),
                new Paragraph({ text: "Säkerheten är implementerad på tre nivåer:" }),
                new Paragraph({ children: [new TextRun({ text: "1. JWT (JSON Web Tokens): ", bold: true }), new TextRun("Varje anrop till API:et valideras mot en kryptografisk token från Supabase Auth.")], bullet: { level: 0 } }),
                new Paragraph({ children: [new TextRun({ text: "2. RBAC Middleware: ", bold: true }), new TextRun("En centraliserad 'requireRole'-funktion kontrollerar användarens roll (Admin/Editor/Member) i databasen innan åtkomst ges till känsliga API-rutter.")], bullet: { level: 0 } }),
                new Paragraph({ children: [new TextRun({ text: "3. Site Lock & Cookies: ", bold: true }), new TextRun("Ett oberoende säkerhetslager för externa besökare som använder konfigurerbara koder och persistenta cookies med admin-vaktad livslängd.")], bullet: { level: 0 } }),
                ...addImage("admin_settings_security_1776764462036.png"),

                new Paragraph({
                    text: "\n--- Slut på Software Architecture Document ---",
                    alignment: AlignmentType.CENTER,
                    spacing: { before: 800 },
                }),
            ],
        }],
    });

    return doc;
};

function addImage(fileName) {
    const filePath = path.join("C:\\Users\\Jens Weil\\.gemini\\antigravity\\brain\\f5fb6556-9965-45b8-9afe-bdb698923939", fileName);
    if (!fs.existsSync(filePath)) {
        console.warn(`Varning: Hittade inte bilden ${fileName} på sökväg ${filePath}`);
        return [];
    }
    return [
        new Paragraph({
            children: [
                new ImageRun({
                    data: fs.readFileSync(filePath),
                    transformation: { width: 500, height: 280 },
                }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { before: 200, after: 200 },
        }),
    ];
}

const doc = createDoc();
Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync(docName, buffer);
    console.log(`Dokumentet har genererats: ${docName}`);
});
