# Kravdokument: Enzymatica Web Portal

Detta dokument beskriver de funktionella och icke-funktionella kraven för Enzymatika Web Portal. Dokumentet fungerar som grund för utveckling, testning och verifiering av plattformens funktionalitet.

## 1. Målgrupp & Personas

### 1.1 Besökare (Anonym)
*   **Profil:** Potentiell investerare eller nyfiken användare som ännu inte har ett medlemskap.
*   **Digitala behov:** Snabb överblick av företaget, access till publika nyheter, och en enkel väg till medlemskap.

### 1.2 Medlem (Företag/Anställd)
*   **Profil:** Verifierad användare med intresse för djupare analys och nyhetsbevakning.
*   **Digitala behov:** Tillgång till avancerade finansiella verktyg och möjligheten att sprida information i sitt nätverk.

### 1.3 Investerare & Partner
*   **Profil:** Strategiska partners eller större aktieägare.
*   **Digitala behov:** Prioriterad tillgång till finansiell metadata och marknadstrender.

### 1.4 Redaktör
*   **Profil:** Innehållsansvarig hos Enzymatica.
*   **Digitala behov:** Ett kraftfullt och intuitivt verktyg för att publicera, redigera och kategorisera artiklar samt hantera mediebibliotek.

### 1.5 Administratör
*   **Profil:** Systemansvarig.
*   **Digitala behov:** Fullständig kontroll över sajten, från visuell identitet till säkerhetspolicyer och API-integrationer.

---

## 2. Detaljerade Use Cases

### 2.1 Besökare - UC-1.1: Sajtupplåsning
*   **Syfte:** Ge tillfällig access till låst innehåll via en unik kod.
*   **Förutsättningar:** Administratören har aktiverat "Site Lock" i inställningarna.
*   **Flöde:**
    1. Besökaren navigerar till sajten.
    2. Systemet upptäcker att Site Lock är aktivt och visar en spärr-skärm.
    3. Besökaren klickar på logotypen eller en specifik interaktionspunkt för att aktivera inmatning.
    4. Besökaren anger den 4-siffriga koden (t.ex. "0000").
    5. Vid korrekt kod sätts en sessions-cookie och sajten låses upp.
*   **Alternativt flöde:** Vid felaktig kod nekas tillträde och ett diskret felmeddelande visas.

### 2.2 Besökare - UC-1.2: Medlemsansökan
*   **Syfte:** Möjliggöra för nya användare att registrera sitt intresse.
*   **Flöde:**
    1. Besökaren klickar på "Bli Medlem" i inloggningsvyn.
    2. Besökaren fyller i namn, e-post och önskat lösenord.
    3. Ansökan sparas i systemet med status "Pending".
    4. Administratören aviseras (via mail om Brevo är aktivt).

### 2.3 Medlem - UC-2.1: Avancerad Teknisk Analys
*   **Syfte:** Visualisera aktiekursen med avancerade indikatorer.
*   **Förutsättningar:** Användaren är inloggad som Medlem eller högre.
*   **Flöde:**
    1. Användaren klickar på "ENZY"-tickern i navigationsmenyn.
    2. Aktiediagrammet öppnas i en modal.
    3. Användaren väljer tidsperiod (t.ex. "3 månader").
    4. Användaren aktiverar "OHLC (Staplar)" för att se volatilitet.
    5. Användaren aktiverar indikatorerna "MA30" och "MA100".
    6. Systemet beräknar glidande medelvärden i realtid baserat på historisk data.

### 2.4 Medlem - UC-2.2: Social Delning med Instruktion
*   **Syfte:** Underlätta delning av artiklar till externa nätverk.
*   **Flöde:**
    1. Användaren öppnar en artikel.
    2. Användaren klickar på en delningsikon (t.ex. Facebook).
    3. En instruktions-modal visas för att guida användaren genom plattforms-specifika steg (t.ex. "Klicka på dela, välj flöde").
    4. Användaren bekräftar och navigeras till den externa plattformen.

### 2.5 Redaktör - UC-3.1: Artikelproduktion med Tiptap
*   **Syfte:** Skapa formaterade artiklar med rik media.
*   **Flöde:**
    1. Redaktören klickar på "+ Skapa artikel".
    2. Redaktören anger Rubrik och Ingress.
    3. I brödtext-fältet (Tiptap) används verktygsfältet för att fetstila text eller lägga till listor.
    4. Redaktören klickar på "Bild" för att öppna mediehanteraren.
    5. En bild väljs och infogas direkt i redo-texten.

### 2.6 Administratör - UC-4.1: Dynamisk Branding
*   **Syfte:** Justera sajtens profil utan kodändringar.
*   **Flöde:**
    1. Admin navigerar till "Inställningar" -> "Tema & Utseende".
    2. Admin ändrar primärfärg via färgväljaren (CSS Variabel: `--brand-primary`).
    3. Admin laddar upp en ny logotyp-URL.
    4. Admin klickar på "Spara".
    5. Ändringarna propageras omedelbart till alla användare via en global inställnings-cache.

### 2.7 Administratör - UC-4.2: SoMe-kanalshantering
*   **Syfte:** Styra vilka sociala kanaler som ska vara aktiva.
*   **Viktig detalj:** En kanal kan aktiveras (`isActive: true`) för att visas i UI utan att API-tokens är tillgängliga. Detta möjliggör manuell hantering.
*   **Flöde:**
    1. Admin navigerar till "Sociala Medier".
    2. Admin togglar "Aktiv" för t.ex. LinkedIn.
    3. Admin kan (valfyllt) ange en Access Token för automatisk koppling.
    4. Vid sparning uppdateras `settings.json` och knappar visas/döljs globalt.

---

## 3. Icke-funktionella Krav

### 3.1 Prestanda
*   **Innehållsladdning:** Artiklar och inställningar ska laddas från lokala JSON-filer för att eliminera latens från databasanrop vid läsning.
*   **Bildoptimering:** Användning av Next.js `<Image>`-komponent för automatisk WebP-konvertering och lazy loading.

### 3.2 Säkerhet
*   **RBAC:** Rollbaserad accesskontroll krävs på alla API-rutter som muterar data (POST/PUT/DELETE).
*   **Sessioner:** Inaktivitets-timeout ska varna användaren 30 sekunder innan utloggning sker vid inaktivitet.

### 3.3 Skalbarhet
*   **Hybridlagring:** Systemet ska kunna hantera tusentals användare i Supabase medan innehållet förblir lättviktigt och lätthanterligt i git-vänliga JSON-filer.
