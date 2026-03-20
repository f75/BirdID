# VM Configuration Reference

## Instance Details
| Item | Value |
|---|---|
| Name | instance-20260318-155035 |
| Zone | us-central1-a |
| External IP | 34.173.73.193 |
| OS | Ubuntu 22.04 LTS |
| Python | 3.10 |

## Key Paths
| Path | Purpose |
|---|---|
| ~/BirdID | Application code |
| ~/BirdID/backend/birdid_server.py | Flask API server |
| ~/BirdID/backend/requirements.txt | Python dependencies |
| ~/birdid_venv | Python virtual environment |
| /etc/systemd/system/birdid.service | systemd service config |
| /etc/nginx/sites-available/birdid | nginx config |

## Open Ports
| Port | Purpose | Status |
|---|---|---|
| 22 | SSH | Open |
| 80 | nginx reverse proxy | Open |
| 5000 | SpeciesNet Flask API | Open (birdid-api rule) |

## systemd Service
- Service name: birdid
- User: somar_bhangay
- Gunicorn workers: 1
- Request timeout: 300 seconds
- Auto-restart on crash: yes (after 5 seconds)
- Auto-start on VM reboot: yes

## SpeciesNet Model
| Item | Value |
|---|---|
| Model name | kaggle:google/speciesnet/pyTorch/v4.0.2a/1 |
| Version | 4.0.2a (always-crop) |
| Classes | 2000+ species |
| Load time | ~35 seconds on CPU |
| Predict time | ~30-60 seconds per image on CPU |
| Run mode | single_thread |

## GitHub
| Item | Value |
|---|---|
| Repo | https://github.com/f75/BirdID |
| Branch | main |
| Auth | Personal Access Token (stored in COMMANDS.md) |

## nginx Proxy
- Listens on port 80
- Routes /api/ → localhost:5000
- Max upload: 20MB
