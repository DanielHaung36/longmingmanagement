"use client"

import React, { useState, useRef, useEffect } from "react"
import { useGetCommentsQuery, useCreateCommentMutation, useDeleteCommentMutation, useUpdateCommentMutation, useGetUsersQuery } from "@/state/api"
import type { Comment, User } from "@/state/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Trash2, Send, MessageCircle, AtSign, Image as ImageIcon, X, Plus, Minus, RotateCcw } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAppSelector } from "@/redux"
import { toast } from "sonner"
import { Dialog, DialogContent } from "@/components/ui/dialog"

interface CommentSectionProps {
  entityType: "project" | "task"
  entityId: number
  currentUserId?: number
}

type CommentWithAuthor = Comment & {
  users?: Partial<User>
  author?: Partial<User>
  displayName?: string
  images?: string[] | string
  mentions?: { id?: number; user?: Partial<User> }[]
  comment_mentions?: { users?: Partial<User> }[]
  replies?: CommentWithAuthor[]
  replyTo?: {
    id: number
    userId: number
    user?: Partial<User>
    displayName?: string
  }
}

const resolveCommentUser = (comment: CommentWithAuthor) =>
  comment.user ?? comment.users ?? comment.author ?? null

const resolveDisplayName = (comment: CommentWithAuthor) => {
  const user = resolveCommentUser(comment)
  return comment.displayName || user?.realName || user?.username || "Unknown"
}

