import AppKit
import Foundation

struct Region {
    let seedX: Int
    let seedY: Int
    let area: Int
    let minX: Int
    let minY: Int
    let maxX: Int
    let maxY: Int
}

let imageId = "canta3-duffel-mesh"
let imagePath = "src/assets/old/canta3-lines.png"

// Duffel left mesh pocket area in the original 1080 x 1350 image.
// Adjust these values if the source drawing changes.
let roiMinX = 35
let roiMinY = 555
let roiMaxX = 395
let roiMaxY = 1060

let alphaBlockThreshold = 28
let minimumArea = 20
let maximumArea = 2_800
let maximumWidth = 95
let maximumHeight = 120

func bitmap(for path: String) throws -> NSBitmapImageRep {
    guard
        let image = NSImage(contentsOfFile: path),
        let tiffData = image.tiffRepresentation,
        let bitmap = NSBitmapImageRep(data: tiffData)
    else {
        throw NSError(domain: "FindFillRegions", code: 1, userInfo: [NSLocalizedDescriptionKey: "Could not read \(path)"])
    }

    return bitmap
}

func alphaAt(_ bitmap: NSBitmapImageRep, x: Int, y: Int) -> Int {
    guard let color = bitmap.colorAt(x: x, y: y) else {
        return 255
    }

    return Int((color.alphaComponent * 255).rounded())
}

func isInsideRoi(x: Int, y: Int) -> Bool {
    x >= roiMinX && x <= roiMaxX && y >= roiMinY && y <= roiMaxY
}

func findMeshRegions(in bitmap: NSBitmapImageRep) -> [Region] {
    let width = bitmap.pixelsWide
    let height = bitmap.pixelsHigh
    let totalPixels = width * height
    var blocked = [Bool](repeating: true, count: totalPixels)
    var visited = [Bool](repeating: false, count: totalPixels)

    for y in roiMinY...roiMaxY {
        for x in roiMinX...roiMaxX {
            let index = y * width + x
            blocked[index] = alphaAt(bitmap, x: x, y: y) > alphaBlockThreshold
        }
    }

    var regions: [Region] = []
    var queue = [Int]()
    queue.reserveCapacity(4_096)

    for y in roiMinY...roiMaxY {
        for x in roiMinX...roiMaxX {
            let startIndex = y * width + x

            if visited[startIndex] || blocked[startIndex] {
                continue
            }

            queue.removeAll(keepingCapacity: true)
            queue.append(startIndex)
            visited[startIndex] = true

            var readIndex = 0
            var area = 0
            var minX = width
            var minY = height
            var maxX = 0
            var maxY = 0
            var sumX = 0
            var sumY = 0
            var touchesRoiEdge = false

            while readIndex < queue.count {
                let pixelIndex = queue[readIndex]
                readIndex += 1

                let pixelX = pixelIndex % width
                let pixelY = pixelIndex / width

                area += 1
                sumX += pixelX
                sumY += pixelY
                minX = min(minX, pixelX)
                minY = min(minY, pixelY)
                maxX = max(maxX, pixelX)
                maxY = max(maxY, pixelY)

                if pixelX == roiMinX || pixelX == roiMaxX || pixelY == roiMinY || pixelY == roiMaxY {
                    touchesRoiEdge = true
                }

                let neighbors = [
                    pixelX > roiMinX ? pixelIndex - 1 : -1,
                    pixelX < roiMaxX ? pixelIndex + 1 : -1,
                    pixelY > roiMinY ? pixelIndex - width : -1,
                    pixelY < roiMaxY ? pixelIndex + width : -1,
                ]

                for neighbor in neighbors where neighbor >= 0 {
                    if !visited[neighbor] && !blocked[neighbor] {
                        visited[neighbor] = true
                        queue.append(neighbor)
                    }
                }
            }

            let regionWidth = maxX - minX + 1
            let regionHeight = maxY - minY + 1

            if
                !touchesRoiEdge &&
                area >= minimumArea &&
                area <= maximumArea &&
                regionWidth <= maximumWidth &&
                regionHeight <= maximumHeight
            {
                regions.append(
                    Region(
                        seedX: sumX / area,
                        seedY: sumY / area,
                        area: area,
                        minX: minX,
                        minY: minY,
                        maxX: maxX,
                        maxY: maxY
                    )
                )
            }
        }
    }

    return regions.sorted { lhs, rhs in
        if lhs.minY == rhs.minY {
            return lhs.minX < rhs.minX
        }

        return lhs.minY < rhs.minY
    }
}

func jsonLine(for region: Region) -> String {
    """
    { "seed": [\(region.seedX), \(region.seedY)], "area": \(region.area), "box": [\(region.minX), \(region.minY), \(region.maxX), \(region.maxY)] }
    """
}

let regions = try findMeshRegions(in: bitmap(for: imagePath))

var markdown = "# Duffel Mesh Fill Seed Report\n\n"
markdown += "Generated from `\(imagePath)` inside ROI `[\(roiMinX), \(roiMinY), \(roiMaxX), \(roiMaxY)]`.\n\n"
markdown += "| # | Seed | Area | Box |\n"
markdown += "| - | - | -: | - |\n"

for (index, region) in regions.enumerated() {
    markdown += "| \(index + 1) | `[\(region.seedX), \(region.seedY)],` | \(region.area) | `[\(region.minX), \(region.minY), \(region.maxX), \(region.maxY)]` |\n"
}

let json = """
{
  "\(imageId)": [
\(regions.map(jsonLine).joined(separator: ",\n"))
  ]
}
"""

try json.write(toFile: "scripts/fill-regions-report.json", atomically: true, encoding: .utf8)
try markdown.write(toFile: "scripts/fill-regions-report.md", atomically: true, encoding: .utf8)

print("Found \(regions.count) duffel mesh regions")
print("Wrote scripts/fill-regions-report.json")
print("Wrote scripts/fill-regions-report.md")
