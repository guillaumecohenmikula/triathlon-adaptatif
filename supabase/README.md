# Synchronisation

L'app reste **locale d'abord** : tout est écrit dans IndexedDB, et la synchronisation
pousse puis tire en arrière-plan quand le réseau est là. Sans connexion, rien ne casse.

## Mise en route, une seule fois

1. Ouvrir le projet Supabase **cockpit**, éditeur SQL, coller `schema.sql`, exécuter.
2. Vérifier dans **Authentication → Providers** que « Allow new users to sign up » est
   **désactivé**. Le dépôt est public, donc la clé anonyme l'est aussi : sans cette
   fermeture, n'importe qui pourrait créer un compte sur le projet.
3. Renseigner les deux valeurs publiques dans un fichier `.env.local` à la racine :

   ```
   VITE_SUPABASE_URL=https://xxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJ...
   ```

4. Pour que le déploiement les connaisse aussi :
   `gh secret set VITE_SUPABASE_URL` et `gh secret set VITE_SUPABASE_ANON_KEY`.

## Ce qui est sûr et ce qui ne l'est pas

La **clé anonyme est publique par conception** et se retrouvera dans le bundle : c'est
normal, elle ne donne accès à rien sans être authentifié, la barrière réelle est la RLS.
La **clé de service ne doit jamais** apparaître ici, ni dans le code, ni dans le chat.

## Résolution des conflits

Le plus récent gagne, **enregistrement par enregistrement** et non fichier entier. Modifier
les réglages sur le téléphone et noter une séance sur l'ordinateur ne se marchent pas dessus.
Modifier **le même** enregistrement sur deux appareils hors ligne fait gagner celui qui se
synchronise en dernier : c'est la limite assumée de cette approche.
