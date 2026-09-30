# Negeen & Paymaun

## Wedding Budget Calculator

------------------------------------------------------------------------

## Overview

A single-page static wedding budget calculator for managing and
adjusting wedding expenses.

Users can update budget categories, while the page automatically
calculates totals, planner fees, budget variance, cost per guest, and
visual summaries.

The current version uses browser-based storage. For production use,
shared backend storage is required to keep budget data synchronized
across different users and devices.

------------------------------------------------------------------------

## Project Structure

``` text
project/
│
├── index.html
├── styles.css
├── script.js
│
├── assets/
│   ├── logo.svg
│   ├── m_logo.svg
│   └── Masion de la Fork_Cupid.png
│
└── fonts/
    ├── KoHo font files
    └── Dahlia font files
```

------------------------------------------------------------------------

## Deployment

This project is a static website and does not require a build process,
framework, or package installation.

All files should remain in the same directory structure because HTML,
CSS, JavaScript, images, and fonts are loaded through relative paths.

The project is self-contained except for Google Fonts loaded through
`index.html`.

------------------------------------------------------------------------

## Access Model

The calculator is designed as a private link-based tool.

Anyone with the URL can access and edit the budget data. The page
includes `noindex, nofollow, noarchive` settings to prevent search
engine indexing.

The page should be hosted on a private, unlisted URL and should not be
connected to public website navigation or sitemaps.

------------------------------------------------------------------------

## Data Storage

The current implementation uses browser `localStorage`, which means each
browser keeps a separate version of the data.

For the final version, shared backend storage is required. The website
should connect to a backend endpoint that stores and returns the budget
data, allowing changes made from one device to appear for all users.

The backend only needs to manage a single budget object. User accounts,
login systems, or authentication flows are not required.

### API Requirements

**GET `{endpoint}`**

Returns the latest saved budget data.

**PUT `{endpoint}`**

Stores the updated budget data.

The JSON structure should be stored and returned without modification.

------------------------------------------------------------------------

## Backend Connection

After the backend endpoint is available, the API address should be added
in `script.js`:

``` js
var REMOTE_API_URL = "your-endpoint-url";
```

The existing save and load functions handle communication with the
endpoint.

------------------------------------------------------------------------

## Security

Although the page does not use a login system, direct API access should
be restricted.

Recommended protection includes limiting API requests to the website
domain through CORS or origin validation.

Sensitive credentials or API keys should not be included in frontend
files.

------------------------------------------------------------------------

## Reset Function

The reset button restores the original budget values stored in the
`ORIGINAL` object inside `script.js`.

These values can be updated whenever the default budget estimate
changes.
