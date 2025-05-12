
# TV Logos for SteadyStream TV

This directory contains TV channel logos used in the SteadyStream TV application.

## How to Get More Logos

The logos in this application are sourced from the [tv-logo/tv-logos](https://github.com/tv-logo/tv-logos) GitHub repository.

To download logos:

1. Run the download script:
   ```
   node download-logos.cjs
   ```

2. The script will:
   - Search for logos in multiple regions (world-wide, united-states, united-kingdom)
   - Try multiple file name patterns to find each logo
   - Create placeholder images for logos that can't be found
   - Organize logos into category folders:
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

## About Placeholder Logos

If a logo cannot be found in the repository, the script will generate a placeholder image with the channel name. You can replace these placeholders with actual logos as needed.

## Credits

All logos are property of their respective owners and are used for identification purposes only.

Original logo collection: [https://github.com/tv-logo/tv-logos](https://github.com/tv-logo/tv-logos)
