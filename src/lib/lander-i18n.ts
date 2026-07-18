export type LanderLocale = "sv" | "fr" | "en" | "de" | "nl" | "no" | "fi" | "pl" | "it";

export type LanderDict = {
  htmlLang: string;
  meta: { title: string; description: string };
  hero: { titleA: string; titleHighlight: string; subtitle: string; cta: string; badges: string[] };
  popular: { eyebrow: string; titleA: string; titleHighlight: string; perHour: string; upTo: string; cta: string };
  features: { title: string; body: string }[];
  testimonialsBlock: {
    eyebrow: string;
    titleA: string;
    titleHighlight: string;
    titleB: string;
    items: { name: string; city: string; amount: string; time: string; text: string }[];
  };
  faq: { eyebrow: string; title: string; items: { q: string; a: string }[] };
  footer: { support: string; devices: string; noCard: string; reviews: string; payments: string; legal: string; ssl: string; terms: string };
  sticky: { title: string; sub: string; badge: string };
  gate: { headlineA: string; headlineHighlight: string; headlineB: string; swipe: string };
};

const sv: LanderDict = {
  htmlLang: "sv",
  meta: {
    title: "Tjäna pengar på att spela spel — upp till 1000 kr/vecka",
    description: "Spela de bästa spelen och förvandla varje sekund till riktiga pengar. Direkt utbetalning via PayPal, krypto eller banköverföring.",
  },
  hero: {
    titleA: "Tjäna pengar på att ",
    titleHighlight: "spela spel",
    subtitle: "Spela dina favoritspel och tjäna pengar",
    cta: "Ladda ner nu",
    badges: ["Gratis", "Direkt utbetalning", "Obegränsat med erbjudanden"],
  },
  popular: {
    eyebrow: "Populära erbjudanden",
    titleA: "Spela & slutför ",
    titleHighlight: "erbjudanden",
    perHour: "Per spelad timme",
    upTo: "Upp till",
    cta: "Spela & tjäna",
  },
  features: [
    { title: "Registrera dig", body: "Skapa ditt konto helt gratis" },
    { title: "Hitta ett erbjudande", body: "Erbjudanden för alla smaker" },
    { title: "Slutför", body: "100% slutförande garanterar alltid en bonus" },
    { title: "Ta ut pengar", body: "Vi stödjer alla betalningsmetoder" },
  ],
  testimonialsBlock: {
    eyebrow: "Din åsikt är viktig för oss",
    titleA: "Över ",
    titleHighlight: "1,4 miljoner människor",
    titleB: " tjänar redan pengar",
    items: [
      { name: "Lucas M.", city: "Stockholm", amount: "+1 000 kr", time: "2 timmar sedan", text: "Nådde målet på 4 dagar och PayPal-överföringen kom in direkt!" },
      { name: "Sarah K.", city: "Göteborg", amount: "+820 kr", time: "5 timmar sedan", text: "Skeptisk i början, men nu är jag helt övertygad. Pengarna kom direkt in på kontot." },
      { name: "Thomas R.", city: "Malmö", amount: "+1 150 kr", time: "1 dag sedan", text: "Superenkelt. Fick utbetalningen inom 24 timmar. Nu spelar jag varje dag." },
    ],
  },
  faq: {
    eyebrow: "FAQ",
    title: "Allt du behöver veta",
    items: [
      { q: "Är det verkligen gratis?", a: "Ja, helt och hållet. Du betalar ingenting och behöver inget kreditkort. Du laddar bara ner appen, spelar och får betalt." },
      { q: "När får jag mina pengar?", a: "Utbetalningar behandlas inom 24 timmar. PayPal-betalningar kommer vanligtvis fram inom några minuter." },
      { q: "Vilka spel måste jag spela?", a: "Du väljer från vår lista. Varje spel visar exakt hur mycket du kan tjäna och vad som krävs." },
      { q: "Är det lagligt?", a: "Ja. Du deltar i betalda reklamkampanjer från spelutvecklarna. Apparna betalar för att få nya spelare — och vi skickar pengarna direkt vidare till dig." },
    ],
  },
  footer: {
    support: "24/7 Live-support",
    devices: "iOS & Android",
    noCard: "· Inget kreditkort krävs",
    reviews: "· Över 251k+ recensioner",
    payments: "PayPal · Krypto · Banköverföring · Presentkort",
    legal: "© Alla rättigheter förbehållna",
    ssl: "SSL-kryptering",
    terms: "Användarvillkor & Integritetspolicy",
  },
  sticky: { title: "Ladda ner appen nu", sub: "Gratis · Direkt utbetalning", badge: "GRATIS" },
  gate: { headlineA: "Kul att se dig ", headlineHighlight: "igen", headlineB: "!", swipe: "Svep uppåt för att fortsätta" },
};

