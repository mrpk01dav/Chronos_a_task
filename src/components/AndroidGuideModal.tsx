import React, { useState } from 'react';
import { 
  Smartphone, 
  Code2, 
  Terminal, 
  CheckSquare, 
  Copy, 
  Check, 
  X, 
  Download, 
  ExternalLink,
  Cpu,
  Layers,
  FileCode2,
  ShieldCheck,
  FolderArchive,
  Play,
  RotateCcw,
  BatteryCharging,
  Package
} from 'lucide-react';
import { generateAndroidProjectZip, getAndroidProjectFiles } from '../services/androidProjectGenerator';

interface AndroidGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AndroidGuideModal: React.FC<AndroidGuideModalProps> = ({ isOpen, onClose }) => {
  const [tab, setTab] = useState<'zip_export' | 'kotlin_explorer' | 'install_device' | 'signed_apk' | 'testing_matrix'>('zip_export');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState<string | null>(null);

  // Kotlin source files for the explorer
  const androidFiles = getAndroidProjectFiles();
  const [selectedFilePath, setSelectedFilePath] = useState<string>(androidFiles[3]?.path || 'app/build.gradle.kts');

  if (!isOpen) return null;

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownloadZip = async () => {
    try {
      setIsExporting(true);
      setExportMessage('Bundling complete Jetpack Compose Android Studio project...');
      const blob = await generateAndroidProjectZip();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Chronos-Native-Android-Project.zip`;
      a.click();
      URL.revokeObjectURL(url);
      setExportMessage('Chronos-Native-Android-Project.zip downloaded successfully! Extract and open in Android Studio.');
      setTimeout(() => setExportMessage(null), 5000);
    } catch (e) {
      setExportMessage(`Export failed: ${(e as Error).message}`);
    } finally {
      setIsExporting(false);
    }
  };

  const selectedFile = androidFiles.find((f) => f.path === selectedFilePath) || androidFiles[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto">
      <div className="w-full max-w-3xl rounded-3xl bg-[#121420] border border-[#25293d] p-5 sm:p-6 shadow-2xl text-slate-100 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                Native Android Kotlin & Jetpack Compose Center
              </h2>
              <p className="text-xs text-slate-400">Complete Android Studio Project · Room · AlarmManager · BootReceiver</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-xl hover:bg-white/5 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Bar */}
        <div className="mt-4 flex flex-wrap gap-1 p-1 bg-[#171a2a] rounded-2xl border border-white/5 text-xs">
          <button
            onClick={() => setTab('zip_export')}
            className={`py-1.5 px-3 rounded-xl font-bold transition flex items-center gap-1.5 ${
              tab === 'zip_export' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <FolderArchive className="w-3.5 h-3.5" />
            <span>1. Export Project (.ZIP)</span>
          </button>
          <button
            onClick={() => setTab('kotlin_explorer')}
            className={`py-1.5 px-3 rounded-xl font-bold transition flex items-center gap-1.5 ${
              tab === 'kotlin_explorer' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>2. Kotlin Code Explorer</span>
          </button>
          <button
            onClick={() => setTab('install_device')}
            className={`py-1.5 px-3 rounded-xl font-bold transition flex items-center gap-1.5 ${
              tab === 'install_device' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Play className="w-3.5 h-3.5" />
            <span>3. Install on Device</span>
          </button>
          <button
            onClick={() => setTab('signed_apk')}
            className={`py-1.5 px-3 rounded-xl font-bold transition flex items-center gap-1.5 ${
              tab === 'signed_apk' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>4. Signed APK & AAB</span>
          </button>
          <button
            onClick={() => setTab('testing_matrix')}
            className={`py-1.5 px-3 rounded-xl font-bold transition flex items-center gap-1.5 ${
              tab === 'testing_matrix' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>5. Testing Matrix</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="mt-4 max-h-[460px] overflow-y-auto pr-1 space-y-4 text-xs">
          
          {/* TAB 1: ZIP EXPORT */}
          {tab === 'zip_export' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-900/30 to-purple-900/30 border border-indigo-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <FolderArchive className="w-4 h-4 text-indigo-400" />
                    Download Native Kotlin Android Studio Project
                  </h3>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    Download the complete, compilable Android Studio Gradle project configured with Jetpack Compose, Room Database 2.6+, AlarmManager exact scheduling, BootReceiver, and Material 3 Dark theme.
                  </p>
                </div>

                <button
                  onClick={handleDownloadZip}
                  disabled={isExporting}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:opacity-95 text-white font-bold shadow-lg shadow-indigo-500/25 transition active:scale-95 shrink-0 flex items-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>{isExporting ? 'Generating ZIP...' : 'Download Project ZIP'}</span>
                </button>
              </div>

              {exportMessage && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold animate-in fade-in">
                  {exportMessage}
                </div>
              )}

              <div className="p-4 rounded-2xl bg-[#171a2a] border border-white/5 space-y-2">
                <span className="font-bold text-white text-xs block">
                  How to Open and Run in Android Studio:
                </span>
                <ol className="list-decimal pl-4 space-y-1.5 text-[11px] text-slate-300">
                  <li>Extract <code className="text-indigo-300 font-mono">Chronos-Native-Android-Project.zip</code> to your computer.</li>
                  <li>Launch <strong>Android Studio Ladybug (2024.2+)</strong> or newer.</li>
                  <li>Click <strong>Open</strong> and choose the extracted <code className="text-indigo-300 font-mono">Chronos</code> folder.</li>
                  <li>Android Studio will automatically run Gradle sync and download required AndroidX, Compose, and Room dependencies.</li>
                  <li>Select your emulator or connected physical Android phone in the top toolbar and click the green <strong>Run (Shift + F10)</strong> button!</li>
                </ol>
              </div>
            </div>
          )}

          {/* TAB 2: KOTLIN CODE EXPLORER */}
          {tab === 'kotlin_explorer' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-300 text-xs">Browse Kotlin & Gradle Source Files:</span>
                <button
                  onClick={() => handleCopy('selected_file', selectedFile.content)}
                  className="flex items-center gap-1 text-indigo-400 hover:text-white cursor-pointer text-xs"
                >
                  {copiedId === 'selected_file' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedId === 'selected_file' ? 'Copied!' : 'Copy File Content'}</span>
                </button>
              </div>

              {/* File selector pill strip */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                {androidFiles.map((f) => (
                  <button
                    key={f.path}
                    onClick={() => setSelectedFilePath(f.path)}
                    className={`px-2.5 py-1 rounded-lg font-mono text-[11px] whitespace-nowrap transition cursor-pointer ${
                      selectedFilePath === f.path
                        ? 'bg-indigo-600 text-white font-bold'
                        : 'bg-[#181a29] text-slate-400 hover:text-slate-200 border border-white/5'
                    }`}
                  >
                    {f.path.split('/').pop()}
                  </button>
                ))}
              </div>

              {/* Code viewer */}
              <div className="relative">
                <div className="text-[11px] font-mono text-slate-400 pb-1 flex items-center justify-between">
                  <span>File: <code className="text-indigo-300">{selectedFile.path}</code></span>
                  <span>{selectedFile.content.split('\n').length} lines</span>
                </div>
                <pre className="p-3.5 bg-[#0a0b10] border border-white/10 rounded-2xl font-mono text-[10.5px] text-indigo-200 overflow-x-auto max-h-[340px] leading-relaxed whitespace-pre select-all">
                  {selectedFile.content}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 3: INSTALL ON DEVICE */}
          {tab === 'install_device' && (
            <div className="space-y-3.5">
              <div className="p-4 rounded-2xl bg-[#171a2a] border border-white/5 space-y-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-emerald-400" />
                  Install Chronos Directly on a Physical Android Phone
                </h3>

                <div className="space-y-3 text-[11px] text-slate-300">
                  <div className="p-3 rounded-xl bg-[#121420] border border-white/5 space-y-1">
                    <span className="font-bold text-white block">Method A: Android Studio "Install on Device" (Recommended)</span>
                    <p className="text-slate-400 leading-relaxed">
                      1. On your Android phone, enable <strong>Developer Options</strong> (go to Settings → About Phone → tap "Build Number" 7 times).<br />
                      2. In Developer Options, enable <strong>USB Debugging</strong> (or Wireless Debugging).<br />
                      3. Plug your phone into your computer via USB.<br />
                      4. In Android Studio, select your physical phone in the device dropdown list and click <strong>Run (▶)</strong>.<br />
                      5. Chronos will install and launch instantly with full native notifications and background services.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-[#121420] border border-white/5 space-y-1">
                    <span className="font-bold text-white block">Method B: ADB Terminal Install</span>
                    <pre className="p-2.5 bg-[#0a0b10] rounded text-[10px] text-indigo-300 font-mono overflow-x-auto">
{`# 1. Build Debug APK via Gradle
./gradlew assembleDebug

# 2. Install on connected phone
adb install -r app/build/outputs/apk/debug/app-debug.apk`}
                    </pre>
                  </div>

                  <div className="p-3 rounded-xl bg-[#121420] border border-white/5 space-y-1">
                    <span className="font-bold text-white block">Method C: Direct APK Sideload (No PC required)</span>
                    <p className="text-slate-400 leading-relaxed">
                      Copy <code className="text-indigo-300">app-debug.apk</code> or <code className="text-indigo-300">app-release.apk</code> to your phone via Google Drive, WhatsApp, or USB, tap the APK in the Files app, and tap <strong>Install</strong>.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: SIGNED APK & AAB */}
          {tab === 'signed_apk' && (
            <div className="space-y-3.5">
              <div className="p-4 rounded-2xl bg-[#171a2a] border border-white/5 space-y-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Package className="w-4 h-4 text-purple-400" />
                  Generating Signed APK & Android App Bundle (.aab)
                </h3>

                <div className="space-y-3 text-[11px] text-slate-300">
                  <div className="p-3 rounded-xl bg-[#121420] border border-white/5 space-y-1.5">
                    <span className="font-bold text-white block">Step 1: In Android Studio GUI</span>
                    <ol className="list-decimal pl-4 space-y-1 text-slate-400">
                      <li>Go to <strong>Build → Generate Signed Bundle / APK...</strong></li>
                      <li>Choose <strong>Android App Bundle (.aab)</strong> for Google Play Store, or <strong>APK</strong> for direct distribution.</li>
                      <li>Select your release keystore (or click <strong>Create new...</strong> to create <code className="text-indigo-300">chronos.keystore</code>).</li>
                      <li>Select <strong>release</strong> build variant and click <strong>Finish</strong>.</li>
                      <li>Your signed package will be generated at <code className="text-white">app/release/app-release.apk</code>.</li>
                    </ol>
                  </div>

                  <div className="p-3 rounded-xl bg-[#121420] border border-white/5 space-y-1.5">
                    <span className="font-bold text-white block">Step 2: CLI Automated Build</span>
                    <pre className="p-2.5 bg-[#0a0b10] rounded text-[10px] text-indigo-300 font-mono overflow-x-auto">
{`# Generate keystore
keytool -genkey -v -keystore release.keystore -alias chronos -keyalg RSA -keysize 2048 -validity 10000

# Build release bundle
./gradlew bundleRelease

# Output: app/build/outputs/bundle/release/app-release.aab`}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: TESTING MATRIX */}
          {tab === 'testing_matrix' && (
            <div className="space-y-3">
              <span className="font-bold text-white text-xs block">
                Verification Matrix: Background Alarms, Locked Screen & Reboot
              </span>

              {[
                {
                  title: '1. Background & Locked-Screen Exact Alarm Test',
                  desc: 'Schedule a task reminder for 2 minutes from now. Turn off the device screen and unplug USB to enter Doze Mode. Verify that AlarmManager.setExactAndAllowWhileIdle wakes the device, rings the custom alarm sound, and displays heads-up banner on lockscreen.',
                },
                {
                  title: '2. Notification Actions (Complete & Snooze 10m)',
                  desc: 'When notification appears on lockscreen, tap "Snooze 10m" without opening app. Confirm AlarmReceiver reschedules the alarm for +10 minutes and cancels the active notification.',
                },
                {
                  title: '3. Device Reboot Restoration (BootReceiver)',
                  desc: 'Restart your Android phone via adb reboot or power button. Once booted, run adb shell dumpsys alarm | grep com.chronos to verify BootReceiver automatically read Room DB and restored all alarms in AlarmManager.',
                },
                {
                  title: '4. Recurring Task Occurrence Generation',
                  desc: 'Create a daily recurring task. Tap complete. Verify that the task is logged as completed in history and a new pending occurrence is generated for tomorrow with its reminders intact.',
                },
                {
                  title: '5. OEM Battery Whitelist (Samsung/Xiaomi)',
                  desc: 'Verify that the app is added to "Never Sleeping Apps" or Battery Saver "No restrictions" to prevent OEM vendors from killing the alarm service.',
                },
              ].map((test, idx) => (
                <div key={idx} className="p-3 rounded-2xl bg-[#171a2a] border border-white/5 flex items-start gap-3">
                  <div className="w-5 h-5 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="font-bold text-white text-xs">{test.title}</span>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{test.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-5 pt-3 border-t border-white/10 flex items-center justify-between">
          <button
            onClick={handleDownloadZip}
            className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Download Chronos Project (.ZIP)</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition cursor-pointer"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
