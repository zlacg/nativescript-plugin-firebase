Custom TNSMLKitCamera framework for iOS.

Using this wrapper because of buffer issues. Sad.

### Building the framework
- Run the target for simulator and device (disconnect the device to be sure), make sure to not only build for the active architecture.
- Right-click the file in the Products folder and open in Finder.
- In a Terminal `cd` to that folder, move up to the `Products` folder.
- Run `lipo -create -output "TNSMLKitCamera" "Debug-iphonesimulator/TNSMLKitCamera.framework/TNSMLKitCamera" "Debug-iphoneos/TNSMLKitCamera.framework/TNSMLKitCamera"`.
- Use the resulting `TNSMLKitCamera` file instead of the one generated inside any of the targets.

