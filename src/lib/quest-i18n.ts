import type { LanderLocale } from "@/lib/lander-i18n";

/** Copy de la plantilla Quest (embudo por etapas). Una entrada por idioma de landing. */
export type QuestDict = {
  mission: string;            // eyebrow: "MISSION"
  of: string;                 // "01 de 03"
  h1a: string;                // titular, parte 1
  h1b: string;                // titular, parte destacada
  sub: string;                // subtítulo del fold
  upTo: string;               // "hasta"
  stages: [string, string, string]; // nombres cortos de las 3 etapas (rail)
  pick: { sub: string; skip: string; selected: string };
  paid: {
    title: string; sub: string;
    goalLabel: string; goalValue: string;
    rewardLabel: string;
    payLabel: string;
    speedLabel: string; speedValue: string;
  };
  go: {
    title: string; sub: string;
    opensIos: string; opensAndroid: string; opensStore: string;
    cta: string;
  };
  next: string;               // "Continuar"
  back: string;               // "Volver"
  payouts24h: string;         // "{n} pagos en las últimas 24 h"
  endsIn: string;             // "Termina en"
};

/** Compartido por nl y nl-BE: en texto escrito no hay diferencia. */
const nlQuest: QuestDict = {
    mission: "MISSIE", of: "van",
    h1a: "Speel de game. ", h1b: "Word betaald.",
    sub: "Kies een game, haal het doel en laat het geld uitbetalen.",
    upTo: "tot",
    stages: ["Kies game", "Zo word je betaald", "Downloaden"],
    pick: { sub: "Tik op de game die je wilt spelen.", skip: "Al gekozen? Nu downloaden", selected: "Gekozen" },
    paid: {
      title: "Zo word je betaald", sub: "Geen abonnement. Geen kaart nodig.",
      goalLabel: "Jouw doel", goalValue: "Haal de mijlpaal in de game",
      rewardLabel: "Jouw beloning", payLabel: "Uitbetaling via", speedLabel: "Uitbetaling", speedValue: "Zodra het doel is bevestigd",
    },
    go: {
      title: "Download en begin", sub: "De game is gratis. Je beloning wordt automatisch bijgehouden.",
      opensIos: "Opent in de App Store", opensAndroid: "Opent in Google Play", opensStore: "Opent in je appstore",
      cta: "Download de game",
    },
    next: "Doorgaan", back: "Terug",
    payouts24h: "uitbetalingen in de laatste 24 uur", endsIn: "Eindigt over",
  };

