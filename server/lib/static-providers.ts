import type { CareRoute } from './triage-engine'

export interface StaticProvider {
  id: string
  name: string
  type: string
  address: string
  lat: number
  lng: number
  phone: string | null
}

/** Mock WA venues for demo — not a complete directory. */
const POOL: StaticProvider[] = [
  {
    id: 'ed-royal-perth',
    name: 'Royal Perth Hospital Emergency',
    type: 'ed',
    address: '85 Wellington St, Perth WA 6000',
    lat: -31.9536,
    lng: 115.8577,
    phone: '000'
  },
  {
    id: 'ed-scgh',
    name: 'Sir Charles Gairdner Hospital Emergency',
    type: 'ed',
    address: 'Hospital Ave, Nedlands WA 6009',
    lat: -31.9692,
    lng: 115.8119,
    phone: '000'
  },
  {
    id: 'gp-northbridge',
    name: 'Northbridge GP Clinic (demo)',
    type: 'gp',
    address: 'Lake St, Northbridge WA 6003',
    lat: -31.9469,
    lng: 115.8547,
    phone: '08 0000 0000'
  },
  {
    id: 'gp-subiaco',
    name: 'Subiaco Medical Centre (demo)',
    type: 'gp',
    address: 'Rokeby Rd, Subiaco WA 6008',
    lat: -31.9483,
    lng: 115.8267,
    phone: '08 0000 0001'
  },
  {
    id: 'pharm-cbd',
    name: 'Perth City Pharmacy (demo)',
    type: 'pharmacy',
    address: 'Murray St, Perth WA 6000',
    lat: -31.9523,
    lng: 115.8613,
    phone: '08 0000 0002'
  },
  {
    id: 'uc-osborne-park',
    name: 'Urgent Care — Osborne Park (demo)',
    type: 'urgent_care_clinic',
    address: 'Main St, Osborne Park WA 6017',
    lat: -31.9047,
    lng: 115.8147,
    phone: '08 0000 0003'
  }
]

const routeToTypes: Record<CareRoute, string[]> = {
  ed: ['ed'],
  gp: ['gp'],
  pharmacy: ['pharmacy'],
  urgent_care_clinic: ['urgent_care_clinic']
}

export function filterProvidersForRoute(route: CareRoute): StaticProvider[] {
  const types = routeToTypes[route]
  return POOL.filter(p => types.includes(p.type))
}
