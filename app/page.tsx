"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  MessageCircle,
  Heart,
  Shield,
  User,
  Stethoscope,
  AlertTriangle,
  Pill,
  Apple,
  Brain,
  WormIcon as Virus,
  Send,
  Bot,
  UserIcon,
  Plus,
  Activity,
  Clock,
  CheckCircle,
} from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

interface Message {
  id: string
  type: "user" | "bot"
  content: string
  timestamp: Date
  agent?: string
}

interface PatientData {
  name: string
  phone: string
  age: string
  service: string
}

const BACKEND_URL = "https://medimate-backend-coral.vercel.app/api"

const agents = [
  { name: "Welcome Agent", icon: Heart, color: "bg-blue-500", description: "General welcome and guidance" },
  { name: "Health Check Agent", icon: Stethoscope, color: "bg-green-500", description: "Health advice and checkups" },
  { name: "COVID-19 Agent", icon: Virus, color: "bg-red-500", description: "COVID-19 information and testing" },
  { name: "Emergency Agent", icon: AlertTriangle, color: "bg-orange-500", description: "Emergency medical assistance" },
  {
    name: "Medicine Reminder Agent",
    icon: Pill,
    color: "bg-purple-500",
    description: "Medication schedules and reminders",
  },
  { name: "Diet Agent", icon: Apple, color: "bg-yellow-500", description: "Dietary recommendations" },
  { name: "Mental Health Agent", icon: Brain, color: "bg-pink-500", description: "Mental health support" },
  { name: "Registration Agent", icon: User, color: "bg-indigo-500", description: "Patient registration and routing" },
]

const services = [
  "General Checkup",
  "Emergency Services",
  "COVID-19 Information",
  "Medicine Reminders",
  "Dietary Advice",
  "Mental Health Support",
]