const DICTS: Record<LanderLocale, QuestDict> = {
  en: {
    mission: "MISSION", of: "of",
    h1a: "Play the game. ", h1b: "Get paid.",
    sub: "Pick a game, hit the goal, cash out to your account.",
    upTo: "up to",
    stages: ["Pick game", "How you're paid", "Download"],
    pick: { sub: "Tap the one you want to play.", skip: "Already decided? Download now", selected: "Selected" },
    paid: {
      title: "How you get paid", sub: "No subscription. No card needed.",
      goalLabel: "Your goal", goalValue: "Reach the in-game milestone",
      rewardLabel: "Your reward", payLabel: "Paid out via", speedLabel: "Payout", speedValue: "After the goal is verified",
    },
    go: {
      title: "Download and start", sub: "The game is free. Your reward is tracked automatically.",
      opensIos: "Opens in the App Store", opensAndroid: "Opens in Google Play", opensStore: "Opens in your app store",
      cta: "Download the game",
    },
    next: "Continue", back: "Back",
    payouts24h: "payouts in the last 24 h", endsIn: "Ends in",
  },
  sv: {
    mission: "UPPDRAG", of: "av",
    h1a: "Spela spelet. ", h1b: "Få betalt.",
    sub: "Välj ett spel, nå målet och ta ut pengarna till ditt konto.",
    upTo: "upp till",
    stages: ["Välj spel", "Så får du betalt", "Ladda ner"],
    pick: { sub: "Tryck på det du vill spela.", skip: "Redan bestämd? Ladda ner nu", selected: "Valt" },
    paid: {
      title: "Så får du betalt", sub: "Ingen prenumeration. Inget kort behövs.",
      goalLabel: "Ditt mål", goalValue: "Nå milstolpen i spelet",
      rewardLabel: "Din belöning", payLabel: "Utbetalning via", speedLabel: "Utbetalning", speedValue: "När målet är verifierat",
    },
    go: {
      title: "Ladda ner och börja", sub: "Spelet är gratis. Din belöning spåras automatiskt.",
      opensIos: "Öppnas i App Store", opensAndroid: "Öppnas i Google Play", opensStore: "Öppnas i din appbutik",
      cta: "Ladda ner spelet",
    },
    next: "Fortsätt", back: "Tillbaka",
    payouts24h: "utbetalningar senaste 24 h", endsIn: "Slutar om",
  },
  no: {
    mission: "OPPDRAG", of: "av",
    h1a: "Spill spillet. ", h1b: "Få betalt.",
    sub: "Velg et spill, nå målet og ta ut pengene til kontoen din.",
    upTo: "opptil",
    stages: ["Velg spill", "Slik får du betalt", "Last ned"],
    pick: { sub: "Trykk på det du vil spille.", skip: "Allerede bestemt? Last ned nå", selected: "Valgt" },
    paid: {
      title: "Slik får du betalt", sub: "Ingen abonnement. Ingen kort nødvendig.",
      goalLabel: "Målet ditt", goalValue: "Nå milepælen i spillet",
      rewardLabel: "Belønningen din", payLabel: "Utbetaling via", speedLabel: "Utbetaling", speedValue: "Når målet er bekreftet",
    },
    go: {
      title: "Last ned og start", sub: "Spillet er gratis. Belønningen spores automatisk.",
      opensIos: "Åpnes i App Store", opensAndroid: "Åpnes i Google Play", opensStore: "Åpnes i appbutikken din",
      cta: "Last ned spillet",
    },
    next: "Fortsett", back: "Tilbake",
    payouts24h: "utbetalinger siste 24 t", endsIn: "Slutter om",
  },
  fi: {
    mission: "TEHTÄVÄ", of: "/",
    h1a: "Pelaa peliä. ", h1b: "Saa maksu.",
    sub: "Valitse peli, saavuta tavoite ja nosta rahat tilillesi.",
    upTo: "jopa",
    stages: ["Valitse peli", "Näin saat maksun", "Lataa"],
    pick: { sub: "Napauta sitä, jota haluat pelata.", skip: "Jo päättänyt? Lataa nyt", selected: "Valittu" },
    paid: {
      title: "Näin saat maksun", sub: "Ei tilausta. Ei korttia.",
      goalLabel: "Tavoitteesi", goalValue: "Saavuta pelin välitavoite",
      rewardLabel: "Palkkiosi", payLabel: "Maksu tavalla", speedLabel: "Maksu", speedValue: "Kun tavoite on vahvistettu",
    },
    go: {
      title: "Lataa ja aloita", sub: "Peli on ilmainen. Palkkiosi seurataan automaattisesti.",
      opensIos: "Avautuu App Storessa", opensAndroid: "Avautuu Google Playssä", opensStore: "Avautuu sovelluskaupassasi",
      cta: "Lataa peli",
    },
    next: "Jatka", back: "Takaisin",
    payouts24h: "maksua viimeisen 24 t aikana", endsIn: "Päättyy",
  },
  de: {
    mission: "MISSION", of: "von",
    h1a: "Spiel das Game. ", h1b: "Kassier ab.",
    sub: "Spiel auswählen, Ziel erreichen, Geld aufs Konto auszahlen.",
    upTo: "bis zu",
    stages: ["Spiel wählen", "So wirst du bezahlt", "Herunterladen"],
    pick: { sub: "Tippe auf das Spiel, das du spielen willst.", skip: "Schon entschieden? Jetzt herunterladen", selected: "Ausgewählt" },
    paid: {
      title: "So wirst du bezahlt", sub: "Kein Abo. Keine Karte nötig.",
      goalLabel: "Dein Ziel", goalValue: "Erreiche den Meilenstein im Spiel",
      rewardLabel: "Deine Belohnung", payLabel: "Auszahlung über", speedLabel: "Auszahlung", speedValue: "Sobald das Ziel bestätigt ist",
    },
    go: {
      title: "Herunterladen und starten", sub: "Das Spiel ist kostenlos. Deine Belohnung wird automatisch erfasst.",
      opensIos: "Öffnet im App Store", opensAndroid: "Öffnet in Google Play", opensStore: "Öffnet in deinem App-Store",
      cta: "Spiel herunterladen",
    },
    next: "Weiter", back: "Zurück",
    payouts24h: "Auszahlungen in den letzten 24 Std.", endsIn: "Endet in",
  },
  nl: nlQuest,
  // Belgica: mismo texto que Paises Bajos, cambia el rail de cobro.
  "nl-BE": nlQuest,
  fr: {
    mission: "MISSION", of: "sur",
    h1a: "Joue au jeu. ", h1b: "Sois payé.",
    sub: "Choisis un jeu, atteins l'objectif, retire l'argent sur ton compte.",
    upTo: "jusqu'à",
    stages: ["Choisir le jeu", "Comment tu es payé", "Télécharger"],
    pick: { sub: "Touche celui que tu veux jouer.", skip: "Déjà décidé ? Télécharge maintenant", selected: "Choisi" },
    paid: {
      title: "Comment tu es payé", sub: "Sans abonnement. Sans carte bancaire.",
      goalLabel: "Ton objectif", goalValue: "Atteins le palier dans le jeu",
      rewardLabel: "Ta récompense", payLabel: "Paiement via", speedLabel: "Paiement", speedValue: "Dès que l'objectif est validé",
    },
    go: {
      title: "Télécharge et commence", sub: "Le jeu est gratuit. Ta récompense est suivie automatiquement.",
      opensIos: "S'ouvre dans l'App Store", opensAndroid: "S'ouvre dans Google Play", opensStore: "S'ouvre dans ton store",
      cta: "Télécharger le jeu",
    },
    next: "Continuer", back: "Retour",
    payouts24h: "paiements ces dernières 24 h", endsIn: "Se termine dans",
  },
  it: {
    mission: "MISSIONE", of: "di",
    h1a: "Gioca. ", h1b: "Fatti pagare.",
    sub: "Scegli un gioco, raggiungi l'obiettivo e incassa sul tuo conto.",
    upTo: "fino a",
    stages: ["Scegli gioco", "Come vieni pagato", "Scarica"],
    pick: { sub: "Tocca quello che vuoi giocare.", skip: "Già deciso? Scarica ora", selected: "Scelto" },
    paid: {
      title: "Come vieni pagato", sub: "Nessun abbonamento. Nessuna carta.",
      goalLabel: "Il tuo obiettivo", goalValue: "Raggiungi il traguardo nel gioco",
      rewardLabel: "La tua ricompensa", payLabel: "Pagamento con", speedLabel: "Pagamento", speedValue: "Appena l'obiettivo è verificato",
    },
    go: {
      title: "Scarica e inizia", sub: "Il gioco è gratis. La tua ricompensa è tracciata automaticamente.",
      opensIos: "Si apre nell'App Store", opensAndroid: "Si apre in Google Play", opensStore: "Si apre nel tuo store",
      cta: "Scarica il gioco",
    },
    next: "Continua", back: "Indietro",
    payouts24h: "pagamenti nelle ultime 24 h", endsIn: "Finisce tra",
  },
  pl: {
    mission: "MISJA", of: "z",
    h1a: "Zagraj. ", h1b: "Odbierz kasę.",
    sub: "Wybierz grę, osiągnij cel i wypłać pieniądze na swoje konto.",
    upTo: "do",
    stages: ["Wybierz grę", "Jak dostajesz kasę", "Pobierz"],
    pick: { sub: "Dotknij tej, w którą chcesz zagrać.", skip: "Już wiesz? Pobierz teraz", selected: "Wybrana" },
    paid: {
      title: "Jak dostajesz kasę", sub: "Bez subskrypcji. Bez karty.",
      goalLabel: "Twój cel", goalValue: "Osiągnij próg w grze",
      rewardLabel: "Twoja nagroda", payLabel: "Wypłata przez", speedLabel: "Wypłata", speedValue: "Gdy cel zostanie potwierdzony",
    },
    go: {
      title: "Pobierz i zacznij", sub: "Gra jest darmowa. Nagroda liczy się automatycznie.",
      opensIos: "Otworzy się w App Store", opensAndroid: "Otworzy się w Google Play", opensStore: "Otworzy się w twoim sklepie",
      cta: "Pobierz grę",
    },
    next: "Dalej", back: "Wróć",
    payouts24h: "wypłat w ostatnich 24 h", endsIn: "Kończy się za",
  },
};

