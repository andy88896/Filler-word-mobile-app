require 'json'

package = JSON.parse(File.read(File.join(__dir__, '..', 'package.json')))

Pod::Spec.new do |s|
  s.name           = 'AudioSessionConfig'
  s.version        = package['version']
  s.summary        = 'Audio session configuration for haptics during recording'
  s.description    = 'Enables haptic feedback during audio recording on iOS'
  s.author         = 'Filler Word Coach'
  s.homepage       = 'https://github.com/example/audio-session-config'
  s.license        = package['license'] || 'MIT'
  s.platforms      = { :ios => '15.1' }
  s.source         = { :git => 'https://github.com/example/audio-session-config.git' }
  s.static_framework = true
  s.swift_version  = '5.9'

  s.dependency 'ExpoModulesCore'

  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule'
  }

  s.source_files = '**/*.{h,m,mm,swift}'
end
