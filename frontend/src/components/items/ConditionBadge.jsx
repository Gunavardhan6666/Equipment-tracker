// ─── ConditionBadge ───────────────────────────────────────────────────────────
// Specialized badge for equipment item condition values.
import Badge from '../ui/Badge.jsx'

export default function ConditionBadge({ condition }) {
  return <Badge value={condition} />
}
