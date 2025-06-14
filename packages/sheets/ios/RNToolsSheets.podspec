require 'json'

package = JSON.parse(File.read(File.join(__dir__, '..', 'package.json')))
new_arch_enabled = ENV['RCT_NEW_ARCH_ENABLED'] == '1'


Pod::Spec.new do |s|
  s.name           = 'RNToolsSheets'
  s.version        = package['version']
  s.summary        = package['description']
  s.description    = package['description']
  s.license        = package['license']
  s.author         = package['author']
  s.homepage       = package['homepage']
  s.platforms      = {
    :ios => '16.0',
    :tvos => '16.0'
  }
  s.swift_version  = '5.4'
  s.source         = { git: 'https://github.com/ajsmth/rn-tools' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'
  s.public_header_files = 'Sources/RNTSurfaceTouchHandlerWrapper.h'

  # Swift/Objective-C compatibility
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'OTHER_SWIFT_FLAGS' => new_arch_enabled ? '-DRCT_NEW_ARCH_ENABLED' : ''
  }

  s.source_files = "**/*.{h,m,mm,swift,hpp,cpp}"
end
