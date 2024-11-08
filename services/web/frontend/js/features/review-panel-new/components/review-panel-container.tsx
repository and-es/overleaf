import ReactDOM from 'react-dom'
import { useCodeMirrorViewContext } from '../../source-editor/components/codemirror-context'
import { memo } from 'react'
import ReviewPanel from './review-panel'
import { useLayoutContext } from '@/shared/context/layout-context'
import { useRangesContext } from '../context/ranges-context'
import { useThreadsContext } from '@/features/review-panel-new/context/threads-context'
import { hasActiveRange } from '@/features/review-panel-new/utils/has-active-range'
import TrackChangesOnWidget from './track-changes-on-widget'
import { useEditorManagerContext } from '@/features/ide-react/context/editor-manager-context'

function ReviewPanelContainer() {
  const view = useCodeMirrorViewContext()
  const ranges = useRangesContext()
  const threads = useThreadsContext()
  const { reviewPanelOpen } = useLayoutContext()
  const { wantTrackChanges } = useEditorManagerContext()

  if (!view) {
    return null
  }

  // the full-width review panel
  if (reviewPanelOpen) {
    return ReactDOM.createPortal(<ReviewPanel />, view.scrollDOM)
  }

  // the mini review panel
  if (hasActiveRange(ranges, threads)) {
    return ReactDOM.createPortal(
      <>
        {wantTrackChanges && <TrackChangesOnWidget />}
        <ReviewPanel mini />
      </>,
      view.scrollDOM
    )
  }

  return null
}

export default memo(ReviewPanelContainer)
