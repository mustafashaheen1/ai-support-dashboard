"use client";

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
} from "firebase/firestore";
import { db } from "@/lib/firebase";

// Add these type definitions at the top of Dashboard.tsx

interface AIAnalysis {
  sentiment?: string;
  category?: string;
  suggestedResponse?: string;
  analysis?: string;
  rawAnalysis?: string;
}

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
  const [activeFilter, setActiveFilter] = useState<
    "all" | "new" | "in-progress" | "resolved"
  >("all");
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [loading, setLoading] = useState(true);
  const [customResponse, setCustomResponse] = useState("");
  const [sendingResponse, setSendingResponse] = useState(false);

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

  return (
    <div className="dark min-h-screen bg-background">
      <div className="flex h-screen">
        {/* Sidebar */}
        <div className="w-64 bg-sidebar border-r border-sidebar-border">
          <div className="p-6">
            <h1 className="text-xl font-bold text-sidebar-foreground">
              Support Hub
            </h1>
            <Button
              className="w-full mt-4"
              onClick={() => setShowNewTicket(true)}
            >
              + New Ticket
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
              <h2 className="text-lg font-semibold text-foreground">
                {loading ? "Loading tickets..." : "Tickets"}
              </h2>
            </div>

            <ScrollArea className="h-[calc(100vh-73px)]">
              <div className="p-4 space-y-3">
                {tickets.map((ticket) => (
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

                {tickets.length === 0 && !loading && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Inbox className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No tickets found</p>
                    <p className="text-sm mt-2">
                      Create a new ticket to get started
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
