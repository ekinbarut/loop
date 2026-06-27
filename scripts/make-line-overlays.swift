import AppKit
import CoreGraphics
import Foundation

struct Asset {
    let input: String
    let output: String
}

let assets = [
    Asset(input: "src/assets/canta1.jpeg", output: "src/assets/canta1-lines.png"),
    Asset(input: "src/assets/canta2.jpeg", output: "src/assets/canta2-lines.png"),
    Asset(input: "src/assets/canta3.jpeg", output: "src/assets/canta3-lines.png"),
]

func makeOverlay(inputPath: String, outputPath: String) throws {
    guard
        let image = NSImage(contentsOfFile: inputPath),
        let tiffData = image.tiffRepresentation,
        let bitmap = NSBitmapImageRep(data: tiffData)
    else {
        throw NSError(domain: "LineOverlay", code: 1, userInfo: [NSLocalizedDescriptionKey: "Could not read \(inputPath)"])
    }

    let width = bitmap.pixelsWide
    let height = bitmap.pixelsHigh
    let colorSpace = CGColorSpaceCreateDeviceRGB()
    var pixels = [UInt8](repeating: 0, count: width * height * 4)

    for y in 0..<height {
        for x in 0..<width {
            guard let color = bitmap.colorAt(x: x, y: y)?.usingColorSpace(.deviceRGB) else { continue }

            let red = color.redComponent
            let green = color.greenComponent
            let blue = color.blueComponent
            let brightness = (red + green + blue) / 3
            let darkness = max(0, min(1, (0.94 - brightness) / 0.42))
            let alpha = UInt8(pow(darkness, 0.78) * 255)
            let offset = (y * width + x) * 4

            pixels[offset] = 17
            pixels[offset + 1] = 17
            pixels[offset + 2] = 17
            pixels[offset + 3] = alpha
        }
    }

    guard
        let context = CGContext(
            data: &pixels,
            width: width,
            height: height,
            bitsPerComponent: 8,
            bytesPerRow: width * 4,
            space: colorSpace,
            bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue
        ),
        let cgImage = context.makeImage()
    else {
        throw NSError(domain: "LineOverlay", code: 2, userInfo: [NSLocalizedDescriptionKey: "Could not render \(outputPath)"])
    }

    let png = NSBitmapImageRep(cgImage: cgImage)
    guard let data = png.representation(using: .png, properties: [:]) else {
        throw NSError(domain: "LineOverlay", code: 3, userInfo: [NSLocalizedDescriptionKey: "Could not encode \(outputPath)"])
    }

    try data.write(to: URL(fileURLWithPath: outputPath))
}

for asset in assets {
    try makeOverlay(inputPath: asset.input, outputPath: asset.output)
    print("Generated \(asset.output)")
}
