# Newsletter LEVCHIN : proposition à relire

## État de cette proposition

Branche de travail uniquement. Aucune fusion, publication, inscription de test, création de modèle Brevo, modification du formulaire ou émission d’email.

La base inspectée est `main` au commit `a8a84a34766f1e3df12c16309c0f6c31e694ff49`. `AGENTS.md`, le dernier diff, les six pages, les styles et l’intégration newsletter ont été lus avant modification. Le dépôt local GitHub Desktop est propre et au même commit ; il a été copié dans un dossier de travail séparé. Aucun fichier de ce dépôt local d’origine n’a été modifié. Aucun autre fichier du site n’est remplacé.

## Comparaison avec l’existant

- `index.html`, `script.js` et `site-config.js` restent identiques. Le formulaire intégré conserve `EMAIL`, `email_address_check`, `locale`, son endpoint public, ses traductions et ses états d’attente, d’acceptation et d’erreur.
- Les pages Histoire, Contact, les textes juridiques, la page 404 et leurs traductions restent identiques. Les huit étapes Histoire et leur mode de prévisualisation sont conservés.
- `styles.css` reçoit un seul bloc dédié aux classes `confirmation-*` et `newsletter-confirmation-page`. Aucun sélecteur existant n’est remplacé.
- `newsletter-confirmation.html` ajoute une page sobre, responsive et traduite dans les neuf langues. Elle réutilise le sélecteur de langue et `script.js`, le logo SVG, Montserrat et le rideau d’origine.
- `assets/logo-email.png` est une exportation du SVG original, 1148 × 130 pixels, sur le noir du site. Aucun logo n’a été redessiné.
- `emails/brevo-double-optin-brouillon.html` est un fichier HTML à relire, pas un modèle enregistré dans Brevo. Il est en français ; aucune campagne multilingue n’est présumée.

## Double confirmation : point à préserver

Le bouton de l’email doit rester exactement `href="{{ doubleoptin }}"`. Brevo génère ce lien dans son parcours de double confirmation. Ne jamais le remplacer par l’URL de la page du site ou par un lien de démonstration. Ne pas le convertir en `params.doubleoptin` et ne pas encoder les accolades.

La page statique n’interroge aucun service et ne prouve pas qu’une adresse est confirmée. Son texte explique que l’inscription prend effet après validation dans l’email. Elle reste donc honnête si une personne l’ouvre directement. Aucun paramètre d’URL, email ou jeton n’est enregistré ou affiché. La balise `noindex` évite d’en faire une page d’entrée pour les moteurs.

## À compléter avant toute utilisation dans Brevo

1. Remplacer `[Adresse postale à compléter avant utilisation]` par l’adresse réelle et validée. Aucun nom légal ni aucune adresse n’ont été inventés.
2. Après accord de publication séparé, rendre le PNG accessible à `https://levchin.fr/assets/logo-email.png`, puis vérifier sa réponse HTTPS et son affichage dans une messagerie. Cette URL désigne le nouvel asset proposé ; elle n’est pas présumée disponible en production aujourd’hui. Alternative : importer ce PNG dans Brevo et remplacer uniquement le `src` du logo par l’URL HTTPS fournie.
3. Vérifier le compte, l’expéditeur envisagé `contact@levchin.fr` et l’authentification de son domaine dans Brevo. Aucun de ces réglages n’a été vérifié dans le compte par cette proposition.
4. Après un nouvel accord explicite, créer un nouveau modèle inactif et l’examiner. Le titre proposé est « LEVCHIN : confirmez votre inscription email ». Conserver le modèle actif et ses réglages jusqu’à validation.
5. Après un accord séparé pour les tests, vérifier le parcours de double confirmation avec une adresse contrôlée : email reçu, bouton, validation effective, liste correcte et désinscription. Une prévisualisation générique peut laisser `doubleoptin` vide ; elle ne prouve pas le parcours du formulaire.
6. Après validation et publication de la page seulement, choisir `https://levchin.fr/newsletter-confirmation.html` comme redirection finale après confirmation dans le formulaire Brevo. Cette URL ne remplace jamais le bouton de l’email. Ne pas changer la destination au moment de la simple soumission du formulaire.

L’email contient uniquement une demande de validation, sans contenu promotionnel supplémentaire. Il ne comporte pas de personnalisation `contact.*`, de `params.*` ou de boucle. Aucun attribut de contact n’est donc à supposer. Pas de lien de désinscription dans ce message transactionnel préalable à l’inscription ; vérifier séparément celui des futurs envois newsletter.

## Vérifications effectuées et limites

- Chrome sans interface, via Playwright : 56 chargements sur les six pages existantes et la nouvelle, aux formats 320×740, 390×844, 430×932, 768×1024, 1024×768, 1366×768, 1920×1080 et 844×390. Aucun débordement horizontal de document ni erreur JavaScript observé.
- Sélection des neuf langues sur les pages disposant du sélecteur ; neuf titres et textes sur la nouvelle page. Traductions existantes inchangées. Pas de relecture linguistique professionnelle des nouvelles traductions.
- Stockage local refusé : chargement des sept pages et changement de langue fonctionnels. Mouvement réduit : vérification de ces chargements dans ce mode. La nouvelle page n’ajoute aucune animation.
- Clavier : lien d’évitement présent et premier focus sur le contenu. Histoire : huit étapes accessibles par défilement, puis accès au pied de page. Ces contrôles ne constituent pas un audit complet d’accessibilité.
- Aperçus de la page à 1440 px et 390 px, et de l’email à 390 px examinés visuellement.
- Email vérifié manuellement selon la checklist Brevo : HTML de moins de 100 Ko, tableaux de présentation, styles intégrés, image PNG HTTPS avec dimensions et texte alternatif, jeton exact conservé, aucun script ni formulaire. Deux éléments restent à compléter : adresse postale et disponibilité du logo public.
- Ressources externes bloquées pendant les tests : le chargement des polices Google n’est pas validé. Le PNG de l’email a été servi localement pour l’aperçu.
- Aucun rendu serveur Brevo, test de réception Gmail/Outlook, Safari, Firefox ou appareil physique. Le parcours réel de confirmation n’a pas été exécuté. Le compte et le modèle actifs n’ont pas été consultés ou modifiés.

Summary GitHub Desktop : page newsletter et email HTML proposés sur une branche séparée ; formulaire, configuration Brevo publique, autres pages et traductions existantes conservés ; aucune fusion ni mise en production.
