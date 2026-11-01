# Gérer le site LEVCHIN

## Direction à conserver

Le site présente la maison, invite à prendre contact et prépare la newsletter. La vente viendra plus tard. Sa signature actuelle : le rideau fourni, le noir, Montserrat, les compositions éditoriales et les liens sobres. Pas de catalogue fictif, de témoignages inventés ni d'animations ajoutées pour remplir l'espace.

L'identité viendra surtout de vos créations, de vos images et de vos choix éditoriaux. Les emplacements gris ne sont pas des photographies finales. Avant une présentation à des clients ou partenaires, prévoir des images personnelles : matière, geste, objet, atelier ou recherche réellement liés à la maison.

## Où modifier quoi

| Besoin | Fichier |
| --- | --- |
| Accueil, présentation, newsletter | index.html |
| Récit en huit slides | histoire.html |
| Mise en page Histoire uniquement | histoire-responsive.css |
| Couleurs, typographie et composants partagés | styles.css, variables au début |
| Navigation, traductions et interactions | script.js |
| Formulaire de contact | contact.html |
| Textes juridiques traduits | legal-translations.js et les deux pages HTML correspondantes |
| Lien public de la newsletter | site-config.js |

Pour changer un texte, mettre aussi à jour ses traductions. Ne pas remplacer seulement le texte visible : JavaScript recharge les valeurs traduites. Faire un changement ciblé, le vérifier, puis le sauvegarder dans GitHub Desktop avant la passe suivante.

## Rideau et photographies

- `assets/background.webp` est le fond servi au visiteur. Dimensions : 1672 × 941, cadrage proportionnel avec cover.
- `assets/background.png` reste le fichier source. Modifier le PNG seul ne met pas à jour le WebP : exporter de nouveau le WebP après un changement de rideau.
- Les sources Histoire sont `assets/histoire1.jpg` à `assets/histoire6.jpg`. Les variantes PNG, WebP et JPEG sont aussi prévues par le chargement existant.
- Les cinq fichiers histoire2 à histoire6 manquent encore. L'image histoire1 présente dans le dossier est masquée comme les autres par le mode de maquette.
- Quand les six photos sont prêtes et approuvées, retirer `data-story-preview` du body dans histoire.html. Vérifier tous les recadrages et compléter les textes alternatifs pertinents. Ne pas changer les textes du récit.

## Activer la newsletter simplement

1. Créer un compte Brevo et une liste dédiée à LEVCHIN.
2. Dans Marketing > Formulaires, créer un formulaire d'inscription avec confirmation par email. Configurer l'expéditeur, les informations de confidentialité et la protection antispam proposées par Brevo.
3. Personnaliser le formulaire dans la continuité du site : noir, Montserrat si disponible, couleurs sobres. Vérifier aussi la confirmation et la désinscription.
4. Copier le **lien public HTTPS de partage** du formulaire dans `newsletterUrl` dans site-config.js. Ce lien n'est pas une clé API.
5. Le formulaire noir reste dans LEVCHIN : le visiteur saisit son email et clique sur le bouton encadré « S'INSCRIRE ». L'envoi est transmis à Brevo sans changer de page. Les états d'envoi, de réponse positive et d'erreur apparaissent sous le champ. L'adresse n'est pas enregistrée dans le stockage du navigateur.
6. Faire une vraie inscription avec une adresse de test que vous contrôlez : vérifier l'email, la confirmation, l'apparition dans la bonne liste et la désinscription. Tant que ce test n'a pas été réalisé, ne pas considérer l'intégration comme validée.

L'intégration utilise les champs du formulaire public actuel : EMAIL, email_address_check (antispam) et locale. Si le formulaire Brevo est modifié, notamment avec un CAPTCHA ou un champ obligatoire supplémentaire, mettre à jour l'intégration à partir de son nouveau code HTML avant publication. Les règles de confirmation sont gérées dans Brevo. Le message du site confirme uniquement la transmission acceptée par Brevo, pas la validation de l'adresse email. Ne jamais ajouter une clé API dans le HTML ou JavaScript.

Documentation : [création du formulaire Brevo](https://help.brevo.com/hc/en-us/articles/208771869-Create-a-sign-up-form-in-Brevo).

## Contact et préparation du lancement

Le formulaire Contact prépare un email dans l'application de messagerie du visiteur. Il **ne transmet pas automatiquement** un message à un serveur. L'envoi doit être confirmé dans la messagerie. Un service de réception dédié sera nécessaire pour un envoi direct, notamment pour les visiteurs sans application mail configurée.

Avant publication à des partenaires :

- Compléter les champs entre crochets des mentions légales et de la politique de confidentialité, dans les textes français et traduits. Faire valider les informations selon la situation réelle du projet.
- Le domaine définitif confirmé est levchin.fr. Les balises de partage, les URL canoniques et sitemap.xml utilisent cette adresse. Vérifier son raccordement réel à l'hébergement avant le lancement.
- Vérifier que contact@levchin.fr reçoit réellement les messages.
- Finaliser les photographies Histoire et vérifier que les affirmations sur la fabrication et les matériaux sont justifiables.
- Tester les liens, la newsletter, le contact, les traductions, le clavier et la navigation Histoire. Aucune publication n'est déclenchée par les modifications locales.

## Brief pour les prochaines modifications

> Travaille sur le site existant LEVCHIN, destiné à présenter la maison et recevoir des contacts et inscriptions. Lis AGENTS.md et les règles actuelles avant de modifier. Objectif précis : [un résultat observable]. Périmètre : [page ou composant]. Préserve les textes, les traductions, Montserrat, le noir et les compositions déjà validées. Réutilise les règles existantes ; n'ajoute ni décoration ni fonctionnalité sans usage réel. Donne les états d'erreur et le fonctionnement sans service connecté. Vérifie 320, 390, 430, 768, 1024, 1366 et 1920 px, ainsi que le paysage et le clavier. Fournis les changements, les limites de vérification et le Summary GitHub Desktop.

La méthode compte plus qu'un « prompt magique » : besoin précis, public identifié, contraintes visuelles et vérification. Voir [Vercel : construire un prompt précis](https://vercel.com/blog/how-to-prompt-v0). Pour préserver une identité cohérente avec des outils IA, le travail sur le système de design et les besoins réels est aussi discuté par [Brad et Ian Frost avec Chris Coyier et Dave Rupert](https://shoptalkshow.com/713/).

Les optimisations d'images suivent les principes de [web.dev](https://web.dev/learn/performance/image-performance) ; les retours de formulaires et les erreurs doivent être explicites et accessibles, comme le décrit le [W3C WAI](https://www.w3.org/WAI/tutorials/forms/notifications/).
