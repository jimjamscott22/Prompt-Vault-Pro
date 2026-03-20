import { useEntries } from '../hooks/useEntries'
import EntryCard from '../components/EntryCard'

function EntriesPage() {
  const { entries, loading } = useEntries()

  if (loading) {
    return <p className="text-gray-400">Loading entries...</p>
  }

  if (entries.length === 0) {
    return <p className="text-gray-400">No entries yet. Add one via the CLI or API.</p>
  }

  return (
    <div className="space-y-4">
      {entries.map((entry) => (
        <EntryCard key={entry.id} entry={entry} />
      ))}
    </div>
  )
}

export default EntriesPage
