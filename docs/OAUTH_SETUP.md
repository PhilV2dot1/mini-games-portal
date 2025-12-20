# Guide de Configuration OAuth pour Celo Games Portal

Ce guide vous accompagne dans la configuration de l'authentification OAuth avec Google et Twitter pour votre application.

## Prérequis

- Un projet Supabase créé et configuré
- Accès aux variables d'environnement (`NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
- Migration SQL `003_user_profiles_and_auth.sql` exécutée

---

## 🔵 Configuration Google OAuth

### Étape 1 : Créer un Projet Google Cloud

1. **Accédez à Google Cloud Console**
   - Allez sur [console.cloud.google.com](https://console.cloud.google.com)
   - Connectez-vous avec votre compte Google

2. **Créer un nouveau projet**
   - Cliquez sur le sélecteur de projet en haut
   - Cliquez sur "Nouveau projet"
   - Nom du projet : `Celo Games Portal` (ou votre choix)
   - Cliquez sur "Créer"

### Étape 2 : Configurer l'écran de consentement OAuth

1. **Navigation**
   - Menu ≡ → "APIs et services" → "Écran de consentement OAuth"

2. **Type d'utilisateur**
   - Sélectionnez "Externe" (pour permettre à tout le monde de se connecter)
   - Cliquez sur "Créer"

3. **Informations de l'application**
   - **Nom de l'application** : `Celo Games Portal`
   - **E-mail d'assistance utilisateur** : Votre email
   - **Logo de l'application** : (Optionnel)
   - **Domaine de l'application** : Votre domaine (ex: `celo-games.vercel.app`)
   - **E-mail du développeur** : Votre email
   - Cliquez sur "Enregistrer et continuer"

4. **Champs d'application (Scopes)**
   - Cliquez sur "Ajouter ou supprimer des champs d'application"
   - Sélectionnez :
     - `userinfo.email`
     - `userinfo.profile`
   - Cliquez sur "Mettre à jour" puis "Enregistrer et continuer"

5. **Utilisateurs test** (en mode développement)
   - Ajoutez votre email et ceux des testeurs
   - Cliquez sur "Enregistrer et continuer"

6. **Résumé**
   - Vérifiez les informations
   - Cliquez sur "Retour au tableau de bord"

### Étape 3 : Créer les Identifiants OAuth

1. **Navigation**
   - "APIs et services" → "Identifiants"
   - Cliquez sur "+ Créer des identifiants"
   - Sélectionnez "ID client OAuth"

2. **Configuration**
   - **Type d'application** : `Application Web`
   - **Nom** : `Celo Games Portal Web Client`

3. **URIs de redirection autorisés**

   Récupérez votre URL Supabase depuis votre dashboard Supabase (Settings → API → URL)

   Ajoutez cette URL (remplacez `[VOTRE-PROJET]` par votre ID de projet Supabase) :
   ```
   https://[VOTRE-PROJET].supabase.co/auth/v1/callback
   ```

   **Exemple** : Si votre Supabase URL est `https://abcdefghijklmn.supabase.co`, alors :
   ```
   https://abcdefghijklmn.supabase.co/auth/v1/callback
   ```

4. **Créer**
   - Cliquez sur "Créer"
   - **IMPORTANT** : Copiez le `Client ID` et le `Client Secret` affichés

### Étape 4 : Configurer Google dans Supabase

1. **Accédez à votre Dashboard Supabase**
   - Allez sur [app.supabase.com](https://app.supabase.com)
   - Sélectionnez votre projet

2. **Navigation**
   - Menu latéral : "Authentication" → "Providers"
   - Trouvez "Google" dans la liste

3. **Configuration**
   - Activez le toggle "Enable Google"
   - **Client ID** : Collez le Client ID de Google
   - **Client Secret** : Collez le Client Secret de Google
   - Cliquez sur "Save"

### Étape 5 : Tester l'intégration Google

1. Lancez votre application : `npm run dev`
2. Cliquez sur "Créer un compte" ou "Connexion"
3. Cliquez sur le bouton "Continuer avec Google"
4. Vous devriez être redirigé vers la page de connexion Google
5. Après autorisation, vous serez redirigé vers votre application

---

## 🐦 Configuration Twitter OAuth

### Étape 1 : Créer une Application Twitter

1. **Accédez au Developer Portal**
   - Allez sur [developer.twitter.com/en/portal/dashboard](https://developer.twitter.com/en/portal/dashboard)
   - Connectez-vous avec votre compte Twitter

2. **Créer un projet** (si vous n'en avez pas)
   - Cliquez sur "+ Create Project"
   - **Nom du projet** : `Celo Games Portal`
   - **Use case** : Sélectionnez "Making a bot" ou "Exploring the API"
   - **Description** : Brève description de votre projet
   - Cliquez sur "Next"

3. **Créer une App**
   - **App name** : `celo-games-auth`
   - Cliquez sur "Complete"

### Étape 2 : Configurer les Permissions OAuth

1. **Accédez aux paramètres de l'app**
   - Dans la liste des apps, cliquez sur l'icône ⚙️ (Settings) de votre app

2. **Configuration de l'App**
   - Allez dans l'onglet "Settings"
   - Faites défiler jusqu'à "User authentication settings"
   - Cliquez sur "Set up"

3. **Permissions**
   - **App permissions** : Sélectionnez "Read"
   - **Type of App** : Sélectionnez "Web App, Automated App or Bot"

4. **App info**
   - **Callback URI / Redirect URL** :
     ```
     https://[VOTRE-PROJET].supabase.co/auth/v1/callback
     ```
     (Même URL que pour Google)

   - **Website URL** : L'URL de votre application (ex: `https://celo-games.vercel.app`)

   - Cliquez sur "Save"

### Étape 3 : Récupérer les Clés API

1. **Keys and tokens**
   - Allez dans l'onglet "Keys and tokens" de votre app

2. **OAuth 2.0**
   - Trouvez la section "OAuth 2.0 Client ID and Client Secret"
   - Cliquez sur "Generate" si pas encore généré
   - **IMPORTANT** : Copiez le `Client ID` et le `Client Secret`
   - ⚠️ Le Client Secret ne sera affiché qu'une fois !

### Étape 4 : Configurer Twitter dans Supabase

1. **Dashboard Supabase**
   - "Authentication" → "Providers"
   - Trouvez "Twitter" dans la liste

2. **Configuration**
   - Activez le toggle "Enable Twitter"
   - **API Key (Consumer Key)** : Collez le Client ID de Twitter
   - **API Secret Key (Consumer Secret)** : Collez le Client Secret de Twitter
   - Cliquez sur "Save"

### Étape 5 : Tester l'intégration Twitter

1. Relancez votre application : `npm run dev`
2. Cliquez sur "Créer un compte" ou "Connexion"
3. Cliquez sur "Continuer avec Twitter"
4. Autorisez l'application sur Twitter
5. Vous serez redirigé vers votre application

---

## 🔧 Dépannage (Troubleshooting)

### Erreur : "Redirect URI mismatch"

**Cause** : L'URL de callback ne correspond pas exactement

**Solution** :
1. Vérifiez que l'URL dans Google/Twitter correspond EXACTEMENT à celle de Supabase
2. Format attendu : `https://[projet-id].supabase.co/auth/v1/callback`
3. Pas de slash `/` à la fin
4. Doit commencer par `https://`

### Erreur : "Invalid client"

**Cause** : Client ID ou Secret incorrect

**Solution** :
1. Revérifiez les clés copiées (pas d'espaces avant/après)
2. Régénérez de nouvelles clés si nécessaire
3. Attendez quelques minutes après la configuration (propagation)

### L'utilisateur n'est pas créé dans la base de données

**Cause** : L'endpoint `/api/auth/signup` n'est pas appelé automatiquement

**Solution** :
1. Vérifiez que la migration SQL est bien exécutée
2. Créez un trigger Supabase pour auto-créer les utilisateurs :

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, auth_user_id, auth_provider, is_anonymous, username)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.id::text,
    COALESCE(NEW.raw_app_meta_data->>'provider', 'email'),
    false,
    COALESCE(NEW.email, 'Player_' || substring(NEW.id::text, 1, 8))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### Le bouton OAuth ne fait rien

**Cause** : Variables d'environnement manquantes ou erreur dans le code

**Solution** :
1. Vérifiez `.env.local` contient bien `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY`
2. Relancez le serveur après modification des variables d'environnement
3. Vérifiez la console navigateur pour les erreurs JavaScript

---

## 📝 Variables d'Environnement Requises

Votre fichier `.env.local` doit contenir :

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://[votre-projet].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_cle_anon_publique
SUPABASE_SERVICE_ROLE_KEY=votre_cle_service_role_secrete

# Supabase Storage (optionnel pour avatars)
NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET=user-avatars
```

---

## ✅ Checklist de Configuration

### Google OAuth
- [ ] Projet Google Cloud créé
- [ ] Écran de consentement OAuth configuré
- [ ] Identifiants OAuth créés (Client ID + Secret)
- [ ] URL de callback ajoutée dans Google Cloud Console
- [ ] Client ID et Secret configurés dans Supabase
- [ ] Provider Google activé dans Supabase

### Twitter OAuth
- [ ] App Twitter créée sur Developer Portal
- [ ] User authentication settings configurés
- [ ] Callback URL ajoutée dans les paramètres Twitter
- [ ] Client ID et Secret récupérés
- [ ] API Key et Secret configurés dans Supabase
- [ ] Provider Twitter activé dans Supabase

### Application
- [ ] Migration SQL exécutée
- [ ] Variables d'environnement configurées
- [ ] Application redémarrée après config
- [ ] Test de connexion Google réussi
- [ ] Test de connexion Twitter réussi

---

## 🎯 Prochaines Étapes

Après configuration réussie :

1. **Mode Production** :
   - Passez l'écran de consentement Google en mode "Production"
   - Ajoutez votre domaine de production dans les callbacks

2. **Sécurité** :
   - Ne committez JAMAIS les Client Secrets dans Git
   - Utilisez les variables d'environnement Vercel/Netlify pour production

3. **Personnalisation** :
   - Personnalisez les logos dans l'écran de consentement
   - Ajoutez des conditions d'utilisation et politique de confidentialité

---

## 📚 Ressources Utiles

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Twitter OAuth 2.0 Documentation](https://developer.twitter.com/en/docs/authentication/oauth-2-0)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)

---

## 💡 Conseils

1. **Testez d'abord avec un seul provider** (Google recommandé) avant de configurer les deux
2. **Utilisez le mode Incognito** du navigateur pour tester différents comptes
3. **Vérifiez les logs Supabase** (Authentication → Logs) en cas d'erreur
4. **Attendez 2-3 minutes** après configuration pour que les changements se propagent