const fr: LanderDict = {
  htmlLang: "fr",
  meta: {
    title: "Gagnez de l'argent en jouant à des jeux — jusqu'à 95 € / semaine",
    description: "Jouez aux meilleurs jeux et transformez chaque seconde en argent réel. Retrait instantané via PayPal, crypto ou virement bancaire.",
  },
  hero: {
    titleA: "Gagnez de l'argent en jouant à des ",
    titleHighlight: "jeux",
    subtitle: "Jouez à vos jeux préférés pour gagner de l'argent",
    cta: "Télécharger maintenant",
    badges: ["Gratuit", "Retrait instantané", "Offres illimitées"],
  },
  popular: {
    eyebrow: "Offres populaires",
    titleA: "Jouez & complétez des ",
    titleHighlight: "offres",
    perHour: "Par heure jouée",
    upTo: "Jusqu'à",
    cta: "Jouer & gagner",
  },
  features: [
    { title: "S'inscrire", body: "Créez votre compte gratuitement" },
    { title: "Trouver une offre", body: "Des offres disponibles pour tous les goûts" },
    { title: "Compléter", body: "100 % de réussite garantit toujours un bonus" },
    { title: "Retirer", body: "Nous prenons en charge tous les modes de paiement" },
  ],
  testimonialsBlock: {
    eyebrow: "Votre avis nous importe",
    titleA: "Plus de ",
    titleHighlight: "1,4 million de personnes",
    titleB: " gagnent déjà",
    items: [
      { name: "Lucas M.", city: "Paris", amount: "+95 €", time: "Il y a 2 heures", text: "J'ai atteint l'objectif en 4 jours et le virement PayPal est arrivé instantanément !" },
      { name: "Sarah K.", city: "Lyon", amount: "+75 €", time: "Il y a 5 heures", text: "Sceptique au début, mais maintenant je suis totalement convaincue. Direct sur mon compte." },
      { name: "Thomas R.", city: "Marseille", amount: "+110 €", time: "Il y a 1 jour", text: "Super facile. Paiement reçu en moins de 24 heures. J'y joue tous les jours maintenant." },
    ],
  },
  faq: {
    eyebrow: "FAQ",
    title: "Tout ce que vous devez savoir",
    items: [
      { q: "Est-ce vraiment gratuit ?", a: "Oui, totalement. Vous ne payez rien et vous n'avez pas besoin de carte de crédit. Il vous suffit de télécharger l'application, de jouer et de toucher vos gains." },
      { q: "Quand est-ce que je reçois mon argent ?", a: "Les paiements sont traités en moins de 24 heures. Les virements PayPal arrivent généralement en quelques minutes." },
      { q: "À quels jeux dois-je jouer ?", a: "Vous choisissez dans notre liste. Chaque jeu indique exactement combien vous pouvez gagner et quelles sont les conditions requises." },
      { q: "Est-ce légal ?", a: "Oui. Vous participez à des campagnes promotionnelles rémunérées par les éditeurs de jeux. Les applications paient pour attirer de nouveaux joueurs — et nous vous reversons directement cet argent." },
    ],
  },
  footer: {
    support: "Support en direct 24/7",
    devices: "iOS & Android",
    noCard: "· Aucune carte de crédit requise",
    reviews: "· Plus de 251k avis",
    payments: "PayPal · Crypto · Virement bancaire · Cartes-cadeaux",
    legal: "© Tous droits réservés",
    ssl: "Cryptage SSL",
    terms: "Mentions légales & Politique de confidentialité",
  },
  sticky: { title: "Télécharger l'application maintenant", sub: "Gratuit · Retrait instantané", badge: "GRATUIT" },
  gate: { headlineA: "Ravi de te ", headlineHighlight: "revoir", headlineB: " !", swipe: "Balayez vers le haut pour continuer" },
};

