# Configuration Vercel - Celo Games Portal

## 🚀 Variables d'Environnement à Configurer

Pour que l'application fonctionne correctement sur Vercel (notamment les redirections OAuth et wallet), vous devez configurer ces variables d'environnement.

### 📝 Étapes de Configuration

**1. Accédez aux Settings de votre projet Vercel :**
- Allez sur [vercel.com](https://vercel.com)
- Sélectionnez votre projet "celo-games-portal"
- Cliquez sur **Settings** → **Environment Variables**

**2. Ajoutez les variables suivantes :**

#### Variables OBLIGATOIRES

| Variable | Valeur | Description |
|----------|--------|-------------|
| `NEXT_PUBLIC_URL` | `https://celo-games-portal.vercel.app` | URL de votre application (utilisée pour OAuth redirects) |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://qsyvcdepusoauyeacpwq.supabase.co` | URL de votre projet Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `sb_publishable_CFWCY_sLwDwtmeilVnNoyg_hTxWmTL8` | Clé publique Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | `sb_secret_o64rypzx1tQaVwaXgKzsjA_Te1Ik61c` | Clé service Supabase (⚠️ SECRET) |
| `NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET` | `user-avatars` | Bucket de stockage Supabase |

#### Variables RECOMMANDÉES

| Variable | Valeur | Description |
|----------|--------|-------------|
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | Voir instructions ci-dessous | Project ID WalletConnect (pour wallet crypto) |

### 🔐 Obtenir un WalletConnect Project ID

1. Allez sur [cloud.walletconnect.com](https://cloud.walletconnect.com)
2. Créez un compte gratuit
3. Créez un nouveau projet : "Celo Games Portal"
4. Copiez le **Project ID**
5. Ajoutez-le dans Vercel comme `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`

**⚠️ Important :** Sans ce Project ID, la connexion wallet utilisera un ID par défaut qui peut être limité.

### 🔄 Après Configuration

1. **Redéployez votre application :**
   - Dans Vercel → Deployments → ⋮ (menu) → Redeploy
   - Ou pushez un nouveau commit sur GitHub

2. **Testez les redirections :**
   - Essayez de vous connecter avec un compte
   - Vérifiez que vous restez sur `https://celo-games-portal.vercel.app`
   - Testez la connexion wallet

### 🐛 Dépannage

**Problème : Redirection vers localhost après login**
- ✅ Vérifiez que `NEXT_PUBLIC_URL` est bien configuré dans Vercel
- ✅ Redéployez l'application après avoir ajouté la variable

**Problème : Wallet connection ne fonctionne pas**
- ✅ Vérifiez que `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` est configuré
- ✅ Créez votre propre Project ID sur WalletConnect

**Problème : OAuth (Google/Twitter) ne fonctionne pas**
- ✅ Suivez le guide `OAUTH_SETUP.md`
- ✅ Configurez les providers dans Supabase Dashboard

### 📚 Ressources

- [Documentation Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Documentation Supabase](https://supabase.com/docs)
- [WalletConnect Cloud](https://cloud.walletconnect.com)
