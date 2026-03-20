import type { Entry } from '../api/entries'

interface Props {
  entry: Entry
  onEdit: (entry: Entry) => void
  onDelete: (id: string) => void
}

function EntryCard({ entry, onEdit, onDelete }: Props) {
  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-lg font-semibold">{entry.title}</h2>
        <div className="flex items-center gap-2">
          <span className="rounded bg-gray-800 px-2 py-0.5 text-xs text-gray-400">
            {entry.type}
          </span>
          <button
            onClick={() => onEdit(entry)}
            className="rounded px-2 py-0.5 text-xs text-gray-400 hover:bg-gray-800 hover:text-gray-100"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(entry.id)}
            className="rounded px-2 py-0.5 text-xs text-red-500 hover:bg-gray-800 hover:text-red-400"
          >
            Delete
          </button>
        </div>
      </div>
      <pre className="mb-3 overflow-x-auto rounded bg-gray-950 p-3 text-sm text-gray-300">
        <code>{entry.body}</code>
      </pre>
      <div className="flex items-center gap-3 text-xs text-gray-500">
        {entry.language && <span>{entry.language}</span>}
        {entry.tags.map((tag) => (
          <span key={tag.id} className="rounded bg-gray-800 px-1.5 py-0.5">
            {tag.name}
          </span>
        ))}
      </div>
    </div>
  )
}

export default EntryCard