const en: LanderDict = {
  htmlLang: "en-GB",
  meta: {
    title: "Earn money by playing games — up to £80/week",
    description: "Play the best games and turn every second into real cash. Instant cash out via PayPal, crypto or bank transfer.",
  },
  hero: {
    titleA: "Earn money by playing ",
    titleHighlight: "games",
    subtitle: "Play your favourite games to earn money",
    cta: "Download now",
    badges: ["Free", "Instant cash out", "Unlimited offers"],
  },
  popular: {
    eyebrow: "Popular offers",
    titleA: "Play & complete ",
    titleHighlight: "offers",
    perHour: "Per hour played",
    upTo: "Up to",
    cta: "Play & earn",
  },
  features: [
    { title: "Register", body: "Create your account completely free" },
    { title: "Find an offer", body: "Offers available for all tastes" },
    { title: "Complete", body: "100% completion always guarantees a bonus" },
    { title: "Cash out", body: "We support all payment methods" },
  ],
  testimonialsBlock: {
    eyebrow: "Your opinion matters to us",
    titleA: "Over ",
    titleHighlight: "1.4 million people",
    titleB: " are already earning",
    items: [
      { name: "Lucas M.", city: "London", amount: "+£80", time: "2 hours ago", text: "Reached the goal in 4 days and the PayPal transfer arrived instantly!" },
      { name: "Sarah K.", city: "Manchester", amount: "+£65", time: "5 hours ago", text: "Skeptical at first, but now I'm completely convinced. Straight into my account." },
      { name: "Thomas R.", city: "Birmingham", amount: "+£95", time: "1 day ago", text: "Super easy. Received the payout within 24 hours. Now I play every day." },
    ],
  },
  faq: {
    eyebrow: "FAQ",
    title: "Everything you need to know",
    items: [
      { q: "Is it really free?", a: "Yes, absolutely. You pay nothing and don't need a credit card. You just download the app, play, and get paid." },
      { q: "When do I get my money?", a: "Payouts are processed within 24 hours. PayPal payments usually arrive within a few minutes." },
      { q: "Which games do I have to play?", a: "You choose from our list. Each game shows you exactly how much you can earn and what is required." },
      { q: "Is it legal?", a: "Yes. You are participating in paid promotional campaigns from game developers. The apps pay to get new players — and we pass that money directly on to you." },
    ],
  },
  footer: {
    support: "24/7 Live support",
    devices: "iOS & Android",
    noCard: "· No credit card required",
    reviews: "· Over 251k+ reviews",
    payments: "PayPal · Crypto · Bank transfer · Gift cards",
    legal: "© All rights reserved",
    ssl: "SSL Encryption",
    terms: "Terms & Conditions & Privacy Policy",
  },
  sticky: { title: "Download the app now", sub: "Free · Instant cash out", badge: "FREE" },
  gate: { headlineA: "Ready to take your ", headlineHighlight: "gaming", headlineB: " to the next level?", swipe: "Swipe up to continue" },
};

const de: LanderDict = {
  "htmlLang": "de-DE",
  "meta": {
    "title": "Mit Spielen Geld verdienen — bis zu 80 €/Woche",
    "description": "Spiele die besten Games und mach aus jeder Minute echtes Geld. Sofortige Auszahlung per PayPal, Krypto oder Überweisung."
  },
  "hero": {
    "titleA": "Verdiene Geld mit ",
    "titleHighlight": "Games",
    "subtitle": "Spiele deine Lieblingsspiele und verdiene dabei echtes Geld",
    "cta": "Jetzt herunterladen",
    "badges": [
      "Kostenlos",
      "Sofort-Auszahlung",
      "Unbegrenzte Angebote"
    ]
  },
  "popular": {
    "eyebrow": "Beliebte Angebote",
    "titleA": "Spielen & Angebote ",
    "titleHighlight": "abschließen",
    "perHour": "Pro gespielter Stunde",
    "upTo": "Bis zu",
    "cta": "Spielen & verdienen"
  },
  "features": [
    {
      "title": "Registrieren",
      "body": "Erstelle dein Konto völlig kostenlos"
    },
    {
      "title": "Angebot finden",
      "body": "Angebote für jeden Geschmack"
    },
    {
      "title": "Abschließen",
      "body": "Jeder Abschluss bringt dir garantiert einen Bonus"
    },
    {
      "title": "Auszahlen",
      "body": "Wir unterstützen alle gängigen Zahlungsmethoden"
    }
  ],
  "testimonialsBlock": {
    "eyebrow": "Deine Meinung ist uns wichtig",
    "titleA": "Über ",
    "titleHighlight": "1,4 Millionen Menschen",
    "titleB": " verdienen bereits",
    "items": [
      {
        "name": "Lukas M.",
        "city": "München",
        "amount": "+75 €",
        "time": "vor 2 Stunden",
        "text": "Habe mein Ziel in 4 Tagen erreicht und die Auszahlung per PayPal kam sofort an!"
      },
      {
        "name": "Sarah K.",
        "city": "Berlin",
        "amount": "+65 €",
        "time": "vor 5 Stunden",
        "text": "Anfangs war ich skeptisch, aber jetzt bin ich völlig überzeugt. Kam direkt aufs Konto."
      },
      {
        "name": "Thomas R.",
        "city": "Hamburg",
        "amount": "+95 €",
        "time": "vor 1 Tag",
        "text": "Super einfach. Die Auszahlung kam innerhalb von 24 Stunden. Jetzt spiele ich jeden Tag."
      }
    ]
  },
  "faq": {
    "eyebrow": "FAQ",
    "title": "Alles, was du wissen musst",
    "items": [
      {
        "q": "Ist es wirklich kostenlos?",
        "a": "Ja, absolut. Du zahlst nichts und brauchst keine Kreditkarte. Du lädst einfach die App herunter, spielst und wirst bezahlt."
      },
      {
        "q": "Wann bekomme ich mein Geld?",
        "a": "Auszahlungen werden innerhalb von 24 Stunden bearbeitet. PayPal-Zahlungen sind meist schon nach wenigen Minuten da."
      },
      {
        "q": "Welche Spiele muss ich spielen?",
        "a": "Du wählst aus unserer Liste. Jedes Spiel zeigt dir genau, wie viel du verdienen kannst und was dafür nötig ist."
      },
      {
        "q": "Ist das legal?",
        "a": "Ja. Du nimmst an bezahlten Werbekampagnen von Spieleentwicklern teil. Die Apps zahlen dafür, neue Spieler zu gewinnen — und wir geben dieses Geld direkt an dich weiter."
      }
    ]
  },
  "footer": {
    "support": "24/7 Live-Support",
    "devices": "iOS & Android",
    "noCard": "· Keine Kreditkarte erforderlich",
    "reviews": "· Über 251.000 Bewertungen",
    "payments": "PayPal · Krypto · Überweisung · Gutscheine",
    "legal": "© Alle Rechte vorbehalten",
    "ssl": "SSL-Verschlüsselung",
    "terms": "AGB & Datenschutzerklärung"
  },
  "sticky": {
    "title": "Lade die App jetzt herunter",
    "sub": "Kostenlos · Sofort-Auszahlung",
    "badge": "GRATIS"
  },
  "gate": {
    "headlineA": "Bereit, dein ",
    "headlineHighlight": "Gaming",
    "headlineB": " aufs nächste Level zu bringen?",
    "swipe": "Nach oben wischen, um fortzufahren"
  }
};

