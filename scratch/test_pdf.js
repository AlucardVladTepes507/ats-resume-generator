import { jsPDF } from 'jspdf'

const doc = new jsPDF({ unit: 'pt', format: 'letter' })
doc.setFont('helvetica', 'normal')
doc.setFontSize(9.5)

const skills = [
  'Customer Service', 'Management', 'Quality Assurance', 'Technical Support',
  'Team Leadership', 'Time Management', 'Human Resources', 'Escalation Handling',
  'New Employee Mentoring', 'Call Monitoring', 'Agent Performance Evaluation',
  'Spanish (Native)', 'English (Advanced)'
]

const skillsText = skills.join(' \u2022 ')
const text = 'Skills: ' + skillsText

const maxW = 612 - 43 * 2
const lines = doc.splitTextToSize(text, maxW)

console.log('Lines:', lines.length)
for (let i = 0; i < lines.length; i++) {
  const lineText = lines[i]
  const words = lineText.trim().split(/\s+/)
  console.log(`Line ${i}: "${lineText}"`)
  console.log(`  Words: ${words.length}`)
}

