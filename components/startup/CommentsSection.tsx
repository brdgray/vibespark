'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { MessageSquare, Flag, Reply } from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from '@/lib/utils/date'

interface Comment {
  id: string
  body: string
  created_at: string
  profiles: {
    display_name: string | null
    avatar_url: string | null
  } | null
}

interface CommentsSectionProps {
  startupId: string
  comments: Comment[]
  user: any
}

export default function CommentsSection({ startupId, comments: initialComments, user }: CommentsSectionProps) {
  const [comments, setComments] = useState(initialComments)
  const [body, setBody] = useState('')
  const [bodyError, setBodyError] = useState<string | null>(null)
  const [replyTo, setReplyTo] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user) { router.push('/auth/signin'); return }

    const trimmed = body.trim()
    if (trimmed.length < 3) { setBodyError('Comment must be at least 3 characters.'); return }
    setBodyError(null)
    setIsSubmitting(true)

    const { data: newComment, error } = await supabase
      .from('startup_comments')
      .insert({
        startup_id: startupId,
        user_id: user.id,
        body: trimmed,
        parent_comment_id: replyTo || null,
      })
      .select('*, profiles(display_name, avatar_url)')
      .single()

    if (error) {
      toast.error('Failed to post comment: ' + error.message)
    } else {
      if (!replyTo) {
        setComments(prev => [newComment as Comment, ...prev])
      }
      toast.success('Comment posted')
      setBody('')
      setReplyTo(null)
      router.refresh()
    }
    setIsSubmitting(false)
  }

  async function reportComment(commentId: string) {
    if (!user) { router.push('/auth/signin'); return }
    await supabase.from('reports').insert({
      entity_type: 'comment',
      entity_id: commentId,
      reported_by: user.id,
      reason: 'User reported',
    })
    toast.success('Comment reported. Thanks for helping keep the community safe.')
  }

  return (
    <section className="bg-white rounded-2xl border p-6">
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <MessageSquare className="h-5 w-5 text-slate-500" />
        Community Feedback ({comments.length})
      </h2>

      {/* Comment form */}
      {user ? (
        <form onSubmit={onSubmit} className="mb-6">
          <Textarea
            placeholder="Share your thoughts, feedback, or ask a question..."
            className="resize-none mb-2"
            rows={3}
            value={body}
            onChange={e => setBody(e.target.value)}
          />
          {bodyError && <p className="text-xs text-destructive mb-2">{bodyError}</p>}
          <div className="flex justify-end gap-2">
            {replyTo && (
              <Button type="button" variant="ghost" size="sm" onClick={() => setReplyTo(null)}>
                Cancel reply
              </Button>
            )}
            <Button type="submit" size="sm" className="bg-orange-500 hover:bg-orange-600" disabled={isSubmitting}>
              {isSubmitting ? 'Posting...' : 'Post Comment'}
            </Button>
          </div>
        </form>
      ) : (
        <div className="mb-6 rounded-2xl bg-slate-50 border border-dashed p-4 text-center text-sm text-muted-foreground">
          <Link href="/auth/signin" className="text-orange-500 font-medium hover:underline">Sign in</Link> to leave feedback
        </div>
      )}

      {/* Comments list */}
      {comments.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No comments yet. Be the first to share your thoughts!</p>
        </div>
      ) : (
        <div className="space-y-5">
          {comments.map((comment, i) => (
            <div key={comment.id}>
              <div className="flex gap-3">
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarImage src={comment.profiles?.avatar_url ?? undefined} />
                  <AvatarFallback className="text-xs bg-orange-100 text-orange-700">
                    {comment.profiles?.display_name?.[0] ?? '?'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-medium text-slate-800">
                      {comment.profiles?.display_name ?? 'Anonymous'}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(comment.created_at)}
                    </span>
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed">{comment.body}</p>
                  <div className="flex items-center gap-3 mt-1.5">
                    {user && (
                      <button
                        onClick={() => setReplyTo(comment.id)}
                        className="text-xs text-muted-foreground hover:text-orange-500 flex items-center gap-1"
                      >
                        <Reply className="h-3 w-3" /> Reply
                      </button>
                    )}
                    {user && user.id !== comment.id && (
                      <button
                        onClick={() => reportComment(comment.id)}
                        className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1"
                      >
                        <Flag className="h-3 w-3" /> Report
                      </button>
                    )}
                  </div>
                </div>
              </div>
              {i < comments.length - 1 && <Separator className="mt-5" />}
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
