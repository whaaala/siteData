import fs from 'fs'
const LAST_VISIT_FILE = './lastVisit.json'

// Load the last visit timestamps from a JSON file
export function loadLastVisit() {
  if (fs.existsSync(LAST_VISIT_FILE)) {
    return JSON.parse(fs.readFileSync(LAST_VISIT_FILE, 'utf-8'))
  }
  return {}
}

// Save the last visit timestamps to a JSON file
export function saveLastVisit(data) {
  fs.writeFileSync(LAST_VISIT_FILE, JSON.stringify(data, null, 2))
}