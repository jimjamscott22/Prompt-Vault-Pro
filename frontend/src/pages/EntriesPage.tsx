import { useState } from 'react'
import { useEntries } from '../hooks/useEntries'
import EntryCard from '../components/EntryCard'
import EntryForm from '../components/EntryForm'
import { createEntry, updateEntry, deleteEntry } from '../api/entries'
import type { Entry, EntryCreate } from '../api/entries'

function EntriesPage() {
  const { entries, loading, refetch } = useEntries()
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Entry | null>(null)

  function openCreate() {
    setEditTarget(null)
    setModalOpen(true)
  }

  function openEdit(entry: Entry) {
    setEditTarget(entry)
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setEditTarget(null)
  }

  async function handleSubmit(data: EntryCreate) {
    if (editTarget) {
      await updateEntry(editTarget.id, data)
    } else {
      await createEntry(data)
    }
    closeModal()
    refetch()
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this entry?')) return
    await deleteEntry(id)
    refetch()
  }

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-semibold">Entries</h2>
        <button
          onClick={openCreate}
          className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
        >
          + New Entry
        </button>
      </div>

      {loading && <p className="text-gray-400">Loading entries...</p>}

      {!loading && entries.length === 0 && (
        <p className="text-gray-400">No entries yet. Create one to get started.</p>
      )}

      {!loading && entries.length > 0 && (
        <div className="space-y-4">
          {entries.map((entry) => (
            <EntryCard
              key={entry.id}
              entry={entry}
              onEdit={openEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {modalOpen && (
        <EntryForm
          entry={editTarget}
          onSubmit={handleSubmit}
          onClose={closeModal}
        />
      )}
    </>
  )
}

export default EntriesPage
