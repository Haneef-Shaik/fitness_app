import Foundation
import Vision
import AVFoundation
import CoreImage
let ctx = CIContext()
func clean(_ cg: CGImage) -> CGImage {
  var im = CIImage(cgImage: cg).applyingFilter("CIColorControls", parameters: ["inputSaturation": 0])
  im = im.applyingFilter("CIColorThreshold", parameters: ["inputThreshold": 0.55])
  im = im.applyingFilter("CIColorInvert")
  return ctx.createCGImage(im, from: im.extent) ?? cg
}
// vocr <mp4> <fps> — OCR the bottom 30% of every sampled frame; prints "t<TAB>y x w<TAB>text"
let url = URL(fileURLWithPath: CommandLine.arguments[1])
let fps = Double(CommandLine.arguments[2]) ?? 5
let asset = AVURLAsset(url: url)
let gen = AVAssetImageGenerator(asset: asset)
gen.appliesPreferredTrackTransform = true
gen.requestedTimeToleranceBefore = .zero
gen.requestedTimeToleranceAfter = .zero
let dur = CMTimeGetSeconds(asset.duration)
var t = 0.0
while t < dur {
  if let cg = try? gen.copyCGImage(at: CMTime(seconds: t, preferredTimescale: 600), actualTime: nil) {
    let h = cg.height, w = cg.width
    let top = Int(Double(h) * 0.62)
    if let crop = cg.cropping(to: CGRect(x: 0, y: top, width: w, height: h - top)) {
      let req = VNRecognizeTextRequest()
      req.recognitionLevel = .accurate
      req.usesLanguageCorrection = false
      try? VNImageRequestHandler(cgImage: clean(crop)).perform([req])
      for o in (req.results ?? []) {
        if let c = o.topCandidates(1).first {
          let b = o.boundingBox
          let y = 0.62 + (1 - b.maxY) * 0.38
          print(String(format: "%.2f\t%.3f %.3f %.3f\t%@", t, y, b.minX, b.width, c.string))
        }
      }
    }
  }
  t += 1.0 / fps
}
