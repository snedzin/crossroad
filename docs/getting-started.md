
# Getting Started

## Prerequisites

- Modern web browser (Chrome, Firefox, Edge, Safari)
- That's it! No other software required

## Running the Application

### Local Usage

The simplest way to run the application is to open the HTML file directly:

1. Download the `index.html` file from the `/public` directory
2. Open the file in your web browser

### Serving Locally

For better performance and to avoid any browser security restrictions, you can serve the file using any web server:

```bash
# Using Python (if you have Python installed)
python -m http.server

# OR using NPX serve (if you have Node.js installed)
npx serve

# Then visit:
# http://localhost:8000/index.html (Python)
# OR
# http://localhost:3000/index.html (serve)
```

### Mobile Usage

For mobile devices, use the `mobile.html` file which is optimized for smaller screens:

1. Download the `mobile.html` file from the `/public` directory
2. Open it in your mobile browser or serve it using the methods above

## Deployment Options

### Hosting on GitHub Pages

The application can be easily hosted on GitHub Pages:

1. Fork or clone this repository
2. Enable GitHub Pages in your repository settings
3. Set the source to the main branch and the root directory
4. Your application will be available at `https://yourusername.github.io/p2p-bulletin-board/`

### Other Static Hosting Options

Any static hosting service will work:

- Netlify
- Vercel
- Firebase Hosting
- Amazon S3
- Any web hosting service that can serve static files

Simply upload the files from the `/public` directory to your hosting service.

## Using the Application

1. **Create Listings**: Click the "Create Listing" button to add new items
2. **Connect to Peers**: Go to the "Connections" tab to connect with other users
3. **Share Your Peer ID**: Copy your peer ID and share it with others to connect
4. **Filter Listings**: Use the category filters to find specific types of listings
5. **Search**: Use the search box to find listings by keyword
