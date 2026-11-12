# Notification de repos sur iPhone
One More programme une alarme Cloudflare au démarrage du repos. Le Worker envoie le message à ntfy, même après verrouillage du téléphone. Une connexion réseau est nécessaire pour transmettre un démarrage, une prolongation ou une annulation. La livraison dépend aussi du réseau et des réglages de notifications d’iOS.

1. Dans ntfy sur l’iPhone, abonne-toi sur ntfy.sh à un nouveau topic personnel long et aléatoire. Autorise les notifications ntfy.
2. Dans VS Code, ouvre un terminal dans le dossier notification, avec Node.js installé. Connecte-toi à un compte Cloudflare Workers Free avec `npx wrangler login`. Exécute `npx wrangler deploy` et copie l’URL HTTPS workers.dev.
3. Lance séparément les quatre commandes suivantes. Colle chaque valeur à l’invite. SUPABASE_URL est l’URL du projet sans barre finale, SUPABASE_KEY sa clé publique anon ou publishable, OWNER_ID l’UUID de ton compte (Supabase → Authentication → Users), NTFY_TOPIC le nom du topic choisi.

    npx wrangler secret put SUPABASE_URL
    npx wrangler secret put SUPABASE_KEY
    npx wrangler secret put OWNER_ID
    npx wrangler secret put NTFY_TOPIC

4. À la fin de ton config.js déjà configuré, ajoute la ligne suivante, en remplaçant l’adresse par celle du Worker.

    window.REPERE_CONFIG.restAlertUrl = "https://one-more-repos.TON-COMPTE.workers.dev";

5. Publie le contenu de one-more à ton adresse habituelle. Ouvre One More en ligne, connecté à Supabase, règle un repos de 30 secondes et valide une série. Verrouille le téléphone et vérifie la réception. Teste ensuite « +15 s » et « Reprendre ». Si la modification se fait hors ligne, la dernière alarme reçue par le serveur peut encore sonner.
