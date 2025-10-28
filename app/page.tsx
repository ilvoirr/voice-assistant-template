'use client'

import React, { useState, useRef, useEffect, FormEvent, useCallback } from 'react'
import {
  PanelLeft,
  MessageSquarePlus,
  Trash2,
  Share,
  Paperclip,
  Mic,
  MicOff,
  CornerDownLeft,
  User,
  Bot,
  Moon,
  Sun,
  X
} from 'lucide-react'
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)) }

interface Chat { id: string; title: string; messages: Message[] }
interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

const ChatBubble = ({ message, isDarkMode }: { message: Message; isDarkMode: boolean }) => {
  const isUser = message.role === 'user'
  const userBubbleClasses = 'bg-indigo-600 text-white shadow-sm'
  const assistantBubbleClasses = isDarkMode
    ? 'bg-zinc-900 text-zinc-100 shadow-sm border border-zinc-800'
    : 'bg-white border border-gray-200 text-zinc-800 shadow-sm'

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className={cn(
          "flex items-center justify-center w-8 h-8 rounded-md flex-shrink-0 mr-2 mt-2 transition-colors duration-300",
          isDarkMode ? "bg-zinc-900" : "bg-zinc-100")}>
          <Bot size={18} className={cn(
            "transition-colors duration-300",
            isDarkMode ? "text-zinc-400" : "text-zinc-500")} />
        </div>
      )}
      <div className={cn(
        'px-4 py-3 rounded-md max-w-2xl flex flex-col',
        'transition-colors duration-300',
        isUser
          ? `rounded-br-md ${userBubbleClasses}`
          : `rounded-tl-md ${assistantBubbleClasses}`)}>
        <div className="whitespace-pre-wrap break-words">{message.content}</div>
        <div className="text-xs mt-1 text-right text-zinc-400/90 transition-colors duration-300">
          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
      {isUser && (
        <div className={cn(
          "flex items-center justify-center w-8 h-8 rounded-md ml-2 mt-2 flex-shrink-0 transition-colors duration-300",
          isDarkMode ? "bg-indigo-900/50" : "bg-indigo-100")}>
          <User size={18} className={cn(
            "transition-colors duration-300",
            isDarkMode ? "text-indigo-300" : "text-indigo-700")} />
        </div>
      )}
    </div>
  )
}

async function fetchChatTitle(message: string): Promise<string> {
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: `Give a concise chat topic title (max 8 words, no punctuation, no quotes):\n${message}` }]
      })
    })
    if (!response.ok) return 'New Chat'
    const reader = response.body?.getReader();
    if (!reader) return 'New Chat';
    const decoder = new TextDecoder();
    let result = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') continue;
          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices[0]?.delta?.content;
            if (content) result += content;
          } catch (e) { }
        }
      }
    }
    return result.trim().replace(/["'.]/g, '') || 'New Chat';
  } catch (error) {
    return 'New Chat'
  }
}

interface InputFormProps {
  centered?: boolean
  input: string
  setInput: (value: string) => void
  isLoading: boolean
  isDarkMode: boolean
  handleSubmit: (e: FormEvent) => void
  handleKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void
  isVoiceModeActive: boolean
  onVoiceToggle: () => void
  // Props for file attachment
  onFileAttachClick: () => void
  fileName: string | null
  onRemoveFile: () => void
}