const nl: LanderDict = {
  "htmlLang": "nl-NL",
  "meta": {
    "title": "Geld verdienen met games spelen — tot € 70/week",
    "description": "Speel de beste games en verander elke seconde in echt geld. Direct uitbetaald via PayPal, crypto of bankoverschrijving."
  },
  "hero": {
    "titleA": "Verdien geld met ",
    "titleHighlight": "games spelen",
    "subtitle": "Speel je favoriete games en verdien er geld mee",
    "cta": "Nu downloaden",
    "badges": [
      "Gratis",
      "Direct uitbetaald",
      "Onbeperkt aanbod"
    ]
  },
  "popular": {
    "eyebrow": "Populaire aanbiedingen",
    "titleA": "Speel & voltooi ",
    "titleHighlight": "aanbiedingen",
    "perHour": "Per gespeeld uur",
    "upTo": "Tot",
    "cta": "Speel & verdien"
  },
  "features": [
    {
      "title": "Registreren",
      "body": "Maak volledig gratis je account aan"
    },
    {
      "title": "Kies een aanbieding",
      "body": "Aanbiedingen voor elke smaak"
    },
    {
      "title": "Voltooien",
      "body": "100% voltooien levert altijd een bonus op"
    },
    {
      "title": "Uitbetalen",
      "body": "We ondersteunen alle betaalmethodes"
    }
  ],
  "testimonialsBlock": {
    "eyebrow": "Jouw mening telt voor ons",
    "titleA": "Meer dan ",
    "titleHighlight": "1,4 miljoen mensen",
    "titleB": " verdienen al mee",
    "items": [
      {
        "name": "Lucas M.",
        "city": "Amsterdam",
        "amount": "+€ 70",
        "time": "2 uur geleden",
        "text": "Doel binnen 4 dagen gehaald en de PayPal-overboeking kwam meteen binnen!"
      },
      {
        "name": "Sanne K.",
        "city": "Rotterdam",
        "amount": "+€ 55",
        "time": "5 uur geleden",
        "text": "Eerst sceptisch, maar nu helemaal overtuigd. Rechtstreeks op mijn rekening."
      },
      {
        "name": "Thomas R.",
        "city": "Utrecht",
        "amount": "+€ 90",
        "time": "1 dag geleden",
        "text": "Supermakkelijk. Binnen 24 uur uitbetaald. Nu speel ik elke dag."
      }
    ]
  },
  "faq": {
    "eyebrow": "FAQ",
    "title": "Alles wat je moet weten",
    "items": [
      {
        "q": "Is het echt gratis?",
        "a": "Ja, absoluut. Je betaalt niets en hebt geen creditcard nodig. Je downloadt gewoon de app, speelt en wordt betaald."
      },
      {
        "q": "Wanneer krijg ik mijn geld?",
        "a": "Uitbetalingen worden binnen 24 uur verwerkt. PayPal-betalingen komen meestal binnen enkele minuten binnen."
      },
      {
        "q": "Welke games moet ik spelen?",
        "a": "Je kiest zelf uit onze lijst. Bij elke game zie je precies hoeveel je kunt verdienen en wat ervoor nodig is."
      },
      {
        "q": "Is het legaal?",
        "a": "Ja. Je neemt deel aan betaalde promotiecampagnes van gameontwikkelaars. De apps betalen om nieuwe spelers te werven — en dat geld geven we rechtstreeks aan jou door."
      }
    ]
  },
  "footer": {
    "support": "24/7 live support",
    "devices": "iOS & Android",
    "noCard": "· Geen creditcard nodig",
    "reviews": "· 251.000+ reviews",
    "payments": "PayPal · Crypto · Bankoverschrijving · Cadeaukaarten",
    "legal": "© Alle rechten voorbehouden",
    "ssl": "SSL-encryptie",
    "terms": "Algemene voorwaarden & Privacybeleid"
  },
  "sticky": {
    "title": "Download nu de app",
    "sub": "Gratis · Direct uitbetaald",
    "badge": "GRATIS"
  },
  "gate": {
    "headlineA": "Klaar om je ",
    "headlineHighlight": "gaming",
    "headlineB": " naar een hoger niveau te tillen?",
    "swipe": "Swipe omhoog om verder te gaan"
  }
};

