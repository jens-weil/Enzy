const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } = require("docx");
const fs = require("fs");

const projectName = "Enzymatica Web Portal";
const reportDate = new Date().toLocaleDateString("sv-SE");

const doc = new Document({
    sections: [{
        properties: {},
        children: [
            // Title Section
            new Paragraph({
                text: "Projektrapport: Strategi, Teknik & Användarfall",
                heading: HeadingLevel.TITLE,
                alignment: AlignmentType.CENTER,
            }),
            new Paragraph({
                text: projectName,
                heading: HeadingLevel.HEADING_1,
                alignment: AlignmentType.CENTER,
            }),
            new Paragraph({
                text: `Slutrapport | Skapad: ${reportDate}`,
                alignment: AlignmentType.CENTER,
                spacing: { after: 600 },
            }),

            new Paragraph({
                text: "1. Personas & Användarfall",
                heading: HeadingLevel.HEADING_1,
            }),
            new Paragraph({
                text: "För att förstå plattformens värde beskriver vi här hur olika användarroller (personas) interagerar med systemet.",
                spacing: { after: 200 },
            }),

            // Persona: Besökare
            new Paragraph({ text: "Persona: Besökare (Oinloggad)", heading: HeadingLevel.HEADING_2 }),
            new Paragraph({ text: "Beskrivning: En extern intressent, t.ex. en potentiell investerare eller samarbetspartner som besöker sajten för första gången.", spacing: { after: 100 } }),
            new Paragraph({ children: [new TextRun({ text: "• Användarfall - Sajtupplåsning: ", bold: true }), new TextRun("Besökaren möts av ett säkerhetslager (Site Lock). De anger den tillhandahållna koden och får omedelbar tillgång till portalens publika innehåll.")], bullet: { level: 0 } }),
            new Paragraph({ children: [new TextRun({ text: "• Användarfall - Medlemsansökan: ", bold: true }), new TextRun("Besökaren navigerar till ansökningsformuläret, fyller i sina uppgifter och skickar in. Systemet triggar ett bekräftelsemejl till besökaren och en avisering till administratören.")], bullet: { level: 0 } }),

            // Persona: Medlem / Partner
            new Paragraph({ text: "Persona: Medlem / Partner", heading: HeadingLevel.HEADING_2 }),
            new Paragraph({ text: "Beskrivning: En återkommande användare som är inloggad och har tillgång till exklusivt material och djupare finansiell information.", spacing: { after: 100 } }),
            new Paragraph({ children: [new TextRun({ text: "• Användarfall - Fördjupad Läsning: ", bold: true }), new TextRun("Medlemmen läser exklusiva artiklar i ett optimerat läsläge som fungerar sömlöst på både desktop och mobil.")], bullet: { level: 0 } }),
            new Paragraph({ children: [new TextRun({ text: "• Användarfall - Trendanalys: ", bold: true }), new TextRun("Användaren öppnar aktiediagrammet, växlar till candlestick-vy och aktiverar glidande medelvärden (MA30/MA100) för att analysera kursutvecklingen.")], bullet: { level: 0 } }),
            new Paragraph({ children: [new TextRun({ text: "• Användarfall - Social Ambassadör: ", bold: true }), new TextRun("Medlemmen delar en intressant nyhet direkt till sitt sociala nätverk via mobilens inbyggda delningsmeny (Web Share API).")], bullet: { level: 0 } }),

            // Persona: Redaktör
            new Paragraph({ text: "Persona: Redaktör (Innehållsansvarig)", heading: HeadingLevel.HEADING_2 }),
            new Paragraph({ text: "Beskrivning: Ansvarar för att producera, kategorisera och sprida information via portalen.", spacing: { after: 100 } }),
            new Paragraph({ children: [new TextRun({ text: "• Användarfall - Multikanalspublicering: ", bold: true }), new TextRun("Redaktören skapar en artikel och väljer att den ska publiceras både på hemsidan och automatiskt skickas som ett inlägg till företagets Facebook-sida.")], bullet: { level: 0 } }),
            new Paragraph({ children: [new TextRun({ text: "• Användarfall - Mediehantering: ", bold: true }), new TextRun("Använder den enhetliga medieplockaren för att ladda upp bilder, tagga dem för senare sökbarhet och infoga dem i artiklar.")], bullet: { level: 0 } }),

            // Persona: Administratör
            new Paragraph({ text: "Persona: Administratör", heading: HeadingLevel.HEADING_2 }),
            new Paragraph({ text: "Beskrivning: Systemägaren som hanterar globala inställningar, säkerhet och användarbehörigheter.", spacing: { after: 100 } }),
            new Paragraph({ children: [new TextRun({ text: "• Användarfall - Rebranding: ", bold: true }), new TextRun("Administratören loggar in i kontrollpanelen och uppdaterar företagets logotyp och namn. Ändringen slår igenom omedelbart på hela sajten, inklusive e-postmallar och sociala delningskort.")], bullet: { level: 0 } }),
            new Paragraph({ children: [new TextRun({ text: "• Användarfall - Säkerhetskontroll: ", bold: true }), new TextRun("Administratören aktiverar Site Lock under en period av konfidentialitet eller slår på Onboarding-turen inför en ny produktlansering.")], bullet: { level: 0 } }),

            // 2. Teknisk Specifikation (från föregående steg)
            new Paragraph({ text: "2. Teknisk Specifikation & Implementering", heading: HeadingLevel.HEADING_1, spacing: { before: 400 } }),
            new Paragraph({ children: [new TextRun({ text: "• Finansiell Logik: ", bold: true }), new TextRun("Implementerat SMA-algoritmer för teknisk analys och dynamisk intervallhantering (1d-upplösning vid MA-aktivering) i Recharts.")], bullet: { level: 0 } }),
            new Paragraph({ children: [new TextRun({ text: "• Social Automation: ", bold: true }), new TextRun("Använder Facebook Graph API v22.0 med automatiserat token-utbyte och stöd för 'Direct' eller 'Comment'-länkstrategier.")], bullet: { level: 0 } }),
            new Paragraph({ children: [new TextRun({ text: "• Säkerhet: ", bold: true }), new TextRun("Rollbaserad åtkomstkontroll (RBAC) via Supabase Auth och server-side verifiering (requireRole).")], bullet: { level: 0 } }),
            new Paragraph({ children: [new TextRun({ text: "• UX-Optimering: ", bold: true }), new TextRun("Globalt scroll-lock mönster, sticky high-blur headers och responsiv grid-transformation (2-kolumners mobilvy).")], bullet: { level: 0 } }),
            new Paragraph({ children: [new TextRun({ text: "• Arkitektur: ", bold: true }), new TextRun("Inställnings-hantering via Singleton-cache för att minimera API-overhead och säkerställa snabb hydrering.")], bullet: { level: 0 } }),

            new Paragraph({
                text: "\n--- Slut på komplett projektrapport ---",
                alignment: AlignmentType.CENTER,
                spacing: { before: 800 },
            }),
        ],
    }],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("Enzymatica_Komplett_Slutrapport.docx", buffer);
    console.log("Den kompletta rapporten har genererats: Enzymatica_Komplett_Slutrapport.docx");
}).catch(err => {
    console.error("Fel vid generering:", err);
    process.exit(1);
});
