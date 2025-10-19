'use client'

import { Prompt } from '@/types/prompt'

export default function PromptList({ prompts }: { prompts: Prompt[] }) {
  return (
    <div className="space-y-2">
      {prompts.map((prompt) => (
        <div key={prompt.id} className="border p-3 rounded-lg">
          <p>{prompt.prompt_text}</p>
          {prompt.is_ai_generated && (
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded mt-2 inline-block">
              AI Generated
            </span>
          )}
        </div>
      ))}
    </div>
  )
}
