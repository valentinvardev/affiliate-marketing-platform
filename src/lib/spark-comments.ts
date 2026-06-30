/** Banco de comentarios por idioma para prellenar el boost de un spark. */
export const SPARK_COMMENTS: Record<string, string[]> = {
  en: ["This actually works 🔥", "No way this is real", "Just tried it, legit", "Wait how does this work", "This is genius ngl", "Saving this fr", "Bro changed my life", "Why is nobody talking about this"],
  fr: ["Ça marche vraiment 🔥", "Sérieux ?", "Je viens de tester, c'est réel", "Mais comment ça marche", "C'est génial franchement", "Je garde ça", "Ça a changé ma vie", "Pourquoi personne en parle"],
  de: ["Das funktioniert wirklich 🔥", "Kann nicht echt sein", "Gerade getestet, legit", "Wie geht das bitte", "Echt genial", "Das speichere ich mir", "Hat mein Leben verändert", "Warum redet keiner darüber"],
  es: ["Esto funciona de verdad 🔥", "No puede ser real", "Lo probé, es legítimo", "¿Pero cómo funciona?", "Es genial la verdad", "Me lo guardo", "Me cambió la vida", "¿Por qué nadie habla de esto?"],
  it: ["Funziona davvero 🔥", "Non ci credo", "Provato, è reale", "Ma come funziona", "Geniale davvero", "Lo salvo", "Mi ha cambiato la vita", "Perché nessuno ne parla"],
  nl: ["Dit werkt echt 🔥", "Echt niet waar", "Net getest, legit", "Hoe werkt dit", "Geniaal eerlijk", "Ik bewaar dit", "Veranderde mijn leven", "Waarom praat niemand hierover"],
  pl: ["To naprawdę działa 🔥", "Nie wierzę", "Przetestowane, działa", "Jak to działa", "Genialne serio", "Zapisuję to", "Zmieniło mi życie", "Czemu nikt o tym nie mówi"],
  sv: ["Det här funkar verkligen 🔥", "Omöjligt att det är sant", "Testade precis, äkta", "Hur funkar det", "Genialt faktiskt", "Sparar detta", "Förändrade mitt liv", "Varför pratar ingen om detta"],
  no: ["Dette funker faktisk 🔥", "Umulig at det er ekte", "Testet nettopp, ekte", "Hvordan funker det", "Helt genialt", "Lagrer dette", "Forandret livet mitt", "Hvorfor snakker ingen om dette"],
  da: ["Det her virker faktisk 🔥", "Umuligt det er ægte", "Lige testet, ægte", "Hvordan virker det", "Helt genialt", "Gemmer det her", "Ændrede mit liv", "Hvorfor taler ingen om det"],
  fi: ["Tämä oikeasti toimii 🔥", "Ei voi olla totta", "Testasin juuri, aito", "Miten tämä toimii", "Nerokasta", "Tallennan tämän", "Muutti elämäni", "Miksei kukaan puhu tästä"],
};

export function commentsForLanguage(lang: string): string[] {
  return SPARK_COMMENTS[lang] ?? SPARK_COMMENTS[lang.split("-")[0] ?? ""] ?? SPARK_COMMENTS.en ?? [];
}
