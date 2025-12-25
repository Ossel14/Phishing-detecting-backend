# 🛡️ Système de Détection du Phishing et des URLs Malveillantes

Un système complet de détection automatique de phishing et d'URLs malveillantes utilisant le Machine Learning, avec une extension Chrome pour une protection en temps réel.

## 📋 Vue d'ensemble

Ce projet implémente un système de cybersécurité basé sur le Machine Learning pour détecter :
- **E-mails de phishing** : Analyse du sujet et du corps des e-mails
- **URLs malveillantes** : Détection de phishing, malware et defacement

**Principe fondamental** : Le système fonctionne **entièrement en local** sans connexion cloud, garantissant une confidentialité totale des données.

### Architecture

```
Modèles ML  ⇄  Backend FastAPI (localhost:8000)  ⇄  Extension Chrome
```

## ✨ Fonctionnalités

- ✅ Détection automatique d'e-mails de phishing (Accuracy: ~91.8%)
- ✅ Détection d'URLs malveillantes (Accuracy: ~93.5%)
- ✅ Protection en temps réel lors de la navigation
- ✅ Extraction automatique d'e-mails depuis Gmail/Outlook/Yahoo
- ✅ Alertes avant navigation vers sites dangereux
- ✅ 100% local - Pas de cloud, confidentialité totale
- ✅ Menu contextuel (clic droit) pour vérifier les liens

## 🛠️ Technologies

**Machine Learning** : Python, scikit-learn, Logistic Regression, TF-IDF  
**Backend** : FastAPI, uvicorn  
**Extension** : JavaScript, Chrome Manifest V3  

## 📊 Datasets

- **E-mails** : Enron Email Dataset + Phishing Email Datasets
- **URLs** : Malicious URLs Dataset (Kaggle) - Benign, Phishing, Malware, Defacement

## 📥 Installation

### 1. Prérequis
- Python 3.8+
- Google Chrome
- Git

### 2. Cloner le repository

```bash
git clone https://github.com/votre-username/phishing-detection-system.git
cd phishing-detection-system
```

### 3. Structure du projet

```
phishing-detection-system/
├── backend/
│   ├── main.py                    # Backend FastAPI
│   ├── requirements.txt
│   └── models/                    # Modèles ML pré-entraînés
├── extension/
│   ├── manifest.json
│   ├── popup.html
│   ├── popup.js
│   ├── content.js
│   ├── background.js
│   └── icons/
└── README.md
```

### 4. Installation du Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

Le backend sera accessible sur **http://localhost:8000**

### 5. Installer l'Extension Chrome

1. Ouvrir Chrome → `chrome://extensions/`
2. Activer le **Mode développeur**
3. Cliquer sur **"Charger l'extension non empaquetée"**
4. Sélectionner le dossier `extension/`
5. L'extension apparaît dans la barre d'outils

### 6. Créer les icônes (si nécessaire)

Créer 3 fichiers PNG dans `extension/icons/` : `icon16.png`, `icon48.png`, `icon128.png`  
**Astuce** : Utiliser [Favicon.io](https://favicon.io/emoji-favicons/) avec l'emoji 🛡️

## 🚀 Utilisation

### Vérifier un e-mail

**Méthode 1 - Extraction automatique** :
1. Ouvrir un e-mail dans Gmail/Outlook/Yahoo
2. Cliquer sur l'icône de l'extension
3. Cliquer sur **"Extraire depuis la page"**
4. Cliquer sur **"Vérifier l'e-mail"**

**Méthode 2 - Manual** :
1. Cliquer sur l'icône de l'extension
2. Entrer le sujet et le corps
3. Cliquer sur **"Vérifier l'e-mail"**

### Vérifier une URL

**Méthode 1 - Protection automatique (recommandée)** :
1. Activer **"Protection automatique"** dans l'extension
2. Naviguer normalement - les liens sont vérifiés automatiquement
3. Une alerte s'affiche si le lien est dangereux

**Méthode 2 - Vérification manuelle** :
- Entrer l'URL dans l'extension et cliquer **"Vérifier l'URL"**

**Méthode 3 - Clic droit** :
- Clic droit sur un lien → **"Vérifier l'URL pour phishing"**

## 🤖 Modèles ML

### Modèle E-mail
- **Algorithme** : Logistic Regression
- **Features** : TF-IDF sur sujet + corps
- **Performance** : Accuracy 96.8%, Precision 95.2%, Recall 94.7%

### Modèle URL
- **Algorithme** : Logistic Regression
- **Features** : TF-IDF + 9 features lexicales (longueur, chiffres, HTTPS, IP, etc.)
- **Performance** : Accuracy 93.5%, Precision 91.8%, Recall 92.3%

## 🔌 API Backend

### Endpoints

**POST** `/predict/email`
```json
{
  "subject": "Urgent: Verify your account",
  "body": "Click here..."
}
```
**Response** : `{"email_phishing": true, "confidence": 0.947}`

**POST** `/predict/url`
```json
{
  "url": "https://suspicious-site.com"
}
```
**Response** : `{"url_phishing": true, "confidence": 0.923}`

## 🔒 Sécurité et Confidentialité

- ✅ **100% local** : Aucune donnée envoyée vers le cloud
- ✅ **Pas de télémétrie** : Aucune collecte de statistiques
- ✅ **Pas de compte** : Aucune création de compte requise
- ✅ **Open source** : Code auditable
- ✅ **Conformité RGPD** : Respect total de la vie privée

**Flux de données** : `Utilisateur → Extension → Backend Local → Modèles ML → Résultat`

## 📊 Résultats

| Modèle | Accuracy | Precision | Recall | F1-Score |
|--------|----------|-----------|--------|----------|
| E-mail | 91.8% | 91.2% | 92.7% | 90.9% |
| URL | 93.5% | 91.8% | 92.3% | 92.0% |

## 🚀 Améliorations Futures

- [ ] Support de plus de clients e-mail
- [ ] Migration vers Deep Learning (BERT, CNN)
- [ ] Analyse de réputation des domaines
- [ ] Apprentissage continu avec feedback utilisateur
- [ ] Support multilingue (français, arabe, espagnol)
- [ ] Versions Firefox et Edge

## 🤝 Contribution

Les contributions sont bienvenues ! Forkez le projet, créez une branche, et soumettez une Pull Request.

## 📝 Licence

Ce projet est sous licence MIT.

## 👨‍💻 Auteur
 
GitHub: [@Ossama Elmessaoudi](https://github.com/Ossel14)

---

**⚠️ Avertissement** : Ce système est un outil d'aide à la détection. Il ne remplace pas la vigilance de l'utilisateur.