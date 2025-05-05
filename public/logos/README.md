
# TV Logos for SteadyStream TV

This directory contains TV channel logos used in the SteadyStream TV application.

## How to Get More Logos

The logos in this application are sourced from the [tv-logo/tv-logos](https://github.com/tv-logo/tv-logos) GitHub repository.

To download more logos:

1. Run the download script:
   ```
   node scripts/download-logos.js
   ```

2. The script will create category folders and download logos for:
   - Entertainment channels
   - Sports channels
   - Movie channels 
   - News channels
   - Kids channels
   - International channels

## Adding Custom Logos

You can add your own custom logos to the appropriate category folders:

```
public/logos/[category]/[channel-name].png
```

For best results, use PNG format with transparent backgrounds.

## Credits

All logos are property of their respective owners and are used for identification purposes only.

Original logo collection: [https://github.com/tv-logo/tv-logos](https://github.com/tv-logo/tv-logos)