const no: LanderDict = {
  "htmlLang": "nb-NO",
  "meta": {
    "title": "Tjen penger på å spille — opptil 900 kr/uke",
    "description": "Spill de beste spillene og gjør hvert sekund om til ekte penger. Rask utbetaling via PayPal, krypto eller bankoverføring."
  },
  "hero": {
    "titleA": "Tjen penger på å ",
    "titleHighlight": "spille",
    "subtitle": "Spill favorittspillene dine og tjen penger",
    "cta": "Last ned nå",
    "badges": [
      "Gratis",
      "Rask utbetaling",
      "Ubegrensede tilbud"
    ]
  },
  "popular": {
    "eyebrow": "Populære tilbud",
    "titleA": "Spill og fullfør ",
    "titleHighlight": "tilbud",
    "perHour": "Per spilt time",
    "upTo": "Opptil",
    "cta": "Spill og tjen"
  },
  "features": [
    {
      "title": "Registrer deg",
      "body": "Opprett kontoen din helt gratis"
    },
    {
      "title": "Finn et tilbud",
      "body": "Tilbud for enhver smak"
    },
    {
      "title": "Fullfør",
      "body": "Fullfør 100 % og få bonus hver gang"
    },
    {
      "title": "Utbetaling",
      "body": "Vi støtter alle betalingsmetoder"
    }
  ],
  "testimonialsBlock": {
    "eyebrow": "Din mening betyr mye for oss",
    "titleA": "Over ",
    "titleHighlight": "1,4 millioner mennesker",
    "titleB": " tjener allerede penger",
    "items": [
      {
        "name": "Mathias H.",
        "city": "Oslo",
        "amount": "+850 kr",
        "time": "for 2 timer siden",
        "text": "Nådde målet på 4 dager, og PayPal-overføringen kom med en gang!"
      },
      {
        "name": "Ingrid K.",
        "city": "Bergen",
        "amount": "+720 kr",
        "time": "for 5 timer siden",
        "text": "Var skeptisk til å begynne med, men nå er jeg helt overbevist. Rett inn på kontoen."
      },
      {
        "name": "Thomas R.",
        "city": "Trondheim",
        "amount": "+1 100 kr",
        "time": "for 1 dag siden",
        "text": "Superenkelt. Fikk utbetalingen innen 24 timer. Nå spiller jeg hver dag."
      }
    ]
  },
  "faq": {
    "eyebrow": "FAQ",
    "title": "Alt du trenger å vite",
    "items": [
      {
        "q": "Er det virkelig gratis?",
        "a": "Ja, helt gratis. Du betaler ingenting og trenger ikke kredittkort. Du laster bare ned appen, spiller og får betalt."
      },
      {
        "q": "Når får jeg pengene mine?",
        "a": "Utbetalinger behandles innen 24 timer. PayPal-betalinger kommer vanligvis frem i løpet av noen minutter."
      },
      {
        "q": "Hvilke spill må jeg spille?",
        "a": "Du velger selv fra listen vår. Hvert spill viser deg nøyaktig hvor mye du kan tjene og hva som kreves."
      },
      {
        "q": "Er det lovlig?",
        "a": "Ja. Du deltar i betalte reklamekampanjer fra spillutviklere. Appene betaler for å få nye spillere – og de pengene sender vi rett videre til deg."
      }
    ]
  },
  "footer": {
    "support": "24/7 live-support",
    "devices": "iOS & Android",
    "noCard": "· Ingen kredittkort nødvendig",
    "reviews": "· Over 251 000 anmeldelser",
    "payments": "PayPal · Krypto · Bankoverføring · Gavekort",
    "legal": "© Med enerett",
    "ssl": "SSL-kryptering",
    "terms": "Vilkår og personvernerklæring"
  },
  "sticky": {
    "title": "Last ned appen nå",
    "sub": "Gratis · Rask utbetaling",
    "badge": "Gratis"
  },
  "gate": {
    "headlineA": "Klar til å ta ",
    "headlineHighlight": "spillingen din",
    "headlineB": " til neste nivå?",
    "swipe": "Sveip opp for å fortsette"
  }
};

