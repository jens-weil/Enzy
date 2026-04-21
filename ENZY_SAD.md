# Software Architecture Document (SAD): Enzymatica Web Portal v2.0

## 1. Systemöversikt
Enzymatika Web Portal är byggd som en modern webbapplikation med Next.js 14+ och utnyttjar App Router för server-side rendering (SSR) och optimal prestanda. Arkitekturen är designad för att vara extremt snabb vid läsning samtidigt som den bibehåller en flexibel och säker struktur för datahantering.

### 1.1 Projektstruktur (App Router)
- `src/app/`: Innehåller alla rutter och sidkomponenter.
- `src/components/`: Återanvändbara UI-komponenter byggda med Tailwind CSS.
- `src/lib/`: Server- och klientutilitys för integrationer (Facebook, Supabase, etc.).
- `data/`: Innehåller persistenta JSON-filer för innehåll och konfiguration.

---

## 2. Datalagringsstrategi: Hybrid Modell

Systemet använder en hybrid datalagringsstrategi för att balansera hastighet med funktionalitet.

### 2.1 JSON-baserad Innehållslagring (`data/articles.json`, `data/settings.json`)
- **Varför?** Vid läsning av artiklar och globala inställningar (branding, SEO) elimineras behovet av databasanrop. Detta sänker svarstiderna till närapå noll och minskar beroendet av extern infrastruktur för sajtens kärna.
- **Implementation:**
  ```typescript
  // Exempel på hur inställningar laddas i src/app/api/settings/route.ts
  const settingsPath = path.join(process.cwd(), 'data', 'settings.json');
  const data = fs.readFileSync(settingsPath, 'utf8');
  return JSON.parse(data);
  ```

### 2.2 SQL-baserad Identitet & Tillstånd (Supabase PostgreSQL)
- **Varför?** Identitetshantering, Rollbaserad Accesskontroll (RBAC) och statistik (t.ex. medlemsantal) kräver relationella databaser med stöd för transaktioner och RLS (Row Level Security).
- **Tabeller:**
  - `profiles`: Hanterar användarroller (`Admin`, `Editor`, `Member`).
  - `shares`: Loggar delningsstatistik för artiklar.

---

## 3. Säkerhetsmodell

Säkerheten är implementerad horisontellt genom hela stacken.

### 3.1 Autentisering & JWT
Varje anrop till administrativa API-rutter valideras via Supabase Auth. JWT-tokens passas i `Authorization`-headern.

### 3.2 RBAC Middleware (`lib/auth.ts`)
Vi använder en centraliserad funktion `requireRole` för att verifiera behörighet på server-sidan:
```typescript
export async function requireRole(req: NextRequest, allowedRoles: string[]) {
  const { data: { user } } = await supabaseAnon.auth.getUser(token);
  const { data: profile } = await supabaseAdmin.from("profiles").eq("id", user.id).single();
  
  if (!allowedRoles.includes(profile.role)) {
    return { authorized: false, error: "Åtkomst nekad" };
  }
  return { authorized: true, role: profile.role };
}
```

### 3.3 Site Lock & Sessionshantering
Systemet inkluderar en inaktivitets-vakt (`InactivityGuard.tsx`) som övervakar mus- och tangentbordsrörelser. Om tiden överskrider gränsen i `settings.json` (t.ex. 60 minuter), loggas användaren ut automatiskt för att förhindra obehörig åtkomst på delade datorer.

---

## 4. Branding Engine

Plattformen är helt tematiserbar via administratörsgränssnittet. Detta uppnås genom dynamisk injicering av CSS-variabler.

### 4.1 Injektionslogik (`ThemeVariableInjector.tsx`)
Inställningar hämtas en gång vid boot (`fetchSettingsOnce`) och injiceras i `<style>`-taggen:
```css
:root {
  --brand-primary: ${colors.primary};
  --brand-secondary: ${colors.secondary};
}
```
Detta gör att hela portalen kan byta utseende (färger, logotyper, bakgrunder) utan en ombyggnation av applikationen.

---

## 5. Externa Integrationer

### 5.1 Facebook Graph API v22.0
- **Token Exchange:** Vi implementerar en automatisk växling mellan korta användar-tokens och permanenta Page Access Tokens för att säkerställa att automatiserade inlägg aldrig avbryts på grund av utgångna tokens.
- **Posting Strategy:** Stöd för både "direct link" och "comment strategy" (där länken läggs i första kommentaren för att optimera räckvidd).

### 5.2 Yahoo Finance API
- Används för att hämta realtidsdata för ENZY.ST. Systemet mappar rådata till OHLC-format för visualisering i Recharts.

### 5.3 Brevo SMTP
- Integrerat för transaktionella mejl (glömt lösenord, nya medlemsansökningar). Inställningar hanteras krypterat via API:et.

---

## 6. Arkitektoniska Beslut (ADRs)

1.  **Val av Recharts:** Valdes framför Chart.js för dess naturliga integration med Reacts komponentmodell och stöd för anpassade SVG-former för Candlestick-diagram.
2.  **Lokal JSON-persistens:** Beslutet togs för att optimera hastighet och sänka kostnader för databasanrop, samt för att sänka tröskeln för innehållsuppdateringar vid driftstörningar.
3.  **Tiptap Editor:** Valdes som Rich Text Engine för dess headless-natur, vilket ger oss 100% kontroll över CSS-rendering av artiklar.
