# 🔒 Security Fix: Removing Hard-Coded Secrets from Repository

## ⚠️ GitGuardian Alert Response

This document addresses the exposed secrets in the repository and provides steps to remediate and prevent future occurrences.

---

## 🛠️ What Was Fixed

### 1. **Identified Hard-Coded Secrets**
- ❌ `SECRET_KEY` was exposed in `backend/dayflow/settings.py`
- ❌ Potential email passwords could be added without protection

### 2. **Implemented Solution**
- ✅ Installed `python-decouple` for environment variable management
- ✅ Created `.env` file for local development (gitignored)
- ✅ Created `.env.example` template for team members
- ✅ Updated `settings.py` to load secrets from environment variables
- ✅ Enhanced `.gitignore` to prevent `.env` files from being committed
- ✅ Added email configuration support with secure password handling

---

## 📋 Changes Made

### File: `backend/dayflow/settings.py`

**Before:**
```python
SECRET_KEY = "django-insecure-9obaaiw!85khy+w%w$flwnsm6u=i&1l9nl3mscc5_n&$av5(z&"
DEBUG = True
ALLOWED_HOSTS = []
```

**After:**
```python
from decouple import config, Csv

SECRET_KEY = config('SECRET_KEY', default='django-insecure-fallback-key-change-this')
DEBUG = config('DEBUG', default=True, cast=bool)
ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='localhost,127.0.0.1', cast=Csv())
```

### File: `backend/.env` (Local Development)
```env
SECRET_KEY=your-actual-secret-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
EMAIL_HOST_PASSWORD=your-email-password
```
**Note:** This file is now gitignored and will never be committed.

### File: `backend/.env.example` (Template)
Committed to repository as a template for team members to create their own `.env` file.

---

## 🚨 Git History Cleanup (CRITICAL)

The exposed secret still exists in Git history. Follow these steps to remove it:

### Option 1: Using git-filter-repo (Recommended)

1. **Install git-filter-repo:**
   ```bash
   pip install git-filter-repo
   ```

2. **Backup your repository:**
   ```bash
   cd F:\odoohack\Dayflow-odoo-1
   git clone . ../Dayflow-odoo-1-backup
   ```

3. **Remove the secret from all commits:**
   ```bash
   git filter-repo --replace-text <(echo 'django-insecure-9obaaiw!85khy+w%w$flwnsm6u=i&1l9nl3mscc5_n&$av5(z&==>REDACTED_SECRET_KEY')
   ```

4. **Force push to all branches:**
   ```bash
   git push origin --force --all
   git push origin --force --tags
   ```

### Option 2: Using BFG Repo-Cleaner (Alternative)

1. **Download BFG:**
   Download from: https://rtyley.github.io/bfg-repo-cleaner/

2. **Create a file with secrets to remove:**
   ```bash
   echo "django-insecure-9obaaiw!85khy+w%w$flwnsm6u=i&1l9nl3mscc5_n&$av5(z&" > secrets.txt
   ```

3. **Clean the repository:**
   ```bash
   java -jar bfg.jar --replace-text secrets.txt Dayflow-odoo-1.git
   ```

4. **Clean and push:**
   ```bash
   cd Dayflow-odoo-1
   git reflog expire --expire=now --all
   git gc --prune=now --aggressive
   git push origin --force --all
   ```

### Option 3: Manual Rewrite (For Recent Commits)

If the secret was only in recent commits:

```bash
# Interactive rebase to edit commits
git rebase -i HEAD~5  # Replace 5 with number of commits to review

# For each commit containing the secret, mark as 'edit'
# When stopped at each commit:
# 1. Edit the settings.py file
# 2. git add backend/dayflow/settings.py
# 3. git commit --amend --no-edit
# 4. git rebase --continue

# Force push when done
git push origin backend-core --force
```

---

## 🔄 Immediate Actions Required

### Step 1: Rotate the Secret Key
Generate a new secret key for production:

```bash
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

Update your `.env` file with the new key:
```env
SECRET_KEY=<new-generated-key>
```

### Step 2: Update GitHub Secrets (if using CI/CD)
If you're using GitHub Actions, add secrets via:
- Go to: Repository → Settings → Secrets and variables → Actions
- Add: `SECRET_KEY`, `DATABASE_PASSWORD`, `EMAIL_HOST_PASSWORD`, etc.

### Step 3: Invalidate Exposed Credentials
- ✅ Change the Django SECRET_KEY (done above)
- ✅ If email password was exposed, change it immediately
- ✅ If database credentials were exposed, rotate them
- ✅ Notify team members to update their `.env` files

### Step 4: Clean Git History (Critical!)
Follow one of the Git cleanup methods above to remove the secret from all commits.

---

## ✅ Verification Steps

After cleanup, verify the secret is gone:

```bash
# Search for the old secret in current files
git grep "django-insecure-9obaaiw"

