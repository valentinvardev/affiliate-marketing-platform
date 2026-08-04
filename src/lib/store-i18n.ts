import type { LanderLocale } from "@/lib/lander-i18n";

/**
 * Copy de la plantilla Store (ficha de app + CTA de tienda). Una entrada por
 * idioma de landing, igual que `quest-i18n`.
 *
 * `names` alimenta el ticker de pagos de la barra superior: son nombres de
 * ejemplo localizados, del mismo tenor que los testimonios de `lander-i18n`.
 * Los MONTOS del ticker no salen de acá: se derivan de los payouts reales de
 * la campaña (ver `lander-store`).
 */
export type StoreDict = {
  /** Bandera del ticker (país dominante del idioma). */
  flag: string;
  /** Nombres del ticker, con inicial de apellido. */
  names: string[];
  notif: { earned: string; instant: string };
  hero: {
    store: string;    // "App Store"
    reviews: string;  // "50K+ reseñas"
    h1a: string;      // titular, parte 1
    h1b: string;      // titular, parte destacada
    sub: string;
    live: string;     // "personas ganando ahora mismo"
  };
  game: { pay: string; rated: string };
  steps: { label: string; one: string; two: string; three: string }; // `one` lleva {brand}
  trust: { paid: string; rating: string; join: string };
  disclaimer: string;
  legal: { privacy: string; terms: string };
  cta: { eyebrow: string; iosSub: string; iosMain: string; androidSub: string; androidMain: string };
  modal: { kicker: string; titleA: string; titleB: string; desc: string; cta: string }; // `desc` lleva {brand}
};

const en: StoreDict = {
  flag: "🇬🇧",
  names: ["Jake R.", "Chloe F.", "Devon L.", "Mia S.", "Nate G.", "Priya M."],
  notif: { earned: "just earned", instant: "paid instantly" },
  hero: {
    store: "App Store", reviews: "50K+ reviews",
    h1a: "Get paid ", h1b: "to play",
    sub: "Earn real cash playing games, completing tasks and testing apps. Cash out anytime — no minimum.",
    live: "people earning right now",
  },
  game: { pay: "Pay:", rated: "Top Rated" },
  steps: {
    label: "How it works",
    one: "Sign up on {brand} (select 21+)",
    two: "Play games & complete tasks",
    three: "Withdraw via",
  },
  trust: { paid: "Paid Out", rating: "App Rating", join: "to Join" },
  disclaimer: "Availability, rewards and eligibility may vary by user, location and completed activity. Results are not guaranteed and depend on individual participation. Earnings vary by offer.",
  legal: { privacy: "Privacy Policy", terms: "Terms of Service" },
  cta: { eyebrow: "Available now on iOS and Android", iosSub: "Download on the", iosMain: "App Store", androidSub: "Get it on", androidMain: "Google Play" },
  modal: {
    kicker: "Quick tip", titleA: "Select ", titleB: " when you sign up",
    desc: "This unlocks the highest-paying offers on {brand}. Don't skip this step.",
    cta: "Got it →",
  },
};

/** Compartido por nl y nl-BE: en texto escrito no hay diferencia (cambia la bandera). */
const nl: StoreDict = {
  flag: "🇳🇱",
  names: ["Daan V.", "Sanne B.", "Lars J.", "Fleur K.", "Sem D.", "Julia M."],
  notif: { earned: "verdiende net", instant: "direct uitbetaald" },
  hero: {
    store: "App Store", reviews: "50K+ beoordelingen",
    h1a: "Word betaald ", h1b: "om te spelen",
    sub: "Verdien echt geld met games spelen, taken doen en apps testen. Neem op wanneer je wilt — geen minimum.",
    live: "mensen verdienen nu",
  },
  game: { pay: "Betaling:", rated: "Topbeoordeling" },
  steps: {
    label: "Zo werkt het",
    one: "Meld je aan bij {brand} (kies 21+)",
    two: "Speel games & voltooi taken",
    three: "Laat uitbetalen via",
  },
  trust: { paid: "Uitbetaald", rating: "App-score", join: "om mee te doen" },
  disclaimer: "Beschikbaarheid, beloningen en deelname kunnen verschillen per gebruiker, locatie en voltooide activiteit. Resultaten zijn niet gegarandeerd en hangen af van je eigen deelname. Verdiensten verschillen per aanbieding.",
  legal: { privacy: "Privacybeleid", terms: "Voorwaarden" },
  cta: { eyebrow: "Nu beschikbaar op iOS en Android", iosSub: "Download in de", iosMain: "App Store", androidSub: "Ontdek het op", androidMain: "Google Play" },
  modal: {
    kicker: "Snelle tip", titleA: "Kies ", titleB: " bij het aanmelden",
    desc: "Zo ontgrendel je de best betalende aanbiedingen op {brand}. Sla deze stap niet over.",
    cta: "Duidelijk →",
  },
};