const InputForm = React.memo(({
  centered = false,
  input, setInput, isLoading, isDarkMode, handleSubmit, handleKeyDown,
  isVoiceModeActive, onVoiceToggle,
  onFileAttachClick, fileName, onRemoveFile // <-- Destructure new props
}: InputFormProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [input])

  return (
    <>
      <form
        onSubmit={handleSubmit}
        className={cn(
          'w-full rounded-md border shadow-2xl flex flex-col items-stretch',
          'transition-colors duration-300', centered && 'mt-8',
          isDarkMode
            ? "bg-zinc-900/70 backdrop-blur-md border-zinc-800 shadow-zinc-950/70"
            : "bg-white/90 backdrop-blur border-zinc-200"
        )}>
        
        {/* --- New File Attachment UI --- */}
        {fileName && (
          <div className={cn(
            "flex items-center justify-between px-4 py-2 border-b",
            "transition-colors duration-300",
            isDarkMode ? "border-zinc-800 bg-zinc-900/50" : "border-zinc-200 bg-white"
          )}>
            <span className={cn(
              "text-sm font-medium truncate",
              isDarkMode ? "text-zinc-300" : "text-zinc-600"
            )}>
              {fileName}
            </span>
            <button
              type="button"
              onClick={onRemoveFile}
              className={cn(
                "p-1 rounded-md transition-all",
                isDarkMode ? "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800" : "text-zinc-500 hover:text-red-600 hover:bg-red-100"
              )}
              aria-label="Remove file"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        {/* --- End File Attachment UI --- */}

        <textarea
          ref={textareaRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className={cn(
            "w-full max-h-[160px] bg-transparent resize-none p-4 focus:outline-none",
            "transition-colors duration-300",
            isDarkMode ? "text-white placeholder-zinc-500" : "text-zinc-900 placeholder-zinc-400")
          }
          placeholder={isVoiceModeActive ? "Listening..." : "Message chatbot..."}
          rows={1}
          disabled={isLoading}
        />
        <div className="flex items-center justify-between px-4 pb-3 pt-1">
          <button
            type="button"
            className={cn(
              "p-2 rounded-md transition-all",
              isDarkMode
                ? "text-zinc-400 hover:text-indigo-400 hover:bg-zinc-800"
                : "text-zinc-500 hover:text-indigo-600 hover:bg-zinc-100"
            )}
            aria-label="Attach file"
            onClick={onFileAttachClick} // <-- Updated onClick
          >
            <Paperclip className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className={cn(
                "p-2 rounded-md transition-all",
                isVoiceModeActive
                  ? "bg-indigo-600 text-white hover:bg-indigo-700"
                  : isDarkMode
                    ? "text-zinc-400 hover:text-indigo-400 hover:bg-zinc-800"
                    : "text-zinc-500 hover:text-indigo-600 hover:bg-zinc-100"
              )}
              aria-label={isVoiceModeActive ? "Disable voice mode" : "Enable voice mode"}
              onClick={onVoiceToggle}
            >
              {isVoiceModeActive ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
            </button>
            <button
              type="submit"
              disabled={isLoading || (!input.trim() && !fileName)}
              className={cn(
                'p-2 rounded-lg transition-all duration-200 disabled:cursor-not-allowed',
                'enabled:bg-indigo-600 enabled:text-white enabled:hover:bg-indigo-700 enabled:shadow-lg',
                isDarkMode
                  ? 'disabled:bg-zinc-800 disabled:text-zinc-500'
                  : 'disabled:bg-zinc-100 disabled:text-zinc-400'
              )}
              aria-label="Send message"
            >
              <CornerDownLeft className="w-5 h-5" />
            </button>
          </div>
        </div>
      </form>
      <p className={cn(
        "text-xs pt-2 text-center select-none",
        "transition-colors duration-300",
        isDarkMode ? "text-zinc-600" : "text-zinc-500"
      )}>
        {isVoiceModeActive
          ? "Voice mode active - speak naturally, pause to send"
          : <>Press <kbd className={cn("font-medium transition-colors duration-300", isDarkMode ? "text-zinc-500" : "text-zinc-600")}>Enter</kbd> to send, or <kbd className={cn("font-medium transition-colors duration-300", isDarkMode ? "text-zinc-500" : "text-zinc-600")}>Shift + Enter</kbd> for a new line.</>
        }
      </p>
    </>
  )
})
InputForm.displayName = 'InputForm'

export default function ChatPage() {
  const [chats, setChats] = useState<Chat[]>([])
  const [activeChat, setActiveChat] = useState<Chat | null>(null)
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isDarkMode, setIsDarkMode] = useState(false)
  
  // --- NEW: Mobile state ---
  const [isMobile, setIsMobile] = useState<boolean>(false);

  // --- New File State ---
  const [fileContent, setFileContent] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  // --- End File State ---

  // Voice mode states
  const [isVoiceModeActive, setIsVoiceModeActive] = useState(false)
  const [connection, setConnection] = useState<WebSocket | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const isConnectingRef = useRef(false)
  const isVoiceModeActiveRef = useRef(false)

  // KEY FIX: Add these refs for state sync
  const activeChatRef = useRef<Chat | null>(null)
  const isLoadingRef = useRef(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const prevIsLoadingRef = useRef(isLoading)
  const [lastTTSMessageId, setLastTTSMessageId] = useState<string | null>(null)
  
  // --- NEW: Effect to check device size ---
  useEffect(() => {
    const checkDevice = () => setIsMobile(window.innerWidth < 768); // 768px is 'md' breakpoint
    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  // Keep ref values in sync with state
  useEffect(() => { isVoiceModeActiveRef.current = isVoiceModeActive }, [isVoiceModeActive])
  useEffect(() => { activeChatRef.current = activeChat }, [activeChat])
  useEffect(() => { isLoadingRef.current = isLoading }, [isLoading])

  const stopTTS = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      audioRef.current.src = ""
    }
  }, [])

  const playTTS = useCallback(async (text: string) => {
    try {
      stopTTS()
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text })
      })
      if (!res.ok) return
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      if (audioRef.current) {
        audioRef.current.src = url
        audioRef.current.onloadeddata = () => {
          audioRef.current?.play().catch(e => console.warn("Audio play failed:", e))
        }
      }
    } catch (err) { console.warn("TTS Error:", err) }
  }, [stopTTS])

  useEffect(() => {
    if (
      prevIsLoadingRef.current &&
      !isLoading &&
      activeChat &&
      isVoiceModeActive
    ) {
      const lastMsg = activeChat.messages[activeChat.messages.length - 1];
      if (
        lastMsg?.role === 'assistant' &&
        lastMsg.content &&
        lastMsg.id !== lastTTSMessageId
      ) {
        playTTS(lastMsg.content)
        setLastTTSMessageId(lastMsg.id)
      }
    }
    prevIsLoadingRef.current = isLoading
  }, [isLoading, activeChat, lastTTSMessageId, playTTS, isVoiceModeActive])

  useEffect(() => { stopTTS() }, [activeChat?.id, stopTTS])

  // Load saved data
  useEffect(() => {
    try {
      const savedChats = localStorage.getItem('chats')
      const savedActiveId = localStorage.getItem('activeChatId')
      const savedDarkMode = localStorage.getItem('darkMode')
      if (savedDarkMode) setIsDarkMode(savedDarkMode === 'true')
      let parsedChats: Chat[] = []
      if (savedChats) {
        parsedChats = JSON.parse(savedChats);
        setChats(parsedChats)
      }
      if (savedActiveId) {
        const active = parsedChats.find((c: Chat) => c.id === savedActiveId)
        setActiveChat(active || parsedChats[0] || null)
      } else if (parsedChats.length > 0) {
        setActiveChat(parsedChats[0])
      }
      if (parsedChats.length === 0) {
        const chat: Chat = { id: Date.now().toString(), title: 'New Chat', messages: [] }
        setChats([chat])
        setActiveChat(chat)
        localStorage.setItem('chats', JSON.stringify([chat]))
        localStorage.setItem('activeChatId', chat.id)
      }
    } catch {
      const chat: Chat = { id: Date.now().toString(), title: 'New Chat', messages: [] }
      setChats([chat])
      setActiveChat(chat)
    }
  }, [])

  useEffect(() => { if (chats.length > 0) localStorage.setItem('chats', JSON.stringify(chats)) }, [chats])
  useEffect(() => { if (activeChat) localStorage.setItem('activeChatId', activeChat.id) }, [activeChat])
  useEffect(() => { localStorage.setItem('darkMode', isDarkMode.toString()) }, [isDarkMode])
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [activeChat?.messages])


  // --- New File Handling Functions ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const allowedExtensions = ['.txt', '.md', '.js', '.ts', '.tsx', '.jsx', '.css', '.html', '.json', '.py', '.c', '.cpp', '.go', '.java']
    const fileExtension = file.name.slice(file.name.lastIndexOf('.'))
    
    if (!allowedExtensions.includes(fileExtension.toLowerCase())) {
      alert('Please upload a valid text file (e.g., .txt, .md, .js, .ts, .css, .html, .json, .py).')
      if (e.target) e.target.value = ''
      return
    }

    // Set a 100KB size limit for text files
    if (file.size > 100 * 1024) {
      alert('File is too large. Please upload a text file smaller than 100KB.')
      if (e.target) e.target.value = ''
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      setFileContent(text)
      setFileName(file.name)
    }
    reader.onerror = () => {
      alert('Failed to read the file.')
    }
    reader.readAsText(file)

    if (e.target) e.target.value = ''
  }

  const handleRemoveFile = () => {
    setFileContent(null)
    setFileName(null)
  }
  // --- End File Handling Functions ---


  // Auto-submit after silence is detected (KEY: use refs)
  const autoSubmitMessage = useCallback(async (text: string) => {
    const currentChat = activeChatRef.current
    const currentIsLoading = isLoadingRef.current
    if ((!text.trim() && !fileContent) || currentIsLoading || !currentChat) return // Allow submit if only file is present

    stopTTS()
    setInput('')

    // --- Updated Message Creation ---
    let fullContent = text.trim()
    if (fileContent && fileName) {
      fullContent = `[Attached File: ${fileName}]\n\n${fileContent}\n\n---\n\n${text.trim()}`
      // Clear file after packaging it
      setFileContent(null)
      setFileName(null)
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: fullContent,
      timestamp: new Date()
    }
    // --- End Updated Message Creation ---

    const updatedChat = {
      ...currentChat,
      messages: [...currentChat.messages, userMessage]
    }
    setActiveChat(updatedChat)
    setChats(prev => prev.map(c => c.id === currentChat.id ? updatedChat : c))
    setInput('') // Input already cleared, but good to be sure
    setIsLoading(true)

    const payloadMessages = updatedChat.messages.map(m => ({
      role: m.role, content: m.content
    }))

    try {
      let chatTitle = updatedChat.title
      let titleUpdated = false
      if (updatedChat.messages.length === 1) {
        chatTitle = await fetchChatTitle(userMessage.content)
        titleUpdated = true
      }
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: payloadMessages }),
      })
      if (!response.ok) throw new Error('Failed to get response')
      const reader = response.body?.getReader()
      if (!reader) throw new Error('Failed to get response reader')
      const decoder = new TextDecoder()
      let assistantContent = ''
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '',
        timestamp: new Date()
      }
      setActiveChat(prev => {
        if (!prev) return prev
        const newMessages = [...prev.messages, assistantMessage]
        const newTitle = titleUpdated ? chatTitle : prev.title
        const chatWithEmptyBubble = { ...prev, messages: newMessages, title: newTitle }
        setChats(prevChats => prevChats.map(c =>
          c.id === chatWithEmptyBubble.id ? chatWithEmptyBubble : c
        ))
        return chatWithEmptyBubble
      })
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') continue
            if (!data.trim()) continue
            try {
              const parsed = JSON.parse(data)
              const content = parsed.choices[0]?.delta?.content
              if (content) {
                assistantContent += content
                setActiveChat(prev => {
                  if (!prev) return prev
                  const updatedMessages = [...prev.messages]
                  const lastMessage = updatedMessages[updatedMessages.length - 1]
                  if (lastMessage && lastMessage.role === 'assistant') {
                    updatedMessages[updatedMessages.length - 1] = {
                      ...lastMessage,
                      content: assistantContent
                    }
                  }
                  return { ...prev, messages: updatedMessages }
                })
              }
            } catch (e) {
              // Silently ignore JSON parse errors
            }
          }
        }
      }
      setActiveChat(prevActiveChat => {
        if (!prevActiveChat) return prevActiveChat
        const finalMessages = [...prevActiveChat.messages]
        const lastIdx = finalMessages.length - 1
        if (finalMessages[lastIdx].role === 'assistant') finalMessages[lastIdx].content = assistantContent
        const finalChatState = { ...prevActiveChat, messages: finalMessages, title: chatTitle }
        setChats(prevChats => prevChats.map(c =>
          c.id === finalChatState.id ? finalChatState : c
        ))
        return finalChatState
      })
    } catch (error) {
      console.warn("Chat error:", error)
      const errorMessage: Message = {
        id: (Date.now() + 2).toString(),
        role: 'assistant',
        content: '🌌 Sorry, something went wrong. Please try again.',
        timestamp: new Date()
      }
      setActiveChat(prev => {
        if (!prev) return prev
        const errorChat = {
          ...prev,
          messages: [...prev.messages, errorMessage]
        }
        setChats(chats => chats.map(c => c.id === prev.id ? errorChat : c))
        return errorChat
      })
    } finally {
      setIsLoading(false)
    }
    // Add fileContent and fileName as dependencies
  }, [stopTTS, fileContent, fileName])

  // Stop voice recording
  const stopVoiceMode = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop())
    }
    if (connection && connection.readyState === WebSocket.OPEN) {
      connection.close()
    }
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current)
      silenceTimerRef.current = null
    }
    setConnection(null)
    mediaRecorderRef.current = null
    isConnectingRef.current = false
  }, [connection])

  // Start voice recording with auto-pause detection (unchanged logic)
  const startVoiceMode = useCallback(async () => {
    if (isConnectingRef.current || connection) return
    isConnectingRef.current = true

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })
      mediaRecorderRef.current = mediaRecorder

      const dgApiKey = process.env.NEXT_PUBLIC_DEEPGRAM_API_KEY
      if (!dgApiKey) {
        alert("Deepgram API key is not set. Please check your .env.local file.")
        isConnectingRef.current = false
        return
      }

      const socket = new WebSocket(
        `wss://api.deepgram.com/v1/listen?model=nova-2&language=en-IN&punctuate=true&utterance_end_ms=1500&interim_results=true`,
        ["token", dgApiKey]
      )

      let accumulatedTranscript = ''
      let lastSpeechTime = Date.now()

      socket.onopen = () => {
        isConnectingRef.current = false
        mediaRecorder.addEventListener('dataavailable', (event) => {
          if (event.data.size > 0 && socket.readyState === WebSocket.OPEN) {
            socket.send(event.data)
          }
        })
        mediaRecorder.start(250)
      }

      socket.onmessage = (msg) => {
        if (!isVoiceModeActiveRef.current) return
        try {
          const received = JSON.parse(msg.data)
          const transcript = received.channel?.alternatives[0]?.transcript

          if (transcript && transcript.trim().length > 0) {
            stopTTS()
            lastSpeechTime = Date.now()
            if (received.is_final) {
              if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current)
              if (accumulatedTranscript && !accumulatedTranscript.endsWith(' ')) {
                accumulatedTranscript += ' '
              }
              accumulatedTranscript += transcript
              setInput(accumulatedTranscript.trim())
              silenceTimerRef.current = setTimeout(() => {
                const trimmed = accumulatedTranscript.trim()
                if (trimmed || fileContent) { // <-- Check for file content too
                  autoSubmitMessage(trimmed)
                  accumulatedTranscript = ''
                  setInput('')
                }
              }, 2000)
            } else {
              const interimText = accumulatedTranscript + (accumulatedTranscript ? ' ' : '') + transcript
              setInput(interimText.trim())
            }
          }
        } catch (err) { }
      }

      socket.onerror = () => { isConnectingRef.current = false }
      socket.onclose = () => { isConnectingRef.current = false }
      setConnection(socket)
    } catch (err) {
      alert('Could not access microphone. Please check permissions.')
      setIsVoiceModeActive(false)
      isConnectingRef.current = false
    }
  }, [connection, stopTTS, autoSubmitMessage, fileContent]) // <-- Add fileContent

  // Toggle voice mode
  const handleVoiceToggle = useCallback(() => {
    if (isVoiceModeActive) {
      stopVoiceMode()
      setIsVoiceModeActive(false)
    } else {
      setIsVoiceModeActive(true)
      startVoiceMode()
    }
  }, [isVoiceModeActive, startVoiceMode, stopVoiceMode])

  useEffect(() => { if (!isVoiceModeActive) stopVoiceMode() }, [isVoiceModeActive, stopVoiceMode])
  useEffect(() => { return () => { stopVoiceMode(); stopTTS() } }, [stopVoiceMode, stopTTS])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    // Allow submit if just a file is attached
    if ((!input.trim() && !fileContent) || isLoading || !activeChat) return
    await autoSubmitMessage(input)
  }

  const handleNewChat = () => {
    const newChat: Chat = { id: Date.now().toString(), title: 'New Chat', messages: [] }
    setChats(prev => [newChat, ...prev])
    setActiveChat(newChat)
    setInput('')
    handleRemoveFile() // Clear file on new chat
    stopTTS()
  }

  const handleDeleteChat = (chatId: string) => {
    stopTTS()
    let nextActiveChat: Chat | null = null
    const updatedChats = chats.filter(c => c.id !== chatId)
    if (activeChat?.id === chatId) {
      nextActiveChat = updatedChats[0] || null
      handleRemoveFile() // Clear file if active chat is deleted
    } else {
      nextActiveChat = activeChat
    }
    if (updatedChats.length === 0) {
      const newChat: Chat = { id: Date.now().toString(), title: 'New Chat', messages: [] }
      setChats([newChat]); setActiveChat(newChat)
      localStorage.setItem('chats', JSON.stringify([newChat]))
      localStorage.setItem('activeChatId', newChat.id)
    } else {
      setChats(updatedChats)
      setActiveChat(nextActiveChat)
      if (nextActiveChat) localStorage.setItem('activeChatId', nextActiveChat.id)
      else localStorage.removeItem('activeChatId')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e as any)
    }
  }

