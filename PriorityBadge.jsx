export default function PriorityBadge({ level }) {
  return <span className={`badge ${level || 'Normal'}`}>{level || 'Normal'}</span>
}