const fi: LanderDict = {
  "htmlLang": "fi-FI",
  "meta": {
    "title": "Ansaitse rahaa pelaamalla — jopa 80 €/viikko",
    "description": "Pelaa parhaita pelejä ja muuta jokainen sekunti oikeaksi rahaksi. Nosta rahat heti PayPalilla, kryptolla tai tilisiirrolla."
  },
  "hero": {
    "titleA": "Ansaitse rahaa pelaamalla ",
    "titleHighlight": "pelejä",
    "subtitle": "Pelaa suosikkipelejäsi ja ansaitse rahaa",
    "cta": "Lataa nyt",
    "badges": [
      "Ilmainen",
      "Nosta heti",
      "Rajattomasti tarjouksia"
    ]
  },
  "popular": {
    "eyebrow": "Suositut tarjoukset",
    "titleA": "Pelaa ja suorita ",
    "titleHighlight": "tarjouksia",
    "perHour": "Pelattua tuntia kohti",
    "upTo": "Jopa",
    "cta": "Pelaa ja ansaitse"
  },
  "features": [
    {
      "title": "Rekisteröidy",
      "body": "Luo tili täysin ilmaiseksi"
    },
    {
      "title": "Löydä tarjous",
      "body": "Tarjouksia jokaiseen makuun"
    },
    {
      "title": "Suorita",
      "body": "Suorita loppuun ja bonus on aina taattu"
    },
    {
      "title": "Nosta rahat",
      "body": "Tuemme kaikkia maksutapoja"
    }
  ],
  "testimonialsBlock": {
    "eyebrow": "Mitä käyttäjämme sanovat",
    "titleA": "Yli ",
    "titleHighlight": "1,4 miljoonaa ihmistä",
    "titleB": " ansaitsee jo",
    "items": [
      {
        "name": "Leevi M.",
        "city": "Helsinki",
        "amount": "+75 €",
        "time": "2 tuntia sitten",
        "text": "Saavutin tavoitteen neljässä päivässä, ja PayPal-siirto saapui heti!"
      },
      {
        "name": "Sofia K.",
        "city": "Tampere",
        "amount": "+60 €",
        "time": "5 tuntia sitten",
        "text": "Aluksi epäilin, mutta nyt olen täysin vakuuttunut. Rahat suoraan tilille."
      },
      {
        "name": "Eetu R.",
        "city": "Oulu",
        "amount": "+95 €",
        "time": "1 päivä sitten",
        "text": "Superhelppoa. Sain maksun 24 tunnissa. Nyt pelaan joka päivä."
      }
    ]
  },
  "faq": {
    "eyebrow": "UKK",
    "title": "Kaikki, mitä sinun täytyy tietää",
    "items": [
      {
        "q": "Onko se todella ilmaista?",
        "a": "Kyllä, täysin. Et maksa mitään etkä tarvitse luottokorttia. Lataat vain sovelluksen, pelaat ja saat maksun."
      },
      {
        "q": "Milloin saan rahani?",
        "a": "Maksut käsitellään 24 tunnin kuluessa. PayPal-maksut saapuvat yleensä muutamassa minuutissa."
      },
      {
        "q": "Mitä pelejä minun pitää pelata?",
        "a": "Valitset itse listaltamme. Jokainen peli näyttää tarkalleen, kuinka paljon voit ansaita ja mitä siihen vaaditaan."
      },
      {
        "q": "Onko tämä laillista?",
        "a": "Kyllä. Osallistut pelinkehittäjien maksullisiin mainoskampanjoihin. Sovellukset maksavat saadakseen uusia pelaajia — ja me välitämme nämä rahat suoraan sinulle."
      }
    ]
  },
  "footer": {
    "support": "24/7 live-tuki",
    "devices": "iOS & Android",
    "noCard": "· Luottokorttia ei tarvita",
    "reviews": "· Yli 251 000 arvostelua",
    "payments": "PayPal · Krypto · Tilisiirto · Lahjakortit",
    "legal": "© Kaikki oikeudet pidätetään",
    "ssl": "SSL-salaus",
    "terms": "Käyttöehdot ja tietosuojakäytäntö"
  },
  "sticky": {
    "title": "Lataa sovellus nyt",
    "sub": "Ilmainen · Nosta heti",
    "badge": "Ilmainen"
  },
  "gate": {
    "headlineA": "Valmiina viemään ",
    "headlineHighlight": "pelaamisesi",
    "headlineB": " uudelle tasolle?",
    "swipe": "Pyyhkäise ylös jatkaaksesi"
  }
};