export default function MediMateChatbot() {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState("")
  const [selectedAgent, setSelectedAgent] = useState("Welcome Agent")
  const [isLoading, setIsLoading] = useState(false)
  const [showRegistration, setShowRegistration] = useState(false)
  const [showEmergency, setShowEmergency] = useState(false)
  const [showReminder, setShowReminder] = useState(false) // New state for reminder dialog
  const [patientData, setPatientData] = useState<PatientData>({
    name: "",
    phone: "",
    age: "",
    service: "",
  })
  const [emergencyData, setEmergencyData] = useState({
    patient_phone: "", // Changed to patient_phone
    condition: "",
  })
  const [reminderData, setReminderData] = useState({
    // New state for reminder data
    phone: "",
    medicine_name: "",
    reminder_time: "",
  })
  const [isRegistered, setIsRegistered] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    // Welcome message
    setMessages([
      {
        id: "1",
        type: "bot",
        content: `# 🏥 Welcome to MediMate!I'm your **AI healthcare assistant**. Here's how I can help you:## Available Services:- 🩺 **General Checkup** - Health advice and consultations- 🚨 **Emergency Services** - Immediate medical assistance- 🦠 **COVID-19 Information** - Testing, vaccines, and prevention- 💊 **Medicine Reminders** - Medication schedules and alerts (use the 'Set Medicine Reminder' button!)- 🍎 **Dietary Advice** - Nutritional guidance for health conditions- 🧠 **Mental Health Support** - Counseling and crisis resources> **Important**: For medical emergencies, call **1122** immediately!Please **register first** or select a service to get started. How can I assist you today?`,
        timestamp: new Date(),
        agent: "Welcome Agent",
      },
    ])
  }, [])

  const sendMessage = async () => {
    if (!inputMessage.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: inputMessage,
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMessage])
    setInputMessage("")
    setIsLoading(true)

    try {
      const response = await fetch(`${BACKEND_URL}/query`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          agent_name: selectedAgent,
          message: inputMessage,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to get response")
      }

      const data = await response.json()
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "bot",
        content: data.response,
        timestamp: new Date(),
        agent: selectedAgent,
      }
      setMessages((prev) => [...prev, botMessage])
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "bot",
        content: "Sorry, I encountered an error. Please try again or contact support.",
        timestamp: new Date(),
        agent: selectedAgent,
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegistration = async () => {
    if (!patientData.name || !patientData.phone || !patientData.age || !patientData.service) {
      alert("Please fill all fields")
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`${BACKEND_URL}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: patientData.name,
          phone: patientData.phone,
          age: Number.parseInt(patientData.age),
          service: patientData.service,
        }),
      })

      if (!response.ok) {
        throw new Error("Registration failed")
      }

      const data = await response.json()
      setIsRegistered(true)
      setShowRegistration(false)
      const registrationMessage: Message = {
        id: Date.now().toString(),
        type: "bot",
        content: `✅ Registration successful! Welcome ${patientData.name}. ${data.response}`,
        timestamp: new Date(),
        agent: "Registration Agent",
      }
      setMessages((prev) => [...prev, registrationMessage])
    } catch (error) {
      alert("Registration failed. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleEmergency = async () => {
    if (!emergencyData.patient_phone || !emergencyData.condition) {
      alert("Please fill all emergency details")
      return
    }
    // Basic validation for phone number (digits only, as backend expects without '+')
    if (!/^\d+$/.test(emergencyData.patient_phone)) {
      alert("Please enter a valid phone number (digits only, no '+').")
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`${BACKEND_URL}/emergency`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          patient_name: emergencyData.patient_phone, // Backend expects phone number here
          condition: emergencyData.condition,
        }),
      })

      if (!response.ok) {
        throw new Error("Emergency alert failed")
      }

      setShowEmergency(false)
      const emergencyMessage: Message = {
        id: Date.now().toString(),
        type: "bot",
        content: `🚨 Emergency alert sent for ${emergencyData.patient_phone}! A WhatsApp notification is being sent to emergency services. Please call 1122 or visit the nearest hospital immediately.`,
        timestamp: new Date(),
        agent: "Emergency Agent",
      }
      setMessages((prev) => [...prev, emergencyMessage])
      setEmergencyData({ patient_phone: "", condition: "" })
    } catch (error) {
      alert("Failed to send emergency alert. Please call 1122 directly.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSetReminder = async () => {
    if (!reminderData.phone || !reminderData.medicine_name || !reminderData.reminder_time) {
      alert("Please fill all reminder details")
      return
    }
    // Now only digits, no leading '+'
    if (!/^\+\d{10,15}$/.test(reminderData.phone)) {
      alert("Please enter a valid phone number in E.164 format (e.g., +923001234567).")
      return
    }
    // Basic validation for HH:MM time format
    if (!/^([01]\d|2[0-3]):([0-5]\d)$/.test(reminderData.reminder_time)) {
      alert("Please enter a valid time in HH:MM (24-hour) format (e.g., 09:30 or 14:00).")
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`${BACKEND_URL}/medicine-reminder`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(reminderData),
      })

      if (!response.ok) {
        throw new Error("Failed to set reminder")
      }

      const data = await response.json()
      setShowReminder(false)
      const reminderMessage: Message = {
        id: Date.now().toString(),
        type: "bot",
        content: `✅ Medicine reminder set for **${data.medicine}** at **${data.time}** daily to ${data.to}.`,
        timestamp: new Date(),
        agent: "Medicine Reminder Agent",
      }
      setMessages((prev) => [...prev, reminderMessage])
      setReminderData({ phone: "", medicine_name: "", reminder_time: "" })
    } catch (error) {
      alert("Failed to set medicine reminder. Please check your inputs and try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const getAgentIcon = (agentName: string) => {
    const agent = agents.find((a) => a.name === agentName)
    return agent ? agent.icon : Bot
  }

  const getAgentColor = (agentName: string) => {
    const agent = agents.find((a) => a.name === agentName)
    return agent ? agent.color : "bg-gray-500"
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 font-sans relative overflow-hidden">
      {/* Animated background orbs */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-floatAndPulse1"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-green-200 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-floatAndPulse2"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-floatAndPulse3"></div>
      </div>

      {/* Main content wrapper */}
      <div className="relative z-10">
        {/* Header */}
        <div className="bg-white shadow-lg border-b-4 border-blue-500">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="bg-blue-500 p-3 rounded-full shadow-md">
                  <Heart className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">MediMate</h1>
                  <p className="text-gray-600 text-lg mt-1">Your AI Healthcare Assistant</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <Badge variant="outline" className="px-4 py-2 text-base font-medium">
                  <Activity className="h-5 w-5 mr-2 text-green-500" />
                  Online
                </Badge>
                {isRegistered && (
                  <Badge className="bg-green-500 px-4 py-2 text-base font-medium">
                    <CheckCircle className="h-5 w-5 mr-2" />
                    Registered
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-8">
              {/* Quick Actions */}
              <Card className="shadow-xl rounded-xl border border-gray-200">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center text-xl font-semibold text-gray-800">
                    <Plus className="h-6 w-6 mr-3 text-blue-600" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Dialog open={showRegistration} onOpenChange={setShowRegistration}>
                    <DialogTrigger asChild>
                      <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-base rounded-lg shadow-md transition-all duration-200">
                        <User className="h-5 w-5 mr-2" />
                        Register Patient
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md p-6 rounded-lg shadow-xl">
                      <DialogHeader>
                        <DialogTitle className="text-2xl font-bold text-gray-800">Patient Registration</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-5 mt-4">
                        <Input
                          placeholder="Full Name"
                          value={patientData.name}
                          onChange={(e) => setPatientData({ ...patientData, name: e.target.value })}
                          className="h-12 text-base focus:ring-blue-500 focus:border-blue-500"
                        />
                        <Input
                          placeholder="Phone Number"
                          value={patientData.phone}
                          onChange={(e) => setPatientData({ ...patientData, phone: e.target.value })}
                          className="h-12 text-base focus:ring-blue-500 focus:border-blue-500"
                        />
                        <Input
                          placeholder="Age"
                          type="number"
                          value={patientData.age}
                          onChange={(e) => setPatientData({ ...patientData, age: e.target.value })}
                          className="h-12 text-base focus:ring-blue-500 focus:border-blue-500"
                        />
                        <Select
                          value={patientData.service}
                          onValueChange={(value) => setPatientData({ ...patientData, service: value })}
                        >
                          <SelectTrigger className="h-12 text-base focus:ring-blue-500 focus:border-blue-500">
                            <SelectValue placeholder="Select Service" />
                          </SelectTrigger>
                          <SelectContent>
                            {services.map((service) => (
                              <SelectItem key={service} value={service}>
                                {service}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          onClick={handleRegistration}
                          disabled={isLoading}
                          className="w-full h-12 text-lg bg-blue-600 hover:bg-blue-700"
                        >
                          {isLoading ? "Registering..." : "Register"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Dialog open={showEmergency} onOpenChange={setShowEmergency}>
                    <DialogTrigger asChild>
                      <Button className="w-full bg-red-600 hover:bg-red-700 text-white py-3 text-base rounded-lg shadow-md transition-all duration-200">
                        <AlertTriangle className="h-5 w-5 mr-2" />
                        Emergency Alert
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md p-6 rounded-lg shadow-xl">
                      <DialogHeader>
                        <DialogTitle className="text-2xl font-bold text-red-600">Emergency Alert</DialogTitle>
                      </DialogHeader>
                      <Alert className="border-red-300 bg-red-50 text-red-800 rounded-lg p-4">
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                        <AlertDescription className="text-sm">
                          This will send an immediate WhatsApp alert to emergency services.
                        </AlertDescription>
                      </Alert>
                      <div className="space-y-5 mt-4">
                        <Input
                          placeholder="Patient Phone Number (e.g., 923001234567)"
                          value={emergencyData.patient_phone}
                          onChange={(e) => setEmergencyData({ ...emergencyData, patient_phone: e.target.value })}
                          className="h-12 text-base focus:ring-red-500 focus:border-red-500"
                        />
                        <Textarea
                          placeholder="Describe the emergency condition..."
                          value={emergencyData.condition}
                          onChange={(e) => setEmergencyData({ ...emergencyData, condition: e.target.value })}
                          className="min-h-[100px] text-base focus:ring-red-500 focus:border-red-500"
                        />
                        <Button
                          onClick={handleEmergency}
                          disabled={isLoading}
                          className="w-full h-12 text-lg bg-red-600 hover:bg-red-700"
                        >
                          {isLoading ? "Sending Alert..." : "Send Emergency Alert"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>

                  {/* New Medicine Reminder Dialog */}
                  <Dialog open={showReminder} onOpenChange={setShowReminder}>
                    <DialogTrigger asChild>
                      <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 text-base rounded-lg shadow-md transition-all duration-200">
                        <Pill className="h-5 w-5 mr-2" />
                        Set Medicine Reminder
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md p-6 rounded-lg shadow-xl">
                      <DialogHeader>
                        <DialogTitle className="text-2xl font-bold text-gray-800">Set Medicine Reminder</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-5 mt-4">
                        <Input
                          placeholder="WhatsApp Phone (E.164, e.g., +923001234567)"
                          value={reminderData.phone}
                          onChange={(e) => setReminderData({ ...reminderData, phone: e.target.value })}
                          className="h-12 text-base focus:ring-purple-500 focus:border-purple-500"
                        />
                        <Input
                          placeholder="Medicine Name (e.g., Panadol)"
                          value={reminderData.medicine_name}
                          onChange={(e) => setReminderData({ ...reminderData, medicine_name: e.target.value })}
                          className="h-12 text-base focus:ring-purple-500 focus:border-purple-500"
                        />
                        <Input
                          placeholder="Reminder Time (HH:MM, 24-hour, e.g., 09:30)"
                          value={reminderData.reminder_time}
                          onChange={(e) => setReminderData({ ...reminderData, reminder_time: e.target.value })}
                          className="h-12 text-base focus:ring-purple-500 focus:border-purple-500"
                        />
                        <Button
                          onClick={handleSetReminder}
                          disabled={isLoading}
                          className="w-full h-12 text-lg bg-purple-600 hover:bg-purple-700"
                        >
                          {isLoading ? "Scheduling..." : "Schedule Reminder"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>

              {/* Agent Selection */}
              <Card className="shadow-xl rounded-xl border border-gray-200">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center text-xl font-semibold text-gray-800">
                    <Bot className="h-6 w-6 mr-3 text-green-600" />
                    Select Agent
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                    <SelectTrigger className="h-12 text-base focus:ring-blue-500 focus:border-blue-500">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {agents.map((agent) => (
                        <SelectItem key={agent.name} value={agent.name}>
                          <div className="flex items-center py-1">
                            <agent.icon className="h-5 w-5 mr-3" />
                            <span className="text-base">{agent.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-sm text-gray-700">{agents.find((a) => a.name === selectedAgent)?.description}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Available Services */}
              <Card className="shadow-xl rounded-xl border border-gray-200">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center text-xl font-semibold text-gray-800">
                    <Shield className="h-6 w-6 mr-3 text-indigo-600" />
                    Services
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {services.map((service, index) => (
                      <div key={index} className="flex items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                        <span className="text-base text-gray-700">{service}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Chat Area */}
            <div className="lg:col-span-3">
              <Card className="shadow-xl rounded-xl border border-gray-200 h-[650px] flex flex-col">
                <CardHeader className="border-b border-gray-200 py-4 px-6">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center text-xl font-semibold text-gray-800">
                      <MessageCircle className="h-6 w-6 mr-3 text-blue-600" />
                      Chat with {selectedAgent}
                    </CardTitle>
                    <div className="flex items-center space-x-3">
                      <div className={`w-4 h-4 rounded-full ${getAgentColor(selectedAgent)} shadow-sm`}></div>
                      <Badge variant="outline" className="px-3 py-1.5 text-sm font-medium">
                        <Clock className="h-4 w-4 mr-2 text-gray-500" />
                        Active
                      </Badge>
                    </div>
                  </div>
                </CardHeader>

                {/* Messages */}
                <CardContent className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-xl p-4 shadow-md ${
                          message.type === "user"
                            ? "bg-blue-600 text-white rounded-br-none"
                            : "bg-gray-100 text-gray-900 rounded-bl-none"
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          {message.type === "bot" && (
                            <div
                              className={`w-8 h-8 rounded-full ${getAgentColor(
                                message.agent || "",
                              )} flex items-center justify-center flex-shrink-0 shadow-sm`}
                            >
                              {(() => {
                                const IconComponent = getAgentIcon(message.agent || "")
                                return <IconComponent className="h-4 w-4 text-white" />
                              })()}
                            </div>
                          )}
                          {message.type === "user" && <UserIcon className="h-6 w-6 text-white flex-shrink-0 mt-1" />}
                          <div className="flex-1">
                            <div className="text-base leading-relaxed prose prose-sm max-w-none">
                              <div className={`${message.type === "user" ? "prose-invert" : ""}`}>
                                <ReactMarkdown
                                  remarkPlugins={[remarkGfm]}
                                  components={{
                                    h1: ({ node, ...props }) => <h1 className="text-xl font-bold mb-2" {...props} />,
                                    h2: ({ node, ...props }) => (
                                      <h2 className="text-lg font-semibold mb-2" {...props} />
                                    ),
                                    h3: ({ node, ...props }) => (
                                      <h3 className="text-base font-semibold mb-1" {...props} />
                                    ),
                                    p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                                    ul: ({ node, ...props }) => (
                                      <ul className="list-disc list-inside mb-2 space-y-1 pl-4" {...props} />
                                    ),
                                    ol: ({ node, ...props }) => (
                                      <ol className="list-decimal list-inside mb-2 space-y-1 pl-4" {...props} />
                                    ),
                                    li: ({ node, ...props }) => <li className="text-base" {...props} />,
                                    strong: ({ node, ...props }) => <strong className="font-bold" {...props} />,
                                    em: ({ node, ...props }) => <em className="italic" {...props} />,
                                    code: ({ node, ...props }) => (
                                      <code
                                        className={`px-1.5 py-0.5 rounded text-sm font-mono ${
                                          message.type === "user" ? "bg-blue-500 bg-opacity-50" : "bg-gray-200"
                                        }`}
                                        {...props}
                                      />
                                    ),
                                    pre: ({ node, ...props }) => (
                                      <pre
                                        className={`p-3 rounded text-sm font-mono overflow-x-auto ${
                                          message.type === "user" ? "bg-blue-500 bg-opacity-50" : "bg-gray-200"
                                        }`}
                                        {...props}
                                      />
                                    ),
                                    blockquote: ({ node, ...props }) => (
                                      <blockquote
                                        className={`border-l-4 pl-4 italic py-1 ${
                                          message.type === "user" ? "border-blue-300" : "border-gray-300"
                                        }`}
                                        {...props}
                                      />
                                    ),
                                    a: ({ node, ...props }) => (
                                      <a
                                        className={`underline hover:no-underline ${
                                          message.type === "user"
                                            ? "text-blue-100 hover:text-white"
                                            : "text-blue-600 hover:text-blue-800"
                                        }`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        {...props}
                                      />
                                    ),
                                    table: ({ node, ...props }) => (
                                      <div className="overflow-x-auto my-2">
                                        <table
                                          className="min-w-full border-collapse border border-gray-300 text-sm"
                                          {...props}
                                        />
                                      </div>
                                    ),
                                    th: ({ node, ...props }) => (
                                      <th
                                        className={`border border-gray-300 px-3 py-2 font-semibold ${
                                          message.type === "user" ? "bg-blue-500 bg-opacity-50" : "bg-gray-100"
                                        }`}
                                        {...props}
                                      />
                                    ),
                                    td: ({ node, ...props }) => (
                                      <td className="border border-gray-300 px-3 py-2" {...props} />
                                    ),
                                  }}
                                >
                                  {message.content}
                                </ReactMarkdown>
                              </div>
                            </div>
                            <div className="flex items-center justify-between mt-2">
                              <p className={`text-xs ${message.type === "user" ? "text-blue-200" : "text-gray-500"}`}>
                                {message.timestamp.toLocaleTimeString()}
                              </p>
                              {message.agent && (
                                <Badge variant="outline" className="text-xs px-2 py-0.5">
                                  {message.agent}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 rounded-xl p-4 shadow-md rounded-bl-none">
                        <div className="flex items-center space-x-2">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                          <span className="text-base text-gray-600">AI is thinking...</span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </CardContent>

                {/* Input Area */}
                <div className="border-t border-gray-200 p-6">
                  <div className="flex space-x-3">
                    <Input
                      placeholder="Type your message here..."
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                      className="flex-1 h-12 text-base rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      disabled={isLoading}
                    />
                    <Button
                      onClick={sendMessage}
                      disabled={isLoading || !inputMessage.trim()}
                      className="bg-blue-600 hover:bg-blue-700 text-white h-12 w-12 rounded-lg shadow-md transition-all duration-200"
                    >
                      <Send className="h-5 w-5" />
                    </Button>
                  </div>
                  <p className="text-sm text-gray-500 mt-3">
                    Currently chatting with: <strong className="text-gray-700">{selectedAgent}</strong>
                  </p>
                </div>
              </Card>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-900 text-white py-10 mt-16">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              <div>
                <h3 className="text-xl font-bold mb-4 text-blue-300">MediMate</h3>
                <p className="text-gray-400 leading-relaxed">
                  Your trusted AI healthcare assistant providing 24/7 medical support and guidance.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-bold mb-4 text-red-300">Emergency</h3>
                <p className="text-gray-400">For immediate medical emergencies, call:</p>
                <p className="text-3xl font-extrabold text-red-400 mt-2">1122</p>
              </div>
              <div>
                <h3 className="text-xl font-bold mb-4 text-green-300">Contact</h3>
                <p className="text-gray-400">Email: support@medimate.com</p>
                <p className="text-gray-400">Phone: +92 300 1234567</p>
              </div>
            </div>
            <div className="border-t border-gray-700 mt-10 pt-8 text-center">
              <p className="text-gray-500 text-sm">&copy; 2024 MediMate. All rights reserved.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
