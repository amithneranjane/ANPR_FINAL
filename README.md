---
title: Indian ANPR System
emoji: 🚗
colorFrom: blue
colorTo: indigo
sdk: gradio
sdk_version: 5.20.0
app_file: app.py
pinned: false
---

# Automatic Number Plate Recognition (ANPR) System

A complete full-stack Automatic Number Plate Recognition system tailored for Indian vehicle registration plates.

### Core Features
- **YOLOv8 Detection**: Accurately locates vehicle license plates in various conditions.
- **Enhanced EasyOCR**: Two-pass text recognition with heuristic character correction and Indian RTO state code validation.
- **Vehicle Analytics Dashboard**: Live detection feed, vehicle record search, toll gate logs, watchlist alerts, and PDF/CSV reporting.

### Tech Stack
- **Backend & ML**: Python Flask, Ultralytics YOLOv8, EasyOCR, OpenCV, SQLite
- **Hosting**: Hugging Face Spaces (Gradio SDK - 16 GB RAM Free Tier)
