export interface RegionConfig {
  code: string
  name: string
  language: string
  languageName: string
}

export const REGIONS: RegionConfig[] = [
  { code: 'global', name: 'Global', language: 'en', languageName: 'English' },
  { code: 'turkey', name: 'Turkey', language: 'tr', languageName: 'Turkish' },
  { code: 'france', name: 'France', language: 'fr', languageName: 'French' },
  { code: 'germany', name: 'Germany', language: 'de', languageName: 'German' },
  { code: 'spain', name: 'Spain', language: 'es', languageName: 'Spanish' },
  { code: 'italy', name: 'Italy', language: 'it', languageName: 'Italian' },
  { code: 'uk', name: 'United Kingdom', language: 'en-GB', languageName: 'English (UK)' },
  { code: 'usa', name: 'United States', language: 'en-US', languageName: 'English (US)' },
  { code: 'japan', name: 'Japan', language: 'ja', languageName: 'Japanese' },
  { code: 'china', name: 'China', language: 'zh', languageName: 'Chinese' },
  { code: 'brazil', name: 'Brazil', language: 'pt-BR', languageName: 'Portuguese (BR)' },
  { code: 'mexico', name: 'Mexico', language: 'es-MX', languageName: 'Spanish (MX)' },
  { code: 'india', name: 'India', language: 'en-IN', languageName: 'English (IN)' },
  { code: 'russia', name: 'Russia', language: 'ru', languageName: 'Russian' },
  { code: 'south-korea', name: 'South Korea', language: 'ko', languageName: 'Korean' },
]

export function getRegionConfig(regionName: string): RegionConfig {
  const region = REGIONS.find(r =>
    r.name.toLowerCase() === regionName.toLowerCase() ||
    r.code.toLowerCase() === regionName.toLowerCase()
  )

  return region || REGIONS[0] // Default to Global
}

export function getLanguageForRegion(regionName: string): string {
  return getRegionConfig(regionName).language
}
