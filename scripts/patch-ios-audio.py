from pathlib import Path

p = Path("ios/App/App/AppDelegate.swift")
t = p.read_text()
if "AVAudioSession" in t:
    print("AVAudioSession already configured")
    raise SystemExit(0)

if "import Capacitor" in t:
    t = t.replace("import Capacitor", "import Capacitor\nimport AVFoundation", 1)
else:
    t = "import AVFoundation\n" + t

needle = "didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {\n"
idx = t.find(needle)
if idx < 0:
    raise SystemExit("AppDelegate: didFinishLaunching not found")

insert = (
    "        do {\n"
    "            try AVAudioSession.sharedInstance().setCategory(.playback, mode: .default)\n"
    "            try AVAudioSession.sharedInstance().setActive(true)\n"
    "        } catch {\n"
    '            print("AVAudioSession: \\(error)")\n'
    "        }\n"
)
at = idx + len(needle)
p.write_text(t[:at] + insert + t[at:])
print("AVAudioSession configured")
