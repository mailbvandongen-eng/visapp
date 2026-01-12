import { useState, useRef } from 'react'
import { motion, AnimatePresence, Reorder } from 'framer-motion'
import { GripVertical } from 'lucide-react'
import { useSettingsStore, WidgetId } from '../../store'
import { WindIndicator } from './WindIndicator'
import { TideWidget } from './TideWidget'
import { ForecastSlider } from './ForecastSlider'

export function WidgetStack() {
  const showWindIndicator = useSettingsStore(state => state.showWindIndicator)
  const showTideWidget = useSettingsStore(state => state.showTideWidget)
  const showForecastSlider = useSettingsStore(state => state.showForecastSlider)
  const widgetOrder = useSettingsStore(state => state.widgetOrder)
  const setWidgetOrder = useSettingsStore(state => state.setWidgetOrder)
  const [isDragging, setIsDragging] = useState(false)
  const longPressTimer = useRef<NodeJS.Timeout | null>(null)

  // WaterData is now integrated in FishingWidget
  const visibilityMap: Record<WidgetId, boolean> = {
    wind: showWindIndicator,
    tide: showTideWidget,
    forecast: showForecastSlider,
    waterData: false // Disabled - now part of FishingWidget
  }

  const widgetComponents: Record<WidgetId, React.ReactNode> = {
    wind: <WindIndicator embedded />,
    tide: <TideWidget embedded />,
    forecast: <ForecastSlider embedded />,
    waterData: null // Removed - now part of FishingWidget
  }

  const visibleWidgets = widgetOrder.filter(id => visibilityMap[id])

  const handleLongPressStart = () => {
    longPressTimer.current = setTimeout(() => {
      setIsDragging(true)
    }, 500)
  }

  const handleLongPressEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }

  const handleReorderEnd = () => {
    setTimeout(() => setIsDragging(false), 100)
  }

  if (visibleWidgets.length === 0) return null

  return (
    <div
      className="fixed right-2 z-[1000]"
      style={{ top: 'calc(max(0.5rem, env(safe-area-inset-top, 0.5rem)) + 52px)' }}
    >
      <Reorder.Group
        axis="y"
        values={visibleWidgets}
        onReorder={(newOrder) => {
          // Reconstruct full order preserving hidden widgets
          const fullOrder = widgetOrder.map(id => {
            if (visibilityMap[id]) {
              return newOrder.shift()!
            }
            return id
          })
          setWidgetOrder(fullOrder)
        }}
        className="flex flex-col gap-1.5"
      >
        <AnimatePresence>
          {visibleWidgets.map((id) => (
            <Reorder.Item
              key={id}
              value={id}
              dragListener={isDragging}
              onMouseDown={handleLongPressStart}
              onMouseUp={handleLongPressEnd}
              onMouseLeave={handleLongPressEnd}
              onTouchStart={handleLongPressStart}
              onTouchEnd={handleLongPressEnd}
              onDragEnd={handleReorderEnd}
              className={`relative ${isDragging ? 'cursor-grab' : ''}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              whileDrag={{ scale: 1.02, boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}
            >
              {isDragging && (
                <div className="absolute -left-6 top-1/2 -translate-y-1/2 text-gray-400">
                  <GripVertical size={16} />
                </div>
              )}
              {widgetComponents[id]}
            </Reorder.Item>
          ))}
        </AnimatePresence>
      </Reorder.Group>
    </div>
  )
}