export function getQuestDict(locale: LanderLocale): QuestDict {
  return DICTS[locale] ?? DICTS.en;
}

/**
 * Métodos de cobro (recibir plata) más usados por gente joven en cada país,
 * ordenados por reconocimiento local.
 *
 * Va por PAÍS, no por idioma: son ejes distintos. Dinamarca usa la copy en
 * inglés pero allá se cobra con MobilePay, y "en" cubre GB/US/AU/CA/NZ, que no
 * comparten ningún rail.
 *
 * Solo rails con los que se puede RECIBIR dinero. Ojo con confundirlos con
 * métodos de checkout: iDEAL (NL) y Klarna (SE) sirven para pagar, no para
 * cobrar, así que no van acá.
 *
 * IMPORTANTE: esto es una afirmación sobre cómo le van a pagar al visitante.
 * Tiene que coincidir con lo que la oferta realmente soporta — si la plataforma
 * paga solo por PayPal, mostrar "Swish" es falso. Ajustá la lista por campaña
 * si la oferta difiere.
 *
 * Las claves son los `code` de LOCALES (= Campaign.locale).
 */
const PAY_BY_LOCALE: Record<string, string[]> = {
  // Nórdicos: la app local de pagos es universal entre menores de 30
  sv: ["Swish", "Revolut", "PayPal"],
  no: ["Vipps", "Revolut", "PayPal"],
  da: ["MobilePay", "Revolut", "PayPal"],
  fi: ["MobilePay", "Revolut", "PayPal"],
  // Europa occidental
  de: ["PayPal", "Revolut", "N26"],
  nl: ["PayPal", "Revolut", "bunq"],
  "nl-BE": ["Bancontact", "PayPal", "Revolut"],
  fr: ["PayPal", "Lydia", "Revolut"],
  it: ["PayPal", "Postepay", "Revolut"],
  es: ["Bizum", "PayPal", "Revolut"],
  pt: ["MB WAY", "PayPal", "Revolut"],
  // Europa central/este: Revolut tiene penetración altísima entre jóvenes
  pl: ["BLIK", "Revolut", "PayPal"],
  cs: ["Revolut", "PayPal"],
  hu: ["Revolut", "PayPal"],
  ro: ["Revolut", "PayPal"],
  // Anglo: cada país con su rail instantáneo
  en: ["Revolut", "PayPal", "Monzo"],       // UK
  "en-US": ["PayPal", "Cash App", "Venmo"],
  "en-AU": ["PayPal", "PayID", "Revolut"],
  "en-CA": ["PayPal", "Interac", "Revolut"],
  "en-NZ": ["PayPal", "Revolut"],
};

const PAY_FALLBACK = ["PayPal", "Revolut"];

/**
 * Métodos de cobro para el código de locale de la campaña (ej. "sv", "en-US").
 * `fallback` es el idioma resuelto, por si la campaña no trae locale.
 */
export function payMethods(localeCode?: string | null, fallback?: LanderLocale): string[] {
  return (
    (localeCode ? PAY_BY_LOCALE[localeCode] : undefined) ??
    (fallback ? PAY_BY_LOCALE[fallback] : undefined) ??
    PAY_FALLBACK
  );
}
