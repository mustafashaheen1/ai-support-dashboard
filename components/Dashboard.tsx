"use client";

import SearchBar from "@/components/SearchBar";
import { BarChart3, Sun, Moon, Download } from "lucide-react";
import TicketForm from "@/components/TicketForm";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Inbox,
  Clock,
  CheckCircle,
  MessageSquare,
  User,
  Calendar,
  Sparkles,
  Send,
  Copy,
  RefreshCw,
} from "lucide-react";

// Firebase imports
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  updateDoc,
  doc,
  where,
  Timestamp,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

// Add these type definitions at the top of Dashboard.tsx

interface FirebaseTimestamp {
  seconds: number;
  nanoseconds: number;
  toDate(): Date;
}

interface Ticket {
  id: string;
  customer: string;
  subject: string;
  status: "new" | "in-progress" | "resolved";
  priority: "low" | "medium" | "high";
  sentiment: "positive" | "neutral" | "negative";
  timestamp: string;
  message: string;
  category?: string;
  suggestedResponse?: string;
  createdAt?: FirebaseTimestamp | Date;
}

export default function SupportDashboard() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [activeFilter, setActiveFilter] = useState;
  "all" | "new" | "in-progress" | ("resolved" > "all");
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [loading, setLoading] = useState(true);
  const [customResponse, setCustomResponse] = useState("");
  const [sendingResponse, setSendingResponse] = useState(false);
  const [theme, setTheme] = useState("dark");
  const [creatingDemo, setCreatingDemo] = useState(false);

  // Initialize theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "dark";
    setTheme(savedTheme);
    if (savedTheme === "light") {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  // Theme toggle function
  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    document.documentElement.classList.toggle("dark");
    localStorage.setItem("theme", newTheme);
  };

  // Fetch tickets from Firebase
  useEffect(() => {
    setLoading(true);

    // Create query based on filter
    let q;
    if (activeFilter === "all") {
      q = query(collection(db, "tickets"), orderBy("createdAt", "desc"));
    } else {
      q = query(
        collection(db, "tickets"),
        where("status", "==", activeFilter),
        orderBy("createdAt", "desc")
      );
    }

    // Real-time listener
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const ticketsData: Ticket[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          ticketsData.push({
            id: doc.id,
            customer: data.customer || "Unknown Customer",
            subject: data.subject || "No Subject",
            status: data.status || "new",
            priority: data.priority || "medium",
            sentiment: data.sentiment || "neutral",
            timestamp: data.timestamp || new Date().toISOString(),
            message: data.message || "",
            category: data.category,
            suggestedResponse: data.suggestedResponse,
            createdAt: data.createdAt,
          });
        });

        setTickets(ticketsData);

        // Select first ticket if none selected
        if (!selectedTicket && ticketsData.length > 0) {
          setSelectedTicket(ticketsData[0]);
        }

        setLoading(false);
      },
      (error) => {
        console.error("Error fetching tickets:", error);
        setLoading(false);
      }
    );

    // Cleanup
    return () => unsubscribe();
  }, [activeFilter]);

  const [searchResults, setSearchResults] = useState<Ticket[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  // Add search handler
  const handleSearchResults = (results: Ticket[]) => {
    setSearchResults(results);
    setIsSearching(results.length > 0);
  };

  // Add clear search function
  const clearSearch = () => {
    setSearchResults(null);
    setIsSearching(false);
  };

  // Update ticket status
  const updateTicketStatus = async (ticketId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, "tickets", ticketId), {
        status: newStatus,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error("Error updating ticket:", error);
    }
  };

  // Send response (copy or send)
  const handleSendResponse = async (response: string, ticketId: string) => {
    setSendingResponse(true);
    try {
      // Update ticket with response
      await updateDoc(doc(db, "tickets", ticketId), {
        responsesSent: [
          {
            response: response,
            sentAt: new Date().toISOString(),
            sentBy: "AI Assistant",
          },
        ],
        status: "in-progress",
        updatedAt: Timestamp.now(),
      });

      // Clear custom response
      setCustomResponse("");

      // Show success message
      alert("Response sent successfully!");
    } catch (error) {
      console.error("Error sending response:", error);
      alert("Error sending response");
    } finally {
      setSendingResponse(false);
    }
  };

  // Create demo tickets function
  const createDemoTickets = async () => {
    const demoTickets = [
      {
        customer: "Sarah Johnson",
        subject: "Urgent: Payment charged twice!",
        message:
          "I was charged $99 twice for my subscription! This is completely unacceptable. I need an immediate refund for the duplicate charge. My bank account is now overdrawn because of this error!",
        sentiment: "negative",
        priority: "high",
        category: "billing",
      },
      {
        customer: "Mike Chen",
        subject: "Feature request - Slack integration",
        message:
          "Your product is fantastic! Would love to see Slack integration so our team can get notifications directly. This would really improve our workflow.",
        sentiment: "positive",
        priority: "low",
        category: "feature request",
      },
      {
        customer: "Emma Wilson",
        subject: "Can't login after password reset",
        message:
          "I reset my password yesterday but now I can't login with the new password. It keeps saying invalid credentials. I've tried multiple times and cleared my browser cache.",
        sentiment: "negative",
        priority: "high",
        category: "technical",
      },
      {
        customer: "David Brown",
        subject: "Thank you for excellent support!",
        message:
          "Just wanted to say thanks to your support team, especially Alex who helped me yesterday. Problem solved in 5 minutes. Best customer service I've experienced!",
        sentiment: "positive",
        priority: "low",
        category: "feedback",
      },
      {
        customer: "Lisa Anderson",
        subject: "API rate limit questions",
        message:
          "We're hitting rate limits on the API. Our plan says 10,000 requests per hour but we're getting blocked at around 5,000. Can you please check our account?",
        sentiment: "neutral",
        priority: "medium",
        category: "technical",
      },
    ];

    setCreatingDemo(true);

    try {
      for (const ticketData of demoTickets) {
        // First analyze with AI
        const analysisResponse = await fetch("/api/analyze-ticket", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ticket: ticketData.message,
            customerId: ticketData.customer,
            subject: ticketData.subject,
          }),
        });

        const analysis = await analysisResponse.json();

        // Then save to Firebase with AI analysis
        await addDoc(collection(db, "tickets"), {
          ...ticketData,
          status: "new",
          suggestedResponse:
            analysis.suggestedResponse || analysis.analysis || "",
          aiAnalysis: analysis,
          createdAt: serverTimestamp(),
          timestamp: new Date().toISOString(),
          id: `T-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        });

        // Wait a bit between tickets to show real-time updates
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      alert(
        "Demo tickets created successfully! Watch them appear in real-time."
      );
    } catch (error) {
      console.error("Error creating demo tickets:", error);
      alert(
        "Error creating demo tickets. Make sure your n8n webhook is active."
      );
    } finally {
      setCreatingDemo(false);
    }
  };

  // Export to CSV function
  const exportToCSV = () => {
    const headers = [
      "ID",
      "Customer",
      "Subject",
      "Status",
      "Priority",
      "Sentiment",
      "Category",
      "Created At",
    ];
    const rows = tickets.map((ticket) => [
      ticket.id.slice(-6),
      ticket.customer,
      ticket.subject,
      ticket.status,
      ticket.priority,
      ticket.sentiment,
      ticket.category || "N/A",
      ticket.timestamp,
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `support-tickets-${new Date().toISOString().split("T")[0]}.csv`
    );
    link.style.visibility = "hidden";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case "positive":
        return "bg-green-500";
      case "negative":
        return "bg-red-500";
      default:
        return "bg-yellow-500";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400";
      default:
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "new":
        return <Inbox className="h-4 w-4" />;
      case "in-progress":
        return <Clock className="h-4 w-4" />;
      default:
        return <CheckCircle className="h-4 w-4" />;
    }
  };

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

      if (diffInHours < 1) {
        return `${Math.floor(diffInHours * 60)} minutes ago`;
      } else if (diffInHours < 24) {
        return `${Math.floor(diffInHours)} hours ago`;
      } else {
        return `${Math.floor(diffInHours / 24)} days ago`;
      }
    } catch {
      return timestamp;
    }
  };

  // Get tickets to display (search results or all tickets)
  const displayTickets = searchResults || tickets;

  return (
    <div className="min-h-screen bg-background">
      <div className="flex h-screen">
        {/* Sidebar */}
        <div className="w-64 bg-sidebar border-r border-sidebar-border">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-bold text-sidebar-foreground">
                Support Hub
              </h1>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleTheme}
                className="h-8 w-8 p-0"
              >
                {theme === "dark" ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </Button>
            </div>
            <Button
              className="w-full mt-4"
              onClick={() => setShowNewTicket(true)}
            >
              + New Ticket
            </Button>
            <Button
              className="w-full mt-2"
              variant="outline"
              onClick={createDemoTickets}
              disabled={creatingDemo}
            >
              {creatingDemo
                ? "Creating Demo Data..."
                : "🎮 Create Demo Tickets"}
            </Button>
          </div>

          <nav className="px-4 space-y-2">
            <Button
              variant={activeFilter === "all" ? "default" : "ghost"}
              className={`w-full justify-start ${
                activeFilter === "all"
                  ? ""
                  : "text-sidebar-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent"
              }`}
              onClick={() => setActiveFilter("all")}
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              All Tickets
              <Badge variant="secondary" className="ml-auto">
                {tickets.length}
              </Badge>
            </Button>
            <Button
              variant={activeFilter === "new" ? "default" : "ghost"}
              className={`w-full justify-start ${
                activeFilter === "new"
                  ? ""
                  : "text-sidebar-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent"
              }`}
              onClick={() => setActiveFilter("new")}
            >
              <Inbox className="mr-2 h-4 w-4" />
              New
              <Badge variant="secondary" className="ml-auto">
                {tickets.filter((t) => t.status === "new").length}
              </Badge>
            </Button>
            <Button
              variant={activeFilter === "in-progress" ? "default" : "ghost"}
              className={`w-full justify-start ${
                activeFilter === "in-progress"
                  ? ""
                  : "text-sidebar-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent"
              }`}
              onClick={() => setActiveFilter("in-progress")}
            >
              <Clock className="mr-2 h-4 w-4" />
              In Progress
              <Badge variant="secondary" className="ml-auto">
                {tickets.filter((t) => t.status === "in-progress").length}
              </Badge>
            </Button>
            <Button
              variant={activeFilter === "resolved" ? "default" : "ghost"}
              className={`w-full justify-start ${
                activeFilter === "resolved"
                  ? ""
                  : "text-sidebar-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent"
              }`}
              onClick={() => setActiveFilter("resolved")}
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Resolved
              <Badge variant="secondary" className="ml-auto">
                {tickets.filter((t) => t.status === "resolved").length}
              </Badge>
            </Button>
            <Separator className="my-4" />
            <Button
              variant="ghost"
              className="w-full justify-start text-sidebar-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent"
              onClick={() => (window.location.href = "/analytics")}
            >
              <BarChart3 className="mr-2 h-4 w-4" />
              Analytics
            </Button>
          </nav>

          {/* Refresh indicator */}
          <div className="absolute bottom-4 left-4 right-4">
            <div className="flex items-center justify-center text-xs text-gray-500">
              <RefreshCw className="h-3 w-3 mr-1" />
              Live updates enabled
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex">
          {/* Ticket List */}
          <div className="w-96 border-r border-border">
            <div className="p-4 border-b border-border">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-foreground">
                  {isSearching
                    ? `Search Results (${searchResults?.length})`
                    : loading
                    ? "Loading tickets..."
                    : "Tickets"}
                </h2>
                <div className="flex items-center gap-2">
                  {isSearching && (
                    <Button size="sm" variant="ghost" onClick={clearSearch}>
                      Clear search
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={exportToCSV}
                    disabled={tickets.length === 0}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <SearchBar onResults={handleSearchResults} />
            </div>

            <ScrollArea className="h-[calc(100vh-73px)]">
              <div className="p-4 space-y-3">
                {displayTickets.map((ticket) => (
                  <Card
                    key={ticket.id}
                    className={`cursor-pointer transition-colors hover:bg-accent/50 ${
                      selectedTicket?.id === ticket.id
                        ? "ring-2 ring-primary"
                        : ""
                    }`}
                    onClick={() => setSelectedTicket(ticket)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(ticket.status)}
                          <span className="text-sm font-medium text-card-foreground">
                            #{ticket.id.slice(-6)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div
                            className={`w-2 h-2 rounded-full ${getSentimentColor(
                              ticket.sentiment
                            )}`}
                          />
                          <Badge
                            variant="outline"
                            className={getPriorityColor(ticket.priority)}
                          >
                            {ticket.priority}
                          </Badge>
                        </div>
                      </div>

                      <h3 className="font-medium text-sm mb-1 line-clamp-1 text-card-foreground">
                        {ticket.subject}
                      </h3>

                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <User className="h-3 w-3" />
                        <span>{ticket.customer}</span>
                        <Calendar className="h-3 w-3 ml-auto" />
                        <span>{formatTimestamp(ticket.timestamp)}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {displayTickets.length === 0 && !loading && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Inbox className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>
                      {isSearching
                        ? "No tickets found matching your search"
                        : "No tickets found"}
                    </p>
                    <p className="text-sm mt-2">
                      {isSearching
                        ? "Try a different search term"
                        : "Create a new ticket to get started"}
                    </p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Ticket Details */}
          {selectedTicket ? (
            <div className="flex-1 flex flex-col">
              <div className="p-6 border-b border-border">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h1 className="text-2xl font-bold text-foreground">
                      {selectedTicket.subject}
                    </h1>
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        {selectedTicket.customer}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {formatTimestamp(selectedTicket.timestamp)}
                      </span>
                      <Badge
                        variant="outline"
                        className={getPriorityColor(selectedTicket.priority)}
                      >
                        {selectedTicket.priority} priority
                      </Badge>
                      {selectedTicket.category && (
                        <Badge variant="outline">
                          {selectedTicket.category}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div
                      className={`w-3 h-3 rounded-full ${getSentimentColor(
                        selectedTicket.sentiment
                      )}`}
                    />
                    <span className="text-sm capitalize text-foreground">
                      {selectedTicket.sentiment} sentiment
                    </span>
                  </div>
                </div>

                {/* Status Update Buttons */}
                <div className="flex gap-2 mt-4">
                  <Button
                    size="sm"
                    variant={
                      selectedTicket.status === "new" ? "default" : "outline"
                    }
                    onClick={() => updateTicketStatus(selectedTicket.id, "new")}
                  >
                    New
                  </Button>
                  <Button
                    size="sm"
                    variant={
                      selectedTicket.status === "in-progress"
                        ? "default"
                        : "outline"
                    }
                    onClick={() =>
                      updateTicketStatus(selectedTicket.id, "in-progress")
                    }
                  >
                    In Progress
                  </Button>
                  <Button
                    size="sm"
                    variant={
                      selectedTicket.status === "resolved"
                        ? "default"
                        : "outline"
                    }
                    onClick={() =>
                      updateTicketStatus(selectedTicket.id, "resolved")
                    }
                  >
                    Resolved
                  </Button>
                </div>
              </div>

              <div className="flex-1 p-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
                  {/* Message */}
                  <div className="lg:col-span-2">
                    <Card className="h-full">
                      <CardHeader>
                        <CardTitle className="text-lg">
                          Customer Message
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">
                          {selectedTicket.message}
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* AI Suggestions */}
                  <div>
                    <Card className="h-full">
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Sparkles className="h-5 w-5 text-accent" />
                          AI Suggested Response
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {selectedTicket.suggestedResponse ? (
                          <>
                            <div className="p-3 bg-accent/10 rounded-lg border border-accent/20">
                              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                                {selectedTicket.suggestedResponse}
                              </p>
                            </div>

                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                className="flex-1"
                                onClick={() => {
                                  navigator.clipboard.writeText(
                                    selectedTicket.suggestedResponse || ""
                                  );
                                  alert("Copied to clipboard!");
                                }}
                              >
                                <Copy className="h-4 w-4 mr-2" />
                                Copy
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex-1 bg-transparent"
                                onClick={() =>
                                  handleSendResponse(
                                    selectedTicket.suggestedResponse || "",
                                    selectedTicket.id
                                  )
                                }
                                disabled={sendingResponse}
                              >
                                <Send className="h-4 w-4 mr-2" />
                                Send
                              </Button>
                            </div>
                          </>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            No AI suggestion available for this ticket.
                          </p>
                        )}

                        <Separator />

                        <div>
                          <label className="text-sm font-medium mb-2 block">
                            Custom Response
                          </label>
                          <Textarea
                            placeholder="Type your response here..."
                            className="min-h-[120px] resize-none"
                            value={customResponse}
                            onChange={(e) => setCustomResponse(e.target.value)}
                          />
                          <Button
                            className="w-full mt-3"
                            disabled={!customResponse || sendingResponse}
                            onClick={() =>
                              handleSendResponse(
                                customResponse,
                                selectedTicket.id
                              )
                            }
                          >
                            <Send className="h-4 w-4 mr-2" />
                            {sendingResponse ? "Sending..." : "Send Response"}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Select a ticket to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New Ticket Dialog */}
      <Dialog open={showNewTicket} onOpenChange={setShowNewTicket}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create New Support Ticket</DialogTitle>
          </DialogHeader>
          <TicketForm
            onSuccess={() => {
              setShowNewTicket(false);
              // Tickets will auto-refresh due to real-time listener
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
