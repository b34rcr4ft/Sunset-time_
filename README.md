# Sunset Time Chrome Extension

A beautiful Chrome extension that displays the exact sunset time for your location on every new tab.

## Features

- 🌅 Shows sunset time for your current location
- 📍 Automatic location detection or manual city entry
- 💾 Saves your location for quick access
- 🎨 Beautiful gradient UI
- ⏰ Live current time display

## Installation

1. Clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top right)
4. Click "Load unpacked"
5. Select this folder

## Usage

1. When you first open a new tab, choose your location:
   - Use "Use My Current Location" for automatic detection
   - Or enter your city name manually
2. The extension will display today's sunset time
3. Your location is saved for future sessions

## Permissions

- `storage` - To save your location preference
- `host_permissions` - To access sunset API and geocoding services

## Technologies

- Chrome Extension Manifest V3
- Sunrise-Sunset API
- OpenStreetMap Nominatim API

