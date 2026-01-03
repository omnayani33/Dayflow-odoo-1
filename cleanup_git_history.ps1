# 🔥 Git History Cleanup Script
# WARNING: This will rewrite Git history. Backup your repo first!

Write-Host "════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "    Git History Cleanup - Remove Exposed Secrets" -ForegroundColor Yellow
Write-Host "════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

$EXPOSED_SECRET = "django-insecure-9obaaiw!85khy+w%w$flwnsm6u=i&1l9nl3mscc5_n&`$av5(z&"
$REPO_PATH = "F:\odoohack\Dayflow-odoo-1"
$BACKUP_PATH = "F:\odoohack\Dayflow-odoo-1-backup"

Write-Host "⚠️  WARNING: This script will:" -ForegroundColor Red
Write-Host "   1. Backup your repository" -ForegroundColor Yellow
Write-Host "   2. Rewrite Git history to remove exposed secrets" -ForegroundColor Yellow
Write-Host "   3. Force push to GitHub (CANNOT BE UNDONE)" -ForegroundColor Yellow
Write-Host ""

$confirmation = Read-Host "Do you want to proceed? Type 'YES' to continue"

if ($confirmation -ne "YES") {
    Write-Host "❌ Aborted by user" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "📦 Step 1: Creating backup..." -ForegroundColor Cyan

if (Test-Path $BACKUP_PATH) {
    Write-Host "⚠️  Backup already exists at $BACKUP_PATH" -ForegroundColor Yellow
    $overwrite = Read-Host "Overwrite? (y/n)"
    if ($overwrite -eq "y") {
        Remove-Item -Path $BACKUP_PATH -Recurse -Force
    } else {
        Write-Host "❌ Aborted - please remove or rename existing backup" -ForegroundColor Red
        exit 1
    }
}

Copy-Item -Path $REPO_PATH -Destination $BACKUP_PATH -Recurse
Write-Host "✅ Backup created at: $BACKUP_PATH" -ForegroundColor Green

Write-Host ""
Write-Host "🔍 Step 2: Checking for exposed secret in current files..." -ForegroundColor Cyan

Set-Location $REPO_PATH
$currentMatches = git grep $EXPOSED_SECRET

if ($currentMatches) {
    Write-Host "❌ ERROR: Secret still found in current files!" -ForegroundColor Red
    Write-Host $currentMatches
    Write-Host "Please remove it manually first, then run this script again." -ForegroundColor Yellow
    exit 1
} else {
    Write-Host "✅ Secret not found in current working tree" -ForegroundColor Green
}

Write-Host ""
Write-Host "📜 Step 3: Checking Git history..." -ForegroundColor Cyan

$historyMatches = git log -S $EXPOSED_SECRET --oneline --all
if ($historyMatches) {
    Write-Host "⚠️  Found secret in these commits:" -ForegroundColor Yellow
    Write-Host $historyMatches
    Write-Host ""
} else {
    Write-Host "✅ Secret not found in Git history!" -ForegroundColor Green
    Write-Host "Your repository is already clean. No cleanup needed!" -ForegroundColor Green
    exit 0
}

Write-Host ""
Write-Host "🧹 Step 4: Choose cleanup method:" -ForegroundColor Cyan
Write-Host "   1. git-filter-repo (Recommended - requires installation)" -ForegroundColor White
Write-Host "   2. Interactive rebase (Manual - for recent commits only)" -ForegroundColor White
Write-Host "   3. Exit and clean manually" -ForegroundColor White
Write-Host ""

$method = Read-Host "Select method (1, 2, or 3)"

switch ($method) {
    "1" {
        Write-Host ""
        Write-Host "Installing git-filter-repo..." -ForegroundColor Cyan
        
        try {
            pip install git-filter-repo
            Write-Host "✅ git-filter-repo installed" -ForegroundColor Green
        } catch {
            Write-Host "❌ Failed to install git-filter-repo" -ForegroundColor Red
            Write-Host "Install manually: pip install git-filter-repo" -ForegroundColor Yellow
            exit 1
        }
        
        Write-Host ""
        Write-Host "Creating replacement file..." -ForegroundColor Cyan
        $replacementFile = "$REPO_PATH\replacement.txt"
        "$EXPOSED_SECRET==>REDACTED_SECRET_KEY" | Out-File -FilePath $replacementFile -Encoding utf8
        
        Write-Host "Running git-filter-repo..." -ForegroundColor Cyan
        git filter-repo --replace-text $replacementFile --force
        
        Remove-Item $replacementFile
        
        Write-Host "✅ History rewritten" -ForegroundColor Green
        
        Write-Host ""
        Write-Host "📤 Step 5: Force pushing to GitHub..." -ForegroundColor Cyan
        Write-Host "⚠️  This will overwrite remote history!" -ForegroundColor Yellow
        
        $pushConfirm = Read-Host "Continue? (y/n)"
        if ($pushConfirm -eq "y") {
            git remote add origin https://github.com/omnayani33/Dayflow-odoo-1.git 2>$null
            git push origin --force --all
            git push origin --force --tags
            Write-Host "✅ Force pushed to GitHub" -ForegroundColor Green
        } else {
            Write-Host "⏸️  Skipped push. Run manually: git push origin --force --all" -ForegroundColor Yellow
        }
    }
    
    "2" {
        Write-Host ""
        Write-Host "📝 Manual Interactive Rebase Instructions:" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "1. Count how many commits back the secret was introduced" -ForegroundColor White
        Write-Host "2. Run: git rebase -i HEAD~N  (replace N with commit count)" -ForegroundColor Yellow
        Write-Host "3. Mark commits containing the secret as 'edit'" -ForegroundColor White
        Write-Host "4. When stopped at each commit:" -ForegroundColor White
        Write-Host "   - Edit backend/dayflow/settings.py" -ForegroundColor White
        Write-Host "   - Remove the hard-coded secret" -ForegroundColor White
        Write-Host "   - git add backend/dayflow/settings.py" -ForegroundColor Yellow
        Write-Host "   - git commit --amend --no-edit" -ForegroundColor Yellow
        Write-Host "   - git rebase --continue" -ForegroundColor Yellow
        Write-Host "5. After rebase: git push origin backend-core --force" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Commits containing the secret:" -ForegroundColor Cyan
        git log -S $EXPOSED_SECRET --oneline --all
    }
    
    "3" {
        Write-Host "Exiting. Refer to SECURITY_FIX.md for manual instructions." -ForegroundColor Yellow
        exit 0
    }
    
    default {
        Write-Host "❌ Invalid selection" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "🔍 Step 6: Verifying cleanup..." -ForegroundColor Cyan

$verifyHistory = git log -S $EXPOSED_SECRET --oneline --all
if ($verifyHistory) {
    Write-Host "⚠️  Secret still found in history!" -ForegroundColor Red
    Write-Host $verifyHistory
    Write-Host "Cleanup may have failed. Check SECURITY_FIX.md for alternative methods." -ForegroundColor Yellow
} else {
    Write-Host "✅ Secret successfully removed from Git history!" -ForegroundColor Green
}

Write-Host ""
Write-Host "════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "                  CLEANUP COMPLETE" -ForegroundColor Green
Write-Host "════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Rotate the SECRET_KEY in your .env file" -ForegroundColor White
Write-Host "2. Notify team members to pull latest changes" -ForegroundColor White
Write-Host "3. Ensure all team members create their own .env file" -ForegroundColor White
Write-Host "4. Mark the GitGuardian alert as resolved" -ForegroundColor White
Write-Host ""
Write-Host "📚 Documentation: See SECURITY_FIX.md" -ForegroundColor Cyan
Write-Host "💾 Backup location: $BACKUP_PATH" -ForegroundColor Cyan
Write-Host ""