const pl: LanderDict = {
  "htmlLang": "pl-PL",
  "meta": {
    "title": "Zarabiaj, grając w gry — do 350 zł tygodniowo",
    "description": "Graj w najlepsze gry i zamień każdą minutę w prawdziwe pieniądze. Natychmiastowa wypłata przez PayPal, krypto lub przelew bankowy."
  },
  "hero": {
    "titleA": "Zarabiaj, grając w ",
    "titleHighlight": "gry",
    "subtitle": "Graj w ulubione gry i zarabiaj prawdziwe pieniądze",
    "cta": "Pobierz teraz",
    "badges": [
      "Za darmo",
      "Natychmiastowa wypłata",
      "Oferty bez limitu"
    ]
  },
  "popular": {
    "eyebrow": "Popularne oferty",
    "titleA": "Graj i wykonuj ",
    "titleHighlight": "oferty",
    "perHour": "Za godzinę gry",
    "upTo": "Nawet",
    "cta": "Graj i zarabiaj"
  },
  "features": [
    {
      "title": "Zarejestruj się",
      "body": "Załóż konto całkowicie za darmo"
    },
    {
      "title": "Znajdź ofertę",
      "body": "Oferty dla każdego gustu"
    },
    {
      "title": "Wykonaj",
      "body": "Ukończ zadanie w 100% i odbierz bonus"
    },
    {
      "title": "Wypłać",
      "body": "Obsługujemy wszystkie metody płatności"
    }
  ],
  "testimonialsBlock": {
    "eyebrow": "Twoja opinia jest dla nas ważna",
    "titleA": "Ponad ",
    "titleHighlight": "1,4 miliona osób",
    "titleB": " już zarabia",
    "items": [
      {
        "name": "Kacper W.",
        "city": "Warszawa",
        "amount": "+320 zł",
        "time": "2 godziny temu",
        "text": "Cel osiągnąłem w 4 dni, a przelew z PayPala dotarł od razu!"
      },
      {
        "name": "Julia K.",
        "city": "Kraków",
        "amount": "+260 zł",
        "time": "5 godzin temu",
        "text": "Na początku byłam sceptyczna, ale teraz jestem w pełni przekonana. Pieniądze trafiają prosto na moje konto."
      },
      {
        "name": "Michał R.",
        "city": "Wrocław",
        "amount": "+410 zł",
        "time": "1 dzień temu",
        "text": "Mega proste. Wypłatę dostałem w ciągu 24 godzin. Teraz gram codziennie."
      }
    ]
  },
  "faq": {
    "eyebrow": "FAQ",
    "title": "Wszystko, co musisz wiedzieć",
    "items": [
      {
        "q": "Czy to naprawdę za darmo?",
        "a": "Tak, w stu procentach. Nic nie płacisz i nie potrzebujesz karty kredytowej. Po prostu pobierasz aplikację, grasz i dostajesz wypłatę."
      },
      {
        "q": "Kiedy dostanę pieniądze?",
        "a": "Wypłaty realizujemy w ciągu 24 godzin. Płatności przez PayPal zwykle docierają w kilka minut."
      },
      {
        "q": "W jakie gry mogę grać?",
        "a": "Wybierasz z naszej listy. Przy każdej grze widzisz dokładnie, ile możesz zarobić i co trzeba zrobić."
      },
      {
        "q": "Czy to legalne?",
        "a": "Tak. Bierzesz udział w płatnych kampaniach promocyjnych twórców gier. Aplikacje płacą za pozyskanie nowych graczy — a my przekazujemy te pieniądze bezpośrednio Tobie."
      }
    ]
  },
  "footer": {
    "support": "Wsparcie na żywo 24/7",
    "devices": "iOS i Android",
    "noCard": "· Bez karty kredytowej",
    "reviews": "· Ponad 251 tys. opinii",
    "payments": "PayPal · Krypto · Przelew bankowy · Karty podarunkowe",
    "legal": "© Wszelkie prawa zastrzeżone",
    "ssl": "Szyfrowanie SSL",
    "terms": "Regulamin i Polityka prywatności"
  },
  "sticky": {
    "title": "Pobierz aplikację teraz",
    "sub": "Za darmo · Natychmiastowa wypłata",
    "badge": "ZA DARMO"
  },
  "gate": {
    "headlineA": "Gotowy, aby przenieść swoją ",
    "headlineHighlight": "grę",
    "headlineB": " na wyższy poziom?",
    "swipe": "Przesuń w górę, aby kontynuować"
  }
};

