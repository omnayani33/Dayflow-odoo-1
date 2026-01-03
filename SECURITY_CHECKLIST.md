# 🔐 Django Security Checklist

## Current Status: ✅ SECURED (Pending Git History Cleanup)

---

## ✅ Completed Security Improvements

### Environment Variables
- [x] Installed `python-decouple` for secure configuration management
- [x] Created `.env` file for local secrets (gitignored)
- [x] Created `.env.example` template for team
- [x] Updated `settings.py` to load from environment variables
- [x] Enhanced `.gitignore` to prevent secret leaks

### Configuration Secured
- [x] `SECRET_KEY` - Now loaded from environment
- [x] `DEBUG` - Now loaded from environment
- [x] `ALLOWED_HOSTS` - Now loaded from environment
- [x] `EMAIL_HOST_PASSWORD` - Configured for environment loading
- [x] JWT token lifetimes - Configurable via environment

---

## 🚨 CRITICAL: Actions Required NOW

### 1. Clean Git History (MUST DO!)
The old secret still exists in Git history. Choose one method:

#### **Method A: git-filter-repo (Recommended)**
```bash
# Install
pip install git-filter-repo

# Backup first
cd F:\odoohack\Dayflow-odoo-1
git clone . ../Dayflow-odoo-1-backup

# Remove secret from all commits
git filter-repo --replace-text <(echo 'django-insecure-9obaaiw!85khy+w%w$flwnsm6u=i&1l9nl3mscc5_n&$av5(z&==>REDACTED')

# Force push
git push origin --force --all
```

#### **Method B: Rebase Recent Commits**
If secret is only in last few commits:
```bash
# Rebase last 10 commits
git rebase -i HEAD~10

# Mark commits with secrets as 'edit'
# When stopped, edit settings.py, then:
git add backend/dayflow/settings.py
git commit --amend --no-edit
git rebase --continue

# Force push
git push origin backend-core --force
```

### 2. Rotate the SECRET_KEY (MUST DO!)
```bash
# Generate new key
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"

# Update backend/.env with new key
# Example: SECRET_KEY=django-insecure-NEW_KEY_HERE
```

### 3. Notify Team Members
- Tell all developers to pull latest changes
- Instruct them to create their own `.env` file from `.env.example`
- Ensure they never commit `.env` file

---

## 📋 Optional Enhancements (Recommended)

### Install Pre-Commit Hooks
Automatically scan for secrets before committing:
```bash
pip install pre-commit detect-secrets

# Create .pre-commit-config.yaml
cat > .pre-commit-config.yaml << 'EOF'
repos:
  - repo: https://github.com/Yelp/detect-secrets
    rev: v1.4.0
    hooks:
      - id: detect-secrets
        args: ['--baseline', '.secrets.baseline']
EOF

# Initialize
pre-commit install
detect-secrets scan > .secrets.baseline
```

### Enable Django Security Headers (Production)
Add to `settings.py`:
```python
if not DEBUG:
    SECURE_SSL_REDIRECT = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_HSTS_SECONDS = 31536000
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
    X_FRAME_OPTIONS = 'DENY'
    SECURE_CONTENT_TYPE_NOSNIFF = True
```

### Install GitGuardian GitHub App
Real-time secret monitoring:
https://github.com/apps/gitguardian

---

## 🔍 Verification Commands

```bash
# Verify .env is ignored
git status  # Should NOT show .env

# Check if old secret is in current files
git grep "django-insecure-9obaaiw"  # Should return nothing

# Check Git history (after cleanup)
git log -S "django-insecure-9obaaiw" --all  # Should return nothing

# Test Django loads environment variables
cd backend
python manage.py shell
>>> from django.conf import settings
>>> print(settings.SECRET_KEY)  # Should show value from .env
```

---

## 📝 Quick Reference

### For New Team Members:
```bash
# 1. Clone repo
git clone https://github.com/omnayani33/Dayflow-odoo-1.git

# 2. Create .env from template
cd Dayflow-odoo-1/backend
cp .env.example .env

# 3. Generate your own SECRET_KEY
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"

# 4. Edit .env and paste your key
nano .env

# 5. Run migrations
python manage.py migrate

# 6. Run server
python manage.py runserver
```

### For Production Deployment:
```bash
# Set environment variables on server (not .env file!)
export SECRET_KEY="your-production-secret-key"
export DEBUG="False"
export ALLOWED_HOSTS="yourdomain.com,www.yourdomain.com"
export DATABASE_URL="postgresql://user:pass@localhost/dbname"

# Or use secrets manager:
# - AWS: AWS Secrets Manager
# - Azure: Azure Key Vault
# - GCP: Secret Manager
# - Docker: Docker Secrets
```

---

## ⚡ Emergency Response Plan

If another secret is exposed:

1. **Immediately rotate the exposed credential**
2. **Remove from Git history using git-filter-repo**
3. **Force push to overwrite history**
4. **Notify all team members**
5. **Check access logs for unauthorized use**
6. **Update security documentation**

---

## 📞 Resources

- **Full Documentation:** See [SECURITY_FIX.md](SECURITY_FIX.md)
- **Django Security:** https://docs.djangoproject.com/en/6.0/topics/security/
- **OWASP Secrets:** https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html

---

**Status:** ✅ Code secured, ⏳ Awaiting Git history cleanup