const parseImages = (images?: string[] | string): string[] => {
  if (!images) return []
  if (Array.isArray(images)) return images
  try {
    const parsed = JSON.parse(images)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function CommentSection({ entityType, entityId, currentUserId }: CommentSectionProps) {
  const authUserId = useAppSelector((state) => state.auth.user?.id ?? null)
  const effectiveCurrentUserId = currentUserId ?? authUserId ?? null

  const [commentText, setCommentText] = useState("")
  const [replyingToId, setReplyingToId] = useState<number | null>(null)
  const [replyText, setReplyText] = useState("")
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null)
  const [editText, setEditText] = useState("")

  // @mention feature state
  const [showUserSelector, setShowUserSelector] = useState(false)
  const [mentionSearch, setMentionSearch] = useState("")
  const [cursorPosition, setCursorPosition] = useState(0)
  const [commentMentionedUserIds, setCommentMentionedUserIds] = useState<number[]>([])
  const [replyMentionedUserIds, setReplyMentionedUserIds] = useState<number[]>([])
  const [mentionStartPos, setMentionStartPos] = useState(0)

  // Image upload state
  const [selectedImages, setSelectedImages] = useState<string[]>([])
  const [replyImages, setReplyImages] = useState<string[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [zoomLevel, setZoomLevel] = useState(1)

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const replyTextareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const replyFileInputRef = useRef<HTMLInputElement>(null)

  const { data: commentsResponse, isLoading: loadingComments, refetch } = useGetCommentsQuery({
    entityType,
    entityId,
  })
  const { data: usersResponse } = useGetUsersQuery({})
  const [createComment, { isLoading: creating }] = useCreateCommentMutation()
  const [deleteComment] = useDeleteCommentMutation()
  const [updateComment, { isLoading: updating }] = useUpdateCommentMutation()

  const comments = (commentsResponse?.data?.comments as CommentWithAuthor[]) || []
  const users = usersResponse?.data?.data || []

  // Format date
  const formatDate = (date: Date | string) => {
    const d = new Date(date)
    const now = new Date()
    const diff = now.getTime() - d.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return "just now"
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return d.toLocaleString("en-AU", { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
  }

  // Handle @mention input
  const handleTextChange = (text: string, isReply: boolean = false) => {
    if (isReply) {
      setReplyText(text)
    } else {
      setCommentText(text)
    }

    // Detect @ symbol
    const textarea = isReply ? replyTextareaRef.current : textareaRef.current
    if (!textarea) return

    const cursorPos = textarea.selectionStart
    const textBeforeCursor = text.substring(0, cursorPos)
    const lastAtIndex = textBeforeCursor.lastIndexOf('@')

    if (lastAtIndex !== -1 && lastAtIndex === cursorPos - 1) {
      // Just typed @
      setShowUserSelector(true)
      setMentionSearch("")
      setMentionStartPos(lastAtIndex)
      setCursorPosition(cursorPos)
    } else if (lastAtIndex !== -1 && cursorPos > lastAtIndex) {
      // Typing after @
      const searchText = textBeforeCursor.substring(lastAtIndex + 1)
      if (!searchText.includes(' ')) {
        setShowUserSelector(true)
        setMentionSearch(searchText)
        setMentionStartPos(lastAtIndex)
        setCursorPosition(cursorPos)
      } else {
        setShowUserSelector(false)
      }
    } else {
      setShowUserSelector(false)
    }
  }

  // Select user for @mention
  const selectUser = (user: User, isReply: boolean = false) => {
    const currentText = isReply ? replyText : commentText
    const beforeMention = currentText.substring(0, mentionStartPos)
    const afterCursor = currentText.substring(cursorPosition)
    const newText = `${beforeMention}@${user.realName || user.username} ${afterCursor}`

    if (isReply) {
      setReplyText(newText)
    } else {
      setCommentText(newText)
    }

    // Record mentioned users
    if (isReply) {
      setReplyMentionedUserIds((prev) => (prev.includes(user.id) ? prev : [...prev, user.id]))
    } else {
      setCommentMentionedUserIds((prev) => (prev.includes(user.id) ? prev : [...prev, user.id]))
    }

    setShowUserSelector(false)
    setMentionSearch("")
  }

  // Filter users list
  const filteredUsers = users.filter(user => {
    if (!mentionSearch) return true
    const searchLower = mentionSearch.toLowerCase()
    return (
      user.username?.toLowerCase().includes(searchLower) ||
      user.realName?.toLowerCase().includes(searchLower)
    )
  }).slice(0, 10)

  // Handle image selection
  const handleImageSelect = async (event: React.ChangeEvent<HTMLInputElement>, isReply: boolean = false) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    setIsUploading(true)
    const imageUrls: string[] = []

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]

        // Validate file type
        if (!file.type.startsWith('image/')) {
          toast.error(`${file.name} is not an image file`)
          continue
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`${file.name} is too large (max 5MB)`)
          continue
        }

        // Convert to base64
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result as string)
          reader.onerror = reject
          reader.readAsDataURL(file)
        })

        imageUrls.push(base64)
      }

      if (isReply) {
        setReplyImages([...replyImages, ...imageUrls])
      } else {
        setSelectedImages([...selectedImages, ...imageUrls])
      }

      toast.success(`${imageUrls.length} image(s) added`)
    } catch (error) {
      console.error("Failed to process images:", error)
      toast.error("Failed to process images")
    } finally {
      setIsUploading(false)
      // Reset file input
      if (event.target) event.target.value = ''
    }
  }

  // Remove image
  const removeImage = (index: number, isReply: boolean = false) => {
    if (isReply) {
      setReplyImages(replyImages.filter((_, i) => i !== index))
    } else {
      setSelectedImages(selectedImages.filter((_, i) => i !== index))
    }
  }

  // Post comment
  const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")

  const deriveMentionedUserIds = (text: string, preselectedIds: number[]): number[] => {
    const source = text || ""
    const idSet = new Set<number>(preselectedIds)

    if (!source || users.length === 0) {
      return Array.from(idSet)
    }

    users.forEach((user) => {
      if (!user || typeof user.id !== "number") return
      const candidates = [
        user.username?.trim() || "",
        user.realName?.trim() || "",
        (user.realName || user.username)?.trim() || "",
      ]

      candidates
        .filter(Boolean)
        .forEach((candidate) => {
          const pattern = new RegExp(`(^|\\s)@${escapeRegExp(candidate)}(?=\\s|$|[.,!?;:])`, "i")
          if (pattern.test(source)) {
            idSet.add(user.id)
          }
        })
    })

    return Array.from(idSet)
  }

  const handleSubmit = async () => {
    if (!commentText.trim() && selectedImages.length === 0) return

    try {
      const trimmedContent = commentText.trim()
      const contentForApi = trimmedContent || (selectedImages.length > 0 ? "[image]" : trimmedContent)
      const mentionedIds = deriveMentionedUserIds(commentText, commentMentionedUserIds)

      await createComment({
        content: contentForApi,
        images: selectedImages.length > 0 ? selectedImages : undefined,
        entityType,
        entityId,
        mentionedUserIds: mentionedIds.length > 0 ? mentionedIds : undefined,
      }).unwrap()

      setCommentText("")
      setCommentMentionedUserIds([])
      setSelectedImages([])
      toast.success("Comment posted successfully")
      await refetch()
    } catch (error) {
      console.error("Failed to create comment:", error)
      toast.error("Failed to post comment, please retry")
    }
  }

  // Reply to comment
  const handleReply = async (parentId: number) => {
    if (!replyText.trim() && replyImages.length === 0) return

    try {
      const trimmedContent = replyText.trim()
      const contentForApi = trimmedContent || (replyImages.length > 0 ? "[image]" : trimmedContent)
      const mentionedIds = deriveMentionedUserIds(replyText, replyMentionedUserIds)

      await createComment({
        content: contentForApi,
        images: replyImages.length > 0 ? replyImages : undefined,
        entityType,
        entityId,
        parentId,
        mentionedUserIds: mentionedIds.length > 0 ? mentionedIds : undefined,
      }).unwrap()

      setReplyText("")
      setReplyingToId(null)
      setReplyMentionedUserIds([])
      setReplyImages([])
      toast.success("Reply posted successfully")
      await refetch()
    } catch (error) {
      console.error("Failed to reply:", error)
      toast.error("Failed to reply, please retry")
    }
  }

  // Edit comment
  const startEdit = (comment: CommentWithAuthor) => {
    setEditingCommentId(comment.id)
    setEditText(comment.content)
  }

  const saveEdit = async (commentId: number) => {
    if (!editText.trim()) return

    try {
      await updateComment({
        id: commentId,
        content: editText,
      }).unwrap()

      setEditingCommentId(null)
      setEditText("")
      await refetch()
    } catch (error) {
      console.error("Failed to update comment:", error)
      alert("Failed to update comment, please retry")
    }
  }

  // Delete comment
  const handleDelete = async (commentId: number) => {
    if (!confirm("Are you sure you want to delete this comment?")) return

    try {
      await deleteComment(commentId).unwrap()
      await refetch()
    } catch (error) {
      console.error("Failed to delete comment:", error)
      alert("Failed to delete comment, please retry")
    }
  }

  const openImagePreview = (image: string) => {
    setPreviewImage(image)
    setZoomLevel(1)
    setIsPreviewOpen(true)
  }

  const closeImagePreview = () => {
    setIsPreviewOpen(false)
    setPreviewImage(null)
    setZoomLevel(1)
  }

  const changeZoom = (delta: number) => {
    setZoomLevel((prev) => {
      const next = prev + delta
      return Math.min(Math.max(next, 0.5), 3)
    })
  }

  const resetZoom = () => setZoomLevel(1)

  // Render single comment (simplified style)
  const renderComment = (comment: CommentWithAuthor, floor: number) => {
    const displayName = resolveDisplayName(comment)
    const username = resolveCommentUser(comment)?.username || displayName
    const commentOwnerId = comment.userId ?? resolveCommentUser(comment)?.id ?? null
    const isOwner = effectiveCurrentUserId !== null && commentOwnerId === effectiveCurrentUserId
    const replies = Array.isArray(comment.replies) ? comment.replies : []
    const hasReplies = replies.length > 0

    return (
      <div key={comment.id} className="border-b last:border-b-0 py-4">
        {/* Main comment */}
        <div className="flex gap-3">
          {/* Avatar */}
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-blue-500 text-white">
              {username.substring(0, 1).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* User info */}
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-gray-900">{displayName}</span>
              <Badge variant="secondary" className="text-xs">#{floor}</Badge>
              <span className="text-sm text-gray-500">{formatDate(comment.createdAt)}</span>
              {isOwner && <Badge variant="outline" className="text-xs">Me</Badge>}
            </div>

            {/* Comment content */}
            {editingCommentId === comment.id ? (
              <div className="space-y-2">
                <Textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="min-h-[60px]"
                  disabled={updating}
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setEditingCommentId(null)
                      setEditText("")
                    }}
                  >
                    Cancel
                  </Button>
                  <Button size="sm" onClick={() => saveEdit(comment.id)} disabled={updating}>
                    Save
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="text-gray-800 mb-2 whitespace-pre-wrap break-words">
                  {comment.content}
                </div>

                {/* Comment images */}
                {(() => {
                  const images = parseImages(comment.images)
                  return images.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2 mb-2">
                      {images.map((image, index) => (
                        <img
                          key={index}
                          src={image}
                          alt={`Comment image ${index + 1}`}
                          className="max-w-full sm:max-w-xs max-h-60 rounded border cursor-pointer hover:opacity-90"
                          onClick={() => openImagePreview(image)}
                        />
                      ))}
                    </div>
                  )
                })()}

                {/* Action buttons */}
                <div className="flex items-center gap-3 text-sm">
                  <button
                    onClick={() => {
                      setReplyingToId(comment.id)
                      setReplyText(`@${displayName} `)
                      if (commentOwnerId) {
                        setReplyMentionedUserIds((prev) =>
                          prev.includes(commentOwnerId) ? prev : [...prev, commentOwnerId]
                        )
                      }
                    }}
                    className="text-gray-600 hover:text-blue-600 flex items-center gap-1"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Reply
                    {hasReplies && <span className="text-blue-600">({replies.length})</span>}
                  </button>
                  {isOwner && (
                    <>
                      <button
                        onClick={() => startEdit(comment)}
                        className="text-gray-600 hover:text-green-600"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(comment.id)}
                        className="text-gray-600 hover:text-red-600"
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Reply list (simplified style) */}
        {hasReplies && (
          <div className="ml-12 mt-3 space-y-3 pl-4 border-l-2 border-gray-200">
            {replies.map((reply) => {
              const replyDisplayName = resolveDisplayName(reply)
              const replyUsername = resolveCommentUser(reply)?.username || replyDisplayName
              const replyOwnerId = reply.userId ?? resolveCommentUser(reply)?.id ?? null
              const isReplyOwner = effectiveCurrentUserId !== null && replyOwnerId === effectiveCurrentUserId
              const replyTargetName = reply.replyTo?.displayName || displayName

              return (
                <div key={reply.id} className="flex gap-2">
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="bg-gray-400 text-white text-xs">
                      {replyUsername.substring(0, 1).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium">{replyDisplayName}</span>
                      <span className="text-xs text-gray-500">replied to</span>
                      <span className="text-xs text-blue-600">{replyTargetName}</span>
                      <span className="text-xs text-gray-400">{formatDate(reply.createdAt)}</span>
                      {isReplyOwner && <Badge variant="outline" className="text-xs">Me</Badge>}
                    </div>
                    <div className="text-sm text-gray-800 whitespace-pre-wrap break-words">
                      {reply.content}
                    </div>

                    {/* Reply images */}
                    {(() => {
                      const replyImages = parseImages(reply.images)
                      return replyImages.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {replyImages.map((image, index) => (
                            <img
                              key={index}
                              src={image}
                              alt={`Reply image ${index + 1}`}
                              className="max-w-full sm:max-w-[200px] max-h-32 rounded border cursor-pointer hover:opacity-90"
                              onClick={() => openImagePreview(image)}
                            />
                          ))}
                        </div>
                      )
                    })()}

                    <div className="flex gap-2 mt-1 text-xs">
                      <button
                        onClick={() => {
                          setReplyingToId(comment.id)
                          setReplyText(`@${replyDisplayName} `)
                          if (replyOwnerId) {
                            setReplyMentionedUserIds((prev) =>
                              prev.includes(replyOwnerId) ? prev : [...prev, replyOwnerId]
                            )
                          }
                        }}
                        className="text-gray-500 hover:text-blue-600"
                      >
                        Reply
                      </button>
                      {isReplyOwner && (
                        <button
                          onClick={() => handleDelete(reply.id)}
                          className="text-gray-500 hover:text-red-600"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Reply box */}
        {replyingToId === comment.id && (
          <div className="ml-4 sm:ml-12 mt-3 relative">
            <Textarea
              ref={replyTextareaRef}
              value={replyText}
              onChange={(e) => handleTextChange(e.target.value, true)}
              placeholder={`Reply to ${displayName}...`}
              className="min-h-[80px] pr-24"
              autoFocus
            />

            {/* @mention user selector */}
            {showUserSelector && filteredUsers.length > 0 && (
              <div className="absolute bottom-full mb-2 left-0 w-full sm:w-64 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto z-10">
                {filteredUsers.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => selectUser(user, true)}
                    className="w-full px-3 py-2 text-left hover:bg-gray-100 flex items-center gap-2"
                  >
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="bg-blue-500 text-white text-xs">
                        {(user.realName || user.username).substring(0, 1).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="text-sm font-medium">{user.realName || user.username}</div>
                      <div className="text-xs text-gray-500">@{user.username}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Reply image previews */}
            {replyImages.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {replyImages.map((image, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={image}
                      alt={`Reply preview ${index + 1}`}
                      className="h-16 w-16 object-cover rounded border"
                    />
                    <button
                      onClick={() => removeImage(index, true)}
                      className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2 mt-2">
              <div className="flex items-center gap-2">
                <input
                  ref={replyFileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => handleImageSelect(e, true)}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => replyFileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  <ImageIcon className="h-3 w-3 mr-1" />
                  Images
                </Button>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setReplyingToId(null)
                    setReplyText("")
                    setReplyMentionedUserIds([])
                    setReplyImages([])
                  }}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleReply(comment.id)}
                  disabled={creating || isUploading || (!replyText.trim() && replyImages.length === 0)}
                >
                  <Send className="h-4 w-4 mr-1" />
                  Send
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  if (loadingComments) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-gray-500">
          Loading...
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <Dialog open={isPreviewOpen} onOpenChange={(open) => (open ? setIsPreviewOpen(true) : closeImagePreview())}>
        <DialogContent className="max-w-5xl border-0 bg-transparent p-0 shadow-none">
          {previewImage && (
            <div className="relative rounded-lg bg-black/90 p-4">
              <div className="max-h-[80vh] overflow-auto">
                <img
                  src={previewImage}
                  alt="Preview"
                  style={{ transform: `scale(${zoomLevel})`, transformOrigin: "center" }}
                  className="mx-auto max-h-[70vh] w-auto object-contain transition-transform duration-150"
                />
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-white">
                <div className="flex gap-2">
                  <button
                    onClick={() => changeZoom(-0.25)}
                    className="rounded-full border border-white/40 bg-white/20 p-2 transition hover:bg-white/30"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => changeZoom(0.25)}
                    className="rounded-full border border-white/40 bg-white/20 p-2 transition hover:bg-white/30"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                  <button
                    onClick={resetZoom}
                    className="rounded-full border border-white/40 bg-white/20 p-2 transition hover:bg-white/30"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </button>
                </div>
                <span className="text-sm text-white/80">Zoom: {(zoomLevel * 100).toFixed(0)}%</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Comments ({comments.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Post comment area */}
        <div className="relative">
          <Textarea
            ref={textareaRef}
            value={commentText}
            onChange={(e) => handleTextChange(e.target.value)}
            placeholder="Add a comment... (type @ to mention users)"
            className="min-h-[100px] pr-24"
          />

          {/* @mention user selector */}
          {showUserSelector && filteredUsers.length > 0 && (
            <div className="absolute bottom-full mb-2 left-0 w-full sm:w-64 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto z-10">
              <div className="px-3 py-2 text-xs text-gray-500 border-b">
                <AtSign className="h-3 w-3 inline mr-1" />
                Select user to mention
              </div>
              {filteredUsers.map((user) => (
                <button
                  key={user.id}
                  onClick={() => selectUser(user)}
                  className="w-full px-3 py-2 text-left hover:bg-gray-100 flex items-center gap-2"
                >
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="bg-blue-500 text-white text-xs">
                      {(user.realName || user.username).substring(0, 1).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="text-sm font-medium">{user.realName || user.username}</div>
                    <div className="text-xs text-gray-500">@{user.username}</div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Image previews */}
          {selectedImages.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {selectedImages.map((image, index) => (
                <div key={index} className="relative group">
                  <img
                    src={image}
                    alt={`Preview ${index + 1}`}
                    className="h-16 w-16 sm:h-20 sm:w-20 object-cover rounded border"
                  />
                  <button
                    onClick={() => removeImage(index)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2 mt-2">
            <div className="flex items-center gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => handleImageSelect(e, false)}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                <ImageIcon className="h-4 w-4 mr-1" />
                Add Images
              </Button>
              <div className="text-xs text-gray-500">
                {commentMentionedUserIds.length > 0 && (
                  <span className="flex items-center gap-1">
                    <AtSign className="h-3 w-3" />
                    {commentMentionedUserIds.length} user(s) selected
                  </span>
                )}
              </div>
            </div>
            <Button
              onClick={handleSubmit}
              disabled={creating || isUploading || (!commentText.trim() && selectedImages.length === 0)}
              size="sm"
            >
              <Send className="h-4 w-4 mr-1" />
              Post
            </Button>
          </div>
        </div>

        {/* Comment list */}
        {comments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No comments yet</div>
        ) : (
          <div className="space-y-0 divide-y">
            {comments.map((comment, index) => renderComment(comment, index + 1))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
