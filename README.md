---
title: Automatic Number Plate Recognition (ANPR) System
emoji: 🚗
colorFrom: blue
colorTo: indigo
sdk: docker
app_port: 7860
pinned: false
---

# Automatic Number Plate Recognition (ANPR) System

A complete full-stack Automatic Number Plate Recognition system tailored for Indian vehicle registration plates.

### Core Features
- **YOLOv8 Detection**: Accurately locates vehicle license plates in various conditions.
- **Enhanced EasyOCR**: Two-pass text recognition with heuristic character correction and Indian RTO state code validation.
- **Evidence Management**: Stores original vehicle photos and high-resolution plate crops.
- **Vehicle Analytics Dashboard**: Live detection feed, vehicle record search, toll gate logs, watchlist alerts, and PDF/CSV reporting.

### Tech Stack
- **Backend**: Python Flask, Ultralytics YOLOv8, EasyOCR, OpenCV, SQLite
- **Frontend**: React (Vite), React Router, Leaflet Maps, Modern Dashboard UI
- **Deployment**: Docker container served via Gunicorn
