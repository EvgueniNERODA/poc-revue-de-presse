# Configuration Resend - Envoi Automatique d'Email

Cette solution utilise **Resend** pour l'envoi automatique d'emails, sans configuration SMTP complexe.


## Configuration

### 1. Créer un compte Resend

1. Allez sur [resend.com](https://resend.com)
2. Créez un compte gratuit
3. Vérifiez votre domaine ou utilisez `onboarding@resend.dev`

### 2. Obtenir la clé API

1. Dans le dashboard Resend, allez dans "API Keys"
2. Créez une nouvelle clé API
3. Copiez la clé (commence par `re_`)

### 3. Configuration des Variables d'Environnement

#### Local (.env.local)
```bash
RESEND_API_KEY=re_xxxxxxxxxxxx
```

#### Vercel Dashboard
1. Allez dans votre projet Vercel
2. Settings > Environment Variables
3. Ajoutez :
   - **Name** : `RESEND_API_KEY`
   - **Value** : `re_xxxxxxxxxxxx`
   - **Environment** : Production (et Preview si nécessaire)

## Configuration dans l'Application

1. **Ouvrez les Paramètres** (icône engrenage)
2. **Onglet "Système"** / **"Général"**
3. **Section "Paramètres Email"** :
   - **Notification Email** : Activez
   - **Adresse Email** : L'adresse qui recevra les rapports
   - **Sujet de l'Email** : (optionnel)
   - **Corps de l'Email** : (optionnel)

## Utilisation

### Envoi Automatique
1. Configurez l'email dans les paramètres
2. Générez un rapport
3. L'email sera envoyé automatiquement à la fin

### Envoi Manuel
1. Une fois le rapport généré
2. Cliquez sur l'icône **Export** (téléchargement)
3. Sélectionnez **"Envoyer par Email"**

## Contenu de l'Email

L'email contient :
- **Sujet** : Personnalisable ou automatique
- **Corps** : Message personnalisable
- **Rapport** : Contenu complet au format HTML
- **Sources** : Liens vers les sources utilisées

## 🔍 Dépannage

### Erreurs Courantes

**"Configuration Resend manquante"**
- Vérifiez que `RESEND_API_KEY` est définie

**"Erreur d'authentification"**
- Vérifiez que la clé API est correcte
- Assurez-vous que le compte Resend est actif

**"Erreur d'envoi"**
- Vérifiez l'adresse email de destination
- Consultez les logs Resend dans le dashboard