const DICTS: Record<LanderLocale, StoreDict> = {
  en,
  nl,
  "nl-BE": { ...nl, flag: "🇧🇪", names: ["Wout D.", "Marie V.", "Lars P.", "Fien C.", "Seppe M.", "Noor J."] },
  sv: {
    flag: "🇸🇪",
    names: ["Elias N.", "Alva B.", "Hugo S.", "Maja L.", "Liam K.", "Ebba T."],
    notif: { earned: "tjänade precis", instant: "utbetalt direkt" },
    hero: {
      store: "App Store", reviews: "50 tn+ omdömen",
      h1a: "Få betalt ", h1b: "för att spela",
      sub: "Tjäna riktiga pengar på att spela spel, göra uppdrag och testa appar. Ta ut när du vill — ingen minimigräns.",
      live: "personer tjänar pengar just nu",
    },
    game: { pay: "Betalt:", rated: "Toppbetyg" },
    steps: {
      label: "Så funkar det",
      one: "Registrera dig på {brand} (välj 21+)",
      two: "Spela spel & slutför uppdrag",
      three: "Ta ut via",
    },
    trust: { paid: "Utbetalt", rating: "Appbetyg", join: "att gå med" },
    disclaimer: "Tillgänglighet, belöningar och behörighet kan variera beroende på användare, plats och slutförd aktivitet. Resultat garanteras inte och beror på individuellt deltagande. Intäkterna varierar per erbjudande.",
    legal: { privacy: "Integritetspolicy", terms: "Användarvillkor" },
    cta: { eyebrow: "Tillgänglig nu för iOS och Android", iosSub: "Ladda ner på", iosMain: "App Store", androidSub: "Hämta på", androidMain: "Google Play" },
    modal: {
      kicker: "Snabbt tips", titleA: "Välj ", titleB: " när du registrerar dig",
      desc: "Det låser upp de bäst betalda erbjudandena på {brand}. Hoppa inte över det här steget.",
      cta: "Uppfattat →",
    },
  },
  no: {
    flag: "🇳🇴",
    names: ["Jakob H.", "Nora S.", "Emil B.", "Ida L.", "Mathias K.", "Sofie R."],
    notif: { earned: "tjente akkurat", instant: "utbetalt med én gang" },
    hero: {
      store: "App Store", reviews: "50 t+ anmeldelser",
      h1a: "Få betalt ", h1b: "for å spille",
      sub: "Tjen ekte penger på å spille spill, fullføre oppdrag og teste apper. Ta ut når du vil — ingen minstegrense.",
      live: "personer tjener penger akkurat nå",
    },
    game: { pay: "Betalt:", rated: "Toppvurdert" },
    steps: {
      label: "Slik funker det",
      one: "Registrer deg på {brand} (velg 21+)",
      two: "Spill spill og fullfør oppdrag",
      three: "Ta ut via",
    },
    trust: { paid: "Utbetalt", rating: "Appvurdering", join: "å bli med" },
    disclaimer: "Tilgjengelighet, belønninger og kvalifisering kan variere etter bruker, sted og fullført aktivitet. Resultater er ikke garantert og avhenger av individuell deltakelse. Inntektene varierer per tilbud.",
    legal: { privacy: "Personvern", terms: "Vilkår" },
    cta: { eyebrow: "Tilgjengelig nå på iOS og Android", iosSub: "Last ned på", iosMain: "App Store", androidSub: "Få den på", androidMain: "Google Play" },
    modal: {
      kicker: "Kjapt tips", titleA: "Velg ", titleB: " når du registrerer deg",
      desc: "Det låser opp de best betalte tilbudene på {brand}. Ikke hopp over dette steget.",
      cta: "Skjønner →",
    },
  },
  fi: {
    flag: "🇫🇮",
    names: ["Eetu K.", "Aino V.", "Onni L.", "Venla M.", "Leevi S.", "Sanni H."],
    notif: { earned: "ansaitsi juuri", instant: "maksettu heti" },
    hero: {
      store: "App Store", reviews: "50 t+ arvostelua",
      h1a: "Saa maksu ", h1b: "pelaamisesta",
      sub: "Ansaitse oikeaa rahaa pelaamalla, tekemällä tehtäviä ja testaamalla sovelluksia. Nosta milloin haluat — ei alarajaa.",
      live: "ihmistä ansaitsee juuri nyt",
    },
    game: { pay: "Palkkio:", rated: "Huippuarvio" },
    steps: {
      label: "Näin se toimii",
      one: "Rekisteröidy palveluun {brand} (valitse 21+)",
      two: "Pelaa pelejä ja tee tehtäviä",
      three: "Nosta rahat tavoilla",
    },
    trust: { paid: "Maksettu", rating: "Sovelluksen arvio", join: "liittyminen" },
    disclaimer: "Saatavuus, palkkiot ja kelpoisuus voivat vaihdella käyttäjän, sijainnin ja suoritetun toiminnan mukaan. Tuloksia ei taata ja ne riippuvat omasta osallistumisesta. Ansiot vaihtelevat tarjouksittain.",
    legal: { privacy: "Tietosuoja", terms: "Käyttöehdot" },
    cta: { eyebrow: "Saatavilla nyt iOS:lle ja Androidille", iosSub: "Lataa", iosMain: "App Store", androidSub: "Hanki", androidMain: "Google Play" },
    modal: {
      kicker: "Pikavinkki", titleA: "Valitse ", titleB: " kun rekisteröidyt",
      desc: "Se avaa {brand}-palvelun parhaiten maksavat tarjoukset. Älä ohita tätä vaihetta.",
      cta: "Selvä →",
    },
  },
  de: {
    flag: "🇩🇪",
    names: ["Lukas M.", "Lena S.", "Finn K.", "Mia B.", "Jonas W.", "Emma T."],
    notif: { earned: "hat gerade verdient", instant: "sofort ausgezahlt" },
    hero: {
      store: "App Store", reviews: "50 Tsd.+ Bewertungen",
      h1a: "Geld verdienen ", h1b: "beim Spielen",
      sub: "Verdiene echtes Geld mit Spielen, Aufgaben und App-Tests. Jederzeit auszahlen — ohne Mindestbetrag.",
      live: "Leute verdienen gerade",
    },
    game: { pay: "Vergütung:", rated: "Top bewertet" },
    steps: {
      label: "So funktioniert's",
      one: "Registriere dich bei {brand} (21+ wählen)",
      two: "Spiele spielen & Aufgaben erledigen",
      three: "Auszahlung über",
    },
    trust: { paid: "Ausgezahlt", rating: "App-Bewertung", join: "Beitritt" },
    disclaimer: "Verfügbarkeit, Prämien und Teilnahmeberechtigung können je nach Nutzer, Standort und abgeschlossener Aktivität variieren. Ergebnisse sind nicht garantiert und hängen von der individuellen Teilnahme ab. Die Verdienste variieren je nach Angebot.",
    legal: { privacy: "Datenschutz", terms: "AGB" },
    cta: { eyebrow: "Jetzt für iOS und Android", iosSub: "Laden im", iosMain: "App Store", androidSub: "Jetzt bei", androidMain: "Google Play" },
    modal: {
      kicker: "Kurzer Tipp", titleA: "Wähle ", titleB: " bei der Anmeldung",
      desc: "Damit schaltest du die bestbezahlten Angebote auf {brand} frei. Überspring diesen Schritt nicht.",
      cta: "Verstanden →",
    },
  },
  fr: {
    flag: "🇫🇷",
    names: ["Hugo L.", "Léa M.", "Nathan D.", "Chloé B.", "Enzo P.", "Manon R."],
    notif: { earned: "vient de gagner", instant: "payé instantanément" },
    hero: {
      store: "App Store", reviews: "50 K+ avis",
      h1a: "Sois payé ", h1b: "pour jouer",
      sub: "Gagne de l'argent réel en jouant, en réalisant des tâches et en testant des applis. Retire quand tu veux — sans minimum.",
      live: "personnes gagnent en ce moment",
    },
    game: { pay: "Gain :", rated: "Très bien noté" },
    steps: {
      label: "Comment ça marche",
      one: "Inscris-toi sur {brand} (choisis 21+)",
      two: "Joue et complète des tâches",
      three: "Retire via",
    },
    trust: { paid: "Versés", rating: "Note de l'appli", join: "pour s'inscrire" },
    disclaimer: "La disponibilité, les récompenses et l'éligibilité peuvent varier selon l'utilisateur, la localisation et l'activité réalisée. Les résultats ne sont pas garantis et dépendent de la participation individuelle. Les gains varient selon l'offre.",
    legal: { privacy: "Confidentialité", terms: "Conditions" },
    cta: { eyebrow: "Disponible sur iOS et Android", iosSub: "Télécharger dans l'", iosMain: "App Store", androidSub: "Disponible sur", androidMain: "Google Play" },
    modal: {
      kicker: "Astuce rapide", titleA: "Choisis ", titleB: " à l'inscription",
      desc: "Ça débloque les offres les mieux payées sur {brand}. Ne saute pas cette étape.",
      cta: "C'est noté →",
    },
  },
  it: {
    flag: "🇮🇹",
    names: ["Matteo R.", "Giulia C.", "Luca B.", "Sofia M.", "Andrea F.", "Chiara D."],
    notif: { earned: "ha appena guadagnato", instant: "pagato subito" },
    hero: {
      store: "App Store", reviews: "50K+ recensioni",
      h1a: "Fatti pagare ", h1b: "per giocare",
      sub: "Guadagna soldi veri giocando, completando task e testando app. Preleva quando vuoi — senza minimo.",
      live: "persone stanno guadagnando ora",
    },
    game: { pay: "Compenso:", rated: "Tra i migliori" },
    steps: {
      label: "Come funziona",
      one: "Registrati su {brand} (seleziona 21+)",
      two: "Gioca e completa i task",
      three: "Preleva con",
    },
    trust: { paid: "Pagati", rating: "Voto app", join: "per iscriversi" },
    disclaimer: "Disponibilità, premi e idoneità possono variare in base a utente, posizione e attività completata. I risultati non sono garantiti e dipendono dalla partecipazione individuale. I guadagni variano in base all'offerta.",
    legal: { privacy: "Privacy", terms: "Termini" },
    cta: { eyebrow: "Disponibile su iOS e Android", iosSub: "Scarica su", iosMain: "App Store", androidSub: "Disponibile su", androidMain: "Google Play" },
    modal: {
      kicker: "Consiglio rapido", titleA: "Seleziona ", titleB: " quando ti registri",
      desc: "Sblocca le offerte più pagate su {brand}. Non saltare questo passaggio.",
      cta: "Ho capito →",
    },
  },
  pl: {
    flag: "🇵🇱",
    names: ["Kacper W.", "Zuzanna N.", "Jakub L.", "Lena K.", "Filip M.", "Oliwia S."],
    notif: { earned: "właśnie zarobił(a)", instant: "wypłata natychmiast" },
    hero: {
      store: "App Store", reviews: "50 tys.+ opinii",
      h1a: "Zarabiaj ", h1b: "grając",
      sub: "Zarabiaj prawdziwe pieniądze grając, wykonując zadania i testując aplikacje. Wypłacaj kiedy chcesz — bez minimum.",
      live: "osób zarabia właśnie teraz",
    },
    game: { pay: "Stawka:", rated: "Top ocena" },
    steps: {
      label: "Jak to działa",
      one: "Zarejestruj się w {brand} (wybierz 21+)",
      two: "Graj i wykonuj zadania",
      three: "Wypłać przez",
    },
    trust: { paid: "Wypłacono", rating: "Ocena aplikacji", join: "za dołączenie" },
    disclaimer: "Dostępność, nagrody i kwalifikacja mogą różnić się w zależności od użytkownika, lokalizacji i ukończonej aktywności. Wyniki nie są gwarantowane i zależą od indywidualnego udziału. Zarobki różnią się w zależności od oferty.",
    legal: { privacy: "Prywatność", terms: "Regulamin" },
    cta: { eyebrow: "Dostępne na iOS i Android", iosSub: "Pobierz z", iosMain: "App Store", androidSub: "Pobierz z", androidMain: "Google Play" },
    modal: {
      kicker: "Szybka wskazówka", titleA: "Wybierz ", titleB: " przy rejestracji",
      desc: "To odblokowuje najlepiej płatne oferty w {brand}. Nie pomijaj tego kroku.",
      cta: "Jasne →",
    },
  },
};

export function getStoreDict(locale: LanderLocale): StoreDict {
  return DICTS[locale] ?? DICTS.en;
}
