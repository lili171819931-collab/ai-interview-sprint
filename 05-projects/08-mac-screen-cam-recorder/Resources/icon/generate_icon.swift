import AppKit

// AI Teaching Recorder app icon — 1024x1024, macOS Big Sur style.
let S: CGFloat = 1024
let image = NSImage(size: NSSize(width: S, height: S))
image.lockFocus()
guard let ctx = NSGraphicsContext.current?.cgContext else {
    print("no context")
    exit(1)
}

func color(_ hex: UInt32, _ alpha: CGFloat = 1) -> NSColor {
    NSColor(srgbRed: CGFloat((hex >> 16) & 0xFF)/255,
            green: CGFloat((hex >> 8) & 0xFF)/255,
            blue: CGFloat(hex & 0xFF)/255,
            alpha: alpha)
}

// 1. Squircle background
let rect = CGRect(x: 0, y: 0, width: S, height: S)
let corner: CGFloat = 185
let squircle = NSBezierPath(roundedRect: rect, xRadius: corner, yRadius: corner)
ctx.saveGState()
squircle.addClip()

// Vertical dark glass gradient
let top = color(0x2B3142)
let bottom = color(0x0F1118)
let grad = CGGradient(colorsSpace: CGColorSpaceCreateDeviceRGB(),
                      colors: [top.cgColor, bottom.cgColor] as CFArray,
                      locations: [0, 1])!
ctx.drawLinearGradient(grad,
                       start: CGPoint(x: S/2, y: S),
                       end: CGPoint(x: S/2, y: 0),
                       options: [])

// Subtle top sheen
let sheen = CGGradient(colorsSpace: CGColorSpaceCreateDeviceRGB(),
                       colors: [color(0xFFFFFF, 0.10).cgColor, color(0xFFFFFF, 0).cgColor] as CFArray,
                       locations: [0, 1])!
ctx.drawLinearGradient(sheen,
                       start: CGPoint(x: 0, y: S),
                       end: CGPoint(x: 0, y: S * 0.45),
                       options: [])

// 2. Outer lens ring (camera aperture)
let center = CGPoint(x: S/2, y: S/2)
let outerR: CGFloat = 268
ctx.setStrokeColor(color(0xFFFFFF, 0.92).cgColor)
ctx.setLineWidth(44)
ctx.strokeEllipse(in: CGRect(x: center.x - outerR, y: center.y - outerR,
                             width: outerR*2, height: outerR*2))

// 3. Inner ring (slightly darker, thin)
let innerR: CGFloat = 222
ctx.setStrokeColor(color(0xFFFFFF, 0.28).cgColor)
ctx.setLineWidth(5)
ctx.strokeEllipse(in: CGRect(x: center.x - innerR, y: center.y - innerR,
                             width: innerR*2, height: innerR*2))

// 4. F-stop tick marks (top/bottom/left/right)
ctx.setStrokeColor(color(0xFFFFFF, 0.75).cgColor)
ctx.setLineWidth(10)
ctx.setLineCap(.round)
let tickLen: CGFloat = 26
let ticks: [(CGFloat, CGFloat)] = [(0,1),(0,-1),(1,0),(-1,0)]
for (dx, dy) in ticks {
    let x0 = center.x + dx * (outerR + 4)
    let y0 = center.y + dy * (outerR + 4)
    let x1 = center.x + dx * (outerR + 4 + tickLen)
    let y1 = center.y + dy * (outerR + 4 + tickLen)
    ctx.move(to: CGPoint(x: x0, y: y0))
    ctx.addLine(to: CGPoint(x: x1, y: y1))
    ctx.strokePath()
}

// 5. Red record dot with gloss
let dotR: CGFloat = 118
let dotRect = CGRect(x: center.x - dotR, y: center.y - dotR, width: dotR*2, height: dotR*2)
let dotGrad = CGGradient(colorsSpace: CGColorSpaceCreateDeviceRGB(),
                         colors: [color(0xFF6A5E).cgColor, color(0xE6332B).cgColor] as CFArray,
                         locations: [0, 1])!
ctx.saveGState()
ctx.addEllipse(in: dotRect)
ctx.clip()
ctx.drawLinearGradient(dotGrad,
                       start: CGPoint(x: center.x, y: center.y + dotR),
                       end: CGPoint(x: center.x, y: center.y - dotR),
                       options: [])
// glossy highlight on the dot
let gloss = CGGradient(colorsSpace: CGColorSpaceCreateDeviceRGB(),
                       colors: [color(0xFFFFFF, 0.55).cgColor, color(0xFFFFFF, 0).cgColor] as CFArray,
                       locations: [0, 1])!
ctx.drawRadialGradient(gloss,
                       startCenter: CGPoint(x: center.x - dotR*0.35, y: center.y + dotR*0.4),
                       startRadius: 0,
                       endCenter: CGPoint(x: center.x - dotR*0.35, y: center.y + dotR*0.4),
                       endRadius: dotR * 1.3,
                       options: [])
ctx.restoreGState()

// white ring separating dot from lens
ctx.setStrokeColor(color(0xFFFFFF, 0.9).cgColor)
ctx.setLineWidth(8)
ctx.strokeEllipse(in: dotRect.insetBy(dx: -14, dy: -14))

ctx.restoreGState() // end squircle clip

image.unlockFocus()

// Save PNG
guard let tiff = image.tiffRepresentation,
      let rep = NSBitmapImageRep(data: tiff),
      let png = rep.representation(using: .png, properties: [:]) else {
    print("encode failed")
    exit(1)
}
let out = CommandLine.arguments.count > 1 ? CommandLine.arguments[1] : "AppIcon.png"
try! png.write(to: URL(fileURLWithPath: out))
print("wrote \(out)")
