# BirdID Command Reference

## Push to GitHub from VM
Store your token securely (password manager). Never commit it to git.
Use it only in the terminal like this:
```bash
cd ~/BirdID
git remote set-url origin https://f75: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@github.com/f75/BirdID.git
git add .
git commit -m "your message"
git push origin main
git remote set-url origin https://github.com/f75/BirdID.git
```

## Service management
```bash
sudo systemctl status birdid
sudo systemctl restart birdid
sudo journalctl -u birdid -n 20 --no-pager
sudo journalctl -u birdid -f
```

## After any code change on VM
```bash
rm -rf ~/BirdID/backend/__pycache__
sudo systemctl restart birdid
```

## Pull latest from GitHub
```bash
cd ~/BirdID && git pull origin main
```

## Test API
```bash
curl http://localhost:5000/health
curl -X POST http://localhost:5000/predict -F "image=@~/test_bird.jpg"
```

## Laptop (Windows)
```
cd C:\Projects\BirdID
git pull origin main
curl http://34.173.73.193:5000/health
curl -X POST http://34.173.73.193:5000/predict -F "image=@C:\temp\DSCN2855.jpg"
```

## Troubleshooting
```bash
# Old code running? Clear cache:
rm -rf ~/BirdID/backend/__pycache__ && sudo systemctl restart birdid

# SpeciesNet not loading?
source ~/birdid_venv/bin/activate
python3 -c "from speciesnet import SpeciesNet; m = SpeciesNet(model_name='kaggle:google/speciesnet/pyTorch/v4.0.2a/1'); print('OK')"

# Port blocked? Open in GCP Console:
# VPC Network → Firewall → Create Rule → TCP 5000
```
