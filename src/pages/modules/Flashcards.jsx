import { useEffect, useState, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../../store/authStore'
import { supabase } from '../../lib/supabase'
import { ArrowLeft, ArrowRight, RotateCcw, CheckCircle2, XCircle, Trophy } from 'lucide-react'

// Single flashcard with 3D flip
function FlipCard({ front, back, flipped, onClick }) {
  return (
    <div
      onClick={onClick}
      className="cursor-pointer w-full"
      style={{ perspective: '1000px', minHeight: '260px' }}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          minHeight: '260px',
          transformStyle: 'preserve-3d',
          transition: 'transform 0.5s ease',
          transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}
      >
        {/* Front */}
        <div
          className="absolute inset-0 rounded-2xl bg-navy-800 border-2 border-navy-700
                     flex flex-col items-center justify-center p-8 text-center"
          style={{ backfaceVisibility: 'hidden' }}
        >
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-4 font-semibold">
            Term / Concept
          </p>
          <p className="text-xl font-bold text-white leading-relaxed">{front}</p>
          <p className="text-xs text-gray-600 mt-6">Tap to reveal answer</p>
        </div>

        {/* Back */}
        <div
          className="absolute inset-0 rounded-2xl bg-navy-700 border-2 border-alex-amber/40
                     flex flex-col items-center justify-center p-8 text-center"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <p className="text-xs text-alex-amber uppercase tracking-widest mb-4 font-semibold">
            Answer
          </p>
          <p className="text-base text-gray-200 leading-relaxed">{back}</p>
        </div>
      </div>
    </div>
  )
}

