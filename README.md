# Plotter projects and stuff.

Description AWOL.

### Audio processing

To create a .dat file for a song, enter:

```bash
audiowaveform -i src/data/audio/fox-stevenson-radar.mp3 -o src/data/audio/fox-stevenson-radar.dat -b 8
```

I should probably create a Node script for this, that includes instructions for how to download `audiowaveform` if it isn't found... Or, just use mp3s directly on the web?

### SVG sorting

Use this wonderful resource: https://github.com/inconvergent/svgsort

You'll need to install python3, and then install pip, to install scipy. It's annoying I know.

### Ideas

- Maybe the lines should point towards darker cells? Imagine if each cell considered its 8 siblings and pointed towards the darkest of them. This is like "shitty edge-detection"
- Pen Phase - Come up with a somewhat simple shape. Add 10-20 rows. Each row features two (or more) copies of the shape, slightly offset. Piano phase, but for pen.
