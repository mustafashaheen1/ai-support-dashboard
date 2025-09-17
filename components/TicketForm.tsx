"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { AlertCircle, CheckCircle, Sparkles } from "lucide-react";
// Add Firebase imports
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface TicketFormProps {
  onSuccess?: () => void;
}

export default function TicketForm({ onSuccess }: TicketFormProps) {
  const [customerName, setCustomerName] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");

  const handleSubmit = async () => {
    setLoading(true);
    setAnalysis(null);
    setSaveStatus("idle");

    try {
      // First, analyze with AI
      const analysisResponse = await fetch("/api/analyze-ticket", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ticket: message,
          customerId: customerName,
          subject: subject,
        }),
      });

      const data = await analysisResponse.json();
      console.log("AI Analysis:", data);

      setAnalysis(data);
      setSaveStatus("saving");

      // Parse the analysis to extract sentiment and category
      let sentiment = "neutral";
      let category = "general";
      let suggestedResponse = data.analysis || data.rawAnalysis || "";

      // If your n8n workflow returns parsed data
      if (data.sentiment) {
        sentiment = data.sentiment.toLowerCase();
      }
      if (data.category) {
        category = data.category;
      }
      if (data.suggestedResponse) {
        suggestedResponse = data.suggestedResponse;
      }

      // Determine priority based on sentiment and keywords
      let priority = "medium";
      if (
        sentiment === "negative" ||
        message.toLowerCase().includes("urgent") ||
        message.toLowerCase().includes("asap")
      ) {
        priority = "high";
      } else if (sentiment === "positive") {
        priority = "low";
      }

      // Save to Firebase
      const ticketData = {
        // Customer info
        customer: customerName,
        customerId: customerName.toLowerCase().replace(/\s+/g, "-"), // Simple ID

        // Ticket details
        subject: subject,
        message: message,
        status: "new",
        priority: priority,

        // AI Analysis
        sentiment: sentiment,
        category: category,
        suggestedResponse: suggestedResponse,
        aiAnalysis: data,

        // Timestamps
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        timestamp: new Date().toISOString(), // For display

        // Metadata
        id: `T-${Date.now()}`, // Temporary ID until Firebase generates one
        channel: "web",
        assignedTo: null,
        resolved: false,
        resolvedAt: null,
        responsesSent: [],
      };

      const docRef = await addDoc(collection(db, "tickets"), ticketData);
      console.log("Ticket saved with ID:", docRef.id);

      // Update the ticket with its Firebase ID
      // We'll use this later for real-time updates
      setSaveStatus("saved");

      // Clear form after a delay
      setTimeout(() => {
        setCustomerName("");
        setSubject("");
        setMessage("");
        setAnalysis(null);
        setSaveStatus("idle");
        if (onSuccess) {
          onSuccess();
        }
      }, 3000);
    } catch (error) {
      console.error("Error:", error);
      setSaveStatus("error");
      alert("Error submitting ticket");
    } finally {
      setLoading(false);
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment?.toLowerCase()) {
      case "positive":
        return "text-green-600 bg-green-50 border-green-200 dark:bg-green-900/20 dark:text-green-400";
      case "negative":
        return "text-red-600 bg-red-50 border-red-200 dark:bg-red-900/20 dark:text-red-400";
      default:
        return "text-yellow-600 bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400";
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="customer">Customer Name</Label>
        <Input
          id="customer"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          placeholder="Enter customer name..."
          className="mt-1"
          disabled={loading}
        />
      </div>

      <div>
        <Label htmlFor="subject">Subject</Label>
        <Input
          id="subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Brief description of the issue..."
          className="mt-1"
          disabled={loading}
        />
      </div>

      <div>
        <Label htmlFor="message">Message</Label>
        <Textarea
          id="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Describe the issue in detail..."
          className="mt-1"
          rows={4}
          disabled={loading}
        />
      </div>

      <Button
        onClick={handleSubmit}
        disabled={loading || !customerName || !subject || !message}
        className="w-full"
      >
        {loading ? (
          <>
            <Sparkles className="mr-2 h-4 w-4 animate-spin" />
            Analyzing with AI...
          </>
        ) : (
          "Submit Ticket"
        )}
      </Button>

      {/* Show Analysis Results */}
      {analysis && (
        <Card className="p-4 border-2 animate-in fade-in slide-in-from-bottom-3">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <h4 className="font-semibold">AI Analysis Complete</h4>
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm">
              <div
                className={`p-2 rounded border ${getSentimentColor(
                  analysis.sentiment || "neutral"
                )}`}
              >
                <span className="font-medium">Sentiment:</span>{" "}
                {analysis.sentiment || "Analyzing..."}
              </div>
              <div className="p-2 rounded border bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400">
                <span className="font-medium">Category:</span>{" "}
                {analysis.category || "Processing..."}
              </div>
            </div>

            {(analysis.suggestedResponse || analysis.analysis) && (
              <div className="mt-3">
                <Label className="text-sm font-medium">
                  AI Suggested Response:
                </Label>
                <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm">
                  <pre className="whitespace-pre-wrap font-sans">
                    {analysis.suggestedResponse ||
                      analysis.analysis ||
                      analysis.rawAnalysis}
                  </pre>
                </div>
              </div>
            )}

            {/* Save Status */}
            <div className="text-sm text-center">
              {saveStatus === "saving" && (
                <span className="text-blue-600 dark:text-blue-400">
                  Saving ticket to database...
                </span>
              )}
              {saveStatus === "saved" && (
                <span className="text-green-600 dark:text-green-400">
                  ✓ Ticket saved successfully!
                </span>
              )}
              {saveStatus === "error" && (
                <span className="text-red-600 dark:text-red-400">
                  Error saving ticket
                </span>
              )}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
