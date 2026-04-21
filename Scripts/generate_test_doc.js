const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, ImageRun } = require("docx");
const fs = require("fs");
const path = require("path");

const docName = "Enzymatica_Testunderlag.docx";

const createDoc = () => {
    const doc = new Document({
        sections: [{
            properties: {},
            children: [
                new Paragraph({
                    text: "Enzymatica Web Portal",
                    heading: HeadingLevel.TITLE,
                    alignment: AlignmentType.CENTER,
                }),
                new Paragraph({
                    text: "Komplett Testunderlag & Processbeskrivning",
                    heading: HeadingLevel.HEADING_1,
                    alignment: AlignmentType.CENTER,
                }),
                new Paragraph({
                    text: `Datum: ${new Date().toLocaleDateString("sv-SE")}`,
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 600 },
                }),

                // 1. Besökare
                new Paragraph({ text: "1. Roll: Besökare (Oinloggad)", heading: HeadingLevel.HEADING_1 }),
                new Paragraph({ text: "Besökaren har begränsad tillgång och navigrar primärt genom säkerhetslagret för att få access eller ansöka om medlemskap.", spacing: { before: 200, after: 200 } }),
                
                new Paragraph({ text: "Testfall 1.1: Sajtupplåsning", heading: HeadingLevel.HEADING_2 }),
                new Paragraph({ text: "Syfte: Verifiera att obehöriga möts av Site Lock och kan låsa upp portalen." }),
                new Paragraph({ text: "Steg 1: Navigera till startsidan oinloggad." }),
                new Paragraph({ text: "Steg 2: Verifiera att Site Lock-skärmen visas." }),
                ...addImage("visitor_sitelock_1776764242133.png"),

                new Paragraph({ text: "Testfall 1.2: Medlemsansökan", heading: HeadingLevel.HEADING_2 }),
                new Paragraph({ text: "Syfte: Verifiera processen för att ansöka om medlemskap." }),
                new Paragraph({ text: "Steg 1: Klicka på 'Bli Medlem' eller 'Ansök om medlemskap' i inloggningsvyn." }),
                new Paragraph({ text: "Steg 2: Fyll i formuläret och klicka på skicka." }),
                ...addImage("visitor_membership_1776764278006.png"),

                // 2. Medlem
                new Paragraph({ text: "2. Roll: Medlem / Partner", heading: HeadingLevel.HEADING_1, spacing: { before: 400 } }),
                new Paragraph({ text: "Medlemmar har tillgång till exklusiva nyheter, finansiella verktyg och interaktiva diagram.", spacing: { before: 200, after: 200 } }),

                new Paragraph({ text: "Testfall 2.1: Avancerad Aktieanalys", heading: HeadingLevel.HEADING_2 }),
                new Paragraph({ text: "Syfte: Verifiera att finansiella verktyg fungerar korrekt med tekniska indikatorer." }),
                new Paragraph({ text: "Steg 1: Navigera till Investerarsidan och klicka på aktietickern." }),
                new Paragraph({ text: "Steg 2: Välj 'Visa' -> 'OHLC (Staplar)' och aktivera 'MA30'." }),
                ...addImage("member_chart_analysis_1776764744358.png"),

                new Paragraph({ text: "Testfall 2.2: Social Delning med Instruktioner", heading: HeadingLevel.HEADING_2 }),
                new Paragraph({ text: "Syfte: Verifiera att användare får vägledning vid delning till sociala medier." }),
                new Paragraph({ text: "Steg 1: Öppna en artikel och klicka på delningsikonen." }),
                new Paragraph({ text: "Steg 2: Verifiera att instruktions-modalen visas med plattformsspecifika steg." }),
                ...addImage("member_share_instructions_1776764808551.png"),

                // 3. Redaktör
                new Paragraph({ text: "3. Roll: Redaktör", heading: HeadingLevel.HEADING_1, spacing: { before: 400 } }),
                new Paragraph({ text: "Redaktörer ansvarar för innehållskapande, bildhantering och social distribution.", spacing: { before: 200, after: 200 } }),

                new Paragraph({ text: "Testfall 3.1: Artikelproduktion", heading: HeadingLevel.HEADING_2 }),
                new Paragraph({ text: "Syfte: Verifiera att redaktörer kan skapa och formaters innehåll korrekt." }),
                new Paragraph({ text: "Steg 1: Klicka på '+ Skapa artikel' i adminpanelen." }),
                new Paragraph({ text: "Steg 2: Fyll i rubrik, ingress och brödtext via Tiptap-redigeraren." }),
                ...addImage("editor_create_article_1776764618300.png"),

                new Paragraph({ text: "Testfall 3.2: Mediehantering & Taggsökning", heading: HeadingLevel.HEADING_2 }),
                new Paragraph({ text: "Syfte: Verifiera att mediebiblioteket är sökbart och lätthanterligt." }),
                new Paragraph({ text: "Steg 1: Öppna Media Picker vid bildval." }),
                new Paragraph({ text: "Steg 2: Använd sökfältet för att filtrera på taggar (t.ex. 'Cold')." }),
                ...addImage("editor_media_picker_1776764653746.png"),

                // 4. Administratör
                new Paragraph({ text: "4. Roll: Administratör", heading: HeadingLevel.HEADING_1, spacing: { before: 400 } }),
                new Paragraph({ text: "Administratören har full kontroll över systeminställningar, säkerhetspolicyer och global branding.", spacing: { before: 200, after: 200 } }),

                new Paragraph({ text: "Testfall 4.1: Varumärke & Grafik", heading: HeadingLevel.HEADING_2 }),
                new Paragraph({ text: "Syfte: Verifiera att logotyp och färgschema uppdateras globalt." }),
                ...addImage("admin_settings_branding_1776764398095.png"),

                new Paragraph({ text: "Testfall 4.2: Säkerhetspolicy", heading: HeadingLevel.HEADING_2 }),
                new Paragraph({ text: "Syfte: Verifiera konfiguration av Site Lock och sessionstider." }),
                ...addImage("admin_settings_security_1776764462036.png"),

                new Paragraph({ text: "Testfall 4.3: SoMe-kanalaktivering", heading: HeadingLevel.HEADING_2 }),
                new Paragraph({ text: "Syfte: Verifiera att kanaler kan aktiveras oberoende av API-data." }),
                new Paragraph({ text: "Notera: Verifiera att 'Aktiv'-switchen gör kanalen synlig i Dela-menyer även utan tokens." }),
                ...addImage("admin_settings_social_all_1776764515956.png"),

                new Paragraph({ text: "Testfall 4.4: Investerarinställningar", heading: HeadingLevel.HEADING_2 }),
                new Paragraph({ text: "Syfte: Verifiera konfiguration av finansiell metadata (Ticker, Bransch)." }),
                ...addImage("admin_settings_stock_1776764543548.png"),

                new Paragraph({ text: "Testfall 4.5: E-postintegration (Brevo)", heading: HeadingLevel.HEADING_2 }),
                new Paragraph({ text: "Syfte: Verifiera API-anslutning för e-postkommunikation." }),
                ...addImage("admin_settings_brevo_real_1776764557275.png"),

                new Paragraph({
                    text: "\n--- Slut på Testunderlag ---",
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
                    transformation: { width: 550, height: 300 },
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
