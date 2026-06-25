export type LanderLocale = "sv" | "fr" | "en";

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

const DICTS: Record<LanderLocale, LanderDict> = { sv, fr, en };

export function getDict(locale: LanderLocale): LanderDict {
  return DICTS[locale] ?? DICTS.en;
}