const it: LanderDict = {
  "htmlLang": "it-IT",
  "meta": {
    "title": "Guadagna giocando ai videogiochi — fino a 90 €/settimana",
    "description": "Gioca ai migliori titoli e trasforma ogni secondo in denaro vero. Prelievo istantaneo con PayPal, crypto o bonifico bancario."
  },
  "hero": {
    "titleA": "Guadagna giocando ai ",
    "titleHighlight": "videogiochi",
    "subtitle": "Gioca ai tuoi giochi preferiti e inizia subito a guadagnare",
    "cta": "Scarica ora",
    "badges": [
      "Gratis",
      "Prelievo istantaneo",
      "Offerte illimitate"
    ]
  },
  "popular": {
    "eyebrow": "Offerte popolari",
    "titleA": "Gioca e completa le ",
    "titleHighlight": "offerte",
    "perHour": "Per ogni ora di gioco",
    "upTo": "Fino a",
    "cta": "Gioca e guadagna"
  },
  "features": [
    {
      "title": "Registrati",
      "body": "Crea il tuo account in modo completamente gratuito"
    },
    {
      "title": "Trova un'offerta",
      "body": "Offerte disponibili per tutti i gusti"
    },
    {
      "title": "Completa",
      "body": "Completa un'offerta al 100% e ricevi sempre un bonus"
    },
    {
      "title": "Preleva",
      "body": "Supportiamo tutti i metodi di pagamento"
    }
  ],
  "testimonialsBlock": {
    "eyebrow": "La tua opinione conta per noi",
    "titleA": "Oltre ",
    "titleHighlight": "1,4 milioni di persone",
    "titleB": " stanno già guadagnando",
    "items": [
      {
        "name": "Luca M.",
        "city": "Roma",
        "amount": "+85 €",
        "time": "2 ore fa",
        "text": "Ho raggiunto l'obiettivo in 4 giorni e il pagamento PayPal è arrivato all'istante!"
      },
      {
        "name": "Sara C.",
        "city": "Milano",
        "amount": "+70 €",
        "time": "5 ore fa",
        "text": "All'inizio ero scettica, ma ora sono del tutto convinta. I soldi arrivano dritti sul mio conto."
      },
      {
        "name": "Tommaso R.",
        "city": "Napoli",
        "amount": "+110 €",
        "time": "1 giorno fa",
        "text": "Semplicissimo. Ho ricevuto il pagamento entro 24 ore. Ora gioco tutti i giorni."
      }
    ]
  },
  "faq": {
    "eyebrow": "FAQ",
    "title": "Tutto quello che c'è da sapere",
    "items": [
      {
        "q": "È davvero gratis?",
        "a": "Sì, assolutamente. Non paghi nulla e non serve la carta di credito. Ti basta scaricare l'app, giocare e ricevere i pagamenti."
      },
      {
        "q": "Quando ricevo i miei soldi?",
        "a": "I pagamenti vengono elaborati entro 24 ore. Con PayPal di solito arrivano in pochi minuti."
      },
      {
        "q": "A quali giochi devo giocare?",
        "a": "Scegli tu dalla nostra lista. Ogni gioco ti mostra esattamente quanto puoi guadagnare e cosa devi fare."
      },
      {
        "q": "È legale?",
        "a": "Sì. Partecipi a campagne promozionali a pagamento degli sviluppatori di giochi. Le app pagano per acquisire nuovi giocatori e noi giriamo quel denaro direttamente a te."
      }
    ]
  },
  "footer": {
    "support": "Assistenza dal vivo 24/7",
    "devices": "iOS e Android",
    "noCard": "· Nessuna carta di credito richiesta",
    "reviews": "· Oltre 251.000 recensioni",
    "payments": "PayPal · Crypto · Bonifico bancario · Gift card",
    "legal": "© Tutti i diritti riservati",
    "ssl": "Crittografia SSL",
    "terms": "Termini e Condizioni e Informativa sulla Privacy"
  },
  "sticky": {
    "title": "Scarica subito l'app",
    "sub": "Gratis · Prelievo istantaneo",
    "badge": "GRATIS"
  },
  "gate": {
    "headlineA": "Pronto a portare il tuo ",
    "headlineHighlight": "gaming",
    "headlineB": " a un livello superiore?",
    "swipe": "Scorri verso l'alto per continuare"
  }
};

const DICTS: Record<LanderLocale, LanderDict> = { sv, fr, en, de, nl, no, fi, pl, it };

export function getDict(locale: LanderLocale): LanderDict {
  return DICTS[locale] ?? DICTS.en;
}

// Mapea el codigo de locale de la campana (ej. "en-US", "de", "da") al dict disponible.
const LOCALE_MAP: Record<string, LanderLocale> = {
  en: "en", "en-GB": "en", "en-US": "en", "en-AU": "en", "en-CA": "en", "en-NZ": "en",
  sv: "sv", fr: "fr", de: "de", nl: "nl", no: "no", fi: "fi", pl: "pl", it: "it",
};
export function resolveLocale(code?: string | null): LanderLocale {
  return (code && LOCALE_MAP[code]) || "en";
}
