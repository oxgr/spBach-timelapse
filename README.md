# Timelapse - Sphere Packing: Bach

A simple script to take jpg images from a USB webcam at set intervals to later turn into a timelapse.

## Requirements

- Raspberry Pi (or anything running Linux)
- USB webcam (Works well with Logitech C920, Brio)
- [fswebcam](https://manpages.ubuntu.com/manpages/bionic/man1/fswebcam.1.html) (`sudo apt-get install fswebcam`)

# Usage

```
npm start <interval> | test

<interval>      The number of seconds to wait between each snapshot. Default is 10.
test            Take a test image to the root directory. Defaults to a verbose output.
```

Internally, the script calls `fswebcam`. Default options are defined in the `opts` object.

## Why not an existing app or package?

I tried a few (pi-timelapse, crontabs, node-webcam), but many were buggy or simply missing simple features. This works well enough for a simple script.

## Known Issues

Sometimes there are issues with the camera not getting recognized when a Pi first boots. If this happens, unplug and replug the USB webcam, then restart the script.

There was an attempt at properly handling errors by scanning stdout and stderr for errors and retaking images when errors arose. However, with the script calling an external CLI command, a common issue arose with the USB webcam being labelled as busy and building up a queue of commands that backs up all future captures. Currently, the script attempts a capture, logs its success or failure, then waits the interval.