// --- NEW: Render function for Mobile View ---
  const renderMobileView = () => {
    return (
      <div className={cn(
        "relative flex h-screen w-full font-sans antialiased transition-colors duration-300",
        isDarkMode ? "bg-zinc-950 text-white" : "bg-white text-zinc-900"
      )}>
        
        {/* --- Hidden File Input --- */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          style={{ display: 'none' }}
          accept=".txt,.md,.js,.ts,.tsx,.jsx,.css,.html,.json,.py,.c,.cpp,.go,.java"
        />
        <audio ref={audioRef} style={{ display: "none" }} />

        {/* --- Backdrop for Mobile Sidebar --- */}
        {sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            className="absolute inset-0 bg-black/60 z-40 transition-opacity"
            aria-hidden="true"
          />
        )}
  
        {/* --- Mobile Sidebar (Slide-out Drawer) --- */}
        <aside className={cn(
          "flex flex-col w-64 border-r flex-shrink-0",
          "transition-all duration-300 ease-in-out",
          "absolute top-0 left-0 h-full z-50", // Makes it an overlay
          sidebarOpen ? "translate-x-0" : "-translate-x-full", // Slide-in/out logic
          isDarkMode
            ? "border-zinc-800 bg-zinc-950"
            : "border-zinc-200 bg-zinc-50"
        )}>
          {/* ... sidebar content ... */}
          <div className={cn(
            "flex h-[60px] items-center justify-between px-4 border-b",
            "transition-colors duration-300",
            isDarkMode
              ? "border-zinc-800 bg-zinc-900"
              : "border-zinc-200 bg-white"
          )}>
            <h1 className={cn(
              "text-lg font-semibold tracking-tight",
              "transition-colors duration-300",
              isDarkMode ? "text-white" : "text-zinc-900"
            )}>
              AI Chatbot
            </h1>
            {/* Added a close button for mobile */}
            <button
              onClick={() => setSidebarOpen(false)}
              className={cn(
                "p-2 rounded-md transition-all",
                isDarkMode ? "text-zinc-400 hover:bg-zinc-800" : "text-zinc-500 hover:bg-zinc-100"
              )}
            >
              <X size={18} />
            </button>
          </div>
          <div className={cn(
            "flex-1 overflow-y-auto",
            "[&::-webkit-scrollbar-thumb]:transition-colors [&::-webkit-scrollbar-thumb]:duration-300",
            "[&::-webkit-scrollbar-track]:transition-colors [&::-webkit-scrollbar-track]:duration-300",
            "transition-all duration-300",
            isDarkMode
              ? [
                "[&::-webkit-scrollbar]:w-2",
                "[&::-webkit-scrollbar-track]:bg-zinc-900",
                "[&::-webkit-scrollbar-thumb]:bg-zinc-700",
                "[&::-webkit-scrollbar-thumb]:rounded-md",
                "[&::-webkit-scrollbar-thumb:hover]:bg-zinc-600",
                "[scrollbar-width:thin]",
                "[scrollbar-color:theme(colors.zinc.700)_theme(colors.zinc.900)]"
              ]
              : [
                "[&::-webkit-scrollbar]:w-2",
                "[&::-webkit-scrollbar-track]:bg-zinc-100",
                "[&::-webkit-scrollbar-thumb]:bg-zinc-300",
                "[&::-webkit-scrollbar-thumb]:rounded-md",
                "[&::-webkit-scrollbar-thumb:hover]:bg-zinc-400",
                "[scrollbar-width:thin]",
                "[scrollbar-color:theme(colors.zinc.300)_theme(colors.zinc.100)]"
              ]
          )}>
            <div className="p-2">
              <button
                onClick={handleNewChat}
                className="flex items-center w-full p-2 text-sm font-medium rounded-md bg-indigo-600 text-white shadow hover:bg-indigo-700 transition-colors duration-300"
              >
                <MessageSquarePlus className="mr-2" size={16} />
                New Chat
              </button>
            </div>
            <nav className="p-2 space-y-1">
              {chats.map(chat => (
                <div
                  key={chat.id}
                  className={cn(
                    'flex items-center p-2 text-sm rounded-md transition-colors duration-300 group',
                    isDarkMode
                      ? 'hover:bg-zinc-900 text-zinc-300'
                      : 'hover:bg-zinc-100 text-zinc-700',
                    chat.id === activeChat?.id
                      ? isDarkMode
                        ? 'bg-zinc-900 font-semibold text-white'
                        : 'bg-zinc-100 font-semibold text-zinc-900'
                      : ''
                  )}
                >
                  <button
                    onClick={() => {
                      setActiveChat(chat)
                      handleRemoveFile() // Clear file when switching chats
                      setSidebarOpen(false) // Close sidebar on chat click
                    }}
                    className="truncate flex-1 text-left"
                  >
                    {chat.title}
                  </button>
                  <button
                    onClick={() => handleDeleteChat(chat.id)}
                    className="opacity-0 group-hover:opacity-100 ml-2 p-1 hover:bg-red-500/10 rounded transition-all"
                  >
                    <Trash2 size={14} className="text-red-500" />
                  </button>
                </div>
              ))}
            </nav>
          </div>
          <div className={cn(
            "p-4 border-t",
            "transition-colors duration-300",
            isDarkMode
              ? "border-zinc-800 bg-zinc-900"
              : "border-zinc-200 bg-white"
          )}>
            <div className="flex items-center">
              <div className={cn(
                "flex items-center justify-center w-8 h-8 rounded-md",
                "transition-colors duration-300",
                isDarkMode ? "bg-zinc-800" : "bg-zinc-200"
              )}>
                <User size={16} className={cn("transition-colors duration-300", isDarkMode ? "text-zinc-300" : "text-zinc-700")} />
              </div>
              <div className="ml-3">
                <p className={cn(
                  "text-sm font-medium",
                  "transition-colors duration-300",
                  isDarkMode ? "text-white" : "text-zinc-900"
                )}>
                  User Name
                </p>
                <p className={cn(
                  "text-xs",
                  "transition-colors duration-300",
                  isDarkMode ? "text-zinc-400" : "text-zinc-400"
                )}>
                  user@example.com
                </p>
              </div>
            </div>
          </div>
        </aside>
  
        {/* --- Main Content (Empty Chat) --- */}
        {activeChat && activeChat.messages.length === 0 ? (
          <main className="flex flex-col flex-1 h-screen overflow-hidden">
            {/* --- MODIFIED HEADER --- */}
            <header className={cn(
              "flex items-center justify-between h-[60px] border-b px-4 z-10 flex-shrink-0",
              "transition-colors duration-300",
              isDarkMode
                ? "border-zinc-800 bg-zinc-900/90 backdrop-blur-md"
                : "border-zinc-200 bg-white/90 backdrop-blur-md"
            )}>
              {/* Left Button */}
              <div className="flex">
                <button
                  className={cn(
                    "p-2 rounded-md transition-all",
                    isDarkMode
                      ? "bg-zinc-900 hover:bg-zinc-800"
                      : "bg-white shadow hover:bg-zinc-50"
                  )}
                  onClick={() => setSidebarOpen(s => !s)}
                >
                  <PanelLeft size={19} className={isDarkMode ? "text-zinc-400" : "text-zinc-600"} />
                </button>
              </div>
              
              {/* Centered Title */}
              <div className="flex-1 text-center min-w-0">
                <h2 className={cn(
                  "text-lg font-semibold truncate px-2", // px-2 for spacing
                  "transition-colors duration-300",
                  isDarkMode ? "text-white" : "text-zinc-900"
                )}>
                  {activeChat?.title || 'Select a chat'}
                </h2>
              </div>

              {/* Right Button */}
              <div className="flex">
                <button
                  className={cn(
                    "p-2 rounded-md transition-all",
                    isDarkMode
                      ? "bg-zinc-900 hover:bg-zinc-800 text-zinc-400"
                      : "bg-white shadow hover:bg-zinc-50 text-zinc-600 hover:text-indigo-600"
                  )}
                  onClick={() => setIsDarkMode(d => !d)}
                >
                  {isDarkMode ? <Sun size={18} /> : <Moon size={17} />}
                </button>
              </div>

              {/* --- HIDDEN Share/Delete buttons --- */}
              <div className="hidden items-center gap-2">
                <button className={cn(
                  "flex items-center gap-2 px-3 py-1.5 text-sm border rounded-md transition-colors duration-300",
                  isDarkMode
                    ? "border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                    : "border-zinc-200 text-zinc-700 hover:bg-zinc-100"
                )}>
                  <Share size={14} />
                  Share
                </button>
                {activeChat && (
                  <button
                    onClick={() => handleDeleteChat(activeChat.id)}
                    className={cn(
                      'flex items-center gap-2 px-3 py-1.5 text-sm border rounded-md transition-colors duration-300 font-medium',
                      isDarkMode
                        ? 'border-zinc-800 text-zinc-300 bg-zinc-900 hover:bg-zinc-800 hover:text-red-400'
                        : 'border-zinc-200 text-zinc-500 bg-white/70 hover:bg-red-50 hover:text-red-600'
                    )}
                  >
                    <Trash2 size={15} />
                    Delete
                  </button>
                )}
              </div>
            </header>
            {/* --- END MODIFIED HEADER --- */}

            <div className="flex-1 flex flex-col items-center justify-center px-4">
              <div className="w-full max-w-4xl">
                <div className="text-center mb-6">
                  <h2 className={cn(
                    "text-2xl font-semibold",
                    "transition-colors duration-300",
                    isDarkMode ? "text-zinc-100" : "text-zinc-800"
                  )}>
                    Hello there!
                  </h2>
                  <p className={cn(
                    "text-base",
                    "transition-colors duration-300",
                    isDarkMode ? "text-zinc-400" : "text-zinc-500"
                  )}>
                    How can I help you today?
                  </p>
                </div>
                <InputForm
                  centered={true}
                  input={input}
                  setInput={setInput}
                  isLoading={isLoading}
                  isDarkMode={isDarkMode}
                  handleSubmit={handleSubmit}
                  handleKeyDown={handleKeyDown}
                  isVoiceModeActive={isVoiceModeActive}
                  onVoiceToggle={handleVoiceToggle}
                  onFileAttachClick={() => fileInputRef.current?.click()}
                  fileName={fileName}
                  onRemoveFile={handleRemoveFile}
                />
              </div>
            </div>
          </main>
        ) : (
          // --- Main Content (Active Chat) ---
          <main className="flex flex-col flex-1 h-screen overflow-hidden">
            {/* --- MODIFIED HEADER --- */}
            <header className={cn(
              "flex items-center justify-between h-[60px] border-b px-4 z-10 flex-shrink-0",
              "transition-colors duration-300",
              isDarkMode
                ? "border-zinc-800 bg-zinc-900/90 backdrop-blur-md"
                : "border-zinc-200 bg-white/90 backdrop-blur-md"
            )}>
              {/* Left Button */}
              <div className="flex">
                <button
                  className={cn(
                    "p-2 rounded-md transition-all",
                    isDarkMode
                      ? "bg-zinc-900 hover:bg-zinc-800"
                      : "bg-white shadow hover:bg-zinc-50"
                  )}
                  onClick={() => setSidebarOpen(s => !s)}
                >
                  <PanelLeft size={19} className={isDarkMode ? "text-zinc-400" : "text-zinc-600"} />
                </button>
              </div>
              
              {/* Centered Title */}
              <div className="flex-1 text-center min-w-0">
                <h2 className={cn(
                  "text-lg font-semibold truncate px-2", // px-2 for spacing
                  "transition-colors duration-300",
                  isDarkMode ? "text-white" : "text-zinc-900"
                )}>
                  {activeChat?.title || 'Select a chat'}
                </h2>
              </div>

              {/* Right Button */}
              <div className="flex">
                <button
                  className={cn(
                    "p-2 rounded-md transition-all",
                    isDarkMode
                      ? "bg-zinc-900 hover:bg-zinc-800 text-zinc-400"
                      : "bg-white shadow hover:bg-zinc-50 text-zinc-600 hover:text-indigo-600"
                  )}
                  onClick={() => setIsDarkMode(d => !d)}
                >
                  {isDarkMode ? <Sun size={18} /> : <Moon size={17} />}
                </button>
              </div>

              {/* --- HIDDEN Share/Delete buttons --- */}
              <div className="hidden items-center gap-2">
                <button className={cn(
                  "flex items-center gap-2 px-3 py-1.5 text-sm border rounded-md transition-colors duration-300",
                  isDarkMode
                    ? "border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                    : "border-zinc-200 text-zinc-700 hover:bg-zinc-100"
                )}>
                  <Share size={14} />
                  Share
                </button>
                {activeChat && (
                  <button
                    onClick={() => handleDeleteChat(activeChat.id)}
                    className={cn(
                      'flex items-center gap-2 px-3 py-1.5 text-sm border rounded-md transition-colors duration-300 font-medium',
                      isDarkMode
                        ? 'border-zinc-800 text-zinc-300 bg-zinc-900 hover:bg-zinc-800 hover:text-red-400'
                        : 'border-zinc-200 text-zinc-500 bg-white/70 hover:bg-red-50 hover:text-red-600'
                    )}
                  >
                    <Trash2 size={15} />
                    Delete
                  </button>
                )}
              </div>
            </header>
            {/* --- END MODIFIED HEADER --- */}
            
            <div className={cn(
              "flex-1 overflow-y-auto",
              "[&::-webkit-scrollbar-thumb]:transition-colors [&::-webkit-scrollbar-thumb]:duration-300",
              "[&::-webkit-scrollbar-track]:transition-colors [&::-webkit-scrollbar-track]:duration-300",
              "transition-all duration-300",
              isDarkMode
                ? [
                  "[&::-webkit-scrollbar]:w-2",
                  "[&::-webkit-scrollbar-track]:bg-zinc-950",
                  "[&::-webkit-scrollbar-thumb]:bg-zinc-700",
                  "[&::-webkit-scrollbar-thumb]:rounded-md",
                  "[&::-webkit-scrollbar-thumb:hover]:bg-zinc-600",
                  "[scrollbar-width:thin]",
                  "[scrollbar-color:theme(colors.zinc.700)_theme(colors.zinc.950)]"
                ]
                : [
                  "[&::-webkit-scrollbar]:w-2",
                  "[&::-webkit-scrollbar-track]:bg-zinc-100",
                  "[&::-webkit-scrollbar-thumb]:bg-zinc-300",
                  "[&::-webkit-scrollbar-thumb]:rounded-md",
                  "[&::-webkit-scrollbar-thumb:hover]:bg-zinc-400",
                  "[scrollbar-width:thin]",
                  "[scrollbar-color:theme(colors.zinc.300)_theme(colors.zinc.100)]"
                ]
            )}>
              <div className="max-w-4xl mx-auto px-4 pt-4 md:pt-6 pb-4">
                <div className="flex flex-col gap-6">
                  {activeChat?.messages.map(message => (
                    <ChatBubble key={message.id} message={message} isDarkMode={isDarkMode} />
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className={cn(
                        "px-4 py-3 rounded-md shadow border",
                        "transition-colors duration-300",
                        isDarkMode
                          ? "bg-zinc-900 text-zinc-100 shadow-sm border border-zinc-800"
                          : "bg-white border border-gray-200 text-zinc-800 shadow-sm"
                      )}>
                        <div className="flex gap-1.5">
                          <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" style={{ animationDelay: '0ms' }}></div>
                          <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" style={{ animationDelay: '150ms' }}></div>
                          <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" style={{ animationDelay: '300ms' }}></div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </div>
            </div>
            <div className={cn(
              "px-4 pt-0 pb-4 flex-shrink-0",
              "transition-colors duration-300",
              isDarkMode ? "border-zinc-800" : "border-zinc-200"
            )}>
              <div className="max-w-4xl mx-auto">
                <InputForm
                  input={input}
                  setInput={setInput}
                  isLoading={isLoading}
                  isDarkMode={isDarkMode}
                  handleSubmit={handleSubmit}
                  handleKeyDown={handleKeyDown}
                  isVoiceModeActive={isVoiceModeActive}
                  onVoiceToggle={handleVoiceToggle}
                  onFileAttachClick={() => fileInputRef.current?.click()}
                  fileName={fileName}
                  onRemoveFile={handleRemoveFile}
                />
              </div>
            </div>
          </main>
        )}
      </div>
    );
  }

  // --- NEW: Render function for Desktop View ---
  const renderDesktopView = () => {
    // This is the original JSX return
    return (
      <div className={cn(
        "relative flex h-screen w-full font-sans antialiased transition-colors duration-300",
        isDarkMode ? "bg-zinc-950 text-white" : "bg-white text-zinc-900"
      )}>
        {/* --- Hidden File Input --- */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          style={{ display: 'none' }}
          accept=".txt,.md,.js,.ts,.tsx,.jsx,.css,.html,.json,.py,.c,.cpp,.go,.java"
        />
        <audio ref={audioRef} style={{ display: "none" }} />
  
        {/* Sidebar - (unchanged) */}
        {sidebarOpen && (
          <aside className={cn(
            "hidden md:flex flex-col w-64 border-r relative z-40 flex-shrink-0",
            "transition-colors duration-300",
            isDarkMode
              ? "border-zinc-800 bg-zinc-950"
              : "border-zinc-200 bg-zinc-50"
          )}>
            {/* ... sidebar content ... */}
            <div className={cn(
              "flex h-[60px] items-center justify-between px-4 border-b",
              "transition-colors duration-300",
              isDarkMode
                ? "border-zinc-800 bg-zinc-900"
                : "border-zinc-200 bg-white"
            )}>
              <h1 className={cn(
                "text-lg font-semibold tracking-tight",
                "transition-colors duration-300",
                isDarkMode ? "text-white" : "text-zinc-900"
              )}>
                AI Chatbot
              </h1>
            </div>
            <div className={cn(
              "flex-1 overflow-y-auto",
              "[&::-webkit-scrollbar-thumb]:transition-colors [&::-webkit-scrollbar-thumb]:duration-300",
              "[&::-webkit-scrollbar-track]:transition-colors [&::-webkit-scrollbar-track]:duration-300",
              "transition-all duration-300",
              isDarkMode
                ? [
                  "[&::-webkit-scrollbar]:w-2",
                  "[&::-webkit-scrollbar-track]:bg-zinc-900",
                  "[&::-webkit-scrollbar-thumb]:bg-zinc-700",
                  "[&::-webkit-scrollbar-thumb]:rounded-md",
                  "[&::-webkit-scrollbar-thumb:hover]:bg-zinc-600",
                  "[scrollbar-width:thin]",
                  "[scrollbar-color:theme(colors.zinc.700)_theme(colors.zinc.900)]"
                ]
                : [
                  "[&::-webkit-scrollbar]:w-2",
                  "[&::-webkit-scrollbar-track]:bg-zinc-100",
                  "[&::-webkit-scrollbar-thumb]:bg-zinc-300",
                  "[&::-webkit-scrollbar-thumb]:rounded-md",
                  "[&::-webkit-scrollbar-thumb:hover]:bg-zinc-400",
                  "[scrollbar-width:thin]",
                  "[scrollbar-color:theme(colors.zinc.300)_theme(colors.zinc.100)]"
                ]
            )}>
              <div className="p-2">
                <button
                  onClick={handleNewChat}
                  className="flex items-center w-full p-2 text-sm font-medium rounded-md bg-indigo-600 text-white shadow hover:bg-indigo-700 transition-colors duration-300"
                >
                  <MessageSquarePlus className="mr-2" size={16} />
                  New Chat
                </button>
              </div>
              <nav className="p-2 space-y-1">
                {chats.map(chat => (
                  <div
                    key={chat.id}
                    className={cn(
                      'flex items-center p-2 text-sm rounded-md transition-colors duration-300 group',
                      isDarkMode
                        ? 'hover:bg-zinc-900 text-zinc-300'
                        : 'hover:bg-zinc-100 text-zinc-700',
                      chat.id === activeChat?.id
                        ? isDarkMode
                          ? 'bg-zinc-900 font-semibold text-white'
                          : 'bg-zinc-100 font-semibold text-zinc-900'
                        : ''
                    )}
                  >
                    <button
                      onClick={() => {
                        setActiveChat(chat)
                        handleRemoveFile() // Clear file when switching chats
                      }}
                      className="truncate flex-1 text-left"
                    >
                      {chat.title}
                    </button>
                    <button
                      onClick={() => handleDeleteChat(chat.id)}
                      className="opacity-0 group-hover:opacity-100 ml-2 p-1 hover:bg-red-500/10 rounded transition-all"
                    >
                      <Trash2 size={14} className="text-red-500" />
                    </button>
                  </div>
                ))}
              </nav>
            </div>
            <div className={cn(
              "p-4 border-t",
              "transition-colors duration-300",
              isDarkMode
                ? "border-zinc-800 bg-zinc-900"
                : "border-zinc-200 bg-white"
            )}>
              <div className="flex items-center">
                <div className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-md",
                  "transition-colors duration-300",
                  isDarkMode ? "bg-zinc-800" : "bg-zinc-200"
                )}>
                  <User size={16} className={cn("transition-colors duration-300", isDarkMode ? "text-zinc-300" : "text-zinc-700")} />
                </div>
                <div className="ml-3">
                  <p className={cn(
                    "text-sm font-medium",
                    "transition-colors duration-300",
                    isDarkMode ? "text-white" : "text-zinc-900"
                  )}>
                    User Name
                  </p>
                  <p className={cn(
                    "text-xs",
                    "transition-colors duration-300",
                    isDarkMode ? "text-zinc-400" : "text-zinc-400"
                  )}>
                    user@example.com
                  </p>
                </div>
              </div>
            </div>
          </aside>
        )}
  
        {/* Main Content - (unchanged structure) */}
        {activeChat && activeChat.messages.length === 0 ? (
          <main className="flex flex-col flex-1 h-screen overflow-hidden">
            <header className={cn(
              "flex items-center justify-between h-[60px] border-b px-4 md:px-6 z-10 flex-shrink-0",
              "transition-colors duration-300",
              isDarkMode
                ? "border-zinc-800 bg-zinc-900/90 backdrop-blur-md"
                : "border-zinc-200 bg-white/90 backdrop-blur-md"
            )}>
              {/* ... header content ... */}
              <div className="flex items-center gap-3">
                <button
                  className={cn(
                    "p-2 rounded-md transition-all",
                    isDarkMode
                      ? "bg-zinc-900 hover:bg-zinc-800"
                      : "bg-white shadow hover:bg-zinc-50"
                  )}
                  onClick={() => setSidebarOpen(s => !s)}
                >
                  <PanelLeft size={19} className={isDarkMode ? "text-zinc-400" : "text-zinc-600"} />
                </button>
                <button
                  className={cn(
                    "p-2 rounded-md transition-all",
                    isDarkMode
                      ? "bg-zinc-900 hover:bg-zinc-800 text-zinc-400"
                      : "bg-white shadow hover:bg-zinc-50 text-zinc-600 hover:text-indigo-600"
                  )}
                  onClick={() => setIsDarkMode(d => !d)}
                >
                  {isDarkMode ? <Sun size={18} /> : <Moon size={17} />}
                </button>
                <h2 className={cn(
                  "text-lg font-semibold truncate",
                  "transition-colors duration-300",
                  isDarkMode ? "text-white" : "text-zinc-900"
                )}>
                  {activeChat?.title || 'Select a chat'}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <button className={cn(
                  "flex items-center gap-2 px-3 py-1.5 text-sm border rounded-md transition-colors duration-300",
                  isDarkMode
                    ? "border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                    : "border-zinc-200 text-zinc-700 hover:bg-zinc-100"
                )}>
                  <Share size={14} />
                  Share
                </button>
                {activeChat && (
                  <button
                    onClick={() => handleDeleteChat(activeChat.id)}
                    className={cn(
                      'flex items-center gap-2 px-3 py-1.5 text-sm border rounded-md transition-colors duration-300 font-medium',
                      isDarkMode
                        ? 'border-zinc-800 text-zinc-300 bg-zinc-900 hover:bg-zinc-800 hover:text-red-400'
                        : 'border-zinc-200 text-zinc-500 bg-white/70 hover:bg-red-50 hover:text-red-600'
                    )}
                  >
                    <Trash2 size={15} />
                    Delete
                  </button>
                )}
              </div>
            </header>
            <div className="flex-1 flex flex-col items-center justify-center px-4 md:px-6">
              <div className="w-full max-w-4xl">
                <div className="text-center mb-6">
                  <h2 className={cn(
                    "text-2xl font-semibold",
                    "transition-colors duration-300",
                    isDarkMode ? "text-zinc-100" : "text-zinc-800"
                  )}>
                    Hello there!
                  </h2>
                  <p className={cn(
                    "text-base",
                    "transition-colors duration-300",
                    isDarkMode ? "text-zinc-400" : "text-zinc-500"
                  )}>
                    How can I help you today?
                  </p>
                </div>
                {/* --- Pass new props to InputForm --- */}
                <InputForm
                  centered={true}
                  input={input}
                  setInput={setInput}
                  isLoading={isLoading}
                  isDarkMode={isDarkMode}
                  handleSubmit={handleSubmit}
                  handleKeyDown={handleKeyDown}
                  isVoiceModeActive={isVoiceModeActive}
                  onVoiceToggle={handleVoiceToggle}
                  onFileAttachClick={() => fileInputRef.current?.click()}
                  fileName={fileName}
                  onRemoveFile={handleRemoveFile}
                />
              </div>
            </div>
          </main>
        ) : (
          <main className="flex flex-col flex-1 h-screen overflow-hidden">
            <header className={cn(
              "flex items-center justify-between h-[60px] border-b px-4 md:px-6 z-10 flex-shrink-0",
              "transition-colors duration-300",
              isDarkMode
                ? "border-zinc-800 bg-zinc-900/90 backdrop-blur-md"
                : "border-zinc-200 bg-white/90 backdrop-blur-md"
            )}>
              {/* ... header content ... */}
              <div className="flex items-center gap-3">
                <button
                  className={cn(
                    "p-2 rounded-md transition-all",
                    isDarkMode
                      ? "bg-zinc-900 hover:bg-zinc-800"
                      : "bg-white shadow hover:bg-zinc-50"
                  )}
                  onClick={() => setSidebarOpen(s => !s)}
                >
                  <PanelLeft size={19} className={isDarkMode ? "text-zinc-400" : "text-zinc-600"} />
                </button>
                <button
                  className={cn(
                    "p-2 rounded-md transition-all",
                    isDarkMode
                      ? "bg-zinc-900 hover:bg-zinc-800 text-zinc-400"
                      : "bg-white shadow hover:bg-zinc-50 text-zinc-600 hover:text-indigo-600"
                  )}
                  onClick={() => setIsDarkMode(d => !d)}
                >
                  {isDarkMode ? <Sun size={18} /> : <Moon size={17} />}
                </button>
                <h2 className={cn(
                  "text-lg font-semibold truncate",
                  "transition-colors duration-300",
                  isDarkMode ? "text-white" : "text-zinc-900"
                )}>
                  {activeChat?.title || 'Select a chat'}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <button className={cn(
                  "flex items-center gap-2 px-3 py-1.5 text-sm border rounded-md transition-colors duration-300",
                  isDarkMode
                    ? "border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                    : "border-zinc-200 text-zinc-700 hover:bg-zinc-100"
                )}>
                  <Share size={14} />
                  Share
                </button>
                {activeChat && (
                  <button
                    onClick={() => handleDeleteChat(activeChat.id)}
                    className={cn(
                      'flex items-center gap-2 px-3 py-1.5 text-sm border rounded-md transition-colors duration-300 font-medium',
                      isDarkMode
                        ? 'border-zinc-800 text-zinc-300 bg-zinc-900 hover:bg-zinc-800 hover:text-red-400'
                        : 'border-zinc-200 text-zinc-500 bg-white/70 hover:bg-red-50 hover:text-red-600'
                    )}
                  >
                    <Trash2 size={15} />
                    Delete
                  </button>
                )}
              </div>
            </header>
            <div className={cn(
              "flex-1 overflow-y-auto",
              "[&::-webkit-scrollbar-thumb]:transition-colors [&::-webkit-scrollbar-thumb]:duration-300",
              "[&::-webkit-scrollbar-track]:transition-colors [&::-webkit-scrollbar-track]:duration-300",
              "transition-all duration-300",
              isDarkMode
                ? [
                  "[&::-webkit-scrollbar]:w-2",
                  "[&::-webkit-scrollbar-track]:bg-zinc-950",
                  "[&::-webkit-scrollbar-thumb]:bg-zinc-700",
                  "[&::-webkit-scrollbar-thumb]:rounded-md",
                  "[&::-webkit-scrollbar-thumb:hover]:bg-zinc-600",
                  "[scrollbar-width:thin]",
                  "[scrollbar-color:theme(colors.zinc.700)_theme(colors.zinc.950)]"
                ]
                : [
                  "[&::-webkit-scrollbar]:w-2",
                  "[&::-webkit-scrollbar-track]:bg-zinc-100",
                  "[&::-webkit-scrollbar-thumb]:bg-zinc-300",
                  "[&::-webkit-scrollbar-thumb]:rounded-md",
                  "[&::-webkit-scrollbar-thumb:hover]:bg-zinc-400",
                  "[scrollbar-width:thin]",
                  "[scrollbar-color:theme(colors.zinc.300)_theme(colors.zinc.100)]"
                ]
            )}>
              <div className="max-w-4xl mx-auto px-4 md:px-6 pt-4 md:pt-6 pb-4">
                <div className="flex flex-col gap-6">
                  {activeChat?.messages.map(message => (
                    <ChatBubble key={message.id} message={message} isDarkMode={isDarkMode} />
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className={cn(
                        "px-4 py-3 rounded-md shadow border",
                        "transition-colors duration-300",
                        isDarkMode
                          ? "bg-zinc-900 text-zinc-100 shadow-sm border border-zinc-800"
                          : "bg-white border border-gray-200 text-zinc-800 shadow-sm"
                      )}>
                        <div className="flex gap-1.5">
                          <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" style={{ animationDelay: '0ms' }}></div>
                          <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" style={{ animationDelay: '150ms' }}></div>
                          <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" style={{ animationDelay: '300ms' }}></div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </div>
            </div>
            <div className={cn(
              "px-4 md:px-6 pt-0 pb-4 flex-shrink-0",
              "transition-colors duration-300",
              isDarkMode ? "border-zinc-800" : "border-zinc-200"
            )}>
              <div className="max-w-4xl mx-auto">
                {/* --- Pass new props to InputForm --- */}
                <InputForm
                  input={input}
                  setInput={setInput}
                  isLoading={isLoading}
                  isDarkMode={isDarkMode}
                  handleSubmit={handleSubmit}
                  handleKeyDown={handleKeyDown}
                  isVoiceModeActive={isVoiceModeActive}
                  onVoiceToggle={handleVoiceToggle}
                  onFileAttachClick={() => fileInputRef.current?.click()}
                  fileName={fileName}
                  onRemoveFile={handleRemoveFile}
                />
              </div>
            </div>
          </main>
        )}
      </div>
    );
  }

  // --- NEW: Final conditional return ---
  return isMobile ? renderMobileView() : renderDesktopView();
}