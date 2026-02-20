// packages/redirects-plugin/index.js

const path = require('path');
const fs = require('fs-extra');

module.exports = function(context, options) {
  const {
    siteConfig: { baseUrl, trailingSlash },
    siteDir,
    outDir,
  } = context;
  
  // Get redirects from various possible sources
  let redirects = [];
  
  // 1. Check for redirects in options (from docusaurus.config.js)
  if (options.redirects && Array.isArray(options.redirects)) {
    redirects = [...redirects, ...options.redirects];
    console.log(`Loaded ${options.redirects.length} redirects from config`);
  }
  
  // 2. Check for redirects file specified in options
  if (options.redirectsFile) {
    const specifiedPath = path.resolve(siteDir, options.redirectsFile);
    if (fs.existsSync(specifiedPath)) {
      try {
        const fileRedirects = JSON.parse(fs.readFileSync(specifiedPath, 'utf8'));
        if (Array.isArray(fileRedirects)) {
          redirects = [...redirects, ...fileRedirects];
          console.log(`Loaded ${fileRedirects.length} redirects from ${options.redirectsFile}`);
        }
      } catch (error) {
        console.error(`Error loading redirects from ${options.redirectsFile}: ${error.message}`);
      }
    }
  }
  
  // 3. Auto-detect redirects.json in common locations (if not specified in options)
  if (!options.redirectsFile) {
    const possibleLocations = [
      path.resolve(siteDir, 'redirects.json'),
      path.resolve(siteDir, 'config/redirects.json'),
      path.resolve(siteDir, 'src/redirects.json')
    ];
    
    for (const location of possibleLocations) {
      if (fs.existsSync(location)) {
        try {
          const fileRedirects = JSON.parse(fs.readFileSync(location, 'utf8'));
          if (Array.isArray(fileRedirects)) {
            redirects = [...redirects, ...fileRedirects];
            console.log(`Auto-detected and loaded ${fileRedirects.length} redirects from ${path.relative(siteDir, location)}`);
            break; // Only use the first valid file found
          }
        } catch (error) {
          console.warn(`Found redirects file at ${location} but couldn't parse it: ${error.message}`);
        }
      }
    }
  }
  
  return {
    name: 'redirects-plugin',
    
    async loadContent() {
      console.log('===== REDIRECTS PLUGIN: LOADING CONTENT =====');
      console.log(`Found ${redirects.length} redirects to process`);
      console.log(`Trailing slash setting: ${trailingSlash}`);
      if (redirects.length > 0) {
        console.log('First redirect:', JSON.stringify(redirects[0]));
      }
      return { redirects };
    },
    
    async postBuild({ content }) {
      console.log('===== REDIRECTS PLUGIN: POST BUILD =====');
      const { redirects } = content;
      
      if (redirects.length === 0) {
        console.log('No redirects configured. Skipping redirect generation.');
        return;
      }
      
      console.log(`Processing ${redirects.length} redirects...`);
      console.log(`Output directory: ${outDir}`);
      console.log(`Trailing slash setting: ${trailingSlash}`);
      
      // For each redirect, create an HTML file with meta refresh
      await Promise.all(
        redirects.map(async (redirect, index) => {
          // Validate redirect object
          if (!redirect.from || !redirect.to) {
            console.warn(`Skipping invalid redirect at index ${index}: missing from or to field`);
            return;
          }
          
          const { from, to, type = 301 } = redirect;
          
          // Separate the path from the hash fragment for 'from'
          const [fromPath, fromHash] = from.split('#');
          
          // Normalize the 'from' path - remove trailing slash for file system
          const normalizedFrom = fromPath.startsWith('/')
            ? fromPath.endsWith('/') ? fromPath.slice(0, -1) : fromPath
            : `/${fromPath.endsWith('/') ? fromPath.slice(0, -1) : fromPath}`;
          
          // Create the output path (without hash since that's not a file system concept)
          const outputPath = path.join(outDir, normalizedFrom.slice(1));
          
          try {
            // Handle the 'to' URL with proper trailing slash handling
            let toUrl;
            
            if (to.startsWith('http')) {
              // External URL - use as-is
              toUrl = to;
            } else {
              // Internal URL - ensure proper format based on trailingSlash setting
              let processedTo = to.startsWith('/') ? to : `/${to}`;
              
              // Apply trailing slash rules
              if (trailingSlash === true && !processedTo.endsWith('/') && !processedTo.includes('#') && !processedTo.includes('?')) {
                processedTo = `${processedTo}/`;
              } else if (trailingSlash === false && processedTo.endsWith('/')) {
                processedTo = processedTo.slice(0, -1);
              }
              
              // Apply baseUrl
              toUrl = baseUrl === '/' ? processedTo : `${baseUrl}${processedTo.slice(1)}`;
            }
            
            // Create the HTML file
            const htmlContent = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <meta http-equiv="refresh" content="0; url=${toUrl}">
    <link rel="canonical" href="${toUrl}" />
    <title>Redirecting...</title>
  </head>
  <body>
    <p>Redirecting to <a href="${toUrl}">${toUrl}</a>...</p>
    <script>
      window.location.href = '${toUrl}';
    </script>
  </body>
</html>`;
            
            // Generate file-based redirect (path.html)
            await fs.ensureFile(`${outputPath}.html`);
            await fs.writeFile(`${outputPath}.html`, htmlContent);
            
            // Also generate directory-based redirect (path/index.html)
            await fs.ensureDir(outputPath);
            await fs.writeFile(path.join(outputPath, 'index.html'), htmlContent);
            
            console.log(`Created redirect: ${from} → ${toUrl} (${type})`);
          } catch (error) {
            console.error(`Error creating redirect for ${from}: ${error.message}`);
          }
        })
      );
      
      console.log('Redirect generation complete.');
    },
  };
};