export default function Flashcards() {
  const { moduleId } = useParams()
  const { i18n }     = useTranslation()
  const { user }     = useAuthStore()
  const navigate     = useNavigate()
  const isEs         = i18n.language === 'ES'

  const [cards,   setCards]   = useState([])
  const [module,  setModule]  = useState(null)
  const [loading, setLoading] = useState(true)
  const [idx,     setIdx]     = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [known,   setKnown]   = useState([])   // indices marked as known
  const [review,  setReview]  = useState([])   // indices to review again
  const [phase,   setPhase]   = useState('study') // 'study' | 'review' | 'done'
  const [queue,   setQueue]   = useState([])   // current deck indices

  const examType = module?.code?.startsWith('BL') ? 'BL' : 'TRADE'
  const basePath = examType === 'BL' ? '/bl' : '/trade'

  useEffect(() => {
    const load = async () => {
      try {
        const { data: mod } = await supabase
          .from('modules').select('*').eq('id', moduleId).single()
        setModule(mod)

        const { data: fc } = await supabase
          .from('flashcards').select('*')
          .eq('module_id', moduleId).eq('is_active', true)
          .order('order_num')
        setCards(fc || [])
        setQueue(fc ? fc.map((_, i) => i) : [])
      } catch (err) {
        console.error('Flashcards load error:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [moduleId])

  const current = cards[queue[idx]]

  const handleFlip = () => setFlipped(f => !f)

  const handleKnow = () => {
    setKnown(k => [...k, queue[idx]])
    nextCard()
  }

  const handleReview = () => {
    setReview(r => [...r, queue[idx]])
    nextCard()
  }

  const nextCard = () => {
    setFlipped(false)
    setTimeout(() => {
      if (idx + 1 < queue.length) {
        setIdx(i => i + 1)
      } else {
        // Round complete
        if (phase === 'study') {
          if (review.length > 0) {
            // Do a review round with only the ones they didn't know
            setPhase('review')
            setQueue(review)
            setReview([])
            setKnown([])
            setIdx(0)
          } else {
            setPhase('done')
          }
        } else {
          // Review round done
          if (review.length > 0) {
            // Another review pass
            setQueue(review)
            setReview([])
            setKnown([])
            setIdx(0)
          } else {
            setPhase('done')
          }
        }
      }
    }, 150)
  }

  const restart = () => {
    setPhase('study')
    setIdx(0)
    setFlipped(false)
    setKnown([])
    setReview([])
    setQueue(cards.map((_, i) => i))
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-2 border-alex-amber border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (cards.length === 0) return (
    <div className="text-center py-20">
      <p className="text-4xl mb-4">🃏</p>
      <p className="text-white font-bold text-lg">No flashcards yet</p>
      <p className="text-gray-400 text-sm mt-2">Flashcards for this module are coming soon.</p>
      <button onClick={() => navigate(-1)} className="btn-secondary mt-6">Go Back</button>
    </div>
  )

  // Done screen
  if (phase === 'done') {
    const total  = cards.length
    const pct    = Math.round((known.length / total) * 100)
    return (
      <div className="max-w-md mx-auto text-center animate-bounce-in py-12">
        <div className="text-6xl mb-6">{pct >= 80 ? '🏆' : '💪'}</div>
        <h1 className="text-3xl font-black text-white mb-2">
          {pct >= 80 ? 'Great work!' : 'Keep practicing!'}
        </h1>
        <p className="text-gray-400 mb-8">
          You knew <span className="text-alex-amber font-bold">{known.length}</span> out of{' '}
          <span className="text-white font-bold">{total}</span> cards
        </p>
        <div className="card mb-8">
          <div className="progress-bar mb-2">
            <div className="progress-fill" style={{ width: `${pct}%` }} />
          </div>
          <p className="text-right text-sm font-bold text-white">{pct}%</p>
        </div>
        <div className="flex gap-3 justify-center">
          <button onClick={restart} className="btn-secondary flex items-center gap-2">
            <RotateCcw size={16} /> Study Again
          </button>
          <button
            onClick={() => navigate(`${basePath}/modules/${moduleId}`)}
            className="btn-primary flex items-center gap-2">
            Back to Module <ArrowRight size={16} />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => navigate(`${basePath}/modules/${moduleId}`)}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm">
          <ArrowLeft size={16} />
          {isEs ? module?.title_es : module?.title_en}
        </button>
        <div className="flex items-center gap-2">
          {phase === 'review' && (
            <span className="text-xs bg-alex-warning/20 text-orange-400 border border-orange-500/30
                             px-2 py-1 rounded-full font-semibold">
              Review Round
            </span>
          )}
          <span className="text-gray-400 text-sm font-mono">
            {idx + 1} / {queue.length}
          </span>
        </div>
      </div>

      {/* Progress */}
      <div className="progress-bar mb-6">
        <div className="progress-fill transition-all duration-300"
             style={{ width: `${((idx) / queue.length) * 100}%` }} />
      </div>

      {/* Stats row */}
      <div className="flex gap-4 mb-6">
        <div className="flex items-center gap-1.5 text-sm text-alex-success">
          <CheckCircle2 size={14} /> <span className="font-bold">{known.length}</span> Known
        </div>
        <div className="flex items-center gap-1.5 text-sm text-orange-400">
          <RotateCcw size={14} /> <span className="font-bold">{review.length}</span> To review
        </div>
        <div className="flex items-center gap-1.5 text-sm text-gray-500">
          <span className="font-bold">{queue.length - idx - 1}</span> Remaining
        </div>
      </div>

      {/* Card */}
      {current && (
        <FlipCard
          front={isEs ? current.front_es : current.front_en}
          back={isEs ? current.back_es   : current.back_en}
          flipped={flipped}
          onClick={handleFlip}
        />
      )}

      {/* Hint */}
      {current && (isEs ? current.hint_es : current.hint_en) && !flipped && (
        <p className="text-center text-xs text-gray-600 mt-3">
          💡 {isEs ? current.hint_es : current.hint_en}
        </p>
      )}

      {/* Action buttons — only show after flip */}
      <div className={`mt-6 flex gap-4 transition-all duration-300
                       ${flipped ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <button
          onClick={handleReview}
          className="flex-1 flex items-center justify-center gap-2 py-4 rounded-xl font-bold
                     bg-red-500/10 border border-red-500/30 text-red-400
                     hover:bg-red-500/20 transition-all active:scale-95">
          <XCircle size={20} />
          {isEs ? 'Repasar' : 'Still Learning'}
        </button>
        <button
          onClick={handleKnow}
          className="flex-1 flex items-center justify-center gap-2 py-4 rounded-xl font-bold
                     bg-alex-success/10 border border-alex-success/30 text-alex-success
                     hover:bg-alex-success/20 transition-all active:scale-95">
          <CheckCircle2 size={20} />
          {isEs ? 'Lo sé' : 'Got It!'}
        </button>
      </div>

      {/* Flip hint */}
      {!flipped && (
        <p className="text-center text-gray-600 text-xs mt-4">
          Tap the card to reveal the answer
        </p>
      )}
    </div>
  )
}
