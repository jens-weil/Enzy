# Användarmanual & Testfall: Enzymatica Web Portal

Välkommen till den officiella användarmanualen för Enzymatica Web Portal. Detta dokument är utformat för att guida användare och testare genom de vanligaste och viktigaste processerna i systemet.

## 1. Inloggningsuppgifter för Test

För att genomföra testfall och verifiera flöden, använd följande konton (Alla har lösenordet: `Test12`):

| Roll | E-post | Syfte |
| :--- | :--- | :--- |
| **Administratör** | `jens@jenka.se` | Inställningar och global kontroll. |
| **Redaktör** | `jens.weil@avega.se` | Innehållsproduktion och mediehantering. |
| **Medlem** | `order@jenka.se` | Nyhetsbevakning och aktieanalys. |
| **Investerare** | `info@jenka.se` | Finansiell data och nätverkande. |
| **Partner** | `mijo@fantastico.life` | Strategisk access. |

---

## 2. Roll: Besökare (Oinloggad)

### Flow 2.1: Upplåsning av sajten (Site Lock)
Om sajten är låst möts du av en vakt-skärm.
1. Klicka på 'N'-ikonen längst ner till vänster för att aktivera pinkods-rutan.
2. Ange den 4-siffriga koden (Standard: `0000`).
3. Portalen öppnas och du kan nu se nyhetsflödet.

![Site Lock Inmatning](C:/Users/Jens%20Weil/.gemini/antigravity/brain/f5fb6556-9965-45b8-9afe-bdb698923939/v_sitelock_input_1776769637691.png)

### Flow 2.2: Medlemsansökan
1. Klicka på "Logga in" i övre högra hörnet.
2. Välj "Ansök om medlemskap".
3. Fyll i ditt namn, e-post och välj ett säkert lösenord.
4. Skicka in ansökan.

![Medlemsansökan](C:/Users/Jens%20Weil/.gemini/antigravity/brain/f5fb6556-9965-45b8-9afe-bdb698923939/v_membership_form_1776768912907.png)

---

## 3. Roll: Medlem / Investerare

### Flow 3.1: Avancerad Aktieanalys
Som inloggad medlem har du tillgång till portalens finansiella analysverktyg.
1. Klicka på "ENZY"-tickern i navigationsraden.
2. Öppna inställningsmenyn (kugghjulet eller rullistan i diagramvyn).
3. Aktivera "OHLC (Staplar)", "MA30" och "MA100".
4. Verifiera att diagrammet ritas om med tekniska indikatorer i realtid.

![Aktieanalys](C:/Users/Jens%20Weil/.gemini/antigravity/brain/f5fb6556-9965-45b8-9afe-bdb698923939/m_chart_analysis_pro_1776769361794.png)

### Flow 3.2: Social Delning med Instruktioner
1. Öppna valfri artikel.
2. Klicka på Facebook-ikonen för att dela.
3. Följ instruktionerna i modalen som hjälper dig att optimera inlägget.

![Delningsinstruktioner](C:/Users/Jens%20Weil/.gemini/antigravity/brain/f5fb6556-9965-45b8-9afe-bdb698923939/m_share_instructions_fb_1776769544776.png)

---

## 4. Roll: Redaktör

### Flow 4.1: Skapa artikel med Tiptap
1. Klicka på den blå knappen "+ Skapa artikel" i det nedre vänstra hörnet.
2. Använd Tiptap-verktygsfältet för att formatera texten (Fetstil, Kursiv, etc.).
3. Skriv in din text och välj en kategori (t.ex. "Finans").

![Tiptap Editor](C:/Users/Jens%20Weil/.gemini/antigravity/brain/f5fb6556-9965-45b8-9afe-bdb698923939/r_editor_tiptap_1776769262053.png)

### Flow 4.2: Mediehantering & Tagg-sökning
1. I artikel-editorn, klicka på "Bild" för att öppna Media Picker.
2. Skriv in ett sökord (t.ex. "Cold") i sökfältet.
3. Systemet filtrerar och visar bilder med matchande taggar.

![Media Picker Sök](C:/Users/Jens%20Weil/.gemini/antigravity/brain/f5fb6556-9965-45b8-9afe-bdb698923939/r_media_picker_search_1776769280328.png)

---

## 5. Roll: Administratör

### Flow 5.1: Branding & Varumärkesanpassning
1. Navigera till inställningar -> "Tema & Utseende".
2. Justera logotypens URL och ändra portalens färgschema via de interaktiva färg-pickarna.
3. Förhandsgranska logotypen direkt i vyn innan du sparar.

![Branding Inställningar](C:/Users/Jens%20Weil/.gemini/antigravity/brain/f5fb6556-9965-45b8-9afe-bdb698923939/a_settings_branding_1776769110147.png)

### Flow 5.2: Säkerhetspolicy
1. Inom inställningar, välj "Säkerhet & Tillgänglighet".
2. Här kan du ställa in tiden för inaktivitetsutloggning (t.ex. 60 min) och byta Sajtlås-koden.

![Säkerhetsinställningar](C:/Users/Jens%20Weil/.gemini/antigravity/brain/f5fb6556-9965-45b8-9afe-bdb698923939/a_settings_security_1776769139011.png)

### Flow 5.3: Sociala Kanaler
1. Gå till fliken "Sociala Medier".
2. Expandera valfri kanal (t.ex. LinkedIn) för att se status och ange API-uppgifter.
3. Verifiera att samtliga 5 stödda kanaler är konfigurerbara.

![Sociala Medier](C:/Users/Jens%20Weil/.gemini/antigravity/brain/f5fb6556-9965-45b8-9afe-bdb698923939/a_settings_social_1776769173118.png)