# Search in all commits (should return nothing)
git log -S "django-insecure-9obaaiw" --all

# Check if .env is properly ignored
git status  # .env should NOT appear in untracked files
```

---

## 🛡️ Best Practices to Prevent Future Leaks

### 1. **Pre-Commit Hooks**
Install `pre-commit` with secret scanning:

```bash
pip install pre-commit detect-secrets
```

Create `.pre-commit-config.yaml`:
```yaml
repos:
  - repo: https://github.com/Yelp/detect-secrets
    rev: v1.4.0
    hooks:
      - id: detect-secrets
        args: ['--baseline', '.secrets.baseline']
```

Initialize:
```bash
pre-commit install
detect-secrets scan > .secrets.baseline
```

### 2. **Use Django Environment Checker**
Add to `settings.py`:
```python
import os
if not os.getenv('SECRET_KEY'):
    raise ValueError("SECRET_KEY environment variable is not set!")
```

### 3. **GitGuardian GitHub App**
Install GitGuardian GitHub App for real-time monitoring:
- https://github.com/apps/gitguardian

### 4. **Code Review Checklist**
Before committing:
- [ ] No passwords in code
- [ ] No API keys in code
- [ ] All secrets in `.env` file
- [ ] `.env` is in `.gitignore`
- [ ] `.env.example` is updated
- [ ] No debugging credentials left

### 5. **Separate Environments**
Always maintain separate secrets for:
- Development (`.env`)
- Staging (`.env.staging`)
- Production (server environment variables or secrets manager)

### 6. **Use Django-environ Alternative**
Consider `django-environ` for more Django-specific features:
```python
import environ
env = environ.Env()
environ.Env.read_env()
SECRET_KEY = env('SECRET_KEY')
```

---

## 📚 Team Onboarding

When a new developer joins:

1. **Clone the repository:**
   ```bash
   git clone https://github.com/omnayani33/Dayflow-odoo-1.git
   cd Dayflow-odoo-1/backend
   ```

2. **Copy environment template:**
   ```bash
   cp .env.example .env
   ```

3. **Fill in actual values:**
   ```bash
   nano .env  # or use any text editor
   ```

4. **Never commit `.env`:**
   ```bash
   git status  # Verify .env is not listed
   ```

---

## 🔐 Production Deployment Checklist

For production servers:

- [ ] Use environment variables (not `.env` files)
- [ ] Store secrets in: AWS Secrets Manager, Azure Key Vault, or HashiCorp Vault
- [ ] Set `DEBUG=False`
- [ ] Use strong, randomly generated SECRET_KEY
- [ ] Enable HTTPS only
- [ ] Configure proper `ALLOWED_HOSTS`
- [ ] Use database credentials with least privilege
- [ ] Rotate secrets regularly (every 90 days)
- [ ] Enable Django security settings:
  ```python
  SECURE_SSL_REDIRECT = True
  SESSION_COOKIE_SECURE = True
  CSRF_COOKIE_SECURE = True
  SECURE_HSTS_SECONDS = 31536000
  ```

---

## 📝 Quick Commands Reference

```bash
# Generate new Django secret key
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"

# Check for exposed secrets in current code
git grep -i "password\|secret\|key" backend/

# Search history for specific secret
git log -S "your-secret-here" --all

# Remove file from Git history
git filter-repo --path settings.py --invert-paths

# Force push after cleanup (WARNING: Only do this if you're sure!)
git push origin backend-core --force

# Verify .env is ignored
git check-ignore -v .env
```

---

## 🎯 Summary

| Action | Status | Priority |
|--------|--------|----------|
| Install python-decouple | ✅ Done | High |
| Create .env file | ✅ Done | High |
| Create .env.example | ✅ Done | Medium |
| Update settings.py | ✅ Done | High |
| Update .gitignore | ✅ Done | High |
| Clean Git history | ⏳ TODO | **CRITICAL** |
| Rotate SECRET_KEY | ⏳ TODO | **CRITICAL** |
| Install pre-commit hooks | 📝 Optional | Medium |
| Setup GitGuardian | 📝 Optional | Medium |

---

## 📞 Support Resources

- **Django Security Docs:** https://docs.djangoproject.com/en/6.0/topics/security/
- **GitGuardian Docs:** https://docs.gitguardian.com/
- **OWASP Secrets Management:** https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html
- **git-filter-repo:** https://github.com/newren/git-filter-repo

---

✅ **All code changes are complete. Now proceed with Git history cleanup!**
