/* oxlint-disable react/only-export-components -- Provider and consumer hook share one context. */
import { createContext, useContext, type ReactNode } from 'react'
export type ShowActionFeedback = (attempt: string, reason: string) => void
const FeedbackContext = createContext<ShowActionFeedback>(() => {})
export const useActionFeedback = () => useContext(FeedbackContext)
export function ActionFeedbackProvider({ show, children }: { show: ShowActionFeedback; children: ReactNode }) {
  return <FeedbackContext.Provider value={show}>{children}</FeedbackContext.Provider>
}
