# BirdID Command Reference

## Daily Workflow
Make changes on VM → push to GitHub → pull on laptop

---

## VM Commands

### Service management
```bash
sudo systemctl status birdid                 # check if running
sudo systemctl restart birdid                # restart after code change
sudo systemctl stop birdid                   # stop server
sudo systemctl start birdid                  # start server
sudo journalctl -u birdid -f                 # live logs (Ctrl+C to stop)
sudo journalctl -u birdid -n 20 --no-pager  # last 20 lines
```

### After any code change on VM
```bash
rm -rf ~/BirdID/backend/__pycache__
sudo systemctl restart birdid
sudo journalctl -u birdid -n 10 --no-pager
```

### Push to GitHub from VM
```bash
cd ~/BirdID
git remote set-url origin https://f75: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@github.com/f75/BirdID.git
git add .
git commit -m "your message here"
git push origin main
git remote set-url origin https://github.com/f75/BirdID.git
```

### Pull latest code from GitHub
```bash
cd ~/BirdID
git pull origin main
```

### Test API locally on VM
```bash
curl http://localhost:5000/health
curl -X POST http://localhost:5000/predict -F "image=@~/test_bird.jpg"
curl -X POST http://localhost:5000/predict -F "image=@~/test_bird.jpg" -F "country=USA" -F "state=CA"
```

### Python environment
```bash
source ~/birdid_venv/bin/activate            # activate virtualenv
pip install package-name                     # install new package
pip show speciesnet                          # check speciesnet version
deactivate                                   # exit virtualenv
```

### Troubleshooting
```bash
# Old code still running after restart?
rm -rf ~/BirdID/backend/__pycache__
sudo systemctl restart birdid

# SpeciesNet not loading?
source ~/birdid_venv/bin/activate
python3 -c "
from speciesnet import SpeciesNet
m = SpeciesNet(model_name='kaggle:google/speciesnet/pyTorch/v4.0.2a/1')
print('SpeciesNet OK')
"

# Port 5000 not accessible from browser?
# → GCP Console → VPC Network → Firewall → Create Rule → TCP 5000

# Git push asking for credentials?
git remote set-url origin https://f75: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@github.com/f75/BirdID.git

# Out of sync with GitHub?
git fetch origin
git reset --hard origin/main
sudo systemctl restart birdid
```

---

## Laptop Commands (Windows Command Prompt)
```
cd C:\Projects\BirdID

# Sync latest from GitHub to laptop
git pull origin main

# Check status
git status
git log --oneline -5

# Test API from Windows
curl http://34.173.73.193:5000/health
curl -X POST http://34.173.73.193:5000/predict -F "image=@C:\temp\DSCN2855.jpg"
curl -X POST http://34.173.73.193:5000/predict -F "image=@C:\temp\DSCN2855.jpg" -F "country=USA" -F "state=CA"
```

---

## Sync Scenarios

### You changed code on the VM
```bash
# On VM — push to GitHub:
cd ~/BirdID
git remote set-url origin https://f75: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@github.com/f75/BirdID.git
git add . && git commit -m "change" && git push origin main
git remote set-url origin https://github.com/f75/BirdID.git

# On laptop — pull:
cd C:\Projects\BirdID && git pull origin main
```

### You changed code on your laptop
```
# On laptop — push:
cd C:\Projects\BirdID
git add . && git commit -m "change" && git push origin main

# On VM — pull and restart:
cd ~/BirdID && git pull origin main
rm -rf backend/__pycache__
sudo systemctl restart birdid
```
