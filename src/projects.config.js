/**
 * Central project configuration file.
 * To add a new project: append a new object to this array.
 * Create the corresponding component at the componentPath location.
 */
export const projects = [
  {
    slug: 'vrt-tracing',
    title: 'VRT – Distributed Tracing binnen AWS',
    shortDescription:
      'Implementatie van distributed tracing voor microservices op AWS met real-time monitoring en observability.',
    badges: ['AWS Lambda', 'X-Ray', 'CloudWatch', 'Grafana', 'Python', 'API Gateway'],
    school: 'Odisee Hogeschool',
    date: 'April 2026',
    accentColor: '#FF6600',
    // lazy-loaded component – imported dynamically in ProjectPage
    componentPath: './projects/vrt/VRTProject.jsx',
  },
  {
    slug: 'proxmox-multisite-poc',
    title: 'Odisee – Multi-Site Datacenter PoC',
    shortDescription:
      'Live VM migratie tussen gesimuleerd datacenter New York en Brussel zonder downtime via IPSec VPN tunnel, Proxmox cluster en real-time monitoring.',
    badges: ['Proxmox VE', 'pfSense', 'IPSec VPN', 'Grafana', 'Prometheus', 'Python Flask', 'Cloudflare Tunnel', 'React'],
    school: 'Odisee Hogeschool',
    date: 'April 2026',
    accentColor: '#3B82F6',
  },
  // Add future projects here ↓
